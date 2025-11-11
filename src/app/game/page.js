'use client'

import { KeyboardControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Experience } from "../../../illumin80/components/Experience";
// import { ScoreDisplay } from "../../components/ScoreDisplay";
import dynamic from 'next/dynamic';

// Dynamic imports for non-critical components
const EnhancedHUD = dynamic(() => import("../../../illumin80/components/EnhancedHUD").then(mod => ({ default: mod.EnhancedHUD })), {
  ssr: false
});
const RespawnOverlay = dynamic(() => import("../../../illumin80/components/RespawnOverlay").then(mod => ({ default: mod.RespawnOverlay })), {
  ssr: false
});
const TouchControls = dynamic(() => import("../../components/TouchControls").then(mod => ({ default: mod.TouchControls })), {
  ssr: false
});
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
  const [modelLoaded, setModelLoaded] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [showFullscreenPrompt, setShowFullscreenPrompt] = useState(false);
  const touchActionHandler = useRef(null);

  // Detect mobile view and setup fullscreen
  useEffect(() => {
    const checkMobileView = () => {
      // More strict mobile detection - must be small screen AND have touch
      const isMobile = window.innerWidth <= 768 && 'ontouchstart' in window;
      setIsMobileView(isMobile);
      
      // Show fullscreen prompt on mobile if not already fullscreen
      if (isMobile && !document.fullscreenElement && !document.webkitFullscreenElement) {
        setShowFullscreenPrompt(true);
      } else if (!isMobile) {
        // Hide prompt on desktop
        setShowFullscreenPrompt(false);
      }
    };
    
    checkMobileView();
    window.addEventListener('resize', checkMobileView);
    
    // Listen for fullscreen changes
    const handleFullscreenChange = () => {
      if (document.fullscreenElement || document.webkitFullscreenElement) {
        setShowFullscreenPrompt(false);
        console.log('Entered fullscreen mode');
      }
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    
    return () => {
      window.removeEventListener('resize', checkMobileView);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);
  
  // Handle fullscreen request
  const enterFullscreen = async () => {
    try {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      } else if (elem.webkitRequestFullscreen) {
        await elem.webkitRequestFullscreen();
      } else if (elem.mozRequestFullScreen) {
        await elem.mozRequestFullScreen();
      } else if (elem.msRequestFullscreen) {
        await elem.msRequestFullscreen();
      }
      setShowFullscreenPrompt(false);
    } catch (err) {
      console.log('Could not enter fullscreen:', err);
    }
  };

  // Font loading effect (non-blocking)
  useEffect(() => {
    const checkFont = async () => {
      try {
        await document.fonts.load("1em 'UnifrakturCook'");
        await document.fonts.load("1em 'UnifrakturMaguntia'");
        await document.fonts.load("1em 'Fjalla One'");
        console.log("Fonts loaded including UnifrakturMaguntia");
        document.body.classList.add('fonts-loaded');
        document.documentElement.classList.add('fonts-loaded');
      } catch (e) {
        // Fallback after timeout
        setTimeout(() => {
          document.body.classList.add('fonts-loaded');
          document.documentElement.classList.add('fonts-loaded');
        }, 1000);
      }
    };
    checkFont();
  }, []);

  // Update loading state - prioritize model loading, fonts can load separately
  useEffect(() => {
    if (modelLoaded) {
      setTimeout(() => {
        setIsSceneLoading(false);
      }, 500); // Small delay for smooth transition
    }
  }, [modelLoaded]);

  // Disable system context menus globally during gameplay and prevent mobile scrolling
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

    // Prevent mobile scrolling/bouncing for better game experience
    const handleTouchMove = (e) => {
      e.preventDefault();
    };

    // Add event listeners
    document.addEventListener('contextmenu', handleGlobalContextMenu);
    document.addEventListener('keydown', handleGlobalKeyDown);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });

    // Add CSS to prevent scrolling
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';

    return () => {
      // Cleanup
      document.removeEventListener('contextmenu', handleGlobalContextMenu);
      document.removeEventListener('keydown', handleGlobalKeyDown);
      document.removeEventListener('touchmove', handleTouchMove);
      
      // Reset body styles
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
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
      {/* CoinLoader preloader - only show while models are loading */}
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
            failIfMajorPerformanceCaveat: false,
            alpha: false // Optimize for performance
          }}
          style={{
            width: "100vw",
            height: "100vh",
            touchAction: "pan-y",
            display: "block",
            backgroundColor: "#4a9fbb" // Show background immediately
          }}
          onContextMenu={(e) => e.preventDefault()}
          onCreated={handleCreated}
          fallback={<LoadingFallback />}
        >
          {/* Always render Experience but with Suspense for model loading */}
          <Suspense fallback={
            <mesh>
              <boxGeometry args={[1, 1, 1]} />
              <meshBasicMaterial color="#4a9fbb" transparent opacity={0.1} />
            </mesh>
          }>
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
      
      {/* Fullscreen button for mobile - minimal icon only */}
      {showFullscreenPrompt && isMobileView && (
        <button
          onClick={enterFullscreen}
          style={{
            position: 'fixed',
            top: '20px',
            left: '20px',
            width: '40px',
            height: '40px',
            zIndex: 10000,
            background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.9), rgba(10, 25, 15, 0.8))',
            border: '2px solid rgba(0, 255, 255, 0.4)',
            borderRadius: '50%',
            color: '#00ffff',
            fontSize: '20px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.5), 0 0 20px rgba(0, 255, 255, 0.2)',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.2s ease',
            padding: 0,
            outline: 'none',
          }}
          onTouchStart={(e) => {
            e.currentTarget.style.transform = 'scale(0.95)';
            e.currentTarget.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.5), 0 0 25px rgba(0, 255, 255, 0.4)';
          }}
          onTouchEnd={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.5), 0 0 20px rgba(0, 255, 255, 0.2)';
          }}
          aria-label="Enter fullscreen"
        >
          ⛶
        </button>
      )}
      
      {/* RL80 Logo - Top Left (only show when game is loaded) */}
      {/* {!isSceneLoading && (
        <div style={{
          position: "fixed",
          top: isMobileView ? "10px" : "20px", 
          left: isMobileView ? "10px" : "20px",
          borderRadius: "8px",
          padding: isMobileView ? "5px" : "10px",
          pointerEvents: "auto",
          zIndex: 99999,
        }}>
          <div 
            id="text"
            style={{
              position: "relative",
              fontFamily: "'UnifrakturMaguntia', 'serif', 'Arial', sans-serif",
              fontSize: isMobileView ? "1.5rem" : "3rem", // Much smaller on mobile
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
      )} */}
    </div>
  );
}