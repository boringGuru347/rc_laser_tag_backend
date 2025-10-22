import express from 'express';
import mongoose from 'mongoose';
import registeredSchema from '../models/schema1.js';
const router = express.Router();

const Registered = mongoose.model('Registered', registeredSchema, 'registered');

router.get('/', async (req, res) => {
    try {
        const firstDoc = await Registered.findOne().sort({ $natural: 1 });
        
        if (!firstDoc) {
            return res.status(404).json({ message: 'No registrations found' });
        }

        // Delete the document first
        await Registered.findByIdAndDelete(firstDoc._id);

        // Then send response
        console.log(firstDoc);
        res.status(200).json(firstDoc);
    } catch (error) {
        console.error('Error retrieving registrations:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

export default router;
