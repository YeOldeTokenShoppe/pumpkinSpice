import { useThree } from "@react-three/fiber";
import { useEffect, useRef, useCallback } from "react";
import { Vector3, PointLight } from "three";
import { GameState } from "../../src/lib/GameState";
import { useSnapshot } from "valtio";

export const CandleSystem = () => {
  const { scene } = useThree();
  const candleFlames = useRef([]);
  const lightingDistance = 220.0; // Adjusted for actual distance scale
  const cullDistance = 15.0; // Distance at which to turn off lights
  
  // Valtio state access
  const gameState = useSnapshot(GameState);

  // Optimized burst light effect - no animation for performance
  const createLightBurst = (position) => {
    // Create a brief static burst instead of animated
    const burstLight = new PointLight('#FFD700', 8, 6, 2);
    burstLight.position.copy(position);
    burstLight.position.y += 0.5;
    scene.add(burstLight);

    // Single timeout instead of interval for better performance
    setTimeout(() => {
      scene.remove(burstLight);
    }, 200); // Quick burst, no animation
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
        // console.log(`CandleSystem: Found ${flames.length} candle flames`);
        
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

      // Find nearest unlit candle
      console.log(`🔍 Checking ${candleFlames.current.length} candles for character at:`, gameState.characterPosition);
      candleFlames.current.forEach(candle => {
        if (!candle.lit && candle.object) {
          const distance = candle.worldPosition.distanceTo(gameState.characterPosition);
          console.log(`🕯️ Candle ${candle.name} - Distance: ${distance.toFixed(2)}, Threshold: ${lightingDistance}, Lit: ${candle.lit}`);
          
          if (distance <= lightingDistance && distance < nearestDistance) {
            nearestDistance = distance;
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
          
          console.log(`🕯️ LIGHTING CANDLE: ${nearestCandle.name} at distance ${nearestDistance.toFixed(2)} (will appear in 400ms)`);
          
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
              
              // Add permanent point light at the candle position
              const candleLight = new PointLight('#FFB347', 2, 8, 2); // Warm orange light
              candleLight.position.copy(nearestCandle.worldPosition);
              candleLight.position.y += 0.3; // Slightly above the candle
              candleLight.castShadow = false; // Disable shadows for tablet performance
              scene.add(candleLight);
              
              // Store the light reference for potential cleanup
              nearestCandle.pointLight = candleLight;
              
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

  // Culling system - manage distant candle lights for performance
  useEffect(() => {
    const cullCandleLights = () => {
      if (!gameState.characterPosition || candleFlames.current.length === 0) {
        return;
      }

      const cullDistanceSquared = cullDistance * cullDistance;
      candleFlames.current.forEach(candle => {
        if (candle.lit && candle.pointLight) {
          const distanceSquared = candle.worldPosition.distanceToSquared(gameState.characterPosition);
          
          // Turn off light if too far, turn on if close enough - using squared distance for performance
          const shouldBeVisible = distanceSquared <= cullDistanceSquared;
          if (candle.pointLight.visible !== shouldBeVisible) {
            candle.pointLight.visible = shouldBeVisible;
          }
        }
      });
    };

    // Run culling every 1000ms (1fps) for better performance with 60 max candles
    const cullInterval = setInterval(cullCandleLights, 1000);
    return () => clearInterval(cullInterval);
  }, [gameState.characterPosition, cullDistance]);

  return null;
};