'use strict';

class Access {

    constructor(target) {
        this.target = target || {};
        this.proxy = new Proxy(this.target, this.handler());
        // console.log(this.proxy);
    };

    handler() {
        return {
            get (target, name, receiver) {
                if (!Reflect.has(target, name)) {
                    if (typeof name === 'string' && name.indexOf('get') !== -1) {
                        name = name.replace('get', '').toLowerCase();
                        target = target.storage;
                    }
                    else {
                        return undefined;
                    }
                }
                return Reflect.get(target, name, receiver);
            }
        }
    }

}

module.exports = Access;
