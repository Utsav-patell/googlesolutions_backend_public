const express = require('express');
const bodyParser = require("body-parser");
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');

const redisClient = require('./src/config/redis');
const connectDB = require('./src/config/db');
const apiRoutes = require('./src/routes/api/api-routes');


// I am loading evironment Variables
dotenv.config();
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());


// TODO: This are example Routes for reference
// To access only with token and only if role is admin
// app.get("/admin", authenticate, checkRole(["admin"]), (req, res) => {
//   res.send("Admin route accessed successfully!");
// });

// app.get("/access-with-token", authenticate, (req, res) => {
//   res.send("Admin route accessed successfully!");
// });


// I will log http requests
// if (process.env.NODE_ENV === "development") {
//   app.use(morgan("dev"));
// }

// Connects MongoDB Database 
connectDB();

// Connects Reddis Client
redisClient;


app.use("/api", apiRoutes);


// For Testing Purpose only. Will remove it afterwards
app.get("/", (req, res) => {
    res.send("Welcome to the E-Waste Management App!");
  });
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: "Something went wrong!" });
});

  app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
  });