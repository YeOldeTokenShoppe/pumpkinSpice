import { VFXEmitter, VFXParticles } from "wawa-vfx";
import { useEffect, useRef } from "react";

export const TestVFX = () => {
  return (
    <>
      <VFXParticles
        name="sparks"
        geometry={<coneGeometry args={[0.5, 1, 8, 1]} />}
        settings={{
          nbParticles: 100000,
          renderMode: "billboard",
          intensity: 3,
          fadeSize: [0.1, 0.1],
        }}
      />
      
      <VFXEmitter
        emitter="sparks"
        position={[0, 1, -5]}
        settings={{
          duration: 1,
          delay: 0,
          nbParticles: 300,
          spawnMode: "burst",
          loop: true,
          startPositionMin: [-0.1, -0.1, -0.1],
          startPositionMax: [0.1, 0.1, 0.1],
          startRotationMin: [0, 0, 0],
          startRotationMax: [0, 0, 0],
          particlesLifetime: [0.1, 1],
          speed: [2, 8],
          directionMin: [-1, 0, -1],
          directionMax: [1, 1, 1],
          rotationSpeedMin: [0, 0, 0],
          rotationSpeedMax: [0, 0, 0],
          colorStart: ["#ffffff", "#d1beff"],
          colorEnd: ["#ffffff", "#5b18ff"],
          size: [0.05, 0.1],
        }}
      />
    </>
  );
};