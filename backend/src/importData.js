// Import student data from JSON into MongoDB
// - Reads DATA_JSON_PATH (relative to this file or project root)
// - Normalizes fields to { rollNumber, name, email, mobile }
// - Upserts by rollNumber to avoid duplicates

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { connect, getCollection } from './db.js';

dotenv.config();

// __dirname replacement for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const defaultJsonPath = path.resolve(__dirname, '..', '..', 'contacts_rolls.json');
const dataPathEnv = process.env.DATA_JSON_PATH
  ? path.resolve(__dirname, '..', process.env.DATA_JSON_PATH)
  : defaultJsonPath;

function normalizeRecord(r) {
  if (!r) return null;
  // Input JSON uses key 'roll'
  const roll = (r.roll || r.rollNumber || '').toString().trim();
  if (!roll) return null;
  return {
    rollNumber: roll,
    name: (r.name || '').toString().trim(),
    email: (r.email || '').toString().trim(),
    mobile: (r.mobile || '').toString().trim(),
  };
}

export async function importData() {
  await connect();
  const coll = getCollection();

  // Read and parse JSON
  const jsonRaw = fs.readFileSync(dataPathEnv, 'utf-8');
  let items = JSON.parse(jsonRaw);
  if (!Array.isArray(items)) {
    throw new Error('JSON root must be an array of students');
  }

  const docs = [];
  for (const r of items) {
    const doc = normalizeRecord(r);
    if (doc) docs.push(doc);
  }

  if (!docs.length) {
    console.log('No valid records to import.');
    return { inserted: 0, upserted: 0 };
  }

  // Bulk upsert by rollNumber
  const ops = docs.map((d) => ({
    updateOne: {
      filter: { rollNumber: d.rollNumber },
      update: { $set: d },
      upsert: true,
    },
  }));

  const result = await coll.bulkWrite(ops, { ordered: false });
  const upserted = result.upsertedCount || 0;
  const modified = result.modifiedCount || 0;
  console.log(`Import complete. Upserted: ${upserted}, Modified: ${modified}`);
  return { upserted, modified };
}

// ESM equivalent of "if (require.main === module)"
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  importData()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Import failed:', err);
      process.exit(1);
    });
}
