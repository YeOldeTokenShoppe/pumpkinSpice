"use client";

import React, { useRef, Suspense, useEffect, useState } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, useAnimations, Cloud, Clouds } from '@react-three/drei';
import * as THREE from 'three';
import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';
import DarkClouds from '@/components/Clouds';
import PostProcessingEffects from '@/components/PostProcessingEffects';
import { ParallaxGroup } from '@/components/ParallaxGroup';
import CoinInline from '@/components/CoinInline';
import { useMusic } from '@/components/MusicContext';
import { useUser, SignInButton } from "@clerk/nextjs";
import { Illumin80ClerkButton } from "@/components/Illumin80Display";
import CyberNav from '@/components/CyberNav';

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
// Apply bloom effect to Halo mesh
function GradientSkySphere() {
  return (
    <mesh scale={[500, 500, 500]}>
      <sphereGeometry args={[1, 32, 32]} />
      <gradientSkyMaterial 
        side={THREE.BackSide}
        topColor={new THREE.Color(0x1a0033)} // Dark violet
        middleColor={new THREE.Color(0x87CEEB)} // Light blue
        bottomColor={new THREE.Color(0x0a001a)} // Dark blue/almost black
      />
    </mesh>
  );
}

function DirectionalLightWithHelper() {
  const directionalLightRef = useRef();
  const targetRef = useRef();

  useEffect(() => {
    if (directionalLightRef.current && targetRef.current) {
      directionalLightRef.current.target = targetRef.current;
    }
  }, []);

  return (
    <>
      <directionalLight
        ref={directionalLightRef}
        position={[15, 15, -10]}
        intensity={10}
        color="#ffffff"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <mesh ref={targetRef} position={[-5, -10, -20]} visible={false}>
        <boxGeometry args={[0.1, 0.1, 0.1]} />
      </mesh>
    </>
  );
}

function SpotlightWithHelper() {
  const spotlightRef = useRef();
  const targetRef = useRef();

  useEffect(() => {
    if (spotlightRef.current && targetRef.current) {
      spotlightRef.current.target = targetRef.current;
    }
  }, []);

  return (
    <>
      <spotLight
        ref={spotlightRef}
        position={[-5, 25, 10]}
        intensity={20}
        angle={Math.PI / 6}
        penumbra={0.3}
        distance={45}
        color="#ffffff"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <mesh ref={targetRef} position={[0, -10, -20]} visible={false}>
        <boxGeometry args={[0.1, 0.1, 0.1]} />
      </mesh>
    </>
  );
}

function OurLadyRiderModel({ isMobile, scrollY }) {
  const { scene } = useGLTF('/models/ourlady_rider6.glb');
  const modelRef = useRef();

  
  React.useEffect(() => {
    if (scene) {
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
    }
  }, [scene]);

  useFrame(() => {
    if (modelRef.current) {
      // Move model up as user scrolls down (creates descending effect)
      modelRef.current.position.y = (isMobile ? -13 : -13) + scrollY * 0.015;
    }
  });

  return (
    <primitive 
      ref={modelRef}
      object={scene} 
      scale={isMobile ? [10, 10, 10] : [10, 10, 10]}
      position={isMobile ? [2, -13, -18] : [6, -13, -18]}
      rotation={isMobile ? [0, -2.8, 0] : [0, -2.8, 0]}
    />
  );
}

function AngelEmojiModel({ isMobile, scrollY }) {
  const { scene, animations } = useGLTF('/models/angelEmojji.glb');
  const { actions } = useAnimations(animations, scene);
  const modelRef = useRef();

  useEffect(() => {
    // Log all available animations
    console.log('Angel Emoji Animations:', animations);
    if (animations && animations.length > 0) {
      console.log('Available animation names:');
      animations.forEach((clip, index) => {
        console.log(`Animation ${index}: "${clip.name}"`);
      });
      
      // Play all animations simultaneously
      animations.forEach((clip) => {
        if (actions[clip.name]) {
          console.log(`Playing animation: "${clip.name}"`);
          actions[clip.name].play();
        }
      });
    } else {
      console.log('No animations found in angelEmojji.glb');
    }

    // Enable shadows on the model
    if (scene) {
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
    }
  }, [animations, actions, scene]);

  // Orbit around center point and billboard effect
  useFrame((state, delta) => {
    if (!modelRef.current) return;
    
    const time = state.clock.elapsedTime;
    
    // Orbit parameters (adjusted for mobile)
    const orbitRadius = isMobile ? 15 : 25; // Smaller radius on mobile
    const orbitSpeed = 0.5; // Speed of orbit
    const orbitHeight = isMobile ? -2 : 0; // Lower on mobile
    const bobAmount = isMobile ? 1.5 : 3; // Less bobbing on mobile
    const centerX = isMobile ? 0 : 5; // Center on mobile
    const centerZ = isMobile ? -10 : -15; // Closer on mobile
    
    // Calculate orbital position
    const angle = time * orbitSpeed;
    modelRef.current.position.x = centerX + Math.cos(angle) * orbitRadius;
    modelRef.current.position.z = centerZ + Math.sin(angle) * orbitRadius;
    modelRef.current.position.y = orbitHeight + Math.sin(time * 2) * bobAmount + scrollY * 0.015;
    
    // Billboard - make model face the camera
    modelRef.current.lookAt(state.camera.position);
  });

  return (
    <primitive 
      ref={modelRef}
      object={scene} 
      scale={isMobile ? [0.7, 0.7, 0.7] : [1, 1, 1]}
      position={[0, 0, 0]}  // Initial position (will be overridden by animation)
      rotation={[0, 0, 0]}
    />
  );
}

