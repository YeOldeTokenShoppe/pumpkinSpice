"use client";

import React, { useRef, useState, useEffect, useCallback, memo, Suspense, lazy } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import PostProcessingEffects from "@/components/PostProcessingEffects";
import FloatingCandleViewer from "@/components/CandleInteraction";

// Lazy load components
const MobileCandleOrbital = lazy(() => import('@/components/MobileCandleOrbital'));
const HolographicStatue3 = lazy(() => import('@/components/HolographicStatue3'));
const StarField = lazy(() => import('@/components/StarField'));
import ConstellationModel from "@/components/ConstellationModel";

// Simplified alligator model component - match original approach
const AlligatorModel = memo(({ isMobileView, modelRef, hideCandles = false, onLoad }) => {
  const { scene } = useGLTF('/models/alligatorStroll6.glb');
  const outerGroupRef = useRef(); // For positioning
  const rotationGroupRef = useRef(); // For rotation
  const arrowRef = useRef(); // For the arrow object
  const hasLoadedRef = useRef(false);
  
  useEffect(() => {
    if (!scene || !rotationGroupRef.current || !outerGroupRef.current) return;
    
    // Set the ref so MobileCandleOrbital can find the model
    if (modelRef) {
      modelRef.current = scene;
    }
    
    // Clear groups
    rotationGroupRef.current.clear();
    if (arrowRef.current) {
      outerGroupRef.current.remove(arrowRef.current);
      arrowRef.current = null;
    }
    
    const clonedScene = scene.clone();
    
    // Calculate center for proper rotation
    const box = new THREE.Box3().setFromObject(clonedScene);
    const center = box.getCenter(new THREE.Vector3());
    
    // Find and extract the arrow object
    let arrowObject = null;
    clonedScene.traverse((child) => {
      if (child.name && child.name.toLowerCase() === 'arrow') {
        arrowObject = child;
      }
    });
    
    // If arrow exists, remove it from the cloned scene
    if (arrowObject) {
      // Store the arrow's world position before removing
      const arrowWorldPos = new THREE.Vector3();
      const arrowWorldQuat = new THREE.Quaternion();
      const arrowWorldScale = new THREE.Vector3();
      arrowObject.getWorldPosition(arrowWorldPos);
      arrowObject.getWorldQuaternion(arrowWorldQuat);
      arrowObject.getWorldScale(arrowWorldScale);
      
      // Remove arrow from its parent
      arrowObject.removeFromParent();
      
      // Create a new group for the arrow that won't rotate
      const arrowGroup = new THREE.Group();
      arrowGroup.add(arrowObject);
      
      // Apply the stored world transform adjusted for centering
      arrowObject.position.copy(arrowWorldPos);
      arrowObject.position.x -= center.x;
      arrowObject.position.z -= center.z;
      arrowObject.position.y -= center.y;
      arrowObject.quaternion.copy(arrowWorldQuat);
      arrowObject.scale.copy(arrowWorldScale);
      
      // Add arrow group to outer group (non-rotating)
      arrowRef.current = arrowGroup;
      outerGroupRef.current.add(arrowGroup);
    }
    
    // Center the model for rotation
    clonedScene.position.x = -center.x;
    clonedScene.position.z = -center.z;
    clonedScene.position.y = -center.y;
    
    // Hide or show candles based on prop
    clonedScene.traverse((child) => {
      if (child.name && child.name.toUpperCase().includes('VCANDLE')) {
        child.visible = !hideCandles;
      }
      
      if (child instanceof THREE.Mesh) {
        child.castShadow = false;
        child.receiveShadow = false;
        // Don't zero out material properties - let them use their defaults
        if (child.material) {
          child.material.needsUpdate = true;
        }
      }
    });
    
    rotationGroupRef.current.add(clonedScene);
    
    // Call onLoad only once when first loaded
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
      if (onLoad) {
        // Small delay to ensure the model is fully rendered
        setTimeout(() => {
          onLoad();
        }, 100);
      }
    }
  }, [scene, modelRef, hideCandles, onLoad]);
  
  // Simple rotation animation
  useFrame((state, delta) => {
    if (rotationGroupRef.current) {
      rotationGroupRef.current.rotation.y += delta * 0.1;
    }
  });
  
  // Outer group positions the model, inner group rotates
  return (
    <group ref={outerGroupRef} position={[0, -2, 0]} scale={[10, 10, 10]}>
      <group ref={rotationGroupRef} />
    </group>
  );
});

