import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { RigidBody } from '@react-three/rapier';

export default function WireframeTerrain({
  position = [0, 0, 0],
  size = [30, 10],
  segments = [30, 10],
  hillHeight = 3,
  hillFrequency = 0.3,
  color = '#00ffff',
  animated = true,
  animationSpeed = 0.5
}) {
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(size[0], size[1], segments[0], segments[1]);
    
    // Create hills using sine waves
    const vertices = geo.attributes.position.array;
    for (let i = 0; i < vertices.length; i += 3) {
      const x = vertices[i];
      const z = vertices[i + 1];
      
      // Create undulating hills
      const hill1 = Math.sin(x * hillFrequency) * Math.cos(z * hillFrequency * 0.7) * hillHeight;
      const hill2 = Math.sin(x * hillFrequency * 1.5 + 2) * Math.sin(z * hillFrequency * 1.2) * (hillHeight * 0.5);
      
      vertices[i + 2] = hill1 + hill2;
    }
    
    geo.computeVertexNormals();
    return geo;
  }, [size, segments, hillHeight, hillFrequency]);

  useFrame((state) => {
    if (animated && geometry) {
      const vertices = geometry.attributes.position.array;
      const time = state.clock.getElapsedTime() * animationSpeed;
      
      for (let i = 0; i < vertices.length; i += 3) {
        const x = vertices[i];
        const z = vertices[i + 1];
        
        // Gentle wave animation
        const wave = Math.sin(time + x * 0.1 + z * 0.1) * 0.1;
        const baseHeight = Math.sin(x * hillFrequency) * Math.cos(z * hillFrequency * 0.7) * hillHeight +
                         Math.sin(x * hillFrequency * 1.5 + 2) * Math.sin(z * hillFrequency * 1.2) * (hillHeight * 0.5);
        
        vertices[i + 2] = baseHeight + wave;
      }
      
      geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <group position={position}>
      {/* Physics collider for the terrain */}
      <RigidBody type="fixed">
        <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]}>
          <meshBasicMaterial 
            color={color}
            wireframe={true}
            transparent={true}
            opacity={0.8}
          />
        </mesh>
      </RigidBody>
      
      {/* Add a subtle glow effect (non-physical) */}
      <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]}>
        <meshBasicMaterial 
          color={color}
          wireframe={true}
          transparent={true}
          opacity={0.3}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      {/* Add a solid base platform for better collision */}
      <RigidBody type="fixed">
        <mesh position={[0, -0.5, 0]}>
          <boxGeometry args={[size[0], 1, size[1]]} />
          <meshBasicMaterial visible={false} />
        </mesh>
      </RigidBody>
    </group>
  );
}