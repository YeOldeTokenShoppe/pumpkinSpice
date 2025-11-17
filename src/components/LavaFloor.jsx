import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

// Vertex shader - same as original with uvScale uniform
const vertexShader = `
  uniform vec2 uvScale;
  varying vec2 vUv;

  void main()
  {
    vUv = uvScale * uv;
    vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
    gl_Position = projectionMatrix * mvPosition;
  }
`;

// Fragment shader - enhanced lava shader with brightness control
const fragmentShader = `
  uniform float time;
  uniform float fogDensity;
  uniform vec3 fogColor;
  uniform float brightness;
  uniform sampler2D texture1;
  uniform sampler2D texture2;

  varying vec2 vUv;

  void main( void ) {
    vec2 position = - 1.0 + 2.0 * vUv;

    vec4 noise = texture2D( texture1, vUv );
    vec2 T1 = vUv + vec2( 1.5, - 1.5 ) * time * 0.02;
    vec2 T2 = vUv + vec2( - 0.5, 2.0 ) * time * 0.01;

    T1.x += noise.x * 2.0;
    T1.y += noise.y * 2.0;
    T2.x -= noise.y * 0.2;
    T2.y += noise.z * 0.2;

    float p = texture2D( texture1, T1 * 2.0 ).a;

    vec4 color = texture2D( texture2, T2 * 2.0 );
    vec4 temp = color * ( vec4( p, p, p, p ) * 2.0 ) + ( color * color - 0.1 );

    if( temp.r > 1.0 ) { temp.bg += clamp( temp.r - 2.0, 0.0, 100.0 ); }
    if( temp.g > 1.0 ) { temp.rb += temp.g - 1.0; }
    if( temp.b > 1.0 ) { temp.rg += temp.b - 1.0; }

    // Apply brightness multiplier
    temp *= brightness;

    gl_FragColor = temp;

    float depth = gl_FragCoord.z / gl_FragCoord.w;
    const float LOG2 = 1.442695;
    float fogFactor = exp2( - fogDensity * fogDensity * depth * depth * LOG2 );
    fogFactor = 1.0 - clamp( fogFactor, 0.0, 1.0 );

    gl_FragColor = mix( gl_FragColor, vec4( fogColor, gl_FragColor.w ), fogFactor );
  }
`;

function LavaFloor({
  position = [0, 0, 0],
  size = [60, 60],
  segments = [64, 64],
  uvScale = [3.0, 1.0],
  fogDensity = 0.15,
  fogColor = [0.1, 0.05, 0],
  brightness = 1.5,
  animationSpeed = 0.01,
  enableRotation = false,
  ...props
}) {
  const meshRef = useRef();

  // Load textures - you'll need to provide these texture paths
  const [cloudTexture, lavaTexture] = useTexture([
    '/cloud.png',
    '/lavatile.jpg'
  ]);

  // Configure textures
  useMemo(() => {
    if (cloudTexture && lavaTexture) {
      // Configure cloud texture
      cloudTexture.wrapS = cloudTexture.wrapT = THREE.RepeatWrapping;
      
      // Configure lava texture
      lavaTexture.wrapS = lavaTexture.wrapT = THREE.RepeatWrapping;
      lavaTexture.colorSpace = THREE.SRGBColorSpace;
    }
  }, [cloudTexture, lavaTexture]);

  // Create shader material
  const uniforms = useMemo(() => ({
    fogDensity: { value: fogDensity },
    fogColor: { value: new THREE.Vector3(...fogColor) },
    brightness: { value: brightness },
    time: { value: 1.0 },
    uvScale: { value: new THREE.Vector2(...uvScale) },
    texture1: { value: cloudTexture },
    texture2: { value: lavaTexture }
  }), [fogDensity, fogColor, brightness, uvScale, cloudTexture, lavaTexture]);

  const shaderMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: vertexShader,
      fragmentShader: fragmentShader
    });
  }, [uniforms]);

  // Animate the time uniform and optional mesh rotation
  useFrame((_, delta) => {
    if (uniforms.time) {
      // Enhanced time animation - match original Three.js example
      const timeSpeed = 5 * delta * animationSpeed;
      uniforms.time.value += 0.02 * timeSpeed;
    }
    
    // Optional mesh rotation for additional movement
    if (enableRotation && meshRef.current) {
      meshRef.current.rotation.z += 0.0125 * delta * animationSpeed;
    }
  });

  return (
    <mesh ref={meshRef} position={position} rotation={[-Math.PI / 2, 0, 0]} {...props}>
      <planeGeometry args={[size[0], size[1], segments[0], segments[1]]} />
      <primitive object={shaderMaterial} />
    </mesh>
  );
}

export default LavaFloor;