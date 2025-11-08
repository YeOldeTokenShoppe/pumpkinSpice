import { OrthographicCamera } from "@react-three/drei";
import { Physics } from "@react-three/rapier";
import { useRef, useEffect, useState } from "react";
import { useSnapshot } from "valtio";
import { DirectionalLightHelper } from "three";
import { useThree } from "@react-three/fiber";
import { GameState } from "../lib/GameState";
import { CharacterController } from "./CharacterController";
import { CandleSystem } from "./CandleSystem";
import { Map } from "./Map";

export const maps = {
  underworld3: {
    scale: 0.7,
    position: [-0.1, -9.5, 7],
  },

};

export const Experience = () => {
  const shadowCameraRef = useRef();
  const directionalLightRef = useRef();
  const spotlightRef = useRef();
  const { scene } = useThree();
  

  const { map } = useSnapshot(GameState);

  useEffect(() => {
    if (directionalLightRef.current) {
      const helper = new DirectionalLightHelper(directionalLightRef.current, 5);
      scene.add(helper);
      return () => scene.remove(helper);
    }
  }, [scene]);

  useEffect(() => {
    const updateSpotlight = () => {
      if (spotlightRef.current) {
        const characterPos = GameState.characterPosition;
        spotlightRef.current.position.set(
          characterPos.x + 2,
          characterPos.y + 5,
          characterPos.z + 2
        );
        spotlightRef.current.target.position.set(
          characterPos.x,
          characterPos.y,
          characterPos.z
        );
        spotlightRef.current.target.updateMatrixWorld();
      }
    };

    const interval = setInterval(updateSpotlight, 16); // ~60fps
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* <OrbitControls /> */}
      <fog attach="fog" args={["#4a9fbb", 5, 35]} />
      <ambientLight intensity={2.3} color="#6bb6cc" />
      <directionalLight
        ref={directionalLightRef}
        intensity={1.4}
        castShadow
        position={[-1, 20, 35]}
        color="#87ceeb"
        shadow-mapSize-width={4096}
        shadow-mapSize-height={4096}
        shadow-bias={-0.0001}
        shadow-normalBias={0.02}
        shadow-radius={15}
        shadow-blurSamples={25}
      >
        <OrthographicCamera
          left={-60}
          right={60}
          top={60}
          bottom={-60}
          ref={shadowCameraRef}
          attach={"shadow-camera"}
        />
      </directionalLight>
      <spotLight
        ref={spotlightRef}
        intensity={1.5}
        angle={Math.PI / 6}
        penumbra={0.5}
        decay={2}
        distance={20}
        castShadow
        color="#ffffff"
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <Physics key={map} >
        <Map
          scale={maps[map].scale}
          position={maps[map].position}
          model={`models/${map}.glb`}
        />
        <CharacterController />
        <CandleSystem />
      </Physics>
    </>
  );
};
