import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import * as THREE from "three";
import { useThree, useFrame } from "@react-three/fiber";

// MEMORY OPTIMIZATION CONSTANTS
const MAX_ANIMATION_TIMEOUTS = 10; // Prevent timeout accumulation
const CLEANUP_INTERVAL = 60000; // Run cleanup every minute
const MAX_AGENT_THOUGHTS = 50; // Limit stored thoughts

const CyborgTempleSceneOptimized = ({ 
  onLoad, 
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = [1.2, 1.2, 1.2],
  isPlaying = false, 
  currentTrack = null,
  showAnnotations = true,
  is80sMode = false,
  onAnnotationClick = null,
  onAgentClick = null,
  isMobile = false,
}) => {
  const groupRef = useRef();
  const { scene, camera, gl } = useThree();
  const hasLoadedRef = useRef(false);
  
  // OPTIMIZATION 1: Single refs for all animation data
  const animationDataRef = useRef({
    mixers: {},
    actions: {},
    timeouts: new Set(), // Track all active timeouts
    lastCleanup: Date.now()
  });
  
  const [loadedModel, setLoadedModel] = useState(null);
  const [detectedMobile, setDetectedMobile] = useState(false);
  
  // Model mesh refs
  const meshRefsRef = useRef({
    cylinder: null,
    object7: null,
    cube010: null,
    angelEmpty: null,
    angel: null,
    coins: {},
    ourLady: null,
    leftEye: null,
    rightEye: null
  });
  
  // OPTIMIZATION 2: Memoized raycaster
  const raycasterRef = useRef(null);
  const mouseRef = useRef(new THREE.Vector2());
  
  // Camera focus state
  const [focusTarget, setFocusTarget] = useState(null);
  const originalCameraPosition = useRef(null);
  
  // Animation states consolidated
  const animStateRef = useRef({
    macro: {
      current: 'TypingRobot2',
      lastSwitch: 0,
      nextDelay: Math.random() * 10000 + 8000,
      isSpecial: false
    },
    rl80: {
      current: 'Typing',
      lastSwitch: 0,
      nextDelay: Math.random() * 8000 + 12000,
      recentAnims: []
    },
    emo: {
      current: 'Typing',
      lastSwitch: 0,
      nextDelay: Math.random() * 10000 + 15000
    },
    tekno: {
      current: 'Typing',
      lastSwitch: 0,
      nextDelay: Math.random() * 10000 + 20000
    },
    blink: {
      lastBlink: 0,
      nextDelay: Math.random() * 3000 + 2000,
      isBlinking: false,
      progress: 0
    }
  });
  
  // OPTIMIZATION 3: Create loaders once and reuse
  const loadersRef = useRef(null);
  useEffect(() => {
    if (!loadersRef.current) {
      const gltfLoader = new GLTFLoader();
      const dracoLoader = new DRACOLoader();
      dracoLoader.setDecoderPath("/draco/");
      gltfLoader.setDRACOLoader(dracoLoader);
      loadersRef.current = { gltfLoader, dracoLoader };
    }
    
    return () => {
      // Clean up loaders on unmount
      if (loadersRef.current?.dracoLoader) {
        loadersRef.current.dracoLoader.dispose();
      }
    };
  }, []);
  
  // OPTIMIZATION 4: Memoized device detection
  const isOnMobile = useMemo(() => {
    if (isMobile) return true;
    if (typeof window === 'undefined') return false;
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase()) ||
           (window.innerWidth <= 768);
  }, [isMobile]);
  
  // OPTIMIZATION 5: Proper cleanup function for timeouts
  const addTimeout = useCallback((fn, delay) => {
    const timeoutId = setTimeout(() => {
      animationDataRef.current.timeouts.delete(timeoutId);
      fn();
    }, delay);
    
    animationDataRef.current.timeouts.add(timeoutId);
    
    // Prevent timeout accumulation
    if (animationDataRef.current.timeouts.size > MAX_ANIMATION_TIMEOUTS) {
      const oldestTimeout = animationDataRef.current.timeouts.values().next().value;
      clearTimeout(oldestTimeout);
      animationDataRef.current.timeouts.delete(oldestTimeout);
    }
    
    return timeoutId;
  }, []);
  
  // OPTIMIZATION 6: Cleanup all timeouts
  const clearAllTimeouts = useCallback(() => {
    animationDataRef.current.timeouts.forEach(timeoutId => {
      clearTimeout(timeoutId);
    });
    animationDataRef.current.timeouts.clear();
  }, []);
  
  // Main model loading effect - simplified and optimized
  useEffect(() => {
    if (hasLoadedRef.current || !loadersRef.current) return;
    hasLoadedRef.current = true;
    
    const modelPath = isOnMobile ? "/models/MOBILE.glb" : "/models/RL80_4anims.glb";
    
    loadersRef.current.gltfLoader.load(
      modelPath,
      (gltf) => {
        const templeScene = gltf.scene;
        setLoadedModel(templeScene);
        
        // Create anchor group
        const anchorGroup = new THREE.Group();
        if (isOnMobile) {
          anchorGroup.position.set(0, 0.8, -1);
          anchorGroup.scale.set(1.2, 1.2, 1.2);
        }
        anchorGroup.add(templeScene);
        
        // Add grid - lower on mobile
        const gridHelper = new THREE.GridHelper(50, 50, 0x00ff41, 0x00ff41);
        gridHelper.material.opacity = 0.3;
        gridHelper.material.transparent = true;
        gridHelper.position.y = isOnMobile ? -6.5 : -0.06; // Lower grid on mobile
        anchorGroup.add(gridHelper);
        
        if (groupRef.current) {
          groupRef.current.add(anchorGroup);
        }
        
        // Setup animations with proper cleanup tracking
        setupAnimations(gltf, templeScene);
        
        // Find and store mesh references
        findMeshes(templeScene);
        
        if (onLoad) {
          setTimeout(onLoad, 100);
        }
      },
      null,
      (error) => {
        console.error('Model load error:', error);
        if (onLoad) setTimeout(onLoad, 100);
      }
    );
    
    // CRITICAL: Cleanup function
    return () => {
      // Stop all animations
      Object.values(animationDataRef.current.mixers).forEach(mixer => {
        mixer.stopAllAction();
        mixer.uncacheRoot(mixer.getRoot());
      });
      
      // Clear all timeouts
      clearAllTimeouts();
      
      // Dispose of Three.js resources
      if (groupRef.current) {
        groupRef.current.traverse((child) => {
          if (child.geometry) {
            child.geometry.dispose();
          }
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(mat => {
                if (mat.map) mat.map.dispose();
                if (mat.normalMap) mat.normalMap.dispose();
                if (mat.roughnessMap) mat.roughnessMap.dispose();
                if (mat.metalnessMap) mat.metalnessMap.dispose();
                mat.dispose();
              });
            } else {
              if (child.material.map) child.material.map.dispose();
              if (child.material.normalMap) child.material.normalMap.dispose();
              if (child.material.roughnessMap) child.material.roughnessMap.dispose();
              if (child.material.metalnessMap) child.material.metalnessMap.dispose();
              child.material.dispose();
            }
          }
        });
        
        while (groupRef.current.children.length > 0) {
          groupRef.current.remove(groupRef.current.children[0]);
        }
      }
    };
  }, [isOnMobile, onLoad, clearAllTimeouts]);
  
  // Setup animations helper
  const setupAnimations = useCallback((gltf, templeScene) => {
    const animatedCharacters = {};
    
    templeScene.traverse((child) => {
      if (child.name === 'RL80_Empty') animatedCharacters['RL80'] = child;
      else if (child.name === 'Robot2_Empty') animatedCharacters['Macro'] = child;
      else if (child.name === 'Emo') animatedCharacters['Emo'] = child;
      else if (child.name === 'Tekno') animatedCharacters['Tekno'] = child;
    });
    
    // Create mixers
    Object.entries(animatedCharacters).forEach(([charName, charObject]) => {
      const mixer = new THREE.AnimationMixer(charObject);
      animationDataRef.current.mixers[charName] = mixer;
      animationDataRef.current.actions[charName] = {};
    });
    
    // Setup actions
    gltf.animations.forEach((animation) => {
      const animName = animation.name;
      const firstTrackBone = animation.tracks[0]?.name.split('.')[0] || '';
      
      let targetCharacters = [];
      if (animName.includes('Robot') || firstTrackBone === 'Pelvis' || firstTrackBone === 'Root_1') {
        targetCharacters = ['Macro'];
      } else if (firstTrackBone === 'Root' || animName === 'Typing' || animName === 'Idle') {
        targetCharacters = ['RL80', 'Emo', 'Tekno'];
      }
      
      targetCharacters.forEach(charName => {
        if (animationDataRef.current.mixers[charName]) {
          const mixer = animationDataRef.current.mixers[charName];
          const action = mixer.clipAction(animation);
          animationDataRef.current.actions[charName][animName] = action;
        }
      });
    });
    
    // Play initial animations
    Object.entries(animationDataRef.current.actions).forEach(([charName, actions]) => {
      const firstAnim = Object.values(actions)[0];
      if (firstAnim) {
        firstAnim.setLoop(THREE.LoopRepeat);
        firstAnim.play();
      }
    });
  }, []);
  
  // Find meshes helper
  const findMeshes = useCallback((templeScene) => {
    templeScene.traverse((child) => {
      if (child.name === 'Cylinder043_0') meshRefsRef.current.cylinder = child;
      if (child.name === 'Object_5') meshRefsRef.current.object7 = child;
      if (child.name === 'L_eye' || child.name === 'L_Eye') meshRefsRef.current.leftEye = child;
      if (child.name === 'R_eye' || child.name === 'R_Eye') meshRefsRef.current.rightEye = child;
      
      // Make agents clickable
      if (['OurLady', 'RL80', 'Emo', 'Macro', 'Tekno'].includes(child.name)) {
        child.userData.clickable = true;
        child.userData.agentId = child.name;
      }
      
      // Mobile specific
      if (isOnMobile) {
        if (child.name === 'Angel_Empty') meshRefsRef.current.angelEmpty = child;
        if (child.name.startsWith('Coin')) {
          meshRefsRef.current.coins[child.name] = child;
          child.userData.clickable = true;
          child.userData.agentId = child.name;
          child.userData.isCoin = true;
        }
      }
    });
  }, [isOnMobile]);
  
  // OPTIMIZATION 7: Single event handler setup with proper cleanup
  useEffect(() => {
    if (!gl || !camera) return;
    
    // Create raycaster once
    if (!raycasterRef.current) {
      raycasterRef.current = new THREE.Raycaster();
    }
    
    const handleClick = (event) => {
      const rect = gl.domElement.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      const intersects = raycasterRef.current.intersectObjects(scene.children, true);
      
      for (let i = 0; i < intersects.length; i++) {
        const object = intersects[i].object;
        if (object.userData.clickable) {
          if (onAgentClick) {
            onAgentClick(object.userData.agentId);
          }
          break;
        }
      }
    };
    
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && focusTarget) {
        setFocusTarget(null);
        if (onAgentClick) onAgentClick(null);
      }
    };
    
    gl.domElement.addEventListener('click', handleClick);
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      gl.domElement.removeEventListener('click', handleClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [gl, camera, scene, focusTarget, onAgentClick]);
  
  // OPTIMIZATION 8: Optimized animation frame
  useFrame((state, delta) => {
    // Update mixers
    Object.values(animationDataRef.current.mixers).forEach(mixer => {
      mixer?.update(delta);
    });
    
    // Periodic cleanup (every minute)
    const now = Date.now();
    if (now - animationDataRef.current.lastCleanup > CLEANUP_INTERVAL) {
      animationDataRef.current.lastCleanup = now;
      
      // Clean up old timeouts
      if (animationDataRef.current.timeouts.size > MAX_ANIMATION_TIMEOUTS) {
        const toRemove = animationDataRef.current.timeouts.size - MAX_ANIMATION_TIMEOUTS;
        const iter = animationDataRef.current.timeouts.values();
        for (let i = 0; i < toRemove; i++) {
          const timeoutId = iter.next().value;
          clearTimeout(timeoutId);
          animationDataRef.current.timeouts.delete(timeoutId);
        }
      }
    }
    
    // Independent animation switching for each character
    if (!isOnMobile) {
      // Macro animations
      if (animationDataRef.current.actions['Macro']) {
        const macroState = animStateRef.current.macro;
        if (now - macroState.lastSwitch > macroState.nextDelay && !macroState.isSpecial) {
          switchAnimation('Macro', macroState, ['TypingRobot2', 'IdleRobot2', 'Cheer_Robot2', 'Victory_Robot2']);
        }
      }
      
      // RL80 animations
      if (animationDataRef.current.actions['RL80']) {
        const rl80State = animStateRef.current.rl80;
        if (now - rl80State.lastSwitch > rl80State.nextDelay) {
          switchAnimation('RL80', rl80State, ['Typing', 'Idle', 'Clap', 'Disbelief', 'FistPump']);
        }
      }
      
      // Emo animations with offset timing
      if (animationDataRef.current.actions['Emo']) {
        const emoState = animStateRef.current.emo;
        if (now - emoState.lastSwitch > emoState.nextDelay) {
          switchAnimation('Emo', emoState, ['Typing', 'Idle', 'Disbelief', 'FistPump']);
        }
      }
      
      // Tekno animations with different timing
      if (animationDataRef.current.actions['Tekno']) {
        const teknoState = animStateRef.current.tekno;
        if (now - teknoState.lastSwitch > teknoState.nextDelay) {
          switchAnimation('Tekno', teknoState, ['Typing', 'Idle', 'Clap', 'Disbelief']);
        }
      }
    }
    
    // Camera animation
    if (focusTarget) {
      camera.position.lerp(focusTarget.position, 0.05);
      camera.lookAt(focusTarget.lookAt);
    }
    
    // Mobile hover animations (simplified)
    if (isOnMobile && meshRefsRef.current.angelEmpty) {
      const time = state.clock.getElapsedTime();
      const angel = meshRefsRef.current.angelEmpty;
      if (!angel.userData.originalY) {
        angel.userData.originalY = angel.position.y;
      }
      angel.position.y = angel.userData.originalY + Math.sin(time * 0.8) * 0.01;
    }
  });
  
  // Improved animation switching with character-specific logic
  const switchAnimation = useCallback((charName, state, availableAnims) => {
    const actions = animationDataRef.current.actions[charName];
    if (!actions) return;
    
    // Filter to only animations that actually exist for this character
    const validAnims = availableAnims.filter(anim => actions[anim]);
    if (validAnims.length === 0) return;
    
    // Separate loop and special animations
    const loopAnims = validAnims.filter(anim => 
      anim.includes('Typing') || anim.includes('Idle') || 
      (charName === 'Macro' && (anim === 'TypingRobot2' || anim === 'IdleRobot2'))
    );
    const specialAnims = validAnims.filter(anim => !loopAnims.includes(anim));
    
    const currentAction = actions[state.current];
    if (currentAction) {
      currentAction.fadeOut(0.5);
    }
    
    let nextAnim;
    
    // 70% chance for loop animations, 30% for special
    if (Math.random() < 0.7 && loopAnims.length > 0) {
      // Pick a different loop animation if possible
      const otherLoops = loopAnims.filter(anim => anim !== state.current);
      nextAnim = otherLoops.length > 0 ? 
        otherLoops[Math.floor(Math.random() * otherLoops.length)] :
        loopAnims[0];
    } else if (specialAnims.length > 0) {
      // Pick a special animation
      nextAnim = specialAnims[Math.floor(Math.random() * specialAnims.length)];
      state.isSpecial = true;
    } else {
      // Fallback to any loop animation
      nextAnim = loopAnims[0] || validAnims[0];
    }
    
    const nextAction = actions[nextAnim];
    if (nextAction) {
      nextAction.reset();
      nextAction.fadeIn(0.5);
      
      // Handle special animations differently
      if (specialAnims.includes(nextAnim)) {
        nextAction.setLoop(THREE.LoopOnce, 1);
        nextAction.clampWhenFinished = true;
        
        // Schedule return to loop animation
        const duration = nextAction.getClip().duration * 1000;
        addTimeout(() => {
          nextAction.fadeOut(0.5);
          const returnAnim = loopAnims[Math.floor(Math.random() * loopAnims.length)] || validAnims[0];
          if (actions[returnAnim]) {
            const returnAction = actions[returnAnim];
            returnAction.reset();
            returnAction.fadeIn(0.5);
            returnAction.setLoop(THREE.LoopRepeat);
            returnAction.play();
            state.current = returnAnim;
            state.isSpecial = false;
          }
        }, Math.max(100, duration - 500));
      } else {
        nextAction.setLoop(THREE.LoopRepeat);
        state.isSpecial = false;
      }
      
      nextAction.play();
      state.current = nextAnim;
      state.lastSwitch = Date.now();
      
      // Set varied delays per character
      if (charName === 'Macro') {
        state.nextDelay = Math.random() * 10000 + 8000; // 8-18 seconds
      } else if (charName === 'RL80') {
        state.nextDelay = Math.random() * 8000 + 12000; // 12-20 seconds
      } else if (charName === 'Emo') {
        state.nextDelay = Math.random() * 10000 + 15000; // 15-25 seconds
      } else if (charName === 'Tekno') {
        state.nextDelay = Math.random() * 10000 + 20000; // 20-30 seconds
      }
    }
  }, [addTimeout]);
  
  return (
    <group ref={groupRef} position={position} scale={scale} rotation={rotation} />
  );
};

export default CyborgTempleSceneOptimized;