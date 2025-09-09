import React, { useState, useEffect } from 'react';

const FearGreedOverlay = ({ fearGreedData, showDevils, showAngels, showMoney, onManualControl, isManualMode, onVolumeControl }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [showSlider, setShowSlider] = useState(false);
  const [sliderValue, setSliderValue] = useState(50);
  const [volumeSliderValue, setVolumeSliderValue] = useState(40);
  const [isVolumeManual, setIsVolumeManual] = useState(false);
  const [volumeHistory, setVolumeHistory] = useState([]);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  useEffect(() => {
    if (fearGreedData && !isManualMode) {
      setSliderValue(fearGreedData.value);
    }
    // Update volume slider if not in manual mode
    if (fearGreedData?.marketVolume && !isVolumeManual) {
      setVolumeSliderValue(Math.round(fearGreedData.marketVolume.billions));
    }
  }, [fearGreedData, isManualMode, isVolumeManual]);
  
  // Generate simulated 30-day volume history
  useEffect(() => {
    if (fearGreedData?.marketVolume) {
      const currentVolume = fearGreedData.marketVolume.billions || 150;
      const history = [];
      for (let i = 29; i >= 0; i--) {
        // Simulate realistic volume fluctuations for higher volumes
        const dayVariance = Math.sin(i * 0.3) * 30 + Math.random() * 20 - 10;
        const trendFactor = i * 0.8; // Slight downward trend from past to present
        const volume = Math.max(50, currentVolume + dayVariance - trendFactor);
        history.push(volume);
      }
      setVolumeHistory(history);
      console.log('Generated volume history:', history.length, 'points, range:', Math.min(...history).toFixed(0), '-', Math.max(...history).toFixed(0), 'B');
    }
  }, [fearGreedData?.marketVolume]);
  
  const handleSliderChange = (e) => {
    const value = parseInt(e.target.value);
    setSliderValue(value);
    // Only send manual control if in manual mode
    if (isManualMode && onManualControl) {
      onManualControl(value);
    }
  };
  
  const handleVolumeSliderChange = (e) => {
    const value = parseInt(e.target.value);
    setVolumeSliderValue(value);
    if (isVolumeManual && onVolumeControl) {
      onVolumeControl(value);
    }
  };
  
  const toggleVolumeManualMode = () => {
    if (isVolumeManual) {
      setIsVolumeManual(false);
      // Return to live volume and reset slider to live value
      if (onVolumeControl) onVolumeControl(null);
      // Reset slider to live volume value
      if (fearGreedData?.marketVolume?.billions) {
        setVolumeSliderValue(Math.round(fearGreedData.marketVolume.billions));
      }
    } else {
      setIsVolumeManual(true);
      if (onVolumeControl) onVolumeControl(volumeSliderValue);
    }
  };
  
  const toggleManualMode = () => {
    if (isManualMode && onManualControl) {
      onManualControl(null); // Return to live data
      setShowSlider(false);
    } else if (onManualControl) {
      setShowSlider(true);
      onManualControl(sliderValue); // Enable manual mode with current slider value
    }
  };
  const getColorForValue = (value) => {
    if (value < 25) return '#ff3333'; // Extreme Fear - Red
    if (value < 45) return '#ff9933'; // Fear - Orange
    if (value < 55) return '#ffff33'; // Neutral - Yellow
    if (value < 75) return '#66ff66'; // Greed - Light Green
    return '#00ff00'; // Extreme Greed - Green
  };
  
  const getEmojiDisplay = () => {
    // Check if we have money emojis spawning
    if (showMoney && showMoney > 0) return '🤑';
    if (showDevils && showAngels) return '😈 & 😇';
    if (showDevils) return '😈';
    if (showAngels) return '😇';
    return '';
  };
  
  const getMarketMessage = (value, classification) => {
    if (value < 25) return "😈 Devils tempt the fearful!";
    if (value < 45) return "👹 Darkness whispers doubt";
    if (value < 55) return "⚖️ Balance in the cosmos";
    if (value < 75) return "😇 Angels warn of excess";
    if (value >= 80) return "🤑 PEAK GREED - Money rains from heaven!";
    return "👼 Heavenly caution - Peak euphoria!";
  };
  
  if (!fearGreedData) return null;
  
  // Mobile compact version
  if (isMobile) {
    const displayValue = isManualMode ? sliderValue : fearGreedData.value;
    const classification = displayValue < 25 ? 'Extreme Fear' : 
                          displayValue < 45 ? 'Fear' : 
                          displayValue < 55 ? 'Neutral' : 
                          displayValue < 75 ? 'Greed' : 'Extreme Greed';
    
    return (
      <div style={{
        position: 'fixed',
        bottom: '10px',
        left: '10px',
        right: '10px',
        zIndex: 100,
        background: 'rgba(255, 255, 255, 0.15)',
        padding: '15px',
        borderRadius: '15px',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        color: 'white',
        fontFamily: 'monospace',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: `0 4px 20px rgba(0, 0, 0, 0.1), 0 0 15px ${getColorForValue(displayValue)}25`,
      }}>
        {/* God Mode Slider with integrated index display */}
        <div style={{
          padding: '10px',
          background: isManualMode ? 'rgba(255,215,0,0.15)' : 'rgba(255,255,255,0.05)',
          borderRadius: '8px',
          border: isManualMode ? '1px solid rgba(255,215,0,0.4)' : '1px solid rgba(255,255,255,0.2)'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            marginBottom: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ 
                fontSize: '28px', 
                fontWeight: 'bold', 
                color: getColorForValue(displayValue),
                textShadow: `0 0 10px ${getColorForValue(displayValue)}`,
                lineHeight: '1'
              }}>
                {displayValue}
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 'bold' }}>
                  Fear & Greed
                </div>
                <div style={{ 
                  fontSize: '10px', 
                  color: getColorForValue(displayValue),
                  opacity: 0.9
                }}>
                  {classification}
                </div>
              </div>
            </div>
            <button
              onClick={toggleManualMode}
              style={{
                background: isManualMode ? 'rgba(255,215,0,0.3)' : 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '4px',
                color: 'white',
                padding: '2px 6px',
                fontSize: '9px',
                cursor: 'pointer'
              }}
            >
              {isManualMode ? 'ACTIVE' : 'LIVE'}
            </button>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={sliderValue}
            onChange={handleSliderChange}
            disabled={!isManualMode}
            style={{
              width: '100%',
              height: '20px',
              borderRadius: '10px',
              background: `linear-gradient(to right, #ff3333 0%, #ff9933 25%, #ffff33 50%, #66ff66 75%, #00ff00 100%)`,
              outline: 'none',
              opacity: isManualMode ? 1 : 0.3,
              cursor: isManualMode ? 'pointer' : 'not-allowed',
              WebkitAppearance: 'none',
              appearance: 'none',
              filter: isManualMode ? 'none' : 'grayscale(50%)'
            }}
          />
          <style jsx>{`
            input[type="range"]::-webkit-slider-thumb {
              -webkit-appearance: none;
              appearance: none;
              width: 25px;
              height: 25px;
              border-radius: 50%;
              background: white;
              cursor: pointer;
              box-shadow: 0 0 10px rgba(255,215,0,0.8);
            }
            input[type="range"]::-moz-range-thumb {
              width: 25px;
              height: 25px;
              border-radius: 50%;
              background: white;
              cursor: pointer;
              box-shadow: 0 0 10px rgba(255,215,0,0.8);
            }
          `}</style>
        </div>
        
        {/* Volume Control Section for Mobile */}
        {fearGreedData?.marketVolume && (
          <div style={{
            marginTop: '10px',
            padding: '8px',
            background: isVolumeManual ? 'rgba(138,43,226,0.1)' : 'rgba(255,255,255,0.05)',
            borderRadius: '6px',
            border: isVolumeManual ? '1px solid rgba(138,43,226,0.3)' : '1px solid rgba(255,255,255,0.15)'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              marginBottom: '5px'
            }}>
              <div style={{ fontSize: '10px', fontWeight: 'bold' }}>
                📊 Volume Control
              </div>
              <button
                onClick={toggleVolumeManualMode}
                style={{
                  background: isVolumeManual ? 'rgba(138,43,226,0.3)' : 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: '4px',
                  color: 'white',
                  padding: '2px 6px',
                  fontSize: '9px',
                  cursor: 'pointer'
                }}
              >
                {isVolumeManual ? 'MANUAL' : 'LIVE'}
              </button>
            </div>
            
            {/* Mini sparkline */}
            {volumeHistory.length > 0 && (
              <div style={{ marginBottom: '5px' }}>
                <svg width="100%" height="25" viewBox="0 0 100 25" preserveAspectRatio="none">
                  <polyline
                    fill="none"
                    stroke="rgba(138,43,226,0.6)"
                    strokeWidth="1"
                    points={(() => {
                      const minVol = Math.min(...volumeHistory);
                      const maxVol = Math.max(...volumeHistory);
                      const range = maxVol - minVol || 1;
                      return volumeHistory.map((v, i) => {
                        const x = (i / (volumeHistory.length - 1)) * 100;
                        const y = 22 - ((v - minVol) / range) * 20;
                        return `${x},${y}`;
                      }).join(' ');
                    })()}
                  />
                  <circle
                    cx="100"
                    cy={(() => {
                      const minVol = Math.min(...volumeHistory);
                      const maxVol = Math.max(...volumeHistory);
                      const range = maxVol - minVol || 1;
                      const currentVol = isVolumeManual ? volumeSliderValue : (fearGreedData?.marketVolume?.billions || volumeSliderValue);
                      return 22 - ((currentVol - minVol) / range) * 20;
                    })()}
                    r="2"
                    fill="#00ff00"
                  />
                </svg>
              </div>
            )}
            
            <input
              type="range"
              min="10"
              max="150"
              value={volumeSliderValue}
              onChange={handleVolumeSliderChange}
              disabled={!isVolumeManual}
              style={{
                width: '100%',
                height: '15px',
                borderRadius: '8px',
                background: `linear-gradient(to right, #ff9933 0%, #ffff33 40%, #66ff66 70%, #00ff00 100%)`,
                outline: 'none',
                opacity: isVolumeManual ? 1 : 0.4,
                cursor: isVolumeManual ? 'pointer' : 'not-allowed',
                WebkitAppearance: 'none',
                appearance: 'none',
                filter: isVolumeManual ? 'none' : 'grayscale(50%)'
              }}
            />
            
            <div style={{ 
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '8px',
              opacity: 0.6,
              marginTop: '3px'
            }}>
              <span>$10B</span>
              <span style={{ fontWeight: 'bold', color: '#ffff33' }}>
                Current: ${isVolumeManual ? volumeSliderValue : Math.round(fearGreedData?.marketVolume?.billions || volumeSliderValue)}B
              </span>
              <span>$150B</span>
            </div>
          </div>
        )}
        
        {/* Bottom message */}
        {/* <div style={{
          fontSize: '11px',
          textAlign: 'center',
          marginTop: '10px',
          padding: '5px',
          background: `${getColorForValue(displayValue)}20`,
          borderRadius: '5px',
          fontStyle: 'italic'
        }}>
          {isManualMode ? '⚡ Divine Control Active ⚡' : getMarketMessage(displayValue, classification)}
        </div> */}
      </div>
    );
  }
  
  // Desktop version
  const displayValue = isManualMode ? sliderValue : fearGreedData.value;
  const classification = displayValue < 25 ? 'Extreme Fear' : 
                        displayValue < 45 ? 'Fear' : 
                        displayValue < 55 ? 'Neutral' : 
                        displayValue < 75 ? 'Greed' : 'Extreme Greed';
  
  return (
    <div style={{
      position: 'absolute',
      bottom: '20px',
      left: '20px',
      zIndex: 100,
      background: 'rgba(255, 255, 255, 0.15)',
      padding: '25px',
      borderRadius: '20px',
      border: '1px solid rgba(255, 255, 255, 0.3)',
      color: 'white',
      fontFamily: 'monospace',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      boxShadow: `0 8px 32px rgba(0, 0, 0, 0.1), 0 0 20px ${getColorForValue(displayValue)}30`,
      minWidth: '250px'
    }}>
      <h2 style={{ 
        margin: '0 0 20px 0', 
        fontSize: '20px', 
        fontWeight: 'bold',
        textAlign: 'center',
        textShadow: '0 0 10px rgba(255,255,255,0.5)'
      }}>
        ✨ Market Sentiment ✨
      </h2>
      
      
      {/* Main Index Display */}
      <div style={{ 
        textAlign: 'center',
        marginBottom: '20px',
        padding: '15px',
        background: 'rgba(0,0,0,0.2)',
        borderRadius: '10px',
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        <div style={{ 
          fontSize: '64px', 
          fontWeight: 'bold', 
          color: getColorForValue(displayValue),
          textShadow: `0 0 20px ${getColorForValue(displayValue)}`,
          lineHeight: '1'
        }}>
          {displayValue}
        </div>
        <div style={{ 
          fontSize: '18px', 
          marginTop: '10px', 
          color: getColorForValue(displayValue),
          fontWeight: 'bold',
          letterSpacing: '2px'
        }}>
          {classification}
        </div>
      </div>
      
      {/* God Mode Slider - Always visible */}
      <div style={{
        marginBottom: '20px',
        padding: '15px',
        background: isManualMode ? 'linear-gradient(135deg, rgba(255,215,0,0.15), rgba(255,255,255,0.05))' : 'rgba(255,255,255,0.05)',
        borderRadius: '10px',
        border: isManualMode ? '2px solid rgba(255,215,0,0.4)' : '1px solid rgba(255,255,255,0.2)'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          marginBottom: '10px'
        }}>
          <div style={{ fontSize: '13px', fontWeight: 'bold' }}>
            🎮 Play God with Markets
          </div>
          <button
            onClick={toggleManualMode}
            style={{
              background: isManualMode ? 'linear-gradient(135deg, rgba(255,215,0,0.4), rgba(255,255,255,0.2))' : 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '6px',
              color: 'white',
              padding: '4px 12px',
              fontSize: '11px',
              cursor: 'pointer',
              fontWeight: 'bold',
              transition: 'all 0.3s ease'
            }}
          >
            {isManualMode ? '⚡ ACTIVE' : '📊 LIVE'}
          </button>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={sliderValue}
          onChange={handleSliderChange}
          disabled={!isManualMode}
          style={{
            width: '100%',
            height: '25px',
            borderRadius: '12px',
            background: `linear-gradient(to right, #ff3333 0%, #ff9933 25%, #ffff33 50%, #66ff66 75%, #00ff00 100%)`,
            outline: 'none',
            opacity: isManualMode ? 1 : 0.3,
            cursor: isManualMode ? 'pointer' : 'not-allowed',
            WebkitAppearance: 'none',
            appearance: 'none',
            filter: isManualMode ? 'none' : 'grayscale(50%)'
          }}
        />
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '5px',
          fontSize: '10px',
          opacity: 0.7
        }}>
          <span>😱 Fear</span>
          <span>⚖️</span>
          <span>🤑 Greed</span>
        </div>
        <style jsx>{`
          input[type="range"]::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            background: radial-gradient(circle, white, rgba(255,215,0,0.8));
            cursor: pointer;
            box-shadow: 0 0 15px rgba(255,215,0,0.9), 0 2px 5px rgba(0,0,0,0.3);
            border: 2px solid white;
          }
          input[type="range"]::-moz-range-thumb {
            width: 30px;
            height: 30px;
            border-radius: 50%;
            background: radial-gradient(circle, white, rgba(255,215,0,0.8));
            cursor: pointer;
            box-shadow: 0 0 15px rgba(255,215,0,0.9), 0 2px 5px rgba(0,0,0,0.3);
            border: 2px solid white;
          }
        `}</style>
      </div>
      
      {/* Visual Gauge */}
      {/* <div style={{
        width: '100%',
        height: '10px',
        background: 'rgba(0,0,0,0.3)',
        borderRadius: '5px',
        overflow: 'hidden',
        marginBottom: '20px',
        border: '1px solid rgba(255,255,255,0.2)'
      }}>
        <div style={{
          width: `${displayValue}%`,
          height: '100%',
          background: `linear-gradient(90deg, #ff3333, ${getColorForValue(displayValue)})`,
          transition: 'width 1s ease',
          boxShadow: `0 0 10px ${getColorForValue(displayValue)}`
        }} />
      </div> */}
      
      {/* Emoji Display */}
      {/* <div style={{
        fontSize: '16px',
        marginBottom: '15px',
        textAlign: 'center',
        padding: '10px',
        background: 'rgba(0,0,0,0.15)',
        borderRadius: '8px',
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        <div style={{ fontSize: '24px', marginBottom: '5px' }}>
          {getEmojiDisplay()}
        </div>
        <div style={{ fontSize: '12px', opacity: 0.8 }}>
          {showMoney > 0 && `${showMoney} Greed Emoji${showMoney > 1 ? 's' : ''}`}
          {showDevils > 0 && `${showDevils} Devil${showDevils > 1 ? 's' : ''}`}
          {showDevils > 0 && showAngels > 0 && ' • '}
          {showAngels > 0 && `${showAngels} Angel${showAngels > 1 ? 's' : ''}`}
        </div>
      </div> */}
      
      {/* Market Message */}
      {/* <div style={{
        fontSize: '13px',
        textAlign: 'center',
        padding: '10px',
        background: `${getColorForValue(displayValue)}20`,
        borderRadius: '8px',
        marginBottom: '15px',
        fontStyle: 'italic'
      }}>
        {isManualMode ? '⚡ Divine Market Control Active ⚡' : getMarketMessage(displayValue, classification)}
      </div> */}
      
      {/* Market Volume Display with Controls */}
      {fearGreedData?.marketVolume && (
        <div style={{
          marginBottom: '15px',
          padding: '15px',
          background: isVolumeManual ? 'linear-gradient(135deg, rgba(138,43,226,0.15), rgba(255,255,255,0.05))' : 'rgba(0,0,0,0.15)',
          borderRadius: '10px',
          border: isVolumeManual ? '2px solid rgba(138,43,226,0.4)' : '1px solid rgba(255,255,255,0.1)'
        }}>
          {/* Header with toggle */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            marginBottom: '10px'
          }}>
            <div style={{ fontSize: '12px', opacity: 0.7 }}>
              💰 24h Trading Volume
            </div>
            <button
              onClick={toggleVolumeManualMode}
              style={{
                background: isVolumeManual ? 'linear-gradient(135deg, rgba(138,43,226,0.4), rgba(255,255,255,0.2))' : 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '6px',
                color: 'white',
                padding: '2px 8px',
                fontSize: '10px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              {isVolumeManual ? '⚡ MANUAL' : '📊 LIVE'}
            </button>
          </div>
          
          {/* Current Volume */}
          <div style={{ 
            fontSize: '24px', 
            fontWeight: 'bold',
            color: (isVolumeManual ? volumeSliderValue : (fearGreedData?.marketVolume?.billions || volumeSliderValue)) > 100 ? '#00ff00' : 
                   (isVolumeManual ? volumeSliderValue : (fearGreedData?.marketVolume?.billions || volumeSliderValue)) > 60 ? '#ffff33' : '#ff9933',
            textShadow: '0 0 10px rgba(255,255,255,0.3)',
            textAlign: 'center'
          }}>
            ${isVolumeManual ? volumeSliderValue : Math.round(fearGreedData?.marketVolume?.billions || volumeSliderValue)}B
          </div>
          
          {/* 30-day Sparkline */}
          {volumeHistory.length > 0 && (() => {
            const minVol = Math.min(...volumeHistory);
            const maxVol = Math.max(...volumeHistory);
            const avgVol = volumeHistory.reduce((a, b) => a + b, 0) / volumeHistory.length;
            const currentVol = isVolumeManual ? volumeSliderValue : (fearGreedData?.marketVolume?.billions || volumeSliderValue);
            
            return (
              <div style={{ margin: '10px 0' }}>
                {/* Min/Max labels */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  fontSize: '9px',
                  opacity: 0.7,
                  marginBottom: '2px'
                }}>
                  <span style={{ color: '#ff9933' }}>Low: ${Math.round(minVol)}B</span>
                  <span style={{ color: '#ffffff' }}>Avg: ${Math.round(avgVol)}B</span>
                  <span style={{ color: '#00ff00' }}>High: ${Math.round(maxVol)}B</span>
                </div>
                
                <svg width="100%" height="50" viewBox="0 0 300 50" preserveAspectRatio="none">
                  {/* Background grid lines */}
                  <line x1="0" y1="5" x2="300" y2="5" stroke="rgba(0,255,0,0.1)" strokeWidth="1" strokeDasharray="2,2" />
                  <line x1="0" y1="25" x2="300" y2="25" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                  <line x1="0" y1="45" x2="300" y2="45" stroke="rgba(255,153,51,0.1)" strokeWidth="1" strokeDasharray="2,2" />
                  
                  {/* Volume line with gradient fill */}
                  <defs>
                    <linearGradient id="volumeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="rgba(138,43,226,0.3)" />
                      <stop offset="100%" stopColor="rgba(138,43,226,0)" />
                    </linearGradient>
                  </defs>
                  
                  <polygon
                    fill="url(#volumeGradient)"
                    points={(() => {
                      const range = maxVol - minVol || 1;
                      const points = volumeHistory.map((v, i) => {
                        const x = (i / (volumeHistory.length - 1)) * 300;
                        const y = 45 - ((v - minVol) / range) * 40;
                        return `${x},${y}`;
                      }).join(' ');
                      return points + ' 300,50 0,50';
                    })()}
                  />
                  
                  <polyline
                    fill="none"
                    stroke="rgba(138,43,226,0.8)"
                    strokeWidth="2"
                    points={(() => {
                      const range = maxVol - minVol || 1;
                      return volumeHistory.map((v, i) => {
                        const x = (i / (volumeHistory.length - 1)) * 300;
                        const y = 45 - ((v - minVol) / range) * 40;
                        return `${x},${y}`;
                      }).join(' ');
                    })()}
                  />
                  
                  {/* Current point with value label */}
                  <circle
                    cx="300"
                    cy={(() => {
                      const range = maxVol - minVol || 1;
                      return 45 - ((currentVol - minVol) / range) * 40;
                    })()}
                    r="4"
                    fill="#00ff00"
                    stroke="white"
                    strokeWidth="1"
                  />
                  
                  {/* Current value text */}
                  <text
                    x="295"
                    y={(() => {
                      const range = maxVol - minVol || 1;
                      const y = 45 - ((currentVol - minVol) / range) * 40;
                      return y > 25 ? y - 6 : y + 12;
                    })()}
                    fill="#00ff00"
                    fontSize="10"
                    textAnchor="end"
                    style={{ fontWeight: 'bold' }}
                  >
                    ${Math.round(currentVol)}B
                  </text>
                </svg>
                
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  fontSize: '9px',
                  opacity: 0.5,
                  marginTop: '2px'
                }}>
                  <span>30d ago</span>
                  <span>Today</span>
                </div>
              </div>
            );
          })()}
          
          {/* Volume Slider */}
          <input
            type="range"
            min="10"
            max="150"
            value={volumeSliderValue}
            onChange={handleVolumeSliderChange}
            disabled={!isVolumeManual}
            style={{
              width: '100%',
              height: '20px',
              borderRadius: '10px',
              background: `linear-gradient(to right, #ff9933 0%, #ffff33 40%, #66ff66 70%, #00ff00 100%)`,
              outline: 'none',
              opacity: isVolumeManual ? 1 : 0.3,
              cursor: isVolumeManual ? 'pointer' : 'not-allowed',
              WebkitAppearance: 'none',
              appearance: 'none',
              filter: isVolumeManual ? 'none' : 'grayscale(50%)',
              marginTop: '10px'
            }}
          />
          
          <div style={{ 
            fontSize: '10px', 
            opacity: 0.6,
            marginTop: '5px',
            textAlign: 'center'
          }}>
            {volumeSliderValue > 100 ? 'High Activity 🔥' :
             volumeSliderValue > 60 ? 'Normal Activity' : 
             'Low Activity ❄️'}
          </div>
        </div>
      )}
      
      {/* Update Info */}
      <div style={{ 
        fontSize: '11px', 
        textAlign: 'center',
        opacity: 0.8,
        borderTop: '1px solid rgba(255,255,255,0.2)',
        paddingTop: '10px',
        color: 'rgba(255,255,255,0.9)'
      }}>
        {isManualMode ? '🎮 Manual Control' : (fearGreedData?.simulated ? '📊 Simulated Data' : '🔄 Live Data')}
        <br />
        {isManualMode ? 'You control the market!' : 'Updates every 5 minutes'}
      </div>
    </div>
  );
};

export default FearGreedOverlay;