'use strict';

const callsites = require('callsites');
const fs = require('fs');
const yaml = require('js-yaml');

/**
 * Export contents of sibling `*.config.yml` component config file.
 *
 * Fractal YAML contains 'real' configuration shared between pattern library and application.
 * Use `*.config.js` to populate Fractal components with dummy data which isn't exposed to app.
 *
 * @usage:
    const ComponentConfig = require('@netzstrategen/twig-drupal-fractal-adapter/src/config');
    let config = new ComponentConfig().getConfig(); // Assign contents of *.config.yml to variable.
 */
class ComponentConfig {

  /**
   * Returns the filepath of the caller.
   * Simply replace `.js` with `.yml` to get Fractal YML config filepath.
   *
   * @see https://github.com/sindresorhus/callsites
   */
  getFilePath() {
    let filePath = callsites()[2].getFileName(); // [0] and [1] return global fractal.config.js.
    return filePath.replace('.js', '.yml');
  }

  /**
   * Returns the parsed yml config.
   */
  getConfig() {
    try {
      let contents = fs.readFileSync(this.getFilePath(), 'utf8');
      return yaml.load(contents);
    }
    catch (err) {
      console.log(err.stack || String(err));
    }
  }
}

module.exports = ComponentConfig;
