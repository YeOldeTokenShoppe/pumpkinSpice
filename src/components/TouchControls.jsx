import { useEffect, useState } from 'react';

export const TouchControls = ({ onAction, style }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [activeActions, setActiveActions] = useState({
    jump: false,
    light: false,
    sprint: false,
    zoom: false
  });

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768 || 'ontouchstart' in window);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle action buttons
  const handleActionStart = (action) => {
    setActiveActions(prev => ({ ...prev, [action]: true }));
    onAction(action, true);
  };

  const handleActionEnd = (action) => {
    setActiveActions(prev => ({ ...prev, [action]: false }));
    onAction(action, false);
  };

  // Special handler for combo actions (jump + light)
  const handleLightJump = () => {
    onAction('lightJump', true);
    
    // Visual feedback
    setActiveActions(prev => ({ 
      ...prev, 
      jump: true, 
      light: true 
    }));
    
    setTimeout(() => {
      setActiveActions(prev => ({ 
        ...prev, 
        jump: false, 
        light: false 
      }));
    }, 300);
  };

  if (!isMobile) return null;

  return (
    <div className="touch-controls" style={style}>
      {/* Action Buttons - Right Side */}
      <div className="action-buttons">
        
        {/* Primary Action - Light + Jump Combo */}
        <div className="primary-action">
          <button
            className={`action-btn light-jump-btn ${activeActions.jump || activeActions.light ? 'active' : ''}`}
            onTouchStart={() => handleLightJump()}
            onMouseDown={() => handleLightJump()}
          >
            <div className="btn-icon">🕯️⚡</div>
            <div className="btn-label">Light</div>
          </button>
        </div>

        {/* Secondary Actions */}
        <div className="secondary-actions">
          <button
            className={`action-btn jump-btn ${activeActions.jump ? 'active' : ''}`}
            onTouchStart={() => handleActionStart('jump')}
            onTouchEnd={() => handleActionEnd('jump')}
            onMouseDown={() => handleActionStart('jump')}
            onMouseUp={() => handleActionEnd('jump')}
          >
            <div className="btn-icon">⬆️</div>
            <div className="btn-label">Jump</div>
          </button>
          
          <button
            className={`action-btn sprint-btn ${activeActions.sprint ? 'active' : ''}`}
            onTouchStart={() => handleActionStart('sprint')}
            onTouchEnd={() => handleActionEnd('sprint')}
            onMouseDown={() => handleActionStart('sprint')}
            onMouseUp={() => handleActionEnd('sprint')}
          >
            <div className="btn-icon">💨</div>
            <div className="btn-label">Sprint</div>
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

        .action-buttons {
          position: absolute;
          bottom: 60px;
          right: 40px;
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
            bottom: 60px;
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
            bottom: 40px;
            left: 30px;
          }
          
          .action-buttons {
            bottom: 30px;
            right: 30px;
          }
        }
      `}</style>
    </div>
  );
};