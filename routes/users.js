const express = require("express");
const router = express.Router();
require("../models/connection");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { auth } = require("../middleware/auth");

const JWT_SECRET = process.env.JWT_SECRET;

const User = require("../models/users");
const { checkBody } = require("../modules/checkBody");


// Create a user
exports.createUser = async (req, res) => {
  if (!checkBody(req.body, ["username", "password"])) {
    return res.json({ result: false, error: "Missing or empty fields !" });
  }

  const { username, password } = req.body;

  try {
    // Check if the user already exists
    const existingUser = await User.findOne({
      username: { $regex: new RegExp(username, "i") },
    });

    if (existingUser) {
      // User already exists
      return res.json({ result: false, error: "User already exists !" });
    }

    // Hash the password before saving
    const passwordHash = await bcrypt.hash(password, 10);

    // Create a new user
    const newUser = new User({
      username,
      password: passwordHash,
    });

    // Save the user to the database
    const savedUser = await newUser.save();

    // Generate a JWT token
    const token = jwt.sign(
      { id: savedUser._id }, // Use _id from the saved user object
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Send the token in a cookie
    res.cookie("jwt", token, {
      httpOnly: true,
      secure: true, // Use secure cookies in production
      sameSite: "none",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    // Respond with the user data and success result
    return res.json({ result: true, data: savedUser });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ result: false, error: "Server error" });
  }
};
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
