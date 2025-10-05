"use client";

import { useEffect, useState } from 'react';

export default function ScrollDebug() {
  const [scrollInfo, setScrollInfo] = useState({ current: 0, max: 0, windowHeight: 0 });
  
  useEffect(() => {
    const updateScroll = () => {
      setScrollInfo({
        current: Math.round(window.scrollY),
        max: document.documentElement.scrollHeight - window.innerHeight,
        windowHeight: window.innerHeight
      });
    };
    
    updateScroll();
    window.addEventListener('scroll', updateScroll);
    window.addEventListener('resize', updateScroll);
    
    return () => {
      window.removeEventListener('scroll', updateScroll);
      window.removeEventListener('resize', updateScroll);
    };
  }, []);
  
  const percentage = scrollInfo.max > 0 
    ? Math.round((scrollInfo.current / scrollInfo.max) * 100) 
    : 0;
  
  return (
    <div style={{
      position: 'fixed',
      top: 10,
      left: 10,
      background: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      zIndex: 100000,
      fontFamily: 'monospace',
      fontSize: '14px'
    }}>
      <div>Scroll: {scrollInfo.current}px</div>
      <div>Progress: {percentage}%</div>
      <div>Total: {scrollInfo.max + scrollInfo.windowHeight}px</div>
    </div>
  );
}