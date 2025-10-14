"use client";

import React, { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import SlantedCarousel from '@/components/SlantedCarousel';
import Coin from '@/components/Coin';
import { useMusic } from '@/components/MusicContext';
import { useUser, SignInButton } from "@clerk/nextjs";
import { Illumin80ClerkButton } from "@/components/Illumin80Display";
import CyberNav from '@/components/CyberNav';
import SocialBar from '@/components/SocialBar';

// Dynamically import 3D carousel to avoid SSR issues
const Simple3DCarousel = dynamic(() => import('@/components/Simple3DCarousel'), {
  ssr: false,
  loading: () => <div style={{ height: '50vh', background: 'linear-gradient(135deg, #1a1a2e 0%, #0f0f1e 100%)', borderRadius: '12px' }} />
});

export default function Home4() {
  const [mounted, setMounted] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isTabletLandscape, setIsTabletLandscape] = useState(false);
  
  const [emoji, setEmoji] = useState("😇");
  const [showMusicControls, setShowMusicControls] = useState(false);
  const coinRef = useRef(null);
  const [isClient, setIsClient] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  

    useEffect(() => {
      // Set mounted to true after hydration
      setMounted(true);
      setIsClient(true);
      setPageLoading(false);
      
      // Check device type and orientation - only run on client
      const checkDevice = () => {
        if (typeof window === 'undefined') return;
        
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        // Mobile: up to 768px
        const mobile = width <= 768;
        setIsMobile(mobile);
        setIsMobileView(mobile);
        
        // Tablet: 768px to 1024px (includes both orientations)
        const tablet = width > 768 && width <= 1024;
        setIsTablet(tablet);
        
        // Tablet landscape: when tablet AND width > height
        const tabletLandscape = tablet && width > height;
        setIsTabletLandscape(tabletLandscape);
      };
      
      // Run check after mount to avoid hydration issues
      checkDevice();
      window.addEventListener('resize', checkDevice);
      window.addEventListener('orientationchange', checkDevice);
      
     
    }, []);
  

  // Sparkle effect for coin
    useEffect(() => {
      // Wait for client and page to be ready
      if (!isClient || pageLoading || !coinRef.current) {
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
          sparkle.removeChild(this.star);
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
    }, [isClient, isMobileView, pageLoading]);

  // Carousel slides data
  const carouselSlides = [
    {
      id: 4,
      backgroundImage: '/images/bullrider.jpg',
      image: '/images/bullrider.jpg',
      number: '04',
      title: 'UP AND TO THE RIGHT!',
      // description: 'She will guide you up and to the right.'
    },
    {
      id: 2,
      backgroundImage: '/images/deejay.jpg',
      image: '/images/deejay.jpg',
      number: '02',
      title: 'DEFI BEATS',
      // description: 'Curated playlists for algorithmic transcendence.'
    },
    {
      id: 3,
      backgroundImage: '/images/rl80vsMonster.png',
      image: '/images/rl80vsMonster.png',
      number: '03',
      title: 'WARD OFF EVIL',
      // description: 'Avoid scams, fiends, and insider schemes.'
    },
    {
      id: 1,
      backgroundImage: '/images/face.png',
      image: '/images/face.png',
      number: '01',
      title: 'AVOID FALSE PROFITS',
      // description: 'A mother usually knows best.'
    },
   
    {
      id: 5,
      backgroundImage: '/images/lowrider.jpg',
      image: '/images/lowrider.jpg',
      number: '05',
      title: 'GUARDIAN OF GOOD TIMES',
      // description: 'She offers you her protection with very smart contracts.'
    },
    {
      id: 0,
      backgroundImage: '/images/mosaic.jpg',
      image: '/images/mosaic.jpg',
      number: '05',
      title: 'PATRON OF THE ARTS',
      description: '#RL80'
    },
    
    {
      id: 7,
      backgroundImage: '/images/teknoir.jpg',
      image: '/images/teknoir.jpg',
      number: '05',
      title: 'F8TH IN THE FUTURE',
      // description: 'Even cyborgs need something to believe in.'
    },
    // {
    //   id: 8,
    //   backgroundImage: '/images/toast.jpg',
    //   image: '/images/toast.jpg',
    //   number: '05',
    //   title: 'PATTERN RECOGNITION',
    //   description: 'Separate signal from noise in market analysis.'
    // }
  ];

  // Auth state
  const { isSignedIn } = useUser();
  
  // Get music context functions
  const {
    play,
    pause,
    isPlaying: contextIsPlaying,
    nextTrack,
    currentTrack,
    is80sMode
  } = useMusic();

  // Sync showMusicControls with playing state when it changes
  useEffect(() => {
    if (contextIsPlaying && !showMusicControls) {
      setShowMusicControls(true);
    }
  }, [contextIsPlaying, showMusicControls]);

  // Alternate emoji for sign-in button
  useEffect(() => {
    const emojiInterval = setInterval(() => {
      setEmoji((prevEmoji) => (prevEmoji === "😇" ? "😈" : "😇"));
    }, 3000);
    return () => clearInterval(emojiInterval);
  }, []);

  useEffect(() => {
    setMounted(true);
    
    const checkMobileDevice = () => {
      const isMobile = window.innerWidth <= 768;
      setIsMobileDevice(isMobile);
      setIsMobileView(isMobile);
    };
    checkMobileDevice();
    
    window.addEventListener('resize', checkMobileDevice);
    return () => window.removeEventListener('resize', checkMobileDevice);
  }, []);

  return (
    <div style={{ 
      width: '100vw', 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a0033 0%, #87CEEB 50%, #0a001a 100%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      overflowX: 'hidden'
    }}>
      <link rel="stylesheet" href="/coin.css" />
      <style jsx global>{`
    
       /* Sparkle styles */
        .star {
          position: absolute;
          width: var(--star-size);
          height: var(--star-size);
          background: var(--star-color);
          clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
          animation: starAnimation var(--star-life) ease-out forwards;
          pointer-events: none;
          z-index: 1;
        }
        
        @keyframes starAnimation {
          from {
            left: var(--start-left);
            top: var(--start-top);
            opacity: 1;
            transform: scale(0) rotate(0deg);
          }
          50% {
            opacity: 1;
            transform: scale(1) rotate(180deg);
          }
          to {
            left: var(--end-left);
            top: var(--end-top);
            opacity: 0;
            transform: scale(0) rotate(360deg);
          }
        }
            `}</style>
      {/* Carousel Section - Top of page */}
      <div style={{
        marginLeft: isMobileView ? '2rem' : 'auto', 
        marginRight: isMobileView ? '1rem' : 'auto', 
        marginTop: isMobileView ? '8rem' : '6rem',
        position: 'relative',
        maxWidth: !isMobileView ? '1400px' : '100%',
        paddingLeft: !isMobileView ? '3rem' : '1rem',
        paddingRight: !isMobileView ? '3rem' : '1rem',
        paddingBottom: '2rem'
      }}>
        {isMobileView ? (
          <Simple3DCarousel 
            images={carouselSlides.map(slide => slide.image)}
            captions={carouselSlides.map(slide => ({
              title: slide.title,
              description: slide.description
            }))}
          />
        ) : (
          <SlantedCarousel 
            slides={carouselSlides}
            autoPlay={true}
            autoPlayInterval={5000}
            showNavigation={true}
            showArrows={true}
            showProgressBar={true}
            customCursor={false}
          />
        )}
      </div>

      {/* Desktop Layout Container */}
      {mounted && !isMobileView && (
        <div style={{
          position: "relative",
          marginTop: "28vh",
          width: "100%",
          minHeight: "60vh"
        }}>
          {/* Header and Coin Row */}
          <div style={{
            position: "relative",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            width: "100%",
            marginTop: "-15rem",
          }}>
            {/* Animated Title */}
            <h1 
              id="main-title"
              style={{ 
                position: "relative",
                left: "10%",
                color: "#8e662b",
                fontFamily: 'UnifrakturCook, UnifrakturMaguntia, serif',
                textShadow: "3px 3px 5px #000, -1px -1px 5px pink",
                fontSize: "7rem",
                fontWeight: 900,
                lineHeight: 0.8,
                transform: "rotate(-8deg) skew(-15deg)",
                zIndex: 1000,
                marginTop: '-3rem',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
              }}>
              <span className="title-line" style={{ display: 'block', position: 'relative' }}>Our Lady</span>
              <span className="title-line" style={{ display: 'block', position: 'relative' }}>
                <span style={{ fontSize: "3rem" }}>of </span>
                Perpetual
              </span>
              <span className="title-line" style={{ display: 'block', marginLeft: "6rem", position: 'relative' }}>Profit</span>
            </h1>
            
            {/* Coin */}
            {/* Coin */}
            <div style={{ 
              position: "relative",
              right: "15%",
              marginTop: "2rem"
            }}>
              <div
                ref={!isMobileView ? coinRef : null}
                style={{ 
                  position: "relative", 
                  width: "25rem", 
                  height: "25rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "visible"
                }}
              >
              <Link href="#" className="coin-link" style={{ 
                position: "relative", 
                zIndex: 10,
                display: "block",
                width: "9rem",
                height: "9rem"
              }}>
                <Coin />
              </Link>
                
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Main Content */}
      {mounted && isMobileView && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          textAlign: 'center',
          color: '#ffffff',
          padding: '2rem'
        }}>
          <div>
            <h1 style={{
              fontFamily: 'UnifrakturCook, serif',
              fontSize: '2.5rem',
              color: '#d4af37',
              textShadow: '3px 3px 5px #000, -1px -1px 5px rgba(255, 192, 203, 0.5)',
              marginBottom: '2rem',
              fontWeight: 'bold'
            }}>
              Our Lady of Perpetual Profit
            </h1>
            
            <p style={{
              fontSize: '1.2rem',
              marginBottom: '3rem',
              textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)',
              opacity: 0.9
            }}>
              Memory-efficient sanctuary with divine guidance
            </p>
          </div>
        </div>
      )}

      {/* Top Controls Container - Music, User, and Nav */}
      {mounted && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            display: "flex",
            flexDirection: isMobileDevice ? "column" : "row",
            gap: isMobileDevice ? "10px" : "15px",
            alignItems: isMobileDevice ? "flex-end" : "center",
            zIndex: 9999,
          }}
        >
          {/* Music Controls */}
          <div style={{ order: isMobileDevice ? 2 : 0 }}>
            {!showMusicControls ? (
              <button
                onClick={() => {
                  setShowMusicControls(true);
                  if (!contextIsPlaying) {
                    play();
                  }
                }}
                style={{
                  width: isMobileDevice ? "2.5rem" : "3.75rem",
                  height: isMobileDevice ? "2.5rem" : "3.75rem",
                  borderRadius: "0.5rem",
                  backgroundColor: "rgba(0, 0, 0, 0.7)",
                  border: "2px solid rgba(255, 255, 255, 0.2)",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  backdropFilter: "blur(10px)",
                  boxShadow: "0 0.125rem 0.5rem rgba(0, 0, 0, 0.3)",
                }}
                title="Toggle Music"
              >
                <svg
                  width={isMobileDevice ? "20" : "30"}
                  height={isMobileDevice ? "20" : "30"}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 18V5l12-2v13" />
                  <circle cx="6" cy="18" r="3" />
                  <circle cx="18" cy="16" r="3" />
                </svg>
              </button>
            ) : (
              // Compact Music Player Controls
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                {/* Spinning Album Art */}
                <div
                  className={contextIsPlaying ? "spinning-record" : ""}
                  style={{
                    width: isMobileDevice ? "2.5rem" : "3.75rem",
                    height: isMobileDevice ? "2.5rem" : "3.75rem",
                    borderRadius: "50%",
                    backgroundImage: "url('/virginRecords.jpg')",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                />
                
                {/* Skip Button */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (nextTrack) {
                      nextTrack();
                    }
                  }}
                  style={{
                    width: isMobileDevice ? "2rem" : "3rem",
                    height: isMobileDevice ? "2rem" : "3rem",
                    borderRadius: "0.375rem",
                    backgroundColor: "rgba(0, 0, 0, 0.7)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    backdropFilter: "blur(10px)",
                    boxShadow: "0 0.125rem 0.375rem rgba(0, 0, 0, 0.3)",
                  }}
                  title="Next Track"
                >
                  <svg width={isMobileDevice ? "16" : "24"} height={isMobileDevice ? "16" : "24"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="5 4 15 12 5 20 5 4"/>
                    <line x1="19" y1="5" x2="19" y2="19"/>
                  </svg>
                </button>
                
                {/* Close Button */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowMusicControls(false);
                    if (pause) {
                      pause();
                    }
                  }}
                  style={{
                    width: isMobileDevice ? "1.75rem" : "2.625rem",
                    height: isMobileDevice ? "1.75rem" : "2.625rem",
                    borderRadius: "0.375rem",
                    backgroundColor: "rgba(0, 0, 0, 0.7)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    backdropFilter: "blur(10px)",
                    boxShadow: "0 0.125rem 0.375rem rgba(0, 0, 0, 0.3)",
                  }}
                  title="Close Music"
                >
                  <svg width={isMobileDevice ? "14" : "21"} height={isMobileDevice ? "14" : "21"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            )}
          </div>
          
          {/* User Account */}
          <div style={{ order: isMobileDevice ? 1 : 1 }}>
            {isSignedIn ? (
              <Illumin80ClerkButton afterSignOutUrl="/" isMobileDevice={isMobileDevice} />
            ) : (
              <SignInButton mode="modal" forceRedirectUrl="/home4">
                <button
                  style={{
                    width: isMobileDevice ? "2.5rem" : "3.75rem",
                    height: isMobileDevice ? "2.5rem" : "3.75rem",
                    borderRadius: "0.5rem",
                    backgroundColor: "rgba(0, 0, 0, 0.7)",
                    border: "2px solid rgba(255, 255, 255, 0.2)",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    backdropFilter: "blur(10px)",
                    boxShadow: "0 0.125rem 0.5rem rgba(0, 0, 0, 0.3)",
                  }}
                  title="Sign In"
                >
                  <span style={{ fontSize: "2.2rem" }}>{emoji}</span>
                </button>
              </SignInButton>
            )}
          </div>
          
          {/* CyberNav Menu */}
          <div style={{ order: isMobileDevice ? 0 : 2 }}>
            <CyberNav is80sMode={is80sMode} position="relative" />
          </div>
          
          {/* Social Bar */}
          <div style={{ order: isMobileDevice ? 4 : 3 }}>
            <SocialBar is80sMode={is80sMode} />
          </div>
        </div>
      )}
      
      {/* Hidden sign in button */}
      {!isSignedIn && (
        <SignInButton mode="modal" forceRedirectUrl="/home4">
          <button id="hidden-sign-in-home4" style={{ display: 'none' }}>Sign In</button>
        </SignInButton>
      )}

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .spinning-record {
          animation: spin 3s linear infinite;
        }

        @font-face {
          font-family: 'UnifrakturCook';
          src: url('/fonts/UnifrakturCook-Bold.ttf') format('truetype');
          font-weight: bold;
          font-style: normal;
          font-display: swap;
        }

        @font-face {
          font-family: 'UnifrakturMaguntia';
          src: url('/fonts/UnifrakturMaguntia-Regular.ttf') format('truetype');
          font-weight: normal;
          font-style: normal;
          font-display: swap;
        }
      `}</style>
    </div>
  );
}