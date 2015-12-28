'use strict';

const koa = require('koa');
const _ = require('lodash');
const delegate = require('delegates');
const http = require('http');
const loader = require('./loader');
const Router = require('./lib/router');

const path = require('path')
const base = path.dirname(module.parent.filename);

class BayApplication {
  constructor(options) {
    if (!options) {
      options = {};
    }
    this.app = koa();
    this.base = options.base || base;
    this.router = new Router();
    _.assign(this.app, options);

    delegate(this, 'app')
      .method('use')
      .method('callback')
      .method('inspect')
      .method('toJSON')
  }

  listen() {
    const loaders = loader(this.base);
    this.app.use(loaders.router(this.router, loaders.controller));

    const server = http.createServer(this.app.callback());
    return server.listen.apply(server, arguments);
  }
}

module.exports = BayApplication;
