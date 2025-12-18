'use client';

import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';

const CRTTerminal = ({ 
  messages = [], 
  onComplete = null, 
  isActive = false,
  width = 512,
  height = 512 
}) => {
  const terminalRef = useRef(null);
  const cursorRef = useRef(null);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Default welcome messages if none provided
  const defaultMessages = [
    { text: "INITIALIZING SYSTEM...", delay: 0.5 },
    { text: "CONNECTING TO NEURAL NETWORK...", delay: 1.0 },
    { text: "AUTHENTICATION SUCCESSFUL", delay: 0.8 },
    { text: "", delay: 0.5 }, // Empty line
    { text: "WELCOME TO RL80", delay: 1.2 },
    { text: "DIGITAL SANCTUARY", delay: 1.0 },
    { text: "", delay: 0.5 },
    { text: "PREPARING NAVIGATION MATRIX...", delay: 1.0 },
    { text: "SYSTEM READY", delay: 1.5 }
  ];

  const messagesToShow = messages.length > 0 ? messages : defaultMessages;

  // Cursor blinking animation
  useEffect(() => {
    if (cursorRef.current) {
      gsap.fromTo(cursorRef.current, 
        { opacity: 1 },
        { 
          opacity: 0, 
          duration: 0.8, 
          repeat: -1, 
          yoyo: true,
          ease: "power2.inOut"
        }
      );
    }
  }, []);

  // Main typing sequence
  useEffect(() => {
    if (!isActive || currentMessageIndex >= messagesToShow.length) {
      if (isActive && currentMessageIndex >= messagesToShow.length) {
        // All messages complete
        setTimeout(() => {
          if (onComplete) onComplete();
        }, 1000);
      }
      return;
    }

    const currentMessage = messagesToShow[currentMessageIndex];
    setIsTyping(true);

    // Clear previous text
    setDisplayedText('');

    // Add delay before starting this message
    const startDelay = currentMessage.delay || 0.5;

    setTimeout(() => {
      // Type out the message character by character
      if (currentMessage.text === '') {
        // Empty line - just move to next message quickly
        setDisplayedText('');
        setIsTyping(false);
        setTimeout(() => {
          setCurrentMessageIndex(prev => prev + 1);
        }, 300);
        return;
      }

      const chars = currentMessage.text.split('');
      let charIndex = 0;

      const typeInterval = setInterval(() => {
        if (charIndex < chars.length) {
          setDisplayedText(prev => prev + chars[charIndex]);
          charIndex++;
          
          // Add some random typing delay variation
          if (Math.random() > 0.9) {
            setTimeout(() => {}, 100);
          }
        } else {
          clearInterval(typeInterval);
          setIsTyping(false);
          
          // Wait a bit then move to next message
          setTimeout(() => {
            setCurrentMessageIndex(prev => prev + 1);
          }, 800);
        }
      }, 50 + Math.random() * 100); // Variable typing speed

    }, startDelay * 1000);

  }, [currentMessageIndex, isActive, messagesToShow, onComplete]);

  // Reset when becoming active
  useEffect(() => {
    if (isActive) {
      setCurrentMessageIndex(0);
      setDisplayedText('');
      setIsTyping(false);
    }
  }, [isActive]);

  return (
    <div 
      ref={terminalRef}
      className="crt-terminal"
      style={{
        width: `${width}px`,
        height: `${height}px`,
        background: '#000',
        border: '2px solid #333',
        borderRadius: '8px',
        padding: '20px',
        fontFamily: 'Courier New, monospace',
        fontSize: '16px',
        color: '#00ff41',
        overflow: 'hidden',
        position: 'relative',
        boxShadow: 'inset 0 0 20px rgba(0, 255, 65, 0.1)',
      }}
    >
      {/* CRT Effects */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: `
            repeating-linear-gradient(
              90deg,
              transparent,
              transparent 2px,
              rgba(0, 255, 65, 0.03) 2px,
              rgba(0, 255, 65, 0.03) 4px
            )
          `,
          pointerEvents: 'none',
          zIndex: 10
        }}
      />
      
      {/* Scanlines */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: `
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              rgba(0, 255, 65, 0.02) 2px,
              rgba(0, 255, 65, 0.02) 4px
            )
          `,
          pointerEvents: 'none',
          zIndex: 10
        }}
      />

      {/* Text Content */}
      <div style={{ 
        position: 'relative', 
        zIndex: 5,
        lineHeight: '1.4',
        textShadow: '0 0 5px #00ff41'
      }}>
        <div style={{ marginBottom: '1rem' }}>
          DRONE_TERMINAL_v2.1
          <br />
          {'>'} SYSTEM_BOOT_SEQUENCE
          <br />
          {'>'} _________________
        </div>
        
        <div style={{ minHeight: '200px' }}>
          {displayedText}
          <span 
            ref={cursorRef}
            style={{
              color: '#00ff41',
              fontWeight: 'bold'
            }}
          >
            █
          </span>
        </div>
      </div>

      {/* Glow overlay */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'radial-gradient(ellipse at center, rgba(0, 255, 65, 0.1) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 1
        }}
      />
    </div>
  );
};

export default CRTTerminal;