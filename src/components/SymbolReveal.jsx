"use client";

import React, { useState, useEffect } from 'react';

const SymbolReveal = ({ symbols, is80sMode, onDismiss }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentSymbolIndex, setCurrentSymbolIndex] = useState(0);
  
  useEffect(() => {
    // Animate in
    setTimeout(() => setIsVisible(true), 100);
    
    // Cycle through symbols
    const interval = setInterval(() => {
      setCurrentSymbolIndex(prev => (prev + 1) % symbols.length);
    }, 2000);
    
    return () => clearInterval(interval);
  }, [symbols]);
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.95)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 20000,
      backdropFilter: 'blur(30px)',
      opacity: isVisible ? 1 : 0,
      transition: 'opacity 0.5s ease'
    }}>
      <div style={{
        textAlign: 'center',
        transform: isVisible ? 'scale(1)' : 'scale(0.8)',
        transition: 'transform 0.5s ease'
      }}>
        {/* Title */}
        <h1 style={{
          color: is80sMode ? '#67e8f9' : '#ffffff',
          fontSize: '2.5rem',
          marginBottom: '30px',
          textShadow: is80sMode 
            ? '0 0 30px #67e8f9, 0 0 60px #D946EF' 
            : '0 0 30px rgba(141, 102, 43, 0.8)',
          animation: 'pulse 2s ease-in-out infinite'
        }}>
          Sacred Sequence Revealed
        </h1>
        
        {/* Symbol Display */}
        <div style={{
          display: 'flex',
          gap: '30px',
          justifyContent: 'center',
          marginBottom: '40px'
        }}>
          {symbols.map((symbol, index) => (
            <div
              key={index}
              style={{
                width: '120px',
                height: '120px',
                borderRadius: '20px',
                backgroundColor: index === currentSymbolIndex 
                  ? is80sMode 
                    ? 'rgba(217, 70, 239, 0.3)' 
                    : 'rgba(141, 102, 43, 0.3)'
                  : 'rgba(255, 255, 255, 0.05)',
                border: `3px solid ${
                  index === currentSymbolIndex 
                    ? is80sMode ? '#D946EF' : '#8e662b'
                    : 'rgba(255, 255, 255, 0.2)'
                }`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                transform: index === currentSymbolIndex ? 'scale(1.1)' : 'scale(1)',
                transition: 'all 0.5s ease',
                boxShadow: index === currentSymbolIndex 
                  ? is80sMode 
                    ? '0 0 40px rgba(217, 70, 239, 0.8)' 
                    : '0 0 40px rgba(141, 102, 43, 0.8)'
                  : '0 4px 20px rgba(0, 0, 0, 0.5)'
              }}
            >
              <span style={{ 
                fontSize: '3rem',
                marginBottom: '8px',
                filter: index === currentSymbolIndex 
                  ? 'drop-shadow(0 0 20px rgba(255, 255, 255, 0.8))' 
                  : 'none'
              }}>
                {symbol.symbol}
              </span>
              <span style={{
                fontSize: '0.8rem',
                color: 'rgba(255, 255, 255, 0.7)',
                fontWeight: 'bold'
              }}>
                {symbol.name}
              </span>
            </div>
          ))}
        </div>
        
        {/* Instructions */}
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '15px',
          padding: '20px 30px',
          marginBottom: '30px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          maxWidth: '500px',
          margin: '0 auto 30px'
        }}>
          <p style={{
            color: '#ffffff',
            fontSize: '1.1rem',
            margin: 0,
            lineHeight: 1.6
          }}>
            Click these symbols on the wheel in this exact order to unlock your divine reward!
          </p>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '15px',
            marginTop: '15px'
          }}>
            {symbols.map((symbol, index) => (
              <span key={index} style={{ fontSize: '1.5rem' }}>
                {symbol.symbol}
                {index < symbols.length - 1 && 
                  <span style={{ 
                    color: 'rgba(255, 255, 255, 0.5)', 
                    margin: '0 10px',
                    fontSize: '1rem'
                  }}>→</span>
                }
              </span>
            ))}
          </div>
        </div>
        
        {/* Dismiss Button */}
        <button
          onClick={onDismiss}
          style={{
            padding: '15px 40px',
            fontSize: '1.1rem',
            backgroundColor: is80sMode 
              ? 'rgba(217, 70, 239, 0.3)' 
              : 'rgba(141, 102, 43, 0.3)',
            border: `2px solid ${is80sMode ? '#D946EF' : '#8e662b'}`,
            borderRadius: '10px',
            color: '#ffffff',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: is80sMode 
              ? '0 0 20px rgba(217, 70, 239, 0.5)' 
              : '0 0 20px rgba(141, 102, 43, 0.5)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.boxShadow = is80sMode 
              ? '0 0 30px rgba(217, 70, 239, 0.8)' 
              : '0 0 30px rgba(141, 102, 43, 0.8)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = is80sMode 
              ? '0 0 20px rgba(217, 70, 239, 0.5)' 
              : '0 0 20px rgba(141, 102, 43, 0.5)';
          }}
        >
          Begin the Ritual
        </button>
        
        {/* Warning */}
        <p style={{
          color: 'rgba(255, 100, 100, 0.8)',
          fontSize: '0.9rem',
          marginTop: '20px',
          fontStyle: 'italic'
        }}>
          ⚠️ Remember the sequence - it will not be shown again!
        </p>
      </div>
      
      {/* CSS Animation */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
};

export default SymbolReveal;