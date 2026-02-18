require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const seatRoutes = require("./routes/seats");

const app = express();

app.use(cors());
app.use(express.json());
// log current working directory and ensure static path
console.log('cwd:', process.cwd());
console.log('serving static from', require('path').resolve(process.cwd(), 'public'));
app.use(express.static("public"));

app.listen(5000, () => {
  console.log("Server running at http://localhost:5000");
});

mongoose
  .connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 })
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB error:", err.message));

app.use("/api/seats", seatRoutes);
