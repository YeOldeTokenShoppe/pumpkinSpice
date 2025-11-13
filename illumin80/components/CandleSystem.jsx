import { useThree } from "@react-three/fiber";
import { useEffect, useRef, useCallback } from "react";
import { Vector3, PointLight } from "three";
import { GameState } from "../lib/GameState";
import { useSnapshot } from "valtio";

export const CandleSystem = () => {
  const { scene } = useThree();
  const candleFlames = useRef([]);
  const lightingDistance = 220.0; // Adjusted for actual distance scale
  const cullDistance = 15.0; // Distance at which to turn off lights
  // Check if mobile/tablet device
  const isMobile = typeof window !== 'undefined' && 
    (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || 
     (navigator.maxTouchPoints > 0 && window.innerWidth <= 1024));
  
  const maxActiveLights = isMobile ? 3 : 8; // Reduced on mobile only
  
  // Valtio state access
  const gameState = useSnapshot(GameState);

  // Burst light effect - disabled on mobile for performance
  const createLightBurst = (position) => {
    if (isMobile) {
      // Skip burst effect on mobile for better FPS
      return;
    }
    
    // Desktop gets the burst effect
    const burstLight = new PointLight('#FFD700', 8, 6, 2);
    burstLight.position.copy(position);
    burstLight.position.y += 0.5;
    scene.add(burstLight);

    setTimeout(() => {
      scene.remove(burstLight);
      burstLight.dispose();
    }, 200);
  };

  // Find and store candle positions once
  useEffect(() => {
    const findCandleFlames = () => {
      const flames = [];
      try {
        scene.traverse((object) => {
          if (object.name && object.name.toLowerCase().includes('candleflame')) {
            // console.log(`Found candle: ${object.name}, type: ${object.type}`);
            
            // Store initial world position immediately
            const worldPos = new Vector3();
            object.getWorldPosition(worldPos);
            
            // Don't touch the object visibility or properties yet
            flames.push({
              object: object,
              name: object.name,
              worldPosition: worldPos.clone(), // Store fixed position
              lit: false,
              isLight: object.type === 'Light' || object.type === 'PointLight',
              originalIntensity: object.intensity || 1.0
            });
          }
        });
        
        candleFlames.current = flames;
        console.log(`CandleSystem: Found ${flames.length} candle flames`);
        if (flames.length > 0) {
          console.log('Candle names:', flames.map(f => f.name));
        }
        
        // Set total candle count in GameState
        GameState.candles = flames.length;
        
        // Now safely hide them after positions are stored
        flames.forEach(candle => {
          try {
            if (candle.isLight) {
              candle.object.intensity = 0;
              // console.log(`CandleSystem: Hidden light candle ${candle.name}`);
            } else {
              candle.object.visible = false;
              // console.log(`CandleSystem: Hidden visible candle ${candle.name}`);
            }
          } catch (error) {
            console.warn(`Could not hide candle ${candle.name}:`, error);
          }
        });
        
      } catch (error) {
        console.error('Error finding candles:', error);
      }
    };

    const timer = setTimeout(findCandleFlames, 500);
    return () => clearTimeout(timer);
  }, [scene]);

  // Simple lighting function that checks distance when called
  const lightNearestCandle = useCallback(() => {
    try {
      if (!gameState.characterPosition || candleFlames.current.length === 0) {
        return { success: false };
      }

      let nearestCandle = null;
      let nearestDistance = Infinity;

      // Find nearest unlit candle - using squared distance for performance
      const lightingDistanceSquared = lightingDistance * lightingDistance;
      candleFlames.current.forEach(candle => {
        if (!candle.lit && candle.object) {
          const distanceSquared = candle.worldPosition.distanceToSquared(gameState.characterPosition);
          
          if (distanceSquared <= lightingDistanceSquared && distanceSquared < nearestDistance) {
            nearestDistance = distanceSquared;
            nearestCandle = candle;
          }
        }
      });
      
      // console.log(`DEBUG: Nearest candle: ${nearestCandle ? nearestCandle.name : 'none'}, Distance: ${nearestDistance.toFixed(2)}`);

      // Light the nearest candle with a delay
      if (nearestCandle) {
        try {
          // Mark as lit immediately to prevent double-lighting
          nearestCandle.lit = true;
          
          // Add to GameState
          GameState.litCandles.add(nearestCandle.name);
          GameState.litCandleCount = GameState.litCandles.size;
          
          // console.log(`🕯️ LIGHTING CANDLE: ${nearestCandle.name} at distance ${Math.sqrt(nearestDistance).toFixed(2)} (will appear in 100ms)`);
          
          // Delay the visual lighting effect
          setTimeout(() => {
            try {
              if (nearestCandle.isLight) {
                nearestCandle.object.intensity = nearestCandle.originalIntensity;
              } else {
                nearestCandle.object.visible = true;
              }
              
              // Create the light burst effect at the candle position
              createLightBurst(nearestCandle.worldPosition);
              
              // Skip individual candle lights on mobile for performance
              // Only the first few candles get lights based on maxActiveLights
              const litCount = Array.from(GameState.litCandles).length;
              if (litCount <= maxActiveLights) {
                const candleLight = new PointLight('#FFB347', 1.5, 6, 2); // Reduced intensity & distance
                candleLight.position.copy(nearestCandle.worldPosition);
                candleLight.position.y += 0.3;
                candleLight.castShadow = false;
                scene.add(candleLight);
                nearestCandle.pointLight = candleLight;
              }
              
              // Candle lighting completed
            } catch (delayError) {
              console.error(`Error during delayed lighting of ${nearestCandle.name}:`, delayError);
            }
          }, 100); // Reduced delay for faster lighting
          
          return {
            success: true,
            candleName: nearestCandle.name,
            candlePosition: nearestCandle.worldPosition.clone(),
            distance: nearestDistance
          };
        } catch (error) {
          console.error(`Error lighting candle ${nearestCandle.name}:`, error);
        }
      }
    } catch (error) {
      console.error('Error in lightNearestCandle:', error);
    }
    
    return { success: false };
  }, [gameState.characterPosition, lightingDistance]);

  // Find nearest candle without lighting it (for direction checking)
  const findNearestCandle = useCallback(() => {
    try {
      if (!gameState.characterPosition) {
        return { success: false };
      }
      
      if (candleFlames.current.length === 0) {
        return { success: false };
      }

      let nearestCandle = null;
      let nearestDistance = Infinity;

      // Find nearest unlit candle using squared distance for performance
      const lightingDistanceSquared = lightingDistance * lightingDistance;
      candleFlames.current.forEach(candle => {
        if (!candle.lit && candle.object) {
          const distanceSquared = candle.worldPosition.distanceToSquared(gameState.characterPosition);
          
          if (distanceSquared <= lightingDistanceSquared && distanceSquared < nearestDistance) {
            nearestDistance = distanceSquared;
            nearestCandle = candle;
          }
        }
      });

      if (nearestCandle) {
        return {
          success: true,
          candleName: nearestCandle.name,
          candlePosition: nearestCandle.worldPosition.clone(),
          distance: nearestDistance
        };
      }
    } catch (error) {
      console.error('Error in findNearestCandle:', error);
    }
    
    return { success: false };
  }, [gameState.characterPosition, lightingDistance]);

  // Expose lighting function to GameState
  useEffect(() => {
    GameState.lightNearestCandle = lightNearestCandle;
    GameState.findNearestCandle = findNearestCandle;
  }, [lightNearestCandle, findNearestCandle]);

  // Enhanced culling system - manage lit candle lights for optimal performance
  useEffect(() => {
    const cullCandleLights = () => {
      if (!gameState.characterPosition || candleFlames.current.length === 0) {
        return;
      }

      // Get all lit candles with their distances
      const litCandlesWithDistance = candleFlames.current
        .filter(candle => candle.lit && candle.pointLight)
        .map(candle => ({
          candle,
          distanceSquared: candle.worldPosition.distanceToSquared(gameState.characterPosition)
        }))
        .sort((a, b) => a.distanceSquared - b.distanceSquared); // Sort by distance, closest first

      // Keep only the closest maxActiveLights lights active
      litCandlesWithDistance.forEach((item, index) => {
        const shouldBeActive = index < maxActiveLights;
        const light = item.candle.pointLight;
        
        if (light) {
          // Turn off lights beyond the limit, or those too far away
          const isWithinCullDistance = item.distanceSquared <= (cullDistance * cullDistance);
          const finalActive = shouldBeActive && isWithinCullDistance;
          
          light.visible = finalActive;
          light.intensity = finalActive ? 2 : 0; // 0 intensity saves more performance than just hiding
        }
      });
    };

    // Run culling less frequently on mobile (1fps)
    const cullInterval = setInterval(cullCandleLights, 1000);
    return () => clearInterval(cullInterval);
  }, [gameState.characterPosition, cullDistance, maxActiveLights]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      // Dispose all candle lights when component unmounts
      candleFlames.current.forEach(candle => {
        if (candle.pointLight) {
          scene.remove(candle.pointLight);
          candle.pointLight.dispose();
        }
      });
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
};
