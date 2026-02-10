const mongoose = require("mongoose");

const seatSchema = new mongoose.Schema({
  roll: { type: String, required: true, unique: true },
  branch: { type: String, required: true },
  year: { type: Number, required: true },
  room: { type: String, required: true },
  location: { type: String,required: true }
});

module.exports = mongoose.model("Seat", seatSchema);