function DevilEmojiModel({ isMobile, scrollY }) {
  const { scene, animations } = useGLTF('/models/devilEmoji.glb');
  const { actions } = useAnimations(animations, scene);
  const modelRef = useRef();

  useEffect(() => {
    // Log available animation
    console.log('Devil Emoji Animations:', animations);
    if (animations && animations.length > 0) {
      animations.forEach((clip, index) => {
        console.log(`Animation ${index}: "${clip.name}"`);
      });
      
      // Play the Armature|Idle animation
      const idleAnimation = animations.find(clip => clip.name === 'Armature|Idle') || animations[0];
      if (idleAnimation && actions[idleAnimation.name]) {
        console.log(`Playing animation: "${idleAnimation.name}"`);
        actions[idleAnimation.name].play();
      }
    }

    // Enable shadows on the model
    if (scene) {
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
    }
  }, [animations, actions, scene]);

  // Orbit around center point (opposite side from angel) and billboard effect
  useFrame((state, delta) => {
    if (!modelRef.current) return;
    
    const time = state.clock.elapsedTime;
    
    // Orbit parameters (adjusted for mobile)
    const orbitRadius = isMobile ? 15 : 25; // Smaller radius on mobile
    const orbitSpeed = 0.5; // Speed of orbit
    const orbitHeight = isMobile ? -2 : 0; // Lower on mobile
    const bobAmount = isMobile ? 1.5 : 3; // Less bobbing on mobile
    const centerX = isMobile ? 0 : 5; // Center on mobile
    const centerZ = isMobile ? -10 : -15; // Closer on mobile
    
    // Calculate orbital position (start 180 degrees opposite from angel)
    const angle = time * orbitSpeed + Math.PI;
    modelRef.current.position.x = centerX + Math.cos(angle) * orbitRadius;
    modelRef.current.position.z = centerZ + Math.sin(angle) * orbitRadius;
    modelRef.current.position.y = orbitHeight + Math.sin(time * 2 + Math.PI) * bobAmount + scrollY * 0.015; // Opposite phase bobbing
    
    // Billboard - make model face the camera
    modelRef.current.lookAt(state.camera.position);
  });

  return (
    <primitive 
      ref={modelRef}
      object={scene} 
      scale={isMobile ? [0.7, 0.7, 0.7] : [1, 1, 1]}
      position={[0, 0, 0]}  // Initial position (will be overridden by animation)
      rotation={[0, 0, 0]}
    />
  );
}

// Scene component that responds to scroll
function Scene({ isMobile, scrollY }) {
  const { camera } = useThree();
  
  useFrame(() => {
    // Move camera down as user scrolls (creates ascending effect through clouds)
    // Limit the camera movement to prevent going too far
    const maxScroll = window.innerHeight * 2;
    const scrollProgress = Math.min(scrollY / maxScroll, 1);
    camera.position.y = (isMobile ? -2 : -2) - scrollProgress * 15;
  });

  return (
    <>
      <ambientLight intensity={1.5} />
      <DirectionalLightWithHelper />
      <pointLight position={[-2, 2, -1]} intensity={1.5} />
      
      <SpotlightWithHelper />
      
      <GradientSkySphere />
      
      <Suspense fallback={null}>
        {/* Background layer - moves slowest */}
        <group position={[-1, -2.5 + scrollY * 0.008, -6]}>
          <DarkClouds />
        </group>

        {/* Foreground layer - moves faster */}
        <OurLadyRiderModel isMobile={isMobile} scrollY={scrollY} />
        <AngelEmojiModel isMobile={isMobile} scrollY={scrollY} />
        <DevilEmojiModel isMobile={isMobile} scrollY={scrollY} />
      </Suspense>
      <Suspense></Suspense>
      <PostProcessingEffects is80sMode={false} />
      <OrbitControls 
        enablePan={false}
        enableZoom={false}
        enableRotate={false}
        enableDamping={false}
        touches={{ ONE: null, TWO: null }} // Disable touch controls to allow scrolling
        target={isMobile ? [-45, 1.5 - scrollY * 0.015, -100] : [-50, 1.5 - scrollY * 0.015, -100]}
      />
    </>
  );
}

