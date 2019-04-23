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
      // console.log(util.inspect(data, false, 10, true));
    }
    catch (err) {
      console.log(err.stack || String(err));
    }
  }
}

module.exports = ComponentConfig;
