'use client';

import React, { useEffect, useState, useRef } from 'react';

const SimpleLoader = ({ progress = 0, detailedProgress = null }) => {
  const [currentTask, setCurrentTask] = useState('Perpetu8ing...');
  const animationRef = useRef(null);
  const [candlePositions, setCandlePositions] = useState([
    { yPosition: 40, opacity: 0 },
    { yPosition: 40, opacity: 0 },
    { yPosition: 40, opacity: 0 }
  ]);
  
  useEffect(() => {
    // Update current task based on progress
    if (detailedProgress) {
      setCurrentTask(detailedProgress.currentTask || 'Perpetu8ing...');
    }
  }, [progress, detailedProgress]);
  
  // Rotate through different loading texts
  useEffect(() => {
    const loadingTexts = ['Initi8ing...', 'Perpetu8ing...', 'Integr8ing...', 'Specul8ing...', 'Illumin8ing..'];
    let index = 0;
    
    const interval = setInterval(() => {
      index = (index + 1) % loadingTexts.length;
      if (!detailedProgress || !detailedProgress.currentTask) {
        setCurrentTask(loadingTexts[index]);
      }
    }, 2000); // Change text every 2 seconds
    
    return () => clearInterval(interval);
  }, [detailedProgress]);
  
  // JavaScript-based animation for candles using requestAnimationFrame
  useEffect(() => {
    let startTime = null;
    const duration = 3000; // 3 seconds for full cycle
    const delays = [0, 400, 800]; // Delays for each candle
    
    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      
      const newPositions = delays.map((delay) => {
        const adjustedTime = Math.max(0, elapsed - delay);
        const progress = (adjustedTime % duration) / duration;
        
        // Easing function for smooth rise and fall
        let yPosition = 0;
        let opacity = 1;
        
        if (progress < 0.4) {
          // Rising phase (0-40% of cycle)
          const riseProgress = progress / 0.4;
          yPosition = 40 * (1 - riseProgress * riseProgress); // Quadratic ease out
          opacity = 1; // Fully visible while rising
        } else if (progress < 0.6) {
          // Stay at top (40-60% of cycle)
          yPosition = 0;
          opacity = 1; // Still visible at top
        } else if (progress < 0.8) {
          // Falling phase (60-80% of cycle) - fade out smoothly
          const fallProgress = (progress - 0.6) / 0.2;
          yPosition = 40 * fallProgress; // Fall back down
          opacity = 1 - fallProgress; // Fade out smoothly from 1 to 0
        } else {
          // Reset at bottom (80-100% of cycle) - invisible
          yPosition = 40;
          opacity = 0; // Stay invisible at bottom
        }
        
        return { yPosition, opacity };
      });
      
      setCandlePositions(newPositions);
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);
  
  useEffect(() => {
    // Inject keyframes into the document if not already present
    const styleId = 'simple-loader-keyframes';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        @keyframes simple-loader-rise {
          0% {
            transform: translateY(40px) scaleY(0.1);
            opacity: 0;
          }
          15% {
            transform: translateY(30px) scaleY(0.4);
            opacity: 0.4;
          }
          30% {
            transform: translateY(15px) scaleY(0.7);
            opacity: 0.7;
          }
          45% {
            transform: translateY(5px) scaleY(0.9);
            opacity: 0.9;
          }
          60% {
            transform: translateY(0) scaleY(1);
            opacity: 1;
          }
          100% {
            transform: translateY(0) scaleY(1);
            opacity: 1;
          }
        }

        @keyframes simple-loader-glow {
          0%, 100% {
            filter: brightness(1);
          }
          50% {
            filter: brightness(1.3);
          }
        }
        
        @keyframes simple-loader-pulse {
          0%, 100% {
            opacity: 0.3;
          }
          50% {
            opacity: 1;
          }
        }
      `;
      document.head.appendChild(style);
    }
    
    return () => {
      // Cleanup on unmount
      const style = document.getElementById(styleId);
      if (style) {
        style.remove();
      }
    };
  }, []);

  const containerStyle = {
    width: '100%',
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
    flexDirection: 'column'
  };

  const wrapperStyle = {
    display: 'flex',
    gap: '4px',
    alignItems: 'flex-end'
  };

  const columnStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    position: 'relative',
    transformOrigin: 'bottom'
  };

  const topBarStyle = {
    width: '4px',
    height: '12px',
    backgroundColor: '#fbbf24',
    transition: 'all 0.3s ease'
  };

  const middleBarStyle = {
    width: '12px',
    height: '60px',
    backgroundColor: '#10b981',
    borderRadius: '2px',
    transition: 'all 0.3s ease'
  };

  const bottomBarStyle = {
    width: '4px',
    height: '12px',
    backgroundColor: '#10b981',
    transition: 'all 0.3s ease'
  };


  const progressTextStyle = {
    marginTop: '16px',
    color: '#10b981',
    fontSize: '14px',
    fontFamily: 'monospace',
    textAlign: 'center',
    minHeight: '20px'
  };

  const taskTextStyle = {
    marginTop: '3rem',
    marginBottom: '8px',
    color: 'rgba(16, 185, 129, 0.8)',
    fontSize: '12px',
    fontFamily: 'monospace',
    textAlign: 'center',
    animation: 'simple-loader-pulse 2s ease-in-out infinite'
  };


  return (
    <div style={containerStyle}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={wrapperStyle}>
          <div style={{
            ...columnStyle,
            transform: `translateY(${candlePositions[0]?.yPosition || 0}px)`,
            opacity: candlePositions[0]?.opacity || 0,
            transition: 'none'
          }}>
            <div style={{
              ...topBarStyle,
              filter: candlePositions[0]?.yPosition < 5 ? 'brightness(1.3)' : 'brightness(1)'
            }} />
            <div style={middleBarStyle} />
            <div style={bottomBarStyle} />
          </div>
          <div style={{
            ...columnStyle,
            bottom: '16px',
            transform: `translateY(${candlePositions[1]?.yPosition || 0}px)`,
            opacity: candlePositions[1]?.opacity || 0,
            transition: 'none'
          }}>
            <div style={topBarStyle} />
            <div style={middleBarStyle} />
            <div style={bottomBarStyle} />
          </div>
          <div style={{
            ...columnStyle,
            bottom: '32px',
            transform: `translateY(${candlePositions[2]?.yPosition || 0}px)`,
            opacity: candlePositions[2]?.opacity || 0,
            transition: 'none'
          }}>
            <div style={{
              ...topBarStyle,
              filter: candlePositions[2]?.yPosition < 5 ? 'brightness(1.3)' : 'brightness(1)'
            }} />
            <div style={middleBarStyle} />
            <div style={bottomBarStyle} />
          </div>
        </div>
        
        {/* <div style={progressTextStyle}>
          Loading Temple... {Math.round(progress)}%
        </div> */}
        
        <div style={taskTextStyle}>
          {currentTask}
        </div>
        
        {/* Detailed progress if available */}
        {/* {detailedProgress && detailedProgress.details && (
          <div style={{
            marginTop: '12px',
            fontSize: '10px',
            color: 'rgba(16, 185, 129, 0.6)',
            fontFamily: 'monospace',
            textAlign: 'center'
          }}>
            {detailedProgress.details}
          </div>
        )} */}
      </div>
    </div>
  );
}

export default SimpleLoader;