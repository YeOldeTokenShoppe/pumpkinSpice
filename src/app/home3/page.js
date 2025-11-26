"use client";

import { Canvas, useFrame, extend } from "@react-three/fiber";
import { Suspense, useRef, useMemo, useEffect, useState } from "react";
import { useGLTF, Text, shaderMaterial, OrbitControls, useHelper } from "@react-three/drei";
import * as THREE from "three";
import { Leva } from "leva";
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
import CyberFAQSection from '@/components/CyberFAQSection';
import CoinLoader from '@/components/CoinLoader';
import CyberFloatingBar from '@/components/CyberFloatingBar';
import TokenomicsSection from '@/components/TokenomicsSection';
import CyberStatsSection from '@/components/CyberStatsSection';
import CyberTokenomicsSection from '@/components/CyberTokenomicsSection';
import CyberButton from '@/components/CyberButton';
import CyberCTACard from '@/components/CyberCTACard';
import Illumin80Bouncer from '@/components/Illumin80Bouncer';
import Numerology1 from '@/components/Numerology1';
import TubesCursor from '@/components/TubesCursor';
import CarouselWrapper from '@/components/CarouselWrapper';
import BreathSmoke from "@/components/BreathSmoke";
import SkewedHeading from "@/components/SkewedHeading";
import AngelOfCurrencies from "@/components/AngelOfCurrencies";
import SlidingNav from "@/components/SlidingNav";
import CircularCTA from "@/components/CircularCTA";




