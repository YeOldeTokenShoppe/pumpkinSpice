import { OrthographicCamera, Environment, Stats} from "@react-three/drei";
import { Physics } from "@react-three/rapier";
import { useRef, useEffect, useState } from "react";
import { DirectionalLightHelper } from "three";
import { useThree } from "@react-three/fiber";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { useGameStore } from "../../src/lib/gameStore";
import { GameState } from "../lib/GameState";
import { useSnapshot } from "valtio";
import { CharacterController } from "./CharacterController";
import { CandleSystem } from "./CandleSystem";
import { Map } from "./Map";
import { MonsterSystem } from "./MonsterSystem";
import { DemonCharacter } from "./DemonCharacter";


export const maps = {
  underworld3Japanese: {
    scale: 0.7,
    position: [-0.1, -9.5, 7],
  },

};

export const Experience = ({ onTouchAction, onLoad }) => {
  const shadowCameraRef = useRef();
  const directionalLightRef = useRef();
  const spotlightRef = useRef();
  const { scene } = useThree();
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  
  // Get map from Valtio GameState and characterPosition from Zustand store
  const gameState = useSnapshot(GameState);
  const map = gameState.map || 'underworld3Japanese'; // default fallback
  const { characterPosition } = useGameStore();


  const handleMapLoad = () => {
    setIsMapLoaded(true);
    if (onLoad) {
      onLoad();
    }
  };

  // useEffect(() => {
  //   if (directionalLightRef.current) {
  //     const helper = new DirectionalLightHelper(directionalLightRef.current, 5);
  //     scene.add(helper);
  //     return () => scene.remove(helper);
  //   }
  // }, [scene]);

  // useEffect(() => {
  //   const updateSpotlight = () => {
  //     if (spotlightRef.current && characterPosition) {
  //       spotlightRef.current.position.set(
  //         characterPosition.x + 2,
  //         characterPosition.y + 5,
  //         characterPosition.z + 2
  //       );
  //       spotlightRef.current.target.position.set(
  //         characterPosition.x,
  //         characterPosition.y,
  //         characterPosition.z
  //       );
  //       spotlightRef.current.target.updateMatrixWorld();
  //     }
  //   };

  //   const interval = setInterval(updateSpotlight, 16); // ~60fps
  //   return () => clearInterval(interval);
  // }, [characterPosition]);

  return (
    <>
      {/* Performance Stats - top left */}
      <Stats />
      
      {/* <OrbitControls /> */}
      <fog attach="fog" args={["#4a9fbb", 5, 35]} />
      {/* <ambientLight intensity={0.8} color="#6bb6cc" /> */}
          <Environment preset="night" />
      <directionalLight
        ref={directionalLightRef}
        intensity={1.4}
        castShadow
        position={[-1, 20, 35]}
        color="#87ceeb"
        shadow-mapSize-width={512}
        shadow-mapSize-height={512}
        shadow-bias={-0.0001}
        shadow-normalBias={0.02}
        shadow-radius={3}
        shadow-blurSamples={8}
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
      {/* <spotLight
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
      /> */}
 
      <Physics key={map}>
        <Map
          scale={maps[map]?.scale || 0.7}
          position={maps[map]?.position || [-0.1, -9.5, 7]}
          model={`models/${map}.glb`}
          onLoad={handleMapLoad}
        />
        {isMapLoaded && <CharacterController onTouchAction={onTouchAction} />}
        {/* {isMapLoaded && (
          <DemonCharacter 
            position={[0, -12, -3]} 
            scale={1.0} 
            animation="idle" 
          />
        )} */}
        <CandleSystem />
        {/* <MonsterSystem /> */}
      </Physics>
      
      {/* Post-processing effects - DISABLED for performance */}
      <EffectComposer>
        <Bloom 
          intensity={1.9}
          // width={300}
          // height={300}
          kernelSize={5}
          luminanceThreshold={0.55}
          luminanceSmoothing={0.025}
        />
      </EffectComposer>
    </>
  );
};
