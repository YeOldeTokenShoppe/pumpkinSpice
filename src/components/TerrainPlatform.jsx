import React, { useMemo, useRef } from 'react';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import * as THREE from 'three';

function TerrainPlatform({ 
  position = [0, -1, 0], 
  size = [10, 1, 10], 
  color = '#4a5d3a',
  heightVariation = 0.3,
  segments = [20, 20],
  rockCount = 8,
  grassPatches = 6,
  ...props 
}) {
  // Generate varied terrain geometry
  const terrainGeometry = useMemo(() => {
    const geometry = new THREE.PlaneGeometry(
      size[0] * 2, size[2] * 2, 
      segments[0], segments[1]
    );
    
    // Add height variation
    const vertices = geometry.attributes.position.array;
    for (let i = 0; i < vertices.length; i += 3) {
      // Add random height variation to Y coordinate
      vertices[i + 1] += (Math.random() - 0.5) * heightVariation;
    }
    
    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();
    
    // Rotate to be horizontal
    geometry.rotateX(-Math.PI / 2);
    
    return geometry;
  }, [size, heightVariation, segments]);

  // Generate random rocks and details
  const details = useMemo(() => {
    const rocks = [];
    const grass = [];
    
    // Generate rocks
    for (let i = 0; i < rockCount; i++) {
      const x = (Math.random() - 0.5) * size[0] * 1.8;
      const z = (Math.random() - 0.5) * size[2] * 1.8;
      const scale = 0.1 + Math.random() * 0.3;
      
      rocks.push({
        position: [x, 0.1, z],
        scale: [scale, scale * 0.6, scale],
        rotation: [0, Math.random() * Math.PI, 0]
      });
    }
    
    // Generate grass patches
    for (let i = 0; i < grassPatches; i++) {
      const x = (Math.random() - 0.5) * size[0] * 1.6;
      const z = (Math.random() - 0.5) * size[2] * 1.6;
      const scale = 0.3 + Math.random() * 0.5;
      
      grass.push({
        position: [x, 0.05, z],
        scale: [scale, scale * 0.3, scale],
        rotation: [0, Math.random() * Math.PI, 0]
      });
    }
    
    return { rocks, grass };
  }, [rockCount, grassPatches, size]);

  return (
    <RigidBody type="fixed" position={position} {...props}>
      <CuboidCollider args={size} />
      
      {/* Main terrain base */}
      <mesh position={[0, size[1], 0]}>
        <primitive object={terrainGeometry} />
        <meshStandardMaterial 
          color={color}
          roughness={0.9}
          metalness={0.1}
        />
      </mesh>
      
      {/* Detailed terrain mesh with height variation */}
      <mesh position={[0, size[1] + 0.1, 0]}>
        <primitive object={terrainGeometry.clone()} />
        <meshStandardMaterial 
          color={new THREE.Color(color).offsetHSL(0, 0, 0.1)}
          roughness={0.8}
          metalness={0.05}
          transparent
          opacity={0.8}
        />
      </mesh>
      
      {/* Rock details */}
      {details.rocks.map((rock, i) => (
        <mesh 
          key={`rock-${i}`} 
          position={[rock.position[0], size[1] + rock.position[1], rock.position[2]]}
          scale={rock.scale}
          rotation={rock.rotation}
        >
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial 
            color="#5a4a3a" 
            roughness={0.95}
            metalness={0}
          />
        </mesh>
      ))}
      
      {/* Grass patches */}
      {details.grass.map((patch, i) => (
        <mesh 
          key={`grass-${i}`} 
          position={[patch.position[0], size[1] + patch.position[1], patch.position[2]]}
          scale={patch.scale}
          rotation={patch.rotation}
        >
          <coneGeometry args={[1, 2, 6]} />
          <meshStandardMaterial 
            color="#2d5016" 
            roughness={0.9}
            metalness={0}
          />
        </mesh>
      ))}
    </RigidBody>
  );
}

export default TerrainPlatform;