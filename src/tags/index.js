"use strict";

const fractal = require("@frctl/fractal");
const _ = require("lodash");
const fs = require("fs");
const po = require("gettext-parser").po.parse(
    require("fs").readFileSync(
        `${__dirname}/../../../../../languages/de_DE/LC_MESSAGES/nepo.po`
    ),
    "UTF-8"
);
const poTrans = require("gettext-parser").po.parse;
const Path = require("path");
const adapter = require("../adapter");
const Attributes = require("../attributes");

module.exports = function (fractal) {
    return {
        render(Twig) {
            return {
                /**
                 * Block logic tokens.
                 *
                 *  Format: {% render "template.twig" with {some: 'values'} %}
                 */
                type: 'Twig.logic.type.render',
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

                    Attributes.convert(innerContext);

                    if (token.withStack !== undefined) {
                        passedArguments = Twig.expression.parse.apply(this, [token.withStack, context]);
                        // Variables not defined by the component context are
                        // intentionally ignored.
                        _.forEach(innerContext, function (value, name) {
                          // Override default value only if an argument value is passed.
                          // Ignore undefined variables, which may appear when rendering
                          // a component with dummy/faker data but without values for its
                          // child components, so that each component only generates its
                          // own dummy data.
                          if (!passedArguments.hasOwnProperty(name) || typeof passedArguments[name] === 'undefined') {
                            return;
                          }
                          if (name.indexOf('attributes') > -1) {
                            value.merge(passedArguments[name]);
                          }
                          else {
                            innerContext[name] = passedArguments[name];
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
                regex: /^trans(.+)?/,
                next: ['plural', 'endtrans'],
                open: true,
                compile: function (token) {
                    return token;
                },
                parse: function (token, context, chain) {
                    var that = this;
                    return Twig.parseAsync.call(that, token.output, context)
                    .then(function (value) {
                        var plural_token = false;
                        var plural_position = 0;
                        fs.appendFile(
                            require('os').homedir + '/fractal.output',
                            '\n value: ' + value +
                            '\n Output: ' + JSON.stringify(token.output),
                                (err) => {
                                    if (err) throw err;
                                    console.log('updated');
                                });

                            // Look for plural tag.
                        let string_to_translate = '';
                        let is_raw_string = false;
                        let variables_in_string = [];
                        if (value === token.output[0].value) {
                            is_raw_string = true;
                        }
                        for (let statement of token.output) {
                            plural_position++;
                            if (statement.type === 'logic' && statement.token.type === 'plural') {
                                plural_token = statement.token;
                                break;
                            } else {
                                if (statement.type === 'raw') {
                                    string_to_translate += statement.value;
                                } else if (
                                    !is_raw_string &&
                                    statement.type === 'output' &&
                                    Array.isArray(statement.stack) &&
                                    statement.stack.length === 1 )
                                {
                                    const variable = statement.stack[0].value;
                                    variables_in_string.push(variable);
                                    string_to_translate += `%${variable}%`;
                                }
                            }
                       };

                        if (plural_token !== false && typeof plural_token.match[1] === 'string') {
                            // Evaluate plural variable.
                            var plural_check = Twig.expression.compile({
                                type: Twig.expression.type.expression,
                                value: plural_token.match[1].trim() + ' == 1'
                            }).stack;
                            var isPlural = Twig.expression.parse(plural_check, context);

                            if (isPlural) {
                                token.output = token.output.slice(0, plural_position);
                            }
                            else {
                                token.output = token.output.slice(plural_position, token.output.length);
                            }
                        }
                        if (string_to_translate !== '') {
                            const current_translation = po.translations[''][string_to_translate];
                            if (current_translation != undefined) {
                                if (is_raw_string) {
                                    token.output[0] = {
                                            type: 'raw',
                                            value: current_translation.msgstr[0],
                                        };
                                    } else {
                                        token.output = split_translation(
                                            current_translation.msgstr[0],
                                            variables_in_string
                                        );
                                    }
                                }
                            }

                        return {
                            chain: chain,
                            output: Twig.parse.apply(that, [token.output, context])
                        };
                    });
                }
            };
        },
        plural(Twig) {
            // This is a placeholder. The actual parser logic is part of the trans tag.
            return {
                type: 'plural',
                regex: /^plural(.+)?/,
                next: [],
                open: true,
                compile: function (token) {
                    return token;
                },
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

function split_translation(translated_string, variables) {
    let return_array = [];
    const string_parts = translated_string
        .split('%')
        .filter((str) => str !== "");
    string_parts.forEach((str) => {
        if (variables.includes(str)) {
            return_array.push({
                type: 'output',
                stack: [
                    {
                        type: 'Twig.expression.type.variable',
                        value: str,
                        match: [str],
                    },
                ],
            });
        } else {
            return_array.push({ type: 'raw', value: str });
        }
    });

    return return_array;
}
