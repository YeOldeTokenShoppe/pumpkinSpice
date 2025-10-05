"use client";

import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import { SwoopingAngelEmojiSimple, SwoopingDevilEmojiSimple } from '@/components/SwoopingEmojiSimple';

export default function EmojiOverlay({ isMobile, scrollY }) {
  return (
    <div 
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none', // Click through to HTML below
        zIndex: 9999, // Above everything
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 10], fov: 75, near: 0.1, far: 100 }}
        gl={{
          alpha: true, // Transparent background
          antialias: true,
        }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={3} />
        <directionalLight position={[10, 10, 5]} intensity={2} />
        
        <Suspense fallback={null}>
          {/* Example: Angel that appears OVER divs after disappearing BEHIND them */}
          {/* This one enters at 1000px from the left, after the behind-scene one exits */}
          <SwoopingAngelEmojiSimple 
            id="overlay-angel-weave"
            scrollThreshold={1500} // Appears after the "behind" one exits
            swoopFrom="left"
            finalPosition={[0, 0, 0]} // Center, floating over content
            isMobile={isMobile}
          />
          
          {/* Devil that weaves over content at 1800px */}
          <SwoopingDevilEmojiSimple 
            id="overlay-devil-weave"
            scrollThreshold={1800}
            swoopFrom="right"
            finalPosition={[2, -2, 0]} // Right side, floating over content
            isMobile={isMobile}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}