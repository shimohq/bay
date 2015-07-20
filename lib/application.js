import Router from './router';
import context from './context';
import request from './context/request';
import response from './context/response';
import Cookies from 'cookies';
import accepts from 'accepts';
import co from 'co';

export class Application {
  constructor() {
    this.router = new Router();
    this.context = Object.create(context);
    this.request = Object.create(request);
    this.response = Object.create(response);
  }

  createContext(req, res) {
    var context = Object.create(this.context);
    var request = context.request = Object.create(this.request);
    var response = context.response = Object.create(this.response);
    context.app = request.app = response.app = this;
    context.req = request.req = response.req = req;
    context.res = request.res = response.res = res;
    request.ctx = response.ctx = context;
    request.response = response;
    response.request = request;
    context.onerror = context.onerror.bind(context);
    context.originalUrl = request.originalUrl = req.url;
    context.cookies = new Cookies(req, res, this.keys);
    context.accept = request.accept = accepts(req);
    context.state = {};
    return context;
  }

  callback() {
    const _this = this;

    return function (req, res) {
      res.statusCode = 404;
      const ctx = _this.createContext(req, res);
      respond.call(ctx);
    };
  }

  toJSON() {
    return 'app';
  }

  static get dir () {
    throw new Error('`Application.get dir` should be override.');
  }
}

function respond(next) {
  const app = this.app;
  const matches = app.router.match(this.url);

  const body = '';

  if (!matches) {
    this.type = 'text';
    this.length = Buffer.byteLength('404');
    this.res.end('404');
  }

  this.res.end(body);
}
