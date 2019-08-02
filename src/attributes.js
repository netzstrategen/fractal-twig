'use strict';

const _ = require('lodash');

/**
 * Attributes object resembling Drupal's Attribute object behavior.
 *
 * This minimalistic port is essentially just a key/value store for all HTML
 * attributes on an element. All attributes are assumed to be single values,
 * except the 'class' attribute, which is a list of strings that can be modified
 * with the addClass() and removeClass() methods.
 *
 * Drupal does not (yet) have the handy merge() method implemented here.
 *
 * @see https://api.drupal.org/api/drupal/core%21lib%21Drupal%21Core%21Template%21Attribute.php/class/Attribute
 */
class Attributes {

    /**
     * Constructs a new Attributes instance.
     *
     * @param object|Attributes attributes
     *   (optional) An initial set of attributes; either an anonymous object (as
     *   parsed from YAML) or an Attributes instance (as inherited from the
     *   parent template context).
     */
    constructor(attributes) {
        this.classes = [];
        this.storage = {};

        if (attributes !== undefined) {
            this.merge(attributes);
        }
    }

    /**
     * Adds one or more class names to the list of class names.
     *
     * @param ...string classnames
     *   One or more strings to add as class names. Multiple class names should
     *   be passed as separate arguments.
     *
     * @return self
     */
    addClass(...classnames) {
        // .merge() passes an array as single argument.
        if (typeof classnames[0] !== 'string') {
            classnames = classnames[0];
        }
        this.classes = _.concat(this.classes, classnames);
        return this;
    };

    /**
     * Removes one or more class names from the list of class names.
     *
     * @param ...string classnames
     *   One or more strings to remove from class names. Multiple class names
     *   must be passed as separate arguments.
     *
     * @return self
     */
    removeClass(...classnames) {
        _.pullAll(this.classes, classnames);
        return this;
    };

    /**
     * Returns whether the class attribute contains a given CSS class name.
     *
     * @param string $classname
     *   The CSS class name to check for.
     *
     * @return bool
     *   TRUE if the class name exists, FALSE otherwise.
     */
    hasClass(classname) {
        return this.classes.indexOf(classname) > -1;
    };

    /**
     * Sets an attribute to a given value.
     *
     * @param string name
     *   The attribute name to set.
     * @param string|int value
     *   The value to set.
     *
     * @return self
     */
    setAttribute(name, value) {
        this.storage[name] = value;
        return this;
    };

    /**
     * Merges a given set of attributes into this Attributes instance.
     *
     * @param object|Attributes attributes
     *   An anonymous object with key/value pairs to set as attributes, or an
     *   Attributes class instance.
     *
     * @return self
     */
    merge(attributes) {
        let self = this;
        if (attributes.constructor.name === 'Attributes') {
            this.classes = _.concat(this.classes, attributes.classes);
            _.merge(this.storage, attributes.storage);
        }
        else {
            _.forEach(attributes, function (value, name) {
                // The interactive web server picks up the internal
                // _keys property in context data that is regenerated
                // by adapter().render().setKeys().
                // (The build/export does not expose this gem.)
                if (name === '_keys') {
                    return;
                }
                if (name === 'class') {
                    if (typeof value === 'string') {
                        value = value.split(' ');
                    }
                    self.addClass(value);
                }
                else {
                    self.setAttribute(name, value);
                }
            });
        }
        return this;
    };

    /**
     * Recursively converts variables named '*attributes' into Attributes objects.
     *
     * @param object context
     *   The context variables to process.
     */
    static convert(context) {
        _.forEach(context, (value, name) => {
            if (typeof name === 'string' && name.indexOf('attributes') > -1) {
                context[name] = this.proxy(new Attributes(value));
            }
            else if (_.isObject(value)) {
                this.convert(value);
            }
        });
    };

  /**
   * Serializes all attributes into an HTML element attributes string.
   *
   * The resulting string MUST start with a space, unless there are no attributes
   * to serialize.
   *
   * @return string
   */
  toString() {
      let string = '';
      if (this.classes.length) {
          string += ' class="' + _.join(_.uniq(this.classes), ' ') + '"';
      }
      _.forEach(this.storage, function (value, name) {
          if (value !== null) {
              string += ` ${name}="${value}"`;
          }
          else {
              string += ` ${name}`;
          }
      });
      return string;
  };

  /**
   * Proxies direct attribute property access.
   *
   * @param attributes
   * @returns {any|undefined}
   */
  static proxy(attributes) {
      return new Proxy(attributes, {
          get (target, name, receiver) {
              if (typeof name === 'string' && !Reflect.has(target, name)) {
                  if (name.indexOf('get') !== -1) {
                      // Property names look like this:`isSrc`, `getSrc` so we need
                      // to strip the get prefix to obtain the correct attribute key.
                      name = name.replace('get', '').toLowerCase();
                      // Re-route into storage unless class property is requested.
                      if (name === 'class') {
                          name = 'classes';
                      }
                      else {
                          target = target.storage;
                      }
                  }
                  // Do not forward other property accesses and tests (like isset()).
                  else {
                      return undefined;
                  }
              }
              return Reflect.get(target, name, receiver);
          }
      });
  }

}

module.exports = Attributes;
