'use client';

import React from 'react';
import FeatureCarousel from '@/components/FeatureCarousel';
import { WatchlistSlide, Illumin80Slide, TradingDeskSlide, TokenomicsSlide } from '@/components/FeatureSlides';

export default function CarouselScreen() {
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: 'linear-gradient(135deg, #0a0a0a, #1a1a2e)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden'
    }}>
      <div style={{
        width: '100%',
        height: '100%',
        maxWidth: '100%',
        maxHeight: '100%',
      }}>
        <FeatureCarousel
          slides={[
            <WatchlistSlide key="watchlist" />,
            <Illumin80Slide key="illumin80" />,
            <TradingDeskSlide key="trading" />,
            <TokenomicsSlide key="tokenomics" />,
          ]}
          autoRotate={true}
          rotationInterval={5000} // Slightly faster for demo
        />
      </div>
    </div>
  );
}