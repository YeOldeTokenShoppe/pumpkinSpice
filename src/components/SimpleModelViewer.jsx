import React, { Suspense, useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment, useAnimations, } from '@react-three/drei';
import { 
  EffectComposer, 
  Bloom, 
  ChromaticAberration,
  Scanline,
  Glitch,
  Noise,
  Vignette
} from '@react-three/postprocessing';
import { BlendFunction, GlitchMode } from "postprocessing";
import * as THREE from 'three';
import Chart from 'chart.js/auto';
import InfinityLoader from '@/components/InfinityLoader';
import PostProcessingEffects from './PostProcessingEffects';
import '../app/globals.css';

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

function FloatingChart({ position, chartData, chartType = 'line', chartLabel = '', index, onChartClick }) {
  const meshRef = useRef();
  const [texture, setTexture] = useState(null);
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);
  
  useEffect(() => {
    if (chartData && chartData.values && chartData.values.length > 0) {
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
    if (meshRef.current) {
      const time = clock.getElapsedTime();
      
      // Gentle floating animation
      const floatSpeed = clicked ? 0 : (hovered ? 0.3 : 1);
      meshRef.current.position.y = position[1] + Math.sin(time * 0.5 * floatSpeed + index) * 0.1;
      
      // Subtle rotation
      meshRef.current.rotation.y = Math.sin(time * 0.3 * floatSpeed) * 0.02;
      meshRef.current.rotation.x = Math.sin(time * 0.2 * floatSpeed + index) * 0.01;
      
      // Scale effect on hover/click
      const targetScale = clicked ? 1.15 : (hovered ? 1.08 : 1);
      meshRef.current.scale.lerp(
        new THREE.Vector3(targetScale, targetScale, targetScale),
        0.15
      );
    }
  });
  
  if (!texture) return null;
  
  const glowColor = 
    chartLabel === 'RSI' ? '#ffa500' :
    chartLabel === 'Moving Averages' ? '#ffff00' :
    chartLabel === 'Market Cap (B)' ? '#ff64ff' :
    '#00ffff';
  
  return (
    <group ref={meshRef} position={position}>
      {/* Glow backdrop */}
      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[2.2, 1.2]} />
        <meshBasicMaterial 
          color={glowColor}
          transparent={true}
          opacity={hovered ? 0.3 : 0.15}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Main chart */}
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
        <planeGeometry args={[2, 1]} />
        <meshStandardMaterial 
          map={texture} 
          transparent={true} 
          side={THREE.DoubleSide}
          opacity={1}
          alphaTest={0.01}
          emissive={glowColor}
          emissiveIntensity={hovered ? 2.5 : 1.5}
        />
      </mesh>
      
      {/* Edge glow */}
      <mesh position={[0, 0, 0.01]}>
        <planeGeometry args={[2.05, 1.05]} />
        <meshBasicMaterial 
          color={glowColor}
          transparent={true}
          opacity={hovered ? 0.4 : 0.2}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

