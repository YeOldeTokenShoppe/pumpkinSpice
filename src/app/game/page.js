'use client'

import { KeyboardControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Experience } from "../../../illumin80/components/Experience";
// import { ScoreDisplay } from "../../components/ScoreDisplay";
import { EnhancedHUD } from "../../../illumin80/components/EnhancedHUD";
import { RespawnOverlay } from "../../../illumin80/components/RespawnOverlay";
import ErrorBoundary from "../../components/ErrorBoundary";
import { TouchControls } from "../../components/TouchControls";
import CoinLoader from "@/components/CoinLoader";
import { Suspense, useCallback, useState, useRef, useEffect } from "react";
import Link from 'next/link';

const keyboardMap = [
  { name: "forward", keys: ["ArrowUp", "KeyW"] },
  { name: "backward", keys: ["ArrowDown", "KeyS"] },
  { name: "left", keys: ["ArrowLeft", "KeyA"] },
  { name: "right", keys: ["ArrowRight", "KeyD"] },
  { name: "run", keys: ["Shift"] },
  { name: "jump", keys: ["Space"] },
  { name: "light", keys: ["KeyL"] },
  { name: "zoom", keys: ["Equal", "NumpadAdd"] },
  { name: "doorToggle", keys: ["KeyO"] },
  { name: "lookUp", keys: ["KeyU", "KeyQ"] },
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
        console.log("Fonts loaded including UnifrakturMaguntia");
        setFontLoaded(true);
        document.body.classList.add('fonts-loaded');
        document.documentElement.classList.add('fonts-loaded'); // This is the key fix!
      } catch (e) {
        setTimeout(() => {
          setFontLoaded(true);
          document.body.classList.add('fonts-loaded');
          document.documentElement.classList.add('fonts-loaded');
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

  // Disable system context menus globally during gameplay
  useEffect(() => {
    const handleGlobalContextMenu = (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    const handleGlobalKeyDown = (e) => {
      // Disable macOS dictionary lookup (Cmd+Ctrl+D) and other system shortcuts
      if (e.metaKey && e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    // Add event listeners
    document.addEventListener('contextmenu', handleGlobalContextMenu);
    document.addEventListener('keydown', handleGlobalKeyDown);

    return () => {
      // Cleanup
      document.removeEventListener('contextmenu', handleGlobalContextMenu);
      document.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, []);

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
    <div 
      style={{ 
        width: "100vw", 
        height: "100vh", 
        position: "relative",
        userSelect: "none", // Disable text selection
        WebkitUserSelect: "none", // Safari
        MozUserSelect: "none", // Firefox
        msUserSelect: "none", // IE/Edge
        WebkitTouchCallout: "none", // iOS Safari - disable callout
        WebkitTapHighlightColor: "transparent", // Remove tap highlight
      }}
      onContextMenu={(e) => e.preventDefault()} // Disable right-click context menu
      onDragStart={(e) => e.preventDefault()} // Disable dragging
    >
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
            width: "100vw",
            height: "100vh",
            touchAction: "pan-y",
            display: "block",
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
      
      {/* Respawn overlay - renders as DOM element outside Canvas */}
      <RespawnOverlay />
      
      {/* RL80 Logo - Top Left (only show when game is loaded) */}
      {!isSceneLoading && (
        <div style={{
          position: "fixed",
          top: "20px", 
          left: "20px",
          borderRadius: "8px",
          padding: "10px",
          pointerEvents: "auto",
          zIndex: 99999,
        }}>
          <div 
            id="text"
            style={{
              position: "relative",
              fontFamily: "'UnifrakturMaguntia', 'serif', 'Arial', sans-serif",
              fontSize: "3rem",
              color: "#ffffff",
              cursor: "pointer",
            }}
          >
            <Link href="/" style={{ textDecoration: 'none', color: 'inherit', display: 'inline-block' }}>
              RL80
            </Link>
            {Array.from({length: 100}).map((_, i) => {
              const index = i + 1;
              return (
                <div
                  key={index}
                  className="text__copy"
                  style={{
                    position: "absolute",
                    pointerEvents: "none",
                    zIndex: -1,
                    top: 0,
                    left: 0,
                    color: `rgba(${255 - index * 2}, ${255 - index * 3}, ${255 - index * 2})`,
                    filter: "blur(0.1rem)",
                    transform: `translate(
                      ${index * 0.1}rem, 
                      ${index * 0.1}rem
                    ) scale(${1 + index * 0.01})`,
                    opacity: (1 / index) * 1.5,
                  }}
                >
                  RL80
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}