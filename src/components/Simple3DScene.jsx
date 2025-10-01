'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Suspense, useEffect, useState, useRef, memo, useMemo } from 'react';
import { Cloud, Clouds, useGLTF, useAnimations, useHelper, OrbitControls, Text } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import DarkClouds from '@/components/Clouds';
import EnhancedVolumetricLight from '@/components/EnhancedVolumetricLight';
import { useFirestoreResults } from '@/utilities/useFirestoreResults';


// Custom Ticker Curve Component
const TickerCurve = ({ scrollY, scale = 1, position = [0, 0, -40] }) => {
  const textRefs = useRef([]);
  const curveRef = useRef();
  
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
        mesh.position.y = point.y - 0.1;  // Slightly below the curve
        mesh.position.z = point.z + 0.5;  // Offset in front of curve surface
        
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
  
  return (
    <group position={position} scale={scale}>
      {/* Render the curve as a visible ribbon */}
      <mesh ref={curveRef} renderOrder={0}>
        <tubeGeometry args={[curve, 100, 0.5, 3, false]} />
        <meshBasicMaterial 
          color="#1a1a1a" 
          transparent 
          opacity={0.8}
          depthTest={true}
          depthWrite={true}
        />
      </mesh>
      
      {/* Text elements as direct siblings to mesh */}
      {(firestoreResults.length > 0 
        ? firestoreResults.slice(0, 5).flatMap(item => [
            `${item.userName || 'ANON'}`,
            '▲',
            `${(item.burnedAmount || 0).toLocaleString()}`,
            '•'
          ])
        : ['$', 'DIVINE', '+', 'ENERGY', '▲', 'FLOWS', '$', 'REALM']
      ).map((word, index) => (
        <Text
          key={index}
          ref={el => textRefs.current[index] = el}
          fontSize={0.35}
          color="#00FF41"  // Matrix green
          anchorX="center"
          anchorY="middle"

          material-emissiveIntensity={0.1}
          letterSpacing={0.2}
          material-toneMapped={false}
          material-depthTest={true}
          material-depthWrite={true}
          renderOrder={0}  // Changed to 0 for proper depth sorting
          segments={1}  // Lower segments for blockier appearance
        >
          {word.toUpperCase()}
        </Text>
      ))}
    </group>
  );
};

// Optimized Our Lady Model
const OurLadyModel = memo(({ isMobile, scrollY, modelRef, onLoad }) => {
  const { scene } = useGLTF('/models/ourlady_rider6.glb');
  const groupRef = useRef();
  
  useEffect(() => {
    if (scene) {
      // Store model reference
      if (modelRef) {
        modelRef.current = scene;
      }
      
      // Optimize the model and optionally hide the ticker
      scene.traverse((child) => {
        // Hide or remove the original ticker mesh
        if (child.name === 'ticker') {
          child.visible = false; // Hide the original ticker
          console.log('Hidden original ticker mesh');
        }
        
        // Optimize all meshes
        if (child instanceof THREE.Mesh) {
          child.castShadow = false;
          child.receiveShadow = false;
          // Reduce material complexity
          if (child.material) {
            child.material.envMapIntensity = 0;
            child.material.reflectivity = 0;
          }
        }
      });
      
      // Signal that model is loaded
      if (onLoad) onLoad();
    }
  }, [scene, modelRef, onLoad]);
  
  // Animate based on scroll
  useFrame(() => {
    if (groupRef.current) {
      const baseY = isMobile ? -15 : -15;
      groupRef.current.position.y = baseY + scrollY * 0.015;
    }
    // Removed old ticker text animation - now handled by TickerCurve component
  });
  
  return (
    <group ref={groupRef} position={isMobile ? [2, -8, -10] : [2, 8, -11]}>
      <primitive 
        object={scene} 
        scale={isMobile ? [10, 10, 10] : [10, 10, 10]}
        rotation={isMobile ? [0, -3.3, 0] : [0.1, -3.2, 0]}
      />
      
      {/* Custom Ticker Curve - moves with model */}
      <TickerCurve 
        scrollY={scrollY}
        scale={3}
        position={[0, -2, 5]} // Position relative to model
      />
    </group>
  );
});

OurLadyModel.displayName = 'OurLadyModel';

