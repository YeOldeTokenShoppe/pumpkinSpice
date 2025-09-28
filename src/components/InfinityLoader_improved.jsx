'use client';

import { useEffect, useRef, useCallback } from 'react';
import './InfinityLoader.css';

export default function InfinityLoader({ loading = true }) {
  const symbolRef = useRef(null);
  const animationRef = useRef(null);
  const stateRef = useRef({
    x: 0,
    y: 0,
    direction: 'horizontal',
    travelingRight: true,
    travelingDown: true,
    lastTime: 0,
    speed: 300,
    bounds: { width: 0, height: 0 },
    symbolSize: { width: 292, height: 176 }
  });

  const updateBounds = useCallback(() => {
    stateRef.current.bounds = {
      width: window.innerWidth,
      height: window.innerHeight
    };
  }, []);

  const animate = useCallback((currentTime) => {
    if (!symbolRef.current || window.innerWidth < 1920) {
      animationRef.current = requestAnimationFrame(animate);
      return;
    }

    const state = stateRef.current;
    const deltaTime = currentTime - state.lastTime;
    
    if (deltaTime < 16) {
      animationRef.current = requestAnimationFrame(animate);
      return;
    }

    const distance = (state.speed * deltaTime) / 1000;
    const symbolWidth = state.symbolSize.width;
    const symbolHeight = state.symbolSize.height;
    
    const currentX = state.x;
    const currentY = state.y;
    
    const halfWidth = symbolWidth / 2;
    const halfHeight = symbolHeight / 2;
    
    const centerX = state.bounds.width / 2;
    const centerY = state.bounds.height / 2;
    
    const actualLeft = centerX + currentX - halfWidth;
    const actualTop = centerY + currentY - halfHeight;
    const actualRight = actualLeft + symbolWidth;
    const actualBottom = actualTop + symbolHeight;

    const margin = 2;
    const isAtTop = actualTop <= margin;
    const isAtRight = actualRight >= state.bounds.width - margin;
    const isAtBottom = actualBottom >= state.bounds.height - margin;
    const isAtLeft = actualLeft <= margin;

    let switchDirection = false;
    
    if (state.direction === 'horizontal') {
      if (state.travelingRight) {
        state.x += distance;
        if (isAtRight) {
          state.travelingRight = false;
          switchDirection = true;
        }
      } else {
        state.x -= distance;
        if (isAtLeft) {
          state.travelingRight = true;
          switchDirection = true;
        }
      }
    } else {
      if (state.travelingDown) {
        state.y += distance;
        if (isAtBottom) {
          state.travelingDown = false;
          switchDirection = true;
        }
      } else {
        state.y -= distance;
        if (isAtTop) {
          state.travelingDown = true;
          switchDirection = true;
        }
      }
    }

    if (switchDirection) {
      state.direction = state.direction === 'horizontal' ? 'vertical' : 'horizontal';
    }

    const maxX = (state.bounds.width - symbolWidth) / 2;
    const maxY = (state.bounds.height - symbolHeight) / 2;
    state.x = Math.max(-maxX, Math.min(maxX, state.x));
    state.y = Math.max(-maxY, Math.min(maxY, state.y));

    document.documentElement.style.setProperty('--translateX', `${state.x}px`);
    document.documentElement.style.setProperty('--translateY', `${state.y}px`);

    state.lastTime = currentTime;
    animationRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    if (!loading) return;

    updateBounds();
    
    const handleResize = () => {
      updateBounds();
    };
    
    window.addEventListener('resize', handleResize);
    
    document.documentElement.style.setProperty('--translateX', '0px');
    document.documentElement.style.setProperty('--translateY', '0px');
    
    stateRef.current.lastTime = performance.now();
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      document.documentElement.style.setProperty('--translateX', '0px');
      document.documentElement.style.setProperty('--translateY', '0px');
    };
  }, [loading, animate, updateBounds]);

  if (!loading) return null;

  return (
    <div className="infinity-loader-container">
      <svg
        ref={symbolRef}
        className="infinity-symbol"
        width="100%"
        height="100%"
        viewBox="0 0 1114 498"
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          fillRule: 'evenodd',
          clipRule: 'evenodd',
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          strokeMiterlimit: 1.5,
        }}
      >
        <path
          d="M556.639,248.609c53.406,53.406 101.683,111.534 164.527,155.683c32.351,22.727 69.175,43.083 109.585,49.008c28.958,4.245 59.488,0.613 87.317,-7.576c26.905,-7.918 52.087,-20.892 73.811,-37.871c21.56,-16.851 39.677,-37.626 53.018,-60.895c10.19,-17.771 17.616,-36.957 21.888,-56.774c4.437,-20.585 5.532,-41.765 3.304,-62.666c-8.654,-81.211 -69.752,-151.815 -152.021,-176.024c-21.015,-6.185 -42.784,-9.169 -64.773,-9.286c-20.432,-0.109 -41.041,2.144 -60.735,7.389c-60.474,16.105 -104.752,61.37 -145.625,103.912c-25.822,26.876 -51.28,54.064 -76.924,81.093c-50.066,52.771 -98.707,107.45 -153.977,155.565c-26.704,23.247 -58.379,43.63 -92.848,54.868c-68.352,22.285 -146.537,6.002 -201.788,-37.182c-21.56,-16.851 -39.676,-37.626 -53.018,-60.895c-10.19,-17.771 -17.616,-36.957 -21.887,-56.774c-20.542,-95.293 34.073,-193.859 128.699,-231.746c26.53,-10.622 55.918,-16.645 84.79,-16.23c66.027,0.948 126.189,41.423 172.681,82.451c12.721,11.225 25.299,22.604 37.509,34.327c11.528,11.07 22.61,22.551 33.684,34.029c17.75,18.398 34.689,37.5 52.783,55.594Z"
          style={{ fill: 'none', strokeWidth: '84.38px' }}
        />
      </svg>
      <div className="infinity-crt"></div>
    </div>
  );
}