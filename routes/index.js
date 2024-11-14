var express = require('express');
var router = express.Router();
const fetch = require('node-fetch');

router.get('/articles', (req, res) => {
  fetch(
    `https://newsapi.org/v2/everything?domains=techcrunch.com&apiKey=${process.env.API_KEY}`
  )
    .then((res) => res.json())
    .then((data) => {
      res.json({ result: true, articles: data.articles });
    });
});

module.exports = router;
