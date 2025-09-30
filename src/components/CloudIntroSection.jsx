'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform, useInView, useSpring } from 'framer-motion';
import DropInTitle from './DropInTitle';


// Floating cloud particles component
const CloudParticle = ({ delay = 0, duration = 20, index = 0 }) => {
  // Use deterministic values based on index instead of Math.random()
  const [position, setPosition] = useState({ y: 50, size: 50 });
  
  useEffect(() => {
    // Set random values only on client side after mount
    const seed = index * 37; // Pseudo-random based on index
    const randomY = ((seed * 13) % 100);
    const randomSize = 30 + ((seed * 17) % 70);
    setPosition({ y: randomY, size: randomSize });
  }, [index]);
  
  return (
    <motion.div
      initial={{ x: -100, opacity: 0 }}
      animate={{ 
        x: ['-10%', '110%'],
        y: [position.y - 10, position.y + 10, position.y - 10],
        opacity: [0, 0.3, 0.3, 0]
      }}
      transition={{
        duration: duration,
        delay: delay,
        repeat: Infinity,
        ease: "linear"
      }}
      style={{
        position: 'absolute',
        top: `${position.y}%`,
        width: `${position.size}px`,
        height: `${position.size}px`,
        // background: 'radial-gradient(ellipse, rgba(255,255,255,0.8) 0%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(8px)',
        pointerEvents: 'none',
      }}
    />
  );
};

// Animated counter component
const AnimatedCounter = ({ target, suffix = '', prefix = '', duration = 2 }) => {
  const [count, setCount] = useState(0);
  const countRef = useRef(null);
  const isInView = useInView(countRef, { once: true });
  
  useEffect(() => {
    if (!isInView) return;
    
    let startTime;
    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = (timestamp - startTime) / (duration * 1000);
      
      if (progress < 1) {
        setCount(Math.floor(target * progress));
        requestAnimationFrame(animate);
      } else {
        setCount(target);
      }
    };
    
    requestAnimationFrame(animate);
  }, [isInView, target, duration]);
  
  return (
    <span ref={countRef}>
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
};

