import { useState, useRef, useEffect } from 'react';
import { TransformControls, PivotControls } from '@react-three/drei';
import { useControls, button } from 'leva';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

export function GodrayPositionable({ 
  initialPosition = [0, 4.9, -2.7],
  initialRotation = [-0.678, -Math.PI/6, 0],
  settings = {} 
}) {
  const meshRef = useRef();
  const [position, setPosition] = useState(initialPosition);
  const [rotation, setRotation] = useState(initialRotation);
  
  // Leva controls for appearance and to show position
  const config = useControls('Godray Settings', {
    color: { value: settings.color || "#c7b99c" },
    topRadius: { value: settings.topRadius || 1.7, min: 0.1, max: 10, step: 0.1 },
    bottomRadius: { value: settings.bottomRadius || 2, min: 0.1, max: 10, step: 0.1 },
    height: { value: settings.height || 14.5, min: 1, max: 50, step: 0.5 },
    timeSpeed: { value: settings.timeSpeed || 0.18, min: 0, max: 2, step: 0.01 },
    noiseScale: { value: settings.noiseScale || 14.4, min: 0.1, max: 50, step: 0.1 },
    smoothBottom: { value: settings.smoothBottom || 0.332, min: 0, max: 1, step: 0.01 },
    smoothTop: { value: settings.smoothTop || 0.574, min: 0, max: 1, step: 0.01 },
    fresnelPower: { value: settings.fresnelPower || 1, min: 0.1, max: 10, step: 0.1 },
    logPosition: button(() => {
      console.log('Position:', position);
      console.log('Rotation:', rotation);
      console.log('Copy this to your code:');
      console.log(`position={[${position.join(', ')}]}`);
      console.log(`rotation={[${rotation.join(', ')}]}`);
    }),
  });

  // Shaders
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
      vec3 noiseCoord = vWorldNormal * uNoiseScale + vec3(uTime * uTimeSpeed);
      float n = noise(noiseCoord);
      
      float smoothFactor = smoothstep(0.0, uSmoothBottom, vUv.y) * smoothstep(1.0, uSmoothTop, vUv.y);
      
      vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
      float fresnel = 1.0 - abs(dot(vWorldNormal, viewDirection));
      fresnel = pow(fresnel, uFresnelPower);
      
      float alpha = n * fresnel * smoothFactor;
      vec3 finalColor = uColor * (1.0 + alpha * 2.0);
      
      gl_FragColor = vec4(finalColor, alpha);
    }
  `;

  // Uniforms
  const uniforms = useRef({
    uColor: { value: new THREE.Color(config.color) },
    uTime: { value: 0 },
    uTimeSpeed: { value: config.timeSpeed },
    uNoiseScale: { value: config.noiseScale },
    uSmoothTop: { value: config.smoothTop },
    uSmoothBottom: { value: config.smoothBottom },
    uFresnelPower: { value: config.fresnelPower },
  });

  // Update uniforms when config changes
  useEffect(() => {
    uniforms.current.uColor.value.set(config.color);
    uniforms.current.uTimeSpeed.value = config.timeSpeed;
    uniforms.current.uNoiseScale.value = config.noiseScale;
    uniforms.current.uSmoothTop.value = config.smoothTop;
    uniforms.current.uSmoothBottom.value = config.smoothBottom;
    uniforms.current.uFresnelPower.value = config.fresnelPower;
  }, [config]);

  // Animate time
  useFrame((state) => {
    uniforms.current.uTime.value = state.clock.elapsedTime;
  });

  return (
    <PivotControls
      anchor={[0, 0, 0]}
      depthTest={false}
      lineWidth={2}
      axisColors={['#ff0000', '#00ff00', '#0000ff']}
      scale={1.5}
      rotation={rotation}
      translation={position}
      onDrag={(matrix) => {
        const newPosition = new THREE.Vector3();
        const newQuaternion = new THREE.Quaternion();
        const newScale = new THREE.Vector3();
        matrix.decompose(newPosition, newQuaternion, newScale);
        
        const newRotation = new THREE.Euler();
        newRotation.setFromQuaternion(newQuaternion);
        
        setPosition([newPosition.x, newPosition.y, newPosition.z]);
        setRotation([newRotation.x, newRotation.y, newRotation.z]);
      }}
    >
      <mesh ref={meshRef}>
        <cylinderGeometry
          args={[config.topRadius, config.bottomRadius, config.height, 64, 1, true]}
        />
        <shaderMaterial
          uniforms={uniforms.current}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          transparent={true}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </PivotControls>
  );
}