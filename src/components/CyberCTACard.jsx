'use client';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function CyberCTACard({
  variant = 'buy', // 'buy' or 'stake'
  title,
  subtitle,
  value,
  description,
  icon,
  onClick,
  isMobile = false,
  buttonText,
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [buttonHovered, setButtonHovered] = useState(false);
  const [scanlinePosition, setScanlinePosition] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setScanlinePosition((prev) => (prev + 1) % 100);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const config = {
    buy: {
      borderColor: '#00ff00',
      glowColor: '0, 255, 0',
      gradientStart: '#00ff00',
      gradientEnd: '#00ff88',
      statusText: '[LIVE_MARKET]',
      statusColor: '#00ff00',
      bgGradient: 'rgba(0, 0, 0, 0.9), rgba(0, 20, 0, 0.8)',
    },
    stake: {
      borderColor: '#ffd700',
      glowColor: '255, 215, 0',
      gradientStart: '#ffd700',
      gradientEnd: '#00ff00',
      statusText: '[VAULT_SECURED]',
      statusColor: '#ffd700',
      bgGradient: 'rgba(20, 15, 0, 0.9), rgba(0, 20, 0, 0.8)',
    }
  };

  const styles = config[variant];

  return (
    <motion.div
      style={{
        background: `linear-gradient(135deg, ${styles.bgGradient})`,
        border: `2px solid ${styles.borderColor}`,
        borderRadius: '0',
        padding: isMobile ? '30px 25px' : '40px 35px',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'pointer',
        backdropFilter: 'blur(10px)',
        boxShadow: isHovered 
          ? `0 0 60px rgba(${styles.glowColor}, 0.5), inset 0 0 60px rgba(${styles.glowColor}, 0.1)`
          : `0 0 40px rgba(${styles.glowColor}, 0.3), inset 0 0 40px rgba(${styles.glowColor}, 0.05)`,
        transition: 'all 0.3s ease',
        transform: isHovered ? 'scale(1.02)' : 'scale(1)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      whileHover={{ y: -5 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Terminal header status */}
      <div style={{
        position: 'absolute',
        top: '15px',
        left: '15px',
        fontSize: '11px',
        fontFamily: 'monospace',
        color: styles.statusColor,
        opacity: 0.7,
        letterSpacing: '1px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        <span style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: styles.statusColor,
          animation: 'pulse 2s infinite',
          boxShadow: `0 0 10px ${styles.statusColor}`,
        }} />
        {styles.statusText}
      </div>

      {/* Corner brackets */}
      <div style={{
        position: 'absolute',
        top: '0',
        left: '0',
        width: '20px',
        height: '20px',
        borderTop: `2px solid ${styles.borderColor}`,
        borderLeft: `2px solid ${styles.borderColor}`,
        opacity: isHovered ? 1 : 0.5,
        transition: 'all 0.3s ease',
      }} />
      <div style={{
        position: 'absolute',
        top: '0',
        right: '0',
        width: '20px',
        height: '20px',
        borderTop: `2px solid ${styles.borderColor}`,
        borderRight: `2px solid ${styles.borderColor}`,
        opacity: isHovered ? 1 : 0.5,
        transition: 'all 0.3s ease',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '0',
        left: '0',
        width: '20px',
        height: '20px',
        borderBottom: `2px solid ${styles.borderColor}`,
        borderLeft: `2px solid ${styles.borderColor}`,
        opacity: isHovered ? 1 : 0.5,
        transition: 'all 0.3s ease',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '0',
        right: '0',
        width: '20px',
        height: '20px',
        borderBottom: `2px solid ${styles.borderColor}`,
        borderRight: `2px solid ${styles.borderColor}`,
        opacity: isHovered ? 1 : 0.5,
        transition: 'all 0.3s ease',
      }} />

      {/* Scanline effect */}
      {isHovered && (
        <div style={{
          position: 'absolute',
          top: `${scanlinePosition}%`,
          left: 0,
          right: 0,
          height: '2px',
          background: `linear-gradient(90deg, transparent, ${styles.borderColor}, transparent)`,
          opacity: 0.5,
          pointerEvents: 'none',
        }} />
      )}

      {/* Icon */}
      <div style={{
        fontSize: '48px',
        marginBottom: '20px',
        filter: `drop-shadow(0 0 20px rgba(${styles.glowColor}, 0.6))`,
        display: 'flex',
        justifyContent: 'center',
      }}>
        {icon}
      </div>

      {/* Button/Title */}
      <div 
        style={{
          padding: isMobile ? '10px 25px' : '12px 30px',
          marginBottom: '20px',
          fontSize: isMobile ? '18px' : '20px',
          fontWeight: 'bold',
          fontFamily: 'monospace',
          textTransform: 'uppercase',
          letterSpacing: '3px',
          color: '#000',
          position: 'relative',
          textAlign: 'center',
          transition: 'all 0.3s ease',
          filter: buttonHovered ? `drop-shadow(0 0 20px rgba(${styles.glowColor}, 0.8))` : 'none',
          isolation: 'isolate',
        }}
        onMouseEnter={() => setButtonHovered(true)}
        onMouseLeave={() => setButtonHovered(false)}
      >
        {/* Background layers */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: styles.borderColor,
          transform: 'translate(4px, 4px)',
          clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 30%, 100% 100%, 10px 100%, 0 70%)',
          zIndex: -2,
        }} />
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: buttonHovered 
            ? `linear-gradient(135deg, ${styles.gradientEnd}, ${styles.gradientStart})`
            : `linear-gradient(135deg, ${styles.gradientStart}, ${styles.gradientEnd})`,
          clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 30%, 100% 100%, 10px 100%, 0 70%)',
          boxShadow: buttonHovered
            ? `0 0 40px rgba(${styles.glowColor}, 0.8), inset 0 0 30px rgba(${styles.glowColor}, 0.4)`
            : `inset 0 0 20px rgba(0, 0, 0, 0.3)`,
          zIndex: -1,
        }} />
        
        {/* Button text */}
        <span style={{ position: 'relative', zIndex: 2 }}>
          {buttonText}
        </span>
        
        {/* Glitch overlay */}
        {buttonHovered && (
          <div style={{
            position: 'absolute',
            top: -4,
            left: -4,
            right: -4,
            bottom: -4,
            background: styles.borderColor,
            color: styles.gradientStart,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 30%, 100% 100%, 10px 100%, 0 70%)',
            animation: 'cyberGlitch 2s infinite',
            zIndex: 1,
            mixBlendMode: 'multiply',
          }}>
            <span style={{
              textShadow: `2px 2px ${styles.borderColor}, -2px -2px ${styles.gradientEnd}`,
            }}>
              {buttonText}
            </span>
            <div style={{
              position: 'absolute',
              top: 4,
              left: 4,
              right: 4,
              bottom: 4,
              background: `linear-gradient(135deg, ${styles.gradientEnd}, ${styles.gradientStart})`,
              clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 30%, 100% 100%, 10px 100%, 0 70%)',
              zIndex: -1,
            }} />
          </div>
        )}
      </div>

      {/* Value display */}
      <div style={{
        fontSize: isMobile ? '36px' : '42px',
        fontWeight: '900',
        margin: '20px 0',
        fontFamily: 'monospace',
        textAlign: 'center',
        background: `linear-gradient(135deg, ${styles.gradientStart}, ${styles.gradientEnd})`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        textShadow: `0 0 30px rgba(${styles.glowColor}, 0.5)`,
        letterSpacing: '1px',
      }}>
        {value}
      </div>

      {/* Description */}
      <p style={{
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: isMobile ? '14px' : '16px',
        lineHeight: '1.6',
        fontFamily: 'monospace',
        textAlign: 'center',
        margin: 0,
      }}>
        {description}
      </p>

      {/* Grid pattern overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `
          repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(${styles.glowColor}, 0.03) 2px,
            rgba(${styles.glowColor}, 0.03) 4px
          ),
          repeating-linear-gradient(
            90deg,
            transparent,
            transparent 2px,
            rgba(${styles.glowColor}, 0.03) 2px,
            rgba(${styles.glowColor}, 0.03) 4px
          )
        `,
        pointerEvents: 'none',
        opacity: isHovered ? 0.5 : 0.3,
        transition: 'opacity 0.3s ease',
      }} />

      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            box-shadow: 0 0 10px currentColor;
          }
          50% {
            opacity: 0.5;
            box-shadow: 0 0 20px currentColor;
          }
        }
        
        @keyframes cyberGlitch {
          0% {
            clip-path: polygon(0 2%, 100% 2%, 100% 95%, 95% 95%, 95% 90%, 85% 90%, 85% 95%, 8% 95%, 0 70%);
          }
          2%, 8% {
            clip-path: polygon(0 78%, 100% 78%, 100% 100%, 95% 100%, 95% 90%, 85% 90%, 85% 100%, 8% 100%, 0 78%);
            transform: translate(-5px, 0);
          }
          6% {
            clip-path: polygon(0 78%, 100% 78%, 100% 100%, 95% 100%, 95% 90%, 85% 90%, 85% 100%, 8% 100%, 0 78%);
            transform: translate(5px, 0);
          }
          9% {
            clip-path: polygon(0 78%, 100% 78%, 100% 100%, 95% 100%, 95% 90%, 85% 90%, 85% 100%, 8% 100%, 0 78%);
            transform: translate(0, 0);
          }
          10% {
            clip-path: polygon(0 44%, 100% 44%, 100% 54%, 95% 54%, 95% 54%, 85% 54%, 85% 54%, 8% 54%, 0 54%);
            transform: translate(5px, 0);
          }
          13% {
            clip-path: polygon(0 44%, 100% 44%, 100% 54%, 95% 54%, 95% 54%, 85% 54%, 85% 54%, 8% 54%, 0 54%);
            transform: translate(0, 0);
          }
          14%, 21% {
            clip-path: polygon(0 0, 100% 0, 100% 0, 95% 0, 95% 0, 85% 0, 85% 0, 8% 0, 0 0);
            transform: translate(5px, 0);
          }
          25% {
            clip-path: polygon(0 0, 100% 0, 100% 0, 95% 0, 95% 0, 85% 0, 85% 0, 8% 0, 0 0);
            transform: translate(5px, 0);
          }
          30% {
            clip-path: polygon(0 0, 100% 0, 100% 0, 95% 0, 95% 0, 85% 0, 85% 0, 8% 0, 0 0);
            transform: translate(-5px, 0);
          }
          35%, 45% {
            clip-path: polygon(0 40%, 100% 40%, 100% 85%, 95% 85%, 95% 85%, 85% 85%, 85% 85%, 8% 85%, 0 70%);
            transform: translate(-5px, 0);
          }
          40% {
            clip-path: polygon(0 40%, 100% 40%, 100% 85%, 95% 85%, 95% 85%, 85% 85%, 85% 85%, 8% 85%, 0 70%);
            transform: translate(5px, 0);
          }
          50% {
            clip-path: polygon(0 40%, 100% 40%, 100% 85%, 95% 85%, 95% 85%, 85% 85%, 85% 85%, 8% 85%, 0 70%);
            transform: translate(0, 0);
          }
          55% {
            clip-path: polygon(0 63%, 100% 63%, 100% 80%, 95% 80%, 95% 80%, 85% 80%, 85% 80%, 8% 80%, 0 70%);
            transform: translate(5px, 0);
          }
          60% {
            clip-path: polygon(0 63%, 100% 63%, 100% 80%, 95% 80%, 95% 80%, 85% 80%, 85% 80%, 8% 80%, 0 70%);
            transform: translate(0, 0);
          }
          31%, 61%, 100% {
            clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 30%, 100% 100%, 10px 100%, 0 70%);
          }
        }
      `}</style>
    </motion.div>
  );
}