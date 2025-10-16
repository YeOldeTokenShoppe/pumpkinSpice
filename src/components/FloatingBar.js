"use client";

import { useState, useEffect } from 'react';

const FloatingBar = ({ isMobile = false }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show the floating bar after a short delay
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleBuyClick = () => {
    // window.open('https://app.uniswap.org/swap?outputCurrency=YOUR_CONTRACT_ADDRESS', '_blank');
    window.open( '#', '_blank');
  };

  const handleStakeClick = () => {
    window.open('#', '_blank');
  };

  if (!isVisible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'rgba(17, 24, 39, 0.95)',
        backdropFilter: 'blur(20px)',
        padding: isMobile ? '20px 15px' : '20px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: isMobile ? '10px' : '20px',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        zIndex: 10000,
        animation: 'slideUp 0.4s ease-out',
        flexDirection: isMobile ? 'column' : 'row',
        paddingBottom: isMobile ? 'max(20px, env(safe-area-inset-bottom))' : '20px',
      }}
    >
      <div style={{
        color: 'white',
        fontSize: '14px',
        marginRight: isMobile ? '0' : '20px',
        marginBottom: isMobile ? '10px' : '0',
        textAlign: 'center',
      }}>
        <div>RL80 Price: <span style={{
          fontSize: '20px',
          fontWeight: '700',
          color: '#10b981',
        }}>$0.0048</span></div>
      </div>
      
      <button
        onClick={handleBuyClick}
        style={{
          padding: isMobile ? '14px 30px' : '12px 35px',
          fontSize: isMobile ? '14px' : '16px',
          fontWeight: '700',
          border: 'none',
          borderRadius: '30px',
          cursor: 'pointer',
          transition: 'all 0.3s',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: 'white',
          boxShadow: '0 10px 30px rgba(16, 185, 129, 0.4)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-3px)';
          e.currentTarget.style.boxShadow = '0 15px 40px rgba(16, 185, 129, 0.6)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 10px 30px rgba(16, 185, 129, 0.4)';
        }}
      >
        BUY NOW
      </button>
      
      <button
        onClick={handleStakeClick}
        style={{
          padding: isMobile ? '14px 30px' : '12px 35px',
          fontSize: isMobile ? '14px' : '16px',
          fontWeight: '700',
          border: 'none',
          borderRadius: '30px',
          cursor: 'pointer',
          transition: 'all 0.3s',
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          color: 'white',
          boxShadow: '0 10px 30px rgba(245, 158, 11, 0.4)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-3px)';
          e.currentTarget.style.boxShadow = '0 15px 40px rgba(245, 158, 11, 0.6)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 10px 30px rgba(245, 158, 11, 0.4)';
        }}
      >
        STAKE
      </button>

      <style jsx>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default FloatingBar;