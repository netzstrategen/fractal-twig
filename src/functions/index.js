'use strict';

const queryString = require('query-string');
const Attributes = require('../attributes');

module.exports = function (fractal) {

    return {
        path(str, obj) {
            return '#' + str + queryString.stringify(obj);
        },
        url(str, obj) {
            return 'url://' + str + queryString.stringify(obj);
        },
        link(text, url = '', attributes = {}) {
            let tag = url ? 'a' : 'span';
            if (url) {
                attributes['href'] = url;
            }
            let attr = new Attributes(attributes);
            return `<${tag}${attr}>${text}</${tag}>`;
        }
    }

};
