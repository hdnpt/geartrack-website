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
  var inserted = $(this).val().replace(/[^\x00-\x7F]/, '') // remove non asci chars

  $(this).val(inserted) // update the input

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

  var ending = trackEntity.id.charAt(trackEntity.id.length - 2)
    + trackEntity.id.charAt(trackEntity.id.length - 1)

  switch (trackEntity.id.charAt(0)) {
    case 'A':
      if (/^A[0-9]+$/.test(trackEntity.id)) {
        loadDoubleAliProvider(elBody, trackEntity, 'track24', 'track17', false)
        notifyNewId(trackEntity.id)
      } else {
        loadAliProvider(elBody, trackEntity, 'yanwen', false)
      }
      break
    case 'B':
      if (ending == 'CN') {
        loadDoubleAliProvider(elBody, trackEntity, 'track24', 'cainiao', false)
      } else {
        loadTripleAliProvider(elBody, trackEntity, 'track24', 'cainiao', 'track17', false)
        notifyNewId(trackEntity.id)
      }

      break
    case 'C':
      loadDoubleAliProvider(elBody, trackEntity, 'track24', 'trackchinapost', true)
      notifyNewId(trackEntity.id)
      break
    case 'D':
      if (ending == 'PT') {
        loadCttProvider(elBody, trackEntity)
      } else {
        loadDoubleAliProvider(elBody, trackEntity, 'track24', 'track17', false)
        notifyNewId(trackEntity.id)
      }

      break
    case 'I':
      loadAliProvider(elBody, trackEntity, 'winit', false)
      break
    case 'E':
      if (trackEntity.id.charAt(1) == 'Y') {
        loadDoubleAliProvider(elBody, trackEntity, 'track24', 'track17', false)
        notifyNewId(trackEntity.id)
      } else if (ending == 'PT') {
        loadCttProvider(elBody, trackEntity)
      } else {
        loadDoubleAliProvider(elBody, trackEntity, 'track24', 'track17', false)
        notifyNewId(trackEntity.id)
      }
      break
    case 'N':
    case 'L':
      if (/^L.+CN$/.test(trackEntity.id)) {
        loadAliProvider(elBody, trackEntity, 'cainiao')
      } else if (/^L.+PT$/.test(trackEntity.id)) {
        loadCttProvider(elBody, trackEntity)
      } else if (/^LP.+$/.test(trackEntity.id)) {
        loadYanwen(elBody, trackEntity)
      } else if (/^LA.+$/.test(trackEntity.id)) {
        loadDoubleAliProvider(elBody, trackEntity, 'track24', 'track17', false)
        notifyNewId(trackEntity.id)
      } else if (/^LV.+$/.test(trackEntity.id)) {
        loadNetherlandsPost(elBody, trackEntity)
      } else if(/^NL.+$/.test(trackEntity.id)) {
        loadNetherlandsPost(elBody, trackEntity)
      } else {
        loadDoubleAliProvider(elBody, trackEntity, 'track24', 'track17', false)
        notifyNewId(trackEntity.id)
      }
      break
    case 'S':
    case 'G':
      if (/^SB.+/.test(trackEntity.id)) {
        loadSBSwitzerlandPost(elBody, trackEntity)
      } else if (/^S\d+/.test(trackEntity.id)) {
        loadAliProvider(elBody, trackEntity, 'cainiao', false)
      } else if (/^SY[a-zA-Z0-9]+$/.test(trackEntity.id)) {
        loadSkyAndAliProvider(elBody, trackEntity, 'track24')
      } else if (/^GE.+$/.test(trackEntity.id)) {
        loadNetherlandsPost(elBody, trackEntity)
      } else {
        loadDoubleAliProvider(elBody, trackEntity, 'track24', 'track17', false)
        notifyNewId(trackEntity.id)
      }
      break
    case 'P':
      if (/^PQ.+$/.test(trackEntity.id)) {
        loadSpainExpress(elBody, trackEntity)
      } else {
        loadDoubleAliProvider(elBody, trackEntity, 'track24', 'track17', false)
        notifyNewId(trackEntity.id)
      }

      break
    case 'K':
      loadDoubleAliProvider(elBody, trackEntity, 'track24', 'track17', false)
      notifyNewId(trackEntity.id)
      break
    case 'U':
      if (/^UPA.+$/.test(trackEntity.id)) {
        loadAliProvider(elBody, trackEntity, 'pitneybowes', false)
      } else if (/^U[a-zA-Z0-9]+SE$/.test(trackEntity.id)) {
        loadAliProvider(elBody, trackEntity, 'directlink', false)
      } else if (/^U.+YP$/.test(trackEntity.id)) {
        loadYanwen(elBody, trackEntity)
      } else {
        loadDoubleAliProvider(elBody, trackEntity, 'track24', 'track17', false)
        notifyNewId(trackEntity.id)
      }
      break
    case 'R': // Aliexpress
      switch (ending) {
        case 'MY':
          loadAliProvider(elBody, trackEntity, 'malaysiaPos', true)
          break
        case 'SE':
          loadAliProvider(elBody, trackEntity, 'directlink', true)
          break
        case 'CN':
          loadAliProvider(elBody, trackEntity, 'trackchinapost', true)
          break
        case 'NL':
          loadAliProvider(elBody, trackEntity, 'postNL', true)
          break
        case 'PT':
          loadCttProvider(elBody, trackEntity)
          break
        case 'HU':
          loadDoubleAliProvider(elBody, trackEntity, 'track24', 'track17', true)
          notifyNewId(trackEntity.id)
          break
        case 'DE':
          loadDoubleAliProvider(elBody, trackEntity, 'track24', 'track17', true)
          notifyNewId(trackEntity.id)
          break
        case 'AT':
          loadDoubleAliProvider(elBody, trackEntity, 'track24', 'track17', true)
          notifyNewId(trackEntity.id)
          break
        case 'GB':
          loadDoubleAliProvider(elBody, trackEntity, 'track24', 'track17', false)
          notifyNewId(trackEntity.id)
          break
        case 'LA':
          loadDoubleAliProvider(elBody, trackEntity, 'track24', 'track17', true)
          notifyNewId(trackEntity.id)
          break
        case 'IN':
          loadAliProvider(elBody, trackEntity, 'ips', true)
          break
        case 'SG':
          loadAliProvider(elBody, trackEntity, 'singpost', true)
          break
        default:
          loadDoubleAliProvider(elBody, trackEntity, 'track24', 'track17', true)
          notifyNewId(trackEntity.id)
      }
      break
    case 'Q':
      if (/^Q.+X$/.test(trackEntity.id)) {
        loadGBSweden(elBody, trackEntity)
      } else {
        loadDoubleAliProvider(elBody, trackEntity, 'track24', 'track17', false)
        notifyNewId(trackEntity.id)
      }

      break
    case 'Y':
      if (trackEntity.id.charAt(1) == 'T') {
        loadDoubleAliProvider(elBody, trackEntity, 'track24', 'track17', false)
        notifyNewId(trackEntity.id)
      } else {
        loadAliProvider(elBody, trackEntity, 'yanwen', false)
      }
      break
    case 'H':
      loadDoubleAliProvider(elBody, trackEntity, 'track24', 'track17', false)
      notifyNewId(trackEntity.id)
      break
    default: // all numbers
      if (/^\d+$/.test(trackEntity.id)) {
        loadNumbersMultiple(elBody, trackEntity)
      } else {
        notifyNewId(trackEntity.id)
        loadDoubleAliProvider(elBody, trackEntity, 'track24', 'track17', false)
      }

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

function loadSkyAndAliProvider (elBody, trackEntity, provider) {
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

  getProviderData(provider, trackEntity.id).then(function (data) {
    if (provider == 'cainiao' && data.states.length == 0) {
      alicontainer.append(cainiaoEmpty(data))
    } else {
      alicontainer.append(aliExpressTemplate(data))
    }

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

function loadTripleAliProvider (elBody, trackEntity, provider1, provider2, provider3, showCtt) {
  if (typeof (showCtt) === 'undefined') showCtt = true

  // Make both requests at the same time
  var total = showCtt ? 4 : 3,
    count = 0

  var alicontainer = elBody.find('.c-aligeneral'),
    alicontainer2 = elBody.find('.c-aligeneral2'),
    alicontainer3 = elBody.find('.c-aligeneral3'),
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

  getProviderData(provider3, trackEntity.id).then(function (data) {
    if (provider3 == 'cainiao' && data.states.length == 0) {
      alicontainer3.append(cainiaoEmpty(data))
    } else {
      alicontainer3.append(aliExpressTemplate(data))
    }

    if (++count == total) removeLoading(elBody)
  }).catch(function (error) {
    alicontainer3.append(failedTemplate(error.responseJSON))
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
  var total = 6,
    count = 0,
    success = 0

  var alicontainer = elBody.find('.c-aligeneral2'),
    aliContainer2 = elBody.find('.c-aligeneral3'),
    aliContainer4 = elBody.find('.c-aligeneral4'),
    aliContainerG = elBody.find('.c-aligeneral'),
    aliContainer5 = elBody.find('.c-aligeneral5'),
    cttContainer = elBody.find('.c-ctt')

  getProviderData('yanwen', trackEntity.id).then(function (data) {
    alicontainer.append(aliExpressTemplate(data))
    success++
    removeLoading(elBody)
    if (++count == total) failed()
  }).catch(function (error) {
    if (++count == total) failed()
  })

  getProviderData('cainiao', trackEntity.id).then(function (data) {
    if (data.states.length > 0) {
      aliContainer2.append(aliExpressTemplate(data))
      success++
      removeLoading(elBody)
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
    removeLoading(elBody)
    if (++count == total) failed()
  }).catch(function (error) {
    if (++count == total) failed()
  })

  getProviderData('dhl', trackEntity.id).then(function (data) {
    alicontainer.append(aliExpressTemplate(data))
    success++
    removeLoading(elBody)
    if (++count == total) failed()
  }).catch(function (error) {
    if (++count == total) failed()
  })

  getProviderData('mrw', trackEntity.id).then(function (data) {
    alicontainer.append(aliExpressTemplate(data))
    success++
    removeLoading(elBody)
    if (++count == total) failed()
  }).catch(function (error) {
    if (++count == total) failed()
  })

  getProviderData('track24', trackEntity.id).then(function (data) {
    aliContainer4.append(aliExpressTemplate(data))
    success++
    removeLoading(elBody)
    if (++count == total) failed()
  }).catch(function (error) {
    if (++count == total) failed()
  })

  function failed () {
    if (success == 0) {
      notifyNewId(trackEntity.id)
      aliContainerG.append(failedTemplate({
        provider: 'Nenhum tracker com informação',
        color: 'primary',
        error: 'Não foi encontrado nenhum tracking com informação para esse ID. <br> Fala connosco no Facebook para adicionarmos!',
        link: 'https://www.facebook.com/geartrackpt'
      }))
    }


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

// save unsuported ids to add later
function notifyNewId (id) {
  return $.post('https://gearids.hdn.pt/save', {id: id}).done(function (res) {
    // console.log(res)
  })
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

  // try to load some info from track24 and 17track for unknown ids
  return true
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
  if (tracks.length == 1) { //filter was not working for 1 element
    tracks = []
  } else {
    tracks = tracks.filter(function (t) {
      return t.id !== id
    })
  }

  localStorage.removeItem('#' + id)
}

function storageLoadAll () {
  for (var i = 0; i < localStorage.length; i++) {
    var key = localStorage.key(i)

    if (key.charAt(0) === '#') {
      if (/^[#a-zA-Z0-9]+$/.test(key)) {
        //we only load valid ids
        tracks.push(JSON.parse(localStorage.getItem(key)))
      } else {
        // not valid id, remove
        localStorage.removeItem(key)
      }
    }
  }
}
