"use client";

import { Canvas, useFrame, extend } from "@react-three/fiber";
import { Suspense, useRef, useMemo, useEffect, useState } from "react";
import { useGLTF, Text, shaderMaterial, OrbitControls, useHelper } from "@react-three/drei";
import * as THREE from "three";
// import { useControls } from "leva"; // Uncomment for GUI controls
import DarkClouds from "../../components/Clouds";
import PostProcessingEffects from "../../components/PostProcessingEffects";
import { useFirestoreResults } from '../../utilities/useFirestoreResults';
import { useMusic } from '../../components/MusicContext';
import { useUser, SignInButton } from "@clerk/nextjs";
import { Illumin80ClerkButton } from "../../components/Illumin80Display";
import CyberNav from '../../components/CyberNav';
import SocialBar from '../../components/SocialBar';
import EnhancedVolumetricLight from '@/components/EnhancedVolumetricLight';
import DropInTitle from '../../components/DropInTitle';
import Coin from '../../components/Coin';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import RotatingText from '@/components/RotatingText';
import '@/components/RotatingText.css';
import HandsGLTFScene from "@/components/HandsGLTFScene";
import CompactCandleModal from '@/components/CompactCandleModal';
import FAQSection from '@/components/FAQSection';
import CoinLoader from '@/components/CoinLoader';
import FloatingBar from '@/components/FloatingBar';
import TokenomicsSection from '@/components/TokenomicsSection';
import Illumin80Bouncer from '@/components/Illumin80Bouncer';



// Animated counter component
const AnimatedCounter = ({ target, suffix = '', prefix = '', duration = 2 }) => {
  const [count, setCount] = useState(0);
  const countRef = useRef(null);
  const isInView = useInView(countRef, { once: true });
  
  
  
  useEffect(() => {
    if (!isInView) return;
    
    let startTime;
    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = (timestamp - startTime) / (duration * 1000);
      
      if (progress < 1) {
        setCount(Math.floor(target * progress));
        requestAnimationFrame(animate);
      } else {
        setCount(target);
      }
    };
    
    requestAnimationFrame(animate);
  }, [isInView, target, duration]);

  return (
    <span ref={countRef}>
      {prefix}{count}{suffix}
    </span>
  );
};

// Scroll-responsive Model component with Ticker
function Model({ scrollY, isMobile, onLoad }) {
  const { scene } = useGLTF('/models/ourlady_rider7.glb');
  const groupRef = useRef();

  // Call onLoad when model is ready
  useEffect(() => {
    if (scene && onLoad) {
      onLoad();
    }
  }, [scene, onLoad]);
  
  // Animate based on scroll (from Simple3DScene)
  useFrame(() => {
    if (groupRef.current) {
      const baseY = isMobile ? -15 : -15;
      groupRef.current.position.y = baseY + scrollY * 0.015;
    }
  });
  
  return (
    <group ref={groupRef} position={isMobile ? [2, -8, -10] : [2, 8, -11]}>
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
}

// Scroll-responsive Clouds component wrapper
function ScrollClouds({ scrollY }) {
  const cloudGroupRef = useRef();
  
  // Animate clouds with scroll (from Simple3DScene)
  useFrame(() => {
    if (cloudGroupRef.current) {
      // Clouds move slightly slower than model for parallax effect
      cloudGroupRef.current.position.y = scrollY * 0.012;
    }
  });
  
  return (
    <group ref={cloudGroupRef}>
      <DarkClouds />
    </group>
  );
}

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
        colors={["#d4af37", "#f4e4c1", "#ffd700"]}
        fontSize={{ mobile: "2.5rem", desktop: "4rem" }}
        isMobile={isMobile}
        triggerAnimation={titleInView}
        instanceId="welcome-title"
      />
    </div>
  );
}

