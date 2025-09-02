require("dotenv").config();
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const mongoose = require("mongoose");
const cors = require("cors");

const indexRouter = require("./routes/index");
const usersRouter = require("./routes/users");

const app = express();

// ---- CORS ----
const allowedOrigins = [
  "https://tech-news-frontend-t127.vercel.app", // front prod
  "http://localhost:3001", // front local
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// ---- Middlewares ----
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// ---- MongoDB ----
const connectionString = process.env.CONNECTION_STRING;
if (!connectionString) {
  console.error("Database connection string missing in .env");
  process.exit(1);
}

mongoose
  .connect(connectionString, { connectTimeoutMS: 2000 })
  .then(() => console.log("Database connected 🥳"))
  .catch((err) => {
    console.error("Database connection failed:", err);
    process.exit(1);
  });

// ---- Routes ----
app.get("/api/health", (req, res) => {
  res.json({ ok: true, message: "API is running 🚀" });
});

app.use("/", indexRouter);
app.use("/users", usersRouter);

// **IMPORTANT** : pas de app.listen ici
module.exports = app;
