"use client";

import React, { useRef, Suspense, useEffect, useState, lazy } from 'react';


// Lazy load the 3D scene
const Simple3DScene = lazy(() => import('@/components/Simple3DScene'));
const EmojiOverlay = lazy(() => import('@/components/EmojiOverlay'));
import { useGLTF, useAnimations, MeshPortalMaterial, CameraControls, Text, useCursor } from '@react-three/drei';
import * as THREE from 'three';
import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';
import { geometry, easing } from 'maath';
// import DarkClouds from '@/components/Clouds'; // Disabled for memory
// Removed unused imports for memory optimization
import { useMusic } from '@/components/MusicContext';
import { useUser, SignInButton } from "@clerk/nextjs";
import { Illumin80ClerkButton } from "@/components/Illumin80Display";
import CyberNav from '@/components/CyberNav';
import SocialBar from '@/components/SocialBar';
import InfinityLoader from '@/components/InfinityLoader';
import CloudIntroSection from '@/components/CloudIntroSection';
import HandsGLTFScene from '@/components/HandsGLTFScene';
import RotatingText from '@/components/RotatingText';
import CompactCandleModal from '@/components/CompactCandleModal';
import '@/components/RotatingText.css';



import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Extend geometry and setup constants for portal
extend(geometry);
const GOLDENRATIO = 1.61803398875;
const zPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
const yPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 1);


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
        intensity={2}
        color="#ffffff"
        castShadow
        shadow-mapSize-width={512}
        shadow-mapSize-height={512}
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
        intensity={25}
        angle={Math.PI / 4}
        penumbra={0.5}
        distance={60}
        color="#ffeedd"
        castShadow
        shadow-mapSize-width={512}
        shadow-mapSize-height={512}
      />
      <mesh ref={targetRef} position={[0, -10, -20]} visible={false}>
        <boxGeometry args={[0.1, 0.1, 0.1]} />
      </mesh>
    </>
  );
}

// Memoize the model component to prevent re-renders
const OurLadyRiderModel = React.memo(({ isMobile, scrollY, onLoad }) => {
  const { scene } = useGLTF('/models/ourlady_rider6.glb');
  const modelRef = useRef();
  const groupRef = useRef();
  const cloudRef = useRef();
  const hasCalledOnLoad = useRef(false);
  
  // Disable cleanup for now to prevent context issues
  // useEffect(() => {
  //   return () => {
  //     scene.traverse((child) => {
  //       if (child.geometry) child.geometry.dispose();
  //       if (child.material) {
  //         if (Array.isArray(child.material)) {
  //           child.material.forEach(mat => mat.dispose());
  //         } else {
  //           child.material.dispose();
  //         }
  //       }
  //     });
  //   };
  // }, [scene]);

  
  React.useEffect(() => {
    if (scene && !hasCalledOnLoad.current) {
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = false; // Disable shadows
          child.receiveShadow = false;
        }
      });
      // Only call onLoad once using ref to track
      if (onLoad && !hasCalledOnLoad.current) {
        hasCalledOnLoad.current = true;
        onLoad();
      }
    }
  }, [scene]); // Keep scene dependency but use ref to prevent multiple calls

  // DISABLED useFrame for memory testing
  // useFrame(() => {
  //   if (groupRef.current) {
  //     const baseY = isMobile ? -11 : -13;
  //     groupRef.current.position.y = baseY + scrollY * 0.015;
  //   }
  // });

  return (
    <group 
      ref={groupRef}
      position={isMobile ? [-10, -11, -10] : [-6, -15, -12]}
    >
      <primitive 
        ref={modelRef}
        object={scene} 
        scale={isMobile ? [9, 9, 9] : [12, 12, 12]}
        rotation={isMobile ? [0, -1.5, 0] : [0, 0, 0]}
      />
    </group>
  );
});

OurLadyRiderModel.displayName = 'OurLadyRiderModel';

