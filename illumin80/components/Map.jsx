import { useAnimations, useGLTF, useKeyboardControls } from "@react-three/drei";
import { RigidBody, CapsuleCollider, CuboidCollider, TrimeshCollider, ConvexHullCollider } from "@react-three/rapier";
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState, useMemo } from "react";
import { Vector3, Quaternion, Box3 } from "three";
import * as THREE from "three";
import { GameState } from "../../src/lib/GameState";
import { useSnapshot } from "valtio";
import { useAudio } from "../../src/hooks/useAudio";

// Iridescent shader material creator
const createIridescentMaterial = (originalTexture) => {
  return new THREE.ShaderMaterial({
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      
      void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vViewPosition = -mvPosition.xyz;
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vViewPosition;

      uniform float time;
      uniform vec2 mouse;
      uniform sampler2D map;
      uniform bool hasTexture;

      void main() {
        // Calculate distance for fog
        float distance = length(vViewPosition);
        
        // Sample the original texture
        vec4 textureColor = hasTexture ? texture2D(map, vUv) : vec4(1.0);
        
        // If alpha is very low, discard the fragment entirely
        if (textureColor.a < 0.01) {
          discard;
        }
        
        // Create base gradient colors similar to the CSS refraction
        vec3 color1 = vec3(1.0, 0.4, 0.6); // Pink
        vec3 color2 = vec3(0.4, 1.0, 0.6); // Green  
        vec3 color3 = vec3(0.4, 0.6, 1.0); // Blue
        
        // Use view angle for iridescence
        vec3 viewDir = normalize(-vViewPosition);
        float fresnel = dot(viewDir, vNormal);
        
        // Subtle iridescent effect with smooth variation
        float waveX = sin(vUv.x * 3.0 + time * 0.5) * 0.5 + 0.5;
        float waveY = cos(vUv.y * 2.5 + time * 0.3) * 0.5 + 0.5;
        float waveTime = sin(time * 0.7) * 0.5 + 0.5;
        
        // Create smooth color transitions with multiple layers
        vec3 iridescent = mix(color1, color2, waveX);
        iridescent = mix(iridescent, color3, waveY);
        
        // Add fresnel-based color variation for viewing angle effect
        float fresnelEffect = pow(1.0 - abs(fresnel), 2.0);
        iridescent = mix(iridescent, color1 * 1.2, fresnelEffect * 0.3);
        
        // Subtle noise pattern for surface variation
        float noise = sin(vUv.x * 30.0) * sin(vUv.y * 30.0) * 0.05;
        
        // Blend with original texture more subtly
        float luminance = dot(textureColor.rgb, vec3(0.299, 0.587, 0.114));
        vec3 finalColor = mix(textureColor.rgb, iridescent, 0.4 + fresnelEffect * 0.2);
        finalColor += noise;
        
        // Apply fog attenuation (matching scene fog: "#4a9fbb", near 5, far 35)
        float fogNear = 5.0;
        float fogFar = 35.0;
        float fogFactor = smoothstep(fogNear, fogFar, distance);
        vec3 fogColor = vec3(0.29, 0.62, 0.73); // #4a9fbb converted to RGB
        finalColor = mix(finalColor, fogColor, fogFactor);
        
        // Use the original texture's alpha channel
        gl_FragColor = vec4(finalColor, textureColor.a);
      }
    `,
    uniforms: {
      time: { value: 0 },
      mouse: { value: new THREE.Vector2(0, 0) },
      map: { value: originalTexture },
      hasTexture: { value: originalTexture !== null }
    },
    transparent: true,
    side: THREE.DoubleSide,
    alphaTest: 0.01
  });
};


// Component for animating coins with spinning motion - DISTANCE CULLED
const AnimatedCoin = ({ coinMesh, index, onCollect }) => {
  const coinRef = useRef();
  const ANIMATION_DISTANCE = 15.0; // Only animate within 15M
  
  useFrame((state) => {
    if (!coinMesh || !coinMesh.visible || !GameState.characterPosition) return;
    
    // Distance check - skip expensive animations if too far
    const worldPos = new Vector3();
    coinMesh.getWorldPosition(worldPos);
    const distanceSquared = GameState.characterPosition.distanceToSquared(worldPos);
    const cullDistanceSquared = ANIMATION_DISTANCE * ANIMATION_DISTANCE;
    
    if (distanceSquared > cullDistanceSquared) return; // Skip animation if too far
    
    // Only animate if within range
    const rotationSpeed = 3; // Rotations per second
    coinMesh.rotation.y = state.clock.elapsedTime * rotationSpeed;
    
    // Add a gentle up-and-down floating motion
    const floatSpeed = 2;
    const floatAmplitude = 0.1;
    const originalY = coinMesh.userData.originalY || coinMesh.position.y;
    if (!coinMesh.userData.originalY) {
      coinMesh.userData.originalY = originalY;
    }
    coinMesh.position.y = originalY + Math.sin(state.clock.elapsedTime * floatSpeed) * floatAmplitude;
  });
  
  return null; // This component only provides animation logic
};

// Component for animating diamonds with spinning and hovering motion - DISTANCE CULLED
const AnimatedDiamond = ({ diamondMesh, index }) => {
  const originalPosition = useRef(null);
  const ANIMATION_DISTANCE = 15.0; // Only animate within 15M
  
  useFrame((state) => {
    if (!diamondMesh || !diamondMesh.visible || !GameState.characterPosition) return;
    
    // Distance check - skip expensive animations if too far
    const worldPos = new Vector3();
    diamondMesh.getWorldPosition(worldPos);
    const distanceSquared = GameState.characterPosition.distanceToSquared(worldPos);
    const cullDistanceSquared = ANIMATION_DISTANCE * ANIMATION_DISTANCE;
    
    if (distanceSquared > cullDistanceSquared) return; // Skip animation if too far
    
    // Store original position on first run
    if (!originalPosition.current) {
      originalPosition.current = {
        x: diamondMesh.position.x,
        y: diamondMesh.position.y,
        z: diamondMesh.position.z
      };
    }
    
    const time = state.clock.elapsedTime;
    
    // Only animate if within range
    const spinSpeed = 2.0; // Rotations per second
    diamondMesh.rotation.y = time * spinSpeed;
    
    // Light hovering animation - gentle up and down movement
    const hoverSpeed = 1.8; // Speed of hover cycle
    const hoverAmplitude = 0.15; // Height of hover movement
    const hoverOffset = Math.sin(time * hoverSpeed + index * 0.5) * hoverAmplitude;
    
    diamondMesh.position.x = originalPosition.current.x;
    diamondMesh.position.y = originalPosition.current.y + hoverOffset;
    diamondMesh.position.z = originalPosition.current.z;
  });
  
  return null; // This component only provides animation logic
};


// Helper function to check if an object is a child of another
const isChildOf = (child, parent) => {
  let current = child.parent;
  while (current) {
    if (current === parent) return true;
    current = current.parent;
  }
  return false;
};

// Door controller that targets doorMaster for animations
const DoorController = ({ obstacleScene, obstacleAnimations, platformScene }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wasDoorTogglePressed = useRef(false);
  const doorMasterRef = useRef();
  const [doorAnimations, setDoorAnimations] = useState({ door1: null, door2: null });
  const [doorMaster, setDoorMaster] = useState(null);
  const [door1Object, setDoor1Object] = useState(null);
  const [door2Object, setDoor2Object] = useState(null);
  const { loadSound, playSound } = useAudio();
  
  // Use animations with the doorMaster object as the target
  const { actions } = useAnimations(obstacleAnimations || [], doorMasterRef);
  
  // Helper function to check if an object is a child of another
  const isChildOf = (child, parent) => {
    let current = child.parent;
    while (current) {
      if (current === parent) return true;
      current = current.parent;
    }
    return false;
  };
  
  // Load door sound effect
  useEffect(() => {
    loadSound('doorStone', '/sounds/stone.mp3');
  }, [loadSound]);

  useEffect(() => {
    // Find the single doorMaster object in the obstacle scene
    let foundDoorMaster = null;
    
    if (obstacleScene) {
      console.log(`🔍 Searching for doorMaster in obstacle scene...`);
      obstacleScene.traverse((child) => {
        if (child.name === 'doorMaster' && !foundDoorMaster) {
          foundDoorMaster = child;
          doorMasterRef.current = child; // Set ref for animations
          console.log(`🚪 Found doorMaster object:`, {
            name: child.name,
            type: child.type,
            children: child.children.length,
            position: child.position,
            visible: child.visible,
            uuid: child.uuid
          });
          
          // Log children to debug and store door references
          if (child.children) {
            child.children.forEach(door => {
              console.log(`  └── Door child: ${door.name} (type: ${door.type})`);
              if (door.name === 'door1') {
                setDoor1Object(door);
                console.log(`📍 Door1 position:`, door.position);
                console.log(`📍 Door1 world position:`, door.getWorldPosition(new THREE.Vector3()));
              } else if (door.name === 'door2') {
                setDoor2Object(door);
                console.log(`📍 Door2 position:`, door.position);
                console.log(`📍 Door2 world position:`, door.getWorldPosition(new THREE.Vector3()));
              }
            });
          }
        }
      });
      
      if (foundDoorMaster) {
        console.log(`👀 Using doorMaster: ${foundDoorMaster.uuid}`);
        
        // Ensure doorMaster and its children are visible
        foundDoorMaster.visible = true;
        if (foundDoorMaster.children) {
          foundDoorMaster.children.forEach(child => {
            child.visible = true;
            if (child.children) {
              child.children.forEach(grandchild => {
                grandchild.visible = true;
              });
            }
          });
        }
        
        // Hide ALL other door objects that aren't part of doorMaster in BOTH scenes
        console.log(`🔍 Searching for duplicate doors to hide...`);
        
        // Check obstacle scene
        obstacleScene.traverse((child) => {
          const nameLower = child.name ? child.name.toLowerCase() : '';
          
          // Check if this is a door-related object
          if (nameLower.includes('door')) {
            // Check if it's NOT the doorMaster or its children
            if (child !== foundDoorMaster && !isChildOf(child, foundDoorMaster)) {
              console.log(`🙈 Hiding duplicate door in obstacles: "${child.name}" (type: ${child.type}, parent: ${child.parent?.name})`);
              child.visible = false;
              
              // Also hide all children of this duplicate door
              if (child.children) {
                child.traverse((subChild) => {
                  subChild.visible = false;
                });
              }
            } else {
              console.log(`✅ Keeping door: "${child.name}" (part of doorMaster)`);
            }
          }
        });
        
        // Also check platform scene for any door objects
        if (platformScene) {
          console.log(`🔍 Checking platform scene for doors...`);
          platformScene.traverse((child) => {
            const nameLower = child.name ? child.name.toLowerCase() : '';
            if (nameLower.includes('door')) {
              console.log(`🙈 Hiding door in platform: "${child.name}" (type: ${child.type})`);
              child.visible = false;
              
              // Hide all children
              if (child.children) {
                child.traverse((subChild) => {
                  subChild.visible = false;
                });
              }
            }
          });
        }
      }
    }
    
    setDoorMaster(foundDoorMaster);
  }, [obstacleScene, platformScene]);
  
  // Set up animations once actions are available
  useEffect(() => {
    if (!actions || !doorMaster) return;

    console.log(`🚪 Door animations available:`, Object.keys(actions));
    
    const animations = {};
    
    // Find and initialize door1 animation (Action)
    if (actions['Action']) {
      const action = actions['Action'];
      action.reset();
      action.setLoop(THREE.LoopOnce);
      action.clampWhenFinished = true;
      action.enabled = false;
      action.stop();
      animations.door1 = action;
      console.log(`✅ Found door1 animation: Action`);
    }
    
    // Find and initialize door2 animation (door2Action)
    if (actions['door2Action']) {
      const action = actions['door2Action'];
      action.reset();
      action.setLoop(THREE.LoopOnce);
      action.clampWhenFinished = true;
      action.enabled = false;
      action.stop();
      animations.door2 = action;
      console.log(`✅ Found door2 animation: door2Action`);
    }
    
    setDoorAnimations(animations);
    console.log(`🚪 Door controller ready - ${Object.keys(animations).length} animations found`);
  }, [actions, doorMaster]);

  useFrame(() => {
    const doorTogglePressed = GameState.doorTogglePressed;
    
    if (doorTogglePressed && !wasDoorTogglePressed.current) {
      wasDoorTogglePressed.current = true;
      const newIsOpen = !isOpen;
      setIsOpen(newIsOpen);
      
      console.log(`🚪 Door toggle - ${newIsOpen ? 'Opening' : 'Closing'} doors (doorMaster: ${!!doorMaster})`);
      
      // Play stone sound effect
      playSound('doorStone');
      
      if (doorAnimations.door1) {
        const clip1 = doorAnimations.door1.getClip();
        
        if (newIsOpen) {
          // Opening - play forward from start
          doorAnimations.door1.reset();
          doorAnimations.door1.enabled = true;
          doorAnimations.door1.timeScale = 1;
          doorAnimations.door1.time = 0;
          doorAnimations.door1.play();
        } else {
          // Closing - play backward from end
          doorAnimations.door1.enabled = true;
          doorAnimations.door1.paused = false;
          doorAnimations.door1.timeScale = -1;
          doorAnimations.door1.time = clip1.duration;
          doorAnimations.door1.play();
        }
        
        console.log(`🎬 ${newIsOpen ? 'Opening' : 'Closing'} door1 (Action)`);
      }
      
      if (doorAnimations.door2) {
        const clip2 = doorAnimations.door2.getClip();
        
        if (newIsOpen) {
          // Opening - play forward from start
          doorAnimations.door2.reset();
          doorAnimations.door2.enabled = true;
          doorAnimations.door2.timeScale = 1;
          doorAnimations.door2.time = 0;
          doorAnimations.door2.play();
        } else {
          // Closing - play backward from end
          doorAnimations.door2.enabled = true;
          doorAnimations.door2.paused = false;
          doorAnimations.door2.timeScale = -1;
          doorAnimations.door2.time = clip2.duration;
          doorAnimations.door2.play();
        }
        
        console.log(`🎬 ${newIsOpen ? 'Opening' : 'Closing'} door2 (door2Action)`);
      }
    }
    
    if (!doorTogglePressed) {
      wasDoorTogglePressed.current = false;
    }
  });

  // Return door collision components
  return (
    <>
      {door1Object && <DoorCollider doorObject={door1Object} isOpen={isOpen} doorName="door1" />}
      {door2Object && <DoorCollider doorObject={door2Object} isOpen={isOpen} doorName="door2" />}
    </>
  );
};

// Separate component for door collision that properly tracks the door position
const DoorCollider = ({ doorObject, isOpen, doorName }) => {
  const [worldPos, setWorldPos] = useState(new THREE.Vector3());
  
  useEffect(() => {
    if (doorObject) {
      // Update world matrix and get position
      doorObject.updateWorldMatrix(true, false);
      const pos = new THREE.Vector3();
      doorObject.getWorldPosition(pos);
      setWorldPos(pos);
      console.log(`🚧 ${doorName} collider position:`, pos);
    }
  }, [doorObject, doorName]);
  
  if (isOpen) {
    return null;
  }
  
  return (
    <RigidBody type="fixed" position={[worldPos.x, worldPos.y, worldPos.z]}>
      <CuboidCollider args={[1.8, 3.5, 0.4]} position={[0, 1.75, 0]} />
    </RigidBody>
  );
};

// Component for animating the warlock circle with continuous Y-axis rotation - DISTANCE CULLED
const AnimatedWarlockCircle = ({ warlockCircleMesh }) => {
  const ANIMATION_DISTANCE = 30.0; // Larger distance for important visual element
  
  useFrame((state) => {
    if (!warlockCircleMesh || !GameState.characterPosition) return;
    
    // Distance check - skip expensive animations if too far
    const worldPos = new Vector3();
    warlockCircleMesh.getWorldPosition(worldPos);
    const distanceSquared = GameState.characterPosition.distanceToSquared(worldPos);
    const cullDistanceSquared = ANIMATION_DISTANCE * ANIMATION_DISTANCE;
    
    if (distanceSquared > cullDistanceSquared) return; // Skip animation if too far
    
    // Continuous rotation around Y-axis
    const rotationSpeed = 0.2; // Adjust speed as needed (1.0 = one full rotation per second)
    warlockCircleMesh.rotation.z = state.clock.elapsedTime * rotationSpeed;
  });
  
  return null; // This component only provides animation logic
};

// Component for animating the Corazon object with gentle hover - DISTANCE CULLED
const AnimatedCorazon = ({ corazonMesh }) => {
  const originalPosition = useRef(null);
  const ANIMATION_DISTANCE = 20.0; // Animate within 20M for important object
  
  useFrame((state) => {
    if (!corazonMesh || !GameState.characterPosition) return;
    
    // Distance check - skip expensive animations if too far
    const worldPos = new Vector3();
    corazonMesh.getWorldPosition(worldPos);
    const distanceSquared = GameState.characterPosition.distanceToSquared(worldPos);
    const cullDistanceSquared = ANIMATION_DISTANCE * ANIMATION_DISTANCE;
    
    if (distanceSquared > cullDistanceSquared) return; // Skip animation if too far
    
    // Store original position on first run
    if (!originalPosition.current) {
      originalPosition.current = {
        x: corazonMesh.position.x,
        y: corazonMesh.position.y,
        z: corazonMesh.position.z
      };
    }
    
    const time = state.clock.elapsedTime;
    
    // Gentle hover animation - slow up and down movement
    const hoverSpeed = 1.2; // Slow, gentle speed
    const hoverAmplitude = 0.3; // Small movement range
    const hoverOffset = Math.sin(time * hoverSpeed) * hoverAmplitude;
    
    // Apply hover to Y position
    corazonMesh.position.x = originalPosition.current.x;
    corazonMesh.position.y = originalPosition.current.y + hoverOffset;
    corazonMesh.position.z = originalPosition.current.z;
  });
  
  return null; // This component only provides animation logic
};

// Component for animating fire flames with individual piece movement - DISTANCE CULLED
const AnimatedFire = ({ fireMesh, index }) => {
  const originalPositions = useRef(new window.Map());
  const debugLogged = useRef(false);
  const ANIMATION_DISTANCE = 15.0; // Only animate within 15M
  
  useFrame((state) => {
    if (!fireMesh || !GameState.characterPosition) return;
    
    // Distance check - skip expensive animations if too far
    const worldPos = new Vector3();
    fireMesh.getWorldPosition(worldPos);
    const distanceSquared = GameState.characterPosition.distanceToSquared(worldPos);
    const cullDistanceSquared = ANIMATION_DISTANCE * ANIMATION_DISTANCE;
    
    if (distanceSquared > cullDistanceSquared) return; // Skip animation if too far
    
    // Debug log once to see fire structure
    // if (!debugLogged.current) {
    //   console.log(`Fire ${index} structure:`, fireMesh.children.map(child => ({
    //     name: child.name,
    //     type: child.type,
    //     isMesh: child.isMesh,
    //     children: child.children?.length || 0
    //   })));
      
    //   // Log deeper structure for fire-container
    //   fireMesh.children.forEach(child => {
    //     if (child.name.toLowerCase().includes('fire-container') || child.name.toLowerCase().includes('fire_container')) {
    //       console.log(`Fire-container children:`, child.children.map(subChild => ({
    //         name: subChild.name,
    //         type: subChild.type,
    //         isMesh: subChild.isMesh
    //       })));
    //     }
    //   });
      
    //   debugLogged.current = true;
    // }
    
    // Animate individual flame pieces in 2 groups - simple up/down motion only
    fireMesh.children.forEach((child, childIndex) => {
      const childName = child.name.toLowerCase();
      
      // Animate fire_piece_001 through fire_piece_007 (skip fire_base)
      if (childName.includes('fire_piece_') && !childName.includes('fire_base')) {
        // The fire pieces are direct meshes in fire_master
        if (child.isMesh) {
          const time = state.clock.elapsedTime;
          
          // Store original position if not stored  
          if (!originalPositions.current.has(child.uuid)) {
            originalPositions.current.set(child.uuid, {
              x: child.position.x,
              y: child.position.y,
              z: child.position.z
            });
          }
          
          const original = originalPositions.current.get(child.uuid);
          
          // Extract piece number from name correctly
          let pieceNumber = (childIndex % 7) + 1; // Default fallback: 1-7
          const pieceMatch = childName.match(/fire_piece_(\d+)/);
          if (pieceMatch) {
            const fullNumber = parseInt(pieceMatch[1]);
            if (fullNumber <= 7) {
              pieceNumber = fullNumber;
            } else {
              // For suffixed versions, get the first 3 digits
              const numberString = pieceMatch[1];
              if (numberString.length >= 3) {
                const firstThreeDigits = parseInt(numberString.substring(0, 3));
                if (firstThreeDigits >= 1 && firstThreeDigits <= 7) {
                  pieceNumber = firstThreeDigits;
                }
              }
            }
          }
          
          // Simple 2-group system: pieces 1-3=group1, pieces 4-7=group2
          const isGroup1 = pieceNumber <= 3;
          const groupSpeed = isGroup1 ? 3.5 : 4.2; // Different speeds for each group
          const groupPhase = (index * 2) + (isGroup1 ? 0 : 1.5); // Different phases for each group
          
          // Simple vertical up/down motion only
          const verticalMotion = Math.sin(time * groupSpeed + groupPhase) * 0.06;
          child.position.y = original.y + verticalMotion;
          
          // Keep original x and z positions (no horizontal movement)
          child.position.x = original.x;
          child.position.z = original.z;
        }
      }
    });
  });
  
  return null; // This component only provides animation logic
};

const AnimatedObstacleCollider = ({ obstacleMesh, index }) => {
  const rbRef = useRef();
  const [showDebug] = useState(true);
  const frameCount = useRef(0);
  const originalPosition = useRef(null);
  const isSpindle = obstacleMesh.userData?.isSpindle;
  const isObstacle2 = obstacleMesh.userData?.isObstacle2;
  const isObstacle006 = obstacleMesh.userData?.isObstacle006;
  const isPendulum = obstacleMesh.userData?.isPendulum;
  const isCorazon = obstacleMesh.userData?.isCorazon;
  const ANIMATION_DISTANCE = 25.0; // Larger distance for dangerous obstacles
  
  // Access Valtio GameState for collision handling
  const gameState = useSnapshot(GameState);
  
  useFrame((state) => {
    if (!obstacleMesh || !rbRef.current || !GameState.characterPosition) return;
    
    // Distance check - skip expensive animations if too far
    const worldPos = new Vector3();
    obstacleMesh.getWorldPosition(worldPos);
    const distanceSquared = GameState.characterPosition.distanceToSquared(worldPos);
    const cullDistanceSquared = ANIMATION_DISTANCE * ANIMATION_DISTANCE;
    
    if (distanceSquared > cullDistanceSquared) {
      // Still update collider position for distant objects, but skip animation
      const quaternion = new Quaternion();
      const position = new Vector3();
      const scale = new Vector3();
      obstacleMesh.matrixWorld.decompose(position, quaternion, scale);
      rbRef.current.setNextKinematicTranslation(position);
      rbRef.current.setNextKinematicRotation(quaternion);
      return;
    }
    
    // Only do expensive animations if within range
    frameCount.current++;
    
    if (isSpindle) {
      // Three.js animation - smooth continuous rotation
      const rotationSpeed = 0.3; // Adjust speed as needed
      obstacleMesh.rotation.y = state.clock.elapsedTime * rotationSpeed;
    }
    
    if (isObstacle2) {
      // Continuous 360-degree rotation for obstacle_2_001 objects
      const rotationSpeed = 1.0; // Adjust speed as needed (1.0 = one full rotation per second)
      obstacleMesh.rotation.y = state.clock.elapsedTime * rotationSpeed;
    }
    
    if (isObstacle006) {
      // Continuous 360-degree rotation for obstacle_006 objects
      const rotationSpeed = 0.8; // Slightly different speed for variety
      obstacleMesh.rotation.y = state.clock.elapsedTime * rotationSpeed;
    }
    
    if (isPendulum) {
      // Pendulum animation - back and forth rotation on z-axis
      const pendulumSpeed = 1.5; // Speed of pendulum swing
      const pendulumAngle = 0.6; // Maximum swing angle in radians (about 34 degrees)
      const time = state.clock.elapsedTime;
      
      // Add phase offset based on obstacle name to desynchronize pendulums
      let phaseOffset = 0;
      if (obstacleMesh.name.includes('004') || obstacleMesh.name.includes('.004')) {
        phaseOffset = Math.PI; // Half cycle offset (180 degrees)
      }
      
      // Use sine wave for smooth pendulum motion with phase offset
      const newRotation = Math.sin(time * pendulumSpeed + phaseOffset) * pendulumAngle;
      obstacleMesh.rotation.z = newRotation;
    }
    
    
    // Update obstacle's world matrix
    obstacleMesh.updateMatrixWorld(true);
    
    // Get the obstacle's rotation and position
    const quaternion = new Quaternion();
    const position = new Vector3();
    const scale = new Vector3();
    obstacleMesh.matrixWorld.decompose(position, quaternion, scale);
    
    // Update collider transform to match animated mesh
    rbRef.current.setNextKinematicTranslation(position);
    rbRef.current.setNextKinematicRotation(quaternion);
  });
  
  const handleCollision = ({ other }) => {
    // console.log(`🔍 Collision detected! Other rigidBody:`, other.rigidBody);
    // console.log(`🔍 Character RigidBody:`, GameState.characterRigidBody);
    // console.log(`🔍 RigidBodies match:`, GameState.characterRigidBody === other.rigidBody);
    
    if (other.rigidBodyObject?.name === 'character' || 
        GameState.characterRigidBody === other.rigidBody ||
        other.rigidBodyObject?.userData?.isCharacter) {
      let type = 'Hammer';
      if (isSpindle) type = 'Spindle';
      if (isObstacle2) type = 'Obstacle_2_001';
      if (isObstacle006) type = 'Obstacle_006';
      if (isPendulum) type = 'Pendulum';
      if (isCorazon) type = 'Corazon';
      // console.log(`💥 ${type} ${index} hit!`);
      
      // Apply knockback for all obstacles except Corazon
      if (!isCorazon && GameState.characterRigidBody) {
        const currentVel = GameState.characterRigidBody.linvel();
        const obstaclePos = new Vector3();
        obstacleMesh.getWorldPosition(obstaclePos);
        const knockbackDir = GameState.characterPosition.clone().sub(obstaclePos).normalize();
        
        const knockbackForce = 10;
        GameState.characterRigidBody.setLinvel({
          x: currentVel.x + knockbackDir.x * knockbackForce,
          y: Math.max(currentVel.y + 8, 8),
          z: currentVel.z + knockbackDir.z * knockbackForce
        }, true);
      }
      
      // Corazon collision - no knockback, just log interaction
      if (isCorazon) {
        console.log(`💖 Player touched the Corazon! (peaceful interaction)`);
      }
    } else {
      console.log(`❌ No match - not character collision`);
    }
  };
  
  if (isSpindle) {
    // Spindle with simplified collision using adjustable capsule colliders for each arm
    const armLength = 2.5; // Adjust this to make collision area smaller/larger
    const armRadius = 0.3; // Adjust this to make arms thicker/thinner
    
    return (
      <RigidBody
        ref={rbRef}
        type="kinematicPosition"
        colliders={false}
        onIntersectionEnter={handleCollision}
        sensor
      >
        {/* Simplified collision: Two perpendicular capsules forming a cross */}
        <CapsuleCollider 
          args={[armLength, armRadius]}
          rotation={[0, 0, Math.PI / 2]} // Horizontal arm
          position={[0, 0.5, 0]}
        />
        <CapsuleCollider 
          args={[armLength, armRadius]}
          rotation={[Math.PI / 2, 0, 0]} // Vertical arm (front-to-back)
          position={[0, 0.5, 0]}
        />
        
        {/* Debug visualization for spindle collision */}
        {/* {showDebug && (
          <>
            <mesh position={[0, 0.5, 0]} rotation={[0, 0, Math.PI / 2]}>
              <capsuleGeometry args={[armRadius, armLength * 2, 8, 16]} />
              <meshBasicMaterial color="red" opacity={0.3} transparent wireframe />
            </mesh>
            <mesh position={[0, 0.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <capsuleGeometry args={[armRadius, armLength * 2, 8, 16]} />
              <meshBasicMaterial color="red" opacity={0.3} transparent wireframe />
            </mesh>
          </>
        )} */}
      </RigidBody>
    );
  } else if (isObstacle2) {
    // Obstacle_2_001 with trimesh collision like the spindle
    return (
      <RigidBody
        ref={rbRef}
        type="kinematicPosition"
        colliders={false}
        onIntersectionEnter={handleCollision}
        sensor
      >
        {/* Trimesh colliders for each child mesh in the obstacle_2_001 group */}
        {obstacleMesh.children.map((childMesh, childIndex) => {
          if (childMesh.isMesh && childMesh.geometry) {
            return (
              <group key={childIndex}>
                <TrimeshCollider
                  args={[
                    childMesh.geometry.attributes.position.array,
                    childMesh.geometry.index ? childMesh.geometry.index.array : null
                  ]}
                  position={[childMesh.position.x, childMesh.position.y, childMesh.position.z]}
                  rotation={[childMesh.rotation.x, childMesh.rotation.y, childMesh.rotation.z]}
                  scale={[
                    childMesh.scale.x * 0.8, 
                    childMesh.scale.y * 0.8, 
                    childMesh.scale.z * 0.8
                  ]} // Scale down by 20% (multiply by 0.8)
                />
                
                {/* Debug visualization for trimesh - scaled to match collision */}
                {/* {showDebug && (
                  <mesh
                    geometry={childMesh.geometry}
                    position={[childMesh.position.x, childMesh.position.y, childMesh.position.z]}
                    rotation={[childMesh.rotation.x, childMesh.rotation.y, childMesh.rotation.z]}
                    scale={[
                      childMesh.scale.x * 0.8, 
                      childMesh.scale.y * 0.8, 
                      childMesh.scale.z * 0.8
                    ]} // Match the collision scale
                  >
                    <meshBasicMaterial color="yellow" opacity={0.3} transparent wireframe />
                  </mesh>
                )} */}
              </group>
            );
          }
          return null;
        })}
      </RigidBody>
    );
  } else if (isObstacle006) {
    // Obstacle_6_001 with trimesh collision like obstacle_2_001
    return (
      <RigidBody
        ref={rbRef}
        type="kinematicPosition"
        colliders={false}
        onIntersectionEnter={handleCollision}
        sensor
      >
        {/* Trimesh colliders for each child mesh in the obstacle_6_001 group */}
        {obstacleMesh.children.map((childMesh, childIndex) => {
          if (childMesh.isMesh && childMesh.geometry) {
            return (
              <group key={childIndex}>
                <TrimeshCollider
                  args={[
                    childMesh.geometry.attributes.position.array,
                    childMesh.geometry.index ? childMesh.geometry.index.array : null
                  ]}
                  position={[childMesh.position.x, childMesh.position.y, childMesh.position.z]}
                  rotation={[childMesh.rotation.x, childMesh.rotation.y, childMesh.rotation.z]}
                  scale={[
                    childMesh.scale.x * 0.8, 
                    childMesh.scale.y * 0.8, 
                    childMesh.scale.z * 0.8
                  ]} // Scale down by 20% like obstacle_2_001
                />
                
                {/* Debug visualization for trimesh - scaled to match collision */}
                {/* {showDebug && (
                  <mesh
                    geometry={childMesh.geometry}
                    position={[childMesh.position.x, childMesh.position.y, childMesh.position.z]}
                    rotation={[childMesh.rotation.x, childMesh.rotation.y, childMesh.rotation.z]}
                    scale={[
                      childMesh.scale.x * 0.8, 
                      childMesh.scale.y * 0.8, 
                      childMesh.scale.z * 0.8
                    ]} // Match the collision scale
                  >
                    <meshBasicMaterial color="green" opacity={0.3} transparent wireframe />
                  </mesh>
                )} */}
              </group>
            );
          }
          return null;
        })}
      </RigidBody>
    );
  } else if (isPendulum) {
    // Pendulum obstacles with trimesh collision
    return (
      <RigidBody
        ref={rbRef}
        type="kinematicPosition"
        colliders={false}
        onIntersectionEnter={handleCollision}
        sensor
      >
        {/* Trimesh colliders for each child mesh in the pendulum obstacle group */}
        {obstacleMesh.children.map((childMesh, childIndex) => {
          if (childMesh.isMesh && childMesh.geometry) {
            return (
              <group key={childIndex}>
                <TrimeshCollider
                  args={[
                    childMesh.geometry.attributes.position.array,
                    childMesh.geometry.index ? childMesh.geometry.index.array : null
                  ]}
                  position={[childMesh.position.x, childMesh.position.y, childMesh.position.z]}
                  rotation={[childMesh.rotation.x, childMesh.rotation.y, childMesh.rotation.z]}
                  scale={[
                    childMesh.scale.x * 0.8, 
                    childMesh.scale.y * 0.8, 
                    childMesh.scale.z * 0.8
                  ]} // Scale down by 20% like other obstacles
                />
                
                {/* Debug visualization for trimesh - scaled to match collision */}
                {/* {showDebug && (
                  <mesh
                    geometry={childMesh.geometry}
                    position={[childMesh.position.x, childMesh.position.y, childMesh.position.z]}
                    rotation={[childMesh.rotation.x, childMesh.rotation.y, childMesh.rotation.z]}
                    scale={[
                      childMesh.scale.x * 0.8, 
                      childMesh.scale.y * 0.8, 
                      childMesh.scale.z * 0.8
                    ]} // Match the collision scale
                  >
                    <meshBasicMaterial color="purple" opacity={0.3} transparent wireframe />
                  </mesh>
                )} */}
              </group>
            );
          }
          return null;
        })}
      </RigidBody>
    );
  } else if (isCorazon) {
    // Corazon collider - simple cuboid for heart-shaped object
    console.log(`💖 Creating Corazon collider for: ${obstacleMesh.name}`);
    return (
      <RigidBody
        ref={rbRef}
        type="kinematicPosition"
        colliders={false}
        onIntersectionEnter={handleCollision}
        sensor
      >
        {/* Simple cuboid collider for Corazon - positioned at object center */}
        <CuboidCollider 
          args={[1.0, 1.5, 1.0]} // [half-width, half-height, half-depth] - adjust as needed
          position={[0, 0, 0]} // Center relative to RigidBody position
        />
        
        {/* Debug visualization - always visible */}
        {/* <mesh position={[0, 0, 0]}>
          <boxGeometry args={[2.0, 3.0, 2.0]} />
          <meshBasicMaterial color="magenta" opacity={0.5} transparent wireframe />
        </mesh> */}
      </RigidBody>
    );
  } else {
    // Original hammer collider
    return (
      <RigidBody
        ref={rbRef}
        type="kinematicPosition"
        colliders={false}
        onCollisionEnter={handleCollision}
        sensor
      >
        <CapsuleCollider 
          args={[1.2, 0.4]}
          rotation={[0, 0, Math.PI / 2]}
        />
        
        {/* {showDebug && (
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <capsuleGeometry args={[0.4, 1.2, 8, 16]} />
            <meshBasicMaterial color="yellow" opacity={0.3} transparent wireframe />
          </mesh>
        )} */}
      </RigidBody>
    );
  }
};

// Alternative: Compound collider for more accurate hammer shape
const CompoundHammerCollider = ({ hammerMesh, index }) => {
  const rbRef = useRef();
  const [showDebug, setShowDebug] = useState(true);
  
  useFrame(() => {
    if (!hammerMesh || !rbRef.current) return;
    
    hammerMesh.updateMatrixWorld(true);
    const position = new Vector3();
    const quaternion = new Quaternion();
    hammerMesh.matrixWorld.decompose(position, quaternion, new Vector3());
    
    rbRef.current.setNextKinematicTranslation(position);
    rbRef.current.setNextKinematicRotation(quaternion);
  });
  
  // const handleCollision = () => {
  //   console.log(`💥 Compound Hammer ${index} hit!`);
  //   // Same knockback logic as above
  // };
  
  return (
    <RigidBody
      ref={rbRef}
      type="kinematicPosition"
      colliders={false}
      onCollisionEnter={handleCollision}
      sensor
    >
      {/* Handle of the hammer */}
      <CuboidCollider 
        args={[0.15, 1.5, 0.15]} // [half-width, half-height, half-depth]
        position={[0, 0, 0]} 
      />
      
      {/* Head of the hammer */}
      <CuboidCollider 
        args={[0.4, 0.4, 0.4]} 
        position={[0, 1.8, 0]} // Positioned at the top
      />
      
      {/* Debug visualization */}
      {/* {showDebug && (
        <>
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.3, 3, 0.3]} />
            <meshBasicMaterial color="orange" opacity={0.3} transparent wireframe />
          </mesh>
          <mesh position={[0, 1.8, 0]}>
            <boxGeometry args={[0.8, 0.8, 0.8]} />
            <meshBasicMaterial color="red" opacity={0.3} transparent wireframe />
          </mesh>
        </>
      )} */}
    </RigidBody>
  );
};

// Simplified Map component
export const Map = ({ model, onLoad, ...props }) => {
  const { scene: platformScene, animations: platformAnimations } = useGLTF(model); // Main platform
  const { scene: obstacleScene, animations } = useGLTF('/models/underworld3_obstacles.glb'); // Obstacles
  const obstacleGroup = useRef();
  const platformGroup = useRef();
  const [isLoaded, setIsLoaded] = useState(false);
  const { actions } = useAnimations(animations, obstacleGroup);
  const { actions: platformActions } = useAnimations(platformAnimations, platformGroup);
  const { loadSound, playSound } = useAudio();
  const [hammerMeshes, setHammerMeshes] = useState([]);
  const [collectibles, setCollectibles] = useState([]);
  const [coins, setCoins] = useState([]);
  const [fires, setFires] = useState([]);
  const [doors, setDoors] = useState([]);
  const [collectedItems, setCollectedItems] = useState(new Set());
  const [iridiscentMaterials, setIridiscentMaterials] = useState([]);
  const [warlockCircle, setWarlockCircle] = useState(null);
  const [corazonObject, setCorazonObject] = useState(null);
  const [corazonParts, setCorazonParts] = useState([]);
  const [, get] = useKeyboardControls();
  
  // Valtio GameState access
  const gameState = useSnapshot(GameState);
  
  // Handle door toggle input
  useFrame(() => {
    const doorTogglePressed = get().doorToggle;
    
    // Debug: Log when door toggle state changes
    if (doorTogglePressed !== GameState.doorTogglePressed) {
      console.log(`🎹 Door toggle key state changed: ${GameState.doorTogglePressed} → ${doorTogglePressed}`);
    }
    
    GameState.doorTogglePressed = doorTogglePressed;
  });
  
  // Check if both scenes are loaded
  useEffect(() => {
    if (platformScene && obstacleScene) {
      setIsLoaded(true);
      if (onLoad) {
        onLoad();
      }
    }
  }, [platformScene, obstacleScene, onLoad]);
  
  // Find obstacles in the obstacle scene
  useEffect(() => {
    if (!obstacleScene) return;
    
    const foundHammers = [];
    const foundCollectibles = [];
    const foundCoins = [];
    const foundDoors = [];
    let foundWarlockCircle = null;
    let foundCorazon = null;
    const foundCorazonParts = [];
    
    // Remove door search logs - doorMaster handles everything now
    obstacleScene.traverse((child) => {
      const name = child.name.toLowerCase();
      
      // Debug: Log spindle-related objects to see what's actually there
      if (child.name.includes('spindle')) {
        console.log(`🔍 Spindle-related object: "${child.name}" (type: ${child.type}, children: ${child.children?.length || 0})`);
      }
      
      // Look for Corazon object for hover animation
      if (child.name === 'Corazon' || child.name.toLowerCase() === 'corazon') {
        foundCorazon = child;
        console.log(`💖 Found Corazon object: ${child.name} (type: ${child.type})`);
        
        // Add Corazon to collision system
        foundHammers.push(child);
        child.userData.isCorazon = true;
        console.log(`💖 Added Corazon to collision system: ${child.name}`);
      }
      
      // Look for Corazon child objects (Object_8, Object_9, Object_10)
      if (child.name === 'Object_8' || child.name === 'Object_9' || child.name === 'Object_10') {
        foundCorazonParts.push({
          id: child.uuid,
          name: child.name,
          object: child
        });
        console.log(`💖 Found Corazon part: ${child.name} (type: ${child.type})`);
        
        if (!foundCorazon) {
          foundCorazon = child.parent; // Use the parent as the Corazon object
          console.log(`💖 Found Corazon parent via child ${child.name}, parent: ${child.parent?.name} (type: ${child.parent?.type})`);
        }
      }
      
      // Debug: Log objects that might be related to Corazon
      if (child.name.includes('Object_') || child.name.toLowerCase().includes('corazon') || child.name.toLowerCase().includes('heart')) {
        console.log(`🔍 Potential Corazon-related object: "${child.name}" (type: ${child.type}, parent: ${child.parent?.name})`);
      }
      
      // SPECIAL DEBUG: Look for our renamed pillars
      // if (child.name.includes('pillar_animated')) {
      //   console.log(`🔍 FOUND RENAMED PILLAR: "${child.name}" (type: ${child.type}, isMesh: ${child.isMesh})`);
      // }
      
      // Special debug for potential pendulum objects
      // if (child.name.includes('obstacle_1_0')) {
      //   console.log(`🔍 Potential pendulum object: "${child.name}" (type: ${child.type}, children: ${child.children?.length || 0})`);
      //   if (child.children && child.children.length > 0) {
      //     child.children.forEach((grandchild, i) => {
      //       console.log(`  └── Child ${i}: "${grandchild.name}" (type: ${grandchild.type})`);
      //     });
      //   }
      // }
      
      if (child.isMesh) {
        // Identify hammers - look for the new renamed objects
        if (name.includes('hammer1') || 
            name.includes('hammer2')) {
          
          // Store the hammer mesh
          foundHammers.push(child);
          
          // Mark for exclusion from static trimesh
          child.userData.excludeFromStatic = true;
          
          // console.log(`Found hammer: ${child.name}`);
        }
        
        // obstacle_2_001 objects are handled as Groups below, not individual meshes
      }
      
      // Look for the GROUP that contains the spinning obstacle, not individual meshes
      // Handle obstacle_spindle1, obstacle_spindle2, obstacle_spindle3, obstacle_spindle4
      if (child.type === 'Group' && (
           name === 'obstacle_spindle' ||
           name === 'obstacle_spindle1' ||
           name === 'obstacle_spindle2' ||
           name === 'obstacle_spindle3' ||
           name === 'obstacle_spindle4')) {
        foundHammers.push(child); // Track the animated GROUP
        child.userData.isSpindle = true;
        
        console.log(`✅ Found spinning group: ${child.name} with ${child.children.length} children`);
      }
      
      // Look for obstacle_2_001 GROUP objects (they are Groups, not individual meshes)
      if (child.type === 'Group' && name.includes('obstacle_2_001')) {
        foundHammers.push(child); // Track the animated GROUP
        child.userData.isObstacle2 = true;
        
        // console.log(`Found obstacle_2_001 group: ${child.name} with ${child.children.length} children`);
      }
      
      // Look for obstacle_6_001 GROUP objects (corrected naming pattern)
      if (child.type === 'Group' && name.includes('obstacle_6_001')) {
        foundHammers.push(child); // Track the animated GROUP
        child.userData.isObstacle006 = true;
        
        // console.log(`Found obstacle_6_001 group: ${child.name} with ${child.children.length} children`);
      }
      
      // Look for obstacle_1_001 parent GROUP objects for pendulum animation - try multiple patterns
      // Based on console logs: we're looking for Groups, but let's try broader matching
      if ((child.type === 'Group' || child.type === 'Object3D') && (
           name.includes('obstacle_1_001001') || 
           name.includes('obstacle_1_001002') ||
           name.includes('obstacle_1_001.001') || 
           name.includes('obstacle_1_001.002') ||
           name === 'obstacle_1_001001' ||
           name === 'obstacle_1_001002' ||
           name === 'obstacle_1_001.001' ||
           name === 'obstacle_1_001.002')) {
        foundHammers.push(child); // Track the animated GROUP
        child.userData.isPendulum = true;
        
        // console.log(`🎯 Found pendulum obstacle: ${child.name} with ${child.children.length} children`);
      }
      
      // Also try targeting the child groups directly (obstacle_1_002001, obstacle_1_002002)
      if ((child.type === 'Group' || child.type === 'Object3D') && (
           name.includes('obstacle_1_002004') || 
           name.includes('obstacle_1_002005') ||
           name.includes('obstacle_1_002.004') || 
           name.includes('obstacle_1_002.005'))) {
        foundHammers.push(child); // Track the animated GROUP
        child.userData.isPendulum = true;
        
        // console.log(`🎯 Found pendulum obstacle (child): ${child.name} with ${child.children.length} children`);
      }
      
      
      // Set shadows for all meshes
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        
        // Separate coins from other collectibles
        if (name.startsWith('coin')) {
          foundCoins.push({
            id: child.uuid,
            name: child.name,
            object: child
          });
          // console.log(`Found coin: ${child.name}`);
        } else if (name.startsWith('star')) {
          foundCollectibles.push({
            id: child.uuid,
            name: child.name,
            type: 'star',
            object: child
          });
        }
      }
      
      // Look for diamond objects for spinning, hovering, and collection
      if ((child.isMesh || child.type === 'Group' || child.type === 'Object3D') && name.startsWith('diamond_001')) {
        foundCollectibles.push({
          id: child.uuid,
          name: child.name,
          type: 'diamond',
          object: child
        });
        child.userData.isDiamond = true; // Keep this for animation
        
        // console.log(`💎 Found diamond collectible: ${child.name} (type: ${child.type})`);
      }
      
      // Look for the warlock circle object (child of statue_warlock)
      if (child.name === 'state_warlock_circle') {
        if (!foundWarlockCircle) {
          foundWarlockCircle = child;
          console.log(`✅ Found warlock circle: ${child.name} (type: ${child.type})`);
        } else {
          // Hide duplicate warlock circles
          child.visible = false;
          console.log(`🙈 Hiding duplicate warlock circle: ${child.name}`);
        }
      }
      
    });
    
    setHammerMeshes(foundHammers);
    setCollectibles(foundCollectibles);
    setCoins(foundCoins);
    setDoors(foundDoors);
    setWarlockCircle(foundWarlockCircle);
    setCorazonObject(foundCorazon);
    setCorazonParts(foundCorazonParts);
    
    // Debug: Log found objects (doors handled by DoorController now)
    // console.log(`🪙 Found ${foundCoins.length} coins:`, foundCoins.map(c => c.name));
    // console.log(`🎯 Total collision objects:`, foundHammers.length);
  }, [obstacleScene]);

  // Find fires in the main platform scene and hide duplicate warlock circles
  useEffect(() => {
    if (!platformScene) return;
    
    const foundFires = [];
    
    // console.log('=== PLATFORM SCENE OBJECTS (searching for fires) ===');
    platformScene.traverse((child) => {
      const name = child.name.toLowerCase();
      
      // Hide any warlock circles found in platform scene since we animate the one from obstacle scene
      if (child.name === 'state_warlock_circle') {
        child.visible = false;
        console.log(`🙈 Hiding warlock circle in platform scene: ${child.name}`);
      }
      
      // Log ALL objects that contain "fire" to see what's actually there
      // if (child.name.toLowerCase().includes('fire')) {
      //   console.log(`Fire-related object found: "${child.name}" (type: ${child.type}, isMesh: ${child.isMesh}, children: ${child.children?.length || 0})`);
      // }
      
      // Look for fire_master objects (including fire_master001, fire_master002, etc.)
      if ((child.type === 'Object3D' || child.type === 'Group') && name.startsWith('fire_master')) {
        foundFires.push({
          id: child.uuid,
          name: child.name,
          object: child
        });
        // console.log(`✅ Found fire_master: ${child.name} with ${child.children.length} children`);
      }
    });
    
    setFires(foundFires);
    // console.log(`Found ${foundFires.length} fires:`, foundFires.map(f => f.name));
  }, [platformScene]);

  // Handle flame animation
  useEffect(() => {
    if (!platformScene || !platformAnimations || platformAnimations.length === 0) return;
    
    // Flame animation found and will be started with delay
    
    // Try to find and play Take 01 animation in either model
    let animationFound = false;
    
    // Delayed access to let the actions initialize properly
    setTimeout(() => {
      if (platformActions) {
        const actionKey = Object.keys(platformActions)[0];
        if (actionKey) {
          const action = platformActions[actionKey];
          if (action && typeof action.play === 'function') {
            action.reset();
            action.setLoop(THREE.LoopRepeat, Infinity);
            action.play();
            // console.log('🔥 Flame animation started');
          }
        }
      }
    }, 100);
    
    if (actions && actions['Take 01']) {
      // console.log('🔥 Playing Take 01 from OBSTACLE model');
      const action = actions['Take 01'];
      action.reset();
      action.setLoop(THREE.LoopRepeat, Infinity); // Loop infinitely  
      action.play();
      // console.log('🔥 Animation state:', { isRunning: action.isRunning(), enabled: action.enabled, paused: action.paused });
      animationFound = true;
    }
    
    // if (!animationFound) {
    //   console.log('🔥 Take 01 animation not found in either model');
    // }
    
    // Only log candleFlame objects (the ones we actually use)
    let candleFlameCount = 0;
    platformScene.traverse((child) => {
      const name = child.name.toLowerCase();
      if (name.includes('candleflame')) {
        candleFlameCount++;
        // console.log(`🔥 Found candleFlame: ${child.name} (type: ${child.type})`);
      }
    });
    // console.log(`🔥 Total candleFlame objects found: ${candleFlameCount}`);
  }, [platformActions, platformScene]);

  // Apply iridescent shader to 'Emissive' materials
  useEffect(() => {
    if (!platformScene) return;
    
    // Initialize global array for client-side only
    if (typeof window !== 'undefined' && !window.iridiscentMaterials) {
      window.iridiscentMaterials = [];
    }
    
    const foundIridiscentMaterials = [];
    
    // console.log('=== SEARCHING FOR EMISSIVE MATERIALS ===');
    platformScene.traverse((child) => {
      if (child.isMesh && child.material) {
        // Handle both single materials and arrays of materials
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        
        materials.forEach((material, index) => {
          // Log ALL material names to see what's available
          // console.log(`Material found: "${material.name}" on mesh: ${child.name}`);
          
          if (material.name === 'Emission') {
            // console.log(`Found 'Emission' material on mesh: ${child.name}`);
            
            // Create iridescent material using the original texture if available
            const originalTexture = material.map || material.emissiveMap || null;
            const iridiscentMaterial = createIridescentMaterial(originalTexture);
            
            // Replace the material
            if (Array.isArray(child.material)) {
              child.material[index] = iridiscentMaterial;
            } else {
              child.material = iridiscentMaterial;
            }
            
            foundIridiscentMaterials.push(iridiscentMaterial);
            
            // Store in global array for animation (client-side only)
            if (typeof window !== 'undefined' && window.iridiscentMaterials) {
              window.iridiscentMaterials.push(iridiscentMaterial);
            }
            
            // console.log(`Applied iridescent shader to '${material.name}' material on ${child.name}`);
          }
        });
      }
    });
    
    setIridiscentMaterials(foundIridiscentMaterials);
    // console.log(`Applied iridescent shader to ${foundIridiscentMaterials.length} 'Emissive' materials`);
  }, [platformScene]);

  // Animate iridescent materials
  useFrame((state) => {
    // Update time uniform for all iridescent materials
    iridiscentMaterials.forEach(material => {
      if (material.uniforms && material.uniforms.time) {
        material.uniforms.time.value = state.clock.elapsedTime;
      }
    });
    
    // Also update global materials if they exist (client-side only)
    if (typeof window !== 'undefined' && window.iridiscentMaterials) {
      window.iridiscentMaterials.forEach(material => {
        if (material.uniforms && material.uniforms.time) {
          material.uniforms.time.value = state.clock.elapsedTime;
        }
      });
    }
  });

  // Load coin collection sound
  useEffect(() => {
    loadSound('coinCollect', '/sounds/whimsyCoin.wav');
  }, [loadSound]);
  
  // Play animations
  useEffect(() => {
    if (actions) {
      Object.values(actions).forEach(action => {
        if (action && typeof action.play === 'function') {
          action.play();
          action.setLoop(true);
        }
      });
    }
  }, [actions]);
  
  // Star and Diamond collision detection
  useEffect(() => {
    const checkCollectibleCollisions = () => {
      if (!GameState.characterPosition) return;
      
      const collectionDistance = 1.5;
      
      collectibles.forEach(collectible => {
        if (!collectedItems.has(collectible.id) && collectible.object.visible) {
          const worldPos = new Vector3();
          collectible.object.getWorldPosition(worldPos);
          const distance = GameState.characterPosition.distanceTo(worldPos);
          
          if (distance < collectionDistance) {
            setCollectedItems(prev => new Set([...prev, collectible.id]));
            GameState.collectedItems.add(collectible.id);
            
            collectible.object.visible = false;
            
            if (collectible.type === 'star') {
              GameState.score += 100;
              // console.log(`Collected star! Score: ${GameState.score}`);
            } else if (collectible.type === 'diamond') {
              // Increment diamond count in GameState
              if (!GameState.diamondCount) GameState.diamondCount = 0;
              GameState.diamondCount += 1;
              GameState.score += 50; // Diamonds worth 50 points
              // console.log(`Collected diamond! Total diamonds: ${GameState.diamondCount}, Score: ${GameState.score}`);
            }
          }
        }
      });
    };
    
    if (collectibles.length > 0) {
      const interval = setInterval(checkCollectibleCollisions, 16);
      return () => clearInterval(interval);
    }
  }, [collectibles, collectedItems]);

  // Coin collision detection with enhanced effects
  useEffect(() => {
    const checkCoinCollisions = () => {
      if (!GameState.characterPosition) return;
      
      const collectionDistance = 1.2; // Slightly smaller collection distance for coins
      
      // Debug: Log collision check
      // if (coins.length > 0) {
      //   console.log(`Checking coin collisions. Character at:`, characterPosition, `Coins available:`, coins.length);
      // }
      
      coins.forEach(coin => {
        if (!collectedItems.has(coin.id) && coin.object.visible) {
          const worldPos = new Vector3();
          coin.object.getWorldPosition(worldPos);
          const distance = GameState.characterPosition.distanceTo(worldPos);
          
          if (distance < collectionDistance) {
            setCollectedItems(prev => new Set([...prev, coin.id]));
            GameState.collectedItems.add(coin.id);
            GameState.score += 10;
            
            // Increment coin count in GameState
            if (!GameState.coinCount) GameState.coinCount = 0;
            GameState.coinCount += 1;
            
            // Play coin collection sound
            playSound('coinCollect', 0.3);
            
            coin.object.visible = false;
            // console.log(`Collected coin! Total coins: ${GameState.coinCount}, Score: ${GameState.score}`);
          }
        }
      });
    };
    
    if (coins.length > 0) {
      const interval = setInterval(checkCoinCollisions, 16);
      return () => clearInterval(interval);
    }
  }, [coins, collectedItems, playSound]);

  
  // Use simple door controller with targeted static door hiding
  const doorController = useMemo(() => {
    console.log(`🔧 Creating simple door controller (memoized)`);
    return <DoorController obstacleScene={obstacleScene} obstacleAnimations={animations} platformScene={platformScene} />;
  }, [obstacleScene, animations, platformScene]);

  // Don't render physics until both scenes are loaded
  if (!isLoaded) {
    return null;
  }

  return (
    <>
      {/* Static platform collision mesh - NO obstacles included */}
      <RigidBody type="fixed" colliders="trimesh">
        <primitive object={platformScene} {...props} ref={platformGroup} />
      </RigidBody>
      
      {/* Visual obstacles WITHOUT collision */}
      <primitive object={obstacleScene} {...props} ref={obstacleGroup} />
      
      {/* Dynamic colliders for animated obstacles */}
      {hammerMeshes.map((obstacle, index) => (
        <AnimatedObstacleCollider 
          key={`obstacle-${obstacle.uuid || obstacle.name || index}`} 
          obstacleMesh={obstacle}
          index={index}
        />
      ))}
      
      {/* Animated coins */}
      {coins.map((coin, index) => (
        <AnimatedCoin 
          key={`coin-${index}`} 
          coinMesh={coin.object}
          index={index}
        />
      ))}
      
      {/* Animated diamonds */}
      {collectibles.filter(c => c.type === 'diamond').map((diamond, index) => (
        <AnimatedDiamond 
          key={`diamond-${index}`} 
          diamondMesh={diamond.object}
          index={index}
        />
      ))}
      
      {/* Animated fires */}
      {fires.map((fire, index) => (
        <AnimatedFire 
          key={`fire-${index}`} 
          fireMesh={fire.object}
          index={index}
        />
      ))}
      
      
      {/* Animated warlock circle */}
      {warlockCircle && (
        <AnimatedWarlockCircle 
          warlockCircleMesh={warlockCircle}
        />
      )}
      
      {/* Animated Corazon with gentle hover */}
      {corazonObject && (
        <AnimatedCorazon 
          corazonMesh={corazonObject}
        />
      )}
      
      {/* Centralized door controller */}
      {doorController}
      
      {/* Collider Visualizer - comment out to hide */}
      <RigidBody type="fixed" position={[0, -10, 0]}>
        <CuboidCollider args={[25, 0.1, 25]} />
        {/* <mesh>
          <boxGeometry args={[50, 0.2, 50]} />
          <meshBasicMaterial color="cyan" opacity={0.3} transparent wireframe />
        </mesh> */}
      </RigidBody>
    </>
  );
};