import { useEffect, useRef, useState } from "react";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import * as THREE from "three";
import { useThree, useFrame } from "@react-three/fiber";
import AnnotationSystem from "@/components/AnnotationSystem";




const CyborgTempleScene = ({ 
  onLoad, 
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = [1.2, 1.2, 1.2],
  isPlaying = false, 
  currentTrack = null,
  showAnnotations = true,
  is80sMode = false,
  onAnnotationClick = null, // Callback when annotation is clicked
  onAgentClick = null, // Callback when an agent is clicked
  isMobile = false, // Pass this prop to determine device type
}) => {
  const groupRef = useRef();
  const { scene, camera, gl } = useThree();
  const hasLoadedRef = useRef(false);
  const mixerRef = useRef();
  const actionsRef = useRef({});
  const danceTimeoutRef = useRef(null);
  const slowdownIntervalRef = useRef(null);
  const rampUpIntervalRef = useRef(null);
  const [loadedModel, setLoadedModel] = useState(null);
  const [detectedMobile, setDetectedMobile] = useState(false);
  const cylinderMeshRef = useRef(); // Ref for the specific cylinder mesh
  const object7MeshRef = useRef(); // Ref for Object_5 (was Object_7)
  const cube010MeshRef = useRef(); // Ref for Cube010
  const previousTrackRef = useRef(null); // Track the previous track for detecting changes
  const transitionTimeoutRef = useRef(null); // For handling track transition slowdowns
  
  // Refs for MOBILE.glb animated objects
  const angelEmptyRef = useRef(); // Parent container for angel and coins
  const angelRef = useRef();
  const coin1Ref = useRef();
  const coin2Ref = useRef();
  const coin3Ref = useRef();
  const coin4Ref = useRef();
  
  // Camera focus state
  const [focusTarget, setFocusTarget] = useState(null);
  const ourLadyRef = useRef(); // Reference to RL80 (OurLady) mesh
  const originalCameraPosition = useRef(null); // Store original camera position
  
  // Hover state for coins
  const [hoveredCoin, setHoveredCoin] = useState(null);
  const coin1OriginalScale = useRef(null);
  const coin1OriginalEmissive = useRef(null);
  const coin2OriginalScale = useRef(null);
  const coin2OriginalEmissive = useRef(null);
  const coin3OriginalScale = useRef(null);
  const coin3OriginalEmissive = useRef(null);
  const coin4OriginalScale = useRef(null);
  const coin4OriginalEmissive = useRef(null);
  
  // Eye mesh refs for blinking animation
  const leftEyeRef = useRef();
  const rightEyeRef = useRef();
  const blinkStateRef = useRef({
    lastBlinkTime: 0,
    nextBlinkDelay: Math.random() * 3000 + 2000, // Random delay between 2-5 seconds
    isBlinking: false,
    blinkProgress: 0
  });
  
  // Detect mobile device on mount
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase()) ||
                             (window.innerWidth <= 768);
      setDetectedMobile(isMobileDevice);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Use prop or detected mobile state
  const isOnMobile = isMobile || detectedMobile;
  
  // Expose the loaded model and camera control functions through ref
  /* useImperativeHandle(ref, () => ({
    current: loadedModel,
    focusOnAgent: (agentId) => {
      // Focus on a specific agent programmatically
      let targetRef = null;
      
      if (agentId === 'RL80' && ourLadyRef.current) {
        targetRef = ourLadyRef.current;
      } else if (agentId === 'Mike' && cube010MeshRef.current) {
        targetRef = cube010MeshRef.current;
      }
      
      if (targetRef) {
        const objectWorldPos = new THREE.Vector3();
        targetRef.getWorldPosition(objectWorldPos);
        
        // Calculate camera position relative to the object
        const cameraOffset = new THREE.Vector3(2, 0.5, 3);
        const cameraPosition = objectWorldPos.clone().add(cameraOffset);
        
        setFocusTarget({
          position: cameraPosition,
          lookAt: objectWorldPos,
          agentId: agentId,
          agentName: agentId
        });
      }
    },
    resetCamera: () => {
      // Reset camera to original position
      setFocusTarget(null);
      if (originalCameraPosition.current) {
        camera.position.copy(originalCameraPosition.current);
        camera.lookAt(0, 0, 0);
      }
    }
  }), [loadedModel, camera]); */

  // Define annotation points - adjust positions based on your temple scene
  const annotations = [
    {
      text: "RL80 Trades 24/7 - A virtuous and autonomous agent with one purpose: learn to trade perpetual contracts and maximize profits for her followers and token holders.",
      attachTo: object7MeshRef, // Attach to Object_7 mesh
      offset: [0, 1.9, 0], // Position slightly above the object center
      textOffset: [0, 0.2, -0.5], // Position text panel above and back
      customCamera: {
        position: [2, -0.8, -0.5], // Camera moved right and lower
        lookAt: [0, -0.5, 0], // Look outward toward the characters
        distance: 1.5 // Slightly increased distance for better framing
      }
    },
    // {
    //   position: [2, 0, -2], // Right side
    //   text: "Digital Offering Station\nPlace virtual candles here"
    // },

 {
      text: "RL80 Holder Neural Network - live display of holders online right now.",
      attachTo: cylinderMeshRef, // Attach to the cylinder mesh
      offset: [0, 0.5, 0], // Position at cylinder center
      textOffset: [0, 0.2, -1], // Position text panel 1.5 units up and 1 unit back
      customCamera: {
        position: [-2, -0.7, 3.3], // Camera moved right and lower
        lookAt: [1, -0.7, -0.1], // Look outward toward the characters
        distance: 1.2 // Slightly increased distance for better framing
      }
    },
    {
      text: "The 3 Wise Mechs - RL80's crypto council: Emo, Macro, and Tekno - specialists in market sentiment, macro trends, and technical analysis, respectively.",
      attachTo: cube010MeshRef, // Attach to Cube010 mesh
      offset: [-1.8, 1.1, 0.5], // Position above the cube center
      textOffset: [0.1, 0, -0.4], // Position text panel above and back
      customCamera: {
        position: [0.2, -1.3, -0.3], // Camera moved right and lower
        lookAt: [-2.7, -1, 0.3], // Look outward toward the characters
        distance: 2.5 // Slightly increased distance for better framing
      }
    },
  ];
  

  useEffect(() => {
    if (hasLoadedRef.current) return;
    
    // Small delay to ensure the ref is attached after first render
    const timer = setTimeout(() => {
      if (!groupRef.current) {
        console.error('[CyborgTempleScene] groupRef.current is still null after mount');
        return;
      }
      
      hasLoadedRef.current = true;
      const currentGroupRef = groupRef.current; // Capture the ref value
      // console.log('[CyborgTempleScene] groupRef.current available, starting model load');

    const gltfLoader = new GLTFLoader();
    
    // Always use DRACO loader since both models may have compression
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath("/draco/");
    gltfLoader.setDRACOLoader(dracoLoader);

    // Determine which model to load based on device type
    const modelPath = isOnMobile ? "/models/MOBILE.glb" : "/models/RL80_4anims.glb";
    const startTime = performance.now();
    // console.log(`[CyborgTempleScene] Starting to load: ${modelPath} (Mobile: ${isOnMobile})`);
    
    // First, verify the model file is accessible
    fetch(modelPath, { method: 'HEAD' })
      .then(response => {
        if (!response.ok) {
          throw new Error(`Model file not accessible: ${response.status} ${response.statusText}`);
        }
        // console.log(`[CyborgTempleScene] Model file verified at: ${modelPath}`);
      })
      .catch(error => {
        console.error(`[CyborgTempleScene] Failed to verify model file:`, error);
      });
    
    let retryCount = 0;
    const maxRetries = 3;
    
    const loadModel = () => {
      gltfLoader.load(
      modelPath, 
      (gltf) => {
        const loadTime = performance.now() - startTime;
        // console.log(`[CyborgTempleScene] Model loaded successfully in ${loadTime.toFixed(2)}ms`);
        // console.log(`[CyborgTempleScene] Model path: ${modelPath}`);
        // console.log(`[CyborgTempleScene] GLTF object:`, gltf);
        
        const templeScene = gltf.scene;
      
      // Store the loaded model in state for external access
      setLoadedModel(templeScene);
      // console.log('[CyborgTempleScene] Model loaded and stored:', templeScene);
      
      // Create an anchor group for positioning
      const anchorGroup = new THREE.Group();
      // Apply different positioning for MOBILE.glb vs RL80_4anims.glb
      if (isOnMobile) {
        // Custom position for MOBILE.glb - adjust these values as needed
        anchorGroup.position.set(0, 0.8, -1); // Lower the mobile model
        anchorGroup.rotation.set(0, 0, 0);
        anchorGroup.scale.set(1.2, 1.2, 1.2); // Slightly larger scale for mobile
      } else {
        // Keep original positioning for RL80_4anims.glb
        anchorGroup.position.set(0, 0, 0);
        anchorGroup.rotation.set(0, 0, 0);
        anchorGroup.scale.set(1, 1, 1);
      }
      
      // Add the temple scene to the anchor group
      anchorGroup.add(templeScene);
      
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
          if (animName === 'Typing' || animName === 'TypingRobot2') {
            // Play TYPE animations for characters
            action.play();
            // console.log(`Playing TYPE animation: ${animation.name}`);
          } else if (animName === 'HaloRotation') {
            // Play HaloRotation animation
            action.play();
            // console.log(`Playing HaloRotation animation: ${animation.name}`);
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
            // console.log(`Playing idle animation: ${animation.name} with offset ${action.time}`);
          }
        });
      }
      
      // Create grid ground
      const gridHelper = new THREE.GridHelper(50, 50, 0x00ff41, 0x00ff41);
      gridHelper.material.opacity = 0.3;
      gridHelper.material.transparent = true;
      gridHelper.position.y = -.06; // Position the grid below the scene
      anchorGroup.add(gridHelper);
      
      // Add the anchor group to our captured group ref
      // Using the captured ref to avoid closure issues
      if (currentGroupRef) {
        currentGroupRef.add(anchorGroup);
        // console.log('[CyborgTempleScene] Added model to group ref');
        // console.log('[CyborgTempleScene] Group children count:', currentGroupRef.children.length);
        // console.log('[CyborgTempleScene] Group children:', currentGroupRef.children);
        
        // Debug: Check visibility and position
        // console.log('[CyborgTempleScene] AnchorGroup visible:', anchorGroup.visible);
        // console.log('[CyborgTempleScene] AnchorGroup position:', anchorGroup.position);
        // console.log('[CyborgTempleScene] AnchorGroup scale:', anchorGroup.scale);
        // console.log('[CyborgTempleScene] Parent group visible:', currentGroupRef.visible);
        // console.log('[CyborgTempleScene] Parent group in scene:', currentGroupRef.parent);
        
        // Ensure everything is visible
        anchorGroup.visible = true;
        templeScene.visible = true;
        
        // Force update
        anchorGroup.updateMatrix();
        anchorGroup.updateMatrixWorld(true);
      } else {
        // This shouldn't happen but as a fallback, add to scene
        console.error('[CyborgTempleScene] currentGroupRef is null, falling back to scene');
        scene.add(anchorGroup);
      }
      
      // Find the specific meshes and add click handlers
      templeScene.traverse((child) => {
        if (child.name === 'Cylinder043_0') {
          // console.log('Found Cylinder043_0 mesh:', child);
          cylinderMeshRef.current = child;
        }
        if (child.name === 'Object_5') {
          // console.log('Found Object_5 mesh:', child);
          object7MeshRef.current = child;
        }
        
        // Find eye meshes for blinking animation
        if (child.name === 'L_eye' || child.name === 'L_Eye') {
          // console.log('Found left eye mesh:', child.name);
          leftEyeRef.current = child;
        }
        if (child.name === 'R_eye' || child.name === 'R_Eye') {
          // console.log('Found right eye mesh:', child.name);
          rightEyeRef.current = child;
        }
        
        // Find OurLady (RL80) and make it clickable
        if (child.name === 'OurLady' || child.name === 'Object_7' || child.name === 'RL80') {
          // console.log('Found OurLady/RL80:', child.name, 'Type:', child.type, 'isMesh:', child.isMesh);
          
          // Get world position of the object
          // const worldPos = new THREE.Vector3();
          // child.getWorldPosition(worldPos);
          // console.log('RL80 world position:', {
          //   x: worldPos.x.toFixed(3),
          //   y: worldPos.y.toFixed(3),
          //   z: worldPos.z.toFixed(3)
          // });
          
          ourLadyRef.current = child;
          
          // Set clickable data on this object and all its children
          const setClickableData = (obj) => {
            obj.userData.clickable = true;
            obj.userData.agentId = 'RL80';
            obj.userData.agentName = 'RL80';
            obj.userData.targetObject = child; // Store reference to the actual object
            
            // Also apply to all children if it's a group
            if (obj.children && obj.children.length > 0) {
              obj.children.forEach(setClickableData);
            }
          };
          
          setClickableData(child);
        }
        
        // Make the three mechs clickable
        if (child.name === 'Emo' || child.name === 'Macro' || child.name === 'Tekno') {
          // console.log('Found Mech:', child.name, 'Type:', child.type, 'isMesh:', child.isMesh);
          
          // Get world position of the mech
          // const mechWorldPos = new THREE.Vector3();
          // child.getWorldPosition(mechWorldPos);
          // console.log(`${child.name} world position:`, {
          //   x: mechWorldPos.x.toFixed(3),
          //   y: mechWorldPos.y.toFixed(3),
          //   z: mechWorldPos.z.toFixed(3)
          // });
          
          const setMechClickableData = (obj) => {
            obj.userData.clickable = true;
            obj.userData.agentId = child.name;
            obj.userData.agentName = child.name;
            obj.userData.targetObject = child; // Store reference to the actual object
            
            // Also apply to all children if it's a group
            if (obj.children && obj.children.length > 0) {
              obj.children.forEach(setMechClickableData);
            }
          };
          
          setMechClickableData(child);
        }
        
        // Make the four screens clickable
        if (child.name === 'Screen1' || child.name === 'Screen2' || child.name === 'Screen3' || child.name === 'Screen4') {
          // console.log('Found Screen:', child.name, 'Type:', child.type, 'isMesh:', child.isMesh);
          
          // Get world position of the screen
          // const screenWorldPos = new THREE.Vector3();
          // child.getWorldPosition(screenWorldPos);
          // console.log(`${child.name} world position:`, {
          //   x: screenWorldPos.x.toFixed(3),
          //   y: screenWorldPos.y.toFixed(3),
          //   z: screenWorldPos.z.toFixed(3)
          // });
          
          const setScreenClickableData = (obj) => {
            obj.userData.clickable = true;
            obj.userData.agentId = child.name;
            obj.userData.agentName = child.name;
            obj.userData.targetObject = child; // Store reference to the actual object
            
            // Also apply to all children if it's a group
            if (obj.children && obj.children.length > 0) {
              obj.children.forEach(setScreenClickableData);
            }
          };
          
          setScreenClickableData(child);
        }
        
        // Find angel and coin objects for MOBILE.glb animations
        if (isOnMobile) {
          if (child.name === 'Angel_Empty') {
            // console.log('Found Angel_Empty parent:', child);
            angelEmptyRef.current = child;
          }
          if (child.name === 'angel' || child.name === 'Angel') {
            // console.log('Found angel object:', child);
            angelRef.current = child;
          }
          if (child.name === 'Coin1') {
            console.log('Found Coin1:', child);
            console.log('Coin1 type:', child.type);
            console.log('Coin1 isMesh:', child.isMesh);
            coin1Ref.current = child;
            
            // Make Coin1 clickable
            const setCoin1ClickableData = (obj) => {
              obj.userData.clickable = true;
              obj.userData.agentId = 'Coin1';
              obj.userData.agentName = 'Coin1';
              obj.userData.targetObject = child;
              obj.userData.isCoin = true; // Mark as coin for special handling
              
              // Also apply to all children if it's a group
              if (obj.children && obj.children.length > 0) {
                obj.children.forEach(setCoin1ClickableData);
              }
            };
            
            setCoin1ClickableData(child);
            console.log('Coin1 userData after setup:', child.userData);
          }
          if (child.name === 'Coin2') {
            console.log('Found Coin2:', child);
            coin2Ref.current = child;
            
            // Make Coin2 clickable
            const setCoin2ClickableData = (obj) => {
              obj.userData.clickable = true;
              obj.userData.agentId = 'Coin2';
              obj.userData.agentName = 'Coin2';
              obj.userData.targetObject = child;
              obj.userData.isCoin = true;
              
              if (obj.children && obj.children.length > 0) {
                obj.children.forEach(setCoin2ClickableData);
              }
            };
            
            setCoin2ClickableData(child);
          }
          if (child.name === 'Coin3') {
            console.log('Found Coin3:', child);
            coin3Ref.current = child;
            
            // Make Coin3 clickable
            const setCoin3ClickableData = (obj) => {
              obj.userData.clickable = true;
              obj.userData.agentId = 'Coin3';
              obj.userData.agentName = 'Coin3';
              obj.userData.targetObject = child;
              obj.userData.isCoin = true;
              
              if (obj.children && obj.children.length > 0) {
                obj.children.forEach(setCoin3ClickableData);
              }
            };
            
            setCoin3ClickableData(child);
          }
          if (child.name === 'Coin4') {
            console.log('Found Coin4:', child);
            coin4Ref.current = child;
            
            // Make Coin4 clickable
            const setCoin4ClickableData = (obj) => {
              obj.userData.clickable = true;
              obj.userData.agentId = 'Coin4';
              obj.userData.agentName = 'Coin4';
              obj.userData.targetObject = child;
              obj.userData.isCoin = true;
              
              if (obj.children && obj.children.length > 0) {
                obj.children.forEach(setCoin4ClickableData);
              }
            };
            
            setCoin4ClickableData(child);
          }
        }
      });
      
      // Call onLoad callback if provided
      if (onLoad) {
        setTimeout(() => {
          onLoad();
        }, 100);
      }
    }, 
    // Progress callback
    (xhr) => {
      const percentComplete = (xhr.loaded / xhr.total) * 100;
      // console.log(`[CyborgTempleScene] Loading progress: ${percentComplete.toFixed(2)}%`);
    },
    // Error callback
    (error) => {
      console.error(`[CyborgTempleScene] Error loading model ${modelPath}:`, error);
      console.error(`[CyborgTempleScene] Error details:`, {
        message: error.message,
        stack: error.stack,
        modelPath: modelPath,
        isOnMobile: isOnMobile
      });
      
      // Check if it's a 404 error
      if (error.message && error.message.includes('404')) {
        console.error(`[CyborgTempleScene] Model file not found at path: ${modelPath}`);
        console.error('[CyborgTempleScene] Please ensure the file exists at: public' + modelPath);
      }
      
      // Retry logic
      if (retryCount < maxRetries) {
        retryCount++;
        console.warn(`[CyborgTempleScene] Retrying model load (attempt ${retryCount}/${maxRetries})...`);
        setTimeout(() => {
          loadModel();
        }, 1000 * retryCount); // Exponential backoff
      } else {
        console.error(`[CyborgTempleScene] Failed to load model after ${maxRetries} attempts`);
        // Still call onLoad even if there's an error, so the page doesn't hang
        if (onLoad) {
          console.warn('[CyborgTempleScene] Calling onLoad despite error to prevent hanging');
          setTimeout(() => {
            onLoad();
          }, 100);
        }
      }
    });
    };
    
    // Start loading the model
    loadModel();

    }, 100); // 100ms delay to ensure ref is attached
    
    // Cleanup function
    return () => {
      clearTimeout(timer);
      if (groupRef.current) {
        // Clear the group's children
        while (groupRef.current.children.length > 0) {
          groupRef.current.remove(groupRef.current.children[0]);
        }
        
        // Dispose of materials and geometries
        groupRef.current.traverse((child) => {
          if (child.geometry) {
            child.geometry.dispose();
          }
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(material => material.dispose());
            } else {
              child.material.dispose();
            }
          }
        });
      }
    };
  }, []); // Empty dependency array - only run once on mount

  // Store initial camera position only once
  useEffect(() => {
    if (!originalCameraPosition.current && camera) {
      originalCameraPosition.current = camera.position.clone();
    }
  }, [camera]);

  // Add raycaster for click detection and keyboard shortcuts
  useEffect(() => {
    if (!groupRef.current || !gl) return;
    
    // console.log('[Click Handler] Setting up click detection, groupRef:', groupRef.current);
    // console.log('[Click Handler] Canvas element:', gl.domElement);
    // console.log('[Click Handler] Canvas pointer-events:', window.getComputedStyle(gl.domElement).pointerEvents);
    
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    
    // Handle escape key to reset camera
    const handleKeyDown = (event) => {
      // Debug: Press 'P' to log all character positions
      if (event.key === 'p' || event.key === 'P') {
        // console.log('=== CHARACTER WORLD POSITIONS ===');
        
        // Find and log each character's position
        if (groupRef.current) {
          groupRef.current.traverse((child) => {
            // Check various possible names
            if (child.name === 'OurLady' || child.name === 'Object_7' || child.name === 'RL80') {
              const pos = new THREE.Vector3();
              child.getWorldPosition(pos);
              // console.log('RL80:', {
              //   x: pos.x.toFixed(3),
              //   y: pos.y.toFixed(3),
              //   z: pos.z.toFixed(3)
              // });
            }
            
            if (child.name === 'Emo' || child.name === 'Macro' || child.name === 'Tekno') {
              const pos = new THREE.Vector3();
              child.getWorldPosition(pos);
              // console.log(`${child.name}:`, {
              //   x: pos.x.toFixed(3),
              //   y: pos.y.toFixed(3),
              //   z: pos.z.toFixed(3)
              // });
            }
            
            if (child.name === 'Mike' || child.name === 'Cube010') {
              const pos = new THREE.Vector3();
              child.getWorldPosition(pos);
              // console.log('Mike/Cube010:', {
              //   x: pos.x.toFixed(3),
              //   y: pos.y.toFixed(3),
              //   z: pos.z.toFixed(3)
              // });
            }
            
            // Log screen positions
            if (child.name === 'Screen1' || child.name === 'Screen2' || 
                child.name === 'Screen3' || child.name === 'Screen4') {
              const pos = new THREE.Vector3();
              child.getWorldPosition(pos);
              // console.log(`${child.name}:`, {
              //   x: pos.x.toFixed(3),
              //   y: pos.y.toFixed(3),
              //   z: pos.z.toFixed(3)
              // });
            }
          });
        }
        // console.log('=================================');
      }
      
      // Debug: Press 'D' to log current camera position for setting up character views
      // if (event.key === 'd' || event.key === 'D') {
      //   console.log('=== CAMERA DEBUG INFO ===');
      //   console.log('Camera Position:', {
      //     x: camera.position.x.toFixed(2),
      //     y: camera.position.y.toFixed(2),
      //     z: camera.position.z.toFixed(2)
      //   });
      //   console.log('Camera Target (looking at center):', { x: 0, y: 0, z: 0 });
      //   console.log('Use these values in agentSettings for the current view');
      //   console.log('========================');
      // }
      
      if (event.key === 'Escape' && focusTarget) {
        // console.log('[Escape] Resetting camera');
        
        // Notify parent that focus is cleared
        if (onAgentClick) {
          onAgentClick(null);
        }
        
        if (originalCameraPosition.current) {
          const resetTarget = {
            position: originalCameraPosition.current.clone(),
            lookAt: new THREE.Vector3(0, 0, 0),
            agentId: null,
            agentName: 'Reset'
          };
          setFocusTarget(resetTarget);
          
          setTimeout(() => {
            setFocusTarget(null);
            // Clear the stored position after reset
            originalCameraPosition.current = null;
          }, 1000);
        } else {
          setFocusTarget(null);
        }
      }
    };
    
    // Also set up hover detection for visual feedback
    const handlePointerMove = (event) => {
      const rect = gl.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(groupRef.current.children, true);
      
      // Change cursor if hovering over clickable object and handle coin hover
      let foundClickable = false;
      let foundCoin = null;
      
      for (let i = 0; i < intersects.length; i++) {
        const object = intersects[i].object;
        if (object.userData.clickable) {
          foundClickable = true;
          
          // Check if it's a coin
          if (object.userData.isCoin) {
            foundCoin = object.userData.agentId;
          }
          break;
        }
      }
      
      // Handle coin hover effects
      if (foundCoin && hoveredCoin !== foundCoin) {
        // Start hovering on a coin
        console.log(`Starting hover on ${foundCoin}`);
        setHoveredCoin(foundCoin);
        
        // Get the appropriate coin ref and scale/emissive refs
        let coinRef, scaleRef, emissiveRef;
        switch(foundCoin) {
          case 'Coin1':
            coinRef = coin1Ref;
            scaleRef = coin1OriginalScale;
            emissiveRef = coin1OriginalEmissive;
            break;
          case 'Coin2':
            coinRef = coin2Ref;
            scaleRef = coin2OriginalScale;
            emissiveRef = coin2OriginalEmissive;
            break;
          case 'Coin3':
            coinRef = coin3Ref;
            scaleRef = coin3OriginalScale;
            emissiveRef = coin3OriginalEmissive;
            break;
          case 'Coin4':
            coinRef = coin4Ref;
            scaleRef = coin4OriginalScale;
            emissiveRef = coin4OriginalEmissive;
            break;
        }
        
        if (coinRef && coinRef.current) {
          // Store original values if not already stored
          if (!scaleRef.current) {
            scaleRef.current = coinRef.current.scale.clone();
          }
          
          // Find the mesh material and store original emissive
          coinRef.current.traverse((child) => {
            if (child.isMesh && child.material) {
              if (!emissiveRef.current) {
                emissiveRef.current = {
                  color: child.material.emissive ? child.material.emissive.clone() : new THREE.Color(0x000000),
                  intensity: child.material.emissiveIntensity || 0
                };
              }
              // Set hover emissive with different colors for each coin
              if (child.material.emissive) {
                const colors = {
                  'Coin1': 0xffdd00, // Gold
                  'Coin2': 0x00ffff, // Cyan
                  'Coin3': 0xff00ff, // Magenta
                  'Coin4': 0x00ff00  // Green
                };
                child.material.emissive = new THREE.Color(colors[foundCoin] || 0xffdd00);
              }
              child.material.emissiveIntensity = 2; // Increase emission
            }
          });
          
          // Scale up slightly
          coinRef.current.scale.multiplyScalar(1.1);
        }
      } else if (!foundCoin && hoveredCoin) {
        // Stop hovering on any coin
        console.log(`Stopping hover on ${hoveredCoin}`);
        
        // Get the appropriate coin ref and scale/emissive refs
        let coinRef, scaleRef, emissiveRef;
        switch(hoveredCoin) {
          case 'Coin1':
            coinRef = coin1Ref;
            scaleRef = coin1OriginalScale;
            emissiveRef = coin1OriginalEmissive;
            break;
          case 'Coin2':
            coinRef = coin2Ref;
            scaleRef = coin2OriginalScale;
            emissiveRef = coin2OriginalEmissive;
            break;
          case 'Coin3':
            coinRef = coin3Ref;
            scaleRef = coin3OriginalScale;
            emissiveRef = coin3OriginalEmissive;
            break;
          case 'Coin4':
            coinRef = coin4Ref;
            scaleRef = coin4OriginalScale;
            emissiveRef = coin4OriginalEmissive;
            break;
        }
        
        if (coinRef && coinRef.current) {
          // Restore original scale
          if (scaleRef.current) {
            coinRef.current.scale.copy(scaleRef.current);
          }
          
          // Restore original emissive
          coinRef.current.traverse((child) => {
            if (child.isMesh && child.material && emissiveRef.current) {
              child.material.emissive = emissiveRef.current.color;
              child.material.emissiveIntensity = emissiveRef.current.intensity;
            }
          });
        }
        
        setHoveredCoin(null);
      }
      
      gl.domElement.style.cursor = foundClickable ? 'pointer' : 'default';
    };
    
    const handleClick = (event) => {
      // Prevent default to avoid any interference
      event.preventDefault();
      event.stopPropagation();
      
      // Calculate mouse position in normalized device coordinates
      const rect = gl.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      console.log('[Click] Mouse position:', mouse.x, mouse.y);
      console.log('[Click] Canvas rect:', rect);
      console.log('[Click] Is mobile:', isOnMobile);
      
      // Update the picking ray with the camera and mouse position
      raycaster.setFromCamera(mouse, camera);
      
      // Calculate objects intersecting the picking ray
      const intersects = raycaster.intersectObjects(groupRef.current.children, true);
      
      console.log('[Click] Intersected objects:', intersects.length);
      if (intersects.length > 0) {
        console.log('[Click] First 3 intersected objects:', intersects.slice(0, 3).map(i => ({
          name: i.object.name,
          type: i.object.type,
          clickable: i.object.userData.clickable,
          isCoin: i.object.userData.isCoin,
          agentId: i.object.userData.agentId
        })));
      }
      
      let clickedOnAgent = false;
      
      for (let i = 0; i < intersects.length; i++) {
        const object = intersects[i].object;
        // console.log('[Click] Checking object:', object.name, 'clickable:', object.userData.clickable);
        
        if (object.userData.clickable) {
          clickedOnAgent = true;
          console.log('Clicked on agent:', object.userData.agentName);
          
          // Special handling for coins - directly trigger the FocusedAgentCard
          if (object.userData.isCoin) {
            console.log(`Coin click detected! Calling onAgentClick with ${object.userData.agentId}`);
            // Call the parent callback to show FocusedAgentCard
            if (onAgentClick) {
              onAgentClick(object.userData.agentId); // This will trigger the FocusedAgentCard to show
            }
            break; // Exit early for coins
          }
          
          // Store the current camera position BEFORE any animation
          // But only if we're not already focused on something
          if (!focusTarget) {
            originalCameraPosition.current = camera.position.clone();
            // console.log('Stored camera position for return:', originalCameraPosition.current);
          }
          
          // Get the target object's world position
          const targetObject = object.userData.targetObject || object;
          const objectWorldPos = new THREE.Vector3();
          targetObject.getWorldPosition(objectWorldPos);
          
          // console.log('Target object world position:', objectWorldPos);
          
          // Define camera positions based on actual character world positions
          // Character positions from console:
          // RL80: (1.704, -1.652, 1.476)
          // Emo: (-1.554, -1.719, -1.351)
          // Macro: (-1.315, -1.672, 1.636)
          // Tekno: (1.512, -1.625, -1.575)
          
          const agentSettings = {
            'RL80': { 
              // RL80 at (1.704, -1.652, 1.476)
              // Camera should be closer to center (opposite side)
              cameraPos: new THREE.Vector3(1, -0.4, 0.7),  // Positioned toward center, looking outward
              lookAtPos: new THREE.Vector3(1.804, -0.7, 2)  // Look at upper body
            },
            'Emo': { 
              // Emo at (-1.554, -1.719, -1.351)
              // Camera positioned on opposite side (toward center)
              cameraPos: new THREE.Vector3(-0.9, -0.5, -0.7),  // Positioned toward center, looking outward
              lookAtPos: new THREE.Vector3(-1.3, -0.6,  -1.351)  // Look at upper body
            },
            'Macro': { 
              // Macro at (-1.315, -1.672, 1.636)
              // Camera positioned on opposite side (toward center)
              cameraPos: new THREE.Vector3(-0.5, -0.5, 1.3),  // Positioned toward center, looking outward
              lookAtPos: new THREE.Vector3(-1.515, -0.7, 1.636)  // Look at upper body
            },
            'Tekno': { 
              // Tekno at (1.512, -1.625, -1.575)
              // Camera positioned on opposite side (toward center)
              cameraPos: new THREE.Vector3(0.7, -0.3, -1.3),  // Positioned toward center, looking outward
              lookAtPos: new THREE.Vector3(0.9, -0.4,  -1.351)  // Look at upper body
            },
            // Screen positions from console:
            // Screen1: (-0.632, 0.593, -0.682)
            // Screen2: (-0.766, 0.593, 0.975)
            // Screen3: (0.995, 0.614, -1.027)
            // Screen4: (0.770, 0.614, 0.552)
            
            'Screen1': {
              // Screen1 at (-0.632, 0.593, -0.682)
              // Position camera in front of screen
              cameraPos: new THREE.Vector3(-1.932, 0.563, -1.9),  // Move camera forward (positive Z)
              lookAtPos: new THREE.Vector3(0.732, 0.693, 0.482)  // Look at screen center
            },
            'Screen2': {
              // Screen2 at (-0.766, 0.593, 0.975)
              // Position camera in front of screen
              cameraPos: new THREE.Vector3(-1.866, 0.393, 2.2),  // Move camera forward (positive Z)
              lookAtPos: new THREE.Vector3(-0.766, 0.593, 0.975)  // Look at screen center
            },
            'Screen3': {
              // Screen3 at (0.995, 0.614, -1.027)
              // Position camera in front of screen
              cameraPos: new THREE.Vector3(1.9, 0.564, -2.3),  // Move camera forward (positive Z)
              lookAtPos: new THREE.Vector3(1.4, 0.614, -1.7)  // Look at screen center
            },
            'Screen4': {
              // Screen4 at (0.770, 0.614, 0.552)
              // Position camera in front of screen
              cameraPos: new THREE.Vector3(1.90, 0.314, 1.6),  // Move camera forward (positive Z)
              lookAtPos: new THREE.Vector3(0.470, 0.714, .352)  // Look at screen center
            },
          };
          
          const settings = agentSettings[object.userData.agentId];
          
          if (!settings) {
            // Fallback: calculate a reasonable position based on object location
            const cameraPosition = new THREE.Vector3(
              objectWorldPos.x + 2,
              objectWorldPos.y + 0.5,
              objectWorldPos.z + 3
            );
            const lookAtTarget = objectWorldPos.clone();
            lookAtTarget.y += 0.5;
            
            setFocusTarget({
              position: cameraPosition,
              lookAt: lookAtTarget,
              agentId: object.userData.agentId,
              agentName: object.userData.agentName
            });
          } else {
            // Use absolute positions for known agents
            setFocusTarget({
              position: settings.cameraPos.clone(),
              lookAt: settings.lookAtPos.clone(),
              agentId: object.userData.agentId,
              agentName: object.userData.agentName
            });
          }
          
          // Call the parent callback if provided
          if (onAgentClick) {
            onAgentClick(object.userData.agentId);
          }
          
          break; // Stop after first clickable object
        }
      }
      
      // If we didn't click on an agent and we're currently focused, reset the camera
      if (!clickedOnAgent && focusTarget) {
        // console.log('[Click] Clicked on empty space, resetting camera');
        
        // Notify parent that focus is cleared
        if (onAgentClick) {
          onAgentClick(null);
        }
        
        // Smoothly return to the position before we focused
        if (originalCameraPosition.current) {
          const resetTarget = {
            position: originalCameraPosition.current.clone(),
            lookAt: new THREE.Vector3(0, 0, 0),
            agentId: null,
            agentName: 'Reset'
          };
          setFocusTarget(resetTarget);
          
          // Clear the focus target after animation completes
          setTimeout(() => {
            setFocusTarget(null);
            // Clear the stored position after reset to avoid conflicts
            originalCameraPosition.current = null;
          }, 1000);
        } else {
          // If no stored position, just clear focus
          setFocusTarget(null);
        }
      }
    };
    
    gl.domElement.addEventListener('click', handleClick);
    gl.domElement.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      gl.domElement.removeEventListener('click', handleClick);
      gl.domElement.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('keydown', handleKeyDown);
      gl.domElement.style.cursor = 'default';
    };
  }, [gl, camera, onAgentClick, loadedModel, focusTarget, originalCameraPosition, hoveredCoin, 
      coin1OriginalScale, coin1OriginalEmissive, coin2OriginalScale, coin2OriginalEmissive,
      coin3OriginalScale, coin3OriginalEmissive, coin4OriginalScale, coin4OriginalEmissive, isOnMobile]); // Added dependencies

  // Detect track changes and trigger transition effect
  useEffect(() => {
    if (!actionsRef.current || Object.keys(actionsRef.current).length === 0) return;
    
    // Check if track has changed (not just on first load)
    if (previousTrackRef.current && currentTrack && previousTrackRef.current.name !== currentTrack.name) {
      // console.log('[CyborgTempleScene] Track changed from', previousTrackRef.current.name, 'to', currentTrack.name);
      
      const actions = actionsRef.current;
      
      // Immediately slow down dancing during track transition
      ['Dance.001', 'Dance.002', 'Dance.003'].forEach(danceAnim => {
        if (actions[danceAnim] && actions[danceAnim].isRunning()) {
          actions[danceAnim].timeScale = 0.2; // Slow to 20% speed during transition
        }
      });
      
      // Clear any existing transition timeout
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
      
      // After a brief pause, restore the new track's BPM
      transitionTimeoutRef.current = setTimeout(() => {
        const referenceBPM = 100;
        const trackBPM = currentTrack?.bpm || referenceBPM;
        const speedMultiplier = trackBPM / referenceBPM;
        
        ['Dance.001', 'Dance.002', 'Dance.003'].forEach(danceAnim => {
          if (actions[danceAnim] && actions[danceAnim].isRunning()) {
            actions[danceAnim].timeScale = speedMultiplier;
            // console.log(`[CyborgTempleScene] Restored dance speed to ${speedMultiplier}x for ${currentTrack.name}`);
          }
        });
      }, 800); // 0.8 second transition period
    }
    
    // Update the previous track reference
    previousTrackRef.current = currentTrack;
  }, [currentTrack]);
  
  // Handle dance animation switching based on music playing state
  useEffect(() => {
    if (!actionsRef.current || Object.keys(actionsRef.current).length === 0) return;
    
    const actions = actionsRef.current;
    
    // Clear any pending dance timeout
    if (danceTimeoutRef.current) {
      clearTimeout(danceTimeoutRef.current);
      danceTimeoutRef.current = null;
    }

    // Log available animations to help identify dance animations
    // console.log('[CyborgTempleScene] Switching animations. isPlaying:', isPlaying);
    // console.log('[CyborgTempleScene] Available animations:', Object.keys(actions));
    
    if (isPlaying) {
      // console.log('[CyborgTempleScene] Music started, characters will start dancing in 2 seconds...');
      
      // Clear any existing timeouts/intervals
      if (danceTimeoutRef.current) {
        clearTimeout(danceTimeoutRef.current);
        danceTimeoutRef.current = null;
      }
      if (slowdownIntervalRef.current) {
        clearInterval(slowdownIntervalRef.current);
        slowdownIntervalRef.current = null;
      }
      if (rampUpIntervalRef.current) {
        clearInterval(rampUpIntervalRef.current);
        rampUpIntervalRef.current = null;
      }
      
      // Keep TYPE animations running for characters
      if (actions['Typing'] && !actions['Typing'].isRunning()) {
        actions['Typing'].play();
      }
      if (actions['TypingRobot2'] && !actions['TypingRobot2'].isRunning()) {
        actions['TypingRobot2'].play();
      }
      // Delay the dance animations by 2 seconds
      danceTimeoutRef.current = setTimeout(() => {
        // console.log('[CyborgTempleScene] Starting dance animations after delay...');
        
        // Stop idle animations for characters that will dance
        ['Idle.001', 'Idle.002', 'Idle.003'].forEach(idleAnim => {
          if (actions[idleAnim]) {
            actions[idleAnim].stop();
          }
        });
        
        // Calculate dance speed based on track BPM
        // Base reference BPM (can be adjusted for best visual effect)
        const referenceBPM = 100; // This is the BPM the animations look good at normally
        const trackBPM = currentTrack?.bpm || referenceBPM;
        const targetSpeedMultiplier = trackBPM / referenceBPM;
        
        // Play dance animations starting slow and ramping up
        ['Dance.001', 'Dance.002', 'Dance.003'].forEach((danceAnim) => {
          if (actions[danceAnim]) {
            actions[danceAnim].reset();
            actions[danceAnim].timeScale = 0.1; // Start very slow
            
            // Set different starting times based on animation name
            if (danceAnim === 'Dance.001') {
              actions[danceAnim].time = Math.random() * actions[danceAnim].getClip().duration; // Random offset
            } else if (danceAnim === 'Dance.002') {
              actions[danceAnim].time = actions[danceAnim].getClip().duration * 0.33; // Start 1/3 through
            } else if (danceAnim === 'Dance.003') {
              actions[danceAnim].time = actions[danceAnim].getClip().duration * 0.66; // Start 2/3 through
            }
            
            actions[danceAnim].play();
            // console.log(`✅ Starting dance animation: ${danceAnim} - ramping up to ${targetSpeedMultiplier}x (${trackBPM} BPM)`);
          }
        });
        
        // Gradually ramp up to full speed
        let currentSpeed = 0.1;
        const rampDuration = 1500; // 1.5 seconds to reach full speed
        const intervalTime = 50; // Update every 50ms
        const speedIncrement = (targetSpeedMultiplier - 0.1) / (rampDuration / intervalTime);
        
        rampUpIntervalRef.current = setInterval(() => {
          currentSpeed += speedIncrement;
          
          if (currentSpeed >= targetSpeedMultiplier) {
            clearInterval(rampUpIntervalRef.current);
            rampUpIntervalRef.current = null;
            currentSpeed = targetSpeedMultiplier;
            // console.log(`[CyborgTempleScene] Dance animations reached target speed: ${targetSpeedMultiplier}x`);
          }
          
          // Apply the current speed to all dance animations
          ['Dance.001', 'Dance.002', 'Dance.003'].forEach(danceAnim => {
            if (actions[danceAnim] && actions[danceAnim].isRunning()) {
              actions[danceAnim].timeScale = currentSpeed;
            }
          });
        }, intervalTime);
      }, 2000); // 2 second delay
      
    } else {
      // Gradually slow down and stop dance animations
      // console.log('[CyborgTempleScene] Music stopped, characters will gradually slow down dancing...');
      
      // Clear any pending timeouts/intervals
      if (danceTimeoutRef.current) {
        clearTimeout(danceTimeoutRef.current);
        danceTimeoutRef.current = null;
      }
      if (slowdownIntervalRef.current) {
        clearInterval(slowdownIntervalRef.current);
        slowdownIntervalRef.current = null;
      }
      if (rampUpIntervalRef.current) {
        clearInterval(rampUpIntervalRef.current);
        rampUpIntervalRef.current = null;
      }
      
      // Start the gradual slowdown process
      // Calculate initial speed based on current track BPM
      const referenceBPM = 100;
      const trackBPM = currentTrack?.bpm || referenceBPM;
      const initialSpeed = trackBPM / referenceBPM;
      
      let currentSpeed = initialSpeed;
      const slowdownDuration = 2000; // 2 seconds to slow down
      const intervalTime = 50; // Update every 50ms for smooth transition
      const speedDecrement = initialSpeed / (slowdownDuration / intervalTime); // Calculate how much to decrease each interval
      
      slowdownIntervalRef.current = setInterval(() => {
        currentSpeed -= speedDecrement;
        
        if (currentSpeed <= 0) {
          // Stop the slowdown and blend to idle animations
          clearInterval(slowdownIntervalRef.current);
          slowdownIntervalRef.current = null;
          
          // console.log('[CyborgTempleScene] Dance animations fully stopped, switching to idle...');
          
          // Stop dance animations
          ['Dance.001', 'Dance.002', 'Dance.003'].forEach(danceAnim => {
            if (actions[danceAnim]) {
              actions[danceAnim].stop();
            }
          });
          
          // Restart idle animations with different time offsets
          ['Idle.001', 'Idle.002', 'Idle.003'].forEach((idleAnim) => {
            if (actions[idleAnim]) {
              actions[idleAnim].reset();
              
              // Set different starting times based on animation name
              if (idleAnim === 'Idle.001') {
                actions[idleAnim].time = Math.random() * actions[idleAnim].getClip().duration; // Random offset
              } else if (idleAnim === 'Idle.002') {
                actions[idleAnim].time = actions[idleAnim].getClip().duration * 0.33; // Start 1/3 through
              } else if (idleAnim === 'Idle.003') {
                actions[idleAnim].time = actions[idleAnim].getClip().duration * 0.66; // Start 2/3 through
              }
              
              actions[idleAnim].play();
              // console.log(`✅ Restarting idle animation: ${idleAnim} with offset ${actions[idleAnim].time}`);
            }
          });
        } else {
          // Gradually slow down dance animations
          ['Dance.001', 'Dance.002', 'Dance.003'].forEach(danceAnim => {
            if (actions[danceAnim] && actions[danceAnim].isRunning()) {
              actions[danceAnim].timeScale = Math.max(0.1, currentSpeed); // Don't go below 0.1 to avoid stopping mid-slowdown
            }
          });
        }
      }, intervalTime);
    }
  }, [isPlaying, currentTrack]);
  
  // Cleanup transition timeout on unmount
  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, []);
  

  // Animation loop
  useFrame((state, delta) => {
    if (mixerRef.current) {
      mixerRef.current.update(delta);
    }
    
    // Blinking animation for RL80's eyes
    if (leftEyeRef.current && rightEyeRef.current && !isOnMobile) {
      const currentTime = state.clock.getElapsedTime() * 1000; // Convert to milliseconds
      const blinkState = blinkStateRef.current;
      
      // Store original positions if not already stored
      if (!leftEyeRef.current.userData.originalPosition) {
        leftEyeRef.current.userData.originalPosition = leftEyeRef.current.position.clone();
        leftEyeRef.current.userData.originalScale = leftEyeRef.current.scale.clone();
      }
      if (!rightEyeRef.current.userData.originalPosition) {
        rightEyeRef.current.userData.originalPosition = rightEyeRef.current.position.clone();
        rightEyeRef.current.userData.originalScale = rightEyeRef.current.scale.clone();
      }
      
      // Check if it's time to blink
      if (!blinkState.isBlinking && currentTime - blinkState.lastBlinkTime > blinkState.nextBlinkDelay) {
        blinkState.isBlinking = true;
        blinkState.blinkProgress = 0;
        blinkState.lastBlinkTime = currentTime;
        // Set random delay for next blink (2-5 seconds)
        blinkState.nextBlinkDelay = Math.random() * 3000 + 2000;
      }
      
      // Animate the blink
      if (blinkState.isBlinking) {
        const blinkDuration = 150; // Total blink duration in milliseconds
        const timeSinceBlinkStart = currentTime - blinkState.lastBlinkTime;
        
        if (timeSinceBlinkStart < blinkDuration) {
          // Calculate blink progress (0 to 1 and back to 0)
          const halfDuration = blinkDuration / 2;
          let progress;
          
          if (timeSinceBlinkStart < halfDuration) {
            // Closing eyes
            progress = timeSinceBlinkStart / halfDuration;
          } else {
            // Opening eyes
            progress = 1 - ((timeSinceBlinkStart - halfDuration) / halfDuration);
          }
          
          // Apply scale transformation to simulate closing eyes
          // Use setFromMatrixScale to maintain position while scaling
          const eyeScale = 1 - (progress * 0.9); // Don't fully close to 0, leave at 0.1
          
          // Scale from the center of each eye mesh
          leftEyeRef.current.scale.set(
            leftEyeRef.current.userData.originalScale.x,
            leftEyeRef.current.userData.originalScale.y * eyeScale,
            leftEyeRef.current.userData.originalScale.z
          );
          rightEyeRef.current.scale.set(
            rightEyeRef.current.userData.originalScale.x,
            rightEyeRef.current.userData.originalScale.y * eyeScale,
            rightEyeRef.current.userData.originalScale.z
          );
          
          // Compensate for position shift when scaling
          // Move eyes slightly to maintain their visual position
          const positionOffset = (1 - eyeScale) * 0.01; // Adjust this value as needed
          leftEyeRef.current.position.y = leftEyeRef.current.userData.originalPosition.y - positionOffset;
          rightEyeRef.current.position.y = rightEyeRef.current.userData.originalPosition.y - positionOffset;
          
        } else {
          // Blink complete, reset to original
          blinkState.isBlinking = false;
          leftEyeRef.current.scale.copy(leftEyeRef.current.userData.originalScale);
          rightEyeRef.current.scale.copy(rightEyeRef.current.userData.originalScale);
          leftEyeRef.current.position.copy(leftEyeRef.current.userData.originalPosition);
          rightEyeRef.current.position.copy(rightEyeRef.current.userData.originalPosition);
        }
      }
    }
    
    // Camera focus animation
    if (focusTarget) {
      // Smoothly move camera to target position
      camera.position.lerp(focusTarget.position, 0.05);
      
      // Look at the target
      const lookAtVector = new THREE.Vector3();
      lookAtVector.lerpVectors(
        new THREE.Vector3(
          camera.getWorldDirection(new THREE.Vector3()).x,
          camera.getWorldDirection(new THREE.Vector3()).y,
          camera.getWorldDirection(new THREE.Vector3()).z
        ),
        focusTarget.lookAt,
        0.05
      );
      camera.lookAt(focusTarget.lookAt);
      
      // Check if we're close enough to stop animating
      if (camera.position.distanceTo(focusTarget.position) < 0.1) {
        // Optional: trigger a callback when focus is complete
        // console.log('Camera focused on:', focusTarget.agentName);
      }
    }
    
    // Add subtle animations for mobile objects
    if (isOnMobile) {
      // Angel_Empty hover animation - subtle up and down motion for the entire group
      if (angelEmptyRef.current) {
        const time = state.clock.getElapsedTime();
        // Store original Y position if not already stored
        if (angelEmptyRef.current.userData.originalY === undefined) {
          angelEmptyRef.current.userData.originalY = angelEmptyRef.current.position.y;
        }
        // Apply hover animation relative to original position
        angelEmptyRef.current.position.y = angelEmptyRef.current.userData.originalY + Math.sin(time * 0.8) * 0.01; // Gentle hover with 0.05 units amplitude
      }
      
      // Coin animations - subtle individual hovering
      const time = state.clock.getElapsedTime();
      
      // Helper function for individual coin hovering
      const hoverCoin = (coinRef, phaseOffset, speed = 1.2, amplitude = 0.01) => {
        if (!coinRef.current) return;
        
        // Store initial Y position if not set
        if (coinRef.current.userData.initialY === undefined) {
          coinRef.current.userData.initialY = coinRef.current.position.y;
          // Debug log for Coin3
          if (coinRef.current.name === 'Coin3') {
            // console.log('Coin3 initial Y:', coinRef.current.userData.initialY);
            // console.log('Coin3 children:', coinRef.current.children);
          }
        }
        
        // Special handling for Coin3 since it's a Group
        if (coinRef.current.name === 'Coin3' && coinRef.current.type === 'Group') {
          // Use much smaller amplitude for the Group
          coinRef.current.position.y = coinRef.current.userData.initialY + 
            Math.sin(time * speed + phaseOffset) * (amplitude * 0.1); // Reduce amplitude by 70%
        } else {
          // Normal handling for Mesh coins
          coinRef.current.position.y = coinRef.current.userData.initialY + 
            Math.sin(time * speed + phaseOffset) * amplitude;
        }
      };
      
      // Apply hovering to each coin with different phases and speeds
      hoverCoin(coin1Ref, 0, 1.2, 0.015);           // Base hover
      hoverCoin(coin2Ref, Math.PI * 0.5, 1.0, 0.012);  // Quarter phase offset, slower
      hoverCoin(coin3Ref, Math.PI * 1.5, 1.1, 0.01);        // Opposite phase, faster
      hoverCoin(coin4Ref, Math.PI * 1.5, 1.1, 0.01);   // Three-quarter phase, smallest amplitude
    }
  });

  // Always return the group that contains the model  
  return (
    <group ref={groupRef} visible={true} position={position} scale={scale} rotation={rotation}>
      {/* The 3D model is added dynamically in useEffect */}
    </group>
  );
};

CyborgTempleScene.displayName = 'CyborgTempleScene';

export default CyborgTempleScene;