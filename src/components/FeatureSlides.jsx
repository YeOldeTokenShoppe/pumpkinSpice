import React, { Suspense, useState, useEffect} from 'react';
import SkewedHeading from './SkewedHeading';
import HandsGLTFScene from "@/components/HandsGLTFScene";
import { useFirestoreResults } from '../utilities/useFirestoreResults';
import Numerology1 from './Numerology1';
import { Canvas } from '@react-three/fiber';
import Link from 'next/link';
import { useGLTF, OrbitControls, Environment, useAnimations } from '@react-three/drei';
import { EffectComposer, Bloom, ChromaticAberration } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import VideoScreens from "@/components/VideoScreens";






    const handleOpenModal = () => {
    if (!isSignedIn) {
      const btn = document.getElementById('hidden-sign-in-home3');
      btn?.click();
    } else {
      setIsModalOpen(true);
    }
  }


export const WatchlistSlide = () => {
    const [isMobile, setIsMobile] = useState(false);
    const topBurners = useFirestoreResults("burnedAmount");
    
    useEffect(() => {
      const checkMobile = () => setIsMobile(window.innerWidth <= 768);
      checkMobile();
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
    }, []);
  return (
    <div style={{
      width: "100%",
      height: "80vh",
      maxHeight: "80vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: isMobile ? "0" : "3rem 2rem",
      position: "relative",
      overflow: "hidden",
    }}>

      {/* 3D Canvas Background for mobile */}
      {isMobile && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '280px',
          zIndex: 1,
        }}>
          <HandsGLTFScene />
        </div>
      )}

      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "1.55fr 1.45fr",
        gap: isMobile ? "0" : "3rem",
        maxWidth: "1400px",
        width: "100%",
        alignItems: "center",
        position: "relative",
        zIndex: 2,
        height: "100%",
      }}>
        {/* Left side - 3D Canvas (desktop only) */}
        {!isMobile && (
          <div style={{
            height: "100%",
            minHeight: "500px",
            position: "relative",
          }}>
            <HandsGLTFScene />
          </div>
        )}

        {/* Right Column - Text Content */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: isMobile ? "center" : "flex-start",
          marginTop: isMobile ? "240px" : "0",
          padding: isMobile ? "0 1rem" : "0",
          height: isMobile ? "calc(75vh - 240px)" : "auto",
          overflowY: isMobile ? "auto" : "visible",
        }}>

          {/* Decorative eye */}
          {/* <div style={{ marginBottom: isMobile ? '0.25rem' : '1rem', opacity: 0.9, display: 'flex', justifyContent: 'center', width: '100%' }}>
            <EyeOfProvidence size={isMobile ? 25 : 50} />
          </div> */}
        
            
        
          <SkewedHeading 
            lines={["GET ON HER", "WATCHLIST"]}
            fontSize={isMobile ? "2rem" : "4rem"}
            color="#00ff9d"
            skewAngle={-2}
            shadowColor="#000"
            style={{ 
              marginBottom: isMobile ? "0.75rem" : "2rem",
              width: '100%',
              position: isMobile ? 'relative' : 'static',
              zIndex: isMobile ? 3 : 'auto',
              textShadow: isMobile ? '2px 2px 4px rgba(0,0,0,0.8)' : undefined
            }}
          />
          
          <div style={{
            lineHeight: 1.5,
            opacity: 0.9,
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            fontWeight: 400,
            letterSpacing: '0.02em',
            fontSize: isMobile ? '1rem' : '1.25rem',
            textAlign: isMobile ? 'center' : 'center',
            width: '100%',
          }}>
                       {/* <span style={{               fontFamily: "'Fjalla One', sans-serif",
   fontSize: isMobile ? '0.95rem' : '1.8rem', fontWeight: '600', display: 'block', marginBottom: isMobile ? '0.25rem' : '0.5rem', lineHeight: '1.2' }}>
                   Light a Green Candle for Luck
                 </span>          */}
          <p style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: isMobile ? '1rem' : '1.25rem',
            color: 'rgba(255, 255, 255, 0.85)',
            marginBottom: isMobile ? '1rem' : '0',
            lineHeight: isMobile ? 1.5 : 1.5,
            fontWeight: 400,
          }}>   Burn or stake RL80 to add a green candle to her timeline and watch miracles happen.  
                 </p>
   
                 {/* Top Burners Leaderboard */}
                 <div style={{
                   margin: isMobile ? '0.5rem 0' : '1.5rem 0',
                   padding: isMobile ? '0.5rem' : '1rem',
                   background: 'rgba(0, 0, 0, 0.4)',
                   backdropFilter: 'blur(20px)',
                   border: '1px solid rgba(212, 175, 55, 0.3)',
                   borderRadius: '15px',
                   color: '#ffffff',
                   fontFamily: "'Inter', sans-serif",
                   boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)',
                   width: '100%',
                   maxWidth: '500px',
                 }}>
                   <h3 style={{
                     fontSize: isMobile ? '0.9rem' : '1.4rem',
                     color: '#d4af37',
                     textAlign: 'center',
                     marginBottom: isMobile ? '0.3rem' : '1rem',
                     fontFamily: "'Fjalla One', sans-serif",
                     textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)',
                   }}>
                     🔥 Leaderboard
                   </h3>
                   <div 
                     className="leaderboard-scroll"
                     style={{
                       maxHeight: isMobile ? '70px' : '150px',
                       overflowY: 'auto',
                       scrollbarWidth: 'thin',
                       scrollbarColor: 'rgba(212, 175, 55, 0.5) transparent',
                       paddingRight: '5px',
                     }}
                   >
                     {topBurners.slice(0, 10).map((burner, index) => (
                       <div 
                         key={burner.id || index} 
                         style={{
                           display: 'flex',
                           justifyContent: 'space-between',
                           alignItems: 'center',
                           padding: isMobile ? '0.25rem 0.25rem' : '0.5rem 0.5rem',
                           borderBottom: index < 9 ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
                           borderRadius: '8px',
                           transition: 'background 0.2s ease',
                           position: 'relative',
                         }}
                         onMouseEnter={(e) => {
                           e.currentTarget.style.background = 'rgba(212, 175, 55, 0.08)';
                         }}
                         onMouseLeave={(e) => {
                           e.currentTarget.style.background = 'transparent';
                         }}
                       >
                         <div style={{
                           display: 'flex',
                           alignItems: 'center',
                           gap: '0.5rem',
                         }}>
                           <span style={{
                             fontSize: isMobile ? '0.75rem' : '1rem',
                             fontWeight: 'bold',
                             color: index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : '#d4af37',
                             minWidth: '2rem',
                             display: 'flex',
                             alignItems: 'center',
                             gap: '0.25rem',
                           }}>
                             {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                           </span>
                           {burner.image && (
                             <div style={{
                               width: '24px',
                               height: '24px',
                               borderRadius: '50%',
                               overflow: 'hidden',
                               border: '1px solid rgba(212, 175, 55, 0.5)',
                               flexShrink: 0,
                             }}>
                               <img 
                                 src={burner.image} 
                                 alt={burner.userName || 'User'} 
                                 style={{
                                   width: '100%',
                                   height: '100%',
                                   objectFit: 'cover',
                                 }}
                                 onError={(e) => {
                                   e.target.style.display = 'none';
                                 }}
                               />
                             </div>
                           )}
                           <span style={{
                             fontSize: isMobile ? '0.75rem' : '1rem',
                             color: '#ffffff',
                           }}>
                             {burner.userName || 'Anonymous'}
                           </span>
                         </div>
                         <span style={{
                           fontSize: isMobile ? '0.65rem' : '0.9rem',
                           color: '#ffd700',
                           fontWeight: 'bold',
                           textShadow: '0 0 5px rgba(255, 215, 0, 0.3)',
                         }}>
                           {(burner.burnedAmount || 0).toLocaleString()} RL80
                         </span>
                       </div>
                     ))}
                     {topBurners.length === 0 && (
                       <div style={{
                         textAlign: 'center',
                         padding: '1rem',
                         color: 'rgba(255, 255, 255, 0.7)',
                         fontStyle: 'italic',
                       }}>
                         Loading top burners...
                       </div>
                     )}
                   </div>
                 </div>
   
          </div>
          
          <div style={{
            marginTop: isMobile ? '0.5rem' : '1.5rem',
            marginBottom: isMobile ? '0' : '1rem',
            zIndex: 102,
            flexShrink: 0,
            display: 'flex',
            justifyContent: 'center',
            width: '100%',
          }}>
            <NeonBorderButton
              onClick={handleOpenModal}
              isMobile={isMobile}
              variant="secondary"
            >
              Get Lit
            </NeonBorderButton>
          </div>
        </div>
      </div>
    </div>
  );
};