export default function Home2() {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  // Initialize with false to avoid hydration mismatch
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isTabletLandscape, setIsTabletLandscape] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  
  // Ref for sparkle effect
  const coinRef = useRef(null);
  
  // Auth state
  const { isSignedIn } = useUser();
  
  // Get music context functions
  const {
    play,
    pause,
    isPlaying: contextIsPlaying,
    nextTrack,
    currentTrack,
    is80sMode
  } = useMusic();
  
  // Show music controls if music is already playing
  const [showMusicControls, setShowMusicControls] = useState(contextIsPlaying);
  
  // Sync showMusicControls with playing state when it changes
  useEffect(() => {
    if (contextIsPlaying && !showMusicControls) {
      setShowMusicControls(true);
    }
  }, [contextIsPlaying, showMusicControls]);
  
  const contractAddress = '0x1234567890123456789012345678901234567890'; // Replace with actual contract address
  
  const handleCopyAddress = () => {
    navigator.clipboard.writeText(contractAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  // Helper function to get responsive values
  const getResponsiveValue = (mobile, tablet, tabletLandscape, desktop) => {
    if (isMobile) return mobile;
    if (isTablet && !isTabletLandscape) return tablet;  // Tablet portrait
    if (isTabletLandscape) return tabletLandscape;      // Tablet landscape
    return desktop;
  };

  useEffect(() => {
    // Set mounted to true after hydration
    setMounted(true);
    setIsClient(true);
    setPageLoading(false);
    
    // Check device type and orientation - only run on client
    const checkDevice = () => {
      if (typeof window === 'undefined') return;
      
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      // Mobile: up to 768px
      const mobile = width <= 768;
      setIsMobile(mobile);
      setIsMobileView(mobile);
      
      // Tablet: 768px to 1024px (includes both orientations)
      const tablet = width > 768 && width <= 1024;
      setIsTablet(tablet);
      
      // Tablet landscape: when tablet AND width > height
      const tabletLandscape = tablet && width > height;
      setIsTabletLandscape(tabletLandscape);
    };
    
    // Run check after mount to avoid hydration issues
    checkDevice();
    window.addEventListener('resize', checkDevice);
    window.addEventListener('orientationchange', checkDevice);
    
    // Handle scroll with passive listener for better mobile performance
    const handleScroll = () => {
      setScrollY(window.scrollY || window.pageYOffset || document.documentElement.scrollTop);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Enable scrolling on body for mobile
    if (typeof window !== 'undefined') {
      document.body.style.overflow = 'auto';
      document.body.style.height = 'auto';
      document.documentElement.style.overflow = 'auto';
      document.documentElement.style.height = 'auto';
    }
    
    return () => {
      window.removeEventListener('resize', checkDevice);
      window.removeEventListener('orientationchange', checkDevice);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
  
  useEffect(() => {
    // Load local fonts that are declared in globals.css
    const loadFonts = async () => {
      try {
        // Force load the local fonts
        await document.fonts.load('700 1rem UnifrakturCook');
        await document.fonts.load('400 1rem UnifrakturMaguntia');
      
        setFontsLoaded(true);
        // Add fonts-loaded class to HTML element as required by layout.js
        document.documentElement.classList.add('fonts-loaded');
      } catch (error) {
  
        // Even if error, try to show with fonts
        setFontsLoaded(true);
        document.documentElement.classList.add('fonts-loaded');
      }
    };
    
    // Check if fonts are already loaded
    if (document.fonts.check('700 1rem UnifrakturCook')) {
      setFontsLoaded(true);
      document.documentElement.classList.add('fonts-loaded');
    } else {
      loadFonts();
    }
  }, []);
 // Sparkle effect for coin
 useEffect(() => {
  // Wait for client and page to be ready
  if (!isClient || !coinRef.current) {
    return;
  }

  const sparkle = coinRef.current;

  const MAX_STARS = 60;
  const STAR_INTERVAL = 16;

  const MAX_STAR_LIFE = 3;
  const MIN_STAR_LIFE = 1;

  const MAX_STAR_SIZE = 40;
  const MIN_STAR_SIZE = 20;

  const MIN_STAR_TRAVEL_X = 100;
  const MIN_STAR_TRAVEL_Y = 100;

  const randomLimitedColor = () => {
    const randomHue = (() => {
      const ranges = [
        { min: 120, max: 150 }, // Blues
        { min: 270, max: 290 }, // Violets/Purples
        { min: 45, max: 60 }, // Yellows and Golds
      ];
      const range = ranges[Math.floor(Math.random() * ranges.length)];
      return (
        Math.floor(Math.random() * (range.max - range.min + 1)) + range.min
      );
    })();

    return `hsla(${randomHue}, 100%, 50%, 1)`;
  };

  const Star = class {
    constructor() {
      this.size = this.random(MAX_STAR_SIZE, MIN_STAR_SIZE);

      this.x = this.random(
        sparkle.offsetWidth * 0.75,
        sparkle.offsetWidth * 0.25
      );
      this.y = sparkle.offsetHeight / 2 - this.size / 2;

      this.x_dir = this.randomMinus();
      this.y_dir = this.randomMinus();

      this.x_max_travel =
        this.x_dir === -1 ? this.x : sparkle.offsetWidth - this.x - this.size;
      this.y_max_travel = sparkle.offsetHeight / 2 - this.size;

      this.x_travel_dist = this.random(this.x_max_travel, MIN_STAR_TRAVEL_X);
      this.y_travel_dist = this.random(this.y_max_travel, MIN_STAR_TRAVEL_Y);

      this.x_end = this.x + this.x_travel_dist * this.x_dir;
      this.y_end = this.y + this.y_travel_dist * this.y_dir;

      this.life = this.random(MAX_STAR_LIFE, MIN_STAR_LIFE);

      this.star = document.createElement("div");
      this.star.classList.add("star");

      this.star.style.setProperty("--start-left", this.x + "px");
      this.star.style.setProperty("--start-top", this.y + "px");

      this.star.style.setProperty("--end-left", this.x_end + "px");
      this.star.style.setProperty("--end-top", this.y_end + "px");

      this.star.style.setProperty("--star-life", this.life + "s");
      this.star.style.setProperty("--star-life-num", this.life);

      this.star.style.setProperty("--star-size", this.size + "px");
      this.star.style.setProperty("--star-color", randomLimitedColor());
    }

    draw() {
      sparkle.appendChild(this.star);
    }

    pop() {
      sparkle.removeChild(this.star);
    }

    random(max, min) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    randomMinus() {
      return Math.random() > 0.5 ? 1 : -1;
    }
  };

  let current_star_count = 0;
  const intervalId = setInterval(() => {
    if (current_star_count >= MAX_STARS) {
      return;
    }

    current_star_count++;

    const newStar = new Star();
    newStar.draw();

    setTimeout(() => {
      current_star_count--;
      newStar.pop();
    }, newStar.life * 1000);
  }, STAR_INTERVAL);

  return () => {
    clearInterval(intervalId);
  };
}, [isClient]);
  return (
    <div style={{ 
      width: '100vw', 
      background: 'transparent', 
      position: 'relative',
      minHeight: '300vh', // Ensure scrollable height for longer scroll
      overflowX: 'hidden',
      overflowY: 'auto',
      WebkitOverflowScrolling: 'touch', // Enable smooth scrolling on iOS
    }}>

<style jsx global>{`
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
        
        @font-face {
          font-family: Cyber;
          src: url("https://assets.codepen.io/605876/Blender-Pro-Bold.otf");
          font-weight: bold;
          font-style: normal;
          font-display: swap;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes pulse {
          0% {
            transform: translateX(-50%) scale(1);
            box-shadow: 0 0 20px rgba(212, 175, 55, 0.6);
          }
          50% {
            transform: translateX(-50%) scale(1.05);
            box-shadow: 0 0 30px rgba(212, 175, 55, 0.8);
          }
          100% {
            transform: translateX(-50%) scale(1);
            box-shadow: 0 0 20px rgba(212, 175, 55, 0.6);
          }
        }
        
        .featured-banner {
          position: absolute;
          left: 50%;
          display: block;
          margin: 0 -110px;
          width: 220px;
          height: 40px;
          border: 1px solid #8a6701;
          font: bold 18px/40px 'Cyber', monospace;
          text-align: center;
          color: #2a1f0a;
          background: linear-gradient(135deg, #c48901 0%, #d4af37 100%);
          border-radius: 4px;
          box-shadow: 0 0 30px rgba(0, 0, 0, 0.15) inset,
                      0 6px 10px rgba(0, 0, 0, 0.3);
          text-shadow: 1px 1px 2px rgba(255, 255, 255, 0.3);
          letter-spacing: 0.1em;
        }

        .featured-banner::before,
        .featured-banner::after {
          content: '';
          position: absolute;
          z-index: -1;
          left: -40px;
          top: 16px;
          display: block;
          width: 24px;
          height: 0px;
          border: 20px solid #c48901;
          border-right: 12px solid #a57201;
          border-bottom-color: #b57f01;
          border-left-color: transparent;
          transform: rotate(-5deg);
        }

        .featured-banner::after {
          left: auto;
          right: -40px;
          border-left: 12px solid #a57201;
          border-right: 20px solid transparent;
          transform: rotate(5deg);
        }
        
        .spinning-record {
          animation: spin 3s linear infinite;
        }
        
        /* Fallback coin styles if CSS file doesn't load */
        .coin .front {
          background-color: #d4af37 !important;
        }
        .coin .back {
          background-color: #b8941f !important;
        }
        
        /* Desktop rotating text - larger size */
        .desktop-rotating-text .rotating-text-body {
          font-size: 4rem !important;
        }
        
        .desktop-rotating-text .t3xts {
          height: 70px !important;
        }
        
        /* Override purse centering */
        .purse {
          position: relative !important;
          top: auto !important;
          left: auto !important;
          margin: 0 auto !important;
          margin-top: 0 !important;
          margin-left: 0 !important;
        }
        
        /* Sparkle styles */
        .star {
          position: absolute;
          width: var(--star-size);
          height: var(--star-size);
          background: var(--star-color);
          clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
          animation: starAnimation var(--star-life) ease-out forwards;
          pointer-events: none;
          z-index: -1;
        }
        
        @keyframes starAnimation {
          from {
            left: var(--start-left);
            top: var(--start-top);
            opacity: 1;
            transform: scale(0) rotate(0deg);
          }
          50% {
            opacity: 1;
            transform: scale(1) rotate(180deg);
          }
          to {
            left: var(--end-left);
            top: var(--end-top);
            opacity: 0;
            transform: scale(0) rotate(360deg);
          }
        }
        
        /* Tooltip animations */
        .rotate-tooltip {
          animation: tooltipFadeIn 4s ease-in-out infinite;
        }
        
        @keyframes tooltipFadeIn {
          0%, 100% {
            opacity: 0.9;
          }
          50% {
            opacity: 1;
          }
        }
        
        .rotate-hand {
          animation: rotateHand 2s ease-in-out infinite;
        }
        
        @keyframes rotateHand {
          0%, 100% {
            transform: rotate(0deg) translateX(0px);
          }
          25% {
            transform: rotate(-15deg) translateX(-10px);
          }
          75% {
            transform: rotate(15deg) translateX(10px);
          }
        }
      `}</style>
      
      {/* Fixed Canvas */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        pointerEvents: 'none', // Prevent canvas from blocking scroll
      }}>
        <Canvas
          shadows
          camera={{ position: isMobile ? [20, -2, 20] : [20, -2, 20], fov: isMobile ? 60 : 60}}
          style={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%', 
            height: '100%',
            pointerEvents: 'auto', // Re-enable for 3D interactions
            touchAction: 'none', // Prevent default touch behavior on canvas
          }}
        >
          <Scene isMobile={isMobile} scrollY={scrollY} />
        </Canvas>
      </div>
      
      {/* Scrollable Overlay Content */}
      <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          minHeight: '100vh',
          zIndex: 10,
          pointerEvents: 'none',
        }}>
        <div style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          paddingTop: '3rem',
        }}>

          
          {/* Animated Title */}
          <h1 
              id="main-title"
              style={{ 
              position: "relative",
              left: isMobile ? "5%" : "10%",
              color: "#8e662b",
              fontFamily: 'UnifrakturCook, UnifrakturMaguntia, serif',
              textShadow: "3px 3px 5px #000, -1px -1px 5px pink",
              fontSize: getResponsiveValue("4rem", "5rem", "6rem", "7rem"),
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
                <span style={{ fontSize: isMobile ? "1.2rem" : "3rem" }}>of </span>
                Perpetual
              </span>
              <span className="title-line" style={{ display: 'block', marginLeft: isMobile ? "2rem" : "6rem", position: 'relative' }}>Profit</span>
            </h1>
          
          {/* Intro text box - below title */}
          <div style={{
            position: 'relative',
            marginTop: getResponsiveValue('22rem', '45rem', '29rem', '18rem'),
            marginLeft: getResponsiveValue('5%', '8%', '10%', '10%'),
            marginRight: getResponsiveValue('5%', '8%', '40%', '50%'),
            padding: '2rem',
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(10px)',
            borderRadius: '15px',
            border: '2px solid rgba(212, 175, 55, 0.3)',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
            pointerEvents: 'auto',
          }}>

        <p style={{ 
          color: '#ffffff',
          fontSize: isMobile ? '0.9rem' : '1.5rem',
          lineHeight: 1.6,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          fontWeight: 400,
          letterSpacing: '0.02em',
          marginBottom: '1rem',
  
          opacity: 0.85,
          textAlign: 'center',
          maxWidth: isMobile ? '100%' : '800px',
          margin: '0 auto 2rem auto',
          padding: '0 1rem',
        }}>
     {/* Nowhere is the purifying presence of the virtual virgin needed more than the dark realm of defi.<br/> */}

{/* Descending from the Cloud, Behold! the mother of memes, an aider to traders, and a fren to degens: <span style={{
            fontFamily: 'UnifrakturCook, serif',
            fontWeight: 'bold',
            fontSize: '1.1em',
            color: '#d4af37',
            textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)',
            marginLeft: '0.25em',
          }}> Our Lady of Perpetual Profit </span>is your divine guide through the dark realm of crypto DeFi.<br/><br/> */}

<span style={{
            fontFamily: 'UnifrakturCook, serif',
            fontWeight: 'bold',
            fontSize: '1.1em',
            color: '#d4af37',
            textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)',
            marginLeft: '0.25em',
          }}> Our Lady of Perpetual Profit </span>has high ideals. That’s why this beloved icon of intercession is the perfect embodiment of the cryptocurrency ethos, representing core tenets such as decentralization and direct access.
          {/* Invoked by peasants and princes alike, she is the perfect metaphor for a system that transcends hierarchies, resists corruption, and offers radical inclusion for both small traders and global institutions.<br/><br/> */}
{/* Burn a few <span style={{
            fontFamily: 'UnifrakturCook, serif',
            fontWeight: 'bold',
            fontSize: '1.1em',
            color: '#d4af37',
            textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)',
            marginLeft: '0.25em',
          }}> RL80 </span>tokens to devote a candle in appreciation for her tireless vigilance.
Or hold them for luck, and to ward off evil.<br/><br/> */} And now, behold! She brings forth
<span style={{
            fontFamily: 'UnifrakturCook, serif',
            fontWeight: 'bold',
            fontSize: '1.1em',
            color: '#d4af37',
            textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)',
            marginLeft: '0.25em',
          }}>RL80, </span>the Holy Trin80 of digital tokens, representing liquid80, integr80, and prosper80. <br/><br/>
Whether you need a Hail Mary for hard times, or just sanctuary in the new economy, <span style={{
            fontFamily: 'UnifrakturCook, serif',
            fontWeight: 'bold',
            fontSize: '1.1em',
            color: '#d4af37',
            textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)',
            marginLeft: '0.25em',
          }}> RL80 </span>  is your divine guide through the dark realm of crypto DeFi.
{/* Let <span style={{
            fontFamily: 'UnifrakturCook, serif',
            fontWeight: 'bold',
            fontSize: '1.1em',
            color: '#d4af37',
            textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)',
            marginLeft: '0.25em',
          }}> Our Lady of Perpetual Profit </span>  light the way. */}
           </p>
              <p style={{
                color: '#d4af37',
                fontSize: '1rem',
                lineHeight: '1.5',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                marginTop: '1rem',
                fontStyle: 'italic',
                opacity: 0.9,
              }}>
                {/* Ride the bull of eternal gains as Our Lady guides you through the volatile seas of fortune. */}
              </p>
          </div>
          
          {/* Contract Address Box - Mobile: below intro, Desktop: right side */}
          <div style={{
            position: getResponsiveValue('relative', 'relative', 'absolute', 'absolute'),
            top: getResponsiveValue('auto', 'auto', '55rem', '60rem'),
            right: getResponsiveValue('auto', 'auto', '5rem', '2rem'),
            ...(isTablet && !isTabletLandscape ? {
              margin: '4rem auto 0 auto',
              width: '80%',
              maxWidth: '600px',
            } : {
              marginTop: getResponsiveValue('2rem', '4rem', '0', '0'),
              marginLeft: getResponsiveValue('5%', '8%', 'auto', 'auto'),
              marginRight: getResponsiveValue('5%', '8%', '0', '10%'),
              width: getResponsiveValue('auto', 'auto', '40%', '35%'),
              maxWidth: getResponsiveValue('100%', '500px', '450px', '450px'),
            }),
            pointerEvents: 'auto',
          }}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.05) 0%, rgba(0, 0, 0, 0.8) 50%, rgba(212, 175, 55, 0.05) 100%)',
              backdropFilter: 'blur(12px)',
              borderRadius: '20px',
              border: '2px solid rgba(212, 175, 55, 0.4)',
              boxShadow: '0 15px 45px rgba(0, 0, 0, 0.5), inset 0 0 40px rgba(212, 175, 55, 0.1)',
              padding: '1.5rem 1.5rem 1rem 1.5rem',
              transition: 'all 0.3s ease',
              textAlign: 'center',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(196, 137, 1, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 15px 45px rgba(0, 0, 0, 0.5), inset 0 0 40px rgba(212, 175, 55, 0.1)';
            }}
            >
              {/* Coin centered inside the box */}
              <div style={{ 
                display: "flex",
                justifyContent: "center",
                marginBottom: "1.5rem",
                marginTop: "0.5rem",
                padding: "1rem 0",
                pointerEvents: "auto",
              }}>
                <div
                  ref={coinRef}
                  style={{ 
                    position: "relative", 
                    width: isMobile ? "5rem" : "6rem", 
                    height: isMobile ? "5rem" : "6rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <CoinInline />
                </div>
              </div>
              
              {/* Buy Button */}
              <button
                style={{
                  background: 'linear-gradient(135deg, #d4af37 0%, #c48901 100%)',
                  border: '2px solid rgba(212, 175, 55, 0.6)',
                  borderRadius: '12px',
                  padding: '0.75rem 2.5rem',
                  color: '#000000',
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  fontFamily: '"Cyber", monospace',
                  letterSpacing: '0.15em',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 15px rgba(212, 175, 55, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
                  textTransform: 'uppercase',
                  marginBottom: '1.5rem',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(212, 175, 55, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(212, 175, 55, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.3)';
                }}
                onClick={() => {
                  // Add buy action here
                  window.open('https://app.uniswap.org', '_blank');
                }}
              >
                BUY
              </button>
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                marginBottom: '0.5rem',
                flexWrap: 'wrap',
              }}>
                <span style={{
                  fontFamily: 'UnifrakturCook, UnifrakturMaguntia, serif',
                  fontWeight: 'bold',
                  fontSize: '0.9rem',
                  color: '#d4af37',
                  textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)',
                }}> Our Lady of Perpetual Profit</span>
                <span style={{
                  fontFamily: 'cyber, monospace',
                  fontWeight: 'bold',
                  fontSize: '0.8rem',
                  color: '#ffffff',
                  textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)',
                }}> • Ticker: </span>
                <span style={{
                  fontFamily: 'cyber, monospace',
                  fontWeight: 'bold',
                  fontSize: '0.9rem',
                  color: '#d4af37',
                  textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)',
                }}>RL80 </span>
              </div>
              <h3 style={{
                color: '#c48901',
                fontSize: '0.75rem',
                fontWeight: '600',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                marginBottom: '0.5rem',
                marginTop: '0',
                fontFamily: '"Cyber", monospace',
                textAlign: 'center',
              }}>
                Contract Address (BASE Chain)
              </h3>
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'rgba(0, 0, 0, 0.3)',
                padding: '0.4rem 0.6rem',
                borderRadius: '8px',
                border: '1px solid rgba(196, 137, 1, 0.2)',
                width: '100%',
              }}>
                <code style={{
                  color: '#ffffff',
                  fontSize: '0.8rem',
                  fontFamily: 'monospace',
                  wordBreak: 'break-all',
                  flex: 1,
                  opacity: 0.9,
                  textAlign: 'center',
                }}>
                  {contractAddress.slice(0, 6)}...{contractAddress.slice(-4)}
                </code>
                
                <button
                  onClick={handleCopyAddress}
                  style={{
                    background: copied ? 'rgba(0, 255, 0, 0.2)' : 'rgba(196, 137, 1, 0.2)',
                    border: `1px solid ${copied ? 'rgba(0, 255, 0, 0.5)' : 'rgba(196, 137, 1, 0.5)'}`,
                    borderRadius: '6px',
                    padding: '0.4rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title={copied ? 'Copied!' : 'Copy address'}
                >
                  {copied ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00ff00" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c48901" strokeWidth="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* New Section - Full Width */}
        <div style={{
          position: 'relative',
          marginTop: getResponsiveValue('3rem', '4rem', '5rem', '6rem'),
          marginLeft: getResponsiveValue('5%', '8%', '10%', '10%'),
          marginRight: getResponsiveValue('5%', '8%', '10%', '10%'),
          padding: '3rem 2rem',
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(10px)',
          borderRadius: '15px',
          border: '2px solid rgba(212, 175, 55, 0.3)',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
          pointerEvents: 'auto',
        }}>
          <h2 style={{
            fontFamily: 'UnifrakturCook, serif',
            fontSize: getResponsiveValue('2rem', '2.5rem', '3rem', '3rem'),
            fontWeight: 'bold',
            color: '#d4af37',
            textShadow: '2px 2px 4px rgba(0, 0, 0, 0.7)',
            textAlign: 'center',
            marginBottom: '2rem',
            letterSpacing: '0.05em',
          }}>
            The Divine Path to Prosperity
          </h2>
          
          <p style={{
            color: '#ffffff',
            fontSize: isMobile ? '0.9rem' : '1.5rem',
            lineHeight: 1.6,
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            fontWeight: 400,
            letterSpacing: '0.02em',
            marginBottom: '1rem',
            opacity: 0.85,
            textAlign: 'center',
            maxWidth: isMobile ? '100%' : '800px',
            margin: '0 auto',
            padding: '0 1rem',
          }}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
            Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.<br/><br/>
            
            Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. 
            Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.<br/><br/>
            
            Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam.
            Eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.
          </p>
        </div>
        </div>
      
      {/* Scrollable content area - overlays on top */}
      <div style={{
        position: 'relative',
        marginTop: '50vh',
        minHeight: '100vh',
        background: 'transparent',
        padding: '4rem 0',
        zIndex: 10,
        pointerEvents: 'none', // Allow interaction with canvas below
      }}>
        {/* Content text box
        <div style={{
          padding: '2rem 5%',
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(10px)',
          borderRadius: '15px',
          border: '2px solid rgba(212, 175, 55, 0.3)',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
          margin: '2rem auto',
          maxWidth: '800px',
          pointerEvents: 'auto', // Re-enable interaction for this element
        }}>
          <p style={{
            color: '#ffd700',
            fontSize: '1rem',
            lineHeight: '1.5',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            margin: 0,
            textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)',
            textAlign: 'center',
          }}>
            Welcome to the sacred realm of perpetual prosperity. Divine providence meets degenerate profits.
          </p>
          <p style={{
            color: '#d4af37',
            fontSize: '0.9rem',
            lineHeight: '1.4',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            marginTop: '0.75rem',
            fontStyle: 'italic',
            opacity: 0.9,
            textAlign: 'center',
          }}>
            Ride the bull of eternal gains.
          </p>
        </div> */}
      </div>
      
      {/* Footer - positioned at bottom */}
      <footer style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: '1rem 2rem',
        background: 'rgba(0, 0, 0, 0.9)',
        borderTop: '1px solid rgba(212, 175, 55, 0.2)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '2rem',
        flexWrap: 'wrap',
        zIndex: 11,
      }}>
        <p style={{
          color: '#d4af37',
          fontSize: '0.875rem',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          margin: 0,
          opacity: 0.8,
        }}>
          © 2025 Our Lady of Perpetual Profit
        </p>
        <div style={{
          display: 'flex',
          gap: '1.5rem',
          alignItems: 'center',
        }}>
          <a href="#" style={{
            color: '#ffd700',
            fontSize: '0.875rem',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            textDecoration: 'none',
            opacity: 0.8,
            transition: 'opacity 0.2s',
          }}
          onMouseEnter={(e) => e.target.style.opacity = '1'}
          onMouseLeave={(e) => e.target.style.opacity = '0.8'}>
            About
          </a>
          <a href="#" style={{
            color: '#ffd700',
            fontSize: '0.875rem',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            textDecoration: 'none',
            opacity: 0.8,
            transition: 'opacity 0.2s',
          }}
          onMouseEnter={(e) => e.target.style.opacity = '1'}
          onMouseLeave={(e) => e.target.style.opacity = '0.8'}>
            Token
          </a>
          <a href="#" style={{
            color: '#ffd700',
            fontSize: '0.875rem',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            textDecoration: 'none',
            opacity: 0.8,
            transition: 'opacity 0.2s',
          }}
          onMouseEnter={(e) => e.target.style.opacity = '1'}
          onMouseLeave={(e) => e.target.style.opacity = '0.8'}>
            Community
          </a>
        </div>
      </footer>
      
      {/* CyberNav Menu - Outside main container */}
      {mounted && <CyberNav is80sMode={is80sMode} />}
      
      {/* Music and User Controls Container - Outside main container */}
      {mounted && (
      <div
        style={{
          position: "fixed",
          top: isMobile ? "70px" : "20px",
          right: isMobile ? "20px" : "72px",
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          gap: "10px",
          alignItems: isMobile ? "flex-end" : "center",
          zIndex: 9999999
        }}
      >
        {/* User Account Icon with Illumin80 Laurel */}
        <div>
          {isSignedIn ? (
            <Illumin80ClerkButton afterSignOutUrl="/" />
          ) : (
            <SignInButton mode="modal">
              <button
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                border: "2px solid rgba(255, 255, 255, 0.2)",
                boxShadow: "0 4px 15px rgba(102, 126, 234, 0.4)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.1)";
                e.currentTarget.style.boxShadow =
                  "0 6px 20px rgba(102, 126, 234, 0.6)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow =
                  "0 4px 15px rgba(102, 126, 234, 0.4)";
              }}
              title="Sign In"
            >
              👤
            </button>
          </SignInButton>
        )}
        </div>
        
        {/* Music Controls */}
        <div>
          {!showMusicControls ? (
            <button
              onClick={() => {
                setShowMusicControls(true);
                if (!contextIsPlaying) {
                  play();
                }
              }}
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
              <svg
                width="20"
                height="20"
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
            // Compact Music Player Controls
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              {/* Spinning Album Art */}
              <div
                className={contextIsPlaying ? "spinning-record" : ""}
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  backgroundImage: "url('/virginRecords.jpg')",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />
              
              {/* Skip Button */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (nextTrack) {
                    nextTrack();
                  }
                }}
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "6px",
                  backgroundColor: "rgba(0, 0, 0, 0.7)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  backdropFilter: "blur(10px)",
                  boxShadow: "0 2px 6px rgba(0, 0, 0, 0.3)",
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
                  setShowMusicControls(false);
                  if (pause) {
                    pause();
                  }
                }}
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "6px",
                  backgroundColor: "rgba(0, 0, 0, 0.7)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  backdropFilter: "blur(10px)",
                  boxShadow: "0 2px 6px rgba(0, 0, 0, 0.3)",
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
        </div>
      </div>
      )}
    </div>
  );
}

useGLTF.preload('/models/ourlady_rider6.glb');
useGLTF.preload('/models/angelEmojji.glb');
useGLTF.preload('/models/devilEmoji.glb');