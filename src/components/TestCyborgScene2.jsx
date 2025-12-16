import { useEffect, useRef, useState } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function TestCyborgScene2({ position = [0, 0, 0] }) {
  const groupRef = useRef();
  const { scene, camera, gl } = useThree();
  const [loadedModel, setLoadedModel] = useState(null);
  
  console.log('[TestCyborgScene2] Rendering with useThree hooks');
  
  // Test useEffect like in CyborgTempleScene
  useEffect(() => {
    console.log('[TestCyborgScene2] useEffect running');
    // Simulate model loading
    setTimeout(() => {
      console.log('[TestCyborgScene2] Simulated model load complete');
      setLoadedModel(true);
    }, 100);
  }, []);
  
  // Test useFrame like in CyborgTempleScene
  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.5;
    }
  });
  
  return (
    <group ref={groupRef} position={position}>
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color={loadedModel ? "orange" : "pink"} />
      </mesh>
    </group>
  );
}