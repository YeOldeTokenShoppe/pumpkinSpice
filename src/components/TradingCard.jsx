import React from 'react';
import PokemonHoloCard from './PokemonHoloCard';

const TradingCard = ({ 
  agent, 
  isActive = false, 
  className = ''
}) => {
  // Map agent data to PokemonHoloCard props
  const attacks = [
    { 
      name: agent.specialty, 
      damage: agent.stats.successRate, 
      cost: `💎${agent.stats.totalTrades}` 
    },
    { 
      name: "Profit", 
      damage: agent.stats.profit, 
      cost: "📈💰" 
    }
  ];

  return (
    <PokemonHoloCard
      name={agent.name}
      hp={agent.stats.totalTrades}
      type={agent.status === 'active' ? 'Fire' : 'Water'}
      backgroundImage={agent.image || '/aurora.webp'}
      foregroundImage="/crier.png"
      backGemstone="/coinFront.png"
      attacks={attacks}
      weakness="Market Crash"
      resistance="FOMO"
      retreatCost={2}
      rarity={isActive ? "rare holo" : "common"}
      cardNumber={agent.id}
      description={agent.currentInsight}
      className={`${className} ${isActive ? 'active' : ''}`}
    />
  );
};

export default TradingCard;