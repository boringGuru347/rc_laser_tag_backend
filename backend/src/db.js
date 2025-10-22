// MongoDB connection helper
// - Connects using MONGODB_URI
// - Exposes getDb and getCollection helpers
// - Ensures unique index on students.rollNumber

import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const dbName = process.env.DB_NAME || 'lasertag';
const collectionName = process.env.COLLECTION_NAME || 'students';

let client; // shared client instance
let db;

export async function connect() {
  if (db) return db;
  client = new MongoClient(uri, { ignoreUndefined: true });
  await client.connect();
  db = client.db(dbName);

  // Ensure collection and unique index on rollNumber
  const coll = db.collection(collectionName);
  await coll.createIndex({ rollNumber: 1 }, { unique: true, name: 'uniq_rollNumber' });
  return db;
}

export function getDb() {
  if (!db) throw new Error('Database not initialized. Call connect() first.');
  return db;
}

export function getCollection() {
  return getDb().collection(collectionName);
}

export async function close() {
  if (client) await client.close();
  client = undefined;
  db = undefined;
}