// Main CloudIntroSection component
export default function CloudIntroSection({ scrollY = 0, isMobile = false }) {
  const sectionRef = useRef(null);
  const cardRefs = useRef([]);
  const [flippedCards, setFlippedCards] = useState(new Set());
  const [hoveredCard, setHoveredCard] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const isInView = useInView(sectionRef, { 
    once: false, 
    margin: "-100px" 
  });
  
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });
  
  // Parallax transformations
  const cloudOpacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [1, 0.8, 0.3, 0]);
  const welcomeY = useTransform(scrollYProgress, [0, 0.5], [100, 0]);
  const welcomeOpacity = useTransform(scrollYProgress, [0, 0.3], [0, 1]);
  
  // Spring animations for smooth transitions
  const smoothCloudOpacity = useSpring(cloudOpacity, {
    stiffness: 100,
    damping: 30
  });
  
  // Handle card flip
  const handleCardFlip = (cardIndex) => {
    setFlippedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cardIndex)) {
        newSet.delete(cardIndex);
      } else {
        newSet.add(cardIndex);
      }
      return newSet;
    });
  };
  
  // Handle mouse movement for card tilt effect
  const handleCardMouseMove = (e, cardId) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const cardCenterX = rect.left + rect.width / 2;
    const cardCenterY = rect.top + rect.height / 2;
    
    // Calculate mouse position relative to card center (-1 to 1)
    const x = (e.clientX - cardCenterX) / (rect.width / 2);
    const y = (e.clientY - cardCenterY) / (rect.height / 2);
    
    setMousePosition({ x, y });
    setHoveredCard(cardId);
  };
  
  const handleCardMouseLeave = () => {
    setMousePosition({ x: 0, y: 0 });
    setHoveredCard(null);
  };
  
  // Calculate tilt values based on mouse position
  const getTiltStyles = (cardId) => {
    if (hoveredCard !== cardId) {
      return {
        transform: 'rotateY(0deg) rotateX(0deg)',
        transition: 'transform 0.3s ease-out',
      };
    }
    
    // Match home2 implementation: mouseX affects Y rotation, mouseY affects X rotation
    const rX = mousePosition.x * 30; // Rotation on Y axis (left-right tilt)
    const rY = mousePosition.y * -30; // Rotation on X axis (up-down tilt)
    
    return {
      transform: `rotateY(${rX}deg) rotateX(${rY}deg)`,
      transition: 'transform 0.1s ease-out',
    };
  };
  
  // Card data
  const cards = [
    {
      id: 0,
      frontTitle: "Divine Purpose",
      frontDescription: "Bridging sacred wisdom with blockchain innovation for a blessed financial future",
      backTitle: "Sacred Mission",
      backContent: "Our Lady of Perpetual Profit guides the faithful through:",
      backList: [
        "Community-driven governance and decision making",
        "Charitable initiatives supporting global causes",
        "Educational programs for crypto enlightenment",
        "Sustainable tokenomics for long-term growth"
      ],
      backQuote: "Where faith meets fortune, miracles happen.",
      backgroundImage: 'linear-gradient(rgba(212, 175, 55, 0.3), rgba(0, 0, 0, 0.2)), url("/images/teknoir.jpg")'
    },
    {
      id: 1,
      frontTitle: "$RL80 Token",
      frontDescription: "The Holy Trinity of digital assets - liquid80, util80, and integr80",
      backTitle: "The Sacred Trinity of $RL80",
      backContent: "Experience the divine trifecta of cryptocurrency innovation:",
      backList: [
        "Liquid80: Deep liquidity pools ensuring smooth trades",
        "Util80: Real-world utility through DeFi integrations",
        "Integr80: Seamless cross-chain compatibility",
        "Built on BASE for low fees and high speed"
      ],
      backStats: {
        supply: "1,000,000,000 $RL80",
        tax: "0% Buy/Sell",
        liquidity: "Locked Forever"
      },
      backgroundImage: 'linear-gradient(rgba(212, 175, 55, 0.3), rgba(0, 0, 0, 0.2)), url("/vsClown.jpg")'
    },
    {
      id: 2,
      frontTitle: "Join the Sanctuary",
      frontDescription: "Your path to enlightenment and perpetual profit in the new economy",
      backTitle: "Become a Blessed Holder",
      backContent: "Join our divine community and receive these blessings:",
      backList: [
        "Access to exclusive alpha and trading strategies",
        "Community governance voting rights",
        "Early access to partnerships and features",
        "24/7 support from fellow believers",
        "Educational resources on DeFi and crypto"
      ],
      backQuote: "Where two or three gather in profit, there I am with them.",
      backgroundImage: 'linear-gradient(rgba(212, 175, 55, 0.3), rgba(0, 0, 0, 0.2)), url("/images/mosaic.jpg")'
    }
  ];
  
  return (
    <section 
      ref={sectionRef}
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '100vh',
        overflow: 'hidden',
        // background: 'linear-gradient(180deg, rgba(135,206,235,0.3) 0%, rgba(135,206,235,0) 100%)',
        zIndex: 20,
        pointerEvents: 'auto',
      }}
    >
      {/* Cloud particles background */}
      <motion.div 
        style={{ 
          opacity: smoothCloudOpacity,
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none',
        }}
      >
        {[...Array(5)].map((_, i) => (
          <CloudParticle key={i} index={i} delay={i * 3} duration={20 + i * 5} />
        ))}
      </motion.div>
      
      {/* Ethereal Welcome Banner */}
      <motion.div
        style={{
          y: welcomeY,
          opacity: welcomeOpacity,
        }}
        className="welcome-banner"
      >
        <div style={{
          textAlign: 'center',
          padding: isMobile ? '3rem 1.5rem' : '5rem 2rem',
          maxWidth: '900px',
          margin: '0 auto',
        }}>
          {/* Animated Drop-In Title */}
          <DropInTitle
            lines={["Prosper80", "for All", "Human80!"]}
            colors={["#d4af37", "#f4e4c1", "#ffd700"]}
            fontSize={{ mobile: "2.5rem", desktop: "4rem" }}
            isMobile={isMobile}
            triggerAnimation={isInView}
          />
          
          {/* <motion.p
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 1, delay: 0.4 }}
            style={{
              fontSize: isMobile ? '1.1rem' : '1.5rem',
              color: 'rgba(212,175,55,0.9)',
              fontFamily: 'UnifrakturMaguntia, serif',
              textShadow: '0 2px 10px rgba(0,0,0,0.3)',
            }}
          >
            Where faith meets fortune in the digital realm
          </motion.p> */}
        </div>
      </motion.div>
      

            {/* Floating Stats Section */}
            <motion.div
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ duration: 1, delay: 1 }}
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
          gap: '2rem',
          padding: isMobile ? '3rem 1.5rem' : '4rem',
          maxWidth: '1200px',
          margin: '3rem auto',
          background: 'radial-gradient(ellipse, rgba(212,175,55,0.05) 0%, transparent 70%)',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: isMobile ? '2rem' : '2.5rem',
            fontWeight: 'bold',
            color: '#d4af37',
            textShadow: '0 0 20px rgba(212,175,55,0.5)',
            fontFamily: "'Fjalla One', sans-serif",
          }}>
            <AnimatedCounter target={8888} suffix="+" />
          </div>
          <div style={{
            fontSize: '1.1rem',
            color: 'rgba(255,255,255,0.9)',
            marginTop: '0.5rem',
            fontFamily: "'Fjalla One', sans-serif",
            textTransform: 'uppercase',
            letterSpacing: '1px',
            textShadow: '0 2px 4px rgba(0,0,0,0.5)',
          }}>
            Blessed Holders
          </div>
        </div>
        
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: isMobile ? '2rem' : '2.5rem',
            fontWeight: 'bold',
            color: '#d4af37',
            textShadow: '0 0 20px rgba(212,175,55,0.5)',
            fontFamily: "'Fjalla One', sans-serif",
          }}>
            <AnimatedCounter target={1.8} suffix="M" prefix="$" />
          </div>
          <div style={{
            fontSize: '1.1rem',
            color: 'rgba(255,255,255,0.9)',
            marginTop: '0.5rem',
            fontFamily: "'Fjalla One', sans-serif",
            textTransform: 'uppercase',
            letterSpacing: '1px',
            textShadow: '0 2px 4px rgba(0,0,0,0.5)',
          }}>
            Market Cap
          </div>
        </div>
        
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: isMobile ? '2rem' : '2.5rem',
            fontWeight: 'bold',
            color: '#d4af37',
            textShadow: '0 0 20px rgba(212,175,55,0.5)',
            fontFamily: "'Fjalla One', sans-serif",
          }}>
            <AnimatedCounter target={18} suffix="%" />
          </div>
          <div style={{
            fontSize: '1.1rem',
            color: 'rgba(255,255,255,0.9)',
            marginTop: '0.5rem',
            fontFamily: "'Fjalla One', sans-serif",
            textTransform: 'uppercase',
            letterSpacing: '1px',
            textShadow: '0 2px 4px rgba(0,0,0,0.5)',
          }}>
            Tokens Burned
          </div>
        </div>
        
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: isMobile ? '2rem' : '2.5rem',
            fontWeight: 'bold',
            color: '#d4af37',
            textShadow: '0 0 20px rgba(212,175,55,0.5)',
            fontFamily: "'Fjalla One', sans-serif",
          }}>
            <AnimatedCounter target={80} suffix="K" prefix="$" />
          </div>
          <div style={{
            fontSize: '1.1rem',
            color: 'rgba(255,255,255,0.9)',
            marginTop: '0.5rem',
            fontFamily: "'Fjalla One', sans-serif",
            textTransform: 'uppercase',
            letterSpacing: '1px',
            textShadow: '0 2px 4px rgba(0,0,0,0.5)',
          }}>
            Total Rewards
          </div>
        </div>
      </motion.div>
      {/* Flippable Cards Section */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
        gap: isMobile ? '2rem' : '3rem',
        padding: isMobile ? '2rem 1.5rem' : '3rem 4rem',
        maxWidth: '1400px',
        margin: '0 auto',
      }}>
        {cards.map((card, index) => (
          <motion.div
            key={card.id}
            className="cloud-card-wrap"
            ref={el => {
              if (el && !cardRefs.current.includes(el)) {
                cardRefs.current.push(el);
              }
            }}
            onClick={() => handleCardFlip(card.id)}
            onMouseMove={(e) => handleCardMouseMove(e, card.id)}
            onMouseLeave={handleCardMouseLeave}
            initial={{ opacity: 0, y: 100 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ 
              duration: 0.8, 
              delay: 0.6 + index * 0.2,
              type: "spring",
              stiffness: 100
            }}
            whileHover={{ scale: 1.02 }}
            style={{
              perspective: '1000px',
              cursor: 'pointer',
              position: 'relative',
              transformStyle: 'preserve-3d',
            }}
          >
            <div className={`cloud-card-container ${flippedCards.has(card.id) ? 'flipped' : ''}`}
              style={{
                width: '100%',
                height: isMobile ? '400px' : '450px',
                position: 'relative',
                transformStyle: 'preserve-3d',
                transition: 'transform 0.8s cubic-bezier(0.445, 0.05, 0.55, 0.95), box-shadow 0.3s ease',
                transform: flippedCards.has(card.id) 
                  ? `rotateY(180deg) ${hoveredCard === card.id ? `rotateY(${180 + mousePosition.x * 30}deg) rotateX(${mousePosition.y * -30}deg)` : ''}`
                  : getTiltStyles(card.id).transform,
                boxShadow: hoveredCard === card.id 
                  ? '0 25px 50px rgba(0,0,0,0.4), 0 0 50px rgba(212,175,55,0.2)' 
                  : '0 20px 40px rgba(0,0,0,0.3)',
              }}
            >
              {/* Front of card */}
              <div className="cloud-card-face cloud-card-front"
                style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                }}
              >
                <div className="cloud-card"
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '20px',
                    background: 'linear-gradient(135deg, #4a4a4a 0%, #2a2a2a 100%)',
                    overflow: 'hidden',
                    border: '3px solid rgba(212,175,55,0.5)',
                    position: 'relative',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                  }}
                >
                  <span className="flip-hint"
                    style={{
                      position: 'absolute',
                      top: '15px',
                      right: '15px',
                      background: 'rgba(212, 175, 55, 0.2)',
                      padding: '5px 10px',
                      borderRadius: '5px',
                      fontSize: '0.8em',
                      color: '#d4af37',
                      opacity: 0.8,
                      zIndex: 10,
                      backdropFilter: 'blur(5px)',
                    }}
                  >
                    Click to flip
                  </span>
                  <div className="cloud-card-bg" 
                    style={{ 
                      backgroundImage: card.backgroundImage,
                      position: 'absolute',
                      top: '-20px',
                      left: '-20px',
                      width: 'calc(100% + 40px)',
                      height: 'calc(100% + 40px)',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      opacity: hoveredCard === card.id ? 0.85 : 0.7,
                      filter: hoveredCard === card.id ? 'brightness(1)' : 'brightness(0.8)',
                      transform: hoveredCard === card.id 
                        ? `translateX(${-mousePosition.x * 40}px) translateY(${-mousePosition.y * 40}px) scale(1.1)`
                        : 'translateX(0) translateY(0) scale(1)',
                      transition: 'transform 0.1s ease-out, opacity 0.3s ease-out, filter 0.3s ease-out',
                    }}
                  />
                  <div className="cloud-card-info"
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      width: '100%',
                      padding: '30px',
                      background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 50%, transparent 100%)',
                    }}
                  >
                    <h2 style={{
                      fontSize: isMobile ? '1.8rem' : '2rem',
                      marginBottom: '10px',
                      textShadow: '0 2px 10px rgba(0,0,0,0.5)',
                      fontFamily: 'UnifrakturCook, serif',
                      color: '#d4af37',
                    }}>
                      {card.frontTitle}
                    </h2>
                    <p style={{
                      fontSize: isMobile ? '0.95rem' : '1.05rem',
                      lineHeight: 1.6,
                      color: 'rgba(255,255,255,0.9)',
                      textShadow: '0 1px 3px rgba(0,0,0,0.5)',
                    }}>
                      {card.frontDescription}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Back of card */}
              <div className="cloud-card-face cloud-card-back"
                style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                }}
              >
                <div className="cloud-card"
                  style={{
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(135deg, #2a1f0a 0%, #4a3a1a 100%)',
                    border: '3px solid #d4af37',
                    borderRadius: '20px',
                    position: 'relative',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                  }}
                >
                  <span className="flip-hint"
                    style={{
                      position: 'absolute',
                      top: '15px',
                      right: '15px',
                      background: 'rgba(212, 175, 55, 0.2)',
                      padding: '5px 10px',
                      borderRadius: '5px',
                      fontSize: '0.8em',
                      color: '#d4af37',
                      opacity: 0.8,
                      zIndex: 10,
                    }}
                  >
                    Click to flip
                  </span>
                  <div className="cloud-card-back-content"
                    style={{
                      padding: '30px',
                      color: '#fff',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-start',
                      overflowY: 'auto',
                      boxSizing: 'border-box',
                    }}
                  >
                    <h3 style={{
                      color: '#d4af37',
                      fontFamily: 'UnifrakturCook, serif',
                      fontSize: isMobile ? '1.5rem' : '1.8rem',
                      marginBottom: '15px',
                      marginTop: 0,
                    }}>
                      {card.backTitle}
                    </h3>
                    <p style={{
                      fontSize: '0.95rem',
                      lineHeight: 1.6,
                      marginBottom: '15px',
                      opacity: 0.95,
                    }}>
                      {card.backContent}
                    </p>
                    <ul style={{
                      listStyle: 'none',
                      padding: 0,
                      margin: '10px 0',
                    }}>
                      {card.backList.map((item, i) => (
                        <li key={i}
                          style={{
                            padding: '6px 0',
                            borderBottom: '1px solid rgba(212, 175, 55, 0.2)',
                            fontSize: '0.9rem',
                            lineHeight: 1.4,
                          }}
                        >
                          <span style={{ color: '#d4af37', marginRight: '8px' }}>✨</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                    
                    {/* Stats for token card */}
                    {card.backStats && (
                      <div style={{
                        marginTop: '15px',
                        padding: '10px',
                        background: 'rgba(212, 175, 55, 0.1)',
                        borderRadius: '5px',
                      }}>
                        <p style={{ margin: '3px 0', fontSize: '0.9rem' }}>
                          <strong>Total Supply:</strong> {card.backStats.supply}
                        </p>
                        <p style={{ margin: '3px 0', fontSize: '0.9rem' }}>
                          <strong>Tax:</strong> {card.backStats.tax}
                        </p>
                        <p style={{ margin: '3px 0', fontSize: '0.9rem' }}>
                          <strong>Liquidity:</strong> {card.backStats.liquidity}
                        </p>
                      </div>
                    )}
                    
                    {/* Quote if available */}
                    {card.backQuote && (
                      <p style={{
                        marginTop: '20px',
                        fontStyle: 'italic',
                        opacity: 0.8,
                        textAlign: 'center',
                        color: '#d4af37',
                        fontSize: '0.95rem',
                      }}>
                        "{card.backQuote}"
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      

      
      {/* Cloud Gateway Divider */}
      <div style={{
        position: 'relative',
        width: '100%',
        height: '200px',
        overflow: 'hidden',
        marginTop: '4rem',
      }}>
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 1440 200"
          preserveAspectRatio="none"
          style={{
            position: 'absolute',
            bottom: 0,
          }}
        >
          <defs>
            <linearGradient id="cloudGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{ stopColor: 'rgba(135,206,235,0.2)', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: 'rgba(135,206,235,0)', stopOpacity: 0 }} />
            </linearGradient>
          </defs>
          <motion.path
            d="M0,100 C360,20 720,20 1080,100 C1260,140 1380,140 1440,100 L1440,200 L0,200 Z"
            fill="url(#cloudGradient)"
            initial={{ pathLength: 0 }}
            animate={isInView ? { pathLength: 1 } : {}}
            transition={{ duration: 2, ease: "easeInOut" }}
          />
          <motion.path
            d="M0,140 C240,80 480,80 720,140 C960,200 1200,200 1440,140 L1440,200 L0,200 Z"
            fill="url(#cloudGradient)"
            initial={{ pathLength: 0 }}
            animate={isInView ? { pathLength: 1 } : {}}
            transition={{ duration: 2, delay: 0.3, ease: "easeInOut" }}
          />
        </svg>
        
        {/* Parting clouds text */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 1, delay: 1.5 }}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
          }}
        >
          <div style={{
            fontSize: isMobile ? '1.2rem' : '1.5rem',
            color: 'rgba(212,175,55,0.8)',
            fontFamily: 'UnifrakturMaguntia, serif',
            textShadow: '0 0 20px rgba(212,175,55,0.3)',
          }}>
            ✦ The clouds part to reveal your destiny ✦
          </div>
        </motion.div>
      </div>
    </section>
  );
}