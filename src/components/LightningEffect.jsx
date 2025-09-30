import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Lightning shader material
const lightningMaterial = new THREE.ShaderMaterial({
  uniforms: { 
    uTime: { value: 0 }, 
    uLife: { value: 0 }, 
    uFlicker: { value: 1.0 } 
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float uTime;
    uniform float uLife; 
    uniform float uFlicker;
    varying vec2 vUv;
    
    float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453);
    }
    
    float noise(vec2 st) {
      vec2 i = floor(st);
      vec2 f = fract(st);
      float a = random(i);
      float b = random(i + vec2(1.0, 0.0));
      float c = random(i + vec2(0.0, 1.0));
      float d = random(i + vec2(1.0, 1.0));
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
    }
    
    void main() {
      float core = smoothstep(0.4, 0.0, abs(vUv.x - 0.5));
      core += noise(vec2(vUv.y * 40.0, uTime * 2.0)) * 
              noise(vec2(vUv.y * 25.0, uTime * 1.5)) * 0.8;
      
      vec3 color = mix(vec3(0.1, 0.5, 1.0), vec3(0.6, 0.2, 1.0), core * 0.7);
      color = mix(color, vec3(1.0), pow(core, 2.0) * 0.9);
      
      float lifeAlpha = smoothstep(0.0, 0.2, uLife) * (1.0 - smoothstep(0.6, 1.0, uLife));
      float intense = sin(uLife * 3.14159 * 3.0) * 0.5 + 0.5;
      float alpha = pow(1.0 - abs(vUv.x - 0.5) * 2.0, 2.0) * lifeAlpha * uFlicker * intense;
      
      gl_FragColor = vec4(color, alpha);
    }
  `,
  transparent: true,
  blending: THREE.AdditiveBlending,
  depthWrite: false
});

function createCylinder(start, end, radius) {
  const dir = new THREE.Vector3().subVectors(end, start);
  const orient = new THREE.Matrix4();
  const rot = new THREE.Matrix4();
  orient.lookAt(start, end, new THREE.Object3D().up);
  rot.makeRotationX(Math.PI * 0.5);
  orient.multiply(rot);
  const geo = new THREE.CylinderGeometry(radius, radius, dir.length(), 8, 1, true);
  geo.applyMatrix4(orient);
  geo.translate((start.x + end.x) / 2, (start.y + end.y) / 2, (start.z + end.z) / 2);
  return geo;
}

function LightningEffect({ 
  trigger = false, 
  position = [0, 0, 0], 
  duration = 1.0,
  onComplete = null,
  scale = 1.5,  // Added scale parameter for bigger effect
  rotationSpeed = 0.5 
}) {
  const groupRef = useRef(new THREE.Group());
  const startTimeRef = useRef(0);
  const isActiveRef = useRef(false);
  const clockRef = useRef(new THREE.Clock());
  
  // Create lightning bolt geometry
  const createLightningBolt = () => {
    const group = new THREE.Group();
    const origin = new THREE.Vector3(0, 2.8, 0);
    
    function branch(start, dir, energy, depth) {
      if (energy < 0.3 || depth > 8) return;
      
      const len = (Math.random() * 0.7 + 0.3) * energy * 0.6;
      const end = start.clone().add(dir.clone().multiplyScalar(len));
      const rad = (0.005 + (energy / 120) + Math.random() * 0.005) * 2.5;
      
      const seg = createCylinder(start, end, rad);
      const mesh = new THREE.Mesh(seg, lightningMaterial.clone());
      group.add(mesh);
      
      const nextE = energy * (0.85 + Math.random() * 0.1);
      const nextDir = dir.clone().add(
        new THREE.Vector3(
          (Math.random() - 0.5) * 4.5,
          (Math.random() - 0.5) * 2.5,
          (Math.random() - 0.5) * 4.5
        )
      ).normalize();
      
      branch(end, nextDir, nextE, depth + 1);
      
      if (Math.random() < 0.6 && depth > 0) {
        const bDir = new THREE.Vector3(
          (Math.random() - 0.5) * 6.0,
          (Math.random() - 0.5) * 4.0,
          (Math.random() - 0.5) * 6.0
        ).normalize();
        branch(end, bDir, nextE * 0.6, depth + 1);
      }
    }
    
    const n = Math.floor(Math.random() * 2) + 7;
    for (let i = 0; i < n; i++) {
      const d = new THREE.Vector3(
        (Math.random() - 0.5) * 3.5,
        Math.random() * 0.5 + 0.5,
        (Math.random() - 0.3) * 4.0
      ).normalize();
      branch(origin, d, 7, 0);
    }
    
    return group;
  };
  
  // Trigger effect
  useEffect(() => {
    if (trigger && !isActiveRef.current) {
      groupRef.current.clear();
      
      const lightning = createLightningBolt();
      groupRef.current.add(lightning);
      
      startTimeRef.current = clockRef.current.getElapsedTime();
      isActiveRef.current = true;
      
      setTimeout(() => {
        groupRef.current.visible = false;
        setTimeout(() => {
          groupRef.current.clear();
          groupRef.current.visible = true;
          isActiveRef.current = false;
          if (onComplete) onComplete();
        }, 100);
      }, duration * 1000);
    }
  }, [trigger]);
  
  // Animation loop
  useFrame(() => {
    if (!isActiveRef.current) return;
    
    const elapsedTime = clockRef.current.getElapsedTime();
    const lt = elapsedTime - startTimeRef.current;
    const life = Math.min(lt / duration, 1.0);
    
    // Rotate the lightning group
    groupRef.current.rotation.y += rotationSpeed * 0.005;
    
    // Optional: Add other rotation axes for more dynamic effect
    // groupRef.current.rotation.x += rotationSpeed * 0.05;
    // groupRef.current.rotation.z += rotationSpeed * 0.03;
    
    groupRef.current.traverse(child => {
      if (child.isMesh && child.material.uniforms) {
        child.material.uniforms.uTime.value = elapsedTime;
        child.material.uniforms.uLife.value = life;
        child.material.uniforms.uFlicker.value = Math.random() > 0.05 ? 1.0 : 0.0;
      }
    });
    
    if (life >= 1.0) {
      groupRef.current.visible = false;
    }
  });
  
  return <primitive object={groupRef.current} position={position} scale={[scale, scale, scale]} />;
}
export default LightningEffect;