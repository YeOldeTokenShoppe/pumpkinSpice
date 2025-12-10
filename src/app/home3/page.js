"use client";

import { useFrame, extend, useThree } from "@react-three/fiber";
import CleanCanvas from "../../components/CleanCanvas";
import React, { Suspense, useRef, useMemo, useEffect, useState } from "react";
import { useGLTF, useAnimations, Text, shaderMaterial, OrbitControls, useHelper, Stats, Html } from "@react-three/drei";
import * as THREE from "three";
// import { CSS3DRenderer, CSS3DObject } from "three/examples/jsm/renderers/CSS3DRenderer"; // No longer needed
// import DroneScreenCSS3D from "../../components/DroneScreenCSS3D"; // Replaced with video texture

// import { Leva } from "leva";
import DarkClouds from "../../components/Clouds";
import PostProcessingEffects from "../../components/PostProcessingEffects";
import { useFirestoreResults } from '../../utilities/useFirestoreResults';
import { useMusic } from '../../components/MusicContext';
import { useUser, SignInButton } from "@clerk/nextjs";
import { Illumin80ClerkButton } from "../../components/Illumin80Display";
import CyberNav from '../../components/CyberNav';
// import SocialBar from '../../components/SocialBar';
import EnhancedVolumetricLight from '@/components/EnhancedVolumetricLight';
import DropInTitle from '../../components/DropInTitle';
// import Coin from '../../components/Coin';
// import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
// import RotatingText from '@/components/RotatingText';
import '@/components/RotatingText.css';
// import HandsGLTFScene from "@/components/HandsGLTFScene";
import CompactCandleModal from '@/components/CompactCandleModal';
// import CyberFAQSection from '@/components/CyberFAQSection';
import CoinLoader from '@/components/CoinLoader';
import CyberFloatingBar from '@/components/CyberFloatingBar';
// import TokenomicsSection from '@/components/TokenomicsSection';
// import CyberStatsSection from '@/components/CyberStatsSection';
// import CyberTokenomicsSection from '@/components/CyberTokenomicsSection';
// import CyberButton from '@/components/CyberButton';
// import CyberCTACard from '@/components/CyberCTACard';
// import Illumin80Bouncer from '@/components/Illumin80Bouncer';
// import Numerology1 from '@/components/Numerology1';
// import TubesCursor from '@/components/TubesCursor';
// import CarouselWrapper from '@/components/CarouselWrapper';
import BreathSmoke from "@/components/BreathSmoke";
import SkewedHeading from "@/components/SkewedHeading";
import AngelOfCurrencies from "@/components/AngelOfCurrencies";
// import SlidingNav from "@/components/SlidingNav";
// import CircularCTA from "@/components/CircularCTA";
// import FeatureCarousel from "@/components/FeatureCarousel";
// import { WatchlistSlide, Illumin80Slide, TradingDeskSlide, TokenomicsSlide } from "@/components/FeatureSlides";
import Footer from "@/components/Footer";
import AnnunciationIntro from '@/components/AnnunciationIntro';
// import VideoScreens from "@/components/VideoScreens";
// import NeuralNetworkR3F from '@/components/NeuralNetworkR3F'
// import { CubeWithWorkingCSS3D } from '@/components/CubeWithWorkingCSS3D';




// Animated counter component
// const AnimatedCounter = ({ target, suffix = '', prefix = '', duration = 2 }) => {
//   const [count, setCount] = useState(0);
//   const countRef = useRef(null);
//   const isInView = useInView(countRef, { once: true });
  
  
  
//   useEffect(() => {
//     if (!isInView) return;
    
//     let startTime;
//     let animationId;
    
//     const animate = (timestamp) => {
//       if (!startTime) startTime = timestamp;
//       const progress = (timestamp - startTime) / (duration * 1000);
      
//       if (progress < 1) {
//         setCount(Math.floor(target * progress));
//         animationId = requestAnimationFrame(animate);
//       } else {
//         setCount(target);
//       }
//     };
    
//     animationId = requestAnimationFrame(animate);
    
//     return () => {
//       if (animationId) {
//         cancelAnimationFrame(animationId);
//       }
//     };
//   }, [isInView, target, duration]);

//   return (
//     <span ref={countRef}>
//       {prefix}{count}{suffix}
//     </span>
//   );
// };

// Preload the models
useGLTF.preload('/models/ourlady_rider7.glb');
useGLTF.preload('/models/angel2.glb');
useGLTF.preload('/models/devil2.glb');
// Note: Drone models are conditionally loaded in DroneModel component

// Manual click handler component
const ClickHandler = () => {
  const { camera, scene, gl } = useThree();
  
  useEffect(() => {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    
    const handleClick = (event) => {
      console.log('Manual click handler triggered');
      
      // Calculate mouse position in normalized device coordinates
      const rect = gl.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      console.log('Mouse coords:', mouse.x, mouse.y);
      
      // Update raycaster
      raycaster.setFromCamera(mouse, camera);
      
      // Calculate intersections
      const intersects = raycaster.intersectObjects(scene.children, true);
      console.log('Manual intersections found:', intersects.length);
      
      intersects.forEach((intersect, index) => {
        console.log(`Manual intersection ${index}:`, intersect.object.name, intersect.object.type);
      });
      
      if (intersects.length > 0) {
        // Look for Screen1 specifically in the intersections
        const screen1Intersect = intersects.find(intersect => intersect.object.name === 'Screen1');
        
        if (screen1Intersect && screen1Intersect.object.userData.handleClick) {
          console.log('Manual: Found Screen1 with click handler');
          const uv = screen1Intersect.uv;
          if (uv) {
            // Account for texture rotation (-90 degrees)
            // Original texture rotation transforms coordinates differently
            const screenX = uv.y * 512;
            const screenY = (1 - uv.x) * 512;
            console.log('Manual: Screen clicked at UV:', uv.x, uv.y, '-> Screen coords:', screenX, screenY);
            screen1Intersect.object.userData.handleClick(screenX, screenY);
          } else {
            console.log('Manual: No UV coordinates found for Screen1');
          }
        } else {
          console.log('Manual: No Screen1 found in intersections');
        }
      }
    };
    
    gl.domElement.addEventListener('click', handleClick);
    
    return () => {
      gl.domElement.removeEventListener('click', handleClick);
    };
  }, [camera, scene, gl]);
  
  return null;
};

// Scroll-responsive Model component with Ticker
const Model = React.memo(function Model({ scrollY, isMobile, onLoad }) {
  const { scene } = useGLTF('/models/ourlady_rider7.glb');
  const groupRef = useRef();
  const staticBreathRef = useRef();
  const hasLoadedRef = useRef(false);

  // Call onLoad when model is ready (prevent duplicate calls)
  useEffect(() => {
    if (scene && onLoad && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      // Disable shadows on the model
      scene.traverse((object) => {
        if (object.isMesh) {
          object.castShadow = false;
          object.receiveShadow = false;
        }
      });
      onLoad();
    }
  }, [scene, onLoad]);
  
  // Cleanup on unmount with proper texture disposal
  useEffect(() => {
    const currentScene = scene;
    return () => {
      if (currentScene) {
        currentScene.traverse((object) => {
          if (object.geometry) {
            object.geometry.dispose();
          }
          if (object.material) {
            const disposeMaterial = (material) => {
              // Dispose textures
              if (material.map) material.map.dispose();
              if (material.normalMap) material.normalMap.dispose();
              if (material.roughnessMap) material.roughnessMap.dispose();
              if (material.metalnessMap) material.metalnessMap.dispose();
              if (material.aoMap) material.aoMap.dispose();
              if (material.emissiveMap) material.emissiveMap.dispose();
              material.dispose();
            };
            
            if (Array.isArray(object.material)) {
              object.material.forEach(disposeMaterial);
            } else {
              disposeMaterial(object.material);
            }
          }
        });
      }
    };
  }, [scene]);
  
  // Track when we've reached the bottom (scroll drops from high to low)
  const scrollDroppedRef = useRef(false);
  const prevScrollRef = useRef(0);
  const [hideAtBottom, setHideAtBottom] = React.useState(false);
  
  React.useEffect(() => {
    // Detect any large scroll drop (more than 7000px drop to under 100)
    if (prevScrollRef.current > 7000 && scrollY < 100) {
      // console.log('Scroll drop detected - at bottom:', prevScrollRef.current, '->', scrollY);
      scrollDroppedRef.current = true;
      setHideAtBottom(true);
    } 
    // Only clear when we're clearly scrolling up from a reasonable position
    else if (scrollY > 500 && scrollY < 7000 && !scrollDroppedRef.current) {
      // We're in the middle of the page, safe to show
      setHideAtBottom(false);
    }
    // If we're still seeing high scroll values, we might still be at bottom
    else if (scrollY > 7500) {
      // Keep hidden if we previously detected a drop
      if (scrollDroppedRef.current) {
        setHideAtBottom(true);
      }
    }
    
    // Clear the ref when we're clearly not at bottom
    if (scrollY > 500 && scrollY < 3000) {
      scrollDroppedRef.current = false;
    }
    
    prevScrollRef.current = scrollY;
  }, [scrollY]);
  
  // Hide when scrolled far OR when at bottom (adjusted for longer page)
  const shouldHide = scrollY > 9500 || hideAtBottom;
  
  // Debug logging
  // useEffect(() => {
  //   if (scrollY > 3000 || scrollY <= 20 || hideAtBottom) {
  //     console.log('Scroll:', scrollY, 'shouldHide:', shouldHide, 'hideAtBottom:', hideAtBottom);
  //   }
  // }, [scrollY, shouldHide, hideAtBottom]);
  
  // Animate based on scroll (from Simple3DScene)
  useFrame(() => {
    if (groupRef.current) {
      // Check for bottom condition right in the render loop
      // This catches the scroll drop immediately without waiting for state updates
      const isAtBottomNow = scrollDroppedRef.current || 
                           (prevScrollRef.current > 7000 && scrollY < 100);
      
      // Hide model if scrolled far OR at bottom
      if (shouldHide || isAtBottomNow) {
        groupRef.current.visible = false;
      } else {
        groupRef.current.visible = true;
        const baseY = isMobile ? -15 : -15;
        
        // Check if we're in drone approach phase
        const droneAppearThreshold = 3500; // Appears halfway down the extended page
        const droneApproachDuration = 4000;
        const droneApproachEnd = droneAppearThreshold + droneApproachDuration;
        
        let effectiveScrollY = scrollY;
        
        // During drone approach, lock the model at the appearance position
        if (scrollY >= droneAppearThreshold - 200 && scrollY < droneApproachEnd) {
          // Lock model at the position it was when drone started appearing
          effectiveScrollY = droneAppearThreshold - 200;
        } else if (scrollY >= droneApproachEnd) {
          // After drone approach, subtract the approach duration to continue smoothly
          effectiveScrollY = scrollY - droneApproachDuration;
        }
        
        // Clamp Y position to prevent model from going too high
        const maxY = 50;
        const calculatedY = baseY + effectiveScrollY * 0.035;
        groupRef.current.position.y = Math.min(calculatedY, maxY);
      }
    }
  });
  
  return (
    <group 
      ref={groupRef} 
      position={isMobile ? [2, -8, -10] : [2, 8, -11]}
    >
      <primitive 
        object={scene} 
        scale={isMobile ? [10, 10, 10] : [12, 12, 12]} 
        rotation={isMobile ? [0, -3.3, 0] : [0.1, -3.2, 0]}
      />
      {/* TickerCurve positioned relative to model (from Simple3DScene) */}
      <TickerCurve 
        scrollY={scrollY}
        scale={3}
        position={[0, 2, 8]} // Position relative to model - moved up
      />
      
    </group>
  );
});

// OLD CSS3D Implementation - DISABLED (replaced by DroneScreenCSS3D component)
/*
const CSS3DScreen = ({ droneGroup, screenMesh }) => {
  const { gl, camera, scene } = useThree();
  
  useEffect(() => {
    if (!screenMesh || !droneGroup) return;
    
    // Create CSS3D renderer
    const css3DRenderer = new CSS3DRenderer();
    css3DRenderer.setSize(window.innerWidth, window.innerHeight);
    css3DRenderer.domElement.style.position = 'absolute';
    css3DRenderer.domElement.style.top = '0';
    css3DRenderer.domElement.style.pointerEvents = 'none';
    document.body.appendChild(css3DRenderer.domElement);
    
    // Create iframe
    const iframe = document.createElement('iframe');
    iframe.src = '/test-screen';
    iframe.style.width = '800px';
    iframe.style.height = '540px';
    iframe.style.border = 'none';
    iframe.style.pointerEvents = 'auto';
    
    // Create CSS3D object
    const css3DObject = new CSS3DObject(iframe);
    scene.add(css3DObject);
    
    // Update function
    const updatePosition = () => {
      if (droneGroup && screenMesh) {
        // Force update matrices
        droneGroup.updateMatrixWorld(true);
        screenMesh.updateMatrixWorld(true);
        
        // Get screen world position
        const pos = new THREE.Vector3();
        const quat = new THREE.Quaternion();
        screenMesh.getWorldPosition(pos);
        screenMesh.getWorldQuaternion(quat);
        
        // Apply to CSS3D object
        css3DObject.position.copy(pos);
        css3DObject.quaternion.copy(quat);
        
        // Scale to fit screen (7.9 x 5.4 units)
        const targetWidth = 8; // World units
        const iframeWidth = 800; // Pixels
        const scale = targetWidth / iframeWidth;
        css3DObject.scale.set(scale, scale, scale);
      }
      
      // Render CSS3D
      css3DRenderer.render(scene, camera);
      requestAnimationFrame(updatePosition);
    };
    
    updatePosition();
    
    // Handle resize
    const handleResize = () => {
      css3DRenderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);
    
    return () => {
      scene.remove(css3DObject);
      window.removeEventListener('resize', handleResize);
      if (css3DRenderer.domElement.parentNode) {
        css3DRenderer.domElement.parentNode.removeChild(css3DRenderer.domElement);
      }
    };
  }, [screenMesh, droneGroup, scene, camera]);
  
  return null;
};
*/

