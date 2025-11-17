import { useKeyboardControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { CapsuleCollider, BallCollider, RigidBody } from "@react-three/rapier";
import { useRef, useState } from "react";
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

export const SimpleCharacterController = () => {
  const { camera } = useThree();
  const WALK_SPEED = 1.4;
  const RUN_SPEED = 2.6;
  const ROTATION_SPEED = degToRad(0.5);
  const JUMP_FORCE = 6;
  
  const rb = useRef();
  const container = useRef();
  const character = useRef();
  
  const [animation, setAnimation] = useState("idle");
  const [isJumping, setIsJumping] = useState(false);
  
  const characterRotationTarget = useRef(0);
  const rotationTarget = useRef(0);
  const cameraTarget = useRef();
  const cameraPosition = useRef();
  const cameraWorldPosition = useRef(new Vector3());
  const cameraLookAtWorldPosition = useRef(new Vector3());
  const cameraLookAt = useRef(new Vector3());
  
  const [, get] = useKeyboardControls();
  const isOnGround = useRef(false);
  const canJump = useRef(true);
  const cameraDistance = useRef(3);

  useFrame(() => {
    if (!rb.current) return;

    const vel = rb.current.linvel();
    const movement = { x: 0, z: 0 };

    // Keyboard controls
    if (get().forward) movement.z = 1;
    if (get().backward) movement.z = -1;
    if (get().left) movement.x = 1;
    if (get().right) movement.x = -1;

    let speed = get().run ? RUN_SPEED : WALK_SPEED;

    if (movement.x !== 0) {
      rotationTarget.current += ROTATION_SPEED * movement.x;
    }

    if (movement.x !== 0 || movement.z !== 0) {
      characterRotationTarget.current = Math.atan2(movement.x, movement.z);
      vel.x = Math.sin(rotationTarget.current + characterRotationTarget.current) * speed;
      vel.z = Math.cos(rotationTarget.current + characterRotationTarget.current) * speed;
      
      if (!isJumping) {
        setAnimation(speed === RUN_SPEED ? "run" : "walk");
      }
    } else if (!isJumping) {
      setAnimation("idle");
    }

    // Ground detection
    const currentPos = rb.current.translation();
    const isNearGround = currentPos.y > -10 && currentPos.y < 5;
    const hasLowVerticalVelocity = Math.abs(vel.y) < 0.1;
    isOnGround.current = isNearGround && hasLowVerticalVelocity;

    // Jump
    if (get().jump && isOnGround.current && canJump.current) {
      canJump.current = false;
      setIsJumping(true);
      setAnimation("jump");
      
      setTimeout(() => {
        if (rb.current) {
          const vel = rb.current.linvel();
          rb.current.setLinvel({ x: vel.x, y: JUMP_FORCE, z: vel.z }, true);
        }
      }, 300);
      
      setTimeout(() => {
        canJump.current = true;
        setIsJumping(false);
        if (!get().forward && !get().backward && !get().left && !get().right) {
          setAnimation("idle");
        }
      }, 2000);
    }

    // Reset jump when on ground
    if (isOnGround.current && !get().jump) {
      canJump.current = true;
      if (isJumping) setIsJumping(false);
    }

    // Update character rotation
    if (character.current) {
      character.current.rotation.y = lerpAngle(
        character.current.rotation.y,
        characterRotationTarget.current,
        0.1
      );
    }

    rb.current.setLinvel(vel, true);

    // Camera updates
    if (container.current) {
      container.current.rotation.y = MathUtils.lerp(
        container.current.rotation.y,
        rotationTarget.current,
        0.1
      );

      if (cameraPosition.current) {
        cameraPosition.current.getWorldPosition(cameraWorldPosition.current);
        camera.position.lerp(cameraWorldPosition.current, 0.1);
      }

      if (cameraTarget.current) {
        cameraTarget.current.getWorldPosition(cameraLookAtWorldPosition.current);
        cameraLookAt.current.lerp(cameraLookAtWorldPosition.current, 0.1);
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
      position={[-25, 2, 0]}
      friction={0.2}
      restitution={0}
      linearDamping={0.5}
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
            scale={0.75} 
            position-y={1.4} 
            position-z={0}
            animation={animation}
          />
        </group>
      </group>
      
      <BallCollider 
        args={[0.55]} 
        position={[0, 2, 0]}
      />
      <CapsuleCollider 
        args={[0.4, 0.25]} 
        position={[0, 2.3, 0]} 
      />
    </RigidBody>
  );
};