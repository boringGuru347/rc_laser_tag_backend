import express from 'express';
import mongoose from 'mongoose';
import registeredSchema from '../models/schema1.js';
const router = express.Router();

const Registered = mongoose.model('Registered', registeredSchema, 'registered');

// Global variables to store mapped game data
let storedGameData = null;
let storedDocumentId = null;

// POST endpoint - Receives game stats, maps data, stores globally
router.post('/', async (req, res) => {
    try {
        // Get game statistics from POST body
        const { players, team1Score, team2Score, gameIsActive } = req.body;

        // Fetch the first document from MongoDB
        const firstDoc = await Registered.findOne().sort({ $natural: 1 });
        
        if (!firstDoc) {
            return res.status(404).json({ message: 'No registrations found' });
        }

        // Convert MongoDB document to plain object
        const docObj = firstDoc.toObject();

        // Create a combined list of all players from both teams
        const allTeamPlayers = [
            ...(docObj.team_one || []),
            ...(docObj.team_two || [])
        ];

        // Map player statistics to team members
        const enrichedPlayers = (players || []).map(player => {
            // Calculate the index based on player id (assuming sequential 1, 2, 3, 4...)
            const playerIndex = player.id - 1;
            
            // Get corresponding team member data
            const teamMember = allTeamPlayers[playerIndex] || {};
            
            // Merge player stats with team member info
            return {
                ...player,
                name: teamMember.name || player.name,
                rollNumber: teamMember.rollNumber || teamMember.roll,
                email: teamMember.email,
                mobile: teamMember.mobile
            };
        });

        // Create merged data
        const mergedData = {
            ...docObj,
            players: enrichedPlayers,
            team1Score: team1Score || 0,
            team2Score: team2Score || 0,
            gameIsActive: gameIsActive || false
        };

        // Store in global variables
        storedGameData = mergedData;
        storedDocumentId = firstDoc._id;

        console.log('Game data mapped and stored globally');
        res.status(200).json({ 
            message: 'Game data received and stored',
            success: true 
        });
    } catch (error) {
        console.error('Error mapping game data:', error);
        res.status(500).json({ 
            message: 'Internal server error', 
            error: error.message 
        });
    }
});

// GET endpoint - Frontend requests data, sends stored data, resets globals
router.get('/', async (req, res) => {
    try {
        // Check if there's stored data
        if (!storedGameData) {
            return res.status(404).json({ 
                message: 'No game data available',
                success: false 
            });
        }

        // Send the stored mapped data to frontend
        const dataToSend = storedGameData;
        const docId = storedDocumentId;

        // Reset global variables first
        storedGameData = null;
        storedDocumentId = null;

        // Delete the document from MongoDB
        if (docId) {
            await Registered.findByIdAndDelete(docId);
            console.log('Document deleted after sending to frontend');
        }

        // Send merged data to frontend
        console.log('Sending game data to frontend:', dataToSend);
        res.status(200).json(dataToSend);
    } catch (error) {
        console.error('Error sending game data to frontend:', error);
        res.status(500).json({ 
            message: 'Internal server error', 
            error: error.message 
        });
    }
});

export default router;
