'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTokenData, useMilestoneStatus } from '@/services/tokenDataService';
import Numerology from '@/components/Numerology';
import ScratchCard from '@/components/ScratchCard';
import TorchSection from '@/components/TorchSection';
import Link from 'next/link';

const TokenInfoGrid = () => {
  const [copied, setCopied] = useState(false);
  const { tokenData, loading } = useTokenData();
  const milestoneStatus = useMilestoneStatus();
  const [animatedValues, setAnimatedValues] = useState({
    price: 0,
    marketCap: 0,
    holders: 0,
    volume24h: 0,
    liquidityAmount: 0,
    tokensBurned: 0,
  });
  
  // Detect viewport for responsive font sizing
  const [viewportHeight, setViewportHeight] = useState(typeof window !== 'undefined' ? window.innerHeight : 800);
  const [viewportWidth, setViewportWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const [isLandscape, setIsLandscape] = useState(typeof window !== 'undefined' ? window.innerWidth > window.innerHeight : false);
  const isMobile = viewportWidth <= 480;
  const isTablet = viewportWidth <= 768;
  
  useEffect(() => {
    const handleResize = () => {
      setViewportHeight(window.innerHeight);
      setViewportWidth(window.innerWidth);
      setIsLandscape(window.innerWidth > window.innerHeight);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const contractAddress = tokenData?.contractAddress || "0x0000000000000000000000000000000000000000";
  
  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(contractAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Animate numbers on mount and when data changes
  useEffect(() => {
    if (!tokenData) return;
    
    const targets = {
      price: tokenData.price || 0,
      marketCap: tokenData.marketCap || 0,
      holders: tokenData.holders || 0,
      volume24h: tokenData.volume24h || 0,
      liquidityAmount: tokenData.liquidityAmount || 0,
      tokensBurned: tokenData.tokensBurned || 0,
    };

    const duration = 2000;
    const steps = 60;
    const interval = duration / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      
      setAnimatedValues({
        price: targets.price * easeOutQuart,
        marketCap: targets.marketCap * easeOutQuart,
        holders: Math.floor(targets.holders * easeOutQuart),
        volume24h: Math.floor(targets.volume24h * easeOutQuart),
        liquidityAmount: Math.floor(targets.liquidityAmount * easeOutQuart),
        tokensBurned: Math.floor(targets.tokensBurned * easeOutQuart),
      });

      if (currentStep >= steps) {
        clearInterval(timer);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [tokenData]);

  // Sparkline component
  // const Sparkline = ({ trend = 'up' }) => {
  //   const points = trend === 'up' 
  //     ? "0,20 5,18 10,22 15,15 20,17 25,10 30,12 35,5 40,8 45,3 50,5"
  //     : "0,5 5,3 10,8 15,5 20,12 25,10 30,17 35,15 40,22 45,18 50,20";
    
  //   return (
  //     <svg width="50" height="25" style={{ opacity: 0.8 }}>
  //       <polyline
  //         points={points}
  //         fill="none"
  //         stroke={trend === 'up' ? '#00ff88' : '#ff4444'}
  //         strokeWidth="2"
  //         strokeLinecap="round"
  //         strokeLinejoin="round"
  //       />
  //     </svg>
  //   );
  // };

  // Mini chart component for the large chart box
  const MiniChart = () => {
    const canvasRef = useRef(null);
    const [hoveredPoint, setHoveredPoint] = useState(23); // Start with last point (current price) selected
    const [chartData, setChartData] = useState([]);
    const [mousePos, setMousePos] = useState({ x: 160, y: 30 }); // Default position for last point
    const [userInteracted, setUserInteracted] = useState(false);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      const width = canvas.width;
      const height = canvas.height;
      
      // Generate price data with timestamps
      const generateChartData = () => {
        const data = [];
        const basePrice = tokenData?.price || 0.00420;
        const now = Date.now();
        
        for (let i = 0; i < 24; i++) {
          const timestamp = now - (23 - i) * 60 * 60 * 1000; // Last 24 hours
          const variation = (Math.random() - 0.5) * basePrice * 0.2; // ±10% variation
          const trend = (i / 24) * basePrice * 0.1; // Slight upward trend
          
          data.push({
            x: (width / 24) * i + width / 48, // Center points in their segments
            y: height * 0.5 - (variation + trend) * (height / basePrice) * 0.3,
            price: basePrice + variation + trend,
            time: new Date(timestamp).toLocaleTimeString('en-US', { 
              hour: 'numeric',
              hour12: true 
            }),
            index: i
          });
        }
        return data;
      };

      const points = generateChartData();
      setChartData(points);
      
      // Clear canvas
      ctx.clearRect(0, 0, width, height);
      
      // Draw gradient fill
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, 'rgba(196, 137, 1, 0.3)');
      gradient.addColorStop(1, 'rgba(196, 137, 1, 0.0)');
      
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      
      // Draw smooth curve for fill
      for (let i = 1; i < points.length - 1; i++) {
        const xc = (points[i].x + points[i + 1].x) / 2;
        const yc = (points[i].y + points[i + 1].y) / 2;
        ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
      }
      ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
      
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();
      
      // Draw line
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length - 1; i++) {
        const xc = (points[i].x + points[i + 1].x) / 2;
        const yc = (points[i].y + points[i + 1].y) / 2;
        ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
      }
      ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
      ctx.strokeStyle = '#c48901';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw hover indicator if needed
      if (hoveredPoint !== null) {
        const point = points[hoveredPoint];
        if (point) {
          // Draw vertical line
          ctx.beginPath();
          ctx.moveTo(point.x, 0);
          ctx.lineTo(point.x, height);
          ctx.strokeStyle = 'rgba(196, 137, 1, 0.2)';
          ctx.lineWidth = 1;
          ctx.stroke();
          
          // Draw point with pulsing animation for default state
          const isPulsingDefault = hoveredPoint === 23 && !userInteracted;
          const pulseScale = isPulsingDefault ? 1 + Math.sin(Date.now() / 200) * 0.2 : 1;
          
          ctx.beginPath();
          ctx.arc(point.x, point.y, 4 * pulseScale, 0, Math.PI * 2);
          ctx.fillStyle = '#c48901';
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.stroke();
          
          // Add glow effect for default state
          if (isPulsingDefault) {
            ctx.shadowColor = '#c48901';
            ctx.shadowBlur = 10 * pulseScale;
            ctx.beginPath();
            ctx.arc(point.x, point.y, 4 * pulseScale, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        }
      }
    }, [hoveredPoint, tokenData, userInteracted]);

    const handleMouseMove = (e) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      setUserInteracted(true); // Mark that user has interacted
      
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (canvas.width / rect.width);
      const y = (e.clientY - rect.top) * (canvas.height / rect.height);
      
      setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      
      // Find closest data point
      let closestPoint = null;
      let minDistance = Infinity;
      
      chartData.forEach((point, index) => {
        const distance = Math.abs(point.x - x);
        if (distance < minDistance && distance < 10) { // 10px threshold
          minDistance = distance;
          closestPoint = index;
        }
      });
      
      setHoveredPoint(closestPoint);
    };

    const handleMouseLeave = () => {
      // Return to showing current price when not hovering
      setHoveredPoint(23);
      setMousePos({ x: 160, y: 30 });
    };

    return (
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        <canvas 
          ref={canvasRef} 
          width={200} 
          height={50} 
          style={{ width: '100%', height: '50px', cursor: 'crosshair' }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        />
        {hoveredPoint !== null && chartData[hoveredPoint] && (
          <div style={{
            position: 'absolute',
            left: `${Math.min(Math.max(mousePos.x - 40, 0), 120)}px`,
            top: `${Math.max(mousePos.y - 40, 0)}px`,
            background: 'rgba(0, 0, 0, 0.95)',
            border: '1px solid #c48901',
            borderRadius: '6px',
            padding: '0.5rem',
            fontSize: '0.65rem',
            color: '#ffffff',
            fontFamily: '"Cyber", monospace',
            pointerEvents: 'none',
            zIndex: 10,
            minWidth: '80px',
          }}>
            <div style={{ color: '#c48901', fontWeight: 'bold', marginBottom: '0.25rem' }}>
              ${chartData[hoveredPoint].price.toFixed(5)}
            </div>
            <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.6rem' }}>
              {chartData[hoveredPoint].time}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Distribution chart component
  const DistributionChart = () => {
    const canvasRef = useRef(null);
    const [hoveredSegment, setHoveredSegment] = useState(null);
    const chartSize = isMobile ? 180 : 240;

    const distribution = [
      { label: 'Liquidity', value: 80, color: '#c48901' },
      { label: 'Treasury', value: 10, color: '#00ff88' },
      { label: 'Marketing', value: 10, color: '#ff4444' },
    ];

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = Math.min(centerX, centerY) - 20;
      const innerRadius = radius * 0.6; // For donut chart
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      let currentAngle = -Math.PI / 2; // Start at top
      
      distribution.forEach((segment, index) => {
        const sliceAngle = (segment.value / 100) * Math.PI * 2;
        
        // Draw outer arc
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
        ctx.arc(centerX, centerY, innerRadius, currentAngle + sliceAngle, currentAngle, true);
        ctx.closePath();
        
        // Apply hover effect
        if (hoveredSegment === index) {
          ctx.save();
          ctx.shadowColor = segment.color;
          ctx.shadowBlur = 20;
          ctx.fillStyle = segment.color + 'dd';
        } else {
          ctx.fillStyle = segment.color + '99';
        }
        
        ctx.fill();
        
        // Add border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        if (hoveredSegment === index) {
          ctx.restore();
        }
        
        // Draw percentage text
        const textAngle = currentAngle + sliceAngle / 2;
        const textX = centerX + Math.cos(textAngle) * (radius - 25);
        const textY = centerY + Math.sin(textAngle) * (radius - 25);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px "Cyber", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${segment.value}%`, textX, textY);
        
        currentAngle += sliceAngle;
      });
      
      // Draw center circle with total
      ctx.beginPath();
      ctx.arc(centerX, centerY, innerRadius - 2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(196, 137, 1, 0.3)';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Center text
      ctx.fillStyle = '#c48901';
      ctx.font = 'bold 14px "Cyber", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('100%', centerX, centerY - 8);
      ctx.font = '10px "Cyber", monospace';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.fillText('TOTAL', centerX, centerY + 8);
    }, [hoveredSegment]);

    const handleMouseMove = (e) => {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (canvas.width / rect.width);
      const y = (e.clientY - rect.top) * (canvas.height / rect.height);
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
      const radius = Math.min(centerX, centerY) - 20;
      const innerRadius = radius * 0.6;
      
      if (distance < radius && distance > innerRadius) {
        // Calculate angle from center point
        let angle = Math.atan2(y - centerY, x - centerX);
        // Normalize angle to 0-2π range, starting from top (-π/2)
        angle = angle + Math.PI / 2;
        if (angle < 0) angle += Math.PI * 2;
        
        // Find which segment the angle falls into
        let accumulatedAngle = 0;
        let foundSegment = null;
        
        for (let i = 0; i < distribution.length; i++) {
          const sliceAngle = (distribution[i].value / 100) * Math.PI * 2;
          if (angle >= accumulatedAngle && angle < accumulatedAngle + sliceAngle) {
            foundSegment = i;
            break;
          }
          accumulatedAngle += sliceAngle;
        }
        
        setHoveredSegment(foundSegment);
      } else {
        setHoveredSegment(null);
      }
    };

    return (
      <div style={{ 
        position: 'relative', 
        width: '100%', 
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <canvas 
          ref={canvasRef} 
          width={chartSize} 
          height={chartSize} 
          style={{ width: `${chartSize}px`, height: `${chartSize}px`, cursor: 'pointer' }}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredSegment(null)}
        />
        {hoveredSegment !== null && (
          <div style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            background: 'rgba(0, 0, 0, 0.9)',
            border: `1px solid ${distribution[hoveredSegment].color}`,
            borderRadius: '6px',
            padding: '0.5rem',
            fontSize: '0.7rem',
            color: '#ffffff',
            fontFamily: '"Cyber", monospace',
            pointerEvents: 'none',
          }}>
            <div style={{ color: distribution[hoveredSegment].color, fontWeight: 'bold' }}>
              {distribution[hoveredSegment].label}
            </div>
            <div>{distribution[hoveredSegment].value}% of supply</div>
          </div>
        )}
      </div>
    );
  };

  // Grid item configurations with dynamic data
  const gridItems = [
    // Empty for now - all content moved to text section
  ];

  const renderGridItem = (item) => {
    const baseStyle = {
      background: 'linear-gradient(135deg, rgba(196, 137, 1, 0.1), rgba(255, 255, 255, 0.05))',
      border: '2px solid rgba(196, 137, 1, 0.3)',
      borderRadius: '12px',
      padding: '1.25rem',
      position: 'relative',
      overflow: 'hidden',
      backdropFilter: 'blur(10px)',
      transition: 'all 0.3s ease',
      gridColumn: `span min(${item.columns}, var(--max-columns, ${item.columns}))`,
      gridRow: `span ${item.rows}`,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      cursor: 'default',
    };

    switch (item.type) {
      case 'contract':
        return (
          <div 
            key={item.id} 
            style={{
              ...baseStyle,
              padding: '1rem',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(196, 137, 1, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
                <span style={{
                fontFamily: 'UnifrakturCook, UnifrakturMaguntia, serif',
                fontWeight: 'bold',
                fontSize: '0.7em',
                color: '#d4af37',
                textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)'
              }}> Our Lady of Perpetual Profit</span>     <span style={{
                fontFamily: 'cyber, monospace',
                fontWeight: 'bold',
                fontSize: '0.6em',
                color: '#ffffff',
                marginTop: '0.25rem',
                textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)'
              }}> Ticker: RL80 </span>
            <h3 style={{
              color: '#c48901',
              fontSize: '0.75rem',
              fontWeight: '600',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginBottom: '0.5rem',
              fontFamily: '"Cyber", monospace',
            }}>
              Contract Address (BASE Chain)
            </h3>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'rgba(0, 0, 0, 0.3)',
              padding: '0.5rem',
              borderRadius: '8px',
              border: '1px solid rgba(196, 137, 1, 0.2)',
              width: '100%',
            }}>
              <code style={{
                color: '#ffffff',
                fontSize: '0.7rem',
                fontFamily: 'monospace',
                wordBreak: 'break-all',
                flex: 1,
                opacity: 0.9,
              }}>
                {contractAddress.slice(0, 6)}...{contractAddress.slice(-4)}
              </code>
              
              <button
                onClick={handleCopyAddress}
                style={{
                  background: copied ? 'rgba(0, 255, 0, 0.2)' : 'rgba(196, 137, 1, 0.2)',
                  border: `1px solid ${copied ? 'rgba(0, 255, 0, 0.5)' : 'rgba(196, 137, 1, 0.5)'}`,
                  borderRadius: '6px',
                  padding: '0.4rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title={copied ? 'Copied!' : 'Copy address'}
              >
                {copied ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00ff00" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c48901" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        );

      // case 'marketcap':
      //   return (
      //     <div 
      //       key={item.id} 
      //       style={baseStyle}
      //       onMouseEnter={(e) => {
      //         e.currentTarget.style.transform = 'scale(1.02)';
      //         e.currentTarget.style.borderColor = 'rgba(196, 137, 1, 0.5)';
      //       }}
      //       onMouseLeave={(e) => {
      //         e.currentTarget.style.transform = 'scale(1)';
      //         e.currentTarget.style.borderColor = 'rgba(196, 137, 1, 0.3)';
      //       }}
      //     >
      //       <div style={{
      //         width: '100%',
      //         display: 'flex',
      //         flexDirection: 'column',
      //         alignItems: 'flex-start',
      //         gap: '0.75rem',
      //       }}>
      //         <div style={{
      //           fontSize: '0.65rem',
      //           color: 'rgba(255, 255, 255, 0.5)',
      //           textTransform: 'uppercase',
      //           letterSpacing: '0.1em',
      //           fontFamily: '"Cyber", monospace',
      //         }}>
      //           {item.label}
      //         </div>
              
      //         <div style={{
      //           fontSize: '1.4rem',
      //           fontWeight: 'bold',
      //           color: '#ffffff',
      //           fontFamily: '"Cyber", monospace',
      //           lineHeight: 1,
      //         }}>
      //           {item.value}
      //         </div>
              
      //         {item.change && (
      //           <div style={{
      //             display: 'inline-flex',
      //             alignItems: 'center',
      //             gap: '0.25rem',
      //             padding: '0.25rem 0.5rem',
      //             borderRadius: '12px',
      //             backgroundColor: item.trend === 'up' 
      //               ? 'rgba(0, 255, 136, 0.15)' 
      //               : 'rgba(255, 68, 68, 0.15)',
      //             border: `1px solid ${item.trend === 'up' 
      //               ? 'rgba(0, 255, 136, 0.3)' 
      //               : 'rgba(255, 68, 68, 0.3)'}`,
      //           }}>
      //             <svg 
      //               width="12" 
      //               height="12" 
      //               viewBox="0 0 24 24" 
      //               fill="none" 
      //               stroke={item.trend === 'up' ? '#00ff88' : '#ff4444'} 
      //               strokeWidth="3"
      //               strokeLinecap="round"
      //               strokeLinejoin="round"
      //             >
      //               {item.trend === 'up' ? (
      //                 <path d="M12 19V5M5 12L12 5L19 12" />
      //               ) : (
      //                 <path d="M12 5V19M5 12L12 19L19 12" />
      //               )}
      //             </svg>
      //             <span style={{
      //               color: item.trend === 'up' ? '#00ff88' : '#ff4444',
      //               fontSize: '0.7rem',
      //               fontWeight: '600',
      //             }}>
      //               {item.change}
      //             </span>
      //           </div>
      //         )}
              
      //         {item.subtext && (
      //           <div style={{
      //             fontSize: '0.65rem',
      //             color: 'rgba(255, 255, 255, 0.4)',
      //             fontFamily: '"Cyber", monospace',
      //           }}>
      //             {item.subtext}
      //           </div>
      //         )}
      //       </div>
      //     </div>
      //   );

      // case 'number':
      //   return (
      //     <div 
      //       key={item.id} 
      //       style={baseStyle}
      //       onMouseEnter={(e) => {
      //         e.currentTarget.style.transform = 'scale(1.02)';
      //         e.currentTarget.style.borderColor = 'rgba(196, 137, 1, 0.5)';
      //       }}
      //       onMouseLeave={(e) => {
      //         e.currentTarget.style.transform = 'scale(1)';
      //         e.currentTarget.style.borderColor = 'rgba(196, 137, 1, 0.3)';
      //       }}
      //     >
      //       <div style={{
      //         width: '100%',
      //         display: 'flex',
      //         flexDirection: 'column',
      //         alignItems: 'flex-start',
      //         gap: '0.75rem',
      //       }}>
      //         <div style={{
      //           fontSize: '0.65rem',
      //           color: 'rgba(255, 255, 255, 0.5)',
      //           textTransform: 'uppercase',
      //           letterSpacing: '0.1em',
      //           fontFamily: '"Cyber", monospace',
      //         }}>
      //           {item.label}
      //         </div>
              
      //         <div style={{
      //           fontSize: item.id === 'supply' ? '0.9rem' : (item.rows === 2 ? '1.8rem' : '1.4rem'),
      //           fontWeight: 'bold',
      //           color: '#ffffff',
      //           fontFamily: '"Cyber", monospace',
      //           lineHeight: 1,
      //           wordBreak: 'break-word',
      //           width: '100%',
      //         }}>
      //           {item.value}
      //         </div>
              
      //         {item.change && (
      //           <div style={{
      //             display: 'inline-flex',
      //             alignItems: 'center',
      //             gap: '0.25rem',
      //             padding: '0.25rem 0.5rem',
      //             borderRadius: '12px',
      //             backgroundColor: item.trend === 'up' 
      //               ? 'rgba(0, 255, 136, 0.15)' 
      //               : 'rgba(255, 68, 68, 0.15)',
      //             border: `1px solid ${item.trend === 'up' 
      //               ? 'rgba(0, 255, 136, 0.3)' 
      //               : 'rgba(255, 68, 68, 0.3)'}`,
      //           }}>
      //             <svg 
      //               width="12" 
      //               height="12" 
      //               viewBox="0 0 24 24" 
      //               fill="none" 
      //               stroke={item.trend === 'up' ? '#00ff88' : '#ff4444'} 
      //               strokeWidth="3"
      //               strokeLinecap="round"
      //               strokeLinejoin="round"
      //             >
      //               {item.trend === 'up' ? (
      //                 <path d="M12 19V5M5 12L12 5L19 12" />
      //               ) : (
      //                 <path d="M12 5V19M5 12L12 19L19 12" />
      //               )}
      //             </svg>
      //             <span style={{
      //               color: item.trend === 'up' ? '#00ff88' : '#ff4444',
      //               fontSize: '0.7rem',
      //               fontWeight: '600',
      //             }}>
      //               {item.change}
      //             </span>
      //           </div>
      //         )}
              
      //         {item.subtext && (
      //           <div style={{
      //             fontSize: '0.65rem',
      //             color: 'rgba(255, 255, 255, 0.4)',
      //             fontFamily: '"Cyber", monospace',
      //           }}>
      //             {item.subtext}
      //           </div>
      //         )}
      //       </div>
      //     </div>
      //   );

      case 'text':
        return (
          <div 
            key={item.id} 
            style={baseStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(196, 137, 1, 0.15), rgba(255, 255, 255, 0.08))';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(196, 137, 1, 0.1), rgba(255, 255, 255, 0.05))';
            }}
          >
            <div style={{
              fontSize: '1.3rem',
              color: 'rgba(255, 255, 255, 0.6)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: '0.5rem',
              fontFamily: '"Cyber", monospace',
            }}>
              {item.label}
            </div>
            
            <div style={{
              fontSize: '1.3rem',
              fontWeight: 'bold',
              color: '#c48901',
              marginBottom: item.subtext ? '0.25rem' : 0,
              fontFamily: '"Cyber", monospace',
            }}>
              {item.value}
            </div>
            
            {item.subtext && (
              <div style={{
                fontSize: '0.7rem',
                color: 'rgba(255, 255, 255, 0.5)',
                fontFamily: '"Cyber", monospace',
              }}>
                {item.subtext}
              </div>
            )}
          </div>
        );

      // case 'chart':
      //   return (
      //     <div 
      //       key={item.id} 
      //       style={baseStyle}
      //       onMouseEnter={(e) => {
      //         e.currentTarget.style.transform = 'scale(1.02)';
      //         e.currentTarget.style.borderColor = 'rgba(196, 137, 1, 0.5)';
      //       }}
      //       onMouseLeave={(e) => {
      //         e.currentTarget.style.transform = 'scale(1)';
      //         e.currentTarget.style.borderColor = 'rgba(196, 137, 1, 0.3)';
      //       }}
      //     >
      //       <div style={{
      //         width: '100%',
      //         display: 'flex',
      //         flexDirection: 'column',
      //         alignItems: 'flex-start',
      //         gap: '0.75rem',
      //       }}>
      //         <div style={{
      //           fontSize: '0.65rem',
      //           color: 'rgba(255, 255, 255, 0.5)',
      //           textTransform: 'uppercase',
      //           letterSpacing: '0.1em',
      //           fontFamily: '"Cyber", monospace',
      //         }}>
      //           Current Price
      //         </div>
              
      //         <div style={{
      //           fontSize: '1.4rem',
      //           fontWeight: 'bold',
      //           color: '#ffffff',
      //           fontFamily: '"Cyber", monospace',
      //           lineHeight: 1,
      //         }}>
      //           ${animatedValues.price.toFixed(5)}
      //         </div>
              
      //         <div style={{
      //           display: 'inline-flex',
      //           alignItems: 'center',
      //           gap: '0.25rem',
      //           padding: '0.25rem 0.5rem',
      //           borderRadius: '12px',
      //           backgroundColor: tokenData?.priceChange24h >= 0 
      //             ? 'rgba(0, 255, 136, 0.15)' 
      //             : 'rgba(255, 68, 68, 0.15)',
      //           border: `1px solid ${tokenData?.priceChange24h >= 0 
      //             ? 'rgba(0, 255, 136, 0.3)' 
      //             : 'rgba(255, 68, 68, 0.3)'}`,
      //         }}>
      //           <svg 
      //             width="12" 
      //             height="12" 
      //             viewBox="0 0 24 24" 
      //             fill="none" 
      //             stroke={tokenData?.priceChange24h >= 0 ? '#00ff88' : '#ff4444'} 
      //             strokeWidth="3"
      //             strokeLinecap="round"
      //             strokeLinejoin="round"
      //           >
      //             {tokenData?.priceChange24h >= 0 ? (
      //               <path d="M12 19V5M5 12L12 5L19 12" />
      //             ) : (
      //               <path d="M12 5V19M5 12L12 19L19 12" />
      //             )}
      //           </svg>
      //           <span style={{
      //             color: tokenData?.priceChange24h >= 0 ? '#00ff88' : '#ff4444',
      //             fontSize: '0.7rem',
      //             fontWeight: '600',
      //           }}>
      //             {tokenData?.priceChange24h >= 0 ? '+' : ''}{tokenData?.priceChange24h?.toFixed(1) || '0'}%
      //           </span>
      //         </div>
              
      //         <div style={{
      //           fontSize: '0.65rem',
      //           color: 'rgba(255, 255, 255, 0.4)',
      //           fontFamily: '"Cyber", monospace',
      //         }}>
      //           24h change
      //         </div>
      //       </div>
      //     </div>
      //   );

      // case 'distribution':
      //   return (
      //     <div 
      //       key={item.id} 
      //       style={{
      //         ...baseStyle,
      //         padding: '1rem',
      //         minHeight: '380px',
      //         display: 'flex',
      //         flexDirection: 'column',
      //       }}
      //       onMouseEnter={(e) => {
      //         e.currentTarget.style.transform = 'scale(1.02)';
      //         e.currentTarget.style.boxShadow = '0 12px 32px rgba(196, 137, 1, 0.2)';
      //       }}
      //       onMouseLeave={(e) => {
      //         e.currentTarget.style.transform = 'scale(1)';
      //         e.currentTarget.style.boxShadow = 'none';
      //       }}
      //     >
      //       <div style={{
      //         marginBottom: '0.75rem',
      //         textAlign: 'center',
      //       }}>
      //         <div style={{
      //           fontSize: '1.3rem',
      //           color: 'rgba(255, 255, 255, 0.6)',
      //           textTransform: 'uppercase',
      //           letterSpacing: '0.1em',
      //           fontFamily: '"Cyber", monospace',
      //         }}>
      //           Token Distribution
      //         </div>
      //         <div style={{
      //           fontSize: '0.8rem',
      //           color: 'rgba(255, 255, 255, 0.4)',
      //           fontFamily: '"Cyber", monospace',
      //           marginTop: '0.25rem',
      //         }}>
      //           Total Supply: 80 billion RL80 tokens
      //         </div>
      //       </div>
            
      //       <div style={{ 
      //         flex: 1, 
      //         width: '100%',
      //         display: 'flex',
      //         alignItems: 'center',
      //         justifyContent: 'center',
      //         minHeight: '260px',
      //         padding: '10px 0',
      //       }}>
      //         <DistributionChart />
      //       </div>
            
      //       <div style={{
      //         display: 'flex',
      //         justifyContent: 'space-around',
      //         width: '100%',
      //         marginTop: '0.75rem',
      //         fontSize: '0.6rem',
      //         fontFamily: '"Cyber", monospace',
      //       }}>
      //         <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
      //           <div style={{ width: '10px', height: '10px', backgroundColor: '#c48901', borderRadius: '2px' }} />
      //           <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Liquidity</span>
      //         </div>
      //         <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
      //           <div style={{ width: '10px', height: '10px', backgroundColor: '#00ff88', borderRadius: '2px' }} />
      //           <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Treasury</span>
      //         </div>
      //         <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
      //           <div style={{ width: '10px', height: '10px', backgroundColor: '#ff4444', borderRadius: '2px' }} />
      //           <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Marketing</span>
      //         </div>
      //       </div>
      //     </div>
      //   );

      // case 'timeline':
      //   const timelineSteps = milestoneStatus.map(milestone => ({
      //     label: milestone.label,
      //     tax: `${milestone.taxRate}%`,
      //     description: milestone.description,
      //     status: milestone.status,
      //     icon: milestone.icon,
      //     progress: milestone.buyThreshold && tokenData?.currentBuyCount 
      //       ? `${tokenData.currentBuyCount}/${milestone.buyThreshold} buys`
      //       : null,
      //   }));

        return (
          <div 
            key={item.id} 
            style={{
              ...baseStyle,
              padding: '1.25rem',
              alignItems: 'flex-start',
              minHeight: '380px',
              display: 'flex',
              flexDirection: 'column',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.01)';
              e.currentTarget.style.borderColor = 'rgba(196, 137, 1, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.borderColor = 'rgba(196, 137, 1, 0.3)';
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              width: '100%',
              marginBottom: '1rem',
              paddingBottom: '0.75rem',
              borderBottom: '1px solid rgba(196, 137, 1, 0.2)',
            }}>
              <div>
                <div style={{
                  fontSize: '1.3rem',
                  color: 'rgba(255, 255, 255, 0.6)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  fontFamily: '"Cyber", monospace',
                }}>
                  Tax Structure
                </div>
                <div style={{
                  fontSize: '0.8rem',
                  color: 'rgba(255, 255, 255, 0.4)',
                  fontFamily: '"Cyber", monospace',
                  marginTop: '0.25rem',
                }}>
                  Progressive reduction milestones
                </div>
              </div>
              <div style={{
                textAlign: 'center',
                background: 'rgba(196, 137, 1, 0.1)',
                padding: '0.5rem 0.75rem',
                borderRadius: '8px',
                border: '1px solid rgba(196, 137, 1, 0.3)',
              }}>
                <div style={{
                  fontSize: '0.65rem',
                  color: 'rgba(255, 255, 255, 0.5)',
                  fontFamily: '"Cyber", monospace',
                  marginBottom: '0.25rem',
                }}>
                  CURRENT TAX
                </div>
                <div style={{
                  fontSize: '1.2rem',
                  color: '#c48901',
                  fontWeight: 'bold',
                  fontFamily: '"Cyber", monospace',
                }}>
                  {tokenData?.currentTaxRate || 5}%
                </div>
                <div style={{
                  fontSize: '0.6rem',
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontFamily: '"Cyber", monospace',
                  marginTop: '0.25rem',
                }}>
                  {tokenData?.currentBuyCount || 0} total buys
                </div>
              </div>
            </div>
            
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              position: 'relative',
            }}>
              {timelineSteps.map((step, index) => (
                <div key={index} style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  position: 'relative',
                  marginBottom: index < timelineSteps.length - 1 ? '1.5rem' : 0,
                }}>
                  {/* Vertical Line */}
                  {index < timelineSteps.length - 1 && (
                    <div style={{
                      position: 'absolute',
                      left: '15px',
                      top: '30px',
                      width: '2px',
                      height: '2.5rem',
                      background: step.status === 'completed' 
                        ? 'linear-gradient(180deg, #c48901 0%, rgba(196, 137, 1, 0.3) 100%)'
                        : 'rgba(255, 255, 255, 0.1)',
                    }} />
                  )}
                  
                  {/* Circle/Icon */}
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: step.status === 'completed' 
                      ? 'linear-gradient(135deg, #c48901, rgba(196, 137, 1, 0.8))'
                      : step.status === 'active'
                      ? 'linear-gradient(135deg, rgba(196, 137, 1, 0.5), rgba(196, 137, 1, 0.3))'
                      : 'rgba(255, 255, 255, 0.1)',
                    border: step.status === 'active' 
                      ? '2px solid #c48901'
                      : '2px solid rgba(196, 137, 1, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '1rem',
                    fontSize: '0.9rem',
                    flexShrink: 0,
                    boxShadow: step.status === 'active' 
                      ? '0 0 20px rgba(196, 137, 1, 0.5)'
                      : 'none',
                    animation: step.status === 'active' ? 'glow 2s ease-in-out infinite' : 'none',
                  }}>
                    {step.status === 'completed' ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      <span style={{ 
                        filter: step.status === 'pending' ? 'grayscale(1) opacity(0.5)' : 'none' 
                      }}>
                        {step.icon}
                      </span>
                    )}
                  </div>
                  
                  {/* Content */}
                  <div style={{ flex: 1 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '0.25rem',
                    }}>
                      <span style={{
                        fontSize: '0.8rem',
                        fontWeight: 'bold',
                        color: step.status === 'pending' ? 'rgba(255, 255, 255, 0.5)' : '#ffffff',
                        fontFamily: '"Cyber", monospace',
                      }}>
                        {step.label}
                      </span>
                      <span style={{
                        padding: '0.15rem 0.4rem',
                        borderRadius: '8px',
                        background: step.status === 'completed' 
                          ? 'rgba(0, 255, 136, 0.2)'
                          : step.status === 'active'
                          ? 'rgba(196, 137, 1, 0.2)'
                          : 'rgba(255, 255, 255, 0.05)',
                        border: `1px solid ${
                          step.status === 'completed' 
                            ? 'rgba(0, 255, 136, 0.4)'
                            : step.status === 'active'
                            ? 'rgba(196, 137, 1, 0.4)'
                            : 'rgba(255, 255, 255, 0.1)'
                        }`,
                        fontSize: '0.7rem',
                        fontWeight: 'bold',
                        color: step.status === 'completed' 
                          ? '#00ff88'
                          : step.status === 'active'
                          ? '#c48901'
                          : 'rgba(255, 255, 255, 0.4)',
                      }}>
                        {step.tax}
                      </span>
                    </div>
                    <div style={{
                      fontSize: '0.65rem',
                      color: step.status === 'pending' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.6)',
                      fontFamily: '"Cyber", monospace',
                    }}>
                      {step.description}
                    </div>
                    {step.progress && step.status === 'active' && (
                      <div style={{
                        fontSize: '0.6rem',
                        color: '#c48901',
                        fontFamily: '"Cyber", monospace',
                        marginTop: '0.25rem',
                        fontStyle: 'italic',
                      }}>
                        Progress: {step.progress}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <style jsx>{`
              @keyframes glow {
                0%, 100% {
                  box-shadow: 0 0 10px rgba(196, 137, 1, 0.5);
                }
                50% {
                  box-shadow: 0 0 25px rgba(196, 137, 1, 0.8);
                }
              }
            `}</style>
          </div>
        );


      // case 'verified':
      //   return (
      //     <div 
      //       key={item.id} 
      //       style={{
      //         ...baseStyle,
      //         padding: '1.25rem',
      //       }}
      //       onMouseEnter={(e) => {
      //         e.currentTarget.style.transform = 'scale(1.02)';
      //         e.currentTarget.style.borderColor = 'rgba(196, 137, 1, 0.5)';
      //       }}
      //       onMouseLeave={(e) => {
      //         e.currentTarget.style.transform = 'scale(1)';
      //         e.currentTarget.style.borderColor = 'rgba(196, 137, 1, 0.3)';
      //       }}
      //     >
      //       <div style={{
      //         width: '100%',
      //         display: 'flex',
      //         flexDirection: 'column',
      //         gap: '0.75rem',
      //       }}>
      //         <div style={{
      //           fontSize: '0.65rem',
      //           color: 'rgba(255, 255, 255, 0.5)',
      //           textTransform: 'uppercase',
      //           letterSpacing: '0.1em',
      //           fontFamily: '"Cyber", monospace',
      //         }}>
      //           Verified
      //         </div>
              
      //         <div style={{
      //           display: 'flex',
      //           flexDirection: 'column',
      //           gap: '0.5rem',
      //         }}>
      //           <div style={{
      //             display: 'flex',
      //             alignItems: 'center',
      //             gap: '0.5rem',
      //             padding: '0.4rem 0.6rem',
      //             background: 'rgba(0, 255, 136, 0.05)',
      //             border: '1px solid rgba(0, 255, 136, 0.2)',
      //             borderRadius: '6px',
      //           }}>
      //             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00ff88" strokeWidth="2">
      //               <polyline points="20 6 9 17 4 12" />
      //             </svg>
      //             <span style={{
      //               fontSize: '0.65rem',
      //               color: 'rgba(255, 255, 255, 0.7)',
      //               fontFamily: '"Cyber", monospace',
      //             }}>
      //               Contract Verified
      //             </span>
      //           </div>
                
      //           <div style={{
      //             display: 'flex',
      //             alignItems: 'center',
      //             gap: '0.5rem',
      //             padding: '0.4rem 0.6rem',
      //             background: 'rgba(0, 255, 136, 0.05)',
      //             border: '1px solid rgba(0, 255, 136, 0.2)',
      //             borderRadius: '6px',
      //           }}>
      //             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00ff88" strokeWidth="2">
      //               <polyline points="20 6 9 17 4 12" />
      //             </svg>
      //             <span style={{
      //               fontSize: '0.65rem',
      //               color: 'rgba(255, 255, 255, 0.7)',
      //               fontFamily: '"Cyber", monospace',
      //             }}>
      //               Liquidity Locked
      //             </span>
      //           </div>
                
      //           <div style={{
      //             display: 'flex',
      //             alignItems: 'center',
      //             gap: '0.5rem',
      //             padding: '0.4rem 0.6rem',
      //             background: 'rgba(0, 255, 136, 0.05)',
      //             border: '1px solid rgba(0, 255, 136, 0.2)',
      //             borderRadius: '6px',
      //           }}>
      //             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00ff88" strokeWidth="2">
      //               <polyline points="20 6 9 17 4 12" />
      //             </svg>
      //             <span style={{
      //               fontSize: '0.65rem',
      //               color: 'rgba(255, 255, 255, 0.7)',
      //               fontFamily: '"Cyber", monospace',
      //             }}>
      //               SAFU Protocol
      //             </span>
      //           </div>
      //         </div>
      //       </div>
      //     </div>
      //   );

      // case 'new-box':
      //   const utilityFeatures = [
      //     { icon: '🔥', text: 'Burn tokens for candles' },
      //     { icon: '⛓️', text: 'On-chain prayers' },
      //     { icon: '📉', text: 'Deflationary pressure' },
      //     { icon: '👑', text: 'ILLUMIN80 rankings' },
      //   ];
        
      //   return (
      //     <div 
      //       key={item.id} 
      //       style={{
      //         ...baseStyle,
      //         padding: '1rem',
      //       }}
      //       onMouseEnter={(e) => {
      //         e.currentTarget.style.transform = 'translateY(-2px)';
      //         e.currentTarget.style.boxShadow = '0 8px 24px rgba(196, 137, 1, 0.3)';
      //       }}
      //       onMouseLeave={(e) => {
      //         e.currentTarget.style.transform = 'translateY(0)';
      //         e.currentTarget.style.boxShadow = 'none';
      //       }}
      //     >
      //       <div style={{
      //         width: '100%',
      //         display: 'flex',
      //         flexDirection: 'column',
      //         gap: '0.75rem',
      //       }}>
      //         <div style={{
      //           fontSize: '0.65rem',
      //           color: 'rgba(255, 255, 255, 0.5)',
      //           textTransform: 'uppercase',
      //           letterSpacing: '0.1em',
      //           fontFamily: '"Cyber", monospace',
      //         }}>
      //           Unique Utility
      //         </div>

      //         <div style={{
      //           display: 'grid',
      //           gridTemplateColumns: 'repeat(2, 1fr)',
      //           gap: '0.5rem',
      //           width: '100%',
      //         }}>
      //           {utilityFeatures.map((feature, index) => (
      //             <div 
      //               key={index}
      //               style={{
      //                 display: 'flex',
      //                 alignItems: 'center',
      //                 gap: '0.4rem',
      //                 padding: '0.4rem',
      //                 background: 'rgba(196, 137, 1, 0.05)',
      //                 borderRadius: '6px',
      //                 border: '1px solid rgba(196, 137, 1, 0.2)',
      //               }}
      //             >
      //               <span style={{
      //                 fontSize: '1rem',
      //               }}>
      //                 {feature.icon}
      //               </span>
      //               <span style={{
      //                 fontSize: '0.65rem',
      //                 color: 'rgba(255, 255, 255, 0.7)',
      //                 fontFamily: '"Cyber", monospace',
      //                 lineHeight: 1.2,
      //               }}>
      //                 {feature.text}
      //               </span>
      //             </div>
      //           ))}
      //         </div>
      //       </div>
      //     </div>
      //   );

      // case 'numerology':
      //   return (
          
   
            
           
            
      //       <div style={{
      //         flex: 1,
      //         width: '100%',
      //         display: 'flex',
      //         alignItems: 'center',
      //         justifyContent: 'center',
       
      //         transformOrigin: 'center',
      //       }}>
      //         <Numerology isMobile={true} />
      //       </div>
   
      //   );


      default:
        return null;
    }
  };

  return (
    <div style={{
      width: '100%',
      boxSizing: 'border-box',
    }}>
      {/* Responsive Layout Container */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '2.5fr 2.5fr', // 40/60 ratio for desktop
        // gap: isMobile ? '2rem' : '3rem',
        width: '100%',
        alignItems: isMobile ? 'center' : 'stretch',
      }}>
        {/* Left Column - Numerology */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          minHeight: isMobile ? '300px' : (isTablet ? '400px' : '450px'),
          maxHeight: isTablet ? '500px' : 'none',
          order: isMobile ? 2 : 1, // Show Numerology second on mobile
        }}>
          <div style={{
            width: '100%',
            maxWidth: '400px', // Increased from 320px to allow Numerology to be bigger
          }}>
         
        <div style={{marginTop: isMobile ? '1rem' : (isTablet ? '1.5rem' : '1rem')}}>
        <h2 style={{
            fontSize: isMobile ? '1.5rem' : (isTablet ? '1.75rem' : '2rem'),
            marginBottom: isMobile ? '0.75rem' : '1rem',
            textAlign: 'center',
            color: 'rgb(142, 102, 43)',
            fontFamily: 'UnifrakturCook, serif',
            // textShadow: '0 0 10px #00ff00, 0 0 20px #00ff00'
          }}>Explore the Token Contract</h2>
            {/* <Numerology /> */}
            {/* <ScratchCard 
    onComplete={(number) => console.log('Scratched! Number:', number)}
    onNumberRevealed={(number) => console.log('Generated number:', number)}
  />
             */}
             <TorchSection
    backgroundImage="/images/Parchment.png"
    height={isMobile ? "50vh" : (isTablet ? "45vh" : "45vh")}
    overlayOpacity={0.92}
  ></TorchSection>
            {/* Numerology Description */}
            <div style={{
              marginTop: isMobile ? '-1rem' : (isTablet ? '-1.5rem' : '-2rem'),
              padding: isMobile ? '1rem' : '1.5rem',
              // background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.05) 0%, rgba(0, 0, 0, 0.8) 50%, rgba(212, 175, 55, 0.05) 100%)',
              // backdropFilter: 'blur(12px)',
              // borderRadius: '20px',
              // border: '2px solid rgba(212, 175, 55, 0.4)',
              // boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), inset 0 0 40px rgba(212, 175, 55, 0.1)',
            }}>
              <h3 style={{
                color: 'rgb(142, 102, 43)',
                fontSize: '1.2rem',
                fontFamily: 'Cyber, serif',
                textAlign: 'center',
                marginBottom: '0rem',
                textShadow: '0 0 10px rgba(212, 175, 55, 0.3)',
              }}>
                See it on the <Link href=" ">blockchain</Link>
              </h3>
              {/* <p style={{
                color: '#ffffff',
                fontSize: '0.9rem',
                lineHeight: 1.6,
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                textAlign: 'center',
                opacity: 0.9,
   
              }}>
                Click here for the full contract
              </p> */}
              {/* <p style={{
                color: '#c48901',
                fontSize: '0.8rem',
                fontFamily: '"Cyber", monospace',
                textAlign: 'center',
                fontStyle: 'italic',
                opacity: 0.8,
              }}>
                Choose between General and Contract enlightenment modes.
              </p> */}
            </div>
            </div>
          </div>
        </div>
        
        {/* Right Column - Text Content */}
        <div style={{
          width: '90%',
          marginTop: '2rem',
          padding: isMobile ? '0rem' : '0 1rem',
          order: isMobile ? 1 : 2, // Show text first on mobile
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}>
        <h2 style={{
          color: 'rgb(142, 102, 43)',
          marginBottom: '1.5rem',
          fontSize: isMobile ? '1.5rem' : (isLandscape && viewportHeight < 800 ? '2rem' : '3rem'),
          fontFamily: 'UnifrakturCook, serif',
          textShadow: '0 0 10px rgba(212, 175, 55, 0.3)',
          lineHeight: 1.2,
          marginTop: isMobile ? '0' : '-1rem',
          textAlign: 'center',
        }}>
   In RL80 We Trust
        </h2>
        {/* <p style={{ 
          color: '#ffffff',
          fontSize: isMobile ? '0.95rem' : (isLandscape && viewportHeight < 800 ? '1.2rem' : '1.6rem'),
          lineHeight: 1.2,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          fontWeight: 400,
          letterSpacing: '0.02em',
          marginBottom: '1.5rem',
          opacity: 0.9,
        }}>

          <span style={{
            fontFamily: 'UnifrakturCook, serif',
            fontWeight: 'bold',
            fontSize: '1.1em',
            color: '#d4af37',
            textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)',
            marginLeft: '0.25em',
          }}> Our Lady of Perpetual Profit</span> believes in decentralization of power and fair distribution of wealth to the greater soci80.
        </p> */}
        
        <p style={{ 
          color: '#ffffff',
          fontSize: isMobile ? '0.9rem' : (isLandscape && viewportHeight < 800 ? '1.2rem' : '1.5rem'),
          lineHeight: 1.6,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          fontWeight: 400,
          letterSpacing: '0.02em',
          marginBottom: '1rem',
  
          opacity: 0.85,
          textAlign: 'center',
          maxWidth: isMobile ? '100%' : '800px',
          margin: '0 auto 2rem auto',
          padding: '0 1rem',
        }}>
     {/* Nowhere is the purifying presence of the virtual virgin needed more than the dark realm of defi.<br/> */}

Descending from the Cloud, Behold! the mother of memes, an aider to traders, and a fren to degens: <span style={{
            fontFamily: 'UnifrakturCook, serif',
            fontWeight: 'bold',
            fontSize: '1.1em',
            color: '#d4af37',
            textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)',
            marginLeft: '0.25em',
          }}> Our Lady of Perpetual Profit </span>is the patron saint of day traders and your divine guide through the dark realm of crypto DeFi.<br/><br/>


{/* Burn a few <span style={{
            fontFamily: 'UnifrakturCook, serif',
            fontWeight: 'bold',
            fontSize: '1.1em',
            color: '#d4af37',
            textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)',
            marginLeft: '0.25em',
          }}> RL80 </span>tokens to devote a candle in appreciation for her tireless vigilance.
Or hold them for luck, and to ward off evil.<br/><br/> */}

Whether you need a Hail Mary for hard times, or just a sanctuary in the trustless economy, <span style={{
            fontFamily: 'UnifrakturCook, serif',
            fontWeight: 'bold',
            fontSize: '1.1em',
            color: '#d4af37',
            textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)',
            marginLeft: '0.25em',
          }}> RL80 </span>  is a token to believe in.
{/* Let <span style={{
            fontFamily: 'UnifrakturCook, serif',
            fontWeight: 'bold',
            fontSize: '1.1em',
            color: '#d4af37',
            textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)',
            marginLeft: '0.25em',
          }}> Our Lady of Perpetual Profit </span>  light the way. */}
</p>
{/* <p style={{ 
          color: '#ffffff',
          fontSize: isMobile ? '0.9rem' : (isLandscape && viewportHeight < 800 ? '1.2rem' : '1.5rem'),
          lineHeight: 1.2,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          fontWeight: 400,
          letterSpacing: '0.02em',
          marginBottom: '2rem',
          opacity: 0.85,
        }}>
 Behold,  <span style={{
            fontFamily: 'UnifrakturCook, serif',
            fontWeight: 'bold',
            fontSize: '1.1em',
            color: '#d4af37',
            textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)',
            marginLeft: '0.25em',
          }}> RL80! </span> 


 Hold  <span style={{
            fontFamily: 'UnifrakturCook, serif',
            fontWeight: 'bold',
            fontSize: '1.1em',
            color: '#d4af37',
            textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)',
            marginLeft: '0.25em',
          }}> RL80! </span> 

</p> */}

        {/* Contract Address Box */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.05) 0%, rgba(0, 0, 0, 0.8) 50%, rgba(212, 175, 55, 0.05) 100%)',
          backdropFilter: 'blur(12px)',
          borderRadius: '20px',
          border: '2px solid rgba(212, 175, 55, 0.4)',
          boxShadow: '0 15px 45px rgba(0, 0, 0, 0.5), inset 0 0 40px rgba(212, 175, 55, 0.1)',
          padding: '1rem 1.5rem',
          marginTop: '0rem',
          transition: 'all 0.3s ease',
          textAlign: 'center',
          maxWidth: isMobile ? '100%' : '600px',
          // width: '100%',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(196, 137, 1, 0.3)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            marginBottom: '0.5rem'
          }}>
            <span style={{
              fontFamily: 'UnifrakturCook, UnifrakturMaguntia, serif',
              fontWeight: 'bold',
              fontSize: '0.9rem',
              color: '#d4af37',
              textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)',
            }}> Our Lady of Perpetual Profit</span>
            <span style={{
              fontFamily: 'cyber, monospace',
              fontWeight: 'bold',
              fontSize: '0.8rem',
              color: '#ffffff',
              textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)',
            }}> • Ticker: </span>
            <span style={{
              fontFamily: 'cyber, monospace',
              fontWeight: 'bold',
              fontSize: '0.9rem',
              color: '#d4af37',
              textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)',
            }}>RL80 </span>
          </div>
          <h3 style={{
            color: '#c48901',
            fontSize: '0.75rem',
            fontWeight: '600',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginBottom: '0.5rem',
            marginTop: '0',
            fontFamily: '"Cyber", monospace',
            textAlign: 'center',
          }}>
            Contract Address (BASE Chain)
          </h3>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'rgba(0, 0, 0, 0.3)',
            padding: '0.4rem 0.6rem',
            borderRadius: '8px',
            border: '1px solid rgba(196, 137, 1, 0.2)',
            width: '100%',
          }}>
            <code style={{
              color: '#ffffff',
              fontSize: '0.8rem',
              fontFamily: 'monospace',
              wordBreak: 'break-all',
              flex: 1,
              opacity: 0.9,
              textAlign: 'center',
            }}>
              {contractAddress.slice(0, 6)}...{contractAddress.slice(-4)}
            </code>
            
            <button
              onClick={handleCopyAddress}
              style={{
                background: copied ? 'rgba(0, 255, 0, 0.2)' : 'rgba(196, 137, 1, 0.2)',
                border: `1px solid ${copied ? 'rgba(0, 255, 0, 0.5)' : 'rgba(196, 137, 1, 0.5)'}`,
                borderRadius: '6px',
                padding: '0.4rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title={copied ? 'Copied!' : 'Copy address'}
            >
              {copied ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00ff00" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c48901" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              )}
            </button>
          </div>
        </div>
        {/* <div style={{
          background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.05) 0%, rgba(0, 0, 0, 0.8) 50%, rgba(212, 175, 55, 0.05) 100%)',
          backdropFilter: 'blur(12px)',
          borderRadius: '20px',
          border: '2px solid rgba(212, 175, 55, 0.4)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), inset 0 0 40px rgba(212, 175, 55, 0.1)',
          padding: '1rem',
          marginTop: '2rem',
          backdropFilter: 'blur(10px)',
          transition: 'all 0.3s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(196, 137, 1, 0.3)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }}
        >
          <span style={{
            fontFamily: 'UnifrakturCook, UnifrakturMaguntia, serif',
            fontWeight: 'bold',
            fontSize: '0.9em',
            color: '#d4af37',
            textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)',
            display: 'block',
            textAlign: 'center',
            marginBottom: '0.5rem'
          }}> Our Lady of Perpetual Profit</span>
          <span style={{
            fontFamily: 'cyber, monospace',
            fontWeight: 'bold',
            fontSize: '0.8em',
            color: '#ffffff',
            textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)',
            // display: 'block',
            textAlign: 'center',
            marginBottom: '0.75rem'
          }}> Ticker: </span><span style={{
            fontFamily: 'cyber, monospace',
            fontWeight: 'bold',
            fontSize: '0.9em',
            color: '#d4af37',
            textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)',
            // display: 'block',
            textAlign: 'center',
            marginBottom: '0.5rem'
          }}>RL80 </span>
          <h3 style={{
            color: '#c48901',
            fontSize: '0.85rem',
            fontWeight: '600',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginBottom: '0.75rem',
            fontFamily: '"Cyber", monospace',
            textAlign: 'center',
          }}>
            Contract Address (BASE Chain)
          </h3>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'rgba(0, 0, 0, 0.3)',
            padding: '0.4rem 0.6rem',
            borderRadius: '8px',
            border: '1px solid rgba(196, 137, 1, 0.2)',
            width: '100%',
          }}>
            <code style={{
              color: '#ffffff',
              fontSize: '0.8rem',
              fontFamily: 'monospace',
              wordBreak: 'break-all',
              flex: 1,
              opacity: 0.9,
              textAlign: 'center',
            }}>
              {contractAddress.slice(0, 6)}...{contractAddress.slice(-4)}
            </code>
            
            <button
              onClick={handleCopyAddress}
              style={{
                background: copied ? 'rgba(0, 255, 0, 0.2)' : 'rgba(196, 137, 1, 0.2)',
                border: `1px solid ${copied ? 'rgba(0, 255, 0, 0.5)' : 'rgba(196, 137, 1, 0.5)'}`,
                borderRadius: '6px',
                padding: '0.4rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title={copied ? 'Copied!' : 'Copy address'}
            >
              {copied ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00ff00" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c48901" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              )}
            </button>
          </div>
        </div> */}
      </div>
      </div>
      
      <style jsx>{`
        @keyframes pulse {

          

          0%, 100% {
            opacity: 0.3;
          }
          50% {
            opacity: 0.6;
          }
        }
        
        /* Large tablets and small desktops */
        @media (max-width: 1200px) {
          .main-grid {
            grid-template-columns: repeat(12, 1fr) !important;
          }
          
          .grid-section {
            grid-column: span 6 !important;
          }
          
          .text-section {
            grid-column: span 6 !important;
          }
        }
        
        /* Tablets */
        @media (max-width: 992px) {
          .main-grid {
            grid-template-columns: 1fr !important;
            grid-gap: 2rem !important;
          }
          
          .grid-section {
            grid-column: span 1 !important;
            max-width: 600px !important;
            margin: 0 auto !important;
            width: 100% !important;
          }
          
          .text-section {
            grid-column: span 1 !important;
            // padding: 0 1rem !important;
          }
        }
        
        /* Small tablets and large phones */
        @media (max-width: 768px) {
          .token-info-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            grid-gap: 12px !important;
          }
          
          .main-container {
            padding: 0 20px !important;
          }
        }
        
        /* Mobile */
        @media (max-width: 480px) {
          .token-info-grid {
            grid-template-columns: 1fr !important;
            grid-gap: 12px !important;
            width: 100% !important;
          }
          
          .main-container {
            padding: 0 15px !important;
          }
          
          .grid-section {
            width: 100% !important;
            max-width: none !important;
          }
          
          .text-section {
            padding: 0 !important;
          }
          
          .text-section h2 {
            font-size: 1.8rem !important;
          }
          
          .text-section p {
            font-size: 1rem !important;
          }
          
          .text-section h3 {
            font-size: 1.1rem !important;
          }
          
          .text-section li {
            font-size: 0.9rem !important;
          }
        }
      `}</style>
    </div>
  );
};

export default TokenInfoGrid;