import { useAnimations, useGLTF } from "@react-three/drei";
import { RigidBody, CapsuleCollider, CuboidCollider, TrimeshCollider, ConvexHullCollider } from "@react-three/rapier";
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import { Vector3, Quaternion, Box3 } from "three";
import { GameState } from "../lib/GameState";
import { useAudio } from "../hooks/useAudio";

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

// Component for animating pillars with independent rising/falling motion
const AnimatedPillar = ({ pillarMesh, index }) => {
  const originalPosition = useRef(null);
  
  useFrame((state) => {
    if (!pillarMesh) return;
    
    // Store original position on first run
    if (!originalPosition.current) {
      originalPosition.current = pillarMesh.position.y;
    }
    
    const time = state.clock.elapsedTime;
    
    // Create unique timing for each pillar
    const baseSpeed = 1.2; // Base animation speed
    const pillarSpeed = baseSpeed + (index * 0.3); // Vary speed per pillar
    const pillarPhase = index * 1.8; // Phase offset for independent timing
    
    // Rising and falling motion - creates a challenging pattern
    const riseHeight = 2.5; // How high pillars can rise
    const motion = Math.sin(time * pillarSpeed + pillarPhase);
    
    // Convert from [-1, 1] to [0, riseHeight] range
    const normalizedMotion = (motion + 1) / 2;
    pillarMesh.position.y = originalPosition.current + (normalizedMotion * riseHeight);
    
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
    if (!debugLogged.current) {
      console.log(`Fire ${index} structure:`, fireMesh.children.map(child => ({
        name: child.name,
        type: child.type,
        isMesh: child.isMesh,
        children: child.children?.length || 0
      })));
      debugLogged.current = true;
    }
    
    // Animate all child objects (meshes and groups)
    fireMesh.children.forEach((child, childIndex) => {
      // Try to animate meshes directly or traverse deeper
      const targetMeshes = [];
      
      if (child.isMesh) {
        targetMeshes.push(child);
      } else if (child.children) {
        // Look for meshes in child groups
        child.traverse((subChild) => {
          if (subChild.isMesh) {
            targetMeshes.push(subChild);
          }
        });
      }
      
      // Animate all found meshes (but skip base/container)
      targetMeshes.forEach((mesh, meshIndex) => {
        // Skip meshes that look like base/container (typically larger, lower Y position)
        const meshName = mesh.name.toLowerCase();
        if (meshName.includes('base') || meshName.includes('container') || meshName.includes('pot')) {
          return; // Skip base containers
        }
        
        const time = state.clock.elapsedTime;
        
        // Store original position if not stored  
        if (!originalPositions.current.has(mesh.uuid)) {
          originalPositions.current.set(mesh.uuid, {
            x: mesh.position.x,
            y: mesh.position.y,
            z: mesh.position.z,
            rotX: mesh.rotation.x,
            rotY: mesh.rotation.y,
            rotZ: mesh.rotation.z
          });
        }
        
        const original = originalPositions.current.get(mesh.uuid);
        
        // Create unique flame movement for each piece
        const flameSpeed = 4 + meshIndex * 0.5; // Vary speed per flame
        const flamePhase = (childIndex + meshIndex) * 1.2; // Phase offset for each flame
        
        // Vertical jostling (main flame movement)
        const verticalMotion = Math.sin(time * flameSpeed + flamePhase) * 0.08;
        const verticalMotion2 = Math.sin(time * (flameSpeed * 1.3) + flamePhase) * 0.04;
        mesh.position.y = original.y + verticalMotion + verticalMotion2;
        
        // Slight horizontal sway
        const horizontalSway = Math.sin(time * (flameSpeed * 0.7) + flamePhase) * 0.03;
        mesh.position.x = original.x + horizontalSway;
        
        // Small random Z movement
        const depthMotion = Math.sin(time * (flameSpeed * 0.9) + flamePhase * 2) * 0.02;
        mesh.position.z = original.z + depthMotion;
        
        // Slight rotation for natural flame flicker
        const rotationFlicker = Math.sin(time * flameSpeed * 2 + flamePhase) * 0.1;
        mesh.rotation.z = original.rotZ + rotationFlicker;
        
        // Subtle scale variation to simulate flame intensity
        const scaleFlicker = 1 + Math.sin(time * flameSpeed * 1.5 + flamePhase) * 0.05;
        mesh.scale.setScalar(scaleFlicker);
      });
    });
  });
  
  return null; // This component only provides animation logic
};

