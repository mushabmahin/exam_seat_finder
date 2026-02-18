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
  .then(async () => {
    console.log("MongoDB connected");

    // remove legacy unique index on roll if it still exists
    try {
      const coll = mongoose.connection.collection('seats');
      const indexes = await coll.indexes();
      const hasRoll = indexes.some(ix => ix.name === 'roll_1');
      if (hasRoll) {
        await coll.dropIndex('roll_1');
        console.log('Dropped legacy roll unique index');
      }
    } catch (dropErr) {
      // ignore if index was already gone
      if (dropErr.codeName && dropErr.codeName === 'IndexNotFound') {
        // no-op
      } else {
        console.error('Error dropping roll index:', dropErr.message || dropErr);
      }
    }
  })
  .catch(err => console.error("MongoDB error:", err.message));

app.use("/api/seats", seatRoutes);
