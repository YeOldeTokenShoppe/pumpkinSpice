import { useEffect, useRef, useState } from 'react';

export const VirtualJoystick = ({ onMove, size = 120, style }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [knobPosition, setKnobPosition] = useState({ x: 0, y: 0 });
  const joystickRef = useRef(null);
  const touchId = useRef(null);
  const centerPos = useRef({ x: 0, y: 0 });
  const lastOutput = useRef({ x: 0, y: 0 });
  
  const knobSize = size * 0.4;
  const maxDistance = size * 0.35;

  useEffect(() => {
    const updateCenterPosition = () => {
      if (joystickRef.current) {
        const rect = joystickRef.current.getBoundingClientRect();
        centerPos.current = {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2
        };
      }
    };

    updateCenterPosition();
    window.addEventListener('resize', updateCenterPosition);
    window.addEventListener('scroll', updateCenterPosition);

    return () => {
      window.removeEventListener('resize', updateCenterPosition);
      window.removeEventListener('scroll', updateCenterPosition);
    };
  }, []);

  const calculatePosition = (clientX, clientY) => {
    const dx = clientX - centerPos.current.x;
    const dy = clientY - centerPos.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    let x = dx;
    let y = dy;

    if (distance > maxDistance) {
      const angle = Math.atan2(dy, dx);
      x = Math.cos(angle) * maxDistance;
      y = Math.sin(angle) * maxDistance;
    }

    return { x, y, normalizedX: x / maxDistance, normalizedY: y / maxDistance };
  };

  const handleStart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.touches) {
      // Touch event
      touchId.current = e.touches[0].identifier;
      const { x, y, normalizedX, normalizedY } = calculatePosition(
        e.touches[0].clientX,
        e.touches[0].clientY
      );
      setKnobPosition({ x, y });
      setIsDragging(true);
      
      const output = { x: normalizedX, z: -normalizedY };
      lastOutput.current = output;
      onMove(output);
    } else {
      // Mouse event (for testing)
      const { x, y, normalizedX, normalizedY } = calculatePosition(e.clientX, e.clientY);
      setKnobPosition({ x, y });
      setIsDragging(true);
      
      const output = { x: normalizedX, z: -normalizedY };
      lastOutput.current = output;
      onMove(output);
    }
  };

  const handleMove = (e) => {
    if (!isDragging) return;
    
    e.preventDefault();
    e.stopPropagation();

    let clientX, clientY;
    
    if (e.touches) {
      // Find the correct touch
      const touch = Array.from(e.touches).find(t => t.identifier === touchId.current);
      if (!touch) return;
      clientX = touch.clientX;
      clientY = touch.clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const { x, y, normalizedX, normalizedY } = calculatePosition(clientX, clientY);
    setKnobPosition({ x, y });
    
    const output = { x: normalizedX, z: -normalizedY };
    lastOutput.current = output;
    onMove(output);
  };

  const handleEnd = (e) => {
    if (!isDragging) return;
    
    e.preventDefault();
    e.stopPropagation();

    // Check if this is the correct touch ending
    if (e.changedTouches) {
      const touch = Array.from(e.changedTouches).find(t => t.identifier === touchId.current);
      if (!touch) return;
    }

    setIsDragging(false);
    setKnobPosition({ x: 0, y: 0 });
    touchId.current = null;
    lastOutput.current = { x: 0, y: 0 };
    onMove({ x: 0, z: 0 });
  };

  useEffect(() => {
    // Global move and end handlers
    const handleGlobalMove = (e) => {
      if (isDragging) {
        handleMove(e);
      }
    };

    const handleGlobalEnd = (e) => {
      if (isDragging) {
        handleEnd(e);
      }
    };

    if (isDragging) {
      // Touch events
      document.addEventListener('touchmove', handleGlobalMove, { passive: false });
      document.addEventListener('touchend', handleGlobalEnd, { passive: false });
      document.addEventListener('touchcancel', handleGlobalEnd, { passive: false });
      
      // Mouse events (for testing)
      document.addEventListener('mousemove', handleGlobalMove);
      document.addEventListener('mouseup', handleGlobalEnd);
    }

    return () => {
      document.removeEventListener('touchmove', handleGlobalMove);
      document.removeEventListener('touchend', handleGlobalEnd);
      document.removeEventListener('touchcancel', handleGlobalEnd);
      document.removeEventListener('mousemove', handleGlobalMove);
      document.removeEventListener('mouseup', handleGlobalEnd);
    };
  }, [isDragging]);

  return (
    <div
      ref={joystickRef}
      className="virtual-joystick"
      onTouchStart={handleStart}
      onMouseDown={handleStart}
      style={{
        position: 'absolute',
        width: `${size}px`,
        height: `${size}px`,
        ...style
      }}
    >
      <div
        className="joystick-base"
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          border: '3px solid rgba(0, 255, 255, 0.6)',
          background: `radial-gradient(circle at 30% 30%, 
            rgba(0, 255, 255, 0.1), 
            rgba(0, 50, 50, 0.8))`,
          boxShadow: `
            inset 0 0 20px rgba(0, 255, 255, 0.2),
            0 0 30px rgba(0, 255, 255, 0.3)
          `,
        }}
      />
      
      <div
        className="joystick-knob"
        style={{
          position: 'absolute',
          width: `${knobSize}px`,
          height: `${knobSize}px`,
          borderRadius: '50%',
          border: '2px solid rgba(0, 255, 255, 0.8)',
          background: `radial-gradient(circle at 40% 40%, 
            rgba(0, 255, 255, 0.6), 
            rgba(0, 100, 100, 0.9))`,
          boxShadow: `
            0 0 15px rgba(0, 255, 255, 0.6),
            inset -2px -2px 5px rgba(0, 0, 0, 0.5)
          `,
          left: '50%',
          top: '50%',
          transform: `translate(calc(-50% + ${knobPosition.x}px), calc(-50% + ${knobPosition.y}px))`,
          transition: isDragging ? 'none' : 'transform 0.2s ease-out',
          cursor: 'grab',
          touchAction: 'none',
        }}
      />
      
      {isDragging && (
        <div
          className="joystick-glow"
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            border: '1px solid rgba(0, 255, 255, 0.8)',
            boxShadow: '0 0 40px rgba(0, 255, 255, 0.8)',
            pointerEvents: 'none',
            animation: 'pulse 0.5s infinite',
          }}
        />
      )}

      <style jsx>{`
        @keyframes pulse {
          0% {
            opacity: 0.6;
            transform: scale(1);
          }
          50% {
            opacity: 0.3;
            transform: scale(1.05);
          }
          100% {
            opacity: 0.6;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
};