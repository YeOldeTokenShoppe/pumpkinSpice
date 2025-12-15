import React, { useRef, useEffect, useState } from 'react';
import './TradingCard.css';

const TradingCard = ({ 
  agent, 
  isActive = false, 
  onFlip,
  className = ''
}) => {
  const cardRef = useRef(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [pointerPos, setPointerPos] = useState({ x: 0, y: 0 });

  const handlePointerMove = (e) => {
    if (!cardRef.current || !isActive) return;
    
    const bounds = cardRef.current.getBoundingClientRect();
    const posX = e.clientX - bounds.x;
    const posY = e.clientY - bounds.y;
    const ratioX = posX / bounds.width - 0.5;
    const ratioY = posY / bounds.height - 0.5;
    const pointerX = Math.max(-1, Math.min(1, ratioX * 2)).toFixed(2);
    const pointerY = Math.max(-1, Math.min(1, ratioY * 2)).toFixed(2);
    
    setPointerPos({ x: pointerX, y: pointerY });
    cardRef.current.style.setProperty('--pointer-x', pointerX);
    cardRef.current.style.setProperty('--pointer-y', pointerY);
  };

  const handleFlipClick = () => {
    setIsFlipped(!isFlipped);
    if (onFlip) onFlip(!isFlipped);
  };

  useEffect(() => {
    document.addEventListener('pointermove', handlePointerMove);
    return () => document.removeEventListener('pointermove', handlePointerMove);
  }, [isActive]);

  return (
    <article 
      className={`trading-card ${className} ${isActive ? 'active' : ''}`} 
      data-active={isActive}
      ref={cardRef}
    >
      <button 
        aria-label="Flip card" 
        aria-pressed={isFlipped}
        onClick={handleFlipClick}
      ></button>
      <div className="card__content">
        {/* Back of card */}
        <div className="card__rear card__face">
          <div className="card__emboss">
            {/* <div className="wordmark">
              <span>RL80 TRADERS</span>
            </div> */}
            <div className="wordmark">
              <span>RL80 TRADERS</span>
            </div>
            <div className="gemstone">
              {agent.image ? (
                <img 
                  src={agent.image} 
                  alt={agent.name}
                  className="agent-avatar"
                />
              ) : (
                <div className="gemstone-inner"></div>
              )}
            </div>
          </div>
          <div className="spotlight"></div>
        </div>
        
        {/* Front of card */}
        <div className="card__front card__face">
          <div className="img">
            <img src={agent.image} alt={agent.name} />
          </div>
          
          {/* Holographic pattern layers */}
          <div className="pattern">
            <div className="refraction"></div>
            <div className="refraction"></div>
          </div>
          
          <div className="watermark">
            <div className="refraction"></div>
            <div className="refraction"></div>
          </div>
          
          {/* Card frame with agent info */}
          <div className="card__frame card__emboss">
            <h3>
              <span>{agent.name}</span>
              <span>{agent.specialty}</span>
            </h3>
            
            {/* Agent stats */}
            <div className="agent-stats">
              <div className="stat">
                <span className="stat-label">Success Rate</span>
                <span className="stat-value">{agent.stats.successRate}%</span>
              </div>
              <div className="stat">
                <span className="stat-label">Total Trades</span>
                <span className="stat-value">{agent.stats.totalTrades}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Profit</span>
                <span className="stat-value">{agent.stats.profit}</span>
              </div>
            </div>
            
            {/* Current insight */}
            <div className="current-insight">
              <p>{agent.currentInsight}</p>
            </div>
            
            {/* Signature/ID */}
            <div className="agent-signature">
              <span>Agent ID: {agent.id}</span>
            </div>
            
            {/* Status indicator */}
            <div className={`status-indicator ${agent.status}`}>
              <span></span>
            </div>
          </div>
          
          <div className="spotlight"></div>
          <div className="glare-container">
            <div className="glare"></div>
          </div>
        </div>
      </div>
    </article>
  );
};

export default TradingCard;