function AngelEmojiModel({ isMobile, scrollY, onLoad }) {
  const { scene, animations } = useGLTF('/models/angelEmoji.glb');
  const { actions } = useAnimations(animations, scene);
  const modelRef = useRef();
  const [visible, setVisible] = useState(false);
  const [popScale, setPopScale] = useState(0);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      scene.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(mat => mat.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
    };
  }, [scene]);

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

  // Check scroll threshold to trigger pop-in effect
  useEffect(() => {
    // Pop in when scrolled down just 50px
    const threshold = 50;
    if (scrollY > threshold && !visible) {
      setVisible(true);
      console.log('Angel emoji popping in at scroll:', scrollY);
    }
  }, [scrollY, visible]);

  // Orbit around center point and billboard effect with pop-in animation
  useFrame((state, delta) => {
    if (!modelRef.current) return;
    
    // Smooth pop-in scale animation
    if (visible && popScale < 1) {
      setPopScale(prev => Math.min(prev + delta * 3, 1)); // Animate over ~0.3 seconds
    }
    
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
    
    // Add pop-in effect to Y position (starts lower, pops up)
    const popOffset = visible ? (1 - popScale) * -20 : -30; // Start 30 units lower for more dramatic effect
    modelRef.current.position.y = orbitHeight + Math.sin(time * 2) * bobAmount + scrollY * 0.015 + popOffset;
    
    // Apply pop-in scale with bounce effect
    const bounceScale = visible ? popScale * (1 + Math.sin(popScale * Math.PI) * 0.2) : 0; // Start at 0 scale, more bounce
    modelRef.current.scale.setScalar((isMobile ? 0.7 : 1) * bounceScale);
    
    // Billboard - make model face the camera
    modelRef.current.lookAt(state.camera.position);
  });

  return (
    <primitive 
      ref={modelRef}
      object={scene} 
      position={[0, 0, 0]}  // Initial position (will be overridden by animation)
      rotation={[0, 0, 0]}
    />
  );
}

function DevilEmojiModel({ isMobile, scrollY, onLoad }) {
  // Don't load on mobile to save memory
  if (isMobile) {
    return null;
  }
  
  const { scene, animations } = useGLTF('/models/devilEmoji.glb');
  const { actions } = useAnimations(animations, scene);
  const modelRef = useRef();
  const [visible, setVisible] = useState(false);
  const [popScale, setPopScale] = useState(0);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      scene.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(mat => mat.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
    };
  }, [scene]);

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

  // Check scroll threshold to trigger pop-in effect (slightly delayed from angel)
  useEffect(() => {
    // Pop in when scrolled down 100px (50px after angel)
    const threshold = 100;
    if (scrollY > threshold && !visible) {
      setVisible(true);
      console.log('Devil emoji popping in at scroll:', scrollY);
    }
  }, [scrollY, visible]);

  // Orbit around center point (opposite side from angel) and billboard effect with pop-in animation
  useFrame((state, delta) => {
    if (!modelRef.current) return;
    
    // Smooth pop-in scale animation
    if (visible && popScale < 1) {
      setPopScale(prev => Math.min(prev + delta * 3, 1)); // Animate over ~0.3 seconds
    }
    
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
    
    // Add pop-in effect to Y position (starts lower, pops up)
    const popOffset = visible ? (1 - popScale) * -10 : -15; // Start 15 units lower
    modelRef.current.position.y = orbitHeight + Math.sin(time * 2 + Math.PI) * bobAmount + scrollY * 0.015 + popOffset; // Opposite phase bobbing
    
    // Apply pop-in scale with bounce effect
    const bounceScale = visible ? popScale * (1 + Math.sin(popScale * Math.PI) * 0.1) : 0; // Start at 0 scale
    modelRef.current.scale.setScalar((isMobile ? 0.7 : 1) * bounceScale);
    
    // Billboard - make model face the camera
    modelRef.current.lookAt(state.camera.position);
  });

  return (
    <primitive 
      ref={modelRef}
      object={scene} 
      position={[0, 0, 0]}  // Initial position (will be overridden by animation)
      rotation={[0, 0, 0]}
    />
  );
}

// Animated pulsing text component
function PulsingText({ children, ...props }) {
  const textRef = useRef();
  
  useFrame(({ clock }) => {
    if (textRef.current) {
      const t = clock.getElapsedTime();
      // Pulse the opacity
      textRef.current.fillOpacity = 0.7 + Math.sin(t * 2) * 0.3;
      // Add a subtle scale pulse
      const scale = 1 + Math.sin(t * 2) * 0.05;
      textRef.current.scale.setScalar(scale);
    }
  });
  
  return (
    <Text ref={textRef} {...props}>
      {children}
    </Text>
  );
}

// Portal Components

