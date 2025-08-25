import React, { Suspense, useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment, useAnimations } from '@react-three/drei';
import * as THREE from 'three';
import Chart from 'chart.js/auto';
import SimpleLoader from './SimpleLoader';

function createChartTexture(data, chartType = 'line', label = '') {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  
  // Save the initial state
  ctx.save();
  
  // First, fill the entire canvas with a solid color to test
  ctx.fillStyle = 'rgba(30, 30, 40, 1)'; // Solid dark background
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Add a colored overlay based on chart type
  ctx.fillStyle = label === 'RSI' ? 'rgba(255, 165, 0, 0.15)' :
                  label === 'Moving Averages' ? 'rgba(255, 255, 0, 0.15)' :
                  label === 'Market Cap (B)' ? 'rgba(255, 100, 255, 0.15)' :
                  'rgba(0, 255, 255, 0.15)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Special handling for Moving Averages chart with multiple lines
  if (label === 'Moving Averages' && data.ma7 && data.ma3) {
    const datasets = [
      {
        label: 'Price',
        data: data.values,
        borderColor: '#00ffff',
        backgroundColor: 'transparent',
        borderWidth: 3,
        tension: 0.4,
        pointRadius: 4
      },
      {
        label: 'MA7',
        data: data.ma7,
        borderColor: '#ff64ff',
        backgroundColor: 'transparent',
        borderWidth: 2,
        tension: 0.4,
        pointRadius: 3,
        borderDash: [5, 5]
      },
      {
        label: 'MA3',
        data: data.ma3,
        borderColor: '#ffff00',
        backgroundColor: 'transparent',
        borderWidth: 2,
        tension: 0.4,
        pointRadius: 3,
        borderDash: [3, 3]
      }
    ];
    
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.timestamps,
        datasets: datasets
      },
      options: {
        responsive: false,
        animation: false,
        backgroundColor: 'transparent',
        plugins: {
          legend: {
            labels: {
              color: '#00ffff',
              font: {
                size: 12,
                weight: 'bold'
              }
            }
          },
          title: {
            display: true,
            text: label,
            color: '#00ffff',
            font: {
              size: 16,
              weight: 'bold'
            }
          }
        },
        scales: {
          x: {
            grid: {
              color: 'rgba(255, 255, 255, 0.05)'
            },
            ticks: {
              color: 'rgba(255, 255, 255, 0.7)',
              font: {
                size: 10
              }
            }
          },
          y: {
            grid: {
              color: 'rgba(255, 255, 255, 0.05)'
            },
            ticks: {
              color: 'rgba(255, 255, 255, 0.7)',
              font: {
                size: 10
              }
            }
          }
        }
      }
    });
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }
  
  // Configure based on chart type and label
  let chartConfig;
  if (label === 'RSI') {
    chartConfig = {
      label: label,
      data: data.values,
      borderColor: '#ffa500',
      backgroundColor: 'rgba(255, 165, 0, 0.1)',
      borderWidth: 3,
      tension: 0.4,
      pointBackgroundColor: '#ffa500',
      pointBorderColor: '#ffffff',
      pointBorderWidth: 2,
      pointRadius: 5
    };
  } else if (label === 'Market Cap (B)') {
    chartConfig = {
      label: label,
      data: data.values,
      backgroundColor: 'rgba(255, 100, 255, 0.6)',
      borderColor: '#ff64ff',
      borderWidth: 2
    };
  } else if (chartType === 'bar') {
    chartConfig = {
      label: label || 'Volume (M)',
      data: data.values,
      backgroundColor: 'rgba(255, 100, 255, 0.6)',
      borderColor: '#ff64ff',
      borderWidth: 2
    };
  } else {
    chartConfig = {
      label: label || 'ETH Price',
      data: data.values,
      borderColor: '#00ffff',
      backgroundColor: 'rgba(0, 255, 255, 0.1)',
      borderWidth: 4,
      tension: 0.4,
      pointBackgroundColor: '#00ffff',
      pointBorderColor: '#ffffff',
      pointBorderWidth: 2,
      pointRadius: 6,
      pointHoverRadius: 8
    };
  }
  
  // Add RSI overbought/oversold zones if it's an RSI chart
  const yScaleOptions = label === 'RSI' ? {
    min: 0,
    max: 100,
    grid: {
      color: 'rgba(255, 255, 255, 0.05)'
    },
    ticks: {
      color: 'rgba(255, 255, 255, 0.7)',
      font: {
        size: 12
      },
      callback: function(value) {
        if (value === 30) return '30 (Oversold)';
        if (value === 70) return '70 (Overbought)';
        return value;
      }
    }
  } : {
    grid: {
      color: 'rgba(255, 255, 255, 0.05)'
    },
    ticks: {
      color: 'rgba(255, 255, 255, 0.7)',
      font: {
        size: 12
      }
    }
  };
  
  new Chart(ctx, {
    type: chartType,
    data: {
      labels: data.timestamps,
      datasets: [chartConfig]
    },
    options: {
      responsive: false,
      animation: false,
      backgroundColor: 'transparent',
      plugins: {
        legend: {
          display: false // Hide legend since we'll use title
        },
        title: {
          display: true,
          text: label || 'Chart',
          color: '#00ffff',
          font: {
            size: 16,
            weight: 'bold'
          }
        }
      },
      scales: {
        x: {
          grid: {
            color: 'rgba(255, 255, 255, 0.05)'
          },
          ticks: {
            color: 'rgba(255, 255, 255, 0.7)',
            font: {
              size: 12
            }
          }
        },
        y: yScaleOptions
      }
    }
  });
  
  // Restore the context state
  ctx.restore();
  
  // Draw a border on top of everything
  ctx.strokeStyle = label === 'RSI' ? '#ffa500' :
                    label === 'Moving Averages' ? '#ffff00' :
                    label === 'Market Cap (B)' ? '#ff64ff' :
                    '#00ffff';
  ctx.lineWidth = 3;
  ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function FloatingChart({ position, chartData, chartType = 'line' }) {
  const meshRef = useRef();
  const [texture, setTexture] = useState(null);
  
  useEffect(() => {
    if (chartData) {
      const newTexture = createChartTexture(chartData, chartType);
      setTexture(newTexture);
    }
  }, [chartData, chartType]);
  
  useFrame(({ clock }) => {
    if (meshRef.current) {
      const time = clock.getElapsedTime();
      meshRef.current.position.y = position[1] + Math.sin(time * 0.0005) * 0.002;
      meshRef.current.rotation.y = Math.sin(time * 0.0003) * 0.001;
    }
  });
  
  if (!texture) return null;
  
  return (
    <group ref={meshRef} position={position}>
      {/* Glow backdrop */}
      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[3, 1.5]} />
        <meshBasicMaterial 
          color="#00ffff"
          transparent={false}
          opacity={0.8}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Main chart */}
      <mesh>
        <planeGeometry args={[3, 1.5]} />
        <meshStandardMaterial 
          map={texture} 
          transparent={false} 
          side={THREE.DoubleSide}
          opacity={0.95}
          emissive="#00ffff"
          emissiveIntensity={4.8}
        />
      </mesh>
      
      {/* Edge glow */}
      <mesh position={[0, 0, 0.01]}>
        <planeGeometry args={[3, 1.5]} />
        <meshBasicMaterial 
          color="#00ffff"
          transparent={false}
          opacity={0.75}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

