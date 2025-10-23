import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Calendar, Users, RefreshCw } from 'lucide-react';

const API_BASE_URL = 'http://localhost:3000';

const GameSchedule = () => {
  const [upcomingGames, setUpcomingGames] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Convert "HH:MM" to minutes since midnight
  const timeToMinutes = (timeStr) => {
    if (!timeStr || typeof timeStr !== 'string') return 0;
    const [h, m] = timeStr.split(':').map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) return 0;
    return h * 60 + m;
  };

  // Get current time in minutes since midnight
  const getCurrentMinutes = () => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  };

  // Fetch upcoming games
  const fetchUpcomingGames = useCallback(async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setIsRefreshing(true);
      
      console.log('Fetching games from:', `${API_BASE_URL}/teams?limit=5`);
      const response = await fetch(`${API_BASE_URL}/teams?limit=5`);
      
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Received data:', data);
        
        if (data.success && data.teams && data.teams.length > 0) {
          console.log('Setting upcoming games:', data.teams.length, 'games');
          setUpcomingGames(data.teams);
        } else {
          console.log('No games in response or unsuccessful');
          setUpcomingGames([]);
        }
        setIsLoading(false);
      } else {
        console.error('Response not OK:', response.status);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error fetching games:', error);
      setIsLoading(false);
    } finally {
      if (isManualRefresh) {
        // Keep refresh icon spinning for at least 500ms for visual feedback
        setTimeout(() => setIsRefreshing(false), 500);
      }
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchUpcomingGames();
  }, [fetchUpcomingGames]);

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  // Check if first game's time has passed and refetch if needed
  useEffect(() => {
    if (upcomingGames.length > 0) {
      const firstGame = upcomingGames[0];
      const firstGameTime = timeToMinutes(firstGame.play_time);
      const currentMinutes = getCurrentMinutes();

      // If first game's time has passed, fetch new games
      if (firstGameTime < currentMinutes) {
        console.log('First game time has passed, fetching new games...');
        fetchUpcomingGames();
      }
    }
  }, [currentTime, upcomingGames, fetchUpcomingGames]);

  // Check if a game time has passed
  const hasTimePassed = (playTime) => {
    const gameMinutes = timeToMinutes(playTime);
    const currentMinutes = getCurrentMinutes();
    return gameMinutes < currentMinutes;
  };

  // Calculate time difference
  const getTimeUntilGame = (playTime) => {
    const gameMinutes = timeToMinutes(playTime);
    const currentMinutes = getCurrentMinutes();
    const diff = gameMinutes - currentMinutes;

    if (diff < 0) return 'Started';
    if (diff === 0) return 'Now';
    
    const hours = Math.floor(diff / 60);
    const minutes = diff % 60;
    
    if (hours > 0) {
      return `in ${hours}h ${minutes}m`;
    }
    return `in ${minutes}m`;
  };

  if (isLoading) {
    return (
      <div className="bg-black/40 border-2 border-gray-700 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-purple-400" />
            Upcoming Games
          </h2>
        </div>
        <div className="text-center text-gray-400">Loading schedule...</div>
      </div>
    );
  }

  if (upcomingGames.length === 0) {
    return (
      <div className="bg-black/40 border-2 border-gray-700 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-purple-400" />
            Upcoming Games
          </h2>
          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchUpcomingGames(true)}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:cursor-not-allowed text-white rounded-lg transition-all duration-200 shadow-lg hover:shadow-purple-500/50 text-sm"
            >
              <RefreshCw 
                className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} 
              />
              <span className="hidden sm:inline">{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
            <div className="text-sm text-gray-400 flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
        <div className="text-center text-gray-400 py-8">
          <Calendar className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg">No upcoming games scheduled</p>
          <p className="text-sm mt-2">Register players to create new games</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-900/80 to-purple-900/50 border-2 border-purple-600 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 flex items-center gap-2">
          <Calendar className="w-6 h-6 text-purple-400" />
          Upcoming Games
        </h2>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchUpcomingGames(true)}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:cursor-not-allowed text-white rounded-lg transition-all duration-200 shadow-lg hover:shadow-purple-500/50 text-sm"
          >
            <RefreshCw 
              className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} 
            />
            <span className="hidden sm:inline">{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
          <div className="text-sm text-gray-400 flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {upcomingGames.map((game, index) => {
            const isPast = hasTimePassed(game.play_time);
            const isCurrent = index === 0 && !isPast;
            
            return (
              <motion.div
                key={game.game_no}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className={`p-4 rounded-lg border-2 transition-all ${
                  isCurrent
                    ? 'bg-gradient-to-r from-green-900/50 to-emerald-900/50 border-green-500 shadow-lg shadow-green-500/20'
                    : isPast
                    ? 'bg-gray-800/30 border-gray-600 opacity-50'
                    : 'bg-black/40 border-purple-700/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                      isCurrent
                        ? 'bg-green-500 text-black'
                        : isPast
                        ? 'bg-gray-600 text-gray-400'
                        : 'bg-purple-600 text-white'
                    }`}>
                      #{game.game_no}
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className={`font-bold text-lg ${
                          isCurrent ? 'text-green-400' : isPast ? 'text-gray-500' : 'text-white'
                        }`}>
                          {game.play_time}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Users className="w-3 h-3 text-gray-500" />
                        <span className="text-xs text-gray-400">
                          {(game.team_one?.length || 0) + (game.team_two?.length || 0)} Players
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    {isCurrent && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="text-green-400 font-bold text-sm mb-1 flex items-center gap-1"
                      >
                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                        NEXT UP
                      </motion.div>
                    )}
                    <div className={`text-sm font-semibold ${
                      isPast ? 'text-gray-500' : 'text-purple-400'
                    }`}>
                      {getTimeUntilGame(game.play_time)}
                    </div>
                  </div>
                </div>

                {/* Team Preview */}
                {!isPast && (
                  <div className="mt-3 pt-3 border-t border-gray-700/50 grid grid-cols-2 gap-2 text-xs">
                    <div className="text-gray-400">
                      <span className="text-red-400 font-bold">♥️ Team 1:</span>{' '}
                      {game.team_one?.length || 0} players
                    </div>
                    <div className="text-gray-400">
                      <span className="text-yellow-400 font-bold">♠️ Team 2:</span>{' '}
                      {game.team_two?.length || 0} players
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <div className="mt-4 text-center text-xs text-gray-500">
        Showing next {upcomingGames.length} game{upcomingGames.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
};

export default GameSchedule;
