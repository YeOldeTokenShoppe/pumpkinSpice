"use client";
import React, { useState, useEffect, useRef } from 'react';
import styles from './RotatingPnL.module.css';

const RotatingPnL = ({ tradingData }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Mock data - replace with actual trading data
  const pnlData = [
    { 
      period: "24H", 
      value: tradingData?.pnl24h || "+$1,234",
      percentage: tradingData?.pnl24hPercent || "+12.5%",
      isPositive: true
    },
    { 
      period: "7D", 
      value: tradingData?.pnl7d || "+$8,901",
      percentage: tradingData?.pnl7dPercent || "+8.2%",
      isPositive: true
    },
    { 
      period: "30D", 
      value: tradingData?.pnl30d || "-$567",
      percentage: tradingData?.pnl30dPercent || "-2.1%",
      isPositive: false
    }
  ];
  
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isAnimating) {
        setIsAnimating(true);
        
        // Animate out current text for all word types
        const wordTypes = ['period', 'value', 'percentage'];
        wordTypes.forEach(wordType => {
          const currentLetters = document.querySelectorAll(`.word-${wordType}-${currentIndex} .${styles.letter}`);
          currentLetters.forEach((letter, i) => {
            setTimeout(() => {
              letter.classList.remove(styles.in);
              letter.classList.add(styles.out);
            }, i * 50);
          });
        });
        
        // After out animation, switch to next
        setTimeout(() => {
          const nextIndex = (currentIndex + 1) % pnlData.length;
          setCurrentIndex(nextIndex);
          
          // Animate in new text
          setTimeout(() => {
            wordTypes.forEach(wordType => {
              const newLetters = document.querySelectorAll(`.word-${wordType}-${nextIndex} .${styles.letter}`);
              newLetters.forEach((letter, i) => {
                letter.classList.remove(styles.out);
                setTimeout(() => {
                  letter.classList.add(styles.in);
                }, i * 50);
              });
            });
            
            // Reset animation state
            setTimeout(() => {
              setIsAnimating(false);
            }, 600);
          }, 100);
        }, 400);
      }
    }, 3000);
    
    return () => clearInterval(interval);
  }, [currentIndex, isAnimating, pnlData.length]);
  
  const renderWord = (text, className, index, color, wordType) => {
    const isActive = index === currentIndex;
    const wordStyle = isActive ? { 
      opacity: 1, 
      color: color || 'inherit' 
    } : { 
      opacity: 0,
      color: color || 'inherit'
    };
    
    return (
      <div 
        key={`${wordType}-${index}`}
        className={`${styles.word} word-${wordType}-${index} ${isActive ? styles.active : ''}`}
        style={wordStyle}
      >
        {text.split('').map((letter, i) => (
          <span key={`${wordType}-${index}-letter-${i}`} className={styles.letter}>
            {letter}
          </span>
        ))}
      </div>
    );
  };
  
  return (
    <div className={styles.container}>
      {/* Period moved to title position */}
      <div className={styles.titleWrapper}>
        {pnlData.map((data, i) => 
          renderWord(data.period, styles.title, i, null, 'period')
        )}
      </div>
      
      <div className={styles.rotatingContainer}>
        {/* Value */}
        <div className={`${styles.wordWrapper} ${styles.value}`}>
          {pnlData.map((data, i) => 
            renderWord(data.value, styles.value, i, data.isPositive ? '#00ff41' : '#ff0041', 'value')
          )}
        </div>
        
        {/* Percentage */}
        <div className={`${styles.wordWrapper} ${styles.percentage}`}>
          {pnlData.map((data, i) => 
            renderWord(data.percentage, styles.percentage, i, data.isPositive ? '#00ff41' : '#ff0041', 'percentage')
          )}
        </div>
      </div>
      
      {/* Dots indicator */}
      <div className={styles.dotsContainer}>
        {pnlData.map((_, index) => (
          <div
            key={index}
            className={`${styles.dot} ${index === currentIndex ? styles.active : ''}`}
          />
        ))}
      </div>
    </div>
  );
};

export default RotatingPnL;