function Model({ modelPath, onLoaded, is80sMode }) {
  const group = useRef();
  const { scene, animations } = useGLTF(modelPath);
  const { actions } = useAnimations(animations, group);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  const [centerOffset, setCenterOffset] = useState(new THREE.Vector3(0, 0, 0));
  
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Signal when model is loaded and calculate center
  useEffect(() => {
    if (scene) {
      // Calculate the bounding box and center of the model
      
      if (onLoaded) {
        onLoaded();
      }
    }
  }, [scene, onLoaded, modelPath]);
  
  // Control Neon mesh visibility based on 80s mode
  useEffect(() => {
    if (scene) {
      const neonMesh = scene.getObjectByName('Neon');
      if (neonMesh) {
        neonMesh.visible = is80sMode;
        console.log(`Neon mesh visibility set to: ${is80sMode}`);
      } else {
        console.log('Neon mesh not found in the model');
      }
    }
  }, [scene, is80sMode]);
  
  useEffect(() => {
    // Play multiple animations simultaneously
    const animationsToPlay = ['Experiment', 'HaloRotation', 'writing', 'Animation'];
    
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
      
      // Play writing animation on Armature.001 if it exists
      if (scene) {
        const armature001 = scene.getObjectByName('Armature.001');
        if (armature001 && actions['writing']) {
          console.log('Found Armature.001, playing writing animation');
          actions['writing'].play();
          actions['writing'].setLoop(THREE.LoopRepeat);
          actions['writing'].timeScale = 1;
        }
        
        // Play Animation on Flame object if it exists
        const flame = scene.getObjectByName('Flame');
        if (flame && actions['Animation']) {
          console.log('Found Flame, playing Animation');
          actions['Animation'].play();
          actions['Animation'].setLoop(THREE.LoopRepeat);
          actions['Animation'].timeScale = 1;
        }
      }
    }
  }, [actions, scene]);
  
  // Check if desktop (non-mobile/tablet)
  const isDesktop = windowWidth > 768;
  // Apply rotation only on desktop
  const rotation = isDesktop ? [0, -Math.PI/2, 0] : [0, 0, 0];
  
  // Apply the center offset to position the model at [0,0,0]
  const position = [
    centerOffset.x,
    centerOffset.y - 2, // Keep the -2 vertical adjustment
    centerOffset.z
  ];
  
  return (
    <group ref={group}>
      <primitive position={position} rotation={rotation} object={scene} scale={2} />
    </group>
  );
}

