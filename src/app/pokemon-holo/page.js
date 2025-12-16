'use client';

import React from 'react';
import PokemonHoloCard from '@/components/PokemonHoloCard';

export default function PokemonHoloPage() {
  const sampleCards = [
    {
      name: "Charizard",
      hp: 120,
      type: "Fire",
      attacks: [
        { name: "Fire Blast", damage: 120, cost: "🔥🔥🔥🔥" },
        { name: "Dragon Claw", damage: 80, cost: "🔥🔥💫" }
      ],
      weakness: "Water",
      resistance: "Fighting",
      retreatCost: 3,
      description: "Spits fire that is hot enough to melt boulders. Known to cause forest fires unintentionally.",
      // artist: "Ken Sugimori",
      cardNumber: "4/102"
    },
    {
      name: "Blastoise",
      hp: 100,
      type: "Water",
      attacks: [
        { name: "Hydro Pump", damage: 90, cost: "💧💧💧" },
        { name: "Surf", damage: 60, cost: "💧💧" }
      ],
      weakness: "Electric",
      resistance: "Fire",
      retreatCost: 2,
      description: "It crushes its foe under its heavy body to cause fainting. In a pinch, it will withdraw inside its shell.",
      // artist: "Ken Sugimori",
      cardNumber: "2/102"
    },
    {
      name: "Pikachu",
      hp: 60,
      type: "Electric",
      attacks: [
        { name: "Thunder Bolt", damage: 50, cost: "⚡⚡" },
        { name: "Quick Attack", damage: 20, cost: "💫" }
      ],
      weakness: "Fighting",
      resistance: "Metal",
      retreatCost: 1,
      description: "When several of these Pokémon gather, their electricity could build and cause lightning storms.",
      // artist: "Ken Sugimori",
      cardNumber: "58/102"
    }
  ];

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '40px 20px'
    }}>
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto' 
      }}>
        <h1 style={{ 
          textAlign: 'center', 
          color: 'white', 
          fontSize: '3rem',
          marginBottom: '20px',
          textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
        }}>
          Pokemon Holo Cards
        </h1>
        
        <p style={{
          textAlign: 'center',
          color: 'rgba(255,255,255,0.9)',
          fontSize: '1.2rem',
          marginBottom: '40px'
        }}>
          Move your mouse over the cards to see the holographic effect!
        </p>
        
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '40px',
          justifyItems: 'center'
        }}>
          {sampleCards.map((card, index) => (
            <PokemonHoloCard 
              key={index}
              {...card}
              rarity="rare holo"
            />
          ))}
        </div>

        <div style={{
          marginTop: '60px',
          padding: '20px',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '12px',
          backdropFilter: 'blur(10px)',
          color: 'white'
        }}>
          <h2 style={{ marginBottom: '15px' }}>Features:</h2>
          <ul style={{ lineHeight: '1.8', fontSize: '1.1rem' }}>
            <li>Interactive holographic effect on hover</li>
            <li>3D rotation following mouse movement</li>
            <li>Realistic Pokemon card layout</li>
            <li>Dynamic shine and rainbow effects</li>
            <li>Responsive design for mobile devices</li>
          </ul>
          
          <h3 style={{ marginTop: '20px', marginBottom: '10px' }}>Customization:</h3>
          <p>You can customize the cards with different Pokemon data, types, attacks, and more. The holographic effect is applied to cards with rarity="rare holo".</p>
        </div>
      </div>
    </div>
  );
}