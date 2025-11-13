import { useEffect, useRef, useState } from 'react';

export const VirtualJoystick = ({ onMove, onSprint, onJump, size = 120, style }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [knobPosition, setKnobPosition] = useState({ x: 0, y: 0 });
  const [isSprinting, setIsSprinting] = useState(false);
  const [isJumping, setIsJumping] = useState(false);
  const joystickRef = useRef(null);
  const activePointers = useRef(new Map());
  const centerPos = useRef({ x: 0, y: 0 });
  const lastOutput = useRef({ x: 0, y: 0 });
  
  const knobSize = size * 0.4;
  const maxDistance = size * 0.35;
  const sprintThreshold = maxDistance * 0.75; // Sprint when joystick is 75% extended
  const centerButtonSize = size * 0.25; // Center jump button size

  const updateCenterPosition = () => {
    if (joystickRef.current) {
      const rect = joystickRef.current.getBoundingClientRect();
      centerPos.current = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      };
    }
  };

  useEffect(() => {
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

    // Check if we should trigger sprint
    const shouldSprint = distance >= sprintThreshold;
    if (shouldSprint !== isSprinting) {
      setIsSprinting(shouldSprint);
      if (onSprint) {
        onSprint(shouldSprint);
      }
    }

    return { x, y, normalizedX: x / maxDistance, normalizedY: y / maxDistance };
  };

  const handleStart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Update center position on every start to handle dynamic positioning
    updateCenterPosition();
    
    // Don't check for center button here - allow dragging from anywhere
    // The jump button will handle its own events independently
    
    let pointerId, clientX, clientY;
    
    if (e.touches) {
      // Touch event - only track if we're not already dragging
      if (activePointers.current.size > 0) return;
      
      const touch = e.touches[0];
      pointerId = touch.identifier;
      clientX = touch.clientX;
      clientY = touch.clientY;
      activePointers.current.set(pointerId, { clientX, clientY });
    } else if (e.pointerType !== undefined) {
      // Pointer event (handles both mouse and touch on touch-enabled laptops)
      if (activePointers.current.size > 0) return;
      
      pointerId = e.pointerId;
      clientX = e.clientX;
      clientY = e.clientY;
      activePointers.current.set(pointerId, { clientX, clientY });
    } else {
      // Regular mouse event
      if (activePointers.current.size > 0) return;
      
      pointerId = 'mouse';
      clientX = e.clientX;
      clientY = e.clientY;
      activePointers.current.set(pointerId, { clientX, clientY });
    }
    
    const { x, y, normalizedX, normalizedY } = calculatePosition(clientX, clientY);
    setKnobPosition({ x, y });
    setIsDragging(true);
    
    const output = { x: normalizedX, z: -normalizedY };
    lastOutput.current = output;
    onMove(output);
  };
  
  const handleJumpStart = (e) => {
    e.stopPropagation(); // Don't prevent default to allow multi-touch
    setIsJumping(true);
    if (onJump) {
      onJump(true);
    }
  };
  
  const handleJumpEnd = (e) => {
    e.stopPropagation();
    setIsJumping(false);
    if (onJump) {
      onJump(false);
    }
  };

  const handleMove = (e) => {
    if (!isDragging || activePointers.current.size === 0) return;
    
    e.preventDefault();
    e.stopPropagation();

    let clientX, clientY;
    let found = false;
    
    if (e.touches) {
      // Find the correct touch
      for (const touch of e.touches) {
        if (activePointers.current.has(touch.identifier)) {
          clientX = touch.clientX;
          clientY = touch.clientY;
          found = true;
          break;
        }
      }
    } else if (e.pointerType !== undefined) {
      // Pointer event
      if (activePointers.current.has(e.pointerId)) {
        clientX = e.clientX;
        clientY = e.clientY;
        found = true;
      }
    } else {
      // Regular mouse event
      if (activePointers.current.has('mouse')) {
        clientX = e.clientX;
        clientY = e.clientY;
        found = true;
      }
    }
    
    if (!found) return;

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

    let shouldEnd = false;
    
    // Check if this is the correct touch/pointer ending
    if (e.changedTouches) {
      for (const touch of e.changedTouches) {
        if (activePointers.current.has(touch.identifier)) {
          activePointers.current.delete(touch.identifier);
          shouldEnd = true;
        }
      }
    } else if (e.pointerType !== undefined) {
      if (activePointers.current.has(e.pointerId)) {
        activePointers.current.delete(e.pointerId);
        shouldEnd = true;
      }
    } else {
      // Regular mouse event
      if (activePointers.current.has('mouse')) {
        activePointers.current.delete('mouse');
        shouldEnd = true;
      }
    }
    
    if (!shouldEnd) return;

    setIsDragging(false);
    setKnobPosition({ x: 0, y: 0 });
    lastOutput.current = { x: 0, y: 0 };
    onMove({ x: 0, z: 0 });
    
    // Reset sprint state
    if (isSprinting) {
      setIsSprinting(false);
      if (onSprint) {
        onSprint(false);
      }
    }
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
      
      // Pointer events (handles both mouse and touch)
      document.addEventListener('pointermove', handleGlobalMove, { passive: false });
      document.addEventListener('pointerup', handleGlobalEnd, { passive: false });
      document.addEventListener('pointercancel', handleGlobalEnd, { passive: false });
    }

    return () => {
      document.removeEventListener('touchmove', handleGlobalMove);
      document.removeEventListener('touchend', handleGlobalEnd);
      document.removeEventListener('touchcancel', handleGlobalEnd);
      document.removeEventListener('pointermove', handleGlobalMove);
      document.removeEventListener('pointerup', handleGlobalEnd);
      document.removeEventListener('pointercancel', handleGlobalEnd);
    };
  }, [isDragging]);

  return (
    <div
      ref={joystickRef}
      className="virtual-joystick"
      onTouchStart={handleStart}
      onPointerDown={handleStart}
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
      
      {/* Sprint zone indicator */}
      <div
        className="sprint-zone"
        style={{
          position: 'absolute',
          width: `${(sprintThreshold / maxDistance) * 100}%`,
          height: `${(sprintThreshold / maxDistance) * 100}%`,
          borderRadius: '50%',
          border: '1px dashed rgba(255, 140, 0, 0.3)',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
        }}
      />
      
      {/* Center Jump Button */}
      <button
        className="jump-button"
        onTouchStart={handleJumpStart}
        onTouchEnd={handleJumpEnd}
        onTouchCancel={handleJumpEnd}
        onMouseDown={handleJumpStart}
        onMouseUp={handleJumpEnd}
        onMouseLeave={handleJumpEnd}
        style={{
          position: 'absolute',
          width: `${centerButtonSize}px`,
          height: `${centerButtonSize}px`,
          borderRadius: '50%',
          left: '50%',
          top: '50%',
          transform: `translate(-50%, -50%) ${isJumping ? 'scale(0.9)' : 'scale(1)'}`,
          background: isJumping
            ? `radial-gradient(circle at 40% 40%, 
                rgba(0, 255, 100, 0.8), 
                rgba(0, 150, 60, 0.9))`
            : `radial-gradient(circle at 40% 40%, 
                rgba(0, 255, 255, 0.4), 
                rgba(0, 100, 100, 0.7))`,
          border: isJumping 
            ? '2px solid rgba(0, 255, 100, 0.9)' 
            : '2px solid rgba(0, 255, 255, 0.6)',
          boxShadow: isJumping
            ? `0 0 20px rgba(0, 255, 100, 0.8),
               inset 0 0 10px rgba(0, 255, 100, 0.3)`
            : `0 0 15px rgba(0, 255, 255, 0.4),
               inset 0 0 5px rgba(0, 255, 255, 0.2)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '18px',
          fontWeight: 'bold',
          color: '#fff',
          cursor: 'pointer',
          transition: 'transform 0.1s ease',
          touchAction: 'manipulation',
          zIndex: 10,
          padding: 0,
          outline: 'none',
        }}
      >
        ⬆️
      </button>
      
      <div
        className="joystick-knob"
        style={{
          position: 'absolute',
          width: `${knobSize}px`,
          height: `${knobSize}px`,
          borderRadius: '50%',
          border: isSprinting ? '3px solid rgba(255, 140, 0, 0.9)' : '2px solid rgba(0, 255, 255, 0.8)',
          background: isSprinting 
            ? `radial-gradient(circle at 40% 40%, 
                rgba(255, 140, 0, 0.7), 
                rgba(255, 69, 0, 0.9))` 
            : `radial-gradient(circle at 40% 40%, 
                rgba(0, 255, 255, 0.6), 
                rgba(0, 100, 100, 0.9))`,
          boxShadow: isSprinting
            ? `0 0 25px rgba(255, 140, 0, 0.8),
               inset -2px -2px 5px rgba(0, 0, 0, 0.5)`
            : `0 0 15px rgba(0, 255, 255, 0.6),
               inset -2px -2px 5px rgba(0, 0, 0, 0.5)`,
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