import React, { useState, useEffect } from 'react';
import TradingCard from './TradingCard';
import './TradingCardsDisplay.css';

const TradingCardsDisplay = () => {
  const [activeCard, setActiveCard] = useState(0);
  const [agentsData, setAgentsData] = useState([
    {
      id: 'RL80-PRIME',
      name: 'RL80',
      specialty: 'Autonomous Trader',
      image: '/wawa.jpg',
      status: 'active',
      stats: {
        successRate: 87,
        totalTrades: 1247,
        profit: '+324.5%'
      },
      currentInsight: 'Analyzing perpetual contracts. Strong bullish signal detected on ETH/USD. Executing long position with 3x leverage.',
      description: 'A virtuous and autonomous agent with one purpose: learn to trade perpetual contracts and maximize profits for her followers and token holders.'
    },
    {
      id: 'EMO-001',
      name: 'Emo',
      specialty: 'Sentiment Analysis',
      image: '/images/agent-placeholder.svg',
      status: 'active',
      stats: {
        successRate: 82,
        totalTrades: 892,
        profit: '+267.3%'
      },
      currentInsight: 'Market sentiment shifting to extreme greed. Social media mentions up 450%. Recommending defensive positioning.',
      description: 'Specialist in market sentiment, analyzing social signals and emotional market drivers.'
    },
    {
      id: 'MACRO-002',
      name: 'Macro',
      specialty: 'Macro Trends',
      image: '/images/agent-placeholder.svg',
      status: 'active',
      stats: {
        successRate: 79,
        totalTrades: 543,
        profit: '+198.7%'
      },
      currentInsight: 'Fed pivot indicators strengthening. DXY showing weakness. Favorable conditions for risk-on assets detected.',
      description: 'Macro trends specialist, tracking global economic indicators and policy shifts.'
    },
    {
      id: 'TEKNO-003',
      name: 'Tekno',
      specialty: 'Technical Analysis',
      image: '/images/agent-placeholder.svg',
      status: 'active',
      stats: {
        successRate: 91,
        totalTrades: 2103,
        profit: '+412.8%'
      },
      currentInsight: 'BTC forming ascending triangle on 4H. RSI divergence confirmed. Target: $52,000. Stop loss: $47,200.',
      description: 'Technical analysis expert, identifying patterns and executing precision trades.'
    }
  ]);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setAgentsData(prev => prev.map(agent => ({
        ...agent,
        stats: {
          ...agent.stats,
          totalTrades: agent.stats.totalTrades + Math.floor(Math.random() * 3)
        }
      })));
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, []);

  // Auto-rotate through cards
  useEffect(() => {
    const rotateInterval = setInterval(() => {
      setActiveCard((prev) => (prev + 1) % agentsData.length);
    }, 5000); // Change active card every 5 seconds

    return () => clearInterval(rotateInterval);
  }, [agentsData.length]);

  const handleCardClick = (index) => {
    setActiveCard(index);
  };

  return (
    <div className="trading-cards-container">
      {/* Header removed - shown in overlay portal instead */}
      
      <div className="cards-grid">
        {agentsData.map((agent, index) => (
          <div 
            key={agent.id} 
            className={`card-wrapper ${index === activeCard ? 'active' : ''}`}
            onClick={() => handleCardClick(index)}
          >
            <TradingCard 
              agent={agent}
              isActive={index === activeCard}
              onFlip={(flipped) => console.log(`Card ${agent.name} flipped:`, flipped)}
            />
          </div>
        ))}
      </div>
      
      <div className="cards-controls">
        <div className="card-indicators">
          {agentsData.map((_, index) => (
            <button
              key={index}
              className={`indicator ${index === activeCard ? 'active' : ''}`}
              onClick={() => setActiveCard(index)}
              aria-label={`View agent ${index + 1}`}
            />
          ))}
        </div>
      </div>
      
      <div className="council-status">
        <div className="status-item">
          <span className="status-label">Council Status:</span>
          <span className="status-value active">ONLINE</span>
        </div>
        <div className="status-item">
          <span className="status-label">Total Profit:</span>
          <span className="status-value">+1203.3%</span>
        </div>
        <div className="status-item">
          <span className="status-label">Active Positions:</span>
          <span className="status-value">17</span>
        </div>
      </div>
    </div>
  );
};

export default TradingCardsDisplay;