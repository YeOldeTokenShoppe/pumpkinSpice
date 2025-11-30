import React, { useRef, useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';


// Scene content that loads the candle model directly
function CandleScene({ firestoreData, onDoubleClick }) {
  const { scene, animations } = useGLTF("/models/ZMedCandleAnimatedFlame.glb");
  const candleRef = useRef();
  const mixerRef = useRef(null);
  const [hovered, setHovered] = useState(false);
  
  // Setup animations will be done after cloning the scene
  
  // Clone and setup the candle
  useEffect(() => {
    if (scene && candleRef.current) {
      const clonedCandle = scene.clone();
      
      // Setup animations for the cloned scene
      if (animations && animations.length > 0) {
        mixerRef.current = new THREE.AnimationMixer(clonedCandle);
        
        // Find and play the 'Animation' clip specifically
        animations.forEach(clip => {
          console.log('Found animation clip:', clip.name);
          const action = mixerRef.current.clipAction(clip);
          action.play();
        });
      }
      
      // Scale up for better visibility
      clonedCandle.scale.set(1, 1, 1);
      clonedCandle.position.set(0, 0, 0);
      
      // Apply any Firestore data if provided
      // TEMPORARILY DISABLED TO DEBUG SHADER ERROR
      if (false && firestoreData) {
        clonedCandle.userData = {
          ...clonedCandle.userData,
          ...firestoreData
        };
        
        // Apply user data to candle labels (matching MobileCandleOrbital)
        const username = firestoreData.username || firestoreData.userName || firestoreData.name || 'Anonymous Trader';
        const message = firestoreData.message || firestoreData.prayer || 'May the gains be with you 🚀';
        const imageUrl = firestoreData.image || firestoreData.profileImage || '/defaultAvatar.png';
        const performance = firestoreData.performance || firestoreData.burnedAmount || 0;
        
        // Create texture for Label1 (prayer/message)
        const createLabel1Texture = () => {
          const canvas = document.createElement('canvas');
          canvas.width = 1024;
          canvas.height = 1024;
          const ctx = canvas.getContext('2d');
          
          // Fill with parchment background
          ctx.fillStyle = '#F4E8D0';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // Add border
          ctx.strokeStyle = '#e0e0e0';
          ctx.lineWidth = 2;
          ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
          
          // Add heading
          ctx.fillStyle = "#000000";
          ctx.font = 'bold 42px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial';
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText('Prayer to Our Lady', canvas.width / 2, 80);
          ctx.fillText('of Perpetual Profit', canvas.width / 2, 130);
          
          // Add divider
          ctx.strokeStyle = '#333333';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(100, 165);
          ctx.lineTo(canvas.width - 100, 165);
          ctx.stroke();
          
          // Draw message
          ctx.fillStyle = "#000000";
          ctx.font = 'bold 48px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial';
          ctx.textAlign = "center";
          
          // Word wrap for message
          const words = message.split(' ');
          const maxWidth = 600;
          const lineHeight = 70;
          let lines = [];
          let currentLine = '';
          
          words.forEach((word) => {
            const testLine = currentLine + word + ' ';
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && currentLine) {
              lines.push(currentLine);
              currentLine = word + ' ';
            } else {
              currentLine = testLine;
            }
          });
          lines.push(currentLine);
          
          const startY = 200 + ((canvas.height - 200) - lines.length * lineHeight) / 2;
          lines.forEach((line, index) => {
            ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
            ctx.shadowBlur = 4;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
            ctx.fillText(line, canvas.width / 2, startY + index * lineHeight);
          });
          
          const texture = new THREE.CanvasTexture(canvas);
          texture.wrapS = THREE.ClampToEdgeWrapping;
          texture.wrapT = THREE.ClampToEdgeWrapping;
          // texture.repeat.set(1, 1);  // Try without flipping first
          // texture.offset.set(1, 1);
          texture.needsUpdate = true;
          
          return texture;
        };
        
        // Create texture for Label2 (user image + username)
        const createLabel2Texture = (img) => {
          const canvas = document.createElement('canvas');
          canvas.width = 512;
          canvas.height = 512;
          const ctx = canvas.getContext('2d');
          
          // Fill background
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // Draw image (leave space for username)
          const imageHeight = username ? canvas.height * 0.9 : canvas.height;
          ctx.drawImage(img, 0, 0, canvas.width, imageHeight);
          
          // Draw username if provided
          if (username && username.trim()) {
            // Create gradient background for text
            const gradient = ctx.createLinearGradient(0, imageHeight, 0, canvas.height);
            gradient.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0.9)');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, imageHeight, canvas.width, canvas.height - imageHeight);
            
            // Draw username
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 36px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
            ctx.shadowBlur = 4;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
            
            const textY = imageHeight + (canvas.height - imageHeight) / 2;
            ctx.fillText(username, canvas.width / 2, textY);
          }
          
          const texture = new THREE.CanvasTexture(canvas);
          texture.wrapS = THREE.RepeatWrapping;
          texture.wrapT = THREE.RepeatWrapping;
          texture.repeat.set(1, -1);  // Flip both horizontally and vertically
          texture.offset.set(1, 1);
          texture.needsUpdate = true;
          
          return texture;
        };
        
        // Apply Label1 texture (prayer/message)
        const label1Texture = createLabel1Texture();
        
        // Load user image and apply to Label2
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = () => {
          const label2Texture = createLabel2Texture(img);
          
          // Apply textures to specific labels
          clonedCandle.traverse((child) => {
            // Apply prayer texture to Label1 (flipped)
            if (child.name?.includes('Label1')) {
              if (child.material) {
                child.material = child.material.clone();
                child.material.map = label1Texture;
                child.material.needsUpdate = true;
              }
            }
            // Apply user image texture to Label2 (normal orientation)
            else if (child.name?.includes('Label2')) {
              if (child.material) {
                child.material = child.material.clone();
                child.material.map = label2Texture;
                child.material.needsUpdate = true;
              }
            }
          });
        };
        
        img.onerror = () => {
          // If image fails, use default avatar
          const defaultImg = new Image();
          defaultImg.onload = () => {
            const label2Texture = createLabel2Texture(defaultImg);
            
            // Apply textures
            clonedCandle.traverse((child) => {
              if (child.name?.includes('Label1')) {
                if (child.material) {
                  child.material = child.material.clone();
                  child.material.map = label1Texture;
                  child.material.needsUpdate = true;
                }
              } else if (child.name?.includes('Label2')) {
                if (child.material) {
                  child.material = child.material.clone();
                  child.material.map = label2Texture;
                  child.material.needsUpdate = true;
                }
              }
            });
          };
          defaultImg.src = '/defaultAvatar.png';
        };
        
        img.src = imageUrl;
        
        // Performance indicator removed to avoid shader errors
      }
      
      // Clear previous children and add new candle
      while (candleRef.current.children.length > 0) {
        candleRef.current.remove(candleRef.current.children[0]);
      }
      candleRef.current.add(clonedCandle);
    }
    
    // Cleanup on unmount or when dependencies change
    return () => {
      if (mixerRef.current) {
        mixerRef.current.stopAllAction();
        mixerRef.current = null;
      }
    };
  }, [scene, firestoreData, animations]);
  
  // Animation loop
  useFrame((state, delta) => {
    if (mixerRef.current) {
      mixerRef.current.update(delta);
    }
    
    if (candleRef.current) {
      // Gentle rotation
      // candleRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.3;
    }
  });
  
  return (
    <>
      {/* Lighting setup */}
      <ambientLight intensity={1} />
      {/* <directionalLight 
        position={[5, 8, 3]} 
        intensity={0.6} 
        castShadow 
        shadow-mapSize={[2048, 2048]}
      /> */}
      
      {/* Spotlight on candle */}
      {/* <spotLight
        position={[0, 5, 2]}
        intensity={0.8}
        angle={0.4}
        penumbra={0.6}
        color="#ffffff"
        castShadow
      /> */}
      
      {/* Flame point light */}
      {/* <pointLight 
        position={[0, 2, 0]}
        intensity={0.5}
        color="#ffaa44"
        distance={10}
        decay={2}
      /> */}
      
      {/* Green accent light for trading theme */}
      {/* <pointLight 
        position={[-3, 1, 3]}
        intensity={0.3}
        color="#00ff00"
        distance={8}
      /> */}
      
      {/* The candle model - clickable */}
      <group 
        ref={candleRef}
        onDoubleClick={onDoubleClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        style={{ cursor: hovered ? 'pointer' : 'auto' }}
      />
      
      {/* Visual feedback when hovered - removed as it was causing visual issues */}
      
      {/* Camera controls - with zoom and manual rotation enabled */}
      <OrbitControls
        dampingFactor={0.2}
        enablePan={true}
        enableZoom={true}
        minDistance={2}
        maxDistance={10}
      />
    </>
  );
}

