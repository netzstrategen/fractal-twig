'use strict';

const fs = require('fs');
const path = require('path');
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
   * Returns the yml config file path by using the parent filename of
   * the global module object.
   *
   * @see https://nodejs.org/api/modules.html#modules_the_module_object
   */
  getFilePath() {
    let pathinfo = path.parse(module.parent.filename);
    return pathinfo.dir + '/' + pathinfo.name + '.yml';
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
