import { Application } from 'bay';

class App extends Application {
  constructor() {
    super();

    this.router.get('/match/:id', function* () {
      console.log('here');
    });

    this.router.get('/match/:id', ['auth:editor'], 'users#show');

    this.router.resource('posts', router => {
      router.resource('comments');
    });

    this.router.namespace('api', router => {
      router.resource('users');
      router.resource('collections', router => {
        router.resource('projects');
      });
    });
  }

  static get dir () {
    return __dirname;
  }
}

export default App
