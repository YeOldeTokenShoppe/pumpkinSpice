'use client';
import React, { useMemo } from 'react';

export default function SkewedHeading({ 
  lines = ['DEFAULT', 'HEADING'], 
  colors = ['#fff', '#ffd700', '#00ff00'],
  fontSize = { mobile: '2.5rem', desktop: '4rem' },
  isMobile = false,
  fontFamily = "'Fjalla One', sans-serif",
  useGradient = false,
  gradientColors = ['#ffd700', '#00ff00'],
  textAlign = 'center'
}) {
  // Create a stable ID for unique CSS class names
  const stableId = useMemo(() => 
    Math.random().toString(36).substring(2, 9), 
    []
  );

  return (
    <div style={{
      position: 'relative',
      display: 'inline-block',
      width: '100%',
      textAlign: textAlign,
      padding: '10px ', // Add padding to prevent shadow clipping
      overflow: 'visible', // Ensure shadows are visible
    }}>
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css?family=Fjalla+One');
        
        .title-letter-${stableId} {
          transform: skew(-10deg);
          display: block;
          float: left;
        text-shadow: rgba(83, 61, 74, 0.8) 1px 1px,
                       rgba(83, 61, 74, 0.8) 2px 2px,
                       rgba(83, 61, 74, 0.8) 3px 3px,
                       rgba(83, 61, 74, 0.8) 4px 4px,
                       rgba(83, 61, 74, 0.8) 5px 5px,
                       rgba(83, 61, 74, 0.8) 6px 6px;
          min-width: 10px;
          min-height: 10px;
          position: relative;
          margin-left: 2px; /* Add small margin to prevent overlap */
          filter: drop-shadow(0 0 2px rgba(0, 255, 0, 0.4)); /* Add subtle glow for gradient text */
        }
        
        .title-letter-${stableId}:first-child {
          margin-left: 10px; /* Extra margin for first letter to show shadow */
        }
      `}</style>
      <h1 style={{
        color: '#fff',
        textTransform: 'uppercase',
        fontSize: isMobile ? fontSize.mobile : fontSize.desktop,
        margin: 0,
        lineHeight: 1.12,
        letterSpacing: '2px',
        fontFamily: fontFamily,
      }}>
        {lines.map((line, lineIndex) => (
          <div
            key={`line-${lineIndex}`}
            style={{
              display: 'flex',
              justifyContent: 'center',
              margin: '0 auto',
              width: 'fit-content',
              paddingLeft: '10px', // Add padding to ensure shadow visibility
              overflow: 'visible',
            }}
          >
            {line.split('').map((char, charIndex) => (
              <span 
                key={`${lineIndex}-${charIndex}`}
                className={`title-letter title-letter-${stableId}`}
                style={useGradient ? {
                  background: `linear-gradient(135deg, ${gradientColors[0]} 0%, ${gradientColors[1]} 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  position: 'relative',
                } : { 
                  color: colors[lineIndex % colors.length],
                  position: 'relative',
                }}
                data-char={char === ' ' ? '\u00A0' : char}
              >
                {char === ' ' ? '\u00A0' : char}
              </span>
            ))}
          </div>
        ))}
      </h1>
    </div>
  );
}