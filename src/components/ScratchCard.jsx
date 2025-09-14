"use client";

import { useEffect, useRef, useState } from 'react';
import styles from './ScratchCard.module.css';

const ScratchCard = ({ onComplete, title = "Scratch & Win" }) => {
  const canvasRef = useRef(null);
  const coinRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [infoRevealed, setInfoRevealed] = useState(false);
  const [isScratched, setIsScratched] = useState(false);
  const [showCoin, setShowCoin] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const isDrawingRef = useRef(false);
  const scratchAreaRef = useRef(null);

  // Detect if mobile on mount
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };
    checkMobile();
  }, []);

  useEffect(() => {
    // Small delay to ensure DOM is ready and layout is complete
    const timer = setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas || isReady) return; // Don't reinitialize if already ready

      // Set canvas to the dimensions you need
      canvas.width = 350;
      canvas.height = 190;
      
      // Remove any inline styles that might interfere
      canvas.style.width = '';
      canvas.style.height = '';

      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      // Paint golden gradient
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, '#d4af37');
      gradient.addColorStop(0.3, '#a67c00');
      gradient.addColorStop(0.5, '#d4af37');
      gradient.addColorStop(0.8, '#a67c00');
      gradient.addColorStop(1, '#d4af37');

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      setIsReady(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []); // Remove dependency to only run once

  const calculateTransparency = () => {
    const canvas = canvasRef.current;
    if (!canvas) return 0;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const width = canvas.width;
    const height = canvas.height;
    const imageData = ctx.getImageData(0, 0, width, height).data;
    let transparentPixels = 0;

    for (let i = 3; i < imageData.length; i += 4) {
      if (imageData[i] === 0) {
        transparentPixels++;
      }
    }

    return transparentPixels / (width * height);
  };

  // Add mouse and touch handlers for the coin
  useEffect(() => {
    const handlePointerMove = (clientX, clientY) => {
      const coin = coinRef.current;
      const scratchArea = scratchAreaRef.current;
      
      if (coin && scratchArea) {
        const rect = scratchArea.getBoundingClientRect();
        const padding = 100;
        
        const isNearScratchArea = 
          clientX >= (rect.left - padding) &&
          clientX <= (rect.right + padding) &&
          clientY >= (rect.top - padding) &&
          clientY <= (rect.bottom + padding);
        
        setShowCoin(isNearScratchArea);
        
        if (isNearScratchArea) {
          const offsetX = -24;
          const offsetY = 9;
          coin.style.transform = `translate(${clientX + offsetX}px, ${clientY + offsetY}px) translate(-50%, -50%)`;
        }
      }
    };

    const handleMouseMove = (e) => {
      handlePointerMove(e.clientX, e.clientY);
    };

    const handleTouchMove = (e) => {
      if (e.touches.length > 0) {
        handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const handleTouchStart = (e) => {
      if (e.touches.length > 0) {
        handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchstart', handleTouchStart);
    };
  }, []);

  const handleScratch = (clientX, clientY) => {
    const canvas = canvasRef.current;
    const coin = coinRef.current;
    if (!canvas) return;
  
    // Update coin position with same offsets
    if (coin) {
      const offsetX = -24; // Same adjustments as above
      const offsetY = 9;
      coin.style.transform = `translate(${clientX + offsetX}px, ${clientY + offsetY}px) translate(-50%, -50%)`;
    }
  
    // Rest of the function stays the same...
  
    // Rest of the function stays the same...

    // Scratch the canvas
    const canvasPosition = canvas.getBoundingClientRect();
    const scaleX = canvas.width / canvasPosition.width;
    const scaleY = canvas.height / canvasPosition.height;
    
    const canvasX = (clientX - canvasPosition.left) * scaleX;
    const canvasY = (clientY - canvasPosition.top) * scaleY;
    const ctx = canvas.getContext('2d');

    if (canvasX > 0 && canvasX < canvas.width && canvasY > 0 && canvasY < canvas.height) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(canvasX, canvasY, 20, 0, Math.PI * 2);
      ctx.fill();

      const transparency = calculateTransparency();
      
      if (transparency > 0.3 && !isScratched) {
        setIsScratched(true);
        setInfoRevealed(true);
        if (onComplete) {
          onComplete();
        }
      }
    }
  };

  const handleMouseMove = (e) => {
    if (isDrawingRef.current) {
      handleScratch(e.clientX, e.clientY);
    }
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    if (e.touches.length > 0) {
      handleScratch(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleMouseDown = () => {
    isDrawingRef.current = true;
  };

  const handleMouseUp = () => {
    isDrawingRef.current = false;
  };

  const handleTouchStart = (e) => {
    e.preventDefault();
    if (e.touches.length > 0) {
      // Immediately show coin on touch start
      setShowCoin(true);
      handleScratch(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  return (
    <>
      <div className={`${styles.scratchWin} ${isReady ? styles.scratchWinReady : ''}`}>
        <div className={styles.scratchWinTitle}>{title}</div>
        <div ref={scratchAreaRef} className={styles.scratchWinScratcher}>
          <div className={styles.scratchWinBackground}>
            <div className={styles.tokenomicsInfo}>
              <div className={styles.infoSection}>
                <h3>Core Tokenomics</h3>
                <ul>
                  <li>Total Supply: 80 Billion, capped</li>
                  <li>80% liquidity, 10% treasury, 10% marketing</li>
                  <li>Blockchain: Base (Ethereum L2)</li>
                </ul>
              </div>
              <div className={styles.infoSection}>
                <h3>Tax</h3>
                <ul>
                  <li>Start: 5% buy/sell</li>
                  <li>250+ buys: 3%</li>
                  <li>500+ buys: 1%</li>
                  <li>CEX listing: 0%</li>
                </ul>
              </div>
            </div>
          </div>
          <canvas
            ref={canvasRef}
            className={styles.scratchWinForeground}
            onMouseMove={handleMouseMove}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchMove={handleTouchMove}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleMouseUp}
          />
        </div>
      </div>
      
      <div 
        ref={coinRef}
        className={styles.scratchWinCoin}
        style={{
          // '--top': '0px',
          // '--left': '0px',
          display: (showCoin && !isMobile) ? 'block' : 'none'
        }}
      >
        <div className={styles.scratchWinCoinSide}></div>
        <div className={styles.scratchWinCoinBase}></div>
      </div>
{/*  */}
    </>
  );
};

export default ScratchCard;