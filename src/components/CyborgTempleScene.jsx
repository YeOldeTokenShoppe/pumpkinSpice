import { useEffect, useRef, useState, memo } from "react";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import * as THREE from "three";
import { useThree, useFrame } from "@react-three/fiber";



function CyborgTempleScene({ 
  onLoad, 
  position = [0, -4, 0],
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
  isPlaying = false,
}) {
  const groupRef = useRef();
  const { scene } = useThree();
  const hasLoadedRef = useRef(false);
  const mixerRef = useRef();
  const actionsRef = useRef({});
  const danceTimeoutRef = useRef(null);
  const slowdownIntervalRef = useRef(null);

  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    const gltfLoader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath("/draco/");
    gltfLoader.setDRACOLoader(dracoLoader);

    console.log('Loading MaryTraderScene_extraClothes.glb...');
    
    gltfLoader.load("/models/MaryTraderScene_extraClothes.glb", (gltf) => {
      console.log('✓ MaryTraderScene_extraClothes.glb loaded successfully');
      
      const templeScene = gltf.scene;
      
      // Create an anchor group for positioning
      const anchorGroup = new THREE.Group();
      anchorGroup.position.set(...position);
      anchorGroup.rotation.set(...rotation);
      anchorGroup.scale.set(...scale);
      
      // Add the temple scene to the anchor group
      anchorGroup.add(templeScene);
      
      // Create and store the animation mixer
      const mixer = new THREE.AnimationMixer(templeScene);
      mixerRef.current = mixer;

      // Play specific animations based on character
      if (gltf.animations.length > 0) {
        // Store all actions for later use
        gltf.animations.forEach((animation) => {
          const animName = animation.name;
          const action = mixer.clipAction(animation);
          actionsRef.current[animName] = action;
        });
        
        // Play initial animations
        gltf.animations.forEach((animation) => {
          const animName = animation.name;
          const action = actionsRef.current[animName];
          
          // Check which character this animation belongs to based on suffix
          if (animName === 'TYPE1') {
            // Play TYPE animation for the first character (no suffix)
            action.play();
            console.log(`Playing TYPE animation: ${animation.name}`);
          } else if (animName === 'HaloRotation') {
            // Play HaloRotation animation
            action.play();
            console.log(`Playing HaloRotation animation: ${animation.name}`);
          } else if (animName === 'Idle.001' || animName === 'Idle.002' || animName === 'Idle.003') {
            // Play idle animations with different time offsets
            
            // Set different starting times based on animation name
            if (animName === 'Idle.001') {
              action.time = Math.random() * action.getClip().duration; // Random offset
            } else if (animName === 'Idle.002') {
              action.time = action.getClip().duration * 0.33; // Start 1/3 through
            } else if (animName === 'Idle.003') {
              action.time = action.getClip().duration * 0.66; // Start 2/3 through
            }
            
            action.play();
            console.log(`Playing idle animation: ${animation.name} with offset ${action.time}`);
          }
        });
      }
      
      // Create grid ground
      const gridHelper = new THREE.GridHelper(50, 50, 0x00ff41, 0x00ff41);
      gridHelper.material.opacity = 0.3;
      gridHelper.material.transparent = true;
      gridHelper.position.y = 0; // Position the grid below the scene
      anchorGroup.add(gridHelper);
      
      // Add the anchor group to the scene
      scene.add(anchorGroup);
      
      // Store reference for cleanup
      if (groupRef.current) {
        groupRef.current = anchorGroup;
      }
      
      
      // Call onLoad callback if provided
      if (onLoad) {
        setTimeout(() => {
          onLoad();
        }, 100);
      }
    }, 
    (progress) => {
      console.log('Loading progress:', (progress.loaded / progress.total * 100) + '%');
    },
    (error) => {
      console.error('Error loading MaryTraderScene_extraClothes.glb:', error);
      // Still call onLoad even if there's an error, so the page doesn't hang
      if (onLoad) {
        setTimeout(() => {
          onLoad();
        }, 100);
      }
    });

    // Cleanup function
    return () => {
      if (groupRef.current) {
        // Remove from scene
        scene.remove(groupRef.current);
        
        // Dispose of materials and geometries
        groupRef.current.traverse((child) => {
          if (child.geometry) {
            child.geometry.dispose();
          }
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(material => material.dispose());
            } else {
              child.material.dispose();
            }
          }
        });
      }
    };
  }, [scene, position, rotation, scale, onLoad]);

  // Handle dance animation switching based on music playing state
  useEffect(() => {
    if (!actionsRef.current || Object.keys(actionsRef.current).length === 0) return;
    
    const actions = actionsRef.current;
    
    // Clear any pending dance timeout
    if (danceTimeoutRef.current) {
      clearTimeout(danceTimeoutRef.current);
      danceTimeoutRef.current = null;
    }

    // Log available animations to help identify dance animations
    console.log('[CyborgTempleScene] Switching animations. isPlaying:', isPlaying);
    console.log('[CyborgTempleScene] Available animations:', Object.keys(actions));
    
    if (isPlaying) {
      console.log('[CyborgTempleScene] Music started, characters will start dancing in 2 seconds...');
      
      // Clear any existing timeouts/intervals
      if (danceTimeoutRef.current) {
        clearTimeout(danceTimeoutRef.current);
        danceTimeoutRef.current = null;
      }
      if (slowdownIntervalRef.current) {
        clearInterval(slowdownIntervalRef.current);
        slowdownIntervalRef.current = null;
      }
      
      // Keep TYPE animation running for the first character
      if (actions['TYPE1'] && !actions['TYPE1'].isRunning()) {
        actions['TYPE1'].play();
      }
      
      // Delay the dance animations by 2 seconds
      danceTimeoutRef.current = setTimeout(() => {
        console.log('[CyborgTempleScene] Starting dance animations after delay...');
        
        console.log('[CyborgTempleScene] Starting blend transition from idle to dance...');
        
        // Start dance animations with zero weight and blend them in
        ['Dance.001', 'Dance.002', 'Dance.003'].forEach((danceAnim) => {
          if (actions[danceAnim]) {
            actions[danceAnim].reset();
            actions[danceAnim].timeScale = 1.0; // Reset to normal speed
            actions[danceAnim].setEffectiveWeight(0); // Start with zero weight
            
            // Set different starting times based on animation name
            if (danceAnim === 'Dance.001') {
              actions[danceAnim].time = Math.random() * actions[danceAnim].getClip().duration; // Random offset
            } else if (danceAnim === 'Dance.002') {
              actions[danceAnim].time = actions[danceAnim].getClip().duration * 0.33; // Start 1/3 through
            } else if (danceAnim === 'Dance.003') {
              actions[danceAnim].time = actions[danceAnim].getClip().duration * 0.66; // Start 2/3 through
            }
            
            actions[danceAnim].play();
            console.log(`✅ Starting dance animation: ${danceAnim} with zero weight`);
          }
        });
        
        // Crossfade from idle to dance over 1 second
        const crossfadeDuration = 1.0; // 1 second crossfade
        ['Idle.001', 'Idle.002', 'Idle.003'].forEach((idleAnim, index) => {
          const danceAnim = ['Dance.001', 'Dance.002', 'Dance.003'][index];
          if (actions[idleAnim] && actions[danceAnim]) {
            actions[idleAnim].crossFadeTo(actions[danceAnim], crossfadeDuration, true);
            console.log(`✅ Crossfading from ${idleAnim} to ${danceAnim} over ${crossfadeDuration}s`);
          }
        });
      }, 2000); // 2 second delay
      
    } else {
      // Gradually slow down and stop dance animations
      console.log('[CyborgTempleScene] Music stopped, characters will gradually slow down dancing...');
      
      // Clear any pending timeouts/intervals
      if (danceTimeoutRef.current) {
        clearTimeout(danceTimeoutRef.current);
        danceTimeoutRef.current = null;
      }
      if (slowdownIntervalRef.current) {
        clearInterval(slowdownIntervalRef.current);
        slowdownIntervalRef.current = null;
      }
      
      // Start the gradual slowdown process
      let currentSpeed = 1.0;
      const slowdownDuration = 2000; // 2 seconds to slow down
      const intervalTime = 50; // Update every 50ms for smooth transition
      const speedDecrement = 1.0 / (slowdownDuration / intervalTime); // Calculate how much to decrease each interval
      
      slowdownIntervalRef.current = setInterval(() => {
        currentSpeed -= speedDecrement;
        
        if (currentSpeed <= 0) {
          // Stop the slowdown and blend to idle animations
          clearInterval(slowdownIntervalRef.current);
          slowdownIntervalRef.current = null;
          
          console.log('[CyborgTempleScene] Starting blend transition from dance to idle...');
          
          // Start idle animations and blend them in
          ['Idle.001', 'Idle.002', 'Idle.003'].forEach((idleAnim) => {
            if (actions[idleAnim]) {
              actions[idleAnim].reset();
              actions[idleAnim].setEffectiveWeight(0); // Start with zero weight
              
              // Set different starting times based on animation name
              if (idleAnim === 'Idle.001') {
                actions[idleAnim].time = Math.random() * actions[idleAnim].getClip().duration; // Random offset
              } else if (idleAnim === 'Idle.002') {
                actions[idleAnim].time = actions[idleAnim].getClip().duration * 0.33; // Start 1/3 through
              } else if (idleAnim === 'Idle.003') {
                actions[idleAnim].time = actions[idleAnim].getClip().duration * 0.66; // Start 2/3 through
              }
              
              actions[idleAnim].play();
              console.log(`✅ Starting idle animation: ${idleAnim} with zero weight`);
            }
          });
          
          // Crossfade from dance to idle over 1 second
          const crossfadeDuration = 1.0; // 1 second crossfade
          ['Dance.001', 'Dance.002', 'Dance.003'].forEach((danceAnim, index) => {
            const idleAnim = ['Idle.001', 'Idle.002', 'Idle.003'][index];
            if (actions[danceAnim] && actions[idleAnim]) {
              actions[danceAnim].crossFadeTo(actions[idleAnim], crossfadeDuration, true);
              console.log(`✅ Crossfading from ${danceAnim} to ${idleAnim} over ${crossfadeDuration}s`);
            }
          });
        } else {
          // Gradually slow down dance animations
          ['Dance.001', 'Dance.002', 'Dance.003'].forEach(danceAnim => {
            if (actions[danceAnim] && actions[danceAnim].isRunning()) {
              actions[danceAnim].timeScale = Math.max(0.1, currentSpeed); // Don't go below 0.1 to avoid stopping mid-slowdown
            }
          });
        }
      }, intervalTime);
    }
  }, [isPlaying]);

  // Animation loop
  useFrame((_, delta) => {
    if (mixerRef.current) {
      mixerRef.current.update(delta);
    }
  });

  return null; // This component doesn't render JSX, it manipulates the Three.js scene directly
}

export default memo(CyborgTempleScene);