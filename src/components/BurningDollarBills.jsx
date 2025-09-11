import React, { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';

const BurningDollarBills = ({ 
  count = 40, 
  radius = 30, 
  height = 170, 
  speed = 3,
  startY = 120,
  endY = -50 
}) => {
  const { scene } = useGLTF('/models/100DollarBill.glb');
  const billsRef = useRef([]);
  const fireParticlesRef = useRef([]);
  const billStatesRef = useRef([]);
  const particleStatesRef = useRef([]);
  const [billGeometry, setBillGeometry] = useState(null);
  const [billTexture, setBillTexture] = useState(null);
  
  // Extract geometry and texture from the model
  useEffect(() => {
    if (scene) {
      let geometry = null;
      let texture = null;
      
      scene.traverse((child) => {
        if (child.isMesh) {
          // Get geometry from first mesh
          if (!geometry) {
            // Create curved dollar bill geometry like in SpiralDollarBills
            const width = 2.35;
            const height = 1.0;
            const subdivisions = 16; // Slightly less subdivisions for performance with more bills
            
            const planeGeometry = new THREE.PlaneGeometry(
              width, 
              height, 
              subdivisions, 
              Math.floor(subdivisions / 2.35)
            );
            
            // Add curve deformation
            const positions = planeGeometry.attributes.position;
            const vertex = new THREE.Vector3();
            
            for (let i = 0; i < positions.count; i++) {
              vertex.fromBufferAttribute(positions, i);
              
              const curveFactor = 0.2; // Slightly less curve for burning bills
              const waveX = Math.sin((vertex.x / width + 0.5) * Math.PI) * curveFactor;
              const rippleFactor = 0.02;
              const rippleY = Math.sin((vertex.y / height + 0.5) * Math.PI * 2) * rippleFactor;
              
              vertex.z = waveX + rippleY;
              positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
            }
            
            planeGeometry.computeVertexNormals();
            planeGeometry.attributes.position.needsUpdate = true;
            setBillGeometry(planeGeometry);
          }
          
          // Get texture from material
          if (child.material && child.material.map && !texture) {
            texture = child.material.map;
            setBillTexture(texture);
          }
        }
      });
    }
  }, [scene]);
  
  // Initialize bills with random properties - include count in dependencies
  const bills = useMemo(() => {
    const billsArray = [];
    const statesArray = [];
    for (let i = 0; i < count; i++) {
      // More random distribution - mix of spiraling and straight falling bills
      const isSpiralBill = Math.random() > 0.4; // 60% spiral, 40% straight fall
      
      // Distribute bills across multiple layers for more randomness
      const layer = i % 4; // 4 different layers
      const angleOffset = (layer * Math.PI * 2) / 4 + Math.random() * Math.PI * 0.5; // Random offset
      const angle = Math.random() * Math.PI * 2 + angleOffset;
      
      // Randomize initial Y position across the full height range
      const baseY = Math.random() * (startY - endY);
      const y = startY - baseY + (Math.random() - 0.5) * 20; // More variation
      
      // Vary the radius significantly for each bill
      const layerRadius = radius + (Math.random() - 0.5) * radius * 1.5; // Much more radius variation
      
      // For straight falling bills, random X/Z position
      const straightX = isSpiralBill ? 0 : (Math.random() - 0.5) * radius * 2;
      const straightZ = isSpiralBill ? 0 : (Math.random() - 0.5) * radius * 2;
      
      billsArray.push({
        position: new THREE.Vector3(
          isSpiralBill ? Math.cos(angle) * layerRadius : straightX,
          y,
          isSpiralBill ? Math.sin(angle) * layerRadius : straightZ
        ),
        rotation: new THREE.Euler(
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2
        ),
        scale: 0.8 + Math.random() * 0.6, // More size variation
        speed: speed + Math.random() * 3, // More speed variation
        fireIntensity: 0.3 + Math.random() * 0.7,
        radiusOffset: layerRadius,
        isSpiralBill: isSpiralBill,
        straightX: straightX,
        straightZ: straightZ,
        spiralSpeed: 0.2 + Math.random() * 0.4, // Random spiral speed
        verticalOffset: Math.random() * 0.2, // Random vertical speed offset
        phase: Math.random() * Math.PI * 2, // Random phase for wobble
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
      const particleCount = 30; // Fire particles per bill - increased density
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          billIndex,
          speed: 0.5 + Math.random() * 0.5,
          size: 0.6 + Math.random() * 0.8 // Much larger particles
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
        
        // Apply vertical offset for more natural falling speed variation
        billState.y -= delta * bill.speed * 5 * (1 + bill.verticalOffset * 0.5);
        
        // Reset to top when reaching bottom with new random position
        if (billState.y < endY) {
          // Respawn at random height for continuous flow
          billState.y = startY + Math.random() * 20;
          
          // Re-randomize angle for spiral bills
          if (bill.isSpiralBill) {
            billState.originalAngle = Math.random() * Math.PI * 2;
          } else {
            // Re-randomize position for straight falling bills
            bill.straightX = (Math.random() - 0.5) * radius * 2;
            bill.straightZ = (Math.random() - 0.5) * radius * 2;
          }
          
          billState.burnProgress = Math.random() * 0.2; // Reset with some initial burn
        }
        
        let x, z;
        if (bill.isSpiralBill) {
          // Spiraling bills with varying speeds
          billState.originalAngle += delta * bill.spiralSpeed;
          x = Math.cos(billState.originalAngle) * bill.radiusOffset;
          z = Math.sin(billState.originalAngle) * bill.radiusOffset;
          
          // Add wobble based on phase
          const wobbleX = Math.sin(time * 1.5 + bill.phase) * 0.8;
          const wobbleZ = Math.cos(time * 1.5 + bill.phase) * 0.8;
          x += wobbleX;
          z += wobbleZ;
        } else {
          // Straight falling bills with gentle drift
          x = bill.straightX + Math.sin(time * 0.5 + bill.phase) * 1.5;
          z = bill.straightZ + Math.cos(time * 0.5 + bill.phase) * 1.5;
        }
        
        mesh.position.x = x;
        mesh.position.y = billState.y;
        mesh.position.z = z;
        
        // More varied tumbling rotation
        mesh.rotation.x += delta * (0.3 + Math.sin(time + i) * 0.3);
        mesh.rotation.y += delta * (0.2 + Math.cos(time + i) * 0.2);
        mesh.rotation.z += delta * (0.1 + Math.sin(time * 0.5 + i) * 0.2);
        
        // Update burn progress
        billState.burnProgress = Math.min(1, billState.burnProgress + delta * 0.1);
        
        // Update material to show burning effect
        if (mesh.material) {
          // Add fire glow to the textured bill
          mesh.material.emissive = new THREE.Color(0xff4400);
          mesh.material.emissiveIntensity = billState.burnProgress * bill.fireIntensity * 0.5;
          
          // Optionally darken the bill as it burns
          const burnDarkness = 1 - (billState.burnProgress * 0.3);
          if (mesh.material.color) {
            mesh.material.color.setRGB(burnDarkness, burnDarkness, burnDarkness);
          }
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
  
  // Don't render until geometry and texture are loaded
  if (!billGeometry || !billTexture) {
    return null;
  }
  
  return (
    <group>
      {/* Dollar Bills */}
      {bills.map((bill, i) => (
        <mesh
          key={`bill-${i}`}
          ref={el => billsRef.current[i] = el}
          position={bill.position}
          rotation={bill.rotation}
          scale={[bill.scale * 1.5, bill.scale * 1.5, bill.scale]}
          geometry={billGeometry}
        >
          <meshStandardMaterial
            map={billTexture}
            side={THREE.DoubleSide}
            transparent
            opacity={0.9}
            emissive={new THREE.Color(0xff4400)}
            emissiveIntensity={0}
            roughness={0.4}
            metalness={0.1}
            alphaTest={0.1}
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

useGLTF.preload('/models/100DollarBill.glb');

export default BurningDollarBills;