import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

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
  
  // Simple noise function
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
    float smooth = smoothstep(0.0, uSmoothBottom, vUv.y) * smoothstep(1.0, uSmoothTop, vUv.y);
    
    // Fresnel effect (inverted for godray look)
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    float fresnel = 1.0 - abs(dot(vWorldNormal, viewDirection));
    fresnel = pow(fresnel, uFresnelPower);
    
    // Combine effects
    float alpha = n * fresnel * smooth;
    
    gl_FragColor = vec4(uColor, alpha);
  }
`;

export function GodrayWebGL({ 
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  color = "#c7b99c",
  timeSpeed = 0.1,
  noiseScale = 5,
  topRadius = 3,
  bottomRadius = 2,
  height = 10,
  smoothBottom = 0.1,
  smoothTop = 0.9,
  fresnelPower = 5,
}) {
  const meshRef = useRef();
  
  const uniforms = useMemo(() => ({
    uColor: { value: new THREE.Color(color) },
    uTime: { value: 0 },
    uTimeSpeed: { value: timeSpeed },
    uNoiseScale: { value: noiseScale },
    uSmoothTop: { value: smoothTop },
    uSmoothBottom: { value: smoothBottom },
    uFresnelPower: { value: fresnelPower },
  }), []);

  useEffect(() => {
    uniforms.uColor.value.set(color);
    uniforms.uTimeSpeed.value = timeSpeed;
    uniforms.uNoiseScale.value = noiseScale;
    uniforms.uSmoothTop.value = smoothTop;
    uniforms.uSmoothBottom.value = smoothBottom;
    uniforms.uFresnelPower.value = fresnelPower;
  }, [color, timeSpeed, noiseScale, smoothTop, smoothBottom, fresnelPower, uniforms]);

  useFrame((state) => {
    if (meshRef.current) {
      uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return (
    <mesh ref={meshRef} position={position} rotation={rotation}>
      <cylinderGeometry args={[topRadius, bottomRadius, height, 64, 1, true]} />
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
  );
}