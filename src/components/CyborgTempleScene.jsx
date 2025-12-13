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
  isMobile = false, // Pass this prop to determine device type
}, ref) => {
  const groupRef = useRef();
  const { scene } = useThree();
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
  
  // Expose the loaded model through ref
  useImperativeHandle(ref, () => ({
    current: loadedModel
  }), [loadedModel]);

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
      if (groupRef.current) {
        groupRef.current = anchorGroup;
      }
      
      // Find the specific meshes
      templeScene.traverse((child) => {
        if (child.name === 'Cylinder043_0') {
          // console.log('Found Cylinder043_0 mesh:', child);
          cylinderMeshRef.current = child;
        }
        if (child.name === 'Object_5') {
          // console.log('Found Object_5 mesh:', child);
          object7MeshRef.current = child;
        }
        if (child.name === 'Mike') {
          // console.log('Found Cube010 mesh:', child);
          cube010MeshRef.current = child;
        }
      });
      
      // Call onLoad callback if provided
      if (onLoad) {
        setTimeout(() => {
          onLoad();
        }, 100);
      }
    }, 
    (progress) => {
      // console.log('Loading progress:', (progress.loaded / progress.total * 100) + '%');
    },
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
  useFrame((_, delta) => {
    if (mixerRef.current) {
      mixerRef.current.update(delta);
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