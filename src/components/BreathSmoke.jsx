import React, { useRef, useState } from 'react';
import { Cloud } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const BreathSmoke = ({ 
  position = [0, 0, 0], 
  direction = [0, 0, 1],
  rotation = [0, 0, 0], // Add rotation prop [x, y, z] in radians
  breathRate = 2,
  color = "#e8e8e8",
  debug = false // Add debug prop
}) => {
  const groupRef = useRef();
  const timeRef = useRef(0);
  const [currentOpacity, setCurrentOpacity] = useState(debug ? 1 : 0.15);
  
  useFrame((state, delta) => {
    if (!groupRef.current) return;
    
    timeRef.current += delta;
    
    // Continuous flowing breath with pulsing intensity
    const breathPulse = (Math.sin(timeRef.current * breathRate) + 1) * 0.5; // 0 to 1 smooth
    const flowTime = timeRef.current * 2; // Continuous flow
    
    // Fluid-like motion: constant forward flow with varying intensity
    const flowSpeed = 0.8 + breathPulse * 0.4; // Varies between 0.8 and 1.2
    const forwardFlow = flowTime * flowSpeed;
    
    // Add turbulence for fluid-like movement
    const turbulenceX = Math.sin(flowTime * 3) * 0.15;
    const turbulenceY = Math.cos(flowTime * 2.5) * 0.1;
    
    // Position flows continuously forward with some waviness
    groupRef.current.position.x = position[0] + direction[0] * (forwardFlow % 4) + turbulenceX;
    groupRef.current.position.y = position[1] + direction[1] * (forwardFlow % 4) + turbulenceY + breathPulse * 0.2;
    groupRef.current.position.z = position[2] + direction[2] * (forwardFlow % 4);
    
    // Scale pulses with breath but maintains stream
    const scaleX = 0.4 + breathPulse * 0.3 + Math.sin(flowTime * 4) * 0.1;
    const scaleY = 0.4 + breathPulse * 0.2 + Math.cos(flowTime * 3.5) * 0.1;
    const scaleZ = 1.0 + breathPulse * 0.5; // Maintains length
    
    groupRef.current.scale.set(scaleX, scaleY, scaleZ);
    groupRef.current.visible = true;
    
    // Update opacity - cycles for continuous flow
    if (!debug) {
      const flowCycle = (forwardFlow % 4) / 4; // 0 to 1 as it flows forward
      const fadedOpacity = flowCycle < 0.7 
        ? 0.15 + breathPulse * 0.1 // Visible during flow
        : 0.15 * (1 - (flowCycle - 0.7) / 0.3); // Fade at end
      setCurrentOpacity(Math.max(0.05, fadedOpacity));
    }
  });

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      {/* Debug sphere to show exact position */}
      {debug && (
        <>
          <mesh>
            <sphereGeometry args={[0.5, 16, 16]} />
            <meshBasicMaterial color="yellow" />
          </mesh>
          <pointLight color="yellow" intensity={5} distance={10} />
          {/* Debug arrow to show direction */}
          <arrowHelper args={[new THREE.Vector3(...direction).normalize(), new THREE.Vector3(0, 0, 0), 3, 0xff0000]} />
        </>
      )}
      <Cloud
        seed={10}
        segments={debug ? 30 : 8}
        volume={debug ? 50 : 5}
        opacity={debug ? 1 : currentOpacity}
        fade={debug ? 20 : 8}
        growth={debug ? 10 : 3}
        speed={0.15}
        bounds={debug ? [10, 5, 5] : [0.8, 0.4, 10]} // Narrow width/height, long depth for cone
        color={debug ? "#00ff00" : color}
        concentrate="random" // Helps create more natural distribution
      />
    </group>
  );
};

export default BreathSmoke;