function Model({ modelPath }) {
  const group = useRef();
  const { scene, animations } = useGLTF(modelPath);
  const { actions } = useAnimations(animations, group);
  
  useEffect(() => {
    // Play multiple animations simultaneously
    const animationsToPlay = ['Experiment', 'HaloRotation'];
    
    if (actions && Object.keys(actions).length > 0) {
      // Play each animation if it exists
      animationsToPlay.forEach(animName => {
        if (actions[animName]) {
          actions[animName].play();
          actions[animName].setLoop(THREE.LoopRepeat);
          actions[animName].timeScale = 1; // Adjust speed if needed
          console.log(`Playing animation: ${animName}`);
        }
      });
      
      // Also try to play Action or Action.001 if Experiment doesn't exist
      if (!actions['Experiment'] && (actions['Action'] || actions['Action.001'])) {
        const fallbackAnim = actions['Action'] || actions['Action.001'];
        fallbackAnim.play();
        fallbackAnim.setLoop(THREE.LoopRepeat);
        console.log('Playing fallback animation');
      }
    }
  }, [actions]);
  
  return (
    <group ref={group}>
      <primitive position={[0, -1.5, 0]} object={scene} scale={2} />
    </group>
  );
}

function ChartCylinder({ radius = 2, height = 2, chartCount = 4, onChartClick }) {
  const [priceChartData, setPriceChartData] = useState({
    timestamps: ['Loading...'],
    values: [0]
  });
  
  const [marketCapChartData, setMarketCapChartData] = useState({
    timestamps: ['Loading...'],
    values: [0]
  });
  
  const [rsiChartData, setRsiChartData] = useState({
    timestamps: ['Loading...'],
    values: [0]
  });
  
  const [maChartData, setMaChartData] = useState({
    timestamps: ['Loading...'],
    values: [0],
    ma7: [0],
    ma3: [0]
  });
  
  // Calculate RSI
  const calculateRSI = (prices, period = 14) => {
    if (prices.length < period + 1) return prices.map(() => 50);
    
    const rsiValues = [];
    const gains = [];
    const losses = [];
    
    // Calculate initial average gain/loss
    for (let i = 1; i <= period; i++) {
      const diff = prices[i] - prices[i - 1];
      gains.push(diff > 0 ? diff : 0);
      losses.push(diff < 0 ? Math.abs(diff) : 0);
    }
    
    let avgGain = gains.reduce((a, b) => a + b, 0) / period;
    let avgLoss = losses.reduce((a, b) => a + b, 0) / period;
    
    // Calculate RSI for each day
    for (let i = period; i < prices.length; i++) {
      const diff = prices[i] - prices[i - 1];
      const gain = diff > 0 ? diff : 0;
      const loss = diff < 0 ? Math.abs(diff) : 0;
      
      avgGain = ((avgGain * (period - 1)) + gain) / period;
      avgLoss = ((avgLoss * (period - 1)) + loss) / period;
      
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      const rsi = 100 - (100 / (1 + rs));
      rsiValues.push(Math.round(rsi));
    }
    
    // Pad the beginning with neutral RSI values
    while (rsiValues.length < prices.length) {
      rsiValues.unshift(50);
    }
    
    return rsiValues.slice(-7); // Return last 7 days
  };
  
  // Calculate Moving Averages
  const calculateMA = (prices, period) => {
    const ma = [];
    for (let i = 0; i < prices.length; i++) {
      if (i < period - 1) {
        ma.push(prices[i]); // Use current price if not enough data
      } else {
        const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
        ma.push(Math.round(sum / period));
      }
    }
    return ma;
  };
  
  // Fetch Ethereum data from CoinGecko
  useEffect(() => {
    const fetchEthereumData = async () => {
      try {
        // Fetch 30-day data to calculate proper RSI and MA
        const response = await fetch(
          'https://api.coingecko.com/api/v3/coins/ethereum/market_chart?vs_currency=usd&days=30&interval=daily'
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch Ethereum data');
        }
        
        const data = await response.json();
        
        // Process price data (last 7 days)
        if (data.prices && data.prices.length > 0) {
          const last7Days = data.prices.slice(-8, -1); // Get last 7 complete days
          const dates = last7Days.map(([timestamp]) => {
            const date = new Date(timestamp);
            return date.toLocaleDateString('en-US', { weekday: 'short' });
          });
          
          const prices = last7Days.map(([, price]) => Math.round(price));
          const allPrices = data.prices.map(([, price]) => price);
          
          setPriceChartData({
            timestamps: dates,
            values: prices
          });
          
          // Calculate and set RSI
          const rsiValues = calculateRSI(allPrices);
          setRsiChartData({
            timestamps: dates,
            values: rsiValues
          });
          console.log('RSI Data:', { timestamps: dates, values: rsiValues });
          
          // Calculate and set Moving Averages
          const ma7 = calculateMA(allPrices, 7).slice(-7);
          const ma3 = calculateMA(allPrices, 3).slice(-7);
          
          setMaChartData({
            timestamps: dates,
            values: prices,
            ma7: ma7,
            ma3: ma3
          });
          console.log('MA Data:', { timestamps: dates, values: prices, ma7, ma3 });
        }
        
        // Process market cap data (convert to billions)
        if (data.market_caps && data.market_caps.length > 0) {
          const last7Days = data.market_caps.slice(-8, -1);
          const dates = last7Days.map(([timestamp]) => {
            const date = new Date(timestamp);
            return date.toLocaleDateString('en-US', { weekday: 'short' });
          });
          
          const marketCaps = last7Days.map(([, cap]) => 
            Math.round(cap / 1000000000) // Convert to billions
          );
          
          setMarketCapChartData({
            timestamps: dates,
            values: marketCaps
          });
          console.log('Market Cap Data:', { timestamps: dates, values: marketCaps });
        }
      } catch (error) {
        console.error('Error fetching Ethereum data:', error);
        // Fallback to dummy data if API fails
        const fallbackDates = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        setPriceChartData({
          timestamps: fallbackDates,
          values: [2200, 2450, 2300, 2800, 3100, 2900, 3050]
        });
        setMarketCapChartData({
          timestamps: fallbackDates,
          values: [265, 295, 276, 336, 372, 348, 366]
        });
        setRsiChartData({
          timestamps: fallbackDates,
          values: [45, 52, 48, 65, 72, 68, 70]
        });
        setMaChartData({
          timestamps: fallbackDates,
          values: [2200, 2450, 2300, 2800, 3100, 2900, 3050],
          ma7: [2150, 2250, 2350, 2450, 2550, 2650, 2750],
          ma3: [2100, 2350, 2400, 2520, 2730, 2930, 3020]
        });
      }
    };
    
    fetchEthereumData();
    // Refresh data every 5 minutes
    const interval = setInterval(fetchEthereumData, 300000);
    
    return () => clearInterval(interval);
  }, []);
  
  const charts = useMemo(() => {
    const chartsArray = [];
    const chartTypes = [
      { data: priceChartData, type: 'line', label: 'ETH Price' },
      { data: marketCapChartData, type: 'bar', label: 'Market Cap (B)' },
      { data: rsiChartData, type: 'line', label: 'RSI' },
      { data: maChartData, type: 'line', label: 'Moving Averages' }
    ];
    
    console.log('Creating charts with data:', {
      price: priceChartData,
      marketCap: marketCapChartData,
      rsi: rsiChartData,
      ma: maChartData
    });
    
    for (let i = 0; i < chartCount; i++) {
      const angle = (i / chartCount) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius +1;
      const y = height + (Math.sin(angle * 2) * 0.5); // Vary height slightly
      
      const chartConfig = chartTypes[i % chartTypes.length];
      
      chartsArray.push({
        position: [x, y, z],
        rotation: [0, -angle + Math.PI / 2, 0], // Face center
        data: chartConfig.data,
        type: chartConfig.type,
        label: chartConfig.label
      });
    }
    console.log('Charts created:', chartsArray.map(c => c.label));
    return chartsArray;
  }, [chartCount, radius, height, priceChartData, marketCapChartData, rsiChartData, maChartData]);
  
  return (
    <>
      {charts.map((chart, index) => (
        <FloatingChartCurved
          key={index}
          position={chart.position}
          rotation={chart.rotation}
          chartData={chart.data}
          chartType={chart.type}
          chartLabel={chart.label}
          index={index}
          onChartClick={onChartClick}
        />
      ))}
    </>
  );
}

