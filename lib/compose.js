'use strict'

const co = require('co');
const isGeneratorFn = require('is-generator-fn');

function compose (middleware) {
  return function (ctx) {
    return Promise.resolve().then(function () {
      let index = -1;

      return dispatch(0);

      function dispatch(i) {
        if (i <= index) {
          throw new Error('next() called multiple times');
        }

        index = i;

        let fn = middleware[i];

        if (typeof fn === 'function') {
          if (isGeneratorFn(fn)) {
            fn = co.wrap(fn);
          }

          return fn.call(ctx, function (cb) {
            if (typeof cb === 'function') {
              return cb(null, dispatch(i + 1));
            }
            return dispatch(i + 1);
          });
        }
      }
    });
  };
}

module.exports = compose;
