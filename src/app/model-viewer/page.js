"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useUser, SignInButton } from '@clerk/nextjs';
import { Illumin80ClerkButton } from '@/components/Illumin80Display';
import { useMusic } from '@/components/MusicContext';
import SimpleInfinityLoader from '@/components/SimpleInfinityLoader';
import CyberNav from '@/components/CyberNav';
import SocialBar from '@/components/SocialBar';
import BuyTokenFAB from '@/components/BuyTokenFAB';
import CompactCandleModal from '@/components/CompactCandleModal';

const SimpleModelViewer = dynamic(() => import('@/components/SimpleModelViewer'), {
  ssr: false,
  loading: () => <SimpleInfinityLoader />
});

export default function ModelViewerPage() {
  const { user, isSignedIn } = useUser();
  const [isMobileDevice, setIsMobileDevice] = useState(typeof window !== 'undefined' ? window.innerWidth <= 768 : false);
  const { 
    play, 
    pause, 
    isPlaying: contextIsPlaying, 
    nextTrack, 
    currentTrack, 
    is80sMode: context80sMode, 
    setIs80sMode: setContext80sMode
  } = useMusic();
  const [showMusicControls, setShowMusicControls] = useState(contextIsPlaying);
  const [showCandleModal, setShowCandleModal] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const isTogglingRef = useRef(false);
  const is80sMode = context80sMode;
  const [emoji, setEmoji] = useState("😇");

  // Alternate emoji for sign-in button
  useEffect(() => {
    const emojiInterval = setInterval(() => {
      setEmoji((prevEmoji) => (prevEmoji === "😇" ? "😈" : "😇"));
    }, 3000);

    return () => clearInterval(emojiInterval);
  }, []);
  
  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      const isMobile = window.innerWidth <= 768;
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
      // Use play() which handles random track selection
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
      <SimpleModelViewer 
        modelPath="/models/saint_robot.glb" 
        onLoadingChange={setIsPageLoading}
        is80sMode={is80sMode}
      />
      
      {/* Top Controls Container - All buttons together */}
      {!isPageLoading && (
      <div
        style={{
          position: "fixed",
          top: "20px",
          right: "20px",
          display: "flex",
          flexDirection: isMobileDevice ? "column" : "row",
          gap: isMobileDevice ? "10px" : "15px",
          alignItems: isMobileDevice ? "flex-end" : "center",
          zIndex: 9999
        }}
      >
        {/* Music Controls - First on desktop, Third on mobile */}
        <div style={{ order: isMobileDevice ? 2 : 0 }}>
          {!showMusicControls ? (
            <button
              onClick={() => handleMusicToggle(true)}
              style={{
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
                  width: isMobileDevice ? "36px" : "54px",
                  height: isMobileDevice ? "36px" : "54px",
                  borderRadius: "50%",
                  overflow: "hidden",
                  animation: contextIsPlaying ? "spin 4s linear infinite" : "none",
                  cursor: "pointer"
                }}
                onClick={() => {
                  if (contextIsPlaying) {
                    pause();
                  } else {
                    // Use play() which handles random track selection
                    play();
                  }
                }}
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
                onClick={() => {
                  handleMusicToggle(false);
                  pause && pause();
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
          )}
        </div>
        
        {/* User Account - Second on desktop, Second on mobile */}
        <div style={{ order: isMobileDevice ? 1 : 1 }}>
          {isSignedIn ? (
            <Illumin80ClerkButton afterSignOutUrl="/" />
          ) : (
            <SignInButton mode="modal" forceRedirectUrl="/model-viewer">
              <button
                style={{
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
                  backdropFilter: "blur(10px)",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
                }}
                title="Sign In"
              >
                <span style={{ fontSize: "2.2rem" }}>{emoji}</span>
              </button>
            </SignInButton>
          )}
        </div>
        
        {/* 80s Mode Toggle - Third on desktop, Fourth on mobile */}
        <div style={{ order: isMobileDevice ? 3 : 2 }}>
          <button
            onClick={() => toggle80sMode(!is80sMode)}
            style={{
              width: isMobileDevice ? "40px" : "60px",
              height: isMobileDevice ? "40px" : "60px",
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
              fontSize: isMobileDevice ? "20px" : "24px",
              fontWeight: "bold",
              color: is80sMode ? "#00ff41" : "#67e8f9",
              textShadow: is80sMode ? "0 0 10px #00ff41" : "none",
              fontFamily: "monospace"
            }}>
              80s
            </span>
          </button>
        </div>
        
        {/* CyberNav Menu - Last on desktop, First on mobile */}
        <div style={{ order: isMobileDevice ? 0 : 3 }}>
          <CyberNav is80sMode={is80sMode} position="relative" />
        </div>
        
        
        {/* Social Bar - Last position */}
        <div style={{ order: isMobileDevice ? 6 : 5 }}>
          <SocialBar is80sMode={is80sMode} />
        </div>
      </div>
      )}

      {/* Buy Token FAB (optional - uncomment if needed) */}
      {/* <div onClick={() => setShowCandleModal(true)}>
        <BuyTokenFAB is80sMode={is80sMode} />
      </div> */}

      {/* Candle Modal - Hidden while loading */}
      {!isPageLoading && showCandleModal && (
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