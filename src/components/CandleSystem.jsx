import { useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { Vector3, PointLight } from "three";
import { GameState } from "../lib/GameState";

export const CandleSystem = () => {
  const { scene } = useThree();
  const candleFlames = useRef([]);
  const lightingDistance = 3.0;

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
            console.log(`Found candle: ${object.name}, type: ${object.type}`);
            
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
        console.log(`Found ${flames.length} candle flames`);
        
        // Update GameState with total candle count
        GameState.candles = flames.length;
        console.log(`Updated GameState.candles to ${flames.length}`);
        
        // Now safely hide them after positions are stored
        flames.forEach(candle => {
          try {
            if (candle.isLight) {
              candle.object.intensity = 0;
            } else {
              candle.object.visible = false;
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
  const lightNearestCandle = () => {
    try {
      console.log(`DEBUG: lightNearestCandle called. Character position:`, GameState.characterPosition);
      console.log(`DEBUG: Found ${candleFlames.current.length} candles`);
      
      if (!GameState.characterPosition || candleFlames.current.length === 0) {
        console.log(`DEBUG: Early return - no character position or no candles`);
        return false;
      }

      let nearestCandle = null;
      let nearestDistance = Infinity;

      // Find nearest unlit candle
      candleFlames.current.forEach(candle => {
        if (!candle.lit && candle.object) {
          const distance = candle.worldPosition.distanceTo(GameState.characterPosition);
          console.log(`DEBUG: Candle ${candle.name} - Distance: ${distance.toFixed(2)}, Lighting distance: ${lightingDistance}`);
          
          if (distance <= lightingDistance && distance < nearestDistance) {
            nearestDistance = distance;
            nearestCandle = candle;
          }
        }
      });
      
      console.log(`DEBUG: Nearest candle: ${nearestCandle ? nearestCandle.name : 'none'}, Distance: ${nearestDistance.toFixed(2)}`);

      // Light the nearest candle with a delay
      if (nearestCandle) {
        try {
          // Mark as lit immediately to prevent double-lighting
          nearestCandle.lit = true;
          if (!GameState.litCandles.includes(nearestCandle.name)) {
            GameState.litCandles.push(nearestCandle.name);
          }
          
          console.log(`Lighting candle: ${nearestCandle.name} at distance ${nearestDistance.toFixed(2)} (will appear in 400ms)`);
          
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
              
              console.log(`Candle ${nearestCandle.name} is now lit!`);
            } catch (delayError) {
              console.error(`Error during delayed lighting of ${nearestCandle.name}:`, delayError);
            }
          }, 400); // 400ms delay - should be mid-jump
          
          return true;
        } catch (error) {
          console.error(`Error lighting candle ${nearestCandle.name}:`, error);
        }
      }
    } catch (error) {
      console.error('Error in lightNearestCandle:', error);
    }
    
    return false;
  };

  // Expose lighting function
  useEffect(() => {
    GameState.lightNearestCandle = lightNearestCandle;
  }, []);

  return null;
};