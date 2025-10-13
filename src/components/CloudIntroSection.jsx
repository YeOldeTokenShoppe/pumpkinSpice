'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform, useInView, useSpring } from 'framer-motion';
import DropInTitle from './DropInTitle';
import Coin from '@/components/Coin';
import Link from 'next/link';
import { gsap } from 'gsap';
import { BuyWidget } from "thirdweb/react";
import { defineChain } from "thirdweb";
import { createWallet } from "thirdweb/wallets";
import { client } from "../client";
import PlayingCard from '@/components/PlayingCard';
import HandsGLTFScene from '@/components/HandsGLTFScene';
import FAQSection from '@/components/FAQSection';
import { useUser } from '@clerk/nextjs';



const GOLDENRATIO = 1.61803398875;

function BuyWidgetComponent() {
  return (
<BuyWidget
      client={client}
      image={"https://rl80.com/vvv.jpg"}
      currency={"USD"}
      chain={defineChain(8453)}
      amount={"0.002"}
      tokenAddress={"0x532f27101965dd16442E59d40670FaF5eBB142E4"}
      seller={"0x0000000000000000000000000000000000000000"}
    />
  );
}

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
export default function CloudIntroSection({ scrollY = 0, isMobile = false, onOpenModal }) {
  const { user, isSignedIn } = useUser();
  const sectionRef = useRef(null);
    const [copied, setCopied] = useState(false);
      const coinRef = useRef(null);
        const [isMobileView, setIsMobileView] = useState(false);
  const cardRefs = useRef([]);
  const [flippedCards, setFlippedCards] = useState(new Set());
  const [hoveredCard, setHoveredCard] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const playingCardRef = useRef(null);
  const firstTitleRef = useRef(null);
  const secondTitleRef = useRef(null);
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  // Handle opening modal with authentication check
  const handleOpenModal = () => {
    console.log('handleOpenModal called', { isSignedIn, user, onOpenModal });
    if (!isSignedIn) {
      console.log('User not signed in, showing sign-in modal');
      const btn = document.getElementById('hidden-sign-in-home3');
      console.log('Hidden button found:', btn);
      btn?.click();
    } else {
      console.log('User signed in, calling onOpenModal');
      onOpenModal?.();
    }
  };
  
  const isInView = useInView(sectionRef, { 
    once: false, 
    margin: "-100px" 
  });
  
  // Separate scroll triggers for each DropInTitle
  const firstTitleInView = useInView(firstTitleRef, { 
    once: false, 
    margin: "-100px" // Triggers when 100px before element comes into view
  });
  
  const secondTitleInView = useInView(secondTitleRef, { 
    once: false, 
    margin: "-30px" // Different trigger point for second title
  });
  
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });
  
  // Parallax transformations
  const cloudOpacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [1, 0.8, 0.3, 0]);
  const welcomeY = useTransform(scrollYProgress, [0, 0.5], [100, 0]);
  const welcomeOpacity = useTransform(scrollYProgress, [0, 0.1], [0, 1]);
  
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
      frontDescription: "Transforming vision into measurable outcomes through strategic innovation",
      backTitle: "Strategic Framework",
      backContent: "Delivering comprehensive solutions that drive sustainable growth and operational efficiency:",
      backList: [
        "Advanced analytics and performance optimization",
        "Scalable infrastructure with automated workflows",
        "Data-driven decision making protocols",
        "Enterprise-grade security and compliance standards"
      ],
      backStats: {
        supply: "80,000,000,000 $RL80",
        tax: "4% Buy/Sell",
        liquidity: "Burned"
      },

    
      backQuote: "Where faith meets fortune, miracles happen.",
      backgroundImage: 'linear-gradient(rgba(212, 175, 55, 0.3), rgba(0, 0, 0, 0.2)), url("/images/lowrider.jpg")'
    },
    {
      id: 1,
      frontTitle: "Hope",
      frontDescription: "Pioneering next-generation solutions for complex business challenges",
      backTitle: "Technology Leadership",
      backContent: "Leveraging cutting-edge methodologies to accelerate digital transformation:",
      backList: [
        "Machine learning and artificial intelligence integration",
        "Cloud-native architecture and microservices",
        "Real-time monitoring and predictive analytics"
      ],
            backgroundImage: 'linear-gradient(rgba(212, 175, 55, 0.3), rgba(0, 0, 0, 0.2)), url("/images/teknoir.jpg")'

    },
    {
      id: 2,
      frontTitle: "Charity",
      frontDescription: "Building sustainable relationships that create long-term value for all stakeholders",
      backTitle: "Collaborative Excellence",
      backContent: "Fostering strategic alliances through transparency, accountability, and shared success:",
      backList: [
        "Cross-functional team collaboration",
        "Stakeholder engagement and communication",
        "Continuous improvement and knowledge sharing",
        "Community-driven innovation initiatives"
      ],
      backQuote: "Excellence is achieved through collaborative innovation and shared vision.",
      backgroundImage: 'linear-gradient(rgba(212, 175, 55, 0.3), rgba(0, 0, 0, 0.2)), url("/images/mosaic.jpg")'
    }
  ];

    
    const contractAddress = '0x1234567890123456789012345678901234567890'; // Replace with actual contract address
    
    const handleCopyAddress = () => {
      navigator.clipboard.writeText(contractAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    // Star generation script removed to improve memory performance
  
  return (
    <>
      <link rel="stylesheet" href="/coin.css" />
      <link rel="preload" href="/fonts/PirataOne-Regular.ttf" as="font" type="font/ttf" crossOrigin="" />
      <style jsx>{`
        @font-face {
          font-family: 'PirataOne';
          src: url('/fonts/PirataOne-Regular.ttf') format('truetype');
          font-weight: normal;
          font-style: normal;
          font-display: swap;
        }
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
     
      

      <motion.div
        style={{
          y: welcomeY,
          opacity: welcomeOpacity,
        }}
        className="welcome-banner"
      >
        <div ref={firstTitleRef} style={{
          textAlign: 'center',
          padding: isMobile ? '3rem 1.5rem' : '5rem 2rem',
          maxWidth: '900px',
          margin: '0 auto',
        }}>
          {/* Animated Drop-In Title */}
          <DropInTitle
            lines={["BEHOLD!", "OUR LADY!", "HOLD RL80!"]}
            colors={["#d4af37", "#f4e4c1", "#ffd700"]}
            fontSize={{ mobile: "2.5rem", desktop: "4rem" }}
            isMobile={isMobile}
            triggerAnimation={firstTitleInView}
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


                 <motion.div
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ duration: 1, delay: 1 }}
        style={{
          position: 'relative',
          padding: isMobile ? '3rem 1.5rem' : '4rem',
          maxWidth: '1200px',
          margin: '3rem auto',
          background: 'radial-gradient(ellipse, rgba(212,175,55,0.05) 0%, transparent 70%)',
        }}
      >
        {/* Centered Coin Container */}
        <div
          ref={coinRef}
          style={{ 
            position: "absolute",
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: isMobile ? "8rem" : "12rem",
            height: isMobile ? "8rem" : "12rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10,
          }}
        >
          <Link href="#" className="coin-link" style={{ 
            display: "block",
            width: isMobile ? "7rem" : "10rem",
            height: isMobile ? "7rem" : "10rem"
          }}>
            <Coin />
          </Link>
        </div>

        {/* Stats Grid - 2x2 layout */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, max-content)',
          gridTemplateRows: 'repeat(2, max-content)',
          gap: isMobile ? '1.5rem' : '2rem',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: isMobile ? '300px' : '400px',
        }}>
          {/* Top Left - Holders */}
          <div style={{ 
            textAlign: 'center',
            background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.05) 0%, rgba(0, 0, 0, 0.8) 50%, rgba(212, 175, 55, 0.05) 100%)',
            backdropFilter: 'blur(12px)',
            borderRadius: '12px',
            border: '2px solid rgba(212, 175, 55, 0.4)',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5), inset 0 0 20px rgba(212, 175, 55, 0.1)',
            padding: isMobile ? '1.5rem 2rem' : '2rem 2.5rem',
            minWidth: isMobile ? '140px' : '180px',
            aspectRatio: '1.2',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <div style={{
              fontSize: isMobile ? '2rem' : '2.5rem',
              fontWeight: 'bold',
              color: '#d4af37',
              textShadow: '0 0 20px rgba(212,175,55,0.5)',
              fontFamily: "'Fjalla One', sans-serif",
            }}>
              <AnimatedCounter target={8} suffix="+" />
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
          
          {/* Top Right - Market Cap */}
          <div style={{ 
            textAlign: 'center',
            background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.05) 0%, rgba(0, 0, 0, 0.8) 50%, rgba(212, 175, 55, 0.05) 100%)',
            backdropFilter: 'blur(12px)',
            borderRadius: '12px',
            border: '2px solid rgba(212, 175, 55, 0.4)',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5), inset 0 0 20px rgba(212, 175, 55, 0.1)',
            padding: isMobile ? '1.5rem 2rem' : '2rem 2.5rem',
            minWidth: isMobile ? '140px' : '180px',
            aspectRatio: '1.2',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <div style={{
              fontSize: isMobile ? '2rem' : '2.5rem',
              fontWeight: 'bold',
              color: '#d4af37',
              textShadow: '0 0 20px rgba(212,175,55,0.5)',
              fontFamily: "'Fjalla One', sans-serif",
            }}>
              <AnimatedCounter target={4.8} suffix="K" prefix="$" />
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

          {/* Bottom Left - Tokens Burned */}
          <div style={{ 
            textAlign: 'center',
            background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.05) 0%, rgba(0, 0, 0, 0.8) 50%, rgba(212, 175, 55, 0.05) 100%)',
            backdropFilter: 'blur(12px)',
            borderRadius: '12px',
            border: '2px solid rgba(212, 175, 55, 0.4)',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5), inset 0 0 20px rgba(212, 175, 55, 0.1)',
            padding: isMobile ? '1.5rem 2rem' : '2rem 2.5rem',
            minWidth: isMobile ? '140px' : '180px',
            aspectRatio: '1.2',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <div style={{
              fontSize: isMobile ? '2rem' : '2.5rem',
              fontWeight: 'bold',
              color: '#d4af37',
              textShadow: '0 0 20px rgba(212,175,55,0.5)',
              fontFamily: "'Fjalla One', sans-serif",
            }}>
              <AnimatedCounter target={0} suffix="%" />
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
          
          {/* Bottom Right - Total Rewards */}
          <div style={{ 
            textAlign: 'center',
            background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.05) 0%, rgba(0, 0, 0, 0.8) 50%, rgba(212, 175, 55, 0.05) 100%)',
            backdropFilter: 'blur(12px)',
            borderRadius: '12px',
            border: '2px solid rgba(212, 175, 55, 0.4)',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5), inset 0 0 20px rgba(212, 175, 55, 0.1)',
            padding: isMobile ? '1.5rem 2rem' : '2rem 2.5rem',
            minWidth: isMobile ? '140px' : '180px',
            aspectRatio: '1.2',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
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
        </div>
      </motion.div>
      </motion.div>
                    {/* Playing Card Section */}
                  <div style={{
                    position: "relative",
                    margin: "20vh auto 4rem auto",
                    width: isMobile ? "90%" : "80%",
                    maxWidth: "1400px",
                    display: "grid",
                    gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 0.4fr) minmax(0, 0.6fr)", // Stack on mobile, 40% card, 60% text on desktop
                    gap: isMobile ? "2rem" : "3rem",
                    alignItems: "center",
                    padding: isMobile ? '2rem 1.5rem' : '3rem 2rem',
                    background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.05) 0%, rgba(0, 0, 0, 0.8) 50%, rgba(212, 175, 55, 0.05) 100%)',
                    backdropFilter: 'blur(12px)',
                    borderRadius: '25px',
                    border: '2px solid rgba(212, 175, 55, 0.4)',
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), inset 0 0 40px rgba(212, 175, 55, 0.1)',
                    color: '#ffffff',
                    gridColumn: '1 / -1'
                  }}>
                    {/* Left Column - Playing Card */}
                    <section className="card-section" style={{ 
                      position: "relative",
                      height: isMobile ? "auto" : "35rem",
                      minHeight: isMobile ? "30rem" : "auto",
                      overflow: "visible",
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      zIndex: 100,
                      pointerEvents: 'auto',
                      order: isMobile ? 1 : 1, // Keep card at top on mobile
                      paddingBottom: isMobile ? '2rem' : '0'
                    }}>
                      <div style={{ position: 'relative', zIndex: 101, marginBottom: '2rem' }}>
                        <img 
                          src="/images/lowrider.jpg" 
                          alt="Lowrider" 
                          style={{
                            width: isMobile ? '280px' : '350px',
                            height: 'auto',
                            borderRadius: '15px',
                            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
                            border: '3px solid rgba(212, 175, 55, 0.4)'
                          }}
                        />
                      </div>
                      {/* BUY Button */}
                      <button
                        onClick={() => {
                          // Check if card is flipped by looking for the flipped class
                          const playingCard = document.querySelector('.playing-card');
                          if (playingCard && playingCard.classList.contains('flipped')) {
                            // Card is flipped, click the back button to flip it back
                            const flipBackBtn = document.querySelector('.flip-back-btn');
                            if (flipBackBtn) {
                              flipBackBtn.click();
                              setIsCardFlipped(false);
                            }
                          } else {
                            // Card is not flipped, click the front to flip it
                            const cardFront = document.querySelector('.card-front');
                            if (cardFront) {
                              cardFront.click();
                              setIsCardFlipped(true);
                            }
                          }
                        }}
                        style={{
                          marginTop: isMobile ? '1.5rem' : '2rem',
                          padding: isMobile ? '0.8rem 2rem' : '1rem 3rem',
                          fontSize: isMobile ? '1.2rem' : '1.4rem',
                          fontWeight: 'bold',
                          fontFamily: "'Fjalla One', sans-serif",
                          textTransform: 'uppercase',
                          letterSpacing: '2px',
                          color: '#000000',
                          background: 'linear-gradient(135deg, #d4af37 0%, #f4e4c1 50%, #d4af37 100%)',
                          border: '3px solid #d4af37',
                          borderRadius: '12px',
                          boxShadow: '0 8px 20px rgba(212, 175, 55, 0.4), 0 0 30px rgba(212, 175, 55, 0.3)',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          position: 'relative',
                          overflow: 'hidden',
                          zIndex: 102,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-3px) scale(1.05)';
                          e.currentTarget.style.boxShadow = '0 12px 30px rgba(212, 175, 55, 0.6), 0 0 40px rgba(212, 175, 55, 0.5)';
                          e.currentTarget.style.background = 'linear-gradient(135deg, #f4e4c1 0%, #ffd700 50%, #f4e4c1 100%)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0) scale(1)';
                          e.currentTarget.style.boxShadow = '0 8px 20px rgba(212, 175, 55, 0.4), 0 0 30px rgba(212, 175, 55, 0.3)';
                          e.currentTarget.style.background = 'linear-gradient(135deg, #d4af37 0%, #f4e4c1 50%, #d4af37 100%)';
                        }}
                      >
                        {isCardFlipped ? 'COMPLETE PURCHASE ABOVE' : 'BUY $RL80'}
                      </button>
                    </section>
                    {/* Right Column - Text Content */}
                   <div style={{
              padding: isMobile ? '0 0.5rem' : '0 1rem',
              color: '#ffffff',
              minHeight: isMobile ? '300px' : '500px', // Match the candle container height
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center', // Center all children horizontally
              width: '100%', // Ensure full width of grid column
              boxSizing: 'border-box', // Include padding in width calculation
              overflow: 'hidden', // Prevent content overflow
              position: 'relative',
              marginTop: isMobile ? '0' : '-3rem',
              order: isMobile ? 2 : 2 // Move text below card on mobile
            }}>
             
     
              <br/>
     
              <h1 style={{fontFamily: 'UnifrakturCook, serif', fontSize: isMobile ? '2.5rem' : '3.5rem', marginBottom: '1.5rem', textAlign: 'center', lineHeight: '2.2rem', color: '#d4af37'}}>She Sells Sanctuary</h1>
              <div style={{
                lineHeight: 1.7,
                opacity: 0.9,
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                fontWeight: 400,
                letterSpacing: '0.02em',
                fontSize: isMobile ? '1.2rem' : '1.4rem',
                textAlign: 'center',
                width: '100%',
                maxWidth: '600px',
              }}>
              <blockquote style={{ 
                fontSize: isMobile ? '1.4rem' : '1.9rem', 
                fontWeight: '600', 
                display: 'block', 
                marginBottom: '1.5rem', 
                lineHeight: '1.4',
                fontStyle: 'italic',
                textAlign: 'center',
                position: 'relative',
                padding: '1rem 2rem',
                borderLeft: '4px solid rgba(212, 175, 55, 0.6)',
                background: 'rgba(212, 175, 55, 0.05)',
                borderRadius: '8px'
              }}>
                "Trust Not, for the Code is Proof Enough."
                <cite style={{ 
                  display: 'block', 
                  marginTop: '0.8rem', 
                  fontSize: isMobile ? '0.9rem' : '1rem', 
                  fontWeight: '400', 
                  fontStyle: 'normal',
                  opacity: 0.8,
                  color: '#d4af37'
                }}>
                  — The Gospel of the Block 9:13
                </cite>
              </blockquote>
              <p style={{ marginBottom: '1rem' }}>
Whether you need a Hail Mary for hard times, or just sanctuary from the dark realm of DeFi, let Our Lady of Perpetual Profit light the way.                 <span style={{ display: 'block', marginTop: '0.5rem', fontSize: isMobile ? '0.9rem' : '1rem', opacity: 0.8, fontWeight: '500' }}>
                  Liquidity Burned | 4% Tax (Buy/Sell) | 80 Billion Capped Supply
                </span>
              </p>
{/* <p>RL80 includes a trust-optional layer of these sacred principles: <i><b>prosperity for all humanity</b></i> and <i><b>liquidity in perpetuity</b></i>.              </p>
              
              <p style={{ marginBottom: '1.5rem', opacity: 0.8, fontSize: isMobile ? '1rem' : '1.1rem' }}>
                If these ideals resonate with you, consider testing your faith with a small, cautious purchase of the RL80 token.
              </p> */}
              
              {/* <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
                <a href="https://base.blockscout.com/address/0x1234567890123456789012345678901234567890/contracts" target="_blank" rel="noopener noreferrer" style={{ color: '#d4af37', textDecoration: 'none', fontSize: isMobile ? '1rem' : '1.1rem' }}>
                  Examine the verified contract → <span style={{ position: 'relative', top: '2px', fontSize: '20px', padding: '0 4px' }}>📜</span><span style={{ position: 'relative', marginLeft: '-8px', fontSize: '8px', padding: '0 4px' }}>✅</span>
                </a>
              </div> */}

</div>
                  {/* Contract Address Container */}
                <div style={{
                  flex: '0 0 auto',
                  minWidth: isMobile ? '100%' : '300px',
                  width: isMobile ? '100%' : 'auto',
                  order: isMobile ? 3 : 1,
                  padding: isMobile ? '0 1rem' : '0',
                }}>
          
                         <div style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  justifyContent: 'center',
                  gap: '1rem',
                  marginBottom: '0.5rem',
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
                      {contractAddress.slice(0, 12)}...{contractAddress.slice(-4)}
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
                </div>
                
                    </div>
                    
                  </div>
      

{/*Staking Section*/}
 <div style={{
                    position: "relative",
                    margin: "20vh auto 4rem auto",
                    width: isMobile ? "90%" : "80%",
                    maxWidth: "1400px",
                    display: "grid",
                    gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 0.6fr) minmax(0, 0.4fr)", // Stack on mobile, 60% text, 40% card on desktop
                    gap: isMobile ? "2rem" : "3rem",
                    alignItems: "center",
                    padding: isMobile ? '2rem 1.5rem' : '3rem 2rem',
                    background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.05) 0%, rgba(0, 0, 0, 0.8) 50%, rgba(212, 175, 55, 0.05) 100%)',
                    backdropFilter: 'blur(12px)',
                    borderRadius: '25px',
                    border: '2px solid rgba(212, 175, 55, 0.4)',
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), inset 0 0 40px rgba(212, 175, 55, 0.1)',
                    color: '#ffffff',
                    gridColumn: '1 / -1'
                  }}>
                    {/* Left Column - Text Content */}
                   <div style={{
              padding: isMobile ? '0 0.5rem' : '0 1rem',
              color: '#ffffff',
              minHeight: isMobile ? '300px' : '500px', // Match the candle container height
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center', // Center all children horizontally
              width: '100%', // Ensure full width of grid column
              boxSizing: 'border-box', // Include padding in width calculation
              overflow: 'hidden', // Prevent content overflow
              position: 'relative',
              marginTop: isMobile ? '0' : '-3rem',
              order: isMobile ? 2 : 1 // Move text above card on mobile, left on desktop
            }}>
             
     
              <br/>
     
              <h1 style={{fontFamily: 'UnifrakturCook, serif', fontSize: isMobile ? '2.5rem' : '3.5rem', textAlign: 'center', lineHeight: '2.2rem', color: '#d4af37'}}>Money For Sta<span style={{fontFamily: 'PirataOne, serif'}}>k</span>ing</h1>
                            <h2 style={{fontFamily: 'UnifrakturCook, serif', textAlign: 'center', marginTop: '-1.5rem', color: '#d4af37'}}>(and Your Wic<span style={{fontFamily: 'PirataOne, serif'}}>k</span>s For Free)</h2>
              <div style={{
                lineHeight: 1.7,
                opacity: 0.9,
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                fontWeight: 400,
                letterSpacing: '0.02em',
                fontSize: isMobile ? '1.2rem' : '1.4rem',
                textAlign: 'center',
                width: '100%',
                maxWidth: '600px',
              }}>
              <blockquote style={{ 
                fontSize: isMobile ? '1.4rem' : '1.9rem', 
                fontWeight: '600', 
                display: 'block', 
                marginBottom: '1.5rem', 
                lineHeight: '1.4',
                fontStyle: 'italic',
                textAlign: 'center',
                position: 'relative',
                padding: '1rem 2rem',
                borderLeft: '4px solid rgba(212, 175, 55, 0.6)',
                background: 'rgba(212, 175, 55, 0.05)',
                borderRadius: '8px'
              }}>
                "Ye must Staketh, that Ye May Get Eth."
                <cite style={{ 
                  display: 'block', 
                  marginTop: '0.8rem', 
                  fontSize: isMobile ? '0.9rem' : '1rem', 
                  fontWeight: '400', 
                  fontStyle: 'normal',
                  opacity: 0.8,
                  color: '#d4af37'
                }}>
                  — Book of Profit 4:20
                </cite>
              </blockquote>
              <p style={{ marginBottom: '1rem' }}>
Get some righteous returns by staking your $RL80 and earn a share of the 4% tax on buys and sells. The more you stake, the more you earn - it's that simple. Includes a free virtual green candle.                <span style={{ display: 'block', marginTop: '0.5rem', fontSize: isMobile ? '0.9rem' : '1rem', opacity: 0.8, fontWeight: '500' }}>
                </span>
              </p>
</div>
                    </div>
                    {/* Right Column - Playing Card */}
                    <section className="card-section" style={{ 
                      position: "relative",
                      height: isMobile ? "auto" : "35rem",
                      minHeight: isMobile ? "30rem" : "auto",
                      overflow: "visible",
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      zIndex: 100,
                      pointerEvents: 'auto',
                      order: isMobile ? 1 : 2, // Keep card at top on mobile, right on desktop
                      paddingBottom: isMobile ? '2rem' : '0'
                    }}>
                      <div style={{ position: 'relative', zIndex: 101, marginBottom: '2rem' }}>
                        <img 
                          src="/images/mosaic.jpg" 
                          alt="Mosaic" 
                          style={{
                            width: isMobile ? '280px' : '350px',
                            height: 'auto',
                            borderRadius: '15px',
                            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
                            border: '3px solid rgba(212, 175, 55, 0.4)'
                          }}
                        />
                      </div>
                      {/* STAKE Button */}
                      <button
                        onClick={() => {
                          // Check if card is flipped by looking for the flipped class
                          const playingCard = document.querySelector('.playing-card');
                          if (playingCard && playingCard.classList.contains('flipped')) {
                            // Card is flipped, click the back button to flip it back
                            const flipBackBtn = document.querySelector('.flip-back-btn');
                            if (flipBackBtn) {
                              flipBackBtn.click();
                              setIsCardFlipped(false);
                            }
                          } else {
                            // Card is not flipped, click the front to flip it
                            const cardFront = document.querySelector('.card-front');
                            if (cardFront) {
                              cardFront.click();
                              setIsCardFlipped(true);
                            }
                          }
                        }}
                        style={{
                          marginTop: isMobile ? '1.5rem' : '2rem',
                          padding: isMobile ? '0.8rem 2rem' : '1rem 3rem',
                          fontSize: isMobile ? '1.2rem' : '1.4rem',
                          fontWeight: 'bold',
                          fontFamily: "'Fjalla One', sans-serif",
                          textTransform: 'uppercase',
                          letterSpacing: '2px',
                          color: '#000000',
                          background: 'linear-gradient(135deg, #d4af37 0%, #f4e4c1 50%, #d4af37 100%)',
                          border: '3px solid #d4af37',
                          borderRadius: '12px',
                          boxShadow: '0 8px 20px rgba(212, 175, 55, 0.4), 0 0 30px rgba(212, 175, 55, 0.3)',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          position: 'relative',
                          overflow: 'hidden',
                          zIndex: 102,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-3px) scale(1.05)';
                          e.currentTarget.style.boxShadow = '0 12px 30px rgba(212, 175, 55, 0.6), 0 0 40px rgba(212, 175, 55, 0.5)';
                          e.currentTarget.style.background = 'linear-gradient(135deg, #f4e4c1 0%, #ffd700 50%, #f4e4c1 100%)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0) scale(1)';
                          e.currentTarget.style.boxShadow = '0 8px 20px rgba(212, 175, 55, 0.4), 0 0 30px rgba(212, 175, 55, 0.3)';
                          e.currentTarget.style.background = 'linear-gradient(135deg, #d4af37 0%, #f4e4c1 50%, #d4af37 100%)';
                        }}
                      >
                        {isCardFlipped ? 'COMPLETE PURCHASE ABOVE' : 'STAKE $RL80'}
                      </button>
                    </section>
                    
                  </div>





      
<div style={{position: 'relative', zIndex: 1, marginTop: '10rem'}}></div>
            {/* Floating Stats Section with Centered Coin */}
   

           
               
         

             
<div style={{position: 'relative', zIndex: 1, marginTop: '10rem'}}>
 <div ref={secondTitleRef} style={{
          textAlign: 'center',
          padding: isMobile ? '3rem 1.5rem' : '5rem 2rem',
          maxWidth: '900px',
          margin: '0 auto',
        }}>
          {/* Animated Drop-In Title */}
          <DropInTitle
            lines={["PROSPER80", "FOR ALL", "HUMAN80!"]}
            colors={["#d4af37", "#f4e4c1", "#ffd700"]}
            fontSize={{ mobile: "2.5rem", desktop: "4rem" }}
            isMobile={isMobile}
            triggerAnimation={secondTitleInView}
          />
</div>
         </div>
      {/* Flippable Cards Section - Triangle Layout */}
    
      
  <div style={{
                    position: "relative",
                    margin: "2rem auto 40vh auto",
                    width: isMobile ? "90%" : "80%",
                    maxWidth: "1400px",
                    display: "grid",
                    gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 0.6fr) minmax(0, 0.4fr)", // Stack on mobile, 60% hands scene, 40% text on desktop
                    gap: isMobile ? "2rem" : "3rem",
                    alignItems: "center",
                    padding: isMobile ? '2rem 1.5rem' : '3rem 2rem',
                    background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.05) 0%, rgba(0, 0, 0, 0.8) 50%, rgba(212, 175, 55, 0.05) 100%)',
                    backdropFilter: 'blur(12px)',
                    borderRadius: '25px',
                    border: '2px solid rgba(212, 175, 55, 0.4)',
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), inset 0 0 40px rgba(212, 175, 55, 0.1)',
                    color: '#ffffff',
                    gridColumn: '1 / -1'
                  }}>
                   
                  <div style={{
              height: isMobile ? '50vh' : '70vh',
              minHeight: '400px',
            }}>
              <HandsGLTFScene />
            </div>
               
                    {/* Right Column - Text Content */}
                   <div style={{
              padding: isMobile ? '0 0.5rem' : '0 1rem',
              color: '#ffffff',
              minHeight: isMobile ? '300px' : '500px', // Match the candle container height
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center', // Center all children horizontally
              width: '100%', // Ensure full width of grid column
              boxSizing: 'border-box', // Include padding in width calculation
              overflow: 'hidden', // Prevent content overflow
              position: 'relative',
              marginTop: isMobile ? '0' : '-3rem'
            }}>
             
     
              <br/>
     
              <h1 style={{fontFamily: 'UnifrakturCook, serif', fontSize: isMobile ? '2.5rem' : '3.5rem', marginBottom: '1.5rem', textAlign: 'center', lineHeight: '0.8',color: '#d4af37'}}>Get On Her Watchlist</h1>
       
              <div style={{
                lineHeight: 1.7,
                opacity: 0.9,
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                fontWeight: 400,
                letterSpacing: '0.02em',
                fontSize: isMobile ? '1.2rem' : '1.4rem',
                textAlign: 'center',
                width: '100%',
                maxWidth: '600px',
              }}>
              <span style={{ fontSize: isMobile ? '1.3rem' : '1.8rem', fontWeight: '600', display: 'block', marginBottom: '1.5rem', lineHeight: '1.3' }}>
                Add a Green Candle to Her Timeline
              </span>
              <img src="/timeline2.png" alt="Candle Icon" style={{ width: isMobile ? '50%' : '50%', height: 'auto', marginBottom: '-3rem', marginTop: '-3rem' }} />
              <p style={{ marginBottom: '2rem' }}>
Share your wish, dedication or confession on a virtual votive candle.

          
 </p>
              
              <p style={{ marginBottom: '1rem', opacity: 0.8, fontSize: isMobile ? '1rem' : '1.1rem' }}>
                Design a custom votive candle for the Patron Saint of Day Traders and stake or burn any amount of RL80 to light, publish, and share it. Your act of devotion will strengthen RL80's tokenomics and earn a place on her watchlist.
              </p>

          </div>
       <button
                        onClick={handleOpenModal}
                         style={{
                          marginTop: isMobile ? '1.5rem' : '2rem',
                          padding: isMobile ? '0.8rem 2rem' : '1rem 3rem',
                          fontSize: isMobile ? '1.2rem' : '1.4rem',
                          fontWeight: 'bold',
                          fontFamily: "'Fjalla One', sans-serif",
                          textTransform: 'uppercase',
                          letterSpacing: '2px',
                          color: '#000000',
                          background: 'linear-gradient(135deg, #d4af37 0%, #f4e4c1 50%, #d4af37 100%)',
                          border: '3px solid #d4af37',
                          borderRadius: '12px',
                          boxShadow: '0 8px 20px rgba(212, 175, 55, 0.4), 0 0 30px rgba(212, 175, 55, 0.3)',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          position: 'relative',
                          overflow: 'hidden',
                          zIndex: 102,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-3px) scale(1.05)';
                          e.currentTarget.style.boxShadow = '0 12px 30px rgba(212, 175, 55, 0.6), 0 0 40px rgba(212, 175, 55, 0.5)';
                          e.currentTarget.style.background = 'linear-gradient(135deg, #f4e4c1 0%, #ffd700 50%, #f4e4c1 100%)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0) scale(1)';
                          e.currentTarget.style.boxShadow = '0 8px 20px rgba(212, 175, 55, 0.4), 0 0 30px rgba(212, 175, 55, 0.3)';
                          e.currentTarget.style.background = 'linear-gradient(135deg, #d4af37 0%, #f4e4c1 50%, #d4af37 100%)';
                        }}
                      >
                        Get Lit
                      </button>
               
           
                    </div>
                    
                  </div>
                          {/* FAQ Section */}
        <div style={{
          position: 'relative',
          zIndex: 50,
          margin: '2rem auto',
          width: isMobile ? '90%' : '80%',
          maxWidth: '1400px',
          pointerEvents: 'auto'
        }}>
          <FAQSection />
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