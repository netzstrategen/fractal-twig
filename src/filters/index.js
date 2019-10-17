'use strict';
const _ = require('lodash');

module.exports = function (fractal) {
    return {
        trans(str) {
            return str;
        },
        t(str) {
            return str;
        },
        field_value(str) {
            return str;
        },
        without(element, exclude_elements) {
            var filtered_element = _.cloneDeep(element);
            exclude_elements.forEach(function (exclude) {
                if (element.hasOwnProperty(exclude)) {
                    delete filtered_element[exclude];
                }
            });
            return filtered_element;
        },
        path: require('./path.js')(fractal),
    }
};
