const express = require('express')
const router = express.Router()
const geartrack = require('geartrack')
const roundrobin = require('rr')
const cache = require('../services/cacheMiddleware')

// default cache time - 30 min
const CACHE_TIME = 30 * 60

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
  'track17': new Provider('17track', 'warning')
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
      return processErrorResponse(err, res, {
        provider: 'adicional',
        providerInfo: new Provider('Adicional', 'success'),
        id: id
      })
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
  const id = req.query.id
  const tracker = req.params.provider

  let providerObj = providers[tracker]

  if (!providerObj) // no provider found
    return next()

  if(geartrack[tracker].getInfoProxy && proxys.length > 0) { // this tracker supports proxy requests
    let proxy = roundrobin(proxys)
    let proxyUrl = 'http://' + proxy + '/' + tracker

    geartrack[tracker].getInfoProxy(id, proxyUrl, providerCallback(res, tracker, providerObj, id))
  } else {
    geartrack[tracker].getInfo(id, providerCallback(res, tracker, providerObj, id))
  }
})

function providerCallback (res, tracker, providerObj, id) {
  return (err, entity) => {
    if (err) {
      // sets the status code and the appropriate message
      return processErrorResponse(err, res, {
        provider: tracker,
        providerInfo: providerObj,
        id: id
      })
    }

    if (entity.constructor &&
      entity.constructor.name &&
      entity.constructor.name == 'SkyInfo' &&
      entity.messages &&
      entity.messages.length == 0 &&
      entity.status &&
      entity.status.length == 0) {
      // Sky has no info
      return processErrorResponse(new Error('DEFAULT - no info'), res, {
        provider: tracker,
        providerInfo: providerObj,
        id: id
      })
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
function processErrorResponse (err, res, info) {
  let cacheSeconds = 10 * 60 // error responses are cached for 10 min
  let code = 400
  let message = ''

  let type = getErrorType(err.message)
  let bugsnag = res.app.get('bugsnag')

  switch (type) {
    case 'BUSY':
      message = 'O servidor está sobrecarregado, tenta novamente daqui a um minuto.'
      cacheSeconds = 60 // cache for 1min
      break
    case 'UNAVAILABLE':
      message = 'O servidor não está disponível de momento. Tenta mais tarde.'
      break
    case 'DOWN':
    case 'EMPTY':
      message = 'De momento este serviço está com problemas. Tenta mais tarde.'
      break
    case 'PARSER':
      if(info.provider != 'correosOld' && bugsnag) bugsnag.notify(err) // send error to be analysed
      message = 'De momento estamos com dificuldade em aceder à informação deste servidor. Tenta mais tarde.'
      break
    case 'ACTION_REQUIRED':
      if(bugsnag) bugsnag.notify(err) // send error to be analysed
      cacheSeconds = 0 // prevent cache
      message = 'Este tracker pode precisar de um passo adicional no seu website. Se efetuares esse passo volta e atualiza a pagina para tentarmos de novo! :)'
      break
    default: // NO_DATA
      message = 'Ainda não existe informação disponível para este ID.'
      break
  }

  res.locals.expire = cacheSeconds
  return res.status(code).json({
    error: message,
    provider: info.providerInfo.name,
    link: geartrack[info.provider].getLink(info.id),
    color: info.providerInfo.cssClass // color of the background, may use bootstrap classes
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
