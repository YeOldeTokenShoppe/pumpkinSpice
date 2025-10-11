import React, { useState, useEffect, useCallback } from "react";
import { useMusic } from "@/components/MusicContext";


const MusicPlayer3 = React.forwardRef(
  ({ isVisible, autoPlay = true, is80sMode = false }, ref) => {
    

    // Get ALL shared functions and state from MusicContext
    const { 
      audioRef, 
      currentTrackIndex: contextTrackIndex,
      isPlaying: contextIsPlaying,
      volume: contextVolume,
      setVolume: setContextVolume,
      loadTrack: contextLoadTrack,
      play: contextPlay,
      pause: contextPause,
      nextTrack: contextNextTrack,
      prevTrack: contextPrevTrack,
      currentTrack,
      isLoadingTrack,
      non80sTracks,
      eightyTracks,
      setIs80sMode: setContext80sMode
    } = useMusic();
    
    // Use context values directly, only keep local state for UI-specific things
    const currentTrackIndex = contextTrackIndex || 0;
    const isPlaying = contextIsPlaying || false;
    const isLoading = isLoadingTrack || false;
    const volume = contextVolume;
    const [currentTime, setCurrentTime] = useState("00:00");
    const [duration, setDuration] = useState("00:00");
    const [playProgress, setPlayProgress] = useState(0);
    const [isShuffled, setIsShuffled] = useState(false);
    const [shuffledQueue, setShuffledQueue] = useState([]);
    
    // Get current playlist based on mode from context
    const currentPlaylist = is80sMode ? eightyTracks : non80sTracks;
    
    // Format time
    const formatTime = (seconds) => {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins < 10 ? "0" : ""}${mins}:${secs < 10 ? "0" : ""}${secs}`;
    };
    
    // Update progress
    const updateProgress = useCallback(() => {
      if (!audioRef.current) return;
      
      const currentTimeValue = audioRef.current.currentTime;
      const durationValue = audioRef.current.duration;
      
      if (!durationValue || isNaN(durationValue) || !isFinite(durationValue)) {
        return;
      }
      
      setCurrentTime(formatTime(currentTimeValue));
      setDuration(formatTime(durationValue));
      setPlayProgress((currentTimeValue / durationValue) * 100);
    }, [audioRef]);
    
    // Update 80s mode in context when prop changes
    useEffect(() => {
      if (setContext80sMode) {
        setContext80sMode(is80sMode);
      }
    }, [is80sMode, setContext80sMode]);
    
    // Use context functions for play/pause
    const togglePlayPause = useCallback(() => {
      if (isPlaying) {
        contextPause();
      } else {
        contextPlay();
      }
    }, [isPlaying, contextPlay, contextPause]);
    
    // Skip to next/prev track using context functions
    const changeTrack = useCallback((direction) => {
      if (direction === 1) {
        contextNextTrack();
      } else {
        contextPrevTrack();
      }
    }, [contextNextTrack, contextPrevTrack]);
    
    // Toggle shuffle
    const toggleShuffle = useCallback(() => {
      const newShuffleState = !isShuffled;
      
      if (newShuffleState) {
        const playlist = is80sMode ? eightyTracks : non80sTracks;
        const allTracks = [...Array(playlist.length).keys()];
        const shuffled = allTracks
          .filter((index) => index !== currentTrackIndex)
          .sort(() => Math.random() - 0.5);
        const newQueue = [currentTrackIndex, ...shuffled];
        setShuffledQueue(newQueue);
      } else {
        setShuffledQueue([]);
      }
      
      setIsShuffled(newShuffleState);
    }, [isShuffled, is80sMode, currentTrackIndex]);
    
    // Handle volume change
    const handleVolumeChange = (e) => {
      const newVolume = parseFloat(e.target.value);
      setContextVolume(newVolume);
    };
    
    // Handle seek
    const handleSeek = (e) => {
      const audio = audioRef.current;
      if (audio && audio.duration) {
        const seekTime = (e.nativeEvent.offsetX / e.target.clientWidth) * audio.duration;
        audio.currentTime = seekTime;
        updateProgress();
      }
    };
    
    // Volume is now handled by context
    
    // Initialize and sync with existing audio
    useEffect(() => {
      if (!audioRef.current) return;
      
      const hasAudioSource = !!audioRef.current.src;
      const isAudioPlaying = hasAudioSource && !audioRef.current.paused;
      
      console.log('🎵 MusicPlayer3 Initial Mount Check:', {
        hasAudioSource,
        isAudioPlaying,
        contextIsPlaying,
        contextTrackIndex
      });
      
      // If audio exists, update progress
      if (hasAudioSource) {
        updateProgress();
      }
    }, [audioRef, contextTrackIndex, contextIsPlaying, updateProgress]);
    
    // Handle first-time initialization when becoming visible
    useEffect(() => {
      console.log('🎵 Visibility effect triggered', {
        isVisible,
        autoPlay,
        hasAudioRefSrc: !!audioRef.current?.src,
        contextIsPlaying
      });
      
      if (!isVisible) return;
      
      // If we have audio already playing/loaded from context
      if (audioRef.current?.src) {
        console.log('🎵 Track already loaded globally');
        updateProgress();
        
        // Resume if autoPlay is true and audio is paused
        if (autoPlay && audioRef.current.paused) {
          contextPlay();
        }
        return;
      }
      
      // First time initialization - load first track
      if (!audioRef.current?.src && !isLoading) {
        console.log('🎵 First time initialization, loading track 0');
        contextLoadTrack(0, autoPlay);
      }
    }, [isVisible, autoPlay, audioRef, isLoading, contextPlay, contextLoadTrack, updateProgress]);
    
    
    // Set up event listeners for timeupdate only (play/pause handled by context)
    useEffect(() => {
      if (!audioRef.current) return;
      
      const handleTimeUpdate = () => {
        updateProgress();
      };
      
      const handleLoadedMetadata = () => {
        console.log('🎵 Track metadata loaded, duration:', audioRef.current.duration);
        updateProgress();
      };
      
      const audio = audioRef.current;
      audio.addEventListener('timeupdate', handleTimeUpdate);
      audio.addEventListener('loadedmetadata', handleLoadedMetadata);
      
      return () => {
        audio.removeEventListener('timeupdate', handleTimeUpdate);
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      };
    }, [audioRef, updateProgress]);
    
    // Handle visibility changes
    useEffect(() => {
      if (!isVisible && audioRef.current && isPlaying) {
        contextPause();
      }
    }, [isVisible, audioRef, isPlaying, contextPause]);
    
    // Expose controls via ref
    React.useImperativeHandle(ref, () => {
      console.log('🎵 Setting up imperative handle');
      return {
        play: async () => {
          if (!audioRef.current?.src) {
            console.log('🎵 No audio loaded, loading track 0 before playing');
            await contextLoadTrack(0, true);
          } else {
            console.log('🎵 Audio already loaded, calling play()');
            contextPlay();
          }
        },
        pause: () => contextPause(),
        togglePlayPause: () => togglePlayPause(),
        nextTrack: () => contextNextTrack(),
        prevTrack: () => contextPrevTrack(),
      };
    }, [togglePlayPause, contextPlay, contextPause, contextNextTrack, contextPrevTrack, contextLoadTrack, audioRef]);
    
    // Define colors based on mode
    const accentColor = is80sMode ? "#ff71ce" : "#1DB954";
    const glowColor = is80sMode ? "0 0 15px rgba(255, 113, 206, 0.7)" : "0 0 15px rgba(29, 185, 84, 0.5)";
    
    // Album spin animation
    const albumAnimation = isPlaying ? "rotateAlbumArt 20s linear infinite" : "none";
    
    return (
      <div 
        className="music-player"
        style={{ 
          width: '100%',
          background: 'rgba(0, 0, 0, 0.85)',
          borderTop: `1px solid ${accentColor}30`,
          borderBottom: `1px solid ${accentColor}30`,
          padding: '12px 0',
          backdropFilter: 'blur(10px)'
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            padding: '0 15px'
          }}
        >
          {/* Track info and album art row */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
            {/* Album Art - Enhanced and more prominent */}
            <div
              style={{
                position: 'relative',
                width: '70px',
                height: '70px',
                marginRight: '15px',
                borderRadius: '50%',
                overflow: 'hidden',
                boxShadow: `0 0 20px rgba(0,0,0,0.5), ${glowColor}`,
                animation: albumAnimation,
                cursor: 'pointer',
                border: `3px solid ${accentColor}40`,
                transform: 'rotateZ(0deg)',
                transformStyle: 'flat'
              }}
              onClick={togglePlayPause}
            >
              <img
                src="/virginRecords.jpg"
                alt="Album Art"
                style={{ 
                  width: '100%', 
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
            </div>
            
            {/* Track title and artist */}
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div 
                style={{ 
                  color: accentColor,
                  fontWeight: 'bold',
                  fontSize: '0.65rem',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  marginBottom: '8px',
                  textShadow: `0 0 5px ${accentColor}70`,
                  textAlign: 'center'
                }}
              >
                {currentTrack?.name || currentPlaylist[currentTrackIndex]?.name || 'Loading...'}
              </div>
              
              {/* Player controls */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-evenly',
                width: '100%'
              }}>
                <button
                  onClick={() => changeTrack(-1)}
                  disabled={isLoading}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: isLoading ? '#666' : 'white',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    fontSize: '18px',
                    padding: '0 5px'
                  }}
                >
                  ⏮️
                </button>
                
                <button
                  onClick={togglePlayPause}
                  disabled={isLoading}
                  style={{
                    background: accentColor,
                    border: 'none',
                    color: 'black',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    boxShadow: glowColor
                  }}
                >
                  {isLoading ? "⏳" : isPlaying ? "❚❚" : "▶"}
                </button>
                
                <button
                  onClick={() => changeTrack(1)}
                  disabled={isLoading}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: isLoading ? '#666' : 'white',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    fontSize: '18px',
                    padding: '0 5px'
                  }}
                >
                  ⏭️
                </button>
                
                <button
                  onClick={toggleShuffle}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: isShuffled ? accentColor : 'white',
                    cursor: 'pointer',
                    fontSize: '16px',
                    padding: '0',
                    opacity: isShuffled ? 1 : 0.7
                  }}
                >
                  🔀
                </button>
              </div>
            </div>
          </div>
          
          {/* Progress bar and time */}
          <div style={{ width: '100%' }}>
            <div 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                width: '100%',
                marginBottom: '7px'
              }}
            >
              <span style={{ color: 'white', opacity: 0.8, fontSize: '0.75rem', marginRight: '5px', minWidth: '35px' }}>
                {currentTime}
              </span>
              
              <div
                style={{
                  flex: 1,
                  height: '4px',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  cursor: 'pointer',
                  borderRadius: '2px',
                  position: 'relative'
                }}
                onClick={handleSeek}
              >
                <div
                  style={{
                    width: `${playProgress}%`,
                    height: '100%',
                    backgroundColor: accentColor,
                    borderRadius: '2px',
                    position: 'relative'
                  }}
                >
                  <div 
                    style={{
                      position: 'absolute',
                      right: '0',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: 'white',
                      boxShadow: glowColor
                    }}
                  />
                </div>
              </div>
              
              <span style={{ color: 'white', opacity: 0.8, fontSize: '0.75rem', marginLeft: '5px', minWidth: '35px', textAlign: 'right' }}>
                {duration}
              </span>
            </div>
            
            {/* Volume control */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ color: 'white', fontSize: '12px', marginRight: '5px' }}>
                {volume === 0 ? '🔇' : volume < 0.3 ? '🔈' : volume < 0.7 ? '🔉' : '🔊'}
              </span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={handleVolumeChange}
                style={{
                  width: '100%',
                  accentColor: accentColor,
                  height: '4px'
                }}
              />
            </div>
          </div>
        </div>
        
        {/* Define CSS animation for spinning album */}
        {/* <style jsx>{`
          @keyframes spinRecord {
            from { 
              transform: rotate(0deg);
            }
            to { 
              transform: rotate(360deg);
            }
          }
        `}</style> */}
      </div>
    );
  }
);

MusicPlayer3.displayName = "MusicPlayer3";

export default MusicPlayer3;