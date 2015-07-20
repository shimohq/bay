export * from './lib/application';
export * from './lib/controller';
import http from 'http';

class Bay {
  constructor(App) {
    const app = new App();
    this.server = http.createServer(app.callback());
  }

  listen(port) {
    this.server.listen(port);
  }
}

export default Bay;
