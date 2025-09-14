"use client";

import { useEffect, useRef, useState } from 'react';
import styles from './ScratchCard.module.css';

const ScratchCardSimple = ({ onComplete, title = "Scratch & Win" }) => {
  const containerRef = useRef(null);
  const [isScratching, setIsScratching] = useState(false);
  const [isScratched, setIsScratched] = useState(false);
  const [scratchPercentage, setScratchPercentage] = useState(0);
  const [overlayOpacity, setOverlayOpacity] = useState(1);

  const handleScratch = (e) => {
    if (!isScratching) return;
    
    // Gradually reduce opacity as user scratches
    setOverlayOpacity(prev => Math.max(0, prev - 0.02));
    
    if (overlayOpacity < 0.7 && !isScratched) {
      setIsScratched(true);
      if (onComplete) {
        onComplete();
      }
    }
  };

  return (
    <>
      <div className={`${styles.scratchWin} ${styles.scratchWinReady}`}>
        <div className={styles.scratchWinTitle}>{title}</div>
        <div 
          ref={containerRef}
          className={styles.scratchContainer}
          onMouseDown={() => setIsScratching(true)}
          onMouseUp={() => setIsScratching(false)}
          onMouseLeave={() => setIsScratching(false)}
          onMouseMove={handleScratch}
          onTouchStart={() => setIsScratching(true)}
          onTouchEnd={() => setIsScratching(false)}
          onTouchMove={(e) => {
            if (e.touches.length > 0) {
              const touch = e.touches[0];
              handleScratch({ clientX: touch.clientX, clientY: touch.clientY });
            }
          }}
        >
          <div className={styles.scratchContent}>
            <div className={styles.tokenomicsInfo}>
              <div className={styles.infoSection}>
                <h3>Core Tokenomics</h3>
                <ul>
                  <li>Total Supply: 80B RL80</li>
                  <li>80% liquidity, 10% treasury, 10% marketing</li>
                  <li>Network: Base (Ethereum L2)</li>
                </ul>
              </div>
              <div className={styles.infoSection}>
                <h3>Tax Structure</h3>
                <ul>
                  <li>Start: 5% buy/sell</li>
                  <li>250+ buys: 3%</li>
                  <li>500+ buys: 1%</li>
                  <li>CEX listing: 0%</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div 
            className={styles.goldOverlay} 
            style={{ opacity: overlayOpacity, transition: 'none' }}
          ></div>
        </div>
      </div>

      {isScratched && (
        <div className={`${styles.confetti} ${styles.confettiActive}`}>
          {[...Array(20)].map((_, i) => (
            <svg
              key={i}
              className={styles.confettiItem}
              width="6"
              height="6"
              viewBox="0 0 6 6"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M0.979033 1.30301C1.85813 0.337112 3.35383 0.26675 4.31973 1.14585C5.28563 2.02495 5.35599 3.52065 4.47684 4.48647C3.59775 5.45237 2.10205 5.52273 1.13623 4.64358C0.170248 3.76453 0.0999339 2.26891 0.979033 1.30301Z"
                fill={['#a864fd', '#29cdff', '#78ff44', '#ff718d'][i % 4]}
              />
            </svg>
          ))}
        </div>
      )}
    </>
  );
};

export default ScratchCardSimple;