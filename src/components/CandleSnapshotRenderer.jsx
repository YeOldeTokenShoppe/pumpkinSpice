'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import PolaroidSnapshot from './PolaroidSnapshot';

// Skybox textures configuration
const SKYBOX_TEXTURES = {
  cyberpunk: '/cyberpunk.webp',
  synthwave: '/synthwave.webp',
  gothicTokyo: '/gothicTokyo.webp',
  neoTokyo: '/neoTokyo.webp',
  aurora: '/aurora.webp',
  templeScene: '/templeScene.webp'
};

// Preload models to prevent loading issues
if (typeof window !== 'undefined') {
  useGLTF.preload('/models/votiveComplete.glb');
  useGLTF.preload('/models/japaneseMediumComplete.glb');
  useGLTF.preload('/models/japaneseShortComplete.glb');
  useGLTF.preload('/models/japaneseTallComplete.glb');
  useGLTF.preload('/models/ecclesiasticalMediumComplete.glb');
  useGLTF.preload('/models/ecclesiasticalShortComplete.glb');
  useGLTF.preload('/models/ecclesiasticalTallComplete.glb');
}

// Helper function to determine which model to load
  function getCandleModelPath(candleType, candleHeight) {
    if (candleType === 'votive') {
      return "/models/votiveComplete.glb"; // Use complete model with room for proper background
    } else if (candleType === 'japanese') {
      const size = candleHeight || 'medium';
      return size === 'short' ? '/models/japaneseShortComplete.glb' :
             size === 'tall' ? '/models/japaneseTallComplete.glb' :
             '/models/japaneseMediumComplete.glb';
    } else if (candleType === 'ecclesiastical') {
      const size = candleHeight || 'medium';
      return size === 'short' ? '/models/ecclesiasticalShortComplete.glb' :
             size === 'tall' ? '/models/ecclesiasticalTallComplete.glb' :
             '/models/ecclesiasticalMediumComplete.glb';
    }
    return "/models/singleCandleAnimatedFlamePreview.glb"; // Default fallback
  }

