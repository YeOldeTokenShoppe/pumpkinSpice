import { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html, Billboard, Text } from '@react-three/drei';
import * as THREE from 'three';

function AnnotationMarker({ 
  position = [0, 0, 0], 
  number = 1, 
  text = '', 
  onFocus,
  isActive = false,
  color = '#ffff00',
  hoverColor = '#c896ff',
  annotationOffset = null,
  scale = 1,
  textScale = null
}) {
  const meshRef = useRef();
  const { camera, invalidate } = useThree();
  const [hovered, setHovered] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  
  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      if (typeof window !== 'undefined') {
        setIsMobile(window.innerWidth <= 768);
      }
    };
    
    checkMobile();
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
    }
  }, []);

  // Force initial render of HTML elements
  useEffect(() => {
    // Force a re-render after mount to ensure HTML elements appear
    const timer = setTimeout(() => {
      setForceUpdate(prev => prev + 1);
      invalidate(); // Force three.js to re-render
    }, 100);
    
    return () => clearTimeout(timer);
  }, [invalidate]);
  
  // Pulse animation for active state
  useFrame((state) => {
    if (meshRef.current && isActive) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.1;
      meshRef.current.scale.setScalar(scale);
    }
  });

  const handleClick = (e) => {
    e.stopPropagation();
    if (onFocus) {
      onFocus();
    }
  };

  const markerColor = hovered ? hoverColor : color;
  const effectiveTextScale = textScale !== null ? textScale : scale;
  
  // Responsive scaling factors
  const responsiveScale = isMobile ? 0.7 : 1;
  const finalTextScale = effectiveTextScale * responsiveScale;

  return (
    <group 
      position={position}
      onClick={handleClick}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        setHovered(false);
        document.body.style.cursor = 'default';
      }}
    >
      {/* Only show the marker when annotation is not active */}
      {!isActive && (
        <Billboard follow={true} lockX={false} lockY={false} lockZ={false}>
          {/* Invisible larger click area */}
          <mesh visible={false}>
            <circleGeometry args={[0.2 * scale, 32]} />
            <meshBasicMaterial 
              transparent 
              opacity={0} 
              depthTest={true}
              depthWrite={true}
            />
          </mesh>
          
          {/* Visible marker */}
          <mesh ref={meshRef}>
            {/* Outer ring */}
            <ringGeometry args={[0.09 * scale, 0.11 * scale, 32]} />
            <meshBasicMaterial 
              color={markerColor} 
              transparent 
              opacity={0.9}
              depthTest={true}
              depthWrite={true}
            />
          </mesh>
          
          {/* Inner circle */}
          <mesh position={[0, 0, 0.001]}>
            <circleGeometry args={[0.09 * scale, 32]} />
            <meshBasicMaterial 
              color="#000000" 
              transparent 
              opacity={0.8}
              depthTest={true}
              depthWrite={true}
            />
          </mesh>
          
          {/* Question mark using drei Text component */}
          <Text
            position={[0, 0, 0.002]}
            fontSize={0.12 * scale}
            color={markerColor}
            anchorX="center"
            anchorY="middle"
            fontWeight={700}
            depthOffset={-1}
            material-transparent
            material-opacity={0.9}
            material-depthTest={true}
            material-depthWrite={false}
          >
            ?
          </Text>
        </Billboard>
      )}
      
      {/* Annotation text panel */}
      {isActive && (
        <Html
          position={[0, 0.4 * scale, 0]}
          center={!annotationOffset}
          distanceFactor={isMobile ? 4 : 3}
          style={{
            pointerEvents: 'none',
            transition: 'opacity 0.3s ease-in-out',
            opacity: isActive ? 1 : 0,
            // Apply custom offset if provided
            ...(annotationOffset && {
              position: 'fixed',
              left: '50%',
              top: '50%',
              transform: `translate(calc(-50% + ${annotationOffset[0]}px), calc(-50% + ${annotationOffset[1]}px))`,
            }),
          }}
        >
          <div
            style={{
              background: 'rgba(0, 0, 0, 0.9)',
              border: `${Math.max(1, finalTextScale)}px solid ${color}`,
              borderRadius: `${3 * finalTextScale}px`,
              padding: `${8 * finalTextScale}px ${12 * finalTextScale}px`,
              color: '#ffffff',
              width: isMobile ? "10rem" : "12rem",
              fontSize: `${11 * finalTextScale}px`,
              fontFamily: 'Arial, sans-serif',
              maxWidth: isMobile ? `${150 * finalTextScale}px` : `${180 * finalTextScale}px`,
              boxShadow: `0 0 ${6 * finalTextScale}px ${color}40`,
              whiteSpace: 'pre-wrap',
              lineHeight: '1.3',
            }}
          >
            {text}
            <div
              style={{
                fontSize: `${9 * finalTextScale}px`,
                marginTop: `${6 * finalTextScale}px`,
                opacity: 0.6,
                fontStyle: 'italic',
              }}
            >
              {/* Click anywhere to exit */}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

export default AnnotationMarker;