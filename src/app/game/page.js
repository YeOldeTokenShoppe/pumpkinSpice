'use client'

import { KeyboardControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Experience } from "../../../illumin80/components/Experience";
// import { ScoreDisplay } from "../../components/ScoreDisplay";
import { EnhancedHUD } from "../../../illumin80/components/EnhancedHUD";
import ErrorBoundary from "../../components/ErrorBoundary";
import { TouchControls } from "../../components/TouchControls";
import CoinLoader from "@/components/CoinLoader";
import { Suspense, useCallback, useState, useRef, useEffect } from "react";

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
  const [isSceneLoading, setIsSceneLoading] = useState(true);
  const [fontLoaded, setFontLoaded] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);
  const touchActionHandler = useRef(null);

  // Font loading effect (matching home3 page)
  useEffect(() => {
    const checkFont = async () => {
      try {
        await document.fonts.load("1em 'UnifrakturCook'");
        await document.fonts.load("1em 'UnifrakturMaguntia'");
        await document.fonts.load("1em 'Fjalla One'");
        setFontLoaded(true);
        document.body.classList.add('fonts-loaded');
      } catch (e) {
        setTimeout(() => {
          setFontLoaded(true);
          document.body.classList.add('fonts-loaded');
        }, 1000);
      }
    };
    checkFont();
  }, []);

  // Update loading state when both font and model are loaded (matching home3 page)
  useEffect(() => {
    if (fontLoaded && modelLoaded) {
      setTimeout(() => {
        setIsSceneLoading(false);
      }, 500); // Small delay for smooth transition
    }
  }, [fontLoaded, modelLoaded]);

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
      {/* CoinLoader preloader */}
      <CoinLoader loading={isSceneLoading} />
      
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
          onContextMenu={(e) => e.preventDefault()}
          onCreated={handleCreated}
          fallback={<LoadingFallback />}
        >
          <Suspense fallback={null}>
            <Experience 
              onTouchAction={(handler) => { touchActionHandler.current = handler; }} 
              onLoad={() => setModelLoaded(true)}
            />
          </Suspense>
        </Canvas>
      </KeyboardControls>
      {/* <ScoreDisplay /> */}
      <EnhancedHUD />
      <TouchControls onAction={(action, value) => {
        if (touchActionHandler.current) {
          touchActionHandler.current(action, value);
        }
      }} />
    </div>
  );
}