import pathToRegexp from 'path-to-regexp';
import { RequestAgent } from '../utils';

class Route {
  constructor (methods, path, middlewares, handler) {
    this.methods = methods;
    this.regexp = pathToRegexp(path, this.keys = []);
    this.middlewares = middlewares;
    this.handler = handler;
  }

  match (path) {
    const m = this.regexp.exec(path);

    if (!m) {
      return;
    }

    const params = new RequestAgent();

    for (let i = 1; i < m.length; i++) {
      params.set(this.keys[i - 1].name, decodeParam(m[i]));
    }

    return { params: params, path: m[0] };
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

export default Route;
