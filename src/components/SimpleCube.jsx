import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function SimpleCube({ position = [0, 0, 0], scrollY = 0 }) {
  const meshRef = useRef();
  
  // Animate cube based on scroll
  useFrame(() => {
    if (meshRef.current) {
      // Make it appear when scrolling down
      const targetScroll = 1500; // Appear earlier in scroll
      const isVisible = scrollY > targetScroll;
      
      // Move with scroll
      const yOffset = (scrollY - targetScroll) * 0.01;
      meshRef.current.position.y = position[1] + yOffset;
      
      // Show/hide
      meshRef.current.visible = isVisible;
      
      // Rotate when visible
      if (isVisible) {
        meshRef.current.rotation.x += 0.01;
        meshRef.current.rotation.y += 0.01;
      }
    }
  });
  
  return (
    <mesh ref={meshRef} position={position}>
      <boxGeometry args={[8, 8, 8]} />
      <meshStandardMaterial 
        color="#00ff00" 
        metalness={0.5} 
        roughness={0.3}
        emissive="#00ff00"
        emissiveIntensity={0.3}
        wireframe={false}
      />
    </mesh>
  );
}