function FloatingChartCurved({ position, rotation, chartData, chartType = 'line', chartLabel = '', index, onChartClick }) {
  const groupRef = useRef();
  const radius = 1; // Match the radius from ChartCylinder
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);
  const [texture, setTexture] = useState(null);
  
  useEffect(() => {
    if (chartData && chartData.values && chartData.values.length > 0) {
      // Dispose of old texture if it exists
      if (texture) {
        texture.dispose();
      }
      const newTexture = createChartTexture(chartData, chartType, chartLabel);
      newTexture.needsUpdate = true;
      setTexture(newTexture);
    }
  }, [chartData, chartType, chartLabel]);
  
  // Change cursor on hover
  useEffect(() => {
    document.body.style.cursor = hovered ? 'pointer' : 'auto';
    return () => {
      document.body.style.cursor = 'auto';
    };
  }, [hovered]);
  
  useFrame(({ clock }) => {
    if (groupRef.current) {
      const time = clock.getElapsedTime();
      
      // Calculate original angle from position
      const baseAngle = Math.atan2(position[2] - 1, position[0]);
      
      // Stop orbiting if clicked, slow down if hovered
      const speedMultiplier = clicked ? 0 : (hovered ? 0.3 : 1);
      const orbitSpeed = (0.05 + (index * 0.01)) * speedMultiplier;
      const newAngle = baseAngle + (time * orbitSpeed);
      
      // Update position to orbit around cylinder
      groupRef.current.position.x = Math.cos(newAngle) * radius;
      groupRef.current.position.z = Math.sin(newAngle) * radius + 1;
      
      // Slower vertical movement when hovered, stop when clicked
      const verticalSpeed = (0.2 + (index * 0.03)) * speedMultiplier;
      const verticalOffset = Math.sin(time * verticalSpeed + index * 0.8) * 0.5;
      groupRef.current.position.y = position[1] + verticalOffset;
      
      // Rotate to face center as it orbits
      groupRef.current.rotation.y = -newAngle + Math.PI / 2;
      
      // Slower tilting motion
      groupRef.current.rotation.x = Math.sin(time * 0.1 * speedMultiplier + index) * 0.05;
      groupRef.current.rotation.z = Math.cos(time * 0.08 * speedMultiplier + index) * 0.03;
      
      // Scale effect on hover/click - reduced for smoother effect
      const targetScale = clicked ? 1.1 : (hovered ? 1.05 : 1);
      groupRef.current.scale.lerp(
        new THREE.Vector3(targetScale, targetScale, targetScale),
        0.15
      );
    }
  });
  
  if (!texture) return null;
  
  // Create curved geometry for charts
  const curveAngle = Math.PI / 6; // 30 degrees of curve
  
  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      {/* Main chart - curved with interaction */}
      <mesh
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHovered(false);
        }}
        onClick={(e) => {
          e.stopPropagation();
          setClicked(!clicked);
          // Send chart data to parent component
          if (onChartClick) {
            onChartClick({
              type: chartType,
              data: chartData,
              label: chartLabel,
              index: index
            });
          }
        }}
      >
        <cylinderGeometry 
          args={[
            radius,         // radiusTop
            radius,         // radiusBottom
            0.5,            // height
            16,             // radialSegments
            1,              // heightSegments
            true,           // openEnded
            -curveAngle/2,  // thetaStart
            curveAngle      // thetaLength
          ]} 
        />
        <meshStandardMaterial 
          map={texture} 
          transparent={true} 
          side={THREE.DoubleSide}  // Visible from both sides
          opacity={1}
          alphaTest={0.01}
          emissive={
            chartLabel === 'RSI' ? "#ffa500" :
            chartLabel === 'Moving Averages' ? "#ffff00" :
            chartType === 'line' ? "#00ffff" : "#ff64ff"
          }
          emissiveIntensity={hovered ? 3.8 : 2.8}
        />
      </mesh>
    </group>
  );
}

