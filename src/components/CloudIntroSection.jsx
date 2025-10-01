'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform, useInView, useSpring } from 'framer-motion';
import DropInTitle from './DropInTitle';
import Coin from '@/components/Coin';
import Link from 'next/link';
import { gsap } from 'gsap';


const GOLDENRATIO = 1.61803398875;


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
    const [copied, setCopied] = useState(false);
      const coinRef = useRef(null);
        const [isMobileView, setIsMobileView] = useState(false);
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
    // Skip hover effects on touch devices
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      return;
    }
    
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
      frontTitle: "Faith",
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
      backgroundImage: 'linear-gradient(rgba(212, 175, 55, 0.3), rgba(0, 0, 0, 0.2)), url("/vsClown.jpg")'
    },
    {
      id: 1,
      frontTitle: "Hope",
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
            backgroundImage: 'linear-gradient(rgba(212, 175, 55, 0.3), rgba(0, 0, 0, 0.2)), url("/images/teknoir.jpg")'

    },
    {
      id: 2,
      frontTitle: "Charity",
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

    
    const contractAddress = '0x1234567890123456789012345678901234567890'; // Replace with actual contract address
    
    const handleCopyAddress = () => {
      navigator.clipboard.writeText(contractAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    useEffect(() => {
        // Wait for client and page to be ready
        if (!coinRef.current) {
          return;
        }
    
        const sparkle = coinRef.current;
    
        const MAX_STARS = 60;
        const STAR_INTERVAL = 16;
    
        const MAX_STAR_LIFE = 3;
        const MIN_STAR_LIFE = 1;
    
        const MAX_STAR_SIZE = 40;
        const MIN_STAR_SIZE = 20;
    
        const MIN_STAR_TRAVEL_X = 100;
        const MIN_STAR_TRAVEL_Y = 100;
    
        const randomLimitedColor = () => {
          const randomHue = (() => {
            const ranges = [
              { min: 120, max: 150 }, // Blues
              { min: 270, max: 290 }, // Violets/Purples
              { min: 45, max: 60 }, // Yellows and Golds
            ];
            const range = ranges[Math.floor(Math.random() * ranges.length)];
            return (
              Math.floor(Math.random() * (range.max - range.min + 1)) + range.min
            );
          })();
    
          return `hsla(${randomHue}, 100%, 50%, 1)`;
        };
    
        const Star = class {
          constructor() {
            this.size = this.random(MAX_STAR_SIZE, MIN_STAR_SIZE);
    
            this.x = this.random(
              sparkle.offsetWidth * 0.75,
              sparkle.offsetWidth * 0.25
            );
            this.y = sparkle.offsetHeight / 2 - this.size / 2;
    
            this.x_dir = this.randomMinus();
            this.y_dir = this.randomMinus();
    
            this.x_max_travel =
              this.x_dir === -1 ? this.x : sparkle.offsetWidth - this.x - this.size;
            this.y_max_travel = sparkle.offsetHeight / 2 - this.size;
    
            this.x_travel_dist = this.random(this.x_max_travel, MIN_STAR_TRAVEL_X);
            this.y_travel_dist = this.random(this.y_max_travel, MIN_STAR_TRAVEL_Y);
    
            this.x_end = this.x + this.x_travel_dist * this.x_dir;
            this.y_end = this.y + this.y_travel_dist * this.y_dir;
    
            this.life = this.random(MAX_STAR_LIFE, MIN_STAR_LIFE);
    
            this.star = document.createElement("div");
            this.star.classList.add("star");
    
            this.star.style.setProperty("--start-left", this.x + "px");
            this.star.style.setProperty("--start-top", this.y + "px");
    
            this.star.style.setProperty("--end-left", this.x_end + "px");
            this.star.style.setProperty("--end-top", this.y_end + "px");
    
            this.star.style.setProperty("--star-life", this.life + "s");
            this.star.style.setProperty("--star-life-num", this.life);
    
            this.star.style.setProperty("--star-size", this.size + "px");
            this.star.style.setProperty("--star-color", randomLimitedColor());
          }
    
          draw() {
            sparkle.appendChild(this.star);
          }
    
          pop() {
            if (sparkle.contains(this.star)) {
              sparkle.removeChild(this.star);
            }
          }
    
          random(max, min) {
            return Math.floor(Math.random() * (max - min + 1)) + min;
          }
    
          randomMinus() {
            return Math.random() > 0.5 ? 1 : -1;
          }
        };
    
        let current_star_count = 0;
        const intervalId = setInterval(() => {
          if (current_star_count >= MAX_STARS) {
            return;
          }
    
          current_star_count++;
    
          const newStar = new Star();
          newStar.draw();
    
          setTimeout(() => {
            current_star_count--;
            newStar.pop();
          }, newStar.life * 1000);
        }, STAR_INTERVAL);
    
        return () => {
          clearInterval(intervalId);
        };
      }, );
  
  return (
    <>
      <link rel="stylesheet" href="/coin.css" />
      <style jsx>{`
        /* Override purse centering for inline display */
        .purse {
          position: relative !important;
          top: auto !important;
          left: auto !important;
          margin: 0 auto !important;
          margin-top: 0 !important;
          margin-left: 0 !important;
        }
        
        /* Coin color overrides */
        .coin .front {
          background-color: #d4af37 !important;
        }
        .coin .back {
          background-color: #b8941f !important;
        }
        
        .star {
          position: absolute;
          width: var(--star-size);
          height: var(--star-size);
          background: var(--star-color);
          clip-path: polygon(50% 0, 60% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 40% 35%);
          animation: star-twinkle var(--star-life) ease-in-out forwards;
          z-index: 1;
          pointer-events: none;
        }

        @keyframes star-twinkle {
          0% {
            opacity: 0;
            transform: scale(0) translate(0, 0);
            left: var(--start-left);
            top: var(--start-top);
          }
          10% {
            opacity: 1;
            transform: scale(1) translate(0, 0);
          }
          90% {
            opacity: 1;
            transform: scale(1) translate(0, 0);
          }
          100% {
            opacity: 0;
            transform: scale(0) translate(0, 0);
            left: var(--end-left);
            top: var(--end-top);
          }
        }
      `}</style>
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
      {/* <motion.div 
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
      </motion.div> */}
      
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
            lines={["Behold!", "RL80!", "HOLD RL80"]}
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
      
<div style={{position: 'relative', zIndex: 1, marginTop: '10rem'}}></div>
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
            Holders
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

       <div style={{
              display: 'flex',
              flexDirection: 'column',
              border: '2px solid rgba(212, 175, 55, 0.4)',
              borderRadius: '25px',
              background: 'linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(26,26,26,0.4) 100%)',
              alignItems: 'center',
              // width: '100%',
              maxWidth: '900px',
              margin: '2rem auto',
            paddingTop: '2rem',
              position: 'relative',
              boxShadow: '0 6px 20px rgba(0, 0, 0, 0.4)',
            }}>
              {/* Green checkbox emoji in top left corner */}
              <span style={{
                position: 'absolute',
                top: '-20px',
                left: '10px',
                fontSize: '4rem',
                transform: 'rotate(-15deg)',
                padding: '0 4px',
              }}>📜</span>
              <span style={{
                position: 'absolute',
                top: '-20px',
                left: '48px',
                fontSize: '24px',
                backgroundColor: '#1a1a1a',
                padding: '0 4px',
                borderRadius: '50%',
              }}>✅</span>
              
              {/* Token Info Section */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                // marginBottom: '1.5rem',
                textAlign: 'center',
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: '1rem',
                  // marginBottom: '0.5rem',
                }}>
                  <span style={{
                    fontFamily: 'UnifrakturCook, UnifrakturMaguntia, serif',
                    fontWeight: 'bold',
                    fontSize: '2.2em',
                    color: '#d4af37',
                    textShadow: '2px 2px 4px rgba(0, 0, 0, 0.7)',
                  }}>Our Lady of Perpetual Profit</span>
                       </div>
                         <div style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: '1rem',
                  // marginBottom: '0.5rem',
                }}>
                  <span style={{
                    fontFamily: 'cyber, monospace',
                    fontWeight: 'bold',
                    fontSize: '1.2em',
                    color: '#ffffff',
                    textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)',
                    backgroundColor: 'rgba(196, 137, 1, 0.2)',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '4px',
                    border: '1px solid rgba(196, 137, 1, 0.4)',
                  }}>TICKER: $RL80</span>
           </div>
              </div>

              {/* Contract Address Section with Coin */}
              <div style={{
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                alignItems: 'center',
                gap: isMobile ? '1.5rem' : '2rem',
                width: '100%',
                marginTop: isMobile ? '1rem' : '-2.5rem',
                // padding: '1rem',
                borderRadius: '12px',
                justifyContent: 'center',
              }}>
                {/* Left Buttons Container */}
                <div style={{
                  display: 'flex',
                  flexDirection: isMobile ? 'row' : 'column',
                  gap: '0.75rem',
                  minWidth: isMobile ? 'auto' : '120px',
                  flex: '0 0 auto',
                  marginRight: isMobile ? '0' : '2rem',
                  marginLeft: isMobile ? '0' : '2rem',
                  order: isMobile ? 2 : 0,
                }}>
                  <button
                    className="buy-button"
                    ref={(el) => {
                      if (el && !el.dataset.gsapInit) {
                        el.dataset.gsapInit = 'true';
                        // Create shine effect on hover
                        el.addEventListener('mouseenter', () => {
                          gsap.fromTo(el.querySelector('.button-shine'), 
                            { x: '-100%' },
                            { x: '200%', duration: 0.75, ease: 'power2.inOut' }
                          );
                        });
                      }
                    }}
                    style={{
                      background: 'linear-gradient(135deg, #d4af37 0%, #f4e4a3 50%, #d4af37 100%)',
                      border: '2px solid #d4af37',
                      borderRadius: '8px',
                      padding: isMobile ? '0.6rem 0.8rem' : '0.75rem 1rem',
                      color: '#000',
                      width: isMobile ? '8rem' : '10rem',
                      fontSize: isMobile ? '0.75rem' : '0.85rem',
                      fontWeight: '700',
                      fontFamily: '"Cyber", monospace',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      boxShadow: '0 4px 15px rgba(212, 175, 55, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)';
                      e.currentTarget.style.boxShadow = '0 6px 20px rgba(212, 175, 55, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.5)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0) scale(1)';
                      e.currentTarget.style.boxShadow = '0 4px 15px rgba(212, 175, 55, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.3)';
                    }}
                  >
                    <span className="button-shine" style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'linear-gradient(105deg, transparent 40%, rgba(255, 255, 255, 0.7) 50%, transparent 60%)',
                      transform: 'translateX(-100%)',
                      pointerEvents: 'none'
                    }} />
                    Buy on Uniswap
                  </button>
                  
                  <button
                    className="buy-button"
                    ref={(el) => {
                      if (el && !el.dataset.gsapInit) {
                        el.dataset.gsapInit = 'true';
                        // Create shine effect on hover
                        el.addEventListener('mouseenter', () => {
                          gsap.fromTo(el.querySelector('.button-shine'), 
                            { x: '-100%' },
                            { x: '200%', duration: 0.75, ease: 'power2.inOut' }
                          );
                        });
                      }
                    }}
                    style={{
                      background: 'linear-gradient(135deg, #d4af37 0%, #f4e4a3 50%, #d4af37 100%)',
                      border: '2px solid #d4af37',
                      borderRadius: '8px',
                      padding: isMobile ? '0.6rem 0.8rem' : '0.75rem 1rem',
                      color: '#000',
                      width: isMobile ? '8rem' : '10rem',
                      fontSize: isMobile ? '0.75rem' : '0.85rem',
                      fontWeight: '700',
                      fontFamily: '"Cyber", monospace',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      boxShadow: '0 4px 15px rgba(212, 175, 55, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)';
                      e.currentTarget.style.boxShadow = '0 6px 20px rgba(212, 175, 55, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.5)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0) scale(1)';
                      e.currentTarget.style.boxShadow = '0 4px 15px rgba(212, 175, 55, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.3)';
                    }}
                  >
                    <span className="button-shine" style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'linear-gradient(105deg, transparent 40%, rgba(255, 255, 255, 0.7) 50%, transparent 60%)',
                      transform: 'translateX(-100%)',
                      pointerEvents: 'none'
                    }} />
                    Buy on CoinBase
                  </button>
                  
                  <button
                    className="buy-button"
                    ref={(el) => {
                      if (el && !el.dataset.gsapInit) {
                        el.dataset.gsapInit = 'true';
                        // Create shine effect on hover
                        el.addEventListener('mouseenter', () => {
                          gsap.fromTo(el.querySelector('.button-shine'), 
                            { x: '-100%' },
                            { x: '200%', duration: 0.75, ease: 'power2.inOut' }
                          );
                        });
                      }
                    }}
                    style={{
                      background: 'linear-gradient(135deg, #d4af37 0%, #f4e4a3 50%, #d4af37 100%)',
                      border: '2px solid #d4af37',
                      borderRadius: '8px',
                      padding: isMobile ? '0.6rem 0.8rem' : '0.75rem 1rem',
                      color: '#000',
                      width: isMobile ? '8rem' : '10rem',
                      fontSize: isMobile ? '0.75rem' : '0.85rem',
                      fontWeight: '700',
                      fontFamily: '"Cyber", monospace',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      boxShadow: '0 4px 15px rgba(212, 175, 55, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)';
                      e.currentTarget.style.boxShadow = '0 6px 20px rgba(212, 175, 55, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.5)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0) scale(1)';
                      e.currentTarget.style.boxShadow = '0 4px 15px rgba(212, 175, 55, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.3)';
                    }}
                  >
                    <span className="button-shine" style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'linear-gradient(105deg, transparent 40%, rgba(255, 255, 255, 0.7) 50%, transparent 60%)',
                      transform: 'translateX(-100%)',
                      pointerEvents: 'none'
                    }} />
                    Buy With Card
                  </button>
                </div>

                {/* Contract Address Container */}
                <div style={{
                  flex: '0 0 auto',
                  minWidth: isMobile ? '100%' : '300px',
                  width: isMobile ? '100%' : 'auto',
                  order: isMobile ? 3 : 1,
                  padding: isMobile ? '0 1rem' : '0',
                }}>
                  <h3 style={{
                    color: '#c48901',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    marginBottom: '0.75rem',
                    fontFamily: '"Cyber", monospace',
                    textAlign: 'center',
                  }}>
                    🔗 Contract Address (BASE Chain)
                  </h3>
                  
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    background: 'rgba(32, 30, 27, 0.39)',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(196, 137, 1, 0.2)',
                  }}>
                    <code style={{
                      color: '#ffffff',
                      fontSize: '0.85rem',
                      fontFamily: 'monospace',
                      wordBreak: 'break-all',
                      flex: 1,
                      letterSpacing: '0.05em',
                    }}>
                      {contractAddress.slice(0, 6)}...{contractAddress.slice(-4)}
                    </code>
                    
                    <button
                      onClick={handleCopyAddress}
                      style={{
                        background: copied ? 'rgba(0, 255, 0, 0.2)' : 'rgba(196, 137, 1, 0.2)',
                        border: `1px solid ${copied ? 'rgba(0, 255, 0, 0.5)' : 'rgba(196, 137, 1, 0.5)'}`,
                        borderRadius: '6px',
                        padding: '0.5rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: '40px',
                      }}
                      onMouseEnter={(e) => {
                        if (!copied) {
                          e.currentTarget.style.background = 'rgba(196, 137, 1, 0.3)';
                          e.currentTarget.style.transform = 'scale(1.05)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!copied) {
                          e.currentTarget.style.background = 'rgba(196, 137, 1, 0.2)';
                          e.currentTarget.style.transform = 'scale(1)';
                        }
                      }}
                      title={copied ? 'Copied!' : 'Copy address'}
                    >
                      {copied ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00ff00" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c48901" strokeWidth="2">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                
                {/* Coin Container with Sparkles */}
                <div
                  ref={coinRef}
                  style={{ 
                    position: "relative", 
                    marginLeft: isMobile ? '-2rem' : "0",
                    width: isMobile ? "10rem" : "15rem",
                    height: isMobile ? "10rem" : "15rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "visible",
                    flex: '0 0 auto',
                    order: isMobile ? 1 : 2
                  }}
                >
                  <Link href="#" className="coin-link" style={{ 
                    position: "absolute", 
                    zIndex: 10,
                    display: "block",
                    width: isMobile ? "6rem" : "9rem",
                    height: isMobile ? "6rem" : "9rem"
                  }}>
                    <Coin />
                  </Link>
                </div>
              </div>

              {/* Links Section */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-around',
                alignItems: 'center',
                width: '100%',
                gap: isMobile ? '1rem' : '2rem',
                flexWrap: 'wrap',
                padding: isMobile ? '0 0.5rem' : '0',
              }}>
                {/* DEXScreener Link */}
                <a 
                  href="#" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: isMobile ? '0.5rem' : '0.75rem',
                    borderRadius: '8px',
                    // background: 'rgba(196, 137, 1, 0.05)',
                    border: '1px solid transparent',
                    transition: 'all 0.3s ease',
                    textDecoration: 'none',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px) scale(1.05)';
                    e.currentTarget.style.background = 'rgba(196, 137, 1, 0.15)';
                    e.currentTarget.style.borderColor = 'rgba(196, 137, 1, 0.4)';
                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(196, 137, 1, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0) scale(1)';
                    e.currentTarget.style.background = 'rgba(196, 137, 1, 0.05)';
                    e.currentTarget.style.borderColor = 'transparent';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <img 
                    src="/dexscreener.webp" 
                    alt="DEXScreener" 
                    style={{
                      height: isMobile ? '35px' : '50px',
                      width: 'auto',
                      filter: 'brightness(0.95)',
                    }}
                  />
                  <span style={{
                    fontSize: isMobile ? '0.6rem' : '0.7rem',
                    color: '#c48901',
                    fontFamily: 'monospace',
                    fontWeight: '500',
                    letterSpacing: '0.05em',
                  }}>DEXScreener</span>
                </a>
                
                {/* Honeypot Link */}
                <a 
                  href="#" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: isMobile ? '0.5rem' : '0.75rem',
                    borderRadius: '8px',
                    // background: 'rgba(196, 137, 1, 0.05)',
                    border: '1px solid transparent',
                    transition: 'all 0.3s ease',
                    textDecoration: 'none',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px) scale(1.05)';
                    e.currentTarget.style.background = 'rgba(196, 137, 1, 0.15)';
                    e.currentTarget.style.borderColor = 'rgba(196, 137, 1, 0.4)';
                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(196, 137, 1, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0) scale(1)';
                    e.currentTarget.style.background = 'rgba(196, 137, 1, 0.05)';
                    e.currentTarget.style.borderColor = 'transparent';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <img 
                    src="/honeypot.png" 
                    alt="Honeypot" 
                    style={{
                      height: isMobile ? '25px' : '40px',
                      width: 'auto',
                      filter: 'brightness(0.95)',
                    }}
                  />
                  <span style={{
                    fontSize: isMobile ? '0.6rem' : '0.7rem',
                    color: '#c48901',
                    fontFamily: 'monospace',
                    fontWeight: '500',
                    letterSpacing: '0.05em',
                  }}>Honeypot</span>
                </a>
                
                {/* Token Sniffer Link */}
                <a 
                  href="#" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: isMobile ? '0.5rem' : '0.75rem',
                    borderRadius: '8px',
                    // background: 'rgba(196, 137, 1, 0.05)',
                    border: '1px solid transparent',
                    transition: 'all 0.3s ease',
                    textDecoration: 'none',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px) scale(1.05)';
                    e.currentTarget.style.background = 'rgba(196, 137, 1, 0.15)';
                    e.currentTarget.style.borderColor = 'rgba(196, 137, 1, 0.4)';
                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(196, 137, 1, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0) scale(1)';
                    e.currentTarget.style.background = 'rgba(196, 137, 1, 0.05)';
                    e.currentTarget.style.borderColor = 'transparent';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <img 
                    src="/tokensniffer.png" 
                    alt="Token Sniffer" 
                    style={{
                      height: isMobile ? '35px' : '50px',
                      width: 'auto',
                      filter: 'brightness(0.95)',
                    }}
                  />
                  <span style={{
                    fontSize: isMobile ? '0.6rem' : '0.7rem',
                    color: '#c48901',
                    fontFamily: 'monospace',
                    fontWeight: '500',
                    letterSpacing: '0.05em',
                  }}>Token Sniffer</span>
                </a>
              </div>
            </div>