AlligatorModel.displayName = 'AlligatorModel';

// Preload the model
useGLTF.preload('/models/alligatorStroll6.glb');

// Shadow configuration component for desktop
function ShadowConfig({ isMobileView }) {
  const { gl } = useThree();
  
  useEffect(() => {
    if (!isMobileView && gl.shadowMap) {
      gl.shadowMap.enabled = true;
      gl.shadowMap.type = THREE.PCFSoftShadowMap;
      // Set higher resolution for desktop
      gl.shadowMap.needsUpdate = true;
    }
  }, [isMobileView, gl]);
  
  return null;
}

// Wireframe Grid Component with wave animation
function WireframeGrid() {
  const gridRef = useRef();
  const originalPositions = useRef(null);
  
  useEffect(() => {
    if (gridRef.current) {
      // Create a green wireframe material
      const material = new THREE.LineBasicMaterial({ 
        color: 0x00ff00, 
        opacity: 0.3, 
        transparent: true 
      });
      
      // Update the grid material
      gridRef.current.material = material;
      
      // Store original vertex positions
      if (gridRef.current.geometry && gridRef.current.geometry.attributes.position) {
        originalPositions.current = gridRef.current.geometry.attributes.position.array.slice();
      }
    }
  }, []);
  
  // Animate the grid with waves
  useFrame((state) => {
    if (gridRef.current && originalPositions.current) {
      const positions = gridRef.current.geometry.attributes.position.array;
      const time = state.clock.elapsedTime;
      
      for (let i = 0; i < positions.length; i += 3) {
        const x = originalPositions.current[i];
        const z = originalPositions.current[i + 2];
        
        // Create multiple smaller wave effects
        const wave1 = Math.sin(x * 0.3 - time * 2) * 0.15;
        const wave2 = Math.sin(z * 0.3 - time * 1.5) * 0.15;
        const wave3 = Math.sin((x + z) * 0.2 - time * 2.5) * 0.1;
        
        // Combine waves for a complex pattern
        const waveHeight = wave1 + wave2 + wave3;
        
        // Apply wave to Y position
        positions[i + 1] = originalPositions.current[i + 1] + waveHeight;
      }
      
      gridRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });
  
  return (
    <gridHelper 
      ref={gridRef}
      args={[100, 50]} // size, divisions
      position={[0, -7.5, 0]}
      rotation={[0, 0, 0]}
    />
  );
}

// Jumping Arrow Component
function JumpingArrow() {
  const { scene } = useGLTF('/models/greenUpArrow.glb');
  const arrowRef = useRef();
  const startX = -30;
  const endX = 30;
  const jumpHeight = 15;
  const baseY = -5; // Start from slightly above the grid
  
  useEffect(() => {
    if (scene && arrowRef.current) {
      // Clear and add scene
      arrowRef.current.clear();
      const clonedScene = scene.clone();
      
      // Scale the arrow
      clonedScene.scale.set(2, 2, 2);
      
      // Add material properties for visibility
      clonedScene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          if (child.material) {
            child.material.emissive = new THREE.Color(0x00ff00);
            child.material.emissiveIntensity = 0.3;
          }
        }
      });
      
      arrowRef.current.add(clonedScene);
    }
  }, [scene]);
  
  // Animate the arrow in linear diagonal motion
  useFrame((state) => {
    if (arrowRef.current) {
      const time = state.clock.elapsedTime;
      const moveDuration = 4; // seconds for one diagonal pass
      const progress = (time % moveDuration) / moveDuration;
      
      // Calculate linear diagonal position
      const x = startX + (endX - startX) * progress;
      const y = baseY + jumpHeight * progress; // Linear rise from baseY to baseY + jumpHeight
      const z = -20 + 15 * progress; // Move forward as it goes across
      
      // Update position
      arrowRef.current.position.x = x;
      arrowRef.current.position.y = y;
      arrowRef.current.position.z = z;
      
      // Keep arrow pointing in direction of motion (optional - remove if you want it completely still)
      arrowRef.current.rotation.z = -Math.PI / 4; // Slight tilt to match diagonal trajectory
    }
  });
  
  return <group ref={arrowRef} />;
}

