"use client";

import React, { useState, useEffect } from "react";
import InfinityLoader from '@/components/InfinityLoader';
import PalmTreeDrive from '@/components/PalmTreeDrive';
import { useMusic } from '@/components/MusicContext';
import Link from 'next/link';




export default function Home() {
  
  const [isSceneLoading, setIsSceneLoading] = useState(true);
  const [fontLoaded, setFontLoaded] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(typeof window !== 'undefined' ? window.innerWidth <= 768 : false);
  
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
        console.log('Font loaded successfully');
        setFontLoaded(true);
        // Add fonts-loaded class to body to reveal hidden font elements
        document.body.classList.add('fonts-loaded');
      } catch (e) {
        console.log('Font loading error:', e);
        setTimeout(() => {
          setFontLoaded(true);
          // Add fonts-loaded class even on error after timeout
          document.body.classList.add('fonts-loaded');
        }, 100);
      }
    };
    checkFont();
  }, []);
  
  // Check if mobile view
  useEffect(() => {
    const checkMobile = () => {
      const isMobile = window.innerWidth <= 768;
      setIsMobileView(isMobile);
      setIsMobileDevice(isMobile);
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
  
  // Debug logging
  useEffect(() => {
    console.log('RL80 Logo Debug:', {
      isSceneLoading,
      fontLoaded,
      shouldShowLogo: !isSceneLoading && fontLoaded
    });
  }, [isSceneLoading, fontLoaded]);

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
          <InfinityLoader />
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
        
        @keyframes rotateVinyl {
          0% { transform: rotateZ(0deg); }
          100% { transform: rotateZ(360deg); }
        }
        .spinning-record {
          animation: rotateVinyl 3s linear infinite;
          transform: rotateZ(0deg);
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
            <Link href="/home3" style={{ textDecoration: 'none', color: 'inherit', display: 'inline-block' }}>
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
            top: "20px",
            right: "20px",
            width: isMobileDevice ? "40px" : "60px",
            height: isMobileDevice ? "40px" : "60px",
            borderRadius: "8px",
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            border: "2px solid rgba(255, 255, 255, 0.2)",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "all 0.3s ease",
            backdropFilter: "blur(10px)",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
            zIndex: 9999,
          }}
          title="Toggle Music"
        >
          <svg
            width={isMobileDevice ? "20" : "30"}
            height={isMobileDevice ? "20" : "30"}
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
            top: "20px",
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
              width: isMobileDevice ? "36px" : "54px",
              height: isMobileDevice ? "36px" : "54px",
              borderRadius: "50%",
              backgroundImage: "url('/virginRecords.jpg')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              cursor: "pointer"
            }}
            onClick={() => contextIsPlaying ? pause() : play()}
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
              width: isMobileDevice ? "30px" : "45px",
              height: isMobileDevice ? "30px" : "45px",
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
            <svg width={isMobileDevice ? "16" : "24"} height={isMobileDevice ? "16" : "24"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
              width: isMobileDevice ? "26px" : "39px",
              height: isMobileDevice ? "26px" : "39px",
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
            <svg width={isMobileDevice ? "14" : "21"} height={isMobileDevice ? "14" : "21"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      ) : null}
    </div>
  );
}