import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { CSS3DRenderer, CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer';

// Manages CSS3D renderer as a singleton
let css3DRenderer = null;
let css3DScene = null;
let lastRenderTime = 0;

export function CubeWithIframe({ position = [0, 0, 0], scrollY = 0 }) {
  const meshRef = useRef();
  const css3DObjectRef = useRef();
  const { gl, camera, size } = useThree();
  const [isVisible, setIsVisible] = useState(false);
  const lastVisibleRef = useRef(false);
  
  // Initialize CSS3D renderer once
  useEffect(() => {
    if (!css3DRenderer) {
      css3DRenderer = new CSS3DRenderer();
      css3DRenderer.setSize(size.width, size.height);
      css3DRenderer.domElement.style.position = 'absolute';
      css3DRenderer.domElement.style.top = '0';
      css3DRenderer.domElement.style.left = '0';
      css3DRenderer.domElement.style.pointerEvents = 'auto'; // Enable pointer events
      css3DRenderer.domElement.style.zIndex = '1'; // Put in front of WebGL
      
      // Create separate scene for CSS3D objects
      css3DScene = new THREE.Scene();
      
      // Insert CSS3D renderer dom element AFTER WebGL canvas for proper layering
      const container = gl.domElement.parentElement;
      if (container) {
        container.style.position = 'relative';
        container.appendChild(css3DRenderer.domElement);
        
        // Make WebGL canvas allow CSS3D interaction
        gl.domElement.style.pointerEvents = 'none';
      }
    }
    
    // Create iframe and CSS3D object
    const iframe = document.createElement('iframe');
    iframe.style.width = '800px';
    iframe.style.height = '600px';
    iframe.style.border = '3px solid #00ff41';
    iframe.style.borderRadius = '8px';
    iframe.style.backgroundColor = '#000';
    iframe.style.boxShadow = '0 0 20px rgba(0, 255, 65, 0.5)';
    iframe.src = '/dashboard.html';
    iframe.style.pointerEvents = 'auto'; // Enable pointer events on iframe itself
    
    // Log when iframe loads
    iframe.onload = () => {
      console.log('Iframe loaded successfully');
    };
    iframe.onerror = (e) => {
      console.error('Iframe failed to load:', e);
    };
    
    // Create CSS3D object from iframe
    const css3DObject = new CSS3DObject(iframe);
    css3DObjectRef.current = css3DObject;
    css3DScene.add(css3DObject);
    
    // Initially hide it
    iframe.style.display = 'none';
    
    // Handle resize
    const handleResize = () => {
      if (css3DRenderer) {
        css3DRenderer.setSize(window.innerWidth, window.innerHeight);
      }
    };
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      if (css3DScene && css3DObjectRef.current) {
        css3DScene.remove(css3DObjectRef.current);
      }
      // Clean up renderer on unmount
      if (css3DRenderer && css3DRenderer.domElement.parentElement) {
        css3DRenderer.domElement.parentElement.removeChild(css3DRenderer.domElement);
        css3DRenderer = null;
        css3DScene = null;
      }
    };
  }, [gl, size]);
  
  // Check visibility based on scroll (less frequently)
  useEffect(() => {
    const targetScroll = 1500;
    const newIsVisible = scrollY > targetScroll;
    
    if (newIsVisible !== lastVisibleRef.current) {
      setIsVisible(newIsVisible);
      lastVisibleRef.current = newIsVisible;
      
      // Update iframe visibility
      if (css3DObjectRef.current) {
        css3DObjectRef.current.element.style.display = newIsVisible ? 'block' : 'none';
      }
    }
  }, [scrollY]);
  
  // Store last Y position
  const lastYRef = useRef(0);
  const needsRenderRef = useRef(true);
  
  // Render CSS3D only when scroll changes significantly
  useEffect(() => {
    if (css3DRenderer && css3DScene) {
      const targetScroll = 1500;
      const scrollDiff = scrollY - targetScroll;
      const entranceProgress = Math.min(1, Math.max(0, scrollDiff / 300));
      
      if (entranceProgress > 0) {
        css3DRenderer.render(css3DScene, camera);
      }
    }
  }, [scrollY, camera]); // Only re-render when scroll or camera changes
  
  // Update positions in render loop but don't render CSS3D
  useFrame(() => {
    const targetScroll = 1500;
    
    // Calculate entrance animation (pop up from below)
    const scrollDiff = scrollY - targetScroll;
    const entranceProgress = Math.min(1, Math.max(0, scrollDiff / 300)); // 300px scroll range for animation
    
    // Smooth easing function for entrance
    const easedProgress = 1 - Math.pow(1 - entranceProgress, 3); // Cubic ease-out
    
    // Start from below and animate up to final position
    const entranceOffset = (1 - easedProgress) * -15; // Start 15 units below
    
    // Calculate position that moves with scroll after entrance
    const yOffset = Math.max(0, (scrollDiff - 300) * 0.01); // Only start scroll movement after entrance
    
    const currentY = position[1] + entranceOffset + yOffset;
    
    if (meshRef.current) {
      // Update cube position and visibility
      meshRef.current.position.set(position[0], currentY, position[2]);
      meshRef.current.visible = entranceProgress > 0;
      
      // Scale up as it enters (optional - adds nice pop effect)
      const scale = easedProgress;
      meshRef.current.scale.set(scale, scale, scale);
      
      // Rotate 180 degrees to face camera
      meshRef.current.rotation.y = Math.PI;
      
      // Always update CSS3D object position to match cube exactly
      if (css3DObjectRef.current) {
        // Keep iframe at exact same position as cube
        css3DObjectRef.current.position.set(
          position[0],
          currentY,
          position[2] - 0.5  // Now behind cube since we're flipped
        );
        
        // Also rotate iframe to face camera
        css3DObjectRef.current.rotation.y = Math.PI;
        
        css3DObjectRef.current.scale.set(0.01 * scale, 0.01 * scale, 0.01 * scale);
        
        // Fade in the iframe content
        css3DObjectRef.current.element.style.opacity = easedProgress;
      }
    }
  });
  
  return (
    <group ref={meshRef}>
      {/* The 3D cube backing */}
      <mesh>
        <boxGeometry args={[8, 6, 0.5]} />
        <meshStandardMaterial 
          color="#1a1a2e"
          metalness={0.9}
          roughness={0.1}
          emissive="#00ff41"
          emissiveIntensity={0.1}
        />
      </mesh>
      
      {/* Frame edges for the screen */}
      <mesh position={[0, 0, 0.1]}>
        <boxGeometry args={[8.2, 6.2, 0.6]} />
        <meshStandardMaterial 
          color="#00ff41"
          metalness={0.7}
          roughness={0.3}
          emissive="#00ff41"
          emissiveIntensity={0.3}
        />
      </mesh>
    </group>
  );
}