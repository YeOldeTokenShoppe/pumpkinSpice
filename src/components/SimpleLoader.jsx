'use client';

import React, { useEffect, useState } from 'react';

const SimpleLoader = ({ progress = 0, detailedProgress = null }) => {
  const [currentTask, setCurrentTask] = useState('Initializing...');
  
  useEffect(() => {
    // Update current task based on progress
    if (detailedProgress) {
      setCurrentTask(detailedProgress.currentTask || 'Loading...');


    }
  }, [progress, detailedProgress]);
  
  useEffect(() => {
    // Inject keyframes into the document if not already present
    const styleId = 'simple-loader-keyframes';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        @keyframes simple-loader-bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-20px);
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
    backgroundColor: 'transparent',
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
    position: 'relative'
  };

  const topBarStyle = {
    width: '4px',
    height: '24px',
    backgroundColor: '#10b981'
  };

  const middleBarStyle = {
    width: '12px',
    height: '48px',
    backgroundColor: '#10b981',
    borderRadius: '2px'
  };

  const bottomBarStyle = {
    width: '4px',
    height: '24px',
    backgroundColor: '#10b981'
  };

  const progressBarContainerStyle = {
    width: '280px',
    height: '6px',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderRadius: '3px',
    marginTop: '32px',
    overflow: 'hidden',
    position: 'relative'
  };

  const progressBarStyle = {
    width: `${Math.min(100, Math.max(0, progress))}%`,
    height: '100%',
    background: 'linear-gradient(90deg, #10b981 0%, #34d399 100%)',
    transition: 'width 0.3s ease',
    borderRadius: '3px',
    position: 'relative',
    overflow: 'hidden'
  };

  const progressBarShineStyle = {
    position: 'absolute',
    top: 0,
    left: '-100%',
    width: '100%',
    height: '100%',
    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
    animation: progress > 0 && progress < 100 ? 'shine 1.5s infinite' : 'none'
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
    marginTop: '8px',
    color: 'rgba(16, 185, 129, 0.8)',
    fontSize: '12px',
    fontFamily: 'monospace',
    textAlign: 'center',
    animation: 'simple-loader-pulse 2s ease-in-out infinite'
  };

  // Add shine animation
  useEffect(() => {
    const styleId = 'simple-loader-shine';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        @keyframes shine {
          0% {
            left: -100%;
          }
          100% {
            left: 200%;
          }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  return (
    <div style={containerStyle}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={wrapperStyle}>
          <div style={{
            ...columnStyle,
            animation: 'simple-loader-bounce 1s ease-in-out infinite 0.1s'
          }}>
            <div style={topBarStyle} />
            <div style={middleBarStyle} />
            <div style={bottomBarStyle} />
          </div>
          <div style={{
            ...columnStyle,
            bottom: '16px',
            animation: 'simple-loader-bounce 1s ease-in-out infinite 0.2s'
          }}>
            <div style={topBarStyle} />
            <div style={middleBarStyle} />
            <div style={bottomBarStyle} />
          </div>
          <div style={{
            ...columnStyle,
            bottom: '32px',
            animation: 'simple-loader-bounce 1s ease-in-out infinite 0.1s'
          }}>
            <div style={topBarStyle} />
            <div style={middleBarStyle} />
            <div style={bottomBarStyle} />
          </div>
        </div>
        
        <div style={progressBarContainerStyle}>
          <div style={progressBarStyle}>
            <div style={progressBarShineStyle} />
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