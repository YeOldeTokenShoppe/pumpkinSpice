import { useGameStore } from "../../src/lib/gameStore";
import { GameState } from "../lib/GameState";
import { useSnapshot } from "valtio";
import { useEffect, useState, useRef } from "react";

// Particle system for visual effects
const ParticleEffect = ({ trigger, color = "#fbbf24" }) => {
  const [particles, setParticles] = useState([]);
  
  useEffect(() => {
    if (trigger) {
      const newParticles = Array.from({ length: 8 }, (_, i) => ({
        id: Date.now() + i,
        angle: (i * 45) * Math.PI / 180,
        scale: Math.random() * 0.5 + 0.5
      }));
      setParticles(newParticles);
      setTimeout(() => setParticles([]), 1000);
    }
  }, [trigger]);
  
  return (
    <div className="particle-container">
      {particles.map(p => (
        <div
          key={p.id}
          className="particle"
          style={{
            '--angle': `${p.angle}rad`,
            '--scale': p.scale,
            backgroundColor: color
          }}
        />
      ))}
    </div>
  );
};

// Animated number with advanced easing
const AnimatedNumber = ({ value, prefix = "", suffix = "", size = "normal" }) => {
  const [displayValue, setDisplayValue] = useState(value);
  const [diff, setDiff] = useState(0);
  const prevValue = useRef(value);
  
  useEffect(() => {
    const difference = value - prevValue.current;
    if (difference !== 0) {
      setDiff(difference);
      setTimeout(() => setDiff(0), 1000);
    }
    
    // Smooth counter animation
    const steps = 20;
    const increment = (value - displayValue) / steps;
    let current = displayValue;
    let step = 0;
    
    const timer = setInterval(() => {
      step++;
      current += increment;
      setDisplayValue(Math.round(current));
      
      if (step >= steps) {
        setDisplayValue(value);
        clearInterval(timer);
      }
    }, 30);
    
    prevValue.current = value;
    return () => clearInterval(timer);
  }, [value]);
  
  return (
    <div className={`animated-number ${size}`}>
      <span className={diff !== 0 ? "number-change" : ""} style={{ color: '#00ffff' }}>
        {prefix}{displayValue.toLocaleString()}{suffix}
      </span>
      {diff !== 0 && (
        <span className={`diff-indicator ${diff > 0 ? 'positive' : 'negative'}`}>
          {diff > 0 ? '+' : ''}{diff}
        </span>
      )}
    </div>
  );
};


