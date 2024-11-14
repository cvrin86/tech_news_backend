const express = require('express');
const router = express.Router();
require('../models/connection');
const uid2 = require('uid2');
const bcrypt = require('bcrypt');

const User = require('../models/users');
const { checkBody } = require('../modules/checkBody');

// route to create a new account
router.post('/signup', (req, res) => {
  if (!checkBody(req.body, ['username', 'password'])) {
    res.json({ result: false, error: 'Missing or empty fields !' });
    return;
  }

  // check if a user already been registered

  User.findOne({
    username: { $regex: new RegExp(req.body.username, 'i') },
  }).then((data) => {
    if (data === null) {
      const hash = bcrypt.hashSync(req.body.password, 10);

      const newUser = new User({
        username: req.body.username,
        password: hash,
        token: uid2(32),
        canBookmark: true,
      });

      newUser.save().then((data) => {
        res.json({ result: true, token: data.token });
      });
    } else {
      // User already exists in database
      res.json({ result: false, error: 'User already exists !' });
    }
  });
});

// route to sign in
router.post('/signin', (req, res) => {
  if (!checkBody(req.body, ['username', 'password'])) {
    res.json({ result: false, error: 'Missing or empty fields !' });
    return;
  }

  User.findOne({
    username: { $regex: new RegExp(req.body.username, 'i') },
  }).then((data) => {
    if (data && bcrypt.compareSync(req.body.password, data.password)) {
      res.json({ result: true, token: data.token });
    } else {
      res.json({ result: false, error: 'User not found' });
    }
  });
});

router.get('/canBookmark/:token', (req, res) => {
  User.findOne({ token: req.params.token }).then((data) => {
    if (data) {
      res.json({ result: true, canBookmark: data.canBookmark });
    } else {
      res.json({ result: false, error: 'User not found !' });
    }
  });
});

module.exports = router;
