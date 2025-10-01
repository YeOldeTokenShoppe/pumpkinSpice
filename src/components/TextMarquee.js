// components/TextMarquee.js
"use client";
import React from "react";
import ReactDOM from "react-dom";
import Marquee from "react-fast-marquee";
import { Text } from "./text";
import { useFirestoreResults } from "@/utilities/useFirestoreResults";

const TextItem = ({ image }) => {
  const [showTooltip, setShowTooltip] = React.useState(false);
  const [mousePos, setMousePos] = React.useState({ x: 0, y: 0 });
  
  // Determine candle type based on burnedAmount
  const getCandleType = (amount) => {
    if (amount > 1000000) return 'most-bullish';        // Over 1M tokens
    if (amount >= 100001) return 'second-most-bullish'; // 100,001 - 1M tokens
    if (amount >= 20000) return 'normal-bullish';       // 20K - 100K tokens
    if (amount >= 5000) return 'neutral-bullish';       // 5K - 20K tokens
    return 'least-bullish';                             // Less than 5K tokens
  };

  const candleType = getCandleType(image.burnedAmount || 0);

  // Get tier label and description for tooltip
  const getTierInfo = (type) => {
    switch(type) {
      case 'most-bullish':
        return {
          label: '🔥 GOD CANDLE / BULLISH MARUBOZU',
          range: '1M+ tokens burned',
          description: 'Maximum bullish momentum'
        };
      case 'second-most-bullish':
        return {
          label: 'HAMMER CANDLE', 
          range: '100K-1M tokens burned',
          description: 'Long lower wick - Strong bullish signal'
        };
      case 'normal-bullish':
        return {
          label: 'BULLISH ENGULFING',
          range: '20K-100K tokens burned',
          description: 'Upward trend - Solid bullish pattern'
        };
      case 'neutral-bullish':
        return {
          label: 'SPINNING TOP / NEUTRAL BULLISH',
          range: '5K-20K tokens burned',
          description: 'Wicks on both ends - Emerging bullish trend'
        };
      case 'least-bullish':
        return {
          label: 'DOJI CANDLE',
          range: 'Under 5K tokens burned',
          description: 'Small body, long wicks - indecision'
        };
      default:
        return {
          label: 'TIER',
          range: '',
          description: ''
        };
    }
  };

  const tierInfo = getTierInfo(candleType);

  // Different candle configurations based on type
  const getCandleConfig = (type) => {
    switch(type) {
      case 'most-bullish':
        // Full body, no wicks (most bullish pattern)
        return {
          topWickHeight: 0,
          bodyHeight: 30,
          bottomWickHeight: 0,
          bodyTop: 5
        };
      case 'second-most-bullish':
        // Hammer pattern - small top wick, large body
        return {
          topWickHeight: 5,
          bodyHeight: 20,
          bottomWickHeight: 10,
          bodyTop: 5
        };
      case 'normal-bullish':
        // Standard bullish - balanced
        return {
          topWickHeight: 8,
          bodyHeight: 16,
          bottomWickHeight: 8,
          bodyTop: 8
        };
      case 'neutral-bullish':
        // Smaller body with wicks
        return {
          topWickHeight: 10,
          bodyHeight: 12,
          bottomWickHeight: 10,
          bodyTop: 10
        };
      case 'least-bullish':
        // Doji-like - thin body with long wicks
        return {
          topWickHeight: 12,
          bodyHeight: 8,
          bottomWickHeight: 12,
          bodyTop: 12
        };
      default:
        return {
          topWickHeight: 10,
          bodyHeight: 20,
          bottomWickHeight: 10,
          bodyTop: 10
        };
    }
  };

  const config = getCandleConfig(candleType);

  return (
    <div className="mx-64 relative flex items-center" style={{ paddingLeft: '80px', paddingRight: '80px' }}>
      <Text style={{ 
        fontSize: "2rem",
        fontFamily: "'Bebas Neue', sans-serif",
        fontWeight: "bold"
      }}>
        <span 
          onMouseEnter={(e) => {
            setShowTooltip(true);
            const rect = e.currentTarget.getBoundingClientRect();
            setMousePos({ x: rect.left + rect.width / 2, y: rect.top });
          }}
          onMouseLeave={() => setShowTooltip(false)}
          style={{
          display: 'inline-block',
          position: 'relative',
          width: '20px',
          height: '40px',
          marginLeft: '15px',
          marginRight: '15px',
          verticalAlign: 'middle',
          cursor: 'help'
        }}>
          {/* Custom Tooltip rendered via Portal */}
          {showTooltip && typeof document !== 'undefined' && ReactDOM.createPortal(
            <span style={{
              position: 'fixed',
              top: `${mousePos.y - 80}px`,
              left: `${mousePos.x}px`,
              transform: 'translateX(-50%)',
              backgroundColor: 'rgba(0, 0, 0, 0.95)',
              color: 'white',
              padding: '12px 16px',
              borderRadius: '8px',
              fontSize: '0.9rem',
              fontWeight: 'normal',
              whiteSpace: 'nowrap',
              zIndex: 9999,
              border: '2px solid #00ff00',
              minWidth: '180px',
              textAlign: 'center',
              boxShadow: '0 4px 12px rgba(0, 255, 0, 0.3)',
              pointerEvents: 'none'
            }}>
              <span style={{ display: 'block', color: '#00ff00', fontWeight: 'bold', marginBottom: '6px' }}>
                {tierInfo.label}
              </span>
              <span style={{ display: 'block', color: 'orange', fontSize: '0.8rem', marginBottom: '4px' }}>
                {tierInfo.range}
              </span>
              <span style={{ display: 'block', fontSize: '0.75rem', fontStyle: 'italic', color: '#ccc' }}>
                {tierInfo.description}
              </span>
              {/* Arrow pointing down */}
              <span style={{
                position: 'absolute',
                bottom: '-8px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: 0,
                height: 0,
                borderLeft: '8px solid transparent',
                borderRight: '8px solid transparent',
                borderTop: '8px solid #00ff00'
              }}></span>
            </span>,
            document.body
          )}
          {/* Top wick */}
          {config.topWickHeight > 0 && (
            <span style={{
              position: 'absolute',
              left: '50%',
              top: '0',
              width: '2px',
              height: `${config.topWickHeight}px`,
              backgroundColor: '#00ff00',
              transform: 'translateX(-50%)'
            }}></span>
          )}
          {/* Candle body */}
          <span style={{
            position: 'absolute',
            left: '50%',
            top: `${config.bodyTop}px`,
            width: '12px',
            height: `${config.bodyHeight}px`,
            backgroundColor: '#00ff00',
            transform: 'translateX(-50%)'
          }}></span>
          {/* Bottom wick */}
          {config.bottomWickHeight > 0 && (
            <span style={{
              position: 'absolute',
              left: '50%',
              bottom: `${40 - config.bodyTop - config.bodyHeight - config.bottomWickHeight}px`,
              width: '2px',
              height: `${config.bottomWickHeight}px`,
              backgroundColor: '#00ff00',
              transform: 'translateX(-50%)'
            }}></span>
          )}
        </span>
        <span style={{ color: "white" }}>{image.userName || image.username || "Anonymous"}</span>
        <span style={{ color: "orange" }}> - Burned: {(image.burnedAmount || 0).toLocaleString()} tokens</span>
        {"         "}{"       "}{"    "}{"         "} 
        <span style={{fontSize: '1.5rem', color: 'white', verticalAlign: 'middle', position: 'relative', top: '-0.5rem'
        }}> </span>{"         "}{"       "}
      </Text>
    </div>
  );
};