// XP/Progress bar component
const ProgressBar = ({ current, max, label = "XP: ", level }) => {
  const percentage = (current / max) * 100;
  
  return (
    <div className="progress-container">
      <div className="progress-header" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span className="progress-label" style={{ color: '#00ff41' }}>{label}</span>
        <div className="progress-numbers" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <AnimatedNumber value={current} />
          <span style={{ color: 'rgba(0, 255, 255, 0.5)' }}>/</span>
          <AnimatedNumber value={max} />
        </div>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${percentage}%` }}>
          <div className="progress-glow" />
        </div>
      </div>
    </div>
  );
};

// Combo multiplier display
const ComboDisplay = ({ combo = 0 }) => {
  const [showCombo, setShowCombo] = useState(false);
  
  useEffect(() => {
    setShowCombo(combo > 1);
  }, [combo]);
  
  if (!showCombo) return null;
  
  return (
    <div className={`combo-display combo-${Math.min(combo, 10)}`}>
      <div className="combo-text">COMBO</div>
      <div className="combo-number">x{combo}</div>
      <div className="combo-flames" />
    </div>
  );
};

// Mini map component
const MiniMap = ({ playerPosition = { x: 50, y: 50 }, objectives = [] }) => {
  return (
    <div className="minimap">
      <div className="map-border">
        <div className="map-content">
          <div className="player-dot" style={{ left: `${playerPosition.x}%`, top: `${playerPosition.y}%` }} />
          {objectives.map((obj, i) => (
            <div 
              key={i} 
              className="objective-dot" 
              style={{ left: `${obj.x}%`, top: `${obj.y}%` }}
            />
          ))}
        </div>
      </div>
      <div className="compass">N</div>
    </div>
  );
};

export const EnhancedHUD = () => {
  // Using both Valtio GameState and Zustand store for all game data
  const gameState = useSnapshot(GameState);
  const { 
    score, 
    characterHealth, 
    defeatedMonsters, 
    activeMonsterCount 
  } = useGameStore();
  
  const keys = gameState.keys || 0;
  const level = gameState.level || 1;
  const candles = gameState.candles || 0;
  const litCandles = gameState.litCandles || new Set();
  const monstersDefeated = defeatedMonsters?.size || 0;
  
  // Debug logging
  // useEffect(() => {
  //   console.log("EnhancedHUD - Debug:", {
  //     litCandles,
  //     litCandlesLength: litCandles?.size,
  //     candles,
  //     gameState: {
  //       litCandles: gameState.litCandles,
  //       candles: gameState.candles
  //     }
  //   });
  // }, [litCandles, candles, gameState.litCandles, gameState.candles]);
  
  // Get coin count from GameState
  const coinCount = gameState.coinCount || 0;
  // Get diamond count from GameState
  const diamondCount = gameState.diamondCount || 0;
  const xp = 0;
  const maxXP = 100;
  const combo = 1;
  const shield = 0;
  
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isMobile, setIsMobile] = useState(false);
  const [scoreParticleTrigger, setScoreParticleTrigger] = useState(0);
  const [coinParticleTrigger, setCoinParticleTrigger] = useState(0);
  const [mobileDropdownOpen, setMobileDropdownOpen] = useState(false);
  const prevLevel = useRef(level);
  const prevScore = useRef(score);
  const prevCoins = useRef(coinCount);
  
  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = window.innerWidth <= 768;
      console.log('Mobile detection:', { width: window.innerWidth, isMobile: isMobileDevice });
      setIsMobile(isMobileDevice);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Level up detection
  useEffect(() => {
    if (level > prevLevel.current) {
      setShowLevelUp(true);
      setTimeout(() => setShowLevelUp(false), 4000);
      prevLevel.current = level;
    }
  }, [level]);
  
  // Score milestone notifications
  useEffect(() => {
    const scoreDiff = score - prevScore.current;
    if (scoreDiff >= 1000) {
      const newNotif = {
        id: Date.now(),
        text: `+${scoreDiff} POINTS!`,
        type: 'milestone'
      };
      setNotifications(prev => [...prev, newNotif]);
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== newNotif.id));
      }, 3000);
    }
    // Trigger particles for any score change
    if (scoreDiff > 0) {
      setScoreParticleTrigger(prev => prev + 1);
    }
    prevScore.current = score;
  }, [score]);
  
  
  // Coin collection particles
  useEffect(() => {
    if (coinCount > prevCoins.current) {
      setCoinParticleTrigger(prev => prev + 1);
    }
    prevCoins.current = coinCount;
  }, [coinCount]);
  
  
  // Mobile HUD Component
  const MobileHUD = () => {
    return (
      <div 
        className="mobile-hud-container" 
        style={{ 
          position: 'fixed',
          top: '20px',
          right: '20px',
          bottom: 'auto',
          left: 'auto',
          zIndex: 99999
        }}
      >
        {/* Integrated Panel */}
        <div 
          style={{
            background: 'rgba(0, 0, 0, 0.9)',
            border: '2px solid rgba(0, 255, 255, 0.4)',
            borderRadius: '16px',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.8), 0 0 20px rgba(0, 255, 255, 0.2)',
            padding: '12px',
            minWidth: '80px',
            maxWidth: '100px',
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: mobileDropdownOpen ? 'scale(1.01)' : 'scale(1)',
            height: mobileDropdownOpen ? 'auto' : '60px',
            overflow: 'hidden',
            willChange: 'height, transform'
          }}
        >
          {/* Score Header - Always Visible */}
          <div 
            onClick={() => setMobileDropdownOpen(!mobileDropdownOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              padding: '8px 4px',
              borderBottom: mobileDropdownOpen ? '1px solid rgba(0, 255, 255, 0.3)' : 'none',
              marginBottom: mobileDropdownOpen ? '8px' : '0'
            }}
          >
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              flex: 1
            }}>
              <div style={{
                fontSize: '8px',
                fontWeight: 'bold',
                color: '#FFD700',
                textShadow: '0 0 6px rgba(255, 215, 0, 0.8)',
                fontFamily: 'Orbitron, Courier New, monospace',
                letterSpacing: '1px',
                marginBottom: '2px'
              }}>SCORE</div>
              <div style={{
                fontSize: '14px',
                fontWeight: 'bold',
                color: '#00ffff',
                textShadow: '0 0 8px rgba(0, 255, 255, 0.8)',
                fontFamily: 'Orbitron, Courier New, monospace'
              }}>{score.toLocaleString()}</div>
            </div>
            <div style={{
              color: '#00ffff',
              fontSize: '12px',
              marginLeft: '8px'
            }}>{mobileDropdownOpen ? '▲' : '▼'}</div>
          </div>

          {/* Stats Details - Shown when expanded */}
          <div style={{
            opacity: mobileDropdownOpen ? 1 : 0,
            transform: mobileDropdownOpen ? 'translateY(0)' : 'translateY(-20px)',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            transitionDelay: mobileDropdownOpen ? '0.05s' : '0s',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            marginTop: '8px'
          }}>
              {/* Row 1 */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 8px',
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '6px',
                transition: 'all 0.2s ease',
                transform: mobileDropdownOpen ? 'translateY(0) scale(1)' : 'translateY(-10px) scale(0.9)',
                transitionDelay: mobileDropdownOpen ? '0.08s' : '0s'
              }}>
                <span style={{ fontSize: '14px' }}>⚔️</span>
                <span style={{
                  color: '#00ffff',
                  fontWeight: 'bold',
                  fontSize: '12px',
                  textShadow: '0 0 6px rgba(0, 255, 255, 0.8)',
                  fontFamily: 'Orbitron, Courier New, monospace'
                }}>{monstersDefeated}</span>
              </div>
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 8px',
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '6px',
                transition: 'all 0.2s ease',
                transform: mobileDropdownOpen ? 'translateY(0) scale(1)' : 'translateY(-10px) scale(0.9)',
                transitionDelay: mobileDropdownOpen ? '0.25s' : '0s'
              }}>
                <span style={{ fontSize: '14px' }}>🪙</span>
                <span style={{
                  color: '#00ffff',
                  fontWeight: 'bold',
                  fontSize: '12px',
                  textShadow: '0 0 6px rgba(0, 255, 255, 0.8)',
                  fontFamily: 'Orbitron, Courier New, monospace'
                }}>{coinCount}</span>
              </div>

              {/* Row 2 */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 8px',
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '6px',
                transition: 'all 0.2s ease',
                transform: mobileDropdownOpen ? 'translateY(0) scale(1)' : 'translateY(-10px) scale(0.9)',
                transitionDelay: mobileDropdownOpen ? '0.25s' : '0s'
              }}>
                <span style={{ fontSize: '14px' }}>🗝️</span>
                <span style={{
                  color: '#00ffff',
                  fontWeight: 'bold',
                  fontSize: '12px',
                  textShadow: '0 0 6px rgba(0, 255, 255, 0.8)',
                  fontFamily: 'Orbitron, Courier New, monospace'
                }}>{keys}</span>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 8px',
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '6px',
                transition: 'all 0.2s ease',
                transform: mobileDropdownOpen ? 'translateY(0) scale(1)' : 'translateY(-10px) scale(0.9)',
                transitionDelay: mobileDropdownOpen ? '0.25s' : '0s'
              }}>
                <span style={{ fontSize: '14px' }}>🕯️</span>
                <span style={{
                  color: '#00ffff',
                  fontWeight: 'bold',
                  fontSize: '12px',
                  textShadow: '0 0 6px rgba(0, 255, 255, 0.8)',
                  fontFamily: 'Orbitron, Courier New, monospace'
                }}>{gameState.litCandleCount || 0}/{candles}</span>
              </div>

              {/* Health */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 8px',
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '6px',
                transition: 'all 0.2s ease',
                transform: mobileDropdownOpen ? 'translateY(0) scale(1)' : 'translateY(-10px) scale(0.9)',
                transitionDelay: mobileDropdownOpen ? '0.12s' : '0s'
              }}>
                <span style={{ fontSize: '14px' }}>💚</span>
                <span style={{
                  color: '#00ffff',
                  fontWeight: 'bold',
                  fontSize: '12px',
                  textShadow: '0 0 6px rgba(0, 255, 255, 0.8)',
                  fontFamily: 'Orbitron, Courier New, monospace'
                }}>{characterHealth}</span>
              </div>
            </div>
        </div>
      </div>
    );
  };

  // Return appropriate HUD based on device
  if (isMobile) {
    return (
      <>
        <MobileHUD />
        {/* Keep notifications and level up for mobile too */}
        {showLevelUp && (
          <div className="level-up-notification">
            <div className="level-up-text">LEVEL UP!</div>
            <div className="level-up-number">Level {level}</div>
          </div>
        )}
        {notifications.map(notification => (
          <div key={notification.id} className={`notification ${notification.type}`}>
            {notification.text}
          </div>
        ))}
      </>
    );
  }

  return (
    <>
      <div className={`modern-hud desktop`}>
        
        {/* Top Right - Score & Resources */}
        <div className="resource-panel">
          <div className="score-resources-layout">
            {/* Score Section */}
            <div className="score-section">
              <div className="score-header" style={{ color: '#00ff41' }}>SCORE</div>
              <span className="resource-value" style={{ fontSize: '36px' }}>{score}</span>
              <ParticleEffect trigger={scoreParticleTrigger} color="#00ffff" />
              <ComboDisplay combo={combo} />
            </div>
            
            {/* Resources Section */}
            <div className="resources-horizontal">
              
              <div className="resource-item">
                <div className="resource-icon">⚔️</div>
                <span className="resource-value">{monstersDefeated}</span>
              </div>
              
              <div className="resource-item">
                <div className="resource-icon">🪙</div>
                <span className="resource-value">{coinCount}</span>
                <ParticleEffect trigger={coinParticleTrigger} color="#ffd700" />
              </div>
              
              
              <div className="resource-item">
                <div className="resource-icon">🗝️</div>
                <span className="resource-value">{keys}</span>
              </div>
              
              <div className="resource-item">
                <div className="resource-icon">🕯️</div>
                <span className="resource-value">{gameState.litCandleCount || 0}/{candles}</span>
              </div>
              
              <div className="resource-item">
                <div className="resource-icon">📍</div>
                <span className="resource-value" style={{ fontSize: '12px' }}>
                  Y:{gameState.characterY} Z:{gameState.characterZ}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Bottom Right - Mini Map */}
        {/* <div className="bottom-right-panel">
          <MiniMap />
        </div> */}
        
        {/* Notifications */}
        <div className="notification-container">
          {notifications.map(notif => (
            <div key={notif.id} className={`notification ${notif.type}`}>
              {notif.text}
            </div>
          ))}
        </div>
      </div>
      
      {/* Level Up Overlay */}
      {showLevelUp && (
        <div className="level-up-overlay">
          <div className="level-up-content">
            <div className="level-up-burst" />
            <ParticleEffect trigger={showLevelUp ? 1 : 0} color="#00ff41" />
            <div className="level-up-title">LEVEL UP!</div>
            <div className="level-up-level">Level {level} Achieved</div>
            <div className="level-up-rewards">
              <span>+10 Max Health</span>
              <span>+5 Damage</span>
              <span>New Ability Unlocked</span>
            </div>
          </div>
        </div>
      )}
      
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap');
        
        /* Base Container */
        .modern-hud {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
          z-index: 1000;
          font-family: 'Orbitron', 'Courier New', monospace;
        }
        
        .modern-hud > * {
          pointer-events: auto;
        }
        
        /* Glass Morphism Base - Cyber Theme */
        .status-panel,
        .resource-panel,
        .bottom-right-panel {
          background: linear-gradient(135deg, 
            rgba(0, 0, 0, 0.95) 0%,
            rgba(10, 25, 15, 0.9) 100%);
          backdrop-filter: blur(20px) saturate(200%);
          border: 2px solid #00ff41;
          box-shadow: 
            0 8px 32px rgba(0, 255, 65, 0.2),
            inset 0 1px 0 rgba(0, 255, 65, 0.1),
            0 0 30px rgba(0, 255, 65, 0.1);
          animation: borderPulse 3s ease infinite;
        }
        
        @keyframes borderPulse {
          0%, 100% { 
            border-color: #00ff41;
            box-shadow: 
              0 8px 32px rgba(0, 255, 65, 0.2),
              inset 0 1px 0 rgba(0, 255, 65, 0.1),
              0 0 30px rgba(0, 255, 65, 0.1);
          }
          50% { 
            border-color: #00ff88;
            box-shadow: 
              0 8px 32px rgba(0, 255, 136, 0.3),
              inset 0 1px 0 rgba(0, 255, 136, 0.2),
              0 0 40px rgba(0, 255, 136, 0.2);
          }
        }
        
        /* Status Panel - Top Right to avoid logo collision */
        .status-panel {
          position: absolute;
          top: 1rem;
          right: 1rem;
          padding: 0.75rem;
          border-radius: 1rem;
          width: 12rem;
          animation: slideInLeft 0.6s cubic-bezier(0.23, 1, 0.32, 1);
          transform-origin: top left;
        }
        
        @keyframes slideInLeft {
          from {
            transform: translateX(-100px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        
        /* Progress Bar */
        .progress-container {
          padding: 0.5rem;
          background: rgba(0, 0, 0, 0.8);
          border-radius: 0.6rem;
          margin-bottom: 0;
          border: 1px solid rgba(0, 255, 65, 0.2);
        }
        
        .progress-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 6px;
          font-size: 11px;
          color: #00ff41;
          text-shadow: 0 0 8px rgba(0, 255, 65, 0.6);
          text-transform: uppercase;
          letter-spacing: 2px;
        }
        
        .progress-track {
          height: 8px;
          background: rgba(0, 0, 0, 0.9);
          border-radius: 4px;
          overflow: hidden;
          position: relative;
          border: 1px solid rgba(0, 255, 65, 0.2);
        }
        
        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #8000ff, #ff00ff);
          border-radius: 4px;
          position: relative;
          transition: width 0.5s cubic-bezier(0.23, 1, 0.32, 1);
          box-shadow: 0 0 20px rgba(255, 0, 255, 0.6);
        }
        
        .progress-glow {
          position: absolute;
          top: 0;
          right: 0;
          width: 20px;
          height: 100%;
          background: linear-gradient(90deg, 
            transparent,
            rgba(255, 255, 255, 0.6),
            transparent);
          animation: progressShine 2s ease infinite;
        }
        
        @keyframes progressShine {
          0% { transform: translateX(-20px); }
          100% { transform: translateX(20px); }
        }
        
        /* Level Display */
        .level-display {
          position: absolute;
          right: 20px;
          top: 20px;
        }
        
        .level-hexagon {
          width: 70px;
          height: 70px;
          position: relative;
          animation: hexFloat 3s ease infinite;
        }
        
        @keyframes hexFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        
        .hex-inner {
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #00ff41, #00ffaa);
          clip-path: polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
        }
        
        .hex-border {
          position: absolute;
          top: -2px;
          left: -2px;
          right: -2px;
          bottom: -2px;
          background: linear-gradient(135deg, #00ff88, #00ffff);
          clip-path: polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%);
          z-index: -1;
          animation: hexGlow 2s ease infinite;
        }
        
        @keyframes hexGlow {
          0%, 100% {
            filter: drop-shadow(0 0 20px rgba(0, 255, 65, 0.8));
          }
          50% {
            filter: drop-shadow(0 0 30px rgba(0, 255, 136, 1));
          }
        }
        
        .level-text {
          font-size: 10px;
          font-weight: bold;
          color: rgba(0, 0, 0, 0.8);
          letter-spacing: 2px;
          text-transform: uppercase;
        }
        
        .level-number {
          font-size: 24px;
          font-weight: 900;
          color: #000;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
        }
        
        /* Resource Panel - Top Right */
        .resource-panel {
          position: absolute;
          top: 1rem;
          right: 1rem;
          padding: 0.75rem;
          border-radius: 1rem;
          animation: slideInRight 0.6s cubic-bezier(0.23, 1, 0.32, 1);
          transform-origin: top right;
        }
        
        @keyframes slideInRight {
          from {
            transform: translateX(100px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        /* Score Module */
        .score-module {
          text-align: center;
          margin-bottom: 12px;
          position: relative;
        }
        
        .score-header {
          font-size: 0.75rem;
          color: #00ff41;
          letter-spacing: 0.25rem;
          margin-bottom: 0.3rem;
          text-shadow: 0 0 0.9rem rgba(0, 255, 65, 0.8);
          text-transform: uppercase;
        }
        
        .animated-number {
          position: relative;
          display: inline-block;
        }
        
        .animated-number.large {
          font-size: 36px;
          font-weight: 900;
          color: #00ffff;
          text-shadow: 
            0 0 20px rgba(0, 255, 255, 0.8),
            0 0 40px rgba(0, 255, 255, 0.5),
            0 2px 4px rgba(0, 0, 0, 0.8);
          letter-spacing: 2px;
        }
        
        .number-change {
          animation: numberPop 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
        
        @keyframes numberPop {
          0% { transform: scale(1); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
        
        .diff-indicator {
          position: absolute;
          top: -10px;
          right: -40px;
          font-size: 16px;
          font-weight: bold;
          animation: floatUp 1s ease forwards;
        }
        
        .diff-indicator.positive {
          color: #00ff41;
          text-shadow: 0 0 10px rgba(0, 255, 65, 0.8);
        }
        
        .diff-indicator.negative {
          color: #ff0040;
          text-shadow: 0 0 10px rgba(255, 0, 64, 0.8);
        }
        
        @keyframes floatUp {
          0% {
            transform: translateY(0);
            opacity: 1;
          }
          100% {
            transform: translateY(-30px);
            opacity: 0;
          }
        }
        
        /* Combo Display */
        .combo-display {
          position: absolute;
          top: 50px;
          left: 50%;
          transform: translateX(-50%);
          text-align: center;
          animation: comboBounce 0.5s ease;
        }
        
        @keyframes comboBounce {
          0% { transform: translateX(-50%) scale(0); }
          50% { transform: translateX(-50%) scale(1.2); }
          100% { transform: translateX(-50%) scale(1); }
        }
        
        .combo-text {
          font-size: 10px;
          color: #ff00ff;
          letter-spacing: 3px;
          text-shadow: 0 0 10px rgba(255, 0, 255, 0.8);
          text-transform: uppercase;
        }
        
        .combo-number {
          font-size: 24px;
          font-weight: 900;
          background: linear-gradient(135deg, #ff00ff, #00ffff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          filter: drop-shadow(0 0 15px rgba(255, 0, 255, 0.8));
        }
        
        /* Score & Resources Layout */
        .score-resources-layout {
          display: flex;
          align-items: center;
          gap: 1.25rem;
        }
        
        .score-section {
          text-align: center;
          position: relative;
        }
        
        .resources-horizontal {
          display: flex;
          gap: 1rem;
          align-items: center;
        }
        
        .resource-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
          position: relative;
        }
        
        .resource-item .resource-icon {
          font-size: 1.125rem;
          filter: drop-shadow(0 0 0.5rem rgba(255, 255, 255, 0.5));
        }
        
        .resource-item .resource-value {
          font-size: 0.875rem;
        }
        
        .resource-card {
          position: relative;
          padding: 12px;
          border-radius: 15px;
          background: rgba(0, 0, 0, 0.8);
          border: 1px solid rgba(0, 255, 65, 0.2);
          overflow: hidden;
          transition: all 0.3s ease;
          min-width: 85px;
        }
        
        .resource-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0, 255, 65, 0.3);
          border-color: rgba(0, 255, 65, 0.6);
        }
        
        .resource-card.gold {
          background: linear-gradient(135deg, 
            rgba(255, 215, 0, 0.1),
            rgba(255, 193, 7, 0.05));
          border-color: rgba(255, 215, 0, 0.4);
          box-shadow: inset 0 0 20px rgba(255, 215, 0, 0.1);
        }
        
        .resource-card.gold:hover {
          border-color: rgba(255, 215, 0, 0.8);
          box-shadow: 0 8px 30px rgba(255, 215, 0, 0.4);
        }
        
        .resource-card.silver {
          background: linear-gradient(135deg, 
            rgba(192, 192, 192, 0.1),
            rgba(128, 128, 128, 0.05));
          border-color: rgba(192, 192, 192, 0.4);
          box-shadow: inset 0 0 20px rgba(192, 192, 192, 0.1);
        }
        
        .resource-card.silver:hover {
          border-color: rgba(192, 192, 192, 0.8);
          box-shadow: 0 8px 30px rgba(192, 192, 192, 0.4);
        }
        
        .resource-card.bronze {
          background: linear-gradient(135deg, 
            rgba(255, 140, 0, 0.1),
            rgba(205, 127, 50, 0.05));
          border-color: rgba(255, 140, 0, 0.4);
          box-shadow: inset 0 0 20px rgba(255, 140, 0, 0.1);
        }
        
        .resource-card.bronze:hover {
          border-color: rgba(255, 140, 0, 0.8);
          box-shadow: 0 8px 30px rgba(255, 140, 0, 0.4);
        }
        
        .resource-icon {
          font-size: 20px;
          margin-bottom: 6px;
          filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.5));
        }
        
        .resource-info {
          position: relative;
          z-index: 1;
        }
        
        .resource-label {
          font-size: 10px;
          color: #00ff41;
          letter-spacing: 2px;
          margin-bottom: 4px;
          text-shadow: 0 0 8px rgba(0, 255, 65, 0.6);
          text-transform: uppercase;
        }
        
        .resource-value {
          font-size: 16px;
          font-weight: bold;
          color: #00ffff;
          text-shadow: 0 0 10px rgba(0, 255, 255, 0.6);
        }
        
        .resource-bg-icon {
          position: absolute;
          bottom: -10px;
          right: -10px;
          font-size: 60px;
          opacity: 0.05;
          transform: rotate(-15deg);
        }
        
        /* Mini Map */
        .bottom-right-panel {
          position: absolute;
          bottom: 15px;
          right: 15px;
          padding: 8px;
          border-radius: 12px;
          animation: slideInUp 0.6s cubic-bezier(0.23, 1, 0.32, 1);
          transform: scale(0.8);
          transform-origin: bottom right;
        }
        
        @keyframes slideInUp {
          from {
            transform: translateY(100px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        .minimap {
          position: relative;
          width: 150px;
          height: 150px;
        }
        
        .map-border {
          width: 100%;
          height: 100%;
          border: 2px solid rgba(0, 255, 65, 0.4);
          border-radius: 10px;
          overflow: hidden;
          background: radial-gradient(circle at center, 
            rgba(0, 255, 65, 0.05),
            rgba(0, 0, 0, 0.9));
          box-shadow: 
            inset 0 0 30px rgba(0, 255, 65, 0.1),
            0 0 20px rgba(0, 255, 65, 0.2);
        }
        
        .map-content {
          position: relative;
          width: 100%;
          height: 100%;
        }
        
        .player-dot {
          position: absolute;
          width: 8px;
          height: 8px;
          background: #00ff41;
          border: 2px solid #00ffff;
          border-radius: 50%;
          transform: translate(-50%, -50%);
          z-index: 2;
          box-shadow: 0 0 20px #00ff41;
          animation: playerPulse 2s ease infinite;
        }
        
        @keyframes playerPulse {
          0%, 100% {
            box-shadow: 0 0 20px #00ff41;
          }
          50% {
            box-shadow: 0 0 30px #00ff41;
          }
        }
        
        .objective-dot {
          position: absolute;
          width: 6px;
          height: 6px;
          background: #ff00ff;
          border-radius: 50%;
          transform: translate(-50%, -50%);
          animation: objectivePulse 2s ease infinite;
          box-shadow: 0 0 10px #ff00ff;
        }
        
        @keyframes objectivePulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        
        .compass {
          position: absolute;
          top: 5px;
          right: 5px;
          font-size: 12px;
          font-weight: bold;
          color: #00ff41;
          text-shadow: 0 0 8px rgba(0, 255, 65, 0.8);
        }
        
        /* Notifications */
        .notification-container {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          pointer-events: none;
        }
        
        .notification {
          background: linear-gradient(135deg, 
            rgba(0, 255, 65, 0.9),
            rgba(0, 255, 136, 0.9));
          color: #000;
          padding: 15px 30px;
          border-radius: 50px;
          font-size: 20px;
          font-weight: 900;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
          margin-bottom: 10px;
          animation: notifSlide 3s ease forwards;
          box-shadow: 
            0 8px 32px rgba(0, 255, 65, 0.4),
            0 0 40px rgba(0, 255, 65, 0.3);
          text-transform: uppercase;
          letter-spacing: 2px;
        }
        
        @keyframes notifSlide {
          0% {
            transform: translateY(50px);
            opacity: 0;
          }
          20% {
            transform: translateY(0);
            opacity: 1;
          }
          80% {
            transform: translateY(0);
            opacity: 1;
          }
          100% {
            transform: translateY(-50px);
            opacity: 0;
          }
        }
        
        /* Level Up Overlay */
        .level-up-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          pointer-events: none;
          animation: overlayFade 4s ease forwards;
        }
        
        @keyframes overlayFade {
          0% { background: rgba(0, 0, 0, 0); }
          20% { background: rgba(0, 0, 0, 0.7); }
          80% { background: rgba(0, 0, 0, 0.7); }
          100% { background: rgba(0, 0, 0, 0); }
        }
        
        .level-up-content {
          text-align: center;
          position: relative;
        }
        
        .level-up-burst {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, 
            rgba(0, 255, 65, 0.4),
            transparent 70%);
          animation: burstExpand 1s ease forwards;
          filter: blur(2px);
        }
        
        @keyframes burstExpand {
          from {
            width: 0;
            height: 0;
            opacity: 1;
          }
          to {
            width: 500px;
            height: 500px;
            opacity: 0;
          }
        }
        
        .level-up-title {
          font-size: 72px;
          font-weight: 900;
          color: #00ff41;
          text-shadow: 
            0 0 40px rgba(0, 255, 65, 0.8),
            0 0 80px rgba(0, 255, 65, 0.5),
            0 4px 8px rgba(0, 0, 0, 0.8);
          animation: levelUpScale 1s cubic-bezier(0.68, -0.55, 0.265, 1.55);
          margin-bottom: 10px;
          text-transform: uppercase;
          letter-spacing: 4px;
        }
        
        @keyframes levelUpScale {
          from {
            transform: scale(0);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        .level-up-level {
          font-size: 28px;
          color: #00ffff;
          margin-bottom: 30px;
          animation: fadeInUp 1s ease 0.3s both;
          text-shadow: 0 0 20px rgba(0, 255, 255, 0.8);
          letter-spacing: 2px;
        }
        
        @keyframes fadeInUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        .level-up-rewards {
          display: flex;
          gap: 20px;
          justify-content: center;
          animation: fadeInUp 1s ease 0.6s both;
        }
        
        .level-up-rewards span {
          background: rgba(0, 0, 0, 0.8);
          padding: 10px 20px;
          border-radius: 25px;
          border: 1px solid rgba(0, 255, 65, 0.4);
          color: #00ff41;
          font-size: 14px;
          text-shadow: 0 0 10px rgba(0, 255, 65, 0.6);
          box-shadow: 0 0 20px rgba(0, 255, 65, 0.2);
        }
        
        /* Particle System */
        .particle-container {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 100%;
          height: 100%;
          pointer-events: none;
          overflow: visible;
          z-index: 100;
        }
        
        .particle {
          position: absolute;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          top: 0;
          left: 0;
          animation: particleFly 1.2s cubic-bezier(0.5, 0, 0.5, 1) forwards;
          filter: drop-shadow(0 0 8px currentColor);
        }
        
        @keyframes particleFly {
          0% {
            transform: translate(-50%, -50%) scale(0) rotate(0deg);
            opacity: 1;
          }
          50% {
            opacity: 1;
            transform: translate(
              calc(-50% + cos(var(--angle)) * 50px),
              calc(-50% + sin(var(--angle)) * 50px)
            ) scale(1.5) rotate(180deg);
          }
          100% {
            transform: translate(
              calc(-50% + cos(var(--angle)) * 120px),
              calc(-50% + sin(var(--angle)) * 120px)
            ) scale(0.2) rotate(360deg);
            opacity: 0;
          }
        }
        
        /* Mobile Adjustments - Ultra Clean */
        
        .modern-hud.mobile .resource-panel {
          top: 10px;
          right: 10px;
          padding: 0;
          background: transparent !important;
          border: none !important;
          backdrop-filter: none !important;
          box-shadow: none !important;
        }
        
        .modern-hud.mobile .score-module {
          margin-bottom: 20px;
          text-align: right;
          background: rgba(0, 0, 0, 0.7);
          border: 1px solid rgba(0, 255, 255, 0.6);
          border-radius: 15px;
          padding: 10px 15px;
          backdrop-filter: blur(10px);
          box-shadow: 
            0 4px 16px rgba(0, 255, 255, 0.2),
            inset 0 1px 0 rgba(0, 255, 255, 0.1);
          width: 100px;
        }
        
        .modern-hud.mobile .score-header {
          font-size: 10px;
          color: #00ff41;
          letter-spacing: 2px;
          margin-bottom: 2px;
          text-shadow: 0 0 8px rgba(0, 255, 65, 0.6);
          text-transform: uppercase;
        }
        
        .modern-hud.mobile .animated-number.large {
          font-size: 36px;
          font-weight: bold;
          color: #00ffff;
          text-shadow: 
            0 0 20px rgba(0, 255, 255, 0.8),
            0 0 40px rgba(0, 255, 255, 0.5),
            0 2px 4px rgba(0, 0, 0, 0.8);
          font-family: 'Orbitron', 'Courier New', monospace;
        }
        
        .modern-hud.mobile .resource-grid {
          display: flex;
          flex-direction: column;
          gap: 8px;
          align-items: flex-end;
        }
        
        .modern-hud.mobile .resource-card {
          background: rgba(0, 0, 0, 0.7) !important;
          border: 1px solid rgba(0, 255, 65, 0.6) !important;
          border-radius: 15px !important;
          padding: 6px 12px !important;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          box-shadow: 
            0 4px 16px rgba(0, 255, 65, 0.2),
            inset 0 1px 0 rgba(0, 255, 65, 0.1) !important;
          backdrop-filter: blur(10px);
          width: 100px;
          box-sizing: border-box;
        }
        
        .modern-hud.mobile .resource-info {
          margin: 0;
          text-align: right;
          flex: 1;
        }
        
        .modern-hud.mobile .resource-card:hover {
          transform: none;
          box-shadow: none !important;
        }
        
        .modern-hud.mobile .resource-icon {
          font-size: 18px;
          margin-bottom: 0;
        }
        
        .modern-hud.mobile .resource-info {
          margin: 0;
        }
        
        .modern-hud.mobile .resource-label {
          display: none;
        }
        
        .modern-hud.mobile .resource-bg-icon {
          display: none;
        }
        
        .modern-hud.mobile .animated-number {
          font-size: 16px !important;
          font-weight: bold !important;
          color: #00ffff !important;
          text-shadow: 0 0 10px rgba(0, 255, 255, 0.8) !important;
          font-family: 'Orbitron', 'Courier New', monospace !important;
        }
        
        .modern-hud.mobile .resource-value {
          font-size: 16px !important;
          font-weight: bold !important;
          color: #00ffff !important;
          text-shadow: 0 0 10px rgba(0, 255, 255, 0.8) !important;
          font-family: 'Orbitron', 'Courier New', monospace !important;
        }
        
        .modern-hud.mobile .resource-grid {
          grid-template-columns: 1fr;
          gap: 6px;
        }
        
        .modern-hud.mobile .resource-card {
          padding: 8px;
          min-width: unset;
        }
        
        .modern-hud.mobile .bottom-right-panel {
          display: none;
        }
        
        
        .modern-hud.mobile .level-hexagon {
          width: 40px;
          height: 40px;
        }
        
        .modern-hud.mobile .level-display {
          position: relative;
          right: auto;
          top: auto;
          margin-left: 10px;
        }
        
        .modern-hud.mobile .level-number {
          font-size: 14px;
        }
        
        .modern-hud.mobile .level-text {
          font-size: 8px;
          letter-spacing: 1px;
        }
        
        .modern-hud.mobile .animated-number.large {
          font-size: 24px;
        }
        
        .modern-hud.mobile .animated-number {
          font-size: 14px;
        }
        
        
        .modern-hud.mobile .progress-label {
          font-size: 8px;
          letter-spacing: 1px;
        }
        
        /* Responsive breakpoints */
        @media (max-width: 480px) {
          .status-panel {
            min-width: unset !important;
          }
          
          .resource-grid {
            grid-template-columns: 1fr !important;
          }
          
          .level-up-title {
            font-size: 48px;
          }
          
          .level-up-rewards {
            flex-direction: column;
            align-items: center;
          }
        }

        /* Mobile HUD Styles */
        .mobile-hud-container {
          position: fixed !important;
          top: 20px !important;
          right: 20px !important;
          bottom: auto !important;
          left: auto !important;
          z-index: 99999 !important;
          pointer-events: auto !important;
          transform: none !important;
        }

        .mobile-score-button {
          width: 80px;
          height: 80px;
          border: 2px solid rgba(0, 255, 255, 0.6);
          border-radius: 50%;
          background: linear-gradient(135deg, 
            rgba(0, 0, 0, 0.9),
            rgba(0, 50, 100, 0.8),
            rgba(0, 100, 150, 0.9)
          );
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          backdrop-filter: blur(10px);
          box-shadow: 
            0 4px 15px rgba(0, 255, 255, 0.3),
            0 0 20px rgba(0, 255, 255, 0.1),
            inset 0 1px 0 rgba(255, 215, 0, 0.2);
          transition: all 0.3s ease;
          user-select: none;
        }

        .mobile-score-button:hover,
        .mobile-score-button:active {
          transform: scale(0.95);
          box-shadow: 
            0 2px 10px rgba(0, 255, 255, 0.4),
            0 0 25px rgba(0, 255, 255, 0.2),
            inset 0 -2px 0 rgba(0, 100, 255, 0.3);
          border-color: rgba(0, 255, 255, 0.8);
        }

        .mobile-score-label {
          font-size: 8px;
          font-weight: bold;
          color: #FFD700;
          text-shadow: 0 0 6px rgba(255, 215, 0, 0.8);
          font-family: 'Orbitron', 'Courier New', monospace;
          text-align: center;
          letter-spacing: 1px;
          margin-bottom: -2px;
        }

        .mobile-score-value {
          font-size: 12px;
          font-weight: bold;
          color: #00ffff;
          text-shadow: 0 0 8px rgba(0, 255, 255, 0.8);
          font-family: 'Orbitron', 'Courier New', monospace;
          text-align: center;
          line-height: 1.1;
        }

        .mobile-dropdown-arrow {
          color: #00ffff;
          font-size: 10px;
          transition: transform 0.3s ease;
          margin-top: 2px;
        }

        .mobile-dropdown-panel {
          position: absolute;
          top: 100%;
          right: 0;
          margin-top: 8px;
          background: rgba(255, 0, 0, 0.9) !important;
          border: 4px solid yellow !important;
          border-radius: 12px;
          backdrop-filter: blur(20px) saturate(1.5);
          box-shadow: 
            0 8px 32px rgba(0, 0, 0, 0.6),
            0 0 20px rgba(0, 255, 255, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
          min-width: 180px;
          animation: dropdownSlide 0.3s ease;
          overflow: hidden;
        }

        .mobile-dropdown-panel::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, 
            rgba(0, 50, 100, 0.3),
            rgba(0, 0, 0, 0.8),
            rgba(0, 100, 150, 0.2)
          );
          z-index: -1;
        }

        @keyframes dropdownSlide {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .mobile-dropdown-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 16px;
          border-bottom: 1px solid rgba(0, 255, 255, 0.1);
          transition: background-color 0.2s ease;
          min-height: 40px;
        }

        .mobile-dropdown-item:last-child {
          border-bottom: none;
        }

        .mobile-dropdown-item:hover {
          background: rgba(0, 255, 255, 0.15);
          backdrop-filter: blur(5px);
        }

        .mobile-item-icon {
          font-size: 18px;
          width: 24px;
          text-align: center;
          filter: drop-shadow(0 0 4px rgba(255, 255, 255, 0.3));
        }

        .mobile-item-value {
          color: #00ffff;
          font-weight: bold;
          font-size: 14px;
          text-shadow: 
            0 0 8px rgba(0, 255, 255, 0.8),
            0 1px 2px rgba(0, 0, 0, 0.8);
          font-family: 'Orbitron', 'Courier New', monospace;
          background: rgba(0, 0, 0, 0.3);
          padding: 2px 6px;
          border-radius: 4px;
        }
      `}</style>
    </>
  );
};