function PortalFrame({ id, name, author, bg, width = 1.1, height = GOLDENRATIO * 1.1, children, ...props }) {
  return (
    <group {...props}>
      <Text 
        font="/fonts/UnifrakturCook-Bold.ttf"
        color="#d4af37" 
        fontSize={0.18} 
        letterSpacing={-0.025} 
        anchorY="top" 
        anchorX="center" 
        lineHeight={0.8} 
        position={[0, 0.5, 0.01]}
        maxWidth={width * 0.8}
      >
        {name}
      </Text>
      <Text 
        font="/fonts/UnifrakturMaguntia-Regular.ttf"
        color="#d4af37" 
        fontSize={0.08} 
        anchorX="right" 
        position={[width * 0.4, -height * 0.42, 0.01]}
      >
        /{id}
      </Text>
      <Text 
        font="/fonts/UnifrakturMaguntia-Regular.ttf"
        color="#d4af37" 
        fontSize={0.04} 
        anchorX="center" 
        position={[0, -height * 0.45, 0.01]}
        maxWidth={width * 0.8}
      >
        {author}
      </Text>
      {/* Portal interaction hints - positioned inside the portal */}
      <PulsingText
        font="/fonts/UnifrakturMaguntia-Regular.ttf"
        color="#d4af37"
        fontSize={0.035}
        anchorX="right"
        anchorY="top"
        position={[width * 0.42, height * 0.42, 0.02]}
        fillOpacity={0.9}

      >
        Click to flip
      </PulsingText>
      <Text
        font="/fonts/UnifrakturMaguntia-Regular.ttf"
        color="#d4af37"
        fontSize={0.03}
        anchorX="right"
        anchorY="top"
        position={[width * 0.42, height * 0.39, 0.02]}
        fillOpacity={0.7}
      >
        Double-click to enter
      </Text>
      <mesh name={id}>
        <roundedPlaneGeometry args={[width, height, 0.1]} />
        <MeshPortalMaterial>{children}</MeshPortalMaterial>
      </mesh>
      <mesh name={id} position={[0, 0, -0.001]}>
        <roundedPlaneGeometry args={[width + 0.05, height + 0.05, 0.12]} />
        <meshBasicMaterial color="#d4af37" />
      </mesh>
    </group>
  );
}

// New enhanced portal frame component with interactive features
function EnhancedPortalFrame({ id, name, author, bg, width = 1.8, height = GOLDENRATIO * 1.8, children, isFlipped, onFlip, onEnter, activePortal, ...props }) {
  const portal = useRef();
  const groupRef = useRef();
  const [hovered, hover] = useState(false);
  useCursor(hovered);
  
  useFrame((state, dt) => {
    if (portal.current) {
      // Blend to 1 when THIS portal is active (for immersion)
      easing.damp(portal.current, 'blend', activePortal === id ? 1 : 0, 0.2, dt);
    }
    // Animate flip
    if (groupRef.current) {
      const targetRotation = isFlipped ? Math.PI : 0;
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        targetRotation,
        0.1
      );
    }
  });
  
  return (
    <group {...props}>
      <group ref={groupRef}>
      <Text 
        font="/fonts/UnifrakturCook-Bold.ttf"
        fontSize={0.25} 
        anchorY="top" 
        anchorX="center" 
        lineHeight={0.8} 
        position={[0, height * 0.42, 0.01]} 
        material-toneMapped={false}
        color="#d4af37"
        maxWidth={width * 0.8}
      >
        {name}
      </Text>
      
      {/* Interaction hints - only show on front side */}
      {!isFlipped && (
        <>
          <PulsingText
            font="/fonts/UnifrakturMaguntia-Regular.ttf"
            color="#d4af37"
            fontSize={0.06}
            anchorX="right"
            anchorY="top"
            position={[width * 0.45, height * 0.45, 0.02]}
            fillOpacity={0.9}
          >
            Click to flip
          </PulsingText>
          <Text
            font="/fonts/UnifrakturMaguntia-Regular.ttf"
            color="#d4af37"
            fontSize={0.05}
            anchorX="right"
            anchorY="top"
            position={[width * 0.45, height * 0.38, 0.02]}
            fillOpacity={0.7}
          >
            Double-click to enter
          </Text>
        </>
      )}
      <Text 
        font="/fonts/UnifrakturMaguntia-Regular.ttf"
        fontSize={0.15} 
        anchorX="right" 
        position={[width * 0.42, -height * 0.42, 0.01]} 
        material-toneMapped={false}
        color="#d4af37"
      >
        /{id}
      </Text>
      <Text 
        font="/fonts/UnifrakturMaguntia-Regular.ttf" 
        fontSize={0.1} 
        anchorX="center" 
        position={[0, -height * 0.45, 0.01]} 
        material-toneMapped={false}
        color="#d4af37"
        maxWidth={width * 0.8}
      >
        {author}
      </Text>
      <mesh 
        name={id} 
        onClick={(e) => {
          e.stopPropagation();
          console.log('Portal clicked:', id);
          if (onFlip) onFlip(id);
        }}
        onDoubleClick={(e) => {
          e.stopPropagation();
          console.log('Portal double-clicked:', id);
          if (onEnter) onEnter(id);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          hover(true);
        }} 
        onPointerOut={(e) => {
          e.stopPropagation();
          hover(false);
        }}
      >
        <roundedPlaneGeometry args={[width, height, 0.1]} />
        <MeshPortalMaterial ref={portal} events={activePortal === id} side={THREE.DoubleSide}>
          <color attach="background" args={[bg]} />
          {children}
        </MeshPortalMaterial>
      </mesh>
      
      {/* Back side of the card */}
      <mesh position={[0, 0, -0.002]} rotation={[0, Math.PI, 0]}>
        <roundedPlaneGeometry args={[width, height, 0.1]} />
        <meshBasicMaterial color="#2a1f0a" side={THREE.FrontSide} />
      </mesh>
      
      {/* Back side text */}
      <Text
        font="/fonts/UnifrakturCook-Bold.ttf"
        fontSize={0.2}
        color="#d4af37"
        anchorX="center"
        anchorY="middle"
        position={[0, height * 0.3, -0.01]}
        rotation={[0, Math.PI, 0]}
        maxWidth={width * 0.8}
      >
        Sacred Wisdom
      </Text>
      
      <Text
        font="/fonts/UnifrakturMaguntia-Regular.ttf"
        fontSize={0.12}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        position={[0, 0, -0.01]}
        rotation={[0, Math.PI, 0]}
        maxWidth={width * 0.8}
        textAlign="center"
      >
        {`Double-click to enter\nthe sacred realm\nof ${name}`}
      </Text>
      
      <Text
        font="/fonts/UnifrakturMaguntia-Regular.ttf"
        fontSize={0.08}
        color="#d4af37"
        anchorX="center"
        anchorY="middle"
        position={[0, -height * 0.35, -0.01]}
        rotation={[0, Math.PI, 0]}
      >
        Click to flip back
      </Text>
      
      {/* Gold border mesh behind the portal */}
      <mesh name={`${id}-border`} position={[0, 0, -0.003]}>
        <roundedPlaneGeometry args={[width + 0.1, height + 0.1, 0.12]} />
        <meshBasicMaterial color="#d4af37" />
      </mesh>
      </group>
    </group>
  );
}

