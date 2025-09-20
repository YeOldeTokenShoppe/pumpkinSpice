"use client";

import React, { useRef, Suspense, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, Cloud } from '@react-three/drei';
import * as THREE from 'three';
import WebGPURenderer from 'three/addons/renderers/webgpu/WebGPURenderer.js';
import SkySphere from '@/components/SkySphere';
import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';
import EnhancedVolumetricLight from '@/components/EnhancedVolumetricLight';
import DarkClouds from '@/components/Clouds';
import { Experience } from '@/components/Experience';

const GradientSkyMaterial = shaderMaterial(
  {
    topColor: new THREE.Color(0x1a0033), // Dark violet
    middleColor: new THREE.Color(0x87CEEB), // Light blue
    bottomColor: new THREE.Color(0x0a001a), // Dark blue/almost black
  },
  // Vertex shader
  `
    varying vec3 vWorldPosition;
    void main() {
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPosition.xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment shader
  `
    uniform vec3 topColor;
    uniform vec3 middleColor;
    uniform vec3 bottomColor;
    varying vec3 vWorldPosition;
    
    void main() {
      float h = normalize(vWorldPosition).y;
      vec3 color;
      
      if (h > 0.0) {
        // Upper hemisphere: blend from middle to top
        color = mix(middleColor, topColor, h);
      } else {
        // Lower hemisphere: blend from middle to bottom
        color = mix(middleColor, bottomColor, -h);
      }
      
      gl_FragColor = vec4(color, 1.0);
    }
  `
);

extend({ GradientSkyMaterial });

function GradientSkySphere() {
  return (
    <mesh scale={[500, 500, 500]}>
      <sphereGeometry args={[1, 32, 32]} />
      <gradientSkyMaterial 
        side={THREE.BackSide}
        topColor={new THREE.Color(0x1a0033)} // Dark violet
        middleColor={new THREE.Color(0x87CEEB)} // Light blue
        bottomColor={new THREE.Color(0x0a001a)} // Dark blue/almost black
      />
    </mesh>
  );
}

function OurLadyRiderModel() {
  const { scene } = useGLTF('/models/ourlady_rider2.glb');
  const modelRef = useRef();

  React.useEffect(() => {
    if (scene) {
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
    }
  }, [scene]);

  return (
    <primitive 
      ref={modelRef}
      object={scene} 
      scale={[1, 1, 1]}
      position={[0, 0, 0]}
      rotation={[0, 0, 0]}
    />
  );
}

export default function Home2WebGPU() {
  const [webGPUSupported, setWebGPUSupported] = useState(false);
  const [webGPURenderer, setWebGPURenderer] = useState(null);

  useEffect(() => {
    // Check WebGPU support
    if ('gpu' in navigator) {
      navigator.gpu.requestAdapter().then((adapter) => {
        if (adapter) {
          setWebGPUSupported(true);
          // Create WebGPU renderer
          const renderer = new WebGPURenderer({ antialias: true });
          renderer.init().then(() => {
            setWebGPURenderer(renderer);
          });
        }
      }).catch(() => {
        console.error('WebGPU not supported');
      });
    }
  }, []);

  if (!webGPUSupported) {
    return (
      <div style={{ width: '100vw', height: '100vh', background: '#000', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
        <h2>WebGPU Not Supported</h2>
        <p>This demo requires WebGPU support. Please use Chrome 113+ or Edge 113+</p>
        <p>Make sure WebGPU is enabled in your browser flags.</p>
      </div>
    );
  }

  if (!webGPURenderer) {
    return (
      <div style={{ width: '100vw', height: '100vh', background: '#000', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Initializing WebGPU...</p>
      </div>
    );
  }

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000' }}>
      <Canvas
        shadows
        camera={{ position: [0, 2, 5], fov: 50 }}
        style={{ width: '100%', height: '100%' }}
        gl={(canvas) => {
          webGPURenderer.setSize(canvas.width, canvas.height);
          webGPURenderer.domElement = canvas;
          return webGPURenderer;
        }}
      >
        <GradientSkySphere />
        
        <Suspense fallback={null}>
          <DarkClouds />
          {/* <OurLadyRiderModel /> */}
          <Experience />
          <Cloud
            position={[0, -0.5, 0]}
            speed={0.4}
            width={3}
            depth={1.5}
            segments={20}
            opacity={0.6}
            color="#ffc0cb"
          />
        </Suspense>
        
        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
        />
        
        <gridHelper args={[10, 10]} />
      </Canvas>
    </div>
  );
}

useGLTF.preload('/models/ourlady_rider2.glb');