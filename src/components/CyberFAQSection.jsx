'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import SkewedHeading from '@/components/SkewedHeading';

export default function CyberFAQSection({ isMobile = false }) {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { threshold: 0.3 });
  const [activeQuery, setActiveQuery] = useState(null);
  const [typedText, setTypedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [scanlinePos, setScanlinePos] = useState(0);

  // FAQ data with terminal-style queries
  const faqData = [
    {
      id: 'QUERY_001',
      command: '> QUERY: Product.Information',
      title: 'Product Information',
      response: ` ACCESSING DATABASE... 
      
Our flagship protocol combines cutting-edge DeFi technology with divine inspiration. Built on immutable smart contracts, it offers unparalleled staking rewards and community governance.

Key features include:
• Automated yield optimization
// • Sacred tokenomics blessed by Our Lady
• Intuitive interface for both degens and normies`,
      status: '[DATA.RETRIEVED]'
    },
    {
      id: 'QUERY_002', 
      command: '> QUERY: Shipping.Details',
      title: 'Shipping Details',
      response: ` LOADING LOGISTICS MODULE...

Digital assets are delivered instantly to your wallet address. No physical shipping required. 

Transaction details:
• Instant blockchain confirmation
• Gas-optimized smart contracts
• Real-time tracking via Etherscan
• 24/7 availability across all timezones`,
      status: '[PROTOCOL.ACTIVE]'
    },
    {
      id: 'QUERY_003',
      command: '> QUERY: Return.Policy',
      title: 'Return Policy',
      response: ` ACCESSING TERMS OF SERVICE...

All transactions are final and immutable on the blockchain. However, our Lady provides spiritual returns that are infinite.

Policy highlights:
• Permanent value accrual through staking
• Community support available 24/7
• Bug bounty program for protocol improvements`,
      status: '[TERMS.LOADED]'
    },
    {
      id: 'QUERY_004',
      command: '> QUERY: Payment.Options',
      title: 'Payment Options',
      response: ` INITIALIZING PAYMENT GATEWAY...

Accepted currencies:
• ETH (Ethereum)
• USDC / USDT / DAI
• Credit card via third-party providers
• All transactions secured by blockchain cryptography`,
      status: '[GATEWAY.READY]'
    },
    {
      id: 'QUERY_005',
      command: '> QUERY: Warranty.Information',
      title: 'Warranty Information',
      response: ` LOADING WARRANTY PROTOCOL...

Smart contracts are audited and verified. Your investment is protected by:
• Multi-sig treasury
• Time-locked liquidity
• Community governance
• Divine providence of Our Lady`,
      status: '[WARRANTY.ACTIVE]'
    },
    {
      id: 'QUERY_006',
      command: '> QUERY: Customer.Support',
      title: 'Customer Support',
      response: ` CONNECTING TO SUPPORT NETWORK...

Available channels:
• Discord: 24/7 community support
• Telegram: Real-time assistance
• Twitter: @OurLadyProtocol
• Prayer: Direct line to Our Lady

Response time: < 2 hours during US market hours`,
      status: '[SUPPORT.ONLINE]'
    }
  ];

  // Animate scanline
  useEffect(() => {
    const interval = setInterval(() => {
      setScanlinePos(prev => (prev + 1) % 100);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Typewriter effect for responses
  const typewriterEffect = (text, index) => {
    setIsTyping(true);
    setTypedText('');
    let charIndex = 0;
    
    const typeInterval = setInterval(() => {
      if (charIndex < text.length) {
        setTypedText(text.substring(0, charIndex + 1));
        charIndex++;
      } else {
        clearInterval(typeInterval);
        setIsTyping(false);
      }
    }, 20); // Slightly slower for better reliability

    return () => clearInterval(typeInterval);
  };

  const handleQueryClick = (index) => {
    if (activeQuery === index) {
      setActiveQuery(null);
      setTypedText('');
    } else {
      setActiveQuery(index);
      typewriterEffect(faqData[index].response, index);
    }
  };

  return (
    <motion.div
      ref={sectionRef}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : {}}
      transition={{ duration: 0.8 }}
      style={{
        position: 'relative',
        margin: '4rem auto',
        marginBottom: isMobile ? '4rem' : '12rem',
        width: isMobile ? '95%' : '90%',
        maxWidth: '1200px',
        zIndex: 1,
        pointerEvents: 'auto'
      }}
    >
      <div style={{
        background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.5), rgba(0, 20, 0, 0.4))',
        border: '2px solid #00ff00',
        borderRadius: '0',
        padding: isMobile ? '20px 15px' : '30px',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 0 40px rgba(0, 255, 0, 0.3), inset 0 0 40px rgba(0, 255, 0, 0.05)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        

        {/* Grid pattern overlay */}
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
              transparent 2px,
              rgba(0, 255, 0, 0.02) 2px,
              rgba(0, 255, 0, 0.02) 4px
            ),
            repeating-linear-gradient(
              90deg,
              transparent,
              transparent 2px,
              rgba(0, 255, 0, 0.02) 2px,
              rgba(0, 255, 0, 0.02) 4px
            )
          `,
          pointerEvents: 'none',
        }} />

        {/* Terminal header */}
        <div style={{
          marginBottom: '30px',
          paddingBottom: '15px',
          borderBottom: '1px solid rgba(0, 255, 0, 0.3)',
          position: 'relative',
          zIndex: 1
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '10px'
          }}>
            <div style={{
              fontSize: '12px',
              color: '#00ff00',
              fontFamily: 'monospace',
              opacity: 0.7,
              letterSpacing: '2px'
            }}>
              [ORACLE.DIVINE.WISDOM.v2.0]
            </div>
            <div style={{
              display: 'flex',
              gap: '8px',
              alignItems: 'center'
            }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#00ff00',
                boxShadow: '0 0 10px #00ff00',
                animation: 'pulse 2s infinite'
              }} />
              <span style={{
                fontSize: '10px',
                color: '#00ff00',
                fontFamily: 'monospace',
                opacity: 0.7
              }}>
                CONNECTED
              </span>
            </div>
          </div>
          
   <SkewedHeading 
      lines={["FAQ::TERMINAL"]}
      // colors={["#d4af37", "#f4e4c1", "#ffd700"]}
          colors={["#00ff00"]}
      fontSize={{ mobile: "2.5rem", desktop: "3rem" }}
      isMobile={isMobile}
    />
          
          <div style={{
            textAlign: 'center',
            marginTop: '10px',
            fontSize: '12px',
            color: '#00ff00',
            fontFamily: 'monospace',
            opacity: 0.5,
            letterSpacing: '1px'
          }}>
            {'< ACCESS.GRANTED :: QUERY.MODE.ACTIVE >'}
          </div>
        </div>

        <div style={{
          display: 'flex',
          gap: isMobile ? '20px' : '40px',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: 'flex-start',
          position: 'relative',
          zIndex: 1
        }}>
          {/* Virgin Mary card with cyber enhancements */}
          <div style={{
            flex: isMobile ? '1' : '0 0 300px',
            position: 'relative',
            alignSelf: isMobile ? 'center' : 'flex-start'
          }}>
            <div style={{
              position: 'relative',
              padding: '10px',
              background: 'rgba(0, 0, 0, 0.6)',
              border: '2px solid #00ff00',
              borderRadius: '10px',
              overflow: 'hidden'
            }}>
              {/* Corner brackets */}
              <div style={{
                position: 'absolute',
                top: '0',
                left: '0',
                width: '20px',
                height: '20px',
                borderTop: '2px solid #ffd700',
                borderLeft: '2px solid #ffd700',
              }} />
              <div style={{
                position: 'absolute',
                top: '0',
                right: '0',
                width: '20px',
                height: '20px',
                borderTop: '2px solid #ffd700',
                borderRight: '2px solid #ffd700',
              }} />
              <div style={{
                position: 'absolute',
                bottom: '0',
                left: '0',
                width: '20px',
                height: '20px',
                borderBottom: '2px solid #ffd700',
                borderLeft: '2px solid #ffd700',
              }} />
              <div style={{
                position: 'absolute',
                bottom: '0',
                right: '0',
                width: '20px',
                height: '20px',
                borderBottom: '2px solid #ffd700',
                borderRight: '2px solid #ffd700',
              }} />
              
              <div style={{
                position: 'relative',
                width: '100%',
                borderRadius: '5px',
                overflow: 'hidden'
              }}>
                <img 
                  src="/queenOfHearts1.jpg"
                  alt="Our Lady - Divine Oracle" 
                  style={{
                    width: '100%',
                    height: 'auto',
                    borderRadius: '5px',
                    filter: 'brightness(1.2) contrast(1.3) saturate(1.2) drop-shadow(2px 0px 0px rgba(255, 0, 100, 0.5)) drop-shadow(-2px 0px 0px rgba(0, 255, 255, 0.5))',
                    boxShadow: '0 0 30px rgba(255, 215, 0, 0.3), 0 0 60px rgba(0, 255, 0, 0.2)',
                    animation: 'transmissionGlitch1 3.7s infinite linear, transmissionGlitch2 5.3s infinite linear, transmissionGlitch3 7.1s infinite linear'
                  }}
                />
                
                {/* Transmission interference lines */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: `
                    repeating-linear-gradient(
                      0deg,
                      transparent 0px,
                      transparent 2px,
                      rgba(0, 255, 0, 0.02) 2px,
                      rgba(0, 255, 0, 0.02) 4px
                    )
                  `,
                  animation: 'scanlines 0.1s infinite linear',
                  pointerEvents: 'none',
                  zIndex: 2
                }} />
                
                {/* Signal disruption bars */}
                <div style={{
                  position: 'absolute',
                  top: '20%',
                  left: 0,
                  right: 0,
                  height: '2px',
                  background: 'rgba(255, 255, 255, 0.8)',
                  animation: 'signalBar1 4.2s infinite linear, signalBarRandom1 6.8s infinite linear',
                  pointerEvents: 'none',
                  zIndex: 3
                }} />
                
                <div style={{
                  position: 'absolute',
                  top: '60%',
                  left: 0,
                  right: 0,
                  height: '1px',
                  background: 'rgba(0, 255, 255, 0.6)',
                  animation: 'signalBar2 7.4s infinite linear, signalBarRandom2 9.1s infinite linear',
                  pointerEvents: 'none',
                  zIndex: 3
                }} />
              </div>
              
              {/* Holographic overlay effect */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(45deg, transparent 30%, rgba(0, 255, 0, 0.1) 50%, transparent 70%)',
                animation: 'holographicScan 3s linear infinite',
                pointerEvents: 'none',
              }} />
              
              {/* Oracle status */}
              <div style={{
                position: 'absolute',
                bottom: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                padding: '5px 15px',
                background: 'rgba(0, 0, 0, 0.9)',
                border: '1px solid #ffd700',
                borderRadius: '20px',
                fontSize: '11px',
                color: '#ffd700',
                fontFamily: 'monospace',
                letterSpacing: '1px',
                textTransform: 'uppercase',
                boxShadow: '0 0 20px rgba(255, 215, 0, 0.5)',
              }}>
                [ORACLE.ACTIVE]
              </div>
            </div>
            
            {/* Sacred Terminal Label */}
            <div style={{
              marginTop: '15px',
              textAlign: 'center',
              fontSize: '10px',
              color: '#ffd700',
              fontFamily: 'monospace',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              opacity: 0.7
            }}>
              :: DIVINE.GUIDANCE.PROTOCOL ::
            </div>
          </div>

          {/* FAQ Queries */}
          <div style={{
            flex: 1,
            width: '100%'
          }}>
            {faqData.map((faq, index) => (
              <div key={faq.id} style={{ marginBottom: '15px' }}>
                <motion.div
                  onClick={() => handleQueryClick(index)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    padding: '15px',
                    background: activeQuery === index 
                      ? 'rgba(0, 255, 0, 0.15)' 
                      : 'rgba(0, 0, 0, 0.4)',
                    border: activeQuery === index 
                      ? '2px solid #00ff00' 
                      : '1px solid rgba(0, 255, 0, 0.3)',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <div style={{
                        fontSize: '10px',
                        color: '#00ff00',
                        fontFamily: 'monospace',
                        marginBottom: '5px',
                        opacity: 0.6
                      }}>
                        {faq.command}
                      </div>
                      <div style={{
                        fontSize: isMobile ? '14px' : '16px',
                        color: '#fff',
                        fontFamily: 'monospace',
                        fontWeight: 'bold',
                        letterSpacing: '1px'
                      }}>
                        {faq.title}
                      </div>
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}>
                      {activeQuery === index && (
                        <span style={{
                          fontSize: '10px',
                          color: '#00ff00',
                          fontFamily: 'monospace',
                          opacity: 0.7
                        }}>
                          {faq.status}
                        </span>
                      )}
                      <span style={{
                        fontSize: '20px',
                        color: '#00ff00',
                        transform: activeQuery === index ? 'rotate(180deg)' : 'rotate(0)',
                        transition: 'transform 0.3s ease'
                      }}>
                        ▼
                      </span>
                    </div>
                  </div>
                  
                  {activeQuery === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      style={{
                        marginTop: '15px',
                        paddingTop: '15px',
                        borderTop: '1px solid rgba(0, 255, 0, 0.2)',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                    >
                      {/* Animated scanline for this answer only */}
                      <div style={{
                        position: 'absolute',
                        top: `${scanlinePos}%`,
                        left: 0,
                        right: 0,
                        height: '2px',
                        background: 'linear-gradient(90deg, transparent, rgba(0, 255, 0, 0.6), transparent)',
                        opacity: 0.8,
                        pointerEvents: 'none',
                        zIndex: 2
                      }} />
                      
                      <div style={{
                        color: '#00ff00',
                        fontFamily: 'monospace',
                        fontSize: isMobile ? '12px' : '14px',
                        lineHeight: '1.8',
                        whiteSpace: 'pre-line',
                        position: 'relative',
                        zIndex: 1
                      }}>
                        {typedText}
                        {isTyping && <span style={{ 
                          animation: 'blink 0.5s infinite',
                          marginLeft: '2px'
                        }}>_</span>}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              </div>
            ))}
          </div>
        </div>

        {/* Terminal footer */}
        <div style={{
          marginTop: '30px',
          paddingTop: '15px',
          borderTop: '1px solid rgba(0, 255, 0, 0.3)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'relative',
          zIndex: 1
        }}>
          <div style={{
            fontSize: '10px',
            color: '#00ff00',
            fontFamily: 'monospace',
            opacity: 0.5
          }}>
            TERMINAL.SESSION.ID: {Math.random().toString(36).substring(2, 8).toUpperCase()}
          </div>
          <div style={{
            fontSize: '10px',
            color: '#ffd700',
            fontFamily: 'monospace',
            opacity: 0.5
          }}>
            VERIFIED.BY.OUR.LADY
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            box-shadow: 0 0 10px currentColor;
          }
          50% {
            opacity: 0.5;
            box-shadow: 0 0 20px currentColor;
          }
        }
        
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        
        @keyframes holographicScan {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        
        @keyframes transmissionGlitch1 {
          0%, 97%, 100% { opacity: 1; }
          98% { opacity: 0.4; }
          99% { opacity: 0.8; }
        }
        
        @keyframes transmissionGlitch2 {
          0%, 92%, 100% { 
            filter: brightness(1.2) contrast(1.3) saturate(1.2) drop-shadow(2px 0px 0px rgba(255, 0, 100, 0.5)) drop-shadow(-2px 0px 0px rgba(0, 255, 255, 0.5));
          }
          93% { 
            filter: brightness(1.8) contrast(2.0) saturate(2.0) drop-shadow(6px 0px 0px rgba(255, 0, 100, 1.0)) drop-shadow(-6px 0px 0px rgba(0, 255, 255, 1.0));
          }
          94% { 
            filter: brightness(0.8) contrast(0.9) saturate(0.5) drop-shadow(1px 0px 0px rgba(255, 0, 100, 0.2)) drop-shadow(-1px 0px 0px rgba(0, 255, 255, 0.2));
          }
          95% { 
            filter: brightness(1.6) contrast(1.8) saturate(1.8) drop-shadow(4px 0px 0px rgba(255, 0, 100, 0.8)) drop-shadow(-4px 0px 0px rgba(0, 255, 255, 0.8));
          }
        }
        
        @keyframes transmissionGlitch3 {
          0%, 88%, 100% { transform: translateX(0px); }
          // 89% { transform: translateX(2px); }
          // 90% { transform: translateX(-1px); }
          // 91% { transform: translateX(1px); }
          // 92% { transform: translateX(0px); }
        }
        
        @keyframes scanlines {
          0% { transform: translateY(0px); }
          100% { transform: translateY(4px); }
        }
        
        @keyframes signalBar1 {
          0%, 94%, 100% { opacity: 0; }
          95% { opacity: 0.8; transform: translateX(20%); }
          96% { opacity: 0.6; transform: translateX(-10%); }
          97% { opacity: 0; }
        }
        
        @keyframes signalBarRandom1 {
          0%, 83%, 100% { opacity: 0; }
          84% { opacity: 1; transform: translateX(-25%); }
          85% { opacity: 0.5; transform: translateX(15%); }
          86% { opacity: 0; }
        }
        
        @keyframes signalBar2 {
          0%, 91%, 100% { opacity: 0; }
          92% { opacity: 0.7; transform: translateY(-2px); }
          93% { opacity: 0.3; transform: translateY(1px); }
          94% { opacity: 0; }
        }
        
        @keyframes signalBarRandom2 {
          0%, 79%, 100% { opacity: 0; }
          80% { opacity: 0.9; transform: translateY(-4px); }
          81% { opacity: 0.4; transform: translateY(2px); }
          82% { opacity: 0; }
        }
        
      `}</style>
    </motion.div>
  );
}