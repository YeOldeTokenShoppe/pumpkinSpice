import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Text } from '@react-three/drei';
import * as THREE from 'three';

function FloatingPyramid() {
  const meshRef = useRef();
  const [hovered, setHovered] = React.useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.005;
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });

  return (
    <Float
      speed={2}
      rotationIntensity={0.5}
      floatIntensity={1}
      floatingRange={[-0.1, 0.1]}
    >
      <mesh
        ref={meshRef}
        scale={hovered ? 1.2 : 1}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <coneGeometry args={[1, 2, 4]} />
        <MeshDistortMaterial
          color="#00ff9d"
          emissive="#00ff9d"
          emissiveIntensity={0.5}
          roughness={0.1}
          metalness={0.8}
          distort={0.3}
          speed={5}
        />
      </mesh>
      
      {/* Wireframe overlay */}
      <mesh
        scale={hovered ? 1.25 : 1.05}
        rotation={[0, Math.PI / 4, 0]}
      >
        <coneGeometry args={[1.1, 2.1, 4]} />
        <meshBasicMaterial
          color="#00ff9d"
          wireframe
          transparent
          opacity={0.3}
        />
      </mesh>
    </Float>
  );
}

function FloatingEye() {
  const groupRef = useRef();
  const eyeRef = useRef();

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.3;
    }
    if (eyeRef.current) {
      // Make the pupil follow a figure-8 pattern
      const t = state.clock.elapsedTime;
      eyeRef.current.position.x = Math.sin(t) * 0.1;
      eyeRef.current.position.z = Math.sin(t * 2) * 0.05 + 0.4;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0.5, 0]}>
      <Float speed={3} floatIntensity={0.5}>
        {/* Eye white */}
        <mesh>
          <sphereGeometry args={[0.6, 32, 16]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive="#00ff9d"
            emissiveIntensity={0.1}
            roughness={0.3}
            metalness={0.5}
          />
        </mesh>
        
        {/* Iris */}
        <mesh position={[0, 0, 0.3]}>
          <sphereGeometry args={[0.35, 32, 16]} />
          <meshStandardMaterial
            color="#00ff9d"
            emissive="#00ff9d"
            emissiveIntensity={0.3}
            roughness={0.2}
            metalness={0.7}
          />
        </mesh>
        
        {/* Pupil */}
        <mesh ref={eyeRef} position={[0, 0, 0.45]}>
          <sphereGeometry args={[0.15, 32, 16]} />
          <meshStandardMaterial
            color="#000000"
            roughness={0.8}
            metalness={0.2}
          />
        </mesh>
        
        {/* Glow rings */}
        {[1, 1.5, 2].map((scale, i) => (
          <mesh key={i} scale={[scale, scale, 0.1]}>
            <torusGeometry args={[0.6, 0.02, 8, 32]} />
            <meshBasicMaterial
              color="#00ff9d"
              transparent
              opacity={0.3 - i * 0.1}
            />
          </mesh>
        ))}
      </Float>
    </group>
  );
}

function MysteryText() {
  const textRef = useRef();
  
  useFrame((state) => {
    if (textRef.current) {
      textRef.current.material.opacity = 0.5 + Math.sin(state.clock.elapsedTime * 2) * 0.3;
    }
  });

  return (
    <Text
      ref={textRef}
      position={[0, -1.5, 0]}
      fontSize={0.3}
      color="#00ff9d"
      anchorX="center"
      anchorY="middle"
      material-transparent
    >
      ▲ ILLUMIN80 ▲
    </Text>
  );
}

function ParticleField() {
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < 100; i++) {
      const x = (Math.random() - 0.5) * 10;
      const y = (Math.random() - 0.5) * 10;
      const z = (Math.random() - 0.5) * 10;
      temp.push([x, y, z]);
    }
    return temp;
  }, []);

  const particlesRef = useRef();

  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y += 0.001;
      particlesRef.current.rotation.x += 0.0005;
    }
  });

  return (
    <group ref={particlesRef}>
      {particles.map((position, i) => (
        <mesh key={i} position={position}>
          <sphereGeometry args={[0.02, 8, 8]} />
          <meshBasicMaterial
            color="#00ff9d"
            transparent
            opacity={0.6}
          />
        </mesh>
      ))}
    </group>
  );
}

export default function Illumin80Scene({ showPyramid = true }) {
  return (
    <div style={{
      width: '100%',
      height: '100%',
      minHeight: '400px',
      position: 'relative',
    }}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={0.5} color="#00ff9d" />
        <pointLight position={[-10, -10, -10]} intensity={0.3} color="#ffffff" />
        
        <ParticleField />
        
        {showPyramid ? (
          <>
            <FloatingPyramid />
            <MysteryText />
          </>
        ) : (
          <FloatingEye />
        )}
        
        {/* Fog for atmosphere */}
        <fog attach="fog" args={['#000000', 5, 15]} />
      </Canvas>
    </div>
  );
}