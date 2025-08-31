"use client";

import React, { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import SlantedCarousel from '@/components/SlantedCarousel';
import { useMusic } from '@/components/MusicContext';
import { useUser, UserButton, SignInButton } from "@clerk/nextjs";
import CyberNav from '@/components/CyberNav';
import Link from 'next/link';
import Coin from '@/components/Coin';
import RotatingText from '@/components/RotatingText';
import '@/components/RotatingText.css';

// Dynamically import 3D carousel to avoid SSR issues
const Simple3DCarousel = dynamic(() => import('@/components/Simple3DCarousel'), {
  ssr: false,
  loading: () => <div style={{ height: '50vh', background: 'linear-gradient(135deg, #1a1a2e 0%, #0f0f1e 100%)', borderRadius: '12px' }} />
});

export default function HomePage() {
  const [fontLoaded, setFontLoaded] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(0);
  const coinRef = useRef(null);
  
  // Get user from Clerk
  const { user, isSignedIn } = useUser();
  
  // Get music context functions
  const { 
    play, 
    pause, 
    isPlaying: contextIsPlaying, 
    nextTrack, 
    currentTrack, 
    is80sMode 
  } = useMusic();
  
  // Show music controls if music is already playing
  const [showMusicControls, setShowMusicControls] = useState(contextIsPlaying);
  
  // Sync showMusicControls with playing state when it changes
  useEffect(() => {
    if (contextIsPlaying && !showMusicControls) {
      setShowMusicControls(true);
    }
  }, [contextIsPlaying]);
  
  useEffect(() => {
    // Ensure UnifrakturCook font is loaded
    const loadFont = async () => {
      try {
        await document.fonts.load('bold 7rem "UnifrakturCook"');
        setFontLoaded(true);
      } catch (e) {
        console.log('Font loading:', e);
        setFontLoaded(true);
      }
    };
    loadFont();
  }, []);
  
  // Check if mobile view and device - only run on client
  useEffect(() => {
    setIsClient(true);
    const checkViewport = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      setIsMobileView(width <= 768);
      setIsMobileDevice(width <= 768);
      setIsLandscape(width > height);
      setViewportHeight(height);
    };
    checkViewport();
    window.addEventListener('resize', checkViewport);
    window.addEventListener('orientationchange', checkViewport);
    return () => {
      window.removeEventListener('resize', checkViewport);
      window.removeEventListener('orientationchange', checkViewport);
    };
  }, []);

  // Sparkle effect for coin
  useEffect(() => {
    if (typeof window === "undefined" || !coinRef.current) {
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
  }, [isClient, isMobileView]);

  const carouselSlides = [
    {
      id: 1,
      backgroundImage: '/sacred.png',
      image: '/sacred.png',
      number: '01',
      title: 'Sacred Spaces',
      description: 'Enter the divine realm of perpetual profit.'
    },
    {
      id: 2,
      backgroundImage: '/vvv.jpg',
      image: '/vvv.jpg',
      number: '02',
      title: 'Digital Visions',
      description: 'Where technology meets spiritual transcendence.'
    },
    {
      id: 3,
      backgroundImage: '/nosferatu.png',
      image: '/nosferatu.png',
      number: '03',
      title: 'Gothic Dreams',
      description: 'Ancient mysteries in modern manifestation.'
    },
    {
      id: 4,
      backgroundImage: '/fountain.png',
      image: '/fountain.png',
      number: '04',
      title: 'Eternal Flow',
      description: 'The fountain of perpetual abundance.'
    },
    {
      id: 5,
      backgroundImage: '/vsClown.jpg',
      image: '/vsClown.jpg',
      number: '05',
      title: 'Cosmic Jest',
      description: 'Where humor meets the divine comedy.'
    }
  ];

  return (
    <>
      <link rel="stylesheet" href="/coin.css" />
      <style jsx global>{`
        @font-face {
          font-family: 'UnifrakturCook';
          src: url('/fonts/UnifrakturCook-Bold.ttf') format('truetype');
          font-weight: bold;
          font-style: normal;
          font-display: swap;
        }
        
        @font-face {
          font-family: 'Bowlby One SC';
          src: url('/fonts/BowlbyOneSC-Regular.ttf') format('truetype');
          font-weight: normal;
          font-style: normal;
          font-display: swap;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .spinning-record {
          animation: spin 3s linear infinite;
        }
        
        /* Fallback coin styles if CSS file doesn't load */
        .coin .front {
          background-color: #d4af37 !important;
        }
        .coin .back {
          background-color: #b8941f !important;
        }
        
        /* Desktop rotating text - larger size */
        .desktop-rotating-text .rotating-text-body {
          font-size: 4rem !important;
        }
        
        .desktop-rotating-text .t3xts {
          height: 70px !important;
        }
        
        /* Override purse centering */
        .purse {
          position: relative !important;
          top: auto !important;
          left: auto !important;
          margin: 0 auto !important;
          margin-top: 0 !important;
          margin-left: 0 !important;
        }
        
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
      <div className="home-page" style={{
        marginLeft: isClient && isMobileView ? '2rem' : '2rem', 
        marginRight: isClient && isMobileView ? '1rem' : 'auto', 
        marginTop: isClient && isMobileView ? '8rem' : '6rem',
        position: 'relative',
        maxWidth: isClient && !isMobileView ? '1400px' : '100%',
        paddingLeft: isClient && !isMobileView ? '3rem' : '1rem',
        paddingRight: isClient && !isMobileView ? '3rem' : '1rem'
      }}>
      {!isClient ? (
        // Server-side and initial client render placeholder
        <div style={{ 
          height: '50vh', 
          background: 'linear-gradient(135deg, #1a1a2e 0%, #0f0f1e 100%)', 
          borderRadius: '12px' 
        }} />
      ) : isMobileView ? (
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
      
      {/* Mobile Text Box - only shown on mobile */}
      {isClient && isMobileView && (
        <div style={{
          marginTop: '1rem',
          marginLeft: '0',
          marginRight: '0',
          padding: '1.5rem',
          background: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(10px)',
          borderRadius: '12px',
          border: '1px solid rgba(212, 175, 55, 0.3)',
          color: '#ffffff',
          fontSize: '1rem',
          lineHeight: 1.6,
          textAlign: 'left'
        }}>
          {/* <h2 style={{
            color: '#d4af37',
            marginBottom: '1rem',
            fontSize: '1.8rem'
          }}>Welcome to Our Sacred Digital Temple</h2> */}
          <p style={{ marginBottom: '1rem' }}>
            Experience the convergence of ancient wisdom and modern technology. 
            Our Lady of Perpetual Profit guides seekers through the digital realm, 
            offering enlightenment through carefully curated experiences.
          </p>
          <p>
            Navigate through our sacred scrolls, witness divine visions, and discover 
            the eternal flow of creative abundance that awaits those who dare to explore.
          </p>
        </div>
      )}
      
      {/* Desktop Layout Container */}
      {isClient && !isMobileView && (
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
            // marginBottom: "4rem"
          }}>
            {/* Title */}
            <h1 style={{ 
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
              whiteSpace: 'nowrap'
            }}>
              <span style={{ display: 'block' }}>Our Lady</span>
              <span style={{ display: 'block' }}>
                <span style={{ fontSize: "3rem" }}>of </span>
                Perpetual
              </span>
              <span style={{ display: 'block', marginLeft: "6rem" }}>Profit</span>
            </h1>
            
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
          
          {/* Text Box */}
          <div style={{
            position: "relative",
            margin: "0 auto",
            width: "80%",
            maxWidth: "80vw",
            padding: '1.8rem',
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(10px)',
            borderRadius: '12px',
            border: '1px solid rgba(212, 175, 55, 0.3)',
            color: '#ffffff',
            fontSize: isLandscape && viewportHeight < 800 ? '1.2rem' : '2rem',
            lineHeight: 1.2,
            textAlign: 'center',
            marginBottom: "3rem"
          }}>
            <p style={{ marginBottom: '1rem' }}>
              Experience the convergence of ancient wisdom and modern technology. 
              Our Lady of Perpetual Profit guides seekers through the digital realm, 
              offering enlightenment through carefully curated experiences.
            </p>
          </div>
          
          {/* Rotating Text Component */}
          <div style={{
            position: "relative",
            width: "90%",
            maxWidth: "1200px",
            margin: "0 auto"
          }}
          className="desktop-rotating-text">
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundImage: "url(/sacred.png)",
                backgroundPosition: "90% 20%",
                backgroundRepeat: "no-repeat",
                backgroundSize: "100%",
                opacity: 0.3,
                zIndex: 1,
              }}
            />
            <div style={{ position: "relative", zIndex: 2 }}>
              <RotatingText isDesktop={true} />
            </div>
          </div>
        </div>
      )}
      
      {/* Mobile Coin Component */}
      {isClient && isMobileView && (
        <div style={{ 
          position: "absolute", 
          top: "48rem",
          left: "50%",
          transform: "translateX(-50%)",
        }}>
          <div
            ref={isMobileView ? coinRef : null}
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
      )}
      
      {/* Rotating Text Component - only shown on mobile below the coin */}
      {isClient && isMobileView && (
        <div style={{ 
          position: "relative",
          marginTop: "1rem",
          width: "100%"
        }}>
          <div
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: "100%",
              height: "100%",
              backgroundImage: "url(/sacred.png)",
              backgroundPosition: "90% 20%",
              backgroundRepeat: "no-repeat",
              backgroundSize: "100%",
              transform: "scaleX(-1)",
              opacity: 0.3,
              zIndex: 1,
            }}
          />
          <div style={{ marginBottom: "2.25rem", marginTop: "19rem" }}>
            <div style={{ display: "flex", justifyContent: "center", width: "100%" }}>
              <div
                style={{
                  position: "relative",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  marginTop: "1.3rem",
                  marginBottom: "3rem",
                  width: "80vw",
                  maxWidth: "400px",
                  zIndex: 2,
                  overflow: "hidden"
                }}
              >
                <RotatingText />
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Mobile Title */}
      {isClient && isMobileView && (
        <h1 style={{ 
          position: "absolute",
          top: "-7rem",
          left: "1rem",
          color: "#8e662b",
          fontFamily: 'UnifrakturCook, UnifrakturMaguntia, serif',
          textShadow: "3px 3px 5px #000, -1px -1px 5px pink",
          fontSize: "3.5rem",
          fontWeight: 900,
          lineHeight: 0.8,
          transform: "rotate(-8deg) skew(-15deg)",
          zIndex: 1000,
          display: "block",
          visibility: "visible",
          opacity: 1,
          transition: "opacity 0.3s ease"
        }}>
          Our Lady <br />
          <span style={{ fontSize: "1.5rem" }}>of </span>
          Perpetual
          <br />
          <span style={{ marginLeft: "3rem" }}>Profit </span>
        </h1>
      )}
      
      {/* CyberNav Menu */}
      <CyberNav is80sMode={is80sMode} />
      
      {/* Music and User Controls Container */}
      <div style={{
        position: "fixed",
        top: isClient && isMobileDevice ? "70px" : "20px",
        right: isClient && isMobileDevice ? "20px" : "72px",
        display: "flex",
        flexDirection: isClient && isMobileDevice ? "column" : "row",
        gap: "10px",
        alignItems: isClient && isMobileDevice ? "flex-end" : "center",
        zIndex: 9999,
        opacity: isClient ? 1 : 0,
        transition: "opacity 0.3s ease"
      }}>
        {/* User Account Icon */}
        <div style={{ order: isClient && isMobileDevice ? 2 : 0 }}>
          {isSignedIn ? (
            <UserButton 
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: {
                    width: "40px",
                    height: "40px",
                    borderRadius: "8px",
                    border: "2px solid rgba(255, 255, 255, 0.2)",
                    backgroundColor: "rgba(0, 0, 0, 0.7)",
                    backdropFilter: "blur(10px)",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)"
                  }
                }
              }}
            />
          ) : (
            <SignInButton mode="modal">
              <button
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "8px",
                  backgroundColor: "rgba(0, 0, 0, 0.7)",
                  border: "2px solid rgba(255, 255, 255, 0.2)",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  backdropFilter: "blur(10px)",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
                }}
                title="Sign In"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </button>
            </SignInButton>
          )}
        </div>
        
        {/* Music Controls */}
        <div style={{ order: isClient && isMobileDevice ? 1 : 1 }}>
          {!showMusicControls ? (
            <button
              onClick={() => {
                setShowMusicControls(true);
                if (!contextIsPlaying) {
                  play();
                }
              }}
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "8px",
                backgroundColor: "rgba(0, 0, 0, 0.7)",
                border: "2px solid rgba(255, 255, 255, 0.2)",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.3s ease",
                backdropFilter: "blur(10px)",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
              }}
              title="Toggle Music"
            >
              <svg
                width="20"
                height="20"
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
                gap: "8px",
              }}
            >
              {/* Spinning Album Art */}
              <div
                className={contextIsPlaying ? "spinning-record" : ""}
                style={{
                  width: "40px",
                  height: "40px",
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
                  width: "32px",
                  height: "32px",
                  borderRadius: "4px",
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  border: "none",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
                title="Next Track"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                  width: "28px",
                  height: "28px",
                  borderRadius: "4px",
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  border: "1px solid rgba(255, 255, 255, 0.3)",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
                title="Close Music"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
      
      </div>
    </>
  );
}