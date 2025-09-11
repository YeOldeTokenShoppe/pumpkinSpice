import React, { useMemo, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useThree, useFrame } from '@react-three/fiber';

const SkySphere = ({ type = 'color', fearGreedValue = 50 }) => {
  const { scene } = useThree();
  const meshRef = React.useRef();
  const currentColorRef = React.useRef(new THREE.Color());
  
  const cubeTexture = useMemo(() => {
    if (type !== 'cubemap') return null;
    
    const loader = new THREE.CubeTextureLoader();
    const texture = loader.load([
      '/skybox/PolygonSciFiSpace_Skybox_01_Right.png',  // positive X
      '/skybox/PolygonSciFiSpace_Skybox_01_Left.png',   // negative X
      '/skybox/PolygonSciFiSpace_Skybox_01_Up.png',     // positive Y
      '/skybox/PolygonSciFiSpace_Skybox_01_Down.png',   // negative Y
      '/skybox/PolygonSciFiSpace_Skybox_01_Front.png',  // positive Z
      '/skybox/PolygonSciFiSpace_Skybox_01_Back.png'    // negative Z
    ]);
    
    return texture;
  }, [type]);
  
  React.useEffect(() => {
    if (type === 'cubemap' && cubeTexture) {
      scene.background = cubeTexture;
      scene.environment = cubeTexture;
      return () => {
        scene.background = null;
        scene.environment = null;
      };
    }
  }, [scene, cubeTexture, type]);
  
  if (type === 'cubemap') {
    return null;
  }
  
  // Calculate color based on Fear & Greed value
  const getColorForSentiment = (value) => {
    // Create a gradient from dark (fear) to blue (greed)
    if (value < 20) {
      // Extreme Fear: Very dark, almost black
      return new THREE.Color().lerpColors(
        new THREE.Color(0x0a0a0a), // Near black
        new THREE.Color(0x1a1a1a), // Very dark grey
        value / 20
      );
    } else if (value < 40) {
      // Fear: Dark grey
      return new THREE.Color().lerpColors(
        new THREE.Color(0x1a1a1a), // Very dark grey
        new THREE.Color(0x333333), // Dark grey
        (value - 20) / 20
      );
    } else if (value < 50) {
      // Neutral-Fear: Soft lavender grey
      return new THREE.Color().lerpColors(
        new THREE.Color(0x7a7a8a), // Soft grey with lavender hint
        new THREE.Color(0x9a9aaa), // Light lavender grey
        (value - 40) / 10
      );
    } else if (value < 60) {
      // Neutral-Greed: Soft periwinkle
      return new THREE.Color().lerpColors(
        new THREE.Color(0x9a9aaa), // Light lavender grey
        new THREE.Color(0xaab4ca), // Soft periwinkle blue
        (value - 50) / 10
      );
    } else if (value < 80) {
      // Greed: Pretty sky blue gradient
      return new THREE.Color().lerpColors(
        new THREE.Color(0xaab4ca), // Soft periwinkle blue
        new THREE.Color(0xb8d4e8), // Light powder blue
        (value - 60) / 20
      );
    } else {
      // Extreme Greed: Your original blue
      return new THREE.Color().lerpColors(
        new THREE.Color(0x6a8aaa), // Light blue-grey
        new THREE.Color(0x87CEEB), // Sky blue (your original color)
        (value - 80) / 20
      );
    }
  };
  
  // Log when fearGreedValue changes
  useEffect(() => {
    console.log('SkySphere: fearGreedValue changed to:', fearGreedValue);
  }, [fearGreedValue]);
  
  // Smoothly animate color changes
  useFrame((state, delta) => {
    if (meshRef.current && meshRef.current.material) {
      const targetColor = getColorForSentiment(fearGreedValue);
      currentColorRef.current.lerp(targetColor, delta * 0.5); // Smooth transition
      meshRef.current.material.color.copy(currentColorRef.current);
    }
  });
  
  return (
    <mesh ref={meshRef} scale={[500, 500, 500]}>
      <sphereGeometry args={[1, 32, 32]} />
      <meshBasicMaterial 
        color={getColorForSentiment(fearGreedValue)} 
        side={THREE.BackSide}
        fog={false}
      />
    </mesh>
  );
};

export default SkySphere;