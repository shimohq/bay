import methods from 'methods';
import Route from './route';

class Router {
  constructor(parent) {
    this.parent = parent;
    this.stack = [];
  }

  resource(name, cb) {
    const router = new Router(this, `/${name}/:nameId`);
    this.stack.push(router);

    this.get('/' + name + '/:nameId', `${name}#show`);
  }

  namespace(namespace, cb) {
    const router = new Router(this, '/' + namespace);
    this.stack.push(router);
  }

  match(url) {
    let matches;
    for (let i = 0; i < this.stack.length; i++) {
      matches = this.stack[i].match(url);
      if (matches) {
        break;
      }
    }

    return matches;
  }
}

methods.forEach(function (method) {
  Router.prototype[method] = function (path, middlewares, handler) {
    if (typeof handler === 'undefined') {
      handler = middlewares;
      middlewares = null;
    }
    const route = new Route(method, path, middlewares, handler);
    this.stack.push(route)
  };
});

export default Router;