// Mouse-based rotation for portal
function PortalMouseRotation({ children, isActive }) {
  const groupRef = useRef();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  
  useFrame(() => {
    if (groupRef.current && !isActive) {
      // Smooth rotation based on mouse position
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        mousePos.x * 0.3, // Horizontal mouse -> Y rotation
        0.1
      );
      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        groupRef.current.rotation.x,
        -mousePos.y * 0.2, // Vertical mouse -> X rotation
        0.1
      );
    } else if (groupRef.current && isActive) {
      // Reset rotation when portal is active
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, 0, 0.1);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, 0, 0.1);
    }
  });
  
  const handlePointerMove = (e) => {
    if (!isActive) {
      // Use Three.js pointer coordinates which are already normalized
      const x = e.point ? e.point.x * 0.5 : 0;
      const y = e.point ? e.point.y * 0.5 : 0;
      setMousePos({ x, y });
    }
  };
  
  const handlePointerLeave = () => {
    setMousePos({ x: 0, y: 0 });
  };
  
  return (
    <group 
      ref={groupRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      {children}
    </group>
  );
}

// Camera rig for portal navigation
function PortalRig({ activePortal }) {
  const { controls, scene } = useThree();
  const position = new THREE.Vector3(0, 0, 2);
  const focus = new THREE.Vector3(0, 0, 0);
  
  useEffect(() => {
    const active = scene.getObjectByName(activePortal);
    if (active) {
      active.parent.localToWorld(position.set(0, 0.5, 0.25));
      active.parent.localToWorld(focus.set(0, 0, -2));
    } else {
      // Reset to default view when no portal is active
      position.set(0, 0, 3);
      focus.set(0, 0, 0);
    }
    controls?.setLookAt(...position.toArray(), ...focus.toArray(), true);
  }, [activePortal, controls, scene]);
  
  // Force reset camera position on mount and when activePortal changes
  useEffect(() => {
    if (!activePortal && controls) {
      // Force the camera to the correct distance
      controls.dollyTo(3, true);
    }
  }, [activePortal, controls]);
  
  return (
    <CameraControls 
      makeDefault 
      minPolarAngle={0} 
      maxPolarAngle={Math.PI / 2}
      enableZoom={!!activePortal}
      enablePan={!!activePortal}
      enableRotate={false}
      dollySpeed={activePortal ? 1 : 0}
      truckSpeed={activePortal ? 2 : 0}
      minDistance={activePortal ? 0.1 : 3}   // Match the camera position
      maxDistance={activePortal ? 100 : 3}   // Lock at exact distance when not in portal
    />
  );
}

