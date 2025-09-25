"use client";

import React, { useState, useEffect } from "react";

export default function Gallery2Page() {
  const [step, setStep] = useState(0);
  
  // Log memory usage
  useEffect(() => {
    const logMemory = () => {
      if (performance.memory) {
        const mb = (performance.memory.usedJSHeapSize / 1048576).toFixed(2);
        console.log(`[Gallery2 Step ${step}] JS Heap: ${mb}MB`);
      }
    };
    
    logMemory();
    const interval = setInterval(logMemory, 5000);
    
    return () => clearInterval(interval);
  }, [step]);
  
  return (
    <div style={{
      width: "100vw",
      height: "100vh",
      backgroundColor: "#000000",
      position: "relative"
    }}>
      {/* Controls */}
      <div style={{
        position: "absolute",
        top: 20,
        left: 20,
        zIndex: 1000,
        backgroundColor: "rgba(0,0,0,0.8)",
        padding: "20px",
        borderRadius: "10px",
        color: "white",
        fontFamily: "monospace"
      }}>
        <h3 style={{ margin: "0 0 10px 0" }}>Gallery2 Memory Test</h3>
        <p>Current Step: {step}</p>
        <div style={{ display: "flex", gap: "10px", marginTop: "10px", flexWrap: "wrap" }}>
          <button onClick={() => setStep(0)} style={{ backgroundColor: step === 0 ? 'blue' : 'gray' }}>
            0: Nothing
          </button>
          <button onClick={() => setStep(1)} style={{ backgroundColor: step === 1 ? 'blue' : 'gray' }}>
            1: Canvas Only
          </button>
          <button onClick={() => setStep(2)} style={{ backgroundColor: step === 2 ? 'blue' : 'gray' }}>
            2: + Lights
          </button>
          <button onClick={() => setStep(3)} style={{ backgroundColor: step === 3 ? 'blue' : 'gray' }}>
            3: + Simple Box
          </button>
          <button onClick={() => setStep(4)} style={{ backgroundColor: step === 4 ? 'blue' : 'gray' }}>
            4: Half-size Canvas
          </button>
        </div>
        <div style={{ marginTop: "20px", fontSize: "14px", border: "1px solid white", padding: "10px" }}>
          <p><strong>Memory Check Instructions:</strong></p>
          <p>1. Start with Step 0 (Nothing) - check memory</p>
          <p>2. Click Step 1 (Canvas Only) - check memory increase</p>
          <p>3. Click Step 2 (+ Lights) - check memory increase</p>
          <p>4. Click Step 3 (+ Simple Box) - check memory increase</p>
        </div>
      </div>
      
      {/* Step 0: Absolutely nothing */}
      {step === 0 && (
        <div style={{ 
          color: 'white', 
          padding: '20px',
          marginTop: '200px',
          textAlign: 'center'
        }}>
          <h2>Step 0: No Canvas, No Three.js</h2>
          <p>This is just HTML. Check base memory usage.</p>
        </div>
      )}
      
      {/* Canvas - only one instance at a time */}
      {step >= 1 && (
        <div style={{
          width: '100%',
          height: '100%',
          position: 'relative'
        }}>
          <CanvasScene step={step >= 4 ? 3 : step} fullSize={step < 4} />
        </div>
      )}
    </div>
  );
}

// Separate component for Canvas to control when it loads
function CanvasScene({ step, fullSize = true }) {
  // Only import Three.js when this component mounts
  const [Canvas, setCanvas] = useState(null);
  
  useEffect(() => {
    // Dynamically import @react-three/fiber only when needed
    import('@react-three/fiber').then(module => {
      setCanvas(() => module.Canvas);
      console.log('Three.js Canvas imported');
    });
  }, []);
  
  if (!Canvas) {
    return <div style={{ color: 'white', textAlign: 'center', marginTop: '200px' }}>
      Loading Three.js...
    </div>;
  }
  
  return (
    <Canvas
      camera={{
        position: [0, 0, 5],
        fov: 60,
        near: 0.1,
        far: 100
      }}
      gl={{
        antialias: false,
        alpha: false,
        powerPreference: "low-power",
        preserveDrawingBuffer: false,
        depth: true,
        stencil: false,
        precision: "lowp"
      }}
      dpr={[1, 1]}
      flat
      linear
      onCreated={({ gl, size }) => {
        console.log('[Gallery2] Canvas Created');
        console.log('  Size:', size.width, 'x', size.height);
        const context = gl.getContext();
        if (context) {
          console.log('  Buffer:', context.drawingBufferWidth, 'x', context.drawingBufferHeight);
          
          // Monitor for context loss
          const canvas = gl.domElement;
          canvas.addEventListener('webglcontextlost', (e) => {
            console.error('[Gallery2] WebGL Context LOST!', e);
            e.preventDefault();
          });
          canvas.addEventListener('webglcontextrestored', () => {
            console.log('[Gallery2] WebGL Context Restored');
          });
          
          // Log memory pressure
          if (context.getExtension) {
            const memInfo = context.getExtension('WEBGL_memory_info');
            if (memInfo) {
              console.log('  GPU Memory:', {
                total: (memInfo.totalMemory / 1048576).toFixed(2) + 'MB',
                used: (memInfo.usedMemory / 1048576).toFixed(2) + 'MB'
              });
            }
          }
        }
      }}
    >
      <color attach="background" args={['#1a1a1a']} />
      
      {/* Step 2: Add lighting */}
      {step >= 2 && (
        <>
          <ambientLight intensity={0.5} />
          <pointLight position={[5, 5, 5]} />
        </>
      )}
      
      {/* Step 3: Add a simple box */}
      {step >= 3 && (
        <mesh>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="red" />
        </mesh>
      )}
    </Canvas>
  );
}