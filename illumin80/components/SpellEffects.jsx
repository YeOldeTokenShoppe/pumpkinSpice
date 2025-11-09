import { PositionalAudio } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { degToRad } from "three/src/math/MathUtils.js";
import { VFXEmitter, VFXParticles, AppearanceMode } from "wawa-vfx";
import { useMagic } from "../hooks/useMagic";

export const SpellEffects = () => {
  return (
    <>
      <VFXS />
      <ActiveSpells />
    </>
  );
};

const VFXS = () => {
  return (
    <>
      <VFXParticles
        name="sparks"
        settings={{
          nbParticles: 100000,
          renderMode: "billboard",
          appearance: AppearanceMode.Circular,
          intensity: 3,
          fadeSize: [0.1, 0.1],
        }}
      />
      <VFXParticles
        name="spheres"
        settings={{
          nbParticles: 1000,
          renderMode: "mesh",
          appearance: AppearanceMode.Circular,
          intensity: 5,
          fadeSize: [0.7, 0.9],
          fadeAlpha: [0, 1],
        }}
      >
        <sphereGeometry args={[0.1, 8, 8]} />
      </VFXParticles>
      <VFXParticles
        name="icicle"
        settings={{
          nbParticles: 100,
          renderMode: "mesh",
          appearance: AppearanceMode.Circular,
          fadeAlpha: [0, 1.0],
          fadeSize: [0.2, 0.8],
        }}
      >
        <coneGeometry args={[0.3, 1.5, 6]} />
      </VFXParticles>
    </>
  );
};

const ActiveSpells = () => {
  const magic = useMagic();
  
  console.log("ActiveSpells rendering, spells:", magic.spells);
  
  if (!magic.spells || magic.spells.length === 0) {
    return null;
  }
  
  return magic.spells.map((spell) => {
    console.log("Rendering spell:", spell);
    return spell.name === "fire" ? (
      <FireSpell key={spell.id} spell={spell} />
    ) : (
      <IceSpell key={spell.id} spell={spell} />
    );
  });
};

const FireSpell = ({ spell }) => {
  const spellEmitter = useRef();
  const time = useRef(0);
  const blastAudio = useRef();
  
  useFrame((_, delta) => {
    time.current += delta;
    if (spellEmitter.current && time.current < 1) {
      // Move the spell projectile forward
      spellEmitter.current.position.x = spell.position.x + spell.direction.x * time.current * 10;
      spellEmitter.current.position.y = spell.position.y + 1 + Math.sin(time.current * Math.PI) * 0.5;
      spellEmitter.current.position.z = spell.position.z + spell.direction.z * time.current * 10;
    }
  });
  
  useEffect(() => {
    setTimeout(() => {
      if (blastAudio.current) {
        blastAudio.current.play();
      }
    }, 500);
  }, []);
  
  return (
    <group position={[spell.position.x, spell.position.y, spell.position.z]}>
      {/* SFXs - Using existing sounds as placeholders */}
      <PositionalAudio
        url="/sounds/whimsyCoin.wav"
        autoplay
        distance={20}
        loop={false}
      />
      <PositionalAudio
        url="/sounds/coins.mp3"
        distance={30}
        loop={false}
        ref={blastAudio}
      />
      
      {/* Projectile */}
      <VFXEmitter
        emitter="spheres"
        ref={spellEmitter}
        settings={{
          duration: 1,
          delay: 0,
          nbParticles: 100,
          spawnMode: "time",
          loop: false,
          startPositionMin: [0, 0, 0],
          startPositionMax: [0, 0, 0],
          startRotationMin: [0, 0, 0],
          startRotationMax: [0, 0, 0],
          particlesLifetime: [0.1, 0.1],
          speed: [5, 20],
          directionMin: [0, 0, 0],
          directionMax: [0, 0, 0],
          rotationSpeedMin: [0, 0, 0],
          rotationSpeedMax: [0, 0, 0],
          colorStart: ["red", "orange", "yellow"],
          colorEnd: ["red"],
          size: [0.05, 0.2],
        }}
      >
        <VFXEmitter
          emitter="sparks"
          settings={{
            duration: 0.5,
            delay: 0,
            nbParticles: 1000,
            spawnMode: "time",
            loop: false,
            startPositionMin: [-0.1, 0, -0.1],
            startPositionMax: [0.1, 0, 0.1],
            startRotationMin: [0, 0, 0],
            startRotationMax: [0, 0, 0],
            particlesLifetime: [0.5, 1],
            speed: [0.1, 5],
            directionMin: [-1, 1, -1],
            directionMax: [1, 1, 1],
            rotationSpeedMin: [0, 0, 0],
            rotationSpeedMax: [0, 0, 0],
            colorStart: ["red", "orange"],
            colorEnd: ["red", "orange"],
            size: [0.01, 0.1],
          }}
        />
      </VFXEmitter>
      
      {/* Impact Blast */}
      <VFXEmitter
        emitter="sparks"
        position={[spell.direction.x * 10, 1, spell.direction.z * 10]}
        settings={{
          duration: 1,
          delay: 0.5,
          nbParticles: 1200,
          spawnMode: "burst",
          loop: false,
          startPositionMin: [-0.25, -0.1, -0.25],
          startPositionMax: [0.25, 1, 0.25],
          startRotationMin: [0, 0, 0],
          startRotationMax: [0, 0, 0],
          particlesLifetime: [0.1, 1],
          speed: [1, 3],
          directionMin: [-1, 0, -1],
          directionMax: [1, 5, 1],
          rotationSpeedMin: [0, 0, 0],
          rotationSpeedMax: [0, 0, 0],
          colorStart: ["red", "orange"],
          colorEnd: ["red", "orange"],
          size: [0.01, 0.16],
        }}
      />
    </group>
  );
};

