"use client";

import React, { useState, useEffect } from "react";

export default function Gallery4Page() {
  const [step, setStep] = useState(0);
  const [Canvas, setCanvas] = useState(null);
  
  // Log memory at each step
  useEffect(() => {
    console.log(`Gallery4 - Step ${step}:`);
    if (performance.memory) {
      console.log('Memory:', {
        used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) + 'MB',
        total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024) + 'MB'
      });
    }
  }, [step]);
  
  // Load Canvas only when button clicked
  const loadCanvas = async () => {
    console.log('Loading @react-three/fiber...');
    const { Canvas: CanvasComponent } = await import('@react-three/fiber');
    setCanvas(() => CanvasComponent);
    setStep(1);
  };
  
  return (
    <div style={{
      backgroundColor: "#000000",
      height: "100vh",
      width: "100vw",
      position: "fixed",
      left: 0,
      top: 0,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      color: "white",
      gap: "20px"
    }}>
      <h1>Gallery4 - Memory Test</h1>
      
      <div style={{ fontSize: "18px" }}>
        Current Step: {step}
      </div>
      
      {step === 0 && (
        <>
          <p>No Three.js loaded yet</p>
          <button 
            onClick={loadCanvas}
            style={{
              padding: "10px 20px",
              fontSize: "16px",
              backgroundColor: "#333",
              color: "white",
              border: "1px solid #666",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            Load React Three Fiber
          </button>
        </>
      )}
      
      {step === 1 && Canvas && (
        <>
          <p>Canvas loaded (not rendered)</p>
          <button 
            onClick={() => setStep(2)}
            style={{
              padding: "10px 20px",
              fontSize: "16px",
              backgroundColor: "#333",
              color: "white",
              border: "1px solid #666",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            Render Empty Canvas
          </button>
        </>
      )}
      
      {step === 2 && Canvas && (
        <>
          <p>Rendering empty Canvas</p>
          <div style={{ width: "100%", height: "400px" }}>
            <Canvas>
              <color attach="background" args={['#000000']} />
            </Canvas>
          </div>
        </>
      )}
    </div>
  );
}