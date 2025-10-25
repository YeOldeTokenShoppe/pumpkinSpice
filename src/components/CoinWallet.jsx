'use client';
import { useState, useEffect, useRef } from 'react';

// Handbag icon component
const HandbagIcon = ({ size = 24 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2.048 18.566A2 2 0 0 0 4 21h16a2 2 0 0 0 1.952-2.434l-2-9A2 2 0 0 0 18 8H6a2 2 0 0 0-1.952 1.566z"/>
    <path d="M8 11V6a4 4 0 0 1 8 0v5"/>
  </svg>
);

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
          bottom: 2rem;
          left: 2rem;
          z-index: 999;
        }
        
        .wallet-button {
          width: 4rem;
          height: 4rem;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border: 2px solid rgba(255, 215, 0, 0.3);
          color: #FFD700;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
          position: relative;
          overflow: hidden;
          padding: 0;
        }
        
        .wallet-button:hover {
          width: 140px;
          border-radius: 30px;
          background: rgba(255, 215, 0, 0.2);
          border-color: rgba(255, 215, 0, 0.6);
          box-shadow: 0 6px 20px rgba(255, 215, 0, 0.4);
          padding: 0 18px 0 18px;
          justify-content: space-between;
        }
        
        .wallet-button.animating {
          animation: pulse 0.5s ease;
        }
        
        .wallet-icon {
          flex-shrink: 0;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
        }
        
        .wallet-button:hover .wallet-icon {
          position: static;
          transform: none;
        }
        
        .balance-content {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          opacity: 0;
          transform: translateX(20px);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          margin-left: 12px;
          white-space: nowrap;
        }
        
        .wallet-button:hover .balance-content {
          opacity: 1;
          transform: translateX(0);
        }
        
        .balance-label {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: rgba(255, 215, 0, 0.7);
          margin-bottom: 1px;
        }
        
        .balance-amount {
          font-size: 16px;
          font-weight: bold;
          color: #FFD700;
          text-shadow: 
            0 0 8px rgba(255, 215, 0, 0.5),
            0 0 16px rgba(255, 215, 0, 0.3);
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
      `}</style>
      
      <div className="coin-wallet">
        <div className={`wallet-button ${isAnimating ? 'animating' : ''}`}>
          <div className="wallet-icon">
            <HandbagIcon size={32} />
          </div>
          
          <div className="balance-content">
            <div className="balance-label">Coins</div>
            <div className={`balance-amount ${isAnimating ? 'animating' : ''}`}>
              {displayBalance.toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}