const IceSpell = ({ spell }) => {
  const spellEmitter = useRef();
  const time = useRef(0);
  const blastAudio = useRef();
  
  useFrame((_, delta) => {
    time.current += delta;
    if (spellEmitter.current && time.current < 1) {
      // Move the spell projectile forward
      spellEmitter.current.position.x = spell.position.x + spell.direction.x * time.current * 10;
      spellEmitter.current.position.y = spell.position.y + 1 + Math.cos(time.current * Math.PI) * 0.5;
      spellEmitter.current.position.z = spell.position.z + spell.direction.z * time.current * 10;
    }
  });
  
  useEffect(() => {
    setTimeout(() => {
      if (blastAudio.current) {
        blastAudio.current.play();
      }
    }, 500);
  }, []);
  
  return (
    <group position={[spell.position.x, spell.position.y, spell.position.z]}>
      {/* SFXs - Using existing sounds as placeholders for ice spell */}
      <PositionalAudio
        url="/sounds/slidingStone.mp3"
        autoplay
        distance={20}
        loop={false}
      />
      <PositionalAudio
        url="/sounds/choir.mp3"
        distance={30}
        loop={false}
        ref={blastAudio}
      />
      
      {/* Projectile */}
      <VFXEmitter
        emitter="spheres"
        ref={spellEmitter}
        settings={{
          duration: 1,
          delay: 0,
          nbParticles: 100,
          spawnMode: "time",
          loop: false,
          startPositionMin: [0, 0, 0],
          startPositionMax: [0, 0, 0],
          startRotationMin: [0, 0, 0],
          startRotationMax: [0, 0, 0],
          particlesLifetime: [0.1, 0.1],
          speed: [5, 20],
          directionMin: [0, 0, 0],
          directionMax: [0, 0, 0],
          rotationSpeedMin: [0, 0, 0],
          rotationSpeedMax: [0, 0, 0],
          colorStart: ["white", "skyblue"],
          colorEnd: ["white"],
          size: [0.05, 0.2],
        }}
      >
        <VFXEmitter
          emitter="sparks"
          settings={{
            duration: 0.5,
            delay: 0,
            nbParticles: 1000,
            spawnMode: "time",
            loop: false,
            startPositionMin: [-0.1, 0, -0.1],
            startPositionMax: [0.1, 0, 0.1],
            startRotationMin: [0, 0, 0],
            startRotationMax: [0, 0, 0],
            particlesLifetime: [0.5, 1],
            speed: [0.1, 5],
            directionMin: [-1, 1, -1],
            directionMax: [1, 1, 1],
            rotationSpeedMin: [0, 0, 0],
            rotationSpeedMax: [0, 0, 0],
            colorStart: ["white", "skyblue"],
            colorEnd: ["white", "skyblue"],
            size: [0.01, 0.1],
          }}
        />
      </VFXEmitter>
      
      {/* Impact Blast */}
      <VFXEmitter
        emitter="sparks"
        position={[spell.direction.x * 10, 1, spell.direction.z * 10]}
        settings={{
          duration: 0.5,
          delay: 0.5,
          nbParticles: 120,
          spawnMode: "burst",
          loop: false,
          startPositionMin: [-0.5, 0, -0.5],
          startPositionMax: [0.5, 1, 0.5],
          startRotationMin: [0, 0, 0],
          startRotationMax: [0, 0, 0],
          particlesLifetime: [0.1, 1.5],
          speed: [0.5, 2],
          directionMin: [-1, 0, -1],
          directionMax: [1, 1, 1],
          rotationSpeedMin: [0, 0, 0],
          rotationSpeedMax: [0, 0, 0],
          colorStart: ["white", "skyblue"],
          colorEnd: ["white", "skyblue"],
          size: [0.01, 0.1],
        }}
      />
      
      <VFXEmitter
        emitter="icicle"
        position={[spell.direction.x * 10, 0.1, spell.direction.z * 10]}
        settings={{
          duration: 1,
          delay: 0.5,
          nbParticles: 5,
          spawnMode: "burst",
          loop: false,
          startPositionMin: [-0.5, 0, -0.5],
          startPositionMax: [0.5, 0, 0.5],
          startRotationMin: [degToRad(180 - 20), 0, degToRad(-30)],
          startRotationMax: [degToRad(180 + 20), 0, degToRad(30)],
          particlesLifetime: [1, 1],
          speed: [5, 20],
          directionMin: [0, 0, 0],
          directionMax: [0, 0, 0],
          rotationSpeedMin: [0, 0, 0],
          rotationSpeedMax: [0, 0, 0],
          colorStart: ["skyblue", "white"],
          colorEnd: ["skyblue", "white"],
          size: [0.5, 1],
        }}
      />
    </group>
  );
};