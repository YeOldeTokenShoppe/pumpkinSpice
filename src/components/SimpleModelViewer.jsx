import React, { Suspense, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment, useAnimations } from '@react-three/drei';
import * as THREE from 'three';

function Model({ modelPath }) {
  const group = useRef();
  const gltf = useGLTF(modelPath);
  const { actions, names } = useAnimations(gltf.animations, group);
  
  useEffect(() => {
    // Log available animations
    console.log('Available animations:', names);
    
    // Play the specific animation
    const animationName = 'Piggly43_AngelDevilFrozen';
    if (actions[animationName]) {
      actions[animationName].reset().fadeIn(0.5).play();
      actions[animationName].loop = THREE.LoopRepeat;
      console.log(`Playing animation: ${animationName}`);
    } else {
      console.log(`Animation ${animationName} not found. Available:`, names);
      // Play first available animation as fallback
      if (names.length > 0 && actions[names[0]]) {
        actions[names[0]].reset().fadeIn(0.5).play();
        actions[names[0]].loop = THREE.LoopRepeat;
        console.log(`Playing fallback animation: ${names[0]}`);
      }
    }
    
    return () => {
      // Cleanup animations
      if (actions) {
        Object.values(actions).forEach(action => {
          if (action && action.stop) {
            action.stop();
          }
        });
      }
    };
  }, [actions, names]);
  
  return <primitive ref={group} object={gltf.scene} scale={2} />;
}

export default function SimpleModelViewer({ modelPath = '/models/diamond.glb' }) {
  return (
    <div style={{ width: '100%', height: '100vh', background: '#1a1a1a' }}>
      <Canvas
        camera={{ position: [5, 15, 5], fov: 50 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <Suspense fallback={null}>
          <Model modelPath={modelPath} />
          <Environment preset="sunset" />
        </Suspense>
        <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
      </Canvas>
    </div>
  );
}