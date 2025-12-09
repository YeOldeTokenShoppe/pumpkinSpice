import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';

export function VideoTextureCube({ position = [0, 0, 0], scrollY = 0 }) {
  const meshRef = useRef();
  const videoRef = useRef();
  
  // Create video element
  const videoTexture = useMemo(() => {
    const video = document.createElement('video');
    video.src = '/demo-video.mp4'; // You'll need to add a video file
    video.crossOrigin = 'anonymous';
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    videoRef.current = video;
    
    const texture = new THREE.VideoTexture(video);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.format = THREE.RGBFormat;
    
    return texture;
  }, []);
  
  // Animate cube based on scroll
  useFrame(() => {
    if (meshRef.current) {
      const targetScroll = 1500;
      const isVisible = scrollY > targetScroll;
      
      // Calculate position
      const yOffset = Math.max(0, (scrollY - targetScroll) * 0.01);
      meshRef.current.position.y = position[1] + yOffset;
      meshRef.current.visible = isVisible;
      
      // Rotate cube and play video when visible
      if (isVisible) {
        meshRef.current.rotation.y += 0.005;
        if (videoRef.current && videoRef.current.paused) {
          videoRef.current.play().catch(e => console.log('Video play failed:', e));
        }
      } else {
        if (videoRef.current && !videoRef.current.paused) {
          videoRef.current.pause();
        }
      }
    }
  });
  
  return (
    <group position={position}>
      {/* Main screen */}
      <mesh ref={meshRef}>
        <planeGeometry args={[8, 4.5]} />
        <meshBasicMaterial map={videoTexture} side={THREE.DoubleSide} />
      </mesh>
      
      {/* Frame */}
      <mesh>
        <boxGeometry args={[8.4, 4.9, 0.2]} />
        <meshStandardMaterial 
          color="#00ff41"
          metalness={0.7}
          roughness={0.3}
          emissive="#00ff41"
          emissiveIntensity={0.2}
        />
      </mesh>
    </group>
  );
}