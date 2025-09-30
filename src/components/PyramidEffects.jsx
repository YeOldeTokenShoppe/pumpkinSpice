import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';

const effectThemes = [
  {
    name: "Lightning Storm",
    effect: "lightning",
    outer: [new THREE.Color(0x00ffff), new THREE.Color(0x4169e1), new THREE.Color(0x9400d3)],
    outerEdge: new THREE.Color(0x87cefa),
    inner: [new THREE.Color(0xff1493), new THREE.Color(0xff4500), new THREE.Color(0xffd700)],
    innerEdge: new THREE.Color(0xffd700)
  },
  {
    name: "Volcanic Shards",
    effect: "shards",
    outer: [new THREE.Color(0xffd700), new THREE.Color(0xff4500), new THREE.Color(0x8b0000)],
    outerEdge: new THREE.Color(0xff8c00),
    inner: [new THREE.Color(0xffff00), new THREE.Color(0xff6347), new THREE.Color(0xdc143c)],
    innerEdge: new THREE.Color(0xffa500),
    shardColors: [new THREE.Color(0xff8c00), new THREE.Color(0xffa500), new THREE.Color(0xffff00)]
  },
  {
    name: "Arctic Rings",
    effect: "rings",
    outer: [new THREE.Color(0x00ffff), new THREE.Color(0x87ceeb), new THREE.Color(0xb0e0e6)],
    outerEdge: new THREE.Color(0x00ffff),
    inner: [new THREE.Color(0xffffff), new THREE.Color(0xe0ffff), new THREE.Color(0xf0f8ff)],
    innerEdge: new THREE.Color(0xffffff),
    ringColors: [new THREE.Color(0x00ffff), new THREE.Color(0x87ceeb), new THREE.Color(0xffffff)]
  },
  {
    name: "Emerald Spiral",
    effect: "spiral",
    outer: [new THREE.Color(0x00ff00), new THREE.Color(0x32cd32), new THREE.Color(0x228b22)],
    outerEdge: new THREE.Color(0x98fb98),
    inner: [new THREE.Color(0xadff2f), new THREE.Color(0x9acd32), new THREE.Color(0x6b8e23)],
    innerEdge: new THREE.Color(0xadff2f),
    spiralColors: [new THREE.Color(0x00ff00), new THREE.Color(0x32cd32), new THREE.Color(0xadff2f)]
  },
  {
    name: "Solar Flare",
    effect: "flare",
    outer: [new THREE.Color(0xffa500), new THREE.Color(0xff8c00), new THREE.Color(0xff7f50)],
    outerEdge: new THREE.Color(0xffd700),
    inner: [new THREE.Color(0xffff00), new THREE.Color(0xffd700), new THREE.Color(0xffa500)],
    innerEdge: new THREE.Color(0xffff00),
    flareColors: [new THREE.Color(0xff4500), new THREE.Color(0xff6600), new THREE.Color(0xffa500), new THREE.Color(0xffff00), new THREE.Color(0xffd700)]
  }
];

