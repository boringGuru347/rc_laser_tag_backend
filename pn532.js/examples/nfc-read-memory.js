/**
 * PN532 Memory Reader - Reads data from NFC tag memory
 * 
 * This script reads memory blocks from NFC tags and converts to string
 * 
 * Usage:
 *   SERIAL_PATH='COM5' node examples/nfc-read-memory.js
 */

import Pn532 from '../src/Pn532.js'
import Pn532SerialPortAdapter from '../src/plugin/SerialPortAdapter.js'
import Pn532Hf14a from '../src/plugin/Hf14a.js'
import Packet from '../src/Packet.js'

const SERIAL_PATH = process.env.SERIAL_PATH || 'COM5'  // Change COM5 to your port
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000'

console.log('PN532 Memory Reader')
console.log('Serial Port:', SERIAL_PATH)
console.log('Backend URL:', BACKEND_URL)
console.log('Waiting for NFC tags...\n')

/**
 * Send roll number to backend
 */
async function sendToBackend(rollNumber) {
    try {
        console.log(`→ Sending to backend: ${rollNumber}`)
        
        const response = await fetch(`${BACKEND_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ roll: rollNumber }),
        })
        
        const data = await response.json()
        console.log(`✓ Response: ${data.message || JSON.stringify(data)}`)
        
    } catch (error) {
        console.error('✗ Error:', error.message)
    }
}

/**
 * Convert hex to readable string
 */
function hexToString(hexStr) {
    let result = ''
    for (let i = 0; i < hexStr.length; i += 2) {
        const hexPair = hexStr.substr(i, 2)
        const charCode = parseInt(hexPair, 16)
        if (charCode >= 32 && charCode <= 126) {
            result += String.fromCharCode(charCode)
        }
    }
    return result.trim()
}

/**
 * Read memory from NFC tag
 */
async function readTagMemory(pn532) {
    try {
        console.log('\n=== Reading NFC Tag ===')
        
        // Step 1: Detect tag
        const target = await pn532.inListPassiveTarget({
            maxTg: 1,
            brTy: 0,
            timeout: 2000,
        })
        
        if (!target || !target.data || target.data.length < 1) {
            return null
        }
        
        // Extract UID
        const uidLen = target.data[5] || 4
        const uid = target.data.subarray(6, 6 + uidLen)
        console.log('UID (Hex):', uid.hex)
        
        // Step 2: Try to read memory blocks
        // MIFARE Classic has blocks 0-63 (1K) or 0-255 (4K)
        // Block 0: Manufacturer data (read-only)
        // Blocks 1-3: Data blocks
        // Block 4+: More data blocks
        
        const defaultKey = Packet.fromHex('FFFFFFFFFFFF') // Default MIFARE key
        
        console.log('\n--- Reading Block 1 ---')
        
        let rollNumber = ''
        
        // Read only block 1
        try {
            const blockData = await pn532.$hf14a.mfReadBlock({
                block: 1,
                isKeyB: false,
                key: defaultKey,
            })
            
            // blockData is a Packet, not an object with .data property
            const hexData = blockData.hex
            const strData = hexToString(hexData)
            
            console.log(`Block 1: ${hexData} → "${strData}"`)
            
            rollNumber = strData
            
        } catch (error) {
            console.log(`Block 1: Cannot read (${error.message})`)
        }
        
        // Clean up the roll number
        rollNumber = rollNumber.trim().replace(/\0/g, '') // Remove null characters
        
        if (rollNumber.length > 0) {
            console.log('\n✓ Extracted Roll Number:', rollNumber)
            return rollNumber
        } else {
            // Fallback to UID if no readable data found
            console.log('\n⚠ No readable data in memory, using UID')
            return uid.hex
        }
        
    } catch (error) {
        if (!error.message.includes('Time Out')) {
            console.error('Error reading tag:', error.message)
        }
        return null
    }
}

/**
 * Main function
 */
async function main() {
    const pn532 = new Pn532()
    
    // Use SerialPort adapter
    pn532.use(new Pn532SerialPortAdapter(), { path: SERIAL_PATH })
    
    // Use HF14A plugin for MIFARE operations
    pn532.use(new Pn532Hf14a())
    
    // Test connection
    const fw = await pn532.getFirmwareVersion()
    console.log(`✓ Connected: PN532 v${fw.firmware}`)
    
    // Configure SAM
    await pn532.samConfiguration()
    console.log('✓ SAM configured\n')
    
    let lastData = ''
    
    // Continuous polling
    while (true) {
        try {
            const rollNumber = await readTagMemory(pn532)
            
            if (rollNumber && rollNumber !== lastData) {
                await sendToBackend(rollNumber)
                lastData = rollNumber
                console.log('\nWaiting for next tag...\n')
            }
            
            await new Promise(r => setTimeout(r, 1000))
            
        } catch (error) {
            if (!error.message.includes('Time Out')) {
                console.error('Polling error:', error.message)
            }
            await new Promise(r => setTimeout(r, 1000))
        }
    }
}

main().catch(console.error)
