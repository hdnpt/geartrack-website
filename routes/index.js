const express = require('express');
const router = express.Router();

/**
 * Home page
 */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Geartrack', year: new Date().getFullYear() });
});

/**
 * About
 */
router.get('/about', function(req, res, next) {
    res.render('about', { title: 'Sobre - Geartrack', year: new Date().getFullYear() });
});

/**
 * News
 */
router.get('/news', function(req, res, next) {
    res.render('news', { title: 'Noticias - Geartrack', year: new Date().getFullYear() });
});

module.exports = router;
