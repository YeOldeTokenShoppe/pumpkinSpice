import React, { useRef, useEffect } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';

export default function Fountain({ scale = 1, position = [0, 0, 0], ...props }) {
  const group = useRef();
  
  // Load the GLTF model
  const gltf = useGLTF('/models/fountain.glb');
  const { actions, names } = useAnimations(gltf.animations || [], group);
  
  // Log for debugging
  useEffect(() => {
    console.log('Fountain GLTF loaded:', {
      hasScene: !!gltf.scene,
      animations: gltf.animations?.length || 0,
      animationNames: names
    });
  }, [gltf, names]);

  // Apply shadows and materials
  useEffect(() => {
    if (gltf.scene) {
      gltf.scene.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          
          // Make sure materials are visible
          if (child.material) {
            // Ensure the material is set up properly
            child.material.side = THREE.FrontSide;
            child.material.transparent = false;
            child.material.opacity = 1;
            child.material.depthWrite = true;
            child.material.depthTest = true;
            child.material.needsUpdate = true;
          }
        }
      });
    }
  }, [gltf.scene]);

  // Play animations if available
  useEffect(() => {
    if (names.length > 0) {
      console.log('Playing fountain animations:', names);
      names.forEach(name => {
        if (actions[name]) {
          actions[name].reset().fadeIn(0.5).play();
          actions[name].loop = THREE.LoopRepeat;
        }
      });
    }

    return () => {
      // Cleanup animations on unmount
      if (actions) {
        Object.values(actions).forEach(action => {
          if (action && action.stop) {
            action.stop();
          }
        });
      }
    };
  }, [actions, names]);

  // Always render the primitive, even if loading
  return (
    <group ref={group} dispose={null} position={position} scale={scale} {...props}>
      <primitive object={gltf.scene} />
    </group>
  );
}

// Preload the model
useGLTF.preload('/models/fountain.glb');