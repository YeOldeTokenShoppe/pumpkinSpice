import { useEffect, useRef, useState, memo, forwardRef, useImperativeHandle } from "react";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import * as THREE from "three";
import { useThree, useFrame } from "@react-three/fiber";
import AnnotationSystem from "@/components/AnnotationSystem";




const CyborgTempleScene = forwardRef(({ 
  onLoad, 
  position = [0, 0.9, 0],
  rotation = [0, 0, 0],
  scale = [1.2, 1.2, 1.2],
  isPlaying = false, 
  currentTrack = null,
  showAnnotations = true,
  is80sMode = false,
  onAnnotationClick = null, // Callback when annotation is clicked
  onAgentClick = null, // Callback when an agent is clicked
  isMobile = false, // Pass this prop to determine device type
}, ref) => {
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
  useImperativeHandle(ref, () => ({
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
  }), [loadedModel, camera]);

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
    hasLoadedRef.current = true;

    const gltfLoader = new GLTFLoader();
    
    // Always use DRACO loader since both models may have compression
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath("/draco/");
    gltfLoader.setDRACOLoader(dracoLoader);

    // Determine which model to load based on device type
    const modelPath = isOnMobile ? "/models/MOBILE.glb" : "/models/RL80_4anims.glb";
    const startTime = performance.now();
    console.log(`[CyborgTempleScene] Starting to load: ${modelPath} (Mobile: ${isOnMobile})`);
    
    gltfLoader.load(modelPath, (gltf) => {
      const loadTime = performance.now() - startTime;
      console.log(`[CyborgTempleScene] Model loaded in ${loadTime.toFixed(2)}ms`);
      
      const templeScene = gltf.scene;
      
      // Store the loaded model in state for external access
      setLoadedModel(templeScene);
      // console.log('[CyborgTempleScene] Model loaded and stored:', templeScene);
      
      // Create an anchor group for positioning
      const anchorGroup = new THREE.Group();
      // Use different positions and scales for mobile vs desktop
      const mobilePosition = [0, 1.5, 0];
      const mobileScale = [0.8, 0.8, 0.8];
      const desktopPosition = position;
      const desktopScale = scale;
      
      anchorGroup.position.set(...(isOnMobile ? mobilePosition : desktopPosition));
      anchorGroup.rotation.set(...rotation);
      anchorGroup.scale.set(...(isOnMobile ? mobileScale : desktopScale));
      
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
      
      // Add the anchor group to the scene
      scene.add(anchorGroup);
      
      // Store reference for cleanup
      groupRef.current = anchorGroup;
      
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
        
        // Find OurLady (RL80) and make it clickable
        if (child.name === 'OurLady' || child.name === 'Object_7' || child.name === 'RL80') {
          console.log('Found OurLady/RL80:', child.name, 'Type:', child.type, 'isMesh:', child.isMesh);
          
          // Get world position of the object
          const worldPos = new THREE.Vector3();
          child.getWorldPosition(worldPos);
          console.log('OurLady world position:', worldPos);
          
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
        if (child.name === 'Mike' || child.name === 'Emo' || child.name === 'Macro' || child.name === 'Tekno') {
          console.log('Found Mech:', child.name, 'Type:', child.type, 'isMesh:', child.isMesh);
          
          // Get world position of the mech
          const mechWorldPos = new THREE.Vector3();
          child.getWorldPosition(mechWorldPos);
          console.log(`${child.name} world position:`, mechWorldPos);
          
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
        
        // Find angel and coin objects for MOBILE.glb animations
        if (isOnMobile) {
          if (child.name === 'Angel_Empty') {
            console.log('Found Angel_Empty parent:', child);
            angelEmptyRef.current = child;
          }
          if (child.name === 'angel' || child.name === 'Angel') {
            console.log('Found angel object:', child);
            angelRef.current = child;
          }
          if (child.name === 'Coin1') {
            console.log('Found Coin1:', child);
            coin1Ref.current = child;
          }
          if (child.name === 'Coin2') {
            console.log('Found Coin2:', child);
            coin2Ref.current = child;
          }
          if (child.name === 'Coin3') {
            console.log('Found Coin3:', child);
            coin3Ref.current = child;
          }
          if (child.name === 'Coin4') {
            console.log('Found Coin4:', child);
            coin4Ref.current = child;
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
    undefined,
    (error) => {
      console.error(`Error loading model ${modelPath}:`, error);
      // Still call onLoad even if there's an error, so the page doesn't hang
      if (onLoad) {
        setTimeout(() => {
          onLoad();
        }, 100);
      }
    });

    // Cleanup function
    return () => {
      if (groupRef.current) {
        // Remove from scene
        scene.remove(groupRef.current);
        
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
  }, [scene, position, rotation, scale, onLoad, isOnMobile]);

  // Store original camera position on first render
  useEffect(() => {
    if (!originalCameraPosition.current && camera) {
      originalCameraPosition.current = camera.position.clone();
    }
  }, [camera]);

  // Add raycaster for click detection and keyboard shortcuts
  useEffect(() => {
    if (!groupRef.current || !gl) return;
    
    console.log('[Click Handler] Setting up click detection, groupRef:', groupRef.current);
    console.log('[Click Handler] Canvas element:', gl.domElement);
    console.log('[Click Handler] Canvas pointer-events:', window.getComputedStyle(gl.domElement).pointerEvents);
    
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    
    // Handle escape key to reset camera
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && focusTarget) {
        console.log('[Escape] Resetting camera');
        setFocusTarget(null);
        
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
          }, 1500);
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
      
      // Change cursor if hovering over clickable object
      let foundClickable = false;
      for (let i = 0; i < intersects.length; i++) {
        if (intersects[i].object.userData.clickable) {
          foundClickable = true;
          break;
        }
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
      
      // Update the picking ray with the camera and mouse position
      raycaster.setFromCamera(mouse, camera);
      
      // Calculate objects intersecting the picking ray
      const intersects = raycaster.intersectObjects(groupRef.current.children, true);
      
      console.log('[Click] Intersected objects:', intersects.length);
      
      let clickedOnAgent = false;
      
      for (let i = 0; i < intersects.length; i++) {
        const object = intersects[i].object;
        console.log('[Click] Checking object:', object.name, 'clickable:', object.userData.clickable);
        
        if (object.userData.clickable) {
          clickedOnAgent = true;
          console.log('Clicked on agent:', object.userData.agentName);
          
          // Get the target object's world position
          const targetObject = object.userData.targetObject || object;
          const objectWorldPos = new THREE.Vector3();
          targetObject.getWorldPosition(objectWorldPos);
          
          console.log('Target object world position:', objectWorldPos);
          
          // Calculate the direction from the object to the center (0,0,0)
          // This helps us position the camera "in front" of each model
          const directionToCenter = new THREE.Vector3(0, 0, 0).sub(objectWorldPos).normalize();
          
          // Custom settings per agent (optional)
          const agentSettings = {
            'RL80': { distance: 1.5, height: -1.8, lookAtHeight: 1 },
            'Emo': { distance: 1.5, height: -0.9, lookAtHeight: 1.1 },
            'Macro': { distance: 1.5, height: -2, lookAtHeight: 1 },
            'Tekno': { distance: 1.5, height: -0.5, lookAtHeight: 1 }
          };
          
          const settings = agentSettings[object.userData.agentId] || { distance: 3, height: 1, lookAtHeight: 0.8 };
          
          // Calculate camera position
          // Position camera "in front" of the model (opposite side from center)
          // and slightly above
          const distance = settings.distance; // Distance from the model
          const height = settings.height; // Height above the model's base
          
          const cameraPosition = new THREE.Vector3();
          // Start from object position
          cameraPosition.copy(objectWorldPos);
          // Move TOWARD center (in front of the model, since models face inward)
          cameraPosition.x += directionToCenter.x * distance;
          cameraPosition.z += directionToCenter.z * distance;
          // Set height
          cameraPosition.y = objectWorldPos.y + height;
          
          // Set the lookAt target higher up on the model (not at its base)
          const lookAtTarget = new THREE.Vector3();
          lookAtTarget.copy(objectWorldPos);
          lookAtTarget.y += settings.lookAtHeight; // Look at a point above the base
          
          console.log('Camera position:', cameraPosition);
          console.log('LookAt target:', lookAtTarget);
          
          // Set focus target for camera animation
          setFocusTarget({
            position: cameraPosition,
            lookAt: lookAtTarget, // Look at a point higher up on the model
            agentId: object.userData.agentId,
            agentName: object.userData.agentName
          });
          
          // Call the parent callback if provided
          if (onAgentClick) {
            onAgentClick(object.userData.agentId);
          }
          
          break; // Stop after first clickable object
        }
      }
      
      // If we didn't click on an agent and we're currently focused, reset the camera
      if (!clickedOnAgent && focusTarget) {
        console.log('[Click] Clicked on empty space, resetting camera');
        setFocusTarget(null);
        
        // Notify parent that focus is cleared
        if (onAgentClick) {
          onAgentClick(null);
        }
        
        // Smoothly return to original position
        if (originalCameraPosition.current) {
          const resetTarget = {
            position: originalCameraPosition.current.clone(),
            lookAt: new THREE.Vector3(0, 0, 0),
            agentId: null,
            agentName: 'Reset'
          };
          setFocusTarget(resetTarget);
          
          // Clear the focus target after a short delay to stop the animation
          setTimeout(() => {
            setFocusTarget(null);
          }, 1500); // Adjust timing as needed
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
  }, [gl, camera, onAgentClick, loadedModel, focusTarget, originalCameraPosition]); // Added dependencies

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
        console.log('Camera focused on:', focusTarget.agentName);
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
            console.log('Coin3 initial Y:', coinRef.current.userData.initialY);
            console.log('Coin3 children:', coinRef.current.children);
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

  // Return AnnotationSystem component if annotations should be shown
  if (!showAnnotations) {
    return null;
  }

  // return (
  //   <AnnotationSystem 
  //     annotations={annotations} 
  //     is80sMode={is80sMode} 
  //     onAnnotationClick={onAnnotationClick}
  //     scale={0.8}
  //     textScale={0.8}
  //   />
  // );
});

CyborgTempleScene.displayName = 'CyborgTempleScene';

export default memo(CyborgTempleScene);