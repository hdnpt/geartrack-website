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
            if(body.error) res.status(400)

            res.send(cachedBody)
            return
        }

        res.sendResponse = res.send
        res.send = (body) => {
            const time = parseInt(res.locals.expire) || seconds
            mcache.put(key, body, time * 1000); //ms
            res.sendResponse(body)
        }
        next()
    }
}

// All this routes will be cached for 10 minutes
router.use(cache(10 * 60))

/**
 * Sky data
 */
router.get('/sky', validateId, function (req, res) {
    let id = req.query.id

    geartrack.sky.getInfo(id, (err, skyEntity) => {
        if (err) {
            res.status(400).json({error: "No data was found for that id!"})
            return
        }

        if (skyEntity.id.charAt(0) == 'P' && skyEntity.messages.length == 0) {
            res.status(400).json({error: "Empty data from sky!"})
            return
        }

        skyEntity.name = id.charAt(0) + id.charAt(1)

        res.json(skyEntity)
    })
});


/**
 * Correos data
 */
router.get('/correos', validateId, validatePostalCode,function (req, res) {
    let id = req.query.id, postalcode = req.query.postalcode

    geartrack.correos.getInfo(id, postalcode, (err, correosEntity) => {
        if (err) {
            res.status(400).json({error: "No data was found for that id!"})
            return
        }

        res.json(correosEntity)
    })
});

/**
 * CorreosEs data
 */
router.get('/correoses', validateId,function (req, res) {
    let id = req.query.id

    geartrack.correoses.getInfo(id, (err, correosEntity) => {
        if (err) {
            res.status(400).json({error: "No data was found for that id!"})
            return
        }

        correosEntity.provider = 'Correos ES'
        correosEntity.color = 'yellow'
        res.json(correosEntity)
    })
});


/**
 * Adicional data
 */
router.get('/adicional', validateId, validatePostalCode, function (req, res) {
    let id = req.query.id, postalcode = req.query.postalcode

    geartrack.adicional.getInfo(id, postalcode, (err, adicionalEntity) => {
        if (err) {
            res.status(400).json({error: "No data was found for that id!"})
            return
        }

        res.json(adicionalEntity)
    })
});


/**
 * Expresso24 data
 */
router.get('/expresso24', validateId, function (req, res) {
    let id = req.query.id

    geartrack.expresso24.getInfo(id, (err, expressoInfo) => {
        if (err) {
            res.status(400).json({error: "No data was found for that id!"})
            return
        }

        res.json(expressoInfo)
    })
});

/**
 * Singpost
 */
router.get('/singpost', validateId, function (req, res) {
    let id = req.query.id

    geartrack.singpost.getInfo(id, (err, singpost) => {
        if (err) {
            res.status(400).json({error: "No data was found for that id!"})
            return
        }

        singpost.messages = singpost.messages.map(m => {
            m.status =  m.status.replace(/ \(Country.+\)/ig, "")
            return m
        })

        res.json(singpost)
    })
});

/**
 * CTT
 */
router.get('/ctt', validateId, function (req, res) {
    let id = req.query.id

    geartrack.ctt.getInfo(id, (err, ctt) => {
        if (err) {
            res.status(400).json({error: "No data was found for that id!"})
            return
        }

        res.json(ctt)
    })
});

/**
 * Direct Link
 */
router.get('/directlink', validateId, function (req, res) {
    let id = req.query.id

    geartrack.directlink.getInfo(id, (err, direct) => {
        if (err) {
            res.status(400).json({error: "No data was found for that id!"})
            return
        }

        direct.provider = 'Direct Link'
        direct.color = 'yellow'
        res.json(direct)
    })
});

/**
 * Track china post
 */
router.get('/trackchinapost', validateId, function (req, res) {
    let id = req.query.id

    geartrack.trackchinapost.getInfo(id, (err, info) => {
        err = {error: 'busy'}
        if (err) {
            let msg = "Não foi encontrada informação para este id."
            if(err.message.indexOf('busy') != -1) {
                res.locals.expire = 1
                msg = "O servidor está ocupado neste momento, tente de novo."
            }

            res.status(400).json({error: msg})
            return
        }

        info.provider = 'Track China Post'
        info.color = 'danger'
        res.json(info)
    })
});

/**
 * Cainiao
 */
router.get('/cainiao', validateId, function (req, res) {
    let id = req.query.id

    geartrack.cainiao.getInfo(id, (err, cainiao) => {
        if (err) {
            res.status(400).json({error: "No data was found for that id!"})
            return
        }

        cainiao.messages = cainiao.messages.map(m => {
            m.status = m.status.replace('[-]', '')

            return m
        })

        res.json(cainiao)
    })
});
/*
|--------------------------------------------------------------------------
| Validation Middlewares
|--------------------------------------------------------------------------
*/
function validateId(req, res, next) {
    let id = req.query.id

    if (!id) {
        res.status(400).json({error: "ID must be passed in the query string!"})
        return
    }

    next()
}

function validatePostalCode(req, res, next) {
    let postalcode = req.query.postalcode

    if (!postalcode) {
        res.status(400).json({error: "Postalcode must be passed in the query string!"})
        return
    }

    next()
}

module.exports = router;
