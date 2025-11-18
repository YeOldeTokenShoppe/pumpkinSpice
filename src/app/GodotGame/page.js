'use client';

import PerformanceMonitor from '@/components/PerformanceMonitor';

export default function GodotGamePage() {
  return (
    <div style={{ width: '100vw', height: '100vh', margin: 0, padding: 0, overflow: 'hidden', position: 'relative' }}>
      <PerformanceMonitor />
      <iframe
        src="/GodotGame/November Starter Kit 3D Platformer.html"
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          display: 'block'
        }}
        title="Godot Game"
        allowFullScreen
      />
    </div>
  );
}