import { useKeyboardControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { CapsuleCollider, BallCollider, ConvexHullCollider, TrimeshCollider, CuboidCollider, RigidBody, } from "@react-three/rapier";
import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { MathUtils, Vector3 } from "three";
import { degToRad } from "three/src/math/MathUtils.js";
import { GameState } from "../lib/GameState";
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
  const { camera, scene } = useThree();
  // Fixed values instead of Leva controls
  const WALK_SPEED = 1.4;
  const RUN_SPEED = 2.6;
  const ROTATION_SPEED = degToRad(0.5);
  const JUMP_FORCE = 6;
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

  const [animation, setAnimationRaw] = useState("idle");
  const animationRef = useRef("idle"); // Immediate reference for animation
  const animationCounter = useRef(0); // Counter to force remount only on animation change
  
  // Clean wrapper without spam logs
  const setAnimation = (newAnimation) => {
    // Normalize to lowercase for Character component
    const normalized = newAnimation.toLowerCase();
    if (normalized !== animationRef.current) { // Only update if actually changing
      if (normalized === "light") {
        console.log(`🎬 LIGHT ANIMATION SET: "${normalized}"`);
      }
      animationRef.current = normalized; // Update ref immediately
      animationCounter.current++; // Increment counter to force remount
      setAnimationRaw(normalized);
    }
  };
  const [isLightingAction, setIsLightingAction] = useState(false);
  const [isJumping, setIsJumping] = useState(false);
  const wasLightPressed = useRef(false);
  const lightingActionId = useRef(0);  // Track which lighting action is current
  // Removed originalRotation and spinStartTime - no longer needed for spinning torch

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
  const cameraDistance = useRef(3); // Default camera distance
  const cameraPitch = useRef(0); // Vertical camera angle
  const spawnPoint = useRef(new Vector3(0, 0, 10)); // Starting position - moved forward
  const hasSetSpawnPoint = useRef(false);
  const isWalking = useRef(false);
  const hasFallen = useRef(false);
  const lastStepTime = useRef(0);
  const isFalling = useRef(false);
  const fallStartTime = useRef(0);
  const hasPlayedFallSound = useRef(false);
  const gameJustStarted = useRef(true);
  const spawnTimer = useRef(null);
  const justRespawned = useRef(false);
  const isMobileDevice = useRef(false);

  useEffect(() => {
    // Check if mobile device
    isMobileDevice.current = window.innerWidth <= 768 || 'ontouchstart' in window;
    
    loadSound('jump', '/sounds/cuteCursor3.mp3', false);
    loadSound('walking', '/sounds/cuteCursor3.mp3', false);
    loadSound('fall', '/sounds/fall.mp3', false);
    
    // Test audio on first user interaction
    const testAudio = () => {
      console.log('Testing audio with user interaction...');
      playSound('jump', { volume: 0.1, loop: false });
    };
    
    const onMouseDown = () => {
      // Only enable click-to-move on desktop
      if (!isMobileDevice.current) {
        isClicking.current = true;
      }
      // Test audio on first interaction
      if (!window.audioTested) {
        testAudio();
        window.audioTested = true;
      }
    };
    const onMouseUp = () => {
      isClicking.current = false;
    };
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("mouseup", onMouseUp);
    // touch - disable click-to-move on mobile
    document.addEventListener("touchstart", () => {
      // Only trigger audio test, don't enable clicking
      if (!window.audioTested) {
        testAudio();
        window.audioTested = true;
      }
    });
    document.addEventListener("touchend", onMouseUp);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("touchstart", onMouseDown);
      document.removeEventListener("touchend", onMouseUp);
    };
  }, [loadSound]);


  useFrame(({ camera, mouse }) => {
    // Always update character position for candle system
    if (character.current) {
      character.current.getWorldPosition(GameState.characterPosition);
    }
    
    // Check for light button BEFORE early exit so it can be queued
    const touchControls = getTouchControls();
    const lightPressed = get().light || touchControls.light;
    
    // Reset light pressed flag when released (must happen before early exit)
    if (!lightPressed) {
      wasLightPressed.current = false;
    }
    
    // During lighting action, skip movement but continue rendering
    // (removed early return to allow animation updates)
    
    if (rb.current && !isLightingAction) {
      // Store rigid body reference in GameState for collision detection
      GameState.characterRigidBody = rb.current;
      
      const vel = rb.current.linvel();

      const movement = {
        x: 0,
        z: 0,
      };

      // Get touch movement (touchControls already defined above)
      const touchMovement = getMovementVector();
      
      // Debug touch inputs during lighting
      if (touchControls.light || (touchMovement.x !== 0 || touchMovement.z !== 0)) {
        console.log('🎮 TOUCH INPUT - light:', touchControls.light, 'movement:', touchMovement, 'isLightingAction:', isLightingAction);
      }

      // Early exit if lighting action is active - completely prevent movement processing
      if (isLightingAction) {
        vel.x = 0;
        vel.z = 0;
        rb.current.setLinvel({ x: 0, y: vel.y, z: 0 }, true);
        console.log('🚫 BLOCKING MOVEMENT - isLightingAction is true');
        return;
      }

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
        movement.x = -touchMovement.x;  // Invert x-axis for correct lateral movement
        movement.z = touchMovement.z;
      }

      let speed = (get().run || touchControls.run) ? RUN_SPEED : WALK_SPEED;

      // Mouse drag controls - ONLY on desktop (mobile uses joystick exclusively)
      if (isClicking.current && !isMobileDevice.current) {
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
        
        // Only set walk/run animations if not falling, jumping, or lighting
        if (!isFalling.current && !isJumping && !isLightingAction) {
          if (speed === RUN_SPEED) {
            setAnimation("run");
          } else {
            setAnimation("walk");
          }
        }
        
        // Play step sound at regular intervals
        if (isOnGround.current) {
          const currentTime = Date.now();
          const stepInterval = speed === RUN_SPEED ? 300 : 500; // Faster steps when running
          
          if (currentTime - lastStepTime.current > stepInterval) {
            playSound('walking', { volume: 0.5, loop: false });
            lastStepTime.current = currentTime;
          }
          isWalking.current = true;
        }
      } else if (!isFalling.current && !isJumping && !isLightingAction) {
        setAnimation("idle");
        // Reset walking state when not moving
        if (isWalking.current) {
          isWalking.current = false;
        }
      }

      // More forgiving ground detection for better knockback recovery
      const currentPos = rb.current.translation();
      const isNearGround = currentPos.y > -10 && currentPos.y < 5; // Expanded ground detection to account for actual character position
      const hasLowVerticalVelocity = Math.abs(vel.y) < 0.1; // Much more forgiving - tiny physics values are essentially zero
      isOnGround.current = isNearGround && hasLowVerticalVelocity;
      
      
      // Debug ground detection and fall state
      if (isFalling.current) {
        console.log("Fall state - pos.y:", currentPos.y.toFixed(2), "vel.y:", vel.y.toFixed(2), "isOnGround:", isOnGround.current, "isNearGround:", isNearGround, "hasLowVel:", hasLowVerticalVelocity);
      }
      
      // Disable fall detection for first 4 seconds after spawn
      if (gameJustStarted.current) {
        if (!spawnTimer.current) {
          spawnTimer.current = Date.now();
          console.log('Spawn protection timer started - fall detection disabled for 4 seconds');
        } else if (Date.now() - spawnTimer.current > 4000) {
          console.log('Spawn protection ending - fall detection now enabled');
          gameJustStarted.current = false;
          spawnTimer.current = null;
        }
      }
      
      // Clear respawn flag after landing
      if (isOnGround.current && justRespawned.current) {
        justRespawned.current = false;
      }
      
      // Fall detection logic - for animation only, no sound
      // Only trigger fall animation if falling fast AND position indicates a true fall (not just knockback recovery)
      const isFallingFast = vel.y < -8;
      const isProbablyTrueFall = currentPos.y < -5; // Below normal platform level
      const shouldTriggerFallAnimation = !gameJustStarted.current && !justRespawned.current && !isOnGround.current && isFallingFast && (isProbablyTrueFall || isFalling.current);
      
      if (shouldTriggerFallAnimation) {
        if (!isFalling.current) {
          isFalling.current = true;
          fallStartTime.current = Date.now();
        } else {
          const fallDuration = Date.now() - fallStartTime.current;
          if (fallDuration > 300) { // Reduced from 800ms for more responsive fall animation
            setAnimation("fall"); // Only animation, no sound
          }
        }
      } else if (isOnGround.current && isFalling.current) {
        // Just landed from a fall - reset physics state to prevent sliding
        isFalling.current = false;
        fallStartTime.current = 0;
        hasPlayedFallSound.current = false;
        setIsJumping(false);
        
        // Reset physics state to fix sliding after multiple knockbacks
        const currentVel = rb.current.linvel();
        rb.current.setLinvel({ 
          x: currentVel.x * 0.3, // Reduce horizontal momentum
          y: currentVel.y, 
          z: currentVel.z * 0.3 
        }, true);
        
        // Reset angular velocity to stop any rotation
        rb.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
        
        if (!isLightingAction) {
          setAnimation("idle");
        }
        
        console.log("Landing from fall - physics state reset");
      } else if (isFalling.current && fallStartTime.current > 0) {
        // Safety timeout - if been falling for more than 5 seconds and near ground, force landing
        const fallDuration = Date.now() - fallStartTime.current;
        if (fallDuration > 5000 && isNearGround) {
          console.log("Force landing after long fall");
          isFalling.current = false;
          fallStartTime.current = 0;
          hasPlayedFallSound.current = false;
          setIsJumping(false);
          
          // Reset physics state here too
          const currentVel = rb.current.linvel();
          rb.current.setLinvel({ 
            x: currentVel.x * 0.3, 
            y: currentVel.y, 
            z: currentVel.z * 0.3 
          }, true);
          rb.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
          
          if (!isLightingAction) {
            setAnimation("idle");
          }
        }
      }

      // Jump logic with lighting action detection (keyboard + touch)
      const jumpPressed = get().jump || touchControls.jump;
      if (jumpPressed && isOnGround.current && canJump.current) {
        canJump.current = false;
        setIsJumping(true);
        
        // Stop all movement during jump to prevent animation mixing
        const currentVel = rb.current.linvel();
        rb.current.setLinvel({ x: 0, y: currentVel.y, z: 0 }, true);
        
        setAnimation("jump");
        
        // Physics jump with timing to match 57-frame animation (approximately 1.9 seconds at 30fps)
        setTimeout(() => {
          if (rb.current) {
            const vel = rb.current.linvel();
            rb.current.setLinvel({ x: vel.x, y: JUMP_FORCE, z: vel.z }, true);
          }
        }, 300); // Delay takeoff to match animation windup
        
        // Play jump sound delayed to match animation timing
        setTimeout(() => {
          playSound('jump', { volume: 0.5, loop: false });
        }, 1500);
        
        // Reset can jump after full animation completes (57 frames ≈ 1900ms)
        setTimeout(() => {
          canJump.current = true;
          setIsJumping(false);
          // Only reset to idle if not moving
          const controls = get();
          const touchControls = getTouchControls();
          const isMoving = controls.forward || controls.backward || controls.left || controls.right ||
                          touchControls.forward || touchControls.backward || touchControls.left || touchControls.right;
          if (!isMoving && !isLightingAction) {
            setAnimation("idle");
          }
        }, 2000);
      }

      // Check for light key press (only trigger once per press)
      // lightPressed already defined above before early exit
      if (lightPressed && !wasLightPressed.current && !isLightingAction) {
        wasLightPressed.current = true;
        console.log('🔥 LIGHTING ACTION - touchLight:', touchControls.light, 'keyLight:', get().light);
        
        // IMMEDIATELY set lighting action and stop all movement to prevent interference
        setIsLightingAction(true);
        
        // Stop movement completely
        if (rb.current) {
          const currentVel = rb.current.linvel();
          rb.current.setLinvel({ x: 0, y: currentVel.y, z: 0 }, true);
        }
        
        // Check for nearby candles first, but don't light them yet
        if (GameState.findNearestCandle) {
          const nearestCandleInfo = GameState.findNearestCandle();
          console.log('🕯️ Finding nearest candle:', nearestCandleInfo);
          
          if (nearestCandleInfo && nearestCandleInfo.success) {
            // Calculate direction to candle and check if character is facing it
            const characterPos = GameState.characterPosition;
            const candlePos = nearestCandleInfo.candlePosition;
            const direction = candlePos.clone().sub(characterPos);
            const targetRotation = Math.atan2(direction.x, direction.z);
            
            // Get current character rotation
            const currentRotation = rotationTarget.current + characterRotationTarget.current;
            
            // Calculate angle difference (normalize to -π to π)
            let angleDiff = targetRotation - currentRotation;
            while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
            while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
            
            // Allow lighting only if facing within 15 degrees (π/12 radians) of the candle  
            const maxAngleDiff = Math.PI / 6; // 20 degrees
            
            if (Math.abs(angleDiff) <= maxAngleDiff) {
              console.log("✅ Character is facing candle - will light it at frame 55!");
              
              // Increment action ID for this specific lighting action
              const thisActionId = ++lightingActionId.current;
              
              // Set animation for all devices (mobile and desktop)
              console.log("Setting Light animation, current:", animation);
              setAnimation("Light");
              console.log("Light animation set, new should be: light");
              
              // Delay lighting to around frame 25-30 (midway through 50-frame animation)
              setTimeout(() => {
                if (GameState.lightNearestCandle) {
                  const result = GameState.lightNearestCandle();
                  if (result && result.success) {
                    console.log("🔥 Candle lit!");
                  }
                }
              }, 500); // Light candle midway through animation
              
              // Reset after animation completes (50 frames at 30fps = 1.67s, at 60fps = 0.83s)
              // Using 1 second to cover both frame rates
              setTimeout(() => {
                if (lightingActionId.current === thisActionId) {
                  setIsLightingAction(false);
                  if (!isFalling.current && !isJumping) {
                    setAnimation("idle");
                  }
                  console.log("🔓 Lighting action complete - movement enabled");
                } else {
                  console.log("⏭️ Skipping reset - newer lighting action in progress");
                }
              }, 1000); // 50 frames ≈ 1 second average
            } else {
              console.log("❌ Character not facing candle - turn toward it first!", 
                `Angle diff: ${(angleDiff * 180 / Math.PI).toFixed(1)}°`);
              // Reset lighting action since no animation will play
              setIsLightingAction(false);
            }
          } else {
            console.log("❌ No candles nearby to light");
            // Reset lighting action since no animation will play
            setIsLightingAction(false);
          }
        } else {
          // No candle system available - play animation for testing
          console.log("⚠️ No candle system - playing animation for testing");
          setAnimation("Light");
          
          // Reset after animation completes
          setTimeout(() => {
            setIsLightingAction(false);
            if (!isFalling.current && !isJumping) {
              setAnimation("idle");
            }
          }, 1900);
        }
      }

      // Light button tracking now happens above before early exit

      // Note: Removed immediate manual reset - let timeout handle animation completion

      // Old spinning torch logic removed - now using full Light animation

      // Reset jump ability when on ground (keyboard + touch)
      if (isOnGround.current && !get().jump && !touchControls.jump) {
        canJump.current = true;
        // Reset jumping state when we land and stop pressing jump
        if (isJumping) {
          setIsJumping(false);
          console.log("LANDED - Resetting jump state");
        }
      }


      // Zoom control - maintain zoom state independently of movement (keyboard + touch)
      if (get().zoom || touchControls.zoom) {
        cameraDistance.current = Math.max(1, cameraDistance.current - ZOOM_DISTANCE * 0.05);
      } else {
        cameraDistance.current = Math.min(4, cameraDistance.current + 0.02);
      }

      // Look up control - tilt camera upward to see high objects like the warlock circle (keyboard + touch)
      if (get().lookUp || touchControls.lookUp) {
        cameraPitch.current = Math.min(Math.PI / 4, cameraPitch.current + 0.02); // Look up (positive pitch)
      } else {
        cameraPitch.current = Math.max(0, cameraPitch.current - 0.02); // Return to normal
      }

      character.current.rotation.y = lerpAngle(
        character.current.rotation.y,
        characterRotationTarget.current,
        0.1
      );

      // Clamp very small velocities to prevent jittering
      if (Math.abs(vel.x) < 0.01) vel.x = 0;
      if (Math.abs(vel.z) < 0.01) vel.z = 0;
      
      // Apply stronger damping when on ground and not moving
      if (isOnGround.current && movement.x === 0 && movement.z === 0) {
        vel.x *= 0.5; // More aggressive stopping
        vel.z *= 0.5;
      }

      // Physics-based step climbing using momentum
      if ((movement.x !== 0 || movement.z !== 0) && isOnGround.current) {
        const horizontalSpeed = Math.sqrt(vel.x * vel.x + vel.z * vel.z);
        const movementIntensity = Math.sqrt(movement.x * movement.x + movement.z * movement.z);
        
        // More sensitive detection - if we're pressing movement but not getting much speed
        if (horizontalSpeed < speed * 0.7 && movementIntensity > 0.1) {
          // Use forward momentum to "tip" over obstacles
          const stepForce = Math.min(horizontalSpeed + 1.0, 3.0); // Scale with current momentum
          vel.y = Math.max(vel.y, stepForce);
          
          // Also add a small forward boost to help get over the step
          const forwardBoost = 0.3;
          vel.x += Math.sign(movement.x) * forwardBoost * movementIntensity;
          vel.z += Math.sign(movement.z) * forwardBoost * movementIntensity;
          
          console.log("Step climbing with momentum - force:", stepForce, "horizontalSpeed:", horizontalSpeed);
        }
      }

      rb.current.setLinvel(vel, true);
    }

    character.current.getWorldPosition(GameState.characterPosition);
    
    // Update reactive position properties for UI
    GameState.characterY = Math.round(GameState.characterPosition.y);
    GameState.characterZ = Math.round(GameState.characterPosition.z);

    // Set spawn point on first frame when character is on solid ground
    if (!hasSetSpawnPoint.current && isOnGround.current) {
      spawnPoint.current.copy(GameState.characterPosition);
      hasSetSpawnPoint.current = true;
    }

    // Fall detection and respawn
    if (GameState.characterPosition.y < FALL_THRESHOLD) {
      if (!hasFallen.current) {
        hasFallen.current = true;
        
        // Play fall sound for actual death
        playSound('fall', { volume: 0.7, loop: false });
        
        // Trigger respawn overlay - user will choose to respawn or exit
        GameState.triggerRespawn = true;
        
        // Stop the character from continuing to fall
        rb.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
        rb.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
        
        // The RespawnOverlay will handle respawn via page reload
        
        // Update game state
        GameState.characterPosition.copy(spawnPoint.current);
        GameState.containerRotation = 0;
        
        // Stop walking sound if playing
        if (isWalking.current) {
          stopSound('walking');
          isWalking.current = false;
        }
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

    // Update camera position based on zoom distance and pitch
    const baseCameraHeight = 3.5; // Default camera height
    const pitchOffset = Math.sin(cameraPitch.current) * cameraDistance.current;
    cameraPosition.current.position.z = -cameraDistance.current * Math.cos(cameraPitch.current);
    cameraPosition.current.position.y = baseCameraHeight + pitchOffset;

    cameraPosition.current.getWorldPosition(cameraWorldPosition.current);
    camera.position.lerp(cameraWorldPosition.current, 0.1);

    if (cameraTarget.current) {
      cameraTarget.current.getWorldPosition(cameraLookAtWorldPosition.current);
      
      // Adjust look-at target based on pitch to actually look up/down
      const adjustedLookAt = cameraLookAtWorldPosition.current.clone();
      adjustedLookAt.y += Math.tan(cameraPitch.current) * 5; // Adjust vertical look-at based on pitch
      
      cameraLookAt.current.lerp(adjustedLookAt, 0.1);
      camera.lookAt(cameraLookAt.current);
    }

  });

  return (
<RigidBody 
  colliders={false} 
  lockRotations 
  ref={rb} 
  userData={{ isCharacter: true }} 
  position={[0, 0, 0]} // change this value to move character's start position on platform
  friction={0.2}  // Lower friction helps with step climbing
  restitution={0}
  linearDamping={0.5}  // Lower damping for better movement
>
      <group ref={container}>
        <group ref={cameraTarget} position-z={24.5} />
        <group 
          ref={cameraPosition} 
          position-y={3.5} 
          position-z={1} 
        />
        <group ref={character} userData={{ isCharacter: true }}>
          <Character 
            key={`anim-${animationCounter.current}`} // Force remount only when animation changes
            scale={.75} 
            position-y={1.4} 
            position-z={0}
            animation={animationRef.current} // Use ref for immediate value
            lightingAction={isLightingAction}
          />
        </group>
      </group>
      {/* Single box collider that doesn't extend below feet */}
      {/* Lower body: capsule for smooth movement */}
      {/* Lower body: very narrow for step climbing */}
      {/* <CapsuleCollider 
        args={[0.1, 0.3]} 
        position={[0, 1.7, 0]} 
        debug 
      /> */}
        <BallCollider 
    args={[0.55]} 
    position={[0, 2, 0]}  // Position at feet level
  />
      {/* Upper body: slightly wider for shoulders/head */}
  <CapsuleCollider 
    args={[0.4, 0.25]} 
    position={[0, 2.3, 0]} 
  />
      

    </RigidBody>
  );
};

