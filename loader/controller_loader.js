'use strict';

const resolver = require('resolve-keypath').resolver;
const path = require('path');

module.exports = function (base) {
  const controllers = require('require-dir')(path.join(base, 'controllers'), { recurse: true });
  const controllerResolver = resolver(controllers, '/');

  const versions = require('require-dir')(path.join(base, 'versions'), { recurse: true });
  const versionResolver = resolver(versions, '/');

  return function (key, version) {
    if (typeof key === 'function') {
      return key;
    }
    key = key.split('#');

    const controllerName = key[0];
    const ControllerClass = controllerResolver(controllerName);
    if (!ControllerClass) {
      throw new Error(`Controller not found: ${controllerName}`);
    }
    const actionName = key[1];

    const VersionTransformer = versionResolver(`${version}/${controllerName}`);

    const ret = { ControllerClass, actionName, middlewares: [], VersionTransformer };
    return ret;
  };
};
