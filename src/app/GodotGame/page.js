'use client';

import PerformanceMonitor from '@/components/PerformanceMonitor';

export default function GodotGamePage() {
  return (
    <div style={{ width: '100vw', height: '100vh', margin: 0, padding: 0, overflow: 'hidden', position: 'relative' }}>
      <PerformanceMonitor />
      <div 
  style={{
    width: '100%',
    height: '100%',
    touchAction: 'none',
    WebkitTouchCallout: 'none'
  }}
  onTouchStart={(e) => e.preventDefault()}
>
      <iframe
  allow="autoplay; fullscreen *; geolocation; microphone; camera; midi; monetization; xr-spatial-tracking; gamepad; gyroscope; accelerometer; xr"
  scrolling="no"
  src="/GodotGame/November Starter Kit 3D Platformer.html"
  style={{
    width: '100%',
    height: '100%',
    border: 'none',
    display: 'block',
    touchAction: 'none',
    WebkitTouchCallout: 'none',
    WebkitUserSelect: 'none',
    userSelect: 'none'
  }}
  title="Godot Game"
  allowFullScreen
  // Add this for iOS
  sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-modals allow-pointer-lock"
/>
</div>
    </div>
  );
}