// Scene component that responds to scroll
function Scene({ isMobile, scrollY, onAssetsLoaded, isLowEndDevice }) {
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
      {/* <ambientLight intensity={1.5} /> */}
      {/* <DirectionalLightWithHelper />
      <pointLight position={[-2, 2, -1]} intensity={1.5} /> */}
      
      {/* <SpotlightWithHelper isMobile={isMobile} scrollY={scrollY} /> */}
      
      <GradientSkySphere />
      
      {/* Temporarily disable clouds to test memory */}
      
      <Suspense fallback={null}>
        {/* DarkClouds disabled for memory optimization */}

        {/* TEMPORARILY DISABLED MAIN MODEL FOR MEMORY TEST */}
        {/* <OurLadyRiderModel 
          isMobile={isMobile} 
          scrollY={scrollY} 
          onLoad={() => onAssetsLoaded?.('ourLadyModel')}
        /> */}
        {/* Emoji models with pop-in effect */}
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
      {/* DISABLED POST PROCESSING FOR MEMORY TEST */}
      {/* !isMobile && <PostProcessingEffects is80sMode={false} /> */}
      {/* DISABLED ORBIT CONTROLS FOR MEMORY TEST */}
      {/* <OrbitControls 
        enablePan={false}
        enableZoom={true}
        enableRotate={true}
        enableDamping={false}
        enabled={false}
        target={isMobile ? [-45, 1.5 - scrollY * 0.015, -100] : [-50, 1.5 - scrollY * 0.015, -100]}
      /> */}
    </>
  );
}

// Preload critical 3D models to ensure they're ready before scene reveals
useGLTF.preload('/models/ourlady_rider6.glb');
useGLTF.preload('/models/angelEmoji.glb');
// Don't preload devilEmoji on mobile - it's conditionally loaded

