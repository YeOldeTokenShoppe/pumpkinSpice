"use client";

import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import { useDetectGPU } from '@react-three/drei';
import { SwoopingAngelEmojiSimple, SwoopingDevilEmojiSimple } from '@/components/SwoopingEmojiSimple';

export default function EmojiOverlay({ scrollY }) {
  // Detect GPU capabilities - this hook can be used directly
  const GPUTier = useDetectGPU();
  
  // Determine if we should use reduced quality based on GPU tier
  // Tier 0 = Low, 1 = Medium, 2 = High, 3 = Ultra
  const isLowEndDevice = GPUTier.tier < 2 || GPUTier.isMobile;
  // console.log('[EmojiOverlay] GPU Tier:', GPUTier.tier, 'Mobile:', GPUTier.isMobile);
  
  // Skip rendering on very low-end devices
  if (GPUTier.tier === 0) {
    return null;
  }
  
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
          antialias: !isLowEndDevice, // Disable antialiasing on low-end devices
          powerPreference: isLowEndDevice ? 'low-power' : 'high-performance',
          pixelRatio: isLowEndDevice ? 1 : window.devicePixelRatio,
        }}
        style={{ 
          background: 'transparent',
          pointerEvents: 'none' // Ensure canvas doesn't block clicks
        }}
        eventSource={null} // Disable Three.js event system
        eventPrefix="client"
      >
        <ambientLight intensity={3} />
        <directionalLight position={[10, 10, 5]} intensity={2} />
        
        <Suspense fallback={null}>
          {/* Example: Angel that appears OVER divs after disappearing BEHIND them */}
          {/* This one enters at 1000px from the left, after the behind-scene one exits */}
          <SwoopingAngelEmojiSimple 
            id="overlay-angel-weave"
            scrollThreshold={3000} // Appears after the "behind" one exits
            exitThreshold={2800}  // Exit if scrolling back up
            forwardExitThreshold={4000}  // Exit forward at 4000px
            swoopFrom="left"
            finalPosition={[-9, 0, 0]} // Center, floating over content
            isMobile={isLowEndDevice}
            modelPath="/models/angelEmojiOverlay.glb"
          />
          
          {/* Devil that weaves over content at 1800px */}
          <SwoopingDevilEmojiSimple 
            id="overlay-devil-weave"
            scrollThreshold={6000}
            exitThreshold={5200}  // Exit if scrolling back up
            forwardExitThreshold={8000}  // Exit forward at 7000px
            swoopFrom="bottom"
            finalPosition={[5, -2, 1]} // Right side, floating over content
            isMobile={isLowEndDevice}
            modelPath="/models/devilEmojiOverlay.glb"
          />
        </Suspense>
      </Canvas>
    </div>
  );
}