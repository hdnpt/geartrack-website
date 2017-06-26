const express = require('express')
const router = express.Router()
const geartrack = require('geartrack')
const roundrobin = require('rr')
const cache = require('../services/cacheMiddleware')

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
  'mrw': new Provider('MRW', 'primary'),
  'ips': new Provider('IPS', 'yellow'),
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

let proxys = []
if (process.env.GEARTRACK_PROXYS) {
  proxys = process.env.GEARTRACK_PROXYS.split(',').map(ip => ip.trim()).filter(ip => ip.length > 0)
}

/**
 * General providers that only need an id
 */
router.get('/:provider', validateId, function (req, res, next) {
  let id = req.query.id

  let providerObj = providers[req.params.provider]

  if (!providerObj) // no provider found
    return next()

  if (req.params.provider == 'track24' && proxys.length > 0) {
    let proxy = roundrobin(proxys)
    let proxyUrl = 'http://' + proxy + '/track24/ajax/tracking118.ajax.php'
    geartrack[req.params.provider].getInfoProxy(id, proxyUrl, providerCallback(res, providerObj))
  } else {
    geartrack[req.params.provider].getInfo(id, providerCallback(res, providerObj))
  }

})

function providerCallback (res, providerObj) {
  return (err, entity) => {
    if (err) {
      // sets the status code and the appropriate message
      return processErrorResponse(err, res, providerObj.name)
    }

    if (entity.constructor &&
      entity.constructor.name &&
      entity.constructor.name == 'SkyInfo' &&
      entity.messages &&
      entity.messages.length == 0 &&
      entity.status &&
      entity.status.length == 0) {
      // Sky has no info
      return processErrorResponse(new Error('DEFAULT - no info'), res, providerObj.name)
    }

    entity.provider = providerObj.name // name shown: 'Informação [provider]'
    entity.color = providerObj.cssClass // color of the background, may use bootstrap classes

    res.json(entity)
  }
}

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
  let bugsnag = res.app.get('bugsnag')

  switch (type) {
    case 'BUSY':
      message = 'O servidor está sobrecarregado, tenta novamente daqui a uns segundos.'
      cacheSeconds = 0 // prevent cache
      break
    case 'UNAVAILABLE':
      message = 'O servidor não está disponível de momento. Tenta mais tarde.'
      break
    case 'DOWN':
    case 'EMPTY':
      message = 'De momento este serviço está com problemas. Tenta mais tarde.'
      break
    case 'PARSER':
      if(bugsnag) bugsnag.notify(err) // send error to be analysed
      message = 'De momento estamos com dificuldade em aceder à informação deste servidor. Tenta mais tarde.'
      break
    case 'ACTION_REQUIRED':
      if(bugsnag) bugsnag.notify(err) // send error to be analysed
      cacheSeconds = 0 // prevent cache
      message = 'Este tracker requere um passo adicional no seu website. Depois de efetuares esse passo volta e atualiza a pagina para tentarmos de novo! :)'
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

function getRandomIntInclusive (min, max) {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min + 1)) + min
}

module.exports = router
