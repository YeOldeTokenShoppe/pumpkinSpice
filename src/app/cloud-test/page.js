"use client";

import { Canvas, useFrame, extend } from "@react-three/fiber";
import { Suspense, useRef, useMemo, useEffect, useState } from "react";
import { useGLTF, Text, shaderMaterial } from "@react-three/drei";
import * as THREE from "three";
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
function Model({ scrollY, isMobile }) {
  const { scene } = useGLTF('/models/ourlady_rider7.glb');
  const groupRef = useRef();
  
  // Animate based on scroll (from Simple3DScene)
  useFrame(() => {
    if (groupRef.current) {
      const baseY = isMobile ? -15 : -15;
      groupRef.current.position.y = baseY + scrollY * 0.015;
    }
  });
  
  return (
    <group ref={groupRef}>
      <primitive 
        object={scene} 
        scale={[10, 10, 10]} 
        position={[2, 8, -11]} 
        rotation={[0.1, -3.2, 0]}
      />
      {/* TickerCurve positioned relative to model (from Simple3DScene) */}
      <TickerCurve 
        scrollY={scrollY}
        scale={3}
        position={[0, 2, 5]} // Position relative to model - moved up
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

// GradientSkySphere from home3/page
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

// StatsSection with spinning coin
function StatsSection({ isMobile }) {
  const statsRef = useRef(null);
  const coinRef = useRef(null);
  const isInView = useInView(statsRef, { threshold: 0.3 });

  return (
    <motion.div
      ref={statsRef}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : {}}
      transition={{ duration: 1, delay: 1 }}
      style={{
        position: 'relative',
        padding: isMobile ? '3rem 1.5rem' : '4rem',
        maxWidth: '1200px',
        margin: '3rem auto',
        background: 'radial-gradient(ellipse, rgba(212,175,55,0.05) 0%, transparent 70%)',
      }}
    >
      {/* Centered Coin Container */}
      <div
        ref={coinRef}
        style={{ 
          position: "absolute",
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: isMobile ? "8rem" : "12rem",
          height: isMobile ? "8rem" : "12rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 100,
        }}
      >
        <Link href="#" className="coin-link" style={{ 
          display: "block",
          width: isMobile ? "7rem" : "10rem",
          height: isMobile ? "7rem" : "10rem"
        }}>
          <Coin />
        </Link>
      </div>

      {/* Stats Grid - 2x2 layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, max-content)',
        gridTemplateRows: 'repeat(2, max-content)',
        gap: isMobile ? '1.5rem' : '2rem',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: isMobile ? '300px' : '400px',
      }}>
        {/* Top Left - Holders */}
        <div style={{ 
          textAlign: 'center',
          background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.05) 0%, rgba(0, 0, 0, 0.8) 50%, rgba(212, 175, 55, 0.05) 100%)',
          backdropFilter: 'blur(12px)',
          borderRadius: '12px',
          border: '2px solid rgba(212, 175, 55, 0.4)',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5), inset 0 0 20px rgba(212, 175, 55, 0.1)',
          padding: isMobile ? '1.5rem 2rem' : '2rem 2.5rem',
          minWidth: isMobile ? '140px' : '180px',
          aspectRatio: '1.2',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <div style={{
            fontSize: isMobile ? '2rem' : '2.5rem',
            fontWeight: 'bold',
            color: '#d4af37',
            textShadow: '0 0 20px rgba(212,175,55,0.5)',
            fontFamily: "'Fjalla One', sans-serif",
          }}>
            <AnimatedCounter target={8} suffix="+" />
          </div>
          <div style={{
            fontSize: '1.1rem',
            color: 'rgba(255,255,255,0.9)',
            marginTop: '0.5rem',
            fontFamily: "'Fjalla One', sans-serif",
            textTransform: 'uppercase',
            letterSpacing: '1px',
            textShadow: '0 2px 4px rgba(0,0,0,0.5)',
          }}>
            Holders
          </div>
        </div>
        
        {/* Top Right - Market Cap */}
        <div style={{ 
          textAlign: 'center',
          background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.05) 0%, rgba(0, 0, 0, 0.8) 50%, rgba(212, 175, 55, 0.05) 100%)',
          backdropFilter: 'blur(12px)',
          borderRadius: '12px',
          border: '2px solid rgba(212, 175, 55, 0.4)',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5), inset 0 0 20px rgba(212, 175, 55, 0.1)',
          padding: isMobile ? '1.5rem 2rem' : '2rem 2.5rem',
          minWidth: isMobile ? '140px' : '180px',
          aspectRatio: '1.2',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <div style={{
            fontSize: isMobile ? '2rem' : '2.5rem',
            fontWeight: 'bold',
            color: '#d4af37',
            textShadow: '0 0 20px rgba(212,175,55,0.5)',
            fontFamily: "'Fjalla One', sans-serif",
          }}>
            <AnimatedCounter target={4.8} suffix="K" prefix="$" />
          </div>
          <div style={{
            fontSize: '1.1rem',
            color: 'rgba(255,255,255,0.9)',
            marginTop: '0.5rem',
            fontFamily: "'Fjalla One', sans-serif",
            textTransform: 'uppercase',
            letterSpacing: '1px',
            textShadow: '0 2px 4px rgba(0,0,0,0.5)',
          }}>
            Market Cap
          </div>
        </div>

        {/* Bottom Left - Tokens Burned */}
        <div style={{ 
          textAlign: 'center',
          background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.05) 0%, rgba(0, 0, 0, 0.8) 50%, rgba(212, 175, 55, 0.05) 100%)',
          backdropFilter: 'blur(12px)',
          borderRadius: '12px',
          border: '2px solid rgba(212, 175, 55, 0.4)',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5), inset 0 0 20px rgba(212, 175, 55, 0.1)',
          padding: isMobile ? '1.5rem 2rem' : '2rem 2.5rem',
          minWidth: isMobile ? '140px' : '180px',
          aspectRatio: '1.2',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <div style={{
            fontSize: isMobile ? '2rem' : '2.5rem',
            fontWeight: 'bold',
            color: '#d4af37',
            textShadow: '0 0 20px rgba(212,175,55,0.5)',
            fontFamily: "'Fjalla One', sans-serif",
          }}>
            <AnimatedCounter target={0} suffix="%" />
          </div>
          <div style={{
            fontSize: '1.1rem',
            color: 'rgba(255,255,255,0.9)',
            marginTop: '0.5rem',
            fontFamily: "'Fjalla One', sans-serif",
            textTransform: 'uppercase',
            letterSpacing: '1px',
            textShadow: '0 2px 4px rgba(0,0,0,0.5)',
          }}>
            Tokens Burned
          </div>
        </div>
        
        {/* Bottom Right - Total Rewards */}
        <div style={{ 
          textAlign: 'center',
          background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.05) 0%, rgba(0, 0, 0, 0.8) 50%, rgba(212, 175, 55, 0.05) 100%)',
          backdropFilter: 'blur(12px)',
          borderRadius: '12px',
          border: '2px solid rgba(212, 175, 55, 0.4)',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5), inset 0 0 20px rgba(212, 175, 55, 0.1)',
          padding: isMobile ? '1.5rem 2rem' : '2rem 2.5rem',
          minWidth: isMobile ? '140px' : '180px',
          aspectRatio: '1.2',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <div style={{
            fontSize: isMobile ? '2rem' : '2.5rem',
            fontWeight: 'bold',
            color: '#d4af37',
            textShadow: '0 0 20px rgba(212,175,55,0.5)',
            fontFamily: "'Fjalla One', sans-serif",
          }}>
            <AnimatedCounter target={80} suffix="K" prefix="$" />
          </div>
          <div style={{
            fontSize: '1.1rem',
            color: 'rgba(255,255,255,0.9)',
            marginTop: '0.5rem',
            fontFamily: "'Fjalla One', sans-serif",
            textTransform: 'uppercase',
            letterSpacing: '1px',
            textShadow: '0 2px 4px rgba(0,0,0,0.5)',
          }}>
            Total Rewards
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// LayeredClouds - individual cloud sprites with parallax
function LayeredClouds({ scrollY }) {
  const cloudTexture = new THREE.TextureLoader().load('/PinkCloudA.png');
  
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
            opacity={cloud.opacity}
            alphaTest={0.01}
            depthTest={true}
            depthWrite={false}
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
  
  // Fetch live data from Firestore
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
        mesh.position.y = point.y + 0.1;  // Slightly below the curve (was +0.1)
        mesh.position.z = point.z + 0.2;  // Closer to ribbon surface (was +0.5)
        
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
  // State for overlay buttons (from home3/page)
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [isSceneLoading, setIsSceneLoading] = useState(false);
  const [showMusicControls, setShowMusicControls] = useState(false);
  const [emoji, setEmoji] = useState("😇");
  const [scrollY, setScrollY] = useState(0);

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

  // Helper function to get responsive values (from home3/page)
  const getResponsiveValue = (mobile, tablet, tabletLandscape, desktop) => {
    if (isMobile) return mobile;
    return desktop; // Simplified for test page
  };

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

  // Sync showMusicControls with playing state
  useEffect(() => {
    if (contextIsPlaying && !showMusicControls) {
      setShowMusicControls(true);
    }
  }, [contextIsPlaying, showMusicControls]);

  return (
    <>
      <div style={{ 
        width: '100vw', 
        background: 'transparent', 
        minHeight: '100vh',
        overflowX: 'hidden',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch', // Enable smooth scrolling on iOS
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
          camera={{ position: [0, 0, 35], fov: 50, near: 0.1, far: 1000 }}
          gl={{
            antialias: false,
            powerPreference: 'high-performance',
            preserveDrawingBuffer: false,
          }}
          style={{
            width: '100%',
            height: '100%',
            display: 'block',
          }}
        >
          <hemisphereLight skyColor="#87CEEB" groundColor="#362d1a" intensity={0.5} />
          <Suspense fallback={null}>
            <GradientSkySphere />
            <LayeredClouds scrollY={scrollY} />
                  <EnhancedVolumetricLight 
        position={[0, 50 + scrollY * 0.015, 0]} 
        target={[3, -30 + scrollY * 0.015, -5]}
        color="#ffffee"
        intensity={2.0}
      />
            <Model scrollY={scrollY} isMobile={isMobile} />
            <ScrollClouds scrollY={scrollY} />
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
          background: "linear-gradient(to bottom, transparent, rgba(0,0,0,0.8), rgba(0,0,0,0.9))",
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

        {/* Stats Section with Spinning Coin */}
        <StatsSection isMobile={isMobile} />

        {/* Additional content sections */}
        <div style={{ 
          padding: "2rem",
          color: "white",
          textAlign: "center",
          maxWidth: "800px",
          margin: "0 auto"
        }}>
          <p style={{ 
            fontSize: "1.2rem", 
            lineHeight: "1.8", 
            marginBottom: "3rem",
            color: "#f4e4c1",
            fontWeight: "300"
          }}>
            Experience the divine convergence of faith and fortune in our revolutionary spiritual ecosystem.
          </p>
          
          {/* Navigation Links */}
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)",
            gap: "2rem",
            marginTop: "4rem"
          }}>
            <div style={{
              padding: "2rem",
              border: "1px solid #d4af37",
              borderRadius: "8px",
              background: "rgba(212, 175, 55, 0.1)",
              cursor: "pointer",
              transition: "all 0.3s ease"
            }}>
              <h3 style={{ color: "#d4af37", marginBottom: "1rem" }}>Divine Features</h3>
              <p style={{ fontSize: "0.9rem", opacity: 0.8 }}>Explore our sacred offerings</p>
            </div>
            
            <div style={{
              padding: "2rem",
              border: "1px solid #d4af37",
              borderRadius: "8px",
              background: "rgba(212, 175, 55, 0.1)",
              cursor: "pointer",
              transition: "all 0.3s ease"
            }}>
              <h3 style={{ color: "#d4af37", marginBottom: "1rem" }}>Sacred Knowledge</h3>
              <p style={{ fontSize: "0.9rem", opacity: 0.8 }}>Learn the divine mysteries</p>
            </div>
            
          </div>
          
        </div>
         <div style={{
                        position: "relative",
                        maxWidth: "1400px",
                        margin: "0 auto 4rem auto",
                        // marginTop: '8rem',
                        // padding: '6rem 1.5rem',
                      }}
                      className="desktop-rotating-text">
                        <div
                          style={{
                            // position: "absolute",
                            // top: 0,
                            // left: 0,
                            // right: 0,
                            // bottom: 0,
                            // backgroundImage: "url(/sacred.png)",
                            // backgroundPosition: "90% 20%",
                            // backgroundRepeat: "no-repeat",
                            // backgroundSize: "100%",
                            // opacity: 0.3,
                            zIndex: 1,
                          }}
                        />
                        <div style={{ position: "relative", zIndex: 2, marginTop: '3rem' }}>
                          <RotatingText isDesktop={true} />
                        </div>
                      </div>
        


     

        
        {/* Footer - at the bottom of all content */}
       <footer style={{
        marginTop: '4rem',
        padding: '3rem 2rem 2rem',
        background: 'linear-gradient(to bottom, rgba(234, 124, 14, 0.0), rgba(14, 84, 234, 0.12))',
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
            © 2024 Church of Perpetual Profit | Blessed by the Blockchain
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
      `}</style>
      
    </div>
    </>
  );
}