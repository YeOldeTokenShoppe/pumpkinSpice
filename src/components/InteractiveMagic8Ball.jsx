import React, { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

export default function InteractiveMagic8Ball({ scene }) {
  const { camera } = useThree();
  const [ballObject, setBallObject] = useState(null);
  const [ballMesh, setBallMesh] = useState(null);
  const [dieObject, setDieObject] = useState(null);
  const [isActive, setIsActive] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const shakeTimeRef = useRef(0);
  const originalMaterialRef = useRef(null);
  
  // Find the ball and die objects in the scene
  useEffect(() => {
    if (scene) {
      // Find the ball mesh
      const ball = scene.getObjectByName('ball');
      
      if (ball) {
        console.log('InteractiveMagic8Ball: Found ball:', ball);
        setBallObject(ball);
        
        // Process the ball and its children
        let die = null;
        ball.traverse((child) => {
          console.log('Ball child:', child.name, child.type);
          
          // The die is a child of the ball
          if (child.name === 'd20') {
            die = child;
            console.log('InteractiveMagic8Ball: Found d20 as child of ball:', die);
            
            // Make sure the die and its children are visible
            child.traverse((subChild) => {
              if (subChild.isMesh) {
                console.log('Die mesh found:', subChild.name, 'visible:', subChild.visible);
                subChild.visible = true;
                // Make the die bright blue and highly visible
                if (subChild.material) {
                  subChild.material = new THREE.MeshStandardMaterial({
                    color: 0x0066ff,  // Bright blue color
                    emissive: 0x00aaff,  // Brighter blue emissive glow
                    emissiveIntensity: 1.0,  // Maximum glow
                    roughness: 0.1,  // Very shiny surface
                    metalness: 0.8,  // More metallic
                    side: THREE.DoubleSide  // Render both sides
                  });
                  // Store reference for animation
                  subChild.userData.originalEmissiveIntensity = 1.0;
                }
              }
            });
          }
        });
        
        setDieObject(die);
        
        // Make the ball and all its children identifiable for clicks
        ball.traverse((child) => {
          child.userData.isMagic8Ball = true;
          // Store reference to ball mesh
          if (child.isMesh && child.name === 'ball') {
            setBallMesh(child);
            // Store original material
            originalMaterialRef.current = child.material.clone();
            console.log('Stored original ball material');
          }
        });
      }
    }
  }, [scene]);
  
  const toggleBall = () => {
    if (!ballMesh) return;
    
    if (!isActive) {
      console.log('Activating Magic 8-Ball - making transparent');
      setIsActive(true);
      
      // Make ball very transparent to see the die
      ballMesh.material = new THREE.MeshPhysicalMaterial({
        color: 0x111111,
        opacity: 0.05,  // Almost invisible
        transparent: true,
        roughness: 0,
        metalness: 0.1,
        side: THREE.DoubleSide,
        depthWrite: false
      });
      
      // After a short delay, shake it
      setTimeout(() => {
        shakeBall();
      }, 500);
    } else {
      console.log('Deactivating Magic 8-Ball - restoring material');
      setIsActive(false);
      setIsShaking(false);
      
      // Restore original material
      if (originalMaterialRef.current) {
        ballMesh.material = originalMaterialRef.current.clone();
      }
    }
  };
  
  // Shake animation
  const shakeBall = () => {
    if (!isActive || !dieObject) return;
    console.log('Shaking Magic 8-Ball die');
    setIsShaking(true);
    shakeTimeRef.current = 3; // Shake for 3 seconds
    
    setTimeout(() => {
      setIsShaking(false);
      console.log('Shake complete');
      // Show a random face of the die
      if (dieObject) {
        const randomRotation = [
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2
        ];
        dieObject.rotation.set(...randomRotation);
      }
    }, 3000);
  };
  
  // Animation loop
  useFrame((state, delta) => {
    // Shaking animation for the die
    if (isShaking && shakeTimeRef.current > 0 && dieObject) {
      shakeTimeRef.current -= delta;
      
      // Rotate the die inside rapidly
      dieObject.rotation.x += (Math.random() - 0.5) * 0.8;
      dieObject.rotation.y += (Math.random() - 0.5) * 0.8;
      dieObject.rotation.z += (Math.random() - 0.5) * 0.8;
      
      // Pulse the die's emissive for dramatic effect
      dieObject.traverse((child) => {
        if (child.isMesh && child.material) {
          const pulse = Math.sin(state.clock.elapsedTime * 10) * 0.5 + 0.5;
          child.material.emissiveIntensity = 0.5 + pulse * 1.5;
        }
      });
      
      // Also shake the ball slightly for effect
      if (ballObject) {
        const shakeIntensity = 0.03;
        ballObject.position.x += (Math.random() - 0.5) * shakeIntensity;
        ballObject.position.y += (Math.random() - 0.5) * shakeIntensity;
        ballObject.position.z += (Math.random() - 0.5) * shakeIntensity;
      }
    } else if (dieObject && !isShaking && isActive) {
      // Slowly settle the die rotation
      dieObject.rotation.x *= 0.92;
      dieObject.rotation.y *= 0.92;
      dieObject.rotation.z *= 0.92;
      
      // Return emissive to normal
      dieObject.traverse((child) => {
        if (child.isMesh && child.material) {
          child.material.emissiveIntensity = 1.0;
        }
      });
    }
    
    // Return ball to original position when not shaking
    if (ballObject && !isShaking) {
      ballObject.position.x *= 0.9;
      ballObject.position.y *= 0.9;
      ballObject.position.z *= 0.9;
    }
  });
  
  // Set up the global toggle function
  useEffect(() => {
    window.toggleMagic8Ball = toggleBall;
    window.handleMagic8BallClick = (event) => {
      // Check if the clicked object is part of the ball
      let current = event.object;
      while (current) {
        if (current === ballObject || current.name === 'ball') {
          toggleBall();
          return;
        }
        current = current.parent;
      }
    };
    
    return () => {
      delete window.toggleMagic8Ball;
      delete window.handleMagic8BallClick;
    };
  }, [ballObject, ballMesh, isActive]);
  
  return null;
}