// Animated floating particles component
const FloatingParticles = () => {
  const [mounted, setMounted] = useState(false);
  const [particles, setParticles] = useState([]);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    // Generate particles only on client side
    setParticles(
      Array.from({ length: isMobile ? 10 : 20 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 5,
        duration: 8 + Math.random() * 4,
        size: 2 + Math.random() * 4,
      }))
    );
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Don't render until client-side
  if (!mounted) return null;

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.left}%`,
            bottom: '-10px',
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: 'radial-gradient(circle, rgba(255, 215, 0, 0.8) 0%, transparent 70%)',
            borderRadius: '50%',
            animation: `floatUp ${p.duration}s ${p.delay}s infinite ease-out`,
          }}
        />
      ))}
      <style>{`
        @keyframes floatUp {
          0% { transform: translateY(0) scale(1); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 0.6; }
          100% { transform: translateY(-700px) scale(0.3); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

// Animated Eye of Providence
const EyeOfProvidence = ({ size = 60, style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={style}>
    <defs>
      <linearGradient id="eyeGlow" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffd700" />
        <stop offset="100%" stopColor="#ff8c00" />
      </linearGradient>
      <filter id="glow">
        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    {/* Triangle */}
    <path
      d="M50 10 L90 80 L10 80 Z"
      fill="none"
      stroke="url(#eyeGlow)"
      strokeWidth="2"
      filter="url(#glow)"
    />
    {/* Eye */}
    <ellipse cx="50" cy="50" rx="18" ry="12" fill="none" stroke="#ffd700" strokeWidth="2" />
    <circle cx="50" cy="50" r="6" fill="#ffd700">
      <animate attributeName="r" values="6;7;6" dur="2s" repeatCount="indefinite" />
    </circle>
    {/* Rays */}
    {[...Array(8)].map((_, i) => (
      <line
        key={i}
        x1="50"
        y1="50"
        x2={50 + Math.cos((i * Math.PI) / 4) * 40}
        y2={50 + Math.sin((i * Math.PI) / 4) * 40}
        stroke="rgba(255, 215, 0, 0.3)"
        strokeWidth="1"
        strokeDasharray="2,4"
      >
        <animate
          attributeName="stroke-opacity"
          values="0.3;0.6;0.3"
          dur={`${2 + i * 0.2}s`}
          repeatCount="indefinite"
        />
      </line>
    ))}
  </svg>
);

// Compact Feature Card Component (for Trading Desk)
const CompactFeatureCard = ({ icon, title, subtitle, delay = 0, isMobile }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: isHovered 
          ? 'linear-gradient(135deg, rgba(5, 217, 232, 0.15) 0%, rgba(0, 0, 0, 0.8) 100%)'
          : 'linear-gradient(135deg, rgba(5, 217, 232, 0.05) 0%, rgba(0, 0, 0, 0.7) 100%)',
        backdropFilter: 'blur(12px)',
        padding: isMobile ? '0.5rem' : '1.25rem',
        borderRadius: '8px',
        border: `2px solid ${isHovered ? '#05d9e8' : 'rgba(5, 217, 232, 0.3)'}`,
        cursor: 'pointer',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isHovered ? 'translateY(-4px) scale(1.02)' : 'translateY(0) scale(1)',
        boxShadow: isHovered 
          ? '0 0 40px rgba(5, 217, 232, 0.5), 0 0 80px rgba(5, 217, 232, 0.3), inset 0 0 20px rgba(5, 217, 232, 0.1)'
          : '0 0 20px rgba(5, 217, 232, 0.2), inset 0 0 10px rgba(5, 217, 232, 0.05)',
        animation: `fadeSlideIn 0.6s ${delay}s both ease-out`,
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        minHeight: isMobile ? "80px" : "120px",
        justifyContent: 'center',
      }}
    >
      {/* Shimmer effect */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: '-100%',
        width: '100%',
        height: '100%',
        background: 'linear-gradient(90deg, transparent, rgba(5, 217, 232, 0.2), transparent)',
        animation: isHovered ? 'shimmer 1.5s infinite' : 'none',
      }} />
      
      <div style={{ 
        fontSize: isMobile ? '1.5rem' : '2rem', 
        marginBottom: isMobile ? '0.25rem' : '0.5rem',
        filter: isHovered ? 'drop-shadow(0 0 12px rgba(5, 217, 232, 0.8))' : 'none',
        transition: 'filter 0.3s ease',
      }}>
        {icon}
      </div>
      <div style={{ 
        color: '#05d9e8', 
        fontWeight: '700', 
        marginBottom: isMobile ? '0.2rem' : '0.3rem',
        fontSize: isMobile ? '0.7rem' : '0.9rem',
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        textShadow: isHovered ? '0 0 10px rgba(5, 217, 232, 0.8)' : 'none',
        transition: 'text-shadow 0.3s ease',
      }}>
        {title}
      </div>
      <div style={{ 
        fontSize: isMobile ? '0.6rem' : '0.75rem', 
        color: 'rgba(255, 255, 255, 0.6)',
        lineHeight: 1.3,
      }}>
        {subtitle}
      </div>
    </div>
  );
};

