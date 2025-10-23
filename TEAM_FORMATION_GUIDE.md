# Team Formation and NFC Reader Integration

## Overview
The system now supports automatic team formation based on player registration from **three sources**:
1. **NFC Card Reader** (PN532)
2. **Manual Guest Registration** (Frontend form)
3. **Database Student Registration** (Roll number lookup)

## Team Formation Logic

### How It Works:
- **First 3 players** → Team 1 (Team Hearts ♥️)
- **Next 3 players** → Team 2 (Team Spades ♠️)
- **After 6 players** → Game is created and saved to database
- **Teams reset** → Ready for next 6 players

### Player Sources:

#### 1. NFC Card Reader (PN532)
- Reads roll number from NFC tag memory (Block 1)
- Automatically sends to `/register` endpoint
- Backend looks up student in database
- If found: Uses student data (name, roll)
- If not found: Uses roll number as guest

#### 2. Guest Registration (Frontend)
- User clicks "Register Guest" button
- Fills form: Email, Mobile, Name
- System assigns `roll: "1"` internally
- Sent to `/register` endpoint as guest player

#### 3. Database Lookup
- NFC reader sends roll number
- Backend queries MongoDB students collection
- Returns full student data if found

## New Features Added

### Frontend (App.jsx)

#### 1. **NFC Reader Control Button**
- **"▶ Start NFC"** - Starts the NFC reader process
- **"⏹ Stop NFC"** - Stops the NFC reader process
- Shows red pulsing animation when running
- Located in header next to other controls

#### 2. **Team Building Status Panel**
- Shows real-time team formation progress
- Displays both teams side-by-side
- Shows player count (X/3 players)
- Highlights which team is currently filling
- Shows player names as they join
- Green checkmark when both teams complete

#### 3. **Real-time Updates**
- Polls `/current-teams` every 2 seconds when NFC reader is active
- Updates team building status automatically
- Shows visual feedback for team progress

### Backend

#### 1. **NFC Control Routes** (`/nfc/start`, `/nfc/stop`, `/nfc/status`)

**File:** `backend/routes/nfc_control.js`

**Endpoints:**
- `POST /nfc/start` - Start NFC reader process
  - Spawns Node.js child process
  - Runs `pn532.js/examples/nfc-read-memory.js`
  - Environment variables: SERIAL_PATH, BACKEND_URL
  - Returns process PID

- `POST /nfc/stop` - Stop NFC reader process
  - Kills the running process gracefully
  - Returns success confirmation

- `GET /nfc/status` - Check if NFC reader is running
  - Returns: `{running: boolean, pid: number}`

#### 2. **Current Teams Endpoint** (`GET /current-teams`)

**Returns:**
```json
{
  "team_1": [...],
  "team_2": [...],
  "team_no": 1,
  "team_1_count": 2,
  "team_2_count": 0
}
```

## API Endpoints Summary

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/register` | POST | Register a player (from any source) |
| `/reset` | POST | Clear current teams |
| `/current-teams` | GET | Get team building status |
| `/teams` | GET | Get list of completed games |
| `/retrieve` | GET | Get and delete first game |
| `/nfc/start` | POST | Start NFC reader |
| `/nfc/stop` | POST | Stop NFC reader |
| `/nfc/status` | GET | Check NFC reader status |

## Usage Flow

### Starting a Game Session:

1. **Click "▶ Start NFC" button** in frontend
   - Backend spawns NFC reader process
   - Button turns red and pulses
   - Team building panel appears (empty)

2. **Players register** via any method:
   - **Option A:** Scan NFC card (automatic)
   - **Option B:** Click "Register Guest" (manual form)
   - **Option C:** Backend finds student by roll number

3. **Watch teams fill up**:
   - Team building panel updates in real-time
   - First 3 players go to Team Hearts
   - Next 3 players go to Team Spades

4. **Game created automatically**:
   - After 6th player, game is saved to database
   - Teams reset for next game
   - Green checkmark shows completion

5. **Stop when done**:
   - Click "⏹ Stop NFC" to stop the reader

### Guest Registration:

1. Click "Register Guest" button
2. Fill form:
   - Email: `player@example.com`
   - Mobile: `1234567890` (10 digits)
   - Name: `John Doe`
3. Click "Register Now"
4. Player added to current team
5. Modal closes automatically on success

## Configuration

### NFC Reader Settings

**Environment Variables:**
```bash
SERIAL_PATH=COM5          # Windows COM port for PN532
BACKEND_URL=http://localhost:3000
```

**Default Values** (in `nfc-read-memory.js`):
- Serial Port: COM5
- Backend URL: http://localhost:3000

### Change COM Port:

Edit `backend/routes/nfc_control.js`:
```javascript
SERIAL_PATH: process.env.SERIAL_PATH || 'COM5'
```

Or set environment variable before starting backend:
```bash
set SERIAL_PATH=COM6
npm start
```

## UI Components

### Header Controls (Top):
```
⚡ BLAZE ⚡
WELCOME TO THE BORDERLAND

