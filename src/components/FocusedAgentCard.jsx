import React, { useEffect, useState } from 'react';
import PokemonHoloCard from './PokemonHoloCard';
import './FocusedAgentCard.css';

const FocusedAgentCard = ({ agentId }) => {
  const [agentData, setAgentData] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  // Agent data with Pokemon card properties
  const agentsDatabase = {
    'RL80': {
      name: 'RL80',
      hp: 120,
      type: 'Fire',
      backgroundImage: '/aurora.webp',
      foregroundImage: '/crier.png',
      attacks: [
        { name: 'Momentum Trade', damage: 87, cost: '💎💎💎' },
        { name: 'Leverage Strike', damage: 124, cost: '🔥🔥🔥🔥' }
      ],
      weakness: 'Market Crash',
      resistance: 'FOMO',
      retreatCost: 2,
      rarity: 'rare holo',
      artist: 'AI Trader',
      cardNumber: 'RL80-001',
      description: 'Analyzing perpetual contracts. Strong bullish signal detected on ETH/USD. Executing long position with 3x leverage.'
    },
    'Emo': {
      name: 'Emo',
      hp: 100,
      type: 'Water',
      backgroundImage: '/80carpet.png',
      foregroundImage: '/candles.png',
      attacks: [
        { name: 'Sentiment Shift', damage: 82, cost: '💧💧' },
        { name: 'Social Signal', damage: 67, cost: '💧' }
      ],
      weakness: 'Black Swan',
      resistance: 'FUD',
      retreatCost: 1,
      rarity: 'common',
      artist: 'Sentiment Bot',
      cardNumber: 'EMO-001',
      description: 'Market sentiment shifting to extreme greed. Social media mentions up 450%. Recommending defensive positioning.'
    },
    'Macro': {
      name: 'Macro',
      hp: 110,
      type: 'Electric',
      backgroundImage: '/heart.png',
      foregroundImage: '/crier.png',
      attacks: [
        { name: 'Fed Pivot', damage: 79, cost: '⚡⚡⚡' },
        { name: 'DXY Analysis', damage: 98, cost: '⚡⚡⚡⚡' }
      ],
      weakness: 'Inflation',
      resistance: 'Recession',
      retreatCost: 3,
      rarity: 'uncommon',
      artist: 'Macro Trader',
      cardNumber: 'MAC-002',
      description: 'Fed pivot indicators strengthening. DXY showing weakness. Favorable conditions for risk-on assets detected.'
    },
    'Tekno': {
      name: 'Tekno',
      hp: 105,
      type: 'Steel',
      backgroundImage: '/aurora.webp',
      foregroundImage: '/candles.png',
      attacks: [
        { name: 'Pattern Scan', damage: 91, cost: '⚙️⚙️' },
        { name: 'RSI Divergence', damage: 112, cost: '⚙️⚙️⚙️' }
      ],
      weakness: 'Slippage',
      resistance: 'Volatility',
      retreatCost: 2,
      rarity: 'rare',
      artist: 'Tech Analyst',
      cardNumber: 'TEK-003',
      description: 'BTC forming ascending triangle on 4H. RSI divergence confirmed. Target: $52,000. Stop loss: $47,200.'
    },
    'Mike': {
      name: 'Mike',
      hp: 95,
      type: 'Psychic',
      backgroundImage: '/80carpet.png',
      foregroundImage: '/crier.png',
      attacks: [
        { name: 'Risk Control', damage: 85, cost: '🔮🔮' },
        { name: 'Capital Shield', damage: 65, cost: '🔮' }
      ],
      weakness: 'Overleveraged',
      resistance: 'Drawdown',
      retreatCost: 1,
      rarity: 'uncommon',
      artist: 'Risk Manager',
      cardNumber: 'MIK-004',
      description: 'Portfolio risk exposure at 65%. Suggesting position size reduction on high-leverage trades.'
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
      <PokemonHoloCard 
        agent={agentData}
        className="focused-card"
      />
    </div>
  );
};

export default FocusedAgentCard;