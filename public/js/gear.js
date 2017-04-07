/**
 * SORRY BRO, THIS CODE IS A MESS!
 * I NEED TO FIND TIME TO CONVERT THIS TO REACT!
 */

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
var trackEntryTemplate = Handlebars.compile($("#track-list-template").html()),
    trackContentTemplate = Handlebars.compile($("#track-content-template").html()),
    skyTemplate = Handlebars.compile($("#sky-template").html()),
    correosTemplate = Handlebars.compile($("#correos-template").html()),
    correosOldTemplate = Handlebars.compile($("#correos-old-template").html()),
    adicionalTemplate = Handlebars.compile($("#adicional-template").html()),
    expresso24Template = Handlebars.compile($("#expresso24-template").html()),
    cttTemplate = Handlebars.compile($("#ctt-template").html()),
    aliExpressTemplate = Handlebars.compile($("#ali-template").html()),
    failedTemplate = Handlebars.compile($("#failed-template").html())


/*
 |--------------------------------------------------------------------------
 | Page functionality
 |--------------------------------------------------------------------------
 */
storageLoadAll()
addAllTracksToPage()

let help_block2 = $('#help_block'),
    form_group = shippingId.parent('.form-group')

shippingId.on('input paste', function () {
    let inserted = $(this).val()

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
});

/**
 * Add track
 */
form.submit(function (event) {
    event.preventDefault();

    var id = shippingId.val().trim().toUpperCase(),
        desc = description.val().trim()

    if (!isValidID(id) || desc.length == 0) {
        alert("Tem de inserir um ID válido e uma descrição.")
        return
    }

    var track = new Track(id, capitalizeFirstLetter(desc));

    if (storageAddTrack(track)) { // new one
        loadTrackToContent(track)
        tracks.push(track)
    } else {
        alert("Esse id já foi adicionado!")
    }

    form_group.toggleClass('has-success', false)
    help_block2.hide()

    shippingId.val("")
    description.val("")
    popup.modal('hide');
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
        localStorage.removeItem('info3')
        emptyList.show()
    }
});

if (localStorage.getItem('info3') == null) {
    jumbotron.show()
}

$('#hide-button').click(function (e) {
    e.preventDefault()

    jumbotron.hide()
    localStorage.setItem('info3', 0)
})

/*
 |--------------------------------------------------------------------------
 | Content info logic
 |--------------------------------------------------------------------------
 */
function loadTrackToContent(trackEntity) {
    addEntryToPage(trackEntity)
    addEntryToContent(trackEntity)

    var elId = $('#' + trackEntity.id),
        elBody = elId.find('.panel-body');

    switch (trackEntity.id.charAt(0)) {
        case 'N':
        case 'L':
            if (/L.+CN$/.test(trackEntity.id)) {
                loadAliProvider(elBody, trackEntity, 'cainiao')
            } else if (trackEntity.id.indexOf("LP") !== -1) {
                loadYanwen(elBody, trackEntity)
            } else {
                loadNetherlandsPost(elBody, trackEntity)
            }
            break
        case 'S':
        case 'G':
            loadNetherlandsPost(elBody, trackEntity)
            break
        case 'P':
            loadSpainExpress(elBody, trackEntity)
            break
        case 'U':
            loadYanwen(elBody, trackEntity)
            break
        case 'R': // Aliexpress
            let ending = trackEntity.id.charAt(trackEntity.id.length - 2)
                + trackEntity.id.charAt(trackEntity.id.length - 1)
            switch (ending) {
                case 'MY':
                    loadAliProvider(elBody, trackEntity, 'cainiao')
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
                default:
                    loadAliProvider(elBody, trackEntity, 'singpost')
            }

            break
        default: // all numbers
            loadYanwen(elBody, trackEntity)    
            loadAliProvider(elBody, trackEntity, 'trackchinapost', false, false)
            break
    }
}


/*
 |--------------------------------------------------------------------------
 | Gearbest
 |--------------------------------------------------------------------------
 */
function loadSpainExpress(elBody, trackEntity) {
    // Make 4 requests at the same time
    var total = 4,
        count = 0

    var skyContainer = elBody.find('.c-sky'),
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

                    if (adicionalData.status == "DESCARTADO") {
                        adicionalContainer.append(failedTemplate({provider: "Adicional", error: "Estado descartado."}))
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


function loadNetherlandsPost(elBody, trackEntity) {
    var skyContainer = elBody.find('.c-sky')

    getProviderData('sky', trackEntity.id).then(function (data) { // add sky response to the page
        skyContainer.append(skyTemplate(data))
        removeLoading(elBody)
    }).catch(function (error) {
        skyContainer.append(failedTemplate(error.responseJSON))
        removeLoading(elBody)
    })
}

/*
 |--------------------------------------------------------------------------
 | Aliexpress
 |--------------------------------------------------------------------------
 */
function loadAliProvider(elBody, trackEntity, provider, showCtt, showFailedTemplateOnError) {
    if (typeof (showCtt) === 'undefined') showCtt = true;
    if (typeof (showFailedTemplateOnError) === 'undefined') showFailedTemplateOnError = true;
    
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
        alicontainer.append(aliExpressTemplate(data))
        if (++count == total) removeLoading(elBody)
    }).catch(function (error) {
        if (showFailedTemplateOnError)
            alicontainer.append(failedTemplate(error.responseJSON))
        if (++count == total) removeLoading(elBody)
    })
}

