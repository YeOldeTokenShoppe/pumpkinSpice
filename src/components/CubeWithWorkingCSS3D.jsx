import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';

export function CubeWithWorkingCSS3D({ position = [0, 0, 10], scrollY = 0 }) {
  const meshRef = useRef();
  const [showContent, setShowContent] = React.useState(false);
  
  // Animation based on scroll
  useFrame(() => {
    const targetScroll = 1500;
    const scrollDiff = scrollY - targetScroll;
    const entranceProgress = Math.min(1, Math.max(0, scrollDiff / 300));
    
    if (entranceProgress > 0 && meshRef.current) {
      const easedProgress = 1 - Math.pow(1 - entranceProgress, 3);
      const entranceOffset = (1 - easedProgress) * -15;
      const yOffset = Math.max(0, (scrollDiff - 300) * 0.01);
      const currentY = position[1] + entranceOffset + yOffset;
      
      meshRef.current.position.set(position[0], currentY, position[2]);
      meshRef.current.visible = true;
      meshRef.current.scale.set(easedProgress, easedProgress, easedProgress);
      meshRef.current.rotation.y = 0;
      
      setShowContent(true);
    } else if (meshRef.current) {
      meshRef.current.visible = false;
      setShowContent(false);
    }
  });
  
  return (
    <group ref={meshRef}>
      {/* Frame */}
      <mesh>
        <boxGeometry args={[8.2, 6.2, 0.6]} />
        <meshStandardMaterial 
          color="#00ff41"
          metalness={0.7}
          roughness={0.3}
          emissive="#00ff41"
          emissiveIntensity={0.3}
        />
      </mesh>
      
      {/* Back panel */}
      <mesh position={[0, 0, -0.3]}>
        <boxGeometry args={[8, 6, 0.1]} />
        <meshStandardMaterial 
          color="#000000"
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>
      
      {/* Show the working CSS3D example */}
      {showContent && (
        <Html
          center
          transform
          position={[0, 0, 0.4]}
          distanceFactor={10}
          occlude={false}
          zIndexRange={[10000, 0]}
          style={{
            pointerEvents: 'auto',
            zIndex: 10000,
          }}
        >
          <div 
            onClick={(e) => {
              e.stopPropagation();
              console.log('Clicked on div container');
            }}
            onPointerDown={(e) => {
              e.stopPropagation();
              console.log('Pointer down on div container');
            }}
            style={{
              width: '600px',
              height: '450px',
              border: '3px solid #00ff41',
              borderRadius: '8px',
              overflow: 'hidden',
              boxShadow: '0 0 30px rgba(0, 255, 65, 0.5)',
              position: 'relative',
              zIndex: 10000,
              pointerEvents: 'auto',
            }}>
            <iframe
              src="/test-screen"
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                display: 'block',
                position: 'relative',
                zIndex: 10001,
                pointerEvents: 'auto',
              }}
              title="Mini 3D Scene"
            />
          </div>
        </Html>
      )}
    </group>
  );
}