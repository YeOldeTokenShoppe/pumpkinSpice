"use client";

import React, { useEffect, useState, useRef, Suspense } from "react";
import styled, { keyframes, createGlobalStyle } from "styled-components";
import Coin from "./Coin";
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment } from '@react-three/drei';
import { EffectComposer, DepthOfField, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

// Global styles for CSS custom properties
const GlobalStyles = createGlobalStyle`
  @property --r {
    syntax: "<percentage>";
    initial-value: 0%;
    inherits: false;
  }
  @property --g {
    syntax: "<percentage>";
    initial-value: 0%;
    inherits: false;
  }
`;

// Define the keyframes animations for r and g
const rAnimation = keyframes`
  to { --r: 100% }
`;

const gAnimation = keyframes`
  to { --g: 100% }
`;

// Levitation animation for the magic 8-ball and candle styles - using CSS instead of styled-components
const levitateStyle = `
  @keyframes levitate {
    0%, 100% {
      transform: translateY(0) rotateZ(0deg);
    }
    25% {
      transform: translateY(-15px) rotateZ(1deg);
    }
    75% {
      transform: translateY(5px) rotateZ(-1deg);
    }
  }

  .magic-ball-glow::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle, rgba(49, 226, 43, 0.8) 0%, rgba(0, 130, 80, 0.5) 40%, transparent 65%);
    border-radius: 50%;
    z-index: -1;
    transform: scale(0.8);
  }

  /* Candle styles */
  .candle-holder {
    position: absolute;
    width: clamp(150px, 15vw, 200px);
    height: clamp(300px, 30vh, 400px);
    z-index: 3;
  }

  .candle-holder *, .candle-holder *:before, .candle-holder *:after {
    position: absolute;
    content: "";
  }

  .candle {
    bottom: 0;
    width: 100%;
    height: 75%;
    border-radius: 50% / 15%;
    box-shadow: inset 20px -30px 50px 0 rgba(0, 0, 0, 0.4), inset -20px 0 50px 0 rgba(0, 0, 0, 0.4);
    background: #021902;
    background: linear-gradient(#25e425, #0ee70e, #038303, #034c1a 50%, #001c00);
  }

  .candle:before {
    width: 100%;
    height: 40px;
    border-radius: 50%;
    border: 2px solid #01d401;
    background: #09b809;
    background: radial-gradient(#21ea21, #018e01 45%, #09b809 80%);
  }

  .candle:after {
    width: 34px;
    height: 10px;
    left: 50%;
    transform: translateX(-50%);
    border-radius: 50%;
    top: 14px;
    box-shadow: 0 0 20px 0 rgba(0, 0, 0, 0.5);
    background: radial-gradient(rgba(0, 0, 0, 0.6), transparent 45%);
  }

  .thread {  
    width: 6px;
    height: 36px;
    top: -17px;
    left: 50%;
    z-index: 1;
    border-radius: 40% 40% 0 0;
    transform: translateX(-50%);
    background: #121212;
    background: linear-gradient(#d6994a, #4b232c, #121212, black, #e8bb31 90%);
  }

  .flame {
    width: 24px;
    height: 120px;
    left: 50%;
    transform-origin: 50% 100%;
    transform: translateX(-50%);
    bottom: 100%;
    border-radius: 50% 50% 20% 20%;
    background: rgba(255, 255, 255, 1);
    background: linear-gradient(white 80%, transparent);
    animation: moveFlame 6s linear infinite, enlargeFlame 5s linear infinite;
  }

  .flame:before {
    width: 100%;
    height: 100%;
    border-radius: 50% 50% 20% 20%;
    box-shadow: 0 0 15px 0 rgba(247, 93, 0, .4), 0 -6px 4px 0 rgba(247, 128, 0, .7);
  }

  @keyframes moveFlame {
    0%, 100% {
      transform: translateX(-50%) rotate(-2deg);
    }
    50% {
      transform: translateX(-50%) rotate(2deg);
    }
  }

  @keyframes enlargeFlame {
    0%, 100% {
      height: 120px;
    }
    50% {
      height: 140px;
    }
  }

  .glow {
    width: 26px;
    height: 60px;
    border-radius: 50% 50% 35% 35%;
    left: 50%;
    top: -48px;
    transform: translateX(-50%);
    background: rgba(0, 133, 255, .7);
    box-shadow: 0 -40px 30px 0 #dc8a0c, 0 40px 50px 0 #dc8a0c, inset 3px 0 2px 0 rgba(0, 133, 255, .6), inset -3px 0 2px 0 rgba(0, 133, 255, .6);
  }

  .glow:before {
    width: 70%;
    height: 60%;
    left: 50%;
    transform: translateX(-50%);
    bottom: 0;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.35);
  }

  .blinking-glow {
    width: 100px;
    height: 180px;
    left: 50%;
    top: -55%;
    transform: translateX(-50%);
    border-radius: 50%;
    background: #ff6000;
    filter: blur(60px);
    animation: blinkIt .1s infinite;
  }

  @keyframes blinkIt {
    50% { opacity: .8;}
  }
`;

const FluidBackground = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #000; /* Add black background as fallback */
  border-radius: 0.5em; /* Match the parent border radius minus border width */
  
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: #000;
    z-index: 0;
  }

  &::after {
    --l: rgb(var(--r) var(--g) 0%),
      rgb(calc(100% - var(--r)) calc(100% - var(--g)) 0%);
    content: "";
    position: absolute;
    top: 50%;
    left: 50%;
    width: 200%;
    height: 200%;
    transform: translate(-50%, -50%);
    background: radial-gradient(var(--l)), linear-gradient(var(--l)),
      conic-gradient(at 0 100%, var(--l) 25%);
    background-blend-mode: difference;
    animation: ${rAnimation} 4.7s ease-in-out -1.93s infinite alternate,
      ${gAnimation} 4.3s ease-in-out -2.37s infinite alternate;
    filter: url(#smoke) invert(1) saturate(2);
    z-index: 1;
    transform-origin: center center;
    will-change: background; /* Only animate the background colors, not position */
  }
`;



// 3D Model Component
function Model({ url, scale = 1, position = [0, 0, 0], rotation = [0, 0, 0] }) {
  const { scene } = useGLTF(url);
  const meshRef = useRef();
  
  
  return (
    <primitive 
      ref={meshRef}
      object={scene} 
      scale={scale}
      position={position}
      rotation={rotation}
    />
  );
}

const Numerology1 = ({ isMobile = false }) => {
  const [clientSideReady, setClientSideReady] = useState(false);
  const [internalIsMobile, setInternalIsMobile] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const isBrowser = typeof window !== "undefined";
  
  // Use prop if provided, otherwise detect internally
  const effectiveIsMobile = isMobile || internalIsMobile;




  // Matrix rain effect using Canvas
  useEffect(() => {
    setClientSideReady(true);
    
    const checkMobile = () => {
      if (typeof window !== "undefined") {
        setInternalIsMobile(window.innerWidth <= 768);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    // Initialize Matrix rain on canvas
    const canvas = canvasRef.current;
    if (canvas && clientSideReady) {
      const ctx = canvas.getContext('2d');
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      
      // Matrix rain configuration
      const fontSize = effectiveIsMobile ? 14 : 20;
      const columnWidth = fontSize;
      const lineHeight = fontSize * 0.8; // Tighter vertical spacing
      const columns = Math.floor(canvas.width / columnWidth);
      const drops = Array(columns).fill(0);
      const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ';
      
      // Track the stream of characters for each column
      const streams = Array(columns).fill(null).map(() => []);
      const streamLength = 25; // Length of each character stream
      
      function draw() {
        // Clear canvas completely for transparent background
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Green text with glow
        ctx.shadowColor = '#0f0';
        ctx.shadowBlur = 5;
        ctx.font = `${fontSize}px monospace`;
        
        // Draw characters
        for (let i = 0; i < columns; i++) {
          // Add new character to stream at regular intervals
          if (streams[i].length === 0 && Math.random() > 0.98) {
            // Start a new stream
            drops[i] = -streamLength * lineHeight;
          }
          
          // Add characters to active stream
          if (drops[i] !== null && streams[i].length < streamLength) {
            const newChar = chars[Math.floor(Math.random() * chars.length)];
            streams[i].push({
              char: newChar,
              y: drops[i] + (streams[i].length * lineHeight)
            });
          }
          
          // Draw and update stream
          for (let j = 0; j < streams[i].length; j++) {
            const item = streams[i][j];
            
            // Calculate opacity based on position in stream
            const streamPosition = j / streams[i].length;
            const leadChar = j === streams[i].length - 1;
            const streamOpacity = leadChar ? 1 : streamPosition * 0.7;
            const fadeOpacity = Math.max(0, 1 - Math.max(0, item.y / canvas.height));
            const opacity = streamOpacity * fadeOpacity;
            
            // Brighter color for lead character
            if (leadChar) {
              ctx.fillStyle = `rgba(150, 255, 150, ${opacity})`;
            } else {
              ctx.fillStyle = `rgba(0, 255, 0, ${opacity})`;
            }
            
            ctx.fillText(item.char, i * columnWidth, item.y);
            
            // Move character down
            item.y += lineHeight * 0.5; // Slower movement
          }
          
          // Remove characters that have gone off screen
          streams[i] = streams[i].filter(item => item.y < canvas.height + lineHeight * 2);
          
          // Update drop position
          if (drops[i] !== null) {
            drops[i] += lineHeight * 0.5;
          }
        }
      }
      
      // Start animation with fixed frame rate
      const animate = () => {
        draw();
        animationRef.current = setTimeout(() => {
          animationRef.current = requestAnimationFrame(animate);
        }, 50); // Fixed 20fps for consistent speed
      };
      
      animate();
    }
    
    return () => {
      window.removeEventListener('resize', checkMobile);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        clearTimeout(animationRef.current);
      }
    };
  }, [clientSideReady, effectiveIsMobile]);

  return (
    <>
      <GlobalStyles />
      <style>{levitateStyle}</style>
      {/* The fluid background and magic 80 ball combination */}
      <svg width="0" height="0" aria-hidden="true" style={{ position: 'fixed' }}>
                      <filter id="smoke" colorInterpolationFilters="sRGB">
                        <feTurbulence baseFrequency="0.00713" result="t" />
                        <feComponentTransfer>
                          <feFuncA type="discrete" tableValues="1" />
                        </feComponentTransfer>
                        <feGaussianBlur stdDeviation="5" result="i" />
                        <feBlend in="SourceGraphic" in2="t" mode="exclusion" />
                        <feDisplacementMap
                          in="i"
                          scale="180"
                          xChannelSelector="R"
                          yChannelSelector="G"
                        />
                      </filter>
      </svg>
      <div
                      style={{
                        position: "relative",
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'flex-end',
                        // margin: '0 auto',
                        width: '100%',
                        maxWidth: '600px',
                        height: effectiveIsMobile ? '60vh' : '70vh',
                        minHeight: effectiveIsMobile ? '400px' : '500px',
                        borderRadius: '1em',
                        transform: 'scale(1)',
                        transformOrigin: 'center center',
                      }}
                    >
                      
                      {/* Matrix rain background effect using Canvas */}
                      {/* <canvas 
                        ref={canvasRef}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          zIndex: 0,
                          opacity: 0.65,
                          pointerEvents: 'none',
                        }}
                      /> */}
                      
                      {/* Fluid background as the base layer */}
                      {/* <FluidBackground /> */}

                      {/* Coin on the left */}
                      {/* <div style={{
                        position: 'absolute',
                        left: effectiveIsMobile ? '40px' : '100px',
                        top: '70%',
                        transform: 'translateY(-50%) scale(0.75)',
                        transformOrigin: 'center center',
                        width: '100px',
                        height: '100px',
                        zIndex: 4,
                      }}>
                        <Coin />
                      </div> */}

                      {/* Candle on the left */}
                      {/* <div 
                        className="candle-holder"
                        style={{
                          left: effectiveIsMobile ? '-20px' : '-80px',
                          bottom: '0',
                          transform: effectiveIsMobile ? 'scale(0.6)' : 'scale(0.8)',
                          transformOrigin: 'bottom center',
                        }}
                      >
                        <div className="candle">
                          <div className="blinking-glow"></div>
                          <div className="thread"></div>
                          <div className="glow"></div>
                          <div className="flame"></div>
                        </div>
                      </div> */}

                      {/* Holy Grail 3D Model */}
                      <div
                        style={{
                          position: "relative",
                          width: effectiveIsMobile ? "100%" : "100%",
                          maxWidth: effectiveIsMobile ? "380px" : "750px",
                          height: effectiveIsMobile ? "100%" : "100%",
                          // maxHeight: effectiveIsMobile ? "550px" : "450px",
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          zIndex: "2",
                          marginBottom: effectiveIsMobile ? '20px' : '40px',
                        }}
                      >
                        {clientSideReady && (
                          <Canvas
                            camera={{ position: [0, 1.5, 6], fov: effectiveIsMobile ? 60 : 50 }}
                            style={{
                              width: '100%',
                              height: '100%',
                            }}
                          >
                            <Suspense fallback={null}>
                              <ambientLight intensity={0.5} />
                              <spotLight position={[1, 4, 1]} angle={0.8} penumbra={1} intensity={12}/>
                              <pointLight position={[-1, 0, 2]} color="#ffd700" intensity={1} />
                              <pointLight position={[1, 0, 2]} color="#ffd700" intensity={0.6} /> 
                              <Model 
                                url="/models/holyGrail.glb"
                                scale={effectiveIsMobile ? 0.45 : .45}
                                position={[0, effectiveIsMobile ? -1.8 : -1.5, 0]}
                              />
                              {/* <OrbitControls 
                                enablePan={false}
                                enableZoom={false}
                                enableRotate={false}
                                // autoRotate={false}
                                // autoRotateSpeed={1}
                              /> */}
                              {/* <Environment preset="night" /> */}
                            </Suspense>
                            <EffectComposer>
                              <DepthOfField
                                focusDistance={0.01}
                                focalLength={0.025}
                                bokehScale={3}
                                height={480}
                              />
                              <Bloom 
                                intensity={0.3}
                                luminanceThreshold={0.4}
                                luminanceSmoothing={0.9}
                              />
                            </EffectComposer>
                          </Canvas>
                        )}
                      </div>

                      {/* Candle on the right */}
                      {/* <div 
                        className="candle-holder"
                        style={{
                          right: effectiveIsMobile ? '5%' : '10%',
                          bottom: effectiveIsMobile ? '10px' : '30px',
                          transform: effectiveIsMobile ? 'scale(0.45)' : 'scale(0.5)',
                          transformOrigin: 'bottom center',
                        }}
                      >
                        <div className="candle">
                          <div className="blinking-glow"></div>
                          <div className="thread"></div>
                          <div className="glow"></div>
                          <div className="flame"></div>
                        </div>
                      </div> */}
                    </div>
                    </>
  ); 
                          }
export default Numerology1;