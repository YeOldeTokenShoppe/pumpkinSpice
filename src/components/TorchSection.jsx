'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './TorchSection.module.css';

export default function TorchSection({ 
  children,
  backgroundImage = '/images/dungeon-map.png',
  initialRadius = 120,
  minRadius = 80,
  maxRadius = 400,
  showControls = false,
  torchIcon = true,
  height = '100vh',
  overlayOpacity = 0.95,
  mobileRadiusScale = 0.7, // Scale factor for mobile devices
}) {
  const sectionRef = useRef(null);
  const overlayRef = useRef(null);
  const cursorRef = useRef(null);
  const [baseRadius, setBaseRadius] = useState(initialRadius);
  const [radius, setRadius] = useState(initialRadius);
  const [isHovering, setIsHovering] = useState(false);
  const animationRef = useRef();
  const flickerTimeRef = useRef(0);

  // Handle responsive radius
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      let scaledRadius = baseRadius;
      
      if (width < 640) { // Mobile
        scaledRadius = baseRadius * mobileRadiusScale;
      } else if (width < 1024) { // Tablet
        scaledRadius = baseRadius * 0.85;
      }
      
      setRadius(scaledRadius);
    };

    handleResize(); // Set initial radius
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, [baseRadius, mobileRadiusScale]);

  useEffect(() => {
    const section = sectionRef.current;
    const overlay = overlayRef.current;
    const cursor = cursorRef.current;
    if (!section || !overlay) return;

    // Set initial position to center after a brief delay to ensure mounting
    const setInitialPosition = () => {
      const rect = section.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      overlay.style.setProperty('--x', centerX + 'px');
      overlay.style.setProperty('--y', centerY + 'px');
      
      // Also set initial torch position
      if (torchIcon && cursor) {
        cursor.style.setProperty('--cursor-x', centerX + 'px');
        cursor.style.setProperty('--cursor-y', centerY + 'px');
      }
    };
    
    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(setInitialPosition);

    const setPos = (clientX, clientY) => {
      const rect = section.getBoundingClientRect();
      const maskX = clientX - rect.left;
      const maskY = clientY - rect.top;
      
      // Or if there's scrolling within the section:
      // const maskX = clientX - rect.left + section.scrollLeft;
      // const maskY = clientY - rect.top + section.scrollTop;
      
      overlay.style.setProperty('--x', maskX + 'px');
      overlay.style.setProperty('--y', maskY + 'px');
      
      if (torchIcon && cursor) {
        cursor.style.setProperty('--cursor-x', maskX + 'px');
        cursor.style.setProperty('--cursor-y', maskY + 'px');
      }
    };
    

    const handleMouseEnter = (e) => {
      setIsHovering(true);
      setPos(e.clientX, e.clientY);
    };
    const handleMouseLeave = () => {
      setIsHovering(false);
      
      // Reset both spotlight and torch to center when mouse leaves
      const rect = section.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      overlay.style.setProperty('--x', centerX + 'px');
      overlay.style.setProperty('--y', centerY + 'px');
      
      if (torchIcon && cursor) {
        cursor.style.setProperty('--cursor-x', centerX + 'px');
        cursor.style.setProperty('--cursor-y', centerY + 'px');
      }
    };
    const handleMouseMove = (e) => setPos(e.clientX, e.clientY);
    const handleTouchMove = (e) => {
      if (e.touches && e.touches[0]) {
        setPos(e.touches[0].clientX, e.touches[0].clientY);
      }
      e.preventDefault();
    };

    section.addEventListener('mouseenter', handleMouseEnter);
    section.addEventListener('mouseleave', handleMouseLeave);
    section.addEventListener('mousemove', handleMouseMove);
    section.addEventListener('touchmove', handleTouchMove, { passive: false });

    // Flicker animation
    const animateFlicker = () => {
      flickerTimeRef.current += 0.05;
      const flickerOffset = Math.sin(flickerTimeRef.current * 3) * 3;
      overlay.style.setProperty('--r', radius + flickerOffset + 'px');
      animationRef.current = requestAnimationFrame(animateFlicker);
    };
    
    animateFlicker();

    return () => {
      section.removeEventListener('mouseenter', handleMouseEnter);
      section.removeEventListener('mouseleave', handleMouseLeave);
      section.removeEventListener('mousemove', handleMouseMove);
      section.removeEventListener('touchmove', handleTouchMove);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [radius, torchIcon, isHovering]);

  const handleRadiusChange = (e) => {
    const newBase = Number(e.target.value);
    setBaseRadius(newBase);
    
    // Apply responsive scaling
    const width = window.innerWidth;
    let scaledRadius = newBase;
    if (width < 640) {
      scaledRadius = newBase * mobileRadiusScale;
    } else if (width < 1024) {
      scaledRadius = newBase * 0.85;
    }
    setRadius(scaledRadius);
  };

  return (
    <section 
      ref={sectionRef} 
      className={styles.section} 
      style={{ height }}
      data-hovering={isHovering}
    >
      <div className={styles.background} style={{ backgroundImage: `url(${backgroundImage})` }} />
      
      <div 
        ref={overlayRef} 
        className={styles.overlay} 
        style={{ '--opacity': overlayOpacity }}
      />
      {torchIcon && (
  <div 
    ref={cursorRef} 
    className={styles.customCursor}
    style={{
      opacity: isHovering ? 1 : 1, // Optional: make it dimmer when not hovering
      pointerEvents: 'none'
    }}
  >
<svg xmlns="http://www.w3.org/2000/svg" width="40" height="60" viewBox="0 0 40 60">
            {/* Flame */}
            <ellipse cx="20" cy="8" rx="6" ry="8" fill="#ffa500" opacity="0.9"/>
            <ellipse cx="20" cy="10" rx="3" ry="5" fill="#ffff00" opacity="0.8"/>
            {/* Wick */}
            <rect x="19" y="14" width="2" height="8" fill="#333"/>
            {/* Candle body */}
            <rect x="12" y="20" width="16" height="35" rx="1" fill="#00ff00"/>
            {/* Wax drip */}
            <ellipse cx="14" cy="28" rx="2" ry="4" fill="#00ff00" opacity="0.8"/>
          </svg>

  </div>
)}
      
      <div className={styles.content}>
        {children}
      </div>
      
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
    </section>
  );
}