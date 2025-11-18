'use client';

import { useEffect, useRef } from 'react';
import Stats from 'stats.js';

export default function PerformanceMonitor() {
  const containerRef = useRef(null);
  const statsRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Create Stats instances for FPS, MS, and MB
    const stats = new Stats();
    statsRef.current = stats;

    // Position the monitor in top-left corner
    stats.dom.style.position = 'absolute';
    stats.dom.style.left = '10px';
    stats.dom.style.top = '10px';
    stats.dom.style.zIndex = '9999';
    
    // Add to container
    containerRef.current.appendChild(stats.dom);

    // Animation loop
    let animationId;
    const animate = () => {
      stats.begin();
      // Monitor performance
      stats.end();
      animationId = requestAnimationFrame(animate);
    };
    animate();

    // Cleanup
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      if (containerRef.current && stats.dom) {
        containerRef.current.removeChild(stats.dom);
      }
    };
  }, []);

  return <div ref={containerRef} />;
}