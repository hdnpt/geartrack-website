/**
 * SORRY BRO, THIS CODE IS A MESS!
 * I NEED TO FIND TIME TO CONVERT THIS TO REACT!
 */
'use strict'

/*
 |--------------------------------------------------------------------------
 | Global vars
 |--------------------------------------------------------------------------
 */
var form = $('#controlForm'),
  shippingId = $('#shipping_id'),
  content = $('#content'),
  popup = $('#addTrack'),
  description = $('#description'),
  trackEntries = $('#track-entries'),
  emptyList = $('#emptyList'),
  info = $('#info'),
  jumbotron = $('#hide-info')

var tracks = []

/*
 |--------------------------------------------------------------------------
 | Templates
 |--------------------------------------------------------------------------
 */
var trackEntryTemplate = Handlebars.compile($('#track-list-template').html()),
  trackContentTemplate = Handlebars.compile($('#track-content-template').html()),
  skyTemplate = Handlebars.compile($('#sky-template').html()),
  correosTemplate = Handlebars.compile($('#correos-template').html()),
  correosOldTemplate = Handlebars.compile($('#correos-old-template').html()),
  adicionalTemplate = Handlebars.compile($('#adicional-template').html()),
  expresso24Template = Handlebars.compile($('#expresso24-template').html()),
  cttTemplate = Handlebars.compile($('#ctt-template').html()),
  aliExpressTemplate = Handlebars.compile($('#ali-template').html()),
  failedTemplate = Handlebars.compile($('#failed-template').html()),
  cainiaoEmpty = Handlebars.compile($('#cainiao-empty-template').html())

/*
 |--------------------------------------------------------------------------
 | Page functionality
 |--------------------------------------------------------------------------
 */
storageLoadAll()
addAllTracksToPage()

var help_block2 = $('#help_block'),
  form_group = shippingId.parent('.form-group')

shippingId.on('input paste', function () {
  var inserted = $(this).val()

  if (inserted.length == 0) {
    form_group.toggleClass('has-success', false)
    form_group.toggleClass('has-error', false)
    help_block2.hide()
    return
  }

  if (isValidID(inserted)) {
    form_group.toggleClass('has-error', false)
    form_group.toggleClass('has-success', true)
    help_block2.hide()
  } else {
    form_group.toggleClass('has-success', false)
    form_group.toggleClass('has-error', true)
    help_block2.show()
  }
})

/**
 * Add track
 */
form.submit(function (event) {
  event.preventDefault()

  var id = shippingId.val().trim().toUpperCase(),
    desc = description.val().trim()

  if (!isValidID(id) || desc.length == 0) {
    alert('Tem de inserir um ID válido e uma descrição.')
    return
  }

  var track = new Track(id, capitalizeFirstLetter(desc))

  if (storageAddTrack(track)) { // new one
    loadTrackToContent(track)
    tracks.push(track)
  } else {
    alert('Esse id já foi adicionado!')
  }

  form_group.toggleClass('has-success', false)
  help_block2.hide()

  shippingId.val('')
  description.val('')
  popup.modal('hide')
})

/**
 * Remove track
 * Event listener for the remove functionality
 * catches dynamically added elements aswell
 */
$(document).on('click', '.remove', function (e) {
  e.preventDefault()

  var id = $(this).data('id')
  $(this).closest('li').remove()
  $('#' + id).remove()

  storageRemoveTrack(id)

  if (tracks.length == 0) {
    info.show()
    jumbotron.show()
    localStorage.removeItem('info5')
    emptyList.show()
  }
})

if (localStorage.getItem('info5') == null) {
  jumbotron.show()
}

$('#hide-button').click(function (e) {
  e.preventDefault()

  jumbotron.hide()
  localStorage.setItem('info5', 0)
})

/*
 |--------------------------------------------------------------------------
 | Content info logic
 |--------------------------------------------------------------------------
 */