/*
|--------------------------------------------------------------------------
| Yanwen provider
|--------------------------------------------------------------------------
*/
function loadYanwen(elBody, trackEntity) {
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
        if (++count == total) removeLoading(elBody)
    })

    getProviderData('cainiao', trackEntity.id).then(function (data) {
        aliContainer2.append(aliExpressTemplate(data))
        if (++count == total) removeLoading(elBody)

        if (data.destinyId) {
            getProviderData('ctt', data.destinyId).then(function (data) {
                cttContainer.append(cttTemplate(data))
            }).catch(function (error) {
            })    
        }        

    }).catch(function (error) {
        if (++count == total) removeLoading(elBody)
    })
}


/*
 |--------------------------------------------------------------------------
 | Get Api data
 |--------------------------------------------------------------------------
 */
function getProviderData(provider, id) {
    return $.getJSON("/api/" + provider, {id: id});
}

function getCorreosData(id, code) {
    return $.getJSON("/api/correos", {id: id, postalcode: code});
}

function getCorreosOldData(id, code) {
    return $.getJSON("/api/correosOld", {id: id, postalcode: code});
}

function getAdicionalData(adicionalID, code) {
    return $.getJSON("/api/adicional", {id: adicionalID, postalcode: code});
}

/*
 |--------------------------------------------------------------------------
 | Page Modifications
 |--------------------------------------------------------------------------
 */
function addEntryToPage(trackEntity) {
    emptyList.hide()
    trackEntries.prepend(trackEntryTemplate({
        description: trackEntity.description,
        id: trackEntity.id,
        postalcode: trackEntity.postalcode
    }))
}

function addEntryToContent(trackEntity) {
    info.hide()
    content.prepend(trackContentTemplate({
        description: trackEntity.description,
        id: trackEntity.id
    }))
}

function addAllTracksToPage() {
    tracks.forEach(function (track) {
        loadTrackToContent(track)
    })
}

function removeLoading(elem) {
    elem.find('.center-img').remove()
}
/*
 |--------------------------------------------------------------------------
 | Entities
 |--------------------------------------------------------------------------
 */
function Track(id, desc) {
    this.id = id;
    this.postalcode = this.getPostalCode()
    this.description = desc
}

Track.prototype.getPostalCode = function () {
    if (!this.isPQ()) return null

    var code = ""

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
        var args = arguments;
        return this.replace(/{(\d+)}/g, function (match, number) {
            return typeof args[number] != 'undefined'
                ? args[number]
                : match
                ;
        });
    };
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function isValidID(id) {
    if (id.length < 3) return false
    if (id.indexOf("PQ") !== -1) return true
    if (id.indexOf("NL") !== -1) return true
    if (id.indexOf("LV") !== -1) return true
    if (id.indexOf("SY") !== -1) return true
    if (id.indexOf("SB") !== -1) return true
    if (id.indexOf("GE") !== -1) return true
    if (id.indexOf("LP") !== -1) return true

    if (/R.+SG$/.test(id)) return true
    if (/R.+MY$/.test(id)) return true
    if (/R.+SE$/.test(id)) return true
    if (/R.+CN$/.test(id)) return true
    if (/R.+NL$/.test(id)) return true
    if (/L.+CN$/.test(id)) return true
    if (/U.+YP$/.test(id)) return true
    if (/^\d+$/.test(id)) return true

    return false
}

function daysAgo(date) {
    var seconds = Math.floor((new Date() - date) / 1000);

    return Math.floor(seconds / 86400); // 60*60*24 1 day in seconds
}

/*
 |--------------------------------------------------------------------------
 | Storage
 |--------------------------------------------------------------------------
 */
function storageAddTrack(trackEntity) {
    if (localStorage.getItem("#" + trackEntity.id) != null)
        return false

    localStorage.setItem("#" + trackEntity.id, JSON.stringify(trackEntity))
    return true
}

function storageRemoveTrack(id) {
    tracks = tracks.filter(function (t) {
        return t.id !== id;
    });

    localStorage.removeItem("#" + id)
}

function storageLoadAll() {
    for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i)

        if (key.charAt(0) == '#') { //we only load valid ids
            tracks.push(JSON.parse(localStorage.getItem(key)))
        }
    }
}
