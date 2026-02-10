const express = require("express");
const Seat = require("../models/Seat");
const router = express.Router();

/* ADMIN – Add roll range */
router.post("/add-range", async (req, res) => {
  const { prefix, start, end, branch, year, room, location } = req.body;

  if (start > end) {
    return res.status(400).json({ message: "Invalid roll range" });
  }

  const records = [];

  for (let i = start; i <= end; i++) {
    const roll = prefix.toUpperCase() + i.toString().padStart(3, "0");
    records.push({
      roll,
      branch: branch.toUpperCase(),
      year,
      room,
      location
    });
  }
  console.log("Generated records:", records);

  try {
    await Seat.insertMany(records, { ordered: false });
    res.json({ message: `${records.length} seats processed successfully` });
  } catch (err) {
    res.status(400).json({
      message: "Some roll numbers already exist. Duplicates skipped."
    });
  }
});

/* STUDENT – Search seat */
router.get("/search", async (req, res) => {
  const { roll, branch, year } = req.query;

  const seat = await Seat.findOne({
    roll: roll.toUpperCase(),
    branch: branch.toUpperCase(),
    year: Number(year)
  });

  if (!seat) {
    return res.status(404).json({ message: "Seat not found" });
  }

  res.json(seat);
});

module.exports = router;
