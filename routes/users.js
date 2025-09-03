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
  try {
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

    if (!JWT_SECRET) {
      console.error("JWT_SECRET is not defined !");
      return res.status(500).json({ result: false, error: "Internal server error" });
    }

    const token = jwt.sign({ id: savedUser.id }, JWT_SECRET, { expiresIn: "24h" });

  res.cookie("jwt", token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 24 * 60 * 60 * 1000,
});


    return res.json({ result: true, data: savedUser });
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({ result: false, error: "Internal server error" });
  }
});

// route to sign in
router.post("/signin", async (req, res) => {
  try {
    if (!checkBody(req.body, ["username", "password"])) {
      return res.status(400).json({ result: false, error: "Missing or empty fields !" });
    }

    const user = await User.findOne({ username: { $regex: new RegExp(req.body.username, "i") } });
    if (!user) {
      return res.status(404).json({ result: false, error: "User not found" });
    }

    const passwordMatch = bcrypt.compareSync(req.body.password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ result: false, error: "Invalid password" });
    }

    if (!JWT_SECRET) {
      console.error("JWT_SECRET is not defined !");
      return res.status(500).json({ result: false, error: "Internal server error" });
    }

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: "24h" });

    res.cookie("jwt", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 24 * 60 * 60 * 1000,
    });

    return res.json({ result: true, data: user });
  } catch (error) {
    console.error("Signin error:", error);
    return res.status(500).json({ result: false, error: "Internal server error" });
  }
});

router.get("/canBookmark", auth, async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.user.id });
    if (user) {
      return res.json({ result: true });
    } else {
      return res.status(404).json({ result: false, error: "User not found !" });
    }
  } catch (error) {
    console.error("canBookmark error:", error);
    return res.status(500).json({ result: false, error: "Internal server error" });
  }
});

router.post("/logout", (req, res) => {
  try {
    res.clearCookie("jwt");
    return res.json({ result: true });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({ result: false, error: "Internal server error" });
  }
});

module.exports = router;
