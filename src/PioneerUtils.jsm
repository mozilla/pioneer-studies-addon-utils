"use strict";

const { utils: Cu } = Components;
Cu.import("resource://gre/modules/XPCOMUtils.jsm");

const { TelemetryController } = Cu.import("resource://gre/modules/TelemetryController.jsm", null);

// TODO: fix import path
XPCOMUtils.defineLazyModuleGetter(this, "Jose", "resource://pioneer-study-nothing/Jose.jsm");
XPCOMUtils.defineLazyModuleGetter(this, "JoseJWE", "resource://pioneer-study-nothing/Jose.jsm");

// The encryption key ID from the server
const ENCRYPTION_KEY_ID = "pioneer-20170905";

// The public key used for encryption
const PK = {
  "e": "AQAB",
  "kty": "RSA",
  "n": "3nI-DQ7NoUZCvT348Vi4JfGC1h6R3Qf_yXR0dKM5DmwsuQMxguce6sZ28GWQHJjgbdcs8nTuNQihyVtr9vLsoKUVSmPs_a3QEGXEhTpuTtm7cCb_7HyAlwGtysn2AsdElG8HsDFWlZmiDaHTrTmdLnuk-Z3GRg4nnA4xs4vvUuh0fCVIKoSMFyt3Tkc6IBWJ9X3XrDEbSPrghXV7Cu8LMK3Y4avy6rjEGjWXL-WqIPhiYJcBiFnCcqUCMPvdW7Fs9B36asc_2EQAM5d7BAiBwMjoosSyU6b4JGpI530c3xhqLbX00q1ePCG732cIwp0-bGWV_q0FpQX2M9cNv2Ax4Q"
};

class PioneerUtils {
  constructor(config) {
    this.config = config;
    this.encrypter = null;
  }

  setupEncrypter() {
    if (this.encrypter === null) {
      const rsa_key = Jose.Utils.importRsaPublicKey(PK, "RSA-OAEP");
      const cryptographer = new Jose.WebCryptographer();
      this.encrypter = new JoseJWE.Encrypter(cryptographer, rsa_key);
    }
  }

  async encryptData() {
    this.setupEncrypter();
    return await this.encrypter.encrypt(data);
  }

  async sendEncryptedPing(data) {
    const payload = {
      encryptedData: await this.encryptData(JSON.stringify(data)),
      encryptionKeyId: ENCRYPTION_KEY_ID,
      pioneerId: this.config.id,
      studyName: this.config.studyName,
      studyVersion: this.config.studyVersion,
    };

    const telOptions = {addClientId: true, addEnvironment: true};

    return TelemetryController.submitExternalPing("pioneer-study", payload, telOptions);
  }
}

this.EXPORTED_SYMBOLS = ['PioneerUtils'];
