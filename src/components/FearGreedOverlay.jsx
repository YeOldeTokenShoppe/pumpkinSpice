import React, { useState, useEffect } from 'react';

const FearGreedOverlay = ({ fearGreedData, showDevils, showAngels, showMoney, onManualControl, isManualMode }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [showSlider, setShowSlider] = useState(false);
  const [sliderValue, setSliderValue] = useState(50);
  
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
  }, [fearGreedData, isManualMode]);
  
  const handleSliderChange = (e) => {
    const value = parseInt(e.target.value);
    setSliderValue(value);
    if (onManualControl) {
      onManualControl(value);
    }
  };
  
  const toggleManualMode = () => {
    if (isManualMode && onManualControl) {
      onManualControl(null); // Return to live data
    } else if (onManualControl) {
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Left side - Index value */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div>
              <div style={{ 
                fontSize: '32px', 
                fontWeight: 'bold', 
                color: getColorForValue(displayValue),
                textShadow: `0 0 15px ${getColorForValue(displayValue)}`,
                lineHeight: '1'
              }}>
                {displayValue}
              </div>
              <div style={{ 
                fontSize: '11px', 
                color: getColorForValue(displayValue),
                marginTop: '2px'
              }}>
                {classification}
              </div>
            </div>
            
            {/* Visual bar */}
            <div style={{
              width: '60px',
              height: '6px',
              background: 'rgba(0,0,0,0.3)',
              borderRadius: '3px',
              overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.2)'
            }}>
              <div style={{
                width: `${displayValue}%`,
                height: '100%',
                background: getColorForValue(displayValue),
                transition: 'width 1s ease'
              }} />
            </div>
          </div>
          
          {/* Right side - Emojis */}
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '20px' }}>
              {getEmojiDisplay()}
            </div>
            <div style={{ fontSize: '10px', opacity: 0.8, marginTop: '2px' }}>
              {showMoney > 0 && `${showMoney} Greed`}
              {showDevils > 0 && `${showDevils} Devil${showDevils > 1 ? 's' : ''}`}
              {showDevils > 0 && showAngels > 0 && ' • '}
              {showAngels > 0 && `${showAngels} Angel${showAngels > 1 ? 's' : ''}`}
            </div>
          </div>
        </div>
        
        {/* God Mode Slider - Always visible */}
        <div style={{
          marginTop: '10px',
          padding: '10px',
          background: isManualMode ? 'rgba(255,215,0,0.15)' : 'rgba(255,255,255,0.05)',
          borderRadius: '8px',
          border: isManualMode ? '1px solid rgba(255,215,0,0.4)' : '1px solid rgba(255,255,255,0.2)'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            marginBottom: '5px'
          }}>
            <div style={{ fontSize: '11px', fontWeight: 'bold' }}>
              🎮 Play God
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
            style={{
              width: '100%',
              height: '20px',
              borderRadius: '10px',
              background: `linear-gradient(to right, #ff3333 0%, #ff9933 25%, #ffff33 50%, #66ff66 75%, #00ff00 100%)`,
              outline: 'none',
              opacity: isManualMode ? 1 : 0.6,
              cursor: 'pointer',
              WebkitAppearance: 'none',
              appearance: 'none'
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
        
        {/* Bottom message */}
        <div style={{
          fontSize: '11px',
          textAlign: 'center',
          marginTop: '10px',
          padding: '5px',
          background: `${getColorForValue(displayValue)}20`,
          borderRadius: '5px',
          fontStyle: 'italic'
        }}>
          {isManualMode ? '⚡ Divine Control Active ⚡' : getMarketMessage(displayValue, classification)}
        </div>
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
          style={{
            width: '100%',
            height: '25px',
            borderRadius: '12px',
            background: `linear-gradient(to right, #ff3333 0%, #ff9933 25%, #ffff33 50%, #66ff66 75%, #00ff00 100%)`,
            outline: 'none',
            opacity: isManualMode ? 1 : 0.7,
            cursor: 'pointer',
            WebkitAppearance: 'none',
            appearance: 'none'
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
      <div style={{
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
      </div>
      
      {/* Emoji Display */}
      <div style={{
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
      </div>
      
      {/* Market Message */}
      <div style={{
        fontSize: '13px',
        textAlign: 'center',
        padding: '10px',
        background: `${getColorForValue(displayValue)}20`,
        borderRadius: '8px',
        marginBottom: '15px',
        fontStyle: 'italic'
      }}>
        {isManualMode ? '⚡ Divine Market Control Active ⚡' : getMarketMessage(displayValue, classification)}
      </div>
      
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