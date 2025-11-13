'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const SlidingNav = () => {
  const pathname = usePathname();
  const [selectedIndex, setSelectedIndex] = useState(1);
  const [currentPage, setCurrentPage] = useState(0);
  const [viewMode, setViewMode] = useState('desktop');
  const [isMobile, setIsMobile] = useState(false);
  const [scanlinePos, setScanlinePos] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const navItems = [
    { id: '00', date: 'ICON ON I-80', title: "ROADMAP", path: '/', thumbnail: '/I80.png' },
    { id: '01', date: 'DEFI GRAV80', title: 'SOMETHING ABOUT RL80', path: '/home3', thumbnail: '/darkSky.png' },
    { id: '02', date: 'LIGHT UTIL80', title: 'THE ILLUMIN80', path: '/gallery3', thumbnail: '/heart.png' },
    { id: '03', date: 'PRAYER & PROBABIL80', title: 'TRADING DESK', path: '/temple', thumbnail: '/lightning.png' },
    { id: '04', date: 'ETHICS & MORAL80', title: 'SCROLLS OF ST. GR80', path: '/model-viewer', thumbnail: '/stgr81.png' },
    { id: '05', date: 'CHAR80 & LIQUID80', title: 'COIN FOUNTAIN', path: '/fountain', thumbnail: '/fountain2.png' },
  ];

  // Animate scanline
  useEffect(() => {
    const interval = setInterval(() => {
      setScanlinePos(prev => (prev + 1) % 100);
    }, 80);
    return () => clearInterval(interval);
  }, []);

  // Check viewport size and set appropriate view mode
  useEffect(() => {
    const checkViewport = () => {
      const width = window.innerWidth;
      
      if (width <= 480) {
        setViewMode('mobile');
        setIsMobile(true);
      } else if (width <= 768) {
        setViewMode('tablet-portrait');
        setIsMobile(false);
      } else if (width <= 1024) {
        setViewMode('tablet-landscape');
        setIsMobile(false);
      } else {
        setViewMode('desktop');
        setIsMobile(false);
      }
    };
    
    checkViewport();
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  // Find current page index
  useEffect(() => {
    const activeIndex = navItems.findIndex(item => item.path === pathname);
    if (activeIndex !== -1) {
      setSelectedIndex(activeIndex);
      // Auto-navigate to correct page when route changes
      const { visibleCount } = getTabDimensions();
      const newPage = Math.floor(activeIndex / visibleCount);
      setCurrentPage(newPage);
    }
  }, [pathname]);

  // Calculate responsive tab dimensions - uniform width
  const getTabDimensions = () => {
    switch(viewMode) {
      case 'tablet-portrait':
        return { 
          width: '280px',
          height: '120px',
          visibleCount: 2,
          fontSize: { number: '22px', title: '12px' },
          padding: '15px 20px'
        };
      case 'tablet-landscape':
        return { 
          width: '280px',
          height: '130px',
          visibleCount: 3,
          fontSize: { number: '24px', title: '13px' },
          padding: '20px 25px'
        };
      case 'desktop':
      default:
        return { 
          width: '280px',
          height: '160px',
          visibleCount: 4,
          fontSize: { number: '28px', title: '14px' },
          padding: '20px 25px'
        };
    }
  };

  const tabDimensions = getTabDimensions();

  // Calculate which tabs to show based on current page
  const getVisibleTabs = () => {
    const { visibleCount } = tabDimensions;
    const startIndex = currentPage * visibleCount;
    return navItems.slice(startIndex, startIndex + visibleCount);
  };

  // Calculate total pages needed
  const getTotalPages = () => {
    const { visibleCount } = tabDimensions;
    return Math.ceil(navItems.length / visibleCount);
  };

  // Navigation functions
  const canGoNext = () => currentPage < getTotalPages() - 1;
  const canGoPrev = () => currentPage > 0;

  const handleNext = () => {
    if (canGoNext() && !isTransitioning) {
      setIsTransitioning(true);
      // Glitch effect duration
      setTimeout(() => {
        setCurrentPage(currentPage + 1);
        setTimeout(() => setIsTransitioning(false), 300);
      }, 150);
    }
  };

  const handlePrev = () => {
    if (canGoPrev() && !isTransitioning) {
      setIsTransitioning(true);
      // Glitch effect duration  
      setTimeout(() => {
        setCurrentPage(currentPage - 1);
        setTimeout(() => setIsTransitioning(false), 300);
      }, 150);
    }
  };

  const handleMobilePrev = () => {
    if (selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    }
  };

  const handleMobileNext = () => {
    if (selectedIndex < navItems.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    }
  };

  // Mobile navigation controls (phone only)
  if (isMobile) {
    return (
      <div
        style={{
          position: 'relative',
          width: '100%',
          zIndex: 100,
          background: 'transparent',
          padding: '20px',
          marginTop: '40px',
          marginBottom: '40px'
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            maxWidth: '400px',
            margin: '0 auto',
            background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.5), rgba(0, 20, 0, 0.4))',
            border: '2px solid #00ff00',
            padding: '20px',
            borderRadius: '0',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 0 40px rgba(0, 255, 0, 0.3), inset 0 0 40px rgba(0, 255, 0, 0.05)'
          }}
        >
          <button
            onClick={handleMobilePrev}
            style={{
              background: 'rgba(0, 255, 0, 0.2)',
              border: '2px solid #00ff00',
              color: '#00ff00',
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: 'bold',
              fontFamily: 'monospace',
              cursor: selectedIndex > 0 ? 'pointer' : 'not-allowed',
              opacity: selectedIndex > 0 ? 1 : 0.5,
              transition: 'all 0.3s',
              boxShadow: selectedIndex > 0 ? '0 0 10px rgba(0, 255, 0, 0.5)' : 'none'
            }}
            disabled={selectedIndex === 0}
          >
            PREV
          </button>
          
          <div
            style={{
              color: '#00ff00',
              fontSize: '48px',
              fontWeight: 'bold',
              letterSpacing: '2px',
              fontFamily: 'monospace',
              textShadow: '0 0 20px #00ff00'
            }}
          >
            {navItems[selectedIndex].id}
          </div>
          
          <button
            onClick={handleMobileNext}
            style={{
              background: 'rgba(0, 255, 0, 0.2)',
              border: '2px solid #00ff00',
              color: '#00ff00',
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: 'bold',
              fontFamily: 'monospace',
              cursor: selectedIndex < navItems.length - 1 ? 'pointer' : 'not-allowed',
              opacity: selectedIndex < navItems.length - 1 ? 1 : 0.5,
              transition: 'all 0.3s',
              boxShadow: selectedIndex < navItems.length - 1 ? '0 0 10px rgba(0, 255, 0, 0.5)' : 'none'
            }}
            disabled={selectedIndex === navItems.length - 1}
          >
            NEXT
          </button>
        </div>
      </div>
    );
  }

  // Desktop and Tablet navigation
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        zIndex: 100,
        padding: viewMode === 'desktop' ? '40px' : '20px',
        background: 'transparent',
        marginTop: '40px',
        marginBottom: '40px'
      }}
    >
      {/* Main Nav Container with cyber terminal styling */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '20px',
          width: '100%',
          maxWidth: viewMode === 'desktop' ? '1400px' : '100%',
          margin: '0 auto',
          background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.5), rgba(0, 20, 0, 0.4))',
          border: '2px solid #00ff00',
          borderRadius: '0',
          padding: '20px',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 0 40px rgba(0, 255, 0, 0.3), inset 0 0 40px rgba(0, 255, 0, 0.05)',
          overflow: 'hidden'
        }}
      >
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

        {/* Animated scanline */}
        <div style={{
          position: 'absolute',
          top: `${scanlinePos}%`,
          left: 0,
          right: 0,
          height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(0, 255, 0, 0.6), transparent)',
          opacity: 0.8,
          pointerEvents: 'none',
          zIndex: 2
        }} />

        {/* Corner brackets */}
        <div style={{
          position: 'absolute',
          top: '0',
          left: '0',
          width: '20px',
          height: '20px',
          borderTop: '2px solid #00ff00',
          borderLeft: '2px solid #00ff00',
        }} />
        <div style={{
          position: 'absolute',
          top: '0',
          right: '0',
          width: '20px',
          height: '20px',
          borderTop: '2px solid #00ff00',
          borderRight: '2px solid #00ff00',
        }} />
        <div style={{
          position: 'absolute',
          bottom: '0',
          left: '0',
          width: '20px',
          height: '20px',
          borderBottom: '2px solid #00ff00',
          borderLeft: '2px solid #00ff00',
        }} />
        <div style={{
          position: 'absolute',
          bottom: '0',
          right: '0',
          width: '20px',
          height: '20px',
          borderBottom: '2px solid #00ff00',
          borderRight: '2px solid #00ff00',
        }} />

        {/* Status indicator */}
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: '8px',
          color: '#00ff00',
          fontFamily: 'monospace',
          opacity: 0.7,
          letterSpacing: '2px'
        }}>
          [NAV.TERMINAL.v3.0]
        </div>

        {/* Left Arrow */}
        <button
          onClick={handlePrev}
          style={{
            background: canGoPrev() ? 'rgba(0, 255, 0, 0.2)' : 'rgba(0, 0, 0, 0.4)',
            border: `2px solid ${canGoPrev() ? '#00ff00' : 'rgba(0, 255, 0, 0.3)'}`,
            borderRadius: '0',
            width: '50px',
            height: '50px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: canGoPrev() ? 'pointer' : 'default',
            color: canGoPrev() ? '#00ff00' : 'rgba(0, 255, 0, 0.4)',
            fontSize: '24px',
            fontWeight: 'bold',
            fontFamily: 'monospace',
            transition: 'all 0.3s ease',
            opacity: canGoPrev() ? 1 : 0.5,
            flexShrink: 0,
            boxShadow: canGoPrev() ? '0 0 20px rgba(0, 255, 0, 0.5)' : 'none',
            textShadow: canGoPrev() ? '0 0 10px #00ff00' : 'none',
            position: 'relative',
            zIndex: 3
          }}
          disabled={!canGoPrev()}
        >
          ‹
        </button>

        {/* Tabs Container with Carousel Effect */}
        <div
          style={{
            overflow: 'hidden',
            flex: 1,
            position: 'relative',
            zIndex: 3,
            height: tabDimensions.height
          }}
        >
          {/* Glitch overlay during transitions */}
          {isTransitioning && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: `
                repeating-linear-gradient(
                  90deg,
                  transparent 0px,
                  transparent 2px,
                  rgba(0, 255, 0, 0.1) 2px,
                  rgba(0, 255, 0, 0.1) 4px
                ),
                repeating-linear-gradient(
                  0deg,
                  transparent 0px,
                  rgba(255, 0, 0, 0.05) 1px,
                  transparent 2px
                )
              `,
              zIndex: 10,
              animation: 'glitchFlicker 0.15s infinite',
              pointerEvents: 'none'
            }} />
          )}
          
          {/* Sliding tabs container */}
          <div
            style={{
              display: 'flex',
              gap: '15px',
              transition: isTransitioning 
                ? 'transform 0.4s cubic-bezier(0.23, 1, 0.32, 1), filter 0.15s ease'
                : 'transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)',
              transform: `translateX(calc(-${currentPage * (parseInt(tabDimensions.width) + 15) * tabDimensions.visibleCount}px))`,
              filter: isTransitioning ? 'blur(1px) brightness(1.2) contrast(1.1)' : 'none',
              width: 'max-content'
            }}
          >
            {navItems.map((item, index) => {
              const isSelected = index === selectedIndex;
          
              return (
                <Link key={item.id} href={item.path} style={{ textDecoration: 'none' }}>
                  <div
                    onClick={() => setSelectedIndex(index)}
                    style={{
                    position: 'relative',
                    width: tabDimensions.width,
                    flex: 'none',
                    height: tabDimensions.height,
                    padding: tabDimensions.padding,
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    overflow: 'visible',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    transform: isSelected ? 'translateY(-5px)' : 'translateY(0)',
                    clipPath: isSelected 
                      ? "polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px))"
                      : "polygon(0 0, calc(100% - 15px) 0, 100% 15px, 100% 100%, 15px 100%, 0 calc(100% - 15px))"
                  }}
                >
                  {/* Border element that follows the clip path */}
                  <div style={{
                    position: 'absolute',
                    top: '-3px',
                    left: '-3px',
                    right: '-3px', 
                    bottom: '-3px',
                    background: isSelected ? '#00ff00' : 'rgba(0, 255, 255, 0.6)',
                    clipPath: isSelected 
                      ? "polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px))"
                      : "polygon(0 0, calc(100% - 15px) 0, 100% 15px, 100% 100%, 15px 100%, 0 calc(100% - 15px))",
                    zIndex: -1
                  }} />
                  {/* Background image layer */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundImage: `url(${item.thumbnail})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    zIndex: 0
                  }} />

                  {/* Color overlay with cyberpunk effects */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: isSelected 
                      ? 'linear-gradient(135deg, rgba(0, 255, 0, 0.3), rgba(0, 20, 0, 0.5))'
                      : 'linear-gradient(135deg, rgba(0, 150, 150, 0.4), rgba(0, 100, 120, 0.6))',
                    pointerEvents: 'none',
                    zIndex: 1
                  }} />

                  {/* Terminal scanlines overlay */}
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
                    pointerEvents: 'none',
                    zIndex: 2
                  }} />

                  {/* Glow effect layer */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    boxShadow: isSelected 
                      ? '0 0 30px rgba(0, 255, 0, 0.5), inset 0 0 30px rgba(0, 255, 0, 0.1)'
                      : '0 0 15px rgba(0, 255, 255, 0.2), inset 0 0 15px rgba(0, 255, 255, 0.1)',
                    pointerEvents: 'none',
                    zIndex: 2
                  }} />
                  
                  {/* Left side text content */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    justifyContent: 'center',
                    flex: 1,
                    zIndex: 3,
                    position: 'relative'
                  }}>
                    {/* Tab number */}
                    <span
                      style={{
                        color: isSelected ? '#00ff00' : '#ffffff',
                        fontSize: tabDimensions.fontSize.number,
                        fontWeight: 'bold',
                        marginBottom: '2px',
                        fontFamily: 'monospace',
                        letterSpacing: '2px',
                        transition: 'all 0.3s ease',
                        textShadow: isSelected ? '0 0 15px #00ff00' : '2px 2px 4px rgba(0, 0, 0, 0.8)',
                      }}
                    >
                      {item.id}
                    </span>
                    
                    {/* Tab title */}
                    <span
                      style={{
                        color: '#ffffff',
                        fontSize: tabDimensions.fontSize.title,
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        letterSpacing: '1.5px',
                        fontFamily: 'monospace',
                        transition: 'all 0.3s ease',
                        textAlign: 'left',
                        lineHeight: '1.2',
                        textShadow: isSelected ? '0 0 10px rgba(255, 255, 255, 0.5)' : '2px 2px 4px rgba(0, 0, 0, 0.8)',
                      }}
                    >
                      {item.title}
                    </span>
                  </div>

                  {/* Right side image */}
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '0',
                    overflow: 'hidden',
                    border: `2px solid ${isSelected ? '#00ff00' : 'rgba(0, 255, 255, 0.6)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: isSelected ? '0 0 15px rgba(0, 255, 0, 0.6)' : 'none',
                    position: 'relative',
                    zIndex: 3,
                    flexShrink: 0
                  }}>
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        filter: isSelected 
                          ? 'brightness(1.3) contrast(1.2) saturate(1.1) drop-shadow(0 0 5px rgba(0, 255, 0, 0.5))'
                          : 'brightness(1.1) contrast(1.15) saturate(1.0)'
                      }}
                    />
                  </div>

                  {/* Status indicator for selected tab */}
                  {isSelected && (
                    <div style={{
                      position: 'absolute',
                      bottom: '5px',
                      right: '5px',
                      fontSize: '8px',
                      color: '#00ff00',
                      fontFamily: 'monospace',
                      opacity: 0.7,
                      letterSpacing: '1px',
                      zIndex: 2
                    }}>
                      [ACTIVE]
                    </div>
                  )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Right Arrow */}
        <button
          onClick={handleNext}
          style={{
            background: canGoNext() ? 'rgba(0, 255, 0, 0.2)' : 'rgba(0, 0, 0, 0.4)',
            border: `2px solid ${canGoNext() ? '#00ff00' : 'rgba(0, 255, 0, 0.3)'}`,
            borderRadius: '0',
            width: '50px',
            height: '50px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: canGoNext() ? 'pointer' : 'default',
            color: canGoNext() ? '#00ff00' : 'rgba(0, 255, 0, 0.4)',
            fontSize: '24px',
            fontWeight: 'bold',
            fontFamily: 'monospace',
            transition: 'all 0.3s ease',
            opacity: canGoNext() ? 1 : 0.5,
            flexShrink: 0,
            boxShadow: canGoNext() ? '0 0 20px rgba(0, 255, 0, 0.5)' : 'none',
            textShadow: canGoNext() ? '0 0 10px #00ff00' : 'none',
            position: 'relative',
            zIndex: 3
          }}
          disabled={!canGoNext()}
        >
          ›
        </button>

        {/* Terminal status footer */}
        <div style={{
          position: 'absolute',
          bottom: '5px',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: '8px',
          color: '#00ff00',
          fontFamily: 'monospace',
          opacity: 0.5,
          letterSpacing: '1px'
        }}>
          PAGE {currentPage + 1}/{getTotalPages()} :: {tabDimensions.visibleCount} OF {navItems.length} NODES.ACTIVE
        </div>
      </div>

      <style jsx>{`
        .cyber-tab {
          clip-path: polygon(
            0 0, 
            calc(100% - var(--corner-size)) 0, 
            100% var(--corner-size), 
            100% 100%, 
            var(--corner-size) 100%, 
            0 calc(100% - var(--corner-size))
          );
        }

        .cyber-tab::before {
          content: '';
          position: absolute;
          top: -3px;
          left: -3px;
          right: -3px;
          bottom: -3px;
          background: var(--border-color);
          clip-path: polygon(
            0 0, 
            calc(100% - var(--corner-size)) 0, 
            100% var(--corner-size), 
            100% 100%, 
            var(--corner-size) 100%, 
            0 calc(100% - var(--corner-size))
          );
          z-index: -1;
        }

        .cyber-tab::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          box-shadow: 0 0 15px var(--glow-color), inset 0 0 15px var(--glow-color);
          pointer-events: none;
          clip-path: polygon(
            0 0, 
            calc(100% - var(--corner-size)) 0, 
            100% var(--corner-size), 
            100% 100%, 
            var(--corner-size) 100%, 
            0 calc(100% - var(--corner-size))
          );
          z-index: 2;
        }

        .cyber-tab.selected::after {
          box-shadow: 0 0 30px var(--glow-color), inset 0 0 30px var(--glow-color);
        }

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
        
        @keyframes scanlines {
          0% { transform: translateY(0px); }
          100% { transform: translateY(4px); }
        }
        
        @keyframes glitchFlicker {
          0% { opacity: 0.8; transform: translateX(0px); }
          10% { opacity: 0.6; transform: translateX(-2px); }
          20% { opacity: 0.9; transform: translateX(2px); }
          30% { opacity: 0.4; transform: translateX(-1px); }
          40% { opacity: 0.7; transform: translateX(1px); }
          50% { opacity: 0.8; transform: translateX(0px); }
          60% { opacity: 0.5; transform: translateX(-1px); }
          70% { opacity: 0.9; transform: translateX(1px); }
          80% { opacity: 0.6; transform: translateX(-2px); }
          90% { opacity: 0.8; transform: translateX(2px); }
          100% { opacity: 0.7; transform: translateX(0px); }
        }
      `}</style>
    </div>
  );
};

export default SlidingNav;