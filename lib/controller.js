import lodash from 'lodash';

export default class {
  constructor(app, ctx) {
    this.app = app;
    Object.keys(this.app.models).forEach(modelName => {
      this[modelName] = this.app.models[modelName];
    });
    this.ctx = ctx;
    this.req = ctx.request;
    this.res = ctx.response;
  }

  * _afterAction(next) {
    let returns = yield next;
    if (typeof returns !== 'undefined') {
      this.res.body = returns;
    }
    if (!this.headersSent) {
      yield this.render('');
    }
  }

  static init() {
    this.wrap('_afterAction');
  }
}

TangController.wrap = function (methodName, condition) {
  if (Array.isArray(condition)) {
    condition = { only: condition };
  }
  if (!this.__wrappers) {
    this.__wrappers = [];
  }
  this.__wrappers.push({
    methodName: methodName,
    condition: condition
  });
};

TangController.getWrappers = function (actionName) {
  return this.__wrappers.filter(({ methodName, condition }) => {
    let pass = true;
    if (condition && condition.only) {
      pass = pass && condition.only.indexOf(actionName) !== -1;
    }
    if (condition && condition.except) {
      pass = pass && condition.except.indexOf(actionName) === -1;
    }
    return pass;
  }).map(({ methodName, condition }) => methodName);
};
