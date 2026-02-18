const express = require("express");
const Seat = require("../models/Seat");
const mongoose = require("mongoose");
const router = express.Router();

/* ADMIN – Add roll range */
router.post("/add-range", async (req, res) => {
  let { start, end, branch, year, room, location } = req.body;

  // Basic validation
  if (start == null || end == null || !branch || year == null || !room || !location) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  start = Number(start);
  end = Number(end);
  year = Number(year);

  if (Number.isNaN(start) || Number.isNaN(end) || Number.isNaN(year)) {
    return res.status(400).json({ message: "start, end and year must be numbers" });
  }

  if (start > end) {
    return res.status(400).json({ message: "Invalid roll range" });
  }

  branch = String(branch).toUpperCase();

  const records = [];
  const rolls = [];

  for (let i = start; i <= end; i++) {
    const roll = i.toString();
    rolls.push(roll);
    records.push({
      roll,
      branch,
      year,
      room,
      location
    });
  }

  try {
    // Find existing seats so we can determine which ones are identical, which conflict, and which are new
    const existing = await Seat.find({ roll: { $in: rolls } }).lean();
    // key by roll+branch so that different branches may coexist
    const existingMap = Object.fromEntries(existing.map(s => [`${s.roll}_${s.branch}`, s]));

    // prepare counts for preview
    const duplicateRolls = [];
    const conflictRolls = []; // same roll+branch exists but other details differ
    const newRolls = [];

    records.forEach(rec => {
      const key = `${rec.roll}_${rec.branch}`;
      const ex = existingMap[key];
      const label = `${rec.roll} (${rec.branch})`;
      if (ex) {
        // all other fields must also match for it to be a duplicate
        if (
          ex.year === rec.year &&
          ex.room === rec.room &&
          ex.location === rec.location
        ) {
          duplicateRolls.push(label);
        } else {
          // even though branch is same, room/year/location differ -> conflict
          conflictRolls.push(label);
        }
      } else {
        newRolls.push(label);
      }
    });

    const previewFlag = req.body && req.body.preview === true;
    const generated = records.length;

    if (previewFlag) {
      return res.json({
        message: 'Preview',
        generated,
        duplicateCount: duplicateRolls.length,
        duplicateRolls,
        conflictCount: conflictRolls.length,
        conflictRolls,
        newCount: newRolls.length,
        newRolls
      });
    }

    // Build bulk operations: insert new entries only (no overwrites)
    const ops = [];
    records.forEach(rec => {
      const key = `${rec.roll}_${rec.branch}`;
      const ex = existingMap[key];
      if (!ex) {
        ops.push({
          updateOne: {
            filter: { roll: rec.roll, branch: rec.branch },
            update: { $set: { year: rec.year, room: rec.room, location: rec.location } },
            upsert: true
          }
        });
      }
      // if an existing same-branch record exists we skip (either duplicate or conflict)
    });

    const bulkResult = ops.length > 0 ? await Seat.bulkWrite(ops, { ordered: false }) : null;

    // Compute counts based on earlier categorization
    const insertedCount = newRolls.length;
    const conflictCount = conflictRolls.length;
    const modifiedCount = (bulkResult && (bulkResult.modifiedCount || bulkResult.nModified || (bulkResult.result && bulkResult.result.nModified))) || 0;

    res.json({
      message: `Range processed`,
      generated,
      inserted: insertedCount,
      conflicts: conflictCount,
      modified: modifiedCount,
      insertedRolls: newRolls,
      conflictRolls
    });
  } catch (err) {
    console.error("Error inserting range:", err);
    res.status(500).json({ message: "Server error while processing range" });
  }
});

/* STUDENT – Search seat */
router.get("/search", async (req, res) => {
  try {
    const { roll, branch, year } = req.query;

    if (!roll || !branch || !year) {
      return res.status(400).json({ message: "roll, branch and year are required" });
    }

    const branchUpper = String(branch).toUpperCase();
    const yearNum = Number(year);

    if (Number.isNaN(yearNum)) {
      return res.status(400).json({ message: "year must be a number" });
    }

    const rollParam = String(roll).trim().toUpperCase();

    let query = { branch: branchUpper, year: yearNum };

    // If rollParam is only digits, treat it as a suffix search (allow matching padded numbers)
    if (/^[0-9]+$/.test(rollParam)) {
      // escape digits (not strictly necessary) and allow leading zeros before the digits
      const digits = rollParam.replace(/[^0-9]/g, '');
      // regex to match any roll that ends with optional zeros then the digits (case-insensitive)
      query.roll = { $regex: new RegExp(`0*${digits}$`, 'i') };
    } else {
      // full roll provided -> exact match
      query.roll = rollParam;
    }

    const seat = await Seat.findOne(query).lean();

    if (!seat) {
      return res.status(404).json({ message: "Seat not found" });
    }

    res.json(seat);
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Status endpoint — quick health info (used by admin UI)
router.get('/status', (req, res) => {
  const hasMongoUri = !!process.env.MONGO_URI;
  const hasAdminKey = !!process.env.ADMIN_API_KEY;
  const readyState = mongoose.connection.readyState; // 0 disconnected,1 connected,2 connecting,3 disconnecting

  res.json({
    mongoUriConfigured: hasMongoUri,
    adminApiKeyConfigured: hasAdminKey,
    dbState: readyState,
    dbConnected: readyState === 1
  });
});

// Admin utility: clear all seat documents
router.post('/clear', async (req, res) => {
  try {
    const result = await Seat.deleteMany({});
    // result may have deletedCount or n
    const deleted = result.deletedCount || result.n || 0;
    res.json({ message: 'Database cleared', deleted });
  } catch (err) {
    console.error('Error clearing DB:', err);
    res.status(500).json({ message: 'Failed to clear database', error: err.message });
  }
});

module.exports = router;
