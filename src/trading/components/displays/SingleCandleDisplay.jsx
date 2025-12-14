import React, { useRef, useEffect, useState, Suspense } from 'react';
import ReactDOM from 'react-dom';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

// Available skybox textures configuration
const SKYBOX_TEXTURES = [
  { id: 'cyberpunk', path: '/cyberpunk.webp', name: 'Cyberpunk' },
  { id: 'synthwave', path: '/synthwave.webp', name: 'Synthwave' },
  { id: 'gothicTokyo', path: '/gothicTokyo.webp', name: 'Gothic Tokyo' },
  { id: 'neoTokyo', path: '/neoTokyo.webp', name: 'Neo Tokyo' },
  { id: 'aurora', path: '/aurora.webp', name: 'Aurora' },
  { id: 'templeScene', path: '/templeScene.webp', name: 'Temple Scene' }
];

// Function to get texture based on user data
const getTextureForUser = (userData) => {
  // Check if user has a specific skybox texture assigned
  if (userData?.skyboxTexture) {
    const texture = SKYBOX_TEXTURES.find(t => t.id === userData.skyboxTexture);
    if (texture) return texture;
  }
  
  // Check if user has a background field (from candles collection)
  if (userData?.background) {
    const texture = SKYBOX_TEXTURES.find(t => t.id === userData.background);
    if (texture) return texture;
  }
  
  // Check if user has a collection-based texture assignment
  if (userData?.collection) {
    // Map collections to specific textures
    const collectionMap = {
      'cyberpunk': 'cyberpunk',
      'synthwave': 'synthwave',
      'gothic': 'gothicTokyo',
      'neo': 'neoTokyo',
      'aurora': 'aurora',
      'temple': 'templeScene'
    };
    
    const textureId = collectionMap[userData.collection.toLowerCase()];
    if (textureId) {
      const texture = SKYBOX_TEXTURES.find(t => t.id === textureId);
      if (texture) return texture;
    }
  }
  
  // Fallback to deterministic selection based on user ID
  const userId = userData?.id || userData?.userId;
  if (!userId) return SKYBOX_TEXTURES[0]; // Default to first texture
  
  // Use user ID to deterministically select a texture
  const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const index = hash % SKYBOX_TEXTURES.length;
  return SKYBOX_TEXTURES[index];
};


