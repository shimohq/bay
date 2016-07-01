'use strict';

const pathToRegexp = require('path-to-regexp');
const _ = require('lodash');

class Route {
  constructor(methods, path, handler, options) {
    this.options = _.defaults(options ? _.clone(options) : {}, {
      middleware: []
    });
    if (typeof this.options.middleware === 'string') {
      this.options.middleware = [this.options.middleware];
    }

    this.methods = (Array.isArray(methods) ? methods : [methods]).map(s => s.toUpperCase());
    this.path = path;
    this.regexp = pathToRegexp(path, this.keys = []);
    if (typeof handler === 'string') {
      const key = handler.split('#');
      this.handler = {
        controller: key[0],
        action: key[1]
      };
    } else {
      this.handler = handler;
    }
  }

  match(path, method) {
    const m = this.regexp.exec(path);

    if (!m) {
      return;
    }

    if (this.methods.indexOf(method) === -1) {
      return;
    }

    const params = {};

    for (let i = 1; i < m.length; i++) {
      params[this.keys[i - 1].name] = decodeParam(m[i]);
    }

    return {
      params,
      path: m[0],
      middlewares: this.options.middleware,
      handler: this.handler
    };
  }
}

function decodeParam(val) {
  if (typeof val !== 'string' || val.length === 0) {
    return val;
  }

  try {
    return decodeURIComponent(val);
  } catch (err) {
    if (err instanceof URIError) {
      err.message = `Failed to decode param '${val}'`;
      err.status = err.statusCode = 400;
    }

    throw err;
  }
}

module.exports = Route;
