import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Trophy, Crown, Skull, UserPlus } from 'lucide-react';
import RegistrationModal from './RegistrationModal';
import GameSchedule from './GameSchedule';

const API_BASE_URL = 'http://localhost:3000';

const BlazeLeaderboard = () => {
  const [games, setGames] = useState([]);
  const [currentGameIndex, setCurrentGameIndex] = useState(0);
  const [team1, setTeam1] = useState([]);
  const [team2, setTeam2] = useState([]);
  const [matchEnded, setMatchEnded] = useState(false);
  const [victoryData, setVictoryData] = useState(null);
  const [bloodSplatter, setBloodSplatter] = useState(false);
  const [screenShake, setScreenShake] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);
  const [isNFCReaderRunning, setIsNFCReaderRunning] = useState(false);
  const [currentTeamBuilding, setCurrentTeamBuilding] = useState({
    team1: [],
    team2: [],
    nextTeam: 1 // 1 or 2
  });
  const [prevTeamBuilding, setPrevTeamBuilding] = useState({
    team1: [],
    team2: [],
    nextTeam: 1
  });

  // Fetch first 5 games from /teams endpoint
  const fetchGames = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/teams?limit=5`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Games data:', data);
        
        if (data.success && data.teams && data.teams.length > 0) {
          // Check if games data has actually changed to prevent unnecessary re-renders
          const gamesChanged = JSON.stringify(games) !== JSON.stringify(data.teams);
          
          if (gamesChanged) {
            setGames(data.teams);
            
            // Only update displayed game if we're on the first game or current index is out of bounds
            if (currentGameIndex === 0 || currentGameIndex >= data.teams.length) {
              const firstGame = data.teams[0];
              
              // Transform backend data to frontend format
              const team1Data = (firstGame.team_one || []).map(player => ({
                name: player.name || player.rollNumber || 'Unknown',
                rfid: player.rollNumber || player.roll || player._id,
                kills: player.kills || 0,
                deaths: player.deaths || 0
              }));

              const team2Data = (firstGame.team_two || []).map(player => ({
                name: player.name || player.rollNumber || 'Unknown',
                rfid: player.rollNumber || player.roll || player._id,
                kills: player.kills || 0,
                deaths: player.deaths || 0
              }));

              setTeam1(team1Data);
              setTeam2(team2Data);
            }
          }
          setIsConnected(true);
        } else {
          // No games found - reset display
          setGames([]);
          setTeam1([]);
          setTeam2([]);
          setIsConnected(true);
        }
      } else {
        console.error('Error response:', response.status);
        setIsConnected(false);
      }
    } catch (error) {
      console.error('Error fetching games:', error);
      setIsConnected(false);
    }
  }, [games, currentGameIndex]);

  useEffect(() => {
    // Initial fetch
    fetchGames();

    // Poll every 10 seconds for updates (reduced from 3 seconds)
    const interval = setInterval(fetchGames, 10000);

    return () => clearInterval(interval);
  }, [fetchGames]);

  // Manual reset function (can be called via API)
  const handleReset = async () => {
    try {
      await fetch(`${API_BASE_URL}/reset`, { method: 'POST' });
      setGames([]);
      setTeam1([]);
      setTeam2([]);
      setMatchEnded(false);
      setVictoryData(null);
      setCurrentGameIndex(0);
    } catch (error) {
      console.error('Error resetting game:', error);
    }
  };

  // Function to cycle through games (optional feature)
  const nextGame = () => {
    if (games.length > 0 && currentGameIndex < games.length - 1) {
      const nextIndex = currentGameIndex + 1;
      setCurrentGameIndex(nextIndex);
      const nextGameData = games[nextIndex];
      
      const team1Data = (nextGameData.team_one || []).map(player => ({
        name: player.name || player.rollNumber || 'Unknown',
        rfid: player.rollNumber || player.roll || player._id,
        kills: player.kills || 0,
        deaths: player.deaths || 0
      }));

      const team2Data = (nextGameData.team_two || []).map(player => ({
        name: player.name || player.rollNumber || 'Unknown',
        rfid: player.rollNumber || player.roll || player._id,
        kills: player.kills || 0,
        deaths: player.deaths || 0
      }));

      setTeam1(team1Data);
      setTeam2(team2Data);
      setMatchEnded(false);
      setVictoryData(null);
    }
  };

  const previousGame = () => {
    if (currentGameIndex > 0) {
      const prevIndex = currentGameIndex - 1;
      setCurrentGameIndex(prevIndex);
      const prevGameData = games[prevIndex];
      
      const team1Data = (prevGameData.team_one || []).map(player => ({
        name: player.name || player.rollNumber || 'Unknown',
        rfid: player.rollNumber || player.roll || player._id,
        kills: player.kills || 0,
        deaths: player.deaths || 0
      }));

      const team2Data = (prevGameData.team_two || []).map(player => ({
        name: player.name || player.rollNumber || 'Unknown',
        rfid: player.rollNumber || player.roll || player._id,
        kills: player.kills || 0,
        deaths: player.deaths || 0
      }));

      setTeam1(team1Data);
      setTeam2(team2Data);
      setMatchEnded(false);
      setVictoryData(null);
    }
  };

  const triggerBloodSplatter = () => {
    setBloodSplatter(true);
    setScreenShake(true);
    setTimeout(() => {
      setBloodSplatter(false);
      setScreenShake(false);
    }, 1000);
  };

  const handleRegistrationSuccess = (data) => {
    console.log('Registration successful:', data);
    // Optionally refresh games list after registration
    setTimeout(() => {
      fetchGames();
    }, 1000);
  };

  // Start NFC Reader
  const startNFCReader = async () => {
    try {
      console.log('Starting NFC Reader...');
      // Call a backend endpoint to start the NFC reader process
      const response = await fetch(`${API_BASE_URL}/nfc/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        setIsNFCReaderRunning(true);
        console.log('✓ NFC Reader started');
      } else {
        console.error('Failed to start NFC Reader');
        alert('Failed to start NFC Reader. Check if backend supports /nfc/start endpoint.');
      }
    } catch (error) {
      console.error('Error starting NFC Reader:', error);
      alert('Error: ' + error.message);
    }
  };

  // Stop NFC Reader
  const stopNFCReader = async () => {
    try {
      console.log('Stopping NFC Reader...');
      const response = await fetch(`${API_BASE_URL}/nfc/stop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        setIsNFCReaderRunning(false);
        console.log('✓ NFC Reader stopped');
      } else {
        console.error('Failed to stop NFC Reader');
      }
    } catch (error) {
      console.error('Error stopping NFC Reader:', error);
    }
  };

  // Monitor team building progress
  const fetchTeamBuildingStatus = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/current-teams`);
      
      if (response.ok) {
        const data = await response.json();
        
        // Check if data has actually changed
        const newTeam1Length = (data.team_1 || []).length;
        const newTeam2Length = (data.team_2 || []).length;
        const newNextTeam = data.team_no || 1;
        
        const oldTeam1Length = currentTeamBuilding.team1.length;
        const oldTeam2Length = currentTeamBuilding.team2.length;
        const oldNextTeam = currentTeamBuilding.nextTeam;
        
        // Only update state if something actually changed
        if (newTeam1Length !== oldTeam1Length || 
            newTeam2Length !== oldTeam2Length || 
            newNextTeam !== oldNextTeam) {
          
          console.log('Team building status changed:', data);
          
          setCurrentTeamBuilding({
            team1: data.team_1 || [],
            team2: data.team_2 || [],
            nextTeam: data.team_no || 1
          });
        }
      }
    } catch (error) {
      console.error('Error fetching team status:', error);
    }
  }, [currentTeamBuilding]);

  // Poll team building status when NFC reader is running
  useEffect(() => {
    if (isNFCReaderRunning) {
      const interval = setInterval(fetchTeamBuildingStatus, 2000);
      return () => clearInterval(interval);
    }
  }, [isNFCReaderRunning, fetchTeamBuildingStatus]);

  const calculateKD = (kills, deaths) => {
    return deaths === 0 ? kills.toFixed(2) : (kills / deaths).toFixed(2);
  };

  const sortPlayers = (players) => {
    return [...players].sort((a, b) => {
      const kdA = a.deaths === 0 ? a.kills : a.kills / a.deaths;
      const kdB = b.deaths === 0 ? b.kills : b.kills / b.deaths;
      return kdB - kdA;
    });
  };

  const sortedTeam1 = sortPlayers(team1);
  const sortedTeam2 = sortPlayers(team2);

  const handleMatchEnd = () => {
    const team1Score = sortedTeam1.reduce((sum, p) => sum + p.kills, 0);
    const team2Score = sortedTeam2.reduce((sum, p) => sum + p.kills, 0);
    
    const winningTeam = team1Score > team2Score ? 'team1' : 
                       team2Score > team1Score ? 'team2' : 'tie';
    
    const allPlayers = [...sortedTeam1, ...sortedTeam2];
    const mvp = allPlayers.reduce((best, player) => {
      return player.kills > best.kills ? player : best;
    }, allPlayers[0] || {kills: 0});

    setVictoryData({
      winningTeam,
      team1Score,
      team2Score,
      mvp
    });
    
    setMatchEnded(true);
  };

  const BloodSplatter = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 0.7, 0] }}
      transition={{ duration: 1 }}
      className="fixed inset-0 pointer-events-none z-50"
      style={{
        background: 'radial-gradient(circle at 50% 50%, rgba(139, 0, 0, 0.8) 0%, transparent 70%)',
      }}
    >
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute bg-red-900 rounded-full"
          style={{
            width: Math.random() * 100 + 50,
            height: Math.random() * 100 + 50,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          initial={{ scale: 0, opacity: 0.8 }}
          animate={{ 
            scale: [0, 1.5, 1],
            opacity: [0.8, 0.4, 0]
          }}
          transition={{ duration: 1, delay: Math.random() * 0.3 }}
        />
      ))}
    </motion.div>
  );

  const PlayerRow = ({ player, rank, isTop }) => (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={`relative flex items-center justify-between p-4 mb-2 rounded-lg border-2 ${
        isTop 
          ? 'bg-gradient-to-r from-red-900/50 to-yellow-900/50 border-yellow-500' 
          : 'bg-black/40 border-red-800/50'
      }`}
    >

      
      
      <div className="flex items-center gap-4 flex-1">
        <div className={`w-10 h-10 flex items-center justify-center rounded-full font-bold ${
          rank === 1 ? 'bg-yellow-500 text-black' : 
          rank === 2 ? 'bg-gray-400 text-black' : 
          rank === 3 ? 'bg-orange-700 text-white' : 
          'bg-red-900 text-white'
        }`}>
          {rank}
        </div>
        <span className="text-lg font-bold text-white">{player.name}</span>
      </div>
      
      <div className="flex gap-6 text-center">
        <div>
          <div className="text-xs text-gray-400">KILLS</div>
          <div className="text-xl font-bold text-green-400">{player.kills}</div>
        </div>
        <div>
          <div className="text-xs text-gray-400">DEATHS</div>
          <div className="text-xl font-bold text-red-400">{player.deaths}</div>
        </div>
        <div>
          <div className="text-xs text-gray-400">K/D</div>
          <div className="text-xl font-bold text-yellow-400">
            {calculateKD(player.kills, player.deaths)}
          </div>
        </div>
      </div>
    </motion.div>
  );

  const TeamLeaderboard = ({ team, teamName }) => {
    const sorted = sortPlayers(team);
    return (
      <div className="flex-1">
        <div className="bg-gradient-to-r from-red-600 to-yellow-600 p-4 rounded-t-lg">
          <h2 className="text-2xl font-bold text-center text-black">
            {teamName}
          </h2>
        </div>
        <div className="bg-black/60 p-6 rounded-b-lg border-2 border-red-800 min-h-[400px]">
          {sorted.length === 0 ? (
            <div className="text-center text-gray-500 mt-20">
              Waiting for players...
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {sorted.map((player, idx) => (
                <PlayerRow 
                  key={player.rfid} 
                  player={player} 
                  rank={idx + 1}
                  isTop={idx === 0}
                />
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>
    );
  };

  const VictoryScreen = () => {
    if (!victoryData) return null;

    const { winningTeam, team1Score, team2Score, mvp } = victoryData;

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mb-8 bg-gradient-to-r from-yellow-900/50 to-red-900/50 border-4 border-yellow-500 rounded-xl p-8"
      >
        <div className="text-center mb-6">
          <motion.div
            animate={{ 
              rotate: [0, 10, -10, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              repeat: Infinity, 
              duration: 2 
            }}
          >
            <Trophy className="w-24 h-24 mx-auto text-yellow-500 mb-4" />
          </motion.div>
          
          <h2 className="text-5xl font-black text-yellow-500 mb-2">
            {winningTeam === 'tie' ? 'TIE!' : 'VICTORY!'}
          </h2>
          
          {winningTeam !== 'tie' && (
            <h3 className="text-3xl font-bold text-white mb-2">
              {winningTeam === 'team1' ? '♥️ TEAM HEARTS' : '♠️ TEAM SPADES'}
            </h3>
          )}

          <div className="text-2xl font-bold text-white">
            {team1Score} - {team2Score}
          </div>
        </div>

        {/* MVP Section */}
        {mvp && mvp.kills > 0 && (
          <div className="bg-black/50 border-2 border-purple-500 rounded-lg p-6 mt-6">
            <div className="flex items-center justify-center gap-4">
              <Skull className="w-12 h-12 text-purple-500" />
              <div className="text-center">
                <div className="text-purple-400 text-sm font-bold mb-1">MVP - MOST KILLS</div>
                <div className="text-3xl font-black text-white">{mvp.name}</div>
                <div className="text-xl text-yellow-400 mt-1">{mvp.kills} KILLS</div>
              </div>
              <Crown className="w-12 h-12 text-yellow-500" />
            </div>
          </div>
        )}
      </motion.div>
    );
  };

  // Team Building Status Component
  const TeamBuildingStatus = () => {
    const { team1, team2, nextTeam } = currentTeamBuilding;
    
    if (team1.length === 0 && team2.length === 0) return null;

    return (
      <div className="mb-6 bg-gradient-to-r from-purple-900/50 to-blue-900/50 border-2 border-purple-500 rounded-xl p-6">
        <h3 className="text-2xl font-bold text-center text-purple-400 mb-4">
          🎮 Team Formation in Progress
        </h3>
        
        <div className="grid grid-cols-2 gap-4">
          {/* Team 1 */}
          <div className="bg-black/40 border border-red-600 rounded-lg p-4">
            <h4 className="text-lg font-bold text-red-400 mb-2 text-center">
              ♥️ Team Hearts {nextTeam === 1 && '(Filling...)'}
            </h4>
            <div className="space-y-2">
              {[0, 1, 2].map((index) => (
                <div
                  key={`team1-${index}`}
                  className={`p-2 rounded text-center transition-all duration-300 ${
                    team1[index]
                      ? 'bg-red-600/30 text-white font-bold'
                      : 'bg-gray-800/50 text-gray-500'
                  }`}
                >
                  {team1[index]?.name || team1[index]?.rollNumber || `Player ${index + 1}`}
                </div>
              ))}
            </div>
            <div className="mt-2 text-center text-sm text-gray-400">
              {team1.length}/3 Players
            </div>
          </div>

          {/* Team 2 */}
          <div className="bg-black/40 border border-yellow-600 rounded-lg p-4">
            <h4 className="text-lg font-bold text-yellow-400 mb-2 text-center">
              ♠️ Team Spades {nextTeam === 2 && '(Filling...)'}
            </h4>
            <div className="space-y-2">
              {[0, 1, 2].map((index) => (
                <div
                  key={`team2-${index}`}
                  className={`p-2 rounded text-center transition-all duration-300 ${
                    team2[index]
                      ? 'bg-yellow-600/30 text-white font-bold'
                      : 'bg-gray-800/50 text-gray-500'
                  }`}
                >
                  {team2[index]?.name || team2[index]?.rollNumber || `Player ${index + 1}`}
                </div>
              ))}
            </div>
            <div className="mt-2 text-center text-sm text-gray-400">
              {team2.length}/3 Players
            </div>
          </div>
        </div>

        {team1.length === 3 && team2.length === 3 && (
          <div className="mt-4 text-center text-green-400 font-bold text-lg animate-pulse">
            ✓ Both teams complete! Game will start soon...
          </div>
        )}
      </div>
    );
  };

  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-br from-black via-red-950 to-black p-8"
      animate={screenShake ? {
        x: [0, -10, 10, -10, 10, 0],
        y: [0, -10, 10, -10, 10, 0]
      } : {}}
      transition={{ duration: 0.5 }}
    >
      {bloodSplatter && <BloodSplatter />}

      {/* Registration Modal */}
      <RegistrationModal
        isOpen={isRegistrationOpen}
        onClose={() => setIsRegistrationOpen(false)}
        onRegister={handleRegistrationSuccess}
      />

      <div className="max-w-7xl mx-auto">
        <motion.div 
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-8"
        >
          <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-yellow-500 to-red-500 mb-2">
            ⚡ BLAZE ⚡
          </h1>
          <p className="text-xl text-yellow-500 font-bold">
            WELCOME TO THE BORDERLAND
          </p>
          {/* Connection Status Indicator */}
          <div className="mt-2 flex items-center justify-center gap-4">
            <div>
              {isConnected ? (
                <span className="text-green-400 text-sm">● Connected</span>
              ) : (
                <span className="text-red-400 text-sm">● Disconnected</span>
              )}
            </div>
            <button
              onClick={fetchGames}
              className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-black text-sm font-bold rounded transition-all"
            >
              🔄 Refresh
            </button>
            <button
              onClick={() => setIsRegistrationOpen(true)}
              className="px-3 py-1 bg-gradient-to-r from-red-600 to-yellow-600 hover:from-red-700 hover:to-yellow-700 text-white text-sm font-bold rounded transition-all flex items-center gap-1"
            >
              <UserPlus className="w-4 h-4" />
              Register Guest
            </button>
            <button
              onClick={isNFCReaderRunning ? stopNFCReader : startNFCReader}
              className={`px-3 py-1 text-white text-sm font-bold rounded transition-all flex items-center gap-1 ${
                isNFCReaderRunning
                  ? 'bg-red-600 hover:bg-red-700 animate-pulse'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isNFCReaderRunning ? '⏹ Stop NFC' : '▶ Start NFC'}
            </button>
          </div>
        </motion.div>

        {/* Team Building Status */}
        <TeamBuildingStatus />

        {/* Game Schedule */}
        <div className="mb-6">
          <GameSchedule />
        </div>

        {matchEnded && <VictoryScreen />}

        <div className="flex gap-6">
          <TeamLeaderboard team={team1} teamName="TEAM HEARTS ♥️" />
          <TeamLeaderboard team={team2} teamName="TEAM SPADES ♠️" />
        </div>

        {/* Game Navigation & Info */}
        {games.length > 0 && (
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="mt-6 bg-black/60 border-2 border-red-800 rounded-lg p-4"
          >
            <div className="flex items-center justify-between">
              <div className="text-white">
                <span className="text-yellow-500 font-bold">Game {currentGameIndex + 1}</span> of {games.length}
                {games[currentGameIndex]?.play_time && (
                  <span className="ml-4 text-gray-400">
                    Play Time: {games[currentGameIndex].play_time}
                  </span>
                )}
              </div>
              
              {games.length > 1 && (
                <div className="flex gap-2">
                  <button
                    onClick={previousGame}
                    disabled={currentGameIndex === 0}
                    className={`px-4 py-2 rounded-lg font-bold transition-all ${
                      currentGameIndex === 0
                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                        : 'bg-red-600 text-white hover:bg-red-700'
                    }`}
                  >
                    ← Previous
                  </button>
                  <button
                    onClick={nextGame}
                    disabled={currentGameIndex === games.length - 1}
                    className={`px-4 py-2 rounded-lg font-bold transition-all ${
                      currentGameIndex === games.length - 1
                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                        : 'bg-red-600 text-white hover:bg-red-700'
                    }`}
                  >
                    Next →
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default BlazeLeaderboard;