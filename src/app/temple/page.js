"use client";
import React, { Suspense, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import ConstellationModel from '@/components/ConstellationModel';
import StarField from '@/components/StarField';
import Link from 'next/link';
import PostProcessingEffects from '@/components/PostProcessingEffects';
import CyborgTempleScene from '@/components/CyborgTempleScene';
import VideoScreens from "@/components/VideoScreens";
import TickerDisplay3 from "@/components/TickerDisplay3";
import { useMusic } from '@/components/MusicContext';
import { useUser, SignInButton } from "@clerk/nextjs";
import { Illumin80ClerkButton } from "@/components/Illumin80Display";
import CyberNav from '@/components/CyberNav';
import SocialBar from '@/components/SocialBar';
import CoinLoader from '@/components/CoinLoader';
import MemoryMonitor from '@/components/MemoryMonitor';
import TradingOverlay from '@/components/TradingOverlay';
import { useTradingBot } from '@/hooks/useTradingBot';
import PolaroidSnapshot from '@/components/PolaroidSnapshot';


export default function CyborgTemple() {
  const [isMobileView, setIsMobileView] = useState(false);
  const [fontLoaded, setFontLoaded] = useState(false);
  const [showMusicControls, setShowMusicControls] = useState(false);
  const [emoji, setEmoji] = useState("😇");
  const [mounted, setMounted] = useState(false);
  const [isSceneLoading, setIsSceneLoading] = useState(true);
  const [sceneReady, setSceneReady] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [showTrading, setShowTrading] = useState(true);
  const [triggerSnapshot, setTriggerSnapshot] = useState(false);
  
  // Connect to trading bot for real data
  const { isConnected, tradingMode, tradingData, changeTradingMode } = useTradingBot();

  // Get music context functions
  const {
    play,
    pause,
    isPlaying: contextIsPlaying,
    nextTrack,
    currentTrack,
    is80sMode
  } = useMusic();

  // Get user context
  const { isSignedIn } = useUser();

  // Check if mobile on mount
  useEffect(() => {
    const checkMobile = () => {
      if (typeof window !== 'undefined') {
        setIsMobileView(window.innerWidth <= 768);
      }
    };
    checkMobile();
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', checkMobile);
    }
    setMounted(true);
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', checkMobile);
      }
    };
  }, []);

  // Check if font is loaded
  useEffect(() => {
    const checkFont = async () => {
      if (typeof window !== 'undefined' && typeof document !== 'undefined') {
        try {
          await document.fonts.load("1em 'UnifrakturMaguntia'");
          console.log('Font loaded successfully');
          setFontLoaded(true);
        } catch (e) {
          console.log('Font load failed, using fallback');
          setTimeout(() => {
            setFontLoaded(true);
          }, 100);
        }
      } else {
        // Server-side fallback
        setFontLoaded(true);
      }
    };
    checkFont();
  }, []);

  // Sync showMusicControls with playing state
  useEffect(() => {
    if (contextIsPlaying && !showMusicControls) {
      setShowMusicControls(true);
    }
  }, [contextIsPlaying, showMusicControls]);

  // Handle model loading completion
  const handleSceneLoad = () => {
    console.log('CyborgTempleScene loaded');
    setModelLoaded(true);
  };

  // Comprehensive loading coordination
  useEffect(() => {
    // Only hide loading when everything is ready
    if (fontLoaded && mounted && modelLoaded) {
      // Add extra delay to ensure TickerDisplay3 and other components are rendered
      const timer = setTimeout(() => {
        setSceneReady(true);
        setTimeout(() => {
          setIsSceneLoading(false);
        }, 500); // Brief additional delay for smooth transition
      }, 1000); // Wait for all components to initialize
      
      return () => clearTimeout(timer);
    }
  }, [fontLoaded, mounted, modelLoaded]);

  // Fallback timeout to prevent infinite loading
  useEffect(() => {
    const fallbackTimer = setTimeout(() => {
      if (isSceneLoading) {
        console.log('Fallback timeout reached, forcing scene ready');
        setSceneReady(true);
        setIsSceneLoading(false);
      }
    }, 8000); // 8 second max loading time

    return () => clearTimeout(fallbackTimer);
  }, [isSceneLoading]);

  // Don't render on server-side
  if (!mounted) {
    return <CoinLoader loading={true} />;
  }

  return (
    <>
      {/* Loading Screen */}
      <CoinLoader loading={isSceneLoading} />
          
      <div style={{ 
        width: '100vw', 
        height: '100vh', 
        margin: 0, 
        padding: 0, 
        overflow: 'hidden',
        position: 'fixed',
        top: 0,
        left: 0,
        backgroundColor: '#000',
        opacity: sceneReady ? 1 : 0,
        transition: 'opacity 0.8s ease-in-out',
        visibility: sceneReady ? 'visible' : 'hidden'
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
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        .spinning-record {
          animation: spin 3s linear infinite;
        }
      `}</style>
      
      <div style={{
        width: "100%",
        height: "100vh",
        background: "#000",
        position: "relative",
        overflow: "hidden"
      }}>
        {/* RL80 Title */}
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
                    color: `rgba(${255 - index * 2}, ${255 - index * 3}, ${255 - index * 2})`,
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
     {/* <MemoryMonitor show={true} /> */}
        <TradingOverlay 
          show={showTrading} 
          data={tradingData} 
          isConnected={isConnected}
          tradingMode={tradingMode}
          onModeChange={changeTradingMode}
        />
        {/* Main Canvas */}
        <Canvas
          key="temple-canvas"
          camera={{ position: [0, 0, 7.5], fov: 50 }}
          gl={{ 
            antialias: !isMobileView,
            alpha: true,
            powerPreference: isMobileView ? "low-power" : "high-performance",
            precision: isMobileView ? "mediump" : "highp",
            stencil: false,
            depth: true
          }}
          dpr={isMobileView ? 
            (typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 1.5) : 1) : 
            (typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1)
          }
          performance={{ min: 0.5 }}
          style={{ 
            background: 'transparent', 
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 2
          }}
        >
          <fog attach="fog" args={['#000000', 20, 200]} />
          <Suspense fallback={null}>
            <ambientLight intensity={0.3} />
            <PostProcessingEffects />
            {/* Starry background */}
            <StarField 
              radius={150} 
              count1={isMobileView ? 200 : 500} 
              count2={isMobileView ? 150 : 300} 
              is80sMode={false} 
            />
            
            {/* MaryTraderScene with grid */}
            <CyborgTempleScene
              position={[0, -2, 0]}
              scale={[1, 1, 1]}
              rotation={[0, 0, 0]}
              isPlaying={contextIsPlaying}
              onLoad={handleSceneLoad}
            />

            <TickerDisplay3 />

            
            {/* Constellation */}
            <ConstellationModel  
              groupScale={[10, 10, 10]} 
              groupPosition={[0, 15, -80]} 
              isVisible={true} 
            />

            <VideoScreens />
            
            <OrbitControls 
              makeDefault
              enablePan={true}
              enableZoom={true}
              zoomSpeed={0.2}
              enableDamping={true}
              dampingFactor={0.1}
              minDistance={1}
              maxDistance={20}
              minPolarAngle={0}
              maxPolarAngle={Math.PI / 1.9}
              zoomToCursor={true}
              autoRotate={true}
              autoRotateSpeed={0.2}
              target={[0, 0, 0]}
            />
          </Suspense>
        </Canvas>

        {/* Top Controls Container - Music, User, and Nav */}
        {mounted && (
          <div
            style={{
              position: "fixed",
              top: "1rem",
              right: "1rem",
              display: "flex",
              flexDirection: isMobileView ? "column" : "row",
              gap: "1rem",
              zIndex: 1000,
            }}
          >
            {/* Music Controls */}
            <div style={{ order: isMobileView ? 2 : 0 }}>
              {!showMusicControls ? (
                <button
                  onClick={() => {
                    setShowMusicControls(true);
                    if (!contextIsPlaying) {
                      play();
                    }
                  }}
                  style={{
                    width: isMobileView ? "2.5rem" : "3.75rem",
                    height: isMobileView ? "2.5rem" : "3.75rem",
                    borderRadius: "0.5rem",
                    backgroundColor: is80sMode ? "rgba(217, 70, 239, 0.2)" : "rgba(0, 0, 0, 0.7)",
                    border: is80sMode ? "1px solid #D946EF" : "1px solid rgba(255, 255, 255, 0.2)",
                    color: is80sMode ? "#67e8f9" : "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    backdropFilter: "blur(10px)",
                    boxShadow: "0 0.125rem 0.5rem rgba(0, 0, 0, 0.3)",
                  }}
                  title="Toggle Music"
                >
                  <svg
                    width={isMobileView ? "20" : "30"}
                    height={isMobileView ? "20" : "30"}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9 18V5l12-2v13"/>
                    <circle cx="6" cy="18" r="3"/>
                    <circle cx="18" cy="16" r="3"/>
                  </svg>
                </button>
              ) : (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <div
                    className={contextIsPlaying ? "spinning-record" : ""}
                    style={{
                      width: isMobileView ? "2.5rem" : "3.75rem",
                      height: isMobileView ? "2.5rem" : "3.75rem",
                      borderRadius: "50%",
                      backgroundImage: "url('/virginRecords.jpg')",
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      cursor: "pointer",
                    }}
                    onClick={() => {
                      if (contextIsPlaying) {
                        pause();
                      } else {
                        play();
                      }
                    }}
                    title={contextIsPlaying ? "Pause Music" : "Play Music"}
                  />
                  
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (nextTrack) {
                        nextTrack();
                      }
                    }}
                    style={{
                      width: isMobileView ? "2rem" : "2.5rem",
                      height: isMobileView ? "2rem" : "2.5rem",
                      borderRadius: "0.25rem",
                      backgroundColor: is80sMode ? "rgba(217, 70, 239, 0.2)" : "rgba(0, 0, 0, 0.7)",
                      border: is80sMode ? "1px solid #D946EF" : "1px solid rgba(255, 255, 255, 0.2)",
                      color: is80sMode ? "#67e8f9" : "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                      backdropFilter: "blur(10px)",
                      boxShadow: "0 0.125rem 0.375rem rgba(0, 0, 0, 0.3)",
                    }}
                    title="Next Track"
                  >
                    <svg width={isMobileView ? "12" : "16"} height={isMobileView ? "12" : "16"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="5 4 15 12 5 20 5 4"/>
                      <line x1="19" y1="5" x2="19" y2="19"/>
                    </svg>
                  </button>
                  
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
                      width: isMobileView ? "2rem" : "2.5rem",
                      height: isMobileView ? "2rem" : "2.5rem",
                      borderRadius: "0.25rem",
                      backgroundColor: is80sMode ? "rgba(217, 70, 239, 0.2)" : "rgba(0, 0, 0, 0.7)",
                      border: is80sMode ? "1px solid #D946EF" : "1px solid rgba(255, 255, 255, 0.2)",
                      color: is80sMode ? "#67e8f9" : "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                      backdropFilter: "blur(10px)",
                      boxShadow: "0 0.125rem 0.375rem rgba(0, 0, 0, 0.3)",
                    }}
                    title="Close Music"
                  >
                    <svg width={isMobileView ? "12" : "16"} height={isMobileView ? "12" : "16"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              )}
            </div>

            {/* User Button */}
            <div style={{ order: isMobileView ? 1 : 1 }}>
              {isSignedIn ? (
                <Illumin80ClerkButton afterSignOutUrl="/" isMobileDevice={isMobileView} />
              ) : (
                <SignInButton mode="modal" forceRedirectUrl="/temple">
                  <button
                    style={{
                      width: isMobileView ? "2.5rem" : "3.75rem",
                      height: isMobileView ? "2.5rem" : "3.75rem",
                      borderRadius: "0.5rem",
                      backgroundColor: is80sMode ? "rgba(217, 70, 239, 0.2)" : "rgba(0, 0, 0, 0.7)",
                      border: is80sMode ? "1px solid #D946EF" : "1px solid rgba(255, 255, 255, 0.2)",
                      color: is80sMode ? "#67e8f9" : "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                      backdropFilter: "blur(10px)",
                      boxShadow: "0 0.125rem 0.5rem rgba(0, 0, 0, 0.3)",
                    }}
                    title="Sign In"
                  >
                    <span style={{ fontSize: "2.2rem" }}>{emoji}</span>
                  </button>
                </SignInButton>
              )}
            </div>

            {/* CyberNav Menu */}
            <div style={{ order: isMobileView ? 0 : 2 }}>
              <CyberNav is80sMode={is80sMode} position="relative" />
            </div>

            {/* Social Bar */}
            <div style={{ order: isMobileView ? 4 : 3 }}>
              <SocialBar is80sMode={is80sMode} />
            </div>
          </div>
        )}

        {/* Snapshot Button */}
        <button
          onClick={() => setTriggerSnapshot(true)}
          style={{
            position: "fixed",
            bottom: "2rem",
            right: "2rem",
            width: "60px",
            height: "60px",
            borderRadius: "50%",
            backgroundColor: "rgba(255, 255, 255, 0.1)",
            backdropFilter: "blur(10px)",
            border: "2px solid rgba(255, 255, 255, 0.3)",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "all 0.3s ease",
            boxShadow: "0 4px 15px rgba(0, 0, 0, 0.3)",
            zIndex: 999,
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = "rgba(255, 255, 255, 0.2)";
            e.target.style.transform = "scale(1.1)";
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
            e.target.style.transform = "scale(1)";
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
          captureElementId="temple-canvas"
          label="Temple Captured!"
        />
      </div>
    </div>
    </>
  );
}