// User Info Overlay Component
function UserInfoOverlay({ userData }) {
  const [imageError, setImageError] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  
  if (!userData) return null;
  
  const username = userData.username || userData.userName || userData.name || 'Anonymous Trader';
  const message = userData.message || userData.prayer || 'May the gains be with you 🚀';
  const imageUrl = userData.image || userData.profileImage || '/defaultAvatar.png';
  
  return (
    <div style={{
      position: 'absolute',
      bottom: '-1px', // Negative to ensure it reaches the edge
      left: '-1px',
      right: '-1px', 
      background: 'linear-gradient(90deg, rgba(0, 0, 0, 0.85) 0%, rgba(0, 20, 0, 0.8) 50%, rgba(0, 0, 0, 0.85) 100%)',
      borderTop: '1px solid rgba(0, 255, 0, 0.2)',
      padding: '10px 12px 11px 12px',
      backdropFilter: 'blur(8px)',
      boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.5)',
      zIndex: 10
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        {/* User Image - Larger */}
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          overflow: 'hidden',
          border: '2px solid rgba(0, 255, 0, 0.4)',
          flexShrink: 0,
          background: 'rgba(0, 255, 0, 0.1)',
          boxShadow: '0 0 12px rgba(0, 255, 0, 0.2)'
        }}>
          <img 
            src={imageError ? '/defaultAvatar.png' : imageUrl}
            alt={username}
            onError={() => setImageError(true)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
        </div>
        
        {/* User Info - Stacked Layout */}
        <div style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: '2px'
        }}>
          {/* Username with Flame Indicator */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <h4 style={{
              margin: 0,
              color: '#00ff00',
              fontSize: '13px',
              fontWeight: '600',
              letterSpacing: '0.5px',
              textShadow: '0 0 10px rgba(0, 255, 0, 0.5)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {username}
            </h4>
            
            {/* Small Flame Indicator without text */}
            <span style={{ 
              display: 'inline-block',
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, #ffff00, #ff8800)',
              boxShadow: '0 0 8px #ff8800',
              animation: 'flicker 2s infinite'
            }} />
          </div>
          
          {/* Prayer/Message - Expandable and with Tooltip */}
          <div style={{ position: 'relative' }}>
            <p 
              onClick={() => setIsExpanded(!isExpanded)}
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              style={{
                margin: 0,
                color: 'rgba(255, 255, 255, 0.75)',
                fontSize: '11px',
                lineHeight: '1.3',
                fontStyle: 'italic',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: isExpanded ? 'block' : '-webkit-box',
                WebkitLineClamp: isExpanded ? 'unset' : 2,
                WebkitBoxOrient: 'vertical',
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                userSelect: 'none'
              }}
            >
              "{message}"
            </p>
            
            {/* Tooltip for full message on hover */}
            {showTooltip && !isExpanded && message.length > 50 && (
              <div style={{
                position: 'absolute',
                bottom: '100%',
                left: '0',
                right: '0',
                marginBottom: '8px',
                padding: '8px 10px',
                background: 'rgba(0, 0, 0, 0.95)',
                border: '1px solid rgba(0, 255, 0, 0.3)',
                borderRadius: '6px',
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '11px',
                lineHeight: '1.4',
                fontStyle: 'italic',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.7)',
                zIndex: 100,
                pointerEvents: 'none',
                animation: 'fadeIn 0.2s ease',
                maxHeight: '120px',
                overflowY: 'auto',
                wordWrap: 'break-word'
              }}>
                "{message}"
              </div>
            )}
            
            {/* Click hint for long messages */}
            {message.length > 50 && (
              <span style={{
                fontSize: '9px',
                color: 'rgba(0, 255, 0, 0.4)',
                marginLeft: '4px',
                fontStyle: 'normal',
                cursor: 'pointer'
              }}>
                {isExpanded ? '(less)' : '(more)'}
              </span>
            )}
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes flicker {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}


// Camera animation component
function CameraAnimator({ entered, isFullscreen = false }) {
  const [hasReachedTarget, setHasReachedTarget] = useState(false);
  const [initialAnimationComplete, setInitialAnimationComplete] = useState(false);
  
  useFrame((state) => {
    // If initial animation is complete and we're not changing states, let OrbitControls handle it
    if (!isFullscreen && initialAnimationComplete && !entered) {
      return;
    }
    
    // Don't animate if we're in fullscreen and have reached target
    if (isFullscreen && hasReachedTarget) {
      return; // Let OrbitControls handle the camera
    }
    
    let targetPos, targetFov;
    
    if (isFullscreen) {
      // Fullscreen portal view - good viewing distance
      targetPos = { x: 0, y: 2, z: 8 };
      targetFov = 45;
    } else if (entered) {
      // Regular view - zoom into the candle
      targetPos = { x: 0, y: 0, z: 3 };
      targetFov = 35;
      setInitialAnimationComplete(false); // Reset so we can animate
    } else {
      // Regular view - default position
      targetPos = { x: 0, y: 0, z: 7 };
      targetFov = 45;
    }
    
    // Animate camera
    state.camera.position.lerp(targetPos, 0.1);
    state.camera.fov = THREE.MathUtils.lerp(state.camera.fov, targetFov, 0.1);
    state.camera.updateProjectionMatrix();
    
    // Check if we've reached the target
    const distance = state.camera.position.distanceTo(new THREE.Vector3(targetPos.x, targetPos.y, targetPos.z));
    if (distance < 0.1) {
      if (isFullscreen) {
        setHasReachedTarget(true);
      } else if (!entered) {
        setInitialAnimationComplete(true);
      }
    }
    
    // Reset flags when leaving fullscreen
    if (!isFullscreen) {
      setHasReachedTarget(false);
    }
  });
  
  return null;
}

// Main component for single candle display
export default function SingleCandleDisplay({ firestoreData }) {
  const [isCanvasReady, setIsCanvasReady] = useState(false);
  const [portalEntered, setPortalEntered] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef();
  
  useEffect(() => {
    // Small delay to ensure canvas mounts properly
    const timer = setTimeout(() => {
      setIsCanvasReady(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);
  
  // ESC key handler for fullscreen
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
        setPortalEntered(false);
      }
    };
    
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isFullscreen]);
  
  const handlePortalClick = () => {
    setPortalEntered(!portalEntered);
    
    // Toggle fullscreen
    if (!isFullscreen) {
      // Enter fullscreen
      setIsFullscreen(true);
    } else {
      // Exit fullscreen
      setIsFullscreen(false);
    }
    
    console.log('Portal', portalEntered ? 'exited' : 'entered');
  };

  return (
    <>
      {/* Fullscreen Portal Overlay - Rendered to document.body */}
      {isFullscreen && ReactDOM.createPortal(
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 999999,
          background: 'black',
          margin: 0,
          padding: 0,
          overflow: 'hidden'
        }}>
          <Canvas
            camera={{ position: [0, 2, 8], fov: 45 }}
            style={{ width: '100%', height: '100%' }}
            gl={{ 
              antialias: true,
              alpha: false,
              preserveDrawingBuffer: true,
              powerPreference: "high-performance",
              failIfMajorPerformanceCaveat: false
            }}
            onCreated={({ gl }) => {
              gl.toneMapping = THREE.ACESFilmicToneMapping;
              gl.toneMappingExposure = 1.2;
            }}
          >
            <CameraAnimator entered={false} isFullscreen={true} />
            <CandleScene 
              firestoreData={firestoreData} 
              onDoubleClick={() => {
                setIsFullscreen(false);
                setPortalEntered(false);
              }}
            />
          </Canvas>
          
          {/* Exit button */}
          <button
            onClick={() => {
              setIsFullscreen(false);
              setPortalEntered(false);
            }}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              padding: '10px 20px',
              background: 'rgba(0, 255, 0, 0.1)',
              border: '1px solid #00ff00',
              color: '#00ff00',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '14px',
              zIndex: 100000
            }}
          >
            Exit Portal (ESC)
          </button>
        </div>,
        document.body
      )}
      
      {/* Regular container view */}
      <div 
        ref={containerRef}
        style={{ 
          position: 'relative', 
          width: '100%', 
          height: '100%'
        }}>
      {isCanvasReady ? (
        <Canvas
          camera={{ position: [0, 0, 7], fov: 45 }}
          style={{ width: '100%', height: '100%' }}
          gl={{ 
            antialias: true,
            alpha: false,
            preserveDrawingBuffer: true,
            powerPreference: "high-performance",
            failIfMajorPerformanceCaveat: false
          }}
          onCreated={({ gl }) => {
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.toneMappingExposure = 1.2;
          }}
        >
          <CameraAnimator entered={portalEntered} />
          <CandleScene 
            firestoreData={firestoreData} 
            onDoubleClick={handlePortalClick}
          />
        </Canvas>
      ) : (
        <div style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#00ff00',
          fontSize: '12px'
        }}>
          Loading candle...
        </div>
      )}
      
      {/* User Info Overlay */}
      <UserInfoOverlay userData={firestoreData} />
      </div>
    </>
  );
}

// Preload the model
useGLTF.preload("/models/ZMedCandleAnimatedFlame.glb");