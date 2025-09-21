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
import InfinityLoader from '@/components/InfinityLoader';
import Link from 'next/link';

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
        intensity={3}
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

function SpotlightWithHelper({ isMobile, scrollY }) {
  const spotlightRef = useRef();
  const targetRef = useRef();

  useEffect(() => {
    if (spotlightRef.current && targetRef.current) {
      spotlightRef.current.target = targetRef.current;
    }
  }, []);

  // Update target position to follow the model
  useFrame(() => {
    if (targetRef.current) {
      // Match OurLadyRiderModel position logic
      const baseY = isMobile ? -11 : -13;
      targetRef.current.position.set(
        isMobile ? -10 : -6,
        baseY + scrollY * 0.015,
        isMobile ? -10 : -18
      );
    }
  });

  return (
    <>
      <spotLight
        ref={spotlightRef}
        position={[-5, 10, 5]}
        intensity={35}
        angle={Math.PI / 4}
        penumbra={0.5}
        distance={60}
        color="#ffeedd"
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

function OurLadyRiderModel({ isMobile, scrollY, onLoad }) {
  const { scene } = useGLTF('/models/ourlady_rider6.glb');
  const modelRef = useRef();
  const groupRef = useRef();
  const cloudRef = useRef();

  
  React.useEffect(() => {
    if (scene) {
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      // Notify that this model is loaded
      if (onLoad) onLoad();
    }
  }, [scene, onLoad]);

  useFrame(() => {
    if (groupRef.current) {
      // Move entire group (model + cloud) up as user scrolls down
      const baseY = isMobile ? -11 : -13;
      groupRef.current.position.y = baseY + scrollY * 0.015;
    }
    // Add gentle cloud rotation
    if (cloudRef.current) {
      cloudRef.current.rotation.y += 0.001;
    }
  });

  return (
    <group 
      ref={groupRef}
      position={isMobile ? [-10, -11, -10] : [-6, -13, -12]}
    >
      <primitive 
        ref={modelRef}
        object={scene} 
        scale={isMobile ? [10, 10, 10] : [12, 12, 12]}
        rotation={isMobile ? [0, -2.5, 0] : [0, -2.4, 0]}
      />
      {/* Personal cloud that follows the model */}
      <Cloud 
        ref={cloudRef}
        seed={99}
        segments={10}
        volume={30}
        opacity={0.99}
        fade={2}
        growth={5}
        speed={0.03}
        bounds={[12, 6, 6]}
        color="#ffc0cb"
        position={[-5, 8, 5]}
      />
    </group>
  );
}

function AngelEmojiModel({ isMobile, scrollY, onLoad }) {
  const { scene, animations } = useGLTF('/models/angelEmoji.glb');
  const { actions } = useAnimations(animations, scene);
  const modelRef = useRef();

  useEffect(() => {
    // Log all available animations
    // console.log('Angel Emoji Animations:', animations);
    if (animations && animations.length > 0) {
      // console.log('Available animation names:');
      animations.forEach((clip, index) => {
        // console.log(`Animation ${index}: "${clip.name}"`);
      });
      
      // Play all animations simultaneously
      animations.forEach((clip) => {
        if (actions[clip.name]) {
          // console.log(`Playing animation: "${clip.name}"`);
          actions[clip.name].play();
        }
      });
    } else {
      // console.log('No animations found in angelEmojji.glb');
    }

    // Enable shadows on the model
    if (scene) {
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      // Notify that this model is loaded
      if (onLoad) onLoad();
    }
  }, [animations, actions, scene, onLoad]);

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
    modelRef.current.position.z = centerZ + Math.sin(angle) * -orbitRadius;
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

function DevilEmojiModel({ isMobile, scrollY, onLoad }) {
  const { scene, animations } = useGLTF('/models/devilEmoji.glb');
  const { actions } = useAnimations(animations, scene);
  const modelRef = useRef();

  useEffect(() => {
    // Log available animation
    // console.log('Devil Emoji Animations:', animations);
    if (animations && animations.length > 0) {
      animations.forEach((clip, index) => {
        // console.log(`Animation ${index}: "${clip.name}"`);
      });
      
      // Play the Armature|Idle animation
      const idleAnimation = animations.find(clip => clip.name === 'Armature|Idle') || animations[0];
      if (idleAnimation && actions[idleAnimation.name]) {
        // console.log(`Playing animation: "${idleAnimation.name}"`);
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
      // Notify that this model is loaded
      if (onLoad) onLoad();
    }
  }, [animations, actions, scene, onLoad]);

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
    modelRef.current.position.z = centerZ + Math.sin(angle) * -orbitRadius;
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
function Scene({ isMobile, scrollY, onAssetsLoaded }) {
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
      
      <SpotlightWithHelper isMobile={isMobile} scrollY={scrollY} />
      
      <GradientSkySphere />
      
      <Suspense fallback={null}>
        {/* Background layer - moves slowest */}
        <group position={[-25, -2.5 + scrollY * 0.008, -6]}>
          <DarkClouds />
        </group>

        {/* Foreground layer - moves faster */}
        <OurLadyRiderModel 
          isMobile={isMobile} 
          scrollY={scrollY} 
          onLoad={() => onAssetsLoaded?.('ourLadyModel')}
        />
        <AngelEmojiModel 
          isMobile={isMobile} 
          scrollY={scrollY} 
          onLoad={() => onAssetsLoaded?.('angelModel')}
        />
        <DevilEmojiModel 
          isMobile={isMobile} 
          scrollY={scrollY} 
          onLoad={() => onAssetsLoaded?.('devilModel')}
        />
      </Suspense>
      <Suspense></Suspense>
      <PostProcessingEffects is80sMode={false} />
      <OrbitControls 
        enablePan={false}
        enableZoom={true}
        enableRotate={true}
        enableDamping={false}
        enabled={false} // Completely disable OrbitControls for mobile scrolling
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
  const [flippedCards, setFlippedCards] = useState(new Set());
  const [isSceneLoading, setIsSceneLoading] = useState(true);
  const [assetsLoaded, setAssetsLoaded] = useState({
    ourLadyModel: false,
    angelModel: false,
    devilModel: false,
    images: []
  });
  
  // Ref for sparkle effect
  const coinRef = useRef(null);
  // Refs for card animations
  const cardRefs = useRef([]);
  const cardTransforms = useRef(new Map());
  
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
  
  const handleCardFlip = (cardIndex) => {
    setFlippedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cardIndex)) {
        newSet.delete(cardIndex);
      } else {
        newSet.add(cardIndex);
      }
      return newSet;
    });
  };
  
  // Helper function to get responsive values
  const getResponsiveValue = (mobile, tablet, tabletLandscape, desktop) => {
    if (isMobile) return mobile;
    if (isTablet && !isTabletLandscape) return tablet;  // Tablet portrait
    if (isTabletLandscape) return tabletLandscape;      // Tablet landscape
    return desktop;
  };

  // Handle asset loading
  const handleAssetLoaded = (assetName) => {
    console.log('Asset loaded:', assetName);
    setAssetsLoaded(prev => ({
      ...prev,
      [assetName]: true
    }));
  };

  // Check if all assets are loaded
  useEffect(() => {
    if (!mounted) return;
    
    const { ourLadyModel, angelModel, devilModel } = assetsLoaded;
    const allModelsLoaded = ourLadyModel && angelModel && devilModel;
    
    console.log('Asset loading status:', { ourLadyModel, angelModel, devilModel, mounted, allModelsLoaded });
    
    if (allModelsLoaded) {
      console.log('All assets loaded, hiding loader NOW');
      setIsSceneLoading(false);
    }
  }, [assetsLoaded.ourLadyModel, assetsLoaded.angelModel, assetsLoaded.devilModel, mounted]);
  
  // Separate fallback timer
  useEffect(() => {
    const fallbackTimer = setTimeout(() => {
      console.log('Loading timeout - forcing scene display');
      setIsSceneLoading(false);
    }, 5000);
    
    return () => clearTimeout(fallbackTimer);
  }, []); // Run once on mount

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

  // Card scroll reveal animation
  useEffect(() => {
    if (!mounted) return;

    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, observerOptions);

    // Observe all card-wrap elements
    cardRefs.current.forEach(card => {
      if (card) observer.observe(card);
    });

    return () => {
      cardRefs.current.forEach(card => {
        if (card) observer.unobserve(card);
      });
    };
  }, [mounted]);

  // Card parallax mouse movement with enhanced depth effect
  useEffect(() => {
    if (!mounted) return;

    const handleCardMouseMove = (e) => {
      const card = e.currentTarget;
      const cardRect = card.getBoundingClientRect();
      const cardCenterX = cardRect.left + cardRect.width / 2;
      const cardCenterY = cardRect.top + cardRect.height / 2;
      
      // Calculate mouse position relative to card center
      const mouseX = (e.clientX - cardCenterX) / (cardRect.width / 2);
      const mouseY = (e.clientY - cardCenterY) / (cardRect.height / 2);
      
      // Calculate rotation values (similar to codepen)
      const rX = mouseX * 30; // Rotation on Y axis (left-right tilt)
      const rY = mouseY * -30; // Rotation on X axis (up-down tilt)
      
      // Apply 3D rotation to card
      const cardInner = card.querySelector('.card');
      cardInner.style.transform = `rotateY(${rX}deg) rotateX(${rY}deg)`;
      
      // Move background opposite direction for depth
      const cardBg = card.querySelector('.card-bg');
      const tX = mouseX * -40;
      const tY = mouseY * -40;
      cardBg.style.transform = `translateX(${tX}px) translateY(${tY}px)`;
    };

    const handleCardMouseLeave = (e) => {
      const card = e.currentTarget;
      const cardInner = card.querySelector('.card');
      const cardBg = card.querySelector('.card-bg');
      
      // Reset transforms with delay
      setTimeout(() => {
        cardInner.style.transform = '';
        cardBg.style.transform = '';
      }, 100);
    };

    // Add listeners to all card wraps
    const cards = document.querySelectorAll('.card-wrap');
    cards.forEach(card => {
      card.addEventListener('mousemove', handleCardMouseMove);
      card.addEventListener('mouseleave', handleCardMouseLeave);
    });

    return () => {
      cards.forEach(card => {
        card.removeEventListener('mousemove', handleCardMouseMove);
        card.removeEventListener('mouseleave', handleCardMouseLeave);
      });
    };
  }, [mounted]);

  // Subtle parallax scroll effect for cards
  useEffect(() => {
    if (!mounted) return;

    const handleCardScroll = () => {
      const scrolled = window.pageYOffset;
      const cards = document.querySelectorAll('.card-wrap.visible');
      
      cards.forEach((card, index) => {
        const rect = card.getBoundingClientRect();
        // Calculate distance from viewport center for parallax depth
        const viewportCenter = window.innerHeight / 2;
        const cardCenter = rect.top + rect.height / 2;
        const distanceFromCenter = (cardCenter - viewportCenter) / window.innerHeight;
        
        // Subtle parallax based on distance from center, not alternating
        const speed = 0.02; // Even more subtle
        const yPos = distanceFromCenter * scrolled * speed;
        
        // Store the scroll transform
        cardTransforms.current.set(card, yPos);
        
        // Only apply if card is in viewport
        if (rect.bottom >= 0 && rect.top <= window.innerHeight) {
          card.style.transform = `translateY(${yPos}px)`;
        }
      });
    };

    window.addEventListener('scroll', handleCardScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleCardScroll);
    };
  }, [mounted]);
  
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
 // Sparkle effect for coins (both main and card)
 useEffect(() => {
  // Wait for client and page to be ready
  if (!isClient) {
    return;
  }

  // Get both coin containers
  const mainCoin = coinRef.current;
  const cardCoin = document.querySelector('.card-coin-sparkle');
  const sparkleContainers = [mainCoin, cardCoin].filter(Boolean);

  const MAX_STARS = 60;
  const STAR_INTERVAL = 16;

  const MAX_STAR_LIFE = 3;
  const MIN_STAR_LIFE = 1;

  const MAX_STAR_SIZE = 40;
  const MIN_STAR_SIZE = 20;

  const MIN_STAR_TRAVEL_X = 150;
  const MIN_STAR_TRAVEL_Y = 150;

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
    constructor(container) {
      this.container = container;
      this.size = this.random(MAX_STAR_SIZE, MIN_STAR_SIZE);

      // Start from center of container
      this.x = container.offsetWidth / 2;
      this.y = container.offsetHeight / 2;

      this.x_dir = this.randomMinus();
      this.y_dir = this.randomMinus();

      // Allow stars to travel to edges of container
      this.x_max_travel = container.offsetWidth / 2 - this.size / 2;
      this.y_max_travel = container.offsetHeight / 2 - this.size / 2;

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
      this.container.appendChild(this.star);
    }

    pop() {
      this.container.removeChild(this.star);
    }

    random(max, min) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    randomMinus() {
      return Math.random() > 0.5 ? 1 : -1;
    }
  };

  // Create sparkle effects for each container
  const intervals = [];
  
  sparkleContainers.forEach(container => {
    let current_star_count = 0;
    const intervalId = setInterval(() => {
      if (current_star_count >= MAX_STARS) {
        return;
      }

      current_star_count++;

      const newStar = new Star(container);
      newStar.draw();

      setTimeout(() => {
        current_star_count--;
        newStar.pop();
      }, newStar.life * 1000);
    }, STAR_INTERVAL);
    
    intervals.push(intervalId);
  });

  return () => {
    intervals.forEach(id => clearInterval(id));
  };
}, [isClient]);
  return (
    <div style={{ 
      width: '100vw', 
      background: 'transparent', 
      position: 'relative',
      minHeight: '100vh',
      overflowX: 'hidden',
      overflowY: 'auto',
      WebkitOverflowScrolling: 'touch', // Enable smooth scrolling on iOS
    }}>
      
      {/* InfinityLoader - shows while scene is loading */}
      {isSceneLoading && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 10000,
          backgroundColor: '#000',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          pointerEvents: isSceneLoading ? 'auto' : 'none', // Only block when actually loading
        }}>
          <InfinityLoader />
        </div>
      )}

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
        
        @keyframes buyButtonPulse {
          0% {
            box-shadow: 0 10px 30px rgba(212, 175, 55, 0.5), 0 0 60px rgba(212, 175, 55, 0.3);
          }
          50% {
            box-shadow: 0 15px 40px rgba(212, 175, 55, 0.7), 0 0 80px rgba(212, 175, 55, 0.5);
          }
          100% {
            box-shadow: 0 10px 30px rgba(212, 175, 55, 0.5), 0 0 60px rgba(212, 175, 55, 0.3);
          }
        }
        
        @keyframes candleFlicker {
          0%, 100% {
            box-shadow: 0 10px 30px rgba(74, 140, 38, 0.5), 0 0 60px rgba(45, 80, 22, 0.3);
          }
          25% {
            box-shadow: 0 12px 35px rgba(74, 140, 38, 0.6), 0 0 65px rgba(45, 80, 22, 0.4);
          }
          50% {
            box-shadow: 0 8px 25px rgba(74, 140, 38, 0.4), 0 0 55px rgba(45, 80, 22, 0.35);
          }
          75% {
            box-shadow: 0 14px 38px rgba(74, 140, 38, 0.65), 0 0 70px rgba(45, 80, 22, 0.45);
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
        
        /* Cloud container animations */
        @keyframes cloudFloat {
          0%, 100% { 
            transform: translateY(0px) scale(1);
            opacity: 0.9;
          }
          25% { 
            transform: translateY(-15px) scale(1.02);
            opacity: 0.95;
          }
          50% { 
            transform: translateY(-5px) scale(1.01);
            opacity: 0.85;
          }
          75% { 
            transform: translateY(-10px) scale(0.99);
            opacity: 0.9;
          }
        }
        
        @keyframes cloudDrift {
          0%, 100% { 
            transform: translateX(0);
          }
          50% { 
            transform: translateX(20px);
          }
        }
        
        .cloud-container {
          animation: cloudFloat 15s ease-in-out infinite;
          position: relative;
        }
        
        .cloud-container::before {
          content: '';
          position: absolute;
          top: -20%;
          left: -20%;
          right: -20%;
          bottom: -20%;
          background: radial-gradient(ellipse at center, rgba(255,255,255,0.1) 0%, transparent 70%);
          filter: blur(40px);
          animation: cloudDrift 20s ease-in-out infinite;
          pointer-events: none;
          z-index: -1;
        }
        /* Alternating cards styles with enhanced parallax depth */
        .cards-wrapper {
          display: flex;
          flex-direction: column;
          gap: 5rem;
          align-items: center;
          padding: 80px 20px;
          max-width: 1200px;
          margin: 0 auto;
          position: relative;
          z-index: 10;
        }

        .card-wrap {
          width: 90%;
          max-width: 600px;
          min-height: 400px;
          position: relative;
          perspective: 1000px;
          cursor: pointer;
          opacity: 0;
          transform: translateY(50px);
          margin-bottom: 0;
          transition: transform 0.8s ease-out, opacity 0.8s ease-out;
        }
        
        .card-container {
          width: 100%;
          height: 400px;
          position: relative;
          transform-style: preserve-3d;
          transition: transform 0.8s cubic-bezier(0.445, 0.05, 0.55, 0.95);
        }
        
        .card-container.flipped {
          transform: rotateY(180deg);
        }
        
        .card-face {
          position: absolute;
          width: 100%;
          height: 100%;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
        
        .card-face .card {
          height: 100%;
        }
        
        .card-front {
          z-index: 2;
        }
        
        .card-back {
          transform: rotateY(180deg);
          z-index: 1;
        }
        
        .card-back .card {
          background: linear-gradient(135deg, #2a1f0a 0%, #4a3a1a 100%);
        }
        
        .card-back-content {
          padding: 30px;
          color: #fff;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          overflow-y: auto;
          box-sizing: border-box;
          scrollbar-width: thin;
          scrollbar-color: rgba(212, 175, 55, 0.3) transparent;
        }
        
        .card-back-content::-webkit-scrollbar {
          width: 6px;
        }
        
        .card-back-content::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .card-back-content::-webkit-scrollbar-thumb {
          background-color: rgba(212, 175, 55, 0.3);
          border-radius: 3px;
        }
        
        .card-back-content h3 {
          color: #d4af37;
          font-family: 'UnifrakturCook', serif;
          font-size: 1.8em;
          margin-bottom: 15px;
          margin-top: 0;
        }
        
        .card-back-content p {
          font-size: 0.95em;
          line-height: 1.6;
          margin-bottom: 12px;
          opacity: 0.95;
        }
        
        .card-back-content ul {
          list-style: none;
          padding: 0;
          margin: 15px 0;
        }
        
        .card-back-content li {
          padding: 6px 0;
          border-bottom: 1px solid rgba(212, 175, 55, 0.2);
          font-size: 0.9em;
          line-height: 1.4;
        }
        
        .card-back-content li:before {
          content: "✨";
          margin-right: 10px;
        }
        
        .flip-hint {
          position: absolute;
          top: 10px;
          right: 10px;
          background: rgba(212, 175, 55, 0.2);
          padding: 5px 10px;
          border-radius: 5px;
          font-size: 0.8em;
          color: #d4af37;
          opacity: 0.8;
          transition: opacity 0.3s;
        }
        
        .card-wrap:hover .flip-hint {
          opacity: 1;
        }

        .card-wrap:nth-child(odd) {
          align-self: flex-start;
          margin-left: 5%;
        }

        .card-wrap:nth-child(even) {
          align-self: flex-end;
          margin-right: 5%;
        }

        .card-wrap.visible {
          opacity: 1;
          transform: translateY(0);
          transition: all 0.8s ease-out;
        }

        .card-wrap.visible:nth-child(1) {
          transition-delay: 0.1s;
        }

        .card-wrap.visible:nth-child(2) {
          transition-delay: 0.2s;
        }

        .card-wrap.visible:nth-child(3) {
          transition-delay: 0.3s;
        }

        .card-wrap.visible:nth-child(4) {
          transition-delay: 0.4s;
        }

        .card-wrap:hover .card {
          transition: 0.6s cubic-bezier(0.23, 1, 0.32, 1),
                      box-shadow 2s cubic-bezier(0.23, 1, 0.32, 1);
          box-shadow: 
            rgba(212, 175, 55, 0.4) 0 0 50px 10px,
            rgba(255, 255, 255, 0.3) 0 0 40px 5px,
            rgba(255, 255, 255, 1) 0 0 0 1px,
            rgba(0, 0, 0, 0.66) 0 30px 60px 0,
            inset #666 0 0 0 5px,
            inset rgba(255, 255, 255, 0.4) 0 0 0 6px;
        }

        .card-wrap:hover .card-bg {
          transition: 0.6s cubic-bezier(0.23, 1, 0.32, 1),
                      opacity 5s cubic-bezier(0.23, 1, 0.32, 1);
          opacity: 0.95;
          filter: brightness(1.3) contrast(1.15) saturate(1.2);
        }

        .card-wrap:hover .card-info {
          transform: translateY(0);
          transition: 0.6s cubic-bezier(0.23, 1, 0.32, 1);
        }

        .card-wrap:hover .card-info p {
          opacity: 1;
          transform: translateY(0);
          transition: 0.6s cubic-bezier(0.23, 1, 0.32, 1);
        }

        .card-wrap:hover .card-info::after {
          transition: 5s cubic-bezier(0.23, 1, 0.32, 1);
          opacity: 1;
          transform: translateY(0);
        }

        .card {
          width: 100%;
          min-height: 400px;
          position: relative;
          border-radius: 10px;
          background: linear-gradient(135deg, #4a4a4a 0%, #2a2a2a 100%);
          overflow: hidden;
          box-shadow: 
            rgba(212, 175, 55, 0.15) 0 0 30px 0,
            rgba(0, 0, 0, 0.66) 0 30px 60px 0,
            inset #555 0 0 0 5px,
            inset rgba(255, 255, 255, 0.6) 0 0 0 6px;
          transition: 1s cubic-bezier(0.445, 0.05, 0.55, 0.95);
          pointer-events: auto;
        }

        .card-bg {
          opacity: 0.75;
          position: absolute;
          top: -60px;
          left: -60px;
          width: calc(100% + 120px);
          height: calc(100% + 120px);
          background-repeat: no-repeat;
          background-position: center center;
          background-size: cover;
          transition: 1s cubic-bezier(0.445, 0.05, 0.55, 0.95),
                      opacity 5s 1s cubic-bezier(0.445, 0.05, 0.55, 0.95);
          pointer-events: none;
          z-index: 0;
          filter: brightness(1.2) contrast(1.1);
        }
        
        /* Alternative background sizing options - can be applied inline */
        .card-bg.contain {
          background-size: contain;
        }
        
        .card-bg.fit-width {
          background-size: 100% auto;
        }
        
        .card-bg.fit-height {
          background-size: auto 100%;
        }
        
        .card-bg.position-top {
          background-position: center top;
        }
        
        .card-bg.position-bottom {
          background-position: center bottom;
        }

        .card-info {
          padding: 30px;
          position: absolute;
          bottom: 0;
          width: 100%;
          color: #fff;
          transform: translateY(40%);
          transition: 0.6s 1.6s cubic-bezier(0.215, 0.61, 0.355, 1);
          z-index: 2;
          pointer-events: auto;
        }

        .card-info::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          z-index: 0;
          width: 100%;
          height: 100%;
          background-image: linear-gradient(to bottom, transparent 0%, rgba(0, 0, 0, 0.6) 100%);
          background-blend-mode: overlay;
          opacity: 0;
          transform: translateY(100%);
          transition: 5s 1s cubic-bezier(0.445, 0.05, 0.55, 0.95);
        }

        .card-info h2 {
          font-size: 2.5em;
          margin-bottom: 15px;
          text-shadow: rgba(0, 0, 0, 0.5) 0 10px 10px;
          font-family: 'UnifrakturCook', serif;
          color: #d4af37;
          position: relative;
          z-index: 1;
        }

        .card-info p {
          font-size: 1.1em;
          line-height: 1.6;
          opacity: 0;
          text-shadow: rgba(0, 0, 0, 1) 0 2px 3px;
          font-family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
          transform: translateY(20px);
          transition: 0.6s 1.6s cubic-bezier(0.215, 0.61, 0.355, 1);
          position: relative;
          z-index: 1;
        }

        /* Mobile responsive cards */
        @media (max-width: 768px) {
          .cards-wrapper {
            gap: 3rem;
            padding: 60px 15px;
          }

          .card-wrap {
            width: 95%;
            min-height: 320px;
            margin-bottom: 0;
          }
          
          .card-wrap:nth-child(odd),
          .card-wrap:nth-child(even) {
            align-self: center;
            margin: 0;
          }
          
          .card {
            min-height: 320px;
          }

          .card-bg {
            opacity: 0.6;
          }

          .card-info {
            padding: 20px;
            transform: translateY(20%);
          }

          .card-info h2 {
            font-size: 1.8em;
          }

          .card-info p {
            font-size: 0.95em;
            opacity: 0.9;
            transform: translateY(0);
          }

          /* Simplify hover effects on mobile */
          .card-wrap:hover .card-info {
            transform: translateY(0);
          }

          .card-wrap:hover .card-bg {
            opacity: 0.7;
            transform: scale(1.05);
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
            pointerEvents: 'none', // Disable pointer events to allow scrolling
            touchAction: 'auto', // Allow touch scrolling
          }}
        >
          <Scene 
            isMobile={isMobile} 
            scrollY={scrollY} 
            onAssetsLoaded={handleAssetLoaded}
          />
        </Canvas>
      </div>
      
      {/* Scrollable Overlay Content */}
      <div style={{
          position: 'relative',
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
          minHeight: '100vh',
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
          
          {/* Unified content box with description, coin, and contract info */}
          
        </div>
        
        {/* Invisible spacer to push cards down and reveal background scene */}
        {/* <div style={{ 
          height: getResponsiveValue('60vh', '5vh', '50vh', '15vh'),
          width: '100%',
          position: 'relative',
        }} /> */}
        
        {/* Alternating Cards Section */}
        <div className="cards-wrapper" style={{ marginTop: getResponsiveValue('2rem', '0rem', '0rem', '2rem') }}>
        <div className="card-wrap" ref={el => {
            if (el && !cardRefs.current.includes(el)) {
              cardRefs.current.push(el);
            }
          }} onClick={() => handleCardFlip(0)}>
            <div className={`card-container ${flippedCards.has(0) ? 'flipped' : ''}`}>
              {/* Front of card */}
              <div className="card-face card-front">
                <div className="card">
                  <span className="flip-hint">Click to flip</span>
                  <div className="card-bg" style={{ 
                    backgroundImage: 'linear-gradient(rgba(212, 175, 55, 0.3), rgba(0, 0, 0, 0.2)), url("/images/teknoir.jpg")',
                  }}></div>
                  <div className="card-info">
                    <h2>Divine Protection</h2>
                    <p>As a symbol of protection, purity, and principled prosperity, Our Lady stands as the ideal counternarrative to crypto's malign influences and bad actors.</p>
                  </div>
                </div>
              </div>
              {/* Back of card */}
              <div className="card-face card-back">
                <div className="card">
                  <span className="flip-hint">Click to flip</span>
                  <div className="card-back-content">
                    <h3>Sacred Shield Against Scams</h3>
                    <p>In the volatile realm of cryptocurrency, Our Lady of Perpetual Profit serves as your divine guardian against:</p>
                    <ul>
                      <li>Rug pulls and exit scams</li>
                      <li>Pump and dump schemes</li>
                      <li>Malicious smart contracts</li>
                      <li>FUD and market manipulation</li>
                    </ul>
                    <p>Through faith in sound tokenomics and community-driven governance, we create a sanctuary of sustainable growth and honest returns.</p>
                    <p style={{ marginTop: '20px', fontStyle: 'italic', opacity: 0.8 }}>
                      "In code we trust, but in Our Lady we verify."
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card-wrap" ref={el => {
            if (el && !cardRefs.current.includes(el)) {
              cardRefs.current.push(el);
            }
          }} onClick={() => handleCardFlip(1)}>
            <div className={`card-container ${flippedCards.has(1) ? 'flipped' : ''}`}>
              {/* Front of card */}
              <div className="card-face card-front">
                <div className="card">
                  <span className="flip-hint">Click to flip</span>
                  <div className="card-bg" style={{ 
                    backgroundImage: 'linear-gradient(rgba(212, 175, 55, 0.3), rgba(0, 0, 0, 0.2)), url("/vsClown.jpg")',
                  }}></div>
                  <div className="card-info">
                    <h2>Divine Protection</h2>
                    <p>As a symbol of protection, purity, and principled prosperity, Our Lady stands as the ideal counternarrative to crypto's malign influences and bad actors.</p>
                  </div>
                </div>
              </div>
              {/* Back of card */}
              <div className="card-face card-back">
                <div className="card">
                  <span className="flip-hint">Click to flip</span>
                  <div className="card-back-content">
                    <h3>Sacred Shield Against Scams</h3>
                    <p>In the volatile realm of cryptocurrency, Our Lady of Perpetual Profit serves as your divine guardian against:</p>
                    <ul>
                      <li>Rug pulls and exit scams</li>
                      <li>Pump and dump schemes</li>
                      <li>Malicious smart contracts</li>
                      <li>FUD and market manipulation</li>
                    </ul>
                    <p>Through faith in sound tokenomics and community-driven governance, we create a sanctuary of sustainable growth and honest returns.</p>
                    <p style={{ marginTop: '20px', fontStyle: 'italic', opacity: 0.8 }}>
                      "In code we trust, but in Our Lady we verify."
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card-wrap" ref={el => {
            if (el && !cardRefs.current.includes(el)) {
              cardRefs.current.push(el);
            }
          }} onClick={() => handleCardFlip(2)}>
            <div className={`card-container ${flippedCards.has(2) ? 'flipped' : ''}`}>
              {/* Front of card */}
              <div className="card-face card-front">
                <div className="card">
                  <span className="flip-hint">Click to flip</span>
                  <div className="card-bg" style={{ 
                    backgroundImage: 'linear-gradient(rgba(212, 175, 55, 0.3), rgba(0, 0, 0, 0.2)), url("/images/mosaic.jpg")'
                  }}></div>
                  <div className="card-info">
                    <h2>$RL80 Token</h2>
                    <p>The Holy Trin80 of digital assets - representing liquid80, util80, and integr80. Your divine guide through the volatile seas of cryptocurrency trading.</p>
                  </div>
                </div>
              </div>
              {/* Back of card */}
              <div className="card-face card-back">
                <div className="card">
                  <span className="flip-hint">Click to flip</span>
                  <div className="card-back-content">
                    <h3>The Sacred Trinity of $RL80</h3>
                    <p>Experience the divine trifecta of cryptocurrency innovation:</p>
                    <ul>
                      <li><strong>Liquid80:</strong> Deep liquidity pools ensuring smooth trades without slippage</li>
                      <li><strong>Util80:</strong> Real-world utility through DeFi integrations and partnerships</li>
                      <li><strong>Integr80:</strong> Seamless cross-chain compatibility and ecosystem growth</li>
                    </ul>
                    <p style={{ marginTop: '20px' }}>
                      Built on BASE for low fees and high speed, $RL80 combines the best of traditional finance wisdom with blockchain innovation.
                    </p>
                    <p style={{ marginTop: '15px', padding: '10px', background: 'rgba(212, 175, 55, 0.1)', borderRadius: '5px' }}>
                      <strong>Total Supply:</strong> 1,000,000,000 $RL80<br/>
                      <strong>Tax:</strong> 0% Buy/Sell<br/>
                      <strong>Liquidity:</strong> Locked Forever
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card-wrap" ref={el => {
            if (el && !cardRefs.current.includes(el)) {
              cardRefs.current.push(el);
            }
          }} onClick={() => handleCardFlip(3)}>
            <div className={`card-container ${flippedCards.has(3) ? 'flipped' : ''}`}>
              {/* Front of card */}
              <div className="card-face card-front">
                <div className="card">
                  <span className="flip-hint">Click to flip</span>
                  <div className="card-bg" style={{ 
                    backgroundImage: 'linear-gradient(rgba(212, 175, 55, 0.3), rgba(0, 0, 0, 0.2)), url("/images/lowrider.jpg")'
                  }}></div>
                  <div className="card-info">
                    <h2>Join the Sanctuary</h2>
                    <p>Whether you need a Hail Mary for hard times, or just sanctuary in the new economy, $RL80 is your path to enlightenment and perpetual profit.</p>
                  </div>
                </div>
              </div>
              {/* Back of card */}
              <div className="card-face card-back">
                <div className="card">
                  <span className="flip-hint">Click to flip</span>
                  <div className="card-back-content">
                    <h3>Become a Blessed Holder</h3>
                    <p>Join our divine community and receive the following blessings:</p>
                    <ul>
                      <li>Access to exclusive alpha and trading strategies</li>
                      <li>Community governance voting rights</li>
                      <li>Early access to partnerships and features</li>
                      <li>24/7 support from fellow believers</li>
                      <li>Educational resources on DeFi and crypto</li>
                    </ul>
                    <p style={{ marginTop: '20px' }}>
                      Our congregation grows stronger with each new member. Together, we navigate the turbulent markets with faith, wisdom, and diamond hands.
                    </p>
                    <div style={{ marginTop: '20px', padding: '15px', background: 'rgba(212, 175, 55, 0.1)', borderRadius: '8px', textAlign: 'center' }}>
                      <p style={{ margin: 0, fontSize: '1.1em', color: '#d4af37' }}>
                        "Where two or three gather in profit,<br/>there I am with them."
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
        
        {/* Footer - at the bottom of all content */}
        <footer style={{
          position: 'relative',
          marginTop: '8rem',
          width: '100%',
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
          pointerEvents: 'auto',
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
      
      
      {/* Floating Action Buttons */}
      {mounted && (
        <>
          {/* Burn/Light Candle Button - Left Side */}
          <a
            href="/gallery"
            style={{
              position: 'fixed',
              bottom: isMobile ? '20px' : '30px',
              left: isMobile ? '20px' : '30px',
              padding: isMobile ? '15px 25px' : '20px 35px',
              background: 'linear-gradient(135deg, #2d5016 0%, #4a8c26 100%)',
              color: '#ffffff',
              fontSize: isMobile ? '1.1rem' : '1.3rem',
              fontFamily: 'UnifrakturCook, serif',
              fontWeight: 'bold',
              borderRadius: '50px',
              boxShadow: '0 10px 30px rgba(74, 140, 38, 0.5), 0 0 60px rgba(45, 80, 22, 0.3)',
              textDecoration: 'none',
              zIndex: 9999,
              transition: 'all 0.3s ease',
              cursor: 'pointer',
              animation: 'candleFlicker 3s infinite',
              border: '2px solid rgba(255, 200, 100, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.1)';
              e.currentTarget.style.boxShadow = '0 15px 40px rgba(74, 140, 38, 0.7), 0 0 80px rgba(45, 80, 22, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(74, 140, 38, 0.5), 0 0 60px rgba(45, 80, 22, 0.3)';
            }}
            title="Burn tokens to light a candle"
          >
            🕯️ Light Candle
          </a>
          
          {/* Buy Button - Right Side */}
          <a 
            href="https://app.uniswap.org" // Replace with actual swap link
            target="_blank"
            rel="noopener noreferrer"
            style={{
              position: 'fixed',
              bottom: isMobile ? '20px' : '30px',
              right: isMobile ? '20px' : '30px',
              padding: isMobile ? '15px 30px' : '20px 40px',
              background: 'linear-gradient(135deg, #d4af37 0%, #c48901 100%)',
              color: '#1a0033',
              fontSize: isMobile ? '1.2rem' : '1.5rem',
              fontFamily: 'UnifrakturCook, serif',
              fontWeight: 'bold',
              borderRadius: '50px',
              boxShadow: '0 10px 30px rgba(212, 175, 55, 0.5), 0 0 60px rgba(212, 175, 55, 0.3)',
              textDecoration: 'none',
              zIndex: 9999,
              transition: 'all 0.3s ease',
              cursor: 'pointer',
              animation: 'buyButtonPulse 2s infinite',
              border: '2px solid rgba(255, 255, 255, 0.3)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.1)';
              e.currentTarget.style.boxShadow = '0 15px 40px rgba(212, 175, 55, 0.7), 0 0 80px rgba(212, 175, 55, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(212, 175, 55, 0.5), 0 0 60px rgba(212, 175, 55, 0.3)';
            }}
          >
            🙏 Buy $RL80
          </a>
        </>
      )}
      
      {/* Top Controls Container - Music, User, and Nav - Outside main container */}
      {mounted && (
      <div
        style={{
          position: "fixed",
          top: "20px",
          right: "20px",
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          gap: isMobile ? "10px" : "15px",
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
                width: isMobile ? "48px" : "72px",
                height: isMobile ? "48px" : "72px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                border: "2px solid rgba(255, 255, 255, 0.2)",
                boxShadow: "0 4px 15px rgba(102, 126, 234, 0.4)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: isMobile ? "20px" : "30px",
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
                width: isMobile ? "40px" : "60px",
                height: isMobile ? "40px" : "60px",
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
                  width: isMobile ? "40px" : "60px",
                  height: isMobile ? "40px" : "60px",
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
                  width: isMobile ? "32px" : "48px",
                  height: isMobile ? "32px" : "48px",
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
                <svg width={isMobile ? "16" : "24"} height={isMobile ? "16" : "24"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                  width: isMobile ? "28px" : "42px",
                  height: isMobile ? "28px" : "42px",
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
                <svg width={isMobile ? "14" : "21"} height={isMobile ? "14" : "21"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          )}
        </div>
        
        {/* CyberNav Menu */}
        <CyberNav is80sMode={is80sMode} position="relative" />
      </div>
      )}
    </div>
  );
}

useGLTF.preload('/models/ourlady_rider6.glb');
useGLTF.preload('/models/angelEmoji.glb');
useGLTF.preload('/models/devilEmoji.glb');