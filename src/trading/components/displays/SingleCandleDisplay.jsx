import React, { useRef, useState, useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, Html } from '@react-three/drei';
import * as THREE from 'three';
import { collection, getDocs, query, orderBy, limit, where } from 'firebase/firestore';
import { db } from '../../../utilities/firebaseClient';
import { useUser } from '@clerk/nextjs';


// Helper function to decode HTML entities
function decodeHTMLEntities(text) {
  if (!text) return text;
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
}

// Model viewer component with candle data display and texture support
function ModelViewer({ modelPath, candleData = null, showPlaque = true, isFlipped = false, isRevealing = false }) {
  const gltf = useGLTF(modelPath);
  const { scene, materials, animations } = gltf;
  const modelRef = useRef();
  const groupRef = useRef();
  const [plaqueVisible, setPlaqueVisible] = useState(true);
  const textureLoader = new THREE.TextureLoader();
  const boxMeshRef = useRef(null);
  
  // Clone and setup the model with textures
  React.useEffect(() => {
    if (scene && modelRef.current) {
      const clonedModel = scene.clone();
      
      // Scale and position the model - adjust for mobile
      const isMobile = window.innerWidth <= 768;
      clonedModel.scale.set(1, 1, 1);
      clonedModel.position.set(0, isMobile ? -1.4 : -1, isMobile ? -3 : -5);
      
      // Process meshes and apply textures
      clonedModel.traverse((child) => {
        // Debug logging for rigged characters
        if (child.name && (child.name.includes('Robot') || child.name.includes('Macro') || child.name.includes('RL80') || child.name.includes('Empty'))) {
          console.log('Found character-related object:', {
            name: child.name,
            type: child.type,
            isSkinnedMesh: child.isSkinnedMesh,
            isMesh: child.isMesh,
            isObject3D: child.isObject3D,
            isBone: child.isBone,
            hasChildren: child.children?.length > 0,
            children: child.children?.map(c => ({ name: c.name, type: c.type }))
          });
          
          if (child.isSkinnedMesh) {
            console.log('SkinnedMesh details:', {
              name: child.name,
              hasSkeleton: !!child.skeleton,
              boneCount: child.skeleton?.bones?.length,
              hasBindMatrix: !!child.bindMatrix,
              hasBindMatrixInverse: !!child.bindMatrixInverse
            });
          }
        }
        
        // Handle SkinnedMesh (rigged characters like RL80 and Macro)
        if (child.isSkinnedMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          console.log(`Processing SkinnedMesh: ${child.name}`);
          // Force skeleton update to avoid t-pose
          if (child.skeleton) {
            child.skeleton.calculateInverses();
            child.skeleton.computeBoneTexture();
            child.skeleton.update();
          }
        } else if (child.isMesh) {
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
                  texture.flipY = true;
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
            
            // Check for gradient backgrounds
            const GRADIENT_BACKGROUNDS = {
              'gradient-aurora-dynamic': 'aurora',
              'gradient-lava-flow': 'lava',
              'gradient-sunset-dynamic': 'sunset',
              'gradient-ethereal-dynamic': 'ethereal'
            };
            
            const texturePath = BACKGROUND_TEXTURES[candleData.background];
            const gradientType = GRADIENT_BACKGROUNDS[candleData.background];
            
            if (gradientType) {
              // Create animated gradient texture for skybox
              console.log(`Creating animated gradient skybox: ${gradientType}`);
              // For skybox, we need a cross-shaped texture or we can use equirectangular
              const canvas = document.createElement('canvas');
              canvas.width = 2048; // Wider for equirectangular projection
              canvas.height = 1024;
              const ctx = canvas.getContext('2d');
              
              let animationFrame = null;
              let time = 0;
              
              const animate = () => {
                if (gradientType === 'aurora') {
                  // Aurora animation - create seamless horizontal wrap
                  time += 0.002;
                  ctx.fillStyle = 'rgba(0, 5, 20, 1)';
                  ctx.fillRect(0, 0, canvas.width, canvas.height);
                  
                  // Create seamless aurora bands that wrap horizontally
                  for (let band = 0; band < 4; band++) {
                    const offset = band * Math.PI * 0.5;
                    
                    // Draw across the full width for seamless wrapping
                    for (let x = 0; x < 3; x++) {
                      const baseX = (canvas.width / 3) * x + canvas.width / 6;
                      const posX = Math.sin(time * 0.3 + offset + x) * 200;
                      const posY = Math.cos(time * 0.2 + offset) * 100;
                      
                      const grad = ctx.createRadialGradient(
                        baseX + posX, canvas.height/2 + posY, 
                        100 + Math.sin(time + offset) * 50,
                        baseX + posX, canvas.height/2 + posY, 
                        400
                      );
                      
                      if (band % 2 === 0) {
                        grad.addColorStop(0, 'rgba(150, 0, 255, 0.6)');
                        grad.addColorStop(0.5, 'rgba(100, 0, 150, 0.4)');
                        grad.addColorStop(1, 'rgba(30, 0, 60, 0)');
                      } else {
                        grad.addColorStop(0, 'rgba(0, 255, 100, 0.6)');
                        grad.addColorStop(0.5, 'rgba(0, 150, 80, 0.4)');
                        grad.addColorStop(1, 'rgba(0, 30, 50, 0)');
                      }
                      
                      ctx.globalCompositeOperation = band === 0 ? 'source-over' : 'screen';
                      ctx.fillStyle = grad;
                      ctx.fillRect(0, 0, canvas.width, canvas.height);
                    }
                  }
                  
                } else if (gradientType === 'lava') {
                  // Lava animation - seamless wrap
                  time += 0.02;
                  ctx.fillStyle = 'rgba(80, 20, 0, 1)';
                  ctx.fillRect(0, 0, canvas.width, canvas.height);
                  
                  // Create lava pools that wrap seamlessly
                  for (let row = 0; row < 2; row++) {
                    for (let col = 0; col < 8; col++) {
                      const x = (canvas.width / 8) * col + (canvas.width / 16) + Math.sin(time + col) * 50;
                      const y = canvas.height/2 + (row - 0.5) * 200 + Math.cos(time * 0.5 + col) * 50;
                      const grad = ctx.createRadialGradient(x, y, 20, x, y, 150);
                      grad.addColorStop(0, `rgba(255, ${200 + Math.sin(time + col) * 50}, 0, 1)`);
                      grad.addColorStop(0.5, `rgba(255, ${100 + Math.sin(time + col) * 50}, 0, 0.8)`);
                      grad.addColorStop(1, 'rgba(200, 50, 0, 0.3)');
                      ctx.fillStyle = grad;
                      ctx.fillRect(0, 0, canvas.width, canvas.height);
                    }
                  }
                  
                } else if (gradientType === 'sunset') {
                  // Sunset animation - seamless horizon
                  time += 0.003;
                  
                  // Create gradient that works well on all sides
                  const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
                  skyGrad.addColorStop(0, 'rgba(25, 25, 112, 1)'); // Dark blue at top
                  skyGrad.addColorStop(0.2, 'rgba(75, 0, 130, 1)'); // Purple
                  skyGrad.addColorStop(0.4, 'rgba(255, 94, 77, 1)'); // Coral
                  skyGrad.addColorStop(0.6, 'rgba(255, 140, 0, 1)'); // Orange
                  skyGrad.addColorStop(0.8, 'rgba(255, 69, 0, 1)'); // Red-orange
                  skyGrad.addColorStop(1, 'rgba(120, 30, 0, 1)'); // Dark red at bottom
                  ctx.fillStyle = skyGrad;
                  ctx.fillRect(0, 0, canvas.width, canvas.height);
                  
                  // Add sun that appears to move across horizon
                  const sunX = canvas.width/2 + Math.sin(time * 0.3) * canvas.width/3;
                  const sunY = canvas.height * 0.6 + Math.sin(time * 0.5) * 30;
                  const sunGrad = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 150);
                  sunGrad.addColorStop(0, 'rgba(255, 255, 200, 0.9)');
                  sunGrad.addColorStop(0.3, 'rgba(255, 200, 0, 0.7)');
                  sunGrad.addColorStop(1, 'rgba(255, 50, 0, 0)');
                  ctx.globalCompositeOperation = 'screen';
                  ctx.fillStyle = sunGrad;
                  ctx.fillRect(0, 0, canvas.width, canvas.height);
                  
                } else if (gradientType === 'ethereal') {
                  // Ethereal animation - seamless mist
                  time += 0.004;
                  ctx.fillStyle = 'rgba(10, 0, 30, 1)';
                  ctx.fillRect(0, 0, canvas.width, canvas.height);
                  
                  // Create mist that wraps seamlessly horizontally
                  for (let layer = 0; layer < 3; layer++) {
                    const offset = layer * Math.PI * 0.7;
                    
                    // Draw mist patches across the width
                    for (let i = 0; i < 6; i++) {
                      const mistX = (canvas.width / 6) * i + (canvas.width / 12) + Math.sin(time * 0.3 + offset + i) * 100;
                      const mistY = canvas.height/2 + Math.cos(time * 0.2 + offset + i * 0.5) * 150;
                      const mistGrad = ctx.createRadialGradient(
                        mistX, mistY, 
                        50 + Math.sin(time + offset) * 20,
                        mistX, mistY, 
                        200 + Math.cos(time + offset) * 50
                      );
                      
                      if (layer % 2 === 0) {
                        mistGrad.addColorStop(0, 'rgba(150, 200, 255, 0.4)');
                        mistGrad.addColorStop(0.5, 'rgba(100, 150, 255, 0.2)');
                        mistGrad.addColorStop(1, 'rgba(50, 100, 200, 0)');
                      } else {
                        mistGrad.addColorStop(0, 'rgba(255, 150, 255, 0.4)');
                        mistGrad.addColorStop(0.5, 'rgba(200, 100, 255, 0.2)');
                        mistGrad.addColorStop(1, 'rgba(150, 50, 200, 0)');
                      }
                      
                      ctx.globalCompositeOperation = layer === 0 ? 'source-over' : 'screen';
                      ctx.fillStyle = mistGrad;
                      ctx.fillRect(0, 0, canvas.width, canvas.height);
                    }
                  }
                }
                
                ctx.globalCompositeOperation = 'source-over';
                
                // Update texture
                if (boxMeshRef.current && boxMeshRef.current.material && boxMeshRef.current.material.map) {
                  boxMeshRef.current.material.map.needsUpdate = true;
                }
                
                animationFrame = requestAnimationFrame(animate);
              };
              
              // Create texture from canvas
              const texture = new THREE.CanvasTexture(canvas);
              texture.wrapS = THREE.RepeatWrapping; // Enable horizontal wrapping
              texture.wrapT = THREE.ClampToEdgeWrapping; // Clamp vertical
              texture.needsUpdate = true;
              
              child.material = child.material.clone();
              child.material.map = texture;
              child.material.color.set(0xffffff);
              child.material.emissive = new THREE.Color(0x000000);
              child.material.emissiveIntensity = 0;
              child.material.needsUpdate = true;
              
              // Start animation
              animate();
              
              // Store cleanup function
              if (window.gradientAnimationFrame) {
                cancelAnimationFrame(window.gradientAnimationFrame);
              }
              window.gradientAnimationFrame = animationFrame;
              
            } else if (texturePath) {
              console.log(`Loading background texture: ${texturePath} for background: ${candleData.background}`);
              textureLoader.load(
                texturePath,
                (texture) => {
                  texture.colorSpace = THREE.SRGBColorSpace;
                  texture.flipY = false; // Match the setting from CompactCandleModal
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
      
      // Log if animations exist (shouldn't for candle-only models)
      if (animations && animations.length > 0) {
        console.log(`Warning: Candle model has animations? ${animations.length} animations:`, animations.map(a => a.name));
      }
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
      
      {/* The model - hide when flipped */}
      <group ref={modelRef} visible={!isFlipped}>
        {/* Display candle data if available */}
        {groupRef.current && candleData && plaqueVisible && showPlaque && !isFlipped && (
          <Html
            position={window.innerWidth <= 768 ? [0, 1.3, -1.9] : [0, 1.1, -2.8]}
            center
            distanceFactor={window.innerWidth <= 768 ? 5 : 6}
            transform
            occlude
            style={{
              borderRadius: '6px',
              padding: window.innerWidth <= 768 ? '8px 12px' : '4px 8px',
              minWidth: window.innerWidth <= 768 ? '120px' : '80px',
              maxWidth: window.innerWidth <= 768 ? '180px' : '120px',
              minHeight: window.innerWidth <= 768 ? '100px' : '60px',
              textAlign: 'center',
              fontFamily: 'Georgia, serif',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-start',
              pointerEvents: 'none',
              userSelect: 'none',
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
                      width: window.innerWidth <= 768 ? '1.5rem' : '15px',
                      height: window.innerWidth <= 768 ? '1.5rem' : '15px',
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
                  fontSize: window.innerWidth <= 768 ? '14px' : '7px',
                  fontWeight: 'bold',
                  marginBottom: candleData.message && window.innerWidth > 768 ? '2px' : '0',
                  textShadow: '0 1px 1px rgba(255, 255, 255, 0.3)'
                }}>
                  {candleData.username}
                </div>
              )}
              {/* Only show message on desktop, not mobile */}
              {candleData.message && window.innerWidth > 768 && (
                <div style={{
                  color: '#eaea0b',
                  fontSize: candleData.message.length > 50 ? 7 : 6,
                  fontStyle: 'italic',
                  lineHeight: '1.1',
                  flex: 1,
                  overflow: 'auto',
                  wordWrap: 'break-word',
                  maxWidth: '100%',
                  paddingTop: '2px'
                }}>
                  "{decodeHTMLEntities(candleData.message)}"
                </div>
              )}
              {candleData.burnedAmount && candleData.burnedAmount !== '0' && parseInt(candleData.burnedAmount) > 0 && (
                <div style={{
                  marginTop: window.innerWidth <= 768 ? '8px' : '3px',
                  paddingTop: window.innerWidth <= 768 ? '4px' : '2px',
                  borderTop: '1px solid rgba(234, 234, 11, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: window.innerWidth <= 768 ? '4px' : '2px'
                }}>
                  <span style={{
                    fontSize: window.innerWidth <= 768 ? '10px' : '6px',
                    filter: 'drop-shadow(0 0 2px rgba(255, 100, 0, 0.8))'
                  }}>🔥</span>
                  <span style={{
                    color: '#ffb000',
                    fontSize: window.innerWidth <= 768 ? '9px' : '6px',
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
      
      {/* Show larger text display when flipped - hide during transitions */}
      {isFlipped && candleData && !isRevealing && showPlaque && (
        <Html
          position={[0, 0.6, 0]}
          center
          distanceFactor={window.innerWidth <= 768 ? 5 : 4}
          style={{
            width: window.innerWidth <= 768 ? '300px' : '200px',
            padding: window.innerWidth <= 768 ? '20px' : '15px',
            // background: 'rgba(0, 0, 0, 0.9)',
            // border: '2px solid #ffd700',
            borderRadius: '10px',
            color: '#ffd700',
            textAlign: 'center',
            fontFamily: 'Georgia, serif'
          }}
        >
          {candleData.userAvatar && (
            <img 
              src={candleData.userAvatar} 
              alt="User" 
              style={{
                width: window.innerWidth <= 768 ? '60px' : '40px',
                height: window.innerWidth <= 768 ? '60px' : '40px',
                borderRadius: '50%',
                border: '2px solid #ffd700',
                marginBottom: window.innerWidth <= 768 ? '15px' : '10px'
              }}
            />
          )}
          {candleData.username && (
            <h2 style={{
              fontSize: window.innerWidth <= 768 ? '24px' : '14px',
              marginBottom: window.innerWidth <= 768 ? '10px' : '6px',
              color: '#ffd700'
            }}>
              {candleData.username}
            </h2>
          )}
          {candleData.message && (
            <p style={{
              fontSize: window.innerWidth <= 768 ? '16px' : '9px',
              lineHeight: '1.4',
              fontStyle: 'italic',
              color: '#ffd700',
              marginBottom: window.innerWidth <= 768 ? '15px' : '8px'
            }}>
              "{decodeHTMLEntities(candleData.message)}"
            </p>
          )}
          {candleData.messageType && (
            <div style={{
              fontSize: window.innerWidth <= 768 ? '14px' : '6px',
              color: '#00ff00',
              marginBottom: window.innerWidth <= 768 ? '10px' : '6px'
            }}>
              {candleData.messageType.charAt(0).toUpperCase() + candleData.messageType.slice(1)}
            </div>
          )}
          {candleData.burnedAmount && parseInt(candleData.burnedAmount) > 0 && (
            <div style={{
              fontSize: window.innerWidth <= 768 ? '18px' : '11px',
              color: '#ff6600',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: window.innerWidth <= 768 ? '5px' : '3px'
            }}>
              🔥 {parseInt(candleData.burnedAmount).toLocaleString()} RL80
            </div>
          )}
        </Html>
      )}
      
      {/* Camera controls - disabled on mobile */}
      {window.innerWidth > 768 && (
        <OrbitControls
          enableDamping
          dampingFactor={0.2}
          enablePan={false}
          enableZoom={true}
          minDistance={2}
          maxDistance={4}
          target={[0, 0.4, -2]}
          autoRotate={false}
          minPolarAngle={Math.PI / 3}    // 60 degrees - prevents looking too high
          maxPolarAngle={Math.PI / 2}  // ~82 degrees - prevents looking too low
          minAzimuthAngle={-Math.PI / 12}  // ~90 degrees - prevents looking too far left
          maxAzimuthAngle={Math.PI / 12}   // ~90 degrees - prevents looking too far right
        />
      )}
    </>
  );
}

// Main component for single candle display
export default function SingleCandleDisplay({ onOpenCompactModal, onClose }) {
  const [activeTab, setActiveTab] = useState('all'); // 'all' or 'my'
  const [allCandles, setAllCandles] = useState([]);
  const [myCandles, setMyCandles] = useState([]);
  const [currentAllCandleIndex, setCurrentAllCandleIndex] = useState(0);
  const [currentMyCandleIndex, setCurrentMyCandleIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMyCandles, setLoadingMyCandles] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);
  const [showParticles, setShowParticles] = useState(false);
  const [particleCandleType, setParticleCandleType] = useState(null);
  const [showPlaque, setShowPlaque] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [filterMode, setFilterMode] = useState('random'); // 'random', 'leaderboard', 'newest'
  const [filteredCandles, setFilteredCandles] = useState([]);
  const [isMobile, setIsMobile] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const { user, isSignedIn } = useUser();
  
  // Handle responsive behavior
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
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
        // Capture the current candle type before transition
        const currentType = filteredCandles[currentAllCandleIndex]?.candleType;
        console.log('Transition starting - Current candle type:', currentType, 'Index:', currentAllCandleIndex);
        
        // Hide plaque immediately when starting reveal
        setShowPlaque(false);
        // Trigger reveal animation
        setIsRevealing(true);
        
        // Show particles earlier in the transition (but not when flipped)
        setTimeout(() => {
          if (!isFlipped) {
            console.log('Setting particle type to:', currentType);
            setParticleCandleType(currentType);
            setShowParticles(true);
          }
        }, 150);  // Reduced from 400ms to 150ms
        
        // After curtains close, change the candle
        setTimeout(() => {
          setCurrentAllCandleIndex((prev) => (prev + 1) % filteredCandles.length);
        }, 600);
        
        // Hide particles after showing
        setTimeout(() => {
          setShowParticles(false);
          setParticleCandleType(null);
        }, 650);  // Adjusted to 650ms (500ms duration from 150ms start)
        
        // Open curtains after candle changes
        setTimeout(() => {
          setIsRevealing(false);
        }, 800);
        
        // Show plaque after curtains are fully open (add extra delay)
        setTimeout(() => {
          setShowPlaque(true);
        }, 1200);
      }, 5000); // 5 seconds
      
      return () => clearInterval(interval);
    } else if (activeTab === 'my' && myCandles.length > 1 && !isPaused) {
      const interval = setInterval(() => {
        // Capture the current candle type before transition
        const currentType = myCandles[currentMyCandleIndex]?.candleType;
        console.log('My tab transition - Current candle type:', currentType, 'Index:', currentMyCandleIndex);
        
        // Hide plaque immediately when starting reveal
        setShowPlaque(false);
        // Trigger reveal animation
        setIsRevealing(true);
        
        // Show particles earlier in the transition (but not when flipped)
        setTimeout(() => {
          if (!isFlipped) {
            console.log('Setting particle type to:', currentType);
            setParticleCandleType(currentType);
            setShowParticles(true);
          }
        }, 150);  // Reduced from 400ms to 150ms
        
        // After curtains close, change the candle
        setTimeout(() => {
          setCurrentMyCandleIndex((prev) => (prev + 1) % myCandles.length);
        }, 600);
        
        // Hide particles after showing
        setTimeout(() => {
          setShowParticles(false);
          setParticleCandleType(null);
        }, 650);  // Adjusted to 650ms (500ms duration from 150ms start)
        
        // Open curtains after candle changes
        setTimeout(() => {
          setIsRevealing(false);
        }, 800);
        
        // Show plaque after curtains are fully open (add extra delay)
        setTimeout(() => {
          setShowPlaque(true);
        }, 1200);
      }, 5000); // 5 seconds
      
      return () => clearInterval(interval);
    }
  }, [activeTab, filteredCandles, myCandles, isPaused, currentAllCandleIndex, currentMyCandleIndex, isFlipped]);
  
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
      width: isMobile ? '100%' : '25rem',
      height: isMobile ? '100vh' : '35rem',
      maxWidth: isMobile ? '100%' : '25rem',
      maxHeight: isMobile ? '100vh' : '35rem',
      margin: isMobile ? 0 : 'auto',
      background: '#1a1a1a',
      borderRadius: isMobile ? '0' : '10px',
      overflow: 'hidden',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
      position: isMobile ? 'fixed' : 'relative',
      top: isMobile ? 0 : 'auto',
      left: isMobile ? 0 : 'auto',
      right: isMobile ? 0 : 'auto',
      bottom: isMobile ? 0 : 'auto',
      zIndex: isMobile ? 99999 : 'auto',
      paddingTop: isMobile ? 'env(safe-area-inset-top)' : 0,
      paddingBottom: isMobile ? 'env(safe-area-inset-bottom)' : 0
    }}>
      {/* Tab buttons */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        background: '#0a0a0a',
        borderBottom: '1px solid #333',
        position: 'relative'
      }}>
        {/* Close button for mobile */}
        {isMobile && onClose && (
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              color: '#fff',
              fontSize: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 100000,
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255, 0, 0, 0.3)';
              e.target.style.borderColor = 'rgba(255, 0, 0, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.1)';
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
            }}
          >
            ✕
          </button>
        )}
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
                color: '#888',
                fontSize: '14px',
                marginLeft: 'auto',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                {(() => {
                  const messageType = currentCandle?.messageType;
                  if (messageType) {
                    const displayType = messageType.charAt(0).toUpperCase() + messageType.slice(1);
                    return (
                      <>
                        Msg Protocol: <span style={{ color: '#00ff00' }}>{displayType}</span>
                      </>
                    );
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
            camera={{ 
              position: isFlipped ? [0, 0, -6] : (isMobile ? [0, -0.3, 6] : [0, -0.5, 6]), 
              fov: isMobile ? 40 : 40 
            }}
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
              scene.background = new THREE.Color(isFlipped ? 0x000000 : 0x0f0f0f);
              gl.shadowMap.enabled = true;
              gl.shadowMap.type = THREE.PCFSoftShadowMap;
            }}
          >
            <Suspense fallback={
              isRevealing ? null : (
                <mesh>
                  <boxGeometry args={[1, 1, 1]} />
                  <meshBasicMaterial color="gray" />
                </mesh>
              )
            }>
              <ModelViewer 
                key={currentModelPath}
                modelPath={currentModelPath}
                candleData={currentCandle}
                showPlaque={showPlaque}
                isFlipped={isFlipped}
                isRevealing={isRevealing}
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
                {/* Japanese candle: 4 flame points */}
                {particleCandleType === 'japanese' ? (
                  // 4 flame sources at different positions
                  <>
                    {/* Top-left flame */}
                    {[...Array(8)].map((_, i) => (
                      <div
                        key={`tl-${i}`}
                        style={{
                          position: 'absolute',
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: `hsl(${15 + Math.random() * 30}, 100%, ${50 + Math.random() * 20}%)`,
                          left: '45%',
                          top: '45%',
                          animation: `particleExplosion ${0.8 + Math.random() * 0.4}s ease-out forwards`,
                          animationDelay: `${Math.random() * 0.15}s`,
                          '--x-offset': `${Math.random() * 150 - 75}px`,
                          '--y-offset': `${Math.random() * -150}px`
                        }}
                      />
                    ))}
                    {/* Top-right flame */}
                    {[...Array(8)].map((_, i) => (
                      <div
                        key={`tr-${i}`}
                        style={{
                          position: 'absolute',
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: `hsl(${15 + Math.random() * 30}, 100%, ${50 + Math.random() * 20}%)`,
                          left: '55%',
                          top: '40%',
                          animation: `particleExplosion ${0.8 + Math.random() * 0.4}s ease-out forwards`,
                          animationDelay: `${Math.random() * 0.15}s`,
                          '--x-offset': `${Math.random() * 150 - 75}px`,
                          '--y-offset': `${Math.random() * -150}px`
                        }}
                      />
                    ))}
                    {/* Bottom-left flame */}
                    {[...Array(8)].map((_, i) => (
                      <div
                        key={`bl-${i}`}
                        style={{
                          position: 'absolute',
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: `hsl(${15 + Math.random() * 30}, 100%, ${50 + Math.random() * 20}%)`,
                          left: '35%',
                          top: '50%',
                          animation: `particleExplosion ${0.8 + Math.random() * 0.4}s ease-out forwards`,
                          animationDelay: `${Math.random() * 0.15}s`,
                          '--x-offset': `${Math.random() * 150 - 75}px`,
                          '--y-offset': `${Math.random() * -150}px`
                        }}
                      />
                    ))}
                    {/* Bottom-right flame */}
                    {[...Array(8)].map((_, i) => (
                      <div
                        key={`br-${i}`}
                        style={{
                          position: 'absolute',
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: `hsl(${15 + Math.random() * 30}, 100%, ${50 + Math.random() * 20}%)`,
                          left: '65%',
                          top: '38%',
                          animation: `particleExplosion ${0.8 + Math.random() * 0.4}s ease-out forwards`,
                          animationDelay: `${Math.random() * 0.15}s`,
                          '--x-offset': `${Math.random() * 150 - 75}px`,
                          '--y-offset': `${Math.random() * -150}px`
                        }}
                      />
                    ))}
                  </>
                ) : (
                  // Votive candle: single flame point
                  [...Array(30)].map((_, i) => (
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
                  ))
                )}
              </div>
            )}
            
            {/* Diagonal Corner Flip Tab */}
            <button
              onClick={() => setIsFlipped(!isFlipped)}
              onMouseEnter={(e) => {
                const ribbon = e.currentTarget.querySelector('div');
                if (ribbon && !isMobile) {
                  ribbon.style.transform = 'rotate(45deg) scale(1.1)';
                  ribbon.style.background = isFlipped ? 'linear-gradient(135deg, #ff6666 0%, #ff0000 100%)' : 'linear-gradient(135deg, #ff4444 0%, #ff6666 100%)';
                }
              }}
              onMouseLeave={(e) => {
                const ribbon = e.currentTarget.querySelector('div');
                if (ribbon && !isMobile) {
                  ribbon.style.transform = 'rotate(45deg) scale(1)';
                  ribbon.style.background = isFlipped ? 'linear-gradient(135deg, #ff4444 0%, #cc0000 100%)' : 'linear-gradient(135deg, #ff0000 0%, #ff4444 100%)';
                }
              }}
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: '80px',
                height: '80px',
                padding: 0,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                overflow: 'hidden',
                zIndex: 20
              }}
            >
              <div style={{
                position: 'absolute',
                top: '10px',
                right: '-24px',
                width: '100px',
                height: '30px',
                background: isFlipped ? 'linear-gradient(135deg, #ff4444 0%, #cc0000 100%)' : 'linear-gradient(135deg, #ff0000 0%, #ff4444 100%)',
                transform: 'rotate(45deg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                transition: 'all 0.3s ease'
              }}>
                <span style={{
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}>
                  {isFlipped ? 'Back' : 'Flip'}
                </span>
              </div>
            </button>
            
            {/* Pause/Play Button */}
            {((activeTab === 'all' && filteredCandles.length > 1) || (activeTab === 'my' && myCandles.length > 1)) && (
              <button
                onClick={() => setIsPaused(!isPaused)}
                style={{
                  position: 'absolute',
                  bottom: isMobile && activeTab === 'my' ? 'calc(100px + env(safe-area-inset-bottom))' : isMobile ? 'calc(60px + env(safe-area-inset-bottom))' : '60px',
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
            
          </>
        )}
        
        {/* Progress indicator */}
        {((activeTab === 'all' && filteredCandles.length > 0) || (activeTab === 'my' && myCandles.length > 1)) && (
          <div style={{
            position: 'absolute',
            bottom: isMobile ? 'calc(20px + env(safe-area-inset-bottom))' : '20px',
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
              bottom: isMobile ? 'calc(20px + env(safe-area-inset-bottom))' : '20px',
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

// Inject animation styles
if (typeof document !== 'undefined' && !document.getElementById('animation-styles')) {
  const styleElement = document.createElement('style');
  styleElement.id = 'animation-styles';
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
    @keyframes pulse {
      0% {
        box-shadow: 0 4px 20px rgba(255, 215, 0, 0.6);
      }
      50% {
        box-shadow: 0 4px 30px rgba(255, 215, 0, 0.9), 0 0 50px rgba(255, 215, 0, 0.4);
      }
      100% {
        box-shadow: 0 4px 20px rgba(255, 215, 0, 0.6);
      }
    }
  `;
  document.head.appendChild(styleElement);
}

// Preload the models
useGLTF.preload('/models/tinyVotiveBox.glb');
useGLTF.preload('/models/tinyJapCanBox.glb');
