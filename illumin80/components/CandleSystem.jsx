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

  // Create burst light effect
  const createLightBurst = (position) => {
    // Create a bright temporary light
    const burstLight = new PointLight('#FFD700', 15, 8, 2); // Bright golden light
    burstLight.position.copy(position);
    burstLight.position.y += 0.5; // Slightly above the candle
    scene.add(burstLight);

    // Animate the burst - fade out over 800ms
    let intensity = 15;
    const fadeInterval = setInterval(() => {
      intensity *= 0.85; // Fade out exponentially
      burstLight.intensity = intensity;
      
      if (intensity < 0.1) {
        clearInterval(fadeInterval);
        scene.remove(burstLight);
      }
    }, 50); // Update every 50ms for smooth fade
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
      console.log(`🔍 lightNearestCandle called - Character:`, gameState.characterPosition, 'Candles found:', candleFlames.current.length);
      
      if (!gameState.characterPosition) {
        console.log(`❌ Early return - no character position`);
        return { success: false };
      }
      
      if (candleFlames.current.length === 0) {
        console.log(`❌ Early return - no candles (${candleFlames.current.length})`);
        return { success: false };
      }
      
      console.log(`✅ Proceeding with candle detection...`);

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
              candleLight.castShadow = true;
              candleLight.shadow.mapSize.width = 512;
              candleLight.shadow.mapSize.height = 512;
              scene.add(candleLight);
              
              // Store the light reference for potential cleanup
              nearestCandle.pointLight = candleLight;
              
              console.log(`Candle ${nearestCandle.name} is now lit with point light! Visible:`, nearestCandle.object.visible, 'Intensity:', nearestCandle.object.intensity);
            } catch (delayError) {
              console.error(`Error during delayed lighting of ${nearestCandle.name}:`, delayError);
            }
          }, 400); // 400ms delay - should be mid-jump
          
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

      // Find nearest unlit candle
      candleFlames.current.forEach(candle => {
        if (!candle.lit && candle.object) {
          const distance = candle.worldPosition.distanceTo(gameState.characterPosition);
          
          if (distance <= lightingDistance && distance < nearestDistance) {
            nearestDistance = distance;
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

      candleFlames.current.forEach(candle => {
        if (candle.lit && candle.pointLight) {
          const distance = candle.worldPosition.distanceTo(gameState.characterPosition);
          
          // Turn off light if too far, turn on if close enough
          if (distance > cullDistance) {
            if (candle.pointLight.visible) {
              candle.pointLight.visible = false;
              // console.log(`Culled candle light: ${candle.name} (distance: ${distance.toFixed(2)})`);
            }
          } else {
            if (!candle.pointLight.visible) {
              candle.pointLight.visible = true;
              // console.log(`Restored candle light: ${candle.name} (distance: ${distance.toFixed(2)})`);
            }
          }
        }
      });
    };

    // Run culling every 500ms (2fps) to avoid performance impact
    const cullInterval = setInterval(cullCandleLights, 500);
    return () => clearInterval(cullInterval);
  }, [gameState.characterPosition, cullDistance]);

  return null;
};