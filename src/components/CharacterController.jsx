import { useKeyboardControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { CapsuleCollider, CuboidCollider, RigidBody, useRapier } from "@react-three/rapier";
import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { MathUtils, Vector3 } from "three";
import { degToRad } from "three/src/math/MathUtils.js";
import { Character } from "../../illumin80/components/Character";

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

export const CharacterController = ({ touchControls = null, freeCameraMode = false }) => {
  const { camera } = useThree();
  const { world } = useRapier();
  // Fixed values instead of Leva controls
  const WALK_SPEED = 1.4;
  const RUN_SPEED = 2.6;
  const ROTATION_SPEED = degToRad(0.5);
  const JUMP_FORCE = 8;
  const ZOOM_DISTANCE = 2;
  const FALL_THRESHOLD = -3; // Lava is at -0.5, trigger respawn below that
  const rb = useRef();
  const container = useRef();
  const character = useRef();
  
  // Platform tracking refs
  const currentPlatform = useRef(null);
  const platformBody = useRef(null); // Direct reference to platform rigid body
  const lastPlatformPosition = useRef(new Vector3());
  const platformVelocity = useRef(new Vector3());
  const platformOffsets = useRef(new Map()); // Track each platform's position
  
  // Use provided touch controls or default to empty
  const getTouchControls = () => {
    if (touchControls && touchControls.current) {
      return {
        forward: false,
        backward: false,
        left: false,
        right: false,
        jump: touchControls.current.jump || false,
        run: touchControls.current.sprint || false,
        light: false,
        zoom: false,
        lookUp: false
      };
    }
    return { forward: false, backward: false, left: false, right: false, jump: false, run: false, light: false, zoom: false, lookUp: false };
  };
  
  const getMovementVector = () => {
    if (touchControls && touchControls.current && touchControls.current.movement) {
      return touchControls.current.movement;
    }
    return { x: 0, z: 0 };
  };

  // Simplified - no touch action handling needed for this demo

  const [animation, setAnimation] = useState("idle");
  const animationRef = useRef("idle"); // Keep ref for consistency but don't force remounting
  
  // Clean animation setter without force remounting
  const handleSetAnimation = (newAnimation) => {
    const normalized = newAnimation.toLowerCase();
    if (normalized !== animationRef.current) {
      if (normalized === "light") {
        console.log(`🎬 LIGHT ANIMATION SET: "${normalized}"`);
      }
      animationRef.current = normalized;
      // Force state update for critical animations like Light
      if (normalized === "light") {
        console.log(`🎬 FORCING LIGHT ANIMATION STATE UPDATE`);
      }
      setAnimation(normalized);
    }
  };
  const [isLightingAction, setIsLightingAction] = useState(false);
  const isLightingActionRef = useRef(false); // Immediate ref to prevent animation conflicts
  const [isJumping, setIsJumping] = useState(false);
  const wasLightPressed = useRef(false);
  const lightingActionId = useRef(0);  // Track which lighting action is current
  // Removed originalRotation and spinStartTime - no longer needed for spinning torch

  const characterRotationTarget = useRef(Math.PI / 2); // Start facing toward positive X (across lava)
  const rotationTarget = useRef(Math.PI / 2); // Camera also faces across lava initially
  const cameraTarget = useRef();
  const cameraPosition = useRef();
  const cameraWorldPosition = useRef(new Vector3());
  const cameraLookAtWorldPosition = useRef(new Vector3());
  const cameraLookAt = useRef(new Vector3());
  const [, get] = useKeyboardControls();
  const isClicking = useRef(false);
  const isOnGround = useRef(false);
  const canJump = useRef(true);
  const jumpTimeoutRef = useRef(null);
  const resetJumpTimeoutRef = useRef(null);
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
  
  // Free camera state
  const freeCameraPosition = useRef(new Vector3(-22, 8, 10));
  const freeCameraRotation = useRef({ x: 0, y: 0 });
  const lastMousePosition = useRef({ x: 0, y: 0 });

  useEffect(() => {
    // Check if mobile device
    isMobileDevice.current = window.innerWidth <= 768 || 'ontouchstart' in window;
    
    const onMouseDown = (e) => {
      isClicking.current = true;
      // Prevent text selection
      e.preventDefault();
    };
    const onMouseUp = () => {
      isClicking.current = false;
    };
    
    // Prevent context menu on right click
    const onContextMenu = (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };
    
    // Prevent text selection which triggers dictionary
    const onSelectStart = (e) => {
      e.preventDefault();
      return false;
    };
    
    // Prevent double-click text selection
    const onDoubleClick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };
    
    // Prevent drag events that might trigger dictionary
    const onDragStart = (e) => {
      e.preventDefault();
      return false;
    };
    
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("mouseup", onMouseUp);
    document.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("selectstart", onSelectStart);
    document.addEventListener("dblclick", onDoubleClick);
    document.addEventListener("dragstart", onDragStart);
    
    // Also prevent on the canvas element specifically
    const canvas = document.querySelector('canvas');
    if (canvas) {
      canvas.addEventListener("contextmenu", onContextMenu);
      canvas.addEventListener("selectstart", onSelectStart);
      canvas.addEventListener("dblclick", onDoubleClick);
    }
    
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("contextmenu", onContextMenu);
      document.removeEventListener("selectstart", onSelectStart);
      document.removeEventListener("dblclick", onDoubleClick);
      document.removeEventListener("dragstart", onDragStart);
      
      if (canvas) {
        canvas.removeEventListener("contextmenu", onContextMenu);
        canvas.removeEventListener("selectstart", onSelectStart);
        canvas.removeEventListener("dblclick", onDoubleClick);
      }
    };
  }, []);


  // Cleanup effect for timeouts when component unmounts
  useEffect(() => {
    return () => {
      if (jumpTimeoutRef.current) clearTimeout(jumpTimeoutRef.current);
      if (resetJumpTimeoutRef.current) clearTimeout(resetJumpTimeoutRef.current);
    };
  }, []);
  
  // Frame limiter for mobile
  const frameCount = useRef(0);
  const isMobile = useRef(window.innerWidth <= 768 || 'ontouchstart' in window);
  
  useFrame(({ camera, mouse }) => {
    frameCount.current++;
    
    // Skip some frames on mobile for better performance
    const skipFrames = isMobile.current ? 2 : 1; // Process every 3rd frame on mobile
    const shouldSkipFrame = frameCount.current % skipFrames !== 0;
    
    // Handle free camera mode
    if (freeCameraMode) {
      // Get keyboard input for free camera movement
      const controls = get();
      const speed = controls.run ? 0.5 : 0.2; // Camera fly speed
      
      // Update free camera position based on WASD
      const forward = new Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
      const right = new Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
      
      if (controls.forward) {
        freeCameraPosition.current.addScaledVector(forward, speed);
      }
      if (controls.backward) {
        freeCameraPosition.current.addScaledVector(forward, -speed);
      }
      if (controls.left) {
        freeCameraPosition.current.addScaledVector(right, -speed);
      }
      if (controls.right) {
        freeCameraPosition.current.addScaledVector(right, speed);
      }
      if (controls.jump) { // Space for up
        freeCameraPosition.current.y += speed;
      }
      
      // Mouse look for free camera
      if (isClicking.current) {
        const deltaX = mouse.x - lastMousePosition.current.x;
        const deltaY = mouse.y - lastMousePosition.current.y;
        
        freeCameraRotation.current.y -= deltaX * 2;
        freeCameraRotation.current.x -= deltaY * 2;
        freeCameraRotation.current.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, freeCameraRotation.current.x));
      }
      lastMousePosition.current = { x: mouse.x, y: mouse.y };
      
      // Apply free camera position and rotation
      camera.position.copy(freeCameraPosition.current);
      camera.rotation.order = 'YXZ';
      camera.rotation.y = freeCameraRotation.current.y;
      camera.rotation.x = freeCameraRotation.current.x;
      
      // Character continues to run physics but we don't control it
      return;
    } else {
      // When switching back from free camera, store the camera state
      if (lastMousePosition.current.x !== 0 || lastMousePosition.current.y !== 0) {
        // Reset for next free camera session
        freeCameraPosition.current.copy(camera.position);
      }
    }
    
    // Skip character position updates for simplified demo
    
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
      // Character physics processing
      
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

      // Check for light button BEFORE blocking movement to ensure animation can be set
      const lightPressed = get().light || touchControls.light;
      
      // Handle light key press (moved here to happen before early return)
      if (lightPressed && !wasLightPressed.current && !isLightingAction) {
        wasLightPressed.current = true;
        console.log('🔥 LIGHTING ACTION - touchLight:', touchControls.light, 'keyLight:', get().light);
        
        // IMMEDIATELY set ref to prevent other animation logic from interfering
        isLightingActionRef.current = true;
        
        // Stop movement completely FIRST
        if (rb.current) {
          const currentVel = rb.current.linvel();
          rb.current.setLinvel({ x: 0, y: currentVel.y, z: 0 }, true);
        }
        
        // Set lighting action state
        setIsLightingAction(true);
        
        // Simplified lighting for demo - no candle system
        if (false) {
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
            
            // Debug logging
            console.log('🧭 DIRECTION DEBUG:');
            console.log('Character pos:', characterPos.x.toFixed(2), characterPos.z.toFixed(2));
            console.log('Candle pos:', candlePos.x.toFixed(2), candlePos.z.toFixed(2));
            console.log('Direction vec:', direction.x.toFixed(2), direction.z.toFixed(2));
            console.log('Target rotation:', (targetRotation * 180 / Math.PI).toFixed(1) + '°');
            console.log('Current rotation:', (currentRotation * 180 / Math.PI).toFixed(1) + '°');
            console.log('Angle diff:', (angleDiff * 180 / Math.PI).toFixed(1) + '°');
            
            // Allow lighting only if facing within 30 degrees of the candle (realistic aiming)
            const maxAngleDiff = Math.PI / 6; // 30 degrees - must be facing candle directly
            
            if (Math.abs(angleDiff) <= maxAngleDiff) {
              console.log("✅ Character is within range - auto-rotating to face candle!");
              
              // Calculate current distance to candle
              const currentDistance = nearestCandleInfo.candlePosition.distanceTo(characterPos);
              console.log(`📏 Distance to candle: ${currentDistance.toFixed(2)} units`);
              
              // Only proceed if within reasonable animation range (not too far)
              const maxAnimationDistance = 4.5; // Maximum distance for animation to look good
              const minAnimationDistance = 4; // Increased - moves character back if closer than this
              
              if (currentDistance > maxAnimationDistance) {
                console.log("❌ Too far from candle for animation to look good");
                setIsLightingAction(false);
                isLightingActionRef.current = false;
                return;
              }
              
              if (currentDistance < minAnimationDistance) {
                console.log("⚠️ Very close to candle - adjusting slightly backward");
                // Only move backward if TOO close
                const moveBack = minAnimationDistance - currentDistance;
                const moveDirection = direction.normalize();
                const newPos = characterPos.clone().sub(moveDirection.multiplyScalar(moveBack));
                
                if (rb.current) {
                  rb.current.setTranslation({
                    x: newPos.x,
                    y: rb.current.translation().y,
                    z: newPos.z
                  }, true);
                }
              }
              
              // Smoothly rotate character to face the candle exactly (no 10-degree offset)
              characterRotationTarget.current = targetRotation - rotationTarget.current;
              
              // Apply rotation immediately for better visual feedback
              if (character.current) {
                character.current.rotation.y = characterRotationTarget.current;
              }
              
              // Store the target candle name to ensure we light the correct one
              const targetCandleName = nearestCandleInfo.candleName;
              
              // Increment action ID for this specific lighting action
              const thisActionId = ++lightingActionId.current;
              
              // Set animation IMMEDIATELY using flushSync to force synchronous update
              console.log("Setting Light animation, current:", animation);
              
              // Force synchronous animation state update
              flushSync(() => {
                setAnimation("light");
                animationRef.current = "light";
              });
              console.log("🎬 REACH ANIMATION SET with flushSync, new should be: light");
              console.log("🎬 Current animation state after flushSync:", animation);
              console.log("🎬 Current animationRef after flushSync:", animationRef.current);
              console.log("🔒 isLightingActionRef.current:", isLightingActionRef.current);
              
              // Delay lighting to around frame 25-30 (midway through 50-frame animation)
              setTimeout(() => {
                if (GameState.lightNearestCandle) {
                  const result = GameState.lightNearestCandle();
                  if (result && result.success) {
                    console.log("🔥 Candle lit!");
                  }
                }
              }, 1100); // Light candle midway through 66-frame animation (~33 frames at 30fps)
              
              // Reset after animation completes (66 frames at 30fps = 2.2s, at 60fps = 1.1s)
              // Wait for full animation + extra time for smooth transition
              setTimeout(() => {
                if (lightingActionId.current === thisActionId) {
                  setIsLightingAction(false);
                  isLightingActionRef.current = false; // Clear ref
                  if (!isFalling.current && !isJumping) {
                    handleSetAnimation("idle");
                  }
                  console.log("🔓 Lighting action complete - movement enabled");
                } else {
                  console.log("⏭️ Skipping reset - newer lighting action in progress");
                }
              }, 2200); // 66 frames + buffer to let animation complete naturally
            } else {
              console.log("❌ Character not facing candle - turn toward it first!", 
                `Angle diff: ${(angleDiff * 180 / Math.PI).toFixed(1)}°`);
              // Reset lighting action since no animation will play
              setIsLightingAction(false);
              isLightingActionRef.current = false;
            }
          } else {
            console.log("❌ No candles nearby to light");
            // Reset lighting action since no animation will play
            setIsLightingAction(false);
          }
        } else {
          // No candle system available - play animation for testing
          console.log("⚠️ No candle system - playing animation for testing");
          flushSync(() => {
            setAnimation("light");
            animationRef.current = "light";
          });
          
          // Reset after animation completes
          setTimeout(() => {
            setIsLightingAction(false);
            isLightingActionRef.current = false;
            if (!isFalling.current && !isJumping) {
              handleSetAnimation("idle");
            }
          }, 1900);
        }
      }

      // Reset light pressed flag when released (must happen before early exit)
      if (!lightPressed) {
        wasLightPressed.current = false;
      }

      // Block movement during lighting action but allow animation updates
      if (isLightingAction) {
        rb.current.setLinvel({ x: 0, y: vel.y, z: 0 }, true);
        // Skip movement processing but continue with camera updates
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

      // Mouse drag controls - click and drag to move
      if (isClicking.current && !isMobileDevice.current) {
        // Use mouse position to control movement
        if (Math.abs(mouse.x) > 0.1) {
          movement.x = -mouse.x;  // Horizontal movement (strafe)
        }
        
        // Forward/backward movement based on vertical mouse position
        movement.z = mouse.y + 0.4;  // Slight forward bias for easier movement
        
        // Auto-run when moving far from center
        if (Math.abs(movement.x) > 0.5 || Math.abs(movement.z) > 0.5) {
          speed = RUN_SPEED;
        }
      }

      if (movement.x !== 0 && !isLightingActionRef.current) {
        rotationTarget.current += ROTATION_SPEED * movement.x;
      }

      if (movement.x !== 0 || movement.z !== 0) {
        // Debug movement during lighting action
        if (isLightingActionRef.current) {
          console.log('⚠️ MOVEMENT DETECTED DURING LIGHTING:', { x: movement.x, z: movement.z, speed });
        }
        
        // Don't update character rotation target during lighting action
        if (!isLightingActionRef.current) {
          characterRotationTarget.current = Math.atan2(movement.x, movement.z);
        }
        vel.x =
          Math.sin(rotationTarget.current + characterRotationTarget.current) *
          speed;
        vel.z =
          Math.cos(rotationTarget.current + characterRotationTarget.current) *
          speed;
        
        // Only set walk/run animations if not falling, jumping, or lighting
        if (!isFalling.current && !isJumping && !isLightingAction && !isLightingActionRef.current) {
          if (speed === RUN_SPEED) {
            handleSetAnimation("run");
          } else {
            handleSetAnimation("walk");
          }
        } else if (isLightingActionRef.current) {
          console.log('🚫 BLOCKING MOVEMENT ANIMATION - lighting action active');
        }
        
        // Play step sound at regular intervals
        if (isOnGround.current) {
          const currentTime = Date.now();
          const stepInterval = speed === RUN_SPEED ? 300 : 500; // Faster steps when running
          
          if (currentTime - lastStepTime.current > stepInterval) {
            // Sound removed for demo
            lastStepTime.current = currentTime;
          }
          isWalking.current = true;
        }
      } else if (!isFalling.current && !isJumping && !isLightingAction && !isLightingActionRef.current) {
        handleSetAnimation("idle");
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
      
      // Platform movement tracking using sensor collider
      let platformDeltaX = 0;
      let platformDeltaZ = 0;
      
      // If we have a platform body reference from the sensor, track its movement
      if (platformBody.current && isOnGround.current) {
        try {
          const currentPlatformPos = platformBody.current.translation();
          
          // Calculate movement delta
          platformDeltaX = currentPlatformPos.x - lastPlatformPosition.current.x;
          platformDeltaZ = currentPlatformPos.z - lastPlatformPosition.current.z;
          
          // Debug logging
          if (Math.abs(platformDeltaX) > 0.001 || Math.abs(platformDeltaZ) > 0.001) {
            console.log('Platform movement detected:', { 
              deltaX: platformDeltaX.toFixed(4), 
              deltaZ: platformDeltaZ.toFixed(4),
              currentX: currentPlatformPos.x.toFixed(2),
              currentZ: currentPlatformPos.z.toFixed(2)
            });
          }
          
          // Update last position for next frame
          lastPlatformPosition.current.set(currentPlatformPos.x, currentPlatformPos.y, currentPlatformPos.z);
          
        } catch (error) {
          console.warn('Platform tracking error:', error);
          platformBody.current = null;
          currentPlatform.current = null;
        }
      }
      
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
            handleSetAnimation("fall"); // Only animation, no sound
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
          handleSetAnimation("idle");
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
            handleSetAnimation("idle");
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
        
        handleSetAnimation("jump");
        
        // Clear any existing timeouts
        if (jumpTimeoutRef.current) clearTimeout(jumpTimeoutRef.current);
        if (resetJumpTimeoutRef.current) clearTimeout(resetJumpTimeoutRef.current);
        
        // Physics jump with timing to match 57-frame animation (approximately 1.9 seconds at 30fps)
        jumpTimeoutRef.current = setTimeout(() => {
          // Extra safety checks to prevent errors when component unmounts
          if (rb.current && rb.current.linvel) {
            try {
              const vel = rb.current.linvel();
              rb.current.setLinvel({ x: vel.x, y: JUMP_FORCE, z: vel.z }, true);
            } catch (e) {
              console.warn('Jump physics error:', e);
            }
          }
        }, 300); // Delay takeoff to match animation windup
        
        // Sound removed for demo
        
        // Reset can jump after full animation completes (57 frames ≈ 1900ms)
        resetJumpTimeoutRef.current = setTimeout(() => {
          canJump.current = true;
          setIsJumping(false);
          // Only reset to idle if not moving
          const controls = get();
          const touchControls = getTouchControls();
          const isMoving = controls.forward || controls.backward || controls.left || controls.right ||
                          touchControls.forward || touchControls.backward || touchControls.left || touchControls.right;
          if (!isMoving && !isLightingAction) {
            handleSetAnimation("idle");
          }
        }, 2000);
      }

      // Check for light key press (only trigger once per press)
      // lightPressed already defined above before early exit
      if (lightPressed && !wasLightPressed.current && !isLightingAction) {
        wasLightPressed.current = true;
        console.log('🔥 LIGHTING ACTION - touchLight:', touchControls.light, 'keyLight:', get().light);
        
        // Stop movement completely FIRST
        if (rb.current) {
          const currentVel = rb.current.linvel();
          rb.current.setLinvel({ x: 0, y: currentVel.y, z: 0 }, true);
        }
        
        // Set lighting action AFTER stopping movement
        setIsLightingAction(true);
        
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
            
            // Debug logging
            console.log('🧭 DIRECTION DEBUG:');
            console.log('Character pos:', characterPos.x.toFixed(2), characterPos.z.toFixed(2));
            console.log('Candle pos:', candlePos.x.toFixed(2), candlePos.z.toFixed(2));
            console.log('Direction vec:', direction.x.toFixed(2), direction.z.toFixed(2));
            console.log('Target rotation:', (targetRotation * 180 / Math.PI).toFixed(1) + '°');
            console.log('Current rotation:', (currentRotation * 180 / Math.PI).toFixed(1) + '°');
            console.log('Angle diff:', (angleDiff * 180 / Math.PI).toFixed(1) + '°');
            
            // Allow lighting only if facing within 30 degrees of the candle (realistic aiming)
            const maxAngleDiff = Math.PI / 6; // 30 degrees - must be facing candle directly
            
            if (Math.abs(angleDiff) <= maxAngleDiff) {
              console.log("✅ Character is within range - auto-rotating to face candle!");
              
              // Calculate current distance to candle
              const currentDistance = nearestCandleInfo.candlePosition.distanceTo(characterPos);
              console.log(`📏 Distance to candle: ${currentDistance.toFixed(2)} units`);
              
              // Only proceed if within reasonable animation range (not too far)
              const maxAnimationDistance = 4.5; // Maximum distance for animation to look good
              const minAnimationDistance = 4; // Increased - moves character back if closer than this
              
              if (currentDistance > maxAnimationDistance) {
                console.log("❌ Too far from candle for animation to look good");
                setIsLightingAction(false);
                isLightingActionRef.current = false;
                return;
              }
              
              if (currentDistance < minAnimationDistance) {
                console.log("⚠️ Very close to candle - adjusting slightly backward");
                // Only move backward if TOO close
                const moveBack = minAnimationDistance - currentDistance;
                const moveDirection = direction.normalize();
                const newPos = characterPos.clone().sub(moveDirection.multiplyScalar(moveBack));
                
                if (rb.current) {
                  rb.current.setTranslation({
                    x: newPos.x,
                    y: rb.current.translation().y,
                    z: newPos.z
                  }, true);
                }
              }
              
              // Smoothly rotate character to face the candle exactly (no 10-degree offset)
              characterRotationTarget.current = targetRotation - rotationTarget.current;
              
              // Apply rotation immediately for better visual feedback
              if (character.current) {
                character.current.rotation.y = characterRotationTarget.current;
              }
              
              // Store the target candle name to ensure we light the correct one
              const targetCandleName = nearestCandleInfo.candleName;
              
              // Increment action ID for this specific lighting action
              const thisActionId = ++lightingActionId.current;
              
              // Set animation for all devices (mobile and desktop)
              console.log("Setting Light animation, current:", animation);
              flushSync(() => {
            setAnimation("light");
            animationRef.current = "light";
          });
              console.log("Light animation set, new should be: light");
              
              // Delay lighting to around frame 25-30 (midway through 50-frame animation)
              setTimeout(() => {
                if (GameState.lightNearestCandle) {
                  const result = GameState.lightNearestCandle();
                  if (result && result.success) {
                    console.log("🔥 Candle lit!");
                  }
                }
              }, 1100); // Light candle midway through 66-frame animation (~33 frames at 30fps)
              
              // Reset after animation completes (50 frames at 30fps = 1.67s, at 60fps = 0.83s)
              // Using 1 second to cover both frame rates
              setTimeout(() => {
                if (lightingActionId.current === thisActionId) {
                  setIsLightingAction(false);
                  if (!isFalling.current && !isJumping) {
                    handleSetAnimation("idle");
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
              isLightingActionRef.current = false;
            }
          } else {
            console.log("❌ No candles nearby to light");
            // Reset lighting action since no animation will play
            setIsLightingAction(false);
          }
        } else {
          // No candle system available - play animation for testing
          console.log("⚠️ No candle system - playing animation for testing");
          flushSync(() => {
            setAnimation("light");
            animationRef.current = "light";
          });
          
          // Reset after animation completes
          setTimeout(() => {
            setIsLightingAction(false);
            isLightingActionRef.current = false;
            if (!isFalling.current && !isJumping) {
              handleSetAnimation("idle");
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

      // Don't update character rotation during lighting action to prevent unwanted spinning
      if (!isLightingActionRef.current) {
        character.current.rotation.y = lerpAngle(
          character.current.rotation.y,
          characterRotationTarget.current,
          0.1
        );
      } else {
        console.log('🔒 BLOCKING CHARACTER ROTATION during lighting action');
      }

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

      // Apply platform movement FIRST (before velocity)
      // This ensures the character moves with the platform
      if (platformBody.current && isOnGround.current) {
        if (Math.abs(platformDeltaX) > 0.0001 || Math.abs(platformDeltaZ) > 0.0001) {
          const currentPosition = rb.current.translation();
          // Apply the FULL platform movement to position
          rb.current.setTranslation({
            x: currentPosition.x + platformDeltaX,
            y: currentPosition.y,
            z: currentPosition.z + platformDeltaZ
          }, true);
          
          console.log('Applied platform movement to character:', {
            deltaX: platformDeltaX.toFixed(4),
            deltaZ: platformDeltaZ.toFixed(4),
            newX: (currentPosition.x + platformDeltaX).toFixed(2),
            newZ: (currentPosition.z + platformDeltaZ).toFixed(2),
            platformHandle: currentPlatform.current
          });
        }
      }
      
      // Then apply regular velocity for character movement
      rb.current.setLinvel(vel, true);
    }

    // Position tracking removed for demo

    // Simplified spawn and fall detection for demo
    if (!hasSetSpawnPoint.current && isOnGround.current) {
      hasSetSpawnPoint.current = true;
    }

    // Fall detection and respawn - Lava death!
    const currentPos = rb.current ? rb.current.translation() : { y: 0 };
    if (currentPos.y < FALL_THRESHOLD) {
      if (!hasFallen.current) {
        hasFallen.current = true;
        
        // Lava death message
        console.log("💀 Fell into the lava! Respawning at start...");
        
        // Flash effect or particle effect could be added here
        
        // Stop all momentum
        rb.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
        rb.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
        
        // Respawn at the starting platform with slight height
        rb.current.setTranslation({ x: -22, y: 3, z: 0 }, true);
        
        // Reset character rotation to face the lava field
        characterRotationTarget.current = Math.PI / 2;
        rotationTarget.current = Math.PI / 2;
        
        // Set respawn flags
        justRespawned.current = true;
        gameJustStarted.current = true;
        spawnTimer.current = Date.now();
      }
    } else {
      // Reset fall flag when not falling
      hasFallen.current = false;
    }

    // CAMERA - Update less frequently on mobile
    if (!shouldSkipFrame || !isMobile.current) {
      container.current.rotation.y = MathUtils.lerp(
        container.current.rotation.y,
        rotationTarget.current,
        isMobile.current ? 0.15 : 0.1 // Slightly faster lerp on mobile to compensate for skipped frames
      );

      // Container rotation tracking removed for demo

      // Update camera position based on zoom distance and pitch
      const baseCameraHeight = 4; // Default camera height
      const pitchOffset = Math.sin(cameraPitch.current) * cameraDistance.current;
      cameraPosition.current.position.z = -cameraDistance.current * Math.cos(cameraPitch.current);
      cameraPosition.current.position.y = baseCameraHeight + pitchOffset;

      cameraPosition.current.getWorldPosition(cameraWorldPosition.current);
      camera.position.lerp(cameraWorldPosition.current, isMobile.current ? 0.15 : 0.1);

      if (cameraTarget.current) {
        cameraTarget.current.getWorldPosition(cameraLookAtWorldPosition.current);
        
        // Adjust look-at target based on pitch to actually look up/down
        const adjustedLookAt = cameraLookAtWorldPosition.current.clone();
        adjustedLookAt.y += Math.tan(cameraPitch.current) * 5; // Adjust vertical look-at based on pitch
        
        cameraLookAt.current.lerp(adjustedLookAt, isMobile.current ? 0.15 : 0.1);
        camera.lookAt(cameraLookAt.current);
      }
    }

  });

  return (
<RigidBody 
  colliders={false} 
  lockRotations 
  ref={rb} 
  userData={{ isCharacter: true }} 
  position={[-22, 2, 0]} // Starting on left land platform
  friction={0.2}  // Lower friction helps with step climbing
  restitution={0}
  linearDamping={0.5}  // Lower damping for better movement
>
      <group ref={container}>
        <group ref={cameraTarget} position-z={24.5} />
        <group 
          ref={cameraPosition} 
          position-y={4.5} 
          position-z={2} 
        />
        <group ref={character} userData={{ isCharacter: true }}>
          <Character 
            scale={1} 
            position-y={1.7} 
            position-z={0}p
            animation={animation} // Use state value directly
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
        {/* <BallCollider 
    args={[0.55]} 
    position={[0, 0.6, 0]}  // Lower position for better ground contact
  /> */}
      {/* Upper body: slightly wider for shoulders/head */}
  {/* Single capsule collider for the character with platform detection */}
  <CapsuleCollider 
    args={[0.6, 0.4]} 
    position={[0, 2.3, 0]}
    onCollisionEnter={({ other }) => {
      // Platform collision detected
      if (other.rigidBody && other.rigidBody.bodyType() === 2) {
        console.log('Collided with platform:', other.rigidBody.handle);
        platformBody.current = other.rigidBody;
        currentPlatform.current = other.rigidBody.handle;
        
        // Initialize platform tracking
        const pos = other.rigidBody.translation();
        lastPlatformPosition.current.set(pos.x, pos.y, pos.z);
      }
    }}
    onCollisionExit={({ other }) => {
      // Platform collision ended
      if (other.rigidBody && other.rigidBody.bodyType() === 2) {
        console.log('Left platform:', other.rigidBody.handle);
        if (currentPlatform.current === other.rigidBody.handle) {
          platformBody.current = null;
          currentPlatform.current = null;
        }
      }
    }}
  />
      

    </RigidBody>
  );
};

