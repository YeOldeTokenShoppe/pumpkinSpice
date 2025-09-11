"use client";

import React, { useEffect, useState } from 'react';
import SynthwaveText from './SynthwaveText';

const MorphingSynthwaveText = ({ 
  startText = "REAL80",
  shouldMorph = false,
  morphDelay = 3000,
  fontSize = 300,
  scale = 1,
  spacingX = 6,
  outsideColor = "rgba(0, 255, 255, 0)",
  insideColor = "rgba(255, 0, 255, 1)",
  backgroundColor = "rgba(0, 100, 255, 0.4)",
  className = "",
  isMobile = false
}) => {
  const [isMorphing, setIsMorphing] = useState(false);

  useEffect(() => {
    if (shouldMorph && !isMorphing) {
      const timer = setTimeout(() => {
        setIsMorphing(true);
      }, morphDelay);
      
      return () => clearTimeout(timer);
    }
  }, [shouldMorph, morphDelay, isMorphing]);

  const letterScale = scale * (isMobile ? 0.8 : 0.8);
  
  // Container with fixed dimensions to prevent layout shift
  return (
    <div style={{ 
      position: 'relative',
      width: '100%',
      minHeight: '100px', // Set a minimum height to prevent vertical shift
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      {!isMorphing ? (
        // Before morphing, show the intact word
        <div style={{ position: 'absolute' }}>
          <SynthwaveText 
            text="REAL80"
            fontSize={fontSize}
            scale={letterScale}
            spacingX={spacingX}
            outsideColor={outsideColor}
            insideColor={insideColor}
            backgroundColor={backgroundColor}
            className={className}
          />
        </div>
      ) : (
        // After morphing starts, show RL80 with fade-in
        <div style={{ 
          position: 'absolute',
          animation: 'fadeIn 1.2s ease-in-out'
        }}>
          <SynthwaveText 
            text="RL80"
            fontSize={fontSize}
            scale={letterScale}
            spacingX={spacingX}
            outsideColor={outsideColor}
            insideColor={insideColor}
            backgroundColor={backgroundColor}
            className={className}
          />
        </div>
      )}
      
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default MorphingSynthwaveText;