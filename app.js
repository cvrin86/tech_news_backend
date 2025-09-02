require("dotenv").config();

var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
const mongoose=require("mongoose");
const cors = require("cors");

var indexRouter = require("./routes/index");
const usersRouter = require("./routes/users");

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  "https://tech-news-frontend-t127.vercel.app", // ton front en prod
  // tu peux en rajouter d'autres si besoin (previews, localhost...)
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



app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));






// Connexion à la base de données MongoDB
const connectionString = process.env.CONNECTION_STRING;
if (!connectionString) {
  console.error("Database connection string is missing in .env file");
  process.exit(1); // Terminer l'application si la chaîne de connexion est absente
}

mongoose
  .connect(connectionString, { connectTimeoutMS: 2000 })
  .then(() => console.log("Database connected 🥳"))
  .catch((err) => {
    console.error("Database connection failed:", err);
    process.exit(1); // Terminer l'application si la connexion échoue
  });

// Route d'exemple
app.get("/api/health", (req, res) => {
  res.json({ok:true,message:"API is running"});
});


app.use("/", indexRouter);
app.use("/users", usersRouter);

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});


module.exports = app;
