"use client";

import React, { useEffect, useRef, useState } from 'react';
import SynthwaveText from './SynthwaveText';
import gsap from 'gsap';

const MorphingSynthwaveText = ({ 
  startText = "REAL80",
  shouldMorph = false,
  morphDelay = 1000,
  fontSize = 300,
  scale = 1,
  spacingX = 8,
  outsideColor = "rgba(0, 255, 255, 0)",
  insideColor = "rgba(255, 0, 255, 1)",
  backgroundColor = "rgba(0, 100, 255, 0.4)",
  className = "",
  isMobile = false
}) => {
  const containerRef = useRef(null);
  const rRef = useRef(null);
  const eRef = useRef(null);
  const aRef = useRef(null);
  const lRef = useRef(null);
  const eightRef = useRef(null);
  const zeroRef = useRef(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (shouldMorph && !hasAnimated && rRef.current && eRef.current && aRef.current && lRef.current && eightRef.current && zeroRef.current) {
      const timer = setTimeout(() => {
        setHasAnimated(true);
        
        // Get actual widths of E and A elements
        const eWidth = eRef.current.getBoundingClientRect().width;
        const aWidth = aRef.current.getBoundingClientRect().width;
        // Add extra movement to close the gaps (accounting for spacing between letters)
        const halfWidth = (eWidth + aWidth) / 2;
        const extraClosing = 0; // Additional pixels to close gaps
        
        // Create timeline for the animation
        const tl = gsap.timeline();
        
        // First fade out 'E' and 'A' simultaneously
        tl.to([eRef.current, aRef.current], {
          opacity: 0,
          scale: 0.7,
          duration: 1.1,
          ease: "power2.in"
        })
        // Move R to the right and L to the left, with 80 moving even more left to close gap
        .to(rRef.current, {
          x: halfWidth + extraClosing, // Move right by half the width of E and A plus extra
          duration: 1.3,
          ease: "power2.inOut"
        }, "-=0")
        .to(lRef.current, {
          x: -(halfWidth + extraClosing), // Move left by half the width of E and A plus extra
          duration: 1.3,
          ease: "power2.inOut"
        }, "<") // Start at the same time as R movement
        .to([eightRef.current, zeroRef.current], {
          x: -(halfWidth + extraClosing) - 2, // Move 8 and 0 left together
          duration: 1.3,
          ease: "power2.inOut"
        }, "<"); // Start at the same time as other movements
        
      }, morphDelay);
      
      return () => clearTimeout(timer);
    }
  }, [shouldMorph, morphDelay, hasAnimated]);

  const letterScale = scale; // Use the scale directly without reduction
  
  return (
    <div 
      ref={containerRef}
      style={{ 
        position: 'relative',
        width: '100%',
        minHeight: '100px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}
    >
      <div style={{ position: 'absolute', display: 'flex', alignItems: 'center', gap: '0' }}>
        {/* R */}
        <div 
          ref={rRef}
          style={{ position: 'relative', zIndex: 10 }}
        >
          <SynthwaveText 
            text="R"
            fontSize={fontSize}
            scale={letterScale}
            spacingX={spacingX}
            outsideColor={outsideColor}
            insideColor={insideColor}
            backgroundColor={backgroundColor}
            className={className}
          />
        </div>
        
        {/* E */}
        <div 
          ref={eRef}
          style={{ position: 'relative' }}
        >
          <SynthwaveText 
            text="E"
            fontSize={fontSize}
            scale={letterScale}
            spacingX={spacingX}
            outsideColor={outsideColor}
            insideColor={insideColor}
            backgroundColor={backgroundColor}
            className={className}
          />
        </div>
        
        {/* A */}
        <div 
          ref={aRef}
          style={{ position: 'relative' }}
        >
          <SynthwaveText 
            text="A"
            fontSize={fontSize}
            scale={letterScale}
            spacingX={spacingX}
            outsideColor={outsideColor}
            insideColor={insideColor}
            backgroundColor={backgroundColor}
            className={className}
          />
        </div>
        
        {/* L */}
        <div 
          ref={lRef}
          style={{ position: 'relative' }}
        >
          <SynthwaveText 
            text="L"
            fontSize={fontSize}
            scale={letterScale}
            spacingX={spacingX}
            outsideColor={outsideColor}
            insideColor={insideColor}
            backgroundColor={backgroundColor}
            className={className}
          />
        </div>
        
        {/* 8 */}
        <div 
          ref={eightRef}
          style={{ position: 'relative' }}
        >
          <SynthwaveText 
            text="8"
            fontSize={fontSize}
            scale={letterScale}
            spacingX={spacingX}
            outsideColor={outsideColor}
            insideColor={insideColor}
            backgroundColor={backgroundColor}
            className={className}
          />
        </div>
        
        {/* 0 */}
        <div 
          ref={zeroRef}
          style={{ position: 'relative' }}
        >
          <SynthwaveText 
            text="0"
            fontSize={fontSize}
            scale={letterScale}
            spacingX={spacingX}
            outsideColor={outsideColor}
            insideColor={insideColor}
            backgroundColor={backgroundColor}
            className={className}
          />
        </div>
      </div>
    </div>
  );
};

export default MorphingSynthwaveText;