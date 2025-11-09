import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { VFXEmitter, VFXParticles } from "wawa-vfx";
import { useMagic } from "../hooks/useMagic";

export const SimpleSpellTest = () => {
  const magic = useMagic();
  const hasActiveSpell = magic.spells && magic.spells.length > 0;
  
  console.log("SimpleSpellTest rendering, hasActiveSpell:", hasActiveSpell, "spells:", magic.spells);
  
  return (
    <>
      {/* Define the particle system */}
      <VFXParticles
        name="testParticles"
        settings={{
          nbParticles: 10000,
          renderMode: "billboard",
          intensity: 5,
        }}
      >
        <meshBasicMaterial color="red" />
      </VFXParticles>
      
      {/* Only show emitter when there's an active spell */}
      {hasActiveSpell && (
        <VFXEmitter
          emitter="testParticles"
          position={[0, 2, 0]}
          settings={{
            duration: 2,
            nbParticles: 1000,
            spawnMode: "burst",
            loop: false,
            startPositionMin: [-1, -1, -1],
            startPositionMax: [1, 1, 1],
            particlesLifetime: [1, 2],
            speed: [1, 5],
            directionMin: [-1, -1, -1],
            directionMax: [1, 1, 1],
            colorStart: ["#ff0000", "#ffff00"],
            colorEnd: ["#ff0000", "#000000"],
            size: [0.1, 0.5],
          }}
        />
      )}
    </>
  );
};