<div style={{position: 'relative', zIndex: 1, marginTop: '10rem'}}>
          {/* <DropInTitle
            lines={["Prosper80", "for All", "Human80!"]}
            colors={["#d4af37", "#f4e4c1", "#ffd700"]}
            fontSize={{ mobile: "2.5rem", desktop: "4rem" }}
            isMobile={isMobile}
            triggerAnimation={isInView}
          /> */}

         </div>
      {/* Flippable Cards Section */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
        gap: isMobile ? '2rem' : '3rem',
        padding: isMobile ? '2rem 1.5rem' : '12rem 4rem',
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
                height: isMobile ? `${280 * GOLDENRATIO}px` : `${300 * GOLDENRATIO}px`,
                position: 'relative',
                transformStyle: 'preserve-3d',
                transition: 'transform 0.8s cubic-bezier(0.445, 0.05, 0.55, 0.95), box-shadow 0.3s ease',
                transform: flippedCards.has(card.id) 
                  ? 'rotateY(180deg)'
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
                      padding: '30px 40px 30px 30px',
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
                      lineHeight: 1.2,
                      width: '90%',
                      color: 'rgba(255,255,255,0.9)',
                      textShadow: '0 1px 3px rgba(0,0,0,0.5)',
                      fontFamily: "'UnifrakturMaguntia', sans-serif",
                      // letterSpacing: '0.5px',
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
                            fontSize: isMobile ? '0.8rem' : '0.9rem',
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
            {/* ✦ The clouds part to reveal your destiny ✦ */}
          </div>
        </motion.div>
      </div>
    </section>
    </>
  );
}