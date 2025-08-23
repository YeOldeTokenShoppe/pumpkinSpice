import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF, MeshRefractionMaterial, CubeCamera } from '@react-three/drei';

const FallingDiamonds = ({ 
  count = 40,
  diamondModelPath = '/models/dflat.glb',
  fallSpeed = 1,
  spread = 1.4,
  heightRange = 40,
  startY = 40,
  useCubeCamera = true,
  scale = 1
}) => {
  const { viewport, clock } = useThree();
  const model = useRef();
  const { nodes } = useGLTF(diamondModelPath);
  
  // Create dummy object for matrix calculations
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  // Create random diamond data
  const diamonds = useMemo(
    () =>
      new Array(count).fill().map((_, i) => ({
        position: [
          THREE.MathUtils.randFloatSpread(viewport.width * spread), 
          startY - Math.random() * heightRange, 
          THREE.MathUtils.randFloatSpread(15) - 10
        ],
        factor: 0.75 + Math.random() * 2,
        direction: Math.random() < 0.5 ? -1 : 1,
        rotation: [
          Math.sin(Math.random()) * Math.PI, 
          Math.sin(Math.random()) * Math.PI, 
          Math.cos(Math.random()) * Math.PI
        ]
      })),
    [count, viewport.width, spread, heightRange, startY]
  );

  // Animation loop
  useFrame((state, delta) => {
    if (!model.current) return;
    
    diamonds.forEach((data, i) => {
      const t = clock.getElapsedTime();
      
      // Update position (falling motion)
      data.position[1] -= data.factor * fallSpeed * delta * data.direction;
      
      // Reset position when diamond goes off screen
      if (data.direction === 1 ? data.position[1] < -20 : data.position[1] > 50) {
        data.position = [
          viewport.width / 2 - Math.random() * viewport.width, 
          50 * data.direction, 
          data.position[2]
        ];
      }
      
      const { position, rotation, factor } = data;
      
      // Set transform
      dummy.position.set(position[0], position[1], position[2]);
      dummy.rotation.set(
        rotation[0] + (t * factor) / 10, 
        rotation[1] + (t * factor) / 10, 
        rotation[2] + (t * factor) / 10
      );
      dummy.scale.setScalar((1 + factor) * scale);
      dummy.updateMatrix();
      
      // Apply to instance
      model.current.setMatrixAt(i, dummy.matrix);
    });
    
    model.current.instanceMatrix.needsUpdate = true;
  });

  // Get the diamond geometry
  const diamondGeometry = nodes.Diamond_1_0?.geometry || nodes[Object.keys(nodes)[0]]?.geometry;
  
  if (!diamondGeometry) {
    console.warn('Diamond geometry not found in model');
    return null;
  }

  // Render with or without CubeCamera based on prop
  if (useCubeCamera) {
    return (
      <CubeCamera resolution={256} frames={1}>
        {(texture) => (
          <instancedMesh 
            ref={model} 
            args={[diamondGeometry, null, diamonds.length]}
            frustumCulled={false}
          >
            <MeshRefractionMaterial 
              bounces={3} 
              aberrationStrength={0.01} 
              envMap={texture} 
              toneMapped={false} 
            />
          </instancedMesh>
        )}
      </CubeCamera>
    );
  }

  // Simple material version without CubeCamera
  return (
    <instancedMesh 
      ref={model} 
      args={[diamondGeometry, null, diamonds.length]}
      frustumCulled={false}
    >
      <meshPhysicalMaterial
        color="#ffffff"
        metalness={0}
        roughness={0}
        transmission={1}
        thickness={0.5}
        ior={2.4}
        clearcoat={1}
        clearcoatRoughness={0}
        transparent={true}
        opacity={0.9}
      />
    </instancedMesh>
  );
};

// Preload the model
useGLTF.preload('/models/dflat.glb');

export default FallingDiamonds;