// Optimized Angel Model
const AngelModel = memo(({ isMobile, scrollY }) => {
  const { scene, animations } = useGLTF('/models/angelEmoji.glb');
  const { actions } = useAnimations(animations, scene);
  const groupRef = useRef();
  
  useEffect(() => {
    if (scene) {
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = false;
          child.receiveShadow = false;
        }
      });
    }
    // Play animations
    if (actions) {
      // Play the first animation as before
      if (Object.keys(actions).length > 0) {
        const firstAction = Object.values(actions)[0];
        firstAction.play();
      }
      
      // Also play the 'Scene' animation if it exists
      if (actions['Scene']) {
        actions['Scene'].play();
      }
    }
  }, [scene, actions]);
  
  // Animate with scroll and billboard
  useFrame(({ camera, clock }) => {
    if (groupRef.current) {
      // Base position with scroll
      const baseY = -5 + scrollY * 0.018; // Faster than main model
      
      // Add hovering motion
      const hover = Math.sin(clock.getElapsedTime() * 1.5) * 0.5; // Speed: 1.5, amplitude: 0.5
      groupRef.current.position.y = baseY + hover;
      
      // Billboard effect - make the model face the camera
      groupRef.current.lookAt(camera.position);
    }
  });
  
  return (
    <group ref={groupRef} position={[-15, -5, -8]}>
      <primitive 
        object={scene} 
        scale={isMobile ? [1, 1, 1] : [1, 1, 1]}
        rotation={[0, 0, 0]}
      />
    </group>
  );
});

AngelModel.displayName = 'AngelModel';

// Optimized Devil Model  
const DevilModel = memo(({ isMobile, scrollY }) => {
  const { scene, animations } = useGLTF('/models/devilEmoji2.glb');
  const { actions } = useAnimations(animations, scene);
  const groupRef = useRef();
  
  useEffect(() => {
    if (scene) {
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = false;
          child.receiveShadow = false;
        }
      });
    }
    // Play animation if available
    if (actions && Object.keys(actions).length > 0) {
      const firstAction = Object.values(actions)[0];
      firstAction.play();
    }
  }, [scene, actions]);
  
  // Animate with scroll and billboard
  useFrame(({ camera, clock }) => {
    if (groupRef.current) {
      // Base position with scroll
      const baseY = -5 + scrollY * 0.018; // Slower than main model
      
      // Add hovering motion - different speed and phase offset for desync
      const hover = Math.sin(clock.getElapsedTime() * 1.0 + Math.PI) * 0.4; // Speed: 1.0, amplitude: 0.4, phase offset: π
      groupRef.current.position.y = baseY + hover;
      
      // Billboard effect - make the model face the camera
      groupRef.current.lookAt(camera.position);
    }
  });
  
  return (
    <group ref={groupRef} position={[1, -1, -1]}>
      <primitive 
        object={scene} 
        scale={isMobile ? [1, 1, 1] : [1, 1, 1]}
        rotation={[0, 0, 0]}
        position={[12, -5, -6]}
      />
    </group>
  );
});

DevilModel.displayName = 'DevilModel';

// Spotlight with Helper
const SpotlightWithTarget = ({ isMobile, scrollY, showHelper = false }) => {
  const spotlightRef = useRef();
  const targetRef = useRef();
  
  // Always call useHelper, but pass null if we don't want to show it
  useHelper(showHelper ? spotlightRef : null, THREE.SpotLightHelper, 'yellow');
  
  useFrame(() => {
    if (spotlightRef.current && targetRef.current) {
      const baseY = isMobile ? -20 : -20;  // Updated to match your new values
      const modelX = isMobile ? -10 : -2;  // Updated to match your new values
      const modelZ = isMobile ? -10 : -12;
      
      // Update target position to follow model
      targetRef.current.position.set(modelX, baseY + scrollY * 0.015, modelZ);
      
      // Point spotlight at target
      spotlightRef.current.target = targetRef.current;
    }
  });
  
  return (
    <>
      {/* <spotLight
        ref={spotlightRef}
        position={isMobile ? [0, 20, 15] : [5, 25, 20]}
        angle={0.4}
        penumbra={0.3}
        intensity={1.0}
        color="#fff5ee"
        castShadow={false}
        distance={50}
      /> */}
      {/* <mesh ref={targetRef} visible={false}>
        <boxGeometry args={[0.1, 0.1, 0.1]} />
      </mesh> */}
    </>
  );
};

// Directional Light with Helper
const DirectionalLightWithHelper = ({ showHelper = false, isMobile, scrollY }) => {
  const lightRef = useRef();
  const targetRef = useRef();
  
  // Always call useHelper, but pass null if we don't want to show it
  useHelper(showHelper ? lightRef : null, THREE.DirectionalLightHelper, 5, 'cyan');
  
  useFrame(() => {
    if (lightRef.current && targetRef.current) {
      const baseY = isMobile ? -11 : -15;
      const modelX = isMobile ? -10 : 2;
      const modelZ = isMobile ? -10 : -11;
      
      // Update target position to follow model
      targetRef.current.position.set(modelX, baseY + scrollY * 0.015, modelZ);
      
      // Update light position to follow model as well
      lightRef.current.position.set(10, -5 + scrollY * 0.015, 18);
      
      // Point directional light at target
      lightRef.current.target = targetRef.current;
    }
  });
  
  return (
    <>
      <directionalLight 
        ref={lightRef}
        position={[10, -5, 18]} 
        intensity={0} 
        color="#ffffff"
      />
      <mesh ref={targetRef} visible={false}>
        <boxGeometry args={[0.1, 0.1, 0.1]} />
      </mesh>
    </>
  );
};

