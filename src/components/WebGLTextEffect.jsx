"use client";

import React, { useEffect, useRef } from 'react';
import '../css/webgl-styles.css';

export default function WebGLTextEffect({ 
  text = "WEBGL TEXT", 
  className = "",
  fontSize = "10em",
  fontWeight = 700,
  color = "#fdcdf9",
  textAlign = "center",
  id = "webgl-text-effect"
}) {
  const containerRef = useRef(null);
  const appRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    // Add a unique class to identify this instance
    const uniqueClass = `webgl-instance-${id}`;
    document.body.classList.add(uniqueClass);

    // Create canvas element
    const canvas = document.createElement('canvas');
    canvas.id = `webgl-canvas-${id}`;
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '1';
    
    if (containerRef.current) {
      containerRef.current.appendChild(canvas);
      canvasRef.current = canvas;
    }

    // Initialize WebGL after a short delay to ensure DOM is ready
    const initWebGL = async () => {
      try {
        // We'll need to create a specialized version of the WebGL app
        // that can work with multiple instances
        const { default: WebGLTextApp } = await import('../js/WebGLTextApp');
        appRef.current = new WebGLTextApp({
          canvasId: `webgl-canvas-${id}`,
          targetSelector: `[data-webgl-id="${id}"]`
        });
        
        console.log(`WebGL Text Effect initialized for: ${id}`);
      } catch (error) {
        console.error('Failed to initialize WebGL text effect:', error);
      }
    };

    const timeoutId = setTimeout(initWebGL, 100);

    // Cleanup
    return () => {
      clearTimeout(timeoutId);
      document.body.classList.remove(uniqueClass);
      
      // Cleanup WebGL resources
      if (appRef.current && typeof appRef.current.cleanup === 'function') {
        appRef.current.cleanup();
      }
      
      // Remove canvas
      if (canvasRef.current && canvasRef.current.parentNode) {
        canvasRef.current.parentNode.removeChild(canvasRef.current);
      }
    };
  }, [id]);

  // Update text when it changes
  useEffect(() => {
    if (appRef.current && typeof appRef.current.updateText === 'function') {
      appRef.current.updateText(text);
    }
  }, [text]);

  return (
    <div 
      ref={containerRef}
      className={`webgl-text-container ${className}`}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: '200px'
      }}
    >
      {/* Hidden text for WebGL to read from */}
      <div 
        data-animation="webgl-text"
        data-webgl-id={id}
        style={{
          fontSize,
          fontWeight,
          color,
          textAlign,
          fontFamily: 'Humane, sans-serif',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          lineHeight: '1.1',
          opacity: 0,
          visibility: 'visible'
        }}
      >
        {text}
      </div>
    </div>
  );
}