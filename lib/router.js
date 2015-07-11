import inflection from 'inflection';
import methods from 'methods';

export class Router {
  constructor(prefix, parent) {
    this.prefix = prefix;
    this.parent = parent;
    this.childrens = [];

    methods.forEach(method => {
      this[method] = (url, action) => {
        this._routes.push([method, url, action]);
      };
    });
  }

  resource(resource, options, block) {
    if (typeof options === 'function') {
      block = options;
      options = null;
    }
    if (!options) {
      options = {};
    }
    if (options.shallow) {
      this.parent.resource();
    }
    if (!options.param) {
      let singularizedResource = inflection.singularize(resource);
      options.param = `${singularizedResource}_id`;
    }
    let routes = {
      index:    { method: 'get',    shallow: false, url: `${resource}` },
      new:      { method: 'get',    shallow: false, url: `${resource}/new` },
      create:   { method: 'post',   shallow: false, url: `${resource}` },
      show:     { method: 'get',    shallow: true,  url: `${resource}/:${options.param}` },
      edit:     { method: 'get',    shallow: true,  url: `${resource}/:${options.param}/edit` },
      patch:    { method: 'patch',  shallow: true,  url: `${resource}/:${options.param}` },
      put:      { method: 'put',    shallow: true,  url: `${resource}/:${options.param}` },
      destroy:  { method: 'delete', shallow: true,  url: `${resource}/:${options.param}` }
    };
    let controller = options.controller || resource;
    Object.keys(routes).forEach(action => {
      let pass = true;
      if (options.only && options.only.indexOf(action) === -1) {
        pass = false;
      }
      if (options.except && options.except.indexOf(action) !== -1) {
        pass = false;
      }
      if (pass) {
        let route = routes[action];
        if (route.shallow && options.shallow) {
          this[route.method](`${this.parent.prefix}${route.url}`, `${controller}#${action}`);
        } else {
          this[route.method](`${this.prefix}${route.url}`, `${controller}#${action}`);
        }
      }
    });
    if (block) {
      block(new Router(`${routes.show.url}/`, this._routes));
    }
  }

  namespace(prefix, block) {
    block(new Router(prefix, this._routes));
  }

  nested
}
