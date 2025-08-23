"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { useMusic } from "@/components/MusicContext";
import SimpleLoader from "@/components/SimpleLoader";
import CandleInteractionHint from "@/components/CandleInteractionHint";
import BuyTokenFAB from "@/components/BuyTokenFAB";
import CompactCandleModal from "@/components/CompactCandleModal";




const ThreeDVotiveStand = dynamic(() => import("@/components/index.jsx"), {
  ssr: false,
  loading: () => <SimpleLoader/>,
});

export default function GalleryPage() {


  // Get music context functions
  const { play, pause, isPlaying: contextIsPlaying, nextTrack, currentTrackIndex, currentTrack, is80sMode: context80sMode, setIs80sMode: setContext80sMode } = useMusic();
  const isTogglingRef = useRef(false); // Prevent multiple rapid toggles
  const isToggling80sRef = useRef(false); // Track 80s mode toggle state
  const videoRef = useRef(null); // Reference for 80s video cleanup
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Use context 80s mode instead of local state
  const is80sMode = context80sMode;
  

  const [isMobileView, setIsMobileView] = useState(true); // Always use mobile view
  const [isDefinitelyPhone, setIsDefinitelyPhone] = useState(true); // Always treat as mobile
  const [isSceneLoading, setIsSceneLoading] = useState(true);
  // Show music controls if music is already playing
  const [showMusicControls, setShowMusicControls] = useState(contextIsPlaying);
  const [fontLoaded, setFontLoaded] = useState(false);
  const [showCandleModal, setShowCandleModal] = useState(false);
  
  // Sync showMusicControls with playing state when it changes
  useEffect(() => {
    if (contextIsPlaying && !showMusicControls) {
      setShowMusicControls(true);
    }
  }, [contextIsPlaying]);


  
  // No longer needed - always use mobile view
  const detectMobileDevice = useCallback(() => {
    return true; // Always return true for mobile
  }, []);

  // Always use mobile view on mount
  useEffect(() => {
    setIsDefinitelyPhone(true);
    setIsMobileView(true);
  }, []);

  // No longer need resize handlers - always mobile view
  useEffect(() => {
    // Always keep mobile view
    setIsMobileView(true);
  }, []);


  // Check if font is loaded
  useEffect(() => {
    const checkFont = async () => {
      try {
        // Check if the font is available
        await document.fonts.load("1em 'UnifrakturMaguntia'");
        setFontLoaded(true);
      } catch (e) {
        // Fallback: set as loaded after a short delay
        setTimeout(() => setFontLoaded(true), 100);
      }
    };
    checkFont();
  }, []);

  // Debug isLoading state
  useEffect(() => {
    console.log('Gallery page - isLoading:', isLoading);
    console.log('Gallery page - isMobileView:', isMobileView);
    console.log('Gallery page - showMusicControls:', showMusicControls);
  }, [isLoading, isMobileView, showMusicControls]);

  // Fallback timeout to ensure loader doesn't stay forever
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isLoading) {
        console.log('Gallery loading timeout reached, forcing complete');
        setIsLoading(false);
      }
    }, 10000); // 10 second timeout

    return () => clearTimeout(timeout);
  }, []);
  
  // Cleanup video when 80s mode changes or component unmounts
  useEffect(() => {
    return () => {
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.src = '';
        videoRef.current.load();
        videoRef.current = null;
      }
    };
  }, [is80sMode]);

  // Handle music toggle
  const handleMusicToggle = useCallback((show) => {
    setShowMusicControls(show);
    if (show && !contextIsPlaying) {
      play();
    }
  }, [contextIsPlaying, play]);

  // Modify toggle80sMode to respect mobile view
  const toggle80sMode = useCallback(() => {
    if (isToggling80sRef.current) {
      console.log("🎨 Gallery: Ignoring toggle - already in progress");
      return;
    }
    
    isToggling80sRef.current = true;
    console.log("🎨 Gallery: toggle80sMode called, current:", is80sMode);
    
    const newMode = !is80sMode;
    console.log("🎨 Gallery: Setting 80s mode from", is80sMode, "to", newMode);
    setContext80sMode(newMode);
    
    // Reset toggle flag after state update
    setTimeout(() => {
      isToggling80sRef.current = false;
    }, 100);
  }, [is80sMode, setContext80sMode]);


 
  return (
    <div
      style={{
        backgroundColor: "#000000",
        height: "100vh",
        width: "100vw",
        margin: 0,
        padding: 0,
        position: "fixed",
        left: 0,
        top: 0,
        overflow: "hidden",
      }}
    >
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

      {/* Loader with progress */}
      {isLoading ? (
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
      ) : (
        <>
          {/* Candle Interaction Hint */}
          <CandleInteractionHint isMobileView={isMobileView} />


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
              fontSize: "3rem", // Always use mobile size
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


          {/* 80s Mode Video Background - disabled since we're always in mobile view */}
          {false && is80sMode && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            zIndex: 1500,
            pointerEvents: "none",
          }}
        >
          <video
            ref={videoRef}
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              minWidth: "100%",
              minHeight: "100%",
              width: "auto",
              height: "auto",
              transform: "translate(-50%, -50%)",
              objectFit: "cover",
              opacity: 0.15,
              filter: "saturate(2) hue-rotate(15deg) brightness(0.8)",
            }}
            onLoadedData={(e) => {
              console.log("Desktop 80s video loaded:", e.target.src);
              e.target.play().catch(err => console.log("Video autoplay failed:", err));
            }}
            onError={(e) => {
              // Only log if there's an actual error
              if (e.target.error) {
                console.error("Desktop video failed to load:", {
                  src: e.target.src,
                  currentSrc: e.target.currentSrc,
                  errorCode: e.target.error?.code,
                  errorMessage: e.target.error?.message
                });
              }
            }}
          >
            <source src="/videos/83.mov" type="video/quicktime" />
            <source src="/videos/83.mov" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      )}
          
          {/* Desktop controls for Music and 80s Mode (only show after loading) */}
          {!isLoading && (
        <>
          {!showMusicControls ? (
            <button
              onClick={() => handleMusicToggle(true)}
              style={{
                position: "fixed",
                top: "3rem",
                right: "20px",
                width: "48px",
                height: "48px",
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
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
                zIndex: 9999,
              }}
              title="Toggle Music"
            >
              <svg
                width="24"
                height="24"
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
            // Compact Music Player Controls (matching mobile)
            <div
              style={{
                position: "fixed",
                top: "3rem",
                right: "20px",
                zIndex: 9999,
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
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
            onClick={() => {
              if (contextIsPlaying) {
                pause();
              } else {
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
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Skip button clicked');
                  console.log('nextTrack function:', nextTrack);
                  console.log('Current track:', currentTrack);
                  console.log('Current track index:', currentTrackIndex);
                  console.log('Is 80s mode:', context80sMode);
                  if (nextTrack) {
                    nextTrack();
                    console.log('nextTrack called');
                    setTimeout(() => {
                      console.log('After skip - new track:', currentTrack);
                      console.log('After skip - new index:', currentTrackIndex);
                    }, 500);
                  } else {
                    console.log('nextTrack is not available');
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
                  console.log('Close button clicked');
                  handleMusicToggle(false);
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
          
          {/* 80s Mode Toggle Icon - positioned below music controls */}
          <button
            onClick={() => toggle80sMode(!is80sMode)}
            style={{
              position: "fixed",
              top: "6rem",
              right: "20px",
              width: "48px",
              height: "48px",
              borderRadius: "50%",
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
              zIndex: 9999,
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
          </>
          )}
      
      {/* 3D Scene - Always render but hide with opacity while loading */}
      <div style={{
        opacity: isLoading ? 0 : 1,
        transition: 'opacity 0.5s ease-in-out',
        pointerEvents: isLoading ? 'none' : 'auto'
      }}>
        <ThreeDVotiveStand 
          setIsLoading={setIsLoading}
          isMobileView={isMobileView}
          is80sMode={is80sMode}
        />
      </div>
      
      {/* Buy Token FAB - Opens Candle Modal */}
      <div onClick={() => setShowCandleModal(true)}>
        <BuyTokenFAB is80sMode={is80sMode} />
      </div>
      
      {/* Compact Candle Modal */}
      <CompactCandleModal 
        isOpen={showCandleModal}
        onClose={() => setShowCandleModal(false)}
        onCandleCreated={(candle) => {
          console.log('New candle created:', candle);
          // Optionally refresh the candles display
        }}
      />
      </>
      )}
    </div>
  );
}