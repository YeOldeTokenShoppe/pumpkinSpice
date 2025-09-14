'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './DungeonTorch.module.css';

export default function DungeonTorch({ 
  backgroundImage = '/images/dungeon-map.png',
  initialRadius = 110,
  minRadius = 40,
  maxRadius = 300,
  showControls = true,
  torchIcon = true
}) {
  const overlayRef = useRef(null);
  const cursorRef = useRef(null);
  const [radius, setRadius] = useState(initialRadius);
  const animationRef = useRef();
  const flickerTimeRef = useRef(0);

  useEffect(() => {
    const overlay = overlayRef.current;
    const cursor = cursorRef.current;
    if (!overlay || !cursor) return;

    const setPos = (clientX, clientY) => {
      const rect = overlay.getBoundingClientRect();
      const maskX = clientX - rect.left;
      const maskY = clientY - rect.top;
      
      overlay.style.setProperty('--x', maskX + 'px');
      overlay.style.setProperty('--y', maskY + 'px');
      
      if (torchIcon) {
        cursor.style.transform = `translate(${clientX}px, ${clientY}px)`;
      }
    };

    const handleMouseMove = (e) => setPos(e.clientX, e.clientY);
    const handleTouchMove = (e) => {
      if (e.touches && e.touches[0]) {
        setPos(e.touches[0].clientX, e.touches[0].clientY);
      }
      e.preventDefault();
    };

    overlay.addEventListener('mousemove', handleMouseMove);
    overlay.addEventListener('touchmove', handleTouchMove, { passive: false });

    // Set initial position to center
    setPos(window.innerWidth / 2, window.innerHeight / 2);

    // Flicker animation
    const animateFlicker = () => {
      flickerTimeRef.current += 0.05;
      const flickerOffset = Math.sin(flickerTimeRef.current * 3) * 3;
      overlay.style.setProperty('--r', radius + flickerOffset + 'px');
      animationRef.current = requestAnimationFrame(animateFlicker);
    };
    
    animateFlicker();

    return () => {
      overlay.removeEventListener('mousemove', handleMouseMove);
      overlay.removeEventListener('touchmove', handleTouchMove);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [radius, torchIcon]);

  const handleRadiusChange = (e) => {
    setRadius(Number(e.target.value));
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.background} style={{ backgroundImage: `url(${backgroundImage})` }} />
      
      <div ref={overlayRef} className={styles.overlay} />
      
      {torchIcon && (
        <div ref={cursorRef} className={styles.customCursor}>
          <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24">
            <path fill="#f9aa47" d="M6 20h12q.425 0 .713-.288T19 19H5q0 .425.288.713T6 20m6-12q-1.2 0-2-.837t-.75-2.038q.05-1.3.913-2.287T12 1q.975.85 1.838 1.838t.912 2.287q.05 1.2-.75 2.038T12 8m-1 9h2v-6h-2zm1-11q.325 0 .538-.225t.212-.55q0-.425-.238-.775T12 3.775q-.275.325-.513.675t-.237.775q0 .325.213.55T12 6m8.25 11q.325 0 .538-.213T21 16.25t-.213-.537t-.537-.213t-.537.213t-.213.537t.213.538t.537.212M18 22H6q-1.25 0-2.125-.875T3 19v-2h6V9h6v8h2.6q-.05-.2-.075-.375t-.025-.375q0-1.15.8-1.95t1.95-.8t1.95.8t.8 1.95q0 .95-.562 1.675T21 18.9v.1q0 1.25-.875 2.125T18 22m-7-5h2zm1-12.1" />
          </svg>
        </div>
      )}
      
      {showControls && (
        <div className={styles.controls}>
          <label>
            <input
              type="range"
              min={minRadius}
              max={maxRadius}
              value={radius}
              onChange={handleRadiusChange}
            />
            <span> Torch Radius</span>
          </label>
        </div>
      )}
    </div>
  );
}