import { useRef } from "react";
import { useThree } from "@react-three/fiber";

export default function TestCyborgScene({ position = [0, 0, 0] }) {
  const groupRef = useRef();
  const { scene } = useThree();
  
  console.log('[TestCyborgScene] Rendering with position:', position);
  
  return (
    <group ref={groupRef} position={position}>
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color="purple" />
      </mesh>
    </group>
  );
}