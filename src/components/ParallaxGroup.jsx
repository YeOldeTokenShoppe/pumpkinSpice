import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

export function ParallaxGroup({ 
  children, 
  speed = 0.5,  // How much slower this layer moves (0.5 = half speed)
  axis = 'x',   // Which axis to apply parallax on: 'x', 'y', or 'both'
  maxOffset = 5 // Maximum offset distance
}) {
  const groupRef = useRef();
  const { camera } = useThree();
  const initialCameraPos = useRef(new THREE.Vector3());
  
  // Store initial camera position
  useFrame((state, delta) => {
    if (!groupRef.current) return;
    
    // Initialize camera position on first frame
    if (initialCameraPos.current.length() === 0) {
      initialCameraPos.current.copy(camera.position);
    }
    
    // Calculate camera offset from initial position
    const cameraOffset = camera.position.clone().sub(initialCameraPos.current);
    
    // Apply parallax based on axis setting
    if (axis === 'x' || axis === 'both') {
      const xOffset = Math.max(-maxOffset, Math.min(maxOffset, cameraOffset.x * speed));
      groupRef.current.position.x = xOffset;
    }
    
    if (axis === 'y' || axis === 'both') {
      const yOffset = Math.max(-maxOffset, Math.min(maxOffset, cameraOffset.y * speed));
      groupRef.current.position.y = yOffset;
    }
    
    // Optional: Add subtle rotation for more depth
    if (axis === 'both') {
      groupRef.current.rotation.y = cameraOffset.x * 0.001 * speed;
    }
  });
  
  return (
    <group ref={groupRef}>
      {children}
    </group>
  );
}