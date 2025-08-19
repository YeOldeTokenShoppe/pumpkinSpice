"use client";

import React, { useState } from "react";
import SimpleLoader from '@/components/SimpleLoader';
import PalmTreeDrive from '@/components/PalmTreeDrive';
import { useMusic } from '@/components/MusicContext';


export default function Home() {
  
  const [isSceneLoading, setIsSceneLoading] = useState(true);
  
  // Get music context functions
  const { 
    play, 
    pause, 
    isPlaying: contextIsPlaying, 
    nextTrack, 
    currentTrack, 
    is80sMode 
  } = useMusic();
  
  // Show music controls if music is already playing
  const [showMusicControls, setShowMusicControls] = useState(contextIsPlaying);

  return (
    <div style={{ width: '100vw', minHeight: '100vh' }}>
      {/* Show loader when scene is loading */}
      {isSceneLoading && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#000',
          zIndex: 9999
        }}>
          <SimpleLoader />
        </div>
      )}
      
      <PalmTreeDrive 
        onLoadingChange={setIsSceneLoading}
      />
      
      {/* Add inline keyframes for spin animation */}
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spinning-record {
          animation: spin 3s linear infinite;
        }
      `}</style>
      
      {/* Music Controls - Bottom Right */}
      {!showMusicControls ? (
        <button
          onClick={() => {
            setShowMusicControls(true);
            if (!contextIsPlaying) {
              play();
            }
          }}
          style={{
            position: "fixed",
            bottom: "30px",
            right: "30px",
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            border: "2px solid rgba(255, 255, 255, 0.2)",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "all 0.3s ease",
            backdropFilter: "blur(10px)",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.4)",
            zIndex: 9999,
          }}
          title="Toggle Music"
        >
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
          </svg>
        </button>
      ) : (
        // Compact Music Player Controls
        <div
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          {/* Spinning Album Art */}
          <div
            className={contextIsPlaying ? "spinning-record" : ""}
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              backgroundImage: "url('/virginRecords.jpg')",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
          
          {/* Skip Button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (nextTrack) {
                nextTrack();
              }
            }}
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "4px",
              backgroundColor: "rgba(255, 255, 255, 0.1)",
              border: "none",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.3s ease",
            }}
            title="Next Track"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 4 15 12 5 20 5 4"/>
              <line x1="19" y1="5" x2="19" y2="19"/>
            </svg>
          </button>
          
          {/* Close Button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowMusicControls(false);
              if (pause) {
                pause();
              }
            }}
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "4px",
              backgroundColor: "rgba(255, 255, 255, 0.1)",
              border: "1px solid rgba(255, 255, 255, 0.3)",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.3s ease",
            }}
            title="Close Music"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}