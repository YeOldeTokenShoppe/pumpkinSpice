import React, { Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment } from '@react-three/drei';
import InteractiveMagic8Ball from './InteractiveMagic8Ball';
import * as THREE from 'three';

function TestModel({ showInteractive }) {
  const { scene } = useGLTF('/models/magic8ball.glb');
  
  // Log what we find in the model
  useEffect(() => {
    if (scene) {
      console.log('Scene loaded:', scene);
      const ball = scene.getObjectByName('ball');
      console.log('Ball object found:', ball);
      
      if (ball) {
        console.log('Ball position:', ball.position);
        console.log('Ball scale:', ball.scale);
        
        // Log all children
        ball.traverse((child) => {
          if (child.name) {
            console.log('Ball child:', child.name, child.type, 'visible:', child.visible);
          }
        });
      }
      
      // List all named objects in the scene
      console.log('All named objects in scene:');
      scene.traverse((child) => {
        if (child.name) {
          console.log(' -', child.name, child.type);
        }
      });
    }
  }, [scene]);
  
  // Handle clicks on the model
  const handleClick = (event) => {
    if (!showInteractive) return;
    
    console.log('Click detected on:', event.object?.name);
    
    // Check if we clicked on the magic 8-ball
    let clickedBall = false;
    let current = event.object;
    while (current) {
      if (current.userData?.isMagic8Ball || current.name === 'ball') {
        clickedBall = true;
        break;
      }
      current = current.parent;
    }
    
    if (clickedBall && window.handleMagic8BallClick) {
      console.log('Magic 8-ball clicked!');
      window.handleMagic8BallClick(event);
    }
  };
  
  return (
    <>
      <primitive 
        object={scene} 
        scale={2} 
        position={[0, -2, 0]}
        onClick={handleClick}
      />
      {showInteractive && <InteractiveMagic8Ball scene={scene} />}
    </>
  );
}

export default function Magic8BallTestContent({ showInteractive }) {
  return (
    <Canvas
      camera={{ position: [-7, 1, 7], fov: 40 }}
      onCreated={({ gl }) => {
        gl.shadowMap.enabled = true;
        gl.shadowMap.type = THREE.PCFSoftShadowMap;
      }}
      style={{ width: '100%', height: '100%' }}
    >
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={0.8} castShadow />
      <directionalLight position={[-10, 10, 5]} intensity={0.8} castShadow />
      {/* Additional light to illuminate the die inside */}
      <pointLight position={[0, 0, 5]} intensity={1.0} color="#ffffff" />
      <pointLight position={[0, 0, -5]} intensity={1.0} color="#ffffff" />
      
      <Suspense fallback={null}>
        <TestModel showInteractive={showInteractive} />
      </Suspense>
      
      <Environment preset="apartment" />
      <OrbitControls 
        enablePan={true} 
        enableZoom={true} 
        enableRotate={true}
        minDistance={3}
        maxDistance={20}
        zoomToCursor={true}
      />
      
      {/* Grid for reference */}
      <gridHelper args={[20, 20]} position={[0, -2, 0]} />
      
      {/* Axes helper for orientation */}
      <axesHelper args={[5]} />
    </Canvas>
  );
}