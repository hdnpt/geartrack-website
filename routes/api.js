const express = require('express')
const router = express.Router()
const geartrack = require('geartrack')
const mcache = require('memory-cache')
const http = require('http')

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
const cache = (seconds, type = 'json') => {
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

// default cache time - 10 min
const CACHE_TIME = 10 * 60

// All this routes will be cached
// Error responses can manipulate cache time
router.use(cache(CACHE_TIME))

// All common providers, name, cssClass for color
let providers = {
  'sky': new Provider('Sky56', 'primary'),
  'correoses': new Provider('Correos ES', 'yellow'),
  'expresso24': new Provider('Expresso24', 'warning'),
  'singpost': new Provider('Singpost', 'danger'),
  'ctt': new Provider('CTT', 'primary'),
  'directlink': new Provider('Direct Link', 'yellow'),
  'trackchinapost': new Provider('Track China Post', 'danger'),
  'cainiao': new Provider('Cainiao', 'danger'),
  'yanwen': new Provider('Yanwen', 'success'),
  'cjah': new Provider('Cjah Tracking', 'success'),
  'postNL': new Provider('Post NL', 'warning'),
  'malaysiaPos': new Provider('Malasya Pos', 'danger'),
  'winit': new Provider('Winit', 'primary'),
  'panasia': new Provider('Panasia', 'info'),
  'pitneybowes': new Provider('Pitney Bowes', 'primary'),
  'dhl': new Provider('DHL', 'yellow'),
  'track24': new Provider('Track24', 'info'),
  'correos': new Provider('Correos Express Novo', 'danger'),
  'correosOld': new Provider('Correos Express Antigo', 'danger'),
}

/**
 * Adicional data
 */
router.get('/adicional', validateId, validatePostalCode, function (req, res) {
  let id = req.query.id, postalcode = req.query.postalcode

  //return processErrorResponse(new Error('DOWN - '), res, 'Adicional')

  geartrack.adicional.getInfo(id, postalcode, (err, adicionalEntity) => {
    if (err) {
      // sets the status code and the appropriate message
      return processErrorResponse(err, res, 'Adicional')
    }

    res.json(adicionalEntity)
  })
})

/**
 * General providers that only need an id
 */
router.get('/:provider', validateId, function (req, res, next) {
  let id = req.query.id

  let providerObj = providers[req.params.provider]

  if (!providerObj) // no provider found
    return next()

  geartrack[req.params.provider].getInfo(id, (err, entity) => {
    if (err) {
      // sets the status code and the appropriate message
      return processErrorResponse(err, res, providerObj.name)
    }

    entity.provider = providerObj.name // name shown: 'Informação [provider]'
    entity.color = providerObj.cssClass // color of the background, may use bootstrap classes

    res.json(entity)
  })
})

/*
 |--------------------------------------------------------------------------
 | Process Error Response
 |--------------------------------------------------------------------------
 */
function processErrorResponse (err, res, provider) {
  let cacheSeconds = CACHE_TIME // default cache time
  let code = 400
  let message = ''

  let type = getErrorType(err.message)

  switch (type) {
    case 'BUSY':
      message = 'O servidor está sobrecarregado, tente novamente daqui a uns segundos.'
      cacheSeconds = 0 // prevent cache
      break
    case 'UNAVAILABLE':
      message = 'O servidor não está disponível de momento. Tente mais tarde.'
      break
    case 'DOWN':
    case 'EMPTY':
      message = 'De momento este serviço está com problemas. Tente mais tarde.'
      break
    case 'PARSER':
      message = 'De momento estamos com dificuldade em aceder à informação deste servidor. Tente mais tarde.'
      break
    default: // NO_DATA
      message = 'Ainda não existe informação disponível para este ID.'
      break
  }

  res.locals.expire = cacheSeconds
  return res.status(code).json({
    error: message,
    provider: provider
  })
}

function getErrorType (errorMessage) {
  let idx = errorMessage.indexOf(' - ')
  return errorMessage.substring(0, idx)
}

/*
 |--------------------------------------------------------------------------
 | Validation Middlewares
 |--------------------------------------------------------------------------
 */
function validateId (req, res, next) {
  let id = req.query.id

  if (!id) {
    res.status(400).json({error: 'ID must be passed in the query string!'})
    return
  }

  next()
}

function validatePostalCode (req, res, next) {
  let postalcode = req.query.postalcode

  if (!postalcode) {
    res.status(400).json({error: 'Postalcode must be passed in the query string!'})
    return
  }

  next()
}

/*
 |--------------------------------------------------------------------------
 | Utils
 |--------------------------------------------------------------------------
 */
function Provider (name, cssClass) {
  this.name = name
  this.cssClass = cssClass
}

module.exports = router
