import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { useMagic } from "../hooks/useMagic";
import * as THREE from "three";

export const BasicSpellVisual = () => {
  const magic = useMagic();
  
  return (
    <>
      {magic.spells && magic.spells.map((spell) => (
        <SpellProjectile key={spell.id} spell={spell} />
      ))}
    </>
  );
};

const SpellProjectile = ({ spell }) => {
  const meshRef = useRef();
  const timeRef = useRef(0);
  
  useFrame((state, delta) => {
    if (!meshRef.current) return;
    
    timeRef.current += delta;
    
    // Move the projectile forward
    const progress = Math.min(timeRef.current * 5, 10); // Move 10 units over 2 seconds
    meshRef.current.position.set(
      spell.position.x + spell.direction.x * progress,
      spell.position.y + 1 + Math.sin(timeRef.current * 3) * 0.3,
      spell.position.z + spell.direction.z * progress
    );
    
    // Rotate the projectile
    meshRef.current.rotation.x += delta * 5;
    meshRef.current.rotation.y += delta * 3;
    
    // Scale pulse effect
    const scale = 1 + Math.sin(timeRef.current * 10) * 0.2;
    meshRef.current.scale.setScalar(scale);
  });
  
  const color = spell.name === "fire" ? "#ff6600" : "#00ccff";
  const emissiveColor = spell.name === "fire" ? "#ff0000" : "#0088ff";
  
  return (
    <mesh ref={meshRef} position={[spell.position.x, spell.position.y + 1, spell.position.z]}>
      <sphereGeometry args={[0.3, 16, 16]} />
      <meshStandardMaterial 
        color={color}
        emissive={emissiveColor}
        emissiveIntensity={2}
        transparent
        opacity={0.8}
      />
    </mesh>
  );
};