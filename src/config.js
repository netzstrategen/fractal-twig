'use strict';

const callsites = require('callsites');
const deepmerge = require('deepmerge');
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

  /**
   * Merges the source element by the variant name into the destination array.
   */
  merge(destination = {}, source = {}, options) {
    const defaults = {
      customMerge: (key) => {
        if (key !== 'variants') {
          return;
        }
        return (destination, source) => {
          source.forEach(sourceVariant => {
            destination.forEach((destinationVariant, index) => {
              if (destinationVariant.name === sourceVariant.name) {
                destination[index] = deepmerge(destination[index], sourceVariant);
              }
            });
          });
          return destination;
        }
      },
    };
    options = options || defaults;
    return deepmerge(destination, source, options)
  }

}

module.exports = ComponentConfig;
