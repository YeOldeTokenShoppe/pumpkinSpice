import { useKeyboardControls } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { CapsuleCollider, RigidBody } from "@react-three/rapier";
import { useEffect, useRef, useState } from "react";
import { MathUtils, Vector3 } from "three";
import { degToRad } from "three/src/math/MathUtils.js";
import { GameState } from "../../src/lib/GameState";
import { Character } from "./Character";
import { useAudio } from "../../src/hooks/useAudio";
import { useTouchControls } from "../../src/hooks/useTouchControls";

const normalizeAngle = (angle) => {
  while (angle > Math.PI) angle -= 2 * Math.PI;
  while (angle < -Math.PI) angle += 2 * Math.PI;
  return angle;
};

const lerpAngle = (start, end, t) => {
  start = normalizeAngle(start);
  end = normalizeAngle(end);

  if (Math.abs(end - start) > Math.PI) {
    if (end > start) {
      start += 2 * Math.PI;
    } else {
      end += 2 * Math.PI;
    }
  }

  return normalizeAngle(start + (end - start) * t);
};

export const CharacterController = ({ onTouchAction }) => {
  // Fixed values instead of Leva controls
  const WALK_SPEED = 1.4;
  const RUN_SPEED = 2.6;
  const ROTATION_SPEED = degToRad(0.5);
  const JUMP_FORCE = 4;
  const ZOOM_DISTANCE = 2;
  const FALL_THRESHOLD = -20;
  const rb = useRef();
  const container = useRef();
  const character = useRef();
  
  
  const { loadSound, playSound, stopSound } = useAudio();
  const { getTouchControls, handleTouchAction, getMovementVector } = useTouchControls();

  // Expose touch action handler to parent
  useEffect(() => {
    if (onTouchAction) {
      onTouchAction(handleTouchAction);
    }
  }, [onTouchAction, handleTouchAction]);

  const [animation, setAnimation] = useState("idle");
  const [isLightingAction, setIsLightingAction] = useState(false);
  const originalRotation = useRef(0);
  const spinStartTime = useRef(0);

  const characterRotationTarget = useRef(0);
  const rotationTarget = useRef(0);
  const cameraTarget = useRef();
  const cameraPosition = useRef();
  const cameraWorldPosition = useRef(new Vector3());
  const cameraLookAtWorldPosition = useRef(new Vector3());
  const cameraLookAt = useRef(new Vector3());
  const [, get] = useKeyboardControls();
  const isClicking = useRef(false);
  const isOnGround = useRef(false);
  const canJump = useRef(true);
  const cameraDistance = useRef(4); // Default camera distance
  const spawnPoint = useRef(new Vector3(0, 0, 0)); // Starting position
  const hasSetSpawnPoint = useRef(false);
  const isWalking = useRef(false);
  const hasFallen = useRef(false);
  const lastStepTime = useRef(0);

  useEffect(() => {
    loadSound('jump', '/sounds/jump.ogg');
    loadSound('walking', '/sounds/clickStep.mp3', false);
    loadSound('fall', '/sounds/fall.ogg');
    
    const onMouseDown = (e) => {
      isClicking.current = true;
    };
    const onMouseUp = (e) => {
      isClicking.current = false;
    };
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("mouseup", onMouseUp);
    // touch
    document.addEventListener("touchstart", onMouseDown);
    document.addEventListener("touchend", onMouseUp);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("touchstart", onMouseDown);
      document.removeEventListener("touchend", onMouseUp);
    };
  }, [loadSound]);

  useFrame(({ camera, mouse }) => {
    if (rb.current) {
      // Store rigid body reference in GameState for collision detection
      GameState.characterRigidBody = rb.current;
      const vel = rb.current.linvel();

      const movement = {
        x: 0,
        z: 0,
      };

      // Combine keyboard and touch controls
      const touchControls = getTouchControls();
      const touchMovement = getMovementVector();

      // Keyboard controls
      if (get().forward || touchControls.forward) {
        movement.z = 1;
      }
      if (get().backward || touchControls.backward) {
        movement.z = -1;
      }
      if (get().left || touchControls.left) {
        movement.x = 1;
      }
      if (get().right || touchControls.right) {
        movement.x = -1;
      }

      // Touch joystick has priority for smooth movement
      if (Math.abs(touchMovement.x) > 0.1 || Math.abs(touchMovement.z) > 0.1) {
        movement.x = touchMovement.x;
        movement.z = touchMovement.z;
      }

      let speed = (get().run || touchControls.run) ? RUN_SPEED : WALK_SPEED;

      // Mouse drag controls (existing functionality)
      if (isClicking.current) {
        // console.log("clicking", mouse.x, mouse.y);
        if (Math.abs(mouse.x) > 0.1) {
          movement.x = -mouse.x;
        }
        movement.z = mouse.y + 0.4;
        if (Math.abs(movement.x) > 0.5 || Math.abs(movement.z) > 0.5) {
          speed = RUN_SPEED;
        }
      }

      if (movement.x !== 0) {
        rotationTarget.current += ROTATION_SPEED * movement.x;
      }

      if (movement.x !== 0 || movement.z !== 0) {
        characterRotationTarget.current = Math.atan2(movement.x, movement.z);
        vel.x =
          Math.sin(rotationTarget.current + characterRotationTarget.current) *
          speed;
        vel.z =
          Math.cos(rotationTarget.current + characterRotationTarget.current) *
          speed;
        if (speed === RUN_SPEED) {
          setAnimation("run");
        } else {
          setAnimation("walk");
        }
        
        // Play step sound at regular intervals
        if (isOnGround.current) {
          const currentTime = Date.now();
          const stepInterval = speed === RUN_SPEED ? 300 : 500; // Faster steps when running
          
          if (currentTime - lastStepTime.current > stepInterval) {
            playSound('walking', { volume: 0.9, loop: false });
            lastStepTime.current = currentTime;
          }
          isWalking.current = true;
        }
      } else {
        setAnimation("idle");
        // Reset walking state when not moving
        if (isWalking.current) {
          isWalking.current = false;
        }
      }

      // Ground detection
      isOnGround.current = Math.abs(vel.y) < 0.1;

      // Jump logic with lighting action detection (keyboard + touch)
      if ((get().jump || touchControls.jump) && isOnGround.current && canJump.current) {
        vel.y = JUMP_FORCE;
        canJump.current = false;
        
        // Check if L key is also pressed for spinning torch action
        if (get().light || touchControls.light) {
          setAnimation("jump");
          setIsLightingAction(true);
          originalRotation.current = rotationTarget.current;
          spinStartTime.current = Date.now();
          playSound('jump', 0.5);
          
          // Try to light nearby candle
          if (GameState.lightNearestCandle) {
            const success = GameState.lightNearestCandle();
            if (success) {
              console.log("Successfully lit a candle!");
            } else {
              console.log("No candles nearby to light");
            }
          }
        } else {
          setAnimation("jump");
          setIsLightingAction(false);
          playSound('jump', 0.5);
        }
      }

      // Handle spinning torch action
      if (isLightingAction) {
        const elapsedTime = Date.now() - spinStartTime.current;
        const spinDuration = 800; // 0.8 seconds for full spin
        
        if (elapsedTime < spinDuration) {
          // Create a smooth spin: 0° -> 30° -> 0°
          const progress = elapsedTime / spinDuration;
          const spinAmount = Math.sin(progress * Math.PI) * (Math.PI / 6); // 30 degrees max
          rotationTarget.current = originalRotation.current + spinAmount;
        } else {
          // Spin complete, return to original rotation
          rotationTarget.current = originalRotation.current;
          setIsLightingAction(false);
        }
      }

      // Reset jump ability when on ground (keyboard + touch)
      if (isOnGround.current && !get().jump && !touchControls.jump) {
        canJump.current = true;
      }

      // Zoom control - maintain zoom state independently of movement (keyboard + touch)
      if (get().zoom || touchControls.zoom) {
        cameraDistance.current = Math.max(1, cameraDistance.current - ZOOM_DISTANCE * 0.05);
      } else {
        cameraDistance.current = Math.min(4, cameraDistance.current + 0.02);
      }

      character.current.rotation.y = lerpAngle(
        character.current.rotation.y,
        characterRotationTarget.current,
        0.1
      );

      rb.current.setLinvel(vel, true);
    }

    character.current.getWorldPosition(GameState.characterPosition);

    // Set spawn point on first frame when character is on solid ground
    if (!hasSetSpawnPoint.current && isOnGround.current) {
      spawnPoint.current.copy(GameState.characterPosition);
      hasSetSpawnPoint.current = true;
    }

    // Fall detection and respawn
    if (GameState.characterPosition.y < FALL_THRESHOLD) {
      // Play fall sound once
      if (!hasFallen.current) {
        playSound('fall', 0.5);
        hasFallen.current = true;
      }
      
      // Reset character position to spawn point
      rb.current.setTranslation(spawnPoint.current, true);
      rb.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      rb.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
      
      // Reset container rotation
      container.current.rotation.y = 0;
      rotationTarget.current = 0;
      characterRotationTarget.current = 0;
      
      // Update game state
      GameState.characterPosition.copy(spawnPoint.current);
      GameState.containerRotation = 0;
      
      // Stop walking sound if playing
      if (isWalking.current) {
        stopSound('walking');
        isWalking.current = false;
      }
    } else {
      // Reset fall flag when not falling
      hasFallen.current = false;
    }

    // CAMERA
    container.current.rotation.y = MathUtils.lerp(
      container.current.rotation.y,
      rotationTarget.current,
      0.1
    );

    GameState.containerRotation = container.current.rotation.y;

    // Update camera position based on zoom distance
    cameraPosition.current.position.z = -cameraDistance.current;

    cameraPosition.current.getWorldPosition(cameraWorldPosition.current);
    camera.position.lerp(cameraWorldPosition.current, 0.1);

    if (cameraTarget.current) {
      cameraTarget.current.getWorldPosition(cameraLookAtWorldPosition.current);
      cameraLookAt.current.lerp(cameraLookAtWorldPosition.current, 0.1);

      camera.lookAt(cameraLookAt.current);
    }

  });

  return (
    <RigidBody colliders={false} lockRotations ref={rb} userData={{ isCharacter: true }} >
      <group ref={container}>
        <group ref={cameraTarget} position-z={1.5} />
        <group 
          ref={cameraPosition} 
          position-y={3} 
          position-z={1} 
        />
        <group ref={character} userData={{ isCharacter: true }}>
          <Character 
            scale={0.38} 
            position-y={-0.15} 
            animation={animation}
            lightingAction={isLightingAction}
          />
        </group>
      </group>
      <CapsuleCollider args={[0.15, 0.60]} debug />
    </RigidBody>
  );
};
