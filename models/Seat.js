const mongoose = require("mongoose");

const seatSchema = new mongoose.Schema({
  roll: { type: String, required: true },
  branch: { type: String, required: true },
  year: { type: Number, required: true },
  room: { type: String, required: true },
  location: { type: String,required: true }
});

// ensure we don't accidentally create two identical documents –
// combination of all fields acts as a unique key
seatSchema.index({ roll: 1, branch: 1, year: 1, room: 1, location: 1 }, { unique: true });

module.exports = mongoose.model("Seat", seatSchema);
