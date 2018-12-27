const path = require('path')
const {expect} = require('chai')
const Application = require('../application')

describe('application', () => {
  describe('#_requireControllers()', () => {
    it('supports nested controllers', () => {
      const app = new Application({
        base: path.join(__dirname, 'fixtures')
      })
      app.router.get('/users', 'a#index')
      app.router.namespace('nested/:nested', (router) => {
        router.get('/users', 'b#index')
      })

      expect(app._requireControllers()).to.eql({
        a: 'a',
        nested: {
          b: 'b'
        }
      })
    })
  })
})
