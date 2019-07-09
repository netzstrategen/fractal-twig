const cloner = require('cloner');

/**
 * Deep merges two objects by a given key.
 *
 * The content of the left hand object would be overridden for duplicate keys.
 *
 * @param object object1
 * @param object object2
 * @param string keyName
 *
 * @returns object
 */
const merge = function (object1, object2, keyName) {
  // If a key name is given, deep merge the objects based on it's key.
  if (typeof keyName === 'string') {
    for (const [index, currentElement] of Object.entries(object1)) {
      // Get the object based on the key name of the secondary object.
      const found = object2.find((element) => {
        return element[keyName] === currentElement[keyName];
      });
      if (!found) {
        continue;
      }
      // Override the object in the primary object by the values of the found one.
      object1[index] = cloner.deep.merge(found, currentElement);
    }
  }
  // Simple deep merge otherwise
  else {
    object1 = cloner.deep.merge(object2, object1);
  }
  return object1;
};

module.exports = merge;
