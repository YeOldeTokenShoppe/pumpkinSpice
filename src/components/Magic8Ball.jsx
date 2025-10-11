import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, Physics, CuboidCollider } from '@react-three/rapier';
import * as THREE from 'three';

function Magic8BallModel({
  position = [0, 0, 0],
  scale = 1,
  onShake,
  dieRef,
}) {
  const ballGroupRef = useRef(null);
  const [isShaking, setIsShaking] = useState(false);
  const [lastShakeTime, setLastShakeTime] = useState(0);
  
  // Shake animation
  const shake = () => {
    const now = Date.now();
    if (now - lastShakeTime < 2000) return; // Prevent rapid shaking
    
    setLastShakeTime(now);
    setIsShaking(true);
    
    // Apply random impulses to simulate shaking
    if (dieRef.current) {
      const shakeCount = 8;
      for (let i = 0; i < shakeCount; i++) {
        setTimeout(() => {
          if (dieRef.current) {
            // Random but constrained impulses
            const impulse = {
              x: (Math.random() - 0.5) * 0.15,
              y: (Math.random() - 0.5) * 0.15,
              z: (Math.random() - 0.5) * 0.15,
            };
            dieRef.current.applyImpulse(impulse, true);
            
            const torque = {
              x: (Math.random() - 0.5) * 0.08,
              y: (Math.random() - 0.5) * 0.08,
              z: (Math.random() - 0.5) * 0.08,
            };
            dieRef.current.applyTorqueImpulse(torque, true);
          }
        }, i * 100);
      }
      
      setTimeout(() => {
        setIsShaking(false);
      }, shakeCount * 100 + 500);
    }
    
    if (onShake) onShake();
  };
  
  // Gentle floating animation for the ball
  useFrame(({ clock }) => {
    if (ballGroupRef.current) {
      const time = clock.getElapsedTime();
      // Gentle floating animation for the whole ball
      ballGroupRef.current.position.y = position[1] + Math.sin(time * 0.5) * 0.02;
      ballGroupRef.current.rotation.y = time * 0.05;
    }
    
    // Keep die within bounds using corrective forces
    if (dieRef.current && !isShaking) {
      const translation = dieRef.current.translation();
      const distance = Math.sqrt(
        translation.x * translation.x + 
        translation.y * translation.y + 
        translation.z * translation.z
      );
      
      // If die is too far from center, apply strong corrective force
      const maxDistance = 0.35; // Keep well within sphere radius
      if (distance > maxDistance) {
        // Teleport back if way out of bounds
        if (distance > 0.5) {
          dieRef.current.setTranslation({ x: 0, y: 0, z: 0 }, true);
          dieRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
        } else {
          // Apply corrective force
          const force = {
            x: -translation.x * 1.5,
            y: -translation.y * 1.5,
            z: -translation.z * 1.5,
          };
          dieRef.current.applyImpulse(force, true);
        }
      }
      
      // Add subtle floating motion to die when settled
      const floatForce = {
        x: 0,
        y: Math.sin(clock.getElapsedTime() * 2) * 0.001,
        z: 0,
      };
      dieRef.current.applyImpulse(floatForce, true);
    }
  });
  
  return (
    <group ref={ballGroupRef} position={position} scale={scale}>
      {/* Outer ball - semi-transparent glass effect */}
      <mesh 
        onClick={shake} 
        onPointerOver={() => document.body.style.cursor = 'pointer'} 
        onPointerOut={() => document.body.style.cursor = 'auto'}
      >
        <sphereGeometry args={[1, 32, 32]} />
        <meshPhysicalMaterial
          color={0x000000}
          transparent
          opacity={0.85}
          roughness={0.05}
          metalness={0.1}
          clearcoat={1}
          clearcoatRoughness={0.05}
          transmission={0.2}
          thickness={0.5}
          envMapIntensity={1}
        />
      </mesh>
      
      {/* Inner viewing window */}
      <mesh position={[0, 0.1, 0.85]}>
        <circleGeometry args={[0.35, 32]} />
        <meshPhysicalMaterial 
          color={0x001122}
          transparent
          opacity={0.3}
          roughness={0.1}
          metalness={0.2}
        />
      </mesh>
      
      {/* Text on window */}
      <mesh position={[0, -0.6, 0.86]}>
        <planeGeometry args={[0.5, 0.15]} />
        <meshBasicMaterial color={0xffffff} opacity={0.8} transparent />
      </mesh>
      
      {/* Inner liquid effect - slightly smaller than outer sphere */}
      <mesh>
        <sphereGeometry args={[0.95, 32, 32]} />
        <meshPhysicalMaterial
          color={0x000044}
          transparent
          opacity={0.3}
          roughness={1}
          metalness={0}
          side={THREE.BackSide}
        />
      </mesh>
      
      {/* Purple glow effect */}
      <mesh>
        <sphereGeometry args={[1.05, 32, 32]} />
        <meshBasicMaterial
          color={0x8800ff}
          transparent
          opacity={0.15}
          side={THREE.BackSide}
        />
      </mesh>
      
      {/* Point light for glow */}
      <pointLight position={[0, 0, 0]} intensity={0.3} color={0x8800ff} distance={3} />
    </group>
  );
}

