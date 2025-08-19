
import { useEffect, useRef, useMemo, useState, memo, useCallback } from "react";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import * as THREE from "three";
import { useFrame, useThree, useLoader } from "@react-three/fiber";
import TickerDisplay3 from "@/components/TickerDisplay3";
import VideoScreens from "@/components/VideoScreens";
import VideoBackground from "@/components/VideoBackground";
import SimpleGlitchTint from "@/components/SimpleGlitchTint";
import AnnotationSystem from "@/components/AnnotationSystem";
import { useFirestoreResults } from "@/utilities/useFirestoreResults";
import CandleMarquee from "./CandleMarquee";


import HolographicStatue4 from "@/components/HolographicStatue4";

function CyborgTempleScene({ 
  onLoad, 
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
  hover = false,
  rotate = false,
  isPlaying = false,
  is80sMode = false,
  showAnnotations = true, // Add prop to control annotation visibility
  candleData = [], // Array of user data for candles - can be passed from parent or will use Firestore data
  onCandleClick = null, // Callback when candle is clicked
  onPaginationReady = null, // Callback to expose pagination controls
  onAnnotationClick = null, // Callback when annotation is clicked
  onViewerStateChange = null // Callback to notify parent about viewer state
}) {
  // console.log('[CyborgTempleScene] Component rendered with isPlaying:', isPlaying);
  const sceneRef = useRef();
  const groupRef = useRef();
  const { scene, camera, gl, raycaster, pointer } = useThree();
  
  // Fetch results from Firestore if no candleData provided
  const firestoreResults = useFirestoreResults();
  const results = candleData.length > 0 ? candleData : firestoreResults;
  const initialY = useRef(position[1]);
  const mixerRef = useRef();
  const hasLoadedRef = useRef(false);
  const [modelLoaded, setModelLoaded] = useState(false);
  const actionsRef = useRef({});
  const chandelierRef = useRef();
  const chandelierInitialRotation = useRef();
  const danceTimeoutRef = useRef(null);
  
  // Candle pagination state
  const [currentCandlePage, setCurrentCandlePage] = useState(0);
  const [candleRefs, setCandleRefs] = useState([]);
  const [hoveredCandle, setHoveredCandle] = useState(null);
  const candlesPerPage = 8;
  const totalCandlePages = Math.ceil(results.length / candlesPerPage);
  
  // Note: FloatingCandleViewer state has been moved to parent component to render outside Canvas

  // Use useMemo to prevent recreating the loader on every render
  const loader = useMemo(() => {
    const gltfLoader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath("/draco/");
    gltfLoader.setDRACOLoader(dracoLoader);
    return gltfLoader;
  }, []);
  
  // Update candle visibility based on current page
  // Texture cache to avoid reloading the same images
  const textureCache = useRef(new Map());
  
  // Optimized texture loading for better performance with many images
  const loadOptimizedTexture = useCallback((url, onLoad) => {
    // Check cache first
    if (textureCache.current.has(url)) {
      onLoad(textureCache.current.get(url));
      return;
    }
    
    // Create a canvas for image processing and resizing
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    
    // Use 128x128 for efficient memory usage with dozens of candles
    // This is sufficient for candle labels and keeps memory usage low
    const targetSize = 128; 
    canvas.width = targetSize;
    canvas.height = targetSize;
    
    const img = new Image();
    img.crossOrigin = "anonymous";
    
    img.onload = () => {
      // Calculate aspect ratio to maintain proportions
      const aspectRatio = img.width / img.height;
      let drawWidth = targetSize;
      let drawHeight = targetSize;
      
      // Adjust dimensions to maintain aspect ratio
      if (aspectRatio > 1) {
        drawHeight = targetSize / aspectRatio;
      } else {
        drawWidth = targetSize * aspectRatio;
      }
      
      // Center the image on the canvas
      const offsetX = (targetSize - drawWidth) / 2;
      const offsetY = (targetSize - drawHeight) / 2;
      
      // Clear and draw
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, targetSize, targetSize);
      ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
      
      // Create texture from canvas
      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.flipY = false; // Keep original orientation
      
      // Disable mipmaps for small textures to save memory
      texture.generateMipmaps = false;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.needsUpdate = true;
      
      // Cache the texture
      textureCache.current.set(url, texture);
      
      // Call the callback with the optimized texture
      onLoad(texture);
    };
    
    img.onerror = (error) => {
      console.warn('Failed to load image:', url, error);
    };
    
    img.src = url;
  }, []);

  // Function to apply user image to candle labels
  const applyUserImageToLabel = useCallback((candle, user) => {
    if (!user?.image) return;
    
    loadOptimizedTexture(user.image, (texture) => {
      candle.traverse((child) => {
        // Only apply to Label2 objects (keep Label1 blank for messages in viewer)
        if (child.name?.includes('Label2') && child.isMesh) {
          if (child.material) {
            // Dispose of old material to free memory
            if (child.material.map) {
              // Don't dispose cached textures
              if (!textureCache.current.has(user.image)) {
                child.material.map.dispose();
              }
            }
            
            // Create new material with the texture
            child.material = child.material.clone();
            child.material.map = texture;
            child.material.transparent = true;
            child.material.needsUpdate = true;
          }
        }
        // Keep Label1 blank - it will be used for messages in the FloatingCandleViewer
        else if (child.name?.includes('Label1') && child.isMesh) {
          // Optionally, you could set Label1 to a blank/default texture or color
          if (child.material) {
            child.material = child.material.clone();
            // Keep the original material or set a blank color
            child.material.color = new THREE.Color(0xf5f5dc); // Parchment color
            child.material.needsUpdate = true;
          }
        }
      });
    });
  }, [loadOptimizedTexture]);

  const updateCandleVisibility = useCallback((candles, page) => {
    // Sort results by burnedAmount (highest first)
    const sortedResults = [...results].sort((a, b) => 
      (b.burnedAmount || 0) - (a.burnedAmount || 0)
    );
    
    const start = page * candlesPerPage;
    const end = start + candlesPerPage;
    const pageResults = sortedResults.slice(start, end);
    
    candles.forEach((candle, index) => {
      // Only show candles that have corresponding user data
      const userData = pageResults[index];
      const shouldBeVisible = index < pageResults.length;
      
      candle.visible = shouldBeVisible;
      
      if (shouldBeVisible && userData) {
        // Apply user data to the candle
        candle.userData = { 
          ...candle.userData, 
          ...userData,
          hasUser: true,
          userName: userData.userName || userData.username || 'Anonymous',
          userId: userData.id,
          burnedAmount: userData.burnedAmount || 0,
          image: userData.image,
          message: userData.message,
          createdAt: userData.createdAt
        };
        
        // Apply user image to candle labels
        applyUserImageToLabel(candle, userData);
      } else {
        // Hide candles without user data
        candle.visible = false;
      }
    });
  }, [results, applyUserImageToLabel]);
  

  // Handle candle click - notify parent to show the FloatingCandleViewer
  const handleCandleClick = (candleIndex) => {
    const sortedResults = [...results].sort((a, b) => 
      (b.burnedAmount || 0) - (a.burnedAmount || 0)
    );
    const actualIndex = currentCandlePage * candlesPerPage + candleIndex;
    const candleData = sortedResults[actualIndex];
    
    if (candleData && onCandleClick) {
      // Pass the candle data to parent to handle viewer display
      const viewerData = {
        ...candleData,
        candleId: `candle-${actualIndex}`,
        candleTimestamp: Date.now(),
      };
      
      // Pass all necessary data to parent
      onCandleClick(actualIndex, viewerData, sortedResults);
    }
  };
  
  // Handle page change
  const changeCandlePage = (newPage) => {
    if (newPage >= 0 && newPage < totalCandlePages) {
      setCurrentCandlePage(newPage);
      updateCandleVisibility(candleRefs, newPage);
    }
  };

  useEffect(() => {
    if (hasLoadedRef.current) return;

    let isCurrentInstance = true;

    loader.load("/models/templeScene3.glb", (gltf) => {
      if (!isCurrentInstance) return;

      const templeScene = gltf.scene;
      
      // Debug: Log all objects in the scene

      // Create and store the animation mixer
      const mixer = new THREE.AnimationMixer(templeScene);
      mixerRef.current = mixer;

      // Play specific animations based on character
      if (gltf.animations.length > 0) {
   
        
        // Store all actions for later use
        gltf.animations.forEach((animation) => {
          const animName = animation.name;
          const action = mixer.clipAction(animation);
          actionsRef.current[animName] = action;
        });
        
        // Play initial animations
        gltf.animations.forEach((animation) => {
          const animName = animation.name;
          const action = actionsRef.current[animName];
          
          // Check which character this animation belongs to based on suffix
          if (animName === 'TYPE1') {
            // Play TYPE animation for the first character (no suffix)
            action.play();
            console.log(`Playing TYPE animation: ${animation.name}`);
          } else if (animName === 'HaloRotation') {
            // Play HaloRotation animation
            action.play();
            console.log(`Playing HaloRotation animation: ${animation.name}`);
          } else if (animName === 'Idle.001' || animName === 'Idle.002' || animName === 'Idle.003') {
            // Play idle animations with different time offsets
            
            // Set different starting times based on animation name
            if (animName === 'Idle.001') {
              action.time = Math.random() * action.getClip().duration; // Random offset
            } else if (animName === 'Idle.002') {
              action.time = action.getClip().duration * 0.33; // Start 1/3 through
            } else if (animName === 'Idle.003') {
              action.time = action.getClip().duration * 0.66; // Start 2/3 through
            }
            
            action.play();
            console.log(`Playing idle animation: ${animation.name} with offset ${action.time}`);
          }
        });
      }

      // Create an anchor group with initial position
      const anchorGroup = new THREE.Group();
      anchorGroup.position.set(position[0], position[1], position[2]);
      initialY.current = position[1];

      // Create a rotation group
      const rotationGroup = new THREE.Group();

      // Set up the hierarchy
      anchorGroup.add(rotationGroup);
      rotationGroup.add(templeScene);

      // Store refs
      sceneRef.current = templeScene;
      groupRef.current = { anchor: anchorGroup, rotation: rotationGroup };

      // Apply scale and rotation from props
      templeScene.scale.set(scale[0], scale[1], scale[2]);
      templeScene.rotation.set(rotation[0], rotation[1], rotation[2]);

      // Center the scene in the rotation group
      const box = new THREE.Box3().setFromObject(templeScene);
      const center = box.getCenter(new THREE.Vector3());
      templeScene.position.sub(center);

      // The model will use its original materials from the GLB file
      
      // Find and store the chandelier object
      const chandelier = templeScene.getObjectByName('ChandelierMain');
      if (chandelier) {
        chandelierRef.current = chandelier;
        // Store the initial rotation for reference
        chandelierInitialRotation.current = {
          x: chandelier.rotation.x,
          y: chandelier.rotation.y,
          z: chandelier.rotation.z
        };
        console.log('[CyborgTempleScene] Found chandelier:', chandelier.name);
      } else {
        console.log('[CyborgTempleScene] ChandelierMain not found in scene');
      }
      
      // Video texture configuration for goldCircuit
      const videoTextureConfig = {
        path: "/videos/circuit1.mp4",
        repeat: { x: 1, y: 1 },
        offset: { x: 0, y: 0 },
        anisotropy: 16,
        rotation: 0,
        emissive: true,
        emissiveIntensity: 0.3,
      };
      
      // Apply video texture to goldCircuit
      let videoElement = null;
      let videoTexture = null;
      
      templeScene.traverse(child => {
        if (child.isMesh && (child.name === "goldCircuit" || child.name.includes("goldCircuit"))) {
          console.log('🎬 Found goldCircuit mesh:', child.name);
          
          // Store original material if not already stored
          if (!child.userData.originalTexture && child.material) {
            if (child.material.map) {
              child.userData.originalTexture = child.material.map;
            }
            child.userData.originalMaterial = child.material.clone();
          }
          
          // Ensure goldCircuit is visible
          child.visible = true;
          
          // Create video element
          videoElement = document.createElement('video');
          videoElement.src = videoTextureConfig.path;
          videoElement.loop = true;
          videoElement.muted = true;
          videoElement.playsInline = true;
          videoElement.autoplay = true;
          videoElement.crossOrigin = "anonymous";
          videoElement.setAttribute('webkit-playsinline', 'webkit-playsinline');
          
          // Add event listeners for debugging
          videoElement.addEventListener('loadeddata', () => {
            console.log('🎬 Video loaded successfully');
            if (videoTexture) {
              videoTexture.needsUpdate = true;
            }
          });
          
          videoElement.addEventListener('playing', () => {
            console.log('🎬 Video is playing');
          });
          
          videoElement.addEventListener('error', (e) => {
            console.error('🎬 Video loading error:', e);
            console.error('🎬 Video src:', videoElement.src);
          });
          
          // Start playing the video only after it's ready
          const playVideo = () => {
            if (!videoElement.paused) {
              console.log('🎬 Video already playing');
              return;
            }
            
            if (videoElement.readyState >= 2) {
              videoElement.play().catch(err => {
                console.warn('🎬 Video autoplay failed:', err);
              });
            } else {
              console.log('🎬 Video not ready yet, waiting for canplay event');
            }
          };
          
          videoElement.addEventListener('canplay', playVideo);
          
          // Function to create and apply texture once video is ready
          const createAndApplyTexture = () => {
            console.log('🎬 Creating video texture for goldCircuit');
            
            // Create video texture
            videoTexture = new THREE.VideoTexture(videoElement);
            videoTexture.colorSpace = THREE.SRGBColorSpace;
            videoTexture.wrapS = THREE.RepeatWrapping;
            videoTexture.wrapT = THREE.RepeatWrapping;
            videoTexture.repeat.set(videoTextureConfig.repeat.x, videoTextureConfig.repeat.y);
            videoTexture.offset.set(videoTextureConfig.offset.x, videoTextureConfig.offset.y);
            videoTexture.anisotropy = videoTextureConfig.anisotropy;
            videoTexture.rotation = videoTextureConfig.rotation;
            videoTexture.minFilter = THREE.LinearFilter;
            videoTexture.magFilter = THREE.LinearFilter;
            videoTexture.format = THREE.RGBFormat;
            videoTexture.needsUpdate = true;
            
            // Apply video texture to material
            const applyVideoMaterial = mat => {
              mat.map = videoTexture;
              mat.emissive = new THREE.Color(0xffffff);
              mat.emissiveMap = videoTexture;
              mat.emissiveIntensity = videoTextureConfig.emissiveIntensity;
              mat.roughness = 0.6;
              mat.metalness = 0.3;
              mat.transparent = false;
              mat.opacity = 1;
              mat.side = THREE.DoubleSide;
              mat.needsUpdate = true;
              
              console.log('🎬 Applied video texture to goldCircuit material');
            };
            
            if (Array.isArray(child.material)) {
              child.material.forEach(applyVideoMaterial);
            } else {
              applyVideoMaterial(child.material);
            }
            
            // Store video element and texture
            child.userData.videoElement = videoElement;
            child.userData.videoTexture = videoTexture;
            
            // Try to play the video
            playVideo();
          };
          
          // Wait for video to have metadata before creating texture
          if (videoElement.readyState >= 1) {
            console.log('🎬 Video already has metadata, creating texture immediately');
            createAndApplyTexture();
          } else {
            console.log('🎬 Waiting for video metadata before creating texture');
            videoElement.addEventListener('loadedmetadata', createAndApplyTexture, { once: true });
          }
          
          // Store references for cleanup
          child.userData.videoElement = videoElement;
          child.userData.playVideoHandler = playVideo;
          child.userData.createTextureHandler = createAndApplyTexture;
        }
      });
      
      // Find and store candle references
      const foundCandles = [];
      templeScene.traverse((child) => {
        if (child.name && child.name.startsWith('VCANDLE')) {
          foundCandles.push(child);
          console.log('[CyborgTempleScene] Found candle:', child.name);
          
          // Make candles interactive
          child.userData.isCandle = true;
          child.userData.originalScale = child.scale.clone();
          
          // Add click handler to candle
          child.traverse((subChild) => {
            if (subChild.isMesh) {
              subChild.userData.candleIndex = foundCandles.length - 1;
              subChild.userData.candleName = child.name;
            }
          });
        }
      });
      
      // Sort candles by name to ensure consistent ordering
      foundCandles.sort((a, b) => a.name.localeCompare(b.name));
      setCandleRefs(foundCandles);
      console.log(`[CyborgTempleScene] Found ${foundCandles.length} candles`);
      
      // Apply initial candle visibility based on pagination
      updateCandleVisibility(foundCandles, 0);
     
      // Create grid ground
      const gridHelper = new THREE.GridHelper(50, 50, 0x00ff41, 0x00ff41);
      gridHelper.material.opacity = 0.3;
      gridHelper.material.transparent = true;
      gridHelper.position.y = -2.7; // Adjust this value to raise/lower the grid
      anchorGroup.add(gridHelper);

      // Add the anchor group to the scene
      scene.add(anchorGroup);
      hasLoadedRef.current = true;
      setModelLoaded(true); // Signal that model is loaded

      // Delay notifying parent to allow child components to initialize
      setTimeout(() => {
        if (onLoad) {
          onLoad();
        }
      }, 100);
    });

    // Cleanup function
    return () => {
      isCurrentInstance = false;

      // Dispose of cached textures
      textureCache.current.forEach((texture, key) => {
        if (texture && texture.dispose) {
          texture.dispose();
        }
      });
      textureCache.current.clear();

      // Clear any pending timeouts
      if (danceTimeoutRef.current) {
        clearTimeout(danceTimeoutRef.current);
        danceTimeoutRef.current = null;
      }

      // Stop all animations
      if (mixerRef.current) {
        mixerRef.current.stopAllAction();
        mixerRef.current = null;
      }

      // Remove the scene and dispose of resources
      if (groupRef.current?.anchor) {
        groupRef.current.anchor.traverse((child) => {
          // Clean up video texture for goldCircuit
          if (child.userData.videoElement) {
            console.log('🧹 Cleaning up goldCircuit video element');
            if (child.userData.playVideoHandler) {
              child.userData.videoElement.removeEventListener('canplay', child.userData.playVideoHandler);
            }
            if (child.userData.createTextureHandler) {
              child.userData.videoElement.removeEventListener('loadedmetadata', child.userData.createTextureHandler);
            }
            child.userData.videoElement.pause();
            child.userData.videoElement.removeAttribute('src');
            child.userData.videoElement.load();
            child.userData.videoElement = null;
            child.userData.playVideoHandler = null;
            child.userData.createTextureHandler = null;
          }
          if (child.userData.videoTexture) {
            console.log('🧹 Disposing goldCircuit video texture');
            child.userData.videoTexture.dispose();
            child.userData.videoTexture = null;
          }
          
          if (child.isMesh) {
            if (child.geometry) {
              child.geometry.dispose();
            }
            if (child.material) {
              if (Array.isArray(child.material)) {
                child.material.forEach((material) => material.dispose());
              } else {
                child.material.dispose();
              }
            }
          }
        });

        scene.remove(groupRef.current.anchor);
        groupRef.current = null;
      }

      if (sceneRef.current) {
        sceneRef.current = null;
      }

      hasLoadedRef.current = false;
    };
  }, [scene, loader]); // Remove props from dependencies to prevent reloading

  
  
  // Effect to handle animation switching when isPlaying changes
  useEffect(() => {
    if (!mixerRef.current || Object.keys(actionsRef.current).length === 0) {
      console.log('[CyborgTempleScene] Animation switching skipped - mixer or actions not ready');
      return;
    }
    
    const actions = actionsRef.current;
    
    // Log available animations to help identify dance animations
    console.log('[CyborgTempleScene] Switching animations. isPlaying:', isPlaying);
    console.log('[CyborgTempleScene] Available animations:', Object.keys(actions));
    
    if (isPlaying) {
      console.log('[CyborgTempleScene] Music started, characters will start dancing in 2 seconds...');
      
      // Clear any existing timeout
      if (danceTimeoutRef.current) {
        clearTimeout(danceTimeoutRef.current);
      }
      
      // Keep TYPE animation running for the first character
      if (actions['TYPE1'] && !actions['TYPE1'].isRunning()) {
        actions['TYPE1'].play();
      }
      
      // Delay the dance animations by 2 seconds
      danceTimeoutRef.current = setTimeout(() => {
        console.log('[CyborgTempleScene] Starting dance animations after delay...');
        
        // Only stop idle animations for characters that will dance
        ['Idle.001', 'Idle.002', 'Idle.003'].forEach(idleAnim => {
          if (actions[idleAnim]) {
            actions[idleAnim].stop();
          }
        });
        
        // Play dance animations with time offsets
        ['Dance.001', 'Dance.002', 'Dance.003'].forEach((danceAnim) => {
          if (actions[danceAnim]) {
            actions[danceAnim].reset();
            
            // Set different starting times based on animation name
            if (danceAnim === 'Dance.001') {
              actions[danceAnim].time = Math.random() * actions[danceAnim].getClip().duration; // Random offset
            } else if (danceAnim === 'Dance.002') {
              actions[danceAnim].time = actions[danceAnim].getClip().duration * 0.33; // Start 1/3 through
            } else if (danceAnim === 'Dance.003') {
              actions[danceAnim].time = actions[danceAnim].getClip().duration * 0.66; // Start 2/3 through
            }
            
            actions[danceAnim].play();
            console.log(`✅ Playing dance animation: ${danceAnim} with offset ${actions[danceAnim].time}`);
          }
        });
      }, 2000); // 2 second delay
      
    } else {
      // Switch back to idle animations
      console.log('[CyborgTempleScene] Switching back to idle animations');
      
      // Clear any pending dance timeout
      if (danceTimeoutRef.current) {
        clearTimeout(danceTimeoutRef.current);
        danceTimeoutRef.current = null;
      }
      
      // Stop dance animations
      ['Dance.001', 'Dance.002', 'Dance.003'].forEach(danceAnim => {
        if (actions[danceAnim]) {
          actions[danceAnim].stop();
        }
      });
      
      // Make sure TYPE animation is still playing for the first character
      if (actions['TYPE1'] && !actions['TYPE1'].isRunning()) {
        actions['TYPE1'].reset().play();
        console.log('Ensuring TYPE animation continues');
      }
      
      // Resume idle animations with time offsets
      ['Idle.001', 'Idle.002', 'Idle.003'].forEach((idleAnim) => {
        if (actions[idleAnim]) {
          actions[idleAnim].reset();
          
          // Restore time offsets
          if (idleAnim === 'Idle.001') {
            actions[idleAnim].time = Math.random() * actions[idleAnim].getClip().duration;
          } else if (idleAnim === 'Idle.002') {
            actions[idleAnim].time = actions[idleAnim].getClip().duration * 0.33;
          } else if (idleAnim === 'Idle.003') {
            actions[idleAnim].time = actions[idleAnim].getClip().duration * 0.66;
          }
          
          actions[idleAnim].play();
          console.log(`Resuming idle animation: ${idleAnim}`);
        }
      });
    }
  }, [isPlaying]);

  useFrame((state, delta) => {
    // Update the animation mixer
    if (mixerRef.current) {
      mixerRef.current.update(delta);
    }

    // Apply gentle sway to chandelier
    if (chandelierRef.current && chandelierInitialRotation.current) {
      // Create a gentle swaying motion using sine waves
      const time = state.clock.elapsedTime;
      
      // Small amplitude swaying on X and Z axes to simulate hanging motion
      // Using different frequencies for more natural movement
      const swayAmplitude = 0.05; // Adjust this for more/less sway (in radians)
      const swayX = Math.sin(time * 0.7) * swayAmplitude;
      const swayZ = Math.sin(time * 0.5 + Math.PI / 4) * swayAmplitude * 0.7;
      
      // Apply the sway relative to initial rotation
      chandelierRef.current.rotation.x = chandelierInitialRotation.current.x + swayX;
      chandelierRef.current.rotation.z = chandelierInitialRotation.current.z + swayZ;
    }
    
    // Handle candle hover effects
    if (candleRefs.length > 0) {
      // Cast ray from pointer
      raycaster.setFromCamera(pointer, camera);
      
      // Check for intersections with visible candles
      const visibleCandles = candleRefs.filter(c => c.visible);
      const meshes = [];
      visibleCandles.forEach(candle => {
        candle.traverse(child => {
          if (child.isMesh && child.userData.candleIndex !== undefined) {
            meshes.push(child);
          }
        });
      });
      
      const intersects = raycaster.intersectObjects(meshes, false);
      
      if (intersects.length > 0) {
        const candleIndex = intersects[0].object.userData.candleIndex;
        if (hoveredCandle !== candleIndex) {
          setHoveredCandle(candleIndex);
          document.body.style.cursor = 'pointer';
        }
      } else if (hoveredCandle !== null) {
        setHoveredCandle(null);
        document.body.style.cursor = 'default';
      }
      
      // Apply hover animation to candles
      visibleCandles.forEach((candle, index) => {
        const isHovered = hoveredCandle === index;
        const targetScale = isHovered ? 1.1 : 1;
        
        // Smooth scale animation
        candle.scale.x = THREE.MathUtils.lerp(candle.scale.x, candle.userData.originalScale.x * targetScale, delta * 5);
        candle.scale.y = THREE.MathUtils.lerp(candle.scale.y, candle.userData.originalScale.y * targetScale, delta * 5);
        candle.scale.z = THREE.MathUtils.lerp(candle.scale.z, candle.userData.originalScale.z * targetScale, delta * 5);
        
        // Flame flicker effect
        candle.traverse((child) => {
          if (child.name?.toLowerCase().includes('flame') && child.isMesh) {
            const flicker = Math.sin(state.clock.elapsedTime * 10 + index) * 0.1 + 0.9;
            if (child.material && child.material.emissiveIntensity !== undefined) {
              child.material.emissiveIntensity = flicker * (isHovered ? 1.5 : 1);
            }
          }
        });
      });
    }

    if (sceneRef.current && groupRef.current) {
      // Apply hover animation to the anchor group only if hover is enabled
      // if (hover) {
      //   groupRef.current.anchor.position.y =
      //     initialY.current + Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
      // }

      // Apply rotation to the rotation group only if rotate is enabled
      // if (rotate) {
      //   groupRef.current.rotation.rotation.y += delta * 0.3;
      // }
    }
  });

  // Add click event listener
  useEffect(() => {
    if (!modelLoaded || candleRefs.length === 0) return;
    
    const handleClick = () => {
      if (hoveredCandle !== null) {
        handleCandleClick(hoveredCandle);
      }
    };
    
    gl.domElement.addEventListener('click', handleClick);
    
    return () => {
      gl.domElement.removeEventListener('click', handleClick);
    };
  }, [gl, hoveredCandle, modelLoaded, candleRefs]);

  // Re-update candle visibility when results change
  useEffect(() => {
    if (candleRefs.length > 0 && results.length > 0) {
      updateCandleVisibility(candleRefs, currentCandlePage);
    }
  }, [results, candleRefs, currentCandlePage, updateCandleVisibility]);

  // Toggle floor textures when 80s mode changes
  useEffect(() => {
    if (!sceneRef.current) return;

    // Create a texture loader
    const textureLoader = new THREE.TextureLoader();

    // Texture configuration for 80s carpet
    const textureConfig = {
      path: "/80carpet.png", // Path to texture file
      repeat: { x: 4, y: 4 }, // Tiling (higher numbers = smaller pattern)
      offset: { x: 0.5, y: 0.5 }, // Offset (0-1 range)
      anisotropy: 16, // Texture quality at angles (higher = better quality)
      rotation: 0, // Rotation in radians
      emissive: true, // Enable emissive effect for neon glow
      emissiveIntensity: 0.6, // Intensity of the glow (0-1 range)
    };

    // Function to apply texture with settings
    const applyTextureWithSettings = (texture, config) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(config.repeat.x, config.repeat.y);
      texture.offset.set(config.offset.x, config.offset.y);
      texture.anisotropy = config.anisotropy;
      texture.rotation = config.rotation;
      texture.needsUpdate = true;
      return texture;
    };

    let floorFound = false;

    sceneRef.current.traverse(child => {
      // Check for any mesh with "Floor" in its name, but exclude goldCircuit
      if (child.isMesh && 
          (child.name === "Floor" || child.name === "Floor2.002" || child.name.includes("Floor2")) &&
          !child.name.includes("goldCircuit")) {
        floorFound = true;
        
        console.log('🏠 Found floor mesh:', child.name);
        
        // Store the original texture if we haven't already
        if (!child.userData.originalTexture && child.material) {
          if (child.material.map) {
            child.userData.originalTexture = child.material.map;
          }
        }

        // Toggle between original and 80s texture
        if (is80sMode) {
          console.log('🎨 Applying 80s carpet texture to floor');
          
          // Check if texture is already cached
          if (textureCache.current.has('80carpet')) {
            const configuredTexture = textureCache.current.get('80carpet');
            // Apply to material
            const applyMaterial = mat => {
              mat.map = configuredTexture;
              
              if (textureConfig.emissive) {
                mat.emissive = new THREE.Color(0xffffff);
                mat.emissiveMap = configuredTexture;
                mat.emissiveIntensity = textureConfig.emissiveIntensity;
              }
              
              mat.needsUpdate = true;
            };
            
            if (Array.isArray(child.material)) {
              child.material.forEach(applyMaterial);
            } else {
              applyMaterial(child.material);
            }
          } else {
            // Load texture only if not cached
            textureLoader.load(
            textureConfig.path, 
            // Success callback
            texture => {
              console.log('✅ 80s carpet texture loaded successfully');
              
              // Apply texture settings
              const configuredTexture = applyTextureWithSettings(texture, textureConfig);
              
              // Cache the texture
              textureCache.current.set('80carpet', configuredTexture);
              
              // Apply to material
              const applyMaterial = mat => {
                mat.map = configuredTexture;
                
                if (textureConfig.emissive) {
                  mat.emissive = new THREE.Color(0xffffff);
                  mat.emissiveMap = configuredTexture;
                  mat.emissiveIntensity = textureConfig.emissiveIntensity;
                }
                
                mat.needsUpdate = true;
              };

              // If the material is an array, update all materials
              if (Array.isArray(child.material)) {
                child.material.forEach(applyMaterial);
              } else {
                // Single material
                applyMaterial(child.material);
              }
            },
            // Progress callback
            progress => {
              // Optional: log progress
            },
            // Error callback
            error => {
              console.error('❌ Failed to load 80s carpet texture:', error);
              console.error('❌ Texture path was:', textureConfig.path);
            }
          );
          }
        } else if (child.userData.originalTexture) {
          // Restore original material more efficiently
          console.log('🔄 Restoring original floor texture');
          
          const restoreMaterial = (mat) => {
            mat.map = child.userData.originalTexture;
            mat.emissive = new THREE.Color(0x000000);
            mat.emissiveIntensity = 0;
            mat.emissiveMap = null;
            mat.needsUpdate = true;
          };
          
          if (Array.isArray(child.material)) {
            child.material.forEach(restoreMaterial);
          } else {
            restoreMaterial(child.material);
          }
        }
      }
    });
    
    if (!floorFound) {
      console.warn('⚠️ Floor object not found in the model');
    }
  }, [is80sMode]); // Re-run when is80sMode changes

  // Expose pagination controls to parent
  useEffect(() => {
    if (onPaginationReady && candleRefs.length > 0) {
      onPaginationReady({
        currentPage: currentCandlePage,
        totalPages: totalCandlePages,
        candlesPerPage,
        totalCandles: results.length,
        changePage: changeCandlePage
      });
    }
  }, [onPaginationReady, currentCandlePage, totalCandlePages, results.length, candleRefs.length]);

  // Define annotation points - adjust positions based on your temple scene
  const annotations = [
    // {
    //   position: [0, 0, 0], // Near the main altar/center
    //   text: "Sacred Altar\nThe heart of the cyborg temple",
    //   customCamera: {
    //     position: [2, -0.8, -0.3], // Camera moved right and lower
    //     lookAt: [0, -0.5, 0], // Look outward toward the characters
    //     distance: 2 // Slightly increased distance for better framing
    //   },
    //   annotationOffset: [20, 150] // [x, y] offset in pixels from center
    // },
    // {
    //   position: [2, 0, -2], // Right side
    //   text: "Digital Offering Station\nPlace virtual candles here"
    // },

    {
      position: [0.3, -1.6, 2], 
      text: "",
      customCamera: {
        position: [0, -1.8, 1.8], // Camera moved right and lower
        lookAt: [0, -1.6, 1.6], // Look outward toward the characters
        distance: 2 // Slightly increased distance for better framing
      },
      annotationOffset: [920, 950] // [x, y] offset in pixels from center
    },
    {
      position: [-2, -0.99, 0.3], // Left side
      text: "The 3 Wise Mechs",
      // Special camera settings for viewing characters from center
      customCamera: {
        position: [2, -1.8, -0.7], // Camera moved right and lower
        lookAt: [-3, -1.5, 0.5], // Look outward toward the characters
        distance: 2.9 // Slightly increased distance for better framing
      },
      // Custom annotation position for this view (in screen space)
      annotationOffset: [50, 150] // [x, y] offset in pixels from center
    },
  ];

  return (
    <>
      {modelLoaded && <VideoBackground is80sMode={is80sMode} />}
      {modelLoaded && <TickerDisplay3 is80sMode={is80sMode} />}
      {modelLoaded && <VideoScreens />}
      {modelLoaded && <SimpleGlitchTint />}
      {modelLoaded && <HolographicStatue4/>}
      {modelLoaded && showAnnotations && <AnnotationSystem 
        annotations={annotations} 
        is80sMode={is80sMode} 
        onAnnotationClick={onAnnotationClick}
        scale={0.8}
        textScale={0.8}
      />}

    </>
  );
}

export default memo(CyborgTempleScene);