function loadTrackToContent (trackEntity) {
  addEntryToPage(trackEntity)
  addEntryToContent(trackEntity)

  var elId = $('#' + trackEntity.id),
    elBody = elId.find('.panel-body')

  switch (trackEntity.id.charAt(0)) {
    case 'A':
      loadAliProvider(elBody, trackEntity, 'yanwen', false)
      break
    case 'C':
      loadDoubleAliProvider(elBody, trackEntity, 'track24', 'trackchinapost', true)
      break
    case 'B':
      loadDoubleAliProvider(elBody, trackEntity, 'track24', 'cainiao', false)
      break
    case 'I':
      loadAliProvider(elBody, trackEntity, 'winit', false)
      break
    case 'E':
      if (trackEntity.id.charAt(1) == 'Y') {
        loadAliProvider(elBody, trackEntity, 'track24', false)
      } else {
        loadCttProvider(elBody, trackEntity)
      }

      break
    case 'N':
    case 'L':
      if (/L.+CN$/.test(trackEntity.id)) {
        loadAliProvider(elBody, trackEntity, 'cainiao')
      } else if (/L.+PT$/.test(trackEntity.id)) {
        loadCttProvider(elBody, trackEntity)
      } else if (trackEntity.id.indexOf('LP') !== -1) {
        loadYanwen(elBody, trackEntity)
      } else if (/LA.+$/.test(trackEntity.id)) {
        loadAliProvider(elBody, trackEntity, 'track24', false)
      } else {
        loadNetherlandsPost(elBody, trackEntity)
      }
      break
    case 'S':
    case 'G':
      if (/SB.+/.test(trackEntity.id)) {
        loadSBSwitzerlandPost(elBody, trackEntity)
      } else if (/S\d+/.test(trackEntity.id)) {
        loadAliProvider(elBody, trackEntity, 'cainiao', false)
      } else {
        loadNetherlandsPost(elBody, trackEntity)
      }
      break
    case 'P':
      loadSpainExpress(elBody, trackEntity)
      break
    case 'U':
      if (/UPA.+$/.test(trackEntity.id)) {
        loadAliProvider(elBody, trackEntity, 'pitneybowes', false)
      } else {
        loadYanwen(elBody, trackEntity)
      }
      break
    case 'R': // Aliexpress
      var ending = trackEntity.id.charAt(trackEntity.id.length - 2)
        + trackEntity.id.charAt(trackEntity.id.length - 1)
      switch (ending) {
        case 'MY':
          loadAliProvider(elBody, trackEntity, 'malaysiaPos')
          break
        case 'SE':
          loadAliProvider(elBody, trackEntity, 'directlink')
          break
        case 'CN':
          loadAliProvider(elBody, trackEntity, 'trackchinapost')
          break
        case 'NL':
          loadAliProvider(elBody, trackEntity, 'postNL')
          break
        case 'PT':
          loadCttProvider(elBody, trackEntity)
          break
        case 'HU':
          loadAliProvider(elBody, trackEntity, 'track24', false)
          break
        case 'AT':
          loadAliProvider(elBody, trackEntity, 'track24', false)
          break
        case 'GB':
          loadAliProvider(elBody, trackEntity, 'track24', false)
          break
        default:
          loadAliProvider(elBody, trackEntity, 'singpost')
      }

      break
    case 'Q':
      loadGBSweden(elBody, trackEntity)
      break
    case 'Y':
      if (trackEntity.id.charAt(1) == 'T') {
        loadAliProvider(elBody, trackEntity, 'track24', false)
      } else {
        loadAliProvider(elBody, trackEntity, 'yanwen', false)
      }
      break
    case 'H':
      loadAliProvider(elBody, trackEntity, 'track24', false)
      break
    default: // all numbers
      loadNumbersMultiple(elBody, trackEntity)
      break
  }
}

/*
 |--------------------------------------------------------------------------
 | Gearbest
 |--------------------------------------------------------------------------
 */
