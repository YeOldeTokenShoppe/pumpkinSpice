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
import CyberCalloutOverlay from '@/components/CyberCalloutOverlay';
const MusicPlayer3 = dynamic(() => import('@/components/MusicPlayer3'), {
  ssr: false,
});
import SimpleLoader from '@/components/SimpleLoader';
import CandleInteractionHint from '@/components/CandleInteractionHint';




export default function CyborgTemple() {
  const [showMobileMusicPlayer, setShowMobileMusicPlayer] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [musicPlayerVisible, setMusicPlayerVisible] = useState(false);
  const [is80sMode, setIs80sMode] = useState(false);
  const videoRef = useRef(null);
//   const { setIsPlaying: setContextIsPlaying, setShowSpotify: setContextShowSpotify } = useMusic();
  const musicPlayerRef = useRef(null);
  
  // FloatingCandleViewer state
  const [showFloatingViewer, setShowFloatingViewer] = useState(false);
  const [selectedCandleData, setSelectedCandleData] = useState(null);
  const [viewerCandleIndex, setViewerCandleIndex] = useState(0);
  const [allCandlesData, setAllCandlesData] = useState([]);
  const [paginationControls, setPaginationControls] = useState(null);
  const [showCalloutOverlay, setShowCalloutOverlay] = useState(true);
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [fontLoaded, setFontLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if font is loaded
  useEffect(() => {
    const checkFont = async () => {
      try {
        // Check if the font is available
        await document.fonts.load("1em 'UnifrakturMaguntia'");
        setFontLoaded(true);
      } catch (e) {
        // Fallback: set as loaded after a short delay
        setTimeout(() => setFontLoaded(true), 100);
      }
    };
    checkFont();
  }, []);

  // Fallback timeout to ensure loader doesn't stay forever
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isLoading) {
        console.log('Temple loading timeout reached, forcing complete');
        setIsLoading(false);
      }
    }, 10000); // 10 second timeout

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
  

  // Handle 80s mode video playback
  useEffect(() => {
    // Video autoplay is now handled in the video element's onLoadedData
    // Just pause and reset when 80s mode is turned off
    if (!is80sMode && videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [is80sMode]);



  // Auto-play music when component mounts
  useEffect(() => {
    if (showMobileMusicPlayer && musicPlayerRef.current && musicPlayerRef.current.play) {
      setTimeout(() => {
        musicPlayerRef.current.play();
      }, 500);
    }
  }, [showMobileMusicPlayer]);
  
  const handleSceneLoad = useCallback(() => {
    console.log('Cyborg Temple Scene loaded');
    setIsLoading(false);
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
  

  return (
    <>
      <style jsx global>{`
        @font-face {
          font-family: 'UnifrakturMaguntia';
          src: url('/fonts/UnifrakturMaguntia-Regular.ttf') format('truetype');
          font-weight: normal;
          font-style: normal;
          font-display: block; /* Ensures font loads before text renders */
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
          <SimpleLoader />
        </div>
      ) : (
        <>
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
      <CyberCalloutOverlay
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
      />
      
      {/* 80s Mode Video Background */}
      {is80sMode && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            zIndex: 1,
            pointerEvents: "none",
          }}
        >
          <video
            ref={videoRef}
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
              opacity: 0.15,
              filter: "saturate(2) hue-rotate(15deg) brightness(0.8)",
            }}
            onLoadedData={(e) => {
              console.log("80s video loaded:", e.target.src);
              e.target.play().catch(err => console.log("Video autoplay failed:", err));
            }}
            onError={(e) => {
              if (e.target.error) {
                console.error("80s video failed to load:", {
                  src: e.target.src,
                  errorCode: e.target.error?.code,
                  errorMessage: e.target.error?.message
                });
              }
            }}
          >
            <source src="/videos/83.mov" type="video/quicktime" />
            <source src="/videos/83.mov" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      )}
      
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
            <Link href="/gallery" style={{ textDecoration: 'none', color: 'inherit', display: 'inline-block' }}>
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
                    zIndex: -1, // No quotes needed for negative numbers
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
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent', position: 'relative', zIndex: 2 }}
      >
        <fog attach="fog" args={['#000000', 20, 200]} />
        <Suspense fallback={null}>
          <ambientLight intensity={0.3} />
          {/* <directionalLight position={[5, 10, 5]} intensity={1} /> */}
             {/* Starry background */}
             <StarField radius={150} count1={500} count2={300} is80sMode={is80sMode} />
             {/* <StarrySky /> */}
          <ConstellationModel  groupScale={[10, 10, 10]} groupPosition={[0, 15, -80]}    isVisible={true} />
          <Environment frames={Infinity} resolution={512} blur={0.5}> 
            <Lights />
            {/* Removed the mesh that was blocking the view */}
          </Environment>
          <PostProcessingEffects is80sMode={is80sMode} />
          
       
          
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
          />
          
          <OrbitControls 
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
      
      
      {/* Music Icon Button */}
      {!showMobileMusicPlayer && (
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
            // setContextShowSpotify(true);
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
      
      {/* Minimal Music Player UI */}
      {showMobileMusicPlayer && (
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
            onClick={() => {
              console.log('🎵 Skip button clicked');
              // Add skip functionality when music controls are available
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
            onClick={() => {
              setShowMobileMusicPlayer(false);
              setMusicPlayerVisible(false);
              // setContextShowSpotify(false);
              // Add pause functionality when music controls are available
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
        onClick={() => setIs80sMode(!is80sMode)}
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
      {/* <BuyTokenFAB is80sMode={is80sMode} /> */}
      
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
      
      
      {/* FloatingCandleViewer - rendered outside the Canvas */}
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
    </>
  );
}