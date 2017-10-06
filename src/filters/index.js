'use strict';

module.exports = function (fractal) {
    return {
        t(str) {
            return str;
        },
        field_value(str) {
            return str;
        },
        without(element, exclude) {
            for (var i = 0; i < exclude.length; i++) {
                if (element.hasOwnProperty(exclude[i])) {
                    delete element[exclude[i]];
                }
            }
            return element;
        },
        path: require('./path.js')(fractal),
    }
};
