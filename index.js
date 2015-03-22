var semver = require('semver')

function isFunction (f) {
  return 'function' === typeof f
}

function isObject (o) {
  return o && 'object' === typeof o
}

function find (ary, test) {
  for(var i in ary)
    if(test(ary[i], i, ary))
      return ary[i]
}

function each(obj, iter) {
  for(var k in obj)
    iter(obj[k], k, obj)
}

function copy (_a, a) {
  _a = _a || {}
  for(var k in a)
    _a[k] = _a[k] || a[k]
  return _a
}

function merge(ary) {
  return ary.reduce(copy, {})
}

function _pluck(name) {
  return function (obj) {
    return obj[name]
  }
}

function allow () {

  function perms () {}

  perms.pre = function () {}
  perms.post = function (value) {
    return value
  }

  return perms
}

module.exports = function () {

  var layers = []

  function resolve(name, range) {
    return find(layers, function (layer) {
      return name === layer.name && semver.satisfies(layer.version, range)
    })
  }

  return {
    api: function (perms) {
      //return a flatterned api snapshot.
      var root = {}

      perms = perms || allow()

      //add layers into one api object under their root[name]
      //except where layer.core === true, add those directly to root
      layers.forEach(function (layer) {
        var api, path = []
        if(layer.core) api = root
        else {
          api = root[layer.name] = {}
          path = [layer.name]
        }
        each(layer.manifest, function (type, name) {
          var _path = path.concat(name)
          api[name] = function (arg, cb) {
            perms.pre(arg, _path, type) //should throw if invalid.

            var value = layer.api[name].call(root, arg)
            value = perms.post(value, _path, type)
            if(cb && type === 'async') value(cb)
            else                       return value
          }
        })
      })

      return root
    },

    //install a subapi.
    use: function (layer) {
      if(!layer) layer = name, name = null

      //check it's actually possible to use this layer.
      if(isObject(layer.dependencies))
        each(layer.dependencies, function (range, name) {
          if(!resolve(name, range))
            throw new Error('missing dependency:'+name+'@'+version)
        })

      //initialize the api... but what about the api's permissions?

      if(layer.init) {
        var API = this.api()
        layer.api = layer.init.call(API, API)
      }

      layers.push(layer)

      return this
    },

    manifest: function () {
      console.log(layers.map(_pluck('manifest')))
      return merge(layers.map(function (layer) {
        if(layer.core) return layer.manifest
        var o = {}
        o[layer.name] = layer.manifest
        return o
      }))
    }
  }

}

