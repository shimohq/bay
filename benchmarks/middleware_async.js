'use strict';

const BayApplication = require('../application');

class Application extends BayApplication {
  constructor (options) {
    super(options)

    this.router.get('/', 'welcome#index')
  }
}

// number of middleware
let n = parseInt(process.env.MW || '1', 10);

console.log(`Bay ${n} async middlewares`);

const app = new Application({
  base: __dirname
});

while (n--) {
  app.use(async (next) => { await next() });
}

app.listen(3000);
