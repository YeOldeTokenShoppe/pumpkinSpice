import React, { useRef, useState, useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, Html } from '@react-three/drei';
import * as THREE from 'three';
import { collection, getDocs, query, orderBy, limit, where } from 'firebase/firestore';
import { db } from '../../../utilities/firebaseClient';
import { useUser } from '@clerk/nextjs';

// Model viewer component with candle data display and texture support
function ModelViewer({ modelPath, candleData = null }) {
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
      clonedModel.position.set(0, 0, 0);
      
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
          
          // Apply background texture to Box mesh
          const isBoxMesh = child.name === 'Box' || child.name === 'box';
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
        {groupRef.current && candleData && plaqueVisible && (
          <Html
            position={[0, 2.8, 0.7]}
            center
            distanceFactor={12}
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
              transform: 'scale(0.4)'
            }}
          >
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: '100%'
            }}>
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
        minDistance={3}
        maxDistance={10}
        autoRotate={false}
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
  const { user, isSignedIn } = useUser();
  
  // Fetch all candles from Firebase
  useEffect(() => {
    const fetchAllCandles = async () => {
      try {
        setLoading(true);
        const candlesRef = collection(db, 'candles');
        const q = query(candlesRef, orderBy('createdAt', 'desc'), limit(20));
        const snapshot = await getDocs(q);
        
        const candlesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setAllCandles(candlesData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching all candles:', error);
        setLoading(false);
      }
    };
    
    fetchAllCandles();
  }, []);
  
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
          limit(50)
        );
        let snapshot = await getDocs(q);
        
        console.log(`Found ${snapshot.size} candles for user ID: ${user.id}`);
        
        // If no results, try by createdByUsername
        if (snapshot.size === 0) {
          q = query(
            candlesRef, 
            where('createdByUsername', '==', userIdentifier),
            limit(50)
          );
          snapshot = await getDocs(q);
          console.log(`Found ${snapshot.size} candles for username: ${userIdentifier}`);
        }
        
        const userCandlesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Sort by createdAt client-side to avoid needing composite index
        const sortedUserCandles = userCandlesData.sort((a, b) => {
          const aTime = a.createdAt?.seconds || 0;
          const bTime = b.createdAt?.seconds || 0;
          return bTime - aTime; // Descending order (newest first)
        });
        
        // Take only the first 20 after sorting
        setMyCandles(sortedUserCandles.slice(0, 20));
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
  
  // Cycle through candles every 5 seconds
  useEffect(() => {
    if (activeTab === 'all' && allCandles.length > 0) {
      const interval = setInterval(() => {
        setCurrentAllCandleIndex((prev) => (prev + 1) % allCandles.length);
      }, 5000); // 5 seconds
      
      return () => clearInterval(interval);
    } else if (activeTab === 'my' && myCandles.length > 1) {
      const interval = setInterval(() => {
        setCurrentMyCandleIndex((prev) => (prev + 1) % myCandles.length);
      }, 5000); // 5 seconds
      
      return () => clearInterval(interval);
    }
  }, [activeTab, allCandles.length, myCandles.length]);
  
  // Get current candle data based on active tab
  const currentCandle = activeTab === 'all' 
    ? allCandles[currentAllCandleIndex]
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
      width: '30rem',
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
        background: '#0a0a0a',
        borderBottom: '1px solid #333'
      }}>
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
            camera={{ position: [0, 1, 5], fov: 45 }}
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
              />
            </Suspense>
          </Canvas>
        )}
        
        {/* Progress indicator */}
        {((activeTab === 'all' && allCandles.length > 0) || (activeTab === 'my' && myCandles.length > 1)) && (
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
            {(activeTab === 'all' ? allCandles : myCandles).map((_, index) => (
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

// Preload the models
useGLTF.preload('/models/tinyVotiveBox2.glb');
useGLTF.preload('/models/tinyJapCanBox.glb');
