/*
|--------------------------------------------------------------------------
| Global vars
|--------------------------------------------------------------------------
*/
var send = $('#send'),
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
    adicionalTemplate = Handlebars.compile($("#adicional-template").html()),
    failedTemplate = Handlebars.compile($("#failed-template").html())


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
send.click(function (event) {
    event.preventDefault();

    var id = shippingId.val().trim(),
        desc = description.val().trim()

    if(id.length == 0 || desc.length == 0) {
        alert("Deve preencher todos os campos.")
        return
    }

    var track = new Track(id, desc);

    if(storageAddTrack(track)) { // new one
        loadTrackToContent(track)
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
$(document).on('click', '.remove', function(e) {
    e.preventDefault()

    var id = $(this).data('id')
    $(this).closest('li').remove()
    $('#' + id).remove()

    storageRemoveTrack(id)

    if(tracks.length == 0) {
        info.show()
        jumbotron.show()
        localStorage.removeItem('info')
        emptyList.show()
    }
});

if(localStorage.getItem('info') == null) {
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

    // Make both requests at the same time
    var getSky = getSkyData(trackEntity.id),
        getCorreos = getCorreosData(trackEntity.id, trackEntity.postalcode)

    getSky.then(function (data) { // add sky response to the page before correos
        if(data.error) {
            elBody.append(failedTemplate({name: "Sky 56"}))
        } else {
            elBody.append(skyTemplate(data))
        }

        getCorreos.then(function (data) { // append correos data
            if(data.error) {
                elBody.append(failedTemplate({name: "Correos Express"}))
                removeLoading(elBody)
                return // no need to fetch adicional pt if we dont have correos data
            }

            elBody.append(correosTemplate(data))

            getAdicionalData(data.id, trackEntity.postalcode).then(function (adicionalData) {
                removeLoading(elBody)
                if(adicionalData.error) {
                    elBody.append(failedTemplate({name: "Adicional"}))
                    return
                }

                elBody.append(adicionalTemplate(adicionalData))
            })
        })
    })
}



/*
|--------------------------------------------------------------------------
| Get Api data
|--------------------------------------------------------------------------
*/
function getSkyData(id, callback) {
    return $.getJSON("/api/sky", {id: id});
}

function getCorreosData(id, code, callback) {
    return $.getJSON("/api/correos", {id: id, postalcode: code});
}

function getAdicionalData(adicionalID, code, callback) {
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
    var code = ""

    for(var i = this.id.length - 1, max = 0; i >= 0 && max < 4; i--) {
        var char = this.id.charAt(i)

        if (char >= '0' && char <= '9') {
            code = char + code
            max++
        }
    }

    return code
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
    String.prototype.format = function() {
        var args = arguments;
        return this.replace(/{(\d+)}/g, function(match, number) {
            return typeof args[number] != 'undefined'
                ? args[number]
                : match
                ;
        });
    };
}

/*
|--------------------------------------------------------------------------
| Storage
|--------------------------------------------------------------------------
*/
function storageAddTrack(trackEntity) {
    if(localStorage.getItem("#" + trackEntity.id) != null)
        return false

    localStorage.setItem("#" + trackEntity.id, JSON.stringify(trackEntity))
    return true
}

function storageRemoveTrack(id) {
    tracks = tracks.filter(function(t) {
        return t.id !== id;
    });

    localStorage.removeItem("#" + id)
}

function storageLoadAll() {
    for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i)

        if(key.charAt(0) == '#') { //we only load valid ids
            tracks.push(JSON.parse(localStorage.getItem(key)))
        }
    }
}