function loadSpainExpress (elBody, trackEntity) {
  // Make 4 requests at the same time
  var total = 5,
    count = 0

  var skyContainer = elBody.find('.c-sky'),
    panasiaContainer = elBody.find('.c-panasia'),
    correosESContainer = elBody.find('.c-correoses'),
    correosContainer = elBody.find('.c-correos'),
    correosOldContainer = elBody.find('.c-correos-old'),
    expresso24Container = elBody.find('.c-expresso24'),
    adicionalContainer = elBody.find('.c-adicional')

  getProviderData('sky', trackEntity.id)
  .then(function (skyData) {
    skyContainer.append(skyTemplate(skyData))
    if (++count == total) removeLoading(elBody)
  })
  .catch(function (error) {
    skyContainer.append(failedTemplate(error.responseJSON))
    if (++count == total) removeLoading(elBody)
  })

  getProviderData('panasia', trackEntity.id)
  .then(function (skyData) {
    panasiaContainer.append(aliExpressTemplate(skyData))
    skyContainer.hide()
    if (++count == total) removeLoading(elBody)
  })
  .catch(function (error) {
    if (skyContainer.children().length == 0) // only show failed when we dont have sky
      panasiaContainer.append(failedTemplate(error.responseJSON))

    if (++count == total) removeLoading(elBody)
  })

  getProviderData('correoses', trackEntity.id)
  .then(function (correosData) {
    correosESContainer.append(aliExpressTemplate(correosData))
    if (++count == total) removeLoading(elBody)
  })
  .catch(function (error) {
    correosESContainer.append(failedTemplate(error.responseJSON))
    if (++count == total) removeLoading(elBody)
  })

  getCorreosData(trackEntity.id, trackEntity.postalcode)
  .then(function (correosData) {
    correosContainer.append(correosTemplate(correosData))

    if (++count == total) removeLoading(elBody)
  })
  .catch(function (error) {
    correosContainer.append(failedTemplate(error.responseJSON))
    if (++count == total) removeLoading(elBody)
  })

  getCorreosOldData(trackEntity.id, trackEntity.postalcode)
  .then(function (correosData) {
    correosOldContainer.append(correosOldTemplate(correosData))

    if (++count == total) removeLoading(elBody)
    getProviderData('expresso24', correosData.product.ref)
    .then(function (expressoInfo) { // load expresso24 before adicional
      expresso24Container.append(expresso24Template(expressoInfo))
      //if (++count == total) removeLoading(elBody)
    })
    .catch(function (error) {
      expresso24Container.append(failedTemplate(error.responseJSON))
      //if (++count == total) removeLoading(elBody)
    })

    getAdicionalData(correosData.id, trackEntity.postalcode)
    .then(function (adicionalData) {
      // Hide the second phone if is the same
      if (adicionalData.phone2 == adicionalData.phone1)
        adicionalData.phone2 = null

      if (adicionalData.status == 'DESCARTADO') {
        adicionalContainer.append(failedTemplate({
          provider: 'Adicional',
          error: 'Estado descartado.'
        }))
      } else {
        adicionalContainer.append(adicionalTemplate(adicionalData))
      }

    })
    .catch(function (error) {
      adicionalContainer.append(failedTemplate(error.responseJSON))
    })

  })
  .catch(function (error) {
    correosContainer.append(failedTemplate(error.responseJSON))
    if (++count == total) removeLoading(elBody)
  })
}

function loadNetherlandsPost (elBody, trackEntity) {
  var skyContainer = elBody.find('.c-sky')

  getProviderData('sky', trackEntity.id).then(function (data) { // add sky response to the page
    skyContainer.append(skyTemplate(data))
    removeLoading(elBody)
  }).catch(function (error) {
    skyContainer.append(failedTemplate(error.responseJSON))
    removeLoading(elBody)
  })
}

function loadSBSwitzerlandPost (elBody, trackEntity) {
  // Make both requests at the same time
  var total = 2,
    count = 0

  var alicontainer = elBody.find('.c-aligeneral'),
    skyContainer = elBody.find('.c-sky')

  getProviderData('sky', trackEntity.id).then(function (data) { // add sky response to the page
    skyContainer.append(skyTemplate(data))
    if (++count == total) removeLoading(elBody)
  }).catch(function (error) {
    skyContainer.append(failedTemplate(error.responseJSON))
    if (++count == total) removeLoading(elBody)
  })

  getProviderData('cjah', trackEntity.id).then(function (data) {
    alicontainer.append(aliExpressTemplate(data))
    if (++count == total) removeLoading(elBody)
  }).catch(function (error) {
    alicontainer.append(failedTemplate(error.responseJSON))
    if (++count == total) removeLoading(elBody)
  })
}

/*
 |--------------------------------------------------------------------------
 | Aliexpress
 |--------------------------------------------------------------------------
 */
