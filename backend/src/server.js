// Express server for Laser Tag student lookup
// Features:
// - GET /student/:rollNumber -> returns single student
// - GET /students -> returns all students (optional/testing)
// - CORS enabled
// - Simple request logging with timestamp and rollNumber param
// - On startup, ensures DB connection and imports data if provided

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connect, getCollection } from './db.js';
import { importData } from './importData.js';

dotenv.config();

const PORT = parseInt(process.env.PORT || '3000', 10);

async function start() {
  await connect();
  const app = express();

  // Middlewares
  app.use(cors());
  app.use(express.json());

  // Logging middleware (method, url, rollNumber if present, timestamp)
  app.use((req, res, next) => {
    const ts = new Date().toISOString();
    const rollParam = req.params?.rollNumber || req.query?.rollNumber || '';
    console.log(`[${ts}] ${req.method} ${req.originalUrl} ${rollParam ? `roll=${rollParam}` : ''}`);
    next();
  });

  // Health
  app.get('/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

  // GET /student/:rollNumber
  app.get('/student/:rollNumber', async (req, res) => {
    const rollNumber = (req.params.rollNumber || '').trim();
    if (!rollNumber) {
      return res.status(400).json({ error: 'Roll number is required' });
    }
    try {
      // Route-level log to ensure rollNumber is captured with timestamp
      console.log(`[${new Date().toISOString()}] Lookup roll=${rollNumber}`);
      const coll = getCollection();
      const student = await coll.findOne({ rollNumber });
      if (!student) {
        return res.status(404).json({ error: `Student with roll number ${rollNumber} not found` });
      }
      // Exclude MongoDB internal _id if you want a cleaner response
      const { _id, ...clean } = student;
      return res.json(clean);
    } catch (err) {
      console.error('Error fetching student:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Optional: GET /students (for testing)
  app.get('/students', async (req, res) => {
    try {
      const coll = getCollection();
      const cursor = coll.find({}, { projection: { _id: 0 } }).limit(1000);
      const all = await cursor.toArray();
      return res.json(all);
    } catch (err) {
      console.error('Error fetching students:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Import data at startup
  try {
    await importData();
  } catch (e) {
    console.warn('Data import skipped or failed at startup:', e?.message || e);
  }

  app.listen(PORT, () => {
    console.log(`LaserTag API listening on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