export default function SimpleModelViewer({ modelPath = '/models/GR80.glb' }) {
  const [selectedChart, setSelectedChart] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  return (
    <div style={{ width: '100%', height: '100vh', background: '#000000', position: 'relative' }}>
      {/* Full Page Chart Overlay */}
      {selectedChart && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(20px)',
          cursor: 'pointer'
        }}
        onClick={() => setSelectedChart(null)}
        >
          <div 
            style={{
              width: '80%',
              maxWidth: '800px',
              height: '60%',
              maxHeight: '500px',
              background: 'rgba(10, 10, 10, 0.95)',
              border: `3px solid ${selectedChart.type === 'line' ? '#00ffff' : '#ff64ff'}`,
              borderRadius: '20px',
              padding: '30px',
              boxShadow: `0 0 50px ${selectedChart.type === 'line' ? 'rgba(0, 255, 255, 0.5)' : 'rgba(255, 100, 255, 0.5)'}`,
              display: 'flex',
              flexDirection: 'column',
              cursor: 'default'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h2 style={{ 
                margin: 0,
                color: 
                  selectedChart.label === 'RSI' ? '#ffa500' :
                  selectedChart.label === 'Moving Averages' ? '#ffff00' :
                  selectedChart.type === 'line' ? '#00ffff' : '#ff64ff',
                fontSize: '28px',
                fontWeight: 'bold',
                textShadow: `0 0 20px ${
                  selectedChart.label === 'RSI' ? 'rgba(255, 165, 0, 0.8)' :
                  selectedChart.label === 'Moving Averages' ? 'rgba(255, 255, 0, 0.8)' :
                  selectedChart.type === 'line' ? 'rgba(0, 255, 255, 0.8)' : 'rgba(255, 100, 255, 0.8)'
                }`
              }}>
                {selectedChart.label || (selectedChart.type === 'line' ? 'ETH Price Chart' : 'Trading Volume Chart')}
              </h2>
              <button 
                onClick={() => setSelectedChart(null)}
                style={{
                  background: 'transparent',
                  border: `2px solid ${selectedChart.type === 'line' ? '#00ffff' : '#ff64ff'}`,
                  color: selectedChart.type === 'line' ? '#00ffff' : '#ff64ff',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  transition: 'all 0.3s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = selectedChart.type === 'line' ? 'rgba(0, 255, 255, 0.2)' : 'rgba(255, 100, 255, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'transparent';
                }}
              >
                ✕ Close
              </button>
            </div>
            
            {/* Chart Canvas */}
            <div style={{
              flex: 1,
              position: 'relative',
              background: 'rgba(20, 20, 20, 0.5)',
              borderRadius: '15px',
              padding: '20px'
            }}>
              <canvas 
                ref={(canvas) => {
                  if (canvas && !canvas.chartDrawn) {
                    canvas.chartDrawn = true;
                    const ctx = canvas.getContext('2d');
                    canvas.width = canvas.offsetWidth * 2;
                    canvas.height = canvas.offsetHeight * 2;
                    ctx.scale(2, 2);
                    
                    new Chart(ctx, {
                      type: selectedChart.type,
                      data: {
                        labels: selectedChart.data.timestamps,
                        datasets: [{
                          label: selectedChart.type === 'line' ? 'ETH Price ($)' : 'Volume (Millions)',
                          data: selectedChart.data.values,
                          borderColor: selectedChart.type === 'line' ? '#00ffff' : '#ff64ff',
                          backgroundColor: selectedChart.type === 'line' 
                            ? 'rgba(0, 255, 255, 0.1)' 
                            : 'rgba(255, 100, 255, 0.4)',
                          borderWidth: 3,
                          tension: 0.4,
                          pointBackgroundColor: selectedChart.type === 'line' ? '#00ffff' : '#ff64ff',
                          pointBorderColor: '#ffffff',
                          pointBorderWidth: 2,
                          pointRadius: 8,
                          pointHoverRadius: 10
                        }]
                      },
                      options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        animation: {
                          duration: 1000
                        },
                        plugins: {
                          legend: {
                            labels: {
                              color: 'white',
                              font: {
                                size: 16
                              }
                            }
                          }
                        },
                        scales: {
                          x: {
                            grid: {
                              color: 'rgba(255, 255, 255, 0.1)'
                            },
                            ticks: {
                              color: 'white',
                              font: {
                                size: 14
                              }
                            }
                          },
                          y: {
                            grid: {
                              color: 'rgba(255, 255, 255, 0.1)'
                            },
                            ticks: {
                              color: 'white',
                              font: {
                                size: 14
                              },
                              callback: function(value) {
                                return selectedChart.type === 'line' 
                                  ? '$' + value.toLocaleString()
                                  : value + 'M';
                              }
                            }
                          }
                        }
                      }
                    });
                  }
                }}
                style={{
                  width: '100%',
                  height: '100%'
                }}
              />
            </div>
            
            {/* Data Summary */}
            <div style={{
              marginTop: '20px',
              display: 'flex',
              justifyContent: 'space-around',
              borderTop: `1px solid ${selectedChart.type === 'line' ? 'rgba(0, 255, 255, 0.3)' : 'rgba(255, 100, 255, 0.3)'}`,
              paddingTop: '20px'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#888', fontSize: '14px' }}>High</div>
                <div style={{ 
                  color: selectedChart.type === 'line' ? '#00ffff' : '#ff64ff',
                  fontSize: '20px',
                  fontWeight: 'bold'
                }}>
                  {selectedChart.type === 'line' ? '$' : ''}
                  {Math.max(...selectedChart.data.values).toLocaleString()}
                  {selectedChart.type === 'bar' ? 'M' : ''}
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#888', fontSize: '14px' }}>Low</div>
                <div style={{ 
                  color: selectedChart.type === 'line' ? '#00ffff' : '#ff64ff',
                  fontSize: '20px',
                  fontWeight: 'bold'
                }}>
                  {selectedChart.type === 'line' ? '$' : ''}
                  {Math.min(...selectedChart.data.values).toLocaleString()}
                  {selectedChart.type === 'bar' ? 'M' : ''}
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#888', fontSize: '14px' }}>Average</div>
                <div style={{ 
                  color: selectedChart.type === 'line' ? '#00ffff' : '#ff64ff',
                  fontSize: '20px',
                  fontWeight: 'bold'
                }}>
                  {selectedChart.type === 'line' ? '$' : ''}
                  {Math.round(selectedChart.data.values.reduce((a, b) => a + b, 0) / selectedChart.data.values.length).toLocaleString()}
                  {selectedChart.type === 'bar' ? 'M' : ''}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Show loader when loading */}
      {isLoading && (
        <div style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0,
          zIndex: 10,
          background: '#000000'
        }}>
          <SimpleLoader />
        </div>
      )}
      <Canvas
        camera={{ position: [-1, 1, 9], fov: 40 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
        onCreated={() => setIsLoading(false)}
      >
        <ambientLight intensity={0.01} />
        {/* Multiple point lights around the cylinder */}
        <pointLight position={[0, 3, 0]} color="#00ffff" intensity={0.3} />
        <pointLight position={[3, 2, 0]} color="#ff64ff" intensity={0.3} />
        <pointLight position={[-3, 2, 0]} color="#00ffff" intensity={0.3} />
        <pointLight position={[0, 2, 3]} color="#ff64ff" intensity={0.3} />
        <pointLight position={[0, 2, -3]} color="#00ffff" intensity={0.3} />
        
        <Suspense fallback={null}>
          <Model modelPath={modelPath} />
          <Environment preset="night" />
          <ChartCylinder radius={1.5} height={1} chartCount={4} onChartClick={setSelectedChart} />
        </Suspense>
        <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} autoRotate={true} autoRotateSpeed={0.3}/>
      </Canvas>
    </div>
  );
}