// Component to attach HTML to Screen1 mesh
const ScreenContent = ({ screenMesh }) => {
  if (!screenMesh) return null;
  
  return (
    <Html
      // Attach directly to the screen mesh object
      transform
      occlude
      position={[0, 0, 0.1]} // Slightly in front of screen surface
      scale={[2, 2, 1]} // Scale to match screen size
      style={{
        width: '400px',
        height: '270px',
      }}
    >
      <iframe
        src="/test-screen"
        style={{
          width: '400px',
          height: '270px',
          border: '2px solid #00ff41',
          background: '#000',
          borderRadius: '4px',
        }}
        title="Drone Screen"
      />
    </Html>
  );
};

// Global store for screen mesh
let globalScreenMesh = null;
let globalDroneGroup = null;

// Manager component for CSS3D screen - DISABLED
// Using DroneScreenCSS3D component instead
const CSS3DScreenManager = () => {
  // Disabled - using standalone DroneScreenCSS3D instead
  return null;
};

// Drone component with built-in hover animation and scroll-based appearance
const DroneModel = React.memo(function DroneModel({ position = [0, 0, 10], scrollY, isMobile = false }) {
  const modelPath = isMobile ? '/models/drone_mobile.glb' : '/models/drone.glb';
  const { scene, animations } = useGLTF(modelPath);
  const groupRef = useRef();
  const mixerRef = useRef();
  const screenRef = useRef();
  const hasAppearedRef = useRef(false);
  const [screenMesh, setScreenMesh] = useState(null);
  const [screenReady, setScreenReady] = useState(false);
  
  // No longer needed - we'll handle iframe in the texture setup
  // Removed video/iframe creation here
  
  // Set global drone group reference when scene is loaded
  useEffect(() => {
    if (scene) {
      // Set drone group immediately when scene is available
      const timer = setTimeout(() => {
        if (groupRef.current) {
          window.globalDroneGroup = groupRef.current;
          // console.log('DroneModel: Set global drone group:', groupRef.current);
          // Force trigger CSS3D init if it's waiting
          window.dispatchEvent(new CustomEvent('droneReady'));
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [scene]);
  
  // Set up animations and find Screen1 object
  useEffect(() => {
    if (scene) {
      // Find the Screen1 object
      let screenFound = false;
      scene.traverse((object) => {
        // Log all object names to help debug
        // if (object.name) {
        //   console.log('Drone object found:', object.name, object.type);
        // }
        
        if (object.name === 'Screen1' || object.name.includes('Screen')) {
          screenFound = true;
          screenRef.current = object;
          // console.log('✅ Found Screen1 on drone:', object);
          // console.log('Screen1 type:', object.type);
          // console.log('Screen1 parent:', object.parent?.name);
          // console.log('Screen1 position:', object.position);
          // console.log('Screen1 scale:', object.scale);
          
          // Set up interactive navigation/video system for Screen1
          if (object.isMesh) {
            console.log('Setting up interactive screen on Screen1:', object.name);
            
            // CRT Terminal system (instead of video)
            let crtTerminal = null;
            let terminalAnimation = null;
            
            // CRT Terminal messages
            const terminalMessages = [
              { text: "INITIALIZING DRONE SYSTEM...", delay: 0.5 },
              { text: "CONNECTING TO NEURAL NETWORK...", delay: 1.0 },
              { text: "AUTHENTICATION SUCCESSFUL", delay: 0.8 },
              { text: "", delay: 0.5 }, // Empty line
              { text: "WELCOME TO PUMPKIN SPICE", delay: 1.2 },
              { text: "DIGITAL SANCTUARY", delay: 1.0 },
              { text: "", delay: 0.5 },
              { text: "PREPARING NAVIGATION MATRIX...", delay: 1.0 },
              { text: "SYSTEM READY", delay: 1.5 }
            ];
            
            let currentMessageIndex = 0;
            let currentText = '';
            let isTyping = false;
            
            // Create canvas for custom UI
            const canvas = document.createElement('canvas');
            canvas.width = 512;
            canvas.height = 512;
            const ctx = canvas.getContext('2d');
            
            // Create texture from canvas
            const texture = new THREE.CanvasTexture(canvas);
            texture.minFilter = THREE.LinearFilter;
            texture.magFilter = THREE.LinearFilter;
            // Rotate texture 90 degrees counter-clockwise
            texture.center.set(0.5, 0.5);
            texture.rotation = -Math.PI / 2;
            
            // Screen states
            let screenMode = 'navigation'; // 'navigation', 'crt-terminal', 'post-video'
            let clickAreas = [];
            
            // CRT Terminal drawing function
            const drawCRTTerminal = () => {
              // Clear canvas with black background
              ctx.fillStyle = '#000000';
              ctx.fillRect(0, 0, 512, 512);
              
              // Draw CRT border effect
              ctx.strokeStyle = '#333333';
              ctx.lineWidth = 4;
              ctx.strokeRect(10, 10, 492, 492);
              
              // CRT glow effect
              const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 300);
              gradient.addColorStop(0, 'rgba(0, 255, 65, 0.1)');
              gradient.addColorStop(1, 'rgba(0, 255, 65, 0)');
              ctx.fillStyle = gradient;
              ctx.fillRect(0, 0, 512, 512);
              
              // Set up text styling
              ctx.font = '16px Courier New, monospace';
              ctx.fillStyle = '#00ff41';
              ctx.textBaseline = 'top';
              ctx.shadowColor = '#00ff41';
              ctx.shadowBlur = 5;
              
              // Header text - centered and properly positioned
              let y = 60;
              const centerX = 256; // Center of 512px canvas
              
              // Center the header text
              ctx.textAlign = 'center';
              ctx.fillText('DRONE_TERMINAL_v2.1', centerX, y);
              y += 25;
              ctx.fillText('> SYSTEM_BOOT_SEQUENCE', centerX, y);
              y += 25;
              ctx.fillText('> _________________', centerX, y);
              y += 50;
              
              // Switch to left align for message content
              ctx.textAlign = 'left';
              const leftMargin = 40;
              
              // Current message text
              if (currentText) {
                const lines = currentText.split('\n');
                lines.forEach(line => {
                  ctx.fillText('> ' + line, leftMargin, y);
                  y += 25;
                });
              }
              
              // Blinking cursor
              if (isTyping || Math.floor(Date.now() / 500) % 2 === 0) {
                const cursorX = leftMargin + (currentText.length > 0 ? ctx.measureText('> ' + currentText.split('\n').pop()).width : 20);
                ctx.fillText('█', cursorX, y - 25);
              }
              
              // Scanlines effect
              for (let i = 0; i < 512; i += 4) {
                ctx.fillStyle = 'rgba(0, 255, 65, 0.02)';
                ctx.fillRect(0, i, 512, 2);
              }
              
              texture.needsUpdate = true;
            };
            
            // CRT Terminal typing animation
            const startCRTTerminal = () => {
              currentMessageIndex = 0;
              currentText = '';
              isTyping = false;
              
              const typeNextMessage = () => {
                if (currentMessageIndex >= terminalMessages.length) {
                  // Animation complete
                  setTimeout(() => {
                    console.log('CRT Terminal complete, showing navigation');
                    screenMode = 'post-video';
                    drawPostVideoScreen();
                  }, 2000);
                  return;
                }
                
                const message = terminalMessages[currentMessageIndex];
                
                // Add delay before typing
                setTimeout(() => {
                  if (message.text === '') {
                    // Empty line
                    currentText += '\n';
                    currentMessageIndex++;
                    typeNextMessage();
                    return;
                  }
                  
                  // Type character by character
                  isTyping = true;
                  let charIndex = 0;
                  const typeChar = () => {
                    if (charIndex < message.text.length) {
                      currentText += message.text[charIndex];
                      charIndex++;
                      drawCRTTerminal();
                      
                      // Variable typing speed for realism
                      setTimeout(typeChar, 50 + Math.random() * 100);
                    } else {
                      // Message complete
                      isTyping = false;
                      currentText += '\n';
                      currentMessageIndex++;
                      drawCRTTerminal();
                      
                      // Move to next message
                      setTimeout(typeNextMessage, 800);
                    }
                  };
                  typeChar();
                }, (message.delay || 0.5) * 1000);
              };
              
              typeNextMessage();
            };
            
            // Draw initial navigation screen
            const drawNavigationScreen = () => {
              ctx.fillStyle = '#0a0a0a';
              ctx.fillRect(0, 0, 512, 512);
              
              // Title
              ctx.fillStyle = '#00ff41';
              ctx.font = 'bold 28px Courier New';
              ctx.textAlign = 'center';
              ctx.fillText('DRONE SYSTEM', 256, 80);
              
              // Welcome terminal button
              ctx.fillStyle = '#ff6600';
              ctx.fillRect(56, 150, 400, 60);
              ctx.fillStyle = '#000';
              ctx.font = 'bold 20px Courier New';
              ctx.fillText('▶ ACTIVATE TERMINAL', 256, 185);
              
              // Navigation buttons
              const buttons = [
                { text: '🏠 HOME', y: 250 },
                { text: '💰 TOKENOMICS', y: 310 },
                { text: '🖼️ GALLERY', y: 370 },
                { text: '🌙 MOON ROOM', y: 430 }
              ];
              
              clickAreas = [
                { x: 56, y: 150, width: 400, height: 60, action: 'activateTerminal' }
              ];
              
              buttons.forEach((btn, index) => {
                ctx.fillStyle = '#00ff41';
                ctx.fillRect(56, btn.y, 400, 50);
                ctx.fillStyle = '#000';
                ctx.font = 'bold 18px Courier New';
                ctx.fillText(btn.text, 256, btn.y + 30);
                
                clickAreas.push({
                  x: 56, y: btn.y, width: 400, height: 50,
                  action: 'navigate',
                  url: index === 0 ? '/' : `/${btn.text.split(' ')[1].toLowerCase()}`
                });
              });
              
              texture.needsUpdate = true;
            };
            
            // Draw post-video navigation
            const drawPostVideoScreen = () => {
              ctx.fillStyle = '#0a0a0a';
              ctx.fillRect(0, 0, 512, 512);
              
              ctx.fillStyle = '#00ff41';
              ctx.font = 'bold 24px Courier New';
              ctx.textAlign = 'center';
              ctx.fillText('TERMINAL COMPLETE', 256, 80);
              
              ctx.font = '16px Courier New';
              ctx.fillText('Choose your destination:', 256, 120);
              
              const buttons = [
                { text: '🏠 MAIN SITE', url: '/' },
                { text: '💰 TOKENOMICS', url: '/tokenomics' },
                { text: '🖼️ GALLERY', url: '/gallery' },
                { text: '🌙 MOON ROOM', url: '/moonroom' },
                { text: '🎮 GAME', url: '/game' },
                { text: '🔄 REPLAY TERMINAL', action: 'replay' }
              ];
              
              clickAreas = [];
              
              buttons.forEach((btn, index) => {
                const y = 160 + (index * 55);
                ctx.fillStyle = index === buttons.length - 1 ? '#ff6600' : '#00ff41';
                ctx.fillRect(56, y, 400, 45);
                ctx.fillStyle = '#000';
                ctx.font = 'bold 16px Courier New';
                ctx.fillText(btn.text, 256, y + 28);
                
                clickAreas.push({
                  x: 56, y: y, width: 400, height: 45,
                  action: btn.action || 'navigate',
                  url: btn.url
                });
              });
              
              texture.needsUpdate = true;
            };
            
            // Handle screen clicks
            const handleScreenClick = (x, y) => {
              console.log('Screen click at:', x, y);
              console.log('Available click areas:', clickAreas.length);
              
              // Check terminal button first (highest priority)
              const terminalArea = clickAreas.find(area => area.action === 'activateTerminal');
              if (terminalArea && 
                  x >= terminalArea.x && x <= terminalArea.x + terminalArea.width && 
                  y >= terminalArea.y && y <= terminalArea.y + terminalArea.height) {
                
                console.log('Clicked TERMINAL button area:', terminalArea);
                console.log('Activating CRT Terminal');
                screenMode = 'crt-terminal';
                startCRTTerminal();
                return; // Exit early
              }
              
              // Check other areas
              for (const area of clickAreas) {
                console.log('Checking area:', area);
                if (x >= area.x && x <= area.x + area.width && 
                    y >= area.y && y <= area.y + area.height) {
                  
                  console.log('Clicked area action:', area.action, area.url);
                  
                  if (area.action === 'navigate' && area.url) {
                    console.log('Navigating to:', area.url);
                    window.location.href = area.url;
                  } else if (area.action === 'replay') {
                    console.log('Replaying CRT terminal');
                    screenMode = 'crt-terminal';
                    startCRTTerminal();
                  }
                  break;
                }
              }
            };
            
            // No video event listeners needed for CRT terminal
            
            // Apply canvas texture to screen material
            const material = new THREE.MeshBasicMaterial({
              map: texture,
              color: 0xffffff,
              transparent: false,
              opacity: 1.0
            });
            
            object.material = material;
            
            // Ensure object is raycastable
            object.raycast = THREE.Mesh.prototype.raycast;
            object.visible = true;
            
            console.log('Applied interactive screen material to Screen1');
            console.log('Screen1 setup complete - name:', object.name, 'visible:', object.visible, 'geometry:', !!object.geometry);
            
            // Update texture in render loop
            object.userData.updateTexture = () => {
              if (screenMode === 'crt-terminal') {
                // CRT terminal draws directly to canvas, just ensure texture updates
                drawCRTTerminal();
              }
            };
            
            // Store click handler
            object.userData.handleClick = handleScreenClick;
            
            // Store references for cleanup
            object.userData.texture = texture;
            object.userData.canvas = canvas;
            object.userData.terminalAnimation = terminalAnimation;
            
            // Draw initial screen
            drawNavigationScreen();
          }
        }
        // Disable shadows
        if (object.isMesh) {
          object.castShadow = false;
          object.receiveShadow = false;
        }
      });
      
      if (!screenFound) {
        // console.log('⚠️ Screen1 not found in drone model!');
        // console.log('Looking for any mesh that could be a screen...');
        scene.traverse((object) => {
          if (object.isMesh && (object.name.toLowerCase().includes('screen') || 
                                object.name.toLowerCase().includes('display') ||
                                object.name.toLowerCase().includes('panel'))) {
            // console.log('Possible screen mesh:', object.name);
            // Use this as fallback
            screenRef.current = object;
            window.globalScreenMesh = object;
            if (groupRef.current) {
              window.globalDroneGroup = groupRef.current;
            }
          }
        });
      }
      
      // Set up hover animation
      if (animations && animations.length > 0) {
        // console.log('Drone animations:', animations.map(clip => clip.name));
        mixerRef.current = new THREE.AnimationMixer(scene);
        
        // Find the hover animation
        const hoverAnimation = animations.find(clip => 
          clip.name === 'hover' || 
          clip.name.toLowerCase().includes('hover')
        );
        
        if (hoverAnimation) {
          // console.log('Playing drone hover animation:', hoverAnimation.name);
          const action = mixerRef.current.clipAction(hoverAnimation);
          action.reset();
          action.play();
          action.setLoop(THREE.LoopRepeat);
        } else if (animations.length > 0) {
          // Play first animation if hover not found
          // console.log('Playing first drone animation');
          const action = mixerRef.current.clipAction(animations[0]);
          action.reset();
          action.play();
          action.setLoop(THREE.LoopRepeat);
        }
      }
    }
  }, [scene, animations]);
  
  // Cleanup
  useEffect(() => {
    const currentScene = scene;
    const currentMixer = mixerRef.current;
    return () => {
      if (currentMixer) {
        currentMixer.stopAllAction();
        currentMixer.uncacheRoot(currentScene);
      }
      if (currentScene) {
        currentScene.traverse((object) => {
          // Clear screen interval if exists
          if (object.userData.screenInterval) {
            clearInterval(object.userData.screenInterval);
          }
          // Clean up terminal animation
          if (object.userData.terminalAnimation) {
            clearTimeout(object.userData.terminalAnimation);
          }
          // Clean up canvas texture
          if (object.userData.texture) {
            object.userData.texture.dispose();
          }
          if (object.userData.canvas) {
            object.userData.canvas.width = 0;
            object.userData.canvas.height = 0;
          }
          if (object.geometry) object.geometry.dispose();
          if (object.material) {
            const materials = Array.isArray(object.material) 
              ? object.material : [object.material];
            materials.forEach(mat => {
              if (mat.map) mat.map.dispose();
              if (mat.normalMap) mat.normalMap.dispose();
              if (mat.roughnessMap) mat.roughnessMap.dispose();
              if (mat.metalnessMap) mat.metalnessMap.dispose();
              if (mat.aoMap) mat.aoMap.dispose();
              if (mat.emissiveMap) mat.emissiveMap.dispose();
              mat.dispose();
            });
          }
        });
      }
    };
  }, [scene]);
  
  // Update animation and handle scroll-based appearance
  useFrame((state, delta) => {
    if (mixerRef.current) {
      mixerRef.current.update(delta);
    }
    
    // Update video texture
    if (screenRef.current && screenRef.current.userData.updateTexture) {
      screenRef.current.userData.updateTexture();
    }
    
    if (groupRef.current) {
      const appearThreshold = 3500; // Drone appears halfway down the page
      const approachDuration = 3000; // Extended approach over 2000 scroll units for dramatic effect
      
      if (scrollY < appearThreshold - 200) {
        // Hide drone well before threshold to prepare for approach
        groupRef.current.visible = false;
        hasAppearedRef.current = false;
      } else {
        // Start showing drone a bit before the threshold for smooth approach
        groupRef.current.visible = true;
        
        // Calculate raw approach progress
        const rawProgress = (scrollY - (appearThreshold - 200)) / approachDuration;
        
        // Split the animation into two phases:
        // Phase 1 (0-0.3): Vertical rise from below
        // Phase 2 (0.3-1.0): Forward approach
        const risePhaseEnd = 0.3; // First 30% is vertical rise
        
        // Apply dramatic slowdown effect during drone approach
        // This makes it feel like scrolling through thick air/resistance
        let approachProgress;
        if (rawProgress < 0.3) {
          // Initial phase: very slow progress (heavy resistance)
          approachProgress = rawProgress * 0.5; // Moves at 50% speed
        } else if (rawProgress < 0.6) {
          // Middle phase: slightly faster but still slow
          approachProgress = 0.15 + (rawProgress - 0.3) * 1.5; // Gradually speeds up
        } else if (rawProgress < 0.9) {
          // Approaching phase: normal speed
          approachProgress = 0.6 + (rawProgress - 0.6) * 1.2;
        } else {
          // Final approach: slight slowdown for dramatic finish
          approachProgress = 0.96 + (rawProgress - 0.9) * 0.4;
        }
        
        // Clamp to 0-1 range
        approachProgress = Math.min(Math.max(approachProgress, 0), 1);
        
        // Calculate progress for each phase
        const riseProgress = Math.min(approachProgress / risePhaseEnd, 1);
        const forwardProgress = Math.max((approachProgress - risePhaseEnd) / (1 - risePhaseEnd), 0);
        
        // Smooth easing for each phase
        const easedRiseProgress = 1 - Math.pow(1 - riseProgress, 3); // Cubic ease-out for rise
        const easedForwardProgress = 1 - Math.pow(1 - forwardProgress, 3); // Cubic ease-out for forward approach
        
        // During approach, drone stays centered in viewport
        // Only after fully approached does it move with the scene
        let scrolledY;
        const finalDroneY = 5; // Higher up in viewport for better centering
        
        if (approachProgress < 1) {
          // During approach: drone approaches its final viewport position
          scrolledY = finalDroneY; // Approach to higher position
        } else {
          // After approach: move with the scene normally
          // Calculate the position the drone should be at when it starts moving with the scene
          // This should match where it was at the end of the approach
          const scrollAtApproachEnd = appearThreshold - 200 + approachDuration;
          const baseY = finalDroneY - (scrollAtApproachEnd * 0.035);
          scrolledY = baseY + scrollY * 0.035;
        }
        
        // Debug log to see where it is
        // if (scrollY > 1400 && scrollY < 1600) {
        //   console.log('Drone position calc:', {
        //     baseY,
        //     scrolledY,
        //     scrollY,
        //     approachProgress,
        //     easedProgress,
        //     visible: groupRef.current.visible
        //   });
        // }
        
        // Approach animation with two phases: vertical rise, then forward approach
        
        // Z position: gradually moves back during rise, then comes forward during approach
        const endZ = position[2] || -5; // Final Z position (close)
        const farZ = -30; // Far position to approach from
        
        // Smoothly transition Z position through both phases
        // During rise: gradually move from close to far
        // During forward: move from far back to close
        const currentZ = riseProgress < 1
          ? endZ + (farZ - endZ) * easedRiseProgress  // Move away during rise
          : farZ + (endZ - farZ) * easedForwardProgress; // Come back during approach
        
        // Y position: rises from below, then maintains height during forward approach
        const startYOffset = -25; // Starts 25 units below viewport
        const yRiseOffset = startYOffset * (1 - easedRiseProgress); // Rise animation
        const yApproachOffset = 0; // No additional Y movement during forward approach
        const totalYOffset = yRiseOffset + yApproachOffset;
        
        // Scale: continuously grows through both phases
        // Start small, reach medium size at end of rise, then grow to full size during approach
        const baseScale = 0.3; // Starting scale
        const midScale = 0.6;  // Scale at transition between rise and approach
        const finalScale = 1.7; // Final scale
        
        const approachScale = riseProgress < 1 
          ? baseScale + (midScale - baseScale) * easedRiseProgress  // Rise: 0.3 to 0.6
          : midScale + (finalScale - midScale) * easedForwardProgress; // Approach: 0.6 to 1.7
        
        // Final Y position with floating
        const time = state.clock.getElapsedTime();
        if (approachProgress >= 1) {
          // Fully appeared - add floating animation
          groupRef.current.position.y = scrolledY + Math.sin(time * 0.5) * 0.3;
          groupRef.current.rotation.y = Math.sin(time * 0.3) * 0.1;
          groupRef.current.position.z = endZ;
          groupRef.current.scale.setScalar(finalScale); // Use final approach scale to avoid jump
        } else {
          // During approach (both rise and forward phases)
          groupRef.current.position.y = scrolledY + totalYOffset;
          groupRef.current.rotation.y = 0;
          groupRef.current.position.z = currentZ;
          groupRef.current.scale.setScalar(approachScale);
        }
        
        // Keep X position fixed with slight sway during approach
        if (approachProgress < 1) {
          // Add subtle horizontal sway during approach
          groupRef.current.position.x = position[0] + Math.sin(approachProgress * Math.PI * 2) * 2;
        } else {
          groupRef.current.position.x = position[0];
        }
      }
    }
  });
  
  
  return (
    <group ref={groupRef} position={position}>
      <primitive 
        object={scene} 
        scale={[2, 2, 2]}
        rotation={[0, Math.PI, 0]}
      />
    </group>
  );
});

// Angel Model component with scroll-based swoop animation
const AngelModel = React.memo(function AngelModel({ position = [0, 0, 10], scrollY, isMobile = false }) {
  const { scene, animations } = useGLTF('/models/angel2.glb');
  const groupRef = useRef();
  const mixerRef = useRef();

  // Create animation mixer
  useEffect(() => {
    if (animations && animations.length > 0) {
      mixerRef.current = new THREE.AnimationMixer(scene);
      
      // Find and play both animations on loop
      const idleAnimation = animations.find(clip => clip.name === 'Armature|Idle');
      const sceneAnimation = animations.find(clip => clip.name === 'Scene');
      
      if (idleAnimation) {
        const idleAction = mixerRef.current.clipAction(idleAnimation);
        idleAction.setLoop(THREE.LoopRepeat);
        idleAction.play();
      }
      
      if (sceneAnimation) {
        const sceneAction = mixerRef.current.clipAction(sceneAnimation);
        sceneAction.setLoop(THREE.LoopRepeat);
        sceneAction.play();
      }
    }

    return () => {
      if (mixerRef.current) {
        mixerRef.current.stopAllAction();
        mixerRef.current = null;
      }
    };
  }, [animations, scene]);

  // Animation constants - multi-stage flight path
  const appearThreshold = 1000;
  const exitThreshold = 3000;
  const totalDuration = exitThreshold - appearThreshold; // 2000 scroll units
  
  // Second appearance for chase sequence
  const chaseAppearThreshold = 9000; // Appears during devil's pause phase
  const chaseExitThreshold = 10000;   // Chases devil off screen
  const chaseDuration = chaseExitThreshold - chaseAppearThreshold;
  
  // Flight stages (as percentage of total scroll duration)
  const swoopInDuration = 0.25;    // 25% - swoop in from right
  const flyAcrossDuration = 0.3;   // 30% - fly across to left side  
  const spinDuration = 0.2;        // 20% - spin 180 degrees
  const pauseDuration = 0.15;      // 15% - brief pause
  const swoopOutDuration = 0.1;    // 10% - swoop out toward viewer
  
  // Update animation mixer and handle scroll-based movement
  useFrame((state, delta) => {
    if (mixerRef.current) {
      mixerRef.current.update(delta);
    }
    
    if (groupRef.current) {
      const time = state.clock.elapsedTime;
      
      // Calculate scroll-based visibility and movement
      const inFirstSequence = scrollY >= appearThreshold && scrollY <= exitThreshold;
      const inChaseSequence = scrollY >= chaseAppearThreshold && scrollY <= chaseExitThreshold;
      
      if (!inFirstSequence && !inChaseSequence) {
        groupRef.current.visible = false;
        return;
      }
      
      groupRef.current.visible = true;
      
      // Determine which sequence we're in and calculate progress
      let overallProgress;
      let isChasing = false;
      
      if (inChaseSequence) {
        // Chase sequence - angel chases devil
        isChasing = true;
        overallProgress = (scrollY - chaseAppearThreshold) / chaseDuration;
      } else {
        // Original sequence
        overallProgress = (scrollY - appearThreshold) / totalDuration;
      }
      
      // Determine which flight stage we're in
      let stage, stageProgress;
      let baseX, baseY, baseZ, rotationY, rotationX, scale;
      
      if (isChasing) {
        // Chase sequence animation
        if (overallProgress < 0.3) {
          // Stage 1: Angel swoops in from left, pauses when seeing devil
          stage = 'chaseEntry';
          stageProgress = overallProgress / 0.3;
          const easedProgress = 1 - Math.pow(1 - stageProgress, 2);
          
          const startX = isMobile ? -10 : -15;
          const startY = isMobile ? 6 : 8;
          const startZ = 6;
          const endX = isMobile ? -3 : -5;
          const endY = isMobile ? 5 : 7;
          const endZ = 3;
          
          baseX = startX + (endX - startX) * easedProgress;
          baseY = startY + (endY - startY) * easedProgress;
          baseZ = startZ + (endZ - startZ) * easedProgress;
          rotationY = Math.PI * 0.3; // Looking toward devil
          rotationX = 0; // No lean during entry
          scale = isMobile ? 2 : 2;
          
        } else if (overallProgress < 0.5) {
          // Stage 2: Brief pause, looking at devil with surprise
          stage = 'chasePause';
          stageProgress = (overallProgress - 0.3) / 0.2;
          
          baseX = isMobile ? -3 : -5;
          baseY = (isMobile ? 5 : 7) + Math.sin(time * 4) * 0.15; // Agitated hovering
          baseZ = 3;
          rotationY = Math.PI * 0.4 + Math.sin(time * 3) * 0.1; // Looking at devil with slight head movement
          rotationX = Math.PI * 0.05; // Slight forward lean as it prepares to chase
          scale = isMobile ? 2 : 2;
          
        } else {
          // Stage 3: Chase the devil off screen to the right
          stage = 'chaseChase';
          stageProgress = (overallProgress - 0.5) / 0.5;
          const easedProgress = Math.pow(stageProgress, 1.5); // Accelerating chase
          
          const startX = isMobile ? -3 : -5;
          const startY = isMobile ? 5 : 7;
          const startZ = 3;
          const endX = isMobile ? 28 : 30;
          const endY = isMobile ? 4 : 6;
          const endZ = -2; // Slight toward viewer like devil
          
          baseX = startX + (endX - startX) * easedProgress;
          baseY = startY + (endY - startY) * easedProgress + Math.sin(time * 3) * 0.3; // Wing beat
          baseZ = startZ + (endZ - startZ) * easedProgress;
          rotationY = Math.PI * 0.1 + Math.sin(time * 2) * 0.15; // Determined chase angle
          rotationX = Math.PI * 0.15 * (1 + easedProgress * 0.5); // Forward lean that increases with speed
          scale = (isMobile ? 2 : 2) * (1 + easedProgress * 0.8); // Getting bigger as it approaches viewer
        }
        
      } else if (overallProgress < swoopInDuration) {
        // Stage 1: Swoop in from right side
        stage = 'swoopIn';
        stageProgress = overallProgress / swoopInDuration;
        const easedProgress = 1 - Math.pow(1 - stageProgress, 3); // Ease-out cubic
        
        const startX = isMobile ? 8 : 12;
        const startY = isMobile ? 6 : 8;
        const startZ = 6;
        const endX = isMobile ? 2 : 4;
        const endY = isMobile ? 4 : 6;
        const endZ = 2;
        
        // Arc motion during swoop
        const arcHeight = 1.5;
        const yOffset = Math.sin(stageProgress * Math.PI) * arcHeight;
        
        baseX = startX + (endX - startX) * easedProgress;
        baseY = startY + (endY - startY) * easedProgress + yOffset;
        baseZ = startZ + (endZ - startZ) * easedProgress;
        rotationY = -Math.PI * 0.3; // Slight angle toward center
        rotationX = 0; // No lean during original sequence
        scale = isMobile ? 2 : 2;
        
      } else if (overallProgress < swoopInDuration + flyAcrossDuration) {
        // Stage 2: Fly across to left side
        stage = 'flyAcross';
        stageProgress = (overallProgress - swoopInDuration) / flyAcrossDuration;
        const easedProgress = stageProgress; // Linear movement for crossing
        
        const startX = isMobile ? 2 : 4;
        const startY = isMobile ? 4 : 6;
        const endX = isMobile ? -4 : -6;
        const endY = isMobile ? 5 : 7;
        
        baseX = startX + (endX - startX) * easedProgress;
        baseY = startY + (endY - startY) * easedProgress + Math.sin(time * 2) * 0.3; // Wing flutter
        baseZ = 2 + Math.sin(easedProgress * Math.PI * 2) * 0.5; // Gentle depth wave
        rotationY = -Math.PI * 0.2 + Math.sin(time * 1.5) * 0.1; // Flight banking
        rotationX = 0; // No lean during original sequence
        scale = isMobile ? 2 : 2;
        
      } else if (overallProgress < swoopInDuration + flyAcrossDuration + spinDuration) {
        // Stage 3: Spin 1.5 rotations (540 degrees)
        stage = 'spin';
        stageProgress = (overallProgress - swoopInDuration - flyAcrossDuration) / spinDuration;
        const easedSpin = stageProgress < 0.5 ? 
          2 * stageProgress * stageProgress : 
          -1 + (4 - 2 * stageProgress) * stageProgress; // Ease in-out
        
        baseX = isMobile ? -4 : -6;
        baseY = isMobile ? 5 : 7;
        baseZ = 2;
        rotationY = -Math.PI * 0.2 + (Math.PI * 2.5 * easedSpin); // 1.25 rotations, ends facing viewer
        rotationX = 0; // No lean during original sequence
        scale = isMobile ? 2 : 2;
        
      } else if (overallProgress < swoopInDuration + flyAcrossDuration + spinDuration + pauseDuration) {
        // Stage 4: Brief pause
        stage = 'pause';
        stageProgress = (overallProgress - swoopInDuration - flyAcrossDuration - spinDuration) / pauseDuration;
        
        baseX = isMobile ? -4 : -6;
        baseY = isMobile ? 5 : 7 + Math.sin(time * 3) * 0.2; // Gentle hover
        baseZ = 2;
        rotationY = Math.PI * 0.3 + Math.sin(time * 2) * 0.05; // Facing viewer with slight hover rotation
        rotationX = 0; // No lean during original sequence
        scale = isMobile ? 2 : 2;
        
      } else {
        // Stage 5: Swoop out toward viewer
        stage = 'swoopOut';
        stageProgress = (overallProgress - swoopInDuration - flyAcrossDuration - spinDuration - pauseDuration) / swoopOutDuration;
        const easedOut = Math.pow(stageProgress, 2); // Ease-in for acceleration
        
        const startX = isMobile ? -4 : -6;
        const startY = isMobile ? 5 : 7;
        const startZ = 2;
        const endX = isMobile ? 2 : 22;
        const endY = isMobile ? 3 : 4;
        const endZ = -3; // Move toward viewer
        
        baseX = startX + (endX - startX) * easedOut;
        baseY = startY + (endY - startY) * easedOut;
        baseZ = startZ + (endZ - startZ) * easedOut;
        rotationY = Math.PI * 0.8 + (Math.PI * 0.4 * easedOut); // Continue turning toward viewer
        rotationX = 0; // No lean during original sequence
        scale = (isMobile ? 2 : 2) * (1 + easedOut * 1.5); // Get bigger as it approaches
      }
      
      // Apply position, rotation, and scale
      groupRef.current.position.set(baseX, baseY, baseZ);
      groupRef.current.rotation.x = rotationX; // Forward lean for chase
      groupRef.current.rotation.y = rotationY;
      groupRef.current.rotation.z = Math.sin(time * 0.8) * 0.1; // Wing tilt
      groupRef.current.scale.setScalar(scale);
    }
  });

  return (
    <group ref={groupRef} position={position}>
      <primitive 
        object={scene} 
        scale={isMobile ? [1.5, 1.5, 1.5] : [1.5, 1.5, 1.5]}
      />
    </group>
  );
});

// Devil Model component with scroll-based swoop animation (appears at end of page)
const DevilModel = React.memo(function DevilModel({ position = [0, 0, 10], scrollY, isMobile = false }) {
  const { scene, animations } = useGLTF('/models/devil2.glb');
  const groupRef = useRef();
  const mixerRef = useRef();

  // Create animation mixer
  useEffect(() => {
    if (animations && animations.length > 0) {
      mixerRef.current = new THREE.AnimationMixer(scene);
      
      // Find and play both animations on loop
      const idleAnimation = animations.find(clip => clip.name === 'Armature|Idle');
      const sceneAnimation = animations.find(clip => clip.name === 'Scene');
      
      if (idleAnimation) {
        const idleAction = mixerRef.current.clipAction(idleAnimation);
        idleAction.setLoop(THREE.LoopRepeat);
        idleAction.play();
      }
      
      if (sceneAnimation) {
        const sceneAction = mixerRef.current.clipAction(sceneAnimation);
        sceneAction.setLoop(THREE.LoopRepeat);
        sceneAction.play();
      }
    }

    return () => {
      if (mixerRef.current) {
        mixerRef.current.stopAllAction();
        mixerRef.current = null;
      }
    };
  }, [animations, scene]);

  // Animation constants - multi-stage flight path (appears at end of page)
  const appearThreshold = 8500; // Appears near end of page
  const exitThreshold = 9500;   // Exits after page end
  const totalDuration = exitThreshold - appearThreshold; // 2000 scroll units
  
  // Flight stages (as percentage of total scroll duration)
  const swoopInDuration = 0.25;    // 25% - swoop in from left 
  const flyAcrossDuration = 0.3;   // 30% - fly across to right side  
  const spinDuration = 0.2;        // 20% - spin 180 degrees
  const pauseDuration = 0.15;      // 15% - brief pause
  const swoopOutDuration = 0.1;    // 10% - swoop out toward viewer
  
  // Update animation mixer and handle scroll-based movement
  useFrame((state, delta) => {
    if (mixerRef.current) {
      mixerRef.current.update(delta);
    }
    
    if (groupRef.current) {
      const time = state.clock.elapsedTime;
      
      // Calculate scroll-based visibility and movement
      if (scrollY < appearThreshold || scrollY > exitThreshold) {
        groupRef.current.visible = false;
        return;
      }
      
      groupRef.current.visible = true;
      
      // Calculate overall progress (0 to 1) through the flight sequence
      const overallProgress = (scrollY - appearThreshold) / totalDuration;
      
      // Determine which flight stage we're in
      let stage, stageProgress;
      let baseX, baseY, baseZ, rotationY, scale;
      
      if (overallProgress < swoopInDuration) {
        // Stage 1: Swoop in from left side (opposite of angel)
        stage = 'swoopIn';
        stageProgress = overallProgress / swoopInDuration;
        const easedProgress = 1 - Math.pow(1 - stageProgress, 3); // Ease-out cubic
        
        const startX = isMobile ? -8 : -12;  // Start from left (opposite of angel)
        const startY = isMobile ? 6 : 8;
        const startZ = 6;
        const endX = isMobile ? -2 : -4;
        const endY = isMobile ? 4 : 6;
        const endZ = 2;
        
        // Arc motion during swoop
        const arcHeight = 1.5;
        const yOffset = Math.sin(stageProgress * Math.PI) * arcHeight;
        
        baseX = startX + (endX - startX) * easedProgress;
        baseY = startY + (endY - startY) * easedProgress + yOffset;
        baseZ = startZ + (endZ - startZ) * easedProgress;
        rotationY = Math.PI * 0.3; // Slight angle toward center (opposite of angel)
        scale = isMobile ? 2 : 2;
        
      } else if (overallProgress < swoopInDuration + flyAcrossDuration) {
        // Stage 2: Fly across to right side
        stage = 'flyAcross';
        stageProgress = (overallProgress - swoopInDuration) / flyAcrossDuration;
        const easedProgress = stageProgress; // Linear movement for crossing
        
        const startX = isMobile ? -2 : -4;
        const startY = isMobile ? 4 : 6;
        const endX = isMobile ? 4 : 6;    // End on right (opposite of angel)
        const endY = isMobile ? 5 : 7;
        
        baseX = startX + (endX - startX) * easedProgress;
        baseY = startY + (endY - startY) * easedProgress + Math.sin(time * 2) * 0.3; // Wing flutter
        baseZ = 2 + Math.sin(easedProgress * Math.PI * 2) * 0.5; // Gentle depth wave
        rotationY = Math.PI * 0.4 + Math.sin(time * 1.5) * 0.1; // Flight banking
        scale = isMobile ? 2 : 2;
        
      } else if (overallProgress < swoopInDuration + flyAcrossDuration + spinDuration) {
        // Stage 3: Spin 1.5 rotations (540 degrees)
        stage = 'spin';
        stageProgress = (overallProgress - swoopInDuration - flyAcrossDuration) / spinDuration;
        const easedSpin = stageProgress < 0.5 ? 
          2 * stageProgress * stageProgress : 
          -1 + (4 - 2 * stageProgress) * stageProgress; // Ease in-out
        
        baseX = isMobile ? 4 : 6;
        baseY = isMobile ? 5 : 7;
        baseZ = 2;
        rotationY = Math.PI * 0.2 + (Math.PI * 2.5 * easedSpin); // 1.25 rotations, ends facing viewer
        scale = isMobile ? 2 : 2;
        
      } else if (overallProgress < swoopInDuration + flyAcrossDuration + spinDuration + pauseDuration) {
        // Stage 4: Brief pause
        stage = 'pause';
        stageProgress = (overallProgress - swoopInDuration - flyAcrossDuration - spinDuration) / pauseDuration;
        
        baseX = isMobile ? 4 : 6;
        baseY = isMobile ? 5 : 7 + Math.sin(time * 3) * 0.2; // Gentle hover
        baseZ = 2;
        rotationY = -Math.PI * 0.3 + Math.sin(time * 2) * 0.05; // Facing viewer with slight hover rotation
        scale = isMobile ? 2 : 2;
        
      } else {
        // Stage 5: Swoop out toward viewer and slightly right
        stage = 'swoopOut';
        stageProgress = (overallProgress - swoopInDuration - flyAcrossDuration - spinDuration - pauseDuration) / swoopOutDuration;
        const easedOut = Math.pow(stageProgress, 2); // Ease-in for acceleration
        
        const startX = isMobile ? 4 : 6;
        const startY = isMobile ? 5 : 7;
        const startZ = 2;
        const endX = isMobile ? 8 : 22;   // Exit slightly to the right 
        const endY = isMobile ? 3 : 4;
        const endZ = -3; // Move toward viewer
        
        baseX = startX + (endX - startX) * easedOut;
        baseY = startY + (endY - startY) * easedOut;
        baseZ = startZ + (endZ - startZ) * easedOut;
        rotationY = -Math.PI * 0.8 + (-Math.PI * 0.4 * easedOut); // Continue turning toward viewer
        scale = (isMobile ? 2 : 2) * (1 + easedOut * 1.5); // Get bigger as it approaches
      }
      
      // Apply position, rotation, and scale
      groupRef.current.position.set(baseX, baseY, baseZ);
      groupRef.current.rotation.y = rotationY;
      groupRef.current.rotation.z = Math.sin(time * 0.8) * 0.1; // Wing tilt
      groupRef.current.scale.setScalar(scale);
    }
  });

  return (
    <group ref={groupRef} position={position}>
      <primitive 
        object={scene} 
        scale={isMobile ? [1.5, 1.5, 1.5] : [1.5, 1.5, 1.5]}
      />
    </group>
  );
});

// Breath component that follows the same scroll animation as the Model
function ScrollingBreath({ scrollY, isMobile }) {
  const breathGroupRef = useRef();
  
  // Track when we've reached the bottom (same logic as Model)
  const scrollDroppedRef = useRef(false);
  const prevScrollRef = useRef(0);
  const [hideAtBottom, setHideAtBottom] = React.useState(false);
  
  React.useEffect(() => {
    if (prevScrollRef.current > 7000 && scrollY < 100) {
      scrollDroppedRef.current = true;
      setHideAtBottom(true);
    } 
    else if (scrollY > 500 && scrollY < 7000 && !scrollDroppedRef.current) {
      setHideAtBottom(false);
    }
    else if (scrollY > 7500) {
      if (scrollDroppedRef.current) {
        setHideAtBottom(true);
      }
    }
    
    if (scrollY > 500 && scrollY < 3000) {
      scrollDroppedRef.current = false;
    }
    
    prevScrollRef.current = scrollY;
  }, [scrollY]);
  
  // Same hide logic as model
  const shouldHide = scrollY > 9500 || hideAtBottom;
  
  // Match the exact same animation as the Model component
  useFrame(() => {
    if (breathGroupRef.current) {
      // Check for bottom condition right in the render loop
      const isAtBottomNow = scrollDroppedRef.current || 
                           (prevScrollRef.current > 7000 && scrollY < 100);
      
      if (shouldHide || isAtBottomNow) {
        breathGroupRef.current.visible = false;
        return;
      }
      
      const baseY = isMobile ? -15 : -15;
      
      // Check if we're in drone approach phase
      const droneAppearThreshold = 9500; // Matches model threshold
      const droneApproachDuration = 2000;
      const droneApproachEnd = droneAppearThreshold + droneApproachDuration;
      
      let effectiveScrollY = scrollY;
      
      // During drone approach, lock the breath at the appearance position
      if (scrollY >= droneAppearThreshold - 200 && scrollY < droneApproachEnd) {
        // Lock breath at the position it was when drone started appearing
        effectiveScrollY = droneAppearThreshold - 200;
      } else if (scrollY >= droneApproachEnd) {
        // After drone approach, subtract the approach duration to continue smoothly
        effectiveScrollY = scrollY - droneApproachDuration;
      }
      
      // Match Model's increased scroll speed with same clamping
      const maxY = 40; // Same max as model
      const calculatedY = baseY + effectiveScrollY * 0.035;
      breathGroupRef.current.position.y = Math.min(calculatedY, maxY);
      breathGroupRef.current.visible = true;
    }
  });
  
  return (
    <group ref={breathGroupRef} position={isMobile ? [2, -8, -10] : [2, 8, -11]}>
      {/* Right nostril (from bull's perspective) */}
           <BreathSmoke 
        name="Left Nostril"
        position={[2.8, 10.6, 25.1]}
        direction={[0.1, -0.3, 2]}
        rotation={[2.6, 2.4, -0.3]}
      />
      <BreathSmoke 
        name="Right Nostril"
        position={[3.8, 10.2, 25.3]}
        direction={[-0.1, -0.3, 2]}
        rotation={[2.1, 2.3, 0.7]}
      />
    </group>
  );
}

// Scroll-responsive Clouds component wrapper
function ScrollClouds({ scrollY, onLoad }) {
  const cloudGroupRef = useRef();
  
  // Animate clouds with scroll (from Simple3DScene)
  useFrame(() => {
    if (cloudGroupRef.current) {
      // Check if we're in drone approach phase
      const droneAppearThreshold = 9500; // Matches model threshold
      const droneApproachDuration = 2000;
      const droneApproachEnd = droneAppearThreshold + droneApproachDuration;
      
      let effectiveScrollY = scrollY;
      
      // During drone approach, lock the clouds at the appearance position
      if (scrollY >= droneAppearThreshold - 200 && scrollY < droneApproachEnd) {
        // Lock clouds at the position they were when drone started appearing
        effectiveScrollY = droneAppearThreshold - 200;
      } else if (scrollY >= droneApproachEnd) {
        // After drone approach, subtract the approach duration to continue smoothly
        effectiveScrollY = scrollY - droneApproachDuration;
      }
      
      // Clouds move slightly slower than model for parallax effect
      cloudGroupRef.current.position.y = effectiveScrollY * 0.03;
    }
  });
  
  return (
    <group ref={cloudGroupRef}>
      <DarkClouds onLoad={onLoad} />
    </group>
  );
}

// ChromaticAberrationMaterial for TickerCurve
const ChromaticAberrationMaterial = shaderMaterial(
  {
    color: new THREE.Color("#1a1a1a"),
    opacity: 0.8,
    aberrationOffset: new THREE.Vector2(0.01, 0.01)
  },
  // Vertex shader
  `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment shader
  `
    uniform vec3 color;
    uniform float opacity;
    uniform vec2 aberrationOffset;
    varying vec2 vUv;
    
    void main() {
      vec2 uv = vUv;
      
      // Sample RGB channels with different offsets for chromatic aberration
      float r = color.r;
      float g = color.g;
      float b = color.b;
      
      // Apply chromatic aberration by offsetting UV coordinates
      vec2 rOffset = uv + aberrationOffset;
      vec2 gOffset = uv;
      vec2 bOffset = uv - aberrationOffset;
      
      // Simple color variation based on position for aberration effect
      float rFactor = 1.0 + sin(rOffset.x * 10.0) * 0.1;
      float bFactor = 1.0 + sin(bOffset.x * 10.0) * 0.1;
      
      vec3 finalColor = vec3(r * rFactor, g, b * bFactor);
      
      gl_FragColor = vec4(finalColor, opacity);
    }
  `
);

// GradientSkyMaterial from home3/page
const GradientSkyMaterial = shaderMaterial(
  {
    topColor: new THREE.Color(0x1a0033), // Dark violet
    middleColor: new THREE.Color(0x87CEEB), // Light blue
    bottomColor: new THREE.Color(0x0a001a), // Dark blue/almost black
  },
  // Vertex shader
  `
    varying vec3 vWorldPosition;
    void main() {
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPosition.xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment shader
  `
    uniform vec3 topColor;
    uniform vec3 middleColor;
    uniform vec3 bottomColor;
    varying vec3 vWorldPosition;
    
    void main() {
      float h = normalize(vWorldPosition).y;
      vec3 color;
      
      if (h > 0.0) {
        // Upper hemisphere: blend from middle to top
        color = mix(middleColor, topColor, h);
      } else {
        // Lower hemisphere: blend from middle to bottom
        color = mix(middleColor, bottomColor, -h);
      }
      
      gl_FragColor = vec4(color, 1.0);
    }
  `
);

extend({ GradientSkyMaterial });
extend({ ChromaticAberrationMaterial });

// Hemisphere Light Component
function HemisphereLightComponent() {
  // GUI Controls (commented out - uncomment to adjust lighting)
  // const hemisphereLightControls = useControls('Hemisphere Light', {
  //   skyColor: {
  //     value: "#11c3f4c7",
  //   },
  //   groundColor: {
  //     value: "#ff00cc",
  //   },
  //   intensity: {
  //     value: 1.2,
  //     min: 0,
  //     max: 5,
  //     step: 0.1,
  //   },
  // });
  
  // Hard-coded values
  const lightingValues = {
    skyColor: "#11c3f4c7",
    groundColor: "#ff00cc",
    intensity: 1.2,
  };
  
  return (
    <hemisphereLight 
      skyColor={lightingValues.skyColor} 
      groundColor={lightingValues.groundColor} 
      intensity={lightingValues.intensity} 
    />
  );
}

// Spotlight Component
function SpotlightComponent() {
  const spotlightRef = useRef();
  
  // GUI Controls (commented out - uncomment to adjust lighting)
  // const spotlightControls = useControls('Spotlight', {
  //   position: {
  //     value: [7.4, 28, 19.9],
  //     step: 0.1,
  //   },
  //   color: "#ffac00",
  //   angle: {
  //     value: 0.02,
  //     min: 0,
  //     max: Math.PI / 2,
  //     step: 0.01,
  //   },
  //   decay: {
  //     value: 0.97,
  //     min: 0,
  //     max: 2,
  //     step: 0.01,
  //   },
  //   distance: {
  //     value: 300,
  //     min: 0,
  //     max: 1000,
  //     step: 1,
  //   },
  //   penumbra: {
  //     value: -0.3,
  //     min: -1,
  //     max: 1,
  //     step: 0.01,
  //   },
  //   intensity: {
  //     value: 77,
  //     min: 0,
  //     max: 1000,
  //     step: 1,
  //   },
  // });
  
  // Hard-coded values
  const lightingValues = {
    position: [7.4, 28, 19.9],
    color: "#ffac00",
    angle: 0.02,
    decay: 0.97,
    distance: 300,
    penumbra: -0.3,
    intensity: 77,
  };
  
  return (
    <spotLight 
      ref={spotlightRef}
      position={lightingValues.position} 
      color={new THREE.Color(lightingValues.color)} 
      angle={lightingValues.angle} 
      decay={lightingValues.decay} 
      distance={lightingValues.distance} 
      penumbra={lightingValues.penumbra} 
      intensity={lightingValues.intensity}
      castShadow={false}
    />
  );
}

// Apply bloom effect to Halo mesh
function GradientSkySphere() {
  return (
    <mesh scale={[100, 100, 100]}>
      <sphereGeometry args={[1, 8, 8]} />
      <gradientSkyMaterial 
        side={THREE.BackSide}
        topColor={new THREE.Color(0x1a0033)} // Dark violet
        middleColor={new THREE.Color(0x87CEEB)} // Light blue
        bottomColor={new THREE.Color(0x0a001a)} // Dark blue/almost black
      />
    </mesh>
  );
}

// ScrollTriggeredTitle - DropInTitle that animates when in view
function ScrollTriggeredTitle({ isMobile }) {
  const titleRef = useRef(null);
  const titleInView = useInView(titleRef, { 
    threshold: 0.01, // Very low threshold - just 1% visible
    triggerOnce: false,  // Allow re-triggering for replay
    rootMargin: '200px 0px' // Trigger 200px before entering viewport
  });

  return (
    <div ref={titleRef} style={{ 
      minHeight: '200px',
      position: 'relative',
      zIndex: 100
    }}>
      <DropInTitle
        lines={["BEHOLD!", "OUR LADY!", "HOLD RL80!"]}
        colors={["#d4af37", "#f4e4c1", "#00fffbff"]}
        fontSize={{ mobile: "2.5rem", desktop: "4rem" }}
        isMobile={isMobile}
        triggerAnimation={titleInView} // Will trigger whenever in view
        instanceId="welcome-title"
      />
      
      {/* <AnnunciationIntro 
  isMobile={isMobile}
  titleInView={titleInView}
  SkewedHeading={SkewedHeading}
  AngelOfCurrencies={AngelOfCurrencies}
/> */}
     
    </div>
  );
}





// Exact TickerCurve from Simple3DScene
const TickerCurve = ({ scrollY = 0, scale = 3, position = [0, 3, 5] }) => {
  const textRefs = useRef([]);
  const curveRef = useRef();
  const groupRef = useRef();
  
  const firestoreResults = useFirestoreResults();
  
  // Create the curve path
  const curve = useMemo(() => {
    // Create a wavy ribbon curve similar to your Blender model
    const points = [];
    const segments = 50;
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const x = (t - 0.5) * 40; // Wider curve to match ticker
      const y = Math.sin(t * Math.PI * 2) * 1; // Wave amplitude
      const z = Math.cos(t * Math.PI) * 2; // More depth variation
      points.push(new THREE.Vector3(x, y, z));
    }
    return new THREE.CatmullRomCurve3(points);
  }, []);
  
  // Animate text along curve
  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    const speed = 0.03;
    
    textRefs.current.forEach((mesh, index) => {
      if (mesh && mesh.userData.baseIndex === undefined) {
        // Store the initial index for each mesh
        mesh.userData.baseIndex = index;
      }
      
      if (mesh) {
        // Calculate position along curve - ensure each item has unique position
        const itemCount = Math.max(textRefs.current.length, 10); // Minimum 10 positions
        const spacing = 1.0 / itemCount; // More spacing by using higher divisor
        const baseIndex = mesh.userData.baseIndex || index;
        const offset = ((time * speed) + (baseIndex * spacing)) % 1;
        
        // Get point on curve (these are in local space relative to the group)
        const point = curve.getPoint(offset);
        const tangent = curve.getTangent(offset);
        
        // Set position directly without creating new vectors
        mesh.position.x = point.x;
        mesh.position.y = point.y;  // Slightly below the curve (was +0.1)
        mesh.position.z = point.z + 0.1;  // Closer to ribbon surface (was +0.5)
        
        // Calculate proper orientation for text to follow curve smoothly
        const up = new THREE.Vector3(0, 1, 0);
        const axis = new THREE.Vector3().crossVectors(up, tangent).normalize();
        const radians = Math.acos(up.dot(tangent));
        const quaternion = new THREE.Quaternion().setFromAxisAngle(axis, radians);
        
        // Apply rotation to align text with curve direction
        mesh.quaternion.copy(quaternion);
        mesh.rotateY(Math.PI); // Rotate to face along the curve
        mesh.rotateZ(Math.PI / 2); // Additional rotation for readability
        mesh.rotateX(-Math.PI); // Flip 180 degrees over X-axis
      }
    });
  });
  
  // Create a flat ribbon mesh from the curve
  const ribbonGeometry = useMemo(() => {
    const points = curve.getPoints(100);
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    const ribbonHeight = 0.6; // Height of the ribbon
    
    // Create vertices for a flat ribbon
    points.forEach(point => {
      // Top edge
      vertices.push(point.x, point.y + ribbonHeight/2, point.z);
      // Bottom edge  
      vertices.push(point.x, point.y - ribbonHeight/2, point.z);
    });
    
    // Create faces
    const indices = [];
    for (let i = 0; i < points.length - 1; i++) {
      const a = i * 2;
      const b = i * 2 + 1;
      const c = (i + 1) * 2;
      const d = (i + 1) * 2 + 1;
      
      // Two triangles per segment
      indices.push(a, b, c);
      indices.push(b, d, c);
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    
    return geometry;
  }, [curve]);
  
  // Cleanup geometry and text materials on unmount
  useEffect(() => {
    const currentGeometry = ribbonGeometry;
    return () => {
      if (currentGeometry) {
        currentGeometry.dispose();
      }
      // Clean up text refs to prevent memory leaks
      textRefs.current.forEach(ref => {
        if (ref) {
          if (ref.geometry) ref.geometry.dispose();
          if (ref.material) ref.material.dispose();
        }
      });
      textRefs.current = [];
    };
  }, [ribbonGeometry]);
  
  // Create a small differential between text and mesh based on scroll
  // Text moves slightly less than mesh to maintain alignment
  const textOffsetY = scrollY * -0.00015; // Small negative offset to compensate for drift
  
  return (
    <group ref={groupRef} position={position} scale={scale}>
      {/* Render the curve as a flat ribbon */}
      <mesh ref={curveRef} renderOrder={0} geometry={ribbonGeometry}>
        <meshBasicMaterial 
          color="#1a1a1a" 
          transparent 
          opacity={0.8}
          depthTest={true}
          depthWrite={true}
          side={2} // DoubleSide
        />
      </mesh>
      
      {/* Text elements with slight scroll differential relative to mesh */}
      <group position={[0, textOffsetY, 0]}>
        {(firestoreResults.length > 0 
          ? firestoreResults.slice(0, 5).flatMap((item, i) => [
              { text: `${item.userName || 'ANON'}`, isName: true, key: `name-${i}` },
              { text: '▲', isName: false, key: `arrow-${i}` },
              { text: `${(item.burnedAmount || 0).toLocaleString()}`, isName: false, key: `amount-${i}` },
              { text: '•', isName: false, key: `dot-${i}` }
            ])
          : ['$', 'DIVINE', '+', 'ENERGY', '▲', 'FLOWS', '$', 'REALM'].map((text, i) => 
              ({ text, isName: false, key: `default-${i}` }))
        ).map((item, index) => {
          const isNameItem = item && item.isName;
          const textContent = item && item.text ? item.text : item;
          const keyValue = item && item.key ? item.key : index;
          
          return (
          <Text
            key={keyValue}
            ref={el => textRefs.current[index] = el}
            font="/fonts/BitcountSingleInk.ttf"
            fontSize={0.35}
            color={isNameItem ? "#FFFFFF" : "#00FF41"}  // White for names, green for numbers
            anchorX="center"
            anchorY="middle"
            letterSpacing={0.2}
            renderOrder={0}  // Changed to 0 for proper depth sorting
          >
            {String(textContent).toUpperCase()}
          </Text>
        );
      })}
      </group>
    </group>
  );
};

export default function Home3() {
  // Firestore data
  const topBurners = useFirestoreResults("burnedAmount");
  
  // State for overlay buttons (from home3/page)
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [isSceneLoading, setIsSceneLoading] = useState(true);
  const [fontLoaded, setFontLoaded] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [cloudsLoaded, setCloudsLoaded] = useState(false);
  const [showMusicControls, setShowMusicControls] = useState(false);
  const [emoji, setEmoji] = useState("😇");
  const [scrollY, setScrollY] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showNumerology, setShowNumerology] = useState(false);
  const [showDroneScreen, setShowDroneScreen] = useState(false);

  // Refs
  const secondTitleRef = useRef(null);
  const ctasRef = useRef(null);
  
  // useInView hooks
  // const ctasInView = useInView(ctasRef, { threshold: 0.3, once: true });
  const secondTitleInView = useInView(secondTitleRef, { 
    threshold: 0.1,  // Trigger when 10% visible (earlier trigger)
    triggerOnce: false,  // Allow re-triggering when scrolling up/down
    rootMargin: '0px 0px -20% 0px'  // Trigger 20% before element fully enters viewport
  });

  // Auth state
  const { isSignedIn } = useUser();

    const handleOpenModal = () => {
    if (!isSignedIn) {
      const btn = document.getElementById('hidden-sign-in-home3');
      btn?.click();
    } else {
      setIsModalOpen(true);
    }
  };
  
  
  // Get music context functions
  const {
    play,
    pause,
    isPlaying: contextIsPlaying,
    nextTrack,
    currentTrack,
    is80sMode
  } = useMusic();

  // Helper function to get responsive values (from home3/page)
  const getResponsiveValue = (mobile, tablet, tabletLandscape, desktop) => {
    if (isMobile) return mobile;
    return desktop; // Simplified for test page
  };

  // Font loading effect
  
  // Font loading effect
  useEffect(() => {
    let timeoutId;
    const checkFont = async () => {
      try {
        await document.fonts.load("1em 'UnifrakturCook'");
        await document.fonts.load("1em 'UnifrakturMaguntia'");
        await document.fonts.load("1em 'Fjalla One'");
        setFontLoaded(true);
        document.body.classList.add('fonts-loaded');
      } catch (e) {
        timeoutId = setTimeout(() => {
          setFontLoaded(true);
          document.body.classList.add('fonts-loaded');
        }, 1000);
      }
    };
    checkFont();
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  // Update loading state when font, model, and clouds are loaded
  useEffect(() => {
    if (fontLoaded && modelLoaded && cloudsLoaded) {
      setTimeout(() => {
        setIsSceneLoading(false);
      }, 500); // Small delay for smooth transition
    }
  }, [fontLoaded, modelLoaded, cloudsLoaded]);


  // Load Pirata One font
  // useEffect(() => {
  //   const link = document.createElement('link');
  //   link.href = 'https://fonts.googleapis.com/css2?family=Pirata+One&display=swap';
  //   link.rel = 'stylesheet';
  //   if (!document.querySelector('link[href*="Pirata+One"]')) {
  //     document.head.appendChild(link);
  //   }
  // }, []);

  // Initialize state
  useEffect(() => {
    setMounted(true);
    const checkDevice = () => {
      const width = window.innerWidth;
      const mobile = width <= 1024; // Increased breakpoint to catch more devices
      const isMobileValue = width <= 768; // 768px breakpoint for isMobile
      setIsMobile(isMobileValue);
      setIsMobileDevice(mobile);
      // Mobile detection: width, mobile, isMobileValue
    };
    
    // Handle scroll events - check all possible scroll sources
    const handleScroll = (event) => {
      // Try to find the actual scrolling element
      let currentScroll = 0;
      
      // Check if event target is scrolling
      if (event && event.target) {
        currentScroll = event.target.scrollTop || 0;
      }
      
      // Fallback to standard scroll detection
      if (currentScroll === 0) {
        const scrollingElement = document.scrollingElement || document.documentElement || document.body;
        currentScroll = scrollingElement.scrollTop || window.scrollY || window.pageYOffset || 0;
      }
      
      // Debug high scroll values
      // if (currentScroll > 9000) {
      //   console.log('High scroll detected:', currentScroll);
      // }
      
      setScrollY(currentScroll);
    };
    
    checkDevice();
    handleScroll(); // Set initial scroll position
    window.addEventListener('resize', checkDevice);
    
    // Add scroll listeners to multiple elements to catch the scroll
    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('scroll', handleScroll, { passive: true });
    document.body.addEventListener('scroll', handleScroll, { passive: true });
    
    // Add touch event handling for tablet scroll support
    let touchStartY = 0;
    let isScrolling = false;
    
    const handleTouchStart = (e) => {
      touchStartY = e.touches[0].clientY;
      isScrolling = false;
    };
    
    const handleTouchMove = (e) => {
      if (!isScrolling) {
        const touchY = e.touches[0].clientY;
        const deltaY = touchStartY - touchY;
        
        // If significant vertical movement, treat as scroll
        if (Math.abs(deltaY) > 5) {
          isScrolling = true;
          
          // Simulate scroll by updating scroll position
          const currentScroll = window.scrollY || document.documentElement.scrollTop || 0;
          const newScroll = Math.max(0, currentScroll + deltaY * 2); // Multiply for sensitivity
          
          window.scrollTo(0, newScroll);
          handleScroll(); // Update our scroll state
        }
      }
    };
    
    const handleTouchEnd = () => {
      isScrolling = false;
    };
    
    // Add touch event listeners for tablet support
    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
    
    // Track dynamically added listeners for cleanup
    const addedListeners = [];
    
    // Also check for scrolling on the main app container
    const checkForScrollContainer = () => {
      // Find all elements that might be scrolling
      const possibleContainers = document.querySelectorAll('div, main, section');
      possibleContainers.forEach(container => {
        if (container.scrollHeight > container.clientHeight) {
          // Found scrollable container
          container.addEventListener('scroll', handleScroll, { passive: true });
          addedListeners.push(container);
        }
      });
    };
    
    // Delay to ensure DOM is ready
    const timeoutId = setTimeout(checkForScrollContainer, 100);
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', checkDevice);
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('scroll', handleScroll);
      document.body.removeEventListener('scroll', handleScroll);
      
      // Remove touch event listeners
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      
      // Remove dynamically added listeners
      addedListeners.forEach(container => {
        container.removeEventListener('scroll', handleScroll);
      });
    };
  }, []);

  // Emoji animation
  useEffect(() => {
    const emojiInterval = setInterval(() => {
      setEmoji((prevEmoji) => (prevEmoji === "😇" ? "😈" : "😇"));
    }, 3000);
    return () => clearInterval(emojiInterval);
  }, []);

  // Keyboard shortcut for copying lighting values (commented out - uncomment if using GUI controls)
  // useEffect(() => {
  //   const handleKeyDown = (event) => {
  //     if ((event.ctrlKey || event.metaKey) && event.key === 'l') {
  //       event.preventDefault();
  //       copyAllLightingValues();
  //     }
  //   };

  //   document.addEventListener('keydown', handleKeyDown);
  //   return () => document.removeEventListener('keydown', handleKeyDown);
  // }, []);

  // Function to copy all lighting values (commented out - uncomment if using GUI controls)
  // const copyAllLightingValues = () => {
  //   const allValues = {
  //     timestamp: new Date().toISOString(),
  //     note: "Copy these values back into your React components",
  //     lighting: {
  //       spotlight: {
  //         position: "[7.4, 28, 19.9]",
  //         color: "#ffac00",
  //         angle: 0.02,
  //         decay: 0.97,
  //         distance: 300,
  //         penumbra: -0.3,
  //         intensity: 77
  //       },
  //       hemisphereLight: {
  //         skyColor: "#11c3f4c7",
  //         groundColor: "#ff00cc", 
  //         intensity: 1.2
  //       },
  //       cloudHemisphereLight: {
  //         skyColor: "#f5f5f5",
  //         groundColor: "#f2950b",
  //         intensity: 1.5,
  //         position: "[0, -20, -5]"
  //       }
  //     }
  //   };
  //   navigator.clipboard.writeText(JSON.stringify(allValues, null, 2));
  //   console.log('All lighting values copied to clipboard');
  // };

  // Sync showMusicControls with playing state
  useEffect(() => {
    if (contextIsPlaying && !showMusicControls) {
      setShowMusicControls(true);
    }
  }, [contextIsPlaying, showMusicControls]);


  return (
    <>
      {/* Loading Screen */}
      <CoinLoader loading={isSceneLoading} />
      
      <div style={{ 
        width: '100vw', 
        background: 'transparent', 
        minHeight: '100vh',
        height: 'auto',
        opacity: isSceneLoading ? 0 : 1,
        transition: 'opacity 0.5s ease-in-out',
      }}>
      {/* 3D Scene Background - Fixed viewport with scrolling camera */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh', // Keep canvas at viewport height
        zIndex: 5, // Medium z-index
        pointerEvents: 'auto', // Enable pointer events for drone screen interaction
        background: 'linear-gradient(to bottom, #87CEEB, #98D8E8, #B0E0E6)', // Sky gradient
      }}>
        <CleanCanvas
          camera={{ position: [0, -10, 40], fov: 40, near: 0.1, far: 300 }}
          gl={{
            antialias: false,
            powerPreference: 'high-performance',
            preserveDrawingBuffer: false, // Memory optimization
            alpha: true,
            premultipliedAlpha: false,
            stencil: false, // Disable stencil buffer if not needed
            depth: true,
            // clearColor: 0x000000,
            clearAlpha: 0,
          }}
          frameloop="always" // Keep for scroll animations
          dpr={[1, 1.5]} // Limit max DPR for performance
          style={{
            width: '100%',
            height: '100%',
            display: 'block',
          }}
        >
             {/* Removed background color to allow CSS3D to show through */}
                     {/* <SpotlightComponent /> */}

          {/* TEMPORARY: OrbitControls for inspection */}
          {/* <OrbitControls 
            enableDamping={true}
            dampingFactor={0.05}
            makeDefault
          /> */}
          
          <ambientLight intensity={0.5} />
          {/* Sunset glow lighting */}
          <HemisphereLightComponent />
          <directionalLight 
            position={[-20, 10, -10]} 
            color="#ff50ee" 
            intensity={1.5}
            castShadow={false}
          />

          
          <Suspense fallback={null}>
            <GradientSkySphere />
            {/* <LayeredClouds scrollY={scrollY} /> */}
            <EnhancedVolumetricLight scrollY={scrollY}
              // position={[0, Math.min(50 + scrollY * 0.035, 150), 0]} 
              // target={[3, Math.min(-50 + scrollY * 0.035, 50), -5]}
              // color="#d89d12ff"
              // intensity={1.5}
            />
            <Model scrollY={scrollY} isMobile={isMobile} onLoad={() => setModelLoaded(true)} />
            {/* <VideoScreens /> */}
            {/* Breath that follows the same scroll animation as the bull */}
            <ScrollingBreath scrollY={scrollY} isMobile={isMobile} />
            
            {/* Drone with Screen1 display with interactive screen */}
            <DroneModel 
              position={[0, 5, -5]} 
              scrollY={scrollY}
              isMobile={isMobile}
            />
            
            {/* Angel Model with playful swoop animation */}
            <AngelModel 
              scrollY={scrollY}
              isMobile={isMobile}
            />
            
            {/* Devil Model with playful swoop animation (appears at end) */}
            <DevilModel 
              scrollY={scrollY}
              isMobile={isMobile}
            />
            
            {/* Manual click handler component */}
            <ClickHandler />
            
            {/* CSS3D Screen replaced with video texture on Screen1 mesh */}
            
            {/* Neural Network Visualization */}
            {/* <NeuralNetworkR3F 
              theme={0}
              formation={0}
              density={70}
              position={[0, -10, -10]}
              scale={0.5}
              enableInteraction={true}
            /> */}
            
            <ScrollClouds scrollY={scrollY} onLoad={() => setCloudsLoaded(true)} />
            {/* Additional point lights for desktop only */}
 
            <PostProcessingEffects />
          </Suspense>
          {/* Performance Monitor - Shows FPS, MS, MB */}
          <Stats className="perf-monitor" />
        </CleanCanvas>
      </div>
      
      {/* Screen now uses video texture directly on the 3D mesh */}

      {/* Leva Controls Panel - positioned middle right */}
      {/* <Leva
        fill={false}
        flat={false}
        oneLineLabels={false}
        hideCopyButton={false}
        titleBar={true}
        collapsed={false}
        theme={{
          colors: {
            elevation1: 'rgba(40, 40, 40, 0.9)',
            elevation2: 'rgba(60, 60, 60, 0.9)',
            elevation3: 'rgba(80, 80, 80, 0.9)',
            accent1: '#ff8c00',
            accent2: '#ffa500',
            accent3: '#ffb84d',
            highlight1: 'rgba(255, 140, 0, 0.2)',
            highlight2: 'rgba(255, 165, 0, 0.4)',
            highlight3: 'rgba(255, 184, 77, 0.6)',
          }
        }}
        style={{
          position: 'fixed',
          top: 'calc(50% + 400px)',
          right: '20px',
          transform: 'translateY(-50%)',
          zIndex: 1000,
          maxHeight: '80vh',
          overflowY: 'auto',
          backdropFilter: 'blur(10px)',
          borderRadius: '8px',
          border: '1px solid rgba(255, 140, 0, 0.3)'
        }}
      /> */}

      {/* Scrollable Overlay Content - Allow clicks to pass through to 3D canvas */}
 <div style={{
          position: 'relative',
          width: '100%',
          minHeight: '100vh',
          zIndex: 10,
          pointerEvents: 'auto',
          opacity: isSceneLoading ? 0 : 1,
          transition: 'opacity 0.5s ease-in-out',
        }}>
  <div style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          paddingTop: '3rem',
          minHeight: '100vh',
        }}>
          
          <h1 className='custom-title'
              id="main-title"
              style={{ 
              position: "relative",
              left: isMobile ? "-10%" : "-25%",
              color: "#d4af37",
              fontFamily: 'UnifrakturCook, serif',
              textShadow: `
                0 0 10px rgba(212, 175, 55, 0.8),
                0 0 20px rgba(212, 175, 55, 0.6),
                0 0 30px rgba(212, 175, 55, 0.8),
                6px 6px 16px rgba(0, 0, 0, 1),
                -2px -2px 8px rgba(255, 192, 203, 0.7),
                0 0 100px rgba(212, 175, 55, 0.1)
              `,
              fontSize: getResponsiveValue("4rem", "5rem", "5rem", "5rem"),
              fontWeight: 900,
              lineHeight: 0.8,
              transform: isMobile ? "rotate(-5deg)" : "rotate(-8deg) skew(-15deg)",
              zIndex: 1000,
              whiteSpace: isMobile ? 'normal' : 'nowrap',
              cursor: 'pointer',
              marginTop: isMobile ? '1rem' : '3rem',
              pointerEvents: 'auto',
            }}>
              <span className="title-line" style={{ display: 'block', position: 'relative' }}>Our Lady</span>
              <span className="title-line" style={{ display: 'block', position: 'relative' }}>
                <span style={{ fontSize: isMobile ? "1.2rem" : "3rem" }}>of    </span>
                Perpetual
              </span>
              <span className="title-line" style={{ display: 'block', marginLeft: isMobile ? "2rem" : "6rem", position: 'relative' }}>Profit</span>
            </h1>

        </div>
        
      </div>


      {/* Top Controls Container - Music, User, and Nav (from home3/page) */}
      {mounted && !isSceneLoading && (
      <div
        style={{
          position: "fixed",
          top: "20px",
          right: "20px",
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          gap: isMobile ? "10px" : "15px",
          alignItems: isMobile ? "flex-end" : "center",
          zIndex: 9999,
          opacity: isSceneLoading ? 0 : 1,
          transition: "opacity 0.5s ease-in-out"
        }}
      >
        {/* Music Controls */}
        <div style={{ order: isMobileDevice ? 2 : 0 }}>
          {!showMusicControls ? (
            <button
              onClick={() => {
                setShowMusicControls(true);
                if (!contextIsPlaying) {
                  play();
                }
              }}
              style={{
                width: isMobile ? "2.5rem" : "3.75rem",
                height: isMobile ? "2.5rem" : "3.75rem",
                borderRadius: "0.5rem",
                backgroundColor: "rgba(0, 0, 0, 0.7)",
                border: "2px solid rgba(255, 255, 255, 0.2)",
                color: "#ffffff",
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
                width={isMobile ? "20" : "30"}
                height={isMobile ? "20" : "30"}
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
                gap: "0.5rem",
              }}
            >

              <div
                className={contextIsPlaying ? "spinning-record" : ""}
                style={{
                  width: isMobile ? "2.5rem" : "3.75rem",
                  height: isMobile ? "2.5rem" : "3.75rem",
                  borderRadius: "50%",
                  backgroundImage: "url('/virginRecords.jpg')",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
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
                  width: isMobile ? "2rem" : "3rem",
                  height: isMobile ? "2rem" : "3rem",
                  borderRadius: "0.375rem",
                  backgroundColor: "rgba(0, 0, 0, 0.7)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  color: "white",
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
                <svg width={isMobile ? "16" : "24"} height={isMobile ? "16" : "24"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                  width: isMobile ? "1.75rem" : "2.625rem",
                  height: isMobile ? "1.75rem" : "2.625rem",
                  borderRadius: "0.375rem",
                  backgroundColor: "rgba(0, 0, 0, 0.7)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  color: "white",
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
                <svg width={isMobile ? "14" : "21"} height={isMobile ? "14" : "21"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          )}
        </div>
        
        {/* User Account */}
        <div style={{ order: isMobileDevice ? 1 : 1, pointerEvents: 'auto', zIndex: 10, position: 'relative' }}>
          {isSignedIn ? (
            <Illumin80ClerkButton afterSignOutUrl="/" isMobileDevice={isMobileDevice} />
          ) : (
            <SignInButton mode="modal" forceRedirectUrl="/home3">
              <button
                style={{
            width: isMobile ? "2.5rem" : "3.75rem",
                height: isMobile ? "2.5rem" : "3.75rem",
                  borderRadius: "0.5rem",
                  backgroundColor: "rgba(0, 0, 0, 0.7)",
                  border: "2px solid rgba(255, 255, 255, 0.2)",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
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
        <div style={{ order: isMobileDevice ? 0 : 2, pointerEvents: 'auto', zIndex: 10, position: 'relative' }}>
          <CyberNav is80sMode={is80sMode} position="relative" />
        </div>
        
        {/* Social Bar */}
        {/* <div style={{ order: isMobileDevice ? 4 : 3 }}>
          <SocialBar is80sMode={is80sMode} />
        </div> */}
        
        {/* Global Copy Lighting Values Button (commented out - uncomment if using GUI controls) */}
        {/* <div style={{ order: isMobileDevice ? 5 : 4 }}>
          <button
            onClick={copyAllLightingValues}
            style={{
              width: isMobileDevice ? "2.5rem" : "3.75rem",
              height: isMobileDevice ? "2.5rem" : "3.75rem",
              borderRadius: "0.5rem",
              backgroundColor: "rgba(0, 0, 0, 0.7)",
              border: "2px solid rgba(255, 215, 0, 0.4)",
              color: "#ffd700",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.3s ease",
              backdropFilter: "blur(10px)",
              boxShadow: "0 0.125rem 0.5rem rgba(0, 0, 0, 0.3)",
            }}
            title="Copy All Lighting Values (Ctrl/Cmd + L)"
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(255, 215, 0, 0.8)";
              e.currentTarget.style.backgroundColor = "rgba(255, 215, 0, 0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(255, 215, 0, 0.4)";
              e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
            }}
          >
            📋
          </button>
        </div> */}
      </div>
      )}

      {/* Welcome Section with DropInTitle */}
      {/* <motion.div
        style={{
          position: isMobile ? "relative" : "absolute",
          top: isMobile ? 0 : "100vh",
          marginTop: isMobile ? "100vh" : 0,
          left: 0,
          right: 0,
          minHeight: "1200vh", // Extended for longer cloud descent
          // background: "linear-gradient(to bottom, transparent, rgba(0,0,0,0.8), rgba(0,0,0,0.9))",
          zIndex: 1,
          pointerEvents: "auto", // Keep auto to allow scrolling
        }}
        className="welcome-banner"
      > */}
        <div 
          ref={(el) => { 
            if (el) el.titleRef = el; 
          }}
          style={{
            textAlign: 'center',
            padding: isMobile ? '2rem 1rem' : '5rem 2.8rem',
            // maxWidth: '900px',
            margin: '0 auto',
          }}
        >
          {/* Animated Drop-In Title with scroll trigger */}
          <ScrollTriggeredTitle isMobile={isMobile} />
        </div>

       
        

        {/* Additional content sections */}

        

        {/* Extended scroll space for longer page */}
        <div style={{
          position: 'relative',
          height: '500vh',
          width: '100%',
          zIndex: 1,
          pointerEvents: 'none', // Don't block interactions
        }} />
        
        {/* Feature Carousel Section - Hybrid Approach */}
        <div style={{
          position: 'relative',
          margin: '6rem auto',
          width: '100%',
          zIndex: 10,
          pointerEvents: 'auto',
        }}>
          {/* <div style={{
            textAlign: 'center',
            marginBottom: '3rem',
          }}>
            <SkewedHeading
              lines={["EXPLORE", "FEATURES"]}
              fontSize={isMobile ? "2.5rem" : "3.5rem"}
              color="#00ff9d"
              skewAngle={-2}
              shadowColor="#000"
            />
            <p style={{
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: isMobile ? '0.9rem' : '1rem',
              marginTop: '1rem',
            }}>
              Swipe through our key features and discover the power of RL80
            </p>
          </div> */}
          {/* <FeatureCarousel
            slides={[
              <WatchlistSlide key="watchlist" />,
              <Illumin80Slide key="illumin80" />,
              <TradingDeskSlide key="trading" />,
              <TokenomicsSlide key="tokenomics" />,
            ]}
            autoRotate={true}
            rotationInterval={7000}
          /> */}
        </div>


       

                        <div style={{position: 'relative', zIndex: 10, pointerEvents: 'auto', marginTop: '300vh', marginBottom: '1rem'}}>
                         <div ref={secondTitleRef} style={{
                                  textAlign: 'center',
                                  padding: isMobile ? '3rem 1.5rem' : '5rem 2rem',
                                  maxWidth: '900px',
                                  margin: '0 auto',
                                }}>
                                  {/* Animated Drop-In Title */}
                                  <DropInTitle
                                    lines={["PROSPER80", "FOR ALL", "HUMAN80!"]}
                                    colors={["#00ff00", "#f4e4c1", "#ffd700"]}
                                    fontSize={{ mobile: "2.5rem", desktop: "4rem" }}
                                    isMobile={isMobile}
                                    triggerAnimation={secondTitleInView}
                                  />
                        </div>
                                 </div>
{/* Combined Token Information Section */}
     

        


     

        
        {/* Additional scroll space before footer */}
        <div style={{
          position: 'relative',
          height: '200vh',
          width: '100%',
          zIndex: 1,
        }} />
        
        {/* Footer - at the bottom of all content */}
        <div style={{ pointerEvents: 'auto', position: 'relative', zIndex: 10 }}>
          <Footer isMobile={isMobile} />
        </div>


      {/* </motion.div> */}

      Add spinning record CSS and fonts
      <style jsx global>{`
        /* Performance Monitor Styling */
        .perf-monitor {
          position: fixed !important;
          top: 10px !important;
          left: 10px !important;
          z-index: 10000 !important;
          transform: scale(0.5) !important;
          transform-origin: top left !important;
          opacity: 0.8 !important;
        }
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        html {
          width: 100%;
          height: auto;
          margin: 0;
          padding: 0;
          overflow-x: hidden;
          overflow-y: auto;
          box-sizing: border-box;
          scroll-behavior: auto;
          touch-action: pan-y; /* Allow vertical scrolling on touch devices */
        }
        
        body {
          width: 100%;
          height: auto;
          margin: 0;
          padding: 0;
          overflow-x: hidden;
          overflow-y: visible;
          box-sizing: border-box;
          touch-action: pan-y; /* Allow vertical scrolling on touch devices */
        }
        
        body > div:first-child {
          height: auto;
          min-height: 100vh;
        }
        
        #__next {
          height: auto;
          min-height: 100vh;
        }
        
        canvas {
          display: block !important;
          width: 100% !important;
          height: 100% !important;
        }
        
        @font-face {
          font-family: 'UnifrakturCook';
          src: url('/fonts/UnifrakturCook-Bold.ttf') format('truetype');
          font-weight: bold;
          font-style: normal;
          font-display: swap;
        }
        
        @font-face {
          font-family: 'UnifrakturMaguntia';
          src: url('/fonts/UnifrakturMaguntia-Regular.ttf') format('truetype');
          font-weight: normal;
          font-style: normal;
          font-display: swap;
        }

          @font-face {
          font-family: 'Bowlby One SC';
          src: url('/fonts/BowlbyOneSC-Regular.ttf') format('truetype');
          font-weight: normal;
          font-style: normal;
          font-display: swap;
        }
        /* Desktop rotating text - larger size */
        .desktop-rotating-text .rotating-text-body {
          font-size: 4rem !important;
        }
        
        .desktop-rotating-text .t3xts {
          height: 70px !important;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes glow {
          0% { filter: drop-shadow(0 0 25px rgba(0, 255, 0, 0.4)) drop-shadow(0 0 50px rgba(255, 215, 0, 0.2)); }
          100% { filter: drop-shadow(0 0 35px rgba(0, 255, 0, 0.6)) drop-shadow(0 0 60px rgba(255, 215, 0, 0.3)); }
        }

        @keyframes handsRotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes statsRotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .spinning-record {
          animation: spin 3s linear infinite;
        }
        
        /* Complete 3D Coin CSS from coin.css */
        :root {
          --coin-diam: 6.75rem;
          --coin-depth: calc(var(--coin-diam) * 0.1);
          --spin-speed: 4s;
          --facets: 32;
          --spokes: calc(var(--facets) / 2);
          --facet-length: calc(var(--coin-diam) * sin(calc(3.14159 / var(--facets))));
          --facet-angle: calc((180deg - (360deg / var(--facets))) / 2);
        }

        .purse {
          height: var(--coin-diam);
          width: var(--coin-diam);
          position: relative;
          margin: 0 auto;
          perspective: 1000px;
          filter: saturate(1.45) hue-rotate(2deg);
        }

        .coin {
          height: var(--coin-diam);
          width: var(--coin-diam);
          position: absolute;
          transform-style: preserve-3d;
          transform-origin: 50%;
          animation: spinCoin 7s infinite linear;
          cursor: pointer;
        }

        .coin .front,
        .coin .back {
          position: absolute;
          height: var(--coin-diam);
          width: var(--coin-diam);
          border-radius: 50%;
          background-size: cover;
        }

        .coin .front {
          transform: translateZ(calc(var(--coin-depth) / 2));
          background-image: url("/coinFront.png");
        }

        .coin .back {
          transform: translateZ(calc(var(--coin-depth) / -2)) rotateY(180deg);
          background-image: url("/coinBack1.png");
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .coin .back::after {
          content: "CLICK TO BUY!";
          color: #000000ff;
          font-family: 'FjallaOne', serif;
          font-size: calc(var(--coin-diam) * 0.15);
          font-weight: bold;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
          background: linear-gradient(135deg, rgb(255, 215, 0), rgb(212, 175, 55), rgb(184, 134, 11));
          width: calc(var(--coin-diam) * 0.85);
          height: calc(var(--coin-diam) * 0.85);
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          text-align: center;
          line-height: 1.2;
          border: 3px solid #fff;
          box-shadow: 
            0 0 20px rgba(255, 215, 0, 0.8),
            0 0 40px rgba(255, 215, 0, 0.4),
            inset 0 2px 0 rgba(255, 255, 255, 0.3),
            inset 0 -2px 0 rgba(0, 0, 0, 0.3);
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        .coin .side {
          transform: translateX(calc(var(--coin-diam) * 0.45));
          transform-style: preserve-3d;
          backface-visibility: hidden;
        }

        .coin .side .spoke {
          height: var(--coin-diam);
          width: var(--coin-depth);
          position: absolute;
          transform-style: preserve-3d;
          backface-visibility: hidden;
        }

        .coin .side .spoke::before,
        .coin .side .spoke::after {
          content: "";
          display: block;
          height: var(--facet-length);
          width: var(--coin-depth);
          position: absolute;
          background: hsl(42, 52%, 68%);
          background: linear-gradient(
            to bottom,
            hsl(42, 60%, 75%) 0%,
            hsl(42, 60%, 75%) 74%,
            hsl(42, 40%, 60%) 75%,
            hsl(42, 40%, 60%) 100%
          );
          background-size: 100% calc((var(--facets) * var(--facet-length)) / 144);
          transform: rotateX(var(--facet-angle));
        }

        .coin .side .spoke::before {
          transform-origin: top center;
        }

        .coin .side .spoke::after {
          bottom: 0;
          transform-origin: center bottom;
        }

        .coin .side .spoke:nth-child(1) { transform: rotateY(90deg) rotateX(calc(180deg / var(--spokes) * 0)); }
        .coin .side .spoke:nth-child(2) { transform: rotateY(90deg) rotateX(calc(180deg / var(--spokes) * 1)); }
        .coin .side .spoke:nth-child(3) { transform: rotateY(90deg) rotateX(calc(180deg / var(--spokes) * 2)); }
        .coin .side .spoke:nth-child(4) { transform: rotateY(90deg) rotateX(calc(180deg / var(--spokes) * 3)); }
        .coin .side .spoke:nth-child(5) { transform: rotateY(90deg) rotateX(calc(180deg / var(--spokes) * 4)); }
        .coin .side .spoke:nth-child(6) { transform: rotateY(90deg) rotateX(calc(180deg / var(--spokes) * 5)); }
        .coin .side .spoke:nth-child(7) { transform: rotateY(90deg) rotateX(calc(180deg / var(--spokes) * 6)); }
        .coin .side .spoke:nth-child(8) { transform: rotateY(90deg) rotateX(calc(180deg / var(--spokes) * 7)); }
        .coin .side .spoke:nth-child(9) { transform: rotateY(90deg) rotateX(calc(180deg / var(--spokes) * 8)); }
        .coin .side .spoke:nth-child(10) { transform: rotateY(90deg) rotateX(calc(180deg / var(--spokes) * 9)); }
        .coin .side .spoke:nth-child(11) { transform: rotateY(90deg) rotateX(calc(180deg / var(--spokes) * 10)); }
        .coin .side .spoke:nth-child(12) { transform: rotateY(90deg) rotateX(calc(180deg / var(--spokes) * 11)); }
        .coin .side .spoke:nth-child(13) { transform: rotateY(90deg) rotateX(calc(180deg / var(--spokes) * 12)); }
        .coin .side .spoke:nth-child(14) { transform: rotateY(90deg) rotateX(calc(180deg / var(--spokes) * 13)); }
        .coin .side .spoke:nth-child(15) { transform: rotateY(90deg) rotateX(calc(180deg / var(--spokes) * 14)); }
        .coin .side .spoke:nth-child(16) { transform: rotateY(90deg) rotateX(calc(180deg / var(--spokes) * 15)); }

        @keyframes spinCoin {
          0% { transform: rotateY(0deg); }
          25% { transform: rotateY(0deg); }
          37.5% { transform: rotateY(540deg); }
          62.5% { transform: rotateY(540deg); }
          75% { transform: rotateY(1080deg); }
          100% { transform: rotateY(1080deg); }
        }
       /* Override the font hiding rule for our title */
        .custom-title {
          font-family: 'UnifrakturCook', 'UnifrakturMaguntia', serif !important;
          visibility: visible !important;
          display: block !important;
          opacity: 1 !important;
        }

        .footer-title {
          font-family: 'UnifrakturCook', serif !important;
          visibility: visible !important;
          opacity: 1 !important;
        }
        
        .custom-title span {
          visibility: visible !important;
          opacity: 1 !important;
        }
        
        
        /* Custom scrollbar for leaderboard */
        .leaderboard-scroll::-webkit-scrollbar {
          width: 6px;
        }
        
        .leaderboard-scroll::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 3px;
        }
        
        .leaderboard-scroll::-webkit-scrollbar-thumb {
          background: rgba(212, 175, 55, 0.5);
          border-radius: 3px;
        }
        
        .leaderboard-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(212, 175, 55, 0.7);
        }
        
        /* Simple Leva positioning fix */
        [data-leva-root] {
          top: 3rem !important;
          z-index: 10000 !important;
        }
        
        /* Canvas pointer events handled inline */
      `}</style>
      
      <CompactCandleModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCandleCreated={() => {
          // Monitor real memory usage
          if (performance.memory) {
            console.log('Memory:', (performance.memory.usedJSHeapSize / 1048576).toFixed(1) + 'MB');
          }
        }}
      />
      
      {/* Floating Action Bar - Only show after scrolling past halfway point */}
      {/* {scrollY > (isMobile ? 1800 : 2400) && (
        <CyberFloatingBar isMobile={isMobile} />
      )} */}
      
    </div>
    </>
  );
}