function loadAliProvider (elBody, trackEntity, provider, showCtt, showFailedTemplateOnError) {
  if (typeof (showCtt) === 'undefined') showCtt = true
  if (typeof (showFailedTemplateOnError) === 'undefined') showFailedTemplateOnError = true

  // Make both requests at the same time
  var total = showCtt ? 2 : 1,
    count = 0

  var alicontainer = elBody.find('.c-aligeneral'),
    cttContainer = elBody.find('.c-ctt')

  if (showCtt) {
    getProviderData('ctt', trackEntity.id).then(function (data) {
      cttContainer.append(cttTemplate(data))
      if (++count == total) removeLoading(elBody)
    }).catch(function (error) {
      if (showFailedTemplateOnError)
        cttContainer.append(failedTemplate(error.responseJSON))
      if (++count == total) removeLoading(elBody)
    })
  }

  getProviderData(provider, trackEntity.id).then(function (data) {
    if (provider == 'cainiao' && data.states.length == 0) {
      alicontainer.append(cainiaoEmpty(data))
    } else {
      alicontainer.append(aliExpressTemplate(data))
    }

    if (++count == total) removeLoading(elBody)
  }).catch(function (error) {
    if (showFailedTemplateOnError)
      alicontainer.append(failedTemplate(error.responseJSON))
    if (++count == total) removeLoading(elBody)
  })
}

function loadGBSweden (elBody, trackEntity) {
  var total = 2, count = 0

  var alicontainer = elBody.find('.c-aligeneral'),
    cttContainer = elBody.find('.c-ctt'),
    skyContainer = elBody.find('.c-sky')

  getProviderData('sky', trackEntity.id).then(function (data) {
    skyContainer.append(skyTemplate(data))
    if (++count == total) removeLoading(elBody)
  }).catch(function (error) {
    skyContainer.append(failedTemplate(error.responseJSON))
    if (++count == total) removeLoading(elBody)
  })

  getProviderData('directlink', trackEntity.id).then(function (data) {
    alicontainer.append(aliExpressTemplate(data))

    getProviderData('ctt', data.id).then(function (data2) {
      cttContainer.append(cttTemplate(data2))
    }).catch(function (error) {
      cttContainer.append(failedTemplate(error.responseJSON))
    })

    if (++count == total) removeLoading(elBody)
  }).catch(function (error) {
    alicontainer.append(failedTemplate(error.responseJSON))
    if (++count == total) removeLoading(elBody)
  })

}

function loadCttProvider (elBody, trackEntity) {
  var cttContainer = elBody.find('.c-ctt')

  getProviderData('ctt', trackEntity.id).then(function (data) {
    cttContainer.append(cttTemplate(data))
    removeLoading(elBody)
  }).catch(function (error) {
    cttContainer.append(failedTemplate(error.responseJSON))
    removeLoading(elBody)
  })
}

/*
 |--------------------------------------------------------------------------
 | Yanwen provider
 |--------------------------------------------------------------------------
 */
function loadYanwen (elBody, trackEntity) {
  // Make both requests at the same time
  var total = 2,
    count = 0

  var alicontainer = elBody.find('.c-aligeneral2'),
    aliContainer2 = elBody.find('.c-aligeneral3'),
    cttContainer = elBody.find('.c-ctt')

  getProviderData('yanwen', trackEntity.id).then(function (data) {
    alicontainer.append(aliExpressTemplate(data))
    if (++count == total) removeLoading(elBody)
  }).catch(function (error) {
    alicontainer.append(failedTemplate(error.responseJSON))
    if (++count == total) removeLoading(elBody)
  })

  getProviderData('cainiao', trackEntity.id).then(function (data) {
    if (data.states.length > 0) {
      aliContainer2.append(aliExpressTemplate(data))
    }

    if (++count == total) removeLoading(elBody)

    if (data.destinyId) {
      getProviderData('ctt', data.destinyId).then(function (data) {
        cttContainer.append(cttTemplate(data))
      }).catch(function (error) {
      })
    }
  }).catch(function (error) {
    aliContainer2.append(failedTemplate(error.responseJSON))
    if (++count == total) removeLoading(elBody)
  })
}

function loadDoubleAliProvider (elBody, trackEntity, provider1, provider2, showCtt) {
  if (typeof (showCtt) === 'undefined') showCtt = true

  // Make both requests at the same time
  var total = showCtt ? 3 : 2,
    count = 0

  var alicontainer = elBody.find('.c-aligeneral'),
    alicontainer2 = elBody.find('.c-aligeneral2'),
    cttContainer = elBody.find('.c-ctt')

  if (showCtt) {
    getProviderData('ctt', trackEntity.id).then(function (data) {
      cttContainer.append(cttTemplate(data))
      if (++count == total) removeLoading(elBody)
    }).catch(function (error) {
      cttContainer.append(failedTemplate(error.responseJSON))
      if (++count == total) removeLoading(elBody)
    })
  }

  getProviderData(provider1, trackEntity.id).then(function (data) {
    if (provider1 == 'cainiao' && data.states.length == 0) {
      alicontainer.append(cainiaoEmpty(data))
    } else {
      alicontainer.append(aliExpressTemplate(data))
    }

    if (++count == total) removeLoading(elBody)
  }).catch(function (error) {
    alicontainer.append(failedTemplate(error.responseJSON))
    if (++count == total) removeLoading(elBody)
  })

  getProviderData(provider2, trackEntity.id).then(function (data) {
    if (provider2 == 'cainiao' && data.states.length == 0) {
      alicontainer2.append(cainiaoEmpty(data))
    } else {
      alicontainer2.append(aliExpressTemplate(data))
    }

    if (++count == total) removeLoading(elBody)
  }).catch(function (error) {
    alicontainer2.append(failedTemplate(error.responseJSON))
    if (++count == total) removeLoading(elBody)
  })
}

