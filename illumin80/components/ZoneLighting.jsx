import { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { GameState } from '../lib/GameState';

// Zone-based lighting configuration
const LIGHTING_ZONES = {
  stage1: {
    minZ: -Infinity,
    maxZ: 102,
    lights: {
      points: ['Point001', 'Point002', 'Point003'],
      spots: []
    }
  },
  stage2: {
    minZ: 102,
    maxZ: 160,
    lights: {
      points: ['Point004', 'Point005', 'Point006', 'Point007'],
      spots: ['Spot', 'Spot001']  // Using the naming from your model
    }
  },
  stage3: {
    minZ: 160,
    maxZ: 210,
    lights: {
      points: ['Point008', 'Point009', 'Point010', 'Point011', 'Point012', 'Point013'],
      spots: []
    }
  },
  stage4: {
    minZ: 210,
    maxZ: Infinity,
    lights: {
      points: ['Point014', 'Point015', 'Point016', 'Point017'],
      spots: ['Spot002']
    }
  }
};

export const ZoneLighting = () => {
  const { scene } = useThree();
  const currentZone = useRef('stage1');
  const allLights = useRef([]);
  const frameCount = useRef(0);
  
  // Collect all lights from the scene on mount
  useEffect(() => {
    const lights = [];
    
    // Find all lights in the loaded model
    scene.traverse((child) => {
      if (child.isPointLight || child.isSpotLight) {
        lights.push(child);
        // Start with all lights disabled
        child.visible = false;
        console.log(`Found light: ${child.name} (${child.type})`);
      }
    });
    
    allLights.current = lights;
    console.log(`🔦 Zone Lighting: Found ${lights.length} total lights`);
    
    // Activate initial zone (stage1)
    activateZone('stage1');
    
    return () => {
      // Cleanup - re-enable all lights
      lights.forEach(light => light.visible = true);
    };
  }, [scene]);
  
  // Activate lights for a specific zone
  const activateZone = (zoneName) => {
    const zone = LIGHTING_ZONES[zoneName];
    if (!zone) return;
    
    console.log(`⚡ Activating lighting zone: ${zoneName}`);
    
    // First, turn off ALL lights
    allLights.current.forEach(light => {
      light.visible = false;
    });
    
    // Then turn on only the lights for this zone
    let activatedCount = 0;
    
    allLights.current.forEach(light => {
      // Check if this light should be active in the current zone
      const lightName = light.name;
      
      // Check point lights
      if (light.isPointLight) {
        if (zone.lights.points.includes(lightName)) {
          light.visible = true;
          activatedCount++;
        }
      }
      
      // Check spot lights
      if (light.isSpotLight) {
        if (zone.lights.spots.includes(lightName)) {
          light.visible = true;
          activatedCount++;
        }
      }
    });
    
    console.log(`✅ Activated ${activatedCount} lights for ${zoneName}`);
    currentZone.current = zoneName;
  };
  
  // Check character position and update zone
  useFrame(() => {
    // Only check every 30 frames (0.5 seconds at 60fps)
    frameCount.current++;
    if (frameCount.current % 30 !== 0) return;
    
    if (!GameState.characterPosition) return;
    
    const charZ = GameState.characterPosition.z;
    
    // Determine which zone we should be in
    let targetZone = 'stage1';
    
    if (charZ >= 210) {
      targetZone = 'stage4';
    } else if (charZ >= 160) {
      targetZone = 'stage3';
    } else if (charZ >= 102) {
      targetZone = 'stage2';
    }
    
    // Only update if zone changed
    if (targetZone !== currentZone.current) {
      console.log(`Character Z: ${charZ.toFixed(1)} - Switching from ${currentZone.current} to ${targetZone}`);
      activateZone(targetZone);
    }
  });
  
  return null;
};