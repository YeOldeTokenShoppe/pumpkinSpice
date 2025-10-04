'use client';

import PlayingCard from '@/components/PlayingCard';

export default function CardDemo() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'radial-gradient(#BD243F, #190d23)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '2rem'
    }}>
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        gap: '2rem' 
      }}>
        <h1 style={{ 
          color: '#f5e3e3', 
          fontSize: '2rem', 
          textAlign: 'center' 
        }}>
          Interactive Playing Card
        </h1>
        <p style={{ 
          color: '#f5e3e3', 
          textAlign: 'center',
          maxWidth: '600px'
        }}>
          • Hover to tilt the card<br/>
          • Click to flip the card<br/>
          • Scroll to see rotation animation<br/>
          • On mobile: Touch and drag for tilt, long press to flip
        </p>
        <PlayingCard scale={1} />
      </div>
    </div>
  );
}