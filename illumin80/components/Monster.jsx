import { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { useGameStore } from '../../src/lib/gameStore';
import { Vector3, AnimationMixer, Box3 } from 'three';
import { Clone, useAnimations, useGLTF } from '@react-three/drei';

// Simple placeholder monster component - replace with actual models
const PlaceholderMonster = ({ color = '#ff0000', scale = 0.3 }) => {
  return (
    <group scale={scale}>
      {/* Body */}
      <mesh position={[0, 0.3, 0]}>
        <boxGeometry args={[0.6, 0.6, 0.4]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 0.7, 0]}>
        <sphereGeometry args={[0.25]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* Eyes */}
      <mesh position={[0.1, 0.75, 0.2]}>
        <sphereGeometry args={[0.05]} />
        <meshStandardMaterial color="white" emissive="white" emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[-0.1, 0.75, 0.2]}>
        <sphereGeometry args={[0.05]} />
        <meshStandardMaterial color="white" emissive="white" emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
};

export const Monster = forwardRef(({ 
  id, 
  position, 
  type = 'goblin', 
  health: initialHealth = 50,
  scale = 0.3,
  modelPath = null, // Path to GLB model if available
  onDefeat 
}, ref) => {
  const rbRef = useRef();
  const meshRef = useRef();
  const [health, setHealth] = useState(initialHealth);
  const [isHurt, setIsHurt] = useState(false);
  const [isDead, setIsDead] = useState(false);
  const { characterPosition, characterRigidBody, removeLife } = useGameStore();
  
  // AI state
  const [aiState, setAiState] = useState('idle'); // idle, pursuing, attacking
  const targetPos = useRef(new Vector3());
  const monsterPos = useRef(new Vector3());
  const velocity = useRef(new Vector3());
  
  // Combat
  const lastAttackTime = useRef(0);
  const ATTACK_COOLDOWN = 2000; // 2 seconds between attacks
  const ATTACK_RANGE = 0.8; // Distance to attack player
  const PURSUIT_RANGE = 3; // Distance to start chasing
  const MOVE_SPEED = 0.8; // Monster movement speed
  
  // Colors for different monster types (placeholders)
  const monsterColors = {
    goblin: '#4a7c4a',
    skeleton: '#e0e0e0',
    ghost: '#9b87c4'
  };

  useImperativeHandle(ref, () => ({
    dispose: () => {
      // Clean up resources when despawning
      if (meshRef.current) {
        meshRef.current.traverse((child) => {
          if (child.geometry) child.geometry.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(mat => mat.dispose());
            } else {
              child.material.dispose();
            }
          }
        });
      }
    }
  }));

  // Handle damage
  const takeDamage = (amount) => {
    if (isDead) return;
    
    const newHealth = Math.max(0, health - amount);
    setHealth(newHealth);
    setIsHurt(true);
    
    // Flash effect
    setTimeout(() => setIsHurt(false), 200);
    
    if (newHealth <= 0) {
      setIsDead(true);
      setTimeout(() => {
        onDefeat();
      }, 500); // Delay for death animation
    }
  };

  // Collision detection with player attacks
  useEffect(() => {
    if (!characterRigidBody) return;
    
    const handleCollision = (e) => {
      // Check if collision is with player's attack (you'll need to implement attack detection)
      if (e.other?.userData?.isPlayerAttack) {
        takeDamage(25); // Take damage from player attack
      }
    };

    // This would need to be connected to your collision system
    // For now, using distance-based "attack" when player jumps near monster
  }, [characterRigidBody]);

  useFrame((state, delta) => {
    if (!rbRef.current || isDead) return;
    
    // Get positions
    const rbPosition = rbRef.current.translation();
    monsterPos.current.set(rbPosition.x, rbPosition.y, rbPosition.z);
    
    if (characterPosition) {
      targetPos.current.set(
        characterPosition.x,
        characterPosition.y,
        characterPosition.z
      );
      
      const distanceToPlayer = monsterPos.current.distanceTo(targetPos.current);
      
      // AI State Machine
      if (distanceToPlayer < ATTACK_RANGE) {
        setAiState('attacking');
        
        // Attack logic
        const now = Date.now();
        if (now - lastAttackTime.current > ATTACK_COOLDOWN) {
          lastAttackTime.current = now;
          // Deal damage to player
          useGameStore.getState().setCharacterHealth(
            Math.max(0, useGameStore.getState().characterHealth - 10)
          );
          console.log(`${type} attacks player!`);
        }
      } else if (distanceToPlayer < PURSUIT_RANGE) {
        setAiState('pursuing');
        
        // Move towards player
        velocity.current.subVectors(targetPos.current, monsterPos.current);
        velocity.current.y = 0; // Keep on ground
        velocity.current.normalize();
        velocity.current.multiplyScalar(MOVE_SPEED);
        
        // Apply movement
        const currentVel = rbRef.current.linvel();
        rbRef.current.setLinvel({
          x: velocity.current.x,
          y: currentVel.y, // Preserve gravity
          z: velocity.current.z
        });
        
        // Rotate to face player
        if (meshRef.current) {
          meshRef.current.lookAt(targetPos.current);
        }
      } else {
        setAiState('idle');
        
        // Stop moving
        const currentVel = rbRef.current.linvel();
        rbRef.current.setLinvel({
          x: 0,
          y: currentVel.y,
          z: 0
        });
      }
    }
    
    // Simple attack detection - if player jumps near monster
    const jumpKey = state.clock.elapsedTime;
    if (characterPosition && !isDead) {
      const dist = monsterPos.current.distanceTo(targetPos.current);
      if (dist < 1.2 && characterPosition.y > monsterPos.current.y + 0.5) {
        // Player is above monster (jumping attack)
        takeDamage(50);
      }
    }
  });

  return (
    <RigidBody
      ref={rbRef}
      position={position}
      colliders={false}
      lockRotations
      userData={{ isMonster: true, monsterId: id }}
    >
      <group ref={meshRef}>
        {/* Use placeholder for now - replace with actual model when available */}
        <PlaceholderMonster 
          color={isHurt ? '#ffffff' : (isDead ? '#333333' : monsterColors[type])}
          scale={scale}
        />
        
        {/* Health bar */}
        {!isDead && (
          <group position={[0, 1.2 * scale, 0]}>
            <mesh>
              <planeGeometry args={[1, 0.1]} />
              <meshBasicMaterial color="#ff0000" />
            </mesh>
            <mesh position={[0, 0, 0.01]}>
              <planeGeometry args={[health / initialHealth, 0.08]} />
              <meshBasicMaterial color="#00ff00" />
            </mesh>
          </group>
        )}
        
        {/* Debug state indicator */}
        {/* <Html position={[0, 1.5 * scale, 0]} center>
          <div style={{ color: 'white', fontSize: '10px' }}>{aiState}</div>
        </Html> */}
      </group>
      
      {/* Collision box */}
      <CuboidCollider args={[0.3 * scale, 0.5 * scale, 0.2 * scale]} />
    </RigidBody>
  );
});

Monster.displayName = 'Monster';