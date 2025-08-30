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
  const shaderMaterialRef = useRef();
  
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
            
            setBillGeometry(planeGeometry);
            console.log('Created subdivided plane geometry:', width, 'x', height, 'with', subdivisions, 'subdivisions');
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
    
    // Update shader time uniform
    if (shaderMaterialRef.current) {
      shaderMaterialRef.current.uniforms.time.value = state.clock.elapsedTime;
    }
    
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
  
  // Create shader material with bending effect
  const shaderMaterial = useMemo(() => {
    if (!frontTexture || !backTexture) return null;
    return new THREE.ShaderMaterial({
      uniforms: {
        frontMap: { value: frontTexture },
        backMap: { value: backTexture },
        time: { value: 0 },
        bendAmount: { value: 0.4 }
      },
      vertexShader: `
        varying vec2 vUv;
        uniform float time;
        uniform float bendAmount;
        
        void main() {
          vUv = uv;
          vec3 pos = position;
          
          // Gentle U-shaped bend along the width
          float mainBend = sin(uv.x * 3.14159) * bendAmount;
          
          // Subtle wave along the length
          float lengthWave = sin(uv.y * 3.14159) * 0.05;
          
          // Light rippling effect
          float ripple = sin(time * 2.0 + uv.x * 6.0 + uv.y * 4.0) * 0.001;
          
          // Very subtle corner curl
          float cornerCurl = 0.0;
          float dist1 = 1.0 - distance(uv, vec2(0.0, 0.0));
          float dist2 = 1.0 - distance(uv, vec2(1.0, 1.0));
          cornerCurl += pow(dist1, 6.0) * sin(time * 2.0) * 0.05;
          cornerCurl += pow(dist2, 6.0) * cos(time * 1.8) * 0.05;
          
          // Apply gentle deformations
          pos.z += mainBend * (0.8 + 0.2 * sin(time * 1.5));
          pos.z += lengthWave * sin(time * 2.0);
          pos.z += ripple;
          pos.z += cornerCurl;
          
          // Subtle flutter
          float flutter = sin(time * 3.0 + uv.x * 10.0) * 0.01;
          pos.y += flutter;
          
          // Very light edge movement
          float edgeDistance = min(min(uv.x, 1.0 - uv.x), min(uv.y, 1.0 - uv.y));
          if (edgeDistance < 0.1) {
            float edgeFlutter = (0.1 - edgeDistance) / 0.5;
            pos.y += sin(time * 8.0 + uv.x * 15.0) * 0.02 * edgeFlutter;
            pos.z += cos(time * 6.0 + uv.y * 12.0) * 0.015 * edgeFlutter;
          }
          
          // Apply instance transformation
          vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform sampler2D frontMap;
        uniform sampler2D backMap;
        varying vec2 vUv;
        
        void main() {
          // If the texture contains both sides, we might need to use different UV regions
          // For now, showing the same texture on both sides
          vec4 texColor;
          if (gl_FrontFacing) {
            // Front face - use normal UVs
            texColor = texture2D(frontMap, vUv);
          } else {
            // Back face - flip horizontally for correct orientation
            vec2 flippedUv = vec2(1.0 - vUv.x, vUv.y);
            texColor = texture2D(backMap, flippedUv);
          }
          
          // Discard transparent pixels to ensure clean edges
          if (texColor.a < 0.1) discard;
          
          gl_FragColor = texColor;
        }
      `,
      side: THREE.DoubleSide,
      transparent: true
    });
  }, [frontTexture, backTexture]);
  
  // Store material ref for animation
  useEffect(() => {
    shaderMaterialRef.current = shaderMaterial;
  }, [shaderMaterial]);
  
  if (!billGeometry || !shaderMaterial) return null;
  
  return (
    <instancedMesh ref={meshRef} args={[billGeometry, shaderMaterial, count]} />
  );
};

useGLTF.preload('/models/100DollarBill.glb');

export default SpiralDollarBills;