// Feature Card Component
const FeatureCard = ({ icon, title, subtitle, delay = 0, isMobile }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: isHovered 
          ? 'linear-gradient(135deg, rgba(5, 217, 232, 0.15) 0%, rgba(0, 0, 0, 0.8) 100%)'
          : 'linear-gradient(135deg, rgba(5, 217, 232, 0.05) 0%, rgba(0, 0, 0, 0.7) 100%)',
        backdropFilter: 'blur(12px)',
        padding: isMobile ? '0.75rem' : '1.75rem',
        borderRadius: '8px',
        border: `2px solid ${isHovered ? '#05d9e8' : 'rgba(5, 217, 232, 0.3)'}`,
        cursor: 'pointer',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isHovered ? 'translateY(-4px) scale(1.02)' : 'translateY(0) scale(1)',
        boxShadow: isHovered 
          ? '0 0 40px rgba(5, 217, 232, 0.5), 0 0 80px rgba(5, 217, 232, 0.3), inset 0 0 20px rgba(5, 217, 232, 0.1)'
          : '0 0 20px rgba(5, 217, 232, 0.2), inset 0 0 10px rgba(5, 217, 232, 0.05)',
        animation: `fadeSlideIn 0.6s ${delay}s both ease-out`,
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
      }}
    >
      {/* Shimmer effect */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: '-100%',
        width: '100%',
        height: '100%',
        background: 'linear-gradient(90deg, transparent, rgba(5, 217, 232, 0.2), transparent)',
        animation: isHovered ? 'shimmer 1.5s infinite' : 'none',
      }} />
      
      <div style={{ 
        fontSize: isMobile ? '1.75rem' : '2.5rem', 
        marginBottom: isMobile ? '0.4rem' : '0.75rem',
        filter: isHovered ? 'drop-shadow(0 0 12px rgba(5, 217, 232, 0.8))' : 'none',
        transition: 'filter 0.3s ease',
      }}>
        {icon}
      </div>
      <div style={{ 
        color: '#05d9e8', 
        fontWeight: '700', 
        marginBottom: isMobile ? '0.3rem' : '0.5rem',
        fontSize: isMobile ? '0.8rem' : '1.1rem',
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        textShadow: isHovered ? '0 0 10px rgba(5, 217, 232, 0.8)' : 'none',
        transition: 'text-shadow 0.3s ease',
      }}>
        {title}
      </div>
      <div style={{ 
        fontSize: isMobile ? '0.65rem' : '0.85rem', 
        color: 'rgba(255, 255, 255, 0.6)',
        lineHeight: isMobile ? 1.3 : 1.5,
      }}>
        {subtitle}
      </div>
    </div>
  );
};