// Modern StatsSection with cards layout
function StatsSection({ isMobile }) {
  const statsRef = useRef(null);
  const isInView = useInView(statsRef, { threshold: 0.3 });

  const metrics = [
    { value: 4.8, suffix: 'K', prefix: '$', label: 'Market Cap', icon: '💰', gradient: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)' },
    { value: 12, suffix: '+', prefix: '', label: 'Holders', icon: '👥', gradient: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)' },
    { value: 2.4, suffix: 'M', prefix: '$', label: 'Total Value Locked', icon: '🔒', gradient: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)' },
    { value: 7, suffix: '', prefix: '', label: 'Stakers', icon: '⭐', gradient: 'linear-gradient(135deg, #f97316 0%, #ef4444 100%)' },
    { value: 80, suffix: 'K', prefix: '$', label: 'Total Rewards', icon: '🏆', gradient: 'linear-gradient(135deg, #fbbf24 0%, #f97316 100%)' },
    { value: 24.5, suffix: '%', prefix: '', label: 'APY (7D)', icon: '📈', gradient: 'linear-gradient(135deg, #84cc16 0%, #10b981 100%)' },
    { value: 2.8, suffix: '%', prefix: '', label: 'Burned', icon: '🔥', gradient: 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)' },
    { value: 3.2, suffix: 'K', prefix: '$', label: 'Liquidity', icon: '💧', gradient: 'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)' }
  ];

  return (
    <div ref={statsRef}>
      {/* Modern Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
        gridTemplateRows: isMobile ? 'repeat(4, 1fr)' : 'repeat(2, 1fr)',
        gap: isMobile ? '15px' : '20px',
        width: '100%',
        alignItems: 'stretch',
        justifyItems: 'stretch',
      }}>
        {metrics.map((metric, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.05 * index }}
            style={{
              background: 'rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(212, 175, 55, 0.3)',
              borderRadius: '20px',
              padding: isMobile ? '20px' : '30px',
              transition: 'background 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease',
              cursor: 'pointer',
              height: isMobile ? '160px' : '200px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-start',
              width: '100%',
              boxSizing: 'border-box',
              position: 'relative',
            }}
            whileHover={{
              background: 'rgba(0, 0, 0, 0.6)',
              boxShadow: '0 8px 25px rgba(0, 0, 0, 0.4)',
              borderColor: 'rgba(212, 175, 55, 0.6)',
            }}
          >
            {/* Icon */}
            <div
              style={{
                width: isMobile ? '40px' : '50px',
                height: isMobile ? '40px' : '50px',
                borderRadius: '12px',
                background: metric.gradient,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: isMobile ? '15px' : '20px',
                fontSize: isMobile ? '20px' : '24px',
                flexShrink: 0,
              }}
            >
              {metric.icon}
            </div>

            {/* Value */}
            <div style={{
              fontSize: isMobile ? '28px' : '36px',
              fontWeight: '800',
              color: 'white',
              marginBottom: '8px',
              fontFamily: "'Fjalla One', sans-serif",
            }}>
              <AnimatedCounter 
                target={metric.value} 
                suffix={metric.suffix} 
                prefix={metric.prefix} 
              />
            </div>

            {/* Label */}
            <div style={{
              fontSize: isMobile ? '11px' : '13px',
              color: 'rgba(255, 255, 255, 0.7)',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              fontWeight: '600',
              fontFamily: "'Fjalla One', sans-serif",
            }}>
              {metric.label}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// LayeredClouds - individual cloud sprites with parallax
function LayeredClouds({ scrollY }) {
  const cloudTexture = useMemo(() => {
    const texture = new THREE.TextureLoader().load('/PinkCloudA.png');
    texture.generateMipmaps = false;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    return texture;
  }, []);
  
  const cloudRefs = useRef([]);
  
  // Different parallax speeds for depth layers (moved much closer to be visible)
  const cloudLayers = [
    // Background layer - behind model but visible
    { position: [-80, -20, -50], scale: [60, 60, 60], speed: 0.003, opacity: 0.6 },
    { position: [60, -10, -45], scale: [50, 50, 50], speed: 0.003, opacity: 0.6 },
    { position: [-30, -35, -40], scale: [40, 40, 40], speed: 0.003, opacity: 0.6 },
    
    // Mid layer - further behind model
    { position: [-50, 20, -35], scale: [55, 55, 55], speed: 0.007, opacity: 0.7 },
    { position: [40, 45, -30], scale: [45, 45, 45], speed: 0.007, opacity: 0.7 },
    { position: [0, -10, -25], scale: [50, 50, 50], speed: 0.007, opacity: 0.7 },
  ];
  
  // Animate each cloud layer with different parallax speeds
  useFrame(() => {
    cloudRefs.current.forEach((cloudMesh, index) => {
      if (cloudMesh && cloudLayers[index]) {
        cloudMesh.position.y = cloudLayers[index].position[1] + scrollY * cloudLayers[index].speed;
      }
    });
  });
  
  return (
    <group>
      {cloudLayers.map((cloud, index) => (
        <sprite
          key={index}
          ref={el => cloudRefs.current[index] = el}
          position={cloud.position}
          scale={cloud.scale}
          renderOrder={0}
        >
          <spriteMaterial 
            map={cloudTexture}
            transparent={true}
            opacity={cloud.opacity * 0.6}
            alphaTest={0.1}
            depthTest={true}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </sprite>
      ))}
    </group>
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
  
  // Cleanup geometry on unmount
  useEffect(() => {
    return () => {
      if (ribbonGeometry) {
        ribbonGeometry.dispose();
      }
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

export default function CloudTestPage() {
  // Firestore data
  const topBurners = useFirestoreResults("burnedAmount");
  
  // State for overlay buttons (from home3/page)
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [isSceneLoading, setIsSceneLoading] = useState(true);
  const [fontLoaded, setFontLoaded] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [showMusicControls, setShowMusicControls] = useState(false);
  const [emoji, setEmoji] = useState("😇");
  const [scrollY, setScrollY] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [secondTitleInView, setSecondTitleInView] = useState(false);

  // Refs
  const secondTitleRef = useRef(null);
  const ctasRef = useRef(null);
  
  // useInView hooks
  const ctasInView = useInView(ctasRef, { threshold: 0.3, once: true });

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
    const checkFont = async () => {
      try {
        await document.fonts.load("1em 'UnifrakturCook'");
        await document.fonts.load("1em 'UnifrakturMaguntia'");
        await document.fonts.load("1em 'Fjalla One'");
        setFontLoaded(true);
        document.body.classList.add('fonts-loaded');
      } catch (e) {
        setTimeout(() => {
          setFontLoaded(true);
          document.body.classList.add('fonts-loaded');
        }, 1000);
      }
    };
    checkFont();
  }, []);

  // Update loading state when both font and model are loaded
  useEffect(() => {
    if (fontLoaded && modelLoaded) {
      setTimeout(() => {
        setIsSceneLoading(false);
      }, 500); // Small delay for smooth transition
    }
  }, [fontLoaded, modelLoaded]);

  // Load Pirata One font
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Pirata+One&display=swap';
    link.rel = 'stylesheet';
    if (!document.querySelector('link[href*="Pirata+One"]')) {
      document.head.appendChild(link);
    }
  }, []);

  // Initialize state
  useEffect(() => {
    setMounted(true);
    const checkDevice = () => {
      const width = window.innerWidth;
      const mobile = width <= 768;
      setIsMobile(mobile);
      setIsMobileDevice(mobile);
    };
    
    // Handle scroll events
    const handleScroll = () => {
      setScrollY(window.scrollY || window.pageYOffset || document.documentElement.scrollTop);
    };
    
    checkDevice();
    window.addEventListener('resize', checkDevice);
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('resize', checkDevice);
      window.removeEventListener('scroll', handleScroll);
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

    const observer = new IntersectionObserver(
      ([entry]) => {
        console.log('Second title intersection:', {
          isIntersecting: entry.isIntersecting,
          intersectionRatio: entry.intersectionRatio
        });
        
        if (entry.isIntersecting) {
          console.log('🎯 Second title entered viewport!');
          setSecondTitleInView(true);
        } else {
          console.log('🎯 Second title left viewport!');
          setSecondTitleInView(false);
        }
      },
      {
        threshold: 0.3, // Trigger when 30% of title is visible
        rootMargin: '0px 0px -10% 0px' // Start slightly before fully in view
      }
    );

    observer.observe(secondTitleRef.current);
    console.log('Intersection Observer set up for second title');

    return () => {
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
        overflowX: 'hidden',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch', // Enable smooth scrolling on iOS
        opacity: isSceneLoading ? 0 : 1,
        transition: 'opacity 0.5s ease-in-out',
      }}>
      {/* 3D Scene Background */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        pointerEvents: 'none',
      }}>
        <Canvas
          camera={{ position: [0, -10, 40], fov: 40, near: 0.1, far: 300 }}
          gl={{
            antialias: false,
            powerPreference: 'high-performance',
            preserveDrawingBuffer: true,
            alpha: true,
            premultipliedAlpha: false,
          }}
          frameloop="always"
          dpr={1}
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
          {/* <pointLight position={[0, -20, -30]} color="#ff50eec7" intensity={2} distance={100} />
          <pointLight position={[-40, 0, -20]} color="#ff50eec7" intensity={1.5} distance={80} />
          <pointLight position={[40, -10, -25]} color="#ff50eec7" intensity={1.8} distance={90} /> */}
          
          {/* Orbit Controls for debugging */}
          {/* <OrbitControls 
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            makeDefault
          /> */}
          
          <Suspense fallback={null}>
            <GradientSkySphere />
            {/* <LayeredClouds scrollY={scrollY} /> */}
            <EnhancedVolumetricLight 
              position={[0, 50 + scrollY * 0.015, 0]} 
              target={[3, -50 + scrollY * 0.015, -5]}
              color="#ffffee"
              intensity={1.5}
            />
            <Model scrollY={scrollY} isMobile={isMobile} onLoad={() => setModelLoaded(true)} />
            <ScrollClouds scrollY={scrollY} />
            {/* Additional point lights for desktop only */}
            {!isMobile && (
              <>
                <pointLight position={[0, 5, 10]} intensity={3} />
                <pointLight position={[-10, 0, 10]} intensity={2} />
              </>
            )}
            <PostProcessingEffects />
          </Suspense>
        </Canvas>
      </div>

      {/* Scrollable Overlay Content - Exact structure from home3/page */}
      <div style={{
          position: 'relative',
          width: '100%',
          minHeight: '100vh',
          zIndex: 10,
          pointerEvents: 'none',
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
              left: isMobile ? "5%" : "10%",
              color: "#d4af37",
              fontFamily: 'UnifrakturCook, serif',
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
              {/* Spinning Album Art */}
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
            <SignInButton mode="modal" forceRedirectUrl="/cloud-test">
              <button
                style={{
                  width: isMobileDevice ? "2.5rem" : "3.75rem",
                  height: isMobileDevice ? "2.5rem" : "3.75rem",
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
        <div style={{ order: isMobileDevice ? 4 : 3 }}>
          <SocialBar is80sMode={is80sMode} />
        </div>
        
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
          position: "absolute",
          top: "100vh",
          left: 0,
          right: 0,
          minHeight: "100vh",
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
            padding: isMobile ? '3rem 1.5rem' : '5rem 2rem',
            maxWidth: '900px',
            margin: '0 auto',
          }}
        >
          {/* Animated Drop-In Title with scroll trigger */}
          <ScrollTriggeredTitle isMobile={isMobile} />
        </div>

        {/* Split Hero CTAs */}
        <motion.div
          ref={ctasRef}
          initial={{ opacity: 0, y: 30 }}
          animate={ctasInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.3 }}
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            gap: isMobile ? '20px' : '30px',
            margin: isMobile ? '40px auto' : '60px auto',
            maxWidth: '1200px',
            padding: isMobile ? '0 1.5rem' : '0 2rem',
          }}
        >
          {/* Buy RL80 Card */}
          <motion.div
            style={{
              background: 'rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(20px)',
              border: '2px solid rgba(16, 185, 129, 0.4)',
              borderRadius: '20px',
              padding: isMobile ? '40px 30px' : '50px 40px',
              textAlign: 'center',
              transition: 'all 0.3s ease',
              cursor: 'pointer',
            }}
            whileHover={{
              scale: 1.03,
              background: 'rgba(0, 0, 0, 0.6)',
              borderColor: '#10b981',
              boxShadow: '0 0 30px rgba(16, 185, 129, 0.3)',
            }}
            onClick={() => window.open('https://app.uniswap.org/swap', '_blank')}
          >
            <div style={{ fontSize: isMobile ? '50px' : '60px', marginBottom: '20px' }}>🚀</div>
            <h3 style={{
              color: 'white',
              fontSize: isMobile ? '28px' : '32px',
              marginBottom: '15px',
              fontFamily: "'Fjalla One', sans-serif",
            }}>
              Buy RL80
            </h3>
            <span style={{
              fontSize: isMobile ? '40px' : '48px',
              fontWeight: '900',
              display: 'block',
              margin: '20px 0',
              color: '#10b981',
              fontFamily: "'Fjalla One', sans-serif",
            }}>
              $0.0048
            </span>
            <p style={{
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '16px',
              lineHeight: '1.6',
              fontFamily: "'Inter', sans-serif",
            }}>
              Available on Uniswap, PancakeSwap & Major DEXs
            </p>
          </motion.div>

          {/* Stake & Earn Card */}
          <motion.div
            style={{
              background: 'rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(20px)',
              border: '2px solid rgba(245, 158, 11, 0.4)',
              borderRadius: '20px',
              padding: isMobile ? '40px 30px' : '50px 40px',
              textAlign: 'center',
              transition: 'all 0.3s ease',
              cursor: 'pointer',
            }}
            whileHover={{
              scale: 1.03,
              background: 'rgba(0, 0, 0, 0.6)',
              borderColor: '#f59e0b',
              boxShadow: '0 0 30px rgba(245, 158, 11, 0.3)',
            }}
            onClick={() => window.open('/stake', '_blank')}
          >
            <div style={{ fontSize: isMobile ? '50px' : '60px', marginBottom: '20px' }}>💰</div>
            <h3 style={{
              color: 'white',
              fontSize: isMobile ? '28px' : '32px',
              marginBottom: '15px',
              fontFamily: "'Fjalla One', sans-serif",
            }}>
              Stake & Earn
            </h3>
            <span style={{
              fontSize: isMobile ? '40px' : '48px',
              fontWeight: '900',
              display: 'block',
              margin: '20px 0',
              color: '#f59e0b',
              fontFamily: "'Fjalla One', sans-serif",
            }}>
              24.5% APY
            </span>
            <p style={{
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '16px',
              lineHeight: '1.6',
              fontFamily: "'Inter', sans-serif",
            }}>
              Lock your tokens and earn passive rewards daily
            </p>
          </motion.div>
        </motion.div>

        {/* Combined Token Information Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          style={{
            position: 'relative',
            margin: '4rem auto',
            width: isMobile ? '95%' : '90%',
            maxWidth: '1200px',
            zIndex: 1,
            pointerEvents: 'auto'
          }}
        >
          <div style={{
            background: 'rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(255, 215, 0, 0.2)',
            borderRadius: '30px',
            padding: isMobile ? '30px 20px' : '40px',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            
            {/* Glow effect */}
            <div style={{
              content: '',
              position: 'absolute',
              top: '-50%',
              left: '-50%',
              width: '200%',
              height: '200%',
              background: 'radial-gradient(circle, rgba(255, 215, 0, 0.05) 0%, transparent 70%)',
              animation: 'statsRotate 30s linear infinite',
              zIndex: 0
            }} />

            <div style={{ position: 'relative', zIndex: 1 }}>
              {/* Section Header */}
              <div style={{
                textAlign: 'center',
                marginBottom: '40px'
              }}>
                <h1 style={{
                  fontFamily: "'UnifrakturCook', serif",
                  fontSize: isMobile ? '2rem' : '3.5rem',
                  fontWeight: '800',
                  background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  marginBottom: '8px'
                }}>
                  To<span style={{fontFamily: "'Pirata One', serif"}}>k</span>enomics 
                </h1>
                
                <p style={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '1em'
                }}>
                  𝓞𝖚𝖗 𝕷𝖆𝖉𝖞 𝔬𝔣 𝕻𝖊𝖗𝖕𝖊𝖙𝖚𝖆𝖑 𝕻𝖗𝖔𝖋𝖎𝖙 (RL80)
                </p>
              </div>

              {/* Stats Cards */}
              <div style={{ marginBottom: '50px' }}>
                <StatsSection isMobile={isMobile} />
              </div>

              {/* Tokenomics Content */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : '350px 1fr',
                gap: isMobile ? '30px' : '40px',
                alignItems: 'start'
              }}>
                {/* Left Side - Pie Chart */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center'
                }}>
                  <div style={{
                    position: 'relative',
                    marginBottom: '30px'
                  }}>
                    <div style={{
                      position: 'relative',
                      width: isMobile ? '240px' : '280px',
                      height: isMobile ? '240px' : '280px',
                      margin: '0 auto'
                    }}>
                      {/* Pie Chart */}
                      <div style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: '50%',
                        background: `conic-gradient(
                          from 0deg,
                          #FFD700 0deg 306deg,
                          #4CAF50 306deg 342deg,
                          #2196F3 342deg 360deg
                        )`,
                        position: 'relative',
                        filter: 'drop-shadow(0 10px 30px rgba(0, 0, 0, 0.5))'
                      }}>
                        {/* Center circle with text */}
                        <div style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          width: isMobile ? '120px' : '140px',
                          height: isMobile ? '120px' : '140px',
                          borderRadius: '50%',
                          background: '#0a0a0a',
                          border: '2px solid rgba(255,215,0,0.3)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <div style={{
                            fontSize: isMobile ? '2em' : '2.5em',
                            fontWeight: '800',
                            color: '#FFD700',
                            lineHeight: '1'
                          }}>
                            80B
                          </div>
                          <div style={{
                            color: 'rgba(255, 255, 255, 0.7)',
                            fontSize: isMobile ? '0.7em' : '0.8em',
                            textTransform: 'uppercase',
                            letterSpacing: '1px'
                          }}>
                            Total Supply
                          </div>
                        </div>
                      </div>
                      
                      {/* External labels */}
                      <div style={{
                        position: 'absolute',
                        top: '5%',
                        right: '-25px',
                        padding: '8px 12px',
                        background: 'rgba(0, 0, 0, 0.3)',
                        borderRadius: '8px',
                        border: '1px solid #FFD700',
                        backdropFilter: 'blur(10px)'
                      }}>
                        <div style={{
                          fontSize: '14px',
                          fontWeight: 'bold',
                          color: '#FFD700',
                          marginBottom: '2px'
                        }}>
                          85%
                        </div>
                        <div style={{
                          fontSize: '11px',
                          color: 'rgba(255,255,255,0.9)',
                          whiteSpace: 'nowrap'
                        }}>
                          Liquidity Pool
                        </div>
                      </div>
                      
                      <div style={{
                        position: 'absolute',
                        top: '5%',
                        left: '-15px',
                        padding: '8px 12px',
                        background: 'rgba(0, 0, 0, 0.3)',
                        borderRadius: '8px',
                        border: '1px solid #4CAF50',
                        backdropFilter: 'blur(10px)'
                      }}>
                        <div style={{
                          fontSize: '14px',
                          fontWeight: 'bold',
                          color: '#4CAF50',
                          marginBottom: '2px'
                        }}>
                          10%
                        </div>
                        <div style={{
                          fontSize: '11px',
                          color: 'rgba(255,255,255,0.9)',
                          whiteSpace: 'nowrap'
                        }}>
                          Treasury
                        </div>
                      </div>
                      
                      <div style={{
                        position: 'absolute',
                        top: '-20%',
                        left: '35%',
                        padding: '8px 12px',
                        background: 'rgba(0, 0, 0, 0.3)',
                        borderRadius: '8px',
                        border: '1px solid #2196F3',
                        backdropFilter: 'blur(10px)'
                      }}>
                        <div style={{
                          fontSize: '14px',
                          fontWeight: 'bold',
                          color: '#2196F3',
                          marginBottom: '2px'
                        }}>
                          5%
                        </div>
                        <div style={{
                          fontSize: '11px',
                          color: 'rgba(255,255,255,0.9)',
                          whiteSpace: 'nowrap'
                        }}>
                          Marketing / CEX
                        </div>
                      </div>
                    </div>
                    
                    {/* Distribution Label */}
                    <div style={{
                      textAlign: 'center',
                      marginTop: '20px'
                    }}>
                      <div style={{
                        fontSize: '1.1em',
                        fontWeight: '600',
                        color: '#FFD700',
                        textTransform: 'uppercase',
                        letterSpacing: '1px'
                      }}>
                        Distribution
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Right Side - Tax Structure */}
                <div style={{
                  display: 'grid',
                  gap: '25px'
                }}>
                  {/* Tax Structure Box */}
                  <div style={{
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 215, 0, 0.2)',
                    borderRadius: '20px',
                    padding: '25px'
                  }}>
                    <h2 style={{
                      fontSize: '1.3em',
                      fontWeight: '700',
                      marginBottom: '20px',
                      color: '#FFD700',
                      textAlign: 'center',
                      textTransform: 'uppercase',
                      letterSpacing: '1px'
                    }}>
                      Tax Structure
                    </h2>
                    
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-around',
                      marginBottom: '25px'
                    }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{
                          fontSize: '3em',
                          fontWeight: '800',
                          background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text',
                          lineHeight: '1'
                        }}>
                          4%
                        </div>
                        <div style={{
                          color: 'rgba(255, 255, 255, 0.7)',
                          fontSize: '0.9em',
                          marginTop: '5px'
                        }}>
                          Buy / Sell Tax
                        </div>
                      </div>
                    </div>
                    
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
                      gap: '15px'
                    }}>
                      <div style={{
                        background: 'rgba(255, 215, 0, 0.05)',
                        border: '1px solid rgba(255, 215, 0, 0.2)',
                        borderRadius: '12px',
                        padding: '15px',
                        textAlign: 'center',
                        transition: 'all 0.3s ease'
                      }}>
                        <div style={{ fontSize: '2em', marginBottom: '8px' }}>🕯️</div>
                        <div style={{
                          fontSize: '1.5em',
                          fontWeight: '700',
                          color: '#FFD700',
                          marginBottom: '5px'
                        }}>
                          2%
                        </div>
                        <div style={{
                          fontSize: '0.8em',
                          color: 'rgba(255, 255, 255, 0.7)'
                        }}>
                          Staking Rewards
                        </div>
                      </div>
                      
                      <div style={{
                        background: 'rgba(255, 215, 0, 0.05)',
                        border: '1px solid rgba(255, 215, 0, 0.2)',
                        borderRadius: '12px',
                        padding: '15px',
                        textAlign: 'center',
                        transition: 'all 0.3s ease'
                      }}>
                        <div style={{ fontSize: '2em', marginBottom: '8px' }}>💧</div>
                        <div style={{
                          fontSize: '1.5em',
                          fontWeight: '700',
                          color: '#FFD700',
                          marginBottom: '5px'
                        }}>
                          1.5%
                        </div>
                        <div style={{
                          fontSize: '0.8em',
                          color: 'rgba(255, 255, 255, 0.7)'
                        }}>
                          Auto-Liquidity
                        </div>
                      </div>
                      
                      <div style={{
                        background: 'rgba(255, 215, 0, 0.05)',
                        border: '1px solid rgba(255, 215, 0, 0.2)',
                        borderRadius: '12px',
                        padding: '15px',
                        textAlign: 'center',
                        transition: 'all 0.3s ease'
                      }}>
                        <div style={{ fontSize: '2em', marginBottom: '8px' }}>📢</div>
                        <div style={{
                          fontSize: '1.5em',
                          fontWeight: '700',
                          color: '#FFD700',
                          marginBottom: '5px'
                        }}>
                          0.5%
                        </div>
                        <div style={{
                          fontSize: '0.8em',
                          color: 'rgba(255, 255, 255, 0.7)'
                        }}>
                          Marketing
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Additional content sections */}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          style={{
            position: 'relative',
            margin: '4rem auto',
            width: isMobile ? '95%' : '90%',
            maxWidth: '1200px',
            zIndex: 1,
            pointerEvents: 'auto'
          }}
        >
          <div style={{
            background: 'rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(255, 215, 0, 0.2)',
            borderRadius: '30px',
            padding: isMobile ? '30px 20px' : '40px',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            
            {/* Glow effect */}
            <div style={{
              content: '',
              position: 'absolute',
              top: '-50%',
              left: '-50%',
              width: '200%',
              height: '200%',
              background: 'radial-gradient(circle, rgba(255, 215, 0, 0.05) 0%, transparent 70%)',
              animation: 'handsRotate 30s linear infinite',
              zIndex: 0
            }} />

            <div style={{
              position: "relative",
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 0.6fr) minmax(0, 0.4fr)",
              gap: isMobile ? "2rem" : "3rem",
              alignItems: "center",
              color: '#ffffff',
              zIndex: 1
            }}>
                               
                              <div style={{
                          height: isMobile ? '50vh' : '70vh',
                          minHeight: '400px',
                        }}>
                          <HandsGLTFScene />
                        </div>
                               {/* Right Column - Text Content */}
                   <div style={{
              padding: isMobile ? '0 0.5rem' : '0 1rem',
              color: '#ffffff',
              minHeight: isMobile ? '300px' : '500px', // Match the candle container height
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center', // Center all children horizontally
              width: '100%', // Ensure full width of grid column
              boxSizing: 'border-box', // Include padding in width calculation
              overflow: 'hidden', // Prevent content overflow
              position: 'relative',
              marginTop: isMobile ? '0' : '-3rem'
            }}>
             
     
              <br/>
     
              <h1 style={{fontFamily: 'UnifrakturCook, serif', fontSize: isMobile ? '2.5rem' : '3.5rem', marginTop: '2rem', marginBottom: '1.5rem', textAlign: 'center', lineHeight: '0.8',color: '#d4af37'}}>Get On Her Watchlist</h1>
       
              <div style={{
                lineHeight: 1.5,
                opacity: 0.9,
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                fontWeight: 400,
                letterSpacing: '0.02em',
                fontSize: isMobile ? '1.2rem' : '1.4rem',
                textAlign: 'center',
                width: '100%',
                maxWidth: '600px',
              }}>
              {/* <span style={{ fontSize: isMobile ? '1.3rem' : '1.8rem', fontWeight: '600', display: 'block', marginBottom: '1.5rem', lineHeight: '1.3' }}>
                Add a Green Candle to Her Timeline
              </span> */}
              {/* <p style={{ 
                marginBottom: '2rem',
                fontFamily: "'Pirata One', cursive",
                fontSize: isMobile ? '1.5rem' : '1.8rem',
                fontWeight: '400',
                textAlign: 'center',
                color: '#ffffff',
                textShadow: '2px 2px 4px rgba(0, 0, 0, 0.7)'
              }}>
                Join The Leaderboard of Luminaries
              </p> */}
                   {/* <img src="/timeline2.png" alt="Candle Icon" style={{ width: isMobile ? '50%' : '50%', height: 'auto', marginBottom: '-1rem', marginTop: '-2rem' }} /> */}
         
              <p style={{ marginBottom: '1rem', opacity: 0.8, fontSize: isMobile ? '1rem' : '1.1rem' }}>
Add a green candle to her timeline and watch miracles happen. Every candle boosts the token, fortifies the faithful, and pleases the Patron Saint of Day Traders. The top 80 stakers and burners ascend to the Illumin80 — a guild that unlocks even more glorious gains.
              </p>

              {/* Top Burners Leaderboard */}
              <div style={{
                margin: '2rem 0',
                padding: '1.5rem',
                background: 'rgba(0, 0, 0, 0.4)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(212, 175, 55, 0.3)',
                borderRadius: '15px',
                color: '#ffffff',
                fontFamily: "'Inter', sans-serif",
                boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)',
              }}>
                <h3 style={{
                  fontSize: isMobile ? '1.2rem' : '1.4rem',
                  color: '#d4af37',
                  textAlign: 'center',
                  marginBottom: '1rem',
                  fontFamily: "'Fjalla One', sans-serif",
                  textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)',
                }}>
                  🔥 Top Burners
                </h3>
                <div 
                  className="leaderboard-scroll"
                  style={{
                    maxHeight: '220px',
                    overflowY: 'auto',
                    scrollbarWidth: 'thin',
                    scrollbarColor: 'rgba(212, 175, 55, 0.5) transparent',
                    paddingRight: '5px',
                  }}
                >
                  {topBurners.slice(0, 10).map((burner, index) => (
                    <div 
                      key={burner.id || index} 
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.5rem 0.5rem',
                        borderBottom: index < 9 ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
                        borderRadius: '8px',
                        transition: 'background 0.2s ease',
                        position: 'relative',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(212, 175, 55, 0.08)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                      }}>
                        <span style={{
                          fontSize: isMobile ? '0.9rem' : '1rem',
                          fontWeight: 'bold',
                          color: index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : '#d4af37',
                          minWidth: '2rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                        }}>
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                        </span>
                        {burner.image && (
                          <div style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            overflow: 'hidden',
                            border: '1px solid rgba(212, 175, 55, 0.5)',
                            flexShrink: 0,
                          }}>
                            <img 
                              src={burner.image} 
                              alt={burner.userName || 'User'} 
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                              }}
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                        <span style={{
                          fontSize: isMobile ? '0.9rem' : '1rem',
                          color: '#ffffff',
                        }}>
                          {burner.userName || 'Anonymous'}
                        </span>
                      </div>
                      <span style={{
                        fontSize: isMobile ? '0.8rem' : '0.9rem',
                        color: '#ffd700',
                        fontWeight: 'bold',
                        textShadow: '0 0 5px rgba(255, 215, 0, 0.3)',
                      }}>
                        {(burner.burnedAmount || 0).toLocaleString()} RL80
                      </span>
                    </div>
                  ))}
                  {topBurners.length === 0 && (
                    <div style={{
                      textAlign: 'center',
                      padding: '1rem',
                      color: 'rgba(255, 255, 255, 0.7)',
                      fontStyle: 'italic',
                    }}>
                      Loading top burners...
                    </div>
                  )}
                </div>
              </div>

          </div>
       <button
                        onClick={handleOpenModal}
                         style={{
                          marginTop: isMobile ? '1.5rem' : '2rem',
                          padding: isMobile ? '0.8rem 2rem' : '1rem 3rem',
                          fontSize: isMobile ? '1.2rem' : '1.4rem',
                          fontWeight: 'bold',
                          fontFamily: "'Fjalla One', sans-serif",
                          textTransform: 'uppercase',
                          letterSpacing: '2px',
                          color: '#000000',
                          background: 'linear-gradient(135deg, #d4af37 0%, #f4e4c1 50%, #d4af37 100%)',
                          border: '3px solid #d4af37',
                          borderRadius: '12px',
                          boxShadow: '0 8px 20px rgba(212, 175, 55, 0.4), 0 0 30px rgba(212, 175, 55, 0.3)',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          position: 'relative',
                          overflow: 'hidden',
                          zIndex: 102,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-3px) scale(1.05)';
                          e.currentTarget.style.boxShadow = '0 12px 30px rgba(212, 175, 55, 0.6), 0 0 40px rgba(212, 175, 55, 0.5)';
                          e.currentTarget.style.background = 'linear-gradient(135deg, #f4e4c1 0%, #ffd700 50%, #f4e4c1 100%)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0) scale(1)';
                          e.currentTarget.style.boxShadow = '0 8px 20px rgba(212, 175, 55, 0.4), 0 0 30px rgba(212, 175, 55, 0.3)';
                          e.currentTarget.style.background = 'linear-gradient(135deg, #d4af37 0%, #f4e4c1 50%, #d4af37 100%)';
                        }}
                      >
                        Get Lit
                      </button>
               
           
                    </div>
            </div>
          </div>

        </motion.div>

        {/* Illumin80 Bouncer Section - 2 Column Layout */}
        <div style={{
          position: 'relative',
          margin: '4rem auto 4rem auto',
          width: isMobile ? '95%' : '90%',
          maxWidth: '1200px',
          zIndex: 1,
          pointerEvents: 'auto'
        }}>
          <div style={{
            background: 'rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(255, 215, 0, 0.2)',
            borderRadius: '30px',
            padding: isMobile ? '30px 20px' : '40px',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
            position: 'relative'
          }}>
            <div style={{
              position: "relative",
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
              gap: isMobile ? "2rem" : "3rem",
              alignItems: "center",
              color: '#ffffff',
              zIndex: 1
            }}>
              {/* Left Column - Bouncer */}
              <div style={{
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "center",
                position: "relative",
                minHeight: "500px"
              }}>
                <Illumin80Bouncer />
              </div>
              
              {/* Right Column - Illumin80 Perks */}
              <div style={{
                padding: '0 1rem',
                color: '#ffffff',
                textAlign: 'center'
              }}>
                   <h1 style={{
              fontSize: '3.5rem',
              marginBottom: '1rem',
              color: '#d4af37',
              fontFamily: 'UnifrakturCook, serif',
              textShadow: '0 0 15px rgba(212, 175, 55, 0.5)',
            }}>Join the Illumin80</h1>
                
                <p style={{
                                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',

                  fontSize: '1.2rem',
                  marginBottom: '1.5rem',
                  lineHeight: 1.6,
                  color: '#ffffff',
                  opacity: 0.9
                }}>
                  Burn RL80 tokens to join the top 80 holders and unlock exclusive benefits.
                </p>
                
                <ul style={{
                  fontSize: '1.1rem',
                  lineHeight: 1.8,
                  color: '#ffffff',
                  listStyle: 'none',
                  paddingLeft: '0'
                }}>
                  <li style={{ marginBottom: '0.5rem' }}>
                    <span style={{ color: '#d4af37', marginRight: '0.5rem' }}>✨</span>
                    Access to the Moon Room
                  </li>
                  <li style={{ marginBottom: '0.5rem' }}>
                    <span style={{ color: '#d4af37', marginRight: '0.5rem' }}>✨</span>
                    Staking rewards of 2.5% of all taxes
                  </li>
                  {/* <li style={{ marginBottom: '0.5rem' }}>
                    <span style={{ color: '#d4af37', marginRight: '0.5rem' }}>🌙</span>
                    Divine blessings
                  </li> */}
                </ul>

                <button 
                  onClick={() => setIsModalOpen(true)}
                  style={{
                    marginTop: '1.5rem',
                    padding: '12px 24px',
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    color: '#000',
                    background: 'linear-gradient(135deg, #d4af37 0%, #f4e4c1 100%)',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 15px rgba(212, 175, 55, 0.3)',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(212, 175, 55, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(212, 175, 55, 0.3)';
                  }}
                >
                  Light a Candle
                </button>
              </div>
            </div>
          </div>
        </div>

                        <div style={{position: 'relative', zIndex: 1, marginTop: '2rem', marginBottom: '7rem'}}>
                         <div ref={secondTitleRef} style={{
                                  textAlign: 'center',
                                  padding: isMobile ? '3rem 1.5rem' : '5rem 2rem',
                                  maxWidth: '900px',
                                  margin: '0 auto',
                                }}>
                                  {/* Animated Drop-In Title */}
                                  <DropInTitle
                                    lines={["PROSPER80", "FOR ALL", "HUMAN80!"]}
                                    colors={["#d4af37", "#f4e4c1", "#ffd700"]}
                                    fontSize={{ mobile: "2.5rem", desktop: "4rem" }}
                                    isMobile={isMobile}
                                    triggerAnimation={secondTitleInView}
                                  />
                        </div>
                                 </div>



        <FAQSection isMobile={isMobile} />

         <div style={{
                        position: "relative",
                        maxWidth: "1400px",
                        margin: "16rem auto",
                        height: "300px", // Fixed container height
                      }}
                      className="desktop-rotating-text">
                        <div style={{ 
                          position: "absolute", 
                          top: "50%", 
                          left: "50%", 
                          transform: "translate(-50%, -50%)",
                          zIndex: 1,
                          width: isMobile ? "95vw" : "80vw",
                          maxWidth: isMobile ? "none" : "600px",
                          height: "200px", // Fixed height to prevent layout shifts
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          overflow: "visible", // Allow text to extend if needed
                          pointerEvents: "none" // Don't interfere with interactions
                        }}>
                          <RotatingText isDesktop={true} />
                        </div>
                      </div>
        


     

        
        {/* Footer - at the bottom of all content */}
       <footer style={{
        marginTop: '8rem',
        padding: '3rem 2rem 2rem',
        background: 'linear-gradient(to bottom, rgba(234, 124, 14, 0.0), rgba(14, 84, 234, 0.2))',
        // borderTop: '1px solid rgba(212, 175, 55, 0.3)',
        color: '#ffffff',
        textAlign: 'center'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          {/* Footer Title */}
          <h3 style={{
            fontFamily: 'UnifrakturCook, serif',
            fontSize: '2.5rem',
            color: '#d4af37',
            marginBottom: '1rem',
            textShadow: '2px 2px 4px rgba(0, 0, 0, 0.7)'
          }}>
            Our Lady of Perpetual Profit
          </h3>
          
          {/* Divider */}
          <div style={{
            width: '100px',
            height: '2px',
            background: 'linear-gradient(90deg, transparent, #d4af37, transparent)',
            margin: '1.5rem auto'
          }} />
          
          {/* Contact Link */}
          <div style={{
            marginBottom: '2rem'
          }}>
            <Link href="/contact" style={{
              color: '#d4af37',
              textDecoration: 'none',
              fontSize: '1.2rem',
              fontFamily: 'Cyber, monospace',
              transition: 'all 0.3s ease',
              textShadow: '0 0 5px rgba(212, 175, 55, 0.3)',
              display: 'inline-block',
              padding: '0.5rem 1.5rem',
              border: '1px solid rgba(212, 175, 55, 0.5)',
              borderRadius: '20px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(212, 175, 55, 0.1)';
              e.currentTarget.style.textShadow = '0 0 10px rgba(212, 175, 55, 0.7)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.textShadow = '0 0 5px rgba(212, 175, 55, 0.3)';
            }}>
              Contact
            </Link>
          </div>
          
          {/* Blessing Text */}
          <p style={{
            fontSize: '1rem',
            fontStyle: 'italic',
            opacity: 0.8,
            marginBottom: '1.5rem',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
          }}>
            "May your gains be eternal and your losses forgotten"
          </p>
          
          {/* Copyright */}
          <p style={{
            fontSize: '0.9rem',
            opacity: 0.6,
            fontFamily: 'Cyber, monospace'
          }}>
            © 2025 All rights reserved.
          </p>
          
          {/* Decorative Elements */}
          <div style={{
            marginTop: '1.5rem',
            fontSize: '1.5rem',
            color: '#d4af37',
            opacity: 0.7
          }}>
            ✦ ✦ ✦
          </div>
        </div>
      </footer>

      </motion.div>

      {/* Add spinning record CSS and fonts */}
      <style jsx global>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        html, body {
          width: 100%;
          height: 100%;
          margin: 0;
          padding: 0;
          overflow-x: hidden;
        }
        
        body {
          margin: 8px;
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
          --coin-diam: 9rem;
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
          -webkit-box-reflect: below 0
            linear-gradient(
              hsla(0, 0%, 100%, 0),
              hsla(0, 0%, 100%, 0) 45%,
              hsla(0, 0%, 100%, 0.2)
            );
          filter: saturate(1.45) hue-rotate(2deg);
        }

        .coin {
          height: var(--coin-diam);
          width: var(--coin-diam);
          position: absolute;
          transform-style: preserve-3d;
          transform-origin: 50%;
          animation: spinCoin var(--spin-speed) infinite linear;
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
          from { transform: rotateY(0deg); }
          to { transform: rotateY(360deg); }
        }
        
        /* Override the font hiding rule for our title */
        .custom-title {
          font-family: 'UnifrakturCook', 'UnifrakturMaguntia', serif !important;
          visibility: visible !important;
          display: block !important;
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
            
            {/* Floating Action Bar */}
            <FloatingBar isMobile={isMobile} />
    </div>
    </>
  );
}