[● Connected] [🔄 Refresh] [👤+ Register Guest] [▶ Start NFC]
```

### Team Building Panel (When Active):
```
🎮 Team Formation in Progress

┌─────────────────┬─────────────────┐
│ ♥️ Team Hearts  │ ♠️ Team Spades  │
│ (Filling...)    │                 │
├─────────────────┼─────────────────┤
│ ✓ Player 1      │ ○ Player 1      │
│ ✓ Player 2      │ ○ Player 2      │
│ ✓ Player 3      │ ○ Player 3      │
│                 │                 │
│ 3/3 Players     │ 0/3 Players     │
└─────────────────┴─────────────────┘
```

### Completed Games Display (Below):
```
┌────────────────────────────────────┐
│ TEAM HEARTS ♥️  │  TEAM SPADES ♠️ │
├────────────────────────────────────┤
│ Player rankings with K/D stats...  │
└────────────────────────────────────┘

Game 1 of 5 | Play Time: 14:30
[← Previous] [Next →]
```

## Testing

### Test Team Formation:

1. Start backend: `cd backend && npm start`
2. Start frontend: `cd frontend && npm run dev`
3. Open browser: `http://localhost:5173`
4. Click "▶ Start NFC"
5. Register 6 players using any method:
   - Scan 6 NFC cards, OR
   - Click "Register Guest" 6 times, OR
   - Mix of both methods
6. Watch teams fill automatically
7. After 6th player, game appears in display

### Test NFC Reader:

```bash
cd pn532.js/examples
set SERIAL_PATH=COM5
node nfc-read-memory.js
# Scan card to test
```

## Troubleshooting

### NFC Reader Won't Start:
- Check COM port is correct
- Verify PN532 device is connected
- Check backend logs for errors
- Try stopping and restarting

### Players Not Appearing:
- Check `/current-teams` endpoint manually
- Verify backend is receiving POST requests
- Check browser console for errors
- Ensure polling is active (NFC reader running)

### Team Building Panel Not Showing:
- Click "▶ Start NFC" button
- Check if any players have registered
- Verify `/current-teams` returns data
- Check browser console logs

## Files Modified

### Frontend:
- `src/App.jsx` - Added NFC control, team building UI
- `src/RegistrationModal.jsx` - Existing guest registration

### Backend:
- `routes/read_json.js` - Added `/current-teams` endpoint, imported NFC routes
- `routes/nfc_control.js` - NEW FILE - NFC reader control
- NFC reader already configured in `pn532.js/examples/nfc-read-memory.js`

## Key Benefits

✅ Three input methods (NFC, Manual, Database)
✅ Automatic team balancing (3 vs 3)
✅ Real-time visual feedback
✅ No manual team assignment needed
✅ Start/stop NFC reader from UI
✅ Works with existing backend logic
✅ Supports guest players and students

**The system now fully supports team formation from any player source!**
