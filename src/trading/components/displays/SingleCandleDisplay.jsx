import React, { useRef, useState, useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, Html } from '@react-three/drei';
import * as THREE from 'three';
import { collection, getDocs, query, orderBy, limit, where } from 'firebase/firestore';
import { db } from '../../../utilities/firebaseClient';
import { useUser } from '@clerk/nextjs';


// Model viewer component with candle data display and texture support
function ModelViewer({ modelPath, candleData = null, showPlaque = true }) {
  const { scene, materials } = useGLTF(modelPath);
  const modelRef = useRef();
  const groupRef = useRef();
  const [plaqueVisible, setPlaqueVisible] = useState(true);
  const textureLoader = new THREE.TextureLoader();
  const boxMeshRef = useRef(null);
  
  // Clone and setup the model with textures
  React.useEffect(() => {
    if (scene && modelRef.current) {
      const clonedModel = scene.clone();
      
      // Scale and position the model
      clonedModel.scale.set(1, 1, 1);
      clonedModel.position.set(0, -1.2, -2);
      
      // Process meshes and apply textures
      clonedModel.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          
          // Apply user image to senora mesh for votive candles
          if (candleData && candleData.imageUrl && candleData.candleType === 'votive') {
            const isSenoraObject = child.name === 'senora' || 
                                  (child.material && child.material.name === 'senora') ||
                                  (child.material && child.material.name === 'senora.001');
            
            if (isSenoraObject) {
              textureLoader.load(
                candleData.imageUrl,
                (texture) => {
                  texture.colorSpace = THREE.SRGBColorSpace;
                  texture.flipY = false;
                  texture.wrapS = THREE.ClampToEdgeWrapping;
                  texture.wrapT = THREE.ClampToEdgeWrapping;
                  
                  child.material = child.material.clone();
                  child.material.map = texture;
                  child.material.transparent = true;
                  child.material.opacity = 1;
                  child.material.alphaTest = 0.1;
                  child.material.needsUpdate = true;
                }
              );
            }
          }
          
          // Clone material first for all meshes that we'll modify
          if (child.material) {
            child.material = child.material.clone();
          }
          
          // Check if this is the Box mesh first (for background texture)
          const isBoxMesh = child.name === 'Box' || child.name === 'box';
          
          // Apply baseColor to XBase meshes (but NOT to Box mesh)
          const meshNameLower = child.name.toLowerCase();
          const isXBaseMesh = !isBoxMesh && (
                             meshNameLower === 'xbase' || 
                             meshNameLower.startsWith('xbase') ||
                             (modelPath.includes('tinyVotive') && 
                              (meshNameLower === 'base' || 
                               meshNameLower === 'cylinder' || 
                               meshNameLower === 'candle' ||
                               meshNameLower.includes('candle_base') ||
                               meshNameLower.includes('wax'))));
          
          if (isXBaseMesh && candleData?.baseColor && candleData.baseColor !== '#ffffff') {
            const color = new THREE.Color(candleData.baseColor);
            child.material.color = color;
            child.material.needsUpdate = true;
          }
          
          // Apply background texture to Box mesh
          if (isBoxMesh && candleData && candleData.background && candleData.background !== 'none') {
            boxMeshRef.current = child;
            
            // Map background IDs to texture paths
            const BACKGROUND_TEXTURES = {
              'cyberpunk': '/cyberpunk.webp',
              'synthwave': '/synthwave.webp',
              'gothicTokyo': '/gothicTokyo.webp',
              'neoTokyo': '/neoTokyo.webp',
              'aurora': '/aurora.webp',
              'templeScene': '/templeScene.webp'
            };
            
            const texturePath = BACKGROUND_TEXTURES[candleData.background];
            if (texturePath) {
              console.log(`Loading background texture: ${texturePath} for background: ${candleData.background}`);
              textureLoader.load(
                texturePath,
                (texture) => {
                  texture.colorSpace = THREE.SRGBColorSpace;
                  texture.wrapS = THREE.ClampToEdgeWrapping;
                  texture.wrapT = THREE.ClampToEdgeWrapping;
                  texture.needsUpdate = true;
                  
                  child.material = child.material.clone();
                  child.material.map = texture;
                  child.material.needsUpdate = true;
                  
                  // Reset color to white to show texture
                  if (child.material.color) {
                    child.material.color.set(0xffffff);
                  }
                  console.log(`Background texture applied successfully to ${child.name}`);
                },
                (xhr) => {
                  console.log(`Loading background: ${(xhr.loaded / xhr.total * 100)}% loaded`);
                },
                (error) => {
                  console.error(`Error loading background texture ${texturePath}:`, error);
                }
              );
            }
          } else if (isBoxMesh && (!candleData || !candleData.background || candleData.background === 'none')) {
            // Clear texture if no background
            child.material = child.material.clone();
            child.material.map = null;
            child.material.color.set(0x333333);
            child.material.needsUpdate = true;
          }
        }
      });
      
      // Clear previous model and add new one
      while (modelRef.current.children.length > 0) {
        modelRef.current.remove(modelRef.current.children[0]);
      }
      groupRef.current = clonedModel;
      modelRef.current.add(clonedModel);
    }
  }, [scene, materials, candleData]);
  
  if (!scene) {
    return (
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="orange" />
      </mesh>
    );
  }
  
  return (
    <>
      {/* Lighting setup - matching CompactCandleModal */}
      <ambientLight intensity={1.2} />
      <directionalLight 
        position={[5, 10, 5]} 
        intensity={0.8} 
        castShadow 
        shadow-mapSize={[1024, 1024]}
      />
      <pointLight position={[0, 3, 2]} intensity={0.5} color="#ffaa00" />
      <pointLight position={[-3, 2, -2]} intensity={0.3} color="#ffffff" />
      
      {/* The model */}
      <group ref={modelRef}>
        {/* Display candle data if available */}
        {groupRef.current && candleData && plaqueVisible && showPlaque && (
          <Html
            position={[0, 1.1, -1.2]}
            center
            distanceFactor={16}
            transform
            occlude
            style={{
              borderRadius: '6px',
              padding: '8px 12px',
              minWidth: '120px',
              maxWidth: '180px',
              minHeight: '100px',
              textAlign: 'center',
              fontFamily: 'Georgia, serif',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-start',
              pointerEvents: 'none',
              userSelect: 'none',
              transform: 'scale(0.4)',
              zIndex: 10
            }}
          >
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: '100%'
            }}>
              {candleData.userAvatar && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  marginBottom: '4px'
                }}>
                  <img 
                    src={candleData.userAvatar} 
                    alt="User" 
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      border: '1px solid #eaea0b',
                      boxShadow: '0 0 4px rgba(234, 234, 11, 0.5)'
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}
              {candleData.username && (
                <div style={{
                  color: '#eaea0b',
                  fontSize: '8px',
                  fontWeight: 'bold',
                  marginBottom: candleData.message ? '4px' : '0',
                  textShadow: '0 1px 1px rgba(255, 255, 255, 0.3)'
                }}>
                  {candleData.username}
                </div>
              )}
              {candleData.message && (
                <div style={{
                  color: '#eaea0b',
                  fontSize: '6px',
                  fontStyle: 'italic',
                  lineHeight: '1.2',
                  flex: 1,
                  overflow: 'auto',
                  wordWrap: 'break-word',
                  maxWidth: '100%',
                  paddingTop: '2px'
                }}>
                  "{candleData.message}"
                </div>
              )}
              {candleData.burnedAmount && candleData.burnedAmount !== '0' && parseInt(candleData.burnedAmount) > 0 && (
                <div style={{
                  marginTop: '6px',
                  paddingTop: '4px',
                  borderTop: '1px solid rgba(234, 234, 11, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '3px'
                }}>
                  <span style={{
                    fontSize: '8px',
                    filter: 'drop-shadow(0 0 2px rgba(255, 100, 0, 0.8))'
                  }}>🔥</span>
                  <span style={{
                    color: '#ffb000',
                    fontSize: '7px',
                    fontWeight: 'bold',
                    textShadow: '0 0 3px rgba(255, 176, 0, 0.5)'
                  }}>
                    {parseInt(candleData.burnedAmount).toLocaleString()} RL80
                  </span>
                </div>
              )}
            </div>
          </Html>
        )}
      </group>
      
      {/* Camera controls */}
      <OrbitControls
        enableDamping
        dampingFactor={0.2}
        enablePan={false}
        enableZoom={true}
        minDistance={2}
        maxDistance={4}
        autoRotate={false}
        minPolarAngle={Math.PI / 3}    // 60 degrees - prevents looking too high
        maxPolarAngle={Math.PI / 2}  // ~82 degrees - prevents looking too low
        minAzimuthAngle={-Math.PI / 12}  // ~90 degrees - prevents looking too far left
        maxAzimuthAngle={Math.PI / 12}   // ~90 degrees - prevents looking too far right

      />
    </>
  );
}