/*
 |--------------------------------------------------------------------------
 | Multiple (All numbers)
 |--------------------------------------------------------------------------
 */
function loadNumbersMultiple (elBody, trackEntity) {
// Make both requests at the same time
  var total = 5,
    count = 0,
    success = 0

  var alicontainer = elBody.find('.c-aligeneral2'),
    aliContainer2 = elBody.find('.c-aligeneral3'),
    aliContainer4 = elBody.find('.c-aligeneral4'),
    aliContainerG = elBody.find('.c-aligeneral'),
    cttContainer = elBody.find('.c-ctt')

  getProviderData('yanwen', trackEntity.id).then(function (data) {
    alicontainer.append(aliExpressTemplate(data))
    success++
    if (++count == total) failed()
  }).catch(function (error) {
    if (++count == total) failed()
  })

  getProviderData('cainiao', trackEntity.id).then(function (data) {
    if (data.states.length > 0) {
      aliContainer2.append(aliExpressTemplate(data))
      success++
    }

    if (++count == total) failed()

    if (data.destinyId) {
      getProviderData('ctt', data.destinyId).then(function (data) {
        cttContainer.append(cttTemplate(data))
      }).catch(function (error) {
      })
    }
  }).catch(function (error) {
    if (++count == total) failed()
  })

  getProviderData('trackchinapost', trackEntity.id).then(function (data) {
    aliContainerG.append(aliExpressTemplate(data))
    success++
    if (++count == total) failed()
  }).catch(function (error) {
    if (++count == total) failed()
  })

  getProviderData('dhl', trackEntity.id).then(function (data) {
    alicontainer.append(aliExpressTemplate(data))
    success++
    if (++count == total) failed()
  }).catch(function (error) {
    if (++count == total) failed()
  })

  getProviderData('track24', trackEntity.id).then(function (data) {
    aliContainer4.append(aliExpressTemplate(data))
    success++
    if (++count == total) failed()
  }).catch(function (error) {
    if (++count == total) failed()
  })

  function failed () {
    if (success == 0)
      aliContainerG.append(failedTemplate({
        provider: 'Sem informação',
        error: 'Não foi encontrado nenhum tracking com informação sobre esse ID. <br> Fale connosco no Facebook para adicionarmos!'
      }))

    removeLoading(elBody)
  }
}

/*
 |--------------------------------------------------------------------------
 | Get Api data
 |--------------------------------------------------------------------------
 */
function getProviderData (provider, id) {
  return $.getJSON('/api/' + provider, {id: id})
}

function getCorreosData (id, code) {
  return $.getJSON('/api/correos', {id: id, postalcode: code})
}

function getCorreosOldData (id, code) {
  return $.getJSON('/api/correosOld', {id: id, postalcode: code})
}

function getAdicionalData (adicionalID, code) {
  return $.getJSON('/api/adicional', {id: adicionalID, postalcode: code})
}

/*
 |--------------------------------------------------------------------------
 | Page Modifications
 |--------------------------------------------------------------------------
 */
function addEntryToPage (trackEntity) {
  emptyList.hide()
  trackEntries.prepend(trackEntryTemplate({
    description: trackEntity.description,
    id: trackEntity.id,
    postalcode: trackEntity.postalcode
  }))
}

function addEntryToContent (trackEntity) {
  info.hide()
  content.prepend(trackContentTemplate({
    description: trackEntity.description,
    id: trackEntity.id
  }))
}

function addAllTracksToPage () {
  tracks.forEach(function (track) {
    loadTrackToContent(track)
  })
}

function removeLoading (elem) {
  elem.find('.center-img').remove()
}
/*
 |--------------------------------------------------------------------------
 | Entities
 |--------------------------------------------------------------------------
 */
