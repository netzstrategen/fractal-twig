'use strict';

const fractal = require('@frctl/fractal');
const _ = require('lodash');
const Path = require('path');
const adapter = require('./../adapter');

module.exports = function(fractal){

    return {
        render(Twig) {
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
                      withContext = match[3],
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

                    if (withContext !== undefined) {
                        token.withStack = Twig.expression.compile.apply(this, [
                            {
                                type: Twig.expression.type.expression,
                                value: withContext.trim()
                            }
                        ]).stack;
                    }

                    return token;
                },
                parse: function (token, context, chain) {
                    let components = fractal.components;
                    let file = Twig.expression.parse.apply(this, [
                        token.stack,
                        context
                    ]);
                    let handle = Path.parse(file).name;
                    if (handle.indexOf('@') !== 0) {
                        handle = '@' + handle;
                    }

                    // Resolve filename
                    var innerContext = {},
                      withContext,
                      i,
                      template;

                    if (!token.only) {
                        innerContext = Twig.ChildContext(context);
                    }
                    else {
                        const entity = components.find(handle);
                        if (!entity) {
                            throw new Error(`Could not render component '${handle}' - component not found.`);
                        }
                        innerContext = entity.isComponent ? entity.variants().default().context : entity.context;
                    }

                    if (token.withStack !== undefined) {
                        withContext = Twig.expression.parse.apply(this, [
                            token.withStack,
                            context
                        ]);

                        for (i in withContext) {
                            if (withContext.hasOwnProperty(i))
                                innerContext[i] = withContext[i];
                        }
                    }

                    if (file instanceof Twig.Template) {
                        template = file;
                    }
                    else {
                        // Import file
                        template = this.importFile(file);
                    }

                    // Duplicate of the adapter's render() function to render the attributes.
                    // @see adapter().render()
                    // @todo Figure out how to reuse function
                    let attributes = new AttributesObject();
                    let contextAttributes = innerContext.attributes;
                    delete(innerContext.attributes);
                    innerContext.attributes = attributes;

                    function AttributesObject() {
                        let self = this;
                        this.classes = [];
                        this.attr = [];

                        this.addClass = function(...str) {
                            // Merge existing with new classes.
                            self.classes = self.classes.concat(_.flatten(str));
                            return self;
                        };

                        this.removeClass = function(...str) {
                            // todo implement
                            // self.classes = str.join(' ');

                            return self;
                        };

                        this.setAttribute = function(attribute, value) {
                            let str = `${attribute}="${value}"`;

                            self.attr.push(str);
                            self.attr = _.uniq(self.attr);

                            return self;
                        };
                    }

                    AttributesObject.prototype.toString = function toString() {
                        if (contextAttributes) {
                            Object.entries(contextAttributes).forEach(([name, value]) => {
                                if (name === 'class') {
                                    this.classes.push(value);
                                }
                                else {
                                    let attribute = [name];
                                    if (value) {
                                        attribute.push(`"${value}"`);
                                    }
                                    this.attr.push(attribute.join('='));
                                }
                            });
                        }
                        this.classes = _.compact(_.uniq(this.classes));
                        let attrList = [
                            this.classes.length ? `class="${this.classes.join(' ')}"` : '',
                            this.attr ? this.attr.join(' ') : '',
                        ];
                        return attrList.join(' ');
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
