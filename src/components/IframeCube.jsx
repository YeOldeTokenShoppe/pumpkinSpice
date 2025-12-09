import React, { useRef, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { CSS3DRenderer, CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer';

// Create a component that manages the CSS3D renderer
export function CSS3DRendererComponent({ children }) {
  const { gl, scene, camera, size } = useThree();
  const css3DRenderer = useRef();
  const css3DScene = useRef(new THREE.Scene());
  
  useEffect(() => {
    // Create CSS3D renderer
    css3DRenderer.current = new CSS3DRenderer();
    css3DRenderer.current.setSize(size.width, size.height);
    css3DRenderer.current.domElement.style.position = 'absolute';
    css3DRenderer.current.domElement.style.top = '0';
    css3DRenderer.current.domElement.style.left = '0';
    css3DRenderer.current.domElement.style.pointerEvents = 'auto';
    css3DRenderer.current.domElement.style.zIndex = '1';
    
    // Append CSS3D renderer after WebGL renderer
    const container = gl.domElement.parentElement;
    container.style.position = 'relative';
    container.appendChild(css3DRenderer.current.domElement);
    
    // Make WebGL canvas allow pointer events to pass through to CSS3D layer
    gl.domElement.style.pointerEvents = 'auto';
    
    return () => {
      if (css3DRenderer.current && css3DRenderer.current.domElement.parentElement) {
        css3DRenderer.current.domElement.parentElement.removeChild(css3DRenderer.current.domElement);
      }
    };
  }, [gl, size]);
  
  // Update CSS3D renderer on each frame
  useFrame(() => {
    if (css3DRenderer.current) {
      css3DRenderer.current.render(css3DScene.current, camera);
    }
  });
  
  // Handle resize
  useEffect(() => {
    if (css3DRenderer.current) {
      css3DRenderer.current.setSize(size.width, size.height);
    }
  }, [size]);
  
  // Pass the CSS3D scene to children
  return (
    <>
      {React.Children.map(children, child =>
        React.cloneElement(child, { css3DScene: css3DScene.current })
      )}
    </>
  );
}

// Iframe Cube Component
export function IframeCube({ position = [0, 0, 0], scrollY = 0, css3DScene }) {
  const meshRef = useRef();
  const css3DObjectRef = useRef();
  const occlusionRef = useRef();
  
  // Create iframe element
  const iframe = useMemo(() => {
    const iframe = document.createElement('iframe');
    iframe.style.width = '512px';
    iframe.style.height = '288px';
    iframe.style.border = '2px solid #00ff41';
    iframe.style.borderRadius = '4px';
    iframe.style.backgroundColor = '#000';
    iframe.src = '/dashboard.html'; // Point to the HTML file
    return iframe;
  }, []);
  
  useEffect(() => {
    if (!css3DScene) {
      console.log('No CSS3D scene provided, creating cube without iframe');
      return;
    }
    
    // Create CSS3D object
    const css3DObject = new CSS3DObject(iframe);
    css3DObject.position.set(position[0], position[1], position[2] + 1.01);
    css3DObject.scale.set(0.01, 0.01, 0.01);
    css3DObjectRef.current = css3DObject;
    css3DScene.add(css3DObject);
    
    console.log('CSS3D Object added at position:', position);
    
    return () => {
      if (css3DScene && css3DObjectRef.current) {
        css3DScene.remove(css3DObjectRef.current);
      }
    };
  }, [css3DScene, position, iframe]);
  
  // Animate cube based on scroll
  useFrame(() => {
    if (meshRef.current) {
      // Simple visibility based on scroll
      const targetScroll = 2000; // Appear earlier
      const isVisible = scrollY > targetScroll;
      
      // Calculate Y position that moves with scroll
      const yPos = position[1] + (scrollY - targetScroll) * 0.02;
      
      // Update cube position
      meshRef.current.position.set(position[0], yPos, position[2]);
      meshRef.current.visible = isVisible;
      
      // Rotate cube
      if (isVisible) {
        meshRef.current.rotation.y += 0.005;
      }
      
      // Update iframe position to match cube
      if (css3DObjectRef.current && isVisible) {
        css3DObjectRef.current.position.set(position[0], yPos, position[2] + 1.01);
        css3DObjectRef.current.rotation.y = meshRef.current.rotation.y;
        css3DObjectRef.current.element.style.display = 'block';
      } else if (css3DObjectRef.current) {
        css3DObjectRef.current.element.style.display = 'none';
      }
      
      // Update occlusion plane
      if (occlusionRef.current) {
        occlusionRef.current.position.set(position[0], yPos, position[2] + 1);
        occlusionRef.current.visible = isVisible;
      }
    }
  });
  
  return (
    <>
      {/* The 3D cube */}
      <mesh ref={meshRef} position={position}>
        <boxGeometry args={[5, 3, 3]} />
        <meshStandardMaterial 
          color="#ff00ff" 
          metalness={0.5} 
          roughness={0.3}
          emissive="#ff00ff"
          emissiveIntensity={0.2}
        />
      </mesh>
      
      {/* Occlusion plane */}
      <mesh ref={occlusionRef} position={[position[0], position[1], position[2] + 1]}>
        <planeGeometry args={[5.1, 3.1]} />
        <meshBasicMaterial 
          color="black" 
          opacity={0}
          transparent={true}
          blending={THREE.NoBlending}
        />
      </mesh>
    </>
  );
}