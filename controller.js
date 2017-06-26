'use strict';

const delegate = require('delegates');
const requestLib = require('./lib/request');
const responseLib = require('./lib/response');
const Cookies = require('cookies');
const accepts = require('accepts');
const createError = require('http-errors');
const httpAssert = require('http-assert');
const Stream = require('stream');
const isJSON = require('koa-is-json');
const statuses = require('statuses');

function BayController(app, req, res) {
  const request = this.request = Object.create(requestLib);
  const response = this.response = Object.create(responseLib);

  this.app = request.app = response.app = app;
  this.req = request.req = response.req = req;
  this.res = request.res = response.res = res;

  request.ctx = response.ctx = this;
  request.response = response;
  response.request = request;

  this.originalUrl = request.originalUrl = req.url;
  this.cookies = new Cookies(req, res, this.keys);
  this.accept = request.accept = accepts(req);
  this.state = {};
}

/**
 * Return JSON representation.
 *
 * Here we explicitly invoke .toJSON() on each
 * object, as iteration will otherwise fail due
 * to the getters and cause utilities such as
 * clone() to fail.
 *
 * @return {Object}
 * @api public
 */
BayController.prototype.toJSON = function () {
  return {
    request: this.request.toJSON(),
    response: this.response.toJSON(),
    app: this.app.toJSON(),
    originalUrl: this.originalUrl,
    req: '<original node req>',
    res: '<original node res>',
    socket: '<original node socket>'
  };
};

/**
 * Similar to .throw(), adds assertion.
 *
 *    this.assert(this.user, 401, 'Please login!');
 *
 * See: https://github.com/jshttp/http-assert
 *
 * @param {Mixed} test
 * @param {Number} [status=400]
 * @param {String} message
 * @api public
 */
BayController.prototype.assert = function (res, code, message) {
  if (arguments.length === 1 || (arguments.length === 2 && typeof code === 'string')) {
    return httpAssert(res, 400, code);
  }
  return httpAssert(res, code, message);
};

/**
 * Throw an error with `msg` and optional `status`
 * defaulting to 500. Note that these are user-level
 * errors, and the message may be exposed to the client.
 *
 *    this.throw(403)
 *    this.throw('name required', 400)
 *    this.throw(400, 'name required')
 *    this.throw('something exploded')
 *    this.throw(new Error('invalid'), 400);
 *    this.throw(400, new Error('invalid'));
 *
 * See: https://github.com/jshttp/http-errors
 *
 * @param {String|Number|Error} err, msg or status
 * @param {String|Number|Error} [err, msg or status]
 * @param {Object} [props]
 * @api public
 */

BayController.prototype.throw = function (code, message, props) {
  if (arguments.length === 1 && typeof code === 'string') {
    throw createError(400, code, props);
  }
  throw createError(code, message, props);
};

/**
 * Response helper.
 */
BayController.prototype.respond = function () {
  const res = this.res;
  if (res.headersSent || !this.writable) {
    return;
  }

  let body = this.body;
  const code = this.status;

  // ignore body
  if (statuses.empty[code]) {
    // strip headers
    this.body = null;
    return res.end();
  }

  if (this.method === 'HEAD') {
    if (isJSON(body)) {
      this.length = Buffer.byteLength(JSON.stringify(body));
    }
    return res.end();
  }

  // status body
  if (body === null || typeof body === 'undefined') {
    this.type = 'text';
    body = this.message || String(code);
    this.length = Buffer.byteLength(body);
    return res.end(body);
  }

  // responses
  if (Buffer.isBuffer(body)) {
    return res.end(body);
  }
  if (typeof body === 'string') {
    return res.end(body);
  }
  if (body instanceof Stream) {
    return body.pipe(res);
  }

  // body: json
  body = JSON.stringify(body);
  this.length = Buffer.byteLength(body);
  res.end(body);
};

BayController.prototype.aroundAction = function (name, options) {
  if (!options) {
    options = {};
  }
  options.name = name;
  if (!this._middleware) {
    this._middleware = [];
  }
  this._middleware.push(options);
};

/**
 * Response delegation.
 */

delegate(BayController.prototype, 'response')
  .method('attachment')
  .method('redirect')
  .method('remove')
  .method('vary')
  .method('set')
  .method('append')
  .access('status')
  .access('message')
  .access('body')
  .access('length')
  .access('type')
  .access('lastModified')
  .access('etag')
  .getter('headerSent')
  .getter('writable');

/**
 * Request delegation.
 */

delegate(BayController.prototype, 'request')
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

module.exports = BayController;