export default function Magic8BallWrapper({
  position = [2.5, 1, 0],
  scale = 0.4,
  onShake,
}) {
  const dieRef = useRef(null);
  
  return (
    <group position={position} scale={scale}>
      <Physics gravity={[0, -0.8, 0]}>
        {/* Invisible box colliders to form a sphere-like container */}
        {/* Bottom */}
        <RigidBody type="fixed" colliders={false}>
          <CuboidCollider args={[0.5, 0.05, 0.5]} position={[0, -0.45, 0]} />
        </RigidBody>
        
        {/* Top */}
        <RigidBody type="fixed" colliders={false}>
          <CuboidCollider args={[0.5, 0.05, 0.5]} position={[0, 0.45, 0]} />
        </RigidBody>
        
        {/* Front */}
        <RigidBody type="fixed" colliders={false}>
          <CuboidCollider args={[0.5, 0.5, 0.05]} position={[0, 0, 0.45]} />
        </RigidBody>
        
        {/* Back */}
        <RigidBody type="fixed" colliders={false}>
          <CuboidCollider args={[0.5, 0.5, 0.05]} position={[0, 0, -0.45]} />
        </RigidBody>
        
        {/* Left */}
        <RigidBody type="fixed" colliders={false}>
          <CuboidCollider args={[0.05, 0.5, 0.5]} position={[-0.45, 0, 0]} />
        </RigidBody>
        
        {/* Right */}
        <RigidBody type="fixed" colliders={false}>
          <CuboidCollider args={[0.05, 0.5, 0.5]} position={[0.45, 0, 0]} />
        </RigidBody>
        
        {/* The die - starts at center */}
        <RigidBody
          ref={dieRef}
          colliders="hull"
          mass={0.02}
          linearDamping={4}
          angularDamping={3}
          position={[0, 0, 0]}
          restitution={0.2}
          friction={0.5}
        >
          <mesh>
            <icosahedronGeometry args={[0.18, 0]} />
            <meshPhysicalMaterial 
              color={0x000033}
              emissive={0x000099}
              emissiveIntensity={0.3}
              roughness={0.3}
              metalness={0.7}
              clearcoat={0.5}
              clearcoatRoughness={0.2}
            />
          </mesh>
          
          {/* Sample text on one face - you can add more */}
          <mesh position={[0, 0, 0.19]} rotation={[0, 0, 0]}>
            <planeGeometry args={[0.08, 0.08]} />
            <meshBasicMaterial 
              color={0xffffff} 
              opacity={0.9} 
              transparent 
              side={THREE.DoubleSide}
            />
          </mesh>
        </RigidBody>
      </Physics>
      
      {/* The visual ball - rendered after physics */}
      <Magic8BallModel 
        position={[0, 0, 0]}
        scale={1}
        onShake={onShake}
        dieRef={dieRef}
      />
    </group>
  );
}