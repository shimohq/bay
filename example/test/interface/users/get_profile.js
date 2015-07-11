describe('GET /users', function () {
  context('success', function () {
    it('should return the current user', function *() {
      let base = get.auth().header();

      let users = get('/users');
    });
  });

  context('failure', function () {
  });
});
