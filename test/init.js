
var tape = require('tape')

var Layered = require('../')

var layered = Layered()
var cont = require('cont')

layered.use({
  name: 'foo',
  version: '1.0.0',
  manifest: { foo: 'async' },
  core: true,
  init: function (api) {
    return {
      foo: cont(function (val, cb) {
        cb(null, 'FOO'+val)
      })
    }
  }
}).use({
  name: 'bar',
  version: '0.0.0',
  manifest: { bar: 'async' },
  dependencies: {
    foo: '1.0',
  },
  core: true,
  init: function (api) {
    return {
      bar: cont(function (val, cb) {
        this.foo(val+'BAR', cb)
      })
    }
  }
})

tape('simple', function (t) {

  var api = layered.api()

  api.foo('hello', function (err, val) {
    t.equal(val, 'FOOhello')
    api.bar('hello', function (err, val) {
      t.equal(val, 'FOOhelloBAR')
      t.end()
    })
  })

})



tape('permissions', function (t) {

  t.plan(10)

  function perms () { }

  perms.pre = function (v, path, type) {
    t.equal(v, 'hello')
    t.deepEqual(path, ['foo'])
    t.equal('async', type)
  }

  perms.post = function (v, path, type) {
    t.equal(type, 'async')
    return function (cb) {
      v(function (err, value) {
        t.equal(value, 'FOOhello')
        t.deepEqual(path, ['foo'])
        t.equal('async', type)
        cb(err, value)
      })
    }
  }

  t.deepEqual(layered.manifest(), {
    foo: 'async',
    bar: 'async'
  })

  var api = layered.api(perms)

  api.foo('hello', function (err, v) {
    t.notOk(err)
    t.equal(v,'FOOhello')
    t.end()
  })


})

tape('nested', function (t) {

  t.plan(23)

  var pre = 0, post = 2

  layered.use({
    name: 'baz',
    version: '0.0.0',
    manifest: { foobar: 'async' },
    dependencies: {
      foo: '1.0',
      bar: '~0.0.0'
    },
    core: false,
    init: function (api) {
      return {
        foobar: cont(function (val, cb) {
          this.bar(val, cb)
        })
      }
    }
  })

  function perms () { }

  var expectedPaths = [
    ['baz', 'foobar'],
    ['bar'],
    ['foo']
  ]

  var expectedArg = [
    'hi', 'hi', 'hiBAR'
  ]

  perms.pre = function (v, path, type) {
    t.equal(v, expectedArg[pre])
    t.deepEqual(path, expectedPaths[pre++], 'pre-path is correct')
    t.equal('async', type)
  }


  perms.post = function (v, path, type) {
    t.equal(type, 'async')
    return function (cb) {
      v(function (err, value) {
        console.log("POST", post, path, type)
        t.equal(value, 'FOOhiBAR')
        t.deepEqual(path, expectedPaths[post--], 'post-path is correct')
        t.equal('async', type)
        cb(err, value)
      })
    }
  }

  t.deepEqual(layered.manifest(), {
    foo: 'async',
    bar: 'async',
    baz: { foobar: 'async' }
  })


  var api = layered.api(perms)

  api.baz.foobar('hi', function (err, v) {
    t.equal(v,'FOOhiBAR')
    t.end()
  })


})