// Main component for single candle display
export default function SingleCandleDisplay({ onOpenCompactModal }) {
  const [activeTab, setActiveTab] = useState('all'); // 'all' or 'my'
  const [allCandles, setAllCandles] = useState([]);
  const [myCandles, setMyCandles] = useState([]);
  const [currentAllCandleIndex, setCurrentAllCandleIndex] = useState(0);
  const [currentMyCandleIndex, setCurrentMyCandleIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMyCandles, setLoadingMyCandles] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);
  const [showParticles, setShowParticles] = useState(false);
  const [showPlaque, setShowPlaque] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [filterMode, setFilterMode] = useState('random'); // 'random', 'leaderboard', 'newest'
  const [filteredCandles, setFilteredCandles] = useState([]);
  const { user, isSignedIn } = useUser();
  
  // Helper function to estimate object size in bytes
  const getObjectSize = (obj) => {
    const jsonString = JSON.stringify(obj);
    return new Blob([jsonString]).size;
  };

  // Fetch all candles from Firebase
  useEffect(() => {
    const fetchAllCandles = async () => {
      try {
        setLoading(true);
        const candlesRef = collection(db, 'candles');
        
        // Fetch more for leaderboard to ensure we get high burners
        const limitCount = filterMode === 'leaderboard' ? 50 : 20;
        const q = query(candlesRef, orderBy('createdAt', 'desc'), limit(limitCount));
        const snapshot = await getDocs(q);
        
        const candlesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Log memory usage info
        if (candlesData.length > 0) {
          const totalSize = candlesData.reduce((sum, candle) => sum + getObjectSize(candle), 0);
          const avgSize = Math.round(totalSize / candlesData.length);
          console.log('Candles memory usage:', {
            totalRecords: candlesData.length,
            totalSize: `${(totalSize / 1024).toFixed(2)} KB`,
            averageSize: `${avgSize} bytes`,
            largestRecord: Math.max(...candlesData.map(c => getObjectSize(c))) + ' bytes'
          });
        }
        
        setAllCandles(candlesData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching all candles:', error);
        setLoading(false);
      }
    };
    
    fetchAllCandles();
  }, [filterMode]);
  
  // Fetch user's candles when signed in
  useEffect(() => {
    const fetchMyCandles = async () => {
      if (!isSignedIn || !user) return;
      
      // Debug: Log user info to see what's available
      console.log('Current user:', {
        username: user?.username,
        firstName: user?.firstName,
        lastName: user?.lastName,
        fullName: user?.fullName,
        email: user?.emailAddresses?.[0]?.emailAddress,
        id: user?.id
      });
      
      // Try username first, then fall back to firstName or fullName
      const userIdentifier = user?.username || user?.firstName || user?.fullName || 'Anonymous';
      
      try {
        setLoadingMyCandles(true);
        const candlesRef = collection(db, 'candles');
        
        // First try by createdBy (user ID) which is most reliable
        let q = query(
          candlesRef, 
          where('createdBy', '==', user.id),
          limit(20) // Reduced from 50 to 20
        );
        let snapshot = await getDocs(q);
        
        console.log(`Found ${snapshot.size} candles for user ID: ${user.id}`);
        
        // If no results, try by createdByUsername
        if (snapshot.size === 0) {
          q = query(
            candlesRef, 
            where('createdByUsername', '==', userIdentifier),
            limit(20) // Reduced from 50 to 20
          );
          snapshot = await getDocs(q);
          console.log(`Found ${snapshot.size} candles for username: ${userIdentifier}`);
        }
        
        const userCandlesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Log memory usage for user candles
        if (userCandlesData.length > 0) {
          const totalSize = userCandlesData.reduce((sum, candle) => sum + getObjectSize(candle), 0);
          console.log('User candles memory:', {
            records: userCandlesData.length,
            totalSize: `${(totalSize / 1024).toFixed(2)} KB`
          });
        }
        
        // Sort by createdAt client-side to avoid needing composite index
        const sortedUserCandles = userCandlesData.sort((a, b) => {
          const aTime = a.createdAt?.seconds || 0;
          const bTime = b.createdAt?.seconds || 0;
          return bTime - aTime; // Descending order (newest first)
        });
        
        // Take only the first 10 after sorting
        setMyCandles(sortedUserCandles.slice(0, 10));
        setLoadingMyCandles(false);
      } catch (error) {
        console.error('Error fetching user candles:', error);
        setLoadingMyCandles(false);
      }
    };
    
    if (activeTab === 'my') {
      fetchMyCandles();
    }
  }, [activeTab, isSignedIn, user]);
  
  // Apply filtering/sorting based on filterMode
  useEffect(() => {
    if (allCandles.length === 0) {
      setFilteredCandles([]);
      return;
    }
    
    let processed = [...allCandles];
    
    switch (filterMode) {
      case 'leaderboard':
        // Sort by burnedAmount descending (highest burners first)
        processed = processed
          .filter(c => c.burnedAmount && parseInt(c.burnedAmount) > 0)
          .sort((a, b) => {
            const burnA = parseInt(a.burnedAmount) || 0;
            const burnB = parseInt(b.burnedAmount) || 0;
            return burnB - burnA;
          })
          .slice(0, 20); // Take top 20 burners
        break;
        
      case 'newest':
        // Already sorted by createdAt desc from Firebase
        processed = processed.slice(0, 20);
        break;
        
      case 'random':
        // Shuffle array using Fisher-Yates algorithm
        for (let i = processed.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [processed[i], processed[j]] = [processed[j], processed[i]];
        }
        processed = processed.slice(0, 20);
        break;
    }
    
    setFilteredCandles(processed);
    setCurrentAllCandleIndex(0); // Reset to first candle when filter changes
  }, [allCandles, filterMode]);
  
  // Cycle through candles every 5 seconds with reveal effect (when not paused)
  useEffect(() => {
    if (activeTab === 'all' && filteredCandles.length > 0 && !isPaused) {
      const interval = setInterval(() => {
        // Hide plaque immediately when starting reveal
        setShowPlaque(false);
        // Trigger reveal animation
        setIsRevealing(true);
        setShowParticles(true);
        
        // After curtains close, change the candle
        setTimeout(() => {
          setCurrentAllCandleIndex((prev) => (prev + 1) % filteredCandles.length);
        }, 600);
        
        // Open curtains after candle changes
        setTimeout(() => {
          setIsRevealing(false);
        }, 800);
        
        // Show plaque after curtains are fully open (add extra delay)
        setTimeout(() => {
          setShowPlaque(true);
        }, 1200);
        
        // Hide particles after animation
        setTimeout(() => {
          setShowParticles(false);
        }, 1600);
      }, 5000); // 5 seconds
      
      return () => clearInterval(interval);
    } else if (activeTab === 'my' && myCandles.length > 1 && !isPaused) {
      const interval = setInterval(() => {
        // Hide plaque immediately when starting reveal
        setShowPlaque(false);
        // Trigger reveal animation
        setIsRevealing(true);
        setShowParticles(true);
        
        // After curtains close, change the candle
        setTimeout(() => {
          setCurrentMyCandleIndex((prev) => (prev + 1) % myCandles.length);
        }, 600);
        
        // Open curtains after candle changes
        setTimeout(() => {
          setIsRevealing(false);
        }, 800);
        
        // Show plaque after curtains are fully open (add extra delay)
        setTimeout(() => {
          setShowPlaque(true);
        }, 1200);
        
        // Hide particles after animation
        setTimeout(() => {
          setShowParticles(false);
        }, 1600);
      }, 5000); // 5 seconds
      
      return () => clearInterval(interval);
    }
  }, [activeTab, filteredCandles.length, myCandles.length, isPaused]);
  
  // Clean up old textures when switching candles (helps with memory)
  useEffect(() => {
    return () => {
      // This cleanup runs when component unmounts or candle changes
      if (window.THREE) {
        const cache = window.THREE.Cache;
        if (cache && cache.enabled) {
          cache.clear();
        }
      }
    };
  }, [currentAllCandleIndex, currentMyCandleIndex]);

  // Get current candle data based on active tab
  const currentCandle = activeTab === 'all' 
    ? filteredCandles[currentAllCandleIndex]
    : myCandles[currentMyCandleIndex];
  
  // Determine model path based on candle type
  const getModelPath = (candle) => {
    if (!candle) return '/models/tinyVotiveBox.glb';
    
    // Use box versions for better display with backgrounds
    if (candle.candleType === 'japanese') {
      return '/models/tinyJapCanBox.glb';
    }
    return '/models/tinyVotiveBox.glb'; // Default to votive box
  };
  
  const currentModelPath = currentCandle 
    ? getModelPath(currentCandle)
    : '/models/tinyVotiveBox.glb'; // Default placeholder
  
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      width: '25rem',
      height: '35rem',
      margin: 'auto',
      background: '#1a1a1a',
      borderRadius: '10px',
      overflow: 'hidden',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)'
    }}>
      {/* Tab buttons */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        background: '#0a0a0a',
        borderBottom: '1px solid #333'
      }}>
        <div style={{ display: 'flex' }}>
          <button
            onClick={() => setActiveTab('all')}
            style={{
              flex: 1,
              padding: '12px',
              background: activeTab === 'all' ? '#1a1a1a' : 'transparent',
              color: activeTab === 'all' ? '#00ff00' : '#666',
              border: 'none',
              borderBottom: activeTab === 'all' ? '2px solid #00ff00' : 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: activeTab === 'all' ? 'bold' : 'normal',
              transition: 'all 0.3s ease'
            }}
          >
            All Candles
          </button>
          <button
            onClick={() => setActiveTab('my')}
            style={{
              flex: 1,
              padding: '12px',
              background: activeTab === 'my' ? '#1a1a1a' : 'transparent',
              color: activeTab === 'my' ? '#00ff00' : '#666',
              border: 'none',
              borderBottom: activeTab === 'my' ? '2px solid #00ff00' : 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: activeTab === 'my' ? 'bold' : 'normal',
              transition: 'all 0.3s ease'
            }}
          >
            My Candle
          </button>
        </div>
        
        {/* Filter dropdown for All Candles tab */}
        {activeTab === 'all' && (
          <div style={{
            padding: '8px',
            background: '#1a1a1a',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ color: '#888', fontSize: '12px' }}>View:</span>
            <select
              value={filterMode}
              onChange={(e) => setFilterMode(e.target.value)}
              style={{
                background: '#2a2a2a',
                color: '#00ff00',
                border: '1px solid #444',
                borderRadius: '4px',
                padding: '4px 8px',
                fontSize: '12px',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="random">🎲 Random Mix</option>
              <option value="leaderboard">🔥 Top Burners</option>
              <option value="newest">✨ Newest</option>
            </select>
            {filterMode === 'leaderboard' && filteredCandles.length > 0 && (
              <span style={{ 
                color: '#ffb000', 
                fontSize: '11px',
                marginLeft: 'auto'
              }}>
                #1 burned {parseInt(filteredCandles[0]?.burnedAmount || 0).toLocaleString()} RL80
              </span>
            )}
            {filterMode !== 'leaderboard' && currentCandle && (
              <span style={{ 
                // color: '#888', 
                color: '#00ff00',
                fontSize: '14px',
                marginLeft: 'auto',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                {(() => {
                  const messageType = currentCandle?.messageType;
                  if (messageType) {
                    const displayType = messageType.charAt(0).toUpperCase() + messageType.slice(1);
                    return `Msg Protocol: ${displayType}`;
                  }
                  return 'TEMPLE CANDLES';
                })()}
              </span>
            )}
          </div>
        )}
      </div>
      
      {/* 3D viewer */}
      <div style={{ 
        flex: 1,
        position: 'relative',
        background: '#0f0f0f'
      }}>
        {(loading && activeTab === 'all') || (loadingMyCandles && activeTab === 'my') ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: '#666',
            fontSize: '14px'
          }}>
            Loading candles...
          </div>
        ) : activeTab === 'my' && !isSignedIn ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            gap: '20px'
          }}>
            <div style={{ color: '#666', fontSize: '14px' }}>
              Please sign in to view your candles
            </div>
          </div>
        ) : activeTab === 'my' && myCandles.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            gap: '20px'
          }}>
            <div style={{ color: '#666', fontSize: '14px' }}>
              You haven't created any candles yet
            </div>
          </div>
        ) : (
          <Canvas
            camera={{ position: [0, 0, 6], fov: 50 }}
            style={{ width: '100%', height: '100%' }}
            shadows
            gl={{
              antialias: true,
              alpha: false,
              preserveDrawingBuffer: true,
              powerPreference: "high-performance"
            }}
            onCreated={({ gl, scene }) => {
              gl.toneMapping = THREE.ACESFilmicToneMapping;
              gl.toneMappingExposure = 1.2;
              scene.background = new THREE.Color(0x0f0f0f);
              gl.shadowMap.enabled = true;
              gl.shadowMap.type = THREE.PCFSoftShadowMap;
            }}
          >
            <Suspense fallback={
              <mesh>
                <boxGeometry args={[1, 1, 1]} />
                <meshBasicMaterial color="gray" />
              </mesh>
            }>
              <ModelViewer 
                key={`${currentModelPath}-${activeTab}-${activeTab === 'all' ? currentAllCandleIndex : currentMyCandleIndex}`}
                modelPath={currentModelPath}
                candleData={currentCandle}
                showPlaque={showPlaque}
              />
            </Suspense>
          </Canvas>
        )}
        
        {/* Reveal Effect Curtains */}
        {!loading && !loadingMyCandles && (
          <>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '50%',
              height: '100%',
              background: 'linear-gradient(135deg, #dc143c 0%, #ff1744 100%)',
              transformOrigin: 'left center',
              transform: isRevealing ? 'translateX(0)' : 'translateX(-100%)',
              transition: 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
              zIndex: 20,
              boxShadow: isRevealing ? '10px 0 30px rgba(220, 20, 60, 0.5)' : 'none'
            }} />
            <div style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '50%',
              height: '100%',
              background: 'linear-gradient(135deg, #ff1744 0%, #dc143c 100%)',
              transformOrigin: 'right center',
              transform: isRevealing ? 'translateX(0)' : 'translateX(100%)',
              transition: 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
              zIndex: 20,
              boxShadow: isRevealing ? '-10px 0 30px rgba(220, 20, 60, 0.5)' : 'none'
            }} />
            
            {/* Particle Container */}
            {showParticles && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 25,
                overflow: 'hidden'
              }}>
                {[...Array(30)].map((_, i) => (
                  <div
                    key={i}
                    style={{
                      position: 'absolute',
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: `hsl(${15 + Math.random() * 30}, 100%, ${50 + Math.random() * 20}%)`,
                      left: '50%',
                      top: '50%',
                      animation: `particleExplosion ${1 + Math.random() * 0.5}s ease-out forwards`,
                      animationDelay: `${Math.random() * 0.2}s`,
                      '--x-offset': `${Math.random() * 400 - 200}px`,
                      '--y-offset': `${Math.random() * 400 - 200}px`
                    }}
                  />
                ))}
              </div>
            )}
            
            {/* Pause/Play Button */}
            {((activeTab === 'all' && filteredCandles.length > 1) || (activeTab === 'my' && myCandles.length > 1)) && (
              <button
                onClick={() => setIsPaused(!isPaused)}
                style={{
                  position: 'absolute',
                  bottom: '60px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  padding: '10px',
                  background: 'rgba(0, 0, 0, 0.7)',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '50%',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '18px',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                  zIndex: 15,
                  backdropFilter: 'blur(10px)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(0, 0, 0, 0.7)';
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                }}
                title={isPaused ? 'Resume auto-play' : 'Pause auto-play'}
              >
                {isPaused ? '▶' : '⏸'}
              </button>
            )}
            
            {/* Reveal Button (optional manual trigger) */}
            {/* {!isRevealing && ((activeTab === 'all' && allCandles.length > 1) || (activeTab === 'my' && myCandles.length > 1)) && (
              <button
                onClick={() => {
                  setShowPlaque(false);
                  setIsRevealing(true);
                  setShowParticles(true);
                  setTimeout(() => {
                    if (activeTab === 'all') {
                      setCurrentAllCandleIndex((prev) => (prev + 1) % filteredCandles.length);
                    } else {
                      setCurrentMyCandleIndex((prev) => (prev + 1) % myCandles.length);
                    }
                  }, 600);
                  setTimeout(() => setIsRevealing(false), 800);
                  setTimeout(() => setShowPlaque(true), 1500);
                  setTimeout(() => setShowParticles(false), 1600);
                }}
                style={{
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  padding: '8px 16px',
                  background: 'rgba(220, 20, 60, 0.8)',
                  border: '2px solid #fff',
                  borderRadius: '6px',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  transition: 'all 0.2s ease',
                  zIndex: 15
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#fff';
                  e.target.style.color = '#dc143c';
                  e.target.style.borderColor = '#dc143c';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(220, 20, 60, 0.8)';
                  e.target.style.color = '#fff';
                  e.target.style.borderColor = '#fff';
                }}
              >
                ✨ Reveal Next
              </button>
            )} */}
          </>
        )}
        
        {/* Progress indicator */}
        {((activeTab === 'all' && filteredCandles.length > 0) || (activeTab === 'my' && myCandles.length > 1)) && (
          <div style={{
            position: 'absolute',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '6px',
            padding: '8px',
            background: 'rgba(0, 0, 0, 0.7)',
            borderRadius: '20px',
            backdropFilter: 'blur(10px)'
          }}>
            {(activeTab === 'all' ? filteredCandles : myCandles).map((_, index) => (
              <div
                key={index}
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: index === (activeTab === 'all' ? currentAllCandleIndex : currentMyCandleIndex) ? '#00ff88' : 'rgba(255, 255, 255, 0.3)',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
                onClick={() => activeTab === 'all' ? setCurrentAllCandleIndex(index) : setCurrentMyCandleIndex(index)}
              />
            ))}
          </div>
        )}
        
        {/* Create Candle Button - Only show on "My Candle" tab */}
        {activeTab === 'my' && onOpenCompactModal && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenCompactModal();
            }}
            style={{
              position: 'absolute',
              bottom: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #00ff88 0%, #00dd66 100%)',
              border: '2px solid #00ff88',
              borderRadius: '8px',
              color: '#000',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 15px rgba(0, 255, 136, 0.4)',
              whiteSpace: 'nowrap',
              zIndex: 10
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateX(-50%) scale(1.05)';
              e.target.style.boxShadow = '0 6px 20px rgba(0, 255, 136, 0.6)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateX(-50%) scale(1)';
              e.target.style.boxShadow = '0 4px 15px rgba(0, 255, 136, 0.4)';
            }}
          >
            🕯️ Create Candle
          </button>
        )}
      </div>
    </div>
  );
}

// Inject particle animation styles
if (typeof document !== 'undefined' && !document.getElementById('particle-styles')) {
  const styleElement = document.createElement('style');
  styleElement.id = 'particle-styles';
  styleElement.textContent = `
    @keyframes particleExplosion {
      0% {
        transform: translate(-50%, -50%) scale(1);
        opacity: 1;
      }
      100% {
        transform: translate(
          calc(-50% + var(--x-offset)),
          calc(-50% + var(--y-offset))
        ) scale(0);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(styleElement);
}

// Preload the models
useGLTF.preload('/models/tinyVotiveBox2.glb');
useGLTF.preload('/models/tinyJapCanBox.glb');
