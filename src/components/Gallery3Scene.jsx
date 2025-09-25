"use client";

import React, { useRef, useState, useEffect, useCallback, memo, Suspense, lazy } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import PostProcessingEffects from "@/components/PostProcessingEffects";
import FloatingCandleViewer from "@/components/CandleInteraction";

// Lazy load components
const MobileCandleOrbital = lazy(() => import('@/components/MobileCandleOrbital'));
const HolographicStatue3 = lazy(() => import('@/components/HolographicStatue3'));
const StarField = lazy(() => import('@/components/StarField'));

// Simplified alligator model component - match original approach
const AlligatorModel = memo(({ isMobileView, modelRef, hideCandles = false }) => {
  const { scene } = useGLTF('/models/alligatorStroll5.glb');
  const outerGroupRef = useRef(); // For positioning
  const rotationGroupRef = useRef(); // For rotation
  
  useEffect(() => {
    if (!scene || !rotationGroupRef.current) return;
    
    // Set the ref so MobileCandleOrbital can find the model
    if (modelRef) {
      modelRef.current = scene;
    }
    
    // Clear and add scene
    rotationGroupRef.current.clear();
    const clonedScene = scene.clone();
    
    // Calculate center for proper rotation
    const box = new THREE.Box3().setFromObject(clonedScene);
    const center = box.getCenter(new THREE.Vector3());
    
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
        if (child.material) {
          // Keep some environmental lighting for better visibility
          child.material.envMapIntensity = 0.5;
          if (child.material.metalness !== undefined) {
            child.material.metalness = Math.min(child.material.metalness, 0.5);
          }
          if (child.material.roughness !== undefined) {
            child.material.roughness = Math.max(child.material.roughness, 0.3);
          }
          // Ensure material responds to lights
          child.material.needsUpdate = true;
        }
      }
    });
    
    rotationGroupRef.current.add(clonedScene);
  }, [scene, modelRef, hideCandles]);
  
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
useGLTF.preload('/models/alligatorStroll5.glb');

// Main scene component
function SimpleScene({ isMobileView, is80sMode, enableCandles = false, enableStatue = false, onPaginationChange, candleData = [], sortBy, onCandleClick, showFloatingViewer }) {
  const modelRef = useRef();
  
  return (
    <>
      {/* StarField - Background stars */}
      <Suspense fallback={null}>
        <StarField is80sMode={is80sMode} />
      </Suspense>
      
      {/* Lighting - Match original gallery brightness with Model's internal lighting compensation */}
      <ambientLight intensity={3} />
      
      {/* Primary hemisphere light with stronger purple/magenta tones */}
      <hemisphereLight
        skyColor={is80sMode ? "#ff00ff" : "#ff00ff"}
        groundColor={is80sMode ? "#00ffff" : "#7300ff"}
        intensity={4}
      />
      
      {/* Secondary hemisphere light to simulate Model's internal lighting */}
      <hemisphereLight
        skyColor="#7300ff"
        groundColor="#ff0000"
        intensity={1}
      />
      
      {/* Add some directional light for better visibility */}
      <directionalLight 
        position={[10, 10, 5]} 
        intensity={4}
        color="#ffffff"
        castShadow={false}
      />
      
      {/* Point light for additional illumination */}
      <pointLight 
        position={[0, 10, 0]} 
        intensity={3}
        color="#ff88ff"
        distance={100}
        decay={1}
      />
      
      {/* Model */}
      <Suspense fallback={null}>
        <AlligatorModel 
          isMobileView={isMobileView} 
          modelRef={modelRef}
          hideCandles={enableCandles} 
        />
      </Suspense>
      
      {/* Holographic Statue - positioned like original */}
      {enableStatue && (
        <Suspense fallback={null}>
          <HolographicStatue3 />
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
        enableZoom={!isMobileView}
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
  
  useEffect(() => {
    // Delay mounting to avoid conflicts (from Simple3DScene)
    const timer = setTimeout(() => {
      setMounted(true);
      
      // Add extra delay before notifying scene is ready
      setTimeout(() => {
        if (onSceneReady) {
          onSceneReady(true);
        }
        
        // Log memory
        if (performance.memory) {
          console.log('Gallery3Scene mounted - Memory:', {
            used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) + 'MB',
            total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024) + 'MB'
          });
        }
      }, 500); // Extra delay to ensure everything is rendered
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [onSceneReady]);
  
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
      <color attach="background" args={['#000000']} />
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