"use client";

import React, { Suspense, useRef, useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import Link from 'next/link';
import CyberNav from '@/components/CyberNav';
import { useUser, UserButton, SignInButton } from '@clerk/nextjs';
import { useMusic } from '@/components/MusicContext';




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
      <Canvas
        ref={canvasRef}
        camera={{ position: [4, -5, 60], fov: 60 }}
        gl={{ 
          antialias: true, 
          alpha: false,
          preserveDrawingBuffer: true
        }}
        style={{ background: '#87CEEB' }}
      >
        <Suspense fallback={null}>
          <EtherealClouds />
          {/* <BasicScene /> */}
          {/* <MinimalTest /> */}
          
          {/* Camera controls */}
          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={5}
            maxDistance={100}
            maxPolarAngle={Math.PI * 0.85}
            // autoRotate
            // autoRotateSpeed={0.5}
            target={[0, 15, -20]}

            // zoomToCursor
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
      {/* Loading indicator */}

      
      {/* UI Controls */}
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