// Neon Border Button Component with Animated Cyan Lines
const NeonBorderButton = ({ children, onClick, isMobile, variant = 'primary' }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const colors = {
    primary: {
      color: '#03e9f4',
      filter: 'hue-rotate(0deg)',
    },
    secondary: {
      color: '#00ff9d',
      filter: 'hue-rotate(110deg)',
    },
    tertiary: {
      color: '#ff00ff',
      filter: 'hue-rotate(270deg)',
    }
  };
  
  const c = colors[variant];
  
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <style>{`
        @keyframes neon-line-top {
          0% { left: -100%; }
          50%, 100% { left: 100%; }
        }
        @keyframes neon-line-right {
          0% { top: -100%; }
          50%, 100% { top: 100%; }
        }
        @keyframes neon-line-bottom {
          0% { right: -100%; }
          50%, 100% { right: 100%; }
        }
        @keyframes neon-line-left {
          0% { bottom: -100%; }
          50%, 100% { bottom: 100%; }
        }
      `}</style>
      <button
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={onClick}
        style={{
          position: 'relative',
          display: 'inline-block',
          padding: isMobile ? '12px 20px' : '18px 30px',
          color: isHovered ? '#050801' : c.color,
          background: isHovered ? c.color : 'transparent',
          border: 'none',
          textDecoration: 'none',
          textTransform: 'uppercase',
          fontSize: isMobile ? '14px' : '16px',
          fontFamily: "'Fjalla One', sans-serif",
          fontWeight: 'bold',
          letterSpacing: isMobile ? '2px' : '4px',
          transition: '0.5s',
          overflow: 'hidden',
          cursor: 'pointer',
          filter: c.filter,
          boxShadow: isHovered ? 
            `0 0 5px ${c.color}, 0 0 25px ${c.color}, 0 0 50px ${c.color}, 0 0 200px ${c.color}` : 
            'none',
        }}
      >
        {children}
        
        {/* Top line */}
        <span style={{
          position: 'absolute',
          display: 'block',
          top: 0,
          left: 0,
          width: '100%',
          height: '2px',
          background: `linear-gradient(90deg, transparent, ${c.color})`,
          animation: 'neon-line-top 1s linear infinite',
        }} />
        
        {/* Right line */}
        <span style={{
          position: 'absolute',
          display: 'block',
          top: '-100%',
          right: 0,
          width: '2px',
          height: '100%',
          background: `linear-gradient(180deg, transparent, ${c.color})`,
          animation: 'neon-line-right 1s linear infinite',
          animationDelay: '0.25s',
        }} />
        
        {/* Bottom line */}
        <span style={{
          position: 'absolute',
          display: 'block',
          bottom: 0,
          right: 0,
          width: '100%',
          height: '2px',
          background: `linear-gradient(270deg, transparent, ${c.color})`,
          animation: 'neon-line-bottom 1s linear infinite',
          animationDelay: '0.5s',
        }} />
        
        {/* Left line */}
        <span style={{
          position: 'absolute',
          display: 'block',
          bottom: '-100%',
          left: 0,
          width: '2px',
          height: '100%',
          background: `linear-gradient(360deg, transparent, ${c.color})`,
          animation: 'neon-line-left 1s linear infinite',
          animationDelay: '0.75s',
        }} />
      </button>
    </div>
  );
};

