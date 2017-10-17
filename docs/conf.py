#!/usr/bin/env python3
# -*- coding: utf-8 -*-
#
# pioneer-studies-addon-utils documentation build configuration file, created by
# sphinx-quickstart on Fri Oct 13 16:19:57 2017.
#
# This file is execfile()d with the current directory set to its
# containing dir.
#
# Note that not all possible configuration values are present in this
# autogenerated file.

import json


# -- General configuration ------------------------------------------------

# If your documentation needs a minimal Sphinx version, state it here.
#
# needs_sphinx = '1.0'

# Add any Sphinx extension module names here, as strings. They can be
# extensions coming with Sphinx (named 'sphinx.ext.*') or your custom
# ones.
extensions = ['sphinx_js']

# Add any paths that contain templates here, relative to this directory.
templates_path = ['_templates']

# The suffix(es) of source filenames.
# You can specify multiple suffix as a list of string:
#
# source_suffix = ['.rst', '.md']
source_suffix = '.rst'

# The master toctree document.
master_doc = 'index'

with open('../package.json') as package_file:
    package_info = json.load(package_file)

    # General information about the project.
    project = package_info['name'].replace('-', ' ')
    author = package_info['author']
    copyright = '2017, {}'.format(author)

    # The version info for the project you're documenting, acts as
    # replacement for |version| and |release|, also used in various
    # other places throughout the built documents.
    version = package_info['version']
    release = package_info['version']

# List of patterns, relative to source directory, that match files and
# directories to ignore when looking for source files.
# This patterns also effect to html_static_path and html_extra_path
exclude_patterns = ['_build', 'Thumbs.db', '.*']

# The name of the Pygments (syntax highlighting) style to use.
pygments_style = 'sphinx'

primary_domain = 'js'

# -- Options for Sphinx JS ------------------------------------------------
js_source_path = '../src'
jsdoc_config_path = './jsdoc.json'

# -- Options for HTML output ----------------------------------------------

# The theme to use for HTML and HTML Help pages.  See the documentation for
# a list of builtin themes.
#
html_theme = 'sphinx_rtd_theme'

# Theme options are theme-specific and customize the look and feel of a theme
# further.  For a list of options available for each theme, see the
# documentation.
#
# html_theme_options = {}

# Add any paths that contain custom static files (such as style sheets) here,
# relative to this directory. They are copied after the builtin static files,
# so a file named "default.css" will overwrite the builtin "default.css".
html_static_path = []

# Custom sidebar templates, must be a dictionary that maps document names
# to template names.
#
# This is required for the alabaster theme
# refs: http://alabaster.readthedocs.io/en/latest/installation.html#sidebars
html_sidebars = {
    '**': [
        'about.html',
        'navigation.html',
        'relations.html',  # needs 'show_related': True theme option to display
        'searchbox.html',
        'donate.html',
    ]
}
