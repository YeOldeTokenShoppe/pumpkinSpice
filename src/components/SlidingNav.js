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
  const [containerWidth, setContainerWidth] = useState(1400);
  const [hoveredTab, setHoveredTab] = useState(null);

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
      setContainerWidth(width);
      
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

  // Calculate responsive tab dimensions with fixed maximum
  const getTabDimensions = () => {
    switch(viewMode) {
      case 'tablet-portrait':
        return { 
          width: '220px',
          height: '100px',
          visibleCount: 2,
          fontSize: { number: '20px', title: '11px' },
          padding: '12px 16px'
        };
      case 'tablet-landscape':
        return { 
          width: '220px',
          height: '110px',
          visibleCount: 3,
          fontSize: { number: '22px', title: '12px' },
          padding: '15px 20px'
        };
      case 'desktop':
      default:
        return { 
          width: '220px',
          height: '130px',
          visibleCount: 4,
          fontSize: { number: '24px', title: '13px' },
          padding: '15px 20px'
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
          width: `${(220 * 4) + (15 * 3) + 100 + 40}px`, // 4 tabs + 3 gaps + arrows + padding
          maxWidth: '100%',
          margin: '0 auto',
          background: `
            linear-gradient(135deg, rgba(0, 0, 0, 0.8), rgba(0, 20, 0, 0.6)),
            radial-gradient(circle at 30% 40%, rgba(0, 255, 0, 0.05) 0%, transparent 50%),
            radial-gradient(circle at 70% 60%, rgba(0, 255, 255, 0.03) 0%, transparent 50%)
          `,
          border: '2px solid #00ff00',
          borderRadius: '0',
          padding: '20px',
          backdropFilter: 'blur(10px)',
          boxShadow: `
            0 0 40px rgba(0, 255, 0, 0.4),
            inset 0 0 40px rgba(0, 255, 0, 0.08),
            0 0 80px rgba(0, 255, 0, 0.2),
            inset 0 0 80px rgba(0, 255, 0, 0.03)
          `,
          overflow: 'hidden'
        }}
      >

        {/* Hexagonal pattern overlay */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `
            radial-gradient(circle at 25% 25%, rgba(0, 255, 0, 0.05) 2px, transparent 3px),
            radial-gradient(circle at 75% 25%, rgba(0, 255, 255, 0.03) 2px, transparent 3px),
            radial-gradient(circle at 25% 75%, rgba(0, 255, 255, 0.03) 2px, transparent 3px),
            radial-gradient(circle at 75% 75%, rgba(0, 255, 0, 0.05) 2px, transparent 3px)
          `,
          backgroundSize: '60px 60px',
          animation: 'hexFloat 8s ease-in-out infinite',
          pointerEvents: 'none',
          opacity: 0.4
        }} />

        {/* Circuit-like border elements */}
        <div style={{
          position: 'absolute',
          top: '15px',
          left: '40px',
          width: '30px',
          height: '2px',
          background: 'linear-gradient(90deg, #00ff00, transparent)',
          boxShadow: '0 0 6px #00ff00',
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute',
          top: '15px',
          right: '40px',
          width: '30px',
          height: '2px',
          background: 'linear-gradient(-90deg, #00ff00, transparent)',
          boxShadow: '0 0 6px #00ff00',
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '15px',
          left: '40px',
          width: '30px',
          height: '2px',
          background: 'linear-gradient(90deg, #00ff00, transparent)',
          boxShadow: '0 0 6px #00ff00',
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '15px',
          right: '40px',
          width: '30px',
          height: '2px',
          background: 'linear-gradient(-90deg, #00ff00, transparent)',
          boxShadow: '0 0 6px #00ff00',
          pointerEvents: 'none'
        }} />

        
        {/* Matrix-style data stream */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `
            linear-gradient(0deg, 
              transparent 0%, 
              rgba(0, 255, 0, 0.01) 50%, 
              transparent 100%
            )
          `,
          backgroundSize: '2px 100px',
          animation: 'dataStream 10s linear infinite',
          pointerEvents: 'none',
          opacity: 0.3
        }} />

        {/* Enhanced corner brackets with dynamic glow */}
        <div style={{
          position: 'absolute',
          top: '-2px',
          left: '-2px',
          width: '25px',
          height: '25px',
          borderTop: '3px solid #00ff00',
          borderLeft: '3px solid #00ff00',
          boxShadow: `
            0 0 10px #00ff00,
            inset 0 0 10px rgba(0, 255, 0, 0.3)
          `,
          animation: 'cornerPulse 3s ease-in-out infinite'
        }} />
        <div style={{
          position: 'absolute',
          top: '-2px',
          right: '-2px',
          width: '25px',
          height: '25px',
          borderTop: '3px solid #00ff00',
          borderRight: '3px solid #00ff00',
          boxShadow: `
            0 0 10px #00ff00,
            inset 0 0 10px rgba(0, 255, 0, 0.3)
          `,
          animation: 'cornerPulse 3s ease-in-out infinite 0.5s'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-2px',
          left: '-2px',
          width: '25px',
          height: '25px',
          borderBottom: '3px solid #00ff00',
          borderLeft: '3px solid #00ff00',
          boxShadow: `
            0 0 10px #00ff00,
            inset 0 0 10px rgba(0, 255, 0, 0.3)
          `,
          animation: 'cornerPulse 3s ease-in-out infinite 1s'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-2px',
          right: '-2px',
          width: '25px',
          height: '25px',
          borderBottom: '3px solid #00ff00',
          borderRight: '3px solid #00ff00',
          boxShadow: `
            0 0 10px #00ff00,
            inset 0 0 10px rgba(0, 255, 0, 0.3)
          `,
          animation: 'cornerPulse 3s ease-in-out infinite 1.5s'
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
                linear-gradient(90deg, 
                  transparent 0%, 
                  rgba(0, 255, 0, 0.1) 25%, 
                  rgba(255, 0, 0, 0.05) 50%, 
                  rgba(0, 255, 0, 0.1) 75%, 
                  transparent 100%
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
              transform: 'translateX(0px)',
              filter: isTransitioning ? 'blur(1px) brightness(1.2) contrast(1.1)' : 'none',
              width: 'max-content'
            }}
          >
            {getVisibleTabs().map((item, visibleIndex) => {
              const index = navItems.findIndex(navItem => navItem.id === item.id);
              const isSelected = index === selectedIndex;
              const isHovered = hoveredTab === index;
          
              return (
                <Link key={item.id} href={item.path} style={{ textDecoration: 'none' }}>
                  <div
                    onClick={() => setSelectedIndex(index)}
                    onMouseEnter={() => setHoveredTab(index)}
                    onMouseLeave={() => setHoveredTab(null)}
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
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    transform: isSelected 
                      ? 'translateY(-8px) scale(1.05)' 
                      : isHovered 
                        ? 'translateY(-3px) scale(1.02)' 
                        : 'translateY(0) scale(1)',
                    clipPath: isSelected 
                      ? "polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px))"
                      : "polygon(0 0, calc(100% - 15px) 0, 100% 15px, 100% 100%, 15px 100%, 0 calc(100% - 15px))",
                    filter: isSelected 
                      ? 'drop-shadow(0 10px 20px rgba(0, 255, 0, 0.3))' 
                      : isHovered 
                        ? 'drop-shadow(0 8px 16px rgba(0, 255, 255, 0.4))' 
                        : 'drop-shadow(0 5px 10px rgba(0, 0, 0, 0.2))'
                  }}
                >
                  {/* Enhanced border element */}
                  <div style={{
                    position: 'absolute',
                    top: '-3px',
                    left: '-3px',
                    right: '-3px', 
                    bottom: '-3px',
                    background: isSelected 
                      ? 'linear-gradient(135deg, #00ff00 0%, #00ffff 50%, #00ff00 100%)'
                      : 'linear-gradient(135deg, rgba(0, 255, 255, 0.6) 0%, rgba(0, 200, 200, 0.4) 100%)',
                    clipPath: isSelected 
                      ? "polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px))"
                      : "polygon(0 0, calc(100% - 15px) 0, 100% 15px, 100% 100%, 15px 100%, 0 calc(100% - 15px))",
                    zIndex: -1,
                    animation: isSelected 
                      ? 'borderShimmer 2s ease-in-out infinite' 
                      : isHovered 
                        ? 'borderShimmer 1s ease-in-out infinite' 
                        : ''
                  }} />
                  {/* Background image layer */}
                  {/* <div style={{
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
                  }} /> */}

                  {/* Holographic color overlay */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: isSelected 
                      ? `
                        linear-gradient(45deg, 
                          rgba(255, 0, 150, 0.2) 0%,
                          rgba(0, 255, 0, 0.3) 15%,
                          rgba(0, 255, 255, 0.25) 30%,
                          rgba(255, 0, 255, 0.2) 45%,
                          rgba(255, 255, 0, 0.25) 60%,
                          rgba(0, 255, 0, 0.3) 75%,
                          rgba(0, 150, 255, 0.2) 90%,
                          rgba(255, 0, 150, 0.2) 100%
                        ),
                        radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.1) 0%, transparent 40%),
                        radial-gradient(circle at 75% 75%, rgba(0, 255, 255, 0.15) 0%, transparent 50%)
                      `
                      : `
                        linear-gradient(135deg, 
                          rgba(0, 150, 150, 0.4) 0%,
                          rgba(0, 120, 180, 0.35) 25%,
                          rgba(100, 150, 255, 0.25) 50%,
                          rgba(0, 180, 120, 0.3) 75%,
                          rgba(50, 100, 150, 0.4) 100%
                        ),
                        radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.05) 0%, transparent 60%),
                        radial-gradient(circle at 70% 70%, rgba(0, 200, 255, 0.08) 0%, transparent 50%)
                      `,
                    pointerEvents: 'none',
                    zIndex: 1,
                    animation: isSelected 
                      ? 'holographicShift 3s ease-in-out infinite' 
                      : isHovered 
                        ? 'holographicShift 1.5s ease-in-out infinite' 
                        : 'subtleShimmer 6s ease-in-out infinite'
                  }} />

                  {/* Subtle texture overlay */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: `
                      radial-gradient(circle at 30% 30%, ${isSelected ? 'rgba(0, 255, 0, 0.08)' : 'rgba(0, 255, 255, 0.05)'} 0%, transparent 70%),
                      radial-gradient(circle at 70% 70%, ${isSelected ? 'rgba(0, 255, 0, 0.05)' : 'rgba(0, 200, 200, 0.03)'} 0%, transparent 50%)
                    `,
                    animation: isSelected ? 'circuitPulse 2s ease-in-out infinite' : 'circuitFloat 4s ease-in-out infinite',
                    pointerEvents: 'none',
                    zIndex: 2,
                    opacity: 0.6
                  }} />


                  {/* Enhanced glow effect layer */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    boxShadow: isSelected 
                      ? `
                        0 0 30px rgba(0, 255, 0, 0.6), 
                        inset 0 0 30px rgba(0, 255, 0, 0.15),
                        0 0 60px rgba(0, 255, 0, 0.3),
                        inset 0 0 60px rgba(0, 255, 0, 0.05)
                      `
                      : `
                        0 0 15px rgba(0, 255, 255, 0.3), 
                        inset 0 0 15px rgba(0, 255, 255, 0.12),
                        0 0 30px rgba(0, 255, 255, 0.15)
                      `,
                    pointerEvents: 'none',
                    zIndex: 3,
                    animation: isSelected ? 'tabGlowPulse 2s ease-in-out infinite' : ''
                  }} />

                  {/* Digital edge highlights */}
                  <div style={{
                    position: 'absolute',
                    top: '5px',
                    left: '5px',
                    width: '20px',
                    height: '2px',
                    background: isSelected ? '#00ff00' : '#00ffff',
                    boxShadow: `0 0 8px ${isSelected ? '#00ff00' : '#00ffff'}`,
                    opacity: 0.8,
                    pointerEvents: 'none',
                    zIndex: 4
                  }} />
                  <div style={{
                    position: 'absolute',
                    top: '5px',
                    left: '5px',
                    width: '2px',
                    height: '20px',
                    background: isSelected ? '#00ff00' : '#00ffff',
                    boxShadow: `0 0 8px ${isSelected ? '#00ff00' : '#00ffff'}`,
                    opacity: 0.8,
                    pointerEvents: 'none',
                    zIndex: 4
                  }} />
                  <div style={{
                    position: 'absolute',
                    bottom: '5px',
                    right: '5px',
                    width: '20px',
                    height: '2px',
                    background: isSelected ? '#00ff00' : '#00ffff',
                    boxShadow: `0 0 8px ${isSelected ? '#00ff00' : '#00ffff'}`,
                    opacity: 0.6,
                    pointerEvents: 'none',
                    zIndex: 4
                  }} />
                  <div style={{
                    position: 'absolute',
                    bottom: '5px',
                    right: '5px',
                    width: '2px',
                    height: '20px',
                    background: isSelected ? '#00ff00' : '#00ffff',
                    boxShadow: `0 0 8px ${isSelected ? '#00ff00' : '#00ffff'}`,
                    opacity: 0.6,
                    pointerEvents: 'none',
                    zIndex: 4
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
                        color: isSelected ? '#ffffff' : '#ffffff',
                        fontSize: tabDimensions.fontSize.number,
                        fontWeight: 'bold',
                        marginBottom: '2px',
                        fontFamily: 'monospace',
                        letterSpacing: '2px',
                        transition: 'all 0.3s ease',
                        textShadow: isSelected ? '0 0 15px #00ff00, 2px 2px 4px rgba(0, 0, 0, 0.9)' : '2px 2px 4px rgba(0, 0, 0, 0.8)',
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
                      color: '#ffffff',
                      fontFamily: 'monospace',
                      opacity: 0.9,
                      letterSpacing: '1px',
                      zIndex: 4,
                      textShadow: '0 0 8px #00ff00, 1px 1px 2px rgba(0, 0, 0, 0.8)'
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

        @keyframes cornerPulse {
          0%, 100% {
            boxShadow: 0 0 10px #00ff00, inset 0 0 10px rgba(0, 255, 0, 0.3);
            opacity: 1;
          }
          50% {
            boxShadow: 0 0 20px #00ff00, inset 0 0 20px rgba(0, 255, 0, 0.5);
            opacity: 0.8;
          }
        }

        @keyframes hexFloat {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
            opacity: 0.4;
          }
          50% {
            transform: translateY(-3px) rotate(180deg);
            opacity: 0.6;
          }
        }

        @keyframes scanlineGlow {
          0%, 100% {
            boxShadow: 0 0 10px rgba(0, 255, 0, 0.5);
            opacity: 0.7;
          }
          50% {
            boxShadow: 0 0 20px rgba(0, 255, 0, 0.8);
            opacity: 0.9;
          }
        }

        @keyframes dataStream {
          0% {
            backgroundPosition: 0% 0%;
          }
          100% {
            backgroundPosition: 0% 100%;
          }
        }

        @keyframes circuitPulse {
          0%, 100% {
            opacity: 0.7;
            transform: scale(1);
          }
          50% {
            opacity: 0.9;
            transform: scale(1.01);
          }
        }

        @keyframes circuitFloat {
          0%, 100% {
            opacity: 0.5;
            transform: translateY(0px);
          }
          50% {
            opacity: 0.7;
            transform: translateY(-1px);
          }
        }

        @keyframes tabGlowPulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }

        @keyframes borderShimmer {
          0%, 100% {
            opacity: 1;
            filter: brightness(1) hue-rotate(0deg);
          }
          50% {
            opacity: 0.8;
            filter: brightness(1.2) hue-rotate(15deg);
          }
        }

        @keyframes holographicShift {
          0%, 100% {
            filter: hue-rotate(0deg) saturate(1) brightness(1);
            opacity: 0.8;
          }
          25% {
            filter: hue-rotate(90deg) saturate(1.2) brightness(1.1);
            opacity: 0.9;
          }
          50% {
            filter: hue-rotate(180deg) saturate(0.8) brightness(1.2);
            opacity: 0.7;
          }
          75% {
            filter: hue-rotate(270deg) saturate(1.1) brightness(0.9);
            opacity: 0.85;
          }
        }

        @keyframes subtleShimmer {
          0%, 100% {
            filter: hue-rotate(0deg) brightness(1);
            opacity: 0.6;
          }
          50% {
            filter: hue-rotate(30deg) brightness(1.05);
            opacity: 0.7;
          }
        }

        @keyframes hoverGlow {
          0%, 100% {
            box-shadow: 0 8px 16px rgba(0, 255, 255, 0.4), 0 0 20px rgba(0, 255, 255, 0.2);
          }
          50% {
            box-shadow: 0 10px 20px rgba(0, 255, 255, 0.6), 0 0 30px rgba(0, 255, 255, 0.3);
          }
        }

        @keyframes hoverShimmer {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
      `}</style>
    </div>
  );
};

export default SlidingNav;