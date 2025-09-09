import React, { useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

const TestDevil = () => {
  const gltf = useGLTF('/models/devil_emoji.glb');
  
  useEffect(() => {
    console.log('=== DEVIL MODEL DEBUG ===');
    console.log('Full GLTF object:', gltf);
    console.log('Scene:', gltf.scene);
    console.log('Animations:', gltf.animations);
    
    if (gltf.scene) {
      const meshes = [];
      const bones = [];
      let boundingBox = new THREE.Box3();
      
      gltf.scene.traverse((child) => {
        console.log(`${child.type}: ${child.name}`, child);
        
        if (child.isMesh) {
          meshes.push(child);
          // Calculate bounding box
          child.geometry.computeBoundingBox();
          boundingBox.expandByObject(child);
        }
        
        if (child.isBone) {
          bones.push(child);
        }
      });
      
      const size = new THREE.Vector3();
      boundingBox.getSize(size);
      
      console.log('=== MODEL STATS ===');
      console.log('Total meshes:', meshes.length);
      console.log('Total bones:', bones.length);
      console.log('Model size:', size);
      console.log('Meshes:', meshes);
      
      // Check if model might be tiny
      if (size.x < 0.1 || size.y < 0.1 || size.z < 0.1) {
        console.warn('⚠️ Model is VERY SMALL! Size:', size);
      }
    }
  }, [gltf]);
  
  return (
    <group position={[0, 15, 0]}>
      {/* Try different scales to find the right one */}
      <primitive object={gltf.scene} scale={1} position={[-20, 0, 0]} />
      <primitive object={gltf.scene.clone()} scale={10} position={[-10, 0, 0]} />
      <primitive object={gltf.scene.clone()} scale={50} position={[0, 0, 0]} />
      <primitive object={gltf.scene.clone()} scale={100} position={[10, 0, 0]} />
      <primitive object={gltf.scene.clone()} scale={500} position={[20, 0, 0]} />
      
      {/* Reference cube for scale */}
      <mesh position={[0, -5, 0]}>
        <boxGeometry args={[2, 2, 2]} />
        <meshBasicMaterial color="green" />
      </mesh>
    </group>
  );
};

// Preload the model
useGLTF.preload('/models/devil_emoji.glb');

export default TestDevil;