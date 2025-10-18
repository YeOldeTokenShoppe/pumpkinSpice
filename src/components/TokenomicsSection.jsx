"use client";

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

const TokenomicsSection = ({ isMobile = false }) => {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { threshold: 0.3 });

  return (
    <motion.div
      ref={sectionRef}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : {}}
      transition={{ duration: 0.8 }}
      style={{
        position: 'relative',
        margin: '4rem auto',
        width: isMobile ? '95%' : '90%',
        maxWidth: '1200px',
        zIndex: 1,
        pointerEvents: 'auto'
      }}
    >
      <div style={{
        background: 'rgba(0, 0, 0, 0.3)',
        border: '1px solid rgba(255, 215, 0, 0.2)',
        borderRadius: '30px',
        padding: isMobile ? '30px 20px' : '40px',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        
        {/* Glow effect */}
        <div style={{
          content: '',
          position: 'absolute',
          top: '-50%',
          left: '-50%',
          width: '200%',
          height: '200%',
          background: 'radial-gradient(circle, rgba(255, 215, 0, 0.05) 0%, transparent 70%)',
          animation: 'tokenomicsRotate 30s linear infinite',
          zIndex: 0
        }} />

        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '40px',
          position: 'relative',
          zIndex: 1
        }}>
          <h1 style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: isMobile ? '2em' : '2.5em',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #FFD700, #FFA500)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '8px'
          }}>
            TOKENOMICS
          </h1>
          
          <p style={{
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '1em'
          }}>
            𝓞𝖚𝖗 𝕷𝖆𝖉𝖞 𝔬𝔣 𝕻𝖊𝖗𝖕𝖊𝖙𝖚𝖆𝖑 𝕻𝖗𝖔𝖋𝖎𝖙 (RL80)
          </p>
        </div>

        {/* Main Content Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '350px 1fr',
          gap: isMobile ? '30px' : '40px',
          alignItems: 'start',
          position: 'relative',
          zIndex: 1
        }}>
          
          {/* Left Side - Pie Chart */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <div style={{
              position: 'relative',
              marginBottom: '30px'
            }}>
              <div style={{
                position: 'relative',
                width: isMobile ? '240px' : '280px',
                height: isMobile ? '240px' : '280px',
                margin: '0 auto'
              }}>
                {/* Pie Chart Image - you'll need to create/add this image */}
                <div style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  background: `conic-gradient(
                    from 0deg,
                    #FFD700 0deg 306deg,
                    #4CAF50 306deg 342deg,
                    #2196F3 342deg 360deg
                  )`,
                  position: 'relative',
                  filter: 'drop-shadow(0 10px 30px rgba(0, 0, 0, 0.5))'
                }}>
                  {/* Center circle with text */}
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: isMobile ? '120px' : '140px',
                    height: isMobile ? '120px' : '140px',
                    borderRadius: '50%',
                    background: '#0a0a0a',
                    border: '2px solid rgba(255,215,0,0.3)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <div style={{
                      fontSize: isMobile ? '2em' : '2.5em',
                      fontWeight: '800',
                      color: '#FFD700',
                      lineHeight: '1'
                    }}>
                      80B
                    </div>
                    <div style={{
                      color: 'rgba(255, 255, 255, 0.7)',
                      fontSize: isMobile ? '0.7em' : '0.8em',
                      textTransform: 'uppercase',
                      letterSpacing: '1px'
                    }}>
                      Total Supply
                    </div>
                  </div>
                </div>
                
                {/* External labels with better positioning */}
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  right: '-25px',
                  padding: '8px 12px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: '8px',
                  border: '1px solid #FFD700',
                  backdropFilter: 'blur(10px)'
                }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: '#FFD700',
                    marginBottom: '2px'
                  }}>
                    85%
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: 'rgba(255,255,255,0.9)',
                    whiteSpace: 'nowrap'
                  }}>
                    Liquidity Pool
                  </div>
                </div>
                
                <div style={{
                  position: 'absolute',
                  top: '5%',
                  left: '-15px',
                  padding: '8px 12px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: '8px',
                  border: '1px solid #4CAF50',
                  backdropFilter: 'blur(10px)'
                }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: '#4CAF50',
                    marginBottom: '2px'
                  }}>
                    10%
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: 'rgba(255,255,255,0.9)',
                    whiteSpace: 'nowrap'
                  }}>
                    Treasury
                  </div>
                </div>
                
                <div style={{
                  position: 'absolute',
                  top: '-20%',
                  left: '35%',
                  padding: '8px 12px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: '8px',
                  border: '1px solid #2196F3',
                  backdropFilter: 'blur(10px)'
                }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: '#2196F3',
                    marginBottom: '2px'
                  }}>
                    5%
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: 'rgba(255,255,255,0.9)',
                    whiteSpace: 'nowrap'
                  }}>
                    Marketing / CEX
                  </div>
                </div>
              </div>
              
              {/* Distribution Label */}
              <div style={{
                textAlign: 'center',
                marginTop: '20px'
              }}>
                <div style={{
                  fontSize: '1.1em',
                  fontWeight: '600',
                  color: '#FFD700',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}>
                  Distribution
                </div>
              </div>
   
            </div>
            
          </div>
          
          {/* Right Side - Tax & Features */}
          <div style={{
            display: 'grid',
            gap: '25px'
          }}>
            {/* Tax Structure Box */}
            <div style={{
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 215, 0, 0.2)',
              borderRadius: '20px',
              padding: '25px'
            }}>
              <h2 style={{
                fontSize: '1.3em',
                fontWeight: '700',
                marginBottom: '20px',
                color: '#FFD700',
                textAlign: 'center',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>
                Tax Structure
              </h2>
              
              <div style={{
                display: 'flex',
                justifyContent: 'space-around',
                marginBottom: '25px'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    fontSize: '3em',
                    fontWeight: '800',
                    background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    lineHeight: '1'
                  }}>
                    4%
                  </div>
                  <div style={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontSize: '0.9em',
                    marginTop: '5px'
                  }}>
                    Buy / Sell Tax
                  </div>
                </div>
              </div>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
                gap: '15px'
              }}>
                <div style={{
                  background: 'rgba(255, 215, 0, 0.05)',
                  border: '1px solid rgba(255, 215, 0, 0.2)',
                  borderRadius: '12px',
                  padding: '15px',
                  textAlign: 'center',
                  transition: 'all 0.3s ease'
                }}>
                  <div style={{ fontSize: '2em', marginBottom: '8px' }}>🕯️</div>
                  <div style={{
                    fontSize: '1.5em',
                    fontWeight: '700',
                    color: '#FFD700',
                    marginBottom: '5px'
                  }}>
                    2%
                  </div>
                  <div style={{
                    fontSize: '0.8em',
                    color: 'rgba(255, 255, 255, 0.7)'
                  }}>
                    Staking Rewards
                  </div>
                </div>
                
                <div style={{
                  background: 'rgba(255, 215, 0, 0.05)',
                  border: '1px solid rgba(255, 215, 0, 0.2)',
                  borderRadius: '12px',
                  padding: '15px',
                  textAlign: 'center',
                  transition: 'all 0.3s ease'
                }}>
                  <div style={{ fontSize: '2em', marginBottom: '8px' }}>💧</div>
                  <div style={{
                    fontSize: '1.5em',
                    fontWeight: '700',
                    color: '#FFD700',
                    marginBottom: '5px'
                  }}>
                    1.5%
                  </div>
                  <div style={{
                    fontSize: '0.8em',
                    color: 'rgba(255, 255, 255, 0.7)'
                  }}>
                    Auto-Liquidity
                  </div>
                </div>
                
                <div style={{
                  background: 'rgba(255, 215, 0, 0.05)',
                  border: '1px solid rgba(255, 215, 0, 0.2)',
                  borderRadius: '12px',
                  padding: '15px',
                  textAlign: 'center',
                  transition: 'all 0.3s ease'
                }}>
                  <div style={{ fontSize: '2em', marginBottom: '8px' }}>📢</div>
                  <div style={{
                    fontSize: '1.5em',
                    fontWeight: '700',
                    color: '#FFD700',
                    marginBottom: '5px'
                  }}>
                    0.5%
                  </div>
                  <div style={{
                    fontSize: '0.8em',
                    color: 'rgba(255, 255, 255, 0.7)'
                  }}>
                    Marketing
                  </div>
                </div>
              </div>
            </div>
            
            
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes tokenomicsRotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes pulseBurn {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </motion.div>
  );
};

export default TokenomicsSection;