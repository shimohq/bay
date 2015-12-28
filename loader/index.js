const controller = require('./controller_loader');
const router = require('./router_loader');

module.exports = function (base) {
  return {
    controller: controller(base),
    router: router(base)
  };
};
