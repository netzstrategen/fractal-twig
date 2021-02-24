'use strict';
const _ = require('lodash');

module.exports = function (fractal) {
    const translate = function (str) {
        const l18n = fractal.components.engine()._config.l18n || null;
        const parser = l18n.parser || null;
        const textdomain = l18n.textdomain || '';
        if (parser && parser.translations.hasOwnProperty(textdomain)) {
            const translation = parser.translations[textdomain][str];
            if (translation !== undefined) {
                str = translation.msgstr[0];
            }
        }
        return str;
    }
    return {
        trans(str) {
            return translate(str);
        },
        t(str) {
            return translate(str);
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
