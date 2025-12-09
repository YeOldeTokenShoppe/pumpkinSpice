'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function TestScreen() {
  const searchParams = useSearchParams();
  const isMobile = searchParams.get('mobile') === 'true';
  const [currentPage, setCurrentPage] = useState('/carousel-screen');
  const [memoryInfo, setMemoryInfo] = useState('Checking...');
  
  const testPages = [
    { url: '/carousel-screen', label: 'Feature Carousel' },
    { url: '/drone-screen.html', label: 'Drone Navigation' },
    { url: '/mini-scene.html', label: '3D Scene' },
    { url: '/dashboard.html', label: 'Dashboard' },
    { url: '/fountain', label: 'Fountain (Heavy)' },
    { url: '/model-viewer', label: 'Model Viewer' },
  ];

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: '#000',
    }}>
      {isMobile && (
        <div style={{
          padding: '5px',
          background: '#00ff41',
          color: '#000',
          textAlign: 'center',
          fontSize: '10px',
          fontFamily: 'monospace',
          fontWeight: 'bold'
        }}>
          MOBILE VIEW
        </div>
      )}
      {/* Controls */}
      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        gap: '10px',
        padding: '10px',
        background: 'rgba(0, 255, 65, 0.1)',
        borderBottom: '2px solid #00ff41',
        flexWrap: isMobile ? 'nowrap' : 'wrap',
      }}>
        {testPages.map(page => (
          <button
            key={page.url}
            onClick={() => setCurrentPage(page.url)}
            style={{
              padding: '8px 16px',
              background: currentPage === page.url ? '#00ff41' : 'transparent',
              color: currentPage === page.url ? '#000' : '#00ff41',
              border: '1px solid #00ff41',
              borderRadius: '4px',
              cursor: 'pointer',
              fontFamily: 'monospace',
              fontSize: '12px',
              transition: 'all 0.3s',
            }}
          >
            {page.label}
          </button>
        ))}
        
        <div style={{
          marginLeft: isMobile ? '0' : 'auto',
          marginTop: isMobile ? 'auto' : '0',
          color: '#ffd700',
          fontFamily: 'monospace',
          fontSize: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          justifyContent: isMobile ? 'center' : 'flex-start'
        }}>
          Memory: <span id="memoryInfo">Checking...</span>
        </div>
      </div>
      
      {/* Iframe */}
      <iframe
        key={currentPage}
        src={currentPage}
        style={{
          width: '100%',
          flex: 1,
          border: 'none',
          background: '#000',
        }}
        title="Test Content"
      />
      
      <script dangerouslySetInnerHTML={{ __html: `
        // Monitor memory if available
        if (performance.memory) {
          setInterval(() => {
            const mem = performance.memory;
            const used = (mem.usedJSHeapSize / 1048576).toFixed(1);
            const total = (mem.jsHeapSizeLimit / 1048576).toFixed(1);
            const percent = ((mem.usedJSHeapSize / mem.jsHeapSizeLimit) * 100).toFixed(1);
            
            const el = document.getElementById('memoryInfo');
            if (el) {
              el.textContent = used + 'MB / ' + total + 'MB (' + percent + '%)';
              el.style.color = percent > 80 ? '#ff4444' : percent > 60 ? '#ffaa00' : '#00ff41';
            }
          }, 1000);
        }
      `}} />
    </div>
  );
}