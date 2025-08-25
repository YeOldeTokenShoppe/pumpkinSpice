"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useUser, UserButton, SignInButton } from '@clerk/nextjs';
import { useMusic } from '@/components/MusicContext';
import SimpleLoader from '@/components/SimpleLoader';
import CyberNav from '@/components/CyberNav';
import BuyTokenFAB from '@/components/BuyTokenFAB';
import CompactCandleModal from '@/components/CompactCandleModal';

const SimpleModelViewer = dynamic(() => import('@/components/SimpleModelViewer'), {
  ssr: false,
  loading: () => <SimpleLoader />
});

export default function ModelViewerPage() {
  const { user, isSignedIn } = useUser();
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const { play, pause, isPlaying: contextIsPlaying, nextTrack, currentTrack, is80sMode: context80sMode, setIs80sMode: setContext80sMode } = useMusic();
  const [showMusicControls, setShowMusicControls] = useState(contextIsPlaying);
  const [showCandleModal, setShowCandleModal] = useState(false);
  const isTogglingRef = useRef(false);
  const is80sMode = context80sMode;

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      const isMobile = window.innerWidth <= 768 || ('ontouchstart' in window);
      setIsMobileDevice(isMobile);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Sync showMusicControls with playing state
  useEffect(() => {
    if (contextIsPlaying && !showMusicControls) {
      setShowMusicControls(true);
    }
  }, [contextIsPlaying, showMusicControls]);

  const handleMusicToggle = useCallback((show) => {
    setShowMusicControls(show);
    if (show && !contextIsPlaying) {
      play();
    }
  }, [contextIsPlaying, play]);

  const toggle80sMode = useCallback((newMode) => {
    if (isTogglingRef.current) return;
    isTogglingRef.current = true;
    
    if (setContext80sMode) {
      setContext80sMode(newMode);
    }
    
    setTimeout(() => {
      isTogglingRef.current = false;
    }, 500);
  }, [setContext80sMode]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
      <SimpleModelViewer modelPath="/models/GR80.glb" />
      
      {/* CyberNav Menu */}
      <CyberNav is80sMode={is80sMode} />
      
      {/* Music, 80s Mode, and User Controls Container */}
      <div
        style={{
          position: "fixed",
          top: isMobileDevice ? "70px" : "20px", // Below menu on mobile
          right: isMobileDevice ? "20px" : "72px", // Aligned with menu on mobile, spaced on desktop
          display: "flex",
          flexDirection: isMobileDevice ? "column" : "row", // Vertical on mobile, horizontal on desktop
          gap: "10px",
          alignItems: isMobileDevice ? "flex-end" : "center",
          zIndex: 9999
        }}
      >
        {/* User Avatar/Sign In - Show on desktop or at bottom on mobile */}
        {(!isMobileDevice || isMobileDevice) && (
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
                  backdropFilter: "blur(10px)",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
                }}
                title="Sign In"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </button>
            </SignInButton>
          )}
        </div>
        )}
        
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
              <svg
                width="20"
                height="20"
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
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              {/* Spinning Album Art */}
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  overflow: "hidden",
                  animation: contextIsPlaying ? "spin 4s linear infinite" : "none",
                  cursor: "pointer"
                }}
                onClick={() => contextIsPlaying ? pause() : play()}
              >
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    backgroundImage: "url('/virginRecords.jpg')",
                    backgroundSize: "cover",
                    backgroundPosition: "center"
                  }}
                />
              </div>
              
              {/* Skip Button */}
              <button
                onClick={() => nextTrack && nextTrack()}
                style={{
                  width: "30px",
                  height: "30px",
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
                onClick={() => {
                  handleMusicToggle(false);
                  pause && pause();
                }}
                style={{
                  width: "26px",
                  height: "26px",
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
        
        {/* 80s Mode Toggle */}
        <div style={{ order: isMobileDevice ? 2 : 2 }}>
          <button
            onClick={() => toggle80sMode(!is80sMode)}
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
            onMouseEnter={(e) => {
              if (is80sMode) {
                e.currentTarget.style.boxShadow = "0 0 30px rgba(217, 70, 239, 0.7), 0 2px 8px rgba(0, 0, 0, 0.3)";
              } else {
                e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
              }
            }}
            onMouseLeave={(e) => {
              if (is80sMode) {
                e.currentTarget.style.boxShadow = "0 0 20px rgba(217, 70, 239, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3)";
              } else {
                e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
              }
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

      {/* Buy Token FAB (optional - uncomment if needed) */}
      {/* <div onClick={() => setShowCandleModal(true)}>
        <BuyTokenFAB is80sMode={is80sMode} />
      </div> */}

      {/* Candle Modal */}
      {showCandleModal && (
        <CompactCandleModal
          isOpen={showCandleModal}
          onClose={() => setShowCandleModal(false)}
        />
      )}

      {/* Animation Styles */}
      <style jsx>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}