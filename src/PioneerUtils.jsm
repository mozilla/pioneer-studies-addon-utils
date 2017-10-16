"use strict";

const { classes: Cc, interfaces: Ci, utils: Cu } = Components;
Cu.import("resource://gre/modules/XPCOMUtils.jsm");

XPCOMUtils.defineLazyModuleGetter(this, "AddonManager", "resource://gre/modules/AddonManager.jsm");
XPCOMUtils.defineLazyModuleGetter(this, "Services", "resource://gre/modules/Services.jsm");

const { TelemetryController } = Cu.import("resource://gre/modules/TelemetryController.jsm", null);
const { generateUUID } = Cc["@mozilla.org/uuid-generator;1"].getService(Ci.nsIUUIDGenerator);

import { setCrypto as joseSetCrypto, Jose, JoseJWE } from "jose-jwe-jws/dist/jose-commonjs.js";
import sampling from "./sampling.js";

// The public keys used for encryption
const PUBLIC_KEYS = require("./public_keys.json");

const PIONEER_ID_PREF = "extensions.pioneer.cachedClientID";

// Make crypto available and make jose use it.
Cu.importGlobalProperties(["crypto"]);
joseSetCrypto(crypto);

/**
 * @typedef {Object} PioneerUtilsConfig
 * @property {String} studyName
 *   Unique name of the study.
 *
 * @property {Number} schemaVersion
 *   Version of the schema to use for encrypted data. Should be an
 *   integer.
 *
 * @property {String?} pioneerEnv
 *   Optional. Which telemetry environment to send data to. Should be
 *   either "prod" or "stage". Defaults to "prod".
 *
 * @property {Object} branches
 *   Array of branches objects. If useful, you may store extra data on
 *   each branch. It will be included when choosing a branch.
 *
 *   Example:
 *     [
 *       { name: "control", weight: 1 },
 *       { name: "variation1", weight: 2 },
 *       { name: "variation2", weight: 2 },
 *     ]
 *
 * @property {String} branches[].name
 *
 * @property {Number} branches[].weight
 *   Optional, defaults to 1.
 */

class PioneerUtils {
  constructor(config) {
    this.config = config;
    this.encrypter = null;
  }

  getPublicKey() {
    const env = this.config.pioneerEnv || "prod";
    return PUBLIC_KEYS[env];
  }

  setupEncrypter() {
    if (this.encrypter === null) {
      const pk = this.getPublicKey();
      const rsa_key = Jose.Utils.importRsaPublicKey(pk.key, "RSA-OAEP");
      const cryptographer = new Jose.WebCryptographer();
      this.encrypter = new JoseJWE.Encrypter(cryptographer, rsa_key);
    }
  }

  getPioneerId() {
    let id = Services.prefs.getCharPref(PIONEER_ID_PREF, "");

    if (!id) {
      // generateUUID adds leading and trailing "{" and "}". strip them off.
      id = generateUUID().toString().slice(1, -1);
      Services.prefs.setCharPref(PIONEER_ID_PREF, id);
    }

    return id;
  }

  /**
   * Checks to see if the user has opted in to Pioneer. This is
   * done by checking that the opt-in addon is installed and active.
   *
   * @returns {Boolean}
   *   A boolean to indicate opt-in status.
   */
  async isUserOptedIn() {
    const addon = await AddonManager.getAddonByID("pioneer-opt-in@mozilla.org");
    return addon !== null && addon.isActive;
  }

  async encryptData(data) {
    this.setupEncrypter();
    return await this.encrypter.encrypt(data);
  }

  /**
   * Encrypts the given data and submits a properly formatted
   * Pioneer ping to Telemetry.
   *
   * @param {Object} data
   *   A object containing data to be encrypted and submitted.
   *
   * @returns {String}
   *   The ID of the ping that was submitted
   */
  async submitEncryptedPing(data) {
    const pk = this.getPublicKey();

    const payload = {
      encryptedData: await this.encryptData(JSON.stringify(data)),
      encryptionKeyId: pk.id,
      pioneerId: this.getPioneerId(),
      studyName: this.config.studyName,
      studyVersion: this.config.schemaVersion,
    };

    const telOptions = {
      addClientId: true,
      addEnvironment: true,
    };

    return TelemetryController.submitExternalPing("pioneer-study", payload, telOptions);
  }

  /**
   * Chooses a branch from among `config.branches`. This is a
   * deterministic function of `config.studyName` and the user's
   * pioneerId. As long as neither of those change, it will always
   * return the same value.
   *
   * @returns {Object}
   *   An object from `config.branches`, chosen based on a `weight` key.
   */
  async chooseBranch() {
    const hashKey = `${this.config.studyName}/${await this.getPioneerId()}`;
    return sampling.chooseWeighted(this.config.branches, hashKey);
  }
}

this.PioneerUtils = PioneerUtils;
this.EXPORTED_SYMBOLS = ["PioneerUtils"];