const AnimatedObstacleCollider = ({ obstacleMesh, index }) => {
  const rbRef = useRef();
  const [showDebug] = useState(true);
  const frameCount = useRef(0);
  const isSpindle = obstacleMesh.userData?.isSpindle;
  const isObstacle2 = obstacleMesh.userData?.isObstacle2;
  const isObstacle006 = obstacleMesh.userData?.isObstacle006;
  
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
    console.log(`🔍 Collision detected! Other rigidBody:`, other.rigidBody);
    console.log(`🔍 Character RigidBody:`, GameState.characterRigidBody);
    console.log(`🔍 RigidBodies match:`, GameState.characterRigidBody === other.rigidBody);
    
    if (other.rigidBodyObject?.name === 'character' || 
        GameState.characterRigidBody === other.rigidBody ||
        other.rigidBodyObject?.userData?.isCharacter) {
      let type = 'Hammer';
      if (isSpindle) type = 'Spindle';
      if (isObstacle2) type = 'Obstacle_2_001';
      if (isObstacle006) type = 'Obstacle_006';
      console.log(`💥 ${type} ${index} hit!`);
      
      if (GameState.characterRigidBody) {
        const currentVel = GameState.characterRigidBody.linvel();
        const characterPos = GameState.characterPosition;
        const obstaclePos = new Vector3();
        obstacleMesh.getWorldPosition(obstaclePos);
        const knockbackDir = characterPos.clone().sub(obstaclePos).normalize();
        
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
        {showDebug && (
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
        )}
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
                {showDebug && (
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
                )}
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
                {showDebug && (
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
                )}
              </group>
            );
          }
          return null;
        })}
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
        
        {showDebug && (
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <capsuleGeometry args={[0.4, 1.2, 8, 16]} />
            <meshBasicMaterial color="yellow" opacity={0.3} transparent wireframe />
          </mesh>
        )}
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
  
  const handleCollision = () => {
    console.log(`💥 Compound Hammer ${index} hit!`);
    // Same knockback logic as above
  };
  
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
      {showDebug && (
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
      )}
    </RigidBody>
  );
};

