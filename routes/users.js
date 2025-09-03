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
router.post("/signup", async (req, res) => {
  if (!checkBody(req.body, ["username", "password"])) {
    return res.status(400).json({ result: false, error: "Missing or empty fields !" });
  }

  const existingUser = await User.findOne({ username: { $regex: new RegExp(req.body.username, "i") } });
  if (existingUser) {
    return res.status(409).json({ result: false, error: "User already exists !" });
  }

  const hash = bcrypt.hashSync(req.body.password, 10);
  const newUser = new User({ username: req.body.username, password: hash });
  const savedUser = await newUser.save();

  const token = jwt.sign({ id: savedUser.id }, JWT_SECRET, { expiresIn: "24h" });

  res.cookie("jwt", token, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    maxAge: 24 * 60 * 60 * 1000,
  }).json({ result: true, data: savedUser });
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
        secure: true,
        sameSite: "none",
        maxAge: 24 * 60 * 60 * 1000,
      });
      res.json({ result: true, data });
    } else {
      res.json({ result: false, error: "User not found" });
    }
  });
});

router.get("/canBookmark", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ result: false, error: "User not found!" });
    }

    return res.json({ result: true });
  } catch (err) {
    console.error("Error in /canBookmark:", err);
    return res.status(500).json({ result: false, error: "Internal server error" });
  }
});


router.post("/logout", (_, res) => {
  res.clearCookie("jwt");
  res.json({ result: true });
});

module.exports = router;
