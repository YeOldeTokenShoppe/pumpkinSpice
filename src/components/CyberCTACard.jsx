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
      <div style={{
        background: `linear-gradient(135deg, ${styles.gradientStart}, ${styles.gradientEnd})`,
        padding: isMobile ? '10px 25px' : '12px 30px',
        marginBottom: '20px',
        fontSize: isMobile ? '18px' : '20px',
        fontWeight: 'bold',
        fontFamily: 'monospace',
        textTransform: 'uppercase',
        letterSpacing: '3px',
        color: '#000',
        position: 'relative',
        clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 100%, 10px 100%)',
        textAlign: 'center',
        boxShadow: `inset 0 0 20px rgba(0, 0, 0, 0.3)`,
      }}>
        {buttonText}
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
      `}</style>
    </motion.div>
  );
}