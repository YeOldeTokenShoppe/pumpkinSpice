'use client';

import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import CandleMarquee from './CandleMarquee';

function CandleMarqueeSection({ candleData = [] }) {
  return (
    <div 
      style={{
        width: '100%',
        height: '25rem', // Adjust height as needed
        position: 'relative',
        overflow: 'hidden',
        background: 'transparent',
      }}
    >
      <Canvas
        orthographic
        camera={{ 
          zoom: 50,
          position: [0, 0, 3], 
          near: 0.1,
          far: 1000
        }}
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: 'high-performance',
        }}
        style={{ 
          width: '100%', 
          height: '100%',
          background: 'transparent' 
        }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={1.5} />
          <directionalLight position={[5, 5, 5]} intensity={1.5} />
          <directionalLight position={[-5, 5, 5]} intensity={1.0} />
          <pointLight position={[0, 10, 0]} intensity={1.0} />
          
          <CandleMarquee 
            candleData={candleData}
            onCandleClick={(data) => console.log('Candle clicked:', data)}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}

export default CandleMarqueeSection;