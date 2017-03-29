const express = require('express');
const router = express.Router();

/**
 * Home page
 */
router.get('/', function(req, res, next) {
  res.render('index');
});

/**
 * About
 */
router.get('/about', function(req, res, next) {
    res.render('about', { title: 'Sobre' });
});

/**
 * News
 */
router.get('/news', function(req, res, next) {
    res.render('news', { title: 'Notícias' });
});

/**
 * FAQs
 */
router.get('/faqs', function(req, res, next) {
    res.render('faqs', { title: 'FAQs' });
});

module.exports = router;
