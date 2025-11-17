import { useEffect, useState } from 'react';
import { VirtualJoystick } from './VirtualJoystick';

export const SimpleTouchControls = ({ onAction, style, visible = true, forceShow = false }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [activeActions, setActiveActions] = useState({
    jump: false,
    sprint: false,
  });

  useEffect(() => {
    const checkMobile = () => {
      const hasTouch = 'ontouchstart' in window || 
                      navigator.maxTouchPoints > 0 ||
                      navigator.msMaxTouchPoints > 0;
      
      const width = window.innerWidth;
      // Only consider it mobile if it has touch AND is not a desktop with touch screen
      // Check for actual mobile/tablet by looking at user agent or screen size
      const isActualMobile = hasTouch && (width <= 1024 || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
      
      setIsMobile(isActualMobile);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Cleanup effect - reset all controls when component unmounts or becomes invisible
  useEffect(() => {
    return () => {
      // Reset all actions when component unmounts
      onAction('movement', { x: 0, z: 0 });
      onAction('jump', false);
      onAction('sprint', false);
      onAction('joystickActive', false);
    };
  }, []);
  
  // Reset controls when visibility changes
  useEffect(() => {
    if (!visible) {
      onAction('movement', { x: 0, z: 0 });
      onAction('jump', false);
      onAction('sprint', false);
      onAction('joystickActive', false);
      setActiveActions({ jump: false, sprint: false });
    }
  }, [visible]);

  // Handle joystick movement
  const handleJoystickMove = (movement) => {
    onAction('movement', movement);
    onAction('joystickActive', movement.x !== 0 || movement.z !== 0);
  };
  
  // Handle joystick sprint
  const handleJoystickSprint = (sprinting) => {
    onAction('sprint', sprinting);
    setActiveActions(prev => ({ ...prev, sprint: sprinting }));
  };
  
  // Handle joystick jump with proper state cleanup
  const handleJoystickJump = (jumping) => {
    console.log('Jump action:', jumping);
    onAction('jump', jumping);
    setActiveActions(prev => ({ ...prev, jump: jumping }));
    
    // Force cleanup after a short delay to prevent stuck state
    if (jumping) {
      setTimeout(() => {
        onAction('jump', false);
        setActiveActions(prev => ({ ...prev, jump: false }));
      }, 100);
    }
  };

  // Don't render if not visible, or if not on mobile (unless forced to show)
  if (!visible || (!isMobile && !forceShow)) {
    return null;
  }

  return (
    <div className="touch-controls" style={style} onContextMenu={(e) => e.preventDefault()}>
      {/* Virtual Joystick - Only show on actual mobile/tablet devices */}
      {isMobile && (
        <div className="joystick-container" onContextMenu={(e) => e.preventDefault()}>
          <VirtualJoystick 
            onMove={handleJoystickMove}
            onSprint={handleJoystickSprint}
            onJump={handleJoystickJump}
            size={160}
          />
        </div>
      )}

      {/* Jump Button - Always visible when controls are shown */}
      <div className="action-buttons" onContextMenu={(e) => e.preventDefault()}>
        <button
          className={`action-btn jump-btn ${activeActions.jump ? 'active' : ''}`}
          onContextMenu={(e) => e.preventDefault()}
          onTouchStart={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleJoystickJump(true);
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleJoystickJump(false);
          }}
          onTouchCancel={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleJoystickJump(false);
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleJoystickJump(true);
          }}
          onMouseUp={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleJoystickJump(false);
          }}
          onMouseLeave={(e) => {
            e.preventDefault();
            handleJoystickJump(false);
          }}
        >
          <div className="btn-icon">⬆️</div>
          <div className="btn-label">Jump</div>
        </button>
      </div>

      <style jsx>{`
        .touch-controls {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
          z-index: 90;
        }

        .joystick-container {
          position: absolute;
          bottom: 40px;
          right: ${isMobile ? '40px' : '40px'}; /* Joystick on right for mobile */
          pointer-events: auto;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 160px;
          width: 160px;
        }

        .action-buttons {
          position: absolute;
          bottom: 60px;
          left: ${isMobile ? '40px' : '50%'}; /* Jump on left for mobile, center for desktop */
          transform: ${isMobile ? 'none' : 'translateX(-50%)'};
          pointer-events: auto;
        }

        .action-btn {
          width: 80px;
          height: 80px;
          border: 2px solid rgba(0, 255, 255, 0.6);
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(10px);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          touch-action: none;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .action-btn:active,
        .action-btn.active {
          transform: scale(0.95);
          background: rgba(0, 255, 255, 0.2);
          border-color: rgba(0, 255, 255, 1);
        }

        .btn-icon {
          font-size: 28px;
        }

        .btn-label {
          font-size: 12px;
          font-weight: bold;
          color: #00ffff;
          text-transform: uppercase;
        }

        /* Landscape mode adjustments */
        @media (orientation: landscape) and (max-height: 600px) {
          .joystick-container {
            bottom: 20px;
            right: 30px; /* Keep on right for mobile */
            width: 140px;
            height: 140px;
          }
          
          .action-buttons {
            bottom: 30px;
            left: ${isMobile ? '30px' : '50%'};
            transform: ${isMobile ? 'none' : 'translateX(-50%)'};
          }
          
          .action-btn {
            width: 70px;
            height: 70px;
          }
        }

        /* Small mobile adjustments */
        @media (max-width: 480px) {
          .joystick-container {
            width: 140px;
            height: 140px;
            bottom: 30px;
            right: 20px; /* Right side for mobile */
          }
          
          .action-buttons {
            left: 20px; /* Left side for mobile */
            bottom: 50px;
            transform: none;
          }
          
          .action-btn {
            width: 70px;
            height: 70px;
          }
          
          .btn-icon {
            font-size: 24px;
          }
          
          .btn-label {
            font-size: 10px;
          }
        }
      `}</style>
    </div>
  );
};