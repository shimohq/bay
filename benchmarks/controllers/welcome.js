'use strict';

const Controller = require('../../controller');

class Welcome extends Controller {
  * index () {
    return 'hello bay!';
  }
}

module.exports = Welcome;
