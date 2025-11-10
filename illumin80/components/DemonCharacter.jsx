import { useAnimations, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import React, { useEffect, useRef } from "react";
import * as THREE from "three";

export function DemonCharacter({ animation = "idle", ...props }) {
  const group = useRef();
  const { nodes, materials, animations } = useGLTF("/models/underworld3_demon.glb");
  const { actions } = useAnimations(animations, group);

  useEffect(() => {
    if (actions && animation) {
      // Stop all current animations
      Object.values(actions).forEach(action => action.stop());
      
      // Try to play the specific idle animation we see in the logs
      const idleAnimation = "CharacterArmature|CharacterArmature|Idle" || 
                           "CharacterArmature|Idle" ||
                           Object.keys(actions).find(key => 
                             key.toLowerCase().includes('idle')
                           );
      
      console.log('DemonCharacter: Attempting to play animation:', idleAnimation);
      
      if (idleAnimation && actions[idleAnimation]) {
        actions[idleAnimation].reset().fadeIn(0.24).play();
        console.log('DemonCharacter: Successfully started animation:', idleAnimation);
      } else {
        console.log('DemonCharacter: Could not find idle animation, available:', Object.keys(actions));
      }
    }
    
    return () => {
      if (actions && animation && actions[animation]) {
        actions[animation].fadeOut(0.24);
      }
    };
  }, [actions, animation]);

  // Log available animations for debugging
  useEffect(() => {
    console.log('DemonCharacter: Model loaded, nodes:', Object.keys(nodes || {}));
    console.log('DemonCharacter: Materials:', Object.keys(materials || {}));
    if (animations && animations.length > 0) {
      console.log('Available demon animations:', animations.map(anim => anim.name));
      console.log('Available actions:', Object.keys(actions || {}));
    } else {
      console.log('DemonCharacter: No animations found');
    }
  }, [nodes, materials, animations, actions]);

  // Log the primitive object being rendered
  const primitiveObject = nodes.Scene || nodes._rootJoint || nodes.Root || Object.values(nodes)[0];
  console.log('DemonCharacter: Rendering primitive object:', primitiveObject?.name, primitiveObject?.type);
  
  // Debug the model's bounding box
  useEffect(() => {
    if (primitiveObject && group.current) {
      // Force update the bounding box
      group.current.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(group.current);
      console.log('DemonCharacter: Bounding box:', {
        min: box.min,
        max: box.max,
        size: box.getSize(new THREE.Vector3()),
        center: box.getCenter(new THREE.Vector3())
      });
    }
  }, [primitiveObject]);

  return (
    <group ref={group} {...props} dispose={null}>
      <primitive object={primitiveObject} />
      {/* Debug wireframe helper */}
      <mesh position={[0, 1, 0]}>
        <boxGeometry args={[2, 2, 2]} />
        <meshBasicMaterial color="red" wireframe />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.5]} />
        <meshBasicMaterial color="yellow" />
      </mesh>
    </group>
  );
}

useGLTF.preload("/models/underworld3_demon.glb");