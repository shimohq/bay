'use strict';

const methods = require('methods');
const Route = require('./route');
const inflect = require('i')();
const _ = require('lodash');

class Router {
  constructor(parent, prefix, options) {
    this.prefix = prefix || '';
    this.stack = [];
    this.options = _.defaults(options ? _.clone(options) : {}, {
      middleware: [],
      controllerPrefix: '',
      sensitive: false,
      strict: false,
      end: true
    });
    if (typeof this.options.middleware === 'string') {
      this.options.middleware = [this.options.middleware];
    }
    if (parent) {
      this.prefix = parent.prefix + this.prefix;

      if (parent.options.middleware.length) {
        this.options.middleware = parent.options.middleware.concat(this.options.middleware);
      }
      if (parent.options.controllerPrefix) {
        if (this.options.controllerPrefix) {
          this.options.controllerPrefix = `${parent.options.controllerPrefix}/${this.options.controllerPrefix}`;
        } else {
          this.options.controllerPrefix = parent.options.controllerPrefix;
        }
      }
      parent.stack.push(this);
      this.parent = parent;
    }

    this.isPlainPrefix = this.prefix.indexOf(':') === -1;
  }

  resource(name, cb, options) {
    if (typeof cb !== 'function') {
      options = cb;
      cb = null;
    }
    const controller = (options && options.controller) || name;
    const names = inflect.pluralize(name);

    const collectionRouter = new Router(this, `/${names}`, options);
    const memberRouter = new Router(collectionRouter, `/:${name}`, options);

    if (cb) {
      cb(memberRouter, collectionRouter);
    }

    collectionRouter.get('', `${controller}#index`);
    collectionRouter.post('', `${controller}#create`);

    memberRouter.get('', `${controller}#show`);
    memberRouter.put('', `${controller}#update`);
    memberRouter.patch('', `${controller}#patch`);
    memberRouter.delete('', `${controller}#destroy`);

    return this;
  }

  namespace(namespace, cb, options) {
    if (typeof cb !== 'function') {
      options = cb;
      cb = null;
    }
    const match = namespace.match(/^\/?:?(\w+)/);
    const controllerPrefix = match ? match[1] : null;
    const router = new Router(this, `/${namespace}`, _.defaults(options || {}, { controllerPrefix }));
    if (cb) {
      cb(router);
    }

    return this;
  }

  group(cb, options) {
    if (typeof cb !== 'function') {
      options = cb;
      cb = null;
    }
    const router = new Router(this, options);
    if (cb) {
      cb(router);
    }

    return this;
  }

  match(path, method) {
    if (this.isPlainPrefix && !path.startsWith(this.prefix)) {
      return;
    }
    for (let i = 0; i < this.stack.length; i++) {
      const match = this.stack[i].match(path, method);
      if (match) {
        return match;
      }
    }
  }
}

methods.forEach(function (method) {
  Router.prototype[method] = function (path, handler, options) {
    path = this.prefix + path;
    if (options) {
      if (options.middleware && this.options.middleware) {
        options.middleware = this.options.middleware.concat(options.middleware);
      }
      options = _.defaults(options, this.options.middleware);
    } else {
      options = this.options;
    }
    if (typeof handler === 'string' && this.options.controllerPrefix) {
      handler = `${this.options.controllerPrefix}/${handler}`;
    }
    this.stack.push(new Route(method, path, handler, options));
  };
});

module.exports = Router;
