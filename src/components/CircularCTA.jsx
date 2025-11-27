'use client';
import React, { useId } from 'react';
import styles from './CircularCTA.module.css';

const CircularCTA = ({ 
  text = '• donate caffeine • donate caffeine • donate caffeine  •  ',
  href = '#',
  size = 250,
  textSize = 7,
  accentColor = '#ff0077',
  bgColor = '#000',
  customIcon = null,
  onClick,
  className = ''
}) => {
  const pathId = useId();
  const handleClick = (e) => {
    if (onClick) {
      e.preventDefault();
      onClick(e);
    }
  };

  const cssVars = {
    '--bmc-size': `${size}px`,
    '--bmc-accent': accentColor,
    '--bmc-bg': bgColor,
    '--fsize': `${textSize}px`
  };

  return (
    <a 
      className={`${styles.bmcCircle} ${className}`}
      href={href}
      onClick={handleClick}
      style={cssVars}
      target="_blank"
      rel="noopener noreferrer"
    >
      <svg 
        aria-hidden="true" 
        className={styles.bmcRing} 
        viewBox="0 0 100 100"
      >
        <defs>
          <path 
            d="M50,50 m -38,0 a 38,38 0 1,1 76,0 a 38,38 0 1,1 -76,0" 
            id={pathId}
          />
        </defs>
        <text className={styles.bmcText}>
          <textPath href={`#${pathId}`}>
            {text}
          </textPath>
        </text>
      </svg>
      
      <div className={styles.bmcCenter}>
        {customIcon ? (
          <div className={styles.customIcon}>
            {customIcon}
          </div>
        ) : (
          <img 
            src="/coinfront.png" 
            alt="Logo"
            className={styles.logo}
            width="100%"
            height="100%"
          />
        )}
      </div>
    </a>
  );
};

export default CircularCTA;