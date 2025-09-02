var express = require("express");
var router = express.Router();
const fetch = require("node-fetch");
const { auth } = require("../middleware/auth");
const User = require("../models/users");

router.get("/articles", async (req, res) => {
  try {
    const response = await fetch(
      `https://newsapi.org/v2/everything?domains=techcrunch.com&apiKey=${process.env.API_KEY}`
    );
    const data = await response.json();

    if (!data.articles) {
      return res.status(500).json({
        result: false,
        error: data.message || "Impossible de récupérer les articles",
      });
    }

    res.json({ result: true, articles: data.articles });
  } catch (error) {
    res.status(500).json({ result: false, error: error.message });
  }
});


router.post("/addBookmark", auth, async (req, res) => {
  const { title, description, urlToImage, author } = req.body;
  try {
    const isUserAuthorized = await User.findOne({ _id: req.user.id });

    if (!isUserAuthorized) {
      return res.status(401).json({ result: false, error: "Not Authorized" });
    }

    await User.updateOne(
      { _id: req.user.id },
      {
        $push: {
          bookmarks: {
            author,
            description,
            title,
            urlToImage,
            isBookmarked: true,
          },
        },
      }
    );
    res.json({ result: true, message: "Bookmark added to user" });
  } catch (error) {
    res.status(500).json({ result: false, error: error.message });
  }
});

router.delete("/deleteBookmark", auth, async (req, res) => {
  const { title } = req.body;
  try {
    const isUserAuthorized = await User.findOne({ _id: req.user.id });

    if (!isUserAuthorized) {
      return res.status(401).json({ result: false, error: "Not Authorized" });
    }

    await User.updateOne(
      { _id: req.user.id },
      {
        $pull: {
          bookmarks: { title },
        },
      }
    );
    res.json({ result: true, message: "Bookmark deleted from user" });
  } catch (error) {
    res.status(500).json({ result: false, error: error.message });
  }
});

router.get("/displayAllUserBookmarks", auth, async (req, res) => {
  try {
    const isUserAuthorized = await User.findOne({ _id: req.user.id });

    if (!isUserAuthorized) {
      return res.status(401).json({ result: false, error: "Not Authorized" });
    }

    const bookmarks = isUserAuthorized.bookmarks;
    res.json({ result: true, bookmarks });
  } catch (error) {
    res.status(500).json({ result: false, error: error.message });
  }
});

module.exports = router;
