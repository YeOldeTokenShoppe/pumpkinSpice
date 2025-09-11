'use client';

import React, { useState, useEffect } from 'react';
import { useTokenData } from '@/services/tokenDataService';

const TokensBurned = () => {
  const { tokenData, loading } = useTokenData();
  const [animatedValue, setAnimatedValue] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  // Format large numbers for compact display
  const formatCompactNumber = (num) => {
    if (num >= 1000000000000) {
      // Trillions
      return (num / 1000000000000).toFixed(1).replace(/\.0$/, '') + 'T';
    } else if (num >= 1000000000) {
      // Billions
      const billions = num / 1000000000;
      if (billions >= 100) {
        return billions.toFixed(0) + 'B';  // 100B+ no decimals
      }
      return billions.toFixed(1).replace(/\.0$/, '') + 'B';
    } else if (num >= 1000000) {
      // Millions
      const millions = num / 1000000;
      if (millions >= 100) {
        return millions.toFixed(0) + 'M';  // 100M+ no decimals
      }
      return millions.toFixed(1).replace(/\.0$/, '') + 'M';
    } else if (num >= 10000) {
      // Thousands 10K+
      return (num / 1000).toFixed(0) + 'K';
    } else if (num >= 1000) {
      // Thousands under 10K
      return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return num.toLocaleString();
  };

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Animate numbers on mount and when data changes
  useEffect(() => {
    if (!tokenData) return;
    
    const target = tokenData.tokensBurned || 0;
    const duration = 2000;
    const steps = 60;
    const interval = duration / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      
      setAnimatedValue(Math.floor(target * easeOutQuart));

      if (currentStep >= steps) {
        clearInterval(timer);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [tokenData]);

  // Compact mobile style - just shows the fire emoji and number
  const mobileCompactStyle = {
    background: 'linear-gradient(135deg, rgba(0, 255, 255, 0.15), rgba(0, 200, 255, 0.1))',

    border: '2px solid rgba(246, 248, 65, 0.5)',
    borderRadius: '20px',
    padding: '0.4rem 0.6rem',
    backdropFilter: 'blur(10px)',
    display: 'flex',
    alignItems: 'center',
    gap: '0.3rem',
    boxShadow: '0 0 15px rgba(0, 255, 255, 0.3)',
    cursor: 'default',
  };

  // Regular desktop style
  const desktopStyle = {
    background: 'linear-gradient(135deg, rgba(0, 255, 255, 0.1), rgba(0, 200, 255, 0.05))',
    border: '2px solid rgba(246, 248, 65, 0.5)',
    borderRadius: '12px',
    padding: '1.25rem',
    position: 'relative',
    overflow: 'hidden',
    backdropFilter: 'blur(10px)',
    transition: 'all 0.3s ease',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'default',
    minWidth: '200px',
    minHeight: '120px',
    boxShadow: '0 0 20px rgba(0, 255, 255, 0.2)',
  };

  // Mobile compact version - just fire emoji and number
  if (isMobile) {
    return (
      <div 
        style={mobileCompactStyle}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.05)';
          e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 255, 255, 0.5)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 0 15px rgba(0, 255, 255, 0.3)';
        }}
      >
        <span style={{ fontSize: '1rem' }}>🔥</span>
        <span style={{
          fontSize: '0.85rem',
          fontWeight: 'bold',
          color: '#00ffff',
          fontFamily: '"Cyber", monospace',
          textShadow: '0 0 10px rgba(0, 255, 255, 0.7)',
        }}
        title={`${(animatedValue || 0).toLocaleString()} tokens burned`}
        >
          {formatCompactNumber(animatedValue || 23456789)}
        </span>
      </div>
    );
  }

  // Desktop full version
  return (
    <div 
      style={desktopStyle}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.02)';
        e.currentTarget.style.borderColor = 'rgba(0, 255, 255, 0.6)';
        e.currentTarget.style.boxShadow = '0 0 30px rgba(0, 255, 255, 0.4)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.borderColor = 'rgba(0, 255, 255, 0.4)';
        e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 255, 255, 0.2)';
      }}
    >
      <div style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.75rem',
      }}>
        <div style={{
          fontSize: '0.65rem',
          color: 'rgba(0, 255, 255, 0.8)',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          fontFamily: '"Cyber", monospace',
          textShadow: '0 0 10px rgba(0, 255, 255, 0.5)',
        }}>
          Tokens Burned
        </div>
        
        <div style={{
          fontSize: '1.4rem',
          fontWeight: 'bold',
          color: '#00ffff',
          display: 'flex',
          alignItems: 'baseline',
          gap: '0.25rem',
          fontFamily: '"Cyber", monospace',
          lineHeight: 1,
          textShadow: '0 0 15px rgba(0, 255, 255, 0.7)',
        }}>
          🔥 {(animatedValue || 0).toLocaleString()}
        </div>
        
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.25rem',
          padding: '0.25rem 0.5rem',
          borderRadius: '12px',
          backgroundColor: 'rgba(0, 255, 255, 0.1)',
          border: '1px solid rgba(0, 255, 255, 0.3)',
        }}>
          <div style={{
            width: '60px',
            height: '6px',
            background: 'rgba(0, 255, 255, 0.2)',
            borderRadius: '3px',
            overflow: 'hidden',
            position: 'relative',
          }}>
            <div style={{
              width: `${tokenData?.burnPercentage || 5}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #00ffff, #00ccff)',
              borderRadius: '3px',
              transition: 'width 1s ease-out',
              boxShadow: '0 0 10px rgba(0, 255, 255, 0.6)',
            }} />
          </div>
          <span style={{
            fontSize: '0.7rem',
            color: '#00ffff',
            fontWeight: '600',
            fontFamily: '"Cyber", monospace',
            textShadow: '0 0 5px rgba(0, 255, 255, 0.5)',
          }}>
            {tokenData?.burnPercentage || 5}%
          </span>
        </div>
        
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          padding: '0.3rem 0.8rem',
          fontSize: '0.6rem',
          color: '#00ffff',
          fontFamily: '"Cyber", monospace',
          textTransform: 'uppercase',
          letterSpacing: '0.15em',
          fontWeight: 'bold',
          background: 'linear-gradient(135deg, rgba(255, 140, 0, 0.15), rgba(0, 255, 255, 0.1))',
          border: '1px solid transparent',
          borderImage: 'linear-gradient(135deg, rgba(255, 140, 0, 0.6), rgba(0, 255, 255, 0.6)) 1',
          borderRadius: '20px',
          boxShadow: '0 2px 10px rgba(255, 140, 0, 0.2), 0 2px 10px rgba(0, 255, 255, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          textShadow: '0 0 8px rgba(255, 140, 0, 0.5), 0 0 12px rgba(0, 255, 255, 0.5)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <span style={{
            position: 'relative',
            zIndex: 1,
            background: 'linear-gradient(135deg, #ff8c00, #00ffff)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            deflationary
          </span>
          <div style={{
            position: 'absolute',
            top: 0,
            left: '-100%',
            width: '100%',
            height: '100%',
            background: 'linear-gradient(90deg, transparent, rgba(255, 140, 0, 0.2), rgba(0, 255, 255, 0.2), transparent)',
            animation: 'shimmer 3s infinite',
          }} />
        </div>
        
        <style jsx>{`
          @keyframes shimmer {
            0% { left: -100%; }
            100% { left: 100%; }
          }
        `}</style>
      </div>
    </div>
  );
};

export default TokensBurned;