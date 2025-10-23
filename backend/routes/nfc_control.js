// nfc_control.js - Routes for controlling NFC reader process
import express from 'express';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let nfcProcess = null;

/**
 * POST /start
 * Start the NFC reader process
 */
router.post('/start', (req, res) => {
    if (nfcProcess) {
        return res.status(400).json({ 
            success: false, 
            message: 'NFC reader is already running' 
        });
    }

    try {
        // Path to the NFC reader script
        const nfcScriptPath = path.join(__dirname, '../../pn532.js/examples/nfc-read-memory.js');
        
        console.log('Starting NFC reader:', nfcScriptPath);
        
        // Spawn the NFC reader process
        nfcProcess = spawn('node', [nfcScriptPath], {
            env: {
                ...process.env,
                SERIAL_PATH: process.env.SERIAL_PATH || 'COM5',
                BACKEND_URL: process.env.BACKEND_URL || 'http://localhost:3000'
            }
        });

        // Handle process output
        nfcProcess.stdout.on('data', (data) => {
            console.log(`[NFC] ${data.toString().trim()}`);
        });

        nfcProcess.stderr.on('data', (data) => {
            console.error(`[NFC Error] ${data.toString().trim()}`);
        });

        nfcProcess.on('close', (code) => {
            console.log(`[NFC] Process exited with code ${code}`);
            nfcProcess = null;
        });

        nfcProcess.on('error', (error) => {
            console.error('[NFC] Failed to start process:', error);
            nfcProcess = null;
        });

        return res.status(200).json({ 
            success: true, 
            message: 'NFC reader started successfully',
            pid: nfcProcess.pid
        });

    } catch (error) {
        console.error('Error starting NFC reader:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Failed to start NFC reader',
            error: error.message
        });
    }
});

/**
 * POST /stop
 * Stop the NFC reader process
 */
router.post('/stop', (req, res) => {
    if (!nfcProcess) {
        return res.status(400).json({ 
            success: false, 
            message: 'NFC reader is not running' 
        });
    }

    try {
        console.log('Stopping NFC reader...');
        nfcProcess.kill('SIGTERM');
        nfcProcess = null;

        return res.status(200).json({ 
            success: true, 
            message: 'NFC reader stopped successfully' 
        });

    } catch (error) {
        console.error('Error stopping NFC reader:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Failed to stop NFC reader',
            error: error.message
        });
    }
});

/**
 * GET /status
 * Get NFC reader status
 */
router.get('/status', (req, res) => {
    return res.status(200).json({
        success: true,
        running: nfcProcess !== null,
        pid: nfcProcess ? nfcProcess.pid : null
    });
});

export default router;
