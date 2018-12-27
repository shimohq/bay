const Router = require('../lib/router/router')
const {expect} = require('chai')

describe('Router', () => {
  describe('#getControllers()', () => {
    it('returns all controllers', () => {
      const router = new Router()
      router.get('/users', 'users#index')
      router.namespace('provider/:provider', router => {
        router.resource('file')
      })
      router.namespace('oauth', router => {
        router.post('/token', 'index#token')
      })
      router.resource('captcha', (member, collection) => {
        collection.get('/action/needs', 'captcha#needs')
      })

      expect(router.getControllers().sort()).to.eql([
        'captcha',
        'oauth/index',
        'provider/file',
        'users'
      ])
    })
  })
})
