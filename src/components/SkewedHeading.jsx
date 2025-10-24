'use client';
import React, { useMemo } from 'react';

export default function SkewedHeading({ 
  lines = ['DEFAULT', 'HEADING'], 
  colors = ['#fff', '#ffd700', '#00ff00'],
  fontSize = { mobile: '2.5rem', desktop: '4rem' },
  isMobile = false,
  fontFamily = "'Fjalla One', sans-serif",
  useGradient = false,
  gradientColors = ['#ffd700', '#00ff00']
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
      textAlign: 'center',
      padding: '10px 20px', // Add padding to prevent shadow clipping
      overflow: 'visible', // Ensure shadows are visible
    }}>
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css?family=Fjalla+One');
        
        .title-letter-${stableId} {
          transform: skew(-10deg);
          display: block;
          float: left;
          min-width: 10px;
          min-height: 10px;
          position: relative;
          margin-left: 2px;
        }
        
        .title-letter-${stableId}::before {
          content: attr(data-char);
          position: absolute;
          top: 0;
          left: 0;
          transform: skew(-10deg);
          z-index: -1;
          color: rgba(83, 61, 74, 0.9);
          text-shadow: rgba(83, 61, 74, 0.9) 1px 1px,
                       rgba(83, 61, 74, 0.9) 2px 2px,
                       rgba(83, 61, 74, 0.8) 3px 3px,
                       rgba(83, 61, 74, 0.8) 4px 4px,
                       rgba(83, 61, 74, 0.7) 5px 5px,
                       rgba(83, 61, 74, 0.7) 6px 6px,
                       rgba(83, 61, 74, 0.6) 7px 7px,
                       rgba(83, 61, 74, 0.6) 8px 8px,
                       rgba(0, 0, 0, 0.5) 10px 10px 15px;
        }
        
        .title-letter-${stableId}:first-child {
          margin-left: 10px;
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
                style={{
                  ...(useGradient ? {
                    background: `linear-gradient(135deg, ${gradientColors[0]} 0%, ${gradientColors[1]} 100%)`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  } : { 
                    color: colors[lineIndex % colors.length],
                  }),
                  position: 'relative',
                  display: 'block',
                  float: 'left',
                  transform: 'skew(-10deg)',
                  minWidth: '10px',
                  minHeight: '10px',
                  marginLeft: charIndex === 0 ? '10px' : '2px',
                  filter: 'drop-shadow(1px 1px 0 rgba(83, 61, 74, 0.9)) drop-shadow(2px 2px 0 rgba(83, 61, 74, 0.8)) drop-shadow(3px 3px 0 rgba(83, 61, 74, 0.7)) drop-shadow(4px 4px 0 rgba(83, 61, 74, 0.6)) drop-shadow(5px 5px 0 rgba(83, 61, 74, 0.5)) drop-shadow(6px 6px 8px rgba(0, 0, 0, 0.5))',
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