// Cyberpunk Glitch Button Component (keeping for reference)
const GlitchButton = ({ children, onClick, isMobile, variant = 'primary' }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const colors = {
    primary: {
      bg: '#FF013C',
      shadow: '#00E6F6',
      textShadow1: '#F8F005',
      textShadow2: '#00E6F6',
    },
    secondary: {
      bg: '#00E6F6',
      shadow: '#FF013C',
      textShadow1: '#000',
      textShadow2: '#FF013C',
    }
  };
  
  const c = colors[variant];
  
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <style>{`
        @keyframes glitch-${variant} {
          0% {
            clip-path: inset(80% -6px 0 0);
            transform: translate(-20px, -10px);
          }
          10% {
            clip-path: inset(10% -6px 85% 0);
            transform: translate(10px, 10px);
          }
          20% {
            clip-path: inset(80% -6px 0 0);
            transform: translate(-10px, 10px);
          }
          30% {
            clip-path: inset(10% -6px 85% 0);
            transform: translate(0px, 5px);
          }
          40% {
            clip-path: inset(50% -6px 30% 0);
            transform: translate(-5px, 0px);
          }
          50% {
            clip-path: inset(10% -6px 85% 0);
            transform: translate(5px, 0px);
          }
          60% {
            clip-path: inset(40% -6px 43% 0);
            transform: translate(5px, 10px);
          }
          70% {
            clip-path: inset(50% -6px 30% 0);
            transform: translate(-10px, 10px);
          }
          80% {
            clip-path: inset(80% -6px 5% 0);
            transform: translate(20px, -10px);
          }
          90% {
            clip-path: inset(80% -6px 0 0);
            transform: translate(-10px, 0px);
          }
          100% {
            clip-path: inset(80% -6px 0 0);
            transform: translate(0);
          }
        }
      `}</style>
      <button
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={onClick}
        style={{
          width: isMobile ? '200px' : '280px',
          height: isMobile ? '50px' : '60px',
          fontSize: isMobile ? '18px' : '24px',
          fontFamily: "'Fjalla One', sans-serif",
          background: `linear-gradient(45deg, transparent 5%, ${c.bg} 5%)`,
          border: 0,
          color: '#fff',
          letterSpacing: '3px',
          lineHeight: isMobile ? '50px' : '60px',
          boxShadow: `6px 0px 0px ${c.shadow}`,
          outline: 'transparent',
          position: 'relative',
          cursor: 'pointer',
          textTransform: 'uppercase',
          fontWeight: 'bold',
        }}
      >
        {children}
        <div
          style={{
            content: '""',
            display: isHovered ? 'block' : 'none',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `linear-gradient(45deg, transparent 3%, ${c.shadow} 3%, ${c.shadow} 5%, ${c.bg} 5%)`,
            textShadow: `-3px -3px 0px ${c.textShadow1}, 3px 3px 0px ${c.textShadow2}`,
            clipPath: 'inset(50% 50% 50% 50%)',
            animation: isHovered ? `glitch-${variant} 1s steps(2, end)` : 'none',
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: isMobile ? '18px' : '24px',
            fontFamily: "'Fjalla One', sans-serif",
            letterSpacing: '3px',
            fontWeight: 'bold',
            textTransform: 'uppercase',
          }}
        >
          {children}
        </div>
      </button>
    </div>
  );
};