// Scene content that loads the candle model directly
function CandleScene({ firestoreData, onDoubleClick }) {
  // Determine candle model based on firestoreData
  const candleType = firestoreData?.candleType || 'votive';
  const candleHeight = firestoreData?.candleHeight || 'medium';
  const controlsRef = useRef();
  
  let modelPath = "/models/votiveComplete.glb"; // Default votive with room
  
  if (candleType === 'votive') {
    modelPath = "/models/votiveComplete.glb"; // Votive with room for display
  } else if (candleType === 'japanese') {
    // Use Complete models for Japanese candles
    if (candleHeight === 'short') modelPath = "/models/japaneseShortComplete.glb";
    else if (candleHeight === 'tall') modelPath = "/models/japaneseTallComplete.glb";
    else modelPath = "/models/japaneseMediumComplete.glb";
  } else if (candleType === 'ecclesiastical') {
    // Use Complete models for Ecclesiastical candles  
    if (candleHeight === 'short') modelPath = "/models/ecclesiasticalShortComplete.glb";
    else if (candleHeight === 'tall') modelPath = "/models/ecclesiasticalTallComplete.glb";
    else modelPath = "/models/ecclesiasticalMediumComplete.glb";
  }
  
  // console.log('Full firestore data:', firestoreData);
  // console.log('Loading candle model:', modelPath, 'for type:', candleType);
  const { scene, animations } = useGLTF(modelPath);
  const candleRef = useRef();
  const mixerRef = useRef(null);
  const [hovered, setHovered] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const meltingProgressRef = useRef(0);
  const candlePartsRef = useRef(null);
  const transitionTimeoutRef = useRef(null);
  const curtainRef = useRef(null);
  const curtainProgressRef = useRef(0);
  const previousUserIdRef = useRef(null);
  const currentTextureRef = useRef(null);
  const justTransitionedRef = useRef(false);
  
  // Fix passive event listeners for OrbitControls
  useEffect(() => {
    // Small delay to ensure OrbitControls has attached its listeners
    const timer = setTimeout(() => {
      if (controlsRef.current && controlsRef.current.domElement) {
        const domElement = controlsRef.current.domElement;
        
        // Get all event listeners (this is a workaround)
        // We'll re-add the wheel listener with passive flag
        const originalAddEventListener = domElement.addEventListener;
        domElement.addEventListener = function(type, listener, options) {
          if (type === 'wheel') {
            // Force passive: false for wheel events to suppress the warning
            // OrbitControls needs preventDefault to work properly
            options = { ...options, passive: false };
          }
          return originalAddEventListener.call(this, type, listener, options);
        };
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Add error checking for scene
  useEffect(() => {
    if (!scene) {
      console.error('Scene not loaded from GLTF file');
    } else {
      // console.log('Scene loaded successfully:', scene);
    }
  }, [scene]);
  
  // Setup animations will be done after cloning the scene
  
  // Handle transition effect when user changes
  useEffect(() => {
    // Check if this is an actual user change (not initial load)
    const currentUserId = firestoreData?.id || firestoreData?.userId;
    const hasUserChanged = previousUserIdRef.current !== null && 
                          previousUserIdRef.current !== currentUserId;
    
    if (hasUserChanged && candleRef.current && candleRef.current.children.length > 0) {
      // console.log('User change detected:', previousUserIdRef.current, '->', currentUserId);
      // Store the new data to apply later
      setPendingFirestoreData(firestoreData);
      
      // Start curtain transition
      setIsTransitioning(true);
      curtainProgressRef.current = 0; // Reset curtain to start closing
      
      // Clear any existing timeout
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
      
      // Apply changes when curtain is closed
      setTimeout(() => {
        // Now update the textures while curtain is closed
        updateCandleTextures(firestoreData);
        // Update the previous user reference after applying changes
        previousUserIdRef.current = currentUserId;
      }, 1200); // Wait longer for curtain to be fully closed
      
      // End transition after curtain animation completes
      transitionTimeoutRef.current = setTimeout(() => {
        // console.log('Curtain transition complete');
        justTransitionedRef.current = true; // Mark that we just completed a transition
        setIsTransitioning(false);
        setPendingFirestoreData(null);
        // Clear the flag after a brief delay
        setTimeout(() => {
          justTransitionedRef.current = false;
        }, 100);
      }, 2400); // Longer total transition time
    } else if (!hasUserChanged) {
      // Initial load - update immediately
      previousUserIdRef.current = currentUserId;
    }
    
    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, [firestoreData]); // Trigger on any firestoreData change
  
  // Store pending firestore data during transition
  const [pendingFirestoreData, setPendingFirestoreData] = useState(null);
  const textureLoadingRef = useRef(false);
  
  // Function to update all textures in a coordinated way
  const updateCandleTextures = async (newData) => {
    if (!candleRef.current || !candleRef.current.children[0]) return;
    if (textureLoadingRef.current) return; // Prevent multiple simultaneous updates
    
    textureLoadingRef.current = true;
    const clonedCandle = candleRef.current.children[0];
    const isVotiveCandle = clonedCandle.getObjectByName('Label2') !== undefined;
    
    // Create promises for all texture loads
    const texturePromises = [];
    
    // 1. Load skybox texture
    const newSkyboxTexture = getTextureForUser(newData);
    if (!currentTextureRef.current || currentTextureRef.current.id !== newSkyboxTexture.id) {
      const skyboxPromise = new Promise((resolve) => {
        const textureLoader = new THREE.TextureLoader();
        textureLoader.load(
          newSkyboxTexture.path,
          (texture) => {
            texture.wrapS = THREE.ClampToEdgeWrapping;
            texture.wrapT = THREE.ClampToEdgeWrapping;
            texture.flipY = false;
            texture.needsUpdate = true;
            resolve({ type: 'skybox', texture, newTexture: newSkyboxTexture });
          },
          undefined,
          () => resolve(null)
        );
      });
      texturePromises.push(skyboxPromise);
    }
    
    // 2. Load Label1 and Label2 if votive
    if (isVotiveCandle && newData) {
      // Label1 - Message texture
      const message = newData.message || newData.prayer || 'May the gains be with you 🚀';
      const label1Promise = new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 1024;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.save();
        ctx.translate(0, canvas.height);
        ctx.scale(1, -1);
        
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 48px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Word wrap for message - handle CJK characters properly
        const maxWidth = 700;
        const lineHeight = 60;
        let lines = [];
        
        // Check if text contains CJK characters
        const hasCJK = /[\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF\uAC00-\uD7AF]/.test(message);
        
        if (hasCJK) {
          // Character-based wrapping for CJK text
          let currentLine = '';
          for (let i = 0; i < message.length; i++) {
            const char = message[i];
            const testLine = currentLine + char;
            const metrics = ctx.measureText(testLine);
            
            if (metrics.width > maxWidth && currentLine) {
              lines.push(currentLine);
              currentLine = char;
            } else {
              currentLine = testLine;
            }
          }
          if (currentLine) {
            lines.push(currentLine);
          }
        } else {
          // Word-based wrapping for non-CJK text
          const words = message.split(' ');
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
          if (currentLine) {
            lines.push(currentLine);
          }
        }
        
        const startY = (canvas.height - lines.length * lineHeight) / 2 + lineHeight / 2;
        lines.forEach((line, index) => {
          ctx.fillText(line.trim(), canvas.width / 2, startY + index * lineHeight);
        });
        
        ctx.restore();
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.anisotropy = 16;
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.needsUpdate = true;
        
        resolve({ type: 'label1', texture });
      });
      texturePromises.push(label1Promise);
      
      // Label2 - User image
      const imageUrl = newData.image || newData.profileImage || '/defaultAvatar.png';
      const label2Promise = new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = 512;
          canvas.height = 512;
          const ctx = canvas.getContext('2d');
          
          ctx.save();
          ctx.translate(0, canvas.height);
          ctx.scale(1, -1);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          ctx.restore();
          
          const texture = new THREE.CanvasTexture(canvas);
          texture.wrapS = THREE.RepeatWrapping;
          texture.wrapT = THREE.RepeatWrapping;
          texture.anisotropy = 16;
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.minFilter = THREE.LinearMipmapLinearFilter;
          texture.magFilter = THREE.LinearFilter;
          texture.needsUpdate = true;
          
          resolve({ type: 'label2', texture });
        };
        
        img.onerror = () => resolve(null);
        img.src = imageUrl;
      });
      texturePromises.push(label2Promise);
    }
    
    // Wait for all textures to load
    const loadedTextures = await Promise.all(texturePromises);
    
    // Apply all textures at once
    loadedTextures.forEach(result => {
      if (!result) return;
      
      if (result.type === 'skybox') {
        clonedCandle.traverse((child) => {
          if (child.name === 'Room' && child.isMesh) {
            child.visible = true;
            child.material = new THREE.MeshBasicMaterial({
              map: result.texture,
              side: THREE.DoubleSide,
              color: 0x808080,
              transparent: false,
              opacity: 1,
              depthWrite: false
            });
            child.renderOrder = -1000;
            child.frustumCulled = false;
            child.material.needsUpdate = true;
          }
        });
        currentTextureRef.current = result.newTexture;
      } else if (result.type === 'label1') {
        clonedCandle.traverse((child) => {
          if (child.name === 'Label1' && child.isMesh && child.material) {
            child.material = child.material.clone();
            child.material.map = result.texture;
            child.material.metalness = 0;
            child.material.roughness = 1;
            child.material.needsUpdate = true;
          }
        });
      } else if (result.type === 'label2') {
        clonedCandle.traverse((child) => {
          if (child.name === 'Label2' && child.isMesh && child.material) {
            child.material = child.material.clone();
            child.material.map = result.texture;
            child.material.metalness = 0;
            child.material.roughness = 1;
            child.material.needsUpdate = true;
          }
        });
      }
    });
    
    textureLoadingRef.current = false;
  };
  
  // Clone and setup the candle
  useEffect(() => {
    // Skip entirely if transitioning - the updateCandleTextures will handle it
    if (isTransitioning) return;
    
    // Skip if we just finished a transition (prevents re-render flash)
    if (justTransitionedRef.current) return;
    
    // Also skip if we're about to transition (prevents flash before curtain)
    const currentUserId = firestoreData?.id || firestoreData?.userId;
    const willTransition = previousUserIdRef.current !== null && 
                          previousUserIdRef.current !== currentUserId;
    if (willTransition) return;
    
    // Only clone if scene is ready and we have a ref
    if (scene && candleRef.current) {
      const clonedCandle = scene.clone();
      
      // Skip background loading if transitioning - will be handled by updateCandleTextures
      if (!isTransitioning) {
        // Load dynamic skybox texture based on user
        const selectedTexture = getTextureForUser(firestoreData);
        // console.log('Loading skybox texture:', selectedTexture.name, selectedTexture.path);
        
        const textureLoader = new THREE.TextureLoader();
        textureLoader.load(
          selectedTexture.path,
          (texture) => {
            // console.log('Texture loaded successfully:', selectedTexture.name);
            currentTextureRef.current = selectedTexture;
            
            // Flip the texture vertically to match UV coordinates
            texture.wrapS = THREE.ClampToEdgeWrapping;
            texture.wrapT = THREE.ClampToEdgeWrapping;
            texture.flipY = false; // This flips the texture vertically
            texture.needsUpdate = true;
            
            // Find and update the Room object's texture only
            clonedCandle.traverse((child) => {
              if (child.name === 'Room' && child.isMesh) {
                // console.log('Updating Room texture while preserving UVs');
                // console.log('Original material:', child.material);
                
                // Make sure the Room is visible
                child.visible = true;
                
                // Replace with a simple MeshBasicMaterial to avoid shader conflicts
                child.material = new THREE.MeshBasicMaterial({
                  map: texture,
                  side: THREE.DoubleSide,
                  color: 0x808080, // Darken the texture (adjust as needed)
                  transparent: false,
                  opacity: 1,
                  depthWrite: false
                });
                
                child.renderOrder = -1000; // Ensure it renders behind everything else
                child.frustumCulled = false; // Prevent culling issues
                
                // console.log('Updated material with new texture');
              }
            });
          },
          // Progress callback
          undefined,
          // Error callback
          (error) => {
            console.error('Error loading texture:', error);
          }
        );
      }
      
      // Setup animations for the cloned scene
      if (animations && animations.length > 0) {
        mixerRef.current = new THREE.AnimationMixer(clonedCandle);
        
        // Find and play the 'Animation' clip specifically
        animations.forEach(clip => {
          // console.log('Found animation clip:', clip.name);
          const action = mixerRef.current.clipAction(clip);
          action.play();
        });
      }
      
      // Scale up for better visibility
      clonedCandle.scale.set(1, 1, 1);
      clonedCandle.position.set(0, 0, 0);
      
      // Check if this is a votive candle (no melting required)
      const isVotiveCandle = scene.name?.includes('Votive') || 
                           animations?.some(a => a.name?.includes('Votive')) ||
                           clonedCandle.getObjectByName('Label2') !== undefined;
      
      // console.log('Is votive candle:', isVotiveCandle);
      
      // Initialize melting properties (only for non-votive candles)
      const meltingRate = 1 / 30; // 30 seconds to fully melt for testing
      
      // Find XBase which is the part that melts (with Flame and XRope01 as children)
      let xBaseToMelt = null;
      
      if (!isVotiveCandle) {
        clonedCandle.traverse((child) => {
          // Look for XBase inside XCandle01
          if (child.name === 'XBase') {
            xBaseToMelt = child;
            // console.log('Found XBase to melt:', child);
          }
        });
      }
      
      // Store reference to the melting part and check if it's Japanese candle
      if (xBaseToMelt) {
        // Check if this is a Japanese candle from the firestoreData
        const isJapaneseCandle = firestoreData?.candleType === 'japanese';
        
        // Find XCandle01 container for drop animation
        let xCandle01Container = null;
        clonedCandle.traverse((child) => {
          if (child.name === 'XCandle01') {
            xCandle01Container = child;
            // console.log('Found XCandle01 container for drop:', child);
          }
        });
        
        candlePartsRef.current = {
          meltingObject: xBaseToMelt,
          originalScale: xBaseToMelt.scale.clone(),
          isJapaneseCandle: isJapaneseCandle,
          xCandle01: xCandle01Container,
          originalContainerY: xCandle01Container ? xCandle01Container.position.y : 0,
          dropProgress: 0
        };
        
        // console.log('Candle melting setup complete');
        // console.log('Is Japanese candle:', isJapaneseCandle);
        // console.log('XBase scale:', xBaseToMelt.scale);
        // console.log('XBase rotation:', xBaseToMelt.rotation);
      } else {
        // console.warn('XBase not found in model');
      }
      
      // Mark as a candle for cleanup later
      clonedCandle.userData = {
        ...clonedCandle.userData,
        isCandle: true,
        candleId: `placed_candle_${Date.now()}`,
        placedAt: new Date(),
        // Add melting properties to the parent as well
        isMelting: true,
        meltingProgress: 0,
        originalScale: clonedCandle.scale.clone(),
        // Use the same melting rate calculated above
        meltingRate: meltingRate,
      };
      
      // Enable shadows for all meshes in the scene
      clonedCandle.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          
          // Log mesh names to identify objects
          // console.log('Mesh found:', child.name);
          
          // Enhance materials for better lighting response
          if (child.material) {
            // Special treatment for the candle wax
            if (child.name === 'Candle2' || child.name.includes('Candle') || child.name === 'Candle000') {
              // console.log('Enhancing candle wax:', child.name);
              const oldMaterial = child.material;
              child.material = new THREE.MeshStandardMaterial({
                color: oldMaterial.color || new THREE.Color(0x2d5016),  // Green candle color
                map: oldMaterial.map,
                roughness: 0.9,  // Waxy, matte surface
                metalness: 0,    // Non-metallic
                emissive: new THREE.Color(0x0a1505),  // Slight self-illumination
                emissiveIntensity: 0.1
              });
            }
            // If it's not the Room object, apply general improvements
            else if (child.name !== 'Room') {
              // Convert to MeshStandardMaterial if it's MeshBasicMaterial
              if (child.material.type === 'MeshBasicMaterial') {
                const oldMaterial = child.material;
                child.material = new THREE.MeshStandardMaterial({
                  color: oldMaterial.color,
                  map: oldMaterial.map,
                  roughness: 0.7,
                  metalness: 0.1
                });
              }
              // Enhance existing MeshStandardMaterial properties
              else if (child.material.type === 'MeshStandardMaterial') {
                child.material.roughness = child.material.roughness || 0.7;
                child.material.metalness = child.material.metalness || 0.1;
              }
            }
          }
        }
      });
      
      // Special handling for votive candle - apply user image to Label2 and message to Label1
      // Skip if transitioning - will be handled by updateCandleTextures
      if (isVotiveCandle && firestoreData && !isTransitioning) {
        // console.log('Applying user data to votive candle labels');
        
        const imageUrl = firestoreData.image || firestoreData.profileImage || '/defaultAvatar.png';
        const message = firestoreData.message || firestoreData.prayer || 'May the gains be with you 🚀';
        
        // Create message texture for Label1 (same as FloatingCandleViewer)
        const createVotiveLabel1Texture = () => {
          const canvas = document.createElement('canvas');
          canvas.width = 1024;
          canvas.height = 1024;
          const ctx = canvas.getContext('2d');
          
          // Fill with white background
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // Save context state
          ctx.save();
          
          // Flip the canvas vertically only (since you reworked it in Blender)
          ctx.translate(0, canvas.height);
          ctx.scale(1, -1);
          
          // Configure text with smaller size
          ctx.fillStyle = '#000000';
          ctx.font = 'bold 48px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          // Word wrap for message - handle CJK characters properly
          const maxWidth = 700;  // Slightly smaller width
          const lineHeight = 60;  // Smaller line height
          let lines = [];
          
          // Check if text contains CJK characters
          const hasCJK = /[\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF\uAC00-\uD7AF]/.test(message);
          
          if (hasCJK) {
            // Character-based wrapping for CJK text
            let currentLine = '';
            for (let i = 0; i < message.length; i++) {
              const char = message[i];
              const testLine = currentLine + char;
              const metrics = ctx.measureText(testLine);
              
              if (metrics.width > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = char;
              } else {
                currentLine = testLine;
              }
            }
            if (currentLine) {
              lines.push(currentLine);
            }
          } else {
            // Word-based wrapping for non-CJK text
            const words = message.split(' ');
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
            if (currentLine) {
              lines.push(currentLine);
            }
          }
          
          // Draw text centered
          const startY = (canvas.height - lines.length * lineHeight) / 2 + lineHeight / 2;
          lines.forEach((line, index) => {
            ctx.fillText(line.trim(), canvas.width / 2, startY + index * lineHeight);
          });
          
          // Restore context
          ctx.restore();
          
          const texture = new THREE.CanvasTexture(canvas);
          texture.wrapS = THREE.RepeatWrapping;
          texture.wrapT = THREE.RepeatWrapping;
          texture.anisotropy = 16; // Max anisotropy for better quality
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.minFilter = THREE.LinearMipmapLinearFilter;
          texture.magFilter = THREE.LinearFilter;
          texture.needsUpdate = true;
          
          return texture;
        };
        
        // Apply message texture to Label1
        const label1Texture = createVotiveLabel1Texture();
        clonedCandle.traverse((child) => {
          if (child.name === 'Label1' && child.isMesh) {
            if (child.material) {
              // Clone and update existing material instead of replacing
              child.material = child.material.clone();
              child.material.map = label1Texture;
              child.material.metalness = 0;
              child.material.roughness = 1;
              child.material.needsUpdate = true;
              // console.log('Applied message to votive Label1');
            }
          }
        });
        
        // Create simple image texture for Label2 (no username overlay for votive)
        const createVotiveLabel2Texture = (img) => {
          const canvas = document.createElement('canvas');
          canvas.width = 512;
          canvas.height = 512;
          const ctx = canvas.getContext('2d');
          
          // Save context state
          ctx.save();
          
          // Flip the image vertically
          ctx.translate(0, canvas.height);
          ctx.scale(1, -1);
          
          // Draw image to fill entire canvas
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          // Restore context
          ctx.restore();
          
          const texture = new THREE.CanvasTexture(canvas);
          texture.wrapS = THREE.RepeatWrapping;
          texture.wrapT = THREE.RepeatWrapping;
          texture.anisotropy = 16; // Max anisotropy for better quality
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.minFilter = THREE.LinearMipmapLinearFilter;
          texture.magFilter = THREE.LinearFilter;
          texture.needsUpdate = true;
          
          return texture;
        };
        
        // Load and apply user image to Label2
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = () => {
          // Apply texture immediately - no delay needed
          const label2Texture = createVotiveLabel2Texture(img);
          
          // Find and update Label2
          clonedCandle.traverse((child) => {
            if (child.name === 'Label2' && child.isMesh) {
              if (child.material) {
                // Clone and update existing material instead of replacing
                child.material = child.material.clone();
                child.material.map = label2Texture;
                child.material.metalness = 0;
                child.material.roughness = 1;
                child.material.needsUpdate = true;
                // console.log('Applied texture to votive Label2');
              }
            }
          });
        };
        
        img.onerror = () => {
          // Use default avatar if image fails
          const defaultImg = new Image();
          defaultImg.onload = () => {
            const label2Texture = createVotiveLabel2Texture(defaultImg);
            clonedCandle.traverse((child) => {
              if (child.name === 'Label2' && child.isMesh) {
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
      }
      
      // Apply any Firestore data if provided (for non-votive candles)
      if (firestoreData && !isVotiveCandle) {
        clonedCandle.userData = {
          ...clonedCandle.userData,
          ...firestoreData
        };
        
        // Apply user data to candle labels (matching MobileCandleOrbital)
        const username = firestoreData.username || firestoreData.userName || firestoreData.name || 'Anonymous Trader';
        const message = firestoreData.message || firestoreData.prayer || 'May the gains be with you 🚀';
        const imageUrl = firestoreData.image || firestoreData.profileImage || '/defaultAvatar.png';
        
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
          
          // Word wrap for message - handle CJK characters properly
          const maxWidth = 600;
          const lineHeight = 70;
          let lines = [];
          
          // Check if text contains CJK characters
          const hasCJK = /[\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF\uAC00-\uD7AF]/.test(message);
          
          if (hasCJK) {
            // Character-based wrapping for CJK text
            let currentLine = '';
            for (let i = 0; i < message.length; i++) {
              const char = message[i];
              const testLine = currentLine + char;
              const metrics = ctx.measureText(testLine);
              
              if (metrics.width > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = char;
              } else {
                currentLine = testLine;
              }
            }
            if (currentLine) {
              lines.push(currentLine);
            }
          } else {
            // Word-based wrapping for non-CJK text
            const words = message.split(' ');
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
            if (currentLine) {
              lines.push(currentLine);
            }
          }
          
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
  }, [scene, firestoreData, animations, isTransitioning]);
  
  // Animation loop
  useFrame((state, delta) => {
    if (mixerRef.current) {
      mixerRef.current.update(delta);
    }
    
    // Handle curtain transition animation
    if (curtainRef.current) {
      const CURTAIN_SPEED = 0.8; // Slower speed for longer, smoother transition
      const CURTAIN_HOLD = 0.8; // Hold curtain closed longer while textures swap
      
      if (isTransitioning) {
        // Update curtain progress
        curtainProgressRef.current += delta * CURTAIN_SPEED;
        
        let curtainOpacity = 0;
        const progress = curtainProgressRef.current;
        
        if (progress < 1) {
          // Closing curtain (0 to 1 progress = 0 to 1 opacity) - ease in
          curtainOpacity = Math.sin((progress * Math.PI) / 2);
        } else if (progress < 1 + CURTAIN_HOLD) {
          // Holding curtain closed
          curtainOpacity = 1;
        } else if (progress < 2 + CURTAIN_HOLD) {
          // Opening curtain (1+hold to 2+hold progress = 1 to 0 opacity) - ease out
          const openProgress = (progress - 1 - CURTAIN_HOLD);
          curtainOpacity = Math.max(0, Math.cos((openProgress * Math.PI) / 2));
        }
        
        // Apply curtain opacity and ensure visibility
        curtainRef.current.material.opacity = curtainOpacity;
        curtainRef.current.material.needsUpdate = true;
        curtainRef.current.visible = curtainOpacity > 0.01;
        
        // Debug log
        if (curtainOpacity > 0 && curtainOpacity < 0.1) {
          // console.log('Curtain transition:', curtainOpacity, 'visible:', curtainRef.current.visible);
        }
      } else {
        // Ensure curtain is hidden when not transitioning
        curtainRef.current.visible = false;
        curtainRef.current.material.opacity = 0;
      }
    }
    
    // Handle candle melting entirely in useFrame to avoid re-renders
    if (candlePartsRef.current && candlePartsRef.current.meltingObject) {
      const MIN_SCALE = 0.1;
      const meltingRate = 1 / 300; // 5 min
      
      // Update melting progress using ref
      const prevProgress = meltingProgressRef.current;
      meltingProgressRef.current = Math.min(prevProgress + delta * meltingRate, 1);
      const currentProgress = meltingProgressRef.current;
      
      // Log progress every 10%
      // if (Math.floor(currentProgress * 10) !== Math.floor(prevProgress * 10)) {
      //   console.log(`Melting progress: ${(currentProgress * 100).toFixed(1)}%`);
      // }
      
      // Apply melting effect directly
      const percentageRemaining = Math.max(1 - currentProgress, MIN_SCALE);
      const xBase = candlePartsRef.current.meltingObject;
      const originalScale = candlePartsRef.current.originalScale;
      
      xBase.scale.set(
        originalScale.x,
        originalScale.y * percentageRemaining,
        originalScale.z
      );
      
      // When fully melted, hide flames (all of them for Japanese candle)
      if (percentageRemaining <= MIN_SCALE + 0.01 && !candlePartsRef.current.flameHidden) {
        // Hide all flames
        xBase.traverse((child) => {
          // Check for any flame (Flame, Flame.001, Flame.002, Flame.003)
          if (child.name && child.name.startsWith('Flame')) {
            child.visible = false;
            // console.log('Hiding flame:', child.name);
          }
        });
        candlePartsRef.current.flameHidden = true;
        // console.log('Candle extinguished - all flames hidden!');
        
        // Start drop animation for Japanese candle
        if (candlePartsRef.current.isJapaneseCandle) {
          candlePartsRef.current.startDrop = true;
          // console.log('Starting drop animation for Japanese candle');
        }
      }
      
      // Handle drop animation for Japanese candle
      if (candlePartsRef.current.isJapaneseCandle && 
          candlePartsRef.current.startDrop && 
          candlePartsRef.current.xCandle01) {
        
        const DROP_DISTANCE = 0.3; // Adjust this value as needed
        const DROP_SPEED = 2.0; // Units per second
        
        // Update drop progress
        candlePartsRef.current.dropProgress = Math.min(
          candlePartsRef.current.dropProgress + delta * DROP_SPEED,
          DROP_DISTANCE
        );
        
        // Apply drop to XCandle01 container
        const container = candlePartsRef.current.xCandle01;
        container.position.y = candlePartsRef.current.originalContainerY - 
                               candlePartsRef.current.dropProgress;
        
        // Log when drop is complete
        if (candlePartsRef.current.dropProgress >= DROP_DISTANCE && 
            !candlePartsRef.current.dropComplete) {
          candlePartsRef.current.dropComplete = true;
          // console.log('Japanese candle drop complete');
        }
      }
    }
    
    // Ensure Room stays visible (background)
    if (candleRef.current && candleRef.current.children.length > 0) {
      const scene = candleRef.current.children[0];
      scene.traverse((child) => {
        if (child.name === 'Room' && !child.visible) {
          child.visible = true;
        }
      });
    }
  });
  
  // Show loading state if scene not loaded
  if (!scene) {
    return (
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="red" />
      </mesh>
    );
  }
  
  return (
    <>
      {/* Lighting setup - Enhanced for better depth */}
      <ambientLight intensity={0.4} />
      
      {/* Main directional light for shadows */}
      <directionalLight 
        position={[5, 10, 5]} 
        intensity={0.8} 
        castShadow 
        shadow-mapSize={[1024, 1024]}
        shadow-camera-far={20}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      
      {/* Fill light from opposite side */}
      <directionalLight 
        position={[-5, 5, -5]} 
        intensity={0.3} 
        color="#e0e0ff"
      />
      
      {/* Rim light for edge definition */}
      <spotLight
        position={[0, 8, -5]}
        intensity={0.5}
        angle={0.6}
        penumbra={0.8}
        color="#ffffff"
      />
      
      {/* Candle flame light - warm glow */}
      <pointLight 
        position={[0, 2.5, 0]}
        intensity={0.8}
        color="#ffaa44"
        distance={8}
        decay={2}
      />
      
      {/* Subtle green accent light for atmosphere */}
      <pointLight 
        position={[-3, 1, 3]}
        intensity={0.2}
        color="#00ff88"
        distance={6}
      />
      
      {/* The candle model - clickable */}
      <group 
        ref={candleRef}
        onClick={onDoubleClick}  // Changed from onDoubleClick to onClick for easier interaction
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        style={{ cursor: hovered ? 'pointer' : 'auto' }}
      />
      
      {/* Curtain overlay for transitions - theatrical dark green curtain */}
      <mesh 
        ref={curtainRef}
        position={[0, 0, 5]}  // Closer to camera to ensure it covers everything
        visible={false}
        renderOrder={9999}
      >
        <planeGeometry args={[100, 100]} />  {/* Larger to ensure full coverage */}
        <meshBasicMaterial 
          color={new THREE.Color(0x0a1f0a)} // Dark green theater curtain color
          transparent={true}
          opacity={0}
          depthTest={false}
          depthWrite={false}
        />
      </mesh>
      
      {/* Camera controls - with zoom and manual rotation enabled */}
      <OrbitControls
        ref={controlsRef}
        dampingFactor={0.2}
        enablePan={true}
        enableZoom={true}
        minDistance={2}
        maxDistance={10}
        touchAction="none"
        regress
        enableDamping
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
  
  // Get viewport dimensions for mobile
  const isMobileDevice = typeof window !== 'undefined' && window.innerWidth <= 768;
  
  return (
    <div style={{
      position: 'absolute',
      bottom: '0',
      left: '0',
      right: '0', 
      background: 'linear-gradient(90deg, rgba(0, 0, 0, 0.85) 0%, rgba(0, 20, 0, 0.8) 50%, rgba(0, 0, 0, 0.85) 100%)',
      borderTop: '1px solid rgba(0, 255, 0, 0.2)',
      padding: '10px 12px',
      // More aggressive padding for mobile browsers
      paddingBottom: isMobileDevice ? 'calc(3rem + env(safe-area-inset-bottom, 3rem))' : 'calc(12px + env(safe-area-inset-bottom, 0px))',
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
      // Regular view - default position (adjust these values to change main view)
      targetPos = { x: 0, y: 0, z: 9 };  // Pulled back for better view
      targetFov = 35;  // Changed from 45
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
export default function SingleCandleDisplay({ firestoreData, isUserCandle = false }) {
  const [isCanvasReady, setIsCanvasReady] = useState(false);
  const [portalEntered, setPortalEntered] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [messageExpanded, setMessageExpanded] = useState(false);
  const [displayedUserData, setDisplayedUserData] = useState(firestoreData);
  const containerRef = useRef();
  
  useEffect(() => {
    // Small delay to ensure canvas mounts properly
    const timer = setTimeout(() => {
      setIsCanvasReady(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Sync the displayed user data with the transition
  useEffect(() => {
    // Check if user is actually changing
    const currentId = firestoreData?.id || firestoreData?.userId;
    const displayedId = displayedUserData?.id || displayedUserData?.userId;
    
    if (currentId !== displayedId && displayedId !== undefined) {
      // Delay the user info update to match the curtain transition
      setTimeout(() => {
        setDisplayedUserData(firestoreData);
      }, 1200); // Match the texture swap timing
    } else if (displayedId === undefined) {
      // Initial load - set immediately
      setDisplayedUserData(firestoreData);
    }
  }, [firestoreData]);
  
  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // ESC key handler for fullscreen
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isFullscreen) {
        handlePortalExit();
      }
    };
    
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isFullscreen]);
  
  const handlePortalClick = () => {
    // Only enter portal if not already in fullscreen
    if (!isFullscreen) {
      setPortalEntered(true);
      setIsFullscreen(true);
      // console.log('Portal entered');
    }
    // Don't exit on click when in fullscreen - only via button
  };
  
  const handlePortalExit = () => {
    setIsFullscreen(false);
    setPortalEntered(false);
    // console.log('Portal exited');
  };

  return (
    <>
      {/* Fullscreen portal container - rendered at document body level */}
      {isFullscreen && ReactDOM.createPortal(
        <div 
          style={{ 
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 100000,
            background: 'black',
            margin: 0,
            padding: 0,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row'
          }}>
          {/* Canvas container - takes remaining space */}
          <div style={{ 
            flex: 1,
            width: '100%',
            height: '100%',
            position: 'relative'
          }}>
            <Canvas
            camera={{ position: [0, 0, 12], fov: 35 }}
            style={{ width: '100%', height: '100%', background: 'black' }}
            shadows
            gl={{ 
              antialias: true,
              alpha: false,
              preserveDrawingBuffer: true,  // Changed to true to prevent flicker
              powerPreference: "high-performance",
              failIfMajorPerformanceCaveat: false,
              stencil: false,
              depth: true  // Explicitly enable depth buffer
            }}
            onCreated={({ gl, scene }) => {
              gl.toneMapping = THREE.ACESFilmicToneMapping;
              gl.toneMappingExposure = 1.2;
              scene.background = new THREE.Color(0x000000);
              gl.shadowMap.enabled = true;
              gl.shadowMap.type = THREE.PCFSoftShadowMap;
            }}
          >
            <CameraAnimator entered={portalEntered} isFullscreen={isFullscreen} />
            <Suspense fallback={
              <mesh>
                <boxGeometry args={[1, 1, 1]} />
                <meshBasicMaterial color="orange" />
              </mesh>
            }>
              <CandleScene 
                key={`${firestoreData?.candleType}-${firestoreData?.candleHeight}-${firestoreData?.id}`}
                firestoreData={firestoreData} 
                onDoubleClick={handlePortalClick}
              />
            </Suspense>
            </Canvas>
          </div>
          
          {/* User info panel */}
          {displayedUserData && (
            <div style={{
              width: isMobile ? '100%' : '320px',
              height: isMobile ? 'auto' : '100%',
              maxHeight: isMobile ? (messageExpanded ? '50vh' : '25vh') : '100%',
              background: 'linear-gradient(180deg, rgba(0,20,0,0.95) 0%, rgba(0,0,0,0.95) 100%)',
              borderLeft: isMobile ? 'none' : '1px solid rgba(0,255,0,0.2)',
              borderTop: isMobile ? '1px solid rgba(0,255,0,0.2)' : 'none',
              padding: isMobile ? '15px 15px' : '80px 20px 30px',
              display: 'flex',
              flexDirection: isMobile ? 'row' : 'column',
              alignItems: isMobile ? 'flex-start' : 'center',
              gap: isMobile ? '15px' : '20px',
              overflowY: 'auto',
              backdropFilter: 'blur(10px)'
            }}>
              {/* User Image */}
              <div style={{
                width: isMobile ? '60px' : '120px',
                height: isMobile ? '60px' : '120px',
                minWidth: isMobile ? '60px' : '120px',
                borderRadius: '50%',
                overflow: 'hidden',
                border: '3px solid rgba(0,255,0,0.5)',
                boxShadow: '0 0 30px rgba(0,255,0,0.3)',
                background: 'rgba(0,255,0,0.1)'
              }}>
                <img 
                  src={displayedUserData.image || displayedUserData.profileImage || '/defaultAvatar.png'}
                  alt={displayedUserData.username || 'User'}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                  onError={(e) => {
                    e.target.src = '/defaultAvatar.png';
                  }}
                />
              </div>
              
              {/* Content container for mobile */}
              <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: isMobile ? '10px' : '20px'
              }}>
                {/* Username */}
                <h2 style={{
                  margin: 0,
                  color: '#00ff00',
                  fontSize: isMobile ? '18px' : '24px',
                  fontWeight: 'bold',
                  textAlign: isMobile ? 'left' : 'center',
                  textShadow: '0 0 20px rgba(0,255,0,0.5)',
                  letterSpacing: '1px'
                }}>
                  {displayedUserData.username || displayedUserData.userName || displayedUserData.name || 'Anonymous Trader'}
                </h2>
                
                {/* Prayer/Message Box - more compact on mobile */}
                <div style={{
                  background: 'rgba(0,0,0,0.5)',
                  border: '1px solid rgba(0,255,0,0.3)',
                  borderRadius: isMobile ? '8px' : '10px',
                  padding: isMobile ? '10px' : '20px',
                  width: '100%',
                  maxWidth: isMobile ? '100%' : '280px'
                }}>
                  <h3 style={{
                    margin: isMobile ? '0 0 8px 0' : '0 0 15px 0',
                    color: 'rgba(0,255,0,0.8)',
                    fontSize: isMobile ? '11px' : '14px',
                    textTransform: 'uppercase',
                    letterSpacing: isMobile ? '1px' : '2px',
                    textAlign: isMobile ? 'left' : 'center',
                    borderBottom: '1px solid rgba(0,255,0,0.2)',
                    paddingBottom: isMobile ? '5px' : '10px'
                  }}>
                    Prayer to Our Lady
                  </h3>
                  <p 
                    onClick={() => isMobile && setMessageExpanded(!messageExpanded)}
                    style={{
                      margin: 0,
                      color: 'rgba(255,255,255,0.9)',
                      fontSize: isMobile ? '13px' : '16px',
                      lineHeight: isMobile ? '1.4' : '1.6',
                      fontStyle: 'italic',
                      textAlign: isMobile ? 'left' : 'center',
                      wordWrap: 'break-word',
                      display: '-webkit-box',
                      WebkitLineClamp: (isMobile && !messageExpanded) ? 2 : 'unset',
                      WebkitBoxOrient: 'vertical',
                      overflow: (isMobile && !messageExpanded) ? 'hidden' : 'visible',
                      cursor: isMobile ? 'pointer' : 'default',
                      position: 'relative'
                    }}>
                    "{displayedUserData.message || displayedUserData.prayer || 'May the gains be with you 🚀'}"
                  </p>
                  {/* Show more/less indicator for mobile */}
                  {isMobile && (displayedUserData.message || displayedUserData.prayer || '').length > 80 && (
                    <div 
                      onClick={() => setMessageExpanded(!messageExpanded)}
                      style={{
                        textAlign: 'center',
                        color: 'rgba(0,255,0,0.6)',
                        fontSize: '11px',
                        marginTop: '5px',
                        cursor: 'pointer',
                        textDecoration: 'underline'
                      }}>
                      {messageExpanded ? 'Show less' : 'Show more'}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Performance indicator if available - hide on mobile */}
              {!isMobile && (displayedUserData.performance || displayedUserData.burnedAmount) && (
                <div style={{
                  background: 'rgba(0,255,0,0.1)',
                  border: '1px solid rgba(0,255,0,0.3)',
                  borderRadius: '5px',
                  padding: '10px 20px',
                  textAlign: 'center'
                }}>
                  <div style={{
                    color: 'rgba(0,255,0,0.7)',
                    fontSize: '12px',
                    marginBottom: '5px'
                  }}>
                    RL80 Tokens Burned
                  </div>
                  <div style={{
                    color: '#00ff00',
                    fontSize: '20px',
                    fontWeight: 'bold'
                  }}>
                    {(displayedUserData.performance || displayedUserData.burnedAmount || 0).toLocaleString()} RL80
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Exit button */}
          <button
            onClick={handlePortalExit}
            style={{
              position: 'fixed',
              top: '20px',
              right: '20px',
              padding: '10px 20px',
              background: 'rgba(0, 0, 0, 0.8)',
              border: '2px solid #00ff00',
              color: '#00ff00',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              zIndex: 10002,
              boxShadow: '0 0 20px rgba(0, 255, 0, 0.5)'
            }}
          >
            Exit Portal (ESC)
          </button>
        </div>,
        document.body
      )}
      
      {/* Regular candle display */}
      {!isFullscreen && (
        <div 
          ref={containerRef}
          style={{ 
            position: 'relative',
            width: '100%',
            height: '100%',
            margin: 0,
            padding: 0,
            overflow: 'hidden',
            // Add bottom padding for mobile to push content above browser bar
            paddingBottom: isMobile ? 'env(safe-area-inset-bottom, 0)' : 0
          }}>
          {isCanvasReady ? (
            <Canvas
              camera={{ position: [0, 0, 7], fov: 45 }}
              style={{ width: '100%', height: '100%', background: '#1a1a1a' }}
              shadows
              gl={{ 
                antialias: true,
                alpha: false,
                preserveDrawingBuffer: true, // Changed to prevent flicker
                powerPreference: "high-performance",
                failIfMajorPerformanceCaveat: false,
                stencil: false,
                depth: true // Explicitly enable depth buffer
              }}
              onCreated={({ gl, scene }) => {
                gl.toneMapping = THREE.ACESFilmicToneMapping;
                gl.toneMappingExposure = 1.2;
                scene.background = new THREE.Color(0x1a1a1a);  // Set a dark gray background
                gl.shadowMap.enabled = true;
                gl.shadowMap.type = THREE.PCFSoftShadowMap;
              }}
            >
          <CameraAnimator entered={portalEntered} isFullscreen={isFullscreen} />
          <Suspense fallback={
            <mesh>
              <boxGeometry args={[1, 1, 1]} />
              <meshBasicMaterial color="orange" />
            </mesh>
          }>
            <CandleScene 
              key={`${firestoreData?.candleType}-${firestoreData?.candleHeight}-${firestoreData?.id}`}
              firestoreData={firestoreData} 
              onDoubleClick={handlePortalClick}
            />
          </Suspense>
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
            Loading ...
          </div>
        )}
        
        {/* Click to Enter Portal Indicator - only show for community candles */}
        {isCanvasReady && !isUserCandle && (
          <div style={{
            position: 'absolute',
            top: '10px',
            left: '60%',
            transform: 'translateX(-50%)',
            padding: '4px 4px',
            background: 'rgba(0, 0, 0, 0.6)',
            border: '1px solid rgba(0, 255, 0, 0.25)',
            borderRadius: '15px',
            color: '#00ff00',
            fontSize: '10px',
            fontWeight: '500',
            letterSpacing: '0.3px',
            textTransform: 'uppercase',
            textAlign: 'center',
            pointerEvents: 'none',
            animation: 'pulse 2s infinite',
            zIndex: 5,
            boxShadow: '0 1px 6px rgba(0, 255, 0, 0.15)'
          }}>
            Click candle to <br/>enter portal
          </div>
        )}
        
        {/* User Info Overlay - only show when not fullscreen */}
        <UserInfoOverlay userData={displayedUserData} />
        
        {/* Add pulse animation styles */}
        <style jsx>{`
          @keyframes pulse {
            0%, 100% { 
              opacity: 0.7; 
              transform: translateX(-50%) scale(1);
            }
            50% { 
              opacity: 1; 
              transform: translateX(-50%) scale(1.05);
            }
          }
        `}</style>
      </div>
      )}
    </>
  );
}

// Preload the models
useGLTF.preload("/models/votiveComplete.glb");
useGLTF.preload("/models/japaneseShortComplete.glb");
useGLTF.preload("/models/japaneseMediumComplete.glb");
useGLTF.preload("/models/japaneseTallComplete.glb");
useGLTF.preload("/models/ecclesiasticalShortComplete.glb");
useGLTF.preload("/models/ecclesiasticalMediumComplete.glb");
useGLTF.preload("/models/ecclesiasticalTallComplete.glb");