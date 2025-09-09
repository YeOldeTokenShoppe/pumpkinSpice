import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF, Clone, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { SkeletonUtils } from 'three-stdlib';

const MarketEmoji = ({ type = 'devil', position, scale = 1, orbitRadius, orbitSpeed, orbitOffset, glowIntensity }) => {
  // Load the appropriate model based on type
  const modelPath = type === 'angel' ? '/models/angel_emoji.glb' : 
                    type === 'money' ? '/models/money_emoji.glb' : 
                    '/models/devil_emoji.glb';
  
  const { scene, animations } = useGLTF(modelPath);
  const meshRef = useRef();
  const glowRef = useRef();
  const mixerRef = useRef();
  const [adaptiveScale, setAdaptiveScale] = useState(scale);
  const opacityRef = useRef(0);
  const lifeTimeRef = useRef(0);
  const localTimeRef = useRef(0); // Local time to prevent jumps
  
  const clonedScene = useMemo(() => {
    // Use SkeletonUtils for proper animated model cloning
    return SkeletonUtils.clone(scene);
  }, [scene]);
  
  // Set up animation mixer and play appropriate animation
  useEffect(() => {
    // Debug the model structure
    console.log(`${type} model loaded:`, {
      scene: clonedScene,
      animations: animations,
      animationNames: animations?.map(a => a.name),
      scale: scale
    });
    
    // Calculate actual size after scaling
    const boundingBox = new THREE.Box3().setFromObject(clonedScene);
    const size = new THREE.Vector3();
    boundingBox.getSize(size);
    console.log('Devil size before scaling:', size);
    console.log('Devil size after scaling (approx):', {
      x: size.x * scale,
      y: size.y * scale,
      z: size.z * scale
    });
    
    // Traverse and log all meshes in the model
    if (clonedScene) {
      clonedScene.traverse((child) => {
        if (child.isMesh || child.isSkinnedMesh) {
          console.log('Found mesh in devil:', child.name, {
            visible: child.visible,
            material: child.material,
            geometry: child.geometry,
            isSkinnedMesh: child.isSkinnedMesh
          });
          // Force visibility
          child.visible = true;
          child.frustumCulled = false;
          
          // Ensure material is set up properly
          if (child.material) {
            child.material.side = THREE.DoubleSide;
            child.material.transparent = false;
            child.material.opacity = 1;
            child.material.depthWrite = true;
            child.material.depthTest = true;
          }
        }
      });
    }
    
    if (animations && animations.length > 0 && clonedScene) {
      // Create animation mixer
      mixerRef.current = new THREE.AnimationMixer(clonedScene);
      
      // Log all available animations
      console.log('Available animations:', animations.map(clip => ({ 
        name: clip.name, 
        duration: clip.duration,
        tracks: clip.tracks.length 
      })));
      
      // Try to find and play appropriate animation based on type
      let idleClip;
      if (type === 'angel') {
        idleClip = animations.find(clip => 
          clip.name === 'Idle_2' || 
          clip.name === 'Bone.004_00|Idle_2' ||
          clip.name.includes('Idle_2')
        );
      } else if (type === 'money') {
        idleClip = animations.find(clip => 
          clip.name === 'Idle3' || 
          clip.name === 'Bone.002_01|Idle3' ||
          clip.name.includes('Idle3')
        );
      } else { // devil
        idleClip = animations.find(clip => 
          clip.name === 'Idle' || 
          clip.name.includes('Idle') && !clip.name.includes('Idle_') && !clip.name.includes('Idle3') ||
          clip.name.includes('idle')
        );
      }
      
      if (idleClip) {
        const action = mixerRef.current.clipAction(idleClip, clonedScene);
        action.reset();
        action.setLoop(THREE.LoopRepeat);
        action.setEffectiveWeight(1.0);
        action.setEffectiveTimeScale(1.0);
        action.fadeIn(0.2);
        action.play();
        console.log('Playing Idle animation:', idleClip.name, 'Duration:', idleClip.duration);
        
        // Store action reference for debugging
        mixerRef.current.idleAction = action;
      } else if (animations.length > 0) {
        // Play all animations if we can't find Idle specifically
        animations.forEach((clip, index) => {
          const action = mixerRef.current.clipAction(clip, clonedScene);
          action.reset();
          action.setLoop(THREE.LoopRepeat);
          action.setEffectiveWeight(1.0);
          action.setEffectiveTimeScale(1.0);
          action.play();
          console.log(`Playing animation ${index}:`, clip.name);
        });
      }
    }
    
    return () => {
      // Clean up mixer on unmount
      if (mixerRef.current) {
        mixerRef.current.stopAllAction();
      }
    };
  }, [animations, clonedScene]);
  
  useFrame((state, delta) => {
    // Update animation mixer
    if (mixerRef.current && delta > 0) {
      mixerRef.current.update(delta);
    }
    if (meshRef.current && clonedScene) {
      // Use local time that increments smoothly
      localTimeRef.current += delta;
      const time = localTimeRef.current;
      lifeTimeRef.current += delta;
      
      // Fade in logic only - no fade out
      const fadeInDuration = 2.0; // 2 seconds to fade in
      
      if (lifeTimeRef.current < fadeInDuration) {
        // Fading in
        opacityRef.current = lifeTimeRef.current / fadeInDuration;
      } else {
        // Fully visible forever
        opacityRef.current = 1;
      }
      
      // Apply opacity to all materials
      clonedScene.traverse((child) => {
        if (child.isMesh || child.isSkinnedMesh) {
          if (child.material) {
            child.material.transparent = true;
            child.material.opacity = opacityRef.current;
          }
        }
      });
      
      // Orbital motion around the Virgin Mary - simple and stable
      const angle = time * orbitSpeed * 0.3 + orbitOffset; // Even slower speed
      meshRef.current.position.x = position[0] + Math.cos(angle) * orbitRadius;
      meshRef.current.position.z = position[2] + Math.sin(angle) * orbitRadius;
      
      // Position based on type - money floats highest, angels mid, devils low
      if (type === 'money') {
        meshRef.current.position.y = position[1] + 15 + Math.sin(time * 0.8 + orbitOffset) * 3;
      } else if (type === 'angel') {
        meshRef.current.position.y = position[1] + 8 + Math.sin(time * 0.6 + orbitOffset) * 2;
      } else { // devil
        meshRef.current.position.y = position[1] - 5 + Math.sin(time * 0.4 + orbitOffset) * 1.5; // Slower, smaller movement
      }
      
      // Rotate the emoji itself
      meshRef.current.rotation.y = angle * -1; // Face the center
      meshRef.current.rotation.z = Math.sin(time * 0.3) * 0.03; // Even gentler wobble
      
      // Pulsing glow effect (also affected by opacity)
      if (glowRef.current) {
        glowRef.current.intensity = glowIntensity * opacityRef.current * (1 + Math.sin(time * 0.8) * 0.2); // Slower, subtler pulse
      }
    }
  });
  
  return (
    <group ref={meshRef}>
      {/* Billboard wrapper to always face camera */}
      <Billboard
        follow={true}
        lockX={false}
        lockY={false}
        lockZ={false}
      >
        <primitive 
          object={clonedScene} 
          scale={scale}  // Scale is already large enough (80-120)
          rotation={[0, 0, 0]}
        />
        {/* Colored glow effect based on type - reduced intensity */}
        <pointLight 
          ref={glowRef}
          color={type === 'angel' ? '#87ceeb' : type === 'money' ? '#ffd700' : '#ff0000'} 
          intensity={glowIntensity * 0.5} 
          distance={20}
          decay={2}
        />
      </Billboard>
    </group>
  );
};

