"use client";

import { Canvas, useFrame, extend } from "@react-three/fiber";
import React, { Suspense, useRef, useMemo, useEffect, useState } from "react";
import { useGLTF, Text, shaderMaterial, OrbitControls, useHelper, Stats } from "@react-three/drei";
import * as THREE from "three";

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

// Preload the model
useGLTF.preload('/models/ourlady_rider7.glb');

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
      console.log('Scroll drop detected - at bottom:', prevScrollRef.current, '->', scrollY);
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
  
  // Hide when scrolled far OR when at bottom
  const shouldHide = scrollY > 3500 || hideAtBottom;
  
  // Debug logging
  useEffect(() => {
    if (scrollY > 3000 || scrollY <= 20 || hideAtBottom) {
      console.log('Scroll:', scrollY, 'shouldHide:', shouldHide, 'hideAtBottom:', hideAtBottom);
    }
  }, [scrollY, shouldHide, hideAtBottom]);
  
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
        // Clamp Y position to prevent model from going too high
        const maxY = 50;
        const calculatedY = baseY + scrollY * 0.035;
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
  const shouldHide = scrollY > 3500 || hideAtBottom;
  
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
      // Match Model's increased scroll speed with same clamping
      const maxY = 40; // Same max as model
      const calculatedY = baseY + scrollY * 0.035;
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
      // Clouds move slightly slower than model for parallax effect
      // Further increased for 6x page length
      cloudGroupRef.current.position.y = scrollY * 0.03;
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
    threshold: 0.3, 
    triggerOnce: false  // Allow re-triggering when scrolling up/down
  });

  return (
    <div ref={titleRef}>
      <DropInTitle
        lines={["BEHOLD!", "OUR LADY!", "HOLD RL80!"]}
        colors={["#d4af37", "#f4e4c1", "#00fffbff"]}
        fontSize={{ mobile: "2.5rem", desktop: "4rem" }}
        isMobile={isMobile}
        triggerAnimation={titleInView}
        instanceId="welcome-title"
      />
      
      <AnnunciationIntro 
  isMobile={isMobile}
  titleInView={titleInView}
  SkewedHeading={SkewedHeading}
  AngelOfCurrencies={AngelOfCurrencies}
/>
     
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
      if (currentScroll > 9000) {
        console.log('High scroll detected:', currentScroll);
      }
      
      setScrollY(currentScroll);
    };
    
    checkDevice();
    handleScroll(); // Set initial scroll position
    window.addEventListener('resize', checkDevice);
    
    // Add scroll listeners to multiple elements to catch the scroll
    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('scroll', handleScroll, { passive: true });
    document.body.addEventListener('scroll', handleScroll, { passive: true });
    
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

  // Intersection Observer for second title animation
  useEffect(() => {
    if (!secondTitleRef.current) return;

    const targetElement = secondTitleRef.current;
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Second title intersection tracking
        // secondTitleInView is managed by useInView hook
      },
      {
        threshold: 0.3, // Trigger when 30% of title is visible
        rootMargin: '0px 0px -10% 0px' // Start slightly before fully in view
      }
    );

    observer.observe(targetElement);
    // Intersection Observer set up for second title

    return () => {
      if (targetElement) {
        observer.unobserve(targetElement);
      }
      observer.disconnect();
    };
  }, []); // Remove dependency to avoid re-creating observer

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
        zIndex: 0,
        pointerEvents: 'none',
        background: 'linear-gradient(to bottom, #87CEEB, #98D8E8, #B0E0E6)', // Sky gradient
      }}>
        <Canvas
          camera={{ position: [0, -10, 40], fov: 40, near: 0.1, far: 300 }}
          gl={{
            antialias: false,
            powerPreference: 'high-performance',
            preserveDrawingBuffer: false, // Memory optimization
            alpha: true,
            premultipliedAlpha: false,
            stencil: false, // Disable stencil buffer if not needed
            depth: true,
          }}
          frameloop="always" // Keep for scroll animations
          dpr={[1, 1.5]} // Limit max DPR for performance
          style={{
            width: '100%',
            height: '100%',
            display: 'block',
          }}
        >
             <color attach="background" args={['#87CEEB']} />
                     <SpotlightComponent />

          <ambientLight intensity={0.5} />
          {/* Sunset glow lighting */}
          <HemisphereLightComponent />
          <directionalLight 
            position={[-20, 10, -10]} 
            color="#ff50eec7" 
            intensity={1.5}
            castShadow={false}
          />

          
          <Suspense fallback={null}>
            <GradientSkySphere />
            {/* <LayeredClouds scrollY={scrollY} /> */}
            <EnhancedVolumetricLight 
              position={[0, Math.min(50 + scrollY * 0.035, 150), 0]} 
              target={[3, Math.min(-50 + scrollY * 0.035, 50), -5]}
              color="#ffffee"
              intensity={1.5}
            />
            <Model scrollY={scrollY} isMobile={isMobile} onLoad={() => setModelLoaded(true)} />
            {/* <VideoScreens /> */}
            {/* Breath that follows the same scroll animation as the bull */}
            <ScrollingBreath scrollY={scrollY} isMobile={isMobile} />
            
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
        </Canvas>
      </div>

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

      {/* Scrollable Overlay Content - Exact structure from home3/page */}
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
        <div style={{ order: isMobileDevice ? 1 : 1 }}>
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
        <div style={{ order: isMobileDevice ? 0 : 2 }}>
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
      <motion.div
        style={{
          position: isMobile ? "relative" : "absolute",
          top: isMobile ? 0 : "100vh",
          marginTop: isMobile ? "100vh" : 0,
          left: 0,
          right: 0,
          minHeight: "600vh", // 6x original height for extended scrolling
          // background: "linear-gradient(to bottom, transparent, rgba(0,0,0,0.8), rgba(0,0,0,0.9))",
          zIndex: 1,
        }}
        className="welcome-banner"
      >
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
          height: '250vh',
          width: '100%',
          zIndex: 1,
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


       

                        <div style={{position: 'relative', zIndex: 1, marginTop: '150vh', marginBottom: '1rem'}}>
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
          height: '150vh',
          width: '100%',
          zIndex: 1,
        }} />
        
        {/* Footer - at the bottom of all content */}
        <Footer isMobile={isMobile} />


      </motion.div>

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
        }
        
        body {
          width: 100%;
          height: auto;
          margin: 0;
          padding: 0;
          overflow-x: hidden;
          overflow-y: visible;
          box-sizing: border-box;
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
        
        /* Make sure canvas doesn't interfere with GUI interactions */
        canvas {
          pointer-events: none !important;
        }
      `}</style>
      
      <CompactCandleModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCandleCreated={() => {
          console.log('Candle created successfully');
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