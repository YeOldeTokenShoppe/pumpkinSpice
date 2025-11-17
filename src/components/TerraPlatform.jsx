import React from 'react';
import { RigidBody, CuboidCollider } from '@react-three/rapier';

function TerraPlatform({ 
  position = [0, -1, 0], 
  size = [10, 1, 10], 
  color = '#4a5d3a',
  ...props 
}) {
  return (
    <RigidBody type="fixed" position={position} {...props}>
      <CuboidCollider args={size} />
      <mesh>
        <boxGeometry args={[size[0] * 2, size[1] * 2, size[2] * 2]} />
        <meshStandardMaterial 
          color={color}
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>
    </RigidBody>
  );
}

export default TerraPlatform;