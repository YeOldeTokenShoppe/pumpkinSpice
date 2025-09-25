"use client";

import React, { Suspense, useRef, useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import Link from 'next/link';
import CyberNav from '@/components/CyberNav';
import { useUser, SignInButton } from '@clerk/nextjs';
import { Illumin80ClerkButton } from '@/components/Illumin80Display';
import { useMusic } from '@/components/MusicContext';
import InfinityLoader from '@/components/InfinityLoader';
import FearGreedOverlay from '@/components/FearGreedOverlay';




// Dynamic import for SSR compatibility
const EtherealClouds = dynamic(() => import('@/components/EtherealClouds'), {
  ssr: false,
});

// const FloatingPriceIndicators = dynamic(() => import('../components/EtherealClouds/FloatingPriceIndicators'), {
//   ssr: false,
// });



const EtherealCloudsPage = () => {
  const canvasRef = useRef();
  
  // Get user from Clerk
  const { user, isSignedIn } = useUser();
  
  // Get music context
  const { play, pause, isPlaying: contextIsPlaying, nextTrack, is80sMode, setIs80sMode } = useMusic();
  
  const [fontLoaded, setFontLoaded] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [showMusicControls, setShowMusicControls] = useState(contextIsPlaying);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [sceneLoaded, setSceneLoaded] = useState(false);
  const [fearGreedData, setFearGreedData] = useState(null);
  const [isManualMode, setIsManualMode] = useState(false);
  const [manualFearGreedValue, setManualFearGreedValue] = useState(50);
  const [manualVolumeValue, setManualVolumeValue] = useState(null);
  const updateTimeoutRef = useRef(null);
  const [emoji, setEmoji] = useState("😇");
  
  const handleManualControl = useCallback((value) => {
    // Clear any pending updates
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    
    // Throttle updates to prevent infinite loops
    updateTimeoutRef.current = setTimeout(() => {
    if (value === null) {
      // Return to live data
      setIsManualMode(false);
      // Will be updated by the next MarketEmojis update
    } else {
      setIsManualMode(true);
      setManualFearGreedValue(value);
      
      // Calculate devil, angel, and money counts dynamically
      let devils = 0;
      let angels = 0;
      let money = 0;
      
      if (value >= 80) {
        // Extreme Greed: Money emojis appear!
        devils = 0;
        angels = 0;
        money = Math.floor(4 + (value - 80) / 20 * 3); // 4-7 money emojis
      } else if (value > 75) {
        // High Greed: Mix of angels warning
        devils = 0;
        angels = Math.floor(5 + (value - 75) / 5 * 2);
        money = 0;
      } else if (value > 55) {
        // Greed: Angels warning
        devils = 0;
        angels = Math.floor(3 + (value - 55) / 20 * 2);
        money = 0;
      } else if (value > 45) {
        // Neutral: Balanced
        devils = Math.floor(1 + (55 - value) / 10);
        angels = Math.floor(1 + (value - 45) / 10);
        money = 0;
      } else if (value > 25) {
        // Fear: Devils tempting
        devils = Math.floor(3 + (45 - value) / 20 * 2);
        angels = 0;
        money = 0;
      } else {
        // Extreme Fear: Maximum devils
        devils = Math.floor(5 + (25 - value) / 25 * 3);
        angels = 0;
        money = 0;
      }
      
      // Create manual fear/greed data
      const manualData = {
        value: value,
        classification: value < 25 ? 'Extreme Fear' : 
                        value < 45 ? 'Fear' : 
                        value < 55 ? 'Neutral' : 
                        value < 75 ? 'Greed' : 'Extreme Greed',
        devilCount: devils,
        angelCount: angels,
        moneyCount: money,
        simulated: false,
        manual: true
      };
      // console.log('CloudsPage: Setting manual data:', manualData);
      setFearGreedData(manualData);
    }
    }, 50); // 50ms throttle to prevent rapid updates
  }, []);
  
  const handleVolumeControl = useCallback((value) => {
    if (value === null) {
      // Return to live volume
      setManualVolumeValue(null);
      // Don't modify fearGreedData here - let onDataUpdate handle it
    } else {
      // Set manual volume
      setManualVolumeValue(value);
      // The onDataUpdate callback will handle applying the manual volume
    }
  }, []);
  
  const handleScreenshot = useCallback(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'ethereal-clouds.png';
        a.click();
        URL.revokeObjectURL(url);
      });
    }
  }, []);
  // Alternate emoji for sign-in button
  useEffect(() => {
    const emojiInterval = setInterval(() => {
      setEmoji((prevEmoji) => (prevEmoji === "😇" ? "😈" : "😇"));
    }, 3000);

    return () => clearInterval(emojiInterval);
  }, []);
  
  useEffect(() => {
    const checkMobile = () => {
      const isMobile = window.innerWidth <= 768;
      setIsMobileView(isMobile);
      setIsMobileDevice(isMobile);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    // Suppress Chrome extension errors
    const originalError = console.error;
    console.error = (...args) => {
      if (args[0]?.includes?.('message channel closed')) {
        return; // Suppress extension errors
      }
      originalError.apply(console, args);
    };
    
    return () => {
      window.removeEventListener('resize', checkMobile);
      console.error = originalError;
      // Clean up timeout on unmount
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);
  // Sync showMusicControls with playing state
  useEffect(() => {
    if (contextIsPlaying && !showMusicControls) {
      setShowMusicControls(true);
    }
  }, [contextIsPlaying]);
  
  // Handle music toggle
  const handleMusicToggle = useCallback((show) => {
    setShowMusicControls(show);
    if (show && !contextIsPlaying) {
      play();
    }
  }, [contextIsPlaying, play]);
  
  // Toggle 80s mode
  const toggle80sMode = useCallback(() => {
    const newMode = !is80sMode;
    setIs80sMode(newMode);
  }, [is80sMode, setIs80sMode]);

  useEffect(() => {
    // Check if font is loaded
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
  
  // Hide loader only when everything is loaded
  useEffect(() => {
    if (fontLoaded && sceneLoaded) {
      // Add a small delay for smooth transition
      setTimeout(() => setIsPageLoading(false), 500);
    }
  }, [fontLoaded, sceneLoaded]);

  return (
<div style={{ 
      position: "relative", 
      width: "100vw", 
      height: "100vh", 
      overflow: "hidden",
      margin: 0,
      padding: 0,
      border: "none",
      boxSizing: "border-box"
    }}>
      {/* Show loader over entire page when loading */}
      {isPageLoading && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0,
          zIndex: 99999,
          background: '#000000'
        }}>
          <InfinityLoader />
        </div>
      )}
      
      {/* Main content wrapper - hidden while loading */}
      <div style={{
        width: '100%',
        height: '100%',
        opacity: isPageLoading ? 0 : 1,
        transition: 'opacity 0.5s ease-in-out',
        position: 'relative'
      }}>
      {/* Add inline keyframes for font */}
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
        
        /* Remove all margins, padding and borders for clouds page */
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          border: 0 !important;
          overflow: hidden !important;
          width: 100% !important;
          height: 100% !important;
        }
        
        body > div {
          margin: 0 !important;
          padding: 0 !important;
          border: 0 !important;
        }
        
        #__next {
          margin: 0 !important;
          padding: 0 !important;
          border: 0 !important;
        }
      `}</style>

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
            <Link href="/home" style={{ textDecoration: 'none', color: 'inherit', display: 'inline-block' }}>
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
      <Canvas
        // ref={canvasRef}
        camera={{ 
          // position: isMobileDevice ? [0, 20, 65] : [0, 20, 60], 
          // fov: isMobileDevice ? 60 : 60, 
          near: 0.1, 
          far: 1000 
        }}
        // onCreated={({ camera }) => {
        //   camera.lookAt(0, 5, -15);
        // }}
        gl={{ 
          antialias: true, 
          alpha: false,
          preserveDrawingBuffer: true
        }}
        style={{ background: '#87CEEB' }}
        onCreated={() => setSceneLoaded(true)}
      >
        <Suspense fallback={null}>
          <EtherealClouds 
            onDataUpdate={useCallback((data) => {
              // Apply manual volume if set, otherwise use live data
              if (manualVolumeValue !== null) {
                setFearGreedData({
                  ...data,
                  marketVolume: {
                    raw: manualVolumeValue * 1000000000,
                    billions: manualVolumeValue,
                    formatted: `$${manualVolumeValue}B`,
                    manual: true
                  }
                });
              } else {
                // Use live volume data from MarketEmojis
                setFearGreedData(data);
              }
            }, [manualVolumeValue])}
            manualFearGreedData={isManualMode ? fearGreedData : null}
            manualVolumeData={manualVolumeValue ? {
              raw: manualVolumeValue * 1000000000,
              billions: manualVolumeValue,
              formatted: `$${manualVolumeValue}B`,
              manual: true
            } : null}
            is80sMode={is80sMode}
          />
          {/* <BasicScene /> */}
          {/* <MinimalTest /> */}
          
          {/* Camera controls - rotate around center */}
          <OrbitControls
            enableRotate={true}
            enableDamping={true}
            enablePan={false}
            enableZoom={true}
            minDistance={50}
            maxDistance={100}
            target={[0, 0, 0]}
            // minAzimuthAngle={-Math.PI / 12}  // -60 degrees
            // maxAzimuthAngle={Math.PI / 12}   // +60 degrees
            // minPolarAngle={0}     // 45 degrees from top
            // maxPolarAngle={Math.PI / 2.2}   // ~82 degrees, prevents going too low
          />
          
          {/* Post-processing effects */}
          {/* <EffectComposer>
            <Bloom
              intensity={0.5}
              luminanceThreshold={0.6}
              luminanceSmoothing={0.9}
              blendFunction={BlendFunction.ADD}
            />
            <ChromaticAberration
              offset={[0.0005, 0.0005]}
              blendFunction={BlendFunction.NORMAL}
            />
            <Vignette
              offset={0.3}
              darkness={0.4}
              blendFunction={BlendFunction.NORMAL}
            />
          </EffectComposer> */}
        </Suspense>
      </Canvas>

      {/* Fear & Greed Overlay */}
      <FearGreedOverlay 
        fearGreedData={fearGreedData}
        showDevils={fearGreedData?.devilCount}
        showAngels={fearGreedData?.angelCount}
        showMoney={fearGreedData?.moneyCount}
        onManualControl={handleManualControl}
        isManualMode={isManualMode}
        onVolumeControl={handleVolumeControl}
      />

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
        zIndex: 10000
      }}>
        {/* User Account Icon */}
        <div style={{ order: isMobileDevice ? 3 : 0 }}>
          {isSignedIn ? (
            <Illumin80ClerkButton afterSignOutUrl="/" />
          ) : (
            <SignInButton mode="modal" forceRedirectUrl="/clouds">
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
                <span style={{ fontSize: "1.5rem" }}>{emoji}</span>
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
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18V5l12-2v13" />
                <circle cx="6" cy="18" r="3" />
                <circle cx="18" cy="16" r="3" />
              </svg>
            </button>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
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
                }}
                title="Next Track"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="5 4 15 12 5 20 5 4"/>
                  <line x1="19" y1="5" x2="19" y2="19"/>
                </svg>
              </button>
              
              <button
                onClick={() => {
                  handleMusicToggle(false);
                  if (pause) pause();
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
                }}
                title="Close Music"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
      </div>
      {/* End of main content wrapper */}
      {/* <VStack
        position="absolute"
        top={4}
        left={4}
        spacing={2}
      >
        <IconButton
          icon={<FaHome />}
          aria-label="Go home"
          onClick={() => router.push('/')}
          size="lg"
          colorScheme="purple"
          variant="solid"
          opacity={0.8}
          _hover={{ opacity: 1 }}
        />
        
        <IconButton
          icon={<FaCamera />}
          aria-label="Take screenshot"
          onClick={handleScreenshot}
          size="lg"
          colorScheme="pink"
          variant="solid"
          opacity={0.8}
          _hover={{ opacity: 1 }}
        />
      </VStack> */}
      
      {/* Info text */}
      {/* <Box
        position="absolute"
        bottom={4}
        left={4}
        bg="rgba(0, 0, 0, 0.5)"
        p={3}
        borderRadius="md"
        backdropFilter="blur(10px)"
      >
        <Text color="white" fontSize="sm">
          Drag to rotate • Scroll to zoom • Hold shift to pan
        </Text>
      </Box> */}
    </div>
  );
};

export default EtherealCloudsPage;