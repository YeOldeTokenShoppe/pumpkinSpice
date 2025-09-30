'use client';

import React, { useEffect, useState } from 'react';
import { motion, useAnimation } from 'framer-motion';

// Component for individual animated letters
const AnimatedLetter = ({ children, delay, color }) => {
  return (
    <motion.span
      initial={{ 
        opacity: 0, 
        y: 80,
        rotateX: -90,
        scale: 0.5
      }}
      animate={{ 
        opacity: 1, 
        y: 0,
        rotateX: 0,
        scale: 1
      }}
      transition={{
        delay: delay,
        duration: 0.5,
        type: "spring",
        damping: 12,
        stiffness: 200
      }}
      style={{
        display: 'inline-block',
        transform: 'skew(-10deg)',
        textShadow: `
          rgba(83, 61, 74, 0.8) 1px 1px,
          rgba(83, 61, 74, 0.6) 2px 2px,
          rgba(83, 61, 74, 0.5) 3px 3px,
          rgba(83, 61, 74, 0.4) 4px 4px,
          rgba(83, 61, 74, 0.3) 5px 5px,
          rgba(83, 61, 74, 0.2) 6px 6px
        `,
        minWidth: '10px',
        minHeight: '10px',
        position: 'relative',
        color: color,
      }}
    >
      {children}
    </motion.span>
  );
};

// Main DropInTitle component
export default function DropInTitle({ 
  lines = ["Prosper80", "for All", "Human80!"],
  colors = ["#e55643", "#2b9f5e", "#f1c83c"],
  fontSize = { mobile: "2.5rem", desktop: "4rem" },
  isMobile = false,
  onAnimationComplete = () => {},
  triggerAnimation = true
}) {
  const [isAnimating, setIsAnimating] = useState(false);
  const controls = useAnimation();
  
  // Split text into individual letters for animation
  const splitTextIntoLetters = (text) => {
    return text.split('').map((char, index) => ({
      char: char === ' ' ? '\u00A0' : char, // Use non-breaking space
      id: `${text}-${index}`
    }));
  };
  
  // Create letter arrays for each line
  const letterArrays = lines.map(line => splitTextIntoLetters(line));
  
  // Calculate delays for staggered animation
  let globalDelay = 0;
  const lettersWithDelay = letterArrays.map((letters, lineIndex) => {
    return letters.map((letter, letterIndex) => {
      const delay = globalDelay;
      globalDelay += 0.05; // 50ms between each letter
      return {
        ...letter,
        delay: delay,
        color: colors[lineIndex % colors.length]
      };
    });
  });
  
  useEffect(() => {
    if (triggerAnimation && !isAnimating) {
      setIsAnimating(true);
      // Call onAnimationComplete after the animation duration
      const totalDuration = globalDelay * 1000 + 500; // Total delay + animation duration
      setTimeout(() => {
        onAnimationComplete();
        setIsAnimating(false);
      }, totalDuration);
    }
  }, [triggerAnimation]);
  
  return (
    <div style={{
      position: 'relative',
      display: 'inline-block',
      width: '100%',
      textAlign: 'center',
    }}>
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css?family=Fjalla+One');
      `}</style>
      <h1 style={{
        color: '#fff',
        textTransform: 'uppercase',
        fontSize: isMobile ? fontSize.mobile : fontSize.desktop,
        margin: 0,
        lineHeight: 1.12,
        letterSpacing: '2px',
        fontFamily: "'Fjalla One', sans-serif",
      }}>
        {lettersWithDelay.map((letters, lineIndex) => (
          <motion.span
            key={`line-${lineIndex}`}
            style={{
              display: 'block',
              transform: 'rotate(-10deg)',
              position: 'relative',
              margin: lineIndex === 1 ? '0 auto' : 'auto',
              marginLeft: lineIndex === 2 ? '2rem' : 'auto',
            }}
          >
            {letters.map((letter) => (
              <AnimatedLetter 
                key={letter.id} 
                delay={letter.delay}
                color={letter.color}
              >
                {letter.char}
              </AnimatedLetter>
            ))}
          </motion.span>
        ))}
      </h1>
      
      {/* Optional replay button - hidden by default */}
      <motion.button
        initial={{ opacity: 0, visibility: 'hidden' }}
        animate={{ 
          opacity: isAnimating ? 0 : 1, 
          visibility: isAnimating ? 'hidden' : 'visible' 
        }}
        transition={{ delay: 0.2 }}
        onClick={() => window.location.reload()}
        style={{
          position: 'absolute',
          bottom: '-80px',
          left: '50%',
          transform: 'translateX(-50%) rotate(-10deg)',
          background: 'none',
          border: 'none',
          color: '#e55643',
          textTransform: 'uppercase',
          cursor: 'pointer',
          fontSize: '1rem',
          fontFamily: 'inherit',
          padding: '10px 20px',
          opacity: 0,
          display: 'none', // Hidden for now
        }}
      >
        <span style={{
          transform: 'skew(-10deg)',
          display: 'block',
          textShadow: `
            rgba(83, 61, 74, 0.8) 1px 1px,
            rgba(83, 61, 74, 0.6) 2px 2px,
            rgba(83, 61, 74, 0.5) 3px 3px,
            rgba(83, 61, 74, 0.4) 4px 4px
          `,
        }}>
          Replay
        </span>
      </motion.button>
    </div>
  );
}