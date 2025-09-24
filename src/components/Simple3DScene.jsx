'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Suspense, useEffect, useState, useRef, memo } from 'react';
import { Cloud, Clouds, useGLTF, useAnimations, useHelper, OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import DarkClouds from '@/components/Clouds';
import EnhancedVolumetricLight from '@/components/EnhancedVolumetricLight';

// Optimized Our Lady Model
const OurLadyModel = memo(({ isMobile, scrollY }) => {
  const { scene } = useGLTF('/models/ourlady_rider6.glb');
  const modelRef = useRef();
  const groupRef = useRef();
  
  useEffect(() => {
    if (scene) {
      // Optimize the model
      scene.traverse((child) => {
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
    }
  }, [scene]);
  
  // Animate based on scroll
  useFrame(() => {
    if (groupRef.current) {
      const baseY = isMobile ? -11 : -15;
      groupRef.current.position.y = baseY + scrollY * 0.015;
    }
  });
  
  return (
    <group ref={groupRef} position={isMobile ? [2, -8, -10] : [2, 8, -11]}>
      <primitive 
        ref={modelRef}
        object={scene} 
        scale={isMobile ? [10, 10, 10] : [10, 10, 10]}
        rotation={isMobile ? [0, -3.3, 0] : [0.1, -3.2, 0]}
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
    // Play animation if available
    if (actions && Object.keys(actions).length > 0) {
      const firstAction = Object.values(actions)[0];
      firstAction.play();
    }
  }, [scene, actions]);
  
  // Animate with scroll - moves at different speed for parallax
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.position.y = -5 + scrollY * 0.018; // Faster than main model
      groupRef.current.rotation.y += 0.005; // Gentle rotation
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
  const { scene, animations } = useGLTF('/models/devilEmoji.glb');
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
  
  // Animate with scroll - moves at different speed
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.position.y = -5 + scrollY * 0.01; // Slower than main model
      groupRef.current.rotation.y -= 0.005; // Opposite rotation
    }
  });
  
  return (
    <group ref={groupRef} position={[15, -5, -8]}>
      <primitive 
        object={scene} 
        scale={isMobile ? [1, 1, 1] : [1, 1, 1]}
        rotation={[0, Math.PI, 0]}
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
        <OurLadyModel isMobile={isMobile} scrollY={scrollY} />
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
            intensity={0.5}
            luminanceThreshold={0.3}
            luminanceSmoothing={0.9}
            mipmapBlur
            radius={0.5}
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
        target={[isMobile ? -10 : -2, -15 + scrollY * 0.015, -12]}  // Look at model
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
          {!enabled ? '3D Scene Disabled' : 'Loading 3D Scene...'}
        </p>
      </div>
    );
  }
  
  return (
    <Canvas
      camera={{ position: [0, -10, 40], fov: 45 }}
      gl={{
        antialias: false,
        alpha: false,
        powerPreference: 'high-performance',
        preserveDrawingBuffer: false,
        failIfMajorPerformanceCaveat: false,
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