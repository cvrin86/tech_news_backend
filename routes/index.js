var express = require("express");
var router = express.Router();
const fetch = require("node-fetch");
const { auth } = require("../middleware/auth");
const User = require("../models/users");

router.get("/articles", (req, res) => {
  fetch(
    `https://newsapi.org/v2/everything?domains=techcrunch.com&apiKey=${process.env.API_KEY}`
  )
    .then((res) => res.json())
    .then((data) => {
      res.json({ result: true, articles: data.articles });
    });
});

router.post("/addBookmark", auth, async (req, res) => {
  const { title, description, urlToImage, author } = req.body;
  const isUserAuthorized = await User.findOne({ _id: req.user.id });

  if (!isUserAuthorized) {
    return res.status(401).json({ result: false, error: "Not Authorized" });
  }

  if (isUserAuthorized) {
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
  } else {
    res.status(400).json({ result: false });
  }
});

router.delete("/deleteBookmark", auth, async (req, res) => {
  const { title } = req.body;
  const isUserAuthorized = await User.findOne({ _id: req.user.id });

  if (!isUserAuthorized) {
    return res.status(401).json({ result: false, error: "Not Authorized" });
  }

  if (isUserAuthorized) {
    await User.updateOne(
      { _id: req.user.id },
      {
        $pull: {
          bookmarks: { title },
        },
      }
    );
    res.json({ result: true, message: "Bookmark deleted from user" });
  } else {
    res.status(400).json({ result: false });
  }
});

router.get("/displayAllBookmarks", auth, async (req, res) => {
  const isUserAuthorized = await User.findOne({ _id: req.user.id });

  if (!isUserAuthorized) {
    return res.status(401).json({ result: false, error: "Not Authorized" });
  }

  if (isUserAuthorized) {
    const bookmarks = isUserAuthorized.bookmarks;

    res.json({ result: true, bookmarks });
  } else {
    res.status(400).json({ result: false });
  }
});

module.exports = router;
