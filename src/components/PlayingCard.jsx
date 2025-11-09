import React, { useState, useRef, useEffect } from 'react';
import './PlayingCard.scss';
import { BuyWidget } from "thirdweb";
import { defineChain } from "thirdweb";
import { createWallet } from "thirdweb/wallets";
import { client } from "../client";

const PlayingCard = ({ frontImage = '/queenOfHearts.png', scale = 1 }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [tiltX, setTiltX] = useState(0);
  const [tiltY, setTiltY] = useState(0);
  const [isInView, setIsInView] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const cardRef = useRef(null);
  const containerRef = useRef(null);

  // Intersection Observer to detect when card comes into view
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Trigger animation every time card comes into view
            console.log('Card is in view, triggering animation!');
            setIsInView(false); // Reset first to retrigger animation
            setTimeout(() => {
              setIsInView(true); // Then trigger animation
            }, 10);
          } else {
            // Reset when card goes out of view
            setIsInView(false);
          }
        });
      },
      {
        threshold: 0.1, // Trigger when 10% of the card is visible
        rootMargin: '0px' // Trigger as soon as it enters viewport
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, []);

  const handleClick = () => {
    // Only flip if clicking the front of the card
    if (!isFlipped) {
      setIsFlipped(true);
    }
  };

  const handleBackClick = (e) => {
    // Stop propagation to prevent card flip
    e.stopPropagation();
  };

  const handleFlipBack = () => {
    // Add a small button or area to flip back
    setIsFlipped(false);
  };

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const tiltX = -(y - centerY) / 20;
    const tiltY = (x - centerX) / 20;
    
    setTiltX(tiltX);
    setTiltY(tiltY);
  };

  const handleMouseLeave = () => {
    setTiltX(0);
    setTiltY(0);
  };

  return (
    <div 
      className={`playing-card-container ${isInView ? 'card-animate-in' : ''}`}
      style={{ transform: `scale(${scale})` }}
      ref={containerRef}
    >
      <div 
        className={`playing-card ${isFlipped ? 'flipped' : ''} ${isInView ? 'card-visible' : ''}`}
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: `
            perspective(1000px)
            rotateY(${(isFlipped ? 180 : 0) + tiltY * 3}deg)
            rotateX(${tiltX * 3}deg)
            translateZ(0)
          `
        }}
      >
        <div className="card-front" onClick={handleClick}>
          <img src={frontImage} alt="Playing Card" />
        </div>
        <div className="card-back" onClick={handleBackClick}>
          <button 
            className="flip-back-btn" 
            onClick={handleFlipBack}
          >
            ← Back
          </button>
      <BuyWidget
      client={client}
      // image={"https://rl80.com/vvv.jpg"}
      currency={"USD"}
      chain={defineChain(8453)}
      amount={"0.002"}
      tokenAddress={"0x532f27101965dd16442E59d40670FaF5eBB142E4"}
      seller={"0x0000000000000000000000000000000000000000"}
    />
        </div>
      </div>
    </div>
  );
};

export default PlayingCard;