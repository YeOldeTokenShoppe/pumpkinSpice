import { useEffect, useState } from 'react';

const CustomCursor = ({ 
  primaryColor = "#c48901", 
  secondaryColor = "#53bc28", 
  accentColor = "#6958d5" 
}) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isClicking, setIsClicking] = useState(false);
  const [trails, setTrails] = useState([]);

  useEffect(() => {
    const updateMousePosition = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      
      // Add trail effect
      setTrails(prev => [
        ...prev.slice(-15), // Keep last 15 trails
        {
          x: e.clientX,
          y: e.clientY,
          id: Date.now() + Math.random(),
          timestamp: Date.now()
        }
      ]);
    };

    const handleMouseDown = () => setIsClicking(true);
    const handleMouseUp = () => setIsClicking(false);

    window.addEventListener('mousemove', updateMousePosition);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    // Clean up old trails
    const trailCleanup = setInterval(() => {
      setTrails(prev => prev.filter(trail => Date.now() - trail.timestamp < 1000));
    }, 100);

    return () => {
      window.removeEventListener('mousemove', updateMousePosition);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      clearInterval(trailCleanup);
    };
  }, []);

  return (
    <>
      {/* Hide default cursor */}
      <style jsx global>{`
        * {
          cursor: none !important;
        }
      `}</style>
      
      {/* Trail elements */}
      {trails.map((trail, index) => (
        <div
          key={trail.id}
          style={{
            position: 'fixed',
            left: trail.x - 3,
            top: trail.y - 3,
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: `linear-gradient(45deg, ${primaryColor}, ${secondaryColor})`,
            opacity: Math.max(0, (index / trails.length) * 0.7),
            pointerEvents: 'none',
            zIndex: 9999,
            transform: `scale(${0.3 + (index / trails.length) * 0.7})`,
            transition: 'all 0.1s ease-out',
            boxShadow: `0 0 ${4 + index}px ${primaryColor}40`
          }}
        />
      ))}
      
      {/* Main cursor */}
      <div
        style={{
          position: 'fixed',
          left: mousePosition.x - 12,
          top: mousePosition.y - 12,
          width: '24px',
          height: '24px',
          border: `2px solid ${primaryColor}`,
          borderRadius: '50%',
          pointerEvents: 'none',
          zIndex: 10000,
          transform: `scale(${isClicking ? 0.8 : 1})`,
          transition: 'transform 0.1s ease',
          background: `radial-gradient(circle, ${primaryColor}20, transparent 70%)`,
          boxShadow: `
            0 0 20px ${primaryColor}60,
            inset 0 0 10px ${secondaryColor}40
          `
        }}
      />
      
      {/* Center dot */}
      <div
        style={{
          position: 'fixed',
          left: mousePosition.x - 2,
          top: mousePosition.y - 2,
          width: '4px',
          height: '4px',
          borderRadius: '50%',
          background: primaryColor,
          pointerEvents: 'none',
          zIndex: 10001,
          transform: `scale(${isClicking ? 1.5 : 1})`,
          transition: 'transform 0.1s ease',
          boxShadow: `0 0 10px ${primaryColor}`
        }}
      />
    </>
  );
};

export default CustomCursor;