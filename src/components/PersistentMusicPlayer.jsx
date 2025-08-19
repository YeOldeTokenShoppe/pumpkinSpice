"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useMusic } from './MusicContext';

const PersistentMusicPlayer = () => {
  const {
    currentTrack,
    isPlaying,
    volume,
    setVolume,
    currentTrackIndex,
    is80sMode,
    play,
    pause,
    nextTrack,
    prevTrack,
    isLoadingTrack,
    non80sTracks,
    eightyTracks,
    audioRef
  } = useMusic();

  const [showPlayer, setShowPlayer] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const playlist = is80sMode ? eightyTracks : non80sTracks;
  const accentColor = is80sMode ? "#ff71ce" : "#1DB954";

  // Update progress
  useEffect(() => {
    if (!audioRef?.current) return;

    const updateProgress = () => {
      if (audioRef.current) {
        setCurrentTime(audioRef.current.currentTime);
        setDuration(audioRef.current.duration || 0);
      }
    };

    const interval = setInterval(updateProgress, 100);
    updateProgress();

    return () => clearInterval(interval);
  }, [audioRef, isPlaying]);

  // Format time
  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle seek
  const handleSeek = (e) => {
    if (!audioRef?.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    audioRef.current.currentTime = percent * duration;
  };

  // Toggle play/pause
  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  // Minimized player (always visible)
  const MinimizedPlayer = () => (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        background: 'rgba(0, 0, 0, 0.9)',
        borderRadius: '50px',
        padding: '10px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
        backdropFilter: 'blur(10px)',
        border: `1px solid ${accentColor}40`,
        cursor: 'pointer',
        zIndex: 9998,
        transition: 'all 0.3s ease',
        boxShadow: `0 4px 20px rgba(0,0,0,0.5), 0 0 20px ${accentColor}20`
      }}
      onClick={() => setShowPlayer(true)}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          togglePlayPause();
        }}
        disabled={isLoadingTrack}
        style={{
          background: accentColor,
          border: 'none',
          color: 'black',
          width: '35px',
          height: '35px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '14px',
          cursor: 'pointer',
          transition: 'transform 0.2s',
        }}
        onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'}
        onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
      >
        {isLoadingTrack ? "⏳" : isPlaying ? "❚❚" : "▶"}
      </button>
      
      <div style={{ color: 'white', fontSize: '14px', maxWidth: '200px' }}>
        <div style={{ 
          whiteSpace: 'nowrap', 
          overflow: 'hidden', 
          textOverflow: 'ellipsis',
          fontWeight: 'bold',
          marginBottom: '2px'
        }}>
          {playlist[currentTrackIndex]?.name || 'No track'}
        </div>
        <div style={{ fontSize: '12px', opacity: 0.7 }}>
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>
    </div>
  );

  // Expanded player
  const ExpandedPlayer = () => (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'linear-gradient(to top, rgba(0,0,0,0.95), rgba(0,0,0,0.85))',
        padding: '20px',
        backdropFilter: 'blur(20px)',
        borderTop: `2px solid ${accentColor}40`,
        zIndex: 9999,
        animation: 'slideUp 0.3s ease'
      }}
    >
      <style jsx>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
      `}</style>

      {/* Close button */}
      <button
        onClick={() => setShowPlayer(false)}
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          background: 'transparent',
          border: 'none',
          color: 'white',
          fontSize: '20px',
          cursor: 'pointer',
          opacity: 0.7,
          transition: 'opacity 0.2s'
        }}
        onMouseEnter={(e) => e.target.style.opacity = '1'}
        onMouseLeave={(e) => e.target.style.opacity = '0.7'}
      >
        ✕
      </button>

      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        {/* Track info */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h3 style={{ 
            color: accentColor, 
            margin: 0,
            fontSize: '20px',
            fontWeight: 'bold'
          }}>
            {playlist[currentTrackIndex]?.name || 'No track loaded'}
          </h3>
          <p style={{ 
            color: 'white', 
            opacity: 0.7,
            margin: '5px 0',
            fontSize: '14px'
          }}>
            {is80sMode ? '80s Mode' : 'Modern Mode'}
          </p>
        </div>

        {/* Progress bar */}
        <div style={{ marginBottom: '20px' }}>
          <div 
            style={{
              height: '4px',
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '2px',
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden'
            }}
            onClick={handleSeek}
          >
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                height: '100%',
                width: `${duration ? (currentTime / duration) * 100 : 0}%`,
                background: accentColor,
                transition: 'width 0.1s linear'
              }}
            />
          </div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            marginTop: '5px',
            fontSize: '12px',
            color: 'white',
            opacity: 0.7
          }}>
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center',
          alignItems: 'center',
          gap: '20px',
          marginBottom: '20px'
        }}>
          <button
            onClick={prevTrack}
            disabled={isLoadingTrack}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'white',
              fontSize: '24px',
              cursor: isLoadingTrack ? 'not-allowed' : 'pointer',
              opacity: isLoadingTrack ? 0.5 : 1,
              transition: 'transform 0.2s'
            }}
            onMouseEnter={(e) => !isLoadingTrack && (e.target.style.transform = 'scale(1.1)')}
            onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
          >
            ⏮
          </button>

          <button
            onClick={togglePlayPause}
            disabled={isLoadingTrack}
            style={{
              background: accentColor,
              border: 'none',
              color: 'black',
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              cursor: isLoadingTrack ? 'not-allowed' : 'pointer',
              transition: 'transform 0.2s',
              boxShadow: `0 0 20px ${accentColor}50`
            }}
            onMouseEnter={(e) => !isLoadingTrack && (e.target.style.transform = 'scale(1.1)')}
            onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
          >
            {isLoadingTrack ? "⏳" : isPlaying ? "❚❚" : "▶"}
          </button>

          <button
            onClick={nextTrack}
            disabled={isLoadingTrack}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'white',
              fontSize: '24px',
              cursor: isLoadingTrack ? 'not-allowed' : 'pointer',
              opacity: isLoadingTrack ? 0.5 : 1,
              transition: 'transform 0.2s'
            }}
            onMouseEnter={(e) => !isLoadingTrack && (e.target.style.transform = 'scale(1.1)')}
            onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
          >
            ⏭
          </button>
        </div>

        {/* Volume control */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center',
          gap: '10px',
          justifyContent: 'center'
        }}>
          <span style={{ color: 'white', fontSize: '14px' }}>
            {volume === 0 ? '🔇' : volume < 0.3 ? '🔈' : volume < 0.7 ? '🔉' : '🔊'}
          </span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            style={{
              width: '150px',
              accentColor: accentColor,
            }}
          />
          <span style={{ color: 'white', fontSize: '12px', opacity: 0.7, minWidth: '35px' }}>
            {Math.round(volume * 100)}%
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <MinimizedPlayer />
      {showPlayer && <ExpandedPlayer />}
    </>
  );
};

export default PersistentMusicPlayer;