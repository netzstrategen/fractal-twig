'use strict';

const fractal = require('@frctl/fractal');
const _ = require('lodash');
const Path = require('path');
const adapter = require('./../adapter');

module.exports = function(fractal){

    return {
        render(Twig) {
            // @todo Duplicate of class in adapter; move into shared dependency.
            function AttributesObject(initialAttributes) {
                let self = this;
                this.classes = [];
                this.storage = {};

                this.addClass = function (...classnames) {
                    self.classes = _.concat(self.classes, classnames);
                    return self;
                };

                this.removeClass = function (...classnames) {
                    _.pullAll(self.classes, classnames);
                    return self;
                };

                this.setAttribute = function (name, value) {
                    self.storage[name] = value;
                    return self;
                };

                this.merge = function (attributes) {
                    // Matches both this function prototype and the class in the
                    // main adapter.
                    if (attributes.constructor && attributes.constructor.name === 'AttributesObject') {
                        self.classes = _.concat(self.classes, attributes.classes);
                        _.merge(self.storage, attributes.storage);
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
                    return self;
                };

                // Constructor.
                if (initialAttributes !== undefined) {
                    self.merge(initialAttributes);
                }
            }
            AttributesObject.prototype.toString = function () {
                let string = ' class="' + _.join(_.uniq(this.classes), ' ') + '"';
                _.forEach(this.storage, function (value, name) {
                    string += ` ${name}="${value}"`;
                });
                return string;
            };

            return {
                /**
                 * Block logic tokens.
                 *
                 *  Format: {% render "template.twig" with {some: 'values'} %}
                 */
                type: Twig.logic.type.include,
                regex: /^render\s+(ignore missing\s+)?(.+?)\s*(?:with\s+([\S\s]+?))?\s*(only)?$/,
                next: [],
                open: true,

                compile: function (token) {
                    var match = token.match,
                      includeMissing = match[1] !== undefined,
                      expression = match[2].trim(),
                      passedArguments = match[3],
                      only = true;

                    delete token.match;

                    token.only = only;
                    token.includeMissing = includeMissing;

                    token.stack = Twig.expression.compile.apply(this, [
                        {
                            type: Twig.expression.type.expression,
                            value: expression
                        }
                    ]).stack;

                    if (passedArguments !== undefined) {
                        token.withStack = Twig.expression.compile.apply(this, [
                            {
                                type: Twig.expression.type.expression,
                                value: passedArguments.trim()
                            }
                        ]).stack;
                    }

                    return token;
                },

                parse: function (token, context, chain) {
                    let components = fractal.components;

                    let file = Twig.expression.parse.apply(this, [token.stack, context]);
                    let handle = Path.parse(file).name;
                    if (handle.indexOf('@') !== 0) {
                        handle = '@' + handle;
                    }

                    // Resolve filename
                    var innerContext = {},
                      passedArguments,
                      i,
                      template;

                    if (!token.only) {
                        innerContext = Twig.ChildContext(context);
                    }
                    else {
                        const entity = components.find(handle);
                        if (!entity) {
                            throw new Error(`Unable to render '${handle}' - component not found.`);
                        }
                        innerContext = entity.isComponent ? entity.variants().default().context : entity.context;
                    }

                    innerContext.attributes = new AttributesObject(innerContext.attributes);

                    if (token.withStack !== undefined) {
                        passedArguments = Twig.expression.parse.apply(this, [token.withStack, context]);

                        _.forEach(passedArguments, function (value, name) {
                            // It makes no sense to pass variables that are not
                            // supported by the component.
                            if (innerContext[name] === undefined) {
                                return;
                            }
                            if (name === 'attributes') {
                                innerContext.attributes.merge(value);
                            }
                            else {
                                innerContext[name] = value;
                            }
                        });
                    }

                    if (file instanceof Twig.Template) {
                        template = file;
                    }
                    else {
                        template = this.importFile(file);
                    }

                    return {
                        chain: chain,
                        output: template.render(innerContext)
                    };
                }
            }
        },
        trans(Twig) {
            return {
                type: 'trans',
                regex: /^trans/,
                next: ['endtrans'],
                open: true,
                compile: function (token) {
                    return token;
                },
                parse: function (token, context, chain) {
                    return {
                        chain: chain,
                        output: Twig.parse.apply(this, [token.output, context])
                    };
                }
            };
        },
        endtrans(Twig) {
            return {
                type: 'endtrans',
                regex: /^endtrans/,
                next: [ ],
                open: false
            };
        }
    }

};
