'use client'

import { KeyboardControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Experience } from "../../../illumin80/components/Experience";
// import { ScoreDisplay } from "../../components/ScoreDisplay";
import { EnhancedHUD } from "../../../illumin80/components/EnhancedHUD";
import ErrorBoundary from "../../components/ErrorBoundary";
import { Suspense, useCallback, useState } from "react";

const keyboardMap = [
  { name: "forward", keys: ["ArrowUp", "KeyW"] },
  { name: "backward", keys: ["ArrowDown", "KeyS"] },
  { name: "left", keys: ["ArrowLeft", "KeyA"] },
  { name: "right", keys: ["ArrowRight", "KeyD"] },
  { name: "run", keys: ["Shift"] },
  { name: "jump", keys: ["Space"] },
  { name: "light", keys: ["KeyL"] },
  { name: "zoom", keys: ["Equal", "NumpadAdd"] },
];

function LoadingFallback() {
  return (
    <div style={{
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      color: "white",
      fontSize: "18px"
    }}>
      Loading Game...
    </div>
  );
}

export default function GamePage() {
  const [contextLost, setContextLost] = useState(false);

  const handleCreated = useCallback(({ gl }) => {
    gl.setClearColor("#4a9fbb");
    
    // Add context lost/restored handlers
    const canvas = gl.domElement;
    
    const handleContextLost = (event) => {
      console.warn("WebGL context lost");
      event.preventDefault();
      setContextLost(true);
    };
    
    const handleContextRestored = () => {
      console.log("WebGL context restored");
      setContextLost(false);
    };
    
    canvas.addEventListener('webglcontextlost', handleContextLost);
    canvas.addEventListener('webglcontextrestored', handleContextRestored);
    
    return () => {
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      canvas.removeEventListener('webglcontextrestored', handleContextRestored);
    };
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      {contextLost && (
        <div style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          color: "white",
          fontSize: "18px",
          zIndex: 1000,
          backgroundColor: "rgba(0,0,0,0.8)",
          padding: "20px",
          borderRadius: "10px"
        }}>
          WebGL Context Lost - Refreshing...
        </div>
      )}
      
      <KeyboardControls map={keyboardMap}>
        <Canvas
          key={contextLost ? 'lost' : 'active'} // Force remount on context loss
          shadows
          camera={{ position: [3, -1, 1], near: 0.1, fov: 80 }}
          gl={{ 
            preserveDrawingBuffer: false, 
            antialias: false,
            powerPreference: "default",
            failIfMajorPerformanceCaveat: false
          }}
          style={{
            width: "100%",
            height: "100%",
            touchAction: "none",
          }}
          onCreated={handleCreated}
          fallback={<LoadingFallback />}
        >
          <Suspense fallback={null}>
            <Experience />
          </Suspense>
        </Canvas>
      </KeyboardControls>
      {/* <ScoreDisplay /> */}
      <EnhancedHUD />
    </div>
  );
}