const mcache = require('memory-cache')

/**
 * Cache middleware
 * Caches the response for a period of time
 *
 * Uses memory cache (RAM)
 *
 * Modify res.locals.expire to control the seconds of the cache
 * res.locals.expire = 0 will prevent caching the response
 *
 * @param seconds
 * @param type default = json
 * @return {function(*, *, *)}
 */
module.exports = function(seconds, type = 'json') {
  return (req, res, next) => {
    let key = req.originalUrl
    let cachedBody = mcache.get(key)
    res.type(type)

    if (cachedBody) {
      let body = JSON.parse(cachedBody) // we know that is json
      if (body.error) res.status(400)

      res.send(cachedBody)
      return
    }

    res.sendResponse = res.send
    res.send = (body) => {

      let time = seconds
      if (typeof res.locals.expire != 'undefined')
        time = parseInt(res.locals.expire)

      if (time > 0) {
        mcache.put(key, body, time * 1000) //ms
        //res.header('cache-control', 'max-age=' + time) browser was not clearing cache right :/
      }

      res.sendResponse(body)
    }
    next()
  }
}