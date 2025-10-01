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
  
  // Hardcode pink color for all clouds
  const whiteCloudColor = "#ffc0cb";
  const pinkCloudColor = "#ffc0cb";

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

    // More dynamic rotation for the entire cloud group
    if (cloudsGroupRef.current) {
      cloudsGroupRef.current.rotation.y = Math.cos(time / 4) / 20;
      cloudsGroupRef.current.rotation.x = Math.sin(time / 4) / 30;
    }

    // Individual cloud movements - rotation and drift
    if (cloud0.current) {
      cloud0.current.rotation.y -= delta * 0.02;
      cloud0.current.position.x = Math.sin(time * 0.1) * 2;
      cloud0.current.position.y = -11 + Math.cos(time * 0.15) * 1;
    }
    
    if (cloud1.current) {
      cloud1.current.rotation.y += delta * 0.015;
      cloud1.current.position.x = 30 + Math.cos(time * 0.12) * 3;
      cloud1.current.position.y = -15 + Math.sin(time * 0.1) * 1.5;
    }
    
    if (cloud2.current) {
      cloud2.current.rotation.y -= delta * 0.018;
      cloud2.current.position.x = -30 + Math.sin(time * 0.08) * 2.5;
      cloud2.current.position.y = -12 + Math.cos(time * 0.12) * 1.2;
    }
    
    if (cloud3.current) {
      cloud3.current.rotation.y += delta * 0.012;
      cloud3.current.position.z = -20 + Math.sin(time * 0.09) * 2;
      cloud3.current.position.y = -13 + Math.cos(time * 0.11) * 1;
    }
    
    if (cloud4.current) {
      cloud4.current.rotation.y -= delta * 0.014;
      cloud4.current.position.x = 10 + Math.cos(time * 0.13) * 2;
      cloud4.current.position.z = 15 + Math.sin(time * 0.1) * 1.5;
    }
    
    if (cloud5.current) {
      cloud5.current.rotation.y += delta * 0.01;
      // Larger, slower movement for background cloud
      cloud5.current.position.x = Math.sin(time * 0.05) * 5;
      cloud5.current.position.z = -30 + Math.cos(time * 0.06) * 3;
    }

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
        {/* <directionalLight
          position={[0, 80, -30]}
          intensity={3}
          color="#ffeecc"
          castShadow
        /> */}
        
        {/* Hemisphere light from below for sunset glow on cloud undersides */}
        <hemisphereLight
          skyColor="#c449f4"
          groundColor="#f7d5a3"
          // skyColor="#f8b6f9"
          // groundColor="#f7b34c"       
          intensity={2.5}
          position={[0, 0, 0]}
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
          <group ref={cloudsGroupRef} frustumCulled={false}>
            <Clouds material={THREE.MeshLambertMaterial} limit={400}>
              {/* Main large white cloud  that is DIRECTLY under the bull */}
              <Cloud 
                ref={cloud0}
                seed={1}
                segments={10}
                volume={15}
                opacity={0.9}
                fade={1}
                growth={0}
                speed={0.00}
                bounds={[10, 0, 2]}
                color={whiteCloudColor}
                position={[-40, -98, 0]}
                texture={cloudTexture}
                frustumCulled={false}
              />
             
 
          
              {/* Large white cloud to the right - mid level */}
              <Cloud 
                ref={cloud1}
                seed={2}
                segments={8}
                volume={25}
                opacity={0.8}
                fade={1}
                growth={6}
                speed={0.03}
                bounds={[15, 8, 6]}
                color={whiteCloudColor}
                position={[30, -25, 0]}
                texture={cloudTexture}
              />
              
              {/* Large white cloud to the left - high level */}
              <Cloud 
                ref={cloud2}
                seed={3}
                segments={12}
                volume={15}
                opacity={0.8}
                fade={1}
                growth={6}
                speed={0.03}
                bounds={[-10, 0, 6]}
                color={whiteCloudColor}
                position={[-40, 10, 0]}
                texture={cloudTexture}
                
              /> 
              
              {/* Background large cloud - mid-high level */}
              <Cloud 
                ref={cloud3}
                seed={14}
                segments={6}
                volume={15}
                opacity={0.6}
                fade={1}
                growth={5}
                speed={0.02}
                bounds={[14, 5, 5]}
                color={whiteCloudColor}
                position={[0, -5, -20]}
                texture={cloudTexture}
                frustumCulled={false}
              />
              
              {/* Front large cloud - low-mid level */}
              <Cloud 
                ref={cloud4}
                seed={5}
                segments={14}
                volume={20}
                opacity={0.7}
                fade={1}
                growth={5}
                speed={0.025}
                bounds={[14, 1, 5]}
                color={whiteCloudColor}
                position={[60, -60, 15]}
                texture={cloudTexture}
                frustumCulled={false}
              />
              
              {/* Additional vertical clouds for cumulus effect */}
              <Cloud 
                seed={6}
                segments={10}
                volume={18}
                opacity={0.75}
                fade={1}
                growth={5}
                speed={0.025}
                bounds={[12, 10, 5]}
                color={whiteCloudColor}
                position={[-20, -40, 10]}
                texture={cloudTexture}
                frustumCulled={false}
              />
              
              <Cloud 
                seed={7}
                segments={12}
                volume={22}
                opacity={0.7}
                fade={1}
                growth={6}
                speed={0.02}
                bounds={[15, 12, 6]}
                color={whiteCloudColor}
                position={[45, -10, -10]}
                texture={cloudTexture}
                frustumCulled={false}
              />
              
              <Cloud 
                seed={8}
                segments={8}
                volume={16}
                opacity={0.65}
                fade={1}
                growth={4}
                speed={0.03}
                bounds={[10, 8, 5]}
                color={whiteCloudColor}
                position={[-50, -70, 5]}
                texture={cloudTexture}
                frustumCulled={false}
              />
              
              <Cloud 
                seed={9}
                segments={10}
                volume={20}
                opacity={0.8}
                fade={1}
                growth={5}
                speed={0.025}
                bounds={[14, 15, 7]}
                color={whiteCloudColor}
                position={[20, 5, 20]}
                texture={cloudTexture}
                frustumCulled={false}
              />
              
              <Cloud 
                seed={10}
                segments={9}
                volume={14}
                opacity={0.6}
                fade={1}
                growth={4}
                speed={0.035}
                bounds={[12, 10, 5]}
                color={whiteCloudColor}
                position={[-35, -50, -15]}
                texture={cloudTexture}
                frustumCulled={false}
              />
              
              <Cloud 
                seed={11}
                segments={11}
                volume={25}
                opacity={0.75}
                fade={1}
                growth={6}
                speed={0.02}
                bounds={[16, 18, 8]}
                color={whiteCloudColor}
                position={[35, -35, -25]}
                texture={cloudTexture}
                frustumCulled={false}
              />
              
              {/* Tall vertical cloud formations */}
              <Cloud 
                seed={12}
                segments={14}
                volume={18}
                opacity={0.7}
                fade={1}
                growth={5}
                speed={0.025}
                bounds={[18, 25, 6]}
                color={whiteCloudColor}
                position={[5, -10, 0]}
                texture={cloudTexture}
                frustumCulled={false}
              />
              
              <Cloud 
                seed={13}
                segments={12}
                volume={16}
                opacity={0.65}
                fade={1}
                growth={4}
                speed={0.03}
                bounds={[7, 20, 5]}
                color={whiteCloudColor}
                position={[-25, -15, 12]}
                texture={cloudTexture}
                frustumCulled={false}
              />
              
              {/* Large background cloud - highest level */}
              <Cloud 
                ref={cloud5}
                concentrate="outside"
                growth={8}
                color={whiteCloudColor}
                opacity={0.3}
                seed={0.3}
                bounds={40}
                volume={20}
                segments={6}
                fade={8}
                speed={0.015}
                position={[20, 20, -30]}
                texture={cloudTexture}
                frustumCulled={false}
              />
              
              {/* Hidden light sources for glow effects */}
              {/* <pointLight
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
              /> */}
            </Clouds>
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