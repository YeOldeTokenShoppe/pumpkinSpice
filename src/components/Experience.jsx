import { CameraControls, Gltf, useGLTF } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import { degToRad } from "three/src/math/MathUtils.js";
import { GodrayPositionable } from "@/components/GodrayPositionable";

export const Experience = () => {
  const controls = useThree((state) => state.controls);

  const animate = async () => {
    controls.setLookAt(0, 0.5, -5, 0, 1.5, -2);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    controls.smoothTime = 0.8;
    await controls.setLookAt(5, 2, -5, 0, 2, -2, true);
    controls.smoothTime = 0.4;
    await controls.setLookAt(-5, 0.5, 5, -1, 2, -2, true);
  };

  useEffect(() => {
    if (!controls) {
      return;
    }
    animate();
  }, [controls]);

  return (
    <>
      <CameraControls
        makeDefault
        maxDistance={8}
        minDistance={1}
        minPolarAngle={0}
        maxPolarAngle={degToRad(110)}
      />
    
      <GodrayPositionable
        initialPosition={[0, 4.9,0]}
        initialRotation={[[0.678, -0.5235987755982988, 0]]}
        settings={{
          color: "#c7b99c",
          topRadius: 1,
          bottomRadius: 2.5,
          height: 24.5,
          timeSpeed: 0.18,
          noiseScale: 14.4,
          smoothBottom: 0.332,
          smoothTop: 0.574,
          fresnelPower: 1,
        }}
      />
      {/* <Gltf src="models/ourlady_rider2.glb" position-z={-4.8} /> */}
      <ambientLight intensity={1} />
    </>
  );
};

// useGLTF.preload("models/ourlady_rider2.glb");