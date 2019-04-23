'use strict';

const fs = require('fs');
const glob = require('glob');
const yaml = require('js-yaml');

const fractal = require('../../../../fractal.config');

/**
 * Export contents of sibling `*.config.yml` component config file.
 *
 * Fractal YAML contains 'real' configuration shared between pattern library and application.
 * Use `*.config.js` to populate Fractal components with dummy data which isn't exposed to app.
 *
 * @usage:
    const ComponentConfig = require('@netzstrategen/twig-drupal-fractal-adapter/src/config');
    const componentHandle = require('path').basename(__filename).split('.')[0]; // Pass component name to class.
    let config = new ComponentConfig(componentHandle).getConfig(); // Assign contents of *.config.yml to variable.
 */
class ComponentConfig {

  constructor(componentName) {
    this.componentName = componentName;
    this.componentsPath = fractal.components.get('path');
  }

  getFilePath() {
    return glob.sync(this.componentsPath + '/**/**/' + this.componentName + '.config.yml').toString();
  }

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
