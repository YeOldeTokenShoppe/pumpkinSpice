import { extend, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useState, useRef } from "react";
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useControls, folder } from 'leva';

// WebGL version - standard shader material
const vertexShader = `
  varying vec2 vUv;
  varying vec3 vWorldPosition;
  varying vec3 vWorldNormal;
  
  void main() {
    vUv = uv;
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform vec3 uColor;
  uniform float uTime;
  uniform float uTimeSpeed;
  uniform float uNoiseScale;
  uniform float uSmoothTop;
  uniform float uSmoothBottom;
  uniform float uFresnelPower;
  
  varying vec2 vUv;
  varying vec3 vWorldPosition;
  varying vec3 vWorldNormal;
  
  // Worley noise approximation
  float random(vec3 st) {
    return fract(sin(dot(st.xyz, vec3(12.9898, 78.233, 45.164))) * 43758.5453123);
  }
  
  float noise(vec3 st) {
    vec3 i = floor(st);
    vec3 f = fract(st);
    
    float a = random(i);
    float b = random(i + vec3(1.0, 0.0, 0.0));
    float c = random(i + vec3(0.0, 1.0, 0.0));
    float d = random(i + vec3(1.0, 1.0, 0.0));
    float e = random(i + vec3(0.0, 0.0, 1.0));
    float f1 = random(i + vec3(1.0, 0.0, 1.0));
    float g = random(i + vec3(0.0, 1.0, 1.0));
    float h = random(i + vec3(1.0, 1.0, 1.0));
    
    vec3 u = f * f * (3.0 - 2.0 * f);
    
    return mix(
      mix(mix(a, b, u.x), mix(c, d, u.x), u.y),
      mix(mix(e, f1, u.x), mix(g, h, u.x), u.y),
      u.z
    );
  }
  
  void main() {
    // Animated noise
    vec3 noiseCoord = vWorldNormal * uNoiseScale + vec3(uTime * uTimeSpeed);
    float n = noise(noiseCoord);
    
    // Smooth top and bottom
    float smoothFactor = smoothstep(0.0, uSmoothBottom, vUv.y) * smoothstep(1.0, uSmoothTop, vUv.y);
    
    // Fresnel effect (inverted for godray look)
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    float fresnel = 1.0 - abs(dot(vWorldNormal, viewDirection));
    fresnel = pow(fresnel, uFresnelPower);
    
    // Combine effects
    float alpha = n * fresnel * smoothFactor;
    
    // Emissive glow
    vec3 finalColor = uColor * (1.0 + alpha * 2.0); // Boost emissive
    
    gl_FragColor = vec4(finalColor, alpha);
  }
`;

export const GodrayHybrid = ({ settings = {}, debug = false, ...props }) => {
  const [
    {
      position,
      rotation,
      color,
      topRadius,
      bottomRadius,
      height,
      timeSpeed,
      noiseScale,
      smoothBottom,
      smoothTop,
      fresnelPower,
    },
    setSettings,
  ] = useState({
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    color: "#c7b99c",
    topRadius: 3,
    bottomRadius: 2,
    height: 10,
    timeSpeed: 0.1,
    noiseScale: 15,
    smoothBottom: 0.1,
    smoothTop: 0.9,
    fresnelPower: 1,
    ...settings, // Override defaults with passed settings
  });

  const meshRef = useRef();
  const gl = useThree((state) => state.gl);
  
  // Leva controls for appearance settings only
  const levaSettings = useControls('Godray', {
    appearance: folder({
      color: {
        value: color,
      },
      topRadius: {
        value: topRadius,
        min: 0.1,
        max: 10,
        step: 0.1,
      },
      bottomRadius: {
        value: bottomRadius,
        min: 0.1,
        max: 10,
        step: 0.1,
      },
      height: {
        value: height,
        min: 1,
        max: 50,
        step: 0.5,
      },
    }),
    animation: folder({
      timeSpeed: {
        value: timeSpeed,
        min: 0,
        max: 2,
        step: 0.01,
      },
      noiseScale: {
        value: noiseScale,
        min: 0.1,
        max: 50,
        step: 0.1,
      },
    }),
    blending: folder({
      smoothBottom: {
        value: smoothBottom,
        min: 0,
        max: 1,
        step: 0.01,
      },
      smoothTop: {
        value: smoothTop,
        min: 0,
        max: 1,
        step: 0.01,
      },
      fresnelPower: {
        value: fresnelPower,
        min: 0.1,
        max: 10,
        step: 0.1,
      },
    }),
  }, { collapsed: false });
  
  // Update state when Leva controls change
  useEffect(() => {
    setSettings(prevSettings => ({
      ...prevSettings,
      ...levaSettings,
    }));
  }, [levaSettings]);
  
  // Check if WebGPU is available
  const isWebGPU = useMemo(() => {
    // Check if the renderer has WebGPU-specific properties
    return gl?.isWebGPURenderer || false;
  }, [gl]);
  // WebGL uniforms - create once
  const uniforms = useMemo(() => ({
    uColor: { value: new THREE.Color("#ffffff") },
    uTime: { value: 0 },
    uTimeSpeed: { value: 0.1 },
    uNoiseScale: { value: 15 },
    uSmoothTop: { value: 0.9 },
    uSmoothBottom: { value: 0.1 },
    uFresnelPower: { value: 1 },
  }), []);

  useEffect(() => {
    // Update uniforms when Leva settings change
    if (levaSettings.color) uniforms.uColor.value.set(levaSettings.color);
    if (levaSettings.timeSpeed !== undefined) uniforms.uTimeSpeed.value = levaSettings.timeSpeed;
    if (levaSettings.noiseScale !== undefined) uniforms.uNoiseScale.value = levaSettings.noiseScale;
    if (levaSettings.smoothTop !== undefined) uniforms.uSmoothTop.value = levaSettings.smoothTop;
    if (levaSettings.smoothBottom !== undefined) uniforms.uSmoothBottom.value = levaSettings.smoothBottom;
    if (levaSettings.fresnelPower !== undefined) uniforms.uFresnelPower.value = levaSettings.fresnelPower;
    
    // Debug log to verify values are updating
    console.log('Godray settings updated:', levaSettings);
  }, [levaSettings, uniforms]);

  useFrame((state) => {
    if (meshRef.current && uniforms.uTime) {
      uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  // For WebGPU, we'd need to dynamically import and use TSL
  // For now, we'll use the WebGL version for both
  
  return (
    <>
      <mesh ref={meshRef} {...props} position={position} rotation={rotation}>
        <cylinderGeometry
          args={[levaSettings.topRadius, levaSettings.bottomRadius, levaSettings.height, 64, 1, true]}
        />
        <shaderMaterial
          uniforms={uniforms}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          transparent={true}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </>
  );
};