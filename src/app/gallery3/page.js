"use client";

import React, { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useUser, SignInButton } from "@clerk/nextjs";
import { Illumin80ClerkButton } from "@/components/Illumin80Display";
import { useMusic } from "@/components/MusicContext";
import CoinLoader from "@/components/CoinLoader";
import CyberNav from "@/components/CyberNav";
import SocialBar from "@/components/SocialBar";
import TokensBurned from "@/components/TokensBurned";
import BuyTokenFAB from "@/components/BuyTokenFAB";
import CompactCandleModal from "@/components/CompactCandleModal";
import { useFirestoreResults } from "@/utilities/useFirestoreResults";
import { CoinWallet } from "@/components/CoinWallet";
import PolaroidSnapshot from '@/components/PolaroidSnapshot';

// Dynamically import 3D scene
const Gallery3Scene = dynamic(() => import("@/components/Gallery3Scene"), {
  ssr: false,
  loading: () => <CoinLoader loading={true} />
});

export default function Gallery3Page() {
  // Core states
  const { user, isSignedIn } = useUser();
  const [isMobileDevice, setIsMobileDevice] = useState(true); // Default to mobile
  const [fontLoaded, setFontLoaded] = useState(false);
  const [showCandleModal, setShowCandleModal] = useState(false);
  const [emoji, setEmoji] = useState("😇");
  const [enable3D, setEnable3D] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [enableCandles, setEnableCandles] = useState(true); // Enable candles by default
  const [enableStatue, setEnableStatue] = useState(true); // Enable statue by default
  const [paginationState, setPaginationState] = useState(null); // Store pagination control
  const [sortBy, setSortBy] = useState('burnedAmount'); // 'burnedAmount', 'mostLiked', 'newest', or 'smallest'
  const [minimumLoadTime, setMinimumLoadTime] = useState(false); // Track minimum load time
  const [coinBalance, setCoinBalance] = useState(1000); // Starting coin balance
  const [triggerSnapshot, setTriggerSnapshot] = useState(false);
  
  // Get candle data from Firestore
  const results = useFirestoreResults(sortBy);
  
  // Music context
  const { 
    play, 
    pause, 
    isPlaying: contextIsPlaying, 
    nextTrack, 
    currentTrack,
    is80sMode: context80sMode, 
    setIs80sMode: setContext80sMode 
  } = useMusic();
  
  const is80sMode = context80sMode;
  const [showMusicControls, setShowMusicControls] = useState(contextIsPlaying || false);
  
  // Check font loading
  useEffect(() => {
    const checkFont = async () => {
      try {
        await document.fonts.load("1em 'UnifrakturMaguntia'");
        setFontLoaded(true);
        document.documentElement.classList.add('fonts-loaded');
      } catch (e) {
        setTimeout(() => {
          setFontLoaded(true);
          document.documentElement.classList.add('fonts-loaded');
        }, 100);
      }
    };
    checkFont();
  }, []);
  
  // Check mobile device
  useEffect(() => {
    const checkMobile = () => setIsMobileDevice(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Alternate emoji
  useEffect(() => {
    const interval = setInterval(() => {
      setEmoji(prev => prev === "😇" ? "😈" : "😇");
    }, 3000);
    return () => clearInterval(interval);
  }, []);
  
  // Music toggle handler
  const handleMusicToggle = useCallback((show) => {
    setShowMusicControls(show);
    if (show && !contextIsPlaying) {
      play();
    }
  }, [contextIsPlaying, play]);
  
  // 80s mode toggle
  const toggle80sMode = useCallback(() => {
    setContext80sMode(!is80sMode);
  }, [is80sMode, setContext80sMode]);
  
  // Handle winning coins (you can call this when puzzles are solved or wheel spins)
  const handleWinCoins = useCallback((amount) => {
    setCoinBalance(prev => prev + amount);
  }, []);
  
  // Handle scene ready callback
  const handleSceneReady = useCallback((ready) => {
    console.log('Gallery3: Scene ready:', ready);
    setSceneReady(ready);
  }, []);
  
  // Handle pagination changes from MobileCandleOrbital
  const handlePaginationChange = useCallback((paginationData) => {
    console.log('Gallery3: Pagination update:', paginationData);
    setPaginationState(paginationData);
  }, []);
  
  // Set minimum load time on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setMinimumLoadTime(true);
      console.log('Gallery3: Minimum load time reached');
    }, 1500); // Minimum 1.5 seconds of loading
    
    return () => clearTimeout(timer);
  }, []);
  
  // Manage loading state
  useEffect(() => {
    // Only hide loader when all conditions are met:
    // - Minimum load time has passed
    // - Fonts are loaded
    // - Either 3D is not enabled yet, OR 3D is enabled AND scene is ready
    if (minimumLoadTime && fontLoaded && (!enable3D || (enable3D && sceneReady))) {
      // Add delay to ensure scene is fully rendered
      setTimeout(() => {
        console.log('Gallery3: All assets loaded, hiding loader');
        setIsLoading(false);
      }, 500); // Increased delay for smooth transition
    } else {
      // Keep loading state true if conditions aren't met
      setIsLoading(true);
    }
  }, [minimumLoadTime, fontLoaded, enable3D, sceneReady]);
  
  // Auto-enable 3D after fonts load
  useEffect(() => {
    if (fontLoaded && !enable3D) {
      console.log('Gallery3: Fonts loaded, enabling 3D scene');
      const timer = setTimeout(() => {
        setEnable3D(true);
      }, 200); // Reduced delay since we have better loading tracking
      return () => clearTimeout(timer);
    }
  }, [fontLoaded, enable3D]);
  
  // Log memory on mount
  useEffect(() => {
    console.log('Gallery3: Page loaded - check memory now');
    if (performance.memory) {
      console.log('Memory:', {
        used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) + 'MB',
        total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024) + 'MB'
      });
    }
  }, []);
  
  return (
    <div style={{
      backgroundColor: "#000000",
      height: "100vh",
      width: "100vw",
      position: "fixed",
      left: 0,
      top: 0,
      overflow: "hidden"
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
      
      {/* Full page loader */}
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
          justifyContent: 'center',
          opacity: isLoading ? 1 : 0,
          transition: 'opacity 0.5s ease-out',
          pointerEvents: isLoading ? 'auto' : 'none'
        }}>
          <CoinLoader loading={isLoading} />
        </div>
      )}
      
      {/* RL80 Logo with shadow effect */}
      <div style={{
        position: "fixed",
        top: "20px",
        left: "20px",
        zIndex: 10000,
        opacity: fontLoaded ? 1 : 0,
        transition: "opacity 0.3s ease-in-out"
      }}>
        <div id="text" style={{
          position: "relative",
          fontFamily: "'UnifrakturMaguntia', serif",
          fontSize: "3rem",
          color: "#ffffff",
          cursor: "pointer"
        }}>
          <Link href="/home" style={{ textDecoration: 'none', color: 'inherit' }}>
            RL80
          </Link>
          {/* Shadow copies */}
          {Array.from({length: 100}).map((_, i) => (
            <div
              key={i + 1}
              className="text__copy"
              style={{
                position: "absolute",
                pointerEvents: "none",
                zIndex: -1,
                top: 0,
                left: 0,
                color: is80sMode 
                  ? `rgba(${201 - (i+1) * 2}, ${55 - (i+1) * 3}, ${256 - (i+1) * 2})`
                  : `rgba(${255 - (i+1) * 2}, ${255 - (i+1) * 3}, ${255 - (i+1) * 2})`,
                filter: "blur(0.1rem)",
                transform: `translate(${(i+1) * 0.1}rem, ${(i+1) * 0.1}rem) scale(${1 + (i+1) * 0.01})`,
                opacity: (1 / (i+1)) * 1.5
              }}
            >
              RL80
            </div>
          ))}
        </div>
      </div>
      
      {/* Top Controls Bar */}
      <div style={{
        position: "fixed",
        top: "20px",
        right: "20px",
        display: "flex",
        flexDirection: isMobileDevice ? "column" : "row",
        gap: isMobileDevice ? "10px" : "15px",
        alignItems: isMobileDevice ? "flex-end" : "center",
        zIndex: 9999
      }}>
        {/* Music Controls */}
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
                backdropFilter: "blur(10px)",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)"
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18V5l12-2v13" />
                <circle cx="6" cy="18" r="3" />
                <circle cx="18" cy="16" r="3" />
              </svg>
            </button>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {/* Album art */}
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
                <div style={{
                  width: "100%",
                  height: "100%",
                  backgroundImage: "url('/virginRecords.jpg')",
                  backgroundSize: "cover",
                  backgroundPosition: "center"
                }} />
              </div>
              
              {/* Skip button */}
              <button
                onClick={nextTrack}
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
                  cursor: "pointer"
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="5 4 15 12 5 20 5 4"/>
                  <line x1="19" y1="5" x2="19" y2="19"/>
                </svg>
              </button>
              
              {/* Close button */}
              <button
                onClick={() => {
                  handleMusicToggle(false);
                  pause();
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
                  cursor: "pointer"
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          )}
        </div>
        
        {/* User Account */}
        <div style={{ order: isMobileDevice ? 1 : 1 }}>
          {isSignedIn ? (
            <Illumin80ClerkButton afterSignOutUrl="/" isMobileDevice={isMobileDevice} />
          ) : (
            <SignInButton mode="modal" forceRedirectUrl="/gallery3">
              <button style={{
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
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)"
              }}>
                <span style={{ fontSize: "2.5rem" }}>{emoji}</span>
              </button>
            </SignInButton>
          )}
        </div>
        
        {/* 80s Mode Toggle */}
        <div style={{ order: isMobileDevice ? 3 : 2 }}>
          <button
            onClick={toggle80sMode}
            style={{
              width: isMobileDevice ? "40px" : "60px",
              height: isMobileDevice ? "40px" : "60px",
              borderRadius: "8px",
              backgroundColor: is80sMode ? "rgba(217, 70, 239, 0.3)" : "rgba(0, 0, 0, 0.7)",
              border: is80sMode ? "2px solid #D946EF" : "2px solid rgba(255, 255, 255, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              backdropFilter: "blur(10px)",
              boxShadow: is80sMode 
                ? "0 0 20px rgba(217, 70, 239, 0.5)" 
                : "0 2px 8px rgba(0, 0, 0, 0.3)"
            }}
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
        
        {/* CyberNav Menu */}
        <div style={{ order: isMobileDevice ? 0 : 3 }}>
          <CyberNav is80sMode={is80sMode} position="relative" />
        </div>
        
        {/* Social Bar */}
        <div style={{ order: isMobileDevice ? 4 : 4 }}>
          <SocialBar is80sMode={is80sMode} />
        </div>
      </div>
      
      {/* Tokens Burned Display */}
      {/* <div style={{
        position: 'fixed',
        bottom: isMobileDevice ? '40px' : '20px',
        left: isMobileDevice ? 'auto' : '20px',
        right: isMobileDevice ? '40px' : 'auto',
        zIndex: 9998
      }}>
        <TokensBurned />
      </div> */}
      
      {/* Illumin80 Heading and Sort Button */}
      {!isLoading && enableCandles && (
        <div style={{
          position: 'fixed',
          top: '70%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          zIndex: 100,
          pointerEvents: 'none',
        }}>
          {/* Sort Button - Above Heading */}
          <button
            onClick={() => setSortBy(
              sortBy === 'burnedAmount' ? 'mostLiked' : 
              sortBy === 'mostLiked' ? 'newest' : 
              sortBy === 'newest' ? 'smallest' : 
              'burnedAmount'
            )}
            style={{
              padding: '8px 16px',
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '20px',
              color: '#ffffff',
              fontSize: '0.9rem',
              cursor: 'pointer',
              pointerEvents: 'auto',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.3s ease',
              marginBottom: '15px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
            }}
          >
            Sort by: {sortBy === 'burnedAmount' ? 'Top Burner' : 
                     sortBy === 'mostLiked' ? 'Most Liked' : 
                     sortBy === 'newest' ? 'Newest' : 
                     'Smallest Burn'}
          </button>
          
          {/* Main Heading */}
          <div
            className={!is80sMode ? "thelma1" : ""}
            style={is80sMode ? {
              fontSize: '2rem',
              fontWeight: '900',
              lineHeight: '0.8',
              fontFamily: '"Bebas Neue", sans-serif',
              transform: 'rotate(-8deg) skew(-15deg)',
              background: 'linear-gradient(45deg, #ff00ff, #00ffff, #ff00ff)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              position: 'relative',
              pointerEvents: 'none',
              filter: `
                drop-shadow(0 0 8px rgba(255, 255, 255, 0.9))
                drop-shadow(0 0 16px rgba(255, 255, 255, 0.7))
                drop-shadow(0 0 24px rgba(255, 255, 255, 0.5))
                drop-shadow(4px 4px 8px rgba(0, 0, 0, 0.8))
              `,
              animation: 'pulse80s 2s ease-in-out infinite',
            } : {
              color: '#8e662b',
              textShadow: '0 0 5px #fff, 0 0 10px #fff, 0 0 15px #8e662b, 0 0 20px turquoise, 0 0 25px turquoise, 2px 2px 3px rgba(0, 0, 0, 0.5)',
              fontSize: '2rem',
              fontFamily: '"Bebas Neue", sans-serif',
              fontWeight: 900,
              lineHeight: 0.8,
              transform: 'rotate(-8deg) skew(-15deg)',
              pointerEvents: 'none',
            }}
          >
            {sortBy === 'burnedAmount' ? 'THE ILLUMIN80' : 
             sortBy === 'mostLiked' ? 'THE POPULAR80' : 
             sortBy === 'newest' ? 'THE COMMUN80' : 
             'THE NOBIL80'}
          </div>
        </div>
      )}
      
      {/* Pagination Controls - Lowered */}
      {!isLoading && enableCandles && paginationState && paginationState.totalPages > 1 && (
        <div style={{
          position: 'fixed',
          top: '75%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '180px',
          pointerEvents: 'none',
          zIndex: 1000,
        }}>
          {/* Previous Button */}
          <button
            onClick={() => {
              if (paginationState && paginationState.setCurrentPage) {
                const { currentPage, totalPages } = paginationState;
                const newPage = (currentPage - 1 + totalPages) % totalPages;
                paginationState.setCurrentPage(newPage);
              }
            }}
            style={{
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              border: '2px solid rgba(255, 255, 255, 0.6)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              pointerEvents: 'auto',
              transition: 'all 0.3s ease',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5), 0 0 20px rgba(255, 255, 255, 0.1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
              e.currentTarget.style.transform = 'scale(1.15)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.6), 0 0 30px rgba(255, 255, 255, 0.3)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.9)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.5), 0 0 20px rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.6)';
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          
          {/* Next Button */}
          <button
            onClick={() => {
              if (paginationState && paginationState.setCurrentPage) {
                const { currentPage, totalPages } = paginationState;
                const newPage = (currentPage + 1) % totalPages;
                paginationState.setCurrentPage(newPage);
              }
            }}
            style={{
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              border: '2px solid rgba(255, 255, 255, 0.6)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              pointerEvents: 'auto',
              transition: 'all 0.3s ease',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5), 0 0 20px rgba(255, 255, 255, 0.1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
              e.currentTarget.style.transform = 'scale(1.15)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.6), 0 0 30px rgba(255, 255, 255, 0.3)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.9)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.5), 0 0 20px rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.6)';
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      )}
      
      {/* Page Dots Indicator */}
      {!isLoading && enableCandles && paginationState && paginationState.totalPages > 1 && (
        <div style={{
          position: 'fixed',
          bottom: '140px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '8px',
          zIndex: 1000,
        }}>
          {Array.from({ length: paginationState.totalPages }, (_, i) => (
            <div
              key={i}
              style={{
                width: i === paginationState.currentPage ? '16px' : '6px',
                height: '6px',
                borderRadius: i === paginationState.currentPage ? '3px' : '50%',
                backgroundColor: i === paginationState.currentPage ? '#ffffff' : 'rgba(255,255,255,0.6)',
                transition: 'all 0.3s ease',
              }}
            />
          ))}
        </div>
      )}
      
      
      {/* Buy Token FAB */}
      <div onClick={() => {
        if (!isSignedIn) {
          const btn = document.getElementById('hidden-sign-in');
          btn?.click();
        } else {
          setShowCandleModal(true);
        }
      }}>
        <BuyTokenFAB is80sMode={is80sMode} />
      </div>
      
      {/* Hidden sign in button */}
      {!isSignedIn && (
        <SignInButton mode="modal" forceRedirectUrl="/gallery3">
          <button id="hidden-sign-in" style={{ display: 'none' }}>Sign In</button>
        </SignInButton>
      )}
      
      {/* Candle Modal */}
      <CompactCandleModal 
        isOpen={showCandleModal}
        onClose={() => setShowCandleModal(false)}
        onCandleCreated={(candle) => {
          console.log('Candle created:', candle);
        }}
      />
      
      {/* 3D Scene Container */}
      <div style={{
        position: 'absolute',
        inset: 0,
        opacity: isLoading ? 0 : 1,
        transition: 'opacity 0.5s ease-in-out',
        pointerEvents: isLoading ? 'none' : 'auto'
      }}>
        {enable3D && (
          <Gallery3Scene 
            enabled={enable3D}
            isMobileView={true}
            is80sMode={is80sMode}
            onSceneReady={handleSceneReady}
            enableCandles={enableCandles}
            enableStatue={enableStatue}
            onPaginationChange={handlePaginationChange}
            candleData={results}
            sortBy={sortBy}
            onCoinsWon={handleWinCoins}
          />
        )}
      </div>
      
      {/* Coin Wallet - Bottom Left */}
      <CoinWallet balance={coinBalance} />
      
      {/* Snapshot Button */}
      <button
        onClick={() => {
          // Force a re-render before capturing
          const canvas = document.querySelector('canvas');
          if (canvas) {
            // Try to get the Three.js renderer
            const gl = canvas.getContext('webgl') || canvas.getContext('webgl2') || canvas.getContext('experimental-webgl');
            if (gl) {
              gl.finish(); // Ensure all WebGL commands are complete
            }
          }
          setTriggerSnapshot(true);
        }}
        style={{
          position: "fixed",
          bottom: "2rem",
          right: "2rem",
          width: "60px",
          height: "60px",
          borderRadius: "50%",
          backgroundColor: is80sMode ? "rgba(217, 70, 239, 0.2)" : "rgba(255, 255, 255, 0.1)",
          backdropFilter: "blur(10px)",
          border: is80sMode ? "2px solid #D946EF" : "2px solid rgba(255, 255, 255, 0.3)",
          color: is80sMode ? "#67e8f9" : "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          transition: "all 0.3s ease",
          boxShadow: is80sMode 
            ? "0 0 20px rgba(217, 70, 239, 0.5), 0 4px 15px rgba(0, 0, 0, 0.3)" 
            : "0 4px 15px rgba(0, 0, 0, 0.3)",
          zIndex: 999,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = is80sMode 
            ? "rgba(217, 70, 239, 0.4)" 
            : "rgba(255, 255, 255, 0.2)";
          e.currentTarget.style.transform = "scale(1.1)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = is80sMode 
            ? "rgba(217, 70, 239, 0.2)" 
            : "rgba(255, 255, 255, 0.1)";
          e.currentTarget.style.transform = "scale(1)";
        }}
        title="Take Snapshot"
      >
        <svg
          width="30"
          height="30"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
          <circle cx="12" cy="13" r="4"/>
        </svg>
      </button>

      {/* Polaroid Snapshot Component */}
      <PolaroidSnapshot 
        trigger={triggerSnapshot}
        onComplete={() => setTriggerSnapshot(false)}
        label={is80sMode ? "Radical Capture!" : "Gallery Moment"}
      />
    </div>
  );
}