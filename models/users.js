const mongoose = require("mongoose");

const bookmarkSchema = mongoose.Schema({
  title: String,
  description: String,
  urlToImage: String,
  author: String,
  isBookmarked: Boolean,
});

const userSchema = mongoose.Schema({
  username: String,
  password: String,
  bookmarks: [bookmarkSchema],
});

const User = mongoose.model("users", userSchema);

module.exports = User;
