'use client';

import React, { useEffect } from 'react';

const SimpleLoader = () => {
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
    backgroundColor: 'transparent'
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

  return (
    <div style={containerStyle}>
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
    </div>
  );
}

export default SimpleLoader;
