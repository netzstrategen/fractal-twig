'use strict';

const fractal = require('@frctl/fractal');
const _ = require('lodash');
const Path = require('path');
const adapter = require('../adapter');
const Attributes = require('../attributes');

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

                    // this is new code
                    let file = Twig.expression.parse.apply(this, [token.stack, context]);
                    let handle = Path.parse(file).name;
                    if (handle.indexOf('@') !== 0) {
                        handle = '@' + handle;
                    }
                    //end new code

                    // Resolve filename
                    var innerContext = {},
                      passedArguments,
                      i,
                      template,
                      that = this,
                      promise = Twig.Promise.resolve();

                    if (!token.only) {
                        innerContext = Twig.ChildContext(context);
                    }
                    // this is new code
                    else {
                        const entity = components.find(handle);
                        if (!entity) {
                            throw new Error(`Unable to render '${handle}' - component not found.`);
                        }
                        try {
                            innerContext = entity.isComponent ? entity.variants().default().context : entity.context;

                            // The classes of the default context attributes need to be
                            // merged manually.
                            // @see Twig.Template.prototype.render(), adapter.js
                            if (entity.isDefault !== undefined && !entity.isDefault) {
                                let defaultContext = entity.parent.variants().default().context;
                                if (defaultContext.attributes !== undefined && defaultContext.attributes.class !== undefined) {
                                    if (typeof defaultContext.attributes.class === 'string') {
                                        defaultContext.attributes.class = defaultContext.attributes.class.split(' ');
                                    }
                                    innerContext.attributes.class = _.concat(defaultContext.attributes.class, innerContext.attributes.class);
                                }
                            }
                        }
                        catch (err) {
                            throw err;
                        }
                    }

                    _.forEach(innerContext, function (value, name) {
                      if (name.indexOf('attributes') > -1) {
                        innerContext[name] = new Attributes(value);
                      }
                    });
                    // end new code

                    if (token.withStack !== undefined) {
                        promise = Twig.expression.parseAsync.call(this, token.withStack, context)
                        .then(function(withContext) {

                            //passedArguments = Twig.expression.parse.apply(this, [token.withStack, context]);

                            //_.forEach(passedArguments, function (value, name) {
                            _.forEach(withContext, function (value, name) {
                                // It makes no sense to pass variables that are not
                                // supported by the component.
                                if (innerContext[name] === undefined) {
                                    return;
                                }
                                if (name.indexOf('attributes') > -1) {
                                    innerContext[name].merge(value);
                                }
                                else {
                                    innerContext[name] = value;
                                }
                            });
                        });
                    }

                    return promise
                    .then(function (){
                        return Twig.expression.parseAsync.call(that, token.stack, context);
                    })
                    .then(function (file) {
                        if (file instanceof Twig.Template) {
                            template = file;
                        }
                        else {
                            try {
                                template = that.importFile(file);
                            }
                            catch (err) {
                                if (token.ignoreMissing) {
                                    return '';
                                }
                                throw err;
                            }
                        }

                        return template.renderAsync(innerContext);
                    })
                    .then(function(output) {
                        return {
                            chain: chain,
                            output: output
                        };

                    })
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
