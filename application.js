'use strict';

const _ = require('lodash');
const http = require('http');
const compose = require('bay-compose');
const filter = require('filter-match').filter;
const Router = require('./lib/router/router');
const resolver = require('resolve-keypath').resolver;
const requireDir = require('require-dir');
const onFinished = require('on-finished');
const parse = require('parseurl');
const exceptions = require('./exceptions');
const statuses = require('statuses');

const path = require('path');

class BayApplication {
  constructor(options) {
    if (!options) {
      options = {};
    }

    this.env = process.env.NODE_ENV || 'development';
    this.subdomainOffset = 2;
    this.middleware = [];

    this.getVersion = options.getVersion;
    this.proxy = options.proxy;
    this.base = options.base;

    if (!this.base) {
      throw new Error('missing base path');
    }

    this.router = new Router();

    this.getController = resolver(options.controllers || requireDir(path.join(this.base, 'controllers'), { recurse: true }), '/');
    if (this.getVersion) {
      this.getVersionTransformer = resolver(options.versions || requireDir(path.join(this.base, 'versions'), { recurse: true }), '/');
    }
  }

  /**
   * Use the given middleware `fn`.
   *
   * @param {GeneratorFunction} fn
   * @return {Application} self
   * @api public
   */
  use(fn) {
    this.middleware.push(fn);
    return this;
  }

  listen() {
    const server = http.createServer(this.callback());
    return server.listen.apply(server, arguments);
  }

  /**
   * Return JSON representation.
   * We only bother showing settings.
   *
   * @return {Object}
   * @api public
   */
  toJSON() {
    return _.pick(this, ['subdomainOffset', 'proxy', 'env']);
  }

  callback() {
    const self = this;

    return function (req, res) {
      res.statusCode = 404;

      // Find the matching route
      const match = self.router.match(parse(req).pathname, req.method);
      if (!match) {
        return self.handleError(req, res, new exceptions.RoutingError('No route matches'));
      }

      // Resolve the controller
      const actionName = match.handler.action;
      const controllerName = match.handler.controller;
      const ControllerClass = self.getController(controllerName);
      if (!ControllerClass) {
        return self.handleError(req, res, new exceptions.RoutingError(`Controller ${controllerName} not found`));
      }
      if (!ControllerClass.prototype[actionName]) {
        return self.handleError(req, res,
          new exceptions.RoutingError(`Action ${controllerName}#${actionName} not found`));
      }

      onFinished(res, function (err) {
        if (err) {
          self.handleError(req, res, convertToError(err));
        }
      });

      const controller = new ControllerClass(self, req, res);

      controller.route = match;
      controller.params = match.params;

      const middlewares = self.middleware.slice();

      if (self.getVersion) {
        const version = self.getVersion(controller);
        const versionTransformer = self.getVersionTransformer(`${version}/${controllerName}`);
        if (versionTransformer && versionTransformer[actionName]) {
          middlewares.push(versionTransformer[actionName]);
        }
      }

      if (controller._middleware) {
        filter(actionName, controller._middleware).forEach(v => {
          middlewares.push(typeof v.name === 'function' ? v.name : controller[v.name]);
        });
      }

      middlewares.push(function *fillRespondBody(next) {
        const fn = controller[actionName];
        let body

        if (typeof fn === 'function') {
          const ret = fn.call(this);

          // function, promise, generator, array, or object
          if (ret != null && (typeof ret === 'object' || typeof ret === 'function')) {
            body = yield ret;
          } else {
            body = ret;
          }
        }

        if (typeof body !== 'undefined') {
          controller.body = body;
        }
        yield next;
      });

      // Make Bay work with async function
      compose(middlewares)(controller)
        .then(function () { controller.respond() })
        .catch(function (err) { self.handleError(req, res, convertToError(err)) });
    };
  }

  handleError(req, res, err) {
    if (res.headersSent || !res.socket || !res.socket.writable) {
      err.headerSent = true;
      return;
    }

    // unset all headers
    res._headers = {};

    // force text/plain
    res.setHeader('Content-Type', 'text/plain');

    // ENOENT support
    if (err.code === 'ENOENT') {
      err.status = 404;
    }

    // default to 500
    if (typeof err.status !== 'number' || !statuses[err.status]) {
      err.status = 500;
    }

    // respond
    const msg = err.expose ? err.message : statuses[err.status];
    res.statusCode = err.status;
    res.setHeader('Content-Length', Buffer.byteLength(msg));
    res.end(msg);
  }
}

function convertToError(err) {
  return err instanceof Error ? err : new Error(`non-error thrown: ${err}`);
}

module.exports = BayApplication;
exports.exceptions = exceptions;
