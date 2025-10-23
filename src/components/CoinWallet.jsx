'use client';
import { useState, useEffect, useRef } from 'react';
import { Coins } from 'lucide-react';

export function CoinWallet({ balance = 0, showAnimation = false }) {
  const [displayBalance, setDisplayBalance] = useState(balance);
  const [isAnimating, setIsAnimating] = useState(false);
  const prevBalanceRef = useRef(balance);

  useEffect(() => {
    if (balance > prevBalanceRef.current) {
      // Add a 2-second delay before updating the wallet
      const delayTimer = setTimeout(() => {
        // Animate the balance increase
        const difference = balance - prevBalanceRef.current;
        const increment = difference / 30; // Animate over 30 frames
        let current = prevBalanceRef.current;
        
        setIsAnimating(true);
        
        const timer = setInterval(() => {
          current += increment;
          if (current >= balance) {
            setDisplayBalance(balance);
            clearInterval(timer);
            setIsAnimating(false);
          } else {
            setDisplayBalance(Math.floor(current));
          }
        }, 16); // ~60fps
        
        prevBalanceRef.current = balance;
      }, 2000); // 2-second delay
      
      return () => clearTimeout(delayTimer);
    } else {
      setDisplayBalance(balance);
      prevBalanceRef.current = balance;
    }
  }, [balance]);

  return (
    <>
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { 
            transform: scale(1);
            box-shadow: 0 0 20px rgba(255, 215, 0, 0.4);
          }
          50% { 
            transform: scale(1.05);
            box-shadow: 0 0 30px rgba(255, 215, 0, 0.6);
          }
        }
        
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        
        .coin-wallet {
          position: fixed;
          bottom: 30px;
          left: 30px;
          z-index: 100;
        }
        
        .wallet-container {
          position: relative;
          background: linear-gradient(135deg, 
            rgba(255, 215, 0, 0.15) 0%, 
            rgba(184, 134, 11, 0.15) 50%, 
            rgba(255, 215, 0, 0.15) 100%);
          backdrop-filter: blur(10px);
          border: 2px solid rgba(255, 215, 0, 0.3);
          border-radius: 20px;
          padding: 15px 25px;
          min-width: 200px;
          transition: all 0.3s ease;
          overflow: visible;
        }
        
        .wallet-container:hover {
          transform: translateY(-2px);
          border-color: rgba(255, 215, 0, 0.5);
          box-shadow: 0 10px 40px rgba(255, 215, 0, 0.3);
        }
        
        .wallet-container.animating {
          animation: pulse 0.5s ease;
          border-color: rgba(255, 215, 0, 0.6);
        }
        
        .wallet-content {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .coin-icon-wrapper {
          position: relative;
          width: 45px;
          height: 45px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .coin-icon-bg {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle, 
            rgba(255, 215, 0, 0.3) 0%, 
            rgba(255, 215, 0, 0.1) 40%, 
            transparent 70%);
          border-radius: 50%;
          animation: pulse 2s infinite;
        }
        
        .coin-icon {
          position: relative;
          width: 35px;
          height: 35px;
          background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 
            0 2px 10px rgba(255, 215, 0, 0.5),
            inset 0 1px 2px rgba(255, 255, 255, 0.5);
        }
        
        .coin-icon.animating {
          animation: pulse 0.3s ease;
        }
        
        .balance-wrapper {
          flex: 1;
        }
        
        .balance-label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: rgba(255, 215, 0, 0.7);
          margin-bottom: 2px;
        }
        
        .balance-amount {
          font-size: 24px;
          font-weight: bold;
          color: #FFD700;
          text-shadow: 
            0 0 10px rgba(255, 215, 0, 0.5),
            0 0 20px rgba(255, 215, 0, 0.3);
          font-family: 'Orbitron', monospace;
          background: linear-gradient(90deg, 
            #FFD700 0%, 
            #FFFFFF 50%, 
            #FFD700 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .balance-amount.animating {
          animation: shimmer 1s linear infinite;
        }
        
        .mystical-glow {
          position: absolute;
          inset: -20px;
          background: radial-gradient(circle at center, 
            rgba(255, 215, 0, 0.1) 0%, 
            transparent 70%);
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        
        .wallet-container.animating .mystical-glow {
          opacity: 1;
        }
      `}</style>
      
      <div className="coin-wallet">
        <div className={`wallet-container ${isAnimating ? 'animating' : ''}`}>
          <div className="mystical-glow" />
          
          <div className="wallet-content">
            <div className="coin-icon-wrapper">
              <div className="coin-icon-bg" />
              <div className={`coin-icon ${isAnimating ? 'animating' : ''}`}>
                <Coins size={20} color="#FFF" />
              </div>
            </div>
            
            <div className="balance-wrapper">
              <div className="balance-label">Coins</div>
              <div className={`balance-amount ${isAnimating ? 'animating' : ''}`}>
                {displayBalance.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}