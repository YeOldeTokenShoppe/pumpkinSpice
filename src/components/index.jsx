// index.jsx
import React, { useState, useRef, useEffect, useCallback, useMemo, Suspense, lazy, forwardRef, useImperativeHandle } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

import TickerDisplay from "@/components/TickerDisplay";

import * as THREE from "three";

import Model from "@/components/Model";
import MobileCandleOrbital from "@/components/MobileCandleOrbital";

import { useFirestoreResults } from "/src/utilities/useFirestoreResults";



import FloatingCandleViewer from "@/components/CandleInteraction";

// import CameraGUI from "./CameraGUI";
import HolographicStatue3 from "@/components/HolographicStatue3";
import PostProcessingEffects from "@/components/PostProcessingEffects";
import ConstellationModel from "@/components/ConstellationModel";
import StarField from "@/components/StarField";

import { useMusic } from "@/components/MusicContext";


// Add constants for scale management
const MIN_MODEL_SCALE = 10;
const DEFAULT_MODEL_SCALE = 11;





const ThreeDVotiveStand = forwardRef(({
  setIsLoading,
  isMobileView,
  is80sMode,
  userData,
  onPaginationChange,
}, ref) => {
  console.log("ThreeDVotiveStand mounting with props:", { isMobileView, is80sMode });

  
  
  // Use music context for showSpotify state
  const [showFloatingViewer, setShowFloatingViewer] = useState(false);

  
  // Debug log viewer state changes and notify parent
  useEffect(() => {

    // Notify parent component of viewer state change
    // Note: onCandleViewerStateChange is not passed as prop, commenting out for now
    // if (onCandleViewerStateChange) {
    //   onCandleViewerStateChange(showFloatingViewer);
    // }
  }, [showFloatingViewer]);



  
  // Function to close the floating viewer
  const closeFloatingViewer = useCallback(() => {
    setShowFloatingViewer(false);
    setSelectedCandleData(null);
    setViewerCandleIndex(0);
    setAllCandlesData([]);
  }, []);


  




  const modelRef = useRef();
  // const sceneRef = useRef(new Scene());
  const canvasRef = useRef();


  const panelRef = useRef();
  const [modelCenter, setModelCenter] = useState(new THREE.Vector3(0, 0, 0)); // Default center

  const [isMobile, setIsMobile] = useState(false);
  
  // Desktop candle pagination controls
  const [desktopPaginationControls, setDesktopPaginationControls] = useState(null);
  
  // Debug pagination controls
  useEffect(() => {
    console.log('Desktop pagination controls:', desktopPaginationControls);
  }, [desktopPaginationControls]);

  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isChildStatueLoaded, setIsChildStatueLoaded] = useState(false); // Added for internal statue tracking
  const hasNotifiedParentRef = useRef(false); // Add this ref to track notification state

  // Light helper state
  const [showLightHelper, setShowLightHelper] = useState(false);
  const [lightPosition, setLightPosition] = useState({ x: 32, y: 33, z: 89 });
  const [lightIntensity, setLightIntensity] = useState(1);
  const [skyColor, setSkyColor] = useState("#7300ff"); // Sky color in hex format for inputs
  const [groundColor, setGroundColor] = useState("#ff0000"); // Ground color in hex format for inputs
  
  // Missing state declarations
  const [selectedCandleData, setSelectedCandleData] = useState(null);
  const [viewerCandleIndex, setViewerCandleIndex] = useState(0);
  const [allCandlesData, setAllCandlesData] = useState([]);
  const [modelScale, setModelScale] = useState(DEFAULT_MODEL_SCALE);
  const [size, setSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const rendererRef = useRef();
  const [activeScene] = useState('gallery');
  const [currentDpr] = useState(1);
  const [frameloop] = useState('always');
  const sceneCameraRef = useRef();
  const results = useFirestoreResults();
  const [darkCloudsSunRef, setDarkCloudsSunRef] = useState(null);
  
  // Handle statue loaded
  useEffect(() => {
    setIsChildStatueLoaded(true);
    // Notify parent that loading is complete
    if (setIsLoading) {
      // Add a small delay to ensure everything is rendered
      setTimeout(() => {
        setIsLoading(false);
      }, 500);
    }
  }, [setIsLoading]);




  // Update ground color (bottom color)
  const updateGroundColor = hexColor => {
    setGroundColor(hexColor);

    // Update the model's ground color if modelRef is available
    if (modelRef.current && modelRef.current.updateGroundColor) {
      modelRef.current.updateGroundColor(hexColor);
    }
  };
  
  // Handle light position change
  const handleLightPositionChange = useCallback((position) => {
    setLightPosition(position);
  }, []);
  
  // Handle hold state change
  const handleHoldStateChange = useCallback((isHolding) => {
    // Handle hold state change logic
  }, []);


 
  
  // Modify the resize handler to ensure scale doesn't go below minimum
  useEffect(() => {
    const handleResize = () => {
      if (rendererRef.current) {
        rendererRef.current.setPixelRatio(1); // Consistent pixel ratio

        // Update size state for responsive adjustments
        const newWidth = window.innerWidth;
        const newHeight = window.innerHeight;

        setSize({
          width: newWidth,
          height: newHeight,
        });

        // Adjust model scale based on viewport size
        // This helps maintain consistent visual size across different devices
        const baseWidth = 1400; // Base width for reference
        const calculatedScale = Math.max(0.8, Math.min(1.2, newWidth / baseWidth));
        
        // Ensure calculated scale * DEFAULT_MODEL_SCALE is at least MIN_MODEL_SCALE
        const finalScale = Math.max(MIN_MODEL_SCALE, calculatedScale * DEFAULT_MODEL_SCALE);
        setModelScale(finalScale);
      }
    };

    // Set initial size
    handleResize();

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Add a safety check in case modelScale somehow gets reset
  useEffect(() => {
    if (modelScale < MIN_MODEL_SCALE) {
      console.warn(`Model scale (${modelScale}) below minimum, resetting to ${DEFAULT_MODEL_SCALE}`);
      setModelScale(DEFAULT_MODEL_SCALE);
    }
  }, [modelScale]);






  // Store pagination control function from MobileCandleOrbital
  const [paginationControl, setPaginationControl] = useState(null);
  const [mobilePaginationState, setMobilePaginationState] = useState(null);


  const handleCandleClick = useCallback(candleData => {
    console.log('handleCandleClick called with:', candleData);
    
    // For mobile view, we need to get all the candle data from MobileCandleOrbital
    if (isMobileView) {
      // Get the full sorted data including mock data (same logic as MobileCandleOrbital)
      let allSortedData;
      if (results && results.length > 0) {
        const realData = [...results]
          .sort((a, b) => (b.burnedAmount || 0) - (a.burnedAmount || 0));
        
        // Add mock data to match MobileCandleOrbital
        const mockData = Array(20).fill(null).map((_, i) => ({
          id: `mock-${i}`,
          userName: `TestUser${i + 1}`,
          username: `TestUser${i + 1}`,
          burnedAmount: Math.floor(Math.random() * 100),
          image: i % 2 === 0 ? '/vvv.jpg' : '/vsClown.jpg'
        }));
        
        allSortedData = [...realData, ...mockData].slice(0, 80);
      } else {
        // Fallback mock data
        allSortedData = Array(80).fill(null).map((_, i) => ({
          id: `mock-${i}`,
          userName: `Player${i + 1}`,
          username: `Player${i + 1}`,
          burnedAmount: Math.floor(Math.random() * 1000),
          image: i % 2 === 0 ? '/vvv.jpg' : '/vsClown.jpg'
        }));
      }
      
      // Find the index based on the candle data
      const clickedIndex = allSortedData.findIndex(item => 
        (item.id === candleData.id) || 
        (item.userName === candleData.userName && item.burnedAmount === candleData.burnedAmount)
      );
      
     
      
      if (clickedIndex !== -1) {
        setViewerCandleIndex(clickedIndex);
        setAllCandlesData(allSortedData);
        
        // Sync the pagination to the correct page
        if (paginationControl) {
          const pageIndex = Math.floor(clickedIndex / 8);
          paginationControl(pageIndex);
        }
      } else {
        // Fallback - set index to 0 if not found
        setViewerCandleIndex(0);
        setAllCandlesData(allSortedData);
      }
    } else {
      // Desktop view or single candle
      setViewerCandleIndex(0);
      setAllCandlesData([candleData]);
    }
    
    setSelectedCandleData(candleData);
    setShowFloatingViewer(true);
  }, [isMobileView, results, paginationControl]);

  
  // Intercept pagination changes and store the control
  const handlePaginationChange = useCallback((paginationData) => {
    if (paginationData && paginationData.setCurrentPage) {
      setPaginationControl(() => paginationData.setCurrentPage);
    }
    
    // Store the full pagination state for mobile controls
    if (paginationData) {
      setMobilePaginationState(paginationData);
    }
    
    // If viewer is open, don't pass pagination changes to parent
    if (showFloatingViewer) {
      return;
    }
    
    // Otherwise, pass through to parent
    if (onPaginationChange) {
      onPaginationChange(paginationData);
    }
  }, [onPaginationChange, showFloatingViewer]);
  
  // Override pagination when viewer is open
  const handleViewerNavigateWithPagination = useCallback((direction) => {
    if (!allCandlesData || allCandlesData.length === 0) return;
    
    let newIndex = viewerCandleIndex;
    
    if (direction === 'next' && viewerCandleIndex < allCandlesData.length - 1) {
      newIndex = viewerCandleIndex + 1;
    } else if (direction === 'prev' && viewerCandleIndex > 0) {
      newIndex = viewerCandleIndex - 1;
    }
    
    if (newIndex !== viewerCandleIndex) {
      setViewerCandleIndex(newIndex);
      setSelectedCandleData(allCandlesData[newIndex]);
      
      // Update the actual pagination to match
      if (paginationControl && isMobileView) {
        const pageIndex = Math.floor(newIndex / 8);
        paginationControl(pageIndex);
      }
    }
  }, [viewerCandleIndex, allCandlesData, isMobileView, paginationControl]);
  
  // Expose viewer navigation to parent if needed
  useEffect(() => {
    if (window) {
      window.candleViewerNavigate = showFloatingViewer ? handleViewerNavigateWithPagination : null;
      window.isCandleViewerOpen = showFloatingViewer;
    }
    
    return () => {
      if (window) {
        delete window.candleViewerNavigate;
        delete window.isCandleViewerOpen;
      }
    };
  }, [showFloatingViewer, handleViewerNavigateWithPagination]);



  
 

  return (
    <div 
      style={{ width: "100%", height: "100vh", position: "relative", backgroundColor: "#000" }}>
      
      {/* 80s Mode Video Background */}
      {is80sMode && activeScene !== 'moon' && (
        <div
          style={{
            position: "fixed",
            top: "0",
            left: "0",
            width: "100%",
            height: "100%",
            zIndex: 5,
            overflow: "hidden",
            pointerEvents: "none"
          }}
        >
          <video
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              minWidth: "100%",
              minHeight: "100%",
              width: "auto",
              height: "auto",
              transform: "translate(-50%, -50%)",
              objectFit: "cover",
              opacity: 0.25,
              filter: "saturate(2) hue-rotate(15deg) brightness(0.8)",
            }}
          >
            <source src="/videos/83.mov" type="video/quicktime" />
            <source src="/videos/83.mov" type="video/mp4" />
            {/* Fallback to vaporwave video if .mov doesn't work */}
            <source src="/vaporwave-sunset.mp4" type="video/mp4" />
          </video>
          
          {/* Overlay gradient to ensure UI visibility */}
          <div
            style={{
              position: "absolute",
              top: "0",
              left: "0",
              width: "100%",
              height: "100%",
              background: "linear-gradient(180deg, rgba(139, 0, 139, 0.2) 0%, rgba(75, 0, 130, 0.3) 50%, rgba(139, 0, 139, 0.4) 100%)",
              mixBlendMode: "overlay",
              zIndex: "-1"
            }}
          />
        </div>
      )}
      
      <Canvas
        camera={{
          position: isMobileView ? [0, 0, 20] : [0, 0, 80],  // Mobile: closer, Desktop: farther
          fov: isMobileView ? 60 : 35,  // Mobile: wider FOV, Desktop: narrower FOV
          near: 0.1,
          far: 1000
        }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          opacity: 1,
          pointerEvents: 'auto',
          zIndex: 10
        }}
        dpr={currentDpr}
        performance={{ min: 0.5 }}
        frameloop={frameloop}
        gl={{ 
          alpha: true,
          antialias: true,
          preserveDrawingBuffer: true,
          powerPreference: "high-performance",
          failIfMajorPerformanceCaveat: false,
          depth: true,
          stencil: false
        }}
        onCreated={({ gl, camera: createdCamera }) => {
          sceneCameraRef.current = createdCamera;
          // rendererRef.current = gl; // Assuming rendererRef is defined elsewhere
          
          // Configure the renderer
          gl.setClearColor(0x000000, 0);
          gl.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        }}
      >
        {/* Add basic lighting to ensure scene is visible */}
        {/* <ambientLight intensity={1} /> */}
        {/* <directionalLight position={[10, 10, 5]} intensity={1} />
        <pointLight position={[0, 10, 0]} intensity={1} /> */}
        
        {/* Add OrbitControls */}
        <OrbitControls
          enabled={true}
          autoRotate={true}
          autoRotateSpeed={0.2}
          enableDamping={true}
          enablePan={true}
          enableZoom={!isMobileView}
          enableRotate={true}
          minDistance={isMobileView ? 0.01 : 1}
          maxDistance={isMobileView ? 75 : 100}
          minPolarAngle={0}
          maxPolarAngle={Math.PI / 2}
          zoomToCursor={true}
          zoomSpeed={2.0}
          panSpeed={0.5}
          target={[0, 5, 0]}
          mouseButtons={{
            LEFT: THREE.MOUSE.ROTATE,
            MIDDLE: THREE.MOUSE.DOLLY,
            RIGHT: THREE.MOUSE.PAN
          }}
        />

        <Suspense fallback={null}>
          <Model
          scale={Math.max(modelScale, MIN_MODEL_SCALE)} 
          rotation={[0, 0, 0]}
          modelRef={modelRef}
          showFloatingViewer={showFloatingViewer}
          setShowFloatingViewer={setShowFloatingViewer}
          onCandleClick={handleCandleClick}
          setModelCenter={setModelCenter}

          setIsModelLoaded={setIsModelLoaded}
          onLightPositionChange={handleLightPositionChange}
          lightIntensity={lightIntensity}
          skyColor={skyColor}
          groundColor={groundColor}

          is80sMode={is80sMode}

  
          onHoldStateChange={handleHoldStateChange}
          isMobileView={isMobileView}
          onDarkCloudsRef={setDarkCloudsSunRef}
     
    
          onDesktopPaginationReady={setDesktopPaginationControls}
        />
        </Suspense>

        {isMobileView && isModelLoaded && (
          <Suspense fallback={null}>
            <MobileCandleOrbital
              candleData={results}
              onCandleClick={handleCandleClick}
              modelRef={modelRef}
              onPaginationChange={handlePaginationChange}
              isViewerOpen={showFloatingViewer}
            />
          </Suspense>
        )}

        <Suspense fallback={null}>

            <HolographicStatue3/>
   
        </Suspense>
        <Suspense fallback={null}>
          {!isMobileView && <TickerDisplay modelRef={modelRef} />}
        </Suspense>


        {/* Add the constellation model before the star field */}
        <Suspense fallback={null}>
          <ConstellationModel 
 
            groupScale={[30, 30, 30]} // Original scale for 3DVotiveStand
            groupPosition={[0, 0, -300]} // Original position for 3DVotiveStand
          />
        </Suspense>


        <Suspense fallback={null}>
          <PostProcessingEffects is80sMode={is80sMode} sunRef={darkCloudsSunRef} />
        </Suspense>


        {/* Render the stars last */}
        <Suspense fallback={null}>
          <StarField is80sMode={is80sMode} />
        </Suspense>

        

      </Canvas>


      


      {/* FloatingCandleViewer goes here, outside the Canvas */}
      {showFloatingViewer && selectedCandleData && (
        <FloatingCandleViewer
          key={`candle-viewer-${selectedCandleData.candleId}-${selectedCandleData.candleTimestamp}`}
          isVisible={showFloatingViewer}
          userData={selectedCandleData}
          onClose={closeFloatingViewer}
        />
      )}
      

      
      
      {/* Mobile Pagination Controls */}
      {isMobileView && mobilePaginationState && (
        <div style={{
          position: 'fixed',
          bottom: '100px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px',
          zIndex: 1001,
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}>
            {/* Left Arrow */}
            <button
              aria-label="Previous Page"
              onClick={() => {
                // Check if candle viewer is open and can handle navigation
                if (window.isCandleViewerOpen && window.candleViewerNavigate) {
                  window.candleViewerNavigate('prev');
                  return;
                }
                
                // Use the pagination state from MobileCandleOrbital
                if (mobilePaginationState && mobilePaginationState.setCurrentPage) {
                  const { currentPage, totalPages } = mobilePaginationState;
                  const newPage = (currentPage - 1 + totalPages) % totalPages;
                  mobilePaginationState.setCurrentPage(newPage);
                }
              }}
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: 'transparent',
                border: '2px solid rgba(255,255,255,0.8)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                padding: '12px',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
                e.currentTarget.style.borderColor = '#ffffff';
                e.currentTarget.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.8)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6"/>
              </svg>
            </button>
            
            <div 
              className={!is80sMode ? "thelma1" : ""}
              style={is80sMode ? {
                fontSize: '2rem',
                fontWeight: '900',
                lineHeight: '0.8',
                fontFamily: '"Bebas Neue", sans-serif',
                transform: 'rotate(-8deg) skew(-15deg)',
                background: 'linear-gradient(45deg, #ff00ff, #00ffff, #ff00ff)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                position: 'relative',
                pointerEvents: 'none',
                filter: `
                  drop-shadow(0 0 8px rgba(255, 255, 255, 0.9))
                  drop-shadow(0 0 16px rgba(255, 255, 255, 0.7))
                  drop-shadow(0 0 24px rgba(255, 255, 255, 0.5))
                  drop-shadow(0 0 40px rgba(0, 255, 255, 0.6))
                  drop-shadow(0 0 60px rgba(255, 0, 255, 0.5))
                `,
                animation: 'neonPulse 2s ease-in-out infinite alternate',
              } : {
                color: '#8e662b',
                textShadow: '0 0 5px #fff, 0 0 10px #fff, 0 0 15px #8e662b, 0 0 20px turquoise, 0 0 25px turquoise, 2px 2px 3px rgba(0, 0, 0, 0.5)',
                fontSize: '2rem',
                fontFamily: '"Bebas Neue", sans-serif',
                fontWeight: 900,
                lineHeight: 0.8,
                transform: 'rotate(-8deg) skew(-15deg)',
                pointerEvents: 'none',
              }}
            >
              THE ILLUMIN80
            </div>
            
            {/* Right Arrow */}
            <button
              aria-label="Next Page"
              onClick={() => {
                // Check if candle viewer is open and can handle navigation
                if (window.isCandleViewerOpen && window.candleViewerNavigate) {
                  window.candleViewerNavigate('next');
                  return;
                }
                
                // Use the pagination state from MobileCandleOrbital
                if (mobilePaginationState && mobilePaginationState.setCurrentPage) {
                  const { currentPage, totalPages } = mobilePaginationState;
                  const newPage = (currentPage + 1) % totalPages;
                  mobilePaginationState.setCurrentPage(newPage);
                }
              }}
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: 'transparent',
                border: '2px solid rgba(255,255,255,0.8)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                padding: '12px',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
                e.currentTarget.style.borderColor = '#ffffff';
                e.currentTarget.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.8)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </button>
          </div>
          
          {/* Page indicators - dots or page numbers */}
          <div style={{
            display: 'flex',
            gap: '4px',
            alignItems: 'center',
            marginTop: '8px',
          }}>
            {mobilePaginationState && mobilePaginationState.totalPages <= 10 ? (
              Array.from({ length: mobilePaginationState.totalPages }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: i === mobilePaginationState.currentPage ? '16px' : '6px',
                    height: '6px',
                    borderRadius: i === mobilePaginationState.currentPage ? '3px' : '50%',
                    backgroundColor: i === mobilePaginationState.currentPage ? '#ffffff' : 'rgba(255,255,255,0.6)',
                    transition: 'all 0.3s ease',
                  }}
                />
              ))
            ) : mobilePaginationState ? (
              <div style={{ fontSize: '1rem', color: '#ffffff', opacity: 0.8 }}>
                {mobilePaginationState.currentPage + 1} / {mobilePaginationState.totalPages}
              </div>
            ) : null}
          </div>
          
          {/* Range display - e.g., "1-8 of 80" */}
          {mobilePaginationState && mobilePaginationState.visibleRange && (
            <div style={{
              fontSize: '1rem',
              color: '#ffffff',
              opacity: 0.8,
              marginTop: '4px',
            }}>
              {mobilePaginationState.visibleRange.start}-{mobilePaginationState.visibleRange.end} of {mobilePaginationState.total}
            </div>
          )}
        </div>
      )}

      {/* Desktop Candle Pagination Controls */}
      {!isMobileView && (
        <div style={{
          position: 'absolute',
          bottom: '5rem',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          // gap: '10px',
          zIndex: 100,
          pointerEvents: 'none',
        }}>
   
          <div 
            className={!is80sMode ? "thelma1" : ""}
            style={is80sMode ? {
              fontSize: '3rem', // Larger for desktop
              fontFamily: '"Bebas Neue", sans-serif', // Add the font here too
              fontWeight: '900',
              lineHeight: '0.8',
              transform: 'rotate(-8deg) skew(-15deg)',
              background: 'linear-gradient(45deg, #ff00ff, #00ffff, #ff00ff)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              position: 'relative',
              pointerEvents: 'none',
              filter: `
                drop-shadow(0 0 8px rgba(255, 255, 255, 0.9))
                drop-shadow(0 0 16px rgba(255, 255, 255, 0.7))
                drop-shadow(0 0 24px rgba(255, 255, 255, 0.5))
                drop-shadow(0 0 40px rgba(0, 255, 255, 0.6))
                drop-shadow(0 0 60px rgba(255, 0, 255, 0.5))
              `,
              animation: 'neonPulse 2s ease-in-out infinite alternate',
            } : {
              color: '#8e662b',
              textShadow: '0 0 5px #fff, 0 0 10px #fff, 0 0 15px #8e662b, 0 0 20px turquoise, 0 0 25px turquoise, 2px 2px 3px rgba(0, 0, 0, 0.5)',
              fontSize: '4rem',
              fontFamily: '"Bebas Neue", sans-serif', // Add the font here
              fontWeight: 900,
              lineHeight: 0.8,
              transform: 'rotate(-8deg) skew(-15deg)',
              pointerEvents: 'none',
            }}
          >
              THE ILLUMIN80
            {is80sMode && (
              <div style={{
                content: "'THE ILLUMIN80'",
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: -1,
                color: 'transparent',
                WebkitTextStroke: '2px white',
                filter: 'blur(3px)',
                opacity: 0.7,
                pointerEvents: 'none',
              }}>
                THE ILLUMIN80
              </div>
            )}
          </div>
          
          {/* Pagination Controls */}
          <div style={{
            display: 'flex',
            gap: '2rem',
            alignItems: 'center',
            background: 'rgba(0, 0, 0, 0.7)',
            padding: '10px 20px',
            borderRadius: '25px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            marginTop: '2rem',
            pointerEvents: 'auto',
          }}>
          <button
            onClick={desktopPaginationControls?.prevPage}
            disabled={desktopPaginationControls?.isSpinning}
            style={{
              background: 'transparent',
              border: '2px solid #fff',
              color: '#fff',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              cursor: desktopPaginationControls?.isSpinning ? 'not-allowed' : 'pointer',
              opacity: desktopPaginationControls?.isSpinning ? 0.5 : 1,
              fontSize: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              if (!desktopPaginationControls?.isSpinning) {
                e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                e.target.style.transform = 'scale(1.1)';
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'transparent';
              e.target.style.transform = 'scale(1)';
            }}
          >
            ←
          </button>
          
          {/* Page info between arrows */}
          <div style={{
            color: '#fff',
            fontSize: '1.2rem',
            opacity: 0.9,
            whiteSpace: 'nowrap',
          }}>
            {(desktopPaginationControls?.currentPage || 0) + 1}-{Math.min(((desktopPaginationControls?.currentPage || 0) + 1) * 8, desktopPaginationControls?.totalCount || 0)} of {desktopPaginationControls?.totalCount || 0}
          </div>
          
          <button
            onClick={desktopPaginationControls?.nextPage}
            disabled={desktopPaginationControls?.isSpinning}
            style={{
              background: 'transparent',
              border: '2px solid #fff',
              color: '#fff',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              cursor: desktopPaginationControls?.isSpinning ? 'not-allowed' : 'pointer',
              opacity: desktopPaginationControls?.isSpinning ? 0.5 : 1,
              fontSize: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              if (!desktopPaginationControls?.isSpinning) {
                e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                e.target.style.transform = 'scale(1.1)';
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'transparent';
              e.target.style.transform = 'scale(1)';
            }}
          >
            →
          </button>
          </div>
        </div>
      )}
      </div>
  );
});

// Ensure the default export is the one you intend to use (likely the memoized one)
export default ThreeDVotiveStand;


