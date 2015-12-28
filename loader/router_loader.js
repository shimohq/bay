'use strict';

const filter = require('filter-match').filter;
const compose = require('koa-compose');

module.exports = function (base) {
  return function (router, controllers) {
    return function *(next) {
      const match = router.match(this.routerPath || this.path, this.method);
      if (!match) {
        yield next;
        return;
      }

      this.route = match;
      this.params = match.params;

      const matchVersion = this.get('accept').match(/application\/vnd\.shimo\.(v\d)\+json/);
      const version = matchVersion ? matchVersion[1] : 'v1';

      const handler = controllers(match.handler, version);
      if (!handler) {
        yield next;
        return;
      }

      yield compose(match.middlewares);
      if (typeof this.body !== 'undefined') {
        yield next;
        return;
      }

      const ControllerClass = handler.ControllerClass;
      const controller = new ControllerClass(this);
      const VersionTransformer = handler.VersionTransformer;
      let versionTransformer;
      if (VersionTransformer) {
        versionTransformer = new VersionTransformer(controller);
      }
      const actionName = handler.actionName;

      const body = versionTransformer && versionTransformer[actionName] ?
        yield versionTransformer[actionName].call(versionTransformer, executeController(controller, actionName)) :
        yield executeController(controller, actionName);

      if (typeof body !== 'undefined') {
        this.body = body;
      }

      yield next;
    };
  };
};

function *executeController(controller, actionName) {
  if (controller._middleware) {
    const stack = filter(actionName, controller._middleware).map(v => controller[v.name]);
    yield compose(stack).call(controller);
  }
  const body = yield controller[actionName]();
  return body;
}
