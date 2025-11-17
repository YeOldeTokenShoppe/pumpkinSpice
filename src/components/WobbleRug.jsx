import React, { useRef, useMemo } from 'react';
import { useGLTF, MeshWobbleMaterial } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CuboidCollider, CylinderCollider } from '@react-three/rapier';

export function WobbleRug({ 
  speed = 1, 
  factor = .07, 
  position = [0, 0, 0], 
  rotation = [0, 0, 0], 
  scale = 1,
  modelPath = '/models/rug.glb',
  floatSpeed = 1.5,
  floatHeight = 0.1,
  rotationSpeed = 0.8,
  rotationAmount = 0.02,
  baseHoverHeight = 0.2,
  floatOffset = 0,
  tidalSpeed = 0.3,
  tidalDistance = 0.8,
  ...props 
}) {
  const { nodes, materials } = useGLTF(modelPath);
  const rigidBodyRef = useRef();
  
  // Determine collider type and dimensions based on model path
  const { colliderType, colliderArgs } = useMemo(() => {
    // Base sizes that will be multiplied by scale
    let type, args;
    
    if (modelPath.includes('bear')) {
      type = 'bear';
      // Bear rug - wider and longer, accounting for bear shape
      args = [1.2 * scale, 0.15 * scale, 1.4 * scale];
    } else if (modelPath.includes('rug3') || modelPath.includes('rug4')) {
      type = 'round';
      // Round rugs - cylinder with proper radius accounting for scale
      args = [0.15 * scale, 1.1 * scale]; // [height, radius]
    } else if (modelPath.includes('rug5') || modelPath.includes('rug6')) {
      type = 'round';
      // Larger round rugs
      args = [0.15 * scale, 1.3 * scale]; // [height, radius]
    } else {
      type = 'rect';
      // Rectangular rugs - standard size
      args = [1.0 * scale, 0.15 * scale, 1.4 * scale];
    }
    
    return { colliderType: type, colliderArgs: args };
  }, [modelPath, scale]);

  // Floating animation with independent parameters and tidal drift
  useFrame((state) => {
    if (rigidBodyRef.current) {
      // Create gentle floating motion with unique timing
      const time = state.clock.getElapsedTime() + floatOffset;
      const float = Math.sin(time * floatSpeed) * floatHeight;
      const rotate = Math.sin(time * rotationSpeed) * rotationAmount;
      
      // Add tidal drift - horizontal movement along x-axis (toward/away from shores)
      const tidalDrift = Math.sin(time * tidalSpeed + floatOffset * 2) * tidalDistance;
      
      // Update kinematic body position with tidal drift
      const newX = position[0] + tidalDrift; // Add tidal movement to x position
      const newY = position[1] + float + baseHoverHeight;
      const newRotY = rotation[1] + rotate;
      
      rigidBodyRef.current.setTranslation({
        x: newX,
        y: newY,
        z: position[2]
      });
      
      rigidBodyRef.current.setRotation({
        x: rotation[0],
        y: newRotY,
        z: rotation[2],
        w: Math.cos(newRotY / 2)
      });
    }
  });

  // Create a rigid body for physics interactions
  return (
    <RigidBody
      ref={rigidBodyRef}
      type="kinematicPosition"
      position={position}
      rotation={rotation}
      {...props}
    >
      {/* Use appropriate collider based on rug type with dynamic sizing */}
      {colliderType === 'bear' || colliderType === 'rect' ? (
        // Cuboid collider for bear and rectangular rugs
        <CuboidCollider args={colliderArgs} />
      ) : (
        // Cylinder collider for round rugs
        <CylinderCollider args={colliderArgs} />
      )}
      <group scale={scale} position={[0, 0, 0]}>
      {Object.entries(nodes).map(([key, node]) => {
        if (node.isMesh) {
          const originalMaterial = node.material || materials[Object.keys(materials)[0]];
          
          return (
            <mesh
              key={key}
              geometry={node.geometry}
              position={[0, 0, 0]}
              rotation={node.rotation}
              scale={node.scale}
            >
              <MeshWobbleMaterial
                speed={speed}
                factor={factor}
                color={originalMaterial?.color || '#ffffff'}
                map={originalMaterial?.map}
                normalMap={originalMaterial?.normalMap}
                roughnessMap={originalMaterial?.roughnessMap}
                metalnessMap={originalMaterial?.metalnessMap}
                aoMap={originalMaterial?.aoMap}
                roughness={originalMaterial?.roughness || 0.5}
                metalness={originalMaterial?.metalness || 0}
              />
            </mesh>
          );
        }
        return null;
      })}
      </group>
    </RigidBody>
  );
}

// Preload the model
useGLTF.preload('/models/rug.glb');