import React, { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { createRoot } from 'react-dom/client';

export function CubeWithPortal({ position = [0, 0, 10], scrollY = 0 }) {
  const meshRef = useRef();
  const [showContent, setShowContent] = useState(false);
  const [screenPosition, setScreenPosition] = useState({ x: 0, y: 0, scale: 1 });
  const { camera, size } = useThree();
  
  // Calculate screen position for iframe
  useEffect(() => {
    if (!showContent || !meshRef.current) return;
    
    const updateScreenPosition = () => {
      const vector = new THREE.Vector3(position[0], position[1], position[2] + 0.5);
      vector.project(camera);
      
      const x = (vector.x * 0.5 + 0.5) * size.width;
      const y = (-vector.y * 0.5 + 0.5) * size.height;
      
      // Calculate scale based on distance
      const distance = camera.position.distanceTo(meshRef.current.position);
      const scale = Math.max(0.5, Math.min(2, 10 / distance));
      
      setScreenPosition({ x, y, scale });
    };
    
    const interval = setInterval(updateScreenPosition, 16); // 60fps update
    return () => clearInterval(interval);
  }, [showContent, camera, size, position]);
  
  // Animation based on scroll
  useFrame(() => {
    const targetScroll = 1500;
    const scrollDiff = scrollY - targetScroll;
    const entranceProgress = Math.min(1, Math.max(0, scrollDiff / 300));
    
    if (entranceProgress > 0 && meshRef.current) {
      const easedProgress = 1 - Math.pow(1 - entranceProgress, 3);
      const entranceOffset = (1 - easedProgress) * -15;
      const yOffset = Math.max(0, (scrollDiff - 300) * 0.01);
      const currentY = position[1] + entranceOffset + yOffset;
      
      meshRef.current.position.set(position[0], currentY, position[2]);
      meshRef.current.visible = true;
      meshRef.current.scale.set(easedProgress, easedProgress, easedProgress);
      meshRef.current.rotation.y = 0;
      
      setShowContent(true);
    } else if (meshRef.current) {
      meshRef.current.visible = false;
      setShowContent(false);
    }
  });
  
  // Portal content - rendered outside of Three.js context
  useEffect(() => {
    if (!showContent || typeof document === 'undefined') return;
    
    const portalContainer = document.createElement('div');
    portalContainer.id = 'cube-portal-' + Math.random();
    document.body.appendChild(portalContainer);
    
    const root = createRoot(portalContainer);
    
    const content = (
      <div
        style={{
          position: 'fixed',
          left: `${screenPosition.x}px`,
          top: `${screenPosition.y}px`,
          transform: `translate(-50%, -50%) scale(${screenPosition.scale})`,
          width: '400px',
          height: '300px',
          border: '3px solid #00ff41',
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: '0 0 30px rgba(0, 255, 65, 0.5)',
          zIndex: 10000,
          pointerEvents: 'auto',
        }}
      >
        <iframe
          src="/mini-scene.html"
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            display: 'block',
          }}
          title="Interactive 3D Scene"
        />
      </div>
    );
    
    root.render(content);
    
    return () => {
      root.unmount();
      setTimeout(() => {
        if (document.body.contains(portalContainer)) {
          document.body.removeChild(portalContainer);
        }
      }, 0);
    };
  }, [showContent, screenPosition]);
  
  return (
    <group ref={meshRef}>
      {/* Frame */}
      <mesh>
        <boxGeometry args={[8.2, 6.2, 0.6]} />
        <meshStandardMaterial 
          color="#00ff41"
          metalness={0.7}
          roughness={0.3}
          emissive="#00ff41"
          emissiveIntensity={0.3}
        />
      </mesh>
      
      {/* Back panel - now black to look like a screen */}
      <mesh position={[0, 0, -0.3]}>
        <boxGeometry args={[8, 6, 0.1]} />
        <meshStandardMaterial 
          color="#000000"
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>
      
      {/* Screen surface */}
      <mesh position={[0, 0, 0.31]}>
        <planeGeometry args={[7.8, 5.8]} />
        <meshBasicMaterial 
          color="#000000"
          transparent={true}
          opacity={0.5}
        />
      </mesh>
    </group>
  );
}