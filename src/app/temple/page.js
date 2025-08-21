"use client";
import React, { Suspense, useState, useRef, useEffect, useCallback, useLayoutEffect } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import CyborgTempleScene from '@/components/CyborgTempleScene';
import ConstellationModel from '@/components/ConstellationModel';
import StarField from '@/components/StarField';
import PostProcessingEffects from '@/components/PostProcessingEffects';
import FloatingCandleViewer from '@/components/CandleInteraction';
import dynamic from 'next/dynamic';
import { useMusic } from '@/components/MusicContext';
import Link from 'next/link';
import { Lights } from '@/components/Lights';
import BuyTokenFAB from '@/components/BuyTokenFAB';
import CyberCalloutOverlay from '@/components/CyberCalloutOverlay';
const MusicPlayer3 = dynamic(() => import('@/components/MusicPlayer3'), {
  ssr: false,
});
import SimpleLoader from '@/components/SimpleLoader';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import * as THREE from 'three';
import CandleInteractionHint from '@/components/CandleInteractionHint';
import CandleMarquee from '@/components/CandleMarquee';
import CreateCandleModal from '@/components/CreateCandleModal';
import MemoryMonitor from '@/components/MemoryMonitor';





export default function CyborgTemple() {
  // Get music context functions first
  const { 
    play, 
    pause, 
    isPlaying: contextIsPlaying, 
    nextTrack,
    currentTrack,
    currentTrackIndex,
    is80sMode: context80sMode, 
    setIs80sMode: setContext80sMode 
  } = useMusic();
  
  // Show music player if music is already playing
  const [showMobileMusicPlayer, setShowMobileMusicPlayer] = useState(contextIsPlaying);
  const [isMobileView, setIsMobileView] = useState(false);
  const [musicPlayerVisible, setMusicPlayerVisible] = useState(contextIsPlaying);
  
  // Sync music player visibility with playing state when it changes
  useEffect(() => {
    if (contextIsPlaying && !showMobileMusicPlayer) {
      setShowMobileMusicPlayer(true);
      setMusicPlayerVisible(true);
    }
  }, [contextIsPlaying]);
  
  // Use context values instead of local state
  const isPlaying = contextIsPlaying;
  const is80sMode = context80sMode;
  const musicPlayerRef = useRef(null);
  
  // FloatingCandleViewer state (shared for both temple and marquee candles)
  const [showFloatingViewer, setShowFloatingViewer] = useState(false);
  const [selectedCandleData, setSelectedCandleData] = useState(null);
  const [viewerCandleIndex, setViewerCandleIndex] = useState(0);
  const [allCandlesData, setAllCandlesData] = useState([]);
  const [paginationControls, setPaginationControls] = useState(null);
  const [showCalloutOverlay, setShowCalloutOverlay] = useState(true);
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [fontLoaded, setFontLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sceneLoaded, setSceneLoaded] = useState(false);
  const [canvasReady, setCanvasReady] = useState(false);
  const [modelPreloaded, setModelPreloaded] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [detailedProgress, setDetailedProgress] = useState(null);
  const [sceneRendered, setSceneRendered] = useState(false);
  const renderCheckTimeoutRef = useRef(null);
  const loadingTimeoutRef = useRef(null);
  const preloadedModelRef = useRef(null);
  const preloadedAssetsRef = useRef({});
  const [showCreateCandleModal, setShowCreateCandleModal] = useState(false);
  const templeSceneRef = useRef(null);
  const [pendingCandleDelivery, setPendingCandleDelivery] = useState(null);
  const orbitControlsRef = useRef(null);
  const tempCandleRef = useRef(null); // Temporarily store candle until modal closes
  const candleWasSavedRef = useRef(false); // Use ref instead of state to avoid closure issues

  // Clear any stale pending delivery on mount
  useEffect(() => {
    setPendingCandleDelivery(null);
    tempCandleRef.current = null;
    candleWasSavedRef.current = false;
    console.log('[Temple] Cleared all delivery state on mount');
  }, []);
  
  // Track if component is mounted
  const isMountedRef = useRef(true);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  // Comprehensive asset preloading
  useEffect(() => {
    const preloadAllAssets = async () => {
      try {
        const assets = [
          { type: 'model', path: '/models/templeScene3.glb', weight: 30, name: 'Temple' },
          { type: 'model', path: '/models/singleCandleAnimatedFlame.glb', weight: 15, name: 'Candle' },
          { type: 'model', path: '/models/marketFight.glb', weight: 10, name: 'Market Scene' },
          { type: 'model', path: '/models/whale.glb', weight: 10, name: 'Whale' },
          { type: 'texture', path: '/80carpet.png', weight: 5, name: '80s Carpet' },
          { type: 'texture', path: '/virginRecords.jpg', weight: 5, name: 'Album Art' },
        ];
        
        const totalWeight = assets.reduce((sum, asset) => sum + asset.weight, 0);
        let completedWeight = 0;
        
        const gltfLoader = new GLTFLoader();
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath('/draco/');
        gltfLoader.setDRACOLoader(dracoLoader);
        
        const textureLoader = new THREE.TextureLoader();
        
        // Create a proper loading queue
        const loadAsset = (asset) => {
          return new Promise((resolve, reject) => {
            setDetailedProgress({ 
              currentTask: `Loading ${asset.name}...`,
              details: `${Math.round((completedWeight / totalWeight) * 100)}% complete`
            });
            
            if (asset.type === 'model') {
              let lastProgress = 0;
              gltfLoader.load(
                asset.path,
                (gltf) => {
                  console.log(`✓ Loaded model: ${asset.name}`);
                  // Don't store all models in memory, just the main one
                  if (asset.path === '/models/templeScene3.glb') {
                    preloadedModelRef.current = gltf;
                    preloadedAssetsRef.current[asset.path] = gltf;
                  }
                  completedWeight += asset.weight;
                  const overallProgress = (completedWeight / totalWeight) * 75;
                  setLoadingProgress(Math.round(overallProgress));
                  resolve(gltf);
                },
                (progress) => {
                  if (progress.total > 0) {
                    const assetProgress = (progress.loaded / progress.total);
                    const progressDelta = assetProgress - lastProgress;
                    const weightedProgress = progressDelta * asset.weight;
                    
                    if (weightedProgress > 0) {
                      lastProgress = assetProgress;
                      const currentTotal = completedWeight + (assetProgress * asset.weight);
                      const overallProgress = (currentTotal / totalWeight) * 75;
                      setLoadingProgress(Math.round(overallProgress));
                      
                      setDetailedProgress({ 
                        currentTask: `Loading ${asset.name}...`,
                        details: `${Math.round(assetProgress * 100)}% of ${asset.name}`
                      });
                    }
                  }
                },
                (error) => {
                  console.error(`✗ Failed to load ${asset.name}:`, error);
                  completedWeight += asset.weight;
                  const overallProgress = (completedWeight / totalWeight) * 75;
                  setLoadingProgress(Math.round(overallProgress));
                  resolve(null); // Resolve anyway to continue loading
                }
              );
            } else if (asset.type === 'texture') {
              textureLoader.load(
                asset.path,
                (texture) => {
                  console.log(`✓ Loaded texture: ${asset.name}`);
                  // Don't store textures in memory unless necessary
                  // They'll be loaded again when needed
                  completedWeight += asset.weight;
                  const overallProgress = (completedWeight / totalWeight) * 75;
                  setLoadingProgress(Math.round(overallProgress));
                  resolve(texture);
                },
                undefined,
                (error) => {
                  console.error(`✗ Failed to load ${asset.name}:`, error);
                  completedWeight += asset.weight;
                  const overallProgress = (completedWeight / totalWeight) * 75;
                  setLoadingProgress(Math.round(overallProgress));
                  resolve(null);
                }
              );
            }
          });
        };
        
        // Load assets sequentially for better progress tracking
        console.log('Starting asset preload...');
        for (const asset of assets) {
          await loadAsset(asset);
        }
        
        console.log('✓ All assets preloaded');
        setDetailedProgress({ currentTask: 'Initializing scene...', details: null });
        setModelPreloaded(true);
        setLoadingProgress(90);  // Increased to 90% when assets are done
      } catch (error) {
        console.error('Error during asset preload:', error);
        setModelPreloaded(true);
        setLoadingProgress(80);
      }
    };
    
    preloadAllAssets();
  }, []);
  
  // Check if font is loaded
  useEffect(() => {
    const checkFont = async () => {
      try {
        // Check if the font is available
        await document.fonts.load("1em 'UnifrakturMaguntia'");
        console.log('Font loaded successfully');
        setFontLoaded(true);
        // Don't add progress here, let the asset loading drive it
      } catch (e) {
        console.log('Font load failed, using fallback');
        // Fallback: set as loaded after a short delay
        setTimeout(() => {
          setFontLoaded(true);
        }, 100);
      }
    };
    checkFont();
  }, []);
  
  // Preload additional critical assets
  useEffect(() => {
    const preloadAdditionalAssets = async () => {
      try {
        // Preload video elements if needed for 80s mode
        const videoSources = [
          '/videos/80s-bg.mp4' // If you have a background video
        ];
        
        videoSources.forEach(src => {
          const video = document.createElement('video');
          video.preload = 'metadata';
          video.src = src;
          video.load();
        });
        
        // Ensure Draco decoder WASM files are cached
        const dracoFiles = [
          '/draco/draco_decoder.wasm',
          '/draco/draco_wasm_wrapper.js',
          '/draco/draco_decoder.js'
        ];
        
        dracoFiles.forEach(async (file) => {
          try {
            await fetch(file, { cache: 'force-cache' });
            console.log(`Cached: ${file}`);
          } catch (e) {
            console.log(`Could not cache ${file}`);
          }
        });
      } catch (error) {
        console.error('Error preloading additional assets:', error);
      }
    };
    
    preloadAdditionalAssets();
  }, []);

  // Mark canvas as ready after a delay to ensure it's mounted
  useEffect(() => {
    const canvasTimeout = setTimeout(() => {
      console.log('Canvas marked as ready');
      setCanvasReady(true);
      // Don't add progress here, let the asset loading drive it
    }, 500);
    return () => clearTimeout(canvasTimeout);
  }, []);

  // Wait for everything to be ready including scene rendering
  useEffect(() => {
    if (sceneLoaded && fontLoaded && canvasReady && modelPreloaded && sceneRendered) {
      console.log('All components ready and scene rendered, finalizing...');
      setDetailedProgress({ currentTask: 'Preparing temple...', details: 'Almost ready!' });
      
      // Gradually increase to 100%
      const finalizeLoading = () => {
        setLoadingProgress(prev => {
          if (prev < 100) {
            const next = Math.min(prev + 5, 100);
            if (next < 100) {
              setTimeout(finalizeLoading, 50);
            } else {
              // Add extra delay to ensure everything is visible
              setTimeout(() => {
                console.log('Hiding loader, scene fully ready');
                setIsLoading(false);
              }, 500);
            }
            return next;
          }
          return prev;
        });
      };
      
      finalizeLoading();
    } else if (sceneLoaded && fontLoaded && canvasReady && modelPreloaded && !sceneRendered) {
      // Scene is loaded but not yet rendered
      setDetailedProgress({ currentTask: 'Initializing lights...', details: 'Setting up scene' });
    }
  }, [sceneLoaded, fontLoaded, canvasReady, modelPreloaded, sceneRendered]);

  // Fallback timeout to ensure loader doesn't stay forever
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isLoading) {
        console.log('Temple loading timeout reached, forcing complete');
        setSceneRendered(true); // Force scene as rendered
        setLoadingProgress(100);
        setTimeout(() => {
          setIsLoading(false);
        }, 500);
      }
    }, 20000); // 20 second timeout for large model and rendering

    return () => clearTimeout(timeout);
  }, []);

  // Check if mobile on mount
  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    // Suppress Chrome extension errors
    const originalError = console.error;
    console.error = (...args) => {
      if (args[0]?.includes?.('message channel closed')) {
        return; // Suppress extension errors
      }
      originalError.apply(console, args);
    };
    
    return () => {
      window.removeEventListener('resize', checkMobile);
      console.error = originalError;
    };
  }, []);
  

  // 80s mode video is now handled by VideoBackground component in CyborgTempleScene



  // Auto-play music when component mounts
  useEffect(() => {
    if (showMobileMusicPlayer && musicPlayerRef.current && musicPlayerRef.current.play) {
      setTimeout(() => {
        musicPlayerRef.current.play();
      }, 500);
    }
  }, [showMobileMusicPlayer]);
  
  const handleSceneLoad = useCallback(() => {
    console.log('Cyborg Temple Scene loaded, waiting for render...');
    setSceneLoaded(true);
    
    // Give the scene time to render and lights to initialize
    // Check multiple frames to ensure stability
    let frameCount = 0;
    const checkRender = () => {
      frameCount++;
      if (frameCount < 10) {
        // Wait for 10 frames to ensure scene is stable
        requestAnimationFrame(checkRender);
      } else {
        console.log('Scene fully rendered and stable');
        setSceneRendered(true);
      }
    };
    
    // Start checking after a brief delay to let lights initialize
    setTimeout(() => {
      requestAnimationFrame(checkRender);
    }, 500);
  }, []);
  
  // Function to close the floating viewer
  const closeFloatingViewer = useCallback(() => {
    setShowFloatingViewer(false);
    setSelectedCandleData(null);
    setViewerCandleIndex(0);
    setAllCandlesData([]);
  }, []);

  // Handle navigation in the candle viewer
  const handleViewerNavigate = useCallback((direction) => {
    if (!allCandlesData || allCandlesData.length === 0) return;
    
    let newIndex;
    if (direction === 'next') {
      newIndex = (viewerCandleIndex + 1) % allCandlesData.length;
    } else {
      newIndex = (viewerCandleIndex - 1 + allCandlesData.length) % allCandlesData.length;
    }
    
    setViewerCandleIndex(newIndex);
    setSelectedCandleData({
      ...allCandlesData[newIndex],
      candleId: `candle-${newIndex}`,
      candleTimestamp: Date.now(),
    });
  }, [allCandlesData, viewerCandleIndex]);

  // Handle candle click from CyborgTempleScene
  const handleCandleClick = useCallback((index, candleData, allCandles) => {
    setSelectedCandleData(candleData);
    setViewerCandleIndex(index);
    setAllCandlesData(allCandles);
    setShowFloatingViewer(true);
  }, []);
  
  // Handle marquee candle click - reuse the same viewer
  const handleMarqueeCandleClick = useCallback((candleData) => {
    console.log('Marquee candle clicked:', candleData);
    setSelectedCandleData({
      ...candleData,
      candleId: `marquee-candle-${Date.now()}`,
      candleTimestamp: Date.now(),
    });
    setViewerCandleIndex(0);
    setAllCandlesData([candleData]); // Single candle, no navigation needed
    setShowFloatingViewer(true);
  }, []);
  
  // Store drone delivery function
  const droneDeliveryRef = useRef(null);
  
  // Handle candle creation - store temporarily until modal closes
  const handleCandleCreated = useCallback((newCandle) => {
    // handleCandleCreated called successfully
    console.log('[Temple Page] handleCandleCreated called with:', newCandle);
    
    // Store temporarily - will be set as pending when modal closes
    tempCandleRef.current = {
      ...newCandle,
      timestamp: Date.now()
    };
    console.log('[Temple Page] Stored in tempCandleRef:', tempCandleRef.current);
    
    candleWasSavedRef.current = true; // Mark that a save happened using ref
    console.log('[Temple Page] Set candleWasSavedRef.current to true');
    console.log('[Temple Page] Ready for drone delivery after modal closes');
  }, []);
  

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      margin: 0, 
      padding: 0, 
      overflow: 'hidden',
      position: 'fixed',
      top: 0,
      left: 0,
      backgroundColor: '#000'
    }}>
      <style jsx global>{`
        @font-face {
          font-family: 'UnifrakturMaguntia';
          src: url('/fonts/UnifrakturMaguntia-Regular.ttf') format('truetype');
          font-weight: normal;
          font-style: normal;
          font-display: swap;
        }
        
        #text, .text__copy {
          font-family: 'UnifrakturMaguntia', serif !important;
        }
        
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
      
      {/* Loader with progress */}
      {isLoading ? (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: '#000',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <SimpleLoader progress={loadingProgress} detailedProgress={detailedProgress} />
        </div>
      ) : (
        <>
          {/* Memory Monitor - Remove this in production */}
          <MemoryMonitor show={true} />
          
          {/* Candle Interaction Hint */}
          <CandleInteractionHint isMobileView={isMobileView} />

          <div 
      style={{
        width: "100%",
        height: "100vh",
        background: "#000",
        position: "relative",
        overflow: "hidden"
      }}
    >
      {/* Cyber Callout Overlay */}
      {/* <CyberCalloutOverlay
        title="CYBORG TEMPLE"
        subtitle="DIGITAL SANCTUARY"
        description="Welcome to the sacred nexus where consciousness meets code. Light a virtual candle and join the collective meditation."
        buttonText="ENTER"
        is80sMode={is80sMode}
        autoHide={false}
        show={showCalloutOverlay}
        onButtonClick={() => {
          console.log('Entering the temple...');
          setShowCalloutOverlay(false);
          // Add any temple entry logic here
        }}
      /> */}
      
      {/* 80s Mode Video Background is rendered in CyborgTempleScene via VideoBackground component */}
      
      {/* Main content */}
      <div style={{
        position: "fixed",
        top: "20px", 
        left: "20px",
        borderRadius: "8px",
        padding: "10px",
        pointerEvents: "auto",
        opacity: fontLoaded ? 1 : 0, // Only show when font is loaded
        transition: "opacity 0.3s ease-in-out",
        zIndex: 10000, // Increased z-index to ensure visibility
      }}>
         <div 
            id="text"
            style={{
              position: "relative",
              fontFamily: "'UnifrakturMaguntia', serif",
              fontSize: isMobileView ? "3rem" : "4rem",
              color: "#ffffff",
              cursor: "pointer",
            }}
          >
            <Link href="/" style={{ textDecoration: 'none', color: 'inherit', display: 'inline-block' }}>
              RL80
            </Link>
            {Array.from({length: 100}).map((_, i) => {
              const index = i + 1;
              return (
                <div
                  key={index}
                  className="text__copy"
                  style={{
                    position: "absolute",
                    pointerEvents: "none",
                    zIndex: -1,
                    top: 0,
                    left: 0,
                    color: is80sMode 
                      ? `rgba(${201 - index * 2}, ${55 - index * 3}, ${256 - index * 2})` 
                      : `rgba(${255 - index * 2}, ${255 - index * 3}, ${255 - index * 2})`,
                    filter: "blur(0.1rem)",
                    transform: `translate(
                      ${index * 0.1}rem, 
                      ${index * 0.1}rem
                    ) scale(${1 + index * 0.01})`,
                    opacity: (1 / index) * 1.5,
                  }}
                >
                  RL80
                </div>
              );
            })}
          </div>
          </div>
      <Canvas
        key="cyborg-temple-canvas"
        camera={{ position: [0, -1.2, 8.5], fov: 40 }}
        gl={{ 
          antialias: !isMobileView,
          alpha: true,
          powerPreference: isMobileView ? "low-power" : "high-performance",
          precision: isMobileView ? "mediump" : "highp",
          stencil: false,
          depth: true
        }}
        dpr={isMobileView ? Math.min(window.devicePixelRatio, 1.5) : window.devicePixelRatio}
        performance={{ min: 0.5 }}
        style={{ 
          background: 'transparent', 
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 2
        }}
      >
        <fog attach="fog" args={['#000000', 20, 200]} />
        <Suspense fallback={null}>
          <ambientLight intensity={0.3} />
          {/* <directionalLight position={[5, 10, 5]} intensity={1} /> */}
             {/* Starry background */}
             <StarField radius={150} count1={isMobileView ? 200 : 500} count2={isMobileView ? 150 : 300} is80sMode={is80sMode} />
             {/* <StarrySky /> */}
          <ConstellationModel  groupScale={[10, 10, 10]} groupPosition={[0, 15, -80]}    isVisible={true} />
          <Environment frames={Infinity} resolution={isMobileView ? 256 : 512} blur={0.5}> 
            <Lights />
            {/* Removed the mesh that was blocking the view */}
          </Environment>
          {!isMobileView && <PostProcessingEffects is80sMode={is80sMode} />}
          
       
          
          <CyborgTempleScene
            position={[0, 0.5, 0]}
            scale={[1, 1, 1]}
            rotation={[0, 0, 0]}
            hover={true}
            rotate={true}
            onLoad={handleSceneLoad}
            isPlaying={isPlaying}
            is80sMode={is80sMode}
            showAnnotations={showAnnotations}
            onAnnotationClick={() => setShowCalloutOverlay(false)}
            pendingCandleDelivery={pendingCandleDelivery}
            onDeliveryComplete={() => setPendingCandleDelivery(null)}
            orbitControlsRef={orbitControlsRef}
            isModalOpen={showCreateCandleModal}
            preloadedModel={preloadedModelRef.current}
            onSceneReady={() => {
              // Additional callback when scene internals are ready
              console.log('Scene internals ready');
            }}
            candleData={[
              // Sample candle data - replace with actual user data
              // { name: "User 1", image: "/path/to/image1.jpg", burnAmount: 0.5 },
              // { name: "User 2", image: "/path/to/image2.jpg", burnAmount: 0.3 },
              // { name: "User 3", image: "/path/to/image3.jpg", burnAmount: 0.7 },
              // { name: "User 4", image: "/path/to/image4.jpg", burnAmount: 0.2 },
              // { name: "User 5", image: "/path/to/image5.jpg", burnAmount: 0.9 },
              // { name: "User 6", image: "/path/to/image6.jpg", burnAmount: 0.4 },
              // { name: "User 7", image: "/path/to/image7.jpg", burnAmount: 0.6 },
              // { name: "User 8", image: "/path/to/image8.jpg", burnAmount: 0.8 },
              // // Add more candle data as needed for pagination demo
              // { name: "User 9", image: "/path/to/image9.jpg", burnAmount: 0.1 },
              // { name: "User 10", image: "/path/to/image10.jpg", burnAmount: 0.5 },
            ]}
            onCandleClick={handleCandleClick}
            onPaginationReady={(controls) => {
              setPaginationControls(controls);
            }}
            onDroneDeliveryReady={(controls) => {
              droneDeliveryRef.current = controls;
            }}
          />
          
          <OrbitControls 
            ref={orbitControlsRef}
            makeDefault
            enablePan={true}
            enableZoom={true}
            zoomSpeed={0.2}
            enableDamping={true}
            dampingFactor={0.1}
            minDistance={0.1}
            maxDistance={20}
            minPolarAngle={0}
            maxPolarAngle={Math.PI / 1.9}
            zoomToCursor={true}
            autoRotate={true}
            autoRotateSpeed={0.2}
            target={[0, 0, 0]}
          />
        </Suspense>
      </Canvas>
      
      {/* Horizontal Candle Marquee at bottom - pulls from Firestore */}
      <CandleMarquee
        direction="horizontal"
        scrollSpeed={0.05}
        style={{
          position: 'fixed',
          bottom: '0',
          left: '0',
          right: '0',
          height: '25vh',  // Bottom 15% of viewport
          width: '20vw',
          zIndex: 100,
          pointerEvents: 'auto'
        }}
        canvasStyle={{
          background: 'transparent'
        }}
        onCandleClick={handleMarqueeCandleClick}
        useFirestore={true}
      />
      
      
      {/* Music Icon Button (only show after loading) */}
      {!isLoading && !showMobileMusicPlayer && (
        <button
          style={{
            position: "fixed",
            top: isMobileView ? "7rem" : "7.5rem",
            right: isMobileView ? "20px" : "2rem",
            zIndex: 1100,
            color: "white",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: "0.5rem"
          }}
          aria-label="Music Player"
          onClick={() => {
            setShowMobileMusicPlayer(true);
            setMusicPlayerVisible(true);
            if (!contextIsPlaying) {
              play();
            }
          }}
        >
          <svg width={isMobileView ? "24" : "40"} height={isMobileView ? "24" : "40"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18V5l12-2v13"/>
            <circle cx="6" cy="18" r="3"/>
            <circle cx="18" cy="16" r="3"/>
          </svg>
        </button>
      )}
      
      {showMobileMusicPlayer && (
        <div style={{ display: "none" }}>
          <MusicPlayer3
            ref={musicPlayerRef}
            isVisible={true}
            autoPlay={true}
            is80sMode={is80sMode}
            onClose={() => {
              setShowMobileMusicPlayer(false);
              setMusicPlayerVisible(false);
              // setContextShowSpotify(false);
            }}
          />
        </div>
      )}
      
      {/* Minimal Music Player UI (only show after loading) */}
      {!isLoading && showMobileMusicPlayer && (
        <div
          style={{
            position: "fixed",
            top: isMobileView ? "7rem" : "7.5rem",
            right: isMobileView ? "20px" : "2rem",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            gap: "1rem"
          }}
        >
          {/* Spinning Album Art */}
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              overflow: "hidden",
              animation: isPlaying ? "spin 4s linear infinite" : "none",
              cursor: "pointer"
            }}
            onClick={() => {
              if (musicPlayerRef.current) {
                if (isPlaying) {
                  musicPlayerRef.current.pause();
                } else {
                  musicPlayerRef.current.play();
                }
              }
            }}
          >
            <div
              style={{
                width: "100%",
                height: "100%",
                backgroundImage: "url('/virginRecords.jpg')",
                backgroundSize: "cover",
                backgroundPosition: "center"
              }}
            />
          </div>
          
          {/* Skip Button */}
          <button
            aria-label="Skip Track"
            style={{
              background: "rgba(0, 0, 0, 0.5)",
              color: "white",
              border: "none",
              padding: "0.5rem",
              borderRadius: "4px",
              cursor: "pointer"
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('🎵 Skip button clicked');
              console.log('nextTrack function:', nextTrack);
              console.log('Current track:', currentTrack);
              console.log('Current track index:', currentTrackIndex);
              console.log('Is 80s mode:', context80sMode);
              if (nextTrack) {
                nextTrack();
                console.log('nextTrack called');
              } else {
                console.log('nextTrack is not available');
              }
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="5 4 15 12 5 20 5 4"/>
              <line x1="19" y1="5" x2="19" y2="19"/>
            </svg>
          </button>
          
          {/* Close Button */}
          <button
            aria-label="Close Music Player"
            style={{
              background: "rgba(0, 0, 0, 0.5)",
              color: "white",
              border: "none",
              padding: "0.5rem",
              borderRadius: "4px",
              cursor: "pointer"
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Close button clicked');
              setShowMobileMusicPlayer(false);
              setMusicPlayerVisible(false);
              if (pause) {
                pause();
              }
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      )}
            {/* User Login Icon */}
            <button
        style={{
          position: "fixed",
          top: isMobileView ? "4rem" : "4.5rem",
          right: isMobileView ? "20px" : "2rem",
          zIndex: 1100,
          color: is80sMode ? "#00ff41" : "white",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          padding: "0.5rem",
          transition: "all 0.3s ease"
        }}
        aria-label="User Account"
        onClick={() => {
          // Add your login/account action here
          console.log("User account clicked");
        }}
      >
        <svg width={isMobileView ? "30" : "40"} height={isMobileView ? "30" : "40"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      </button>
      {/* 80s Mode Toggle */}
      <button
        style={{
          position: "fixed",
          top: isMobileView ? "10rem" : "10.5rem",
          right: isMobileView ? "20px" : "2rem",
          zIndex: 1100,
          width: isMobileView ? "40px" : "48px",
          height: isMobileView ? "40px" : "48px",
          borderRadius: "50%",
          backgroundColor: is80sMode ? "rgba(217, 70, 239, 0.3)" : "rgba(0, 0, 0, 0.7)",
          border: is80sMode ? "2px solid #D946EF" : "2px solid rgba(255, 255, 255, 0.2)",
          color: is80sMode ? "#67e8f9" : "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          transition: "all 0.3s ease",
          backdropFilter: "blur(10px)",
          boxShadow: is80sMode ? "0 0 20px rgba(217, 70, 239, 0.5)" : "0 2px 8px rgba(0, 0, 0, 0.3)",
        }}
        aria-label="Toggle 80s Mode"
        title={is80sMode ? "Disable 80s Mode" : "Enable 80s Mode"}
        onClick={() => setContext80sMode(!is80sMode)}
      >
        <span style={{ 
          fontSize: "20px", 
          fontWeight: "bold",
          color: is80sMode ? "#00ff41" : "#67e8f9",
          textShadow: is80sMode ? "0 0 10px #00ff41" : "none",
          fontFamily: "monospace"
        }}>
          80s
        </span>
      </button>
      
      {/* Annotations Toggle */}
      <button
        style={{
          position: "fixed",
          top: isMobileView ? "13rem" : "13.5rem",
          right: isMobileView ? "20px" : "2rem",
          zIndex: 1100,
          color: is80sMode ? "#67e8f9" : (showAnnotations ? "#ffff00" : "#ffffff"),
          background: "transparent",
          border: "none",
          cursor: "pointer",
          padding: "0.5rem",
          transition: "all 0.3s ease"
        }}
        aria-label="Toggle Annotations"
        onClick={() => setShowAnnotations(!showAnnotations)}
      >
        <svg width={isMobileView ? "30" : "40"} height={isMobileView ? "30" : "40"} viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill={showAnnotations ? "currentColor" : "none"}/>
          <text 
            x="12" 
            y="12" 
            textAnchor="middle" 
            dominantBaseline="middle" 
            fontSize="14" 
            fontWeight="bold"
            fill={showAnnotations ? "#000" : "currentColor"}
          >
            ?
          </text>
        </svg>
      </button>

      
      {/* Bot/AI Assistant Icon */}
      <button
        style={{
          position: "fixed",
          top: isMobileView ? "16rem" : "16.5rem",
          right: isMobileView ? "20px" : "2rem",
          zIndex: 1100,
          color: is80sMode ? "#00ff41" : "white",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          padding: "0.5rem",
          transition: "all 0.3s ease"
        }}
        aria-label="AI Assistant"
        onClick={() => {
          // Add your AI assistant action here
          console.log("AI assistant clicked");
        }}
      >
        <svg width={isMobileView ? "30" : "40"} height={isMobileView ? "30" : "40"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 8V4H8"/>
          <rect width="16" height="12" x="4" y="8" rx="2"/>
          <path d="M2 14h2"/>
          <path d="M20 14h2"/>
          <path d="M15 13v2"/>
          <path d="M9 13v2"/>
        </svg>
      </button>
      
      {/* Buy Token FAB */}
      <BuyTokenFAB is80sMode={is80sMode} />
      
      {/* Light a Candle Button */}
      <button
        onClick={() => {
          // Drone delivery is now working!
          console.log('[Temple Page] Light a Candle button clicked - resetting state');
          setPendingCandleDelivery(null); // Clear any old pending delivery
          tempCandleRef.current = null; // Clear any temp storage
          candleWasSavedRef.current = false; // Reset save flag using ref
          setShowCreateCandleModal(true);
          console.log('[Temple Page] Modal opened, state reset');
          console.log('[Temple Page] showCreateCandleModal is now:', true);
        }}
        style={{
          position: 'fixed',
          bottom: '100px',
          right: '20px',
          padding: '12px 24px',
          background: 'linear-gradient(135deg, #00ff41 0%, #00cc33 100%)',
          color: '#000',
          border: 'none',
          borderRadius: '50px',
          fontSize: '16px',
          fontWeight: 'bold',
          cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(0, 255, 65, 0.4)',
          transition: 'all 0.3s ease',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
        onMouseEnter={(e) => {
          e.target.style.transform = 'translateY(-2px)';
          e.target.style.boxShadow = '0 6px 30px rgba(0, 255, 65, 0.6)';
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'translateY(0)';
          e.target.style.boxShadow = '0 4px 20px rgba(0, 255, 65, 0.4)';
        }}
      >
        🕯️ Light a Candle
      </button>
      
      {/* Create Candle Modal */}
      <CreateCandleModal
        isOpen={showCreateCandleModal}
        onClose={() => {
          // Modal closing with saved candle state
          console.log('[Temple Page] Modal onClose called');
          console.log('[Temple Page] Current state:', {
            candleWasSaved: candleWasSavedRef.current,
            tempCandleRef: tempCandleRef.current,
            showCreateCandleModal
          });
          
          setShowCreateCandleModal(false);
          
          // Only set pending delivery if a save actually happened
          if (candleWasSavedRef.current && tempCandleRef.current) {
            // Triggering drone delivery
            console.log('✅ Modal closed with saved candle, setting pending delivery:', tempCandleRef.current);
            setPendingCandleDelivery(tempCandleRef.current);
            console.log('✅ Called setPendingCandleDelivery with:', tempCandleRef.current);
            tempCandleRef.current = null; // Clear temp storage
            candleWasSavedRef.current = false; // Reset flag
          } else {
            // Modal closed without saving (cancelled) or no save occurred
            console.log('❌ Modal closed without save, clearing any pending state');
            console.log('candleWasSaved:', candleWasSavedRef.current, 'tempCandleRef.current:', tempCandleRef.current);
            setPendingCandleDelivery(null);
            tempCandleRef.current = null;
            candleWasSavedRef.current = false;
          }
        }}
        onCandleCreated={handleCandleCreated}
      />
      
      {/* Candle Pagination UI */}
      {/* {paginationControls && (
        <CandlePaginationUI
          currentPage={paginationControls.currentPage}
          totalPages={paginationControls.totalPages}
          candlesPerPage={paginationControls.candlesPerPage}
          totalCandles={paginationControls.totalCandles}
          onPageChange={paginationControls.changePage}
          is80sMode={is80sMode}
          isMobile={isMobileView}
        />
      )} */}
      
      
      {/* FloatingCandleViewer - shared for both temple and marquee candles */}
      {showFloatingViewer && selectedCandleData && (
        <FloatingCandleViewer
          key={`candle-viewer-${selectedCandleData.candleId}-${selectedCandleData.candleTimestamp}`}
          isVisible={showFloatingViewer}
          userData={selectedCandleData}
          onClose={closeFloatingViewer}
          onNavigate={handleViewerNavigate}
          currentIndex={viewerCandleIndex}
          totalCandles={allCandlesData.length}
        />
      )}
          </div>
        </>
      )}
    </div>
  );
}