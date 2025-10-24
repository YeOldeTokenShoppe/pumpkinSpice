'use client';
import React, { useState } from 'react';

export default function CyberButton({ 
  children, 
  onClick, 
  variant = 'primary', // primary, secondary, danger
  size = 'medium', // small, medium, large
  fullWidth = false,
  disabled = false,
  style = {},
  ...props 
}) {
  const [isHovered, setIsHovered] = useState(false);

  // Size configurations
  const sizeConfig = {
    small: {
      padding: '8px 20px',
      fontSize: '14px',
    },
    medium: {
      padding: '12px 30px',
      fontSize: '16px',
    },
    large: {
      padding: '16px 40px',
      fontSize: '20px',
    }
  };

  // Color configurations
  const colorConfig = {
    primary: {
      border: '#00ff00',
      color: '#00ff00',
      shadowColor: '0, 255, 0',
      hoverIntensity: 0.8,
    },
    secondary: {
      border: '#00ffff',
      color: '#00ffff',
      shadowColor: '0, 255, 255',
      hoverIntensity: 0.8,
    },
    danger: {
      border: '#ff0040',
      color: '#ff0040',
      shadowColor: '255, 0, 64',
      hoverIntensity: 0.8,
    }
  };

  const config = colorConfig[variant];
  const sizeStyles = sizeConfig[size];

  const buttonStyle = {
    background: `linear-gradient(135deg, rgba(0, 0, 0, 0.9), rgba(${variant === 'primary' ? '0, 20, 0' : variant === 'secondary' ? '0, 20, 20' : '20, 0, 0'}, 0.9))`,
    border: `2px solid ${config.border}`,
    color: config.color,
    padding: sizeStyles.padding,
    fontSize: sizeStyles.fontSize,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    letterSpacing: '2px',
    textTransform: 'uppercase',
    borderRadius: '0',
    position: 'relative',
    overflow: 'hidden',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    width: fullWidth ? '100%' : 'auto',
    display: 'inline-block',
    boxShadow: isHovered && !disabled ? 
      `0 0 30px rgba(${config.shadowColor}, ${config.hoverIntensity}), 
       inset 0 0 30px rgba(${config.shadowColor}, 0.2),
       0 0 60px rgba(${config.shadowColor}, 0.4)` :
      `0 0 20px rgba(${config.shadowColor}, 0.5), 
       inset 0 0 20px rgba(${config.shadowColor}, 0.1)`,
    textShadow: `0 0 10px rgba(${config.shadowColor}, 0.8)`,
    transform: isHovered && !disabled ? 'translateY(-2px)' : 'translateY(0)',
    transition: 'all 0.3s ease',
    ...style
  };

  // Animated corner brackets
  const cornerStyle = {
    position: 'absolute',
    width: '15px',
    height: '15px',
    borderStyle: 'solid',
    borderColor: config.border,
    transition: 'all 0.3s ease',
  };

  return (
    <button
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => !disabled && setIsHovered(true)}
      onMouseLeave={() => !disabled && setIsHovered(false)}
      style={buttonStyle}
      disabled={disabled}
      {...props}
    >
      {/* Corner brackets for extra cyber effect */}
      <span style={{
        ...cornerStyle,
        top: 0,
        left: 0,
        borderWidth: '2px 0 0 2px',
        width: isHovered ? '20px' : '15px',
        height: isHovered ? '20px' : '15px',
      }} />
      <span style={{
        ...cornerStyle,
        top: 0,
        right: 0,
        borderWidth: '2px 2px 0 0',
        width: isHovered ? '20px' : '15px',
        height: isHovered ? '20px' : '15px',
      }} />
      <span style={{
        ...cornerStyle,
        bottom: 0,
        left: 0,
        borderWidth: '0 0 2px 2px',
        width: isHovered ? '20px' : '15px',
        height: isHovered ? '20px' : '15px',
      }} />
      <span style={{
        ...cornerStyle,
        bottom: 0,
        right: 0,
        borderWidth: '0 2px 2px 0',
        width: isHovered ? '20px' : '15px',
        height: isHovered ? '20px' : '15px',
      }} />
      
      {/* Scan line effect on hover */}
      {isHovered && !disabled && (
        <span style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: `linear-gradient(90deg, transparent, ${config.color}, transparent)`,
          animation: 'scanline 1.5s linear infinite',
        }} />
      )}
      
      {/* Button content */}
      <span style={{ position: 'relative', zIndex: 1 }}>
        {children}
      </span>

      <style jsx>{`
        @keyframes scanline {
          0% {
            top: -2px;
          }
          100% {
            top: 100%;
          }
        }
      `}</style>
    </button>
  );
}