import React, { useMemo } from 'react';
import { RigidBody } from '@react-three/rapier';
import * as THREE from 'three';

export default function LandPlatform({
  position = [0, 0, 0],
  size = [15, 1, 40],
  color = '#1a1a1a',
  wireframeColor = '#00ff88',
  showWireframe = true,
  terrainVariation = 0.3
}) {
  // Create terrain geometry with height variation
  const terrainGeometry = useMemo(() => {
    const geometry = new THREE.PlaneGeometry(size[0], size[2], 20, 40);
    const vertices = geometry.attributes.position.array;
    
    // Add height variation to vertices
    for (let i = 0; i < vertices.length; i += 3) {
      const x = vertices[i];
      const y = vertices[i + 1];
      
      // Create gentle hills using sine waves
      const variation = 
        Math.sin(x * 0.3) * Math.cos(y * 0.2) * terrainVariation +
        Math.sin(x * 0.7 + 1) * Math.sin(y * 0.5) * (terrainVariation * 0.5);
      
      vertices[i + 2] = variation;
    }
    
    geometry.computeVertexNormals();
    return geometry;
  }, [size, terrainVariation]);

  return (
    <group position={position}>
      {/* Main solid platform with physics */}
      <RigidBody type="fixed">
        <mesh position={[0, -0.5, 0]} receiveShadow>
          <boxGeometry args={size} />
          <meshStandardMaterial 
            color={color}
            roughness={0.8}
            metalness={0.2}
          />
        </mesh>
      </RigidBody>
      
      {/* Terrain surface visual only - no collider */}
      <mesh 
        geometry={terrainGeometry} 
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.01, 0]}
        receiveShadow
      >
        <meshStandardMaterial 
          color={color}
          roughness={0.9}
          metalness={0.1}
        />
      </mesh>
      
      {/* Wireframe overlay on top */}
      {showWireframe && (
        <mesh 
          geometry={terrainGeometry}
          position={[0, 0.02, 0]} 
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <meshBasicMaterial 
            color={wireframeColor}
            wireframe={true}
            transparent={true}
            opacity={0.7}
          />
        </mesh>
      )}
      
      {/* Edge glow effect */}
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[size[0] + 0.5, size[2] + 0.5, 1, 1]} />
        <meshBasicMaterial 
          color={wireframeColor}
          transparent={true}
          opacity={0.1}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}