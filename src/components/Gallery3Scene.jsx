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
import ConstellationModel from "@/components/ConstellationModel";

// Simplified alligator model component - match original approach
const AlligatorModel = memo(({ isMobileView, modelRef, hideCandles = false, onLoad }) => {
  const { scene } = useGLTF('/models/alligatorStroll5.glb');
  const outerGroupRef = useRef(); // For positioning
  const rotationGroupRef = useRef(); // For rotation
  const hasLoadedRef = useRef(false);
  
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
useGLTF.preload('/models/alligatorStroll5.glb');

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
        castShadow={false}
      />
      
      {/* Point light for additional illumination */}
      <pointLight 
        position={[0, 10, 0]} 
        intensity={1.3}
        distance={50}
        decay={2}
      />
      
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
        antialias: false,
        alpha: false,
        powerPreference: 'high-performance',
        preserveDrawingBuffer: false,
        failIfMajorPerformanceCaveat: false,
      }}
      dpr={[1, 1]} // Limit pixel ratio
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