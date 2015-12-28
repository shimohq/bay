'use strict';

const delegate = require('delegates');

class BayController {
  constructor(ctx) {
    this.ctx = ctx;

    delegate(this, 'ctx')
      .getter('request')
      .getter('response')
      .getter('params')
      .getter('route')
      .getter('cookies');

    /**
     * Response delegation.
     */

    delegate(this, 'response')
      .method('attachment')
      .method('redirect')
      .method('remove')
      .method('vary')
      .method('set')
      .method('append')
      .access('status')
      .access('message')
      .access('length')
      .access('type')
      .access('lastModified')
      .access('etag')
      .access('body')
      .getter('headerSent')
      .getter('writable');

    /**
     * Request delegation.
     */

    delegate(this, 'request')
      .method('acceptsLanguages')
      .method('acceptsEncodings')
      .method('acceptsCharsets')
      .method('accepts')
      .method('get')
      .method('is')
      .access('querystring')
      .access('idempotent')
      .access('socket')
      .access('search')
      .access('method')
      .access('query')
      .access('path')
      .access('url')
      .getter('origin')
      .getter('href')
      .getter('subdomains')
      .getter('protocol')
      .getter('host')
      .getter('hostname')
      .getter('header')
      .getter('headers')
      .getter('secure')
      .getter('stale')
      .getter('fresh')
      .getter('ips')
      .getter('ip');
  }

  aroundAction(name, options) {
    if (!options) {
      options = {};
    }
    options.name = name;
    if (!this._middleware) {
      this._middleware = [];
    }
    this._middleware.push(options);
  }

  /**
   * Node-style asserting with HTTP errors being thrown
   *
   * This patch defaults the http code to 400
   * rather than 500
   */
  assert(res, code, message) {
    if (arguments.length === 1 || (arguments.length === 2 && typeof code === 'string')) {
      return this.ctx.assert(res, 400, code);
    }
    return this.ctx.assert(res, code, message);
  }

  /**
   * Like #assert, but unconditionally throws
   */
  throw(code, message) {
    if (arguments.length === 1 && typeof code === 'string') {
      return this.ctx.throw(400, code);
    }
    return this.ctx.throw(code, message);
  }
}

module.exports = BayController;