export default function Home3() {
  const router = useRouter();
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
  const [portalFlipped, setPortalFlipped] = useState(false);
  const [isSceneLoading, setIsSceneLoading] = useState(true);
  const [isMobileDevice, setIsMobileDevice] = useState(typeof window !== 'undefined' ? window.innerWidth <= 768 : false);
  const [emoji, setEmoji] = useState("😇");
  const [isDefinitelyPhone, setIsDefinitelyPhone] = useState(true); // Always treat as mobile
  const [isLowEndDevice, setIsLowEndDevice] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activePortal, setActivePortal] = useState(null);
  const [portalFlippedStates, setPortalFlippedStates] = useState({
    '01': false,
    '02': false, 
    '03': false
  });
  
  // Portal carousel state
  const [currentPortalPage, setCurrentPortalPage] = useState(0);
  const [portalTransition, setPortalTransition] = useState(null);
  const portalsPerPage = isMobileDevice ? 1 : 3; // Show 1 on mobile, 3 on desktop
  
  // Mock user data - replace with Firestore data later
  const [portalUsers] = useState([
    { id: '01', name: 'Divine Sanctuary', message: 'Peace and prosperity await', author: 'Sacred Realm' },
    { id: '02', name: 'Holy Treasury', message: 'Abundance flows eternal', author: 'Blessed Vault' },
    { id: '03', name: 'Celestial Garden', message: 'Growth through wisdom', author: 'Eternal Growth' },
    { id: '04', name: 'Mystic Gateway', message: 'Enter the unknown', author: 'Ancient Path' },
    { id: '05', name: 'Golden Temple', message: 'Wisdom illuminates', author: 'Enlightened One' },
    { id: '06', name: 'Crystal Cavern', message: 'Hidden treasures within', author: 'Earth\'s Heart' },
  ]);
  
  const totalPortalPages = Math.ceil(portalUsers.length / portalsPerPage);
  const currentPortals = portalUsers.slice(
    currentPortalPage * portalsPerPage,
    (currentPortalPage + 1) * portalsPerPage
  );

  const [assetsLoaded, setAssetsLoaded] = useState({
    ourLadyModel: false,
    angelModel: false,
    devilModel: false,
    images: []
  });

    // Always use mobile view on mount + check for actual mobile device
    useEffect(() => {
      setIsDefinitelyPhone(true);
      setIsMobileView(true);
      
      // Check if actually on mobile for icon layout
      const checkMobileDevice = () => {
        setIsMobileDevice(window.innerWidth <= 768);
      };
      checkMobileDevice();
      
      // Detect low-end device
      const detectLowEndDevice = () => {
        const cores = navigator.hardwareConcurrency || 4;
        const memory = navigator.deviceMemory || 4; // GB
        const connection = navigator.connection;
        const isSlowConnection = connection?.effectiveType === '2g' || connection?.effectiveType === 'slow-2g';
        
        setIsLowEndDevice(cores <= 4 || memory <= 4 || isSlowConnection || isMobileDevice);
      };
      detectLowEndDevice();
      
      window.addEventListener('resize', checkMobileDevice);
      return () => window.removeEventListener('resize', checkMobileDevice);
    }, []);
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
  
  const handlePortalFlip = (portalId) => {
    setPortalFlippedStates(prev => ({
      ...prev,
      [portalId]: !prev[portalId]
    }));
  };
  
  const handlePortalEnter = (portalId) => {
    console.log('Portal entered:', portalId);
    setActivePortal(portalId);
    // Don't navigate away, just zoom into the portal
    // Navigation can be handled separately if needed
  };
  
  const handlePortalExit = () => {
    setActivePortal(null);
  };
  
  const handleNextPortalPage = () => {
    setPortalTransition({ isTransitioning: true, isFadingOut: true });
    setTimeout(() => {
      setCurrentPortalPage((prev) => (prev + 1) % totalPortalPages);
      setPortalTransition({ isTransitioning: true, isFadingOut: false });
      setTimeout(() => setPortalTransition(null), 500);
    }, 300);
  };
  
  const handlePrevPortalPage = () => {
    setPortalTransition({ isTransitioning: true, isFadingOut: true });
    setTimeout(() => {
      setCurrentPortalPage((prev) => (prev - 1 + totalPortalPages) % totalPortalPages);
      setPortalTransition({ isTransitioning: true, isFadingOut: false });
      setTimeout(() => setPortalTransition(null), 500);
    }, 300);
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
  
  // Separate fallback timer with longer timeout for model loading
  useEffect(() => {
    const fallbackTimer = setTimeout(() => {
      console.log('Loading timeout - forcing scene display');
      setIsSceneLoading(false);
    }, 8000); // Increased to 8 seconds to ensure model loads
    
    return () => clearTimeout(fallbackTimer);
  }, []); // Run once on mount

  // Alternate emoji for sign-in button
  useEffect(() => {
    const emojiInterval = setInterval(() => {
      setEmoji((prevEmoji) => (prevEmoji === "😇" ? "😈" : "😇"));
    }, 3000);
    return () => clearInterval(emojiInterval);
  }, []);

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
      if (cardInner) {
        cardInner.style.transform = `rotateY(${rX}deg) rotateX(${rY}deg)`;
      }
      
      // Move background opposite direction for depth
      const cardBg = card.querySelector('.card-bg');
      if (cardBg) {
        const tX = mouseX * -40;
        const tY = mouseY * -40;
        cardBg.style.transform = `translateX(${tX}px) translateY(${tY}px)`;
      }
    };

    const handleCardMouseLeave = (e) => {
      const card = e.currentTarget;
      const cardInner = card.querySelector('.card');
      const cardBg = card.querySelector('.card-bg');
      
      // Reset transforms with delay
      setTimeout(() => {
        if (cardInner) {
          cardInner.style.transform = '';
        }
        if (cardBg) {
          cardBg.style.transform = '';
        }
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
  return (
    <div style={{ 
      width: '100vw', 
      background: 'transparent', 
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
        @import url('https://fonts.googleapis.com/css?family=Fjalla+One');
        
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
        
        @keyframes hintPulse {
          0%, 100% {
            opacity: 0.9;
            text-shadow: 0 0 10px rgba(212, 175, 55, 0.8);
          }
          50% {
            opacity: 1;
            text-shadow: 0 0 20px rgba(212, 175, 55, 1), 0 0 30px rgba(212, 175, 55, 0.5);
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
        /* Portal flip styles */
        .portal-container {
          width: 100%;
          height: 100%;
          position: relative;
          transform-style: preserve-3d;
          transition: transform 0.8s cubic-bezier(0.445, 0.05, 0.55, 0.95);
          cursor: pointer;
          box-sizing: border-box;
          overflow: visible;
        }
        
        .portal-container.flipped {
          transform: rotateY(180deg);
        }
        
        .portal-face {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          box-sizing: border-box;
          overflow: visible;
        }
        
        .portal-front {
          z-index: 2;
        }
        
        .portal-back {
          transform: rotateY(180deg);
          z-index: 1;
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
          width: 70%;
          max-width: 450px;
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
          aspect-ratio: ${1 / GOLDENRATIO};
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
          border: 6px solid #d4af37;
          border-radius: 20px;
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
            0 0 0 5px #d4af37,
            0 0 0 6px #d4af37,
            rgba(212, 175, 55, 0.4) 0 0 50px 10px;
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
        
        /* Disable overlay for portal gallery to prevent button blocking */
        .portal-gallery-wrap .card-info::after {
          display: none !important;
          pointer-events: none !important;
        }
        
        .portal-gallery-wrap:hover .card-info {
          transform: translateY(20%) !important;
          pointer-events: none;
        }
        
        .portal-gallery-wrap:hover .card-info * {
          pointer-events: none;
        }
        
        .portal-gallery-wrap:hover .card-info div {
          pointer-events: auto !important;
        }
        
        .portal-gallery-wrap:hover .card-info button {
          pointer-events: auto !important;
        }

        /* Override hover effects for portal to prevent vertical movement */
        .portal-wrap.card-wrap:hover {
          /* Prevent any inherited hover effects */
        }
        
        .portal-wrap.card-wrap:hover .card {
          box-shadow: none !important;
        }
        
        .portal-wrap:hover .card-info {
          transform: translateY(40%) !important;
        }
        
        .portal-wrap:hover .portal-hover-container {
          transform: inherit;
        }
        
        /* Ensure portal container doesn't shift on hover */
        .portal-wrap .portal-container,
        .portal-wrap:hover .portal-container {
          position: relative;
          top: 0;
          transform-origin: center center;
        }

        .card {
          width: 100%;
          height: 100%;
          aspect-ratio: ${1 / GOLDENRATIO};
          position: relative;
          border-radius: 20px;
          background: linear-gradient(135deg, #4a4a4a 0%, #2a2a2a 100%);
          overflow: hidden;
          border: 6px solid #d4af37;
          transition: 1s cubic-bezier(0.445, 0.05, 0.55, 0.95);
          pointer-events: auto;
          box-sizing: border-box;
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
            width: 85%;
            max-width: 400px;
            margin-bottom: 0;
          }
          
          .card-wrap:nth-child(odd),
          .card-wrap:nth-child(even) {
            align-self: center;
            margin: 0;
          }
          
          .card {
            aspect-ratio: ${1 / GOLDENRATIO};
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
      
      {/* Simplified 3D Scene */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        pointerEvents: 'none',
      }}>
        <Suspense fallback={null}>
          <Simple3DScene 
            enabled={true} 
            isMobile={isMobile} 
            scrollY={scrollY} 
            onLoadComplete={() => {
              console.log('[Home3] Simple3DScene onLoadComplete called');
              setIsSceneLoading(false);
            }}
          />
        </Suspense>
      </div>
      
      {/* Emoji Overlay - appears OVER HTML content */}
      <Suspense fallback={null}>
        <EmojiOverlay scrollY={scrollY} />
      </Suspense>
      
      {/* Temporary scroll debug - remove when done choreographing */}
      {/* <ScrollDebug /> */}
      
      {/* Scrollable Overlay Content - Hidden while loading */}
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

          
          {/* Animated Title */}
          <h1 
              id="main-title"
              style={{ 
              position: "relative",
              left: isMobile ? "5%" : "10%",
              color: "#d4af37",
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
        
       
     
        {/* Cloud Introduction Section - New Addition */}
        <CloudIntroSection scrollY={scrollY} isMobile={isMobile} onOpenModal={() => setIsModalOpen(true)} />

        {/* Hands GLTF Scene */}
        <HandsGLTFScene />

        {/* <FAQSection/> */}
   


       

 {/* Introductory Text Section */}
        {/* <div style={{
          position: 'relative',
          zIndex: 10,
          padding: isMobile ? '2rem 1.5rem' : '3rem 2rem',
          maxWidth: '900px',
          margin: '0 auto',
          marginTop: '-2rem', // Slight overlap with clouds
          marginBottom: '3rem'
        }}>
          <div style={{
            background: 'rgba(26, 0, 51, 0.45)', // Semi-transparent dark purple matching your theme
            backdropFilter: 'blur(12px)',
            borderRadius: '25px',
            padding: isMobile ? '2rem 1.5rem' : '3rem 2.5rem',
            border: '2px solid rgba(212, 175, 55, 0.4)',
            boxShadow: '0 20px 60px rgba(212, 175, 55, 0.15), inset 0 0 30px rgba(135, 206, 235, 0.1)',
            position: 'relative',
            overflow: 'hidden'
          }}>
 
            <div style={{
              position: 'absolute',
              top: '-50%',
              left: '-50%',
              width: '200%',
              height: '200%',
              background: 'radial-gradient(circle at center, rgba(212, 175, 55, 0.05) 0%, transparent 70%)',
              pointerEvents: 'none'
            }} />
            
            <h2 style={{
              fontFamily: "'Bowlby One SC', cursive",
              fontSize: isMobile ? '1.8rem' : '2.5rem',
              color: '#d4af37',
              textAlign: 'center',
              marginBottom: '1.5rem',
              textShadow: '0 0 20px rgba(212, 175, 55, 0.5)',
              letterSpacing: '2px',
              position: 'relative'
            }}>BEHOLD! OUR LADY
            </h2>
            
            
            <p style={{
              fontFamily: "'Fjalla One', sans-serif",
              fontSize: isMobile ? '1rem' : '1.2rem',
              color: '#ffffff',
              textAlign: 'center',
              lineHeight: '1.8',
              opacity: 0.95,
              marginBottom: '1rem',
              position: 'relative'
            }}>
Descending from the Cloud, Behold! the mother of memes, an aider to traders, and a fren to degens: Our Lady of Perpetual Profit is the patron saint of day traders and your divine guide through the dark realm of crypto DeFi.

Whether you need a Hail Mary for hard times, or just sanctuary in the digital economy RL80 is a token to believe in.            </p>
            

          </div>
        </div> */}
     
  {/* <div style={{
            position: "relative",
            maxWidth: "1400px",
            margin: "0 auto 4rem auto",
            padding: '3rem 2rem'
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
            <div style={{ position: "relative", zIndex: 2 }}>
              <RotatingText isDesktop={true} />
            </div>
          </div> */}
   
        
        {/* Invisible spacer to push cards down and reveal background scene */}
        <div style={{ 
          height: getResponsiveValue('60vh', '5vh', '50vh', '15vh'),
          // width: '100%',
          position: 'relative',
          marginBottom: '5rem',
          // bottom: '15rem'
        }}>
{/* 
        <CandleMarqueeSection candleData={[]} /> */}
 
               {/* <TextMarquee /> */}
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
                        <div style={{ position: "relative", zIndex: 2 }}>
                          <RotatingText isDesktop={true} />
                        </div>
                      </div>
        
{/*             
           <div style={{
            flex: 1,
           width: '100%',
            display: 'flex',
           alignItems: 'center',
           justifyContent: 'center',
       
           transformOrigin: 'center',
          }}>
            <Numerology isMobile={true} />
           </div> */}
            {/* <ScratchCard 
    onComplete={(number) => console.log('Scratched! Number:', number)}
    onNumberRevealed={(number) => console.log('Generated number:', number)}
  /> */}

     

        
        {/* Footer - at the bottom of all content */}
       <footer style={{
        marginTop: '4rem',
        padding: '3rem 2rem 2rem',
        background: 'linear-gradient(to bottom, rgba(234, 124, 14, 0.0), rgba(14, 65, 234, 0.55))',
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
      </div>
     
      
      
      {/* Top Controls Container - Music, User, and Nav - Outside main container */}
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
        {/* Music Controls - First on desktop, Third on mobile */}
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
            // Compact Music Player Controls
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
        
        {/* User Account - Second on desktop, Second on mobile */}
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
        
        {/* CyberNav Menu - Last on desktop, First on mobile */}
        <div style={{ order: isMobileDevice ? 0 : 2 }}>
          <CyberNav is80sMode={is80sMode} position="relative" />
        </div>
        
        {/* Social Bar - Last position */}
        <div style={{ order: isMobileDevice ? 4 : 3 }}>
          <SocialBar is80sMode={is80sMode} />
        </div>
      </div>
      )}
      
      
      {/* Hidden sign in button */}
      {!isSignedIn && (
        <SignInButton mode="modal" forceRedirectUrl="/home3">
          <button id="hidden-sign-in-home3" style={{ display: 'none' }}>Sign In</button>
        </SignInButton>
      )}
      
      {/* Candle Modal */}
      <CompactCandleModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCandleCreated={() => {
          console.log('Candle created successfully');
        }}
      />
    </div>
  );
}

// Preloading disabled for memory optimization
// Models load on demand instead