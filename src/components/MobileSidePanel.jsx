import React, { useState, useEffect, useRef, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import dynamic from "next/dynamic";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, Center } from "@react-three/drei";
import * as THREE from "three";
import { useMusic } from "@/components/MusicContext";



const MobileSidePanel = ({
  onButtonClick,
  is80sMode,
  toggle80sMode,
  monsterMode,

  showSpotify,
  setShowSpotify,


  paginationState, // New prop for pagination
  activeScene = 'gallery', // New prop to detect current scene

}) => {
  const [isVideoScreenOpen, setIsVideoScreenOpen] = useState(false);

  const { isLoaded, isSignedIn, user } = useUser();
  const [iframeReady, setIframeReady] = useState(false);
  const [showMobileMusicPlayer, setShowMobileMusicPlayer] = useState(false);
  const [musicPlayerVisible, setMusicPlayerVisible] = useState(false);
  const [showMusicChoice, setShowMusicChoice] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false); // Local state for UI updates
  const [userClosedMusic, setUserClosedMusic] = useState(false); // Track if user explicitly closed music
  
  // Use music context for shared state
  const { 
    showSpotify: contextShowSpotify, 
    setShowSpotify: setContextShowSpotify,
    isPlaying: contextIsPlaying,
    setIsPlaying: setContextIsPlaying,
    audioRef,
  } = useMusic();

  const [musicPlayerControls, setMusicPlayerControls] = useState(null);

  

  

  

  
  // Sync local music player state with context when component mounts or scene changes
  useEffect(() => {
    console.log('🎵 MobileSidePanel: Music sync check:', {
      activeScene,
      contextShowSpotify,
      contextIsPlaying,
      showMobileMusicPlayer
    });
    
    // If music is playing in ANY scene, show the player (unless user closed it)
    if (contextIsPlaying && !userClosedMusic && !showMobileMusicPlayer) {
      console.log('🎵 MobileSidePanel: Music is playing, showing player UI in', activeScene, 'scene');
      setShowMobileMusicPlayer(true);
      setMusicPlayerVisible(true);
      setContextShowSpotify(true); // Ensure context is synced
    }
    
    // Also sync the local playing state
    if (contextIsPlaying !== isPlaying) {
      setIsPlaying(contextIsPlaying);
    }
  }, [activeScene, contextShowSpotify, contextIsPlaying, userClosedMusic]);
  
  // Initial sync when component mounts
  useEffect(() => {
    // Check both if music is set to show or if it's actually playing
    if ((contextShowSpotify || contextIsPlaying) && activeScene === 'moon' && !userClosedMusic) {
      console.log('🎵 MobileSidePanel: Initial mount in lunar scene - music is active, showing player');
      setShowMobileMusicPlayer(true);
      setMusicPlayerVisible(true);
    }
  }, [activeScene, userClosedMusic]); // Add activeScene as dependency to check on scene changes
  
  // Callback to receive controls from MobileMusicPlayer
  const handleMusicControlsReady = useCallback((controls) => {
    // Only set if controls actually changed to prevent infinite loops
    setMusicPlayerControls(prevControls => {
      // If we already have controls, don't update (prevents infinite loop)
      if (prevControls) return prevControls;
      return controls;
    });
  }, []);






  // Music player handlers - only called when user selects a mode from music player UI
  const handleMusicModeChange = (enable80s) => {
    console.log('🎵 Music player mode selection:', enable80s, 'current is80sMode:', is80sMode);
    
    if (enable80s !== is80sMode) {
      console.log('🎵 User selected different mode from music player');
      toggle80sMode();
    }
  };

  const handleMusicPlayerClose = () => {
    console.log('🎵 handleMusicPlayerClose called', {
      audioRef: audioRef.current,
      audioSrc: audioRef.current?.src,
      paused: audioRef.current?.paused,
      currentTime: audioRef.current?.currentTime,
      musicPlayerControls: !!musicPlayerControls,
      activeScene
    });
    
    // Mark that user explicitly closed the music
    setUserClosedMusic(true);
    
    // Stop the music if it's playing using the audio ref directly
    if (audioRef.current) {
      console.log('🎵 Audio ref exists, attempting to pause...');
      try {
        audioRef.current.pause();
        console.log('🎵 Pause successful, audio paused:', audioRef.current.paused);
        setContextIsPlaying(false);
        
        // Also try to reset current time to ensure it's really stopped
        audioRef.current.currentTime = 0;
      } catch (error) {
        console.error('🎵 Error pausing audio:', error);
      }
    } else if (musicPlayerControls && musicPlayerControls.pause) {
      // Fallback to controls if available
      console.log('🎵 No audio ref, trying controls');
      musicPlayerControls.pause();
    } else {
      console.log('⚠️ Could not stop music - no audio ref or controls available');
    }
    
    // Hide UI immediately
    setShowMobileMusicPlayer(false);
    setMusicPlayerVisible(false);
    setShowMusicChoice(false);
    
    // Update context to reflect music is closed
    // Use a small delay to ensure the pause has taken effect
    setTimeout(() => {
      setContextShowSpotify(false);
      // Double-check that music is really stopped
      if (audioRef.current && !audioRef.current.paused) {
        console.warn('🎵 Music still playing after close! Force stopping...');
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setContextIsPlaying(false);
      }
    }, 100);
    
    // Send a message to ensure all components know music should stop
    window.postMessage({ type: 'FORCE_STOP_MUSIC' }, '*');
  };

    
    
    // Detect browser for optimized handling
    const isChrome = /Chrome/.test(navigator.userAgent) && !/Edge/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const isChromeMobile = isChrome && isAndroid;
    const isChromeiOS = /CriOS/.test(navigator.userAgent);
    
    
  // Render the music player even when panel is closed if showSpotify is true
  const renderMusicPlayer = () => {
    // Don't render MusicPlayer2 if MobileMusicPlayer is active
    if (!showSpotify || showMobileMusicPlayer) return null;
    
    return (
      <div
        style={{
          position: "fixed",
          bottom: "0",
          left: "0",
          width: "100%",
          maxWidth: "450px",
          margin: "0 auto",
          background: "transparent",
          overflow: "hidden",
          borderRadius: "0",
          zIndex: "1000",
          marginLeft: "auto",
          marginRight: "auto",
          right: "0",
          opacity: 1,
          visibility: "visible",
          height: "auto",
          pointerEvents: "auto"
        }}
      >
        <MusicPlayer2
          isVisible={showSpotify}
          onClose={() => {
            if (setShowSpotify && typeof setShowSpotify === 'function') {
              setShowSpotify(false);
            }
          }}
          autoPlay={true}
          is80sMode={is80sMode}
        />
      </div>
    );
  };




  return (
      <>

      {is80sMode && activeScene !== 'moon' && (
        <div
          style={{
            position: "fixed",
            top: "0",
            left: "0",
            width: "100%",
            height: "100%",
            zIndex: "-1",
            overflow: "hidden",
            pointerEvents: "none"
          }}
        >
          <video
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              minwidth: "100%",
              minheight: "100%",
              width: "auto",
              height: "auto",
              transform: "translate(-50%, -50%)",
              objectFit: "cover",
              opacity: 0.25,
              filter: "saturate(2) hue-rotate(15deg) brightness(0.8)",
            }}
            onError={(e) => {
              console.error("Video failed to load:", e);
              // Try fallback video if main video fails
              e.target.src = "/vaporwave-sunset.mp4";
            }}
          >
            <source src="/videos/83.mov" type="video/quicktime" />
            <source src="/videos/83.mov" type="video/mp4" />
            {/* Fallback to vaporwave video if .mov doesn't work */}
            <source src="/vaporwave-sunset.mp4" type="video/mp4" />
          </video>
          
          {/* Overlay gradient to ensure UI visibility */}
          <div
          style={{
            position:"absolute",
            top:"0",
            left:"0",
            width:"100%",
            height:"100%",
            background:"linear-gradient(180deg, rgba(139, 0, 139, 0.2) 0%, rgba(75, 0, 130, 0.3) 50%, rgba(139, 0, 139, 0.4) 100%)",
            mixBlendMode:"overlay",
            zIndex:"-1"
          }}
          />
        </div>
      )}
      
      {/* Top Corner Buttons */}
      {/* Music Player - Top Right Above 80s Mode Toggle */}
      {!showMobileMusicPlayer ? (
        // Music Icon Button
        <button
          style={{
            position: "fixed",
            top: "20px",
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
            zIndex: 1100
          }}
          aria-label="Music Player"
          title="Toggle Music"
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
            e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.4)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
            e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.3)";
          }}
          onClick={() => {
            console.log('🎵 Music icon clicked in lunar scene');
            // Reset the user closed flag since they're manually opening it
            setUserClosedMusic(false);
            
            // In lunar scene, always just show the player UI if music is playing
            if (activeScene === 'moon' && audioRef.current && !audioRef.current.paused) {
              console.log('🎵 Music is playing in lunar scene, showing player UI');
              setShowMobileMusicPlayer(true);
              setMusicPlayerVisible(true);
            } else if (contextShowSpotify && contextIsPlaying) {
              // Music is already playing, just show the UI
              console.log('🎵 Music already playing, showing UI');
              setShowMobileMusicPlayer(true);
              setMusicPlayerVisible(true);
            } else {
              // Start fresh music playback
              setShowMusicChoice(false);
              setShowMobileMusicPlayer(true);
              setMusicPlayerVisible(true);
              setContextShowSpotify(true);
            }
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18V5l12-2v13"/>
            <circle cx="6" cy="18" r="3"/>
            <circle cx="18" cy="16" r="3"/>
          </svg>
        </button>
      ) : (
        // Minimal Music Player with overlay to block 3D interactions
        <>
          {/* Invisible overlay to prevent 3D scene interactions */}
          <div
            style={{
              position: "fixed",
              top: "0",
              right: "0",
              width: "200px",
              height: "100px",
              zIndex: "9998",
              pointerEvents: "auto",
              background: "transparent",
              cursor: "default"
            }}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
            onTouchStart={(e) => {
              e.stopPropagation();
            }}
            onTouchEnd={(e) => {
              e.stopPropagation();
            }}
            onTouchMove={(e) => {
              e.stopPropagation();
            }}
          />
          
          {/* Music Player Controls */}
          <div
            style={{
              position: "fixed",
              top: "20px",
              right: "20px",
              zIndex: "9999",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              pointerEvents: "auto",
              isolation: "isolate"
            }}
          >
          {/* Spinning Album Art */}
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              backgroundImage: "url('/virginRecords.jpg')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              transition: "all 0.3s ease",
              animation: musicPlayerVisible && isPlaying ? "spin 3s linear infinite" : "none"
            }}
          />
          
          {/* Skip Button */}
          <button
            aria-label="Next Track"
            style={{
              color: "white",
              background: "rgba(255, 255, 255, 0.1)",
              minWidth: "32px",
              height: "32px",
              position: "relative",
              zIndex: "10000",
              pointerEvents: "auto",
              border: "none",
              borderRadius: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.3s ease"
            }}
            onClick={(e) => {
              console.log('🎵 Skip button clicked', { 
                hasControls: !!musicPlayerControls,
                activeScene
              });
              
              // Try to use controls if available
              if (musicPlayerControls && musicPlayerControls.skipTrack) {
                console.log('🎵 Using music player controls to skip');
                musicPlayerControls.skipTrack();
              } else {
                console.log('⚠️ No skip controls available in lunar scene');
                // As a last resort, send a message to trigger skip
                window.postMessage({ type: 'SKIP_TRACK' }, '*');
              }
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 4 15 12 5 20 5 4"/>
              <line x1="19" y1="5" x2="19" y2="19"/>
            </svg>
          </button>
          
          {/* Close Button */}
          <div
            aria-label="Close Music Player"
            style={{
              width: "28px",
              height: "28px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(255, 255, 255, 0.1)",
              borderRadius: "4px",
              color: "white",
              position: "relative",
              zIndex: "10000",
              cursor: "pointer",
              pointerEvents: "auto",
              border: "1px solid rgba(255, 255, 255, 0.3)",
              transition: "all 0.3s ease"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255, 0, 0, 0.5)";
              e.currentTarget.style.transform = "scale(1.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
              e.currentTarget.style.transform = "scale(1)";
            }}
            onClick={(e) => {
              console.log('🎵 Close button clicked!');
              e.stopPropagation();
              e.preventDefault();
              
              // Call the proper close handler which sets userClosedMusic
              handleMusicPlayerClose();
            }}
            onTouchEnd={(e) => {
              console.log('🎵 Close button touch end!');
              e.stopPropagation();
              e.preventDefault();
              
              // Call the proper close handler which sets userClosedMusic
              handleMusicPlayerClose();
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </div>
        </div>
        </>
      )}
      
      {/* 80s Mode Toggle - Top Right Below Music Icon - Hidden in lunar scene */}
 
        <div
          style={{
            position: "fixed",
            top: "70px",
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
            zIndex: 10000
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('🎵 80s Mode Toggle clicked, current state:', is80sMode);
            toggle80sMode();
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = is80sMode 
              ? "0 0 30px rgba(217, 70, 239, 0.7), 0 2px 8px rgba(0, 0, 0, 0.3)"
              : "0 2px 8px rgba(0, 0, 0, 0.3)";
            if (!is80sMode) {
              e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = is80sMode 
              ? "0 0 20px rgba(217, 70, 239, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3)"
              : "0 2px 8px rgba(0, 0, 0, 0.3)";
            e.currentTarget.style.backgroundColor = is80sMode 
              ? "rgba(217, 70, 239, 0.3)" 
              : "rgba(0, 0, 0, 0.7)";
          }}
          title={is80sMode ? "Disable 80s Mode" : "Enable 80s Mode"}
        >
          <span 
            style={{
              fontSize: "20px",
              fontWeight: "bold",
              color: is80sMode ? "#00ff41" : "#67e8f9",
              textShadow: is80sMode ? "0 0 10px #00ff41" : "none",
              fontFamily: "monospace"
            }}
          >
            80s
          </span>
        </div>
        <div
          style={{
            position: "fixed",
            top: "120px",
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
            zIndex: 1100
          }}
          aria-label="Music Player"
          title="Toggle Music"
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
            e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.4)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
            e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.3)";
          }}
          onClick={() => {
            console.log('🎵 Music icon clicked in lunar scene');
            // Reset the user closed flag since they're manually opening it
            setUserClosedMusic(false);
            
            // In lunar scene, always just show the player UI if music is playing
            if (activeScene === 'moon' && audioRef.current && !audioRef.current.paused) {
              console.log('🎵 Music is playing in lunar scene, showing player UI');
              setShowMobileMusicPlayer(true);
              setMusicPlayerVisible(true);
            } else if (contextShowSpotify && contextIsPlaying) {
              // Music is already playing, just show the UI
              console.log('🎵 Music already playing, showing UI');
              setShowMobileMusicPlayer(true);
              setMusicPlayerVisible(true);
            } else {
              // Start fresh music playback
              setShowMusicChoice(false);
              setShowMobileMusicPlayer(true);
              setMusicPlayerVisible(true);
              setContextShowSpotify(true);
            }
          }}
        >

            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-flame-icon lucide-flame">
              <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
            </svg>
          
        </div>

      
        
       

      {/* Pagination Indicator with Arrows - Moved outside bottom bar to keep visible */}
      {paginationState && (
        <div
        style={{
          position: "fixed",
          bottom: "100px",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "4px",
          zIndex: "1001"
        }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px"
            }}
          >
            {/* Left Arrow */}
            <button
              aria-label="Previous Page"
              style={{
                color: "#ffffff",
                background: "transparent",
                borderRadius: "50%",
                border: "2px solid rgba(255,255,255,0.8)",
                minWidth: "48px",
                height: "48px",
                padding: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.3s ease"
              }}
              onClick={() => {
                // Check if candle viewer is open and can handle navigation
                if (window.isCandleViewerOpen && window.candleViewerNavigate) {
                  window.candleViewerNavigate('prev');
                  return;
                }
                
                if (paginationState) {
                  const { currentPage, totalPages, setCurrentPage } = paginationState;
                  const newPage = (currentPage - 1 + totalPages) % totalPages;
                  setCurrentPage(newPage);
                }
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                e.currentTarget.style.borderColor = "#ffffff";
                e.currentTarget.style.transform = "scale(1.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.8)";
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6"/>
              </svg>
            </button>
            
            <span 
              className={!is80sMode ? "thelma1" : ""}
              style={{
                fontSize: "2rem",
                pointerEvents: "none",
                ...(is80sMode ? {
                fontWeight: "900",
                lineHeight: "0.8",
                transform: "rotate(-8deg) skew(-15deg)",
                background: "linear-gradient(45deg, #ff00ff, #00ffff, #ff00ff)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                position: "relative",
                pointerEvents: "none",
                filter: `
                  drop-shadow(0 0 8px rgba(255, 255, 255, 0.9))
                  drop-shadow(0 0 16px rgba(255, 255, 255, 0.7))
                  drop-shadow(0 0 24px rgba(255, 255, 255, 0.5))
                  drop-shadow(0 0 40px rgba(0, 255, 255, 0.6))
                  drop-shadow(0 0 60px rgba(255, 0, 255, 0.5))
                `,
                animation: "neonPulse 2s ease-in-out infinite alternate",
                // Add TWO pseudo-elements - one for white outline, one for colorful text
                _after: {
                  content: "'THE ILLUMIN80'",
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  zIndex: -1,
                  color: "transparent",
                  WebkitTextStroke: "2px white",
                  filter: "blur(3px)",
                  opacity: 0.7,
                },
                "@keyframes neonPulse": {
                  "0%": {
                    filter: `
                      drop-shadow(0 0 8px rgba(255, 255, 255, 0.9))
                      drop-shadow(0 0 16px rgba(255, 255, 255, 0.7))
                      drop-shadow(0 0 24px rgba(255, 255, 255, 0.5))
                      drop-shadow(0 0 40px rgba(0, 255, 255, 0.6))
                      drop-shadow(0 0 60px rgba(255, 0, 255, 0.5))
                    `,
                  },
                  "100%": {
                    filter: `
                      drop-shadow(0 0 12px rgba(255, 255, 255, 1))
                      drop-shadow(0 0 20px rgba(255, 255, 255, 0.8))
                      drop-shadow(0 0 32px rgba(255, 255, 255, 0.6))
                      drop-shadow(0 0 50px rgba(0, 255, 255, 0.8))
                      drop-shadow(0 0 70px rgba(255, 0, 255, 0.6))
                    `,
                  }
                }
                } : {})
              }}
            >
              THE ILLUMIN80
            </span>
            
            {/* Right Arrow */}
            <button
              aria-label="Next Page"
              style={{
                color: "#ffffff",
                background: "transparent",
                borderRadius: "50%",
                border: "2px solid rgba(255,255,255,0.8)",
                minWidth: "48px",
                height: "48px",
                padding: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.3s ease"
              }}
              onClick={() => {
                // Check if candle viewer is open and can handle navigation
                if (window.isCandleViewerOpen && window.candleViewerNavigate) {
                  window.candleViewerNavigate('next');
                  return;
                }
                
                if (paginationState) {
                  const { currentPage, totalPages, setCurrentPage } = paginationState;
                  const newPage = (currentPage + 1) % totalPages;
                  setCurrentPage(newPage);
                }
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                e.currentTarget.style.borderColor = "#ffffff";
                e.currentTarget.style.transform = "scale(1.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.8)";
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </button>
          </div>
          
          <div style={{ display: "flex", gap: "6px", alignItems: "center", paddingTop: "8px", paddingBottom: "8px" }}>
            {paginationState && paginationState.totalPages && paginationState.totalPages <= 10 ? (
              Array.from({ length: paginationState.totalPages }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: i === paginationState.currentPage ? "24px" : "10px",
                    height: "10px",
                    borderRadius: i === paginationState.currentPage ? "5px" : "50%",
                    background: i === paginationState.currentPage ? "#ffffff" : "rgba(255,255,255,0.6)",
                    transition: "all 0.3s ease"
                  }}
                />
              ))
            ) : (
              <span style={{ fontSize: "1rem", color: "#ffffff", opacity: "0.8" }}>
                {paginationState.currentPage + 1} / {paginationState.totalPages}
              </span>
            )}
          </div>
          
          {paginationState && paginationState.visibleRange && (
            <span
              style={{
                fontSize: "1rem",
                color: "#ffffff",
                opacity: "0.8"
              }}
            >
              {paginationState.visibleRange.start}-{paginationState.visibleRange.end} of {paginationState.total}
            </span>
          )}
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
</>
)}
          
      
export default MobileSidePanel;