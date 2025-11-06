import { OrthographicCamera } from "@react-three/drei";
import { Physics } from "@react-three/rapier";
import { useRef, useEffect } from "react";
import { DirectionalLightHelper } from "three";
import { useThree } from "@react-three/fiber";
import { useGameStore } from "../../src/lib/gameStore";
import { GameState } from "../../src/lib/GameState";
import { useSnapshot } from "valtio";
import { CharacterController } from "./CharacterController";
import { CandleSystem } from "../../src/components/CandleSystem";
import { Map } from "./Map";

export const maps = {
  underworld2: {
    scale: 0.7,
    position: [-0.1, -9.5, 7],
  },

};

export const Experience = ({ onTouchAction }) => {
  const shadowCameraRef = useRef();
  const directionalLightRef = useRef();
  const spotlightRef = useRef();
  const { scene } = useThree();
  
  // Get map from Valtio GameState and characterPosition from Zustand store
  const gameState = useSnapshot(GameState);
  const map = gameState.map || 'underworld2'; // default fallback
  const { characterPosition } = useGameStore();

  // useEffect(() => {
  //   if (directionalLightRef.current) {
  //     const helper = new DirectionalLightHelper(directionalLightRef.current, 5);
  //     scene.add(helper);
  //     return () => scene.remove(helper);
  //   }
  // }, [scene]);

  useEffect(() => {
    const updateSpotlight = () => {
      if (spotlightRef.current && characterPosition) {
        spotlightRef.current.position.set(
          characterPosition.x + 2,
          characterPosition.y + 5,
          characterPosition.z + 2
        );
        spotlightRef.current.target.position.set(
          characterPosition.x,
          characterPosition.y,
          characterPosition.z
        );
        spotlightRef.current.target.updateMatrixWorld();
      }
    };

    const interval = setInterval(updateSpotlight, 16); // ~60fps
    return () => clearInterval(interval);
  }, [characterPosition]);

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
          scale={maps[map]?.scale || 0.7}
          position={maps[map]?.position || [-0.1, -9.5, 7]}
          model={`models/${map}.glb`}
        />
        <CharacterController onTouchAction={onTouchAction} />
        <CandleSystem />
      </Physics>
    </>
  );
};
