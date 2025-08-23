import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const CoinStream = ({ 
  startPosition = [0, 0, 0], 
  endPosition = [0, -10, 5],
  coinCount = 30,
  coinSize = 0.3,
  streamWidth = 2,
  speed = 1,
  coinMesh = null,
  gravity = -9.8,
  initialVelocity = [3, 2, 2]
}) => {
  const meshRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  // Create coin data with random offsets and phases
  const coins = useMemo(() => {
    return Array.from({ length: coinCount }, (_, i) => ({
      phase: (i / coinCount) * Math.PI * 2,
      offset: {
        x: (Math.random() - 0.5) * streamWidth,
        y: (Math.random() - 0.5) * 0.5,
        z: (Math.random() - 0.5) * streamWidth
      },
      rotationSpeed: {
        x: Math.random() * 2 + 1,
        y: Math.random() * 2 + 1,
        z: Math.random() * 2 + 1
      },
      velocity: {
        x: initialVelocity[0] + (Math.random() - 0.5) * 1,
        y: initialVelocity[1] + (Math.random() - 0.5) * 1,
        z: initialVelocity[2] + (Math.random() - 0.5) * 1
      }
    }));
  }, [coinCount, streamWidth, initialVelocity]);

  useFrame((state) => {
    if (!meshRef.current) return;
    
    const time = state.clock.elapsedTime * speed;
    
    coins.forEach((coin, i) => {
      // Calculate time offset for this coin in the stream
      const coinTime = (time + coin.phase) % 4; // 4 second loop
      
      // Parabolic arc physics
      const t = coinTime;
      const x = startPosition[0] + coin.velocity.x * t + coin.offset.x;
      const y = startPosition[1] + coin.velocity.y * t + 0.5 * gravity * t * t + coin.offset.y;
      const z = startPosition[2] + coin.velocity.z * t + coin.offset.z;
      
      // Fade out coins as they fall
      const opacity = Math.max(0, 1 - (coinTime / 4));
      
      // Only show coins that haven't fallen too far
      if (y > endPosition[1] && opacity > 0.1) {
        dummy.position.set(x, y, z);
        
        // Spinning rotation
        dummy.rotation.x = time * coin.rotationSpeed.x;
        dummy.rotation.y = time * coin.rotationSpeed.y;
        dummy.rotation.z = time * coin.rotationSpeed.z;
        
        dummy.scale.setScalar(coinSize * opacity);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
      } else {
        // Hide coins that have fallen too far
        dummy.position.set(0, -1000, 0);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
      }
    });
    
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  // Create a simple coin geometry if no mesh provided
  const geometry = useMemo(() => {
    if (coinMesh?.geometry) {
      return coinMesh.geometry;
    }
    // Fallback to a simple cylinder for coin shape
    return new THREE.CylinderGeometry(0.5, 0.5, 0.1, 16);
  }, [coinMesh]);

  const material = useMemo(() => {
    if (coinMesh?.material) {
      return coinMesh.material;
    }
    // Fallback gold material
    return new THREE.MeshStandardMaterial({
      color: '#FFD700',
      metalness: 0.8,
      roughness: 0.2,
      emissive: '#FFD700',
      emissiveIntensity: 0.1
    });
  }, [coinMesh]);

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, coinCount]}
      frustumCulled={false}
    />
  );
};

export default CoinStream;