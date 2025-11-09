import { useAnimations, useGLTF } from "@react-three/drei";
import { RigidBody, CapsuleCollider, CuboidCollider, TrimeshCollider, ConvexHullCollider } from "@react-three/rapier";
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
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


// Component for animating coins with spinning motion
const AnimatedCoin = ({ coinMesh, index, onCollect }) => {
  const coinRef = useRef();
  
  useFrame((state) => {
    if (!coinMesh || !coinMesh.visible) return;
    
    // Spin the coin like Super Mario
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

// Component for animating diamonds with spinning and hovering motion
const AnimatedDiamond = ({ diamondMesh, index }) => {
  const originalPosition = useRef(null);
  
  useFrame((state) => {
    if (!diamondMesh || !diamondMesh.visible) return;
    
    // Store original position on first run
    if (!originalPosition.current) {
      originalPosition.current = {
        x: diamondMesh.position.x,
        y: diamondMesh.position.y,
        z: diamondMesh.position.z
      };
    }
    
    const time = state.clock.elapsedTime;
    
    // Spinning animation - continuous Y-axis rotation
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

// Component for animating pillars with independent rising/falling motion
const AnimatedPillar = ({ pillarMesh, index }) => {
  const originalPosition = useRef(null);
  const debugLogged = useRef(false);
  
  useFrame((state) => {
    if (!pillarMesh) return;
    
    // Debug log once per pillar
    if (!debugLogged.current) {
      // console.log(`🏛️ AnimatedPillar ${index}: "${pillarMesh.name}" starting animation (type: ${pillarMesh.type})`);
      debugLogged.current = true;
    }
    
    // Store original position on first run
    if (!originalPosition.current) {
      originalPosition.current = pillarMesh.position.y;
      // console.log(`🏛️ Pillar ${index} (${pillarMesh.name}): Original Y position = ${originalPosition.current}`);
    }
    
    const time = state.clock.elapsedTime;
    
    // Create unique timing for each pillar
    const baseSpeed = 0.6; // Base animation speed (slowed down)
    const pillarSpeed = baseSpeed + (index * 0.15); // Vary speed per pillar (reduced variation)
    const pillarPhase = index * 1.8; // Phase offset for independent timing
    
    // Rising and falling motion - creates a challenging pattern
    const riseHeight = 2.5; // How high pillars can rise
    const motion = Math.sin(time * pillarSpeed + pillarPhase);
    
    // Convert from [-1, 1] to [0, riseHeight] range
    const normalizedMotion = (motion + 1) / 2;
    const newY = originalPosition.current + (normalizedMotion * riseHeight);
    pillarMesh.position.y = newY;
    
    // Debug log occasionally for the first few pillars
    if (index < 3 && Math.floor(time) % 3 === 0 && Math.floor(time * 10) % 10 === 0) {
      // console.log(`🏛️ Pillar ${index} (${pillarMesh.name}): Y = ${newY.toFixed(2)} (motion: ${motion.toFixed(2)})`);
    }
    
    // Update world matrix for proper collision detection
    pillarMesh.updateMatrixWorld(true);
  });
  
  return null;
};

// Component for animating fire flames with individual piece movement
const AnimatedFire = ({ fireMesh, index }) => {
  const originalPositions = useRef(new window.Map());
  const debugLogged = useRef(false);
  
  useFrame((state) => {
    if (!fireMesh) return;
    
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
  const isPillar = obstacleMesh.userData?.isPillar;
  
  // Access Valtio GameState for collision handling
  const gameState = useSnapshot(GameState);
  
  useFrame((state) => {
    if (!obstacleMesh || !rbRef.current) return;
    
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
      
      // Debug log occasionally
      // if (frameCount.current % 120 === 0) {
      //   console.log(`🔄 Pendulum ${index} animating: rotation.z = ${newRotation.toFixed(3)}, time = ${time.toFixed(1)}`);
      // }
    }
    
    if (isPillar) {
      // Pillar animation - up and down movement (y-axis translation)
      const pillarSpeed = 0.8; // Speed of up/down movement
      const pillarRange = 0.5; // How far up/down they move (in units)
      const time = state.clock.elapsedTime;
      
      // Store original position if not stored yet
      if (!originalPosition.current) {
        originalPosition.current = obstacleMesh.position.clone();
      }
      
      // Use sine wave for smooth up/down motion
      const yOffset = Math.sin(time * pillarSpeed) * pillarRange;
      obstacleMesh.position.y = originalPosition.current.y + yOffset;
      
      // Debug log occasionally
      // if (frameCount.current % 180 === 0) {
      //   console.log(`🏛️ Pillar ${index} animating: y-offset = ${yOffset.toFixed(3)}, time = ${time.toFixed(1)}`);
      // }
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
    
    // Debug log occasionally
    // if (frameCount.current % 180 === 0) {
    //   const type = isSpindle ? 'Spindle' : 'Hammer';
    //   console.log(`${type} ${index}: Position (${position.x.toFixed(1)}, ${position.y.toFixed(1)}, ${position.z.toFixed(1)})`);
    // }
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
      if (isPillar) type = 'Pillar';
      // console.log(`💥 ${type} ${index} hit!`);
      
      if (GameState.characterRigidBody) {
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
  } else if (isPillar) {
    // console.log(`🏗️ Creating kinematic pillar collider for: ${obstacleMesh.name} (index: ${index})`);
    
    // Pillar colliders - use kinematic like other animated obstacles
    return (
      <RigidBody
        ref={rbRef}
        type="kinematicPosition"
        colliders={false}
        onIntersectionEnter={handleCollision}
        sensor={false} // Solid collision for pillars
      >
        {/* Single well-fitted cuboid collider for the pillar */}
        <CuboidCollider 
          args={[0.6, 1.5, 0.6]} // [half-width, half-height, half-depth] - properly sized
          position={[0, 1.5, 0]} // Center the collider on the pillar
        />
        
        {/* Additional smaller collider for hieroglyph/top section */}
        <CuboidCollider 
          args={[0.5, 0.4, 0.5]} // Small top section
          position={[0, 3.2, 0]} // Top of pillar
        />
        
        {/* Debug visualization - ALWAYS VISIBLE */}
        <mesh position={[0, 1.5, 0]}>
          <boxGeometry args={[1.2, 3.0, 1.2]} />
          <meshBasicMaterial color="lime" opacity={0.5} transparent wireframe />
        </mesh>
        {/* Top section */}
        <mesh position={[0, 3.2, 0]}>
          <boxGeometry args={[1.0, 0.8, 1.0]} />
          <meshBasicMaterial color="yellow" opacity={0.5} transparent wireframe />
        </mesh>
        {/* Label for debugging */}
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[0.1, 0.1, 0.1]} />
          <meshBasicMaterial color="red" />
        </mesh>
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
  const [pillars, setPillars] = useState([]);
  const [collectedItems, setCollectedItems] = useState(new Set());
  const [iridiscentMaterials, setIridiscentMaterials] = useState([]);
  
  // Valtio GameState access
  const gameState = useSnapshot(GameState);
  
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
    const foundPillars = [];
    
    // console.log('=== OBSTACLE SCENE OBJECTS ===');
    obstacleScene.traverse((child) => {
      const name = child.name.toLowerCase();
      
      // Log ALL objects to help identify naming patterns
      // console.log(`Object: "${child.name}" (type: ${child.type}, isMesh: ${child.isMesh})`);
      
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
      if (child.type === 'Group' && name === 'obstacle_spindle') {
        foundHammers.push(child); // Track the animated GROUP
        child.userData.isSpindle = true;
        
        // console.log(`Found spinning group: ${child.name} with ${child.children.length} children`);
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
      
      // Log ALL objects to help identify pillar naming patterns
      if (child.name.toLowerCase().includes('pillar')) {
        // console.log(`🏛️ Pillar object found: "${child.name}" (type: ${child.type}, isMesh: ${child.isMesh}, children: ${child.children?.length || 0})`);
        
        // Log children for each pillar to see hieroglyphs
        if (child.children && child.children.length > 0) {
          child.children.forEach((grandchild, i) => {
            // console.log(`  └── Pillar child ${i}: "${grandchild.name}" (type: ${grandchild.type})`);
            if (grandchild.name.toLowerCase().includes('hieroglyph')) {
              // console.log(`    📜 Found hieroglyph: "${grandchild.name}" as child of ${child.name}`);
            }
          });
        }
      }
      
      // Look for the new standardized pillar naming: pillar_animated_001 through pillar_animated_016
      // Target only the parent Groups that contain hieroglypoh sub-objects, not the individual meshes
      const isPillar = name.startsWith('pillar_animated_') && child.type === 'Group';
      
      // Debug: log when we find pillar groups vs individual hieroglypoh meshes
      // if (name.includes('hieroglypoh')) {
      //   console.log(`🔍 Found hieroglypoh mesh: "${child.name}" (parent should be pillar group)`);
      // }
      
      if (isPillar) {
        foundPillars.push({
          id: child.uuid,
          name: child.name,
          object: child
        });
        // Mark pillars for collision detection
        child.userData.isPillar = true;
        
        // Only add unique pillars to avoid duplicates - check by name only
        const existingPillar = foundHammers.find(p => p.name === child.name);
        if (!existingPillar) {
          foundHammers.push(child); // Add to collision system
          // console.log(`✅ UNIQUE PILLAR ADDED: ${child.name} (type: ${child.type})`);
          
          // Debug position
          const worldPos = new Vector3();
          child.getWorldPosition(worldPos);
          // console.log(`   📍 Position: (${worldPos.x.toFixed(1)}, ${worldPos.y.toFixed(1)}, ${worldPos.z.toFixed(1)})`);
        } else {
          // console.log(`🔄 DUPLICATE pillar skipped: ${child.name} (type: ${child.type})`);
        }
      }
    });
    
    setHammerMeshes(foundHammers);
    setCollectibles(foundCollectibles);
    setCoins(foundCoins);
    setPillars(foundPillars);
    
    // Debug: Log found objects
    // console.log(`🪙 Found ${foundCoins.length} coins:`, foundCoins.map(c => c.name));
    // console.log(`🏛️ Found ${foundPillars.length}/16 pillars for display:`, foundPillars.map(p => p.name));
    // console.log(`💥 Found ${foundHammers.filter(h => h.userData?.isPillar).length}/16 pillars for COLLISION:`, foundHammers.filter(h => h.userData?.isPillar).map(p => p.name));
    // console.log(`🎯 Total collision objects:`, foundHammers.length);
  }, [obstacleScene]);

  // Find fires in the main platform scene
  useEffect(() => {
    if (!platformScene) return;
    
    const foundFires = [];
    
    // console.log('=== PLATFORM SCENE OBJECTS (searching for fires) ===');
    platformScene.traverse((child) => {
      const name = child.name.toLowerCase();
      
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
    loadSound('slidingStone', '/sounds/slidingStone.mp3');
  }, [loadSound]);
  
  // Play animations
  useEffect(() => {
    if (actions) {
      Object.values(actions).forEach(action => {
        action.play();
        action.setLoop(true);
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

  // Pillar proximity sound detection with sound stopping
  useEffect(() => {
    const checkPillarProximity = () => {
      if (!GameState.characterPosition || pillars.length === 0) {
        // if (pillars.length === 0) console.log('🏛️ No pillars found for sound detection');
        return;
      }
      
      const proximityDistance = 3.0; // Distance to trigger sound
      let nearPillar = false;
      let closestDistance = Infinity;
      
      pillars.forEach((pillar, index) => {
        const worldPos = new Vector3();
        pillar.object.getWorldPosition(worldPos);
        const distance = GameState.characterPosition.distanceTo(worldPos);
        
        if (distance < closestDistance) {
          closestDistance = distance;
        }
        
        if (distance < proximityDistance) {
          nearPillar = true;
          // console.log(`🏛️ Near pillar ${index} (${pillar.name}): distance ${distance.toFixed(2)}`);
        }
      });
      
      // Debug log distance to closest pillar occasionally
      if (Math.floor(Date.now() / 1000) % 2 === 0) {
        // console.log(`🏛️ Closest pillar distance: ${closestDistance.toFixed(2)}`);
      }
      
      // Handle sound playing/stopping
      if (nearPillar) {
        // Play sound if near any pillar (with throttling to avoid spam)
        if (!GameState.lastPillarSoundTime || Date.now() - GameState.lastPillarSoundTime > 3000) {
          // console.log('🏛️ Playing sliding stone sound!');
          playSound('slidingStone', 0.4);
          GameState.lastPillarSoundTime = Date.now();
          GameState.pillarSoundPlaying = true;
        }
      } else {
        // Stop sound if we were playing it and now we're far from pillars
        if (GameState.pillarSoundPlaying) {
          // console.log('🏛️ Stopping sliding stone sound - left pillar area');
          // Note: Most audio systems don't have a direct stop method for individual sounds
          // The sound will finish its current loop and not restart
          GameState.pillarSoundPlaying = false;
          GameState.lastPillarSoundTime = 0; // Reset so sound can play again immediately when re-entering
        }
      }
    };
    
    if (pillars.length > 0) {
      // console.log(`🏛️ Starting pillar sound detection for ${pillars.length} pillars`);
      const interval = setInterval(checkPillarProximity, 200); // Check every 200ms for performance
      return () => clearInterval(interval);
    }
  }, [pillars, playSound]);
  
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
      
      {/* Animated pillars */}
      {pillars.map((pillar, index) => (
        <AnimatedPillar 
          key={`pillar-${index}`} 
          pillarMesh={pillar.object}
          index={index}
        />
      ))}
    </>
  );
};