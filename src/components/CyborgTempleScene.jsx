
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
import { vcandlePositions } from "@/data/vcandlePositions";


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
  onViewerStateChange = null, // Callback to notify parent about viewer state
  onDroneDeliveryReady = null, // Callback to expose drone delivery function
  pendingCandleDelivery = null, // New candle waiting to be delivered
  onDeliveryComplete = null, // Callback when delivery is complete
  orbitControlsRef = null, // Reference to OrbitControls from parent
  isModalOpen = false // Track if the create candle modal is open
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
  
  // Drone control state
  const droneRef = useRef();
  const droneCandleRef = useRef(); // Reference to the candle carried by drone
  const [droneTargetPosition, setDroneTargetPosition] = useState(0); // Index of target candle
  const [isDroneStaging, setIsDroneStaging] = useState(false); // Coming to front of screen
  const [isDroneMoving, setIsDroneMoving] = useState(false);
  const [isDroneLowering, setIsDroneLowering] = useState(false);
  const [isDroneRising, setIsDroneRising] = useState(false);
  const [isDroneReturning, setIsDroneReturning] = useState(false); // Returning to home position
  const [pendingDeliveryTimestamp, setPendingDeliveryTimestamp] = useState(null); // Track newly created candle
  const droneBaseHeight = 3.2; // Normal flying height (reduced to be closer to floor)
  const droneLowerHeight = 2.4; // Height when dropping candle (near floor level)
  const droneLateralOffset = { x: 0, z: 0 }; // No lateral offset - deliver directly to candle position
  const droneInspectionTimeRef = useRef(null);
  const droneHomePosition = { x: 10, y: 0, z: 0 }; // Off-screen starting position
  const droneStagingPosition = { x: 0, y: 3, z: 5 }; // Front center of screen for showcase
  
  // Waypoint navigation for drone
  const droneWaypointsRef = useRef([]);
  const currentWaypointIndexRef = useRef(0);
  const templeRadius = 4.5; // Radius to fly around temple (adjust based on your temple size)
  
  // Store reference to startDroneDelivery
  const startDroneDeliveryRef = useRef(null);
  
  // Fixed camera positioning values (previously from GUI)
  const cameraControls = {
    behindDistance: 3, // How far behind target
    sideDistance: 3, // How far to the side
    cameraHeight: 0 // Camera height
  };
  
  // Camera tracking for drone delivery
  const [isCameraFollowingDrone, setIsCameraFollowingDrone] = useState(false);
  const originalCameraPositionRef = useRef(null);
  const originalCameraTargetRef = useRef(null);
  const cameraFollowStartTimeRef = useRef(null);
  const cameraAnimationFrameRef = useRef(null); // Track animation frame for cleanup
  const pendingTimeoutsRef = useRef(new Set()); // Track all timeouts for cleanup
  const cameraTransitionStartRef = useRef(null); // For smooth camera transition
  const cameraTransitionDuration = 4500; // 4.5 seconds - slower to better sync with drone arrival
  const loadingImagesRef = useRef(new Map()); // Track loading images for cleanup
  const processedCandleIdsRef = useRef(new Set()); // Track which candles have been processed for drone delivery
  
  // Candle pagination state
  const [currentCandlePage, setCurrentCandlePage] = useState(0);
  const [candleRefs, setCandleRefs] = useState([]);
  const candleRefsRef = useRef([]); // Store candle refs in a ref as well
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
  // Texture cache to avoid reloading the same images (with size limit)
  const textureCache = useRef(new Map());
  const MAX_TEXTURE_CACHE_SIZE = 50; // Limit cache to 50 textures
  
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
    
    // Track this image for cleanup
    loadingImagesRef.current.set(url, img);
    
    // Add event listeners before setting src
    img.onload = () => {
      console.log(`[loadOptimizedTexture] Image loaded successfully: ${url} (${img.width}x${img.height})`);
      
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
      
      // Cache the texture with size limit
      if (textureCache.current.size >= MAX_TEXTURE_CACHE_SIZE) {
        // Remove oldest entry when cache is full
        const firstKey = textureCache.current.keys().next().value;
        const oldTexture = textureCache.current.get(firstKey);
        if (oldTexture && oldTexture.dispose) {
          oldTexture.dispose();
        }
        textureCache.current.delete(firstKey);
      }
      textureCache.current.set(url, texture);
      
      console.log(`[loadOptimizedTexture] Texture created and cached for: ${url}`);
      
      // Remove from tracking since it's loaded
      loadingImagesRef.current.delete(url);
      
      // Call the callback with the optimized texture
      onLoad(texture);
    };
    
    img.onerror = (error) => {
      console.error('[loadOptimizedTexture] Failed to load image:', url, error);
      // Remove from tracking on error too
      loadingImagesRef.current.delete(url);
    };
    
    // Set src after event listeners are attached
    console.log(`[loadOptimizedTexture] Attempting to load image from: ${url}`);
    img.src = url;
  }, []);

  // Function to apply user image to candle labels
  const applyUserImageToLabel = useCallback((candle, user) => {
    try {
      if (!user?.image) {
        console.log(`[applyUserImageToLabel] No image for user ${user?.userName}`);
        return;
      }
      
      console.log(`[applyUserImageToLabel] Loading image for ${user.userName}: ${user.image}`);
      console.log(`[applyUserImageToLabel] loadOptimizedTexture function exists:`, typeof loadOptimizedTexture);
      
      if (typeof loadOptimizedTexture !== 'function') {
        console.error('[applyUserImageToLabel] loadOptimizedTexture is not a function!');
        return;
      }
      
      loadOptimizedTexture(user.image, (texture) => {
      console.log(`[applyUserImageToLabel] Texture callback received for ${candle.name}`);
      let labelFound = false;
      candle.traverse((child) => {
        // Apply to Label1 instead of Label2
        if (child.name?.includes('Label1') && child.isMesh) {
          labelFound = true;
          console.log(`[applyUserImageToLabel] Found Label1 mesh in ${candle.name}`);
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
            console.log(`[applyUserImageToLabel] Applied texture to Label1 in ${candle.name}, material:`, child.material);
          }
        }
        // Keep Label2 for potential other use
        else if (child.name?.includes('Label2') && child.isMesh) {
          // Optionally set Label2 to a blank color
          if (child.material) {
            child.material = child.material.clone();
            child.material.color = new THREE.Color(0xf5f5dc); // Parchment color
            child.material.needsUpdate = true;
          }
        }
      });
      
      if (!labelFound) {
        console.warn(`[applyUserImageToLabel] No Label1 found in ${candle.name}`);
      }
    });
    } catch (error) {
      console.error('[applyUserImageToLabel] Error:', error);
    }
  }, [loadOptimizedTexture]);

  const updateCandleVisibility = useCallback((candles, skipNewest = false) => {
    // Sort results by createdAt (oldest first for consistent placement)
    const sortedResults = [...results].sort((a, b) => {
      const aTime = a.createdAt?.getTime ? a.createdAt.getTime() : 0;
      const bTime = b.createdAt?.getTime ? b.createdAt.getTime() : 0;
      return aTime - bTime; // Oldest first
    });
    
    console.log(`[updateCandleVisibility] Showing ${Math.min(candles.length, sortedResults.length)} of ${candles.length} candles for ${sortedResults.length} users`);
    
    let visibleCount = 0;
    
    // Show as many candles as we have user data
    candles.forEach((candle, index) => {
      // Skip null entries in the array
      if (!candle) return;
      
      const userData = sortedResults[index];
      let shouldBeVisible = index < sortedResults.length;
      
      // Skip showing the newest candle if it was just created (will be delivered by drone)
      if (skipNewest && index === sortedResults.length - 1) {
        shouldBeVisible = false;
      }
      
      // Count and log visible candles
      if (shouldBeVisible) {
        visibleCount++;
        console.log(`[updateCandleVisibility] SHOWING: ${candle.name} (index ${index}) with user: ${userData?.userName || 'Unknown'}`);
      }
      
      // Set visibility for the candle and all its children
      candle.visible = shouldBeVisible;
      candle.traverse((child) => {
        child.visible = shouldBeVisible;
      });
      
      if (shouldBeVisible && userData) {
        // Skip updating drone-delivered candles - they already have their data
        if (candle.userData?.isDroneDelivered) {
          console.log(`[updateCandleVisibility] Skipping drone-delivered candle ${candle.name}`);
          return; // Don't update drone-delivered candles
        }
        
        console.log(`[updateCandleVisibility] Processing userData for ${candle.name}:`, {
          userName: userData.userName || userData.username,
          hasImage: !!userData.image,
          imageUrl: userData.image?.substring(0, 50)
        });
        
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
        console.log(`[updateCandleVisibility] Applying image for ${userData.userName || userData.username || 'Anonymous'} to ${candle.name}`);
        applyUserImageToLabel(candle, userData);
      }
    });
    
    console.log(`[updateCandleVisibility] TOTAL VISIBLE CANDLES: ${visibleCount}`);
    if (visibleCount !== sortedResults.length) {
      console.warn(`[updateCandleVisibility] Mismatch! Expected ${sortedResults.length} visible candles but showing ${visibleCount}`);
    }
  }, [results, applyUserImageToLabel]);
  

  // Handle candle click - notify parent to show the FloatingCandleViewer
  const handleCandleClick = (candleIndex) => {
    // Use the same sorting as updateCandleVisibility (oldest first)
    const sortedResults = [...results].sort((a, b) => {
      const aTime = a.createdAt?.getTime ? a.createdAt.getTime() : 0;
      const bTime = b.createdAt?.getTime ? b.createdAt.getTime() : 0;
      return aTime - bTime; // Oldest first, same as display order
    });
    
    // The clicked candle index directly corresponds to the sorted results
    const candleData = sortedResults[candleIndex];
    
    if (candleData && onCandleClick) {
      // Pass the candle data to parent to handle viewer display
      const viewerData = {
        ...candleData,
        candleId: `candle-${candleIndex}`,
        candleTimestamp: Date.now(),
      };
      
      // Pass all necessary data to parent
      onCandleClick(candleIndex, viewerData, sortedResults);
    }
  };
  
  // Handle page change
  const changeCandlePage = (newPage) => {
    if (newPage >= 0 && newPage < totalCandlePages) {
      setCurrentCandlePage(newPage);
      updateCandleVisibility(candleRefs, newPage);
    }
  };
  
  // Function to start drone delivery to a specific candle position
  const startDroneDelivery = useCallback((candleIndex, specificUserData = null) => {
    console.log(`[startDroneDelivery] Called with candleIndex: ${candleIndex}, droneRef:`, !!droneRef.current);
    console.log(`[startDroneDelivery] Current drone states:`, {
      isDroneStaging,
      isDroneMoving,
      isDroneLowering,
      isDroneRising,
      isDroneReturning
    });
    
    // If no index specified, find the next available slot based on results
    let targetIndex = candleIndex;
    if (targetIndex === undefined || targetIndex === null) {
      // Use the number of existing results as the next index
      targetIndex = results.length;
      console.log(`[Drone] Auto-selected position ${targetIndex} for delivery (next available slot)`);
    }
    
    // Get the actual VCANDLE position for this index
    const targetCandleName = `VCANDLE${String(targetIndex).padStart(3, '0')}`;
    let targetPosition = null;
    
    // Check if we have stored VCANDLE positions
    if (window.vcandlePositions && window.vcandlePositions[targetIndex]) {
      targetPosition = window.vcandlePositions[targetIndex].position;
      console.log(`[Drone] Using stored VCANDLE position for ${targetCandleName}:`, targetPosition);
    } else {
      // Try to find the VCANDLE in the scene
      if (sceneRef.current) {
        sceneRef.current.traverse((child) => {
          if (child.name === targetCandleName) {
            const worldPos = new THREE.Vector3();
            child.getWorldPosition(worldPos);
            targetPosition = { x: worldPos.x, y: worldPos.y, z: worldPos.z };
            console.log(`[Drone] Found ${targetCandleName} in scene at:`, targetPosition);
          }
        });
      }
    }
    
    // Fallback to ideal positions if no VCANDLE found
    if (!targetPosition) {
      const idealPositions = window.idealCandlePositions || [
        { x: 0, y: -1.88, z: 2.0 },
        { x: 0.3, y: -1.88, z: 2.05 },
        { x: -0.3, y: -1.88, z: 2.05 },
        { x: 0.6, y: -1.88, z: 2.1 },
        { x: -0.6, y: -1.88, z: 2.1 }
      ];
      targetPosition = idealPositions[targetIndex] || idealPositions[0];
      console.log(`[Drone] Using fallback position for index ${targetIndex}:`, targetPosition);
    }
    
    if (droneRef.current && targetPosition) {
      const targetCandle = {
        name: targetCandleName,
        position: targetPosition
      };
      
      console.log(`[Drone] Delivering to ${targetCandle.name} at position:`, targetCandle.position);
      
      // Clear any inspection timeout if moving to new candle
      if (droneInspectionTimeRef.current) {
        clearTimeout(droneInspectionTimeRef.current);
        droneInspectionTimeRef.current = null;
      }
      
      // Make sure DroneCandle is visible at start of delivery
      if (droneCandleRef.current) {
        droneCandleRef.current.traverse((child) => {
          child.visible = true;
        });
        
        // Mark pending delivery IMMEDIATELY to prevent duplicate candle
        setPendingDeliveryTimestamp(Date.now());
        
        // Apply the user's image to DroneCandle immediately if we have specific user data
        if (specificUserData || pendingCandleDelivery) {
          const userData = specificUserData || pendingCandleDelivery;
          
          if (userData && userData.image) {
            console.log(`[Drone] Applying user image to DroneCandle for ${userData.username || userData.userName || 'New User'}`);
            
            // Apply image to DroneCandle's Label2
            loadOptimizedTexture(userData.image, (texture) => {
              if (droneCandleRef.current) {
                droneCandleRef.current.traverse((child) => {
                  if (child.name?.includes('Label2') && child.isMesh) {
                    if (child.material) {
                      child.material = child.material.clone();
                      child.material.map = texture;
                      child.material.transparent = true;
                      child.material.needsUpdate = true;
                      console.log(`[Drone] Applied user image to DroneCandle Label2`);
                    }
                  }
                });
              }
            });
          }
        } else {
          // Fallback: Get the newest user from results if no specific data
          const sortedResults = [...results].sort((a, b) => {
            const aTime = a.createdAt?.getTime ? a.createdAt.getTime() : 0;
            const bTime = b.createdAt?.getTime ? b.createdAt.getTime() : 0;
            return bTime - aTime; // Newest first
          });
          const userData = sortedResults[0];
          
          if (userData && userData.image) {
            console.log(`[Drone] Applying newest user image to DroneCandle for ${userData.userName || 'New User'}`);
            
            loadOptimizedTexture(userData.image, (texture) => {
              if (droneCandleRef.current) {
                droneCandleRef.current.traverse((child) => {
                  if (child.name?.includes('Label2') && child.isMesh) {
                    if (child.material) {
                      child.material = child.material.clone();
                      child.material.map = texture;
                      child.material.transparent = true;
                      child.material.needsUpdate = true;
                    }
                  }
                });
              }
            });
          }
        }
      }
      
      // Make drone visible when starting delivery
      if (droneRef.current) {
        droneRef.current.visible = true;
        console.log('[Drone] Made visible for delivery');
      }
      
      // Reset states and start with staging phase
      console.log(`[Drone] About to start delivery sequence - setting drone states`);
      setDroneTargetPosition(targetIndex);
      setIsDroneStaging(true); // Start with staging
      setIsDroneMoving(false);
      setIsDroneLowering(false);
      setIsDroneRising(false);
      setIsDroneReturning(false);
      console.log(`[Drone] States set - isDroneStaging should now be true`);
      
      // Reset staging flags on drone
      if (droneRef.current) {
        droneRef.current.stagingPauseComplete = false;
        droneRef.current.stagingStartTime = null;
      }
      
      // Store original camera position and target BEFORE moving
      if (camera) {
        originalCameraPositionRef.current = camera.position.clone();
        // Store the current OrbitControls target
        if (orbitControlsRef?.current) {
          originalCameraTargetRef.current = orbitControlsRef.current.target.clone();
          
          // Stop auto-rotation during drone delivery
          orbitControlsRef.current.autoRotate = false;
        } else {
          originalCameraTargetRef.current = new THREE.Vector3(0, 0, 0); // Default fallback
        }
      }
      
      // Position camera relative to target's direction from center with smooth transition
      if (camera && targetPosition) {
        console.log(`[Camera] Starting smooth transition to target at:`, targetPosition);
        
        // Calculate direction from center to target
        const center = new THREE.Vector3(0, 0, 0);
        const directionToTarget = new THREE.Vector3(
          targetPosition.x - center.x,
          0, // Ignore Y for direction calculation
          targetPosition.z - center.z
        ).normalize();
        
        // Calculate perpendicular direction (for side offset)
        const perpendicular = new THREE.Vector3(
          -directionToTarget.z,
          0,
          directionToTarget.x
        );
        
        // Position camera behind and to the side of target
        const behindDistance = cameraControls.behindDistance;
        const sideDistance = cameraControls.sideDistance;
        
        const targetCameraPos = new THREE.Vector3(
          targetPosition.x + (directionToTarget.x * behindDistance) + (perpendicular.x * sideDistance),
          cameraControls.cameraHeight,
          targetPosition.z + (directionToTarget.z * behindDistance) + (perpendicular.z * sideDistance)
        );
        
        // Store transition data for smooth animation
        cameraTransitionStartRef.current = {
          startTime: Date.now(),
          startPosition: camera.position.clone(),
          targetPosition: targetCameraPos,
          startLookAt: orbitControlsRef?.current?.target.clone() || new THREE.Vector3(0, 0, 0),
          targetLookAt: new THREE.Vector3(targetPosition.x, targetPosition.y, targetPosition.z)
        };
        
        // Temporarily disable controls during transition
        if (orbitControlsRef?.current) {
          orbitControlsRef.current.enabled = false;
          orbitControlsRef.current.autoRotate = false;
        }
      }
      
      // Start camera transition
      setIsCameraFollowingDrone(true);
      
      console.log(`[Drone] Starting delivery to ${targetCandle.name} with camera tracking`);
    }
  }, [results, loadOptimizedTexture, candleRefs, pendingCandleDelivery, sceneRef, camera, orbitControlsRef, cameraControls]);

  // Store reference for drone delivery
  useEffect(() => {
    startDroneDeliveryRef.current = startDroneDelivery;
  }, [startDroneDelivery]);

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
            // console.log('🎬 Video is playing');
          });
          
          videoElement.addEventListener('error', (e) => {
            // console.error('🎬 Video loading error:', e);
            // console.error('🎬 Video src:', videoElement.src);
          });
          
          // Start playing the video only after it's ready
          const playVideo = () => {
            if (!videoElement.paused) {
              // console.log('🎬 Video already playing');
              return;
            }
            
            if (videoElement.readyState >= 2) {
              videoElement.play().catch(err => {
                console.warn('🎬 Video autoplay failed:', err);
              });
            } else {
              // console.log('🎬 Video not ready yet, waiting for canplay event');
            }
          };
          
          videoElement.addEventListener('canplay', playVideo);
          
          // Function to create and apply texture once video is ready
          const createAndApplyTexture = () => {
            // console.log('🎬 Creating video texture for goldCircuit');
            
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
              
              // console.log('🎬 Applied video texture to goldCircuit material');
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
            // console.log('🎬 Video already has metadata, creating texture immediately');
            createAndApplyTexture();
          } else {
            // console.log('🎬 Waiting for video metadata before creating texture');
            videoElement.addEventListener('loadedmetadata', createAndApplyTexture, { once: true });
          }
          
          // Store references for cleanup
          child.userData.videoElement = videoElement;
          child.userData.playVideoHandler = playVideo;
          child.userData.createTextureHandler = createAndApplyTexture;
        }
      });
      
      // Find and store the drone object
      const drone = templeScene.getObjectByName('Drone');
      if (drone) {
        droneRef.current = drone;
        console.log('[CyborgTempleScene] Found drone:', drone.name);
        
        // Make drone invisible initially
        drone.visible = false;
        console.log('[Drone] Set to invisible until delivery starts');
        
        // Log drone's initial orientation and children to identify front
        console.log('[Drone] Initial rotation:', drone.rotation);
        console.log('[Drone] Children:', drone.children.map(c => c.name));
        
        // Set initial drone position to home (off-screen)
        drone.position.set(
          droneHomePosition.x,
          droneHomePosition.y + droneBaseHeight,
          droneHomePosition.z
        );
        
        // Keep drone's original rotation from the model
        console.log('[CyborgTempleScene] Drone starting at home position');
        
        // Find and store DroneCandle object
        const droneCandle = drone.getObjectByName('DroneCandle');
        if (droneCandle) {
          droneCandleRef.current = droneCandle;
          // console.log('[CyborgTempleScene] Found DroneCandle object');
          
          // Make sure DroneCandle is visible initially
          droneCandle.traverse((child) => {
            child.visible = true;
          });
        } else {
          // console.log('[CyborgTempleScene] DroneCandle not found in drone');
        }
        
        // Play drone hovering animation if it exists
        const droneHoverAnim = gltf.animations.find(anim => anim.name === 'DroneHover');
        if (droneHoverAnim && mixer) {
          const droneHoverAction = mixer.clipAction(droneHoverAnim, drone);
          droneHoverAction.play();
          // console.log('[CyborgTempleScene] Playing drone hover animation: DroneHover');
        }
      } else {
        // console.log('[CyborgTempleScene] Drone not found in scene');
      }
      
      // Find and store candle references
      const foundCandles = [];
      const candlePositions = []; // Array to store positions
      
      // Search for all VCANDLE objects in the scene
      const existingVCandles = [];
      templeScene.traverse((child) => {
        // Check for VCANDLE with 3-digit format (VCANDLE000, VCANDLE001, etc.)
        if (child.name && child.name.match(/^VCANDLE\d{3}$/)) {
          existingVCandles.push(child);
        }
      });
      console.log(`[CyborgTempleScene] Found ${existingVCandles.length} VCANDLEs in the scene`);
      
      // Sort VCANDLEs by their number (VCANDLE000, VCANDLE001, etc.)
      existingVCandles.sort((a, b) => {
        const numA = parseInt(a.name.replace('VCANDLE', '')) || 0;
        const numB = parseInt(b.name.replace('VCANDLE', '')) || 0;
        return numA - numB;
      });
      
      // Extract candle positions from Empty objects or markers
      const idealCandlePositions = [];
      const floorObject = templeScene.getObjectByName('Floor');
      
      // First, try to find Empty objects or marker meshes
      const candleMarkers = [];
      templeScene.traverse((child) => {
        // Look for Empty objects - specifically CandleLocation_*
        if (child.name && (
          child.name.startsWith('CandleLocation_') || 
          child.name.startsWith('CandleSpot_') || 
          child.name.startsWith('CandleMarker_')
        )) {
          candleMarkers.push(child);
          // console.log(`[CyborgTempleScene] Found candle marker: ${child.name} at`, child.position);
        }
      });
      
      if (candleMarkers.length > 0) {
        // console.log(`[CyborgTempleScene] Found ${candleMarkers.length} candle markers`);
        
        // Sort markers by name to maintain order
        candleMarkers.sort((a, b) => a.name.localeCompare(b.name));
        
        // Use marker positions
        candleMarkers.forEach((marker, i) => {
          const worldPos = new THREE.Vector3();
          marker.getWorldPosition(worldPos);
          
          idealCandlePositions.push({
            x: worldPos.x,
            y: worldPos.y,
            z: worldPos.z,
            name: marker.name
          });
          // console.log(`[CyborgTempleScene] Candle position ${i + 1} from marker:`, worldPos);
        });
      } else if (floorObject) {
        // console.log('[CyborgTempleScene] No markers found, using Floor perimeter positions');
        
        // Get floor bounds to understand its dimensions
        const bounds = new THREE.Box3().setFromObject(floorObject);
        // console.log('[CyborgTempleScene] Floor bounds:', bounds);
        
        // Define positions on the PERIMETER of the floor
        const perimeterPositions = [];
        const numPositions = 15;
        
        // Calculate perimeter positions in a rectangle/circle around the floor
        for (let i = 0; i < numPositions; i++) {
          const angle = (i / numPositions) * Math.PI * 2;
          const radiusX = (bounds.max.x - bounds.min.x) * 0.4; // 80% of half-width
          const radiusZ = (bounds.max.z - bounds.min.z) * 0.4; // 80% of half-depth
          
          perimeterPositions.push({
            x: bounds.min.x + (bounds.max.x - bounds.min.x) / 2 + Math.cos(angle) * radiusX,
            z: bounds.min.z + (bounds.max.z - bounds.min.z) / 2 + Math.sin(angle) * radiusZ
          });
        }
        
        // Raycast to find exact floor positions
        const raycaster = new THREE.Raycaster();
        
        perimeterPositions.forEach((pos, i) => {
          const rayOrigin = new THREE.Vector3(pos.x, bounds.max.y + 1, pos.z);
          const rayDirection = new THREE.Vector3(0, -1, 0);
          
          raycaster.set(rayOrigin, rayDirection);
          const intersects = raycaster.intersectObject(floorObject, true);
          
          if (intersects.length > 0) {
            const point = intersects[0].point;
            idealCandlePositions.push({
              x: point.x,
              y: point.y + 0.001, // Slightly above floor
              z: point.z,
              name: `CandleSpot_${String(i + 1).padStart(3, '0')}`
            });
            // console.log(`[CyborgTempleScene] Candle position ${i + 1} on floor perimeter:`, point);
          } else {
            // Fallback if raycast fails - use bounds height
            idealCandlePositions.push({
              x: pos.x,
              y: bounds.max.y,
              z: pos.z,
              name: `CandleSpot_${String(i + 1).padStart(3, '0')}`
            });
          }
        });
        
        // console.log(`[CyborgTempleScene] Created ${idealCandlePositions.length} candle positions on Floor perimeter`);
      } else {
        // console.log('[CyborgTempleScene] No markers or Floor found, using fallback positions');
        // Fallback positions
        for (let i = 0; i < 15; i++) {
          idealCandlePositions.push({
            x: (i % 5 - 2) * 0.4,
            y: -2.0 + Math.floor(i / 5) * 0.07,
            z: 2.0 - Math.floor(i / 5) * 0.3,
            name: `CandleSpot_${String(i + 1).padStart(3, '0')}`
          });
        }
      }
      
      // Store ideal positions globally for drone delivery
      window.idealCandlePositions = idealCandlePositions;
      
      // Process all existing VCANDLEs
      existingVCandles.forEach((candle, index) => {
        // Initially hide all VCANDLEs
        candle.visible = false;
        candle.traverse((subChild) => {
          subChild.visible = false;
        });
        
        // Extract world position for reference
        const worldPosition = new THREE.Vector3();
        candle.getWorldPosition(worldPosition);
        
        candlePositions.push({
          name: candle.name,
          position: {
            x: worldPosition.x,
            y: worldPosition.y,
            z: worldPosition.z
          },
          localPosition: {
            x: candle.position.x,
            y: candle.position.y,
            z: candle.position.z
          }
        });
        
        // Make candles interactive
        candle.userData.isCandle = true;
        candle.userData.originalScale = candle.scale.clone();
        candle.userData.candleIndex = index;
        
        // Debug: Check what's inside each candle
        if (index === 0) { // Only log for first candle to avoid spam
          console.log(`[CyborgTempleScene] Contents of ${candle.name}:`);
          candle.traverse((child) => {
            if (child.name && child !== candle) {
              console.log(`  - ${child.name} (${child.type})`);
            }
          });
        }
        
        // Add click handler to candle meshes
        candle.traverse((subChild) => {
          if (subChild.isMesh) {
            subChild.userData.candleIndex = index;
            subChild.userData.candleName = candle.name;
          }
        });
        
        // Store the candle in our references array
        foundCandles.push(candle);
        
        console.log(`[CyborgTempleScene] Processed ${candle.name} at position:`, worldPosition);
      });
      
      // Store first VCANDLE as template for drone delivery if it exists
      const templateCandle = existingVCandles[0];
      if (templateCandle) {
        window.candleTemplate = templateCandle;
        window.candleOriginalScale = templateCandle.scale.clone();
        
        // Create clean template for drone delivery only (not added to scene)
        const cleanTemplate = templateCandle.clone();
        cleanTemplate.visible = true;
        cleanTemplate.position.set(0, 0, 0);
        cleanTemplate.traverse((subChild) => {
          subChild.visible = true;
        });
        window.candleCloneTemplate = cleanTemplate;
        
        console.log(`[CyborgTempleScene] Stored ${templateCandle.name} as template for drone delivery`);
      }
      
      // Initialize candleRefs with ONLY the existing VCANDLEs found in the scene
      setCandleRefs(foundCandles);
      candleRefsRef.current = foundCandles; // Also store in ref
      console.log(`[CyborgTempleScene] Found ${foundCandles.length} existing VCANDLEs in the scene`);
      
      // Log all candle positions as an array
      console.log('[CyborgTempleScene] All VCANDLE positions:', candlePositions);
      
      // Store positions in window for easy access in console
      window.vcandlePositions = candlePositions;
      
      // Apply initial candle visibility based on available data
      // Note: Results might not be loaded yet on initial mount, 
      // but the useEffect will update visibility when they arrive
      if (foundCandles.length > 0) {
        console.log(`[CyborgTempleScene] Found ${foundCandles.length} VCANDLEs in scene, will show based on ${results.length} Firestore users`);
        console.log(`[CyborgTempleScene] VCANDLEs found:`, foundCandles.map(c => c.name).join(', '));
        if (results.length > 0) {
          console.log(`[CyborgTempleScene] Will show first ${Math.min(results.length, foundCandles.length)} candles`);
        }
        updateCandleVisibility(foundCandles);
      } else {
        console.warn(`[CyborgTempleScene] No VCANDLEs found in the scene!`);
      }
     
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

      // Cancel any ongoing camera animation
      if (cameraAnimationFrameRef.current) {
        cancelAnimationFrame(cameraAnimationFrameRef.current);
        cameraAnimationFrameRef.current = null;
      }

      // Clear all pending timeouts
      pendingTimeoutsRef.current.forEach(timeoutId => {
        clearTimeout(timeoutId);
      });
      pendingTimeoutsRef.current.clear();

      // Clear drone inspection timeout
      if (droneInspectionTimeRef.current) {
        clearTimeout(droneInspectionTimeRef.current);
        droneInspectionTimeRef.current = null;
      }

      // Clear any pending dance timeout
      if (danceTimeoutRef.current) {
        clearTimeout(danceTimeoutRef.current);
        danceTimeoutRef.current = null;
      }

      // Cancel and clean up any loading images
      loadingImagesRef.current.forEach((img, url) => {
        img.onload = null;
        img.onerror = null;
        img.src = ''; // Cancel loading
      });
      loadingImagesRef.current.clear();

      // Dispose of cached textures properly
      textureCache.current.forEach((texture, key) => {
        if (texture && texture.dispose) {
          texture.dispose();
        }
      });
      textureCache.current.clear()

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
            // Dispose geometry
            if (child.geometry) {
              child.geometry.dispose();
            }
            
            // Dispose materials and their textures
            if (child.material) {
              const disposeMaterial = (material) => {
                // Dispose all texture maps
                ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'emissiveMap', 'alphaMap', 'aoMap', 'bumpMap', 'displacementMap', 'envMap', 'lightMap'].forEach(mapName => {
                  if (material[mapName] && material[mapName].dispose) {
                    material[mapName].dispose();
                  }
                });
                material.dispose();
              };
              
              if (Array.isArray(child.material)) {
                child.material.forEach(disposeMaterial);
              } else {
                disposeMaterial(child.material);
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
    
    // Handle smooth camera transition
    if (isCameraFollowingDrone && cameraTransitionStartRef.current) {
      const transition = cameraTransitionStartRef.current;
      const elapsed = Date.now() - transition.startTime;
      const progress = Math.min(elapsed / cameraTransitionDuration, 1);
      
      // Use easing function for smooth motion (ease-in-out)
      const easeProgress = progress < 0.5 
        ? 2 * progress * progress 
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      
      // Interpolate camera position
      camera.position.lerpVectors(
        transition.startPosition,
        transition.targetPosition,
        easeProgress
      );
      
      // Interpolate look-at target
      if (orbitControlsRef?.current) {
        const currentTarget = new THREE.Vector3().lerpVectors(
          transition.startLookAt,
          transition.targetLookAt,
          easeProgress
        );
        orbitControlsRef.current.target.copy(currentTarget);
        orbitControlsRef.current.update();
      }
      
      // Log progress for debugging (only first and last)
      if (progress < 0.01) {
        console.log('[Camera] Transition started');
      } else if (progress >= 0.99 && progress < 1) {
        console.log('[Camera] Transition nearly complete');
      }
      
      // When transition is complete
      if (progress >= 1) {
        console.log('[Camera] Transition complete, camera locked in place');
        cameraTransitionStartRef.current = null;
        
        // Re-enable controls after transition
        if (orbitControlsRef?.current) {
          orbitControlsRef.current.enabled = true;
          orbitControlsRef.current.enableRotate = true;
          orbitControlsRef.current.enablePan = true;
          orbitControlsRef.current.enableZoom = true;
        }
        
        // Camera stays at delivery location, stop following
        setIsCameraFollowingDrone(false);
      }
    }
    
    // Only update camera for slider changes if NOT in transition and delivery is active
    if (droneRef.current && (isDroneStaging || isDroneMoving || isDroneLowering || isDroneRising || isDroneReturning) && 
        !isCameraFollowingDrone && !cameraTransitionStartRef.current) {
      // This block is now disabled during camera transition
      // It will only run if user manually adjusts sliders after transition completes
    }
    
    // Animate drone movement
    if (droneRef.current) {
      // Log drone animation state once per state change
      if (!window.lastDroneState || 
          window.lastDroneState.staging !== isDroneStaging ||
          window.lastDroneState.moving !== isDroneMoving) {
        console.log(`[useFrame Drone] Animation states:`, {
          hasRef: !!droneRef.current,
          isDroneStaging,
          isDroneMoving,
          isDroneLowering,
          dronePosition: droneRef.current?.position
        });
        window.lastDroneState = {
          staging: isDroneStaging,
          moving: isDroneMoving
        };
      }
      
      // Get the actual target position for the drone
      const targetCandleName = `VCANDLE${String(droneTargetPosition).padStart(3, '0')}`;
      let targetPosition = null;
      
      // Check stored VCANDLE positions first
      if (window.vcandlePositions && window.vcandlePositions[droneTargetPosition]) {
        targetPosition = window.vcandlePositions[droneTargetPosition].position;
      }
      
      // Fallback to ideal positions if needed
      if (!targetPosition) {
        const idealPositions = window.idealCandlePositions || [];
        if (idealPositions[droneTargetPosition]) {
          targetPosition = idealPositions[droneTargetPosition];
        } else {
          // Ultimate fallback
          targetPosition = { x: 0, y: -1.88, z: 2.0 };
        }
      }
      
      const targetCandle = {
        name: targetCandleName,
        position: targetPosition
      };
      
      if (isDroneStaging) {
        // First phase: Move to staging position (front center)
        const stagingPos = new THREE.Vector3(
          droneStagingPosition.x,
          droneStagingPosition.y,
          droneStagingPosition.z
        );
        
        // Move to staging position
        const stagingSpeed = 2 * delta;
        droneRef.current.position.x = THREE.MathUtils.lerp(
          droneRef.current.position.x,
          stagingPos.x,
          stagingSpeed
        );
        droneRef.current.position.y = THREE.MathUtils.lerp(
          droneRef.current.position.y,
          stagingPos.y,
          stagingSpeed
        );
        droneRef.current.position.z = THREE.MathUtils.lerp(
          droneRef.current.position.z,
          stagingPos.z,
          stagingSpeed
        );
        
        // Removed rotation - was causing sideways/upside down flight
        
        // Check if reached staging position
        const distanceToStaging = droneRef.current.position.distanceTo(stagingPos);
        if (distanceToStaging < 0.1 && !droneRef.current.stagingPauseComplete) {
          console.log(`[Drone] Reached staging position, pausing for showcase...`);
          
          // Pause at staging position for 2 seconds
          if (!droneRef.current.stagingStartTime) {
            droneRef.current.stagingStartTime = Date.now();
          }
          
          const stagingElapsed = Date.now() - droneRef.current.stagingStartTime;
          if (stagingElapsed > 2000) { // 2 second pause
            console.log(`[Drone] Showcase complete, now moving to candle`);
            droneRef.current.stagingPauseComplete = true;
            droneRef.current.stagingStartTime = null;
            
            // Calculate waypoints to avoid flying through temple
            const currentPos = droneRef.current.position.clone();
            const finalTarget = new THREE.Vector3(
              targetPosition.x + droneLateralOffset.x,
              targetPosition.y + droneBaseHeight,
              targetPosition.z + droneLateralOffset.z
            );
            
            // Calculate angles for current and target positions
            const currentAngle = Math.atan2(currentPos.z, currentPos.x);
            const targetAngle = Math.atan2(finalTarget.z, finalTarget.x);
            
            // Calculate angular difference
            let angleDiff = targetAngle - currentAngle;
            // Normalize to [-PI, PI]
            while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
            while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
            
            // Clear previous waypoints
            droneWaypointsRef.current = [];
            currentWaypointIndexRef.current = 0;
            
            // If target is roughly opposite (more than 90 degrees away), fly around temple
            if (Math.abs(angleDiff) > Math.PI / 2) {
              console.log(`[Drone] Target is on opposite side, creating arc path`);
              
              // Determine direction (clockwise or counter-clockwise)
              const goClockwise = angleDiff < 0;
              
              // Create intermediate waypoints along an arc
              const numWaypoints = 3; // Number of intermediate points
              for (let i = 1; i <= numWaypoints; i++) {
                const progress = i / (numWaypoints + 1);
                const intermediateAngle = currentAngle + (angleDiff * progress);
                
                // Position waypoint on circle around temple
                const waypointX = Math.cos(intermediateAngle) * templeRadius;
                const waypointZ = Math.sin(intermediateAngle) * templeRadius;
                
                droneWaypointsRef.current.push(new THREE.Vector3(
                  waypointX,
                  droneBaseHeight,
                  waypointZ
                ));
              }
            }
            
            // Add final target as last waypoint
            droneWaypointsRef.current.push(finalTarget);
            
            console.log(`[Drone] Created ${droneWaypointsRef.current.length} waypoints for navigation`);
            
            setIsDroneStaging(false);
            setIsDroneMoving(true);
          }
        }
      } else if (isDroneMoving) {
        // Navigate through waypoints
        if (droneWaypointsRef.current.length > 0 && currentWaypointIndexRef.current < droneWaypointsRef.current.length) {
          const currentWaypoint = droneWaypointsRef.current[currentWaypointIndexRef.current];
          
          // Smooth movement using lerp - reduced speed for better visibility
          const lerpSpeed = 1.5 * delta; // Reduced from 3 to 1.5
          droneRef.current.position.x = THREE.MathUtils.lerp(
            droneRef.current.position.x,
            currentWaypoint.x,
            lerpSpeed
          );
          droneRef.current.position.y = THREE.MathUtils.lerp(
            droneRef.current.position.y,
            currentWaypoint.y,
            lerpSpeed
          );
          droneRef.current.position.z = THREE.MathUtils.lerp(
            droneRef.current.position.z,
            currentWaypoint.z,
            lerpSpeed
          );
          
          // Check if drone has reached current waypoint
          const distance = droneRef.current.position.distanceTo(currentWaypoint);
          if (distance < 0.2) { // Slightly larger threshold for waypoints
            currentWaypointIndexRef.current++;
            
            // Check if this was the last waypoint
            if (currentWaypointIndexRef.current >= droneWaypointsRef.current.length) {
              setIsDroneMoving(false);
              setIsDroneLowering(true);
              console.log(`[Drone] Reached ${targetCandle.name}, now lowering...`);
            } else {
              console.log(`[Drone] Reached waypoint ${currentWaypointIndexRef.current}, continuing to next...`);
            }
          }
        } else {
          // Fallback: direct movement if no waypoints
          const targetPos = new THREE.Vector3(
            targetPosition.x + droneLateralOffset.x,
            targetPosition.y + droneBaseHeight,
            targetPosition.z + droneLateralOffset.z
          );
          
          const lerpSpeed = 1.5 * delta;
          droneRef.current.position.x = THREE.MathUtils.lerp(
            droneRef.current.position.x,
            targetPos.x,
            lerpSpeed
          );
          droneRef.current.position.y = THREE.MathUtils.lerp(
            droneRef.current.position.y,
            targetPos.y,
            lerpSpeed
          );
          droneRef.current.position.z = THREE.MathUtils.lerp(
            droneRef.current.position.z,
            targetPos.z,
            lerpSpeed
          );
          
          const distance = droneRef.current.position.distanceTo(targetPos);
          if (distance < 0.1) {
            setIsDroneMoving(false);
            setIsDroneLowering(true);
            console.log(`[Drone] Reached ${targetCandle.name}, now lowering...`);
          }
        }
      } else if (isDroneLowering) {
        // Second phase: Lower to inspect candle (with lateral offset)
        const lowerPos = new THREE.Vector3(
          targetPosition.x + droneLateralOffset.x,
          targetPosition.y + droneLowerHeight,
          targetPosition.z + droneLateralOffset.z
        );
        
        // Slower descent for inspection - even slower for visibility
        const lowerSpeed = 1 * delta; // Reduced from 2 to 1
        droneRef.current.position.y = THREE.MathUtils.lerp(
          droneRef.current.position.y,
          lowerPos.y,
          lowerSpeed
        );
        
        // Check if drone has lowered to inspection height
        const yDistance = Math.abs(droneRef.current.position.y - lowerPos.y);
        if (yDistance < 0.05) {
          setIsDroneLowering(false);
          console.log(`[Drone] Inspecting ${targetCandle.name}`);
          
          // Clear any existing timeout
          if (droneInspectionTimeRef.current) {
            clearTimeout(droneInspectionTimeRef.current);
          }
          
          // Hide DroneCandle (drop it off) and rise back up after 0.5 seconds
          droneInspectionTimeRef.current = setTimeout(() => {
            // Hide the DroneCandle
            if (droneCandleRef.current) {
              droneCandleRef.current.traverse((child) => {
                child.visible = false;
              });
              console.log(`[Drone] Candle delivered to position ${droneTargetPosition}`);
            }
            
            // Place a new candle at the delivery position
            const idealPositions = window.idealCandlePositions || [];
            console.log(`[Drone] Checking placement conditions:`);
            console.log(`  - droneTargetPosition: ${droneTargetPosition}`);
            console.log(`  - idealPositions.length: ${idealPositions.length}`);
            console.log(`  - window.candleCloneTemplate exists: ${!!window.candleCloneTemplate}`);
            console.log(`  - sceneRef.current exists: ${!!sceneRef.current}`);
            
            // Look for pre-placed VCANDLE at this position (VCANDLE000, VCANDLE001, etc.)
            const targetCandleName = `VCANDLE${String(droneTargetPosition).padStart(3, '0')}`; // VCANDLE000 for position 0, etc.
            let placedCandle = null;
            
            sceneRef.current.traverse((child) => {
              if (child.name === targetCandleName) {
                placedCandle = child;
                console.log(`[Drone] Found pre-placed candle: ${targetCandleName}`);
              }
            });
            
            if (placedCandle) {
              // Make the pre-placed candle visible
              placedCandle.visible = true;
              placedCandle.traverse((subChild) => {
                subChild.visible = true;
              });
              
              // Get the candle's actual world position for the drone to fly to
              const candleWorldPos = new THREE.Vector3();
              placedCandle.getWorldPosition(candleWorldPos);
              
              console.log(`[Drone] Made ${targetCandleName} visible at position:`, candleWorldPos);
              
              // Update the ideal position so the drone goes to the right place
              idealPositions[droneTargetPosition] = {
                x: candleWorldPos.x,
                y: candleWorldPos.y,
                z: candleWorldPos.z,
                name: targetCandleName
              };
              
              // Store reference to the visible candle
              // Make sure candleRefs array is large enough
              while (candleRefs.length <= droneTargetPosition) {
                candleRefs.push(null);
              }
              candleRefs[droneTargetPosition] = placedCandle;
              
              // Set up userData for the pre-placed candle
              placedCandle.userData.isCandle = true;
              placedCandle.userData.isDroneDelivered = true;
              placedCandle.userData.originalScale = placedCandle.scale.clone();
              
              // Apply the correct user data to the delivered candle
              // Use the candle at the target position
              const sortedResults = [...results].sort((a, b) => {
                // Sort by createdAt timestamp (oldest first, matching display order)
                const aTime = a.createdAt?.getTime ? a.createdAt.getTime() : 0;
                const bTime = b.createdAt?.getTime ? b.createdAt.getTime() : 0;
                return aTime - bTime; // Oldest first to match candle placement order
              });
              const userData = sortedResults[droneTargetPosition]; // Get the candle for this position
              
              if (userData && placedCandle) {
                // Apply user data to the candle
                placedCandle.userData = { 
                  ...userData,
                  hasUser: true,
                  userName: userData.userName || userData.username || 'Anonymous',
                  userId: userData.id,
                  burnedAmount: userData.burnedAmount || 0,
                  image: userData.image,
                  message: userData.message,
                  createdAt: userData.createdAt,
                  deliveredByDrone: true,
                  isDroneDelivered: true,
                  position: candleWorldPos // Store the actual position with the candle
                };
                
                // Apply user image to the actual candle's Label2
                if (userData.image) {
                  applyUserImageToLabel(placedCandle, userData);
                  console.log(`[Drone] Applied user data and image to delivered candle`);
                }
                
                console.log(`[Drone] Candle delivered with user: ${userData.userName || 'Anonymous'}`);
              }
              
              console.log(`[Drone] Candle ${droneTargetPosition} placed at position:`, candleWorldPos);
              console.log(`[Drone] Candle userData:`, targetCandle?.userData);
            } else {
              console.warn(`[Drone] Could not place candle at index ${droneTargetPosition} - check template or positions`);
            }
            
            // Camera already stopped tracking and stays at delivery location
            console.log(`[Drone] Candle placed! Camera remains at delivery location.`);
            
            // Start rising
            console.log(`[Drone] Delivery complete, rising back up`);
            setIsDroneLowering(false);  // Stop lowering
            setIsDroneRising(true);      // Start rising
          }, 1500); // Increased to 1.5 seconds for better visibility
        }
      } else if (isDroneRising) {
        // Third phase: Rise back to normal height
        const risePos = new THREE.Vector3(
          targetPosition.x,
          targetPosition.y + droneBaseHeight,
          targetPosition.z
        );
        
        // Rise at slower speed for visibility
        const riseSpeed = 1 * delta; // Reduced from 2 to 1
        droneRef.current.position.y = THREE.MathUtils.lerp(
          droneRef.current.position.y,
          risePos.y,
          riseSpeed
        );
        
        // Check if drone has risen back to base height
        const yDistance = Math.abs(droneRef.current.position.y - risePos.y);
        if (yDistance < 0.05) {
          setIsDroneRising(false);
          setIsDroneReturning(true); // Start returning home
          console.log(`[Drone] Back at patrol height, returning home`);
        }
      } else if (isDroneReturning) {
        // Fourth phase: Return to home position
        const homePos = new THREE.Vector3(
          droneHomePosition.x,
          droneHomePosition.y + droneBaseHeight,
          droneHomePosition.z
        );
        
        // Slower return speed for better visibility
        const returnSpeed = 0.8 * delta; // Slower speed for graceful exit
        droneRef.current.position.x = THREE.MathUtils.lerp(
          droneRef.current.position.x,
          homePos.x,
          returnSpeed
        );
        droneRef.current.position.y = THREE.MathUtils.lerp(
          droneRef.current.position.y,
          homePos.y,
          returnSpeed
        );
        droneRef.current.position.z = THREE.MathUtils.lerp(
          droneRef.current.position.z,
          homePos.z,
          returnSpeed
        );
        
        // Removed rotation - was causing sideways/upside down flight
        
        // Check if drone has reached home
        const distance = droneRef.current.position.distanceTo(homePos);
        if (distance < 0.1) {
          setIsDroneReturning(false);
          setPendingDeliveryTimestamp(null); // Clear pending delivery now that it's complete
          
          // Hide drone after returning home
          droneRef.current.visible = false;
          console.log(`[Drone] Returned to home, now invisible, delivery complete!`);
        }
      }
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
      
      // Check for intersections with visible candles (skip null entries)
      const visibleCandles = candleRefs.filter((c, idx) => c && c.visible && idx < results.length);
      const meshes = [];
      visibleCandles.forEach((candle, visibleIndex) => {
        // Get the actual index in the full candleRefs array
        const actualIndex = candleRefs.indexOf(candle);
        candle.traverse(child => {
          if (child.isMesh) {
            // Store the actual index for proper data lookup
            child.userData.candleIndex = actualIndex;
            child.userData.candleName = candle.name;
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
      visibleCandles.forEach((candle) => {
        const actualIndex = candleRefs.indexOf(candle);
        const isHovered = hoveredCandle === actualIndex;
        const targetScale = isHovered ? 1.1 : 1;
        
        // Smooth scale animation (with safety check)
        if (candle.userData?.originalScale) {
          candle.scale.x = THREE.MathUtils.lerp(candle.scale.x, candle.userData.originalScale.x * targetScale, delta * 5);
          candle.scale.y = THREE.MathUtils.lerp(candle.scale.y, candle.userData.originalScale.y * targetScale, delta * 5);
          candle.scale.z = THREE.MathUtils.lerp(candle.scale.z, candle.userData.originalScale.z * targetScale, delta * 5);
        }
        
        // Flame flicker effect
        candle.traverse((child) => {
          if (child.name?.toLowerCase().includes('flame') && child.isMesh) {
            const flicker = Math.sin(state.clock.elapsedTime * 10 + actualIndex) * 0.1 + 0.9;
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
      //     initialY.current + Math.sin(state
      

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
  
  // Add keyboard controls for drone movement
  useEffect(() => {
    if (!modelLoaded || !droneRef.current) return;
    
    const handleKeyPress = (event) => {
      // Safety check for event.key
      if (!event || !event.key) return;
      
      // CRITICAL: Don't trigger drone if modal is open (user is typing!)
      if (isModalOpen) {
        console.log('[Drone Keyboard] Ignoring key press - modal is open');
        return;
      }
      
      const key = event.key.toLowerCase();
      
      if (key === 'arrowright' || key === 'd') {
        // Deliver to next candle
        const nextIndex = (droneTargetPosition + 1) % 30;
        startDroneDelivery(nextIndex);
      } else if (key === 'arrowleft' || key === 'a') {
        // Deliver to previous candle
        const prevIndex = (droneTargetPosition - 1 + 30) % 30;
        startDroneDelivery(prevIndex);
      } else if (key >= '1' && key <= '9') {
        // Deliver to specific candle (1-9 maps to VCANDLE001-009)
        startDroneDelivery(parseInt(key) - 1);  // Subtract 1 to convert to 0-based index
      } else if (key === '0') {
        // Key 0 maps to VCANDLE010
        startDroneDelivery(9);
      } else if (key === 'r') {
        // Deliver to random candle
        const randomIndex = Math.floor(Math.random() * 30);
        startDroneDelivery(randomIndex);
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [modelLoaded, droneTargetPosition, startDroneDelivery, isModalOpen]);

  // Re-update candle visibility when results change or scene is loaded
  useEffect(() => {
    const candles = candleRefsRef.current.length > 0 ? candleRefsRef.current : candleRefs;
    if (candles.length > 0 && modelLoaded) {
      console.log(`[CyborgTempleScene] Updating visibility for ${candles.length} candles with ${results.length} Firestore results`);
      console.log(`[CyborgTempleScene] Using candles from:`, candleRefsRef.current.length > 0 ? 'ref' : 'state');
      
      // Check if we have a pending delivery for the newest candle
      let skipNewest = false;
      if (pendingDeliveryTimestamp) {
        // Always skip the newest candle if we have a pending delivery
        skipNewest = true;
        console.log('[CyborgTempleScene] Skipping newest candle - will be delivered by drone');
      }
      
      updateCandleVisibility(candles, skipNewest);
    }
  }, [results, candleRefs, updateCandleVisibility, pendingDeliveryTimestamp, modelLoaded]);

  // Monitor for pending candle to appear in Firestore results
  useEffect(() => {
    console.log('[Drone Monitor] Effect running with:', {
      hasPendingCandle: !!pendingCandleDelivery,
      pendingCandle: pendingCandleDelivery,
      isModalOpen,
      isDroneStaging,
      isDroneMoving,
      modelLoaded,
      resultsCount: results.length
    });
    
    if (pendingCandleDelivery) {
      console.log('[Drone Monitor] Pending candle details:', pendingCandleDelivery);
    }
    
    // Multiple safety checks
    if (!pendingCandleDelivery || !modelLoaded) {
      if (!pendingCandleDelivery) console.log('[Drone Monitor] No pending candle, exiting');
      if (!modelLoaded) console.log('[Drone Monitor] Model not loaded, exiting');
      return;
    }
    
    // Don't trigger while modal is still open
    if (isModalOpen) {
      console.log('[Drone Monitor] ❌ MODAL IS OPEN - NOT STARTING DRONE');
      return;
    }
    
    // Additional safety: Check if we're already processing a delivery
    if (isDroneStaging || isDroneMoving || isDroneLowering || isDroneRising || isDroneReturning) {
      console.log('[Drone Monitor] ❌ DRONE ALREADY BUSY - NOT STARTING NEW DELIVERY');
      return;
    }
    
    console.log('[Drone Monitor] ✅ All conditions met, checking for candle in Firestore:', {
      pendingId: pendingCandleDelivery.id,
      pendingUsername: pendingCandleDelivery.username,
      pendingTimestamp: pendingCandleDelivery.timestamp,
      resultsCount: results.length
    });
    
    // Check if the pending candle has appeared in the results
    const foundCandle = results.find(r => {
      // Match by document ID if available (most reliable)
      if (pendingCandleDelivery.id && r.id) {
        return r.id === pendingCandleDelivery.id;
      }
      
      // Fallback: Match by username AND timestamp (less reliable but needed for backwards compatibility)
      const isMatch = r.username === pendingCandleDelivery.username || 
                      r.userName === pendingCandleDelivery.username;
      const createdTime = r.createdAt?.getTime ? r.createdAt.getTime() : 0;
      const isRecent = Math.abs(createdTime - pendingCandleDelivery.timestamp) < 2000; // Tighter 2 second window
      
      return isMatch && isRecent;
    });
    
    if (foundCandle) {
      console.log('[Drone Monitor] 🎯 FOUND CANDLE IN FIRESTORE:', foundCandle);
      
      // Check if we've already processed this candle
      const candleKey = foundCandle.id || `${foundCandle.username}_${foundCandle.createdAt?.getTime()}`;
      if (processedCandleIdsRef.current.has(candleKey)) {
        console.log('[Drone Monitor] ❌ Candle already processed, skipping:', candleKey);
        // Clear the pending delivery since we've already handled this
        if (onDeliveryComplete) {
          onDeliveryComplete();
        }
        return;
      }
      
      // Mark this candle as processed
      processedCandleIdsRef.current.add(candleKey);
      console.log('[Drone Monitor] 🚁 STARTING DRONE DELIVERY SEQUENCE!');
      
      // Calculate the position for this candle (it should be the newest, so last position)
      const sortedResults = [...results].sort((a, b) => {
        const aTime = a.createdAt?.getTime ? a.createdAt.getTime() : 0;
        const bTime = b.createdAt?.getTime ? b.createdAt.getTime() : 0;
        return aTime - bTime; // Oldest first
      });
      
      // Find the index of our new candle
      const candleIndex = sortedResults.findIndex(r => 
        (r.username === pendingCandleDelivery.username || r.userName === pendingCandleDelivery.username)
      );
      
      console.log(`[Drone] New candle will be at position ${candleIndex}`);
      
      // Add a 3 second delay to ensure modal is fully closed and visible
      console.log(`[Drone] Modal closed. Waiting 3 seconds before starting delivery for better visibility...`);
      const timeoutId = setTimeout(() => {
        console.log(`[Drone] 3 second delay complete, calling startDroneDelivery...`);
        console.log(`[Drone] Drone state before delivery:`, {
          isDroneStaging,
          isDroneMoving,
          isDroneLowering,
          isDroneRising,
          isDroneReturning,
          droneRef: !!droneRef.current
        });
        
        // Trigger drone delivery to the correct position with the found candle's data
        startDroneDelivery(candleIndex, foundCandle);
        console.log(`[Drone] startDroneDelivery called for position ${candleIndex}`);
        
        // Clear the pending delivery AFTER starting the drone
        // This prevents the same candle from triggering again
        if (onDeliveryComplete) {
          console.log(`[Drone] Calling onDeliveryComplete to clear pending delivery`);
          onDeliveryComplete();
        }
        
        pendingTimeoutsRef.current.delete(timeoutId);
      }, 3000); // 3 second delay for modal to fully close
      pendingTimeoutsRef.current.add(timeoutId);
    }
  }, [pendingCandleDelivery, results, modelLoaded, startDroneDelivery, onDeliveryComplete, isModalOpen, 
      isDroneStaging, isDroneMoving, isDroneLowering, isDroneRising, isDroneReturning]);

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
  
  // Expose drone delivery function to parent
  useEffect(() => {
    if (onDroneDeliveryReady) {
      onDroneDeliveryReady({
        triggerDelivery: startDroneDelivery
      });
    }
  }, [onDroneDeliveryReady, startDroneDelivery]);

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