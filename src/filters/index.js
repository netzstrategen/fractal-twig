'use strict';

module.exports = function (fractal) {
    return {
        t(str) {
            return str;
        },
        field_value(str) {
            return str;
        },
        without(element, exclude_elements) {
            filtered_element = element;
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
