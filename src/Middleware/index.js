'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2015 Harminder Virk
 * MIT Licensed
*/

const _ = require('lodash')
const Ioc = require('adonis-fold').Ioc

let globalMiddleware = []
let namedMiddleware = {}

let Middleware = exports = module.exports = {}

/**
 * @description clears off existing middleware.
 * @method new
 * @return {void}
 * @public
 */
Middleware.new = function () {
  globalMiddleware = []
  namedMiddleware = {}
}

/**
 * @description registers a new middleware under global
 * or named middleware list
 * @method register
 * @param  {String} key
 * @param  {String} namespace
 * @return {void}
 * @public
 */
Middleware.register = function (key, namespace) {
  if (!namespace) {
    globalMiddleware.push(key)
    return
  }
  namedMiddleware[key] = namespace
}

/**
 * @description adds a array of middleware inside global list.
 * use for bulk register
 * @method global
 * @param  {Array} arrayOfMiddleware
 * @return {void}
 * @public
 */
Middleware.global = function (arrayOfMiddleware) {
  globalMiddleware = globalMiddleware.concat(arrayOfMiddleware)
}

/**
 * @description adds an object of middleware to named list.
 * use for bulk register
 * @method named
 * @param  {Object} namedMiddleware
 * @return {void}
 * @public
 */
Middleware.named = function (namedMiddleware) {
  _.each(namedMiddleware, function (namespace, key) {
    Middleware.register(key, namespace)
  })
}

/**
 * @description returns list of global middleware
 * @method getGlobal
 * @return {Array}
 * @public
 */
Middleware.getGlobal = function () {
  return _.unique(globalMiddleware)
}

/**
 * @description returns list of named middleware
 * @method getNamed
 * @return {Object}
 * @public
 */
Middleware.getNamed = function () {
  return namedMiddleware
}

/**
 * @description filter requested middleware from named and
 * global list
 * @method filter
 * @param  {Array} keys
 * @param  {Boolean} callGlobal
 * @return {Array}
 * @public
 */
Middleware.filter = function (keys, callGlobal) {
  const globalMiddleware = Middleware.getGlobal()
  const namedToCall = _.toArray(_.pick(Middleware.getNamed(), keys))
  return callGlobal === true ? globalMiddleware.concat(namedToCall) : namedToCall
}

/**
 * @description resolves an array of middleware namespaces from
 * ioc container
 * @method resolve
 * @param  {Array} middleware
 * @return {Array}
 * @public
 */
Middleware.resolve = function (middleware) {
  return _.map(middleware, function (item) {
    return Ioc.makeFunc(`${item}.handle`)
  })
}

/**
 * @description compose middleware to calls them in sequence.
 * something similar to koa-compose
 * @method compose
 * @param  {Array} middleware
 * @param  {Ojbect} request
 * @param  {Ojbect} response
 * @return {void}
 * @public
 */
Middleware.compose = function (middleware, request, response) {
  function * noop () {}
  return function * (next) {
    next = next || noop()
    let i = middleware.length
    while (i--) {
      const instance = middleware[i].instance
      const method = instance ? middleware[i].instance[middleware[i].method] : middleware[i].method
      next = method.apply(instance, [request, response, next])
    }
    yield * next
  }
}
