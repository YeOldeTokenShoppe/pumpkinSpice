import React, {
  useRef,
  useState,
  useEffect,
  createContext,
  useContext,
} from "react";
import { Cloud, Clouds } from "@react-three/drei";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { random } from "maath";
import dynamic from "next/dynamic";

// Create context for sharing lightning effects
const lightningContext = createContext();

// Define the component first
const DarkCloudsComponent = React.forwardRef(({ fearGreedValue = 50, shakeRef, ...props }, ref) => {
  // Load texture only on client side
  const [cloudTexture, setCloudTexture] = useState(null);
  
  // Calculate cloud color based on Fear & Greed value
  const getCloudColor = (value, isPink = false) => {
    // Ensure value is a number and handle edge cases
    const numValue = typeof value === 'number' ? value : 50;
    
    if (numValue <= 30) {  // Changed < to <= to include 0
      // Extreme Fear: Dark purple/grey clouds
      return "#3a2a4a";
    } else if (numValue < 50) {
      // Fear: Grey with purple tint
      return "#5a4a6a";
    } else if (numValue < 70) {
      // Greed: Light pink-grey
      return isPink ? "#daa0c0" : "#e8d8e8";
    } else {
      // Extreme Greed: Pink/white
      return isPink ? "pink" : "white";
    }
  };
  
  // Debug log to check value changes
  useEffect(() => {
    console.log('Clouds: fearGreedValue changed to:', fearGreedValue, 'white:', getCloudColor(fearGreedValue, false), 'pink:', getCloudColor(fearGreedValue, true));
  }, [fearGreedValue]);
  
  const whiteCloudColor = getCloudColor(fearGreedValue, false);
  const pinkCloudColor = getCloudColor(fearGreedValue, true);

  useEffect(() => {
    // Only load texture on client side
    const loader = new THREE.TextureLoader();
    loader.load("/cloud.png", (texture) => {
      setCloudTexture(texture);
    });
  }, []);

  const shake = shakeRef || useRef(); // Use passed shakeRef or create local one

  // Create multiple independent flash generators for distributed lightning
  const [flash1] = useState(
    () =>
      new random.FlashGen({
        count: 6,
        minDuration: 40,
        maxDuration: 200,
      })
  );

  const [flash2] = useState(
    () =>
      new random.FlashGen({
        count: 4,
        minDuration: 60,
        maxDuration: 180,
      })
  );

  const [flash3] = useState(
    () =>
      new random.FlashGen({
        count: 5,
        minDuration: 50,
        maxDuration: 150,
      })
  );

  // Refs for cloud groups
  const cloudsGroupRef = useRef();
  const cloud0 = useRef();
  const cloud1 = useRef();
  const cloud2 = useRef();
  const cloud3 = useRef();
  const cloud4 = useRef();
  const cloud5 = useRef();
  
  // Target ref for spotlights
  const targetRef = useRef();
  
  // Sun mesh ref for god rays
  const sunRef = useRef();

  // Multiple lightning sources for more dramatic effect
  const lightningRef1 = useRef();
  const lightningRef2 = useRef();
  const lightningRef3 = useRef();
  const staticLightRef1 = useRef(); // Add ref for the static light
  const staticLightRef2 = useRef(); // Add ref for the hidden light in bigCloudGroup

  useFrame((state, delta) => {
    const time = state.clock.elapsedTime;

    // Only show lightning when Fear & Greed index is 30 or below
    const lightningActive = fearGreedValue <= 30;
    
    // Calculate intensity multiplier based on how low the index is (0-30 range)
    // At index 30: multiplier = 0.5, at index 0: multiplier = 2.0
    const intensityMultiplier = lightningActive ? (1.5 - (fearGreedValue / 30) * 1.0) : 0;

    // Update lightning with independent flash generators
    const impulse1 = lightningActive ? flash1.update(time, delta) : 0;
    const impulse2 = lightningActive ? flash2.update(time, delta) : 0;
    const impulse3 = lightningActive ? flash3.update(time, delta) : 0;

    // Apply intensity to lightning sources with scaling based on fear level
    if (lightningRef1.current) lightningRef1.current.intensity = impulse1 * 150 * intensityMultiplier;
    if (lightningRef2.current) lightningRef2.current.intensity = impulse2 * 80 * intensityMultiplier;
    if (lightningRef3.current) lightningRef3.current.intensity = impulse3 * 100 * intensityMultiplier;

    // Control the static lights with the lightning impulses
    const mixedImpulse = impulse1 * 0.3 + impulse2 * 0.5 + impulse3 * 0.2;
    if (staticLightRef1.current)
      staticLightRef1.current.intensity = mixedImpulse * 1.5 * intensityMultiplier;
    if (staticLightRef2.current)
      staticLightRef2.current.intensity = mixedImpulse * 2.5 * intensityMultiplier;

    // Trigger camera shake only on major lightning events when active
    // Shake intensity increases as index decreases
    const maxImpulse = Math.max(impulse1, impulse2, impulse3);
    if (lightningActive && maxImpulse === 1 && shake?.current) {
      const shakeIntensity = 0.3 + (1.0 - fearGreedValue / 30) * 0.5; // 0.3 to 0.8
      shake.current.setIntensity(shakeIntensity);
    }

    // Very subtle rotation for the entire cloud group
    if (cloudsGroupRef.current) {
      cloudsGroupRef.current.rotation.y = Math.cos(time / 4) / 50;
      cloudsGroupRef.current.rotation.x = Math.sin(time / 4) / 60;
    }

    // Very minimal individual cloud rotations
    if (cloud0.current) cloud0.current.rotation.y -= delta * 0.01;
    if (cloud1.current) cloud1.current.rotation.y += delta * 0.008;
    if (cloud2.current) cloud2.current.rotation.y -= delta * 0.012;
    if (cloud3.current) cloud3.current.rotation.y += delta * 0.006;
    if (cloud4.current) cloud4.current.rotation.y -= delta * 0.009;
    if (cloud5.current) cloud5.current.rotation.y += delta * 0.007;

    // Apply emissive glow based on lightning (only when active)
    if (cloudsGroupRef.current && lightningActive) {
      cloudsGroupRef.current.traverse((child) => {
        if (child.material && child.material.emissive) {
          // Stronger glow at lower index values
          const glowMultiplier = intensityMultiplier * mixedImpulse;
          child.material.emissive = new THREE.Color(
            `rgb(${glowMultiplier * 150}, ${glowMultiplier * 180}, ${glowMultiplier * 255})`
          );
          child.material.needsUpdate = true;
        }
      });
    } else if (cloudsGroupRef.current) {
      // Reset emissive when lightning is inactive
      cloudsGroupRef.current.traverse((child) => {
        if (child.material && child.material.emissive) {
          child.material.emissive = new THREE.Color(0x000000);
          child.material.needsUpdate = true;
        }
      });
    }
  });

  // Manually trigger lightning bursts randomly with different probabilities
  useEffect(() => {
    // Clear any existing lightning state when value changes
    if (fearGreedValue > 30) {
      console.log('Clouds: Disabling lightning, fearGreedValue:', fearGreedValue);
      // Reset flash generators to stop any ongoing lightning
      if (flash1) flash1.reset?.();
      if (flash2) flash2.reset?.();
      if (flash3) flash3.reset?.();
      return;
    }
    
    console.log('Clouds: Enabling lightning, fearGreedValue:', fearGreedValue);
    
    let timers = [];
    
    const triggerRandomLightning = () => {
      // More frequent lightning at lower index values
      // At index 30: 30% chance, at index 0: 80% chance
      const baseProbability = 0.3 + (1.0 - fearGreedValue / 30) * 0.5;
      
      // Distribute lightning across different flash generators
      if (Math.random() > (1 - baseProbability)) {
        flash1.burst();
      }

      // Delay second flash generator slightly
      const timer1 = setTimeout(() => {
        if (Math.random() > (1 - baseProbability * 0.8)) {
          flash2.burst();
        }
      }, Math.random() * 300);
      timers.push(timer1);

      // Delay third flash generator more
      const timer2 = setTimeout(() => {
        if (Math.random() > (1 - baseProbability * 0.9)) {
          flash3.burst();
        }
      }, Math.random() * 500);
      timers.push(timer2);
    };

    // More frequent intervals at lower index values
    // At index 30: 1200-4700ms, at index 0: 600-2100ms
    const minInterval = 600 + (fearGreedValue / 30) * 600;
    const maxInterval = 2100 + (fearGreedValue / 30) * 2600;
    
    const interval = setInterval(
      triggerRandomLightning,
      minInterval + Math.random() * (maxInterval - minInterval)
    );
    
    return () => {
      clearInterval(interval);
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [flash1, flash2, flash3, fearGreedValue]);

  // Expose sun ref for god rays
  React.useImperativeHandle(ref, () => ({
    sunRef: sunRef
  }), []);

  return (
    <lightningContext.Provider value={{ flash1, flash2, flash3, shake, sunRef }}>
      <group>
        {/* Sun mesh for god rays - positioned high above */}
        {/* <mesh ref={sunRef} position={[0, 80, -30]}>
          <sphereGeometry args={[5, 32, 32]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0} />
        </mesh> */}
        
        
        {/* Directional light from sun position */}
        <directionalLight
          position={[0, 80, -30]}
          intensity={3}
          color="#ffeecc"
          castShadow
        />
        
        {/* Hemisphere light from below for sunset glow on cloud undersides */}
        <hemisphereLight
          skyColor="#ff6b35"
          groundColor="#ff6b35"
          intensity={5}
          position={[0, 0, -3]}
        />
        
        {/* Multiple lightning sources for dramatic effect */}
        <pointLight
          ref={lightningRef1}
          color="#a0c8ff" // Blue tint
          intensity={0}
          distance={500}
          decay={1.5}
          position={[0, 0, 0]}
        />
        <pointLight
          ref={lightningRef2}
          color="#d1e6ff" // Lighter blue tint
          intensity={0}
          distance={450}
          decay={2}
          position={[-50, -2, -10]}
        />
        <pointLight
          ref={lightningRef3}
          color="#f5f9ff" // Almost white with slight blue
          intensity={0}
          distance={550}
          decay={1.8}
          position={[40, 3, 8]}
        />

        {/* {cloudTexture ? ( */}
          <group ref={cloudsGroupRef}>
            {/* <Clouds material={THREE.MeshLambertMaterial} limit={400}> */}
              {/* Main large white cloud */}
              <Cloud 
                ref={cloud0}
                seed={1}
                segments={10}
                volume={45}
                opacity={0.9}
                fade={20}
                growth={8}
                speed={0.05}
                bounds={[20, 8, 8]}
                color={whiteCloudColor}
                position={[0, -11, -5]}
                texture={cloudTexture}
              />
              
              {/* Large white cloud to the right */}
              <Cloud 
                ref={cloud1}
                seed={2}
                segments={15}
                volume={32}
                opacity={0.85}
                fade={18}
                growth={7}
                speed={0.04}
                bounds={[18, 7, 7]}
                color={whiteCloudColor}
                position={[30, -15, 0]}
                texture={cloudTexture}
              />
              
              {/* Large white cloud to the left */}
              <Cloud 
                ref={cloud2}
                seed={3}
                segments={15}
                volume={23}
                opacity={0.85}
                fade={18}
                growth={7}
                speed={0.04}
                bounds={[18, 7, 7]}
                color={whiteCloudColor}
                position={[-30, -12, 0]}
                texture={cloudTexture}
              />
              
              {/* Background large cloud */}
              <Cloud 
                ref={cloud3}
                seed={4}
                segments={10}
                volume={30}
                opacity={0.7}
                fade={15}
                growth={6}
                speed={0.03}
                bounds={[16, 6, 6]}
                color={whiteCloudColor}
                position={[0, -13, -20]}
                texture={cloudTexture}
              />
              
              {/* Front large cloud */}
              <Cloud 
                ref={cloud4}
                seed={5}
                segments={28}
                volume={31}
                opacity={0.75}
                fade={16}
                growth={6}
                speed={0.035}
                bounds={[17, 6, 6]}
                color={whiteCloudColor}
                position={[10, -27, 15]}
                texture={cloudTexture}
              />
              
              {/* Large background cloud */}
              <Cloud 
                ref={cloud5}
                concentrate="outside"
                growth={50}
                color={whiteCloudColor}
                opacity={0.6}
                seed={0.3}
                bounds={100}
                volume={80}
                position={[0, -15, -30]}
                texture={cloudTexture}
              />
              
              {/* Hidden light sources for glow effects */}
              <pointLight
                ref={staticLightRef1}
                color={pinkCloudColor}
                intensity={0}
                position={[0, -4, 0]}
                distance={15}
                decay={2}
              />
              <pointLight
                ref={staticLightRef2}
                color={pinkCloudColor}
                intensity={0}
                position={[0, -10, 0]}
                distance={20}
                decay={2}
              />
            {/* </Clouds> */}
          </group>
    
      </group>
    </lightningContext.Provider>
  );
});

// Add display name to fix the ESLint error
DarkCloudsComponent.displayName = 'DarkCloudsComponent';

// Use dynamic import with no SSR to avoid 'document is not defined' error
const DarkClouds = dynamic(() => Promise.resolve(DarkCloudsComponent), {
  ssr: false,
});

// Component for cloud with internal lightning - similar to Puffycloud from example
// function PuffyLightningComponent({ position = [0, 0, 0] }) {
//   const light = useRef();
//   const { flash2 } = useContext(lightningContext);

//   useFrame((state, delta) => {
//     const impulse = flash2.update(state.clock.elapsedTime, delta);
//     if (light.current) {
//       light.current.intensity = impulse * 80;
//     }
//   });

//   return (
//     <group position={position}>
//       <pointLight
//         ref={light}
//         color="#b1d5ff"
//         intensity={0}
//         distance={15}
//         decay={2}
//       />
//     </group>
//   );
// }

// Use dynamic import for PuffyLightning as well
// const PuffyLightning = dynamic(() => Promise.resolve(PuffyLightningComponent), {
//   ssr: false,
// });

export default DarkClouds;