const TextMarquee = ({ images, useFirestore = true }) => {
  // Fetch results from Firestore if useFirestore is true
  const firestoreResults = useFirestoreResults();
  
  // Use Firestore data if available and enabled, otherwise use passed images prop
  const dataToDisplay = useFirestore && firestoreResults.length > 0 
    ? firestoreResults 
    : images || [];

  // Return null if no data to display
  if (dataToDisplay.length === 0) {
    return null;
  }

  return (
    <div
      className="relative mt-8"
      style={{
        background: 'rgba(0, 0, 0, 0.8)',
        borderTop: '2px solid #00ff00',
        borderBottom: '2px solid #00ff00',
        boxShadow: '0 0 20px rgba(0, 255, 0, 0.2), inset 0 0 20px rgba(0, 255, 0, 0.05)',
        // padding: '12px 0',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Ticker label */}
      <div style={{
        position: 'absolute',
        left: '0',
        top: '50%',
        transform: 'translateY(-50%)',
        backgroundColor: '#00ff00',
        color: '#000',
        padding: '4px 12px',
        fontFamily: "'Bebas Neue', sans-serif",
        fontWeight: 'bold',
        fontSize: '1.2rem',
        zIndex: 10,
        borderRight: '3px solid #000'
      }}>
        LIVE
      </div>
      
      {/* Grid pattern overlay for ticker feel */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `
          repeating-linear-gradient(
            0deg,
            transparent,
            transparent 10px,
            rgba(0, 255, 0, 0.02) 10px,
            rgba(0, 255, 0, 0.02) 11px
          )
        `,
        pointerEvents: 'none'
      }} />
      
      <Marquee
        pauseOnHover
        speed={30}
        gradient={false}
        loop={0}
        style={{ 
          height: "100%", 
          overflow: "hidden",
          paddingLeft: '60px' // Space for LIVE label
        }}
      >
        {dataToDisplay.map((image, index) => (
          <TextItem key={index} image={image} />
        ))}
      </Marquee>
    </div>
  );
};

export default TextMarquee;