function Track (id, desc) {
  this.id = id
  this.postalcode = this.getPostalCode()
  this.description = desc
}

Track.prototype.getPostalCode = function () {
  if (!this.isPQ()) return null

  var code = ''

  for (var i = this.id.length - 1, max = 0; i >= 0 && max < 4; i--) {
    var char = this.id.charAt(i)

    if (char >= '0' && char <= '9') {
      code = char + code
      max++
    }
  }

  return code
}

Track.prototype.isPQ = function () {
  return this.id.charAt(0) == 'P'
}

/*
 |--------------------------------------------------------------------------
 | Utils
 |--------------------------------------------------------------------------
 */
/**
 * Like sprintf
 * "{0} is dead, but {1} is alive! {0} {2}".format("ASP", "ASP.NET")
 * ASP is dead, but ASP.NET is alive! ASP {2}
 */
if (!String.prototype.format) {
  String.prototype.format = function () {
    var args = arguments
    return this.replace(/{(\d+)}/g, function (match, number) {
      return typeof args[number] != 'undefined'
        ? args[number]
        : match

    })
  }
}

function capitalizeFirstLetter (string) {
  return string.charAt(0).toUpperCase() + string.slice(1)
}

function isValidID (id) {
  if (id.length < 3) return false

  var allowedFormats = [
    /^AA[a-zA-Z0-9]+YN$/,
    /^PQ[a-zA-Z0-9]+$/,
    /^NL[a-zA-Z0-9]+$/,
    /^GE[a-zA-Z0-9]+$/,
    /^LV[a-zA-Z0-9]+$/,
    /^LP[a-zA-Z0-9]+$/,
    /^BZ[a-zA-Z0-9]+CN$/,
    /^CP[a-zA-Z0-9]+CN$/,
    /^HK[a-zA-Z0-9]+AM$/,
    /^R[a-zA-Z0-9]+SG$/,
    /^R[a-zA-Z0-9]+MY$/,
    /^R[a-zA-Z0-9]+SE$/,
    /^R[a-zA-Z0-9]+CN$/,
    /^R[a-zA-Z0-9]+NL$/,
    /^R[a-zA-Z0-9]+HU$/,
    /^R[a-zA-Z0-9]+AT$/,
    /^R[a-zA-Z0-9]+PT$/,
    /^R[a-zA-Z0-9]+GB$/,
    /^U[a-zA-Z0-9]+YP$/,
    /^UPA[a-zA-Z0-9]+$/,
    /^Q[a-zA-Z0-9]+XX$/,
    /^SB[a-zA-Z0-9]+$/,
    /^S\d+$/,
    /^SY[a-zA-Z0-9]+$/,
    /^E[a-zA-Z0-9]+PT$/,
    /^EY[a-zA-Z0-9]+$/,
    /^L[a-zA-Z0-9]+PT$/,
    /^LA[a-zA-Z0-9]+$/,
    /^L[a-zA-Z0-9]+CN$/,
    /^Y[a-zA-Z0-9]+$/,
    /^ID[a-zA-Z0-9]+CN$/,
    /^\d+$/
  ]

  for (var i = 0; i < allowedFormats.length; i++) {
    if (allowedFormats[i].test(id))
      return true
  }

  return false
}

function daysAgo (date) {
  var seconds = Math.floor((new Date() - date) / 1000)

  return Math.floor(seconds / 86400) // 60*60*24 1 day in seconds
}

/*
 |--------------------------------------------------------------------------
 | Storage
 |--------------------------------------------------------------------------
 */
function storageAddTrack (trackEntity) {
  if (localStorage.getItem('#' + trackEntity.id) != null)
    return false

  localStorage.setItem('#' + trackEntity.id, JSON.stringify(trackEntity))
  return true
}

function storageRemoveTrack (id) {
  tracks = tracks.filter(function (t) {
    return t.id !== id
  })

  localStorage.removeItem('#' + id)
}

function storageLoadAll () {
  for (var i = 0; i < localStorage.length; i++) {
    var key = localStorage.key(i)

    if (key.charAt(0) === '#') {
      if (!/^[#a-zA-Z0-9]+$/.test(key)) {
        //we only load valid ids
        tracks.push(JSON.parse(localStorage.getItem(key)))
      } else {
        // not valid id, remove
        localStorage.removeItem(key)
      }
    }
  }
}
