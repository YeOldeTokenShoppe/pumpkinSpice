import React, { useMemo } from 'react';
import { WobbleRug } from './WobbleRug';

export default function FloatingRugField({ 
  count = 25,
  areaSize = [50, 12],
  minHeight = 0.5,
  maxHeight = 2.5,
  speed = 1,
  factor = 0.08,
  minDistance = 1.8,
  maxDistance = 5,
  pathMode = true,
  pathWidth = 8,
  centerOffset = 0
}) {
  // Generate random positions for stepping stone rugs with collision avoidance
  const rugPositions = useMemo(() => {
    const positions = [];
    const rugModels = [
      '/models/rug.glb',
      '/models/rug2.glb',
      '/models/rug3.glb',
      '/models/rug4.glb',
      '/models/bear_rug.glb',
      '/models/rug5.glb',
        '/models/rug6.glb'
    ];
    
    // Use props for distance constraints
    
    for (let i = 0; i < count; i++) {
      let validPosition = false;
      let attempts = 0;
      let x, z, y;
      
      if (pathMode) {
        // Create a wider path with multiple rugs across
        let attempts = 0;
        const maxAttempts = 20;
        
        while (!validPosition && attempts < maxAttempts) {
          const progress = i / (count - 1); // 0 to 1
          
          // Create a sinuous path
          const baseX = (progress - 0.5) * areaSize[0];
          const waveAmplitude = 4; // Keep wave subtle
          const waveFrequency = 2; // Number of waves along the path
          
          // Add sine wave for gentle curve
          const centerZ = centerOffset + Math.sin(progress * Math.PI * waveFrequency) * waveAmplitude;
          
          // Spread rugs across the width of the path
          const widthOffset = (Math.random() - 0.5) * pathWidth;
          
          // Position with width spread
          x = baseX + (Math.random() - 0.5) * 3;
          z = centerZ + widthOffset;
          
          // Create tiered height distribution with guaranteed lower layer
          // Ensure every 3rd rug is in the lower tier for accessibility
          if (i % 3 === 0) {
            // Lower tier - always accessible from ground or other low rugs
            y = minHeight + Math.random() * 0.8; // 0.5 to 1.3
          } else if (i % 3 === 1) {
            // Mid tier - reachable from lower tier
            y = minHeight + 1.2 + Math.random() * 1.8; // 1.7 to 3.5
          } else {
            // Upper tier - creates vertical challenge
            y = minHeight + 2.8 + Math.random() * (maxHeight - minHeight - 2.8); // 3.3 to 5.0
          }
          
          // Add 20% chance for random height to prevent too predictable pattern
          if (Math.random() < 0.2) {
            y = minHeight + Math.random() * (maxHeight - minHeight);
          }
          
          // Check minimum distance from existing rugs
          if (positions.length === 0) {
            validPosition = true;
          } else {
            const tooClose = positions.some(pos => {
              const dx = x - pos.position[0];
              const dz = z - pos.position[2];
              const distance = Math.sqrt(dx * dx + dz * dz);
              return distance < minDistance;
            });
            
            if (!tooClose) {
              validPosition = true;
            }
          }
          
          attempts++;
        }
        
        // If we couldn't find a valid position, use the last attempted position
        if (!validPosition) {
          validPosition = true;
        }
      } else {
        // Original random placement logic
        while (!validPosition && attempts < 50) {
          x = (Math.random() - 0.5) * areaSize[0];
          z = (Math.random() - 0.5) * areaSize[1]; 
          y = minHeight + Math.random() * (maxHeight - minHeight);
          
          if (positions.length === 0) {
            // First rug can be placed anywhere
            validPosition = true;
          } else {
            // Check distance constraints from all existing positions
            const distances = positions.map(pos => {
              const dx = x - pos.position[0];
              const dz = z - pos.position[2];
              return Math.sqrt(dx * dx + dz * dz);
            });
            
            const minDistToAny = Math.min(...distances);
            const hasValidMinDistance = minDistToAny >= minDistance;
            const hasValidMaxDistance = minDistToAny <= maxDistance;
            
            validPosition = hasValidMinDistance && hasValidMaxDistance;
          }
          
          attempts++;
        }
        
        // If we couldn't find a valid position after 50 attempts, place it anyway
        if (!validPosition) {
          x = (Math.random() - 0.5) * areaSize[0];
          z = (Math.random() - 0.5) * areaSize[1]; 
          y = minHeight + Math.random() * (maxHeight - minHeight);
        }
      }
      
      const rotationY = Math.random() * Math.PI * 2; // Full 360° rotation
      const rotationX = (Math.random() - 0.5) * 0.2; // Slight tilt variation
      const rotationZ = (Math.random() - 0.5) * 0.1; // Minor roll variation
      const scale = 0.8; // Fixed scale for all rugs - no randomness
      const modelPath = rugModels[Math.floor(Math.random() * rugModels.length)];
      
      // Generate unique floating parameters for each rug
      const floatSpeed = 0.8 + Math.random() * 1.4; // 0.8 to 2.2
      const floatHeight = 0.05 + Math.random() * 0.1; // 0.05 to 0.15
      const rotationSpeed = 0.4 + Math.random() * 0.8; // 0.4 to 1.2
      const rotationAmount = 0.01 + Math.random() * 0.03; // 0.01 to 0.04
      const floatOffset = Math.random() * Math.PI * 2; // Random phase offset
      
      // Tidal drift parameters
      const tidalSpeed = 0.2 + Math.random() * 0.3; // 0.2 to 0.5 - slower than vertical float
      const tidalDistance = 0.5 + Math.random() * 0.8; // 0.5 to 1.3 units of drift
      
      positions.push({
        position: [x, y, z],
        rotation: [rotationX, rotationY, rotationZ],
        scale: scale,
        modelPath: modelPath,
        floatSpeed: floatSpeed,
        floatHeight: floatHeight,
        rotationSpeed: rotationSpeed,
        rotationAmount: rotationAmount,
        floatOffset: floatOffset,
        tidalSpeed: tidalSpeed,
        tidalDistance: tidalDistance
      });
    }
    
    return positions;
  }, [count, areaSize, minHeight, maxHeight, pathMode, pathWidth, centerOffset]);

  return (
    <group>
      {rugPositions.map((rugProps, i) => (
        <WobbleRug
          key={i}
          position={rugProps.position}
          rotation={rugProps.rotation}
          scale={rugProps.scale}
          modelPath={rugProps.modelPath}
          speed={speed}
          factor={factor}
          floatSpeed={rugProps.floatSpeed}
          floatHeight={rugProps.floatHeight}
          rotationSpeed={rugProps.rotationSpeed}
          rotationAmount={rugProps.rotationAmount}
          floatOffset={rugProps.floatOffset}
          tidalSpeed={rugProps.tidalSpeed}
          tidalDistance={rugProps.tidalDistance}
        />
      ))}
    </group>
  );
}