// Glowing Button Component (keeping for backward compatibility)
const GlowButton = ({ children, variant = 'primary', onClick, isMobile }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const styles = {
    primary: {
      background: 'linear-gradient(135deg, #dc2626 0%, #f97316 50%, #dc2626 100%)',
      backgroundSize: '200% 200%',
      shadow: 'rgba(239, 68, 68, 0.5)',
    },
    secondary: {
      background: 'linear-gradient(135deg, #ffd700 0%, #ffaa00 50%, #ffd700 100%)',
      backgroundSize: '200% 200%',
      shadow: 'rgba(255, 215, 0, 0.5)',
    },
  };
  
  const s = styles[variant];
  
  return (
    <button
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      style={{
        background: s.background,
        backgroundSize: s.backgroundSize,
        color: variant === 'secondary' ? '#000' : '#fff',
        border: 'none',
        padding: isMobile ? '8px 16px' : '14px 36px',
        fontSize: isMobile ? '0.75rem' : '0.95rem',
        fontWeight: '800',
        letterSpacing: '0.1em',
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isHovered ? 'translateY(-2px) scale(1.05)' : 'translateY(0) scale(1)',
        boxShadow: isHovered 
          ? `0 12px 30px ${s.shadow}, 0 0 20px ${s.shadow}`
          : `0 4px 15px rgba(0, 0, 0, 0.3)`,
        animation: isHovered ? 'gradientShift 2s ease infinite' : 'none',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {children}
    </button>
  );
};

export const Illumin80Slide = () => {
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div style={{
      width: '100%',
      height: '80vh',
      maxHeight: '80vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: isMobile ? '0' : '1rem 2rem',
      position: 'relative',
      overflow: isMobile ? 'auto' : 'hidden',
    }}>
      {/* Global animations */}
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0% { left: -100%; }
          100% { left: 100%; }
        }
        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        @keyframes rotateGlow {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700;900&family=Cormorant+Garamond:wght@400;600&display=swap');
      `}</style>

      {/* Atmospheric background elements */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(ellipse at 70% 50%, rgba(255, 215, 0, 0.08) 0%, transparent 50%)',
        pointerEvents: 'none',
      }} />
      
      {/* Rotating geometric pattern behind 3D model */}
      <div style={{
        position: 'absolute',
        right: '10%',
        top: '50%',
        width: '500px',
        height: '500px',
        border: '1px solid rgba(255, 215, 0, 0.1)',
        borderRadius: '50%',
        animation: 'rotateGlow 60s linear infinite',
        pointerEvents: 'none',
      }}>
        <div style={{
          position: 'absolute',
          inset: '40px',
          border: '1px solid rgba(255, 215, 0, 0.15)',
          borderRadius: '50%',
        }} />
        <div style={{
          position: 'absolute',
          inset: '80px',
          border: '1px solid rgba(255, 215, 0, 0.1)',
          borderRadius: '50%',
        }} />
      </div>

      <FloatingParticles />

      {/* 3D Canvas Background for mobile */}
      {isMobile && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '280px',
          zIndex: 1,
        }}>
          <Numerology1 />
        </div>
      )}

      {/* Main content grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1.1fr',
        gap: isMobile ? '0' : '3rem',
        maxWidth: '1400px',
        width: '100%',
        alignItems: isMobile ? 'center' : 'center',
        position: 'relative',
        zIndex: 2,
        height: '100%',
      }}>
        {/* Left side - Content */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          animation: mounted ? 'fadeSlideIn 0.8s ease-out' : 'none',
          marginTop: isMobile ? '180px' : '0',
          padding: isMobile ? '0 1rem' : '0',
        }}>
          {/* Decorative eye */}
          {/* <div style={{ marginBottom: isMobile ? '0.5rem' : '1rem', opacity: 0.9, display: 'flex', justifyContent: 'center', width: '100%' }}>
            <EyeOfProvidence size={isMobile ? 30 : 50} />
          </div> */}

          {/* Main heading */}
          {/* <h2 style={{
            fontFamily: "'Blackletter', serif !important",
            fontSize: 'clamp(2.5rem, 5vw, 4rem)',
            fontWeight: 900,
            color: '#ffd700',
            margin: '0 0 1.5rem 0',
            letterSpacing: '0.08em',
            textShadow: '0 0 40px rgba(255, 215, 0, 0.4), 0 0 80px rgba(255, 215, 0, 0.2)',
            lineHeight: 1.1,
            textTransform: 'uppercase',
          }}>
            The Illumin80
          </h2> */}
          <SkewedHeading 
       lines={["THE", "ILLUMIN80"]}
   fontSize={isMobile ? "2rem" : "4rem"}
          color="#00ff9d"
          skewAngle={-2}
          shadowColor="#000"
          style={{ 
            marginBottom: isMobile ? "0.75rem" : "2rem",
            position: isMobile ? 'relative' : 'static',
            zIndex: isMobile ? 3 : 'auto',
            textShadow: isMobile ? '2px 2px 4px rgba(0,0,0,0.8)' : undefined
          }}
     />



          {/* Description */}
          <p style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: isMobile ? '1rem' : '1.25rem',
            color: 'rgba(255, 255, 255, 0.85)',
            marginBottom: isMobile ? '1rem' : '0',
            lineHeight: isMobile ? 1.5 : 1.8,
            fontWeight: 400,
          }}>
            Part mystery cult, part secret trading guild. The Illumin80 represent the{' '}
            <span style={{ color: '#ffd700', fontWeight: 600 }}>true believers</span>{' '}
            among token holders — measured by amount staked or burned. A level that unlocks{' '}
            <span style={{ color: '#ffd700', fontStyle: 'italic' }}>even more glorious gains</span>.
            {!isMobile && (<><br /><br /></>)}
            {/* <span style={{ fontSize: isMobile ? '0.85rem' : '1rem', opacity: 0.7, display: isMobile ? 'block' : 'inline', marginTop: isMobile ? '0.5rem' : '0' }}>Powerful, but not evil.</span> */}
          </p>

          {/* Feature cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: isMobile ? '0.5rem' : '1.25rem',
            marginBottom: isMobile ? '0.75rem' : '0.5rem',
            width: '100%',
            maxWidth: isMobile ? '100%' : '480px',
          }}>
            <FeatureCard 
              icon="🔺" 
              title="Secret Access" 
              subtitle="Hidden features unlock for the initiated"
              delay={0.2}
              isMobile={isMobile}
            />
            <FeatureCard 
              icon="👁️" 
              title="All-Seeing" 
              subtitle="Market insights delivered first"
              delay={0.4}
              isMobile={isMobile}
            />
          </div>

          {/* CTA Button */}
          <div style={{ display: 'flex', justifyContent: 'center', width: '100%', maxWidth: '480px' }}>
            <NeonBorderButton variant="primary" isMobile={isMobile}>
              JOIN ILLUMIN80
            </NeonBorderButton>
          </div>
        </div>

        {/* Right side - 3D Canvas (desktop only) */}
        {!isMobile && (
          <div style={{
            height: '100%',
            minHeight: '550px',
            position: 'relative',
          }}>
            <Numerology1 />
          </div>
        )}
      </div>
    </div>
  );
};

export default Illumin80Slide;
// Trading Desk 3D Model Component
function TradingDeskModel() {
  const { scene, animations } = useGLTF('/models/tradingDesk3.glb');
  const { actions } = useAnimations(animations, scene);
  
  useEffect(() => {
    // Play the 'Take001' animation if it exists
    if (actions['Take 001']) {
      actions['Take 001'].play();
    }
  }, [actions]);
  
  return (
    <primitive 
      object={scene} 
      scale={[0.9, 0.9, 0.9]}
      position={[0, -0.7, 0]}
      rotation={[0, 0, 0]}
    />
  );
}

export const TradingDeskSlide = () => {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  return (
    <div style={{
      width: "100%",
      height: "80vh",
      maxHeight: "80vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: isMobile ? "0" : "3rem 2rem",
      position: "relative",
      overflow: "hidden",
    }}>

      {/* 3D Canvas Background for mobile */}
      {isMobile && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '280px',
          zIndex: 1,
        }}>
          <Canvas
            camera={{ position: [0, 2, 6], fov: 40 }}
            style={{ width: "100%", height: "100%" }}
          >
            <ambientLight intensity={0.6} />
            <pointLight position={[-10, -10, -5]} intensity={0.6} color="#00ff9d" />
            <spotLight position={[5, 5, 5]} angle={0.3} penumbra={0.5} intensity={0.8} color="#00ff9d" />
            <Suspense fallback={null}>
              <TradingDeskModel />
              <VideoScreens />
              <Environment preset="city" />
            </Suspense>
            <OrbitControls 
              enableZoom={false}
              enablePan={false}
              maxPolarAngle={Math.PI / 2.2}
              minPolarAngle={Math.PI / 3.5}
            />
            <EffectComposer>
              <Bloom 
                intensity={1.5}
                luminanceThreshold={0.6}
                luminanceSmoothing={0.9}
                blendFunction={BlendFunction.ADD}
              />
              <ChromaticAberration
                blendFunction={BlendFunction.NORMAL}
                offset={[0.0005, 0.0005]}
                radialModulation={false}
              />
            </EffectComposer>
          </Canvas>
        </div>
      )}

      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
        gap: isMobile ? "0" : "3rem",
        maxWidth: "1400px",
        width: "100%",
        alignItems: "center",
        position: "relative",
        zIndex: 2,
        height: "100%",
      }}>
        {/* Left side - Content */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: isMobile ? "center" : "flex-start",
          marginTop: isMobile ? "180px" : "0",
          padding: isMobile ? "0 1rem" : "0",
          height: isMobile ? "calc(75vh - 180px)" : "auto",
          overflowY: isMobile ? "auto" : "visible",
        }}>
          <SkewedHeading
            lines={["MULTI-AGENT", "TRADING DESK"]}
            fontSize={isMobile ? "2rem" : "4rem"}
            color="#00ff9d"
            skewAngle={-2}
            shadowColor="#000"
            style={{ 
              marginBottom: isMobile ? "0.75rem" : "2rem", 
              width: '100%',
              position: isMobile ? 'relative' : 'static',
              zIndex: isMobile ? 3 : 'auto',
              textShadow: isMobile ? '2px 2px 4px rgba(0,0,0,0.8)' : undefined
            }}
          />
          
          <p style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: isMobile ? '1rem' : '1.25rem',
            color: 'rgba(255, 255, 255, 0.85)',
            marginBottom: isMobile ? '1rem' : '2rem',
            lineHeight: isMobile ? 1.5 : 1.8,
            fontWeight: 400,
            textAlign: isMobile ? 'center' : 'center',
            width: '100%',
          }}>
            Watch live multi-agent collaborative trading on the Lighter Perpetual Decentralized Exchange testnet. 
            Real-time charts, AI-powered analysis, and an iterative learning system preparing for mainnet trading on behalf of stakeholders.

          </p>

          {/* Feature cards - compact version for Trading Desk */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: isMobile ? "0.5rem" : "1rem",
            marginBottom: isMobile ? "1rem" : "2rem",
            width: "100%",
            maxWidth: isMobile ? "350px" : "100%",
          }}>
            <CompactFeatureCard 
              icon="📊" 
              title="Live Charts" 
              subtitle="Real-time data"
              delay={0.2}
              isMobile={isMobile}
            />
            <CompactFeatureCard 
              icon="🤖" 
              title="Multi-Agent" 
              subtitle="Smart predictions"
              delay={0.4}
              isMobile={isMobile}
            />
            <CompactFeatureCard 
              icon="📝" 
              title="Learning Mode" 
              subtitle="Paper trading"
              delay={0.6}
              isMobile={isMobile}
            />
          </div>


          <div style={{ display: 'flex', justifyContent: 'center', width: '100%', marginTop: isMobile ? '0.5rem' : '1rem' }}>
            <NeonBorderButton
              onClick={() => {}}
              isMobile={isMobile}
              variant="primary"
            >
              Watch Now
            </NeonBorderButton>
          </div>
        </div>

        {/* Right side - 3D Model */}
        {!isMobile && (
          <div style={{
            height: "100%",
            minHeight: "500px",
            position: "relative",
          }}>
            <Canvas
              camera={{ position: [0, 2, 6], fov: 40 }}
              style={{ width: "100%", height: "100%" }}
            >
              <ambientLight intensity={0.6} />
              {/* <directionalLight position={[10, 10, 5]} intensity={1.2} /> */}
              <pointLight position={[-10, -10, -5]} intensity={0.6} color="#00ff9d" />
              <spotLight position={[5, 5, 5]} angle={0.3} penumbra={0.5} intensity={0.8} color="#00ff9d" />
              <Suspense fallback={null}>
                <TradingDeskModel />
                <VideoScreens />
                <Environment preset="city" />
              </Suspense>
              <OrbitControls 
                enableZoom={false}
                enablePan={false}
                autoRotate
                autoRotateSpeed={0.3}
                maxPolarAngle={Math.PI / 2.2}
                minPolarAngle={Math.PI / 3.5}
              />
              <EffectComposer>
                <Bloom 
                  intensity={1.5}
                  luminanceThreshold={0.6}
                  luminanceSmoothing={0.9}
                  blendFunction={BlendFunction.ADD}
                />
                <ChromaticAberration
                  blendFunction={BlendFunction.NORMAL}
                  offset={[0.0005, 0.0005]}
                  radialModulation={false}
                />
              </EffectComposer>
            </Canvas>
          </div>
        )}
      </div>
    </div>
  );
};

// Preload the trading desk model
useGLTF.preload('/models/tradingDesk.glb');

export const TokenomicsSlide = () => {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  return (
    <div style={{
      width: "100%",
      minHeight: isMobile ? "auto" : "auto",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: isMobile ? "1.5rem 1rem" : "3rem 2rem",
      // background: "linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%)",
      position: "relative",
    }}>
      <div style={{
        maxWidth: "1000px",
        width: "100%",
      }}>
        <SkewedHeading
          lines={["TOKENOMICS"]}
          fontSize={isMobile ? "2.5rem" : "3.5rem"}
          color="#00ff9d"
          skewAngle={-2}
          shadowColor="#000"
          style={{ marginBottom: "2rem", textAlign: "center" }}
        />
        
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: isMobile ? "1rem" : "1.5rem",
          marginBottom: isMobile ? "1.5rem" : "2rem",
        }}>
          <div style={{
            background: "rgba(0, 0, 0, 0.4)",
            backdropFilter: "blur(10px)",
            borderRadius: "12px",
            padding: isMobile ? "1.25rem" : "1.5rem",
            border: "1px solid rgba(0, 255, 157, 0.2)",
          }}>
            <h3 style={{ color: "#fff", marginBottom: "1rem", fontSize: isMobile ? "1.1rem" : "1.2rem" }}>Supply Distribution</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "rgba(255, 255, 255, 0.7)" }}>Total Supply:</span>
                <span style={{ color: "#00ff9d", fontFamily: "monospace" }}>1,000,000,000</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "rgba(255, 255, 255, 0.7)" }}>Circulating:</span>
                <span style={{ color: "#fbbf24", fontFamily: "monospace" }}>800,000,000</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "rgba(255, 255, 255, 0.7)" }}>Burned:</span>
                <span style={{ color: "#ef4444", fontFamily: "monospace" }}>50,000,000</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "rgba(255, 255, 255, 0.7)" }}>Staked:</span>
                <span style={{ color: "#3b82f6", fontFamily: "monospace" }}>150,000,000</span>
              </div>
            </div>
          </div>
          
          <div style={{
            background: "rgba(0, 0, 0, 0.4)",
            backdropFilter: "blur(10px)",
            borderRadius: "12px",
            padding: isMobile ? "1.25rem" : "1.5rem",
            border: "1px solid rgba(0, 255, 157, 0.2)",
          }}>
            <h3 style={{ color: "#fff", marginBottom: "1rem", fontSize: isMobile ? "1.1rem" : "1.2rem" }}>Rewards System</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span style={{ fontSize: "1.5rem" }}>🔥</span>
                <div>
                  <div style={{ color: "rgba(255, 255, 255, 0.9)", fontSize: "0.9rem" }}>Burn Rewards</div>
                  <div style={{ color: "#00ff9d", fontSize: "0.75rem" }}>2x multiplier on luck</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span style={{ fontSize: "1.5rem" }}>💎</span>
                <div>
                  <div style={{ color: "rgba(255, 255, 255, 0.9)", fontSize: "0.9rem" }}>Stake Rewards</div>
                  <div style={{ color: "#00ff9d", fontSize: "0.75rem" }}>5% APY + bonuses</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span style={{ fontSize: "1.5rem" }}>🎁</span>
                <div>
                  <div style={{ color: "rgba(255, 255, 255, 0.9)", fontSize: "0.9rem" }}>Holder Benefits</div>
                  <div style={{ color: "#00ff9d", fontSize: "0.75rem" }}>Airdrops & access</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div style={{ textAlign: "center" }}>
          {/* <p style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: isMobile ? '1rem' : '1.25rem',
            color: 'rgba(255, 255, 255, 0.85)',
            marginBottom: isMobile ? '1rem' : '0',
            lineHeight: isMobile ? 1.5 : 1.5,
            fontWeight: 400,
          }}>       Join the cult of RL80!
          </p> */}
          <Link href="/tokenomics" style={{ textDecoration: 'none', display: 'inline-block' }}>
            <NeonBorderButton
              isMobile={isMobile}
              variant="secondary"
            >
              VIEW TOKENOMICS
            </NeonBorderButton>
          </Link>
        </div>
      </div>
    </div>
  );
};