// Candle scene component (similar to FloatingCandleViewer but optimized for snapshot)
function CandleScene({ userData, onReady }) {
  const modelPath = getCandleModelPath(userData?.candleType, userData?.candleHeight);
  // console.log('Loading candle model:', modelPath, 'for type:', userData?.candleType, 'height:', userData?.candleHeight);
  
  let scene, animations;
  try {
    const model = useGLTF(modelPath);
    scene = model.scene;
    animations = model.animations;
  } catch (error) {
    console.error('Error loading model:', error);
    // Fallback to votive if model fails to load
    const fallbackModel = useGLTF('/models/singleCandleAnimatedFlamePreview.glb');
    scene = fallbackModel.scene;
    animations = fallbackModel.animations;
  }
  const candleRef = useRef();
  const mixerRef = useRef(null);
  const spotlightRef = useRef();
  const flamePointLightRef = useRef();
  
  useEffect(() => {
    if (!scene) return;
    
    // Clone the scene to avoid conflicts
    const clonedScene = scene.clone();
    
    // Debug: Log all meshes in the scene
    // console.log('=== Debugging CandleSnapshotRenderer ===');
    // console.log('UserData:', userData);
    // console.log('All meshes in scene:');
    clonedScene.traverse((child) => {
      if (child.isMesh) {
        // console.log('- Mesh name:', child.name, 'visible:', child.visible);
      }
    });
    
    // Track if we need to load room texture
    let roomTextureNeeded = false;
    let roomMeshFound = false;
    
    // Apply skybox texture to Room mesh for ALL candle types
    if (userData?.background && SKYBOX_TEXTURES[userData.background]) {
      roomTextureNeeded = true;
      
      // Find Room mesh
      clonedScene.traverse((child) => {
        if (child.isMesh && child.name === 'Room') {
          roomMeshFound = true;
          // console.log('Found Room mesh! Loading background:', userData.background);
          
          // Make Room visible and set initial properties
          child.visible = true;
          child.renderOrder = -1000; // Render behind everything
          child.frustumCulled = false; // Prevent culling
        }
      });
      
      if (!roomMeshFound) {
        console.warn(`Room mesh not found in ${userData?.candleType} model! Using gradient fallback.`);
        // console.log('All meshes in scene:');
        clonedScene.traverse((child) => {
          if (child.isMesh) {
            // console.log('- Mesh:', child.name);
          }
        });
        
        // Create gradient background plane as fallback for models without Room mesh
        const planeGeometry = new THREE.PlaneGeometry(30, 30);
        const planeMaterial = new THREE.MeshBasicMaterial({
          color: userData?.background === 'cyberpunk' ? 0xff006e :
                 userData?.background === 'synthwave' ? 0xff71ce :
                 userData?.background === 'gothicTokyo' ? 0x4a0080 :
                 userData?.background === 'neoTokyo' ? 0x00d4ff :
                 userData?.background === 'aurora' ? 0x00ff66 :
                 userData?.background === 'templeScene' ? 0xff6b35 :
                 0xff71ce,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.5
        });
        const backgroundPlane = new THREE.Mesh(planeGeometry, planeMaterial);
        backgroundPlane.position.z = -8;
        backgroundPlane.renderOrder = -1000;
        
        if (candleRef.current) {
          candleRef.current.add(backgroundPlane);
        }
        
        // If no room mesh, just signal ready
        if (onReady) {
          setTimeout(onReady, 500);
        }
      } else {
        // Load the texture immediately
        const textureLoader = new THREE.TextureLoader();
        const texturePath = SKYBOX_TEXTURES[userData.background];
        // console.log('Loading texture from:', texturePath);
        
        textureLoader.load(
          texturePath,
          (texture) => {
            // console.log('Skybox texture loaded successfully');
            
            // Configure texture exactly like SingleCandleDisplay
            texture.wrapS = THREE.ClampToEdgeWrapping;
            texture.wrapT = THREE.ClampToEdgeWrapping;
            texture.flipY = false; // Don't flip vertically
            texture.needsUpdate = true;
            
            // Apply to Room mesh
            clonedScene.traverse((child) => {
              if (child.name === 'Room' && child.isMesh) {
                // console.log('Applying texture to Room mesh');
                // console.log('Original Room material:', child.material);
                
                // Create new material exactly matching SingleCandleDisplay
                const skyboxMaterial = new THREE.MeshBasicMaterial({
                  map: texture,
                  side: THREE.DoubleSide,
                  color: 0x808080, // Darken the texture (matches SingleCandleDisplay)
                  transparent: false,
                  opacity: 1,
                  depthWrite: false
                });
                
                // Replace material
                child.material = skyboxMaterial;
                child.visible = true;
                child.renderOrder = -1000;
                child.frustumCulled = false;
                
                // console.log('Room mesh updated:', {
                //   material: child.material,
                //   hasMap: !!child.material.map,
                //   mapImage: child.material.map?.image,
                //   visible: child.visible,
                //   renderOrder: child.renderOrder
                // });
              }
            });
            
            // Signal ready after room texture loads with time to render
            if (onReady) {
              setTimeout(onReady, 1500); // Allow time for texture to render
            }
          },
          undefined,
          (error) => {
            console.error('Failed to load skybox texture:', error);
            if (onReady) {
              setTimeout(onReady, 500);
            }
          }
        );
      }
    }
    
    // Reset any melted geometry to initial state
    clonedScene.traverse((child) => {
      if (child.isMesh) {
        // If this is a candle mesh that might be melted, try to reset it
        if (child.name.toLowerCase().includes('candle') || 
            child.name.toLowerCase().includes('wax') ||
            child.name.toLowerCase().includes('melt')) {
          // Reset any morphTargetInfluences that might control melting
          if (child.morphTargetInfluences) {
            child.morphTargetInfluences.forEach((_, index) => {
              child.morphTargetInfluences[index] = 0;
            });
          }
          // Reset scale in case melting uses scale
          child.scale.set(1, 1, 1);
        }
      }
    });
    
    // Apply user image to label if provided (votive candles only)
    if (userData?.imageUrl) {
      let labelFound = false;
      clonedScene.traverse((child) => {
        if (child.name.includes("Label2") && child.isMesh) {
          labelFound = true;
          // Create texture from user image
          const textureLoader = new THREE.TextureLoader();
          textureLoader.load(userData.imageUrl, (texture) => {
            texture.wrapS = THREE.ClampToEdgeWrapping;
            texture.wrapT = THREE.ClampToEdgeWrapping;
            texture.repeat.set(1, -1); // Flip vertically to fix upside-down issue
            texture.offset.set(0, 1);
            texture.colorSpace = THREE.SRGBColorSpace;
            
            child.material = new THREE.MeshStandardMaterial({
              map: texture,
              emissive: new THREE.Color(0xff6600),
              emissiveIntensity: 0.2, // Reduced to preserve texture colors
              roughness: 0.8,
              metalness: 0.1, // Less metallic for better color accuracy
              side: THREE.DoubleSide,
            });
            
            // For votive with room, wait for room texture to load first
            if (!roomTextureNeeded && onReady) {
              setTimeout(onReady, 1000);
            }
          });
        }
      });
      
      // If no label mesh found (Japanese/Ecclesiastical candles), signal ready immediately
      if (!labelFound && !roomTextureNeeded && onReady) {
        setTimeout(onReady, 500);
      }
    } else {
      // No image, scene is ready immediately (unless room texture is needed)
      if (!roomTextureNeeded && onReady) {
        setTimeout(onReady, 500);
      }
    }
    
    // Set up animation ONLY for votive candles
    // Japanese and Ecclesiastical candles should NOT animate at all in snapshot
    if (animations && animations.length > 0 && userData?.candleType === 'votive') {
      mixerRef.current = new THREE.AnimationMixer(clonedScene);
      animations.forEach((clip) => {
        const action = mixerRef.current.clipAction(clip);
        // Reset to beginning
        action.reset();
        action.time = 0;
        action.setEffectiveTimeScale(1);
        action.setEffectiveWeight(1);
        
        // Only play flame animations (very short clips under 2 seconds)
        if (clip.duration < 2) {
          action.play();
          action.setLoop(THREE.LoopRepeat);
        }
      });
    } else {
      // No animations for Japanese/Ecclesiastical candles
      mixerRef.current = null;
    }
    
    // Add to scene
    if (candleRef.current) {
      candleRef.current.add(clonedScene);
      
      // Position spotlight after candle is added
      if (spotlightRef.current && candleRef.current) {
        const box = new THREE.Box3().setFromObject(candleRef.current);
        const center = box.getCenter(new THREE.Vector3());
        
        spotlightRef.current.position.set(center.x, center.y + 3, center.z + 2);
        spotlightRef.current.target.position.set(
          center.x,
          center.y + 1.5,
          center.z
        );
        spotlightRef.current.target.updateMatrixWorld();
      }
    }
    
    return () => {
      if (mixerRef.current) {
        mixerRef.current.stopAllAction();
      }
    };
  }, [scene, animations, userData, onReady]);
  
  // Animation frame update - ONLY for light positioning, NOT animations
  useEffect(() => {
    let animationId;
    const animate = () => {
      if (candleRef.current && flamePointLightRef.current) {
        // Get the world position of the candle
        const box = new THREE.Box3().setFromObject(candleRef.current);
        const center = box.getCenter(new THREE.Vector3());
        
        // Position the light at the top of the candle
        flamePointLightRef.current.position.set(
          center.x,
          center.y + 1.8, // Adjust this value to position at flame height
          center.z
        );
      }
      
      // DON'T update animation mixer for Japanese/Ecclesiastical candles
      // Only update for votive candles with flame animations
      if (mixerRef.current && userData?.candleType === 'votive') {
        mixerRef.current.update(0.016); // Update with approximately 60fps timing
      }
      
      animationId = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [userData?.candleType]);
  
  return (
    <>
      {/* <ambientLight intensity={0.3} color="#ffffff" />   */}
      {/* <directionalLight 
        position={[5, 8, 5]} 
        intensity={0.8}  // Reduced from 1.2
        color="#ffffff"
        castShadow
      />
      <directionalLight 
        position={[-3, 5, 3]} 
        intensity={0.4}  // Reduced from 0.6
        color="#fff5ee" // Softer warm fill
      />
      <pointLight 
        position={[0, 2, 4]} 
        intensity={0.5}  // Reduced from 0.8
        color="#ffaa66" // Warm candle glow
      />
      <pointLight 
        position={[0, 0.5, 0]} 
        intensity={1.0}  // Reduced from 1.5
        color="#ff8833" // Orange glow at flame
        distance={3}
      />
      <spotLight
        position={[0, 10, 0]}
        angle={0.5}
        penumbra={0.5}
        intensity={0.2}  // Reduced from 0.3
        color="#ffffff" // Top down rim light
      /> */}
       <ambientLight intensity={2} />

        {/* Spotlight for general candle illumination */}
        <spotLight
          ref={spotlightRef}
          intensity={1.5}
          angle={0.4}
          penumbra={0.5}
          distance={5}
          castShadow={false}
          color="#ffedd0"
        />

        {/* Point light that will always follow the flame area */}
        <pointLight
          ref={flamePointLightRef}
          intensity={2.0}
          distance={3}
          color="#ff9c5e"
          decay={2}
        />
      <group ref={candleRef} scale={[1.8, 1.8, 1.8]} position={[0, -0.5, 0]} /> {/* Adjusted position to center candle */}
      <OrbitControls 
        enableZoom={false}
        enablePan={false}
        autoRotate={true}
        autoRotateSpeed={0.5}
        minPolarAngle={Math.PI / 3}
        maxPolarAngle={Math.PI / 2}
      />
    </>
  );
}

// Main component that combines candle renderer with polaroid snapshot
export default function CandleSnapshotRenderer({ 
  isVisible, 
  userData, 
  onComplete,
  onShare,
  preloadOnly = false,
  onReady,
  instantCapture = false
}) {
  const [triggerSnapshot, setTriggerSnapshot] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);
  const [showLoading, setShowLoading] = useState(!preloadOnly && !instantCapture);
  const canvasRef = useRef();
  
  // console.log('CandleSnapshotRenderer render:', { 
  //   isVisible, 
  //   userData, 
  //   instantCapture, 
  //   sceneReady, 
  //   triggerSnapshot,
  //   showLoading 
  // });
  
  // Trigger snapshot once scene is ready
  useEffect(() => {
    if (sceneReady && isVisible) {
      // If preloading, just notify ready
      if (preloadOnly && onReady) {
        onReady();
        return;
      }
      
      // If instant capture, trigger immediately
      if (instantCapture) {
        setShowLoading(false);
        setTriggerSnapshot(true);
        return;
      }
      
      // Normal flow with loading indicator
      const timer = setTimeout(() => {
        setShowLoading(false);
        setTriggerSnapshot(true);
      }, 1500); // Reduced from 3000ms
      
      return () => clearTimeout(timer);
    }
  }, [sceneReady, isVisible, preloadOnly, instantCapture, onReady]);
  
  const handleSceneReady = () => {
    setSceneReady(true);
  };
  
  const handleSnapshotComplete = (imageData) => {
    // Don't reset - keep the snapshot visible until user dismisses it
    // The PolaroidSnapshot component handles its own dismissal via click
    
    // Notify parent immediately (parent shouldn't auto-hide)
    if (onComplete) {
      onComplete(imageData);
    }
  };
  
  if (!isVisible) return null;
  
  return (
    <>
      {/* Loading indicator */}
      {showLoading && isVisible && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 99998,
          background: 'rgba(0, 0, 0, 0.8)',
          padding: '30px 40px',
          borderRadius: '15px',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '15px'
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '3px solid rgba(255, 255, 255, 0.1)',
            borderTop: '3px solid #ffa500',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <style jsx>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
          <div style={{
            color: 'white',
            fontSize: '18px',
            fontWeight: '500',
            textAlign: 'center'
          }}>
            <div>🕯️ Your candle has been lit! ✨</div>
            <div style={{ fontSize: '14px', marginTop: '8px', opacity: 0.9 }}>
              Creating your snapshot...
            </div>
          </div>
        </div>
      )}
      
      {/* Hidden canvas for rendering the candle */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '600px',
          height: '600px',
          opacity: 0.01, // Very slight opacity to ensure rendering
          pointerEvents: 'none',
          zIndex: 1, // Above page but below modal
        }}
      >
        <Canvas
          ref={canvasRef}
          id="candle-snapshot-canvas"
          camera={{ 
            // Adjust camera position and FOV based on candle type and height
            // Votive candles and tall candles need more space
            position: (userData?.candleHeight === 'tall' || userData?.candleType === 'votive') ? [0, 1.2, 8.5] : [0, 0.5, 7],
            fov: (userData?.candleHeight === 'tall' || userData?.candleType === 'votive') ? 42 : 35
          }}
          gl={{
            preserveDrawingBuffer: true,
            antialias: true,
            alpha: false,
            outputColorSpace: 'srgb', // Ensure correct color space
            toneMapping: THREE.ACESFilmicToneMapping, // Better color reproduction
            toneMappingExposure: 1.2, // Slightly brighter exposure
          }}
        >
          {/* All candles should show the user's selected background */}
          {/* Use black background to let the skybox/gradient show through */}
          <color attach="background" args={['#000000']} />
          
          <CandleScene 
            userData={userData} 
            onReady={handleSceneReady}
          />
        </Canvas>
      </div>
      
      {/* Polaroid snapshot component - only show when not preloading */}
      {!preloadOnly && (
        <PolaroidSnapshot 
          trigger={triggerSnapshot}
          onComplete={handleSnapshotComplete}
          captureElementId="candle-snapshot-canvas"
          label={`${userData?.username || 'Anonymous'}'s Candle`}
        />
      )}
    </>
  );
}