import React, { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

const SpiralDollarBills = ({ count = 10, radius = 5, height = 20, speed = 0.5, startY = 10, endY = -10 }) => {
  const { scene } = useGLTF('/models/100DollarBill.glb');
  const meshRef = useRef();
  const [billGeometry, setBillGeometry] = useState(null);
  const [frontTexture, setFrontTexture] = useState(null);
  const [backTexture, setBackTexture] = useState(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  const positions = useMemo(() => {
    const pos = [];
    for (let i = 0; i < count; i++) {
      // Distribute bills across multiple spiral layers
      const layer = i % 3; // 3 spiral layers
      const angleOffset = (layer * Math.PI * 2) / 3; // 120 degrees apart
      const angle = (i / count) * Math.PI * 2 + angleOffset;
      
      // Spread bills more evenly across the height with randomization
      const baseY = (i / count) * height;
      const y = startY - baseY + (Math.random() - 0.5) * 5;
      
      // Vary the radius for each layer
      const layerRadius = radius + (layer - 1) * 2;
      
      pos.push({
        angle,
        y,
        radius: layerRadius,
        phase: Math.random() * Math.PI * 2,
        rotationSpeed: 0.5 + Math.random() * 0.5,
        spiralSpeed: 0.3 + Math.random() * 0.3,
        verticalOffset: Math.random() * 0.5,
        // Random initial orientations
        flipX: Math.random() > 0.5 ? Math.PI : 0,
        flipY: Math.random() > 0.5 ? Math.PI : 0,
        baseRotation: Math.random() * Math.PI * 2
      });
    }
    return pos;
  }, [count, height, radius, startY]);
  
  useEffect(() => {
    if (scene) {
      let geometry = null;
      let frontTex = null;
      let backTex = null;
      
      scene.traverse((child) => {
        if (child.isMesh) {
          console.log('Mesh found:', child.name, 'Material:', child.material?.name);
          
          // Get geometry from first mesh and subdivide it
          if (!geometry) {
            // Clone the geometry
            geometry = child.geometry.clone();
            
            // Create a plane geometry with more subdivisions for better deformation
            // Dollar bill proportions (roughly 6.14 × 2.61 inches, aspect ratio ~2.35:1)
            const width = 2.35;  // Relative width
            const height = 1.0;  // Relative height
            const subdivisions = 24; // Good balance of performance and smoothness
            
            const planeGeometry = new THREE.PlaneGeometry(
              width, 
              height, 
              subdivisions, 
              Math.floor(subdivisions / 2.35) // Proportional subdivisions
            );
            
            // Add curve deformation to the geometry
            const positions = planeGeometry.attributes.position;
            const vertex = new THREE.Vector3();
            
            for (let i = 0; i < positions.count; i++) {
              vertex.fromBufferAttribute(positions, i);
              
              // Create a wave/curve effect along the width (x-axis)
              const curveFactor = 0.25; // Adjust this for more/less curve
              const waveX = Math.sin((vertex.x / width + 0.5) * Math.PI) * curveFactor;
              
              // Add slight ripple along height for more realistic paper effect
              const rippleFactor = 0.03;
              const rippleY = Math.sin((vertex.y / height + 0.5) * Math.PI * 2) * rippleFactor;
              
              // Apply the deformation to the z-axis (depth)
              vertex.z = waveX + rippleY;
              
              positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
            }
            
            planeGeometry.computeVertexNormals();
            planeGeometry.attributes.position.needsUpdate = true;
            
            setBillGeometry(planeGeometry);
            console.log('Created curved plane geometry:', width, 'x', height, 'with', subdivisions, 'subdivisions');
          }
          
          // Extract textures based on mesh/material names
          if (child.name === 'Empty_1' && child.material?.name === 'Material.001') {
            // Empty_1 with Material.001 is the front
            if (child.material.map) {
              frontTex = child.material.map;
              console.log('Front texture found from Empty_1:', child.material.map.name || 'unnamed');
            }
          } else if (child.name === 'Empty' && child.material?.name === 'Empty') {
            // Empty with Empty material is the back
            if (child.material.map) {
              backTex = child.material.map;
              console.log('Back texture found from Empty:', child.material.map.name || 'unnamed');
            }
          }
        }
      });
      
      // Set the textures
      if (frontTex && backTex) {
        setFrontTexture(frontTex);
        setBackTexture(backTex);
        console.log('Both front and back textures set successfully!');
      } else if (frontTex) {
        setFrontTexture(frontTex);
        setBackTexture(frontTex);
        console.log('Only front texture found, using for both sides');
      } else if (backTex) {
        setFrontTexture(backTex);
        setBackTexture(backTex);
        console.log('Only back texture found, using for both sides');
      } else {
        console.log('Warning: No textures found in the model');
      }
    }
  }, [scene]);
  
  useFrame((state, delta) => {
    if (!meshRef.current) return;
    
    positions.forEach((pos, i) => {
      // Apply vertical offset for smoother falling
      pos.y -= speed * delta * (1 + pos.verticalOffset * 0.3);
      
      if (pos.y < endY) {
        // Respawn at random height for continuous flow
        pos.y = startY + Math.random() * (height + 10);
        
        // Re-randomize position for straight falling bills
        if (pos.isStraightFalling) {
          const spreadRadius = radius * 1.5;
          pos.straightX = (Math.random() - 0.5) * spreadRadius * 2;
          pos.straightZ = (Math.random() - 0.5) * spreadRadius * 2;
        }
      }
      
      let x, z;
      if (pos.isStraightFalling) {
        // Straight falling bills maintain their X/Z position
        x = pos.straightX;
        z = pos.straightZ;
      } else {
        // Spiraling bills
        const currentAngle = pos.angle + state.clock.elapsedTime * pos.spiralSpeed;
        x = Math.cos(currentAngle) * pos.radius;
        z = Math.sin(currentAngle) * pos.radius;
      }
      
      dummy.position.set(x, pos.y, z);
      dummy.rotation.x = pos.flipX + Math.sin(state.clock.elapsedTime * pos.rotationSpeed + pos.phase) * 0.5;
      dummy.rotation.y = pos.flipY + pos.baseRotation + state.clock.elapsedTime * pos.rotationSpeed;
      dummy.rotation.z = Math.cos(state.clock.elapsedTime * pos.rotationSpeed + pos.phase) * 0.3;
      
      dummy.scale.setScalar(2);
      
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    
    meshRef.current.instanceMatrix.needsUpdate = true;
  });
  
  // Create material for bills
  const billMaterial = useMemo(() => {
    if (!frontTexture || !backTexture) return null;
    return new THREE.MeshStandardMaterial({
      map: frontTexture,
      side: THREE.DoubleSide,
      transparent: true,
      alphaTest: 0.1
    });
  }, [frontTexture, backTexture]);
  
  if (!billGeometry || !billMaterial) return null;
  
  return (
    <instancedMesh ref={meshRef} args={[billGeometry, billMaterial, count]} />
  );
};

useGLTF.preload('/models/100DollarBill.glb');

export default SpiralDollarBills;