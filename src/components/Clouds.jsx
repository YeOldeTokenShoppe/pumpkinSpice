import React, { useEffect } from "react";
import { Cloud, Clouds } from "@react-three/drei";
import * as THREE from "three";
import dynamic from "next/dynamic";

const DarkCloudsComponent = React.forwardRef(({ onLoad }, ref) => {
  useEffect(() => {
    if (onLoad) {
      onLoad();
    }
  }, [onLoad]);

  return (
    <group scale={[8, 8, 8]}>
        <hemisphereLight
          skyColor="#c449f4"
          groundColor="#f7d5a3"      
          intensity={2.5}
          position={[0, 0, 0]}
        />
      
      <Clouds material={THREE.MeshLambertMaterial} limit={50}>
        <Cloud 
          seed={1}
          segments={5}
          volume={3}
          opacity={0.8}
          fade={5}
          growth={1}
          bounds={[1, 0, 1]}
          color="#f0f8ff"
          position={[0, -1, 1]}
        />
      </Clouds>
    </group>
  );
});

DarkCloudsComponent.displayName = 'DarkCloudsComponent';

const DarkClouds = dynamic(() => Promise.resolve(DarkCloudsComponent), {
  ssr: false,
});

export default DarkClouds;