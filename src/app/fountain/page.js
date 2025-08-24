"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useMusic } from '@/components/MusicContext';
import SimpleLoader from '@/components/SimpleLoader';
import BuyTokenFAB from '@/components/BuyTokenFAB';
import CompactCandleModal from '@/components/CompactCandleModal';
import CyberNav from '@/components/CyberNav';
import { useUser, UserButton, SignInButton } from '@clerk/nextjs';

// Dynamic import for the FountainFrame component
const FountainFrame = dynamic(() => import('@/components/FountainFrame'), {
  ssr: false,
  loading: () => <SimpleLoader />
});

export default function FountainPage() {
  // Get user from Clerk
  const { user, isSignedIn } = useUser();
  
  const { play, pause, isPlaying: contextIsPlaying, nextTrack, is80sMode: context80sMode, setIs80sMode: setContext80sMode } = useMusic();
  const [isLoading, setIsLoading] = useState(true);
  const [fontLoaded, setFontLoaded] = useState(false);
  const [showMusicControls, setShowMusicControls] = useState(contextIsPlaying);
  const [showCandleModal, setShowCandleModal] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const is80sMode = context80sMode;
  const isToggling80sRef = useRef(false);

  // Check if mobile
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

  // Sync music controls
  useEffect(() => {
    if (contextIsPlaying && !showMusicControls) {
      setShowMusicControls(true);
    }
  }, [contextIsPlaying]);

  // Loading timeout fallback
  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsLoading(false);
    }, 3000);
    return () => clearTimeout(timeout);
  }, []);

  const handleMusicToggle = useCallback((show) => {
    setShowMusicControls(show);
    if (show && !contextIsPlaying) {
      play();
    }
  }, [contextIsPlaying, play]);

  const toggle80sMode = useCallback(() => {
    if (isToggling80sRef.current) return;
    isToggling80sRef.current = true;
    const newMode = !is80sMode;
    setContext80sMode(newMode);
    setTimeout(() => {
      isToggling80sRef.current = false;
    }, 100);
  }, [is80sMode, setContext80sMode]);

  return (
    <div style={{
      backgroundColor: "#000000",
      height: "100vh",
      width: "100vw",
      margin: 0,
      padding: 0,
      position: "fixed",
      left: 0,
      top: 0,
      overflow: "hidden",
    }}>
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
      `}</style>

      {/* Loader */}
      {isLoading && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: '#000',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <SimpleLoader />
        </div>
      )}

      {/* The Fountain iframe */}
      <FountainFrame is80sMode={is80sMode} />

      {/* UI Overlay - RL80 Logo */}
      <div style={{
        position: "fixed",
        top: "20px",
        left: "20px",
        borderRadius: "8px",
        padding: "10px",
        pointerEvents: "auto",
        opacity: fontLoaded ? 1 : 0,
        transition: "opacity 0.3s ease-in-out",
        zIndex: 10001,
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
          {Array.from({ length: 100 }).map((_, i) => {
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
                  transform: `translate(${index * 0.1}rem, ${index * 0.1}rem) scale(${1 + index * 0.01})`,
                  opacity: (1 / index) * 1.5,
                }}
              >
                RL80
              </div>
            );
          })}
        </div>
      </div>

      {/* Icon Bar - CyberNav Menu, User, Music, and 80s Mode */}
      <CyberNav is80sMode={is80sMode} />
      
      {/* Music, 80s Mode, and User Controls Container */}
      <div style={{
        position: "fixed",
        top: isMobileDevice ? "70px" : "20px",
        right: isMobileDevice ? "20px" : "72px",
        display: "flex",
        flexDirection: isMobileDevice ? "column" : "row",
        gap: "10px",
        alignItems: isMobileDevice ? "flex-end" : "center",
        zIndex: 10002
      }}>
        {/* User Account Icon */}
        <div style={{ order: isMobileDevice ? 3 : 0 }}>
          {isSignedIn ? (
            <UserButton 
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: {
                    width: "40px",
                    height: "40px",
                    borderRadius: "8px",
                    border: "2px solid rgba(255, 255, 255, 0.2)",
                    backgroundColor: "rgba(0, 0, 0, 0.7)",
                    backdropFilter: "blur(10px)",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)"
                  }
                }
              }}
            />
          ) : (
            <SignInButton mode="modal">
              <button
                style={{
                  width: "40px",
                  height: "40px",
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
                }}
                title="Sign In"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </button>
            </SignInButton>
          )}
        </div>
        
        {/* Music Controls */}
        <div style={{ order: isMobileDevice ? 1 : 1 }}>
      {!showMusicControls ? (
        <button
          onClick={() => handleMusicToggle(true)}
          style={{
            width: "40px",
            height: "40px",
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
          }}
          title="Toggle Music"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
          </svg>
        </button>
      ) : (
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}>
          {/* Spinning Album Art */}
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              overflow: "hidden",
              animation: contextIsPlaying ? "spin 4s linear infinite" : "none",
              cursor: "pointer"
            }}
            onClick={() => contextIsPlaying ? pause() : play()}
          >
            <div style={{
              width: "100%",
              height: "100%",
              backgroundImage: "url('/virginRecords.jpg')",
              backgroundSize: "cover",
              backgroundPosition: "center"
            }} />
          </div>

          {/* Skip Button */}
          <button
            onClick={() => nextTrack && nextTrack()}
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
              <polygon points="5 4 15 12 5 20 5 4" />
              <line x1="19" y1="5" x2="19" y2="19" />
            </svg>
          </button>

          {/* Close Button */}
          <button
            onClick={() => {
              handleMusicToggle(false);
              pause && pause();
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
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}
        </div>
        
        {/* 80s Mode Toggle */}
        <div style={{ order: isMobileDevice ? 2 : 2 }}>
          <button
            onClick={() => toggle80sMode()}
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "8px",
          backgroundColor: is80sMode ? "rgba(217, 70, 239, 0.3)" : "rgba(0, 0, 0, 0.7)",
          border: is80sMode ? "2px solid #D946EF" : "2px solid rgba(255, 255, 255, 0.2)",
          color: is80sMode ? "#67e8f9" : "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          transition: "all 0.3s ease",
          backdropFilter: "blur(10px)",
          boxShadow: is80sMode
            ? "0 0 20px rgba(217, 70, 239, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3)"
            : "0 2px 8px rgba(0, 0, 0, 0.3)",
        }}
        title={is80sMode ? "Disable 80s Mode" : "Enable 80s Mode"}
      >
        <span style={{
          fontSize: "20px",
          fontWeight: "bold",
          color: is80sMode ? "#00ff41" : "#67e8f9",
          textShadow: is80sMode ? "0 0 10px #00ff41" : "none",
          fontFamily: "monospace"
        }}>
              80s
            </span>
          </button>
        </div>
      </div>

      {/* Buy Token FAB */}
      {/* <div onClick={() => setShowCandleModal(true)}>
        <BuyTokenFAB is80sMode={is80sMode} />
      </div> */}

      {/* Candle Modal */}
      <CompactCandleModal
        isOpen={showCandleModal}
        onClose={() => setShowCandleModal(false)}
        onCandleCreated={(candle) => {
          console.log('New candle created:', candle);
        }}
      />
    </div>
  );
}