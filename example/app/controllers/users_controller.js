import { Controller } from 'Bay';

 class UsersController extends Controller {
  * show(User) {
    return yield User.find(this.req.params.id);
  }

  * show(User) {
    var user = yield User.find(this.req.params.id);
  }
}

export default UsersController;
