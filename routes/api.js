const express = require('express')
const router = express.Router()
const geartrack = require('geartrack')
const mcache = require('memory-cache');

/**
 * Cache middleware
 * Caches the response for a period of time
 *
 * Uses memory cache
 * @param minutes
 * @param type default = json
 * @return {function(*, *, *)}
 */
const cache = (minutes, type = 'json') => {
    return (req, res, next) => {
        let key = req.originalUrl
        let cachedBody = mcache.get(key)
        res.type(type)

        if (cachedBody) {
            res.send(cachedBody)
            return
        }

        res.sendResponse = res.send
        res.send = (body) => {
            mcache.put(key, body, minutes * 60 * 1000); //ms
            res.sendResponse(body)
        }
        next()
    }
}

/**
 * Sky data
 * Cached for 10 minutes
 */
router.get('/sky', cache(10), function (req, res) {
    let id = req.query.id

    if (!id) {
        res.json({error: "ID must be passed in the query string!"})
        return
    }

    geartrack.sky.getInfo(id, (err, skyEntity) => {
        if (err) {
            res.json({error: "No data was found for that id!"})
            return
        }

        if (skyEntity.id.charAt(0) == 'P' && skyEntity.messages.length == 0) {
            res.json({error: "Empty data from sky!"})
            return
        }

        skyEntity.name = id.charAt(0) + id.charAt(1)

        res.json(skyEntity)
    })
});

/**
 * Correos data
 * Cached for 10 minutes
 */
router.get('/correos', cache(10),function (req, res) {
    let id = req.query.id, postalcode = req.query.postalcode

    if (!id && !postalcode) {
        res.json({error: "ID & postalcode must be passed in the query string!"})
        return
    }

    geartrack.correos.getInfo(id, postalcode, (err, correosEntity) => {
        if (err) {
            res.json({error: "No data was found for that id!"})
            return
        }

        res.json(correosEntity)
    })

});


/**
 * Adicional data
 * Cached for 10 minutes
 */
router.get('/adicional', cache(10), function (req, res) {
    let id = req.query.id, postalcode = req.query.postalcode

    if (!id && !postalcode) {
        res.json({error: "ID & postalcode must be passed in the query string!"})
        return
    }

    geartrack.adicional.getInfo(id, postalcode, (err, adicionalEntity) => {
        if (err) {
            res.json({error: "No data was found for that id!"})
            return
        }

        res.json(adicionalEntity)
    })
});

module.exports = router;