function FlatCharts({ onChartClick }) {
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
    
    // Arrange charts in a 2x2 grid in front of the model
    const positions = [
      [-2.5, 1.5, 3],   // Top left
      [2.5, 1.5, 3],    // Top right
      [-2.5, -0.5, 3],  // Bottom left
      [2.5, -0.5, 3]    // Bottom right
    ];
    
    for (let i = 0; i < 4; i++) {
      const chartConfig = chartTypes[i];
      
      chartsArray.push({
        position: positions[i],
        data: chartConfig.data,
        type: chartConfig.type,
        label: chartConfig.label
      });
    }
    console.log('Charts created:', chartsArray.map(c => c.label));
    return chartsArray;
  }, [priceChartData, marketCapChartData, rsiChartData, maChartData]);
  
  return (
    <>
      {charts.map((chart, index) => (
        <FloatingChart
          key={index}
          position={chart.position}
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


export default function SimpleModelViewer({ modelPath = '/models/saint_robot.glb', onLoadingChange, is80sMode = false }) {
  const [selectedChart, setSelectedChart] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [fontLoaded, setFontLoaded] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Load Google Fonts
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=UnifrakturCook:wght@700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    
    // Check if font is loaded
    const checkFont = async () => {
      try {
        await document.fonts.load('700 1em UnifrakturCook');
        setFontLoaded(true);
        // Add fonts-loaded class to body to reveal font elements
        document.body.classList.add('fonts-loaded');
      } catch (e) {
        // Font might not load, but don't block the page
        setTimeout(() => {
          setFontLoaded(true);
          document.body.classList.add('fonts-loaded');
        }, 2000);
      }
    };
    checkFont();
    
    return () => {
      document.head.removeChild(link);
    };
  }, []);
  
  // Check if desktop (non-mobile/tablet)
  const isDesktop = windowWidth > 768;
  
  // Hide loader only when everything is loaded
  useEffect(() => {
    console.log('SimpleModelViewer loading status:', { modelLoaded, fontLoaded, iframeLoaded, isDesktop });
    if (modelLoaded && fontLoaded && (iframeLoaded || !isDesktop)) {
      console.log('All conditions met, hiding loader');
      // Add a small delay for smooth transition
      setTimeout(() => {
        setIsLoading(false);
        if (onLoadingChange) onLoadingChange(false);
      }, 500);
    }
  }, [modelLoaded, fontLoaded, iframeLoaded, isDesktop, onLoadingChange]);
  
  // Notify parent when loading starts
  useEffect(() => {
    if (onLoadingChange) onLoadingChange(true);
  }, []);
  
  return (
    <div style={{ 
      width: '100%', 
      height: '100vh', 
      background: is80sMode ? 'transparent' : '#000000', 
      position: 'relative',
      animation: is80sMode ? 'subtle-glitch 8s infinite' : 'none',
      overflow: 'hidden'
    }}>
      {/* Show loader over entire page when loading */}
      {isLoading && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0,
          zIndex: 9999,
          background: '#000000'
        }}>
          <InfinityLoader />
        </div>
      )}
      
      {/* Main content - hidden while loading */}
      <div style={{
        width: '100%',
        height: '100%',
        display: isDesktop ? 'flex' : 'block',
        opacity: isLoading ? 0 : 1,
        transition: 'opacity 0.5s ease-in-out'
      }}>
      {/* Left Column - Heading and Scroll (Desktop only) */}
      {isDesktop && (
        <div style={{
          width: '50%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '2rem',
          position: 'relative'
        }}>
          {/* Heading */}
          <div style={{
            marginBottom: '2rem',
            textAlign: 'center'
          }}>
            <h1 style={{ 
              color: '#8e662b',
              fontFamily: '"UnifrakturCook", serif',
              textShadow: '3px 3px 5px #000, -1px -1px 5px pink',
              fontSize: '4rem',
              fontWeight: 900,
              lineHeight: 0.8,
              transform: 'rotate(-8deg) skew(-15deg)',
              margin: 0
            }}>The Scrolls <br/>of St. GR80</h1>
            
            {/* Introduction text */}
            <div style={{
              marginTop: '1.5rem',
              padding: '1rem',
              backgroundColor: 'rgba(142, 102, 43, 0.1)',
              border: '2px solid #8e662b',
              borderRadius: '8px',
              maxWidth: '400px',
              margin: '1.5rem auto 0'
            }}>
              <p style={{
                color: '#d4af37',
                fontFamily: 'Georgia, serif',
                fontSize: '1rem',
                lineHeight: 1.6,
                margin: 0,
                textAlign: 'center',
                textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)'
              }}>
              Here you can find the works of RL80 devotee, Saint GR80, a mechanized mystic and medieval scholar — forever pondering the ethics of markets and the metaphysics of memes.
  
              </p>
            </div>
          </div>
          
          {/* Scroll iframe */}
          <iframe
            src="/scroll.html"
            onLoad={() => setIframeLoaded(true)}
            style={{
              width: '100%',
              height: '60%',
              border: 'none',
              pointerEvents: 'auto',
              background: 'transparent',
              opacity: 0.9,
              mixBlendMode: 'screen'
            }}
            title="Scroll Overlay"
          />
        </div>
      )}
      
      {/* Right Column - 3D Model (Desktop) or Full Width (Mobile) */}
      <div style={{
        width: isDesktop ? '50%' : '100%',
        height: '100%',
        position: 'relative'
      }}>
      {/* 80s Mode Video Background */}
      {is80sMode && (
        <video
          autoPlay
          loop
          muted
          playsInline
          style={{
            position: 'absolute',
            top: isDesktop ? '20%' : '30%',
            ...(isDesktop ? { left: '20%' } : { right: '30%' }),
            transform: isDesktop ? 'translate(-50%, -50%) scale(0.4)' : 'translate(50%, -50%) scale(0.4)',
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            zIndex: 0,
            opacity: 0.7,
            // borderRadius: '10px',
            // boxShadow: '0 0 30px rgba(217, 70, 239, 0.5)'
          }}
        >
          <source src="/videos/neon80s.mp4" type="video/mp4" />
        </video>
      )}
      <Canvas
        style={{ position: 'relative', zIndex: 1 }}
        camera={{ position: [-7, 1, 7], fov: 40 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, alpha: true }}
      >
        <ambientLight intensity={0.2} />
        {/* Multiple point lights around the cylinder */}
        {/* <pointLight position={[0, 3, 0]} color="#00ffff" intensity={0.3} />
        <pointLight position={[3, 2, 0]} color="#ff64ff" intensity={0.3} />
        <pointLight position={[-3, 2, 0]} color="#00ffff" intensity={0.3} />
        <pointLight position={[0, 2, 3]} color="#ff64ff" intensity={0.3} />
        <pointLight position={[0, 2, -3]} color="#00ffff" intensity={0.3} /> */}
        
        <Suspense fallback={null}>
          <Model modelPath={modelPath} onLoaded={() => setModelLoaded(true)} is80sMode={is80sMode} />
          <Environment preset="night" />
          {/* <FlatCharts onChartClick={setSelectedChart} /> */}
        </Suspense>
        <OrbitControls enablePan={true} enableZoom={false} enableRotate={true} autoRotate={false} autoRotateSpeed={0.3}     maxPolarAngle = {Math.PI * 0.5} // Initial limit - will be dynamic
    minPolarAngle = {0} />
        {is80sMode ? (
          <EffectComposer>
            <Bloom
              intensity={0.5}  // Reduced from 1 for this scene
              luminanceThreshold={0.3}  // Slightly lower to catch highlights
              luminanceSmoothing={0.5}
              radius={0.4}
              blendFunction={BlendFunction.ADD}
            />
            <ChromaticAberration
              offset={[0.01, 0.01]}
              radialModulation={true}
              modulationOffset={0.5}
            />
            <Scanline
              density={35.0}
              opacity={0.8}
              blendFunction={BlendFunction.OVERLAY}
            />
            <Glitch
              delay={[3.0, 5.0]}
              chromaticAberrationOffset={[0.00002, 0.000005]}
              mode={GlitchMode.SPORADIC}
            />
            <Noise opacity={0.15} />
            <Vignette eskil={false} offset={0.05} darkness={0.5} />
          </EffectComposer>
        ) : (
          <EffectComposer>
            <Bloom 
              intensity={0.9}
              luminanceThreshold={0.5}
              luminanceSmoothing={0.9}
              radius={0.3}
            />
          </EffectComposer>
        )}
      </Canvas>
      
      {/* Mobile overlays - only show on mobile/tablet */}
      {!isDesktop && (
        <>
          {/* Heading overlay for mobile */}
          <div
            style={{
              position: 'absolute',
              top: windowWidth <= 480 ? '3rem' : '10%',
              left: windowWidth <= 480 ? '2rem' : '15%',
              zIndex: 1000,
              textAlign: 'left',
              pointerEvents: 'none'
            }}
          >
            <h1 style={{ 
              color: '#8e662b',
              fontFamily: '"UnifrakturCook", serif',
              textShadow: '3px 3px 5px #000, -1px -1px 5px pink',
              fontSize: windowWidth <= 480 ? '3rem' : '4rem',
              fontWeight: 900,
              lineHeight: 0.8,
              transform: 'rotate(-8deg) skew(-15deg)',
              margin: 0
            }}>The Scrolls <br/>of St. GR80</h1>
            
            {/* Introduction text for mobile */}
            <div style={{
              marginTop: '1rem',
              padding: '0.75rem',
              backgroundColor: 'rgba(0, 0, 0, 0.7)',

              border: '2px solid #8e662b',
              borderRadius: '8px',
              maxWidth: windowWidth <= 480 ? '280px' : '350px'
            }}>
              <p style={{
                color: '#d4af37',

                fontFamily: 'Georgia, serif',
                fontSize: windowWidth <= 480 ? '0.9rem' : '1rem',
                lineHeight: 1.5,
                margin: 0,
                textAlign: 'left',
                textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)'
              }}>Here you can find the works of RL80 devotee, Saint GR80, a mechanized mystic, medieval scholar, and retired service bot — forever pondering the ethics of leverage and the metaphysics of memes.
<span style={{
                fontFamily: 'UnifrakturCook, UnifrakturMaguntia, serif',
                fontWeight: 'bold',
                fontSize: '1.1em',
                color: '#d4af37',
                textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)'
              }}> Our Lady of Perpetual Profit.</span>
  
              </p>
            </div>
          </div>
          
          {/* Scroll overlay for mobile */}
          <iframe
            src="/scroll.html"
            style={{
              position: 'absolute',
              bottom: windowWidth <= 480 ? '4rem' : '0',
              left: '0',
              width: windowWidth <= 480 ? '125%' : '75%',
              height: windowWidth <= 480 ? '50%' : '45%',
              border: 'none',
              pointerEvents: 'auto',
              background: 'transparent',
              zIndex: 5,
              opacity: 0.9,
              mixBlendMode: 'screen',
              transform: windowWidth <= 480 ? 'scale(0.7)' : 'scale(1)',
              transformOrigin: 'bottom left'
            }}
            title="Scroll Overlay"
          />
        </>
      )}
      </div>
      </div>
      
      {/* 80s Mode Full-Page Effects */}
      {is80sMode && (
        <>
          {/* Scanlines overlay */}
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            pointerEvents: 'none',
            zIndex: 9998,
            background: `repeating-linear-gradient(
              0deg,
              rgba(0, 0, 0, 0) 0px,
              rgba(0, 0, 0, 0) 2px,
              rgba(0, 0, 0, 0.03) 2px,
              rgba(0, 0, 0, 0.03) 4px
            )`,
            animation: 'scanlines 8s linear infinite'
          }} />
          
          {/* Chromatic aberration effect */}
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            pointerEvents: 'none',
            zIndex: 9997,
            mixBlendMode: 'screen',
            opacity: 0.3
          }}>
            <div style={{
              width: '100%',
              height: '100%',
              position: 'absolute',
              background: 'linear-gradient(45deg, #ff00ff 0%, transparent 50%, #00ffff 100%)',
              animation: 'chromatic-shift 4s ease-in-out infinite'
            }} />
          </div>
          
          {/* Static noise */}
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            pointerEvents: 'none',
            zIndex: 9996,
            opacity: 0.05,
            animation: 'noise 0.2s infinite'
          }} />
        </>
      )}
      
      {/* 80s Mode CSS Animations */}
      <style jsx>{`
        @font-face {
          font-family: 'UnifrakturCook';
          src: url('/fonts/UnifrakturCook-Bold.ttf') format('truetype');
          font-weight: bold;
          font-style: normal;
          font-display: swap;
        }
        
        @keyframes scanlines {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(10px);
          }
        }
        
        @keyframes chromatic-shift {
          0%, 100% {
            transform: translate(0, 0);
          }
          25% {
            transform: translate(2px, -1px);
          }
          50% {
            transform: translate(-1px, 1px);
          }
          75% {
            transform: translate(1px, -2px);
          }
        }
        
        @keyframes subtle-glitch {
          0%, 98%, 100% {
            transform: translate(0, 0) skew(0deg);
            filter: hue-rotate(0deg);
          }
          98.5% {
            transform: translate(2px, 0) skew(0.5deg);
            filter: hue-rotate(10deg);
          }
          99% {
            transform: translate(-2px, 0) skew(-0.5deg);
            filter: hue-rotate(-10deg);
          }
        }
        
        @keyframes noise {
          0%, 100% {
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Cfilter id='noise'%3E%3CfeTurbulence baseFrequency='0.9' /%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.5' /%3E%3C/svg%3E");
          }
          50% {
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Cfilter id='noise'%3E%3CfeTurbulence baseFrequency='0.95' /%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.5' /%3E%3C/svg%3E");
          }
        }
      `}</style>
    </div>
  );
}