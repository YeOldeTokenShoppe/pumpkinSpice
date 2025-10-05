"use client";

import React, { useRef, useEffect, useState } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function SwoopingAngelEmojiSimple({ 
  scrollThreshold = 500,
  exitThreshold = 300, // When to exit if scrolling back up
  forwardExitThreshold = null, // When to exit if scrolling forward
  swoopFrom = "left", // "left", "right", "top"
  finalPosition = [0, 0, -10],
  isMobile = false,
  id = "swooping-angel"
}) {
  const { scene, animations } = useGLTF('/models/angelEmojiSwoop.glb');
  const { actions } = useAnimations(animations, scene);
  const groupRef = useRef();
  const [phase, setPhase] = useState('hidden'); // 'hidden', 'swooping', 'floating', 'exiting', 'disposed'
  const animationTime = useRef(0);
  const exitTime = useRef(0);
  
  useEffect(() => {
    console.log(`[${id}] Component mounted, scene loaded:`, !!scene);
  }, [id, scene]);
  
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

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkScroll = () => {
      const scrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
      
      // Enter animation
      if (scrollY > scrollThreshold && phase === 'hidden') {
        console.log(`Activating swoop for ${id} at scroll ${scrollY}`);
        setPhase('swooping');
      }
      
      // Exit animation when scrolling back up
      if (scrollY < exitThreshold && phase === 'floating') {
        console.log(`Exiting ${id} - scroll back up detected at ${scrollY}`);
        setPhase('exiting');
        exitTime.current = 0; // Reset exit timer
      }
      
      // Forward exit animation (optional)
      if (forwardExitThreshold && scrollY > forwardExitThreshold && phase === 'floating') {
        console.log(`Forward exit ${id} - continuing scroll detected at ${scrollY}`);
        setPhase('exiting');
        exitTime.current = 0;
      }
      
      // Re-enter only if scrolling back below threshold then above again
      if (scrollY < scrollThreshold && phase === 'disposed') {
        console.log(`Reset ${id} to hidden - scroll below threshold at ${scrollY}`);
        setPhase('hidden');
        animationTime.current = 0; // Reset animation timer
      }
    };

    // Check immediately on mount
    checkScroll();
    
    // Then listen for scroll
    window.addEventListener('scroll', checkScroll);
    return () => window.removeEventListener('scroll', checkScroll);
  }, [scrollThreshold, exitThreshold, forwardExitThreshold, phase, id]);

  useFrame((state, delta) => {
    if (!groupRef.current) {
      console.log(`[${id}] No groupRef in useFrame`);
      return;
    }
    
    const scale = isMobile ? 1.5 : 2.5;
    
    if (phase === 'swooping') {
      if (animationTime.current === 0) {
        console.log(`[${id}] Starting swoop animation`);
      }
      animationTime.current += delta * 2; // Animation speed
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
        console.log(`[${id}] Swoop complete, switching to floating`);
        setPhase('floating');
      }
    } else if (phase === 'floating') {
      // Gentle floating animation
      const time = state.clock.elapsedTime;
      groupRef.current.position.y = finalPosition[1] + Math.sin(time * 2) * 0.5;
      groupRef.current.rotation.z = Math.sin(time * 1.5) * 0.1;
      groupRef.current.scale.setScalar(scale);
      
      // Billboard effect - face camera
      const camera = state.camera;
      groupRef.current.lookAt(camera.position);
    } else if (phase === 'exiting') {
      // Exit animation - fall down and fade
      exitTime.current += delta * 2;
      const t = Math.min(exitTime.current, 1);
      
      // Fall down with acceleration
      groupRef.current.position.y = finalPosition[1] - (t * t * 15); // Quadratic fall
      
      // Spin while falling
      groupRef.current.rotation.y += delta * 5;
      groupRef.current.rotation.x += delta * 3;
      
      // Shrink
      const shrinkScale = scale * (1 - t * 0.8);
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
      // Hidden state (initial)
      groupRef.current.visible = false;
      return;
    }
    
    groupRef.current.visible = true;
  });

  return (
    <group ref={groupRef}>
      <primitive object={scene} />
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
  id = "swooping-devil"
}) {
  const { scene, animations } = useGLTF('/models/devilEmojiSwoop.glb');
  const { actions } = useAnimations(animations, scene);
  const groupRef = useRef();
  const [phase, setPhase] = useState('hidden'); // 'hidden', 'swooping', 'floating', 'exiting', 'disposed'
  const animationTime = useRef(0);
  const exitTime = useRef(0);
  
  useEffect(() => {
    console.log(`[${id}] Component mounted, scene loaded:`, !!scene);
  }, [id, scene]);
  
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

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkScroll = () => {
      const scrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
      
      // Enter animation
      if (scrollY > scrollThreshold && phase === 'hidden') {
        console.log(`Activating swoop for ${id} at scroll ${scrollY}`);
        setPhase('swooping');
      }
      
      // Exit animation when scrolling back up
      if (scrollY < exitThreshold && phase === 'floating') {
        console.log(`Exiting ${id} - scroll back up detected at ${scrollY}`);
        setPhase('exiting');
        exitTime.current = 0; // Reset exit timer
      }
      
      // Forward exit animation (optional)
      if (forwardExitThreshold && scrollY > forwardExitThreshold && phase === 'floating') {
        console.log(`Forward exit ${id} - continuing scroll detected at ${scrollY}`);
        setPhase('exiting');
        exitTime.current = 0;
      }
      
      // Re-enter only if scrolling back below threshold then above again
      if (scrollY < scrollThreshold && phase === 'disposed') {
        console.log(`Reset ${id} to hidden - scroll below threshold at ${scrollY}`);
        setPhase('hidden');
        animationTime.current = 0; // Reset animation timer
      }
    };

    // Check immediately on mount
    checkScroll();
    
    // Then listen for scroll
    window.addEventListener('scroll', checkScroll);
    return () => window.removeEventListener('scroll', checkScroll);
  }, [scrollThreshold, exitThreshold, forwardExitThreshold, phase, id]);

  useFrame((state, delta) => {
    if (!groupRef.current) {
      console.log(`[${id}] No groupRef in useFrame`);
      return;
    }
    
    const scale = isMobile ? 1.5 : 2.5;
    
    if (phase === 'swooping') {
      if (animationTime.current === 0) {
        console.log(`[${id}] Starting swoop animation`);
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
        console.log(`[${id}] Swoop complete, switching to floating`);
        setPhase('floating');
      }
    } else if (phase === 'floating') {
      // Gentle floating animation (opposite phase from angel)
      const time = state.clock.elapsedTime;
      groupRef.current.position.y = finalPosition[1] + Math.sin(time * 2 + Math.PI) * 0.5;
      groupRef.current.rotation.z = Math.sin(time * 1.5 + Math.PI) * 0.1;
      groupRef.current.scale.setScalar(scale);
      
      // Billboard effect
      const camera = state.camera;
      groupRef.current.lookAt(camera.position);
    } else {
      // Hidden state
      groupRef.current.visible = false;
      return;
    }
    
    groupRef.current.visible = true;
  });

  return (
    <group ref={groupRef}>
      <primitive object={scene} />
    </group>
  );
}