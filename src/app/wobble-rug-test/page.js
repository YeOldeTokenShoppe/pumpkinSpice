'use client';

import React, { Suspense, useState, useEffect, useRef } from 'react';
import './game.css';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Grid, Center } from '@react-three/drei';
import { Physics } from '@react-three/rapier';
import { WobbleRug } from '../../components/WobbleRug';
import LavaFloor from '../../components/LavaFloor';
import FloatingRugField from '../../components/FloatingRugField';
import { CharacterController } from '../../components/CharacterController';
import TerrainPlatform from '../../components/TerrainPlatform';
import WireframeGrid from '../../components/WireframeGrid';
import LandPlatform from '../../components/LandPlatform';
import { KeyboardControls } from '@react-three/drei';
import { SimpleTouchControls } from '../../components/SimpleTouchControls';

function Scene({ freeCameraMode, touchControlsRef }) {

  return (
    <>
      {/* Basic lighting setup */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
      <pointLight position={[-10, -10, -5]} intensity={0.5} />
      
      {/* Environment for nice reflections */}
      <Environment preset="city" />
      
      {/* Character controller - always active, handles both modes */}
      <CharacterController 
        touchControls={touchControlsRef} 
        freeCameraMode={freeCameraMode}
      />
      
     
      


      
      {/* Floating rug stepping stones */}
      <group position={[0, 0, 0]}>
        <FloatingRugField
          minHeight={0.5}
          maxHeight={5.0}
          pathMode={true}
          pathWidth={15}
          centerOffset={0}
          areaSize={[30, 35]}
          count={45}
          minDistance={2.5}
        />
      </group>
      
      {/* Starting land platform - left side */}
      <LandPlatform
        position={[-22.5, 0, 0]}
        size={[15, 1, 40]}
        color="#0a0a0a"
        wireframeColor="#00ff88"
        showWireframe={true}
        terrainVariation={0}
      />
      
      {/* Ending land platform - right side */}
      <LandPlatform
        position={[22.5, 0, 0]}
        size={[15, 1, 40]}
      color="#0a0a0a"
        wireframeColor="#00ff88"
        showWireframe={true}
        terrainVariation={0}
      />
    </>
  );
}

function LoadingFallback() {
  return (
    <mesh>
      <boxGeometry args={[2, 0.1, 3]} />
      <meshStandardMaterial color="gray" opacity={0.5} transparent />
    </mesh>
  );
}

export default function WobbleRugTestPage() {
  const [freeCameraMode, setFreeCameraMode] = useState(false); // Start in character mode
  const [showTouchControls, setShowTouchControls] = useState(false); // Toggle for desktop
  const touchControlsRef = useRef({ movement: { x: 0, z: 0 }, jump: false, sprint: false });

  // Handle touch control actions
  const handleTouchAction = (action, value) => {
    if (action === 'movement') {
      touchControlsRef.current.movement = value;
    } else if (action === 'jump') {
      touchControlsRef.current.jump = value;
    } else if (action === 'sprint') {
      touchControlsRef.current.sprint = value;
    }
  };

  // Define keyboard controls map
  const keyboardMap = [
    { name: 'forward', keys: ['ArrowUp', 'KeyW'] },
    { name: 'backward', keys: ['ArrowDown', 'KeyS'] },
    { name: 'left', keys: ['ArrowLeft', 'KeyA'] },
    { name: 'right', keys: ['ArrowRight', 'KeyD'] },
    { name: 'jump', keys: ['Space'] },
    { name: 'run', keys: ['ShiftLeft', 'ShiftRight'] },
    { name: 'light', keys: ['KeyF', 'KeyE'] },
    { name: 'zoom', keys: ['KeyZ'] },
    { name: 'lookUp', keys: ['KeyQ'] }
  ];

  // Toggle between modes with Tab key
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.key === 'Tab') {
        event.preventDefault();
        setFreeCameraMode(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  return (
    <KeyboardControls map={keyboardMap}>
      <div style={{ 
        width: '100vw', 
        height: '100vh', 
        background: '#1a1a1a',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none',
        WebkitTouchCallout: 'none',
        WebkitUserDrag: 'none'
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }}
      >
        
        {/* Control Mode Overlay */}
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          zIndex: 100,
        }}>
          {/* Mode Toggle Button */}
          <button
            onClick={() => setFreeCameraMode(prev => !prev)}
            style={{
              padding: '12px 20px',
              fontSize: '16px',
              fontWeight: 'bold',
              color: 'white',
              background: freeCameraMode 
                ? 'linear-gradient(135deg, #4CAF50, #45a049)' 
                : 'linear-gradient(135deg, #FF9800, #F57C00)',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
              transition: 'transform 0.2s, box-shadow 0.2s',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              userSelect: 'none',
              WebkitUserSelect: 'none',
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 8px rgba(0,0,0,0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 6px rgba(0,0,0,0.3)';
            }}
          >
            {freeCameraMode ? '🎥 Free Camera' : '🎮 Character View'}
          </button>

          {/* Touch Controls Toggle (visible in character mode) */}
          {!freeCameraMode && (
            <button
              onClick={() => setShowTouchControls(prev => !prev)}
              style={{
                padding: '10px 16px',
                fontSize: '14px',
                fontWeight: 'bold',
                color: 'white',
                background: showTouchControls 
                  ? 'linear-gradient(135deg, #9C27B0, #7B1FA2)' 
                  : 'linear-gradient(135deg, #616161, #424242)',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                boxShadow: '0 3px 5px rgba(0,0,0,0.3)',
                transition: 'all 0.2s',
                fontFamily: 'system-ui, -apple-system, sans-serif',
              }}
            >
              🎮 {showTouchControls ? 'Hide' : 'Show'} Touch Controls
            </button>
          )}

          {/* Mode Info Panel */}
          <div style={{
            color: 'white',
            background: 'rgba(0,0,0,0.8)',
            padding: '12px 16px',
            borderRadius: '8px',
            fontSize: '13px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.1)',
            minWidth: '200px',
            userSelect: 'none',
            WebkitUserSelect: 'none',
          }}>
            <div style={{ 
              fontSize: '14px', 
              fontWeight: 'bold',
              marginBottom: '8px',
              color: freeCameraMode ? '#4CAF50' : '#FF9800'
            }}>
              {freeCameraMode ? 'FREE CAMERA' : 'CHARACTER MODE'}
            </div>
            
            {freeCameraMode ? (
              <div style={{ fontSize: '12px', lineHeight: '1.5' }}>
                • <strong>WASD</strong> to fly camera<br />
                • <strong>Mouse</strong> to look around<br />
                • <strong>SHIFT</strong> for speed<br />
                • <strong>TAB</strong> to switch modes
              </div>
            ) : (
              <div style={{ fontSize: '12px', lineHeight: '1.5' }}>
                • <strong>Click & Drag</strong> to move<br />
                • <strong>WASD/Arrows</strong> also work<br />
                • <strong>SPACE</strong> to jump<br />
                • <strong>SHIFT</strong> to run<br />
                • <strong>TAB</strong> to switch modes
              </div>
            )}
          </div>
        </div>
        
        
        <Canvas
          style={{ position: 'relative', zIndex: 0 }}
          camera={{ position: [-22, 8, 10], fov: 60 }} // Better view of character at start
          shadows
          gl={{ antialias: true }}
        >
        <Suspense fallback={<LoadingFallback />}>
          <Physics > 
            <Scene freeCameraMode={freeCameraMode} touchControlsRef={touchControlsRef} />
            <LavaFloor
              position={[0, -0.5, 0]}
              size={[30, 40]}
              segments={[64, 64]}
              uvScale={[2.0, 2.0]}
              fogDensity={0.15}
              fogColor={[0.1, 0.05, 0]}
              brightness={1.2}
              animationSpeed={2.0}
              enableRotation={false}
            />
          </Physics>
        </Suspense>
      </Canvas>
      
      {/* Touch Controls - visible in character mode and when toggled on */}
      <SimpleTouchControls 
        onAction={handleTouchAction}
        visible={!freeCameraMode}
        forceShow={showTouchControls}
      />
    </div>
  </KeyboardControls>
  );
}