// Preload the arrow model
useGLTF.preload('/models/greenUpArrow.glb');

// Main scene component
function SimpleScene({ isMobileView, is80sMode, enableCandles = false, enableStatue = false, onPaginationChange, candleData = [], sortBy, onCandleClick, showFloatingViewer, onAssetsLoaded }) {
  const modelRef = useRef();
  const [statueLoaded, setStatueLoaded] = useState(!enableStatue); // Consider loaded if not enabled
  const [modelLoaded, setModelLoaded] = useState(false);
  
  // Track when all assets are loaded
  useEffect(() => {
    if (statueLoaded && modelLoaded) {
      console.log('Gallery3Scene: All assets loaded');
      if (onAssetsLoaded) {
        onAssetsLoaded();
      }
    }
  }, [statueLoaded, modelLoaded, onAssetsLoaded]);
  
  // Handle statue load
  const handleStatueLoad = useCallback(() => {
    console.log('Gallery3Scene: HolographicStatue3 loaded');
    setStatueLoaded(true);
  }, []);
  
  // Handle model load (called from AlligatorModel)
  const handleModelLoad = useCallback(() => {
    console.log('Gallery3Scene: AlligatorModel loaded');
    setModelLoaded(true);
  }, []);
  
  return (
    <>
      {/* Shadow configuration for desktop */}
      <ShadowConfig isMobileView={isMobileView} />
      
      {/* StarField - Background stars */}
      <Suspense fallback={null}>
        <StarField is80sMode={is80sMode} />
      </Suspense>
      
      {/* Lighting - Enhanced for better visibility */}
      <ambientLight intensity={1.5} />
      
      {/* Hemisphere light for better ambient lighting */}
      <hemisphereLight
        skyColor={is80sMode ? "#ff00ff" : "#7300ff"}
        groundColor={is80sMode ? "#00ffff" : "#ff0000"}
        intensity={1.5}
      />
      
      {/* Add some directional light for better visibility */}
      <directionalLight 
        position={[10, 10, 5]} 
        intensity={1.5}
        castShadow={!isMobileView}
        shadow-mapSize={!isMobileView ? [4096, 4096] : [1024, 1024]}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      
      {/* Point light for additional illumination */}
      <pointLight 
        position={[0, 10, 0]} 
        intensity={1.3}
        distance={50}
        decay={2}
      />
      
      {/* Wireframe Grid */}
      <WireframeGrid />
      
      {/* Jumping Arrow */}
      {/* <Suspense fallback={null}>
        <JumpingArrow />
      </Suspense> */}
      
      {/* Model */}
      <Suspense fallback={null}>
        <AlligatorModel 
          isMobileView={isMobileView} 
          modelRef={modelRef}
          hideCandles={enableCandles}
          onLoad={handleModelLoad}
        />
      </Suspense>
      
      {/* Holographic Statue - positioned like original */}
      {enableStatue && (
        <Suspense fallback={null}>
          <HolographicStatue3 onLoad={handleStatueLoad} />
        </Suspense>
      )}
      
      {/* Mobile Candle Orbital - needs modelRef to extract candles */}
      {enableCandles && modelRef.current && (
        <Suspense fallback={null}>
          <MobileCandleOrbital 
            modelRef={modelRef}
            candleData={candleData}
            onCandleClick={onCandleClick}
            onPaginationChange={onPaginationChange}
            sortBy={sortBy}
            isViewerOpen={showFloatingViewer}
          />
        </Suspense>
      )}
      
      {/* Controls */}
      <OrbitControls
        // enableZoom={!isMobileView}
        enableZoom={true}
        zoomToCursor
        // minDistance={isMobileView ? 10 : 30}
        minDistance={1}
        maxDistance={20}
        enablePan={false}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 2}
        autoRotate={false}
      />
    </>
  );
}

