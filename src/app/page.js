"use client";

import React, { useState, useEffect } from "react";
import SimpleLoader from '@/components/SimpleLoader';
import PalmTreeDrive from '@/components/PalmTreeDrive';
import { useMusic } from '@/components/MusicContext';
import Link from 'next/link';


export default function Home() {
  
  const [isSceneLoading, setIsSceneLoading] = useState(true);
  const [fontLoaded, setFontLoaded] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  
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
  
  // Sync showMusicControls with playing state when it changes
  useEffect(() => {
    if (contextIsPlaying && !showMusicControls) {
      setShowMusicControls(true);
    }
  }, [contextIsPlaying]);
  
  // Check if font is loaded
  useEffect(() => {
    const checkFont = async () => {
      try {
        await document.fonts.load("1em 'UnifrakturMaguntia'");
        setFontLoaded(true);
      } catch (e) {
        setTimeout(() => setFontLoaded(true), 100);
      }
    };
    checkFont();
  }, []);
  
  // Check if mobile view
  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Add loading timeout - force show scene after 15 seconds on mobile, 30 seconds on desktop
  useEffect(() => {
    const isMobile = window.innerWidth <= 768;
    const timeoutDuration = isMobile ? 15000 : 30000; // 15s for mobile, 30s for desktop
    
    const timer = setTimeout(() => {
      if (isSceneLoading) {
        console.log('Loading timeout reached, forcing scene display');
        setLoadingTimeout(true);
        setIsSceneLoading(false);
      }
    }, timeoutDuration);
    
    return () => clearTimeout(timer);
  }, [isSceneLoading]);

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
      
      {/* Add inline keyframes for spin animation and font */}
      <style jsx global>{`
        @font-face {
          font-family: 'UnifrakturMaguntia';
          src: url('/fonts/UnifrakturMaguntia-Regular.ttf') format('truetype');
          font-weight: normal;
          font-style: normal;
          font-display: swap;
        }
        
        #text, .text__copy {
          font-family: 'UnifrakturMaguntia', serif !important;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spinning-record {
          animation: spin 3s linear infinite;
        }
      `}</style>
      
      {/* RL80 Logo - Top Left */}
      {!isSceneLoading && (
        <div style={{
          position: "fixed",
          top: "20px", 
          left: "20px",
          borderRadius: "8px",
          padding: "10px",
          pointerEvents: "auto",
          opacity: fontLoaded ? 1 : 0,
          transition: "opacity 0.3s ease-in-out",
          zIndex: 10000,
        }}>
        <div 
            id="text"
            style={{
              position: "relative",
              fontFamily: "'UnifrakturMaguntia', serif",
              fontSize: isMobileView ? "3rem" : "4rem",
              color: "#ffffff",
              cursor: "pointer",
            }}
          >
            <Link href="/" style={{ textDecoration: 'none', color: 'inherit', display: 'inline-block' }}>
              RL80
            </Link>
            {Array.from({length: 100}).map((_, i) => {
              const index = i + 1;
              return (
                <div
                  key={index}
                  className="text__copy"
                  style={{
                    position: "absolute",
                    pointerEvents: "none",
                    zIndex: -1,
                    top: 0,
                    left: 0,
                    color: is80sMode 
                      ? `rgba(${201 - index * 2}, ${55 - index * 3}, ${256 - index * 2})` 
                      : `rgba(${255 - index * 2}, ${255 - index * 3}, ${255 - index * 2})`,
                    filter: "blur(0.1rem)",
                    transform: `translate(
                      ${index * 0.1}rem, 
                      ${index * 0.1}rem
                    ) scale(${1 + index * 0.01})`,
                    opacity: (1 / index) * 1.5,
                  }}
                >
                  RL80
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Music Controls - Bottom Right (only show after scene loads) */}
      {!isSceneLoading && !showMusicControls ? (
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
      ) : !isSceneLoading ? (
        // Compact Music Player Controls (only show after scene loads)
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
      ) : null}
    </div>
  );
}