import React, { useEffect, useState } from 'react';
import TradingCard from './TradingCard';
import './FocusedAgentCard.css';

const FocusedAgentCard = ({ agentId, onClose }) => {
  const [agentData, setAgentData] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  // Agent data - in a real app, this might come from an API
  const agentsDatabase = {
    'RL80': {
      id: 'RL80-PRIME',
      name: 'RL80',
      specialty: 'Autonomous Trader',
      image: '/pyromania.gif',
      status: 'active',
      stats: {
        successRate: 87,
        totalTrades: 1247,
        profit: '+324.5%'
      },
      currentInsight: 'Analyzing perpetual contracts. Strong bullish signal detected on ETH/USD. Executing long position with 3x leverage.',
      description: 'A virtuous and autonomous agent with one purpose: learn to trade perpetual contracts and maximize profits.'
    },
    'Emo': {
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
    'Macro': {
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
    'Tekno': {
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
    },
    'Mike': {
      id: 'MIKE-004',
      name: 'Mike',
      specialty: 'Risk Management',
      image: '/images/agent-placeholder.svg',
      status: 'active',
      stats: {
        successRate: 85,
        totalTrades: 765,
        profit: '+215.3%'
      },
      currentInsight: 'Portfolio risk exposure at 65%. Suggesting position size reduction on high-leverage trades.',
      description: 'Risk management specialist, optimizing portfolio exposure and protecting capital.'
    }
  };

  useEffect(() => {
    if (agentId && agentsDatabase[agentId]) {
      setAgentData(agentsDatabase[agentId]);
      // Delay to trigger animation
      setTimeout(() => setIsVisible(true), 10);
    } else {
      setIsVisible(false);
      // Wait for animation before clearing data
      setTimeout(() => setAgentData(null), 300);
    }
  }, [agentId]);

  if (!agentData) return null;

  return (
    <div className={`focused-agent-card ${isVisible ? 'visible' : ''}`}>
      <div className="card-container">
        <button className="close-button" onClick={onClose}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
        
        <div className="card-header">
          <h3>{agentData.name}</h3>
          <p>{agentData.specialty}</p>
        </div>
        
        <TradingCard 
          agent={agentData}
          isActive={true}
          onFlip={() => {}}
          className="focused-card"
        />
        
        <div className="card-description">
          <p>{agentData.description}</p>
        </div>
      </div>
    </div>
  );
};

export default FocusedAgentCard;