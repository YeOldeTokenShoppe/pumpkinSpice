import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Wireframe grid shader inspired by PalmTreeDrive
const vertexShader = `
  uniform float time;
  varying vec3 vPos;
  varying vec2 vUv;
  
  void main() {
    vUv = uv;
    vec3 transformed = position;
    vPos = transformed;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
  }
`;

const fragmentShader = `
  uniform float time;
  uniform vec3 gridColor;
  uniform vec3 fogColor;
  uniform float fogNear;
  uniform float fogFar;
  uniform float gridScale;
  uniform float lineWidth;
  uniform float speed;
  varying vec3 vPos;
  varying vec2 vUv;
  
  float line(vec3 position, float width, vec3 step) {
    vec3 tempCoord = position / step;
    vec2 coord = tempCoord.xz;
    coord.y -= time * speed / 2.;
    vec2 grid = abs(fract(coord - 0.5) - 0.5) / (fwidth(coord) * width);
    float line = min(grid.x, grid.y);
    return min(line, 1.0);
  }
  
  void main() {
    float l = line(vPos, lineWidth, vec3(gridScale));
    vec3 color = mix(gridColor, vec3(0.0), l);
    
    // Apply fog
    float depth = gl_FragCoord.z / gl_FragCoord.w;
    float fogFactor = smoothstep(fogNear, fogFar, depth);
    color = mix(color, fogColor, fogFactor);
    
    // Fade based on distance and transparency
    float alpha = (1.0 - l) * (1.0 - fogFactor);
    
    gl_FragColor = vec4(color, alpha * 0.6);
  }
`;

function WireframeGrid({
  position = [0, 0, 0],
  size = [60, 60],
  segments = [128, 128],
  gridColor = [1.0, 0.0, 0.933], // Magenta like PalmTreeDrive
  fogColor = [0.1, 0.05, 0],
  fogNear = 20,
  fogFar = 100,
  gridScale = 2.0,
  lineWidth = 1.0,
  speed = 1.0,
  ...props
}) {
  const meshRef = useRef();

  // Create shader material
  const uniforms = useMemo(() => ({
    time: { value: 1.0 },
    gridColor: { value: new THREE.Vector3(...gridColor) },
    fogColor: { value: new THREE.Vector3(...fogColor) },
    fogNear: { value: fogNear },
    fogFar: { value: fogFar },
    gridScale: { value: gridScale },
    lineWidth: { value: lineWidth },
    speed: { value: speed }
  }), [gridColor, fogColor, fogNear, fogFar, gridScale, lineWidth, speed]);

  const shaderMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    });
  }, [uniforms]);

  // Animate the time uniform
  useFrame((_, delta) => {
    if (uniforms.time) {
      uniforms.time.value += delta * 0.5;
    }
  });

  return (
    <mesh 
      ref={meshRef} 
      position={position} 
      rotation={[-Math.PI / 2, 0, 0]} 
      {...props}
    >
      <planeGeometry args={[size[0], size[1], segments[0], segments[1]]} />
      <primitive object={shaderMaterial} />
    </mesh>
  );
}

export default WireframeGrid;