// Simplified Map component
export const Map = ({ model, ...props }) => {
  const { scene: platformScene } = useGLTF(model); // Main platform
  const { scene: obstacleScene, animations } = useGLTF('/models/underworld2_obstacles.glb'); // Obstacles
  const group = useRef();
  const obstacleGroup = useRef();
  const { actions } = useAnimations(animations, obstacleGroup);
  const { loadSound, playSound } = useAudio();
  const [hammerMeshes, setHammerMeshes] = useState([]);
  const [collectibles, setCollectibles] = useState([]);
  const [coins, setCoins] = useState([]);
  const [fires, setFires] = useState([]);
  const [pillars, setPillars] = useState([]);
  const [collectedItems, setCollectedItems] = useState(new Set());
  
  // Find obstacles in the obstacle scene
  useEffect(() => {
    if (!obstacleScene) return;
    
    const foundHammers = [];
    const foundCollectibles = [];
    const foundCoins = [];
    
    console.log('=== OBSTACLE SCENE OBJECTS ===');
    obstacleScene.traverse((child) => {
      const name = child.name.toLowerCase();
      
      // Log ALL objects to help identify naming patterns
      console.log(`Object: "${child.name}" (type: ${child.type}, isMesh: ${child.isMesh})`);
      
      if (child.isMesh) {
        // Identify hammers - look for the new renamed objects
        if (name.includes('hammer1') || 
            name.includes('hammer2')) {
          
          // Store the hammer mesh
          foundHammers.push(child);
          
          // Mark for exclusion from static trimesh
          child.userData.excludeFromStatic = true;
          
          console.log(`Found hammer: ${child.name}`);
        }
        
        // obstacle_2_001 objects are handled as Groups below, not individual meshes
      }
      
      // Look for the GROUP that contains the spinning obstacle, not individual meshes
      if (child.type === 'Group' && name === 'obstacle_spindle') {
        foundHammers.push(child); // Track the animated GROUP
        child.userData.isSpindle = true;
        
        console.log(`Found spinning group: ${child.name} with ${child.children.length} children`);
      }
      
      // Look for obstacle_2_001 GROUP objects (they are Groups, not individual meshes)
      if (child.type === 'Group' && name.includes('obstacle_2_001')) {
        foundHammers.push(child); // Track the animated GROUP
        child.userData.isObstacle2 = true;
        
        console.log(`Found obstacle_2_001 group: ${child.name} with ${child.children.length} children`);
      }
      
      // Look for obstacle_6_001 GROUP objects (corrected naming pattern)
      if (child.type === 'Group' && name.includes('obstacle_6_001')) {
        foundHammers.push(child); // Track the animated GROUP
        child.userData.isObstacle006 = true;
        
        console.log(`Found obstacle_6_001 group: ${child.name} with ${child.children.length} children`);
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
          console.log(`Found coin: ${child.name}`);
        } else if (name.startsWith('star')) {
          foundCollectibles.push({
            id: child.uuid,
            name: child.name,
            type: 'star',
            object: child
          });
        }
      }
    });
    
    setHammerMeshes(foundHammers);
    setCollectibles(foundCollectibles);
    setCoins(foundCoins);
    
    // Debug: Log found objects
    console.log(`Found ${foundCoins.length} coins:`, foundCoins.map(c => c.name));
  }, [obstacleScene]);

  // Find fires and pillars in the main platform scene
  useEffect(() => {
    if (!platformScene) return;
    
    const foundFires = [];
    const foundPillars = [];
    
    console.log('=== PLATFORM SCENE OBJECTS (searching for fires and pillars) ===');
    platformScene.traverse((child) => {
      const name = child.name.toLowerCase();
      
      // Log ALL objects to help identify pillar naming patterns
      if (child.name.toLowerCase().includes('pillar')) {
        console.log(`Pillar object found: "${child.name}" (type: ${child.type}, isMesh: ${child.isMesh})`);
      }
      
      // Look for fire GROUP objects (pattern: fire_001.001, fire_001.002, etc.)
      if (child.type === 'Group' && name.includes('fire_001')) {
        foundFires.push({
          id: child.uuid,
          name: child.name,
          object: child
        });
        console.log(`Found fire group: ${child.name} with ${child.children.length} children`);
      }
      
      // Look for pillar objects with the actual naming patterns found in the console
      const isPillar = name.includes('pillar_001001') || 
                       name.includes('pillar_001002') || 
                       name.includes('pillar_001003') || 
                       name.includes('pillar_001004') || 
                       name.includes('pillar_001005') || 
                       name.includes('pillar_002001') || 
                       name.includes('pillar_002002') || 
                       name.includes('pillar_002003') || 
                       name.includes('pillar_002004') || 
                       name.includes('pillar_003001') || 
                       name.includes('pillar_003002') || 
                       name.includes('pillar_004001') || 
                       name.includes('pillar_004002') || 
                       name.includes('pillar_004003') || 
                       name.includes('pillar_004004') || 
                       name.includes('pillar_004005');
      
      if ((child.isMesh || child.type === 'Group') && isPillar) {
        foundPillars.push({
          id: child.uuid,
          name: child.name,
          object: child
        });
        console.log(`✅ Found pillar: ${child.name} (type: ${child.type})`);
      }
    });
    
    setFires(foundFires);
    setPillars(foundPillars);
    console.log(`Found ${foundFires.length} fires:`, foundFires.map(f => f.name));
    console.log(`Found ${foundPillars.length} pillars:`, foundPillars.map(p => p.name));
  }, [platformScene]);

  // Load coin collection sound
  useEffect(() => {
    loadSound('coinCollect', '/sounds/whimsyCoin.wav');
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
  
  // Star collision detection
  useEffect(() => {
    const checkStarCollisions = () => {
      if (!GameState.characterPosition) return;
      
      const characterPos = GameState.characterPosition;
      const collectionDistance = 1.5;
      
      collectibles.forEach(collectible => {
        if (!collectedItems.has(collectible.id) && collectible.object.visible) {
          const worldPos = new Vector3();
          collectible.object.getWorldPosition(worldPos);
          const distance = characterPos.distanceTo(worldPos);
          
          if (distance < collectionDistance) {
            setCollectedItems(prev => new Set([...prev, collectible.id]));
            GameState.collectedItems.add(collectible.id);
            GameState.score += 100;
            
            collectible.object.visible = false;
            console.log(`Collected star! Score: ${GameState.score}`);
          }
        }
      });
    };
    
    if (collectibles.length > 0) {
      const interval = setInterval(checkStarCollisions, 16);
      return () => clearInterval(interval);
    }
  }, [collectibles, collectedItems]);

  // Coin collision detection with enhanced effects
  useEffect(() => {
    const checkCoinCollisions = () => {
      if (!GameState.characterPosition) return;
      
      const characterPos = new Vector3(
        GameState.characterPosition.x,
        GameState.characterPosition.y,
        GameState.characterPosition.z
      );
      const collectionDistance = 1.2; // Slightly smaller collection distance for coins
      
      // Debug: Log collision check
      // if (coins.length > 0) {
      //   console.log(`Checking coin collisions. Character at:`, characterPos, `Coins available:`, coins.length);
      // }
      
      coins.forEach(coin => {
        if (!collectedItems.has(coin.id) && coin.object.visible) {
          const worldPos = new Vector3();
          coin.object.getWorldPosition(worldPos);
          const distance = characterPos.distanceTo(worldPos);
          
          if (distance < collectionDistance) {
            setCollectedItems(prev => new Set([...prev, coin.id]));
            GameState.collectedItems.add(coin.id);
            GameState.score += 10;
            
            // Increment coin count in GameState
            if (GameState.coinCount === undefined) GameState.coinCount = 0;
            GameState.coinCount += 1;
            
            // Play coin collection sound
            playSound('coinCollect', 0.3);
            
            coin.object.visible = false;
            console.log(`Collected coin! Total coins: ${GameState.coinCount}, Score: ${GameState.score}`);
          }
        }
      });
    };
    
    if (coins.length > 0) {
      const interval = setInterval(checkCoinCollisions, 16);
      return () => clearInterval(interval);
    }
  }, [coins, collectedItems]);
  
  return (
    <>
      {/* Static platform collision mesh - NO obstacles included */}
      <RigidBody type="fixed" colliders="trimesh">
        <primitive object={platformScene} {...props} ref={group} />
      </RigidBody>
      
      {/* Visual obstacles WITHOUT collision */}
      <primitive object={obstacleScene} {...props} ref={obstacleGroup} />
      
      {/* Dynamic colliders for animated obstacles */}
      {hammerMeshes.map((obstacle, index) => (
        <AnimatedObstacleCollider 
          key={`obstacle-${index}`} 
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