function SimpleScene({ isMobile, scrollY, enableBloom }) {
  const cloudGroupRef = useRef();
  const modelRef = useRef();
  const [modelLoaded, setModelLoaded] = useState(false);
  
  // Debug logging
  useEffect(() => {
    console.log('[SimpleScene] Model loaded status:', modelLoaded);
    console.log('[SimpleScene] ModelRef current:', modelRef.current);
  }, [modelLoaded]);
  
  // Animate clouds with scroll
  useFrame(() => {
    if (cloudGroupRef.current) {
      // Clouds move slightly slower than model for parallax effect
      cloudGroupRef.current.position.y = scrollY * 0.012;
    }
  });
  
  return (
    <>
      <ambientLight intensity={1.7} />
      <DirectionalLightWithHelper showHelper={false} isMobile={isMobile} scrollY={scrollY} />
      
      {/* Spotlight with target that follows Our Lady */}
      <SpotlightWithTarget 
        isMobile={isMobile} 
        scrollY={scrollY} 
        showHelper={true} // Set to true to see the spotlight cone
      />
      
      {/* Additional lights for better illumination */}
      <pointLight 
        position={[0, 5, 15]} 
        intensity={1.5} 
        color="#ffeedd" 
      />
      <pointLight 
        position={isMobile ? [-10, 0, 0] : [-6, 0, 0]} 
        intensity={1} 
        color="#ffffff" 
      />
      
      {/* Add some heavenly clouds that move with scroll */}
      <group ref={cloudGroupRef}>
        <DarkClouds />
 
      </group>
      
      {/* Our Lady Model */}
      <Suspense fallback={
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[2, 4, 2]} />
          <meshBasicMaterial color="#ffc0cb" />
        </mesh>
      }>
        <OurLadyModel 
          isMobile={isMobile} 
          scrollY={scrollY} 
          modelRef={modelRef}
          onLoad={() => setModelLoaded(true)}
        />
      </Suspense>
      
      <EnhancedVolumetricLight 
        position={[0, 50 + scrollY * 0.015, 0]} 
        target={[3, -30 + scrollY * 0.015, -5]}
        color="#ffffee"
        intensity={2.0}
      />
      
      {/* Angel and Devil models - desktop only for memory */}
      {!isMobile && (
        <>
          <Suspense fallback={null}>
            <AngelModel isMobile={isMobile} scrollY={scrollY} />
          </Suspense>
          <Suspense fallback={null}>
            <DevilModel isMobile={isMobile} scrollY={scrollY} />
          </Suspense>
        </>
      )}
      
      {/* Add bloom effect if enabled */}
      {enableBloom && (
        <EffectComposer>
          <Bloom 
            intensity={0.99}
            luminanceThreshold={0.4}
            luminanceSmoothing={0.9}
            mipmapBlur
            radius={0.8}
          />
        </EffectComposer>
      )}
      
      {/* Orbit Controls for zooming and rotating */}
      {/* <OrbitControls
        enablePan={false}  // Disable panning
        enableRotate={true}  // Allow rotation
        enableZoom={true}  // Allow zoom
        minDistance={10}  // Minimum zoom distance
        maxDistance={100}  // Maximum zoom distance
        maxPolarAngle={Math.PI / 1.8}  // Limit vertical rotation
        minPolarAngle={Math.PI / 3}  // Limit vertical rotation
        rotateSpeed={0.5}  // Slower rotation
        zoomSpeed={0.8}  // Moderate zoom speed
        dampingFactor={0.05}
        enableDamping={true}
        // target={[isMobile ? -10 : -2, -15 + scrollY * 0.015, -12]}  // Look at model
        zoomToCursor={true}  // Zoom towards cursor position
      /> */}
    </>
  );
}

export default function Simple3DScene({ enabled = false, isMobile = false, scrollY = 0, enableBloom = true }) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    // Delay mounting to avoid conflicts
    const timer = setTimeout(() => {
      setMounted(true);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  if (!enabled || !mounted) {
    return (
      <div style={{
        width: '100%',
        height: '100%',
        background: 'linear-gradient(to bottom, #87CEEB, #98D8E8)',
        display: 'flex', 
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <p style={{ color: 'white', fontSize: '18px' }}>
          {/* {!enabled ? '3D Scene Disabled' : 'Loading 3D Scene...'} */}
        </p>
      </div>
    );
  }
  
  return (
    <Canvas
      camera={{ position: [0, -10, 40], fov: 40, near: 0.1, far: 300 }}
      gl={{
        antialias: false,
        powerPreference: 'high-performance',
        preserveDrawingBuffer: false,
      }}
      dpr={[1, 1]} // Limit pixel ratio
      flat // Disable tone mapping
      linear // Disable color management
    >
      <color attach="background" args={['#87CEEB']} />
      <Suspense fallback={null}>
        <SimpleScene isMobile={isMobile} scrollY={scrollY} enableBloom={enableBloom && !isMobile} />
      </Suspense>
    </Canvas>
  );
}