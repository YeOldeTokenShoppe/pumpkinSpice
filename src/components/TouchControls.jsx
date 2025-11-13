import { useEffect, useState, useRef } from 'react';
import { VirtualJoystick } from './VirtualJoystick';

export const TouchControls = ({ onAction, style }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [activeActions, setActiveActions] = useState({
    jump: false,
    light: false,
    sprint: false,
    zoom: false,
    lookUp: false
  });
  const joystickActive = useRef(false);

  useEffect(() => {
    const checkMobile = () => {
      const width = window.innerWidth;
      const hasTouch = 'ontouchstart' in window || 
                      navigator.maxTouchPoints > 0 ||
                      navigator.msMaxTouchPoints > 0;
      
      // Better iPad Pro detection
      const isIPad = navigator.userAgent.match(/iPad/i) || 
                    (navigator.userAgentData?.platform === 'macOS' && navigator.maxTouchPoints > 1) ||
                    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      
      // Detect if it's a tablet (wider than phone but still touch)
      // iPad Pro can be up to 1366px wide
      const isTabletDevice = (width > 600 && hasTouch) || isIPad;
      const isMobileDevice = width <= 768 || hasTouch || isIPad;
      
      setIsTablet(isTabletDevice);
      setIsMobile(isMobileDevice);
      
      console.log('Device detection:', { 
        width, 
        isTablet: isTabletDevice, 
        isMobile: isMobileDevice,
        isIPad,
        hasTouch,
        maxTouchPoints: navigator.maxTouchPoints
      });
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Special handler for light action only
  const handleLightAction = () => {
    onAction('light', true);
    
    // Visual feedback for light only
    setActiveActions(prev => ({ 
      ...prev, 
      light: true 
    }));
    
    // Immediate release like L-key to prevent movement interference
    setTimeout(() => {
      setActiveActions(prev => ({ 
        ...prev, 
        light: false 
      }));
      onAction('light', false);
    }, 100); // Very brief press like keyboard
  };

  // Handle joystick movement
  const handleJoystickMove = (movement) => {
    joystickActive.current = movement.x !== 0 || movement.z !== 0;
    onAction('movement', movement);
    onAction('joystickActive', joystickActive.current);
  };
  
  // Handle joystick sprint
  const handleJoystickSprint = (sprinting) => {
    onAction('sprint', sprinting);
    setActiveActions(prev => ({ ...prev, sprint: sprinting }));
  };
  
  // Handle joystick jump
  const handleJoystickJump = (jumping) => {
    onAction('jump', jumping);
    setActiveActions(prev => ({ ...prev, jump: jumping }));
  };
  
  // Handle zoom action
  const handleZoomAction = (active) => {
    onAction('zoom', active);
    setActiveActions(prev => ({ ...prev, zoom: active }));
  };
  
  // Handle look up action
  const handleLookUpAction = (active) => {
    onAction('lookUp', active);
    setActiveActions(prev => ({ ...prev, lookUp: active }));
  };

  if (!isMobile) return null;

  return (
    <div className="touch-controls" style={style}>
      {/* Virtual Joystick - Left Side */}
      <div className="joystick-container">
        <VirtualJoystick 
          onMove={handleJoystickMove}
          onSprint={handleJoystickSprint}
          onJump={handleJoystickJump}
          size={180}
        />
      </div>

      {/* Action Buttons - Right Side */}
      <div className="action-buttons">
        
        {/* Primary Action - Light + Jump Combo */}
        <div className="primary-action">
          <button
            className={`action-btn light-jump-btn ${activeActions.jump || activeActions.light ? 'active' : ''}`}
            onTouchStart={() => handleLightAction()}
            onMouseDown={() => handleLightAction()}
          >
            <div className="btn-icon">🕯️⚡</div>
            <div className="btn-label">Light</div>
          </button>
        </div>

        {/* Secondary Actions */}
        <div className="secondary-actions">
          <button
            className={`action-btn zoom-btn ${activeActions.zoom ? 'active' : ''}`}
            onTouchStart={() => handleZoomAction(true)}
            onTouchEnd={() => handleZoomAction(false)}
            onMouseDown={() => handleZoomAction(true)}
            onMouseUp={() => handleZoomAction(false)}
          >
            <div className="btn-icon">🔍</div>
            <div className="btn-label">Zoom</div>
          </button>
          
          <button
            className={`action-btn look-btn ${activeActions.lookUp ? 'active' : ''}`}
            onTouchStart={() => handleLookUpAction(true)}
            onTouchEnd={() => handleLookUpAction(false)}
            onMouseDown={() => handleLookUpAction(true)}
            onMouseUp={() => handleLookUpAction(false)}
          >
            <div className="btn-icon">👁️</div>
            <div className="btn-label">Look Up</div>
          </button>
        </div>
      </div>

      <style jsx>{`
        .touch-controls {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
          z-index: 100;
          font-family: 'Orbitron', 'Courier New', monospace;
        }

        .joystick-container {
          position: absolute;
          bottom: 60px;
          left: ${isTablet ? '45%' : '40px'};
          pointer-events: auto;
          display: flex;
          align-items: flex-end;
          height: 180px;
        }

        .action-buttons {
          position: absolute;
          bottom: 60px;
          right: ${isTablet ? '20%' : '40px'};
          pointer-events: auto;
          display: flex;
          flex-direction: column;
          gap: 20px;
          align-items: flex-end;
        }

        .primary-action {
          display: flex;
          justify-content: center;
        }

        .secondary-actions {
          display: flex;
          gap: 15px;
        }

        .action-btn {
          width: 80px;
          height: 80px;
          border: 2px solid rgba(0, 255, 255, 0.6);
          border-radius: 50%;
          background: linear-gradient(135deg, 
            rgba(0, 0, 0, 0.9),
            rgba(10, 25, 15, 0.8));
          backdrop-filter: blur(15px);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          touch-action: none;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 
            0 4px 20px rgba(0, 255, 255, 0.2),
            inset 0 1px 0 rgba(0, 255, 255, 0.1);
        }

        .light-jump-btn {
          width: 100px;
          height: 100px;
          border-color: rgba(255, 215, 0, 0.8);
          background: linear-gradient(135deg, 
            rgba(255, 215, 0, 0.2),
            rgba(255, 140, 0, 0.1));
          box-shadow: 
            0 6px 25px rgba(255, 215, 0, 0.4),
            inset 0 1px 0 rgba(255, 215, 0, 0.2);
        }

        .action-btn:active,
        .action-btn.active {
          transform: scale(0.95);
          box-shadow: 
            0 2px 10px rgba(0, 255, 255, 0.4),
            inset 0 2px 5px rgba(0, 0, 0, 0.3);
        }

        .light-jump-btn:active,
        .light-jump-btn.active {
          box-shadow: 
            0 4px 15px rgba(255, 215, 0, 0.6),
            inset 0 2px 5px rgba(0, 0, 0, 0.3);
        }

        .btn-icon {
          font-size: 24px;
          filter: drop-shadow(0 0 8px currentColor);
        }

        .light-jump-btn .btn-icon {
          font-size: 28px;
        }

        .btn-label {
          font-size: 10px;
          font-weight: bold;
          color: #00ffff;
          text-shadow: 0 0 8px rgba(0, 255, 255, 0.8);
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .light-jump-btn .btn-label {
          color: #ffd700;
          text-shadow: 0 0 8px rgba(255, 215, 0, 0.8);
        }

        /* Responsive adjustments */
        @media (max-width: 480px) {
          .joystick-container {
            bottom: 40px;
            left: 20px;
          }
          
          .action-buttons {
            bottom: 40px;
            right: 20px;
          }
          
          .virtual-joystick {
            width: 100px;
            height: 100px;
          }
          
          .action-btn {
            width: 70px;
            height: 70px;
          }
          
          .light-jump-btn {
            width: 85px;
            height: 85px;
          }
        }

        /* Landscape mode adjustments */
        @media (orientation: landscape) and (max-height: 600px) {
          .joystick-container {
            bottom: 30px;
            left: ${isTablet ? '20%' : '30px'};
          }
          
          .action-buttons {
            bottom: 30px;
            right: ${isTablet ? '20%' : '30px'};
          }
        }
        
      `}</style>
    </div>
  );
};