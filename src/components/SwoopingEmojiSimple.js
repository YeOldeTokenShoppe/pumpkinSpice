"use client";

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Main angel emoji component
export function SwoopingAngelEmojiSimple({ 
  scrollThreshold = 500,
  exitThreshold = 300, // When to exit if scrolling back up
  forwardExitThreshold = null, // When to exit if scrolling forward
  swoopFrom = "left", // "left", "right", "top"
  finalPosition = [0, 0, -10],
  isMobile = false,
  id = "swooping-angel",
  modelPath = '/models/angelEmojiSwoop.glb', // Allow custom model path
  chaseExitThreshold = null, // Add this prop but default to null
  chaseDelay = null, // Time in seconds after floating to start chasing
  triggerExit = false, // Not used in angel, but needed for consistency
  appearImmediately = false // Skip scroll check and appear right away
}) {
  // console.log(`[${id}] Component initializing with scrollThreshold:`, scrollThreshold, 'finalPosition:', finalPosition, 'swoopFrom:', swoopFrom, 'modelPath:', modelPath, 'appearImmediately:', appearImmediately);
  const { scene, animations } = useGLTF(modelPath);
  
  // No need to clone anymore since we're using different models
  const clonedScene = scene;
  
  const { actions } = useAnimations(animations, clonedScene || scene);
  const groupRef = useRef();
  const [phase, setPhase] = useState('hidden'); // 'hidden', 'swooping', 'floating', 'exiting', 'disposed'
  const animationTime = useRef(0);
  const exitTime = useRef(0);
  const floatingTime = useRef(0); // Track time spent floating for chase delay
  const hoverCallbackFired = useRef(false); // Not used in angel, but referenced in shared code
  const hasTriggered = useRef(false); // Track if animation has been triggered once
  
  // useEffect(() => {
  //   console.log(`[${id}] Component mounted, scene loaded:`, !!scene);
  //   if (scene) {
  //     console.log(`[${id}] Scene object:`, scene);
  //     console.log(`[${id}] Scene children:`, scene.children);
  //   }
  // }, [id, scene]);
  
  useEffect(() => {
    // Play animations
    if (animations && animations.length > 0) {
      animations.forEach((clip) => {
        if (actions[clip.name]) {
          actions[clip.name].play();
        }
      });
    }

    // Enable shadows
    if (scene) {
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
    }
  }, [animations, actions, scene]);
  
  // Effect to handle external trigger for exit (devil only)
  useEffect(() => {
    if (triggerExit && phase === 'floating') {
      // console.log(`[${id}] External trigger received, starting exit`);
      setPhase('exiting');
      exitTime.current = 0;
    }
  }, [triggerExit, phase, id]);
  
  // Effect to handle immediate appearance (chase angel only)
  useEffect(() => {
    // Only apply this logic to the chase angel, not regular angels
    if (id === 'overlay-angel-chase') {
      // console.log(`[${id}] appearImmediately check: appearImmediately=${appearImmediately}, phase=${phase}`);
      if (appearImmediately && phase === 'hidden') {
        // console.log(`[${id}] TRIGGERING IMMEDIATE APPEARANCE!`);
        setPhase('swooping');
        animationTime.current = 0;
      } else if (appearImmediately === false && phase !== 'hidden' && phase !== 'disposed') {
        // Reset when appearImmediately becomes false (but only if explicitly false, not undefined)
        // console.log(`[${id}] Resetting to hidden (appearImmediately became false)`);
        setPhase('hidden');
        animationTime.current = 0;
        exitTime.current = 0;
        floatingTime.current = 0;
      }
    }
  }, [appearImmediately, phase, id]);

  useEffect(() => {
    // Skip scroll listener only for chase angel when it's set to appear immediately
    if (id === 'overlay-angel-chase' && appearImmediately) {
      // console.log(`[${id}] Skipping scroll listener - appearing immediately`);
      return;
    }
    
    // console.log(`[${id}] Setting up scroll listener`);
    if (typeof window === 'undefined') {
      console.log(`[${id}] Window undefined, skipping scroll setup`);
      return;
    }

    const checkScroll = () => {
      const scrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
      
      // Enter animation - only trigger once per component instance
      if ((scrollY > scrollThreshold || (id === 'overlay-angel-chase' && scrollThreshold === 0)) && !hasTriggered.current) {
        if (phase === 'hidden') {
          // console.log(`[${id}] Activating swoop at scroll ${scrollY} (threshold: ${scrollThreshold}) - ONE TIME ONLY`);
          setPhase('swooping');
          animationTime.current = 0; // Reset animation
          hasTriggered.current = true; // Mark as triggered, never trigger again
        }
      }
      
      // Exit animation when scrolling back up
      if (scrollY < exitThreshold && phase === 'floating') {
        // console.log(`Exiting ${id} - scroll back up detected at ${scrollY}`);
        setPhase('exiting');
        exitTime.current = 0; // Reset exit timer
      }
      
      // Chase exit animation (for devil being chased by angel) - only in devil component
      if (typeof chaseExitThreshold !== 'undefined' && chaseExitThreshold && scrollY > chaseExitThreshold && phase === 'floating') {
        // console.log(`[${id}] Being chased! Triggering exit at ${scrollY}`);
        setPhase('exiting');
        exitTime.current = 0;
      }
      
      // Forward exit animation (optional)
      if (forwardExitThreshold && scrollY > forwardExitThreshold) {
        if (phase === 'floating') {
          // console.log(`Forward exit ${id} - continuing scroll detected at ${scrollY}`);
          setPhase('exiting');
          exitTime.current = 0;
        } else if (phase === 'hidden' && id === 'overlay-angel-weave') {
          // If we loaded the page already past the exit threshold, skip to disposed
          // console.log(`[${id}] Page loaded past exit threshold, skipping to disposed`);
          setPhase('disposed');
        }
      }
      
      // ONE-TIME ANIMATION: No re-entering - once disposed, stay disposed for memory optimization
    };

    // Check immediately on mount, but with a small delay to ensure proper initialization
    setTimeout(() => {
      // console.log(`[${id}] Initial scroll check after mount`);
      checkScroll();
    }, 100);
    
    // Then listen for scroll
    window.addEventListener('scroll', checkScroll);
    return () => window.removeEventListener('scroll', checkScroll);
  }, [scrollThreshold, exitThreshold, forwardExitThreshold, chaseExitThreshold, phase, id]);

  useFrame((state, delta) => {
    if (!groupRef.current) {
      // console.log(`[${id}] No groupRef in useFrame`);
      return;
    }
    
    // Debug for overlay angel - commented out to reduce noise
    // if (id === 'overlay-angel-weave' && state.clock.elapsedTime % 1 < 0.016) {
    //   console.log(`[${id}] useFrame - Phase: ${phase}, Visible: ${groupRef.current.visible}, Position:`, groupRef.current.position.toArray());
    // }
    
    const scale = isMobile ? 2 : 4;  // Same as behind angel
    
    if (phase === 'swooping') {
      // Ensure visibility during swoop
      groupRef.current.visible = true;
      
      if (animationTime.current === 0) {
        // console.log(`[${id}] Starting swoop animation - making visible`);
      }
      animationTime.current += delta * 1; // Animation speed
      const t = Math.min(animationTime.current, 1); // Clamp to 0-1
      
      // Starting positions based on swoop direction
      const startPositions = {
        left: [-20, 5, 20],
        right: [20, 5, 20],
        top: [finalPosition[0], 20, 20]
      };
      
      const start = startPositions[swoopFrom] || startPositions.left;
      
      // Cubic bezier interpolation for smooth swoop
      const easeOut = t * (2 - t); // Simple ease-out
      
      groupRef.current.position.x = start[0] + (finalPosition[0] - start[0]) * easeOut;
      groupRef.current.position.y = start[1] + (finalPosition[1] - start[1]) * easeOut;
      groupRef.current.position.z = start[2] + (finalPosition[2] - start[2]) * easeOut;
      
      // Scale animation
      const scaleProgress = Math.sin(t * Math.PI); // Grow then shrink slightly
      groupRef.current.scale.setScalar(scale * (0.5 + scaleProgress * 0.7));
      
      // Rotation during swoop
      groupRef.current.rotation.y = t * Math.PI * 2;
      
      if (t >= 1) {
        // console.log(`[${id}] Swoop complete, switching to floating`);
        setPhase('floating');
        floatingTime.current = 0; // Reset floating timer when entering floating phase
      }
    } else if (phase === 'floating') {
      // Track floating time for chase trigger or auto-disposal
      floatingTime.current += delta;
      
      // Auto-dispose after 3 seconds of floating for memory optimization
      if (floatingTime.current >= 3.0) {
        // console.log(`[${id}] Auto-disposing after 3 seconds of floating for memory optimization`);
        setPhase('disposed');
        return; // Exit early
      }
      
      // Check if we should start chasing (for chase angel)
      if (chaseDelay !== null && floatingTime.current >= chaseDelay) {
        // console.log(`[${id}] Chase delay reached (${chaseDelay}s), starting chase!`);
        setPhase('exiting');
        exitTime.current = 0;
        floatingTime.current = 0; // Reset
      }
      
      // Debug for overlay angel
      if (id === 'overlay-angel-weave' && state.clock.elapsedTime % 2 < 0.016) {
        // console.log(`[${id}] FLOATING - Visible: ${groupRef.current.visible}, Position:`, groupRef.current.position.toArray(), 'Scale:', scale);
      }
      
      // Gentle floating animation
      const time = state.clock.elapsedTime;
      groupRef.current.position.y = finalPosition[1] + Math.sin(time * 2) * 0.5;
      groupRef.current.rotation.z = Math.sin(time * 1.5) * 0.1;
      groupRef.current.scale.setScalar(scale);
      
      // Make sure it's visible
      groupRef.current.visible = true;
      
      // Billboard effect - face camera
      const camera = state.camera;
      groupRef.current.lookAt(camera.position);
    } else if (phase === 'exiting') {
      // Exit animation - fly out
      exitTime.current += delta * 2;
      const t = Math.min(exitTime.current, 1);
      
      // Special chase exit for angel following devil
      const isChasingAngel = id === 'overlay-angel-chase';
      
      if (isChasingAngel) {
        // Follow the devil's exit path with slight delay
        const turnPhase = Math.min(t * 1.5, 1); // Slightly faster turn
        const exitPhase = Math.max(0, (t - 0.2) * 1.25); // Start exiting slightly earlier
        
        // Turn to follow devil (to the right now)
        groupRef.current.rotation.y = Math.PI / 6 * turnPhase; // 30 degrees to the right
        
        // Exit following the devil to the RIGHT, staying slightly behind
        groupRef.current.position.x = finalPosition[0] + (exitPhase * exitPhase * 35); // Exit RIGHT
        groupRef.current.position.y = finalPosition[1] + 1; // Slightly higher than devil
        groupRef.current.position.z = finalPosition[2] - (exitPhase * 2); // Less z movement
        
        // Add some wing flapping rotation
        groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 10) * 0.1;
      } else {
        // Normal exit for other angels
        // Fly out in opposite direction from entry
        const exitDirection = swoopFrom === 'left' ? 1 : swoopFrom === 'right' ? -1 : 0;
        const easeIn = t * t; // Accelerate as it leaves
        
        // Fly out horizontally with slight upward arc
        groupRef.current.position.x = finalPosition[0] + (exitDirection * 30 * easeIn);
        groupRef.current.position.y = finalPosition[1] + (Math.sin(t * Math.PI * 0.5) * 3); // Slight upward arc
        groupRef.current.position.z = finalPosition[2] + (t * 10); // Move away from camera
        
        // Spin while flying away
        groupRef.current.rotation.y += delta * 3;
      }
      
      // Shrink gradually
      const shrinkScale = scale * (1 - t * 0.6);
      groupRef.current.scale.setScalar(shrinkScale);
      
      if (t >= 1) {
        // console.log(`[${id}] Exit complete, disposing`);
        setPhase('disposed');
      }
    } else if (phase === 'disposed') {
      // Fully hidden after exit
      groupRef.current.visible = false;
      return;
    } else {
      // Hidden state (initial)
      if (id === 'overlay-angel-weave') {
        // console.log(`[${id}] Setting visible=false in hidden state`);
      }
      groupRef.current.visible = false;
      return;
    }
    
    // Make visible for all other phases
    if (!groupRef.current.visible && id === 'overlay-angel-weave') {
      // console.log(`[${id}] Setting visible=true for phase: ${phase}`);
    }
    groupRef.current.visible = true;
  });

  return (
    <group ref={groupRef} renderOrder={10}>
      <primitive object={clonedScene || scene} />
    </group>
  );
}

