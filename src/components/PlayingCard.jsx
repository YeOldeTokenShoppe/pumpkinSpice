import React, { useState, useRef } from 'react';
import './PlayingCard.scss';
import { BuyWidget } from "thirdweb/react";
import { defineChain } from "thirdweb";
import { createWallet } from "thirdweb/wallets";
import { client } from "../client";

const PlayingCard = ({ frontImage = '/queenOfHearts.png', scale = 1 }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [tiltX, setTiltX] = useState(0);
  const [tiltY, setTiltY] = useState(0);
  const cardRef = useRef(null);

  const handleClick = (e) => {
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
      className="playing-card-container"
      style={{ transform: `scale(${scale})` }}
      ref={cardRef}
    >
      <div 
        className={`playing-card ${isFlipped ? 'flipped' : ''}`}
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