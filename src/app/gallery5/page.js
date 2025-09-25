"use client";

import React, { useState } from "react";

export default function Gallery5Page() {
  const [step, setStep] = useState(0);
  const [Component, setComponent] = useState(null);
  
  const logMemory = (label) => {
    if (performance.memory) {
      console.log(`${label}:`, {
        used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) + 'MB',
        total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024) + 'MB'
      });
    }
  };
  
  return (
    <div style={{
      backgroundColor: "#000",
      height: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      color: "white",
      gap: "20px"
    }}>
      <h1>Gallery5 - Minimal Three.js Test</h1>
      
      <div>Step: {step}</div>
      
      {step === 0 && (
        <button
          onClick={() => {
            logMemory('Before import');
            // Just import the bare minimum Canvas
            import('@react-three/fiber').then(({ Canvas }) => {
              logMemory('After R3F import');
              setComponent(() => Canvas);
              setStep(1);
            });
          }}
          style={{
            padding: "10px 20px",
            backgroundColor: "#333",
            color: "white",
            border: "1px solid #666",
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          Import R3F Canvas Only
        </button>
      )}
      
      {step === 1 && Component && (
        <>
          <p>Canvas imported - not rendered</p>
          <button
            onClick={() => {
              logMemory('Before rendering Canvas');
              setStep(2);
            }}
            style={{
              padding: "10px 20px",
              backgroundColor: "#333",
              color: "white",
              border: "1px solid #666",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            Render Minimal Canvas
          </button>
        </>
      )}
      
      {step === 2 && Component && (
        <>
          <p>Minimal Canvas Below:</p>
          <div style={{ width: "400px", height: "400px", border: "1px solid white" }}>
            <Component
              gl={{
                antialias: false,
                alpha: false,
                powerPreference: 'low-power',
                preserveDrawingBuffer: false,
                failIfMajorPerformanceCaveat: false,
              }}
              dpr={[1, 1]}
              flat
              linear
            >
              <color attach="background" args={['#000']} />
              <ambientLight intensity={0.5} />
              <mesh>
                <boxGeometry args={[1, 1, 1]} />
                <meshBasicMaterial color="red" />
              </mesh>
            </Component>
          </div>
          <button
            onClick={() => {
              logMemory('After rendering');
            }}
            style={{
              padding: "10px 20px",
              backgroundColor: "#333",
              color: "white",
              border: "1px solid #666",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            Check Memory
          </button>
        </>
      )}
    </div>
  );
}