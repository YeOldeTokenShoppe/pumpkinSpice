"use client";

import React, { Suspense, useRef, useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
// import { Box, IconButton, VStack, Spinner, Text } from '@chakra-ui/react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
// import { EffectComposer, Bloom, ChromaticAberration, Vignette } from '@react-three/postprocessing';
// import { FaHome, FaCamera } from 'react-icons/fa';
// import { useRouter } from 'next/router';
// import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';
import Link from 'next/link';
// import CyberNav from '../components/CyberNav';




// Dynamic import for SSR compatibility
const EtherealClouds = dynamic(() => import('@/components/EtherealClouds'), {
  ssr: false,
});

// const FloatingPriceIndicators = dynamic(() => import('../components/EtherealClouds/FloatingPriceIndicators'), {
//   ssr: false,
// });



const EtherealCloudsPage = ({ is80sMode, setIs80sMode }) => {
//   const router = useRouter();
  const canvasRef = useRef();

  const [fontLoaded, setFontLoaded] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
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
      setIsMobileView(window.innerWidth <= 768);
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
  useEffect(() => {
    if (is80sMode && videoRef.current) {
      videoRef.current.play().catch(err => {
        console.log('Video autoplay failed:', err);
      });
    // } else if (!is80sMode && videoRef.current) {
    //   videoRef.current.pause();
    //   videoRef.current.currentTime = 0;
    }
  }, [is80sMode]);

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
<div style={{ position: "relative", width: "100vw", height: "100vh", overflow: "hidden" }}>
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

      {/* <CyberNav variant="space" is80sMode={is80sMode} /> */}
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