// Lightning bolt shader material
const createLightningMaterial = () => {
  return new THREE.ShaderMaterial({
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
      uniform float uTime, uLife, uFlicker;
      varying vec2 vUv;
      float random(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453);
      }
      float noise(vec2 st) {
        vec2 i = floor(st), f = fract(st);
        float a = random(i), b = random(i + vec2(1,0)), c = random(i + vec2(0,1)), d = random(i + vec2(1,1));
        vec2 u = f*f*(3.0-2.0*f);
        return mix(a,b,u.x) + (c-a)*u.y*(1.0-u.x) + (d-b)*u.x*u.y;
      }
      void main() {
        float core = smoothstep(0.4, 0.0, abs(vUv.x - 0.5));
        core += noise(vec2(vUv.y*40.0, uTime*2.0)) * noise(vec2(vUv.y*25.0, uTime*1.5)) * 0.8;
        vec3 color = mix(vec3(0.1,0.5,1.0), vec3(0.6,0.2,1.0), core*0.7);
        color = mix(color, vec3(1.0), pow(core, 2.0)*0.9);
        float lifeAlpha = smoothstep(0.0, 0.2, uLife) * (1.0 - smoothstep(0.6, 1.0, uLife));
        float intense = sin(uLife * 3.14159 * 3.0) * 0.5 + 0.5;
        float alpha = pow(1.0 - abs(vUv.x - 0.5)*2.0, 2.0) * lifeAlpha * uFlicker * intense;
        gl_FragColor = vec4(color, alpha);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
};

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

function PyramidEffects({ position = [0, 0, 0], scale = 1, onEffectTrigger }) {
  const [currentEffect, setCurrentEffect] = useState(0);
  const [activeEffect, setActiveEffect] = useState(null);
  const effectGroupRef = useRef(new THREE.Group());
  const lightningRef = useRef(null);
  const shardsRef = useRef([]);
  const ringsRef = useRef([]);
  const spiralRef = useRef([]);
  const flareRef = useRef([]);
  const startTimeRef = useRef(0);
  const clockRef = useRef(new THREE.Clock());
  
  // Create enhanced lightning bolt geometry - matching original
  const createLightningBolt = () => {
    const group = new THREE.Group();
    const origin = new THREE.Vector3(0, 2.8 * scale, 0);
    
    function branch(start, dir, energy, depth) {
      if (energy < 0.3 || depth > 15) return;
      
      // Match original's segment length calculation
      const len = (Math.random() * 0.7 + 0.3) * energy * 0.6 * scale;
      const end = start.clone().add(dir.clone().multiplyScalar(len));
      
      // Match original's radius calculation  
      const rad = (0.005 + (energy / 120) + Math.random() * 0.005) * scale;
      
      const seg = createCylinder(start, end, rad);
      // Each segment gets its own material instance for individual animation
      const mesh = new THREE.Mesh(seg, createLightningMaterial());
      group.add(mesh);
      
      // Energy decay matching original
      const nextE = energy * (0.85 + Math.random() * 0.1);
      
      // More chaotic direction changes matching original
      const nextDir = dir.clone().add(
        new THREE.Vector3(
          (Math.random() - 0.5) * 4.5,
          (Math.random() - 0.5) * 2.5, 
          (Math.random() - 0.5) * 4.5
        )
      ).normalize();
      
      branch(end, nextDir, nextE, depth + 1);
      
      // Branching probability and energy matching original
      if (Math.random() < 0.6 && depth > 0) {
        const bDir = new THREE.Vector3(
          (Math.random() - 0.5) * 6.0,
          (Math.random() - 0.5) * 4.0,
          (Math.random() - 0.5) * 6.0
        ).normalize();
        branch(end, bDir, nextE * 0.7, depth + 1);
      }
    }
    
    // 7-11 initial branches like original
    const n = Math.floor(Math.random() * 4) + 7;
    for (let i = 0; i < n; i++) {
      // Initial directions with upward bias
      const d = new THREE.Vector3(
        (Math.random() - 0.5) * 3.5,
        Math.random() * 0.7 + 0.3, // Upward bias
        (Math.random() - 0.5) * 3.5
      ).normalize();
      branch(origin, d, 7, 0);
    }
    return group;
  };
  
  // Helper function to boost bloom intensity
  const boostBloom = (intensity, duration) => {
    // Access the bloom effect through the postprocessing effects window reference
    if (window.postProcessingEffects && window.postProcessingEffects.setBloomIntensity) {
      // Store original intensity (default is 1 for normal mode)
      const originalIntensity = 1;
      
      // Set the boosted intensity
      window.postProcessingEffects.setBloomIntensity(intensity);
      
      // Reset after duration
      setTimeout(() => {
        window.postProcessingEffects.setBloomIntensity(originalIntensity);
      }, duration);
    }
  };
  
  // Trigger effects
  const triggerEffect = () => {
    if (activeEffect) return; // Don't trigger if an effect is already active
    
    const theme = effectThemes[currentEffect];
    setActiveEffect(theme.effect);
    startTimeRef.current = clockRef.current.getElapsedTime();
    
    // Notify parent about effect change
    if (onEffectTrigger) {
      onEffectTrigger(theme);
    }
    
    // Clear previous effects
    effectGroupRef.current.clear();
    shardsRef.current = [];
    ringsRef.current = [];
    spiralRef.current = [];
    flareRef.current = [];
    
    switch (theme.effect) {
      case 'lightning':
        lightningRef.current = createLightningBolt();
        effectGroupRef.current.add(lightningRef.current);
        boostBloom(4.5, 400);  // Boost bloom intensity for lightning
        setTimeout(() => {
          setActiveEffect(null);
          if (lightningRef.current) {
            effectGroupRef.current.remove(lightningRef.current);
            lightningRef.current = null;
          }
        }, 1000);
        break;
        
      case 'shards':
        for (let i = 0; i < 300; i++) {
          const geo = new THREE.ConeGeometry(0.015 * scale, 0.5 * scale, 4);
          const col = theme.shardColors[Math.floor(Math.random() * theme.shardColors.length)];
          const mat = new THREE.MeshBasicMaterial({ color: col, blending: THREE.AdditiveBlending, transparent: true, opacity: 1.0 });
          const shard = new THREE.Mesh(geo, mat);
          shard.position.set(0, 1.5 * scale, 0);
          const dir = new THREE.Vector3((Math.random() - 0.5), (Math.random() - 0.5), (Math.random() - 0.5)).normalize();
          shard.lookAt(dir.clone().add(shard.position));
          shard.rotateX(Math.PI / 2);
          shard.userData.velocity = dir.multiplyScalar((0.08 + Math.random() * 0.12) * scale);
          shard.userData.life = 1.0;
          shardsRef.current.push(shard);
          effectGroupRef.current.add(shard);
        }
        boostBloom(5.5, 600);  // Boost bloom for volcanic shards
        break;
        
      case 'rings':
        for (let r = 0; r < 5; r++) {
          const ringGeo = new THREE.RingGeometry((0.5 + r * 0.3) * scale, (0.6 + r * 0.3) * scale, 32);
          const col = theme.ringColors[r % theme.ringColors.length];
          const mat = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 1.0, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
          const ring = new THREE.Mesh(ringGeo, mat);
          ring.position.set(0, 1.5 * scale, 0);
          ring.rotation.x = Math.PI / 2;
          ring.userData.speed = (0.03 + r * 0.02) * scale;
          ring.userData.life = 1.0;
          ringsRef.current.push(ring);
          effectGroupRef.current.add(ring);
        }
        boostBloom(4.0, 500);  // Boost bloom for arctic rings
        break;
        
      case 'spiral':
        for (let i = 0; i < 200; i++) {
          const geo = new THREE.SphereGeometry(0.02 * scale, 8, 6);
          const col = theme.spiralColors[i % theme.spiralColors.length];
          const mat = new THREE.MeshBasicMaterial({ color: col, blending: THREE.AdditiveBlending, transparent: true, opacity: 1.0 });
          const p = new THREE.Mesh(geo, mat);
          const angle = (i / 200) * Math.PI * 8;
          const radius = (0.1 + (i / 200) * 2) * scale;
          p.position.set(Math.cos(angle) * radius, (1.5 + (i / 200) * 2) * scale, Math.sin(angle) * radius);
          p.userData.angle = angle;
          p.userData.radius = radius;
          p.userData.life = 1.0;
          p.userData.speed = 0.05 * scale;
          spiralRef.current.push(p);
          effectGroupRef.current.add(p);
        }
        boostBloom(3.5, 700);  // Boost bloom for emerald spiral
        break;
        
      case 'flare':
        for (let i = 0; i < 200; i++) {
          const geo = new THREE.PlaneGeometry((0.08 + Math.random() * 0.04) * scale, (0.4 + Math.random() * 0.3) * scale);
          const col = theme.flareColors[Math.floor(Math.random() * theme.flareColors.length)];
          const mat = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 1.0, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
          const f = new THREE.Mesh(geo, mat);
          f.position.set(0, 2.5 * scale, 0);
          const dir = new THREE.Vector3((Math.random() - 0.5) * 2, -Math.random() * 0.8, (Math.random() - 0.5) * 2).normalize();
          f.lookAt(dir.clone().add(f.position));
          f.userData.velocity = dir.multiplyScalar((0.05 + Math.random() * 0.10) * scale);
          f.userData.life = 1.0;
          flareRef.current.push(f);
          effectGroupRef.current.add(f);
        }
        boostBloom(5.5, 600);  // Boost bloom for solar flare
        break;
    }
    
    // Move to next effect
    setCurrentEffect((currentEffect + 1) % effectThemes.length);
  };
  
  // Animation loop
  useFrame((state) => {
    const elapsedTime = clockRef.current.getElapsedTime();
    
    // Animate lightning
    if (activeEffect === 'lightning' && lightningRef.current) {
      const lt = elapsedTime - startTimeRef.current;
      const life = lt / 1.0; // duration is 1 second
      lightningRef.current.traverse(c => {
        if (c.isMesh && c.material.uniforms) {
          c.material.uniforms.uTime.value = elapsedTime;
          c.material.uniforms.uLife.value = life;
          c.material.uniforms.uFlicker.value = Math.random() > 0.05 ? 1.0 : 0.0;
        }
      });
    }
    
    // Animate shards
    if (activeEffect === 'shards') {
      for (let i = shardsRef.current.length - 1; i >= 0; i--) {
        const s = shardsRef.current[i];
        s.position.add(s.userData.velocity);
        s.userData.life -= 0.015;
        s.material.opacity = s.userData.life;
        if (s.userData.life <= 0) {
          effectGroupRef.current.remove(s);
          s.geometry.dispose();
          s.material.dispose();
          shardsRef.current.splice(i, 1);
        }
      }
      if (shardsRef.current.length === 0) {
        setActiveEffect(null);
      }
    }
    
    // Animate rings
    if (activeEffect === 'rings') {
      for (let i = ringsRef.current.length - 1; i >= 0; i--) {
        const r = ringsRef.current[i];
        r.scale.x += r.userData.speed;
        r.scale.y += r.userData.speed;
        r.userData.life -= 0.01;
        r.material.opacity = r.userData.life;
        if (r.userData.life <= 0) {
          effectGroupRef.current.remove(r);
          r.geometry.dispose();
          r.material.dispose();
          ringsRef.current.splice(i, 1);
        }
      }
      if (ringsRef.current.length === 0) {
        setActiveEffect(null);
      }
    }
    
    // Animate spiral
    if (activeEffect === 'spiral') {
      for (let i = spiralRef.current.length - 1; i >= 0; i--) {
        const p = spiralRef.current[i];
        p.userData.angle += p.userData.speed;
        p.userData.radius += 0.02 * scale;
        p.position.x = Math.cos(p.userData.angle) * p.userData.radius;
        p.position.z = Math.sin(p.userData.angle) * p.userData.radius;
        p.position.y += 0.03 * scale;
        p.userData.life -= 0.008;
        p.material.opacity = p.userData.life;
        if (p.userData.life <= 0) {
          effectGroupRef.current.remove(p);
          p.geometry.dispose();
          p.material.dispose();
          spiralRef.current.splice(i, 1);
        }
      }
      if (spiralRef.current.length === 0) {
        setActiveEffect(null);
      }
    }
    
    // Animate flare
    if (activeEffect === 'flare') {
      for (let i = flareRef.current.length - 1; i >= 0; i--) {
        const f = flareRef.current[i];
        f.position.add(f.userData.velocity);
        f.userData.velocity.y -= 0.0008 * scale;
        f.userData.velocity.x += (Math.random() - 0.5) * 0.001 * scale;
        f.userData.life -= 0.010;
        const flick = 0.85 + Math.sin(elapsedTime * 15 + i * 0.5) * 0.15;
        f.material.opacity = f.userData.life * flick;
        if (f.userData.life <= 0) {
          effectGroupRef.current.remove(f);
          f.geometry.dispose();
          f.material.dispose();
          flareRef.current.splice(i, 1);
        }
      }
      if (flareRef.current.length === 0) {
        setActiveEffect(null);
      }
    }
  });
  
  // Make triggerEffect available globally
  useEffect(() => {
    if (window) {
      window.triggerPyramidEffect = triggerEffect;
    }
    return () => {
      if (window.triggerPyramidEffect) {
        delete window.triggerPyramidEffect;
      }
    };
  }, [currentEffect, activeEffect]);
  
  return (
    <group position={position}>
      <primitive object={effectGroupRef.current} />
    </group>
  );
}

export default PyramidEffects;