// display_team.js
import express from 'express';
import mongoose from 'mongoose';
import registeredSchema from '../models/schema1.js';

const router = express.Router();

// Prevent model re-declaration across imports
const Registered = mongoose.models.Registered || mongoose.model('Registered', registeredSchema, 'registered');

/**
 * Convert "HH:MM" -> minutes (fallback 0 on invalid/missing)
 */
function timeToMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  const [h, m] = timeStr.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return 0;
  return h * 60 + m;
}

/**
 * GET /
 * Returns up to `limit` teams sorted by play_time (earliest first).
 * Mount this router at /api/teams to expose GET /api/teams
 *
 * Query params:
 *   ?limit=5   (optional, default 5, max 50)
 */
router.get('/', async (req, res) => {
  try {
    const rawLimit = Number(req.query.limit) || 5;
    const limit = Math.max(1, Math.min(50, Math.floor(rawLimit)));

    const docs = await Registered.find({})
      .select('-__v')
      .lean()
      .exec();

    const total = docs.length;

    // Sort by play_time (converted to minutes) to ensure correct ordering
    docs.sort((a, b) => timeToMinutes(a.play_time) - timeToMinutes(b.play_time));

    const teams = docs.slice(0, limit);

    return res.status(200).json({
      success: true,
      count: teams.length,
      total,
      teams,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Error in GET /api/teams:', err);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: err.message,
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
