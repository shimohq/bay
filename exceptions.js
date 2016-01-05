'use strict';

class BayError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
    this.message = message;
    Error.captureStackTrace(this, this.constructor.name);
  }
}

/**
 * When no router is found
 */
class RoutingError extends BayError {
  constructor(message) {
    super(message);
    this.status = 404;
  }
}
exports.RoutingError = RoutingError;
