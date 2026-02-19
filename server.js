require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const fs = require('fs');
const path = require('path');

const seatRoutes = require("./routes/seats");

const app = express();

app.use(cors());
app.use(express.json());

// log current working directory
console.log('cwd:', process.cwd());

// Serve static files from both client/dist (if present) and public/ so legacy pages like
// public/admin.html remain accessible even after building the React client.
// Use __dirname (the repository root where server.js lives) so the server works
// regardless of the current working directory when starting node.
const repoRoot = __dirname;
const clientDist = path.join(repoRoot, 'client', 'dist');
if (fs.existsSync(clientDist)) {
  console.log('serving static from', clientDist);
  app.use(express.static(clientDist));
} else {
  console.log('client/dist not found; skipping');
}

// Always serve public/ too (public has admin.html and any legacy assets)
const publicDir = path.join(repoRoot, 'public');
console.log('serving static from', publicDir);
app.use(express.static(publicDir));

// Friendly admin route: serve public/admin.html at /admin
app.get('/admin', (req, res) => {
  const adminPath = path.join(publicDir, 'admin.html');
  console.log('/admin requested, sending', adminPath, 'exists?', fs.existsSync(adminPath));
  res.sendFile(adminPath, err => {
    if (err) {
      console.error('sendFile error for /admin:', err && err.message);
      // fallback: send root index if available
      res.status(err.status || 500).send(err.status ? 'Not found' : 'Server error');
    }
  });
});

// Also support direct /admin.html URL
app.get('/admin.html', (req, res) => {
  const adminPath = path.join(publicDir, 'admin.html');
  console.log('/admin.html requested, sending', adminPath, 'exists?', fs.existsSync(adminPath));
  res.sendFile(adminPath, err => {
    if (err) {
      console.error('sendFile error for /admin.html:', err && err.message);
      res.status(err.status || 500).send(err.status ? 'Not found' : 'Server error');
    }
  });
});

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
