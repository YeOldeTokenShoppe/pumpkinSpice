import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { CSS3DRenderer, CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer';

// Single instance of CSS3D renderer - stored globally
let globalCSS3DRenderer = null;
let globalCSS3DScene = null;
let globalInitialized = false;

export function CubeWithIframeFixed({ position = [0, 0, 10], scrollY = 0 }) {
  const meshRef = useRef();
  const css3DObjectRef = useRef();
  const { gl, camera, size } = useThree();
  
  // Initialize CSS3D renderer once
  useEffect(() => {
    // Disable this component completely since we're using CubeWithPortal now
    return;
    if (!globalInitialized) {
      globalInitialized = true;
      
      // Create CSS3D renderer
      globalCSS3DRenderer = new CSS3DRenderer();
      globalCSS3DRenderer.setSize(size.width, size.height);
      globalCSS3DRenderer.domElement.style.position = 'absolute';
      globalCSS3DRenderer.domElement.style.top = '0';
      globalCSS3DRenderer.domElement.style.left = '0';
      globalCSS3DRenderer.domElement.style.width = '100%';
      globalCSS3DRenderer.domElement.style.height = '100%';
      globalCSS3DRenderer.domElement.style.pointerEvents = 'auto';
      
      // Create CSS3D scene
      globalCSS3DScene = new THREE.Scene();
      
      // Get the canvas container
      const container = gl.domElement.parentElement;
      if (container) {
        // Insert CSS3D renderer BEFORE WebGL (as base layer)
        container.insertBefore(globalCSS3DRenderer.domElement, gl.domElement);
        
        // Make WebGL transparent and on top
        gl.domElement.style.position = 'absolute';
        gl.domElement.style.top = '0';
        gl.domElement.style.left = '0';
        gl.domElement.style.pointerEvents = 'none';
        gl.domElement.style.zIndex = '1';
        
        // Force WebGL to be transparent
        gl.setClearColor(0x000000, 0);
      }
      
      // Create iframe
      const iframe = document.createElement('iframe');
      iframe.style.width = '800px';
      iframe.style.height = '600px';
      iframe.style.border = '3px solid #00ff41';
      iframe.style.borderRadius = '8px';
      iframe.style.backgroundColor = '#000';
      iframe.style.boxShadow = '0 0 20px rgba(0, 255, 65, 0.5)';
      iframe.src = '/dashboard.html';
      
      // Debug iframe loading
      iframe.onload = () => {
        console.log('Iframe loaded successfully in Fixed component');
        iframe.style.visibility = 'visible';
        
        // Check if iframe is actually in DOM and visible
        console.log('Iframe in DOM:', document.body.contains(iframe));
        console.log('Iframe computed style:', window.getComputedStyle(iframe));
        console.log('Parent element:', iframe.parentElement);
        
        // Force iframe to be on top temporarily for testing
        iframe.style.position = 'fixed';
        iframe.style.top = '50%';
        iframe.style.left = '50%';
        iframe.style.transform = 'translate(-50%, -50%)';
        iframe.style.zIndex = '9999';
        iframe.style.width = '400px';
        iframe.style.height = '300px';
      };
      iframe.onerror = (e) => {
        console.error('Iframe failed to load:', e);
      };
      
      // Test: Add iframe directly to DOM first (commented out to prevent error)
      // document.body.appendChild(iframe);
      
      // Create CSS3D object (commented out for testing)
      // const css3DObject = new CSS3DObject(iframe);
      // css3DObject.scale.set(0.01, 0.01, 0.01);
      // css3DObjectRef.current = css3DObject;
      // globalCSS3DScene.add(css3DObject);
      
      console.log('CSS3D Renderer initialized with iframe');
      console.log('CSS3D DOM element parent:', globalCSS3DRenderer.domElement.parentElement);
      console.log('CSS3D Scene children:', globalCSS3DScene.children);
      
      // Make sure the CSS3D renderer is visible
      globalCSS3DRenderer.domElement.style.visibility = 'visible';
      globalCSS3DRenderer.domElement.style.opacity = '1';
      globalCSS3DRenderer.domElement.style.zIndex = '0';
    }
    
    // Handle resize
    const handleResize = () => {
      if (globalCSS3DRenderer) {
        globalCSS3DRenderer.setSize(window.innerWidth, window.innerHeight);
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      // Don't destroy on unmount - keep singleton alive
    };
  }, [gl, size]);
  
  // Removed occlusion plane - not needed since we have a back panel
  
  // Animation loop - render both CSS3D and update positions
  useFrame(() => {
    // Always render CSS3D in sync with WebGL
    if (globalCSS3DRenderer && globalCSS3DScene) {
      globalCSS3DRenderer.render(globalCSS3DScene, camera);
    }
    
    const targetScroll = 1500;
    const scrollDiff = scrollY - targetScroll;
    const entranceProgress = Math.min(1, Math.max(0, scrollDiff / 300));
    
    if (entranceProgress > 0) {
      const easedProgress = 1 - Math.pow(1 - entranceProgress, 3);
      const entranceOffset = (1 - easedProgress) * -15;
      const yOffset = Math.max(0, (scrollDiff - 300) * 0.01);
      const currentY = position[1] + entranceOffset + yOffset;
      
      // Update cube position
      if (meshRef.current) {
        meshRef.current.position.set(position[0], currentY, position[2]);
        meshRef.current.visible = true;
        meshRef.current.scale.set(easedProgress, easedProgress, easedProgress);
        meshRef.current.rotation.y = Math.PI;
      }
      
      // Update CSS3D object position to match cube exactly
      // Commented out for testing direct DOM iframe
      // if (css3DObjectRef.current) {
      //   css3DObjectRef.current.position.set(position[0], currentY, position[2]);
      //   css3DObjectRef.current.rotation.y = Math.PI;
      //   css3DObjectRef.current.element.style.opacity = '1'; // Always fully visible
      //   css3DObjectRef.current.element.style.display = 'block';
      //   css3DObjectRef.current.element.style.visibility = 'visible';
      //   css3DObjectRef.current.scale.set(0.01, 0.01, 0.01); // Fixed scale
      // }
    } else {
      if (meshRef.current) {
        meshRef.current.visible = false;
      }
      // if (css3DObjectRef.current) {
      //   css3DObjectRef.current.element.style.opacity = '0';
      // }
    }
  });
  
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
      
      {/* Back panel */}
      <mesh position={[0, 0, -0.3]}>
        <boxGeometry args={[8, 6, 0.1]} />
        <meshStandardMaterial 
          color="#1a1a2e"
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>
    </group>
  );
}