# Quick Start Guide

## 1. Start Backend Server

```bash
cd "c:\Users\yawal\OneDrive\Desktop\Rc\lasertag\New folder - Copy\backend"
npm install
npm start
```

Expected output:
```
MongoDB connected
Server running at http://localhost:3000
```

## 2. Start Frontend

```bash
cd "c:\Users\yawal\OneDrive\Desktop\Rc\lasertag\New folder - Copy\frontend"
npm install
npm run dev
```

Expected output:
```
VITE ready
Local: http://localhost:5173/
```

## 3. Test the Integration

### Option A: Manual API Test
```bash
# Test backend is running
curl http://localhost:3000/teams

# Test reset endpoint
curl -X POST http://localhost:3000/reset
```

### Option B: Browser Test
1. Open browser to `http://localhost:5173/`
2. You should see:
   - "⚡ BLAZE ⚡" header
   - "WELCOME TO THE BORDERLAND" subtitle
   - "● Connected" (green dot) - connection status
   - "Waiting for players..." in both teams

### Option C: Register Players (Simulate NFC Scans)

Use Postman or curl to register 6 players:

```bash
# Player 1
curl -X POST http://localhost:3000/register -H "Content-Type: application/json" -d "{\"roll\":\"1\",\"name\":\"Player1\"}"

# Player 2
curl -X POST http://localhost:3000/register -H "Content-Type: application/json" -d "{\"roll\":\"1\",\"name\":\"Player2\"}"

# Player 3
curl -X POST http://localhost:3000/register -H "Content-Type: application/json" -d "{\"roll\":\"1\",\"name\":\"Player3\"}"

# Player 4
curl -X POST http://localhost:3000/register -H "Content-Type: application/json" -d "{\"roll\":\"1\",\"name\":\"Player4\"}"

# Player 5
curl -X POST http://localhost:3000/register -H "Content-Type: application/json" -d "{\"roll\":\"1\",\"name\":\"Player5\"}"

# Player 6 - This will create the game
curl -X POST http://localhost:3000/register -H "Content-Type: application/json" -d "{\"roll\":\"1\",\"name\":\"Player6\"}"
```

After 6th player, the frontend should automatically display the teams within 2 seconds.

## 4. Verify Integration

✅ **Success Indicators:**
- Frontend shows "● Connected" (green)
- Teams populate with player names after 6 registrations
- Both teams show 3 players each
- Players show: Name, Kills (0), Deaths (0), K/D (0.00)

❌ **Troubleshooting:**

| Issue | Solution |
|-------|----------|
| "● Disconnected" (red) | Check backend is running on port 3000 |
| CORS errors | Backend has CORS enabled, restart backend |
| No teams showing | Check MongoDB is running and connected |
| Players not registering | Check backend console for errors |

## 5. Reset and Test Again

```bash
# Reset teams
curl -X POST http://localhost:3000/reset
```

Frontend should clear and show "Waiting for players..." again.

## Common Issues

### Port Already in Use
If port 3000 or 5173 is in use:

```bash
# Find process using port 3000 (Windows)
netstat -ano | findstr :3000

# Kill process (replace PID)
taskkill /PID <process_id> /F
```

### MongoDB Not Running
```bash
# Start MongoDB service (Windows)
net start MongoDB

# Or start manually
mongod --dbpath "path\to\data"
```

### Dependencies Not Installed
```bash
# Backend
cd backend
npm install

# Frontend  
cd frontend
npm install
```

## API Endpoints Reference

| Endpoint | Method | Description | Example |
|----------|--------|-------------|---------|
| `/register` | POST | Register a player | `{"roll":"1","name":"John"}` |
| `/reset` | POST | Clear current teams | - |
| `/retrieve` | GET | Get & delete first game | - |
| `/teams` | GET | List all games | Query: `?limit=5` |

## Next Steps

1. ✅ Backend and Frontend connected
2. ✅ Teams display correctly
3. ⏳ Integrate NFC reader with `/register` endpoint
4. ⏳ Add kill/death tracking system
5. ⏳ Add match end functionality

Need help? Check `INTEGRATION_SUMMARY.md` for detailed architecture info.
