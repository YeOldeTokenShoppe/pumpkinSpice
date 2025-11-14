import { useGLTF, useAnimations } from "@react-three/drei";
import { useEffect, useRef, useState } from "react";
import { GameState } from "../lib/GameState";
import { useSnapshot } from "valtio";
import { Vector3 } from "three";
import { useFrame } from "@react-three/fiber";

export function RedCandle(props) {
  const group = useRef();
  const { nodes, materials, animations } = useGLTF("/models/RedCandle.glb");
  const { actions } = useAnimations(animations, group);
  const [hasWaved, setHasWaved] = useState(false);
  const [isWaving, setIsWaving] = useState(false);
  
  // Listen to game state
  const gameState = useSnapshot(GameState);
  const shouldShow = gameState.characterZ >= 21;
  
  // Calculate distance to character
  const candlePosition = new Vector3(...(props.position || [0, 0, 0]));
  const characterPosition = gameState.characterPosition || new Vector3();
  const distanceToCharacter = candlePosition.distanceTo(characterPosition);
  const isCharacterNear = distanceToCharacter <= 4.0;

  useEffect(() => {
    if (!shouldShow || !actions) return;
    // Start with Waving animation when candle appears
    if (actions.Waving && !isWaving) {
      console.log('🕯️ RedCandle: Playing Waving animation');
      if (actions.Waving) actions.Waving.stop();
      actions.Waving.reset().play();
    }

    // Wave once when character gets close (and hasn't waved yet)
    if (isCharacterNear && !hasWaved && !isWaving && actions.Waving) {
      console.log('🕯️ RedCandle: Character near - waving once!');
      setIsWaving(true);
      setHasWaved(true);
      
      // Stop idle and play wave
      if (actions.Waving) actions.Waving.stop();
      actions.Waving.reset().play();
      
      // Return to idle after wave completes
      // Estimate wave duration (adjust based on your animation length)
      setTimeout(() => {
        if (actions.Waving) actions.Waving.stop();
        if (actions.Waving) {
          actions.Waving.reset().play();
        }
        setIsWaving(false);
        console.log('🕯️ RedCandle: Wave complete - back to idle');
      }, 3000); // Adjust timing based on your Waving animation length
    }
  }, [shouldShow, actions, isCharacterNear, hasWaved, isWaving]);

  // Reset wave state when character moves far away
  useEffect(() => {
    if (distanceToCharacter > 8.0 && hasWaved) {
      console.log('🕯️ RedCandle: Character moved away - resetting wave state');
      setHasWaved(false);
    }
  }, [distanceToCharacter, hasWaved]);


  // Don't render if character hasn't reached z=21 yet
  if (!shouldShow) {
    return null;
  }

  return (
    <group ref={group} {...props} dispose={null}>
      <primitive object={nodes.Scene || Object.values(nodes)[0]} />
    </group>
  );
}

useGLTF.preload("/models/RedCandle.glb");