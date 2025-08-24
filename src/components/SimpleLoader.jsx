'use client';

import React, { useEffect, useState } from 'react';

const SimpleLoader = ({ progress = 0, detailedProgress = null }) => {
  const [currentTask, setCurrentTask] = useState('Perpetu8ing...');
  
  useEffect(() => {
    // Update current task based on progress
    if (detailedProgress) {
      setCurrentTask(detailedProgress.currentTask || 'Perpetu8ing...');
    }
  }, [progress, detailedProgress]);
  
  // Rotate through different loading texts
  useEffect(() => {
    const loadingTexts = ['Perpetu8ing...', 'Integr8ing...', 'Ascending...', 'Illumin8ing..'];
    let index = 0;
    
    const interval = setInterval(() => {
      index = (index + 1) % loadingTexts.length;
      if (!detailedProgress || !detailedProgress.currentTask) {
        setCurrentTask(loadingTexts[index]);
      }
    }, 2000); // Change text every 2 seconds
    
    return () => clearInterval(interval);
  }, [detailedProgress]);
  
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
    height: '12px',
    backgroundColor: '#fbbf24'
  };

  const middleBarStyle = {
    width: '12px',
    height: '60px',
    backgroundColor: '#10b981',
    borderRadius: '2px'
  };

  const bottomBarStyle = {
    width: '4px',
    height: '12px',
    backgroundColor: '#10b981'
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