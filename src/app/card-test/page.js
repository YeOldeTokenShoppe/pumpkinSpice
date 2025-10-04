'use client';

import PlayingCard from '@/components/PlayingCard';

export default function CardTestPage() {
  return (
    <div style={{ 
      margin: 0, 
      padding: 0,
      minHeight: '100vh',
      overflow: 'hidden'
    }}>
      <PlayingCard />
    </div>
  );
}