import React, { useRef, useMemo } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { useTexture } from '@react-three/drei';

const BurningDollarBills = ({ 
  count = 40, 
  radius = 30, 
  height = 170, 
  speed = 3,
  startY = 120,
  endY = -50 
}) => {
  const billsRef = useRef([]);
  const fireParticlesRef = useRef([]);
  const billStatesRef = useRef([]);
  const particleStatesRef = useRef([]);
  
  // Create fire texture gradient only once
  const fireColors = useMemo(() => {
    // Use a simple color instead of canvas texture to avoid potential issues
    return null; // We'll use color directly in the material
  }, []);
  
  // Initialize bills with random properties - include count in dependencies
  const bills = useMemo(() => {
    const billsArray = [];
    const statesArray = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 * 4; // Spiral
      const y = startY - (i / count) * (startY - endY);
      const radiusOffset = radius + Math.sin(i * 0.5) * 10;
      
      billsArray.push({
        position: new THREE.Vector3(
          Math.cos(angle) * radiusOffset,
          y,
          Math.sin(angle) * radiusOffset
        ),
        rotation: new THREE.Euler(
          Math.random() * Math.PI,
          Math.random() * Math.PI,
          Math.random() * Math.PI
        ),
        scale: 1 + Math.random() * 0.3,
        speed: speed + Math.random() * 2,
        fireIntensity: 0.5 + Math.random() * 0.5,
        radiusOffset: radiusOffset,
        index: i
      });
      
      // Store mutable state separately
      statesArray.push({
        y: y,
        originalAngle: angle,
        burnProgress: Math.random() * 0.3
      });
    }
    billStatesRef.current = statesArray;
    return billsArray;
  }, [count, radius, height, speed, startY, endY]);
  
  // Create fire particles for each bill
  const fireParticles = useMemo(() => {
    const particles = [];
    const statesArray = [];
    bills.forEach((bill, billIndex) => {
      const particleCount = 20; // Fire particles per bill - increased density
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          billIndex,
          speed: 0.5 + Math.random() * 0.5,
          size: 1.2 + Math.random() * 1.5 // Much larger particles
        });
        
        // Store mutable state separately
        statesArray.push({
          offset: new THREE.Vector3(
            (Math.random() - 0.5) * 4,
            Math.random() * 3,
            (Math.random() - 0.5) * 4
          ),
          life: Math.random()
        });
      }
    });
    particleStatesRef.current = statesArray;
    return particles;
  }, [bills]);
  
  useFrame((state, delta) => {
    const time = state.clock.elapsedTime;
    
    // Update bills
    bills.forEach((bill, i) => {
      if (billsRef.current[i] && billStatesRef.current[i]) {
        const mesh = billsRef.current[i];
        const billState = billStatesRef.current[i];
        
        // Spiral motion
        billState.originalAngle += delta * bill.speed * 0.3;
        const spiralY = billState.y - delta * bill.speed * 5;
        
        // Reset to top when reaching bottom
        if (spiralY < endY) {
          billState.y = startY;
          billState.originalAngle = (i / count) * Math.PI * 2 * 4;
          billState.burnProgress = 0;
        } else {
          billState.y = spiralY;
        }
        
        // Update position with wobble
        const wobbleX = Math.sin(time * 2 + i) * 0.5;
        const wobbleZ = Math.cos(time * 2 + i) * 0.5;
        
        mesh.position.x = Math.cos(billState.originalAngle) * bill.radiusOffset + wobbleX;
        mesh.position.y = billState.y;
        mesh.position.z = Math.sin(billState.originalAngle) * bill.radiusOffset + wobbleZ;
        
        // Tumbling rotation
        mesh.rotation.x += delta * 0.5;
        mesh.rotation.y += delta * 0.3;
        mesh.rotation.z += delta * 0.2;
        
        // Update burn progress
        billState.burnProgress = Math.min(1, billState.burnProgress + delta * 0.1);
        
        // Update material to show burning effect
        if (mesh.material) {
          // Keep bills green but add fire glow
          mesh.material.color.setHex(0x85bb65); // Keep green color
          
          mesh.material.emissive = new THREE.Color(0xff4400);
          mesh.material.emissiveIntensity = billState.burnProgress * bill.fireIntensity * 0.5;
        }
      }
    });
    
    // Update fire particles
    fireParticles.forEach((particle, i) => {
      if (fireParticlesRef.current[i] && particleStatesRef.current[i]) {
        const particleMesh = fireParticlesRef.current[i];
        const particleState = particleStatesRef.current[i];
        const billState = billStatesRef.current[particle.billIndex];
        
        if (billsRef.current[particle.billIndex]) {
          const billMesh = billsRef.current[particle.billIndex];
          
          // Position fire particles around the bill
          particleState.life += delta * particle.speed;
          if (particleState.life > 1) {
            particleState.life = 0;
            particleState.offset.set(
              (Math.random() - 0.5) * 4,
              Math.random() * 3,
              (Math.random() - 0.5) * 4
            );
          }
          
          particleMesh.position.copy(billMesh.position);
          particleMesh.position.add(particleState.offset);
          particleMesh.position.y += particleState.life * 4; // Rise faster
          
          // Scale and fade based on life
          const scale = particle.size * (1 - particleState.life * 0.5); // Less shrinking
          particleMesh.scale.setScalar(scale);
          
          if (particleMesh.material && billState) {
            particleMesh.material.opacity = (1 - particleState.life) * billState.burnProgress * 0.9; // More visible
          }
        }
      }
    });
  });
  
  return (
    <group>
      {/* Dollar Bills */}
      {bills.map((bill, i) => (
        <mesh
          key={`bill-${i}`}
          ref={el => billsRef.current[i] = el}
          position={bill.position}
          rotation={bill.rotation}
          scale={[bill.scale * 3, bill.scale * 1.3, 0.01]}
        >
          <planeGeometry args={[1, 1, 8, 8]} />
          <meshStandardMaterial
            color="#85bb65"
            side={THREE.DoubleSide}
            transparent
            opacity={0.9}
            emissive={new THREE.Color(0xff4400)}
            emissiveIntensity={0}
            roughness={0.8}
            metalness={0.1}
          />
        </mesh>
      ))}
      
      {/* Fire Particles */}
      {fireParticles.map((particle, i) => (
        <mesh
          key={`fire-${i}`}
          ref={el => fireParticlesRef.current[i] = el}
        >
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial
            color="#ff6600"
            transparent
            opacity={0.6}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
      
      {/* Additional glow light for fire effect */}
      <pointLight
        position={[0, 0, 0]}
        color="#ff6600"
        intensity={0.5}
        distance={50}
        decay={2}
      />
    </group>
  );
};

export default BurningDollarBills;