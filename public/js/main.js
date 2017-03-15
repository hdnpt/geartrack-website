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
    skyNLTemplate = Handlebars.compile($("#sky-template-nl").html()),
    correosTemplate = Handlebars.compile($("#correos-template").html()),
    adicionalTemplate = Handlebars.compile($("#adicional-template").html()),
    expresso24Template = Handlebars.compile($("#expresso24-template").html()),
    failedTemplate = Handlebars.compile($("#failed-template").html())

Handlebars.registerHelper('StateDaysAgo', function (state, date, shouldState) {
    if(state != shouldState) return ""

    try {
        var nDate = new Date(date)
    } catch (err) {
        return ""
    }

    var diff = daysAgo(nDate)

    if (diff > 0) {
        var days = diff == 1 ? 'dia' : 'dias'

        return "(" + diff + " " + days + ")"
    }

    return ""
})


/*
 |--------------------------------------------------------------------------
 | Page functionality
 |--------------------------------------------------------------------------
 */
storageLoadAll()
addAllTracksToPage()

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
    } else {
        alert("Esse id já foi adicionado!")
    }

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
        localStorage.removeItem('info')
        emptyList.show()
    }
});

if (localStorage.getItem('info') == null) {
    jumbotron.show()
}

$('#hide-button').click(function (e) {
    e.preventDefault()

    jumbotron.hide()
    localStorage.setItem('info', 0)
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
        case 'S':
        case 'G':
            loadNetherlandsPost(elBody, trackEntity)
            break
        default:
            loadSpainExpress(elBody, trackEntity)
    }
}


/*
 |--------------------------------------------------------------------------
 | Providers
 |--------------------------------------------------------------------------
 */
function loadSpainExpress(elBody, trackEntity) {
    // Make both requests at the same time
    var total = 2,
        count = 0

    var skyContainer = elBody.find('.c-sky'),
        correosContainer = elBody.find('.c-correos'),
        expresso24Container = elBody.find('.c-expresso24'),
        adicionalContainer = elBody.find('.c-adicional')

    getSkyData(trackEntity.id)
        .then(function (skyData) {
            skyContainer.append(skyTemplate(skyData))
            if (++count == total) removeLoading(elBody, count, total)
        })
        .catch(function (error) {
            skyContainer.append(failedTemplate({name: "Sky 56"}))
            if (++count == total) removeLoading(elBody)
        })

    getCorreosData(trackEntity.id, trackEntity.postalcode)
        .then(function (correosData) {
            correosContainer.append(correosTemplate(correosData))

            getExpresso24Data(correosData.product.ref)
                .then(function (expressoInfo) { // load expresso24 before adicional
                    expresso24Container.append(expresso24Template(expressoInfo))
                    if (++count == total) removeLoading(elBody)
                })
                .catch(function (error) {
                    expresso24Container.append(failedTemplate({name: "Expresso24", message: "Sem informação disponivel."}))
                    if (++count == total) removeLoading(elBody)
                })

            getAdicionalData(correosData.id, trackEntity.postalcode)
                .then(function (adicionalData) {
                    // Hide the second phone if is the same
                    adicionalData.phone2 = adicionalData.phone2.trim()
                    if (adicionalData.phone2 == adicionalData.phone1)
                        adicionalData.phone2 = null

                    if (adicionalData.status == "DESCARTADO") {
                        adicionalContainer.append(failedTemplate({name: "Adicional", message: "Estado descartado."}))
                    } else {
                        adicionalContainer.append(adicionalTemplate(adicionalData))
                    }

                })
                .catch(function (error) {
                    adicionalContainer.append(failedTemplate({name: "Adicional"}))
                })

        })
        .catch(function (error) {
            correosContainer.append(failedTemplate({name: "Correos Express"}))
            if (++count == total) removeLoading(elBody)
        })
}

function loadNetherlandsPost(elBody, trackEntity) {
    getSkyData(trackEntity.id).then(function (data) { // add sky response to the page
        if (data.error) {
            elBody.append(failedTemplate({name: "Sky 56 - NL"}))
        } else {
            elBody.append(skyNLTemplate(data))
        }
        removeLoading(elBody)
    })
}

/*
 |--------------------------------------------------------------------------
 | Get Api data
 |--------------------------------------------------------------------------
 */
function getSkyData(id) {
    return $.getJSON("/api/sky", {id: id});
}

function getCorreosData(id, code) {
    return $.getJSON("/api/correos", {id: id, postalcode: code});
}

function getAdicionalData(adicionalID, code) {
    return $.getJSON("/api/adicional", {id: adicionalID, postalcode: code});
}

function getExpresso24Data(id) {
    return $.getJSON("/api/expresso24", {id: id});
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
    if (this.isNL()) return null

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

Track.prototype.isNL = function () {
    return this.id.charAt(0) == 'N'
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
    if (id.length == 0) return false
    if (id.indexOf("PQ") !== -1) return true
    if (id.indexOf("NL") !== -1) return true
    if (id.indexOf("LV") !== -1) return true
    if (id.indexOf("SY") !== -1) return true
    if (id.indexOf("SB") !== -1) return true
    if (id.indexOf("GE") !== -1) return true

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