// Animated counter component
const AnimatedCounter = ({ target, suffix = '', prefix = '', duration = 2 }) => {
  const [count, setCount] = useState(0);
  const countRef = useRef(null);
  const isInView = useInView(countRef, { once: true });
  
  
  
  useEffect(() => {
    if (!isInView) return;
    
    let startTime;
    let animationId;
    
    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = (timestamp - startTime) / (duration * 1000);
      
      if (progress < 1) {
        setCount(Math.floor(target * progress));
        animationId = requestAnimationFrame(animate);
      } else {
        setCount(target);
      }
    };
    
    animationId = requestAnimationFrame(animate);
    
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
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
  const staticBreathRef = useRef();

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

// Breath component that follows the same scroll animation as the Model
function ScrollingBreath({ scrollY, isMobile }) {
  const breathGroupRef = useRef();
  
  // Match the exact same animation as the Model component
  useFrame(() => {
    if (breathGroupRef.current) {
      const baseY = isMobile ? -15 : -15;
      breathGroupRef.current.position.y = baseY + scrollY * 0.015;
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
        colors={["#d4af37", "#f4e4c1", "#00ff00"]}
        fontSize={{ mobile: "2.5rem", desktop: "4rem" }}
        isMobile={isMobile}
        triggerAnimation={titleInView}
        instanceId="welcome-title"
      />
      
      {/* Introduction Section */}
      <div style={{
    maxWidth: '1200px',
        margin: '25rem auto 0 auto',
        padding: isMobile ? '30px 0' : '40px 0',
            background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.5), rgba(0, 20, 0, 0.4))',
        borderRadius: '0',
        border: '2px solid #00ff00',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 0 40px rgba(0, 255, 0, 0.3), inset 0 0 40px rgba(0, 255, 0, 0.05)',
        textAlign: 'center',
        opacity: titleInView ? 1 : 0,
        transform: titleInView ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.5s ease-out 0.5s',
        position: 'relative',
    width: '100%',

        zIndex: 10,
   
      }}>
        
        {/* Grid pattern overlay */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              rgba(0, 255, 0, 0.02) 2px,
              rgba(0, 255, 0, 0.02) 4px
            ),
            repeating-linear-gradient(
              90deg,
              transparent,
              transparent 2px,
              rgba(0, 255, 0, 0.02) 2px,
              rgba(0, 255, 0, 0.02) 4px
            )
          `,
          pointerEvents: 'none',
        }} />

               {/* The Annunciation Heading */}
              <SkewedHeading 
    lines={["THE ANNUNCIATION"]}
    // colors={["#d4af37", "#f4e4c1", "#ffd700"]}
        colors={["rgba(0, 255, 0, 1)"]}
    fontSize={{ mobile: "1.8rem", desktop: "3rem" }}
    isMobile={isMobile}
    textAlign="left"
  />
        <div style={{
          fontSize: isMobile ? '1.8rem' : '2.8rem',
          color: '#ffffff',
          fontFamily: "'scotland', sans-serif",
          marginBottom: '0',
          textShadow: '2px 2px 4px rgba(0,0,0,0.9)',
          lineHeight: '1.1',

          width: '100%',
          padding: isMobile ? '0 20px' : '0 80px',
          position: 'relative'
        }}>
 
        
        {/* Angel of Currencies presenting the introduction */}
        <AngelOfCurrencies 
          isMobile={isMobile}
          onLoad={() => console.log('Angel of Currencies loaded for intro')}
        />
       
        
        <span style={{fontFamily: "Blackletter",  fontSize: isMobile ? '1.5rem' : '2.5rem',}}>D</span>escending from the cloud servers comes the digital manifestation of the icon of intercession - the virtual mary in the virtual machine, the protectress of dexes, aider to traders, fren to degens - here to light the way through the dark realm of <span style={{fontFamily: "Blackletter",  fontSize: isMobile ? '1.5rem' : '2.5rem'}}>D</span>e<span style={{fontFamily: "Blackletter",  fontSize: isMobile ? '1.5rem' : '2.5rem'}}>F</span>i. <br/><br/>

        </div>
 
        {/* Circular CTA positioned in bottom right */}
        <div style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          width: isMobile ? '80px' : '150px',
          height: isMobile ? '75px' : '150px',
          zIndex: 20,
        }}>
                <CircularCTA
    text="• PREME EMERE • CLICK TO BUY • PREME EMERE • CLICK TO BUY • PREME EMERE"
    href="/temple"
    accentColor="#00ff00"
    bgColor="none"
            size={isMobile ? 100 : 150}
            textSize={isMobile ? 7 : 8}
          />
        </div>
      </div>
     
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
  const [showMusicControls, setShowMusicControls] = useState(false);
  const [emoji, setEmoji] = useState("😇");
  const [scrollY, setScrollY] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showNumerology, setShowNumerology] = useState(false);

  // Refs
  const secondTitleRef = useRef(null);
  const ctasRef = useRef(null);
  
  // useInView hooks
  const ctasInView = useInView(ctasRef, { threshold: 0.3, once: true });
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
      const mobile = width <= 1024; // Increased breakpoint to catch more devices
      const isMobileValue = width <= 768; // 768px breakpoint for isMobile
      setIsMobile(isMobileValue);
      setIsMobileDevice(mobile);
      console.log('Mobile detection:', { width, mobile, isMobileValue }); // Debug log
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
      
      // if (currentScroll > 0) {
      //   console.log('Scroll detected:', currentScroll);
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
    
    // Also check for scrolling on the main app container
    const checkForScrollContainer = () => {
      // Find all elements that might be scrolling
      const possibleContainers = document.querySelectorAll('div, main, section');
      possibleContainers.forEach(container => {
        if (container.scrollHeight > container.clientHeight) {
          // console.log('Found scrollable container:', container.className || container.id || container.tagName);
          container.addEventListener('scroll', handleScroll, { passive: true });
        }
      });
    };
    
    // Delay to ensure DOM is ready
    setTimeout(checkForScrollContainer, 100);
    
    return () => {
      window.removeEventListener('resize', checkDevice);
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('scroll', handleScroll);
      document.body.removeEventListener('scroll', handleScroll);
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
          // secondTitleInView is managed by useInView hook
        } else {
          console.log('🎯 Second title left viewport!');
          // secondTitleInView is managed by useInView hook
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
            preserveDrawingBuffer: true,
            alpha: true,
            premultipliedAlpha: false,
          }}
          // onCreated={({ gl, scene }) => {
          //   gl.toneMapping = THREE.ACESFilmicToneMapping;
          //   gl.toneMappingExposure = 1.1;
          //   scene.background = new THREE.Color(0x2b1a26);
          // }}
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
            
            {/* Breath that follows the same scroll animation as the bull */}
            <ScrollingBreath scrollY={scrollY} isMobile={isMobile} />
            
            <ScrollClouds scrollY={scrollY} />
            {/* Additional point lights for desktop only */}
            {!isMobile && (
              <>
                {/* <pointLight position={[0, 5, 10]} intensity={3} />
                <pointLight position={[-10, 0, 10]} intensity={2} /> */}
              </>
            )}
            <PostProcessingEffects />
          </Suspense>
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
{/* {!isMobile && (
              <div style={{position: "relative", left: "-22%",}}>
                <div className="purse">
                  <div className="coin">
                    <div className="front"></div>
                    <div className="back"></div>
                    <div className="side">
                      {[...Array(16)].map((_, index) => (
                        <div key={index} className="spoke"></div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )} */}
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
            padding: isMobile ? '2rem 1rem' : '5rem 2.8rem',
            // maxWidth: '900px',
            margin: '0 auto',
          }}
        >
          {/* Animated Drop-In Title with scroll trigger */}
          <ScrollTriggeredTitle isMobile={isMobile} />
        </div>

       
        

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
            background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.5), rgba(0, 20, 0, 0.4))',
            border: '2px solid #00ff00',
            borderRadius: '0',
            padding: isMobile ? '30px 20px' : '40px',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 0 40px rgba(0, 255, 0, 0.3), inset 0 0 40px rgba(0, 255, 0, 0.05)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            
            {/* Grid pattern overlay */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: `
                repeating-linear-gradient(
                  0deg,
                  transparent,
                  transparent 2px,
                  rgba(0, 255, 0, 0.02) 2px,
                  rgba(0, 255, 0, 0.02) 4px
                ),
                repeating-linear-gradient(
                  90deg,
                  transparent,
                  transparent 2px,
                  rgba(0, 255, 0, 0.02) 2px,
                  rgba(0, 255, 0, 0.02) 4px
                )
              `,
              pointerEvents: 'none',
            }} />

            {/* Glow effect */}
            <div style={{
              content: '',
              position: 'absolute',
              top: '-50%',
              left: '-50%',
              width: '200%',
              height: '200%',
              background: 'radial-gradient(circle, rgba(0, 255, 0, 0.05) 0%, transparent 70%)',
              animation: 'handsRotate 30s linear infinite',
              zIndex: 0
            }} />

            <div style={{
              position: "relative",
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 0.55fr) minmax(0, 0.45fr)",
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
              marginTop: isMobile ? '0' : '0'
            }}>
             
     
              <br/>
     
              {/* <h1 style={{fontFamily: 'UnifrakturCook, serif', fontSize: isMobile ? '2.5rem' : '3.5rem', marginTop: '2rem', marginBottom: '1.5rem', textAlign: 'center', lineHeight: '0.8',color: '#d4af37'}}>Get On Her Watchlist</h1> */}
                  {/* <h1 style={{
              fontSize: '3rem',
              marginBottom: '1rem',
              lineHeight: '2.5rem',
              color: '#d4af37',
              fontFamily: 'UnifrakturCook, serif',
              // textShadow: '0 0 15px rgba(212, 175, 55, 0.5)',
textShadow: '-1px -1px 0 #000000, 1px -1px 0 #000000, -1px 1px 0 #000000, 1px 1px 0 #000000',
  textAlign: 'center',
            }}>Get On Her Watchlist</h1> */}
              <SkewedHeading 
    lines={["GET ON HER", "WATCHLIST"]}
    // colors={["#d4af37", "#f4e4c1", "#ffd700"]}
        colors={["#00ff00"]}
    fontSize={{ mobile: "2.5rem", desktop: "3rem" }}
    isMobile={isMobile}
  />
              <div style={{
                lineHeight: 1.5,
                opacity: 0.9,
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                fontWeight: 400,
                letterSpacing: '0.02em',
                fontSize: isMobile ? '1.2rem' : '1.4rem',
                textAlign: 'center',
                width: '100%',
                // maxWidth: '600px',
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
                    <span style={{               fontFamily: "'Fjalla One', sans-serif",
fontSize: isMobile ? '1.3rem' : '1.8rem', fontWeight: '600', display: 'block', marginBottom: '0.5rem', lineHeight: '1.3' }}>
                Light a Green Candle for Luck
              </span>         
              <p style={{ marginBottom: '1rem', opacity: 0.8, fontSize: isMobile ? '1rem' : '1.1rem' }}>
Burn or stake RL80 to add a green candle to her timeline and watch miracles happen.  
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
       <CyberButton
                        onClick={handleOpenModal}
                        size={isMobile ? 'medium' : 'large'}
                        variant="primary"
                        style={{
                          marginTop: '1rem',
                          zIndex: 102,
                        }}
                      >
                        Get Lit
                      </CyberButton>
               
           
                    </div>
            </div>
          </div>

        </motion.div>

        {/* Illumin80 Section - 2 Column Layout */}
        <div style={{
          position: 'relative',
          // top: "5rem",
          margin: '4rem auto 4rem auto',
          width: isMobile ? '95%' : '90%',
          maxWidth: '1200px',
          zIndex: 1,
          pointerEvents: 'auto'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.5), rgba(0, 20, 0, 0.4))',
            border: '2px solid #00ff00',
            borderRadius: '0',
            paddingTop: '0px',
            paddingRight: '0px',
            paddingBottom: isMobile ? '20px' : '0px',
            paddingLeft: '0px',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 0 40px rgba(0, 255, 0, 0.3), inset 0 0 40px rgba(0, 255, 0, 0.05)',
            position: 'relative'
          }}>
            
            {/* Grid pattern overlay */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: `
                repeating-linear-gradient(
                  0deg,
                  transparent,
                  transparent 2px,
                  rgba(0, 255, 0, 0.02) 2px,
                  rgba(0, 255, 0, 0.02) 4px
                ),
                repeating-linear-gradient(
                  90deg,
                  transparent,
                  transparent 2px,
                  rgba(0, 255, 0, 0.02) 2px,
                  rgba(0, 255, 0, 0.02) 4px
                )
              `,
              pointerEvents: 'none',
            }} />

            <div style={{
              position: "relative",
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
              gap: isMobile ? "2rem" : "3rem",
              alignItems: "center",
              color: '#ffffff',
              zIndex: 1,
              overflow: "visible"
            }}>
              {/* Left Column - Bouncer */}
              <div style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                // minHeight: "40rem",
                overflow: "visible"
              }}>
    
               <div style={{
                 position: "relative",
                 width: "150%",
                 marginLeft: "-5%",
                 height: "250%",
                //  minHeight: isMobile ? '60vh' : '60vh',
                //  width: "150%",
                //  marginBottom: "-15%"
               }}>
                 <Numerology1/>
               </div>
               <p style={{
                 color: '#ffffff',
                 textAlign: 'center',
                 marginTop: isMobile ? '1rem' : '-2rem',
         
                 fontSize: '1rem',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',

               }}>
                 {/* [ Click to shake ] */}
               </p>
       
              </div>
              
              {/* Right Column - Illumin80 Perks */}
              <div style={{
                padding: '0 1rem',
                color: '#ffffff',
                textAlign: 'center',
                padding: '40px 20px',
              }}>
 <SkewedHeading 
    lines={["THE ILLUMIN80"]}
    // colors={["#d4af37", "#f4e4c1", "#ffd700"]}
        colors={["#00ff00"]}
    fontSize={{ mobile: "2.5rem", desktop: "3rem" }}
    isMobile={isMobile}
  />
                    {/* <span style={{               fontFamily: "'Fjalla One', sans-serif",
fontSize: isMobile ? '1.3rem' : '1.8rem', fontWeight: '600', display: 'block', marginBottom: '1.5rem', lineHeight: '1.3' }}>
               (Keep this part on the down-low)
              </span> */}
                <p style={{
                                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',

                  fontSize: '1.2rem',
           
                  marginBottom: '1.5rem',
                  lineHeight: 1.6,
                  color: '#ffffff',
                  opacity: 0.9
                }}>
                  Part mystery cult, part secret trading guild, The Illumin80 represent the true believers among token holders by amount staked or burned — a level that unlocks even more glorious gains. Powerful but not evil.
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
                    Staking rewards of 63% of all taxes
                  </li>
                  <li style={{ marginBottom: '0.5rem' }}>
                    <span style={{ color: '#d4af37', marginRight: '0.5rem' }}>✨</span>
                    Access to the Moon Room
                  </li>
        
                   <li style={{ marginBottom: '0.5rem' }}>
                    <span style={{ color: '#d4af37', marginRight: '0.5rem' }}>✨</span>
                    Air drops of upcoming token events
                  </li>
                  {/* <li style={{ marginBottom: '0.5rem' }}>
                    <span style={{ color: '#d4af37', marginRight: '0.5rem' }}>🌙</span>
                    Divine blessings
                  </li> */}
                </ul>

      
                             <CyberButton
                       onClick={() => window.open('/gallery3', '_blank')}
                        size={isMobile ? 'medium' : 'large'}
                        variant="primary"
                        style={{
                          marginTop: '1rem',
                          zIndex: 102,
                        }}
                      >
                        GET ELITE
                      </CyberButton>
              </div>
            </div>
          </div>
        </div>

                        <div style={{position: 'relative', zIndex: 1, marginTop: '2rem', marginBottom: '1rem'}}>
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
            background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.5), rgba(0, 20, 0, 0.4))',
            border: '2px solid #00ff00',
            borderRadius: '0',
            padding: isMobile ? '30px 20px' : '40px',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 0 40px rgba(0, 255, 0, 0.3), inset 0 0 40px rgba(0, 255, 0, 0.05)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            
            {/* Grid pattern overlay */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: `
                repeating-linear-gradient(
                  0deg,
                  transparent,
                  transparent 2px,
                  rgba(0, 255, 0, 0.02) 2px,
                  rgba(0, 255, 0, 0.02) 4px
                ),
                repeating-linear-gradient(
                  90deg,
                  transparent,
                  transparent 2px,
                  rgba(0, 255, 0, 0.02) 2px,
                  rgba(0, 255, 0, 0.02) 4px
                )
              `,
              pointerEvents: 'none',
            }} />

            {/* Glow effect */}
            <div style={{
              content: '',
              position: 'absolute',
              top: '-50%',
              left: '-50%',
              width: '200%',
              height: '200%',
              background: 'radial-gradient(circle, rgba(0, 255, 0, 0.05) 0%, transparent 70%)',
              animation: 'statsRotate 30s linear infinite',
              zIndex: 0
            }} />

            <div style={{ position: 'relative', zIndex: 1 }}>
              {/* Section Header - Cyber-Gothic Fusion */}
              <div style={{
                textAlign: 'center',
                marginBottom: '40px',
                position: 'relative'
              }}>
                {/* Terminal frame top */}
                <div style={{
                  fontFamily: 'monospace',
                  fontSize: isMobile ? '11px' : '13px',
                  color: '#00ff00',
                  textAlign: 'center',
                  marginBottom: '15px',
                  opacity: 0.6,
                  letterSpacing: '2px'
                }}>
                  {'< '} SYSTEM://PROTOCOL/ECONOMICS {' >'}
                </div>
                
                {/* Gothic heading with cyber gradient */}
        {/* <SkewedHeading 
    lines={["TOKENOMICS"]}
    colors={["#00ff00"]} 
    fontSize={{ mobile: "2.5rem", desktop: "3rem" }}
    isMobile={isMobile}
    useGradient={true}
    gradientColors={['#ffd700', '#00ff00']} // Gold to green gradient
  /> */}
                <SkewedHeading 
    lines={["TOKENOMICS"]}
    // colors={["#d4af37", "#f4e4c1", "#ffd700"]}
        colors={["#00ff00"]}
    fontSize={{ mobile: "2.5rem", desktop: "3rem" }}
    isMobile={isMobile}
  />

                
                {/* ASCII decorative elements */}
                <div style={{
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  color: '#00ff00',
                  textAlign: 'center',
                  opacity: 0.4,
                  marginTop: '10px',
                  marginBottom: '15px',
                  letterSpacing: '1px'
                }}>
                  ═══════════╬═══════════
                </div>
                
                {/* Subtitle with terminal brackets */}
                <p style={{
                  color: '#888',
                  fontSize: isMobile ? '0.8em' : '0.9em',
                  fontFamily: 'monospace',
                  letterSpacing: '2px',
                  textTransform: 'uppercase'
                }}>
                  [[ OUR LADY OF PERPETUAL PROFIT :: RL80 ]]
                </p>
              </div>

              {/* Stats Cards - Cyber Style */}
              <div style={{ marginBottom: '50px' }}>
                <CyberStatsSection isMobile={isMobile} />
              </div>

              {/* Tokenomics Content - Cyber Style */}
              <div style={{ marginBottom: '50px' }}>
                <CyberTokenomicsSection isMobile={isMobile} />
              </div>
              
              {/* Old tokenomics section - keeping for reference, can be removed later */}
              <div style={{ display: 'none' }}>
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
                          #00ff00 0deg 306deg,
                          #ffd700 306deg 342deg,
                          #d946ef 342deg 360deg
                        )`,
                        position: 'relative',
                        top: '2rem',
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
                          background: 'rgba(0, 0, 0, 0.9)',
                          border: '2px solid rgba(0,255,0,0.3)',
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
                        background: 'rgba(0, 0, 0, 0.8)',
                        borderRadius: '4px',
                        border: '1px solid #00ff00',
                        backdropFilter: 'blur(10px)'
                      }}>
                        <div style={{
                          fontSize: '14px',
                          fontWeight: 'bold',
                          color: '#00ff00',
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
                        background: 'rgba(0, 0, 0, 0.8)',
                        borderRadius: '4px',
                        border: '1px solid #ffd700',
                        backdropFilter: 'blur(10px)'
                      }}>
                        <div style={{
                          fontSize: '14px',
                          fontWeight: 'bold',
                          color: '#ffd700',
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
                        top: '-10px',
                        left: '35%',
                        padding: '8px 12px',
                        background: 'rgba(0, 0, 0, 0.8)',
                        borderRadius: '4px',
                        border: '1px solid #d946ef',
                        backdropFilter: 'blur(10px)'
                      }}>
                        <div style={{
                          fontSize: '14px',
                          fontWeight: 'bold',
                          color: '#d946ef',
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
                      marginTop: '40px'
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
                      fontFamily: 'monospace',
                      fontSize: '1.2em',
                      fontWeight: 'bold',
                      marginBottom: '20px',
                      color: '#00ff00',
                      textAlign: 'center',
                      textTransform: 'uppercase',
                      letterSpacing: '2px',
                      textShadow: '0 0 10px rgba(0, 255, 0, 0.5)'
                    }}>
                      TAX STRUCTURE
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
                          color: '#00ff00',
                          textShadow: '0 0 15px rgba(0, 255, 0, 0.5)',
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
                        <div style={{ 
                          marginBottom: '8px',
                          color: '#00ff00',
                          display: 'flex',
                          justifyContent: 'center',
                          filter: 'drop-shadow(0 0 8px rgba(0, 255, 0, 0.5))'
                        }}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 15h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 17"/>
                            <path d="m7 21 1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a2 2 0 0 0-2.75-2.91l-4.2 3.9"/>
                            <path d="m2 16 6 6"/>
                            <circle cx="16" cy="9" r="2.9"/>
                            <circle cx="6" cy="5" r="3"/>
                          </svg>
                        </div>
                        <div style={{
                          fontSize: '1.5em',
                          fontWeight: '700',
                          color: '#00ff00',
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
                        <div style={{ 
                          marginBottom: '8px',
                          color: '#00ff00',
                          display: 'flex',
                          justifyContent: 'center',
                          filter: 'drop-shadow(0 0 8px rgba(0, 255, 0, 0.5))'
                        }}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z"/>
                            <path d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97"/>
                          </svg>
                        </div>
                        <div style={{
                          fontSize: '1.5em',
                          fontWeight: '700',
                          color: '#00ff00',
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
                        <div style={{ 
                          marginBottom: '8px',
                          color: '#00ff00',
                          display: 'flex',
                          justifyContent: 'center',
                          filter: 'drop-shadow(0 0 8px rgba(0, 255, 0, 0.5))'
                        }}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m3 11 18-5v12L3 14v-3z"/>
                            <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>
                          </svg>
                        </div>
                        <div style={{
                          fontSize: '1.5em',
                          fontWeight: '700',
                          color: '#00ff00',
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
          {/* End of hidden old tokenomics section */}
        </motion.div>



                                        <CyberFAQSection isMobile={isMobile} />

      {/* Carousel Section */}
        {/* <CarouselWrapper /> */}

 

  {/* <SlidingNav is80sMode={false} /> */}
        


     

        
        {/* Footer - at the bottom of all content */}
       <footer style={{
        marginTop: '8rem',
        padding: '8rem 2rem 2rem',
        background: 'linear-gradient(to bottom, rgba(234, 124, 14, 0.0), rgba(14, 84, 234, 0.6))',
        // borderTop: '1px solid rgba(212, 175, 55, 0.3)',
        color: '#ffffff',
        textAlign: 'center'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          {/* Footer Title with Coin */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '2rem',
            marginTop: isMobile ? '1rem' : '3rem',
          }}>
            {/* Coin positioned above title */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
            }}>
                <CircularCTA
    text="• PREME EMERE • CLICK TO BUY • PREME EMERE • CLICK TO BUY • PREME EMERE • CLICK TO BUY"
    href="/temple"
    accentColor="#00ff00"
    bgColor="none"
            size={200}
            textSize={isMobile ? 7 : 7}
          />
              {/* <div className="purse">
                <div className="coin">
                  <div className="front"></div>
                  <div className="back"></div>
                  <div className="side">
                    {[...Array(16)].map((_, index) => (
                      <div key={index} className="spoke"></div>
                    ))}
                  </div>
                </div>
              </div> */}
            </div>
            <h1 className='custom-title'
              id="main-title"
              style={{ 
              position: "relative",
              // left: isMobile ? "5%" : "10%",
              color: "#d4af37",
                // color: "#00ff00",
                  // colors={["#00ff00"]}
              fontFamily: 'UnifrakturCook, serif',
              textShadow: `
                rgba(83, 61, 74, 0.9) 1px 1px,
                rgba(83, 61, 74, 0.9) 2px 2px,
                rgba(83, 61, 74, 0.8) 3px 3px,
                rgba(83, 61, 74, 0.8) 4px 4px,
                rgba(83, 61, 74, 0.7) 5px 5px,
                rgba(83, 61, 74, 0.7) 6px 6px,
                rgba(83, 61, 74, 0.6) 7px 7px,
                rgba(83, 61, 74, 0.6) 8px 8px,
                rgba(255, 192, 203, 0.4) -1px -1px 5px,
                rgba(0, 0, 0, 0.8) 10px 10px 15px
              `,
              fontSize: getResponsiveValue("3rem", "3rem", "3rem", "3rem"),
              fontWeight: 900,
              lineHeight: 0.8,
              transform: isMobile ? "rotate(-5deg)" : "rotate(-8deg) skew(-15deg)",
              zIndex: 1000,
              whiteSpace: isMobile ? 'normal' : 'nowrap',
              cursor: 'pointer',
              margin: 0,
              pointerEvents: 'auto',
            }}>
              <span className="title-line" style={{ display: 'block', position: 'relative' }}>Our Lady</span>
              <span className="title-line" style={{ display: 'block', position: 'relative' }}>
                <span style={{ fontSize: isMobile ? "1.2rem" : "1.5rem" }}>of    </span>
                Perpetual
              </span>
              <span className="title-line" style={{ display: 'block', marginLeft: isMobile ? "0rem" : "0rem", position: 'relative' }}>Profit</span>
            </h1>
            
            {/* Coin component */}
            {/* <div style={{ 
              position: "relative",
              marginLeft: '-2rem',
              width: isMobile ? "80px" : "100px",
              height: isMobile ? "80px" : "100px",
              flexShrink: 0,
            }}>
              <Link href="#" className="coin-link" style={{ 
                display: "block",
                width: "100%",
                height: "100%",
                transform: 'scale(0.6)',
                transformOrigin: 'center center',
              }}>
                <Coin />
              </Link>
            </div> */}
          </div>
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

      Add spinning record CSS and fonts
      <style jsx global>{`
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
      {scrollY > (isMobile ? 600 : 800) && (
        <CyberFloatingBar isMobile={isMobile} />
      )}
    </div>
    </>
  );
}