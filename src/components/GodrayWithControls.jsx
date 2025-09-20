import { useState, useRef } from 'react';
import { TransformControls } from '@react-three/drei';
import { useControls, folder, button } from 'leva';
import { GodrayHybrid } from './GodrayHybrid';

export function GodrayWithControls({ settings, debug = false, ...props }) {
  const meshRef = useRef();
  const [mode, setMode] = useState('translate');
  
  const { showControls } = useControls('Godray Transform', {
    showControls: { value: true },
    mode: {
      value: mode,
      options: ['translate', 'rotate', 'scale'],
      onChange: (v) => setMode(v),
    },
    logPosition: button(() => {
      if (meshRef.current) {
        console.log('Godray Position:', meshRef.current.position.toArray());
        console.log('Godray Rotation:', meshRef.current.rotation.toArray());
        console.log('Godray Scale:', meshRef.current.scale.toArray());
      }
    }),
  });

  return (
    <group ref={meshRef} position={settings.position} rotation={settings.rotation}>
      <GodrayHybrid settings={{...settings, position: [0,0,0], rotation: [0,0,0]}} debug={false} {...props} />
      {showControls && (
        <TransformControls 
          mode={mode}
          enabled={true}
          size={1}
        />
      )}
    </group>
  );
}