export function SwoopingDevilEmojiSimple({ 
  scrollThreshold = 550,
  exitThreshold = 300,
  forwardExitThreshold = null,
  swoopFrom = "right",
  finalPosition = [0, 0, -10],
  isMobile = false,
  id = "swooping-devil",
  modelPath = '/models/devilEmojiSwoop.glb', // Allow custom model path
  chaseExitThreshold = null, // Trigger exit when being chased
  hoverDuration = null, // Time to hover before triggering next action
  onHoverComplete = null, // Callback when hover duration is complete
  triggerExit = false, // External trigger to force exit
  appearImmediately = false // Skip scroll check and appear right away (not used in devil but for consistency)
}) {
  const { scene, animations } = useGLTF(modelPath);
  const { actions } = useAnimations(animations, scene);
  const groupRef = useRef();
  const [phase, setPhase] = useState('hidden'); // 'hidden', 'swooping', 'floating', 'exiting', 'disposed'
  const animationTime = useRef(0);
  const exitTime = useRef(0);
  const floatingTime = useRef(0); // Track time spent floating for hover duration
  const hoverCallbackFired = useRef(false); // Ensure callback only fires once
  const hasTriggered = useRef(false); // Track if animation has been triggered once
  
  // useEffect(() => {
  //   console.log(`[${id}] Component mounted, scene loaded:`, !!scene);
  //   if (scene) {
  //     console.log(`[${id}] Scene object:`, scene);
  //     console.log(`[${id}] Scene children:`, scene.children);
  //   }
  // }, [id, scene]);
  
  useEffect(() => {
    // Play animations
    if (animations && animations.length > 0) {
      const idleAnimation = animations.find(clip => clip.name === 'Armature|Idle') || animations[0];
      if (idleAnimation && actions[idleAnimation.name]) {
        actions[idleAnimation.name].play();
      }
    }

    // Enable shadows
    if (scene) {
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
    }
  }, [animations, actions, scene]);
  
  // Effect to handle external trigger for exit (devil only)
  useEffect(() => {
    if (triggerExit && phase === 'floating') {
      // console.log(`[${id}] External trigger received, starting exit`);
      setPhase('exiting');
      exitTime.current = 0;
    }
  }, [triggerExit, phase, id]);
  
  // Effect to handle immediate appearance (chase angel only)
  useEffect(() => {
    // Only apply this logic to the chase angel, not regular angels
    if (id === 'overlay-angel-chase') {
      // console.log(`[${id}] appearImmediately check: appearImmediately=${appearImmediately}, phase=${phase}`);
      if (appearImmediately && phase === 'hidden') {
        // console.log(`[${id}] TRIGGERING IMMEDIATE APPEARANCE!`);
        setPhase('swooping');
        animationTime.current = 0;
      } else if (appearImmediately === false && phase !== 'hidden' && phase !== 'disposed') {
        // Reset when appearImmediately becomes false (but only if explicitly false, not undefined)
        // console.log(`[${id}] Resetting to hidden (appearImmediately became false)`);
        setPhase('hidden');
        animationTime.current = 0;
        exitTime.current = 0;
        floatingTime.current = 0;
      }
    }
  }, [appearImmediately, phase, id]);

  useEffect(() => {
    // Skip scroll listener only for chase angel when it's set to appear immediately
    if (id === 'overlay-angel-chase' && appearImmediately) {
      // console.log(`[${id}] Skipping scroll listener - appearing immediately`);
      return;
    }
    
    // console.log(`[${id}] Setting up scroll listener`);
    if (typeof window === 'undefined') {
      console.log(`[${id}] Window undefined, skipping scroll setup`);
      return;
    }

    const checkScroll = () => {
      const scrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
      
      // Debug for overlay angel specifically when near threshold
      if (id === 'overlay-angel-weave' && scrollY > 900 && scrollY < 1100) {
        console.log(`[${id}] Near threshold - scrollY: ${scrollY}, phase: ${phase}, threshold: ${scrollThreshold}`);
      }
      
      // Enter animation - only trigger once per component instance
      if ((scrollY > scrollThreshold || (id === 'overlay-angel-chase' && scrollThreshold === 0)) && !hasTriggered.current) {
        if (phase === 'hidden') {
          // console.log(`[${id}] Activating swoop at scroll ${scrollY} (threshold: ${scrollThreshold}) - ONE TIME ONLY`);
          setPhase('swooping');
          animationTime.current = 0; // Reset animation
          hasTriggered.current = true; // Mark as triggered, never trigger again
        }
      }
      
      // Exit animation when scrolling back up
      if (scrollY < exitThreshold && phase === 'floating') {
        // console.log(`Exiting ${id} - scroll back up detected at ${scrollY}`);
        setPhase('exiting');
        exitTime.current = 0; // Reset exit timer
      }
      
      // Chase exit animation (for devil being chased by angel) - only in devil component
      if (typeof chaseExitThreshold !== 'undefined' && chaseExitThreshold && scrollY > chaseExitThreshold && phase === 'floating') {
        // console.log(`[${id}] Being chased! Triggering exit at ${scrollY}`);
        setPhase('exiting');
        exitTime.current = 0;
      }
      
      // Forward exit animation (optional)
      if (forwardExitThreshold && scrollY > forwardExitThreshold) {
        if (phase === 'floating') {
          // console.log(`Forward exit ${id} - continuing scroll detected at ${scrollY}`);
          setPhase('exiting');
          exitTime.current = 0;
        } else if (phase === 'hidden' && id === 'overlay-angel-weave') {
          // If we loaded the page already past the exit threshold, skip to disposed
          // console.log(`[${id}] Page loaded past exit threshold, skipping to disposed`);
          setPhase('disposed');
        }
      }
      
      // ONE-TIME ANIMATION: No re-entering - once disposed, stay disposed for memory optimization
    };

    // Check immediately on mount, but with a small delay to ensure proper initialization
    setTimeout(() => {
      // console.log(`[${id}] Initial scroll check after mount`);
      checkScroll();
    }, 100);
    
    // Then listen for scroll
    window.addEventListener('scroll', checkScroll);
    return () => window.removeEventListener('scroll', checkScroll);
  }, [scrollThreshold, exitThreshold, forwardExitThreshold, chaseExitThreshold, phase, id]);

  useFrame((state, delta) => {
    if (!groupRef.current) {
      // console.log(`[${id}] No groupRef in useFrame`);
      return;
    }
    
    const scale = isMobile ? 2 : 5;
    
    if (phase === 'swooping') {
      // Ensure visibility during swoop
      groupRef.current.visible = true;
      
      if (animationTime.current === 0) {
        // console.log(`[${id}] Starting swoop animation`);
      }
      animationTime.current += delta * 1.8; // Slightly slower than angel
      const t = Math.min(animationTime.current, 1);
      
      // Starting positions based on swoop direction
      const startPositions = {
        left: [-20, 5, 20],
        right: [20, 5, 20],
        bottom: [finalPosition[0], -20, 20]
      };
      
      const start = startPositions[swoopFrom] || startPositions.right;
      
      // Different easing for devil
      const easeOut = 1 - Math.pow(1 - t, 3); // Cubic ease-out
      
      groupRef.current.position.x = start[0] + (finalPosition[0] - start[0]) * easeOut;
      groupRef.current.position.y = start[1] + (finalPosition[1] - start[1]) * easeOut;
      groupRef.current.position.z = start[2] + (finalPosition[2] - start[2]) * easeOut;
      
      // Scale with bounce
      const scaleProgress = t < 0.5 
        ? 2 * t * t 
        : 1 - Math.pow(-2 * t + 2, 2) / 2;
      groupRef.current.scale.setScalar(scale * (0.3 + scaleProgress * 0.9));
      
      // Rotation during swoop (opposite direction)
      groupRef.current.rotation.y = -t * Math.PI * 2.5;
      
      if (t >= 1) {
        // console.log(`[${id}] Swoop complete, switching to floating`);
        setPhase('floating');
        floatingTime.current = 0; // Reset floating timer
        hoverCallbackFired.current = false; // Reset callback flag
      }
    } else if (phase === 'floating') {
      // Track floating time for hover duration or auto-disposal
      floatingTime.current += delta;
      
      // Auto-dispose after 3 seconds of floating for memory optimization
      if (floatingTime.current >= 3.0) {
        // console.log(`[${id}] Auto-disposing after 3 seconds of floating for memory optimization`);
        setPhase('disposed');
        return; // Exit early
      }
      
      // Debug logging for devil hover
      if (id === 'overlay-devil-end' && Math.floor(floatingTime.current) !== Math.floor(floatingTime.current - delta)) {
        // console.log(`[${id}] Floating time: ${floatingTime.current.toFixed(1)}s / ${hoverDuration}s`);
      }
      
      // Check if we should fire the hover complete callback
      if (hoverDuration !== null && !hoverCallbackFired.current && floatingTime.current >= hoverDuration) {
        // console.log(`[${id}] Hover duration reached (${hoverDuration}s), firing callback`);
        hoverCallbackFired.current = true;
        if (onHoverComplete) {
          // console.log(`[${id}] Calling onHoverComplete callback`);
          onHoverComplete();
        } else {
          console.log(`[${id}] No onHoverComplete callback provided`);
        }
      }
      
      // Gentle floating animation (opposite phase from angel)
      const time = state.clock.elapsedTime;
      groupRef.current.position.y = finalPosition[1] + Math.sin(time * 2 + Math.PI) * 0.5;
      groupRef.current.rotation.z = Math.sin(time * 1.5 + Math.PI) * 0.1;
      groupRef.current.scale.setScalar(scale);
      
      // Ensure visibility during floating
      groupRef.current.visible = true;
      
      // Billboard effect
      const camera = state.camera;
      groupRef.current.lookAt(camera.position);
    } else if (phase === 'exiting') {
      // Ensure visibility during exit
      groupRef.current.visible = true;
      
      // Exit animation - fly out (devil style)
      exitTime.current += delta * 2.5; // Faster exit than angel
      const t = Math.min(exitTime.current, 1);
      
      // Special chase exit for devil being chased
      const isBeingChased = id === 'overlay-devil-end';
      
      if (isBeingChased) {
        // Turn 45 degrees to the right first, then exit straight right
        const turnPhase = Math.min(t * 2, 1); // First half of animation for turning
        const exitPhase = Math.max(0, (t - 0.3) * 1.4); // Start exiting after 30% through
        
        // Turn 45 degrees (π/4 radians) to the RIGHT
        groupRef.current.rotation.y = Math.PI / 4 * turnPhase;
        
        // Exit straight to the RIGHT
        groupRef.current.position.x = finalPosition[0] + (exitPhase * exitPhase * 40); // Accelerating RIGHT
        groupRef.current.position.y = finalPosition[1]; // Keep same height
        groupRef.current.position.z = finalPosition[2] - (exitPhase * 3); // Slight movement away
      } else {
        // Normal exit for other devils
        const exitDirection = swoopFrom === 'right' ? -1 : swoopFrom === 'left' ? 1 : swoopFrom === 'bottom' ? 0 : -1;
        const easeIn = Math.pow(t, 1.5);
        
        groupRef.current.position.x = finalPosition[0] + (exitDirection * 35 * easeIn);
        groupRef.current.position.y = finalPosition[1] + (Math.sin(t * Math.PI) * 5);
        groupRef.current.position.z = finalPosition[2] - (t * 8);
        
        groupRef.current.rotation.y += delta * 6;
        groupRef.current.rotation.z += delta * 2;
      }
      
      // Shrink with different curve
      const shrinkScale = scale * Math.max(0.1, 1 - t);
      groupRef.current.scale.setScalar(shrinkScale);
      
      if (t >= 1) {
        console.log(`[${id}] Exit complete, disposing`);
        setPhase('disposed');
      }
    } else if (phase === 'disposed') {
      // Fully hidden after exit
      groupRef.current.visible = false;
      return;
    } else {
      // Hidden state
      groupRef.current.visible = false;
      return;
    }
  });

  return (
    <group ref={groupRef} renderOrder={10}>
      <primitive object={scene} />
    </group>
  );
}