// Main component following Simple3DScene pattern
export default function Gallery3Scene({ enabled = false, isMobileView = true, is80sMode = false, onSceneReady, enableCandles = false, enableStatue = false, onPaginationChange, candleData = [], sortBy }) {
  const [mounted, setMounted] = useState(false);
  const [showFloatingViewer, setShowFloatingViewer] = useState(false);
  const [selectedCandleData, setSelectedCandleData] = useState(null);
  const [assetsLoaded, setAssetsLoaded] = useState(false);
  
  // Handle candle click
  const handleCandleClick = useCallback((candleData) => {
    console.log('Candle clicked:', candleData);
    setSelectedCandleData(candleData);
    setShowFloatingViewer(true);
  }, []);
  
  // Close floating viewer
  const closeFloatingViewer = useCallback(() => {
    setShowFloatingViewer(false);
    setSelectedCandleData(null);
  }, []);
  
  // Handle when all assets are loaded
  const handleAssetsLoaded = useCallback(() => {
    console.log('Gallery3Scene: All scene assets loaded');
    setAssetsLoaded(true);
    
    // Notify parent that scene is ready
    if (onSceneReady) {
      // Small delay to ensure everything is rendered
      setTimeout(() => {
        onSceneReady(true);
      }, 300);
    }
  }, [onSceneReady]);
  
  useEffect(() => {
    // Delay mounting to avoid conflicts (from Simple3DScene)
    const timer = setTimeout(() => {
      setMounted(true);
      
      // Log memory
      // if (performance.memory) {
      //   console.log('Gallery3Scene mounted - Memory:', {
      //     used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) + 'MB',
      //     total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024) + 'MB'
      //   });
      // }
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  if (!enabled || !mounted) {
    return null; // Return nothing - InfinityLoader is already shown by the parent
  }
  
  return (
    <>
    <Canvas
      camera={{ 
        position: isMobileView ? [0, 0, 20] : [0, 0, 80], // Match original gallery
        fov: isMobileView ? 60 : 35, // Match original gallery
        near: 0.1, 
        far: 1000 // Match original gallery
      }}
      gl={{
        antialias: !isMobileView, // Enable antialiasing on desktop
        alpha: false,
        powerPreference: 'high-performance',
        preserveDrawingBuffer: false,
        failIfMajorPerformanceCaveat: false,
        stencil: false, // Disable stencil buffer if not needed
        depth: true, // Ensure depth buffer is enabled
      }}
      shadows={!isMobileView}
      dpr={isMobileView ? [1, 1.5] : [1.5, 2]} // Higher DPR for desktop
    >
      <color attach="background" args={['#000000']} />
      <Suspense fallback={null}>
            <ConstellationModel 
              groupScale={[30, 30, 30]} // Original scale for 3DVotiveStand
              groupPosition={[0, 0, -200]} // Original position for 3DVotiveStand
            />
          </Suspense>
      <Suspense fallback={null}>
        <SimpleScene 
          isMobileView={isMobileView} 
          is80sMode={is80sMode}
          enableCandles={enableCandles}
          enableStatue={enableStatue}
          onPaginationChange={onPaginationChange}
          candleData={candleData}
          sortBy={sortBy}
          onCandleClick={handleCandleClick}
          showFloatingViewer={showFloatingViewer}
          onAssetsLoaded={handleAssetsLoaded}
        />
      </Suspense>
      <Suspense fallback={null}>
          <PostProcessingEffects is80sMode={is80sMode} sunRef={null} />
        </Suspense>
    </Canvas>
    
    {/* FloatingCandleViewer - Outside Canvas */}
    {showFloatingViewer && selectedCandleData && (
      <FloatingCandleViewer
        key={`candle-viewer-${selectedCandleData.candleId}-${selectedCandleData.candleTimestamp}`}
        isVisible={showFloatingViewer}
        userData={selectedCandleData}
        onClose={closeFloatingViewer}
      />
    )}
    </>
  );
}