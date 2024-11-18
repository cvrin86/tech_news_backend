const express = require("express");
const router = express.Router();
require("../models/connection");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { auth } = require("../middleware/auth");

const JWT_SECRET = process.env.JWT_SECRET;

const User = require("../models/users");
const { checkBody } = require("../modules/checkBody");

// route to create a new account
router.post("/signup", (req, res) => {
  if (!checkBody(req.body, ["username", "password"])) {
    res.json({ result: false, error: "Missing or empty fields !" });
    return;
  }

  // check if a user already been registered

  User.findOne({
    username: { $regex: new RegExp(req.body.username, "i") },
  }).then((data) => {
    if (data === null) {
      const hash = bcrypt.hashSync(req.body.password, 10);

      const newUser = new User({
        username: req.body.username,
        password: hash,
      });

      newUser.save().then((data) => {
        const token = jwt.sign(
          {
            id: data.id,
          },
          JWT_SECRET,
          {
            expiresIn: "24h",
          }
        );

        res
          .cookie("jwt", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 24 * 60 * 60 * 1000,
          })
          .json({ result: true, data });
      });
    } else {
      // User already exists in database
      res.json({ result: false, error: "User already exists !" });
    }
  });
});

// route to sign in
router.post("/signin", (req, res) => {
  if (!checkBody(req.body, ["username", "password"])) {
    res.json({ result: false, error: "Missing or empty fields !" });
    return;
  }

  User.findOne({
    username: { $regex: new RegExp(req.body.username, "i") },
  }).then((data) => {
    if (data && bcrypt.compareSync(req.body.password, data.password)) {
      const token = jwt.sign(
        {
          id: data?.id,
        },
        JWT_SECRET,
        {
          expiresIn: "24h",
        }
      );

      res.cookie("jwt", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 24 * 60 * 60 * 1000,
      });
      res.json({ result: true, data });
    } else {
      res.json({ result: false, error: "User not found" });
    }
  });
});

router.get("/canBookmark", auth, (req, res) => {
  User.findOne({ _id: req.user.id }).then((data) => {
    if (data) {
      res.json({ result: true });
    } else {
      res.json({ result: false, error: "User not found !" });
    }
  });
});

router.post("/logout", (_, res) => {
  res.clearCookie("jwt");
  res.json({ result: true });
});

module.exports = router;