// Preload the models
useGLTF.preload('/models/devil_emoji.glb');
useGLTF.preload('/models/angel_emoji.glb');
useGLTF.preload('/models/money_emoji.glb');

const MarketEmojis = ({ centerPosition = [1, 15, -9], onDataUpdate, manualFearGreedData = null }) => {
  const [fearGreedIndex, setFearGreedIndex] = useState(null);
  const [devilCount, setDevilCount] = useState(0);
  const [angelCount, setAngelCount] = useState(0);
  const [moneyCount, setMoneyCount] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Fetch Fear & Greed Index
  useEffect(() => {
    const fetchFearGreedIndex = async () => {
      try {
        // Try alternative.me API first (no CORS issues)
        const altResponse = await fetch('https://api.alternative.me/fng/', {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          }
        }).catch(() => null);
        
        if (altResponse && altResponse.ok) {
          const altData = await altResponse.json();
          const latestData = altData.data[0];
          setFearGreedIndex({
            value: parseInt(latestData.value),
            classification: latestData.value_classification,
          });
          console.log('Fear & Greed Index (Alternative):', latestData);
          setLoading(false);
          return;
        }
        
        // Try Firebase Cloud Function as backup
        const cmcResponse = await fetch(
          'https://us-central1-illumin8-e963f.cloudfunctions.net/api/fear-and-greed',
          { 
            method: 'GET',
            mode: 'cors',
            headers: {
              'Accept': 'application/json',
            }
          }
        ).catch(() => null);
        
        if (cmcResponse && cmcResponse.ok) {
          const cmcData = await cmcResponse.json();
          setFearGreedIndex({
            value: cmcData.value,
            classification: cmcData.classification,
          });
          console.log('Fear & Greed Index (CMC):', cmcData);
          setLoading(false);
          return;
        }
        
        // If both fail, use a simulated value based on time of day
        // This creates a dynamic experience even without API access
        const hour = new Date().getHours();
        const simulatedValue = 50 + Math.sin((hour / 24) * Math.PI * 2) * 30 + Math.random() * 10;
        const value = Math.floor(Math.min(100, Math.max(0, simulatedValue)));
        
        let classification = 'Neutral';
        if (value > 75) classification = 'Extreme Greed';
        else if (value > 55) classification = 'Greed';
        else if (value < 25) classification = 'Extreme Fear';
        else if (value < 45) classification = 'Fear';
        
        setFearGreedIndex({
          value,
          classification,
          simulated: true
        });
        console.log('Using simulated Fear & Greed:', value, classification);
        
      } catch (error) {
        console.warn('Fear & Greed API unavailable, using simulated value:', error.message);
        // Set a default value for testing
        const simulatedValue = 65 + Math.random() * 20;
        setFearGreedIndex({
          value: Math.floor(simulatedValue),
          classification: 'Greed',
          simulated: true
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchFearGreedIndex();
    // Refresh every 5 minutes
    const interval = setInterval(fetchFearGreedIndex, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Use manual data if provided
  useEffect(() => {
    if (manualFearGreedData && manualFearGreedData.value !== undefined) {
      // Only update if the value actually changed
      if (fearGreedIndex?.value === manualFearGreedData.value && fearGreedIndex?.manual === true) {
        return; // Skip if value hasn't changed
      }
      
      console.log('MarketEmojis: Manual mode update received, value:', manualFearGreedData.value);
      // Set the fear greed index from manual data
      setFearGreedIndex(manualFearGreedData);
      // Calculate emoji counts dynamically based on manual value
      const { value } = manualFearGreedData;
      
      let devils = 0;
      let angels = 0;
      let money = 0;
      
      if (value >= 80) {
        // Extreme Greed (80+): Money emojis appear!
        devils = 0;
        angels = 0; // No angels, pure greed!
        money = Math.floor(4 + (value - 80) / 20 * 3); // 4-7 money emojis
        console.log(`EXTREME GREED MANUAL: Setting angels=0, money=${money} for value=${value}`);
      } else if (value > 75) {
        // High Greed: Mix of angels warning
        devils = 0;
        angels = Math.floor(5 + (value - 75) / 5 * 2);
        money = 0;
      } else if (value > 55) {
        // Greed: Angels warning
        devils = 0;
        angels = Math.floor(3 + (value - 55) / 20 * 2);
        money = 0;
      } else if (value > 45) {
        // Neutral: Balanced
        devils = Math.floor(1 + (55 - value) / 10);
        angels = Math.floor(1 + (value - 45) / 10);
        money = 0;
      } else if (value > 25) {
        // Fear: Devils tempting
        devils = Math.floor(3 + (45 - value) / 20 * 2);
        angels = 0;
        money = 0;
      } else {
        // Extreme Fear: Maximum devils
        devils = Math.floor(5 + (25 - value) / 25 * 3);
        angels = 0;
        money = 0;
      }
      
      setDevilCount(devils);
      setAngelCount(angels);
      setMoneyCount(money);
      // console.log(`MarketEmojis: Manual mode emoji counts - Devils: ${devils}, Angels: ${angels}, Money: ${money}`);
      
      // Call the callback with updated data for manual mode
      if (onDataUpdate) {
        onDataUpdate({
          ...manualFearGreedData,
          devilCount: devils,
          angelCount: angels,
          moneyCount: money
        });
      }
    }
  }, [manualFearGreedData?.value, manualFearGreedData?.manual]); // Only watch for value and manual flag changes
  
  // Calculate devil and angel counts based on Fear & Greed value (for live data)
  useEffect(() => {
    // Skip if we're in manual mode
    if (manualFearGreedData) return;
    
    if (fearGreedIndex) {
      const { value } = fearGreedIndex;
      
      // Devils appear during fear (temptation), angels during greed (warning), money at peak greed
      let devils = 0;
      let angels = 0;
      let money = 0;
      
      if (value >= 80) {
        // Extreme Greed (80+): Money emojis appear!
        devils = 0;
        angels = 0; // No angels, pure greed!
        money = Math.floor(4 + (value - 80) / 20 * 3); // 4-7 money emojis
        console.log(`EXTREME GREED LIVE: Setting angels=0, money=${money} for value=${value}`);
      } else if (value > 75) {
        // High Greed: Mostly angels warning
        devils = 0;
        angels = Math.floor(5 + (value - 75) / 5 * 2);
        money = 0;
      } else if (value > 55) {
        // Greed: Angels warning
        devils = Math.random() > 0.7 ? 1 : 0;
        angels = Math.floor(3 + (value - 55) / 20 * 2);
        money = 0;
      } else if (value > 45) {
        // Neutral: Balanced
        devils = Math.floor(1 + (55 - value) / 10);
        angels = Math.floor(1 + (value - 45) / 10);
        money = 0;
      } else if (value > 25) {
        // Fear: Devils tempting
        devils = Math.floor(3 + (45 - value) / 20 * 2);
        angels = Math.random() > 0.5 ? 1 : 0;
        money = 0;
      } else {
        // Extreme Fear: Maximum devils
        devils = Math.floor(5 + (25 - value) / 25 * 3);
        angels = 0;
        money = 0;
      }
      
      setDevilCount(devils);
      setAngelCount(angels);
      setMoneyCount(money);
      console.log(`Fear & Greed: ${value} (${fearGreedIndex.classification}) - Spawning ${devils} devils, ${angels} angels, and ${money} money emojis`);
      
      // Call the callback with updated data
      if (onDataUpdate) {
        onDataUpdate({
          ...fearGreedIndex,
          devilCount: devils,
          angelCount: angels,
          moneyCount: money
        });
      }
    }
  }, [fearGreedIndex, manualFearGreedData]);
  
  // Generate devil positions and parameters
  const devils = useMemo(() => {
    const devilArray = [];
    for (let i = 0; i < devilCount; i++) {
      const layer = Math.floor(i / 3); // Create layers of devils
      const indexInLayer = i % 3;
      
      // Use deterministic values based on index instead of Math.random()
      const seedValue = (i * 137.5) % 1; // Golden angle for distribution
      
      devilArray.push({
        id: i,
        scale: 0.4 + seedValue * 0.2, // Scale 0.4-0.6
        orbitRadius: 25 + layer * 10 + (seedValue * 5), // Inner orbit
        orbitSpeed: 0.08 + (seedValue * 0.1), // Slower, more controlled speed
        orbitOffset: (indexInLayer * Math.PI * 2) / 3 + (seedValue * 0.5), // Spread around orbit
        height: -5 - layer * 5, // Devils orbit BELOW the Virgin Mary
        glowIntensity: 2.0 + (fearGreedIndex?.value || 50) / 50, // Stronger glow
      });
    }
    return devilArray;
  }, [devilCount, fearGreedIndex]);
  
  // Generate angel positions and parameters
  const angels = useMemo(() => {
    const angelArray = [];
    for (let i = 0; i < angelCount; i++) {
      const layer = Math.floor(i / 3); // Create layers of angels
      const indexInLayer = i % 3;
      
      // Use deterministic values based on index
      const seedValue = ((i * 137.5) % 1); // Golden angle for distribution
      
      angelArray.push({
        id: i,
        scale: 0.4 + seedValue * 0.2, // Scale 0.4-0.6
        orbitRadius: 30 + layer * 10 + (seedValue * 5), // Outer orbit
        orbitSpeed: 0.1 + (seedValue * 0.15), // Slower, more peaceful movement
        orbitOffset: (indexInLayer * Math.PI * 2) / 3 + (seedValue * 0.5) + Math.PI, // Opposite side from devils
        height: 20 + layer * 5, // Angels orbit ABOVE the Virgin Mary
        glowIntensity: 1.5 + (50 - (fearGreedIndex?.value || 50)) / 50, // Glow based on fear level
      });
    }
    return angelArray;
  }, [angelCount, fearGreedIndex]);
  
  // Generate money emoji positions and parameters
  const moneyEmojis = useMemo(() => {
    const moneyArray = [];
    for (let i = 0; i < moneyCount; i++) {
      const layer = Math.floor(i / 3); // Create layers of money (3 per layer like devils/angels)
      const indexInLayer = i % 3;
      
      // Use deterministic values based on index
      const seedValue = ((i * 137.5) % 1); // Golden angle for distribution
      
      moneyArray.push({
        id: i,
        scale: 0.5 + seedValue * 0.2, // Slightly larger scale
        orbitRadius: 35 + layer * 12 + (seedValue * 7), // Widest orbit
        orbitSpeed: 0.2 + (seedValue * 0.2), // Fast spinning
        orbitOffset: (indexInLayer * Math.PI * 2 / 3) + (seedValue * 0.8), // Evenly spread around full circle
        height: 35 + layer * 8 + (seedValue * 3), // Highest position with variation
        glowIntensity: 3.0, // Strong golden glow
      });
    }
    return moneyArray;
  }, [moneyCount]);
  
  if (loading) return null;
  
  return (
    <>
      {/* Display current Fear & Greed value */}
      {fearGreedIndex && (
        <group position={[centerPosition[0], centerPosition[1] + 30, centerPosition[2]]}>
          {/* You could add 3D text here to show the index value */}
        </group>
      )}
      
      {/* Render devil emojis */}
      {devils.map((devil) => (
        <MarketEmoji
          type="devil"
          key={`devil-${devil.id}`}
          position={[centerPosition[0], centerPosition[1] + devil.height, centerPosition[2]]}
          scale={devil.scale}
          orbitRadius={devil.orbitRadius}
          orbitSpeed={devil.orbitSpeed}
          orbitOffset={devil.orbitOffset}
          glowIntensity={devil.glowIntensity}
        />
      ))}
      
      {/* Render angel emojis */}
      {angels.map((angel) => (
        <MarketEmoji
          type="angel"
          key={`angel-${angel.id}`}
          position={[centerPosition[0], centerPosition[1] + angel.height, centerPosition[2]]}
          scale={angel.scale}
          orbitRadius={angel.orbitRadius}
          orbitSpeed={angel.orbitSpeed}
          orbitOffset={angel.orbitOffset}
          glowIntensity={angel.glowIntensity}
        />
      ))}
      
      {/* Render money emojis for extreme greed */}
      {moneyEmojis.map((money) => (
        <MarketEmoji
          type="money"
          key={`money-${money.id}`}
          position={[centerPosition[0], centerPosition[1] + money.height, centerPosition[2]]}
          scale={money.scale}
          orbitRadius={money.orbitRadius}
          orbitSpeed={money.orbitSpeed}
          orbitOffset={money.orbitOffset}
          glowIntensity={money.glowIntensity}
        />
      ))}
      
      {/* Particle effects removed - was causing bubble appearance at high index values */}
    </>
  );
};


export default MarketEmojis;