"use client";

import React, { useRef, useState, useEffect, useCallback, memo, Suspense, lazy } from 'react';
import { Canvas, useFrame, useThree, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import Pizzicato from 'pizzicato';
import PostProcessingEffects from "@/components/PostProcessingEffects";
import FloatingCandleViewer from "@/components/CandleInteraction";
import PyramidEffects from "@/components/PyramidEffects";
import LightningEffect from '@/components/LightningEffect';
import { useChoirWheel } from "@/components/useChoirWheel";
import CoinStream from "@/components/CoinStream";
import NeuralNetworkR3F from '@/components/NeuralNetworkR3F'
import CleanCanvas from './CleanCanvas';


// Lazy load components
const MobileCandleOrbital = lazy(() => import('@/components/MobileCandleOrbital'));
const HolographicStatue3 = lazy(() => import('@/components/HolographicStatue3'));
const StarField = lazy(() => import('@/components/StarField'));
import ConstellationModel from "@/components/ConstellationModel";

// Simplified alligator model component - match original approach
const AlligatorModel = memo(({ isMobileView, modelRef, hideCandles = false, onLoad, choirWheel, onWheelClick }) => {
  const { scene } = useGLTF('/models/alligatorStroll6.glb');
  const outerGroupRef = useRef(); // For positioning
  const rotationGroupRef = useRef(); // For rotation
  const hasLoadedRef = useRef(false);
  const wheelSectionsRef = useRef([]); // Store wheel section meshes
  const originalMaterialsRef = useRef(new Map()); // Store original materials
  const arrowRef = useRef(); // Store arrow object separately
  const choirSoundRef = useRef(null); // Store pizzicato sound
  const audioContextRef = useRef(null); // Store Web Audio context
  const audioBufferRef = useRef(null); // Store audio buffer
  
  // Color mapping for wheel sections
  const wheelColorMap = {
    'wheel_section': '#CF0303FF',
    'wheel_section004': '#CF0303FF',
    'wheel_section008': '#CF0303FF',
    'wheel_section012': '#CF0303FF',
    'wheel_section001': '#69CF03FF',
    'wheel_section005': '#69CF03FF',
    'wheel_section009': '#69CF03FF',
    'wheel_section013': '#69CF03FF',
    'wheel_section002': '#03CFCFFF',
    'wheel_section006': '#03CFCFFF',
    'wheel_section010': '#03CFCFFF',
    'wheel_section014': '#03CFCFFF',
    'wheel_section003': '#6903CFFF',
    'wheel_section007': '#6903CFFF',
    'wheel_section011': '#6903CFFF',
    'wheel_section015': '#6903CFFF'
  };

  // Pitch mapping for wheel sections (using playback rate ratios)

const wheelPitchMap = {
  'wheel_section':    1.0,    // G3 (196 Hz - reference)
  'wheel_section001': 1.059,  // G#3/Ab3
  'wheel_section002': 1.122,  // A3
  'wheel_section003': 1.189,  // A#3/Bb3
  'wheel_section004': 1.260,  // B3
  'wheel_section005': 1.335,  // C4 (middle C)
  'wheel_section006': 1.414,  // C#4/Db4
  'wheel_section007': 1.498,  // D4
  'wheel_section008': 1.587,  // D#4/Eb4
  'wheel_section009': 1.682,  // E4
  'wheel_section010': 1.782,  // F4
  'wheel_section011': 1.888,  // F#4/Gb4
  'wheel_section012': 2.0,    // G4 (octave)
  'wheel_section013': 2.119,  // G#4/Ab4
  'wheel_section014': 2.245,  // A4 (440 Hz - concert pitch)
  'wheel_section015': 2.378   // A#4/Bb4
};

  // Handle wheel section and symbol click
  const handleWheelClick = useCallback((event) => {
    event.stopPropagation();
    const object = event.object;
    
    let wheelSectionName = '';
    let isSymbolClick = false;
    
    if (object.userData.isWheel) {
      wheelSectionName = object.userData.wheelName;
      console.log('Wheel clicked:', wheelSectionName);
    } else if (object.userData.isSymbol) {
      wheelSectionName = object.userData.correspondingWheelSection;
      isSymbolClick = true;
      console.log('Symbol clicked:', object.userData.symbolName, 'corresponding to:', wheelSectionName);
    }
    
    if (wheelSectionName) {
      // Notify parent component about wheel click for sequence tracking
      if (onWheelClick) {
        onWheelClick(wheelSectionName);
      }
      
      // Use ONLY original choir sound with pitch for this wheel section
      if (audioContextRef.current && audioBufferRef.current && wheelPitchMap[wheelSectionName]) {
        try {
          // Get the pitch ratio for this wheel section
          const pitchRatio = wheelPitchMap[wheelSectionName];
          
          // Create a new buffer source for each play
          const source = audioContextRef.current.createBufferSource();
          source.buffer = audioBufferRef.current;
          
          // Set the playback rate to change pitch
          source.playbackRate.value = pitchRatio;
          
          // Connect to output and play
          source.connect(audioContextRef.current.destination);
          source.start();
          
          console.log(`Playing original choir: ${wheelSectionName} at pitch ratio: ${pitchRatio}`);
          
        } catch (error) {
          console.error('Error playing sound:', error);
        }
      }
      // Temporarily disabled choir wheel to avoid confusion
      // } else if (choirWheel && choirWheel.playSection) {
      //   choirWheel.playSection(wheelSectionName);
      // }
      
      // Visual feedback for wheel sections, and for symbols find their corresponding wheel section
      // This should always happen regardless of which audio system is used
      let targetWheelObject = null;
      let wheelColor = null;
      
      if (object.userData.isWheel) {
        targetWheelObject = object;
        wheelColor = object.userData.wheelColor;
      } else if (object.userData.isSymbol) {
        // Find the corresponding wheel section object to apply the emissive effect
        wheelSectionsRef.current.forEach(wheelMesh => {
          if (wheelMesh.name === wheelSectionName) {
            targetWheelObject = wheelMesh;
            wheelColor = wheelMesh.userData.wheelColor;
          }
        });
      }
      
      if (targetWheelObject && wheelColor) {
        // Convert hex to THREE.Color
        const color = new THREE.Color(wheelColor.substring(0, 7)); // Remove alpha if present
        
        // Create emissive material
        const emissiveMaterial = new THREE.MeshStandardMaterial({
          color: color,
          emissive: color,
          emissiveIntensity: 2.0,
          transparent: true,
          opacity: 1.0,
          side: THREE.DoubleSide
        });
        
        // Apply emissive material
        targetWheelObject.material = emissiveMaterial;
        
        // Add CSS class for additional visual effect if element exists in DOM
        const wheelElement = document.getElementById(targetWheelObject.userData.wheelName);
        if (wheelElement) {
          wheelElement.classList.add('wheel-active');
        }
        
        // Reset after 2 seconds
        setTimeout(() => {
          const originalMaterial = originalMaterialsRef.current.get(targetWheelObject.userData.wheelName);
          if (originalMaterial) {
            targetWheelObject.material = originalMaterial;
          }
          // Remove CSS class
          if (wheelElement) {
            wheelElement.classList.remove('wheel-active');
          }
        }, 2000);
      }
    }
  }, []);

  
  useEffect(() => {
    if (!scene || !rotationGroupRef.current || !outerGroupRef.current) return;
    
    // Set the ref so MobileCandleOrbital can find the model
    if (modelRef) {
      modelRef.current = scene;
    }
    
    // Load choir sound with Web Audio API for better pitch control
    if (!audioContextRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        
        // Load the audio file
        fetch('/sounds/choir.mp3')
          .then(response => response.arrayBuffer())
          .then(data => audioContextRef.current.decodeAudioData(data))
          .then(buffer => {
            audioBufferRef.current = buffer;
            console.log('Choir sound loaded successfully');
          })
          .catch(error => console.error('Error loading choir sound:', error));
      } catch (error) {
        console.error('Error initializing audio context:', error);
      }
    }
    

    
    const clonedScene = scene.clone();
    
    // Calculate center for proper rotation
    const box = new THREE.Box3().setFromObject(clonedScene);
    const center = box.getCenter(new THREE.Vector3());
    
    
    
    // Center the model for rotation
    clonedScene.position.x = -center.x;
    clonedScene.position.z = -center.z;
    clonedScene.position.y = -center.y;
    
    // Create iridescent shader material that respects texture alpha
    const createIridescentMaterial = (originalTexture) => {
      return new THREE.ShaderMaterial({
        vertexShader: `
          varying vec2 vUv;
          varying vec3 vNormal;
          varying vec3 vViewPosition;
          
          void main() {
            vUv = uv;
            vNormal = normalize(normalMatrix * normal);
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            vViewPosition = -mvPosition.xyz;
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          varying vec2 vUv;
          varying vec3 vNormal;
          varying vec3 vViewPosition;

          uniform float time;
          uniform vec2 mouse;
          uniform sampler2D map;
          uniform bool hasTexture;

          void main() {
            // Sample the original texture
            vec4 textureColor = hasTexture ? texture2D(map, vUv) : vec4(1.0);
            
            // If alpha is very low, discard the fragment entirely
            if (textureColor.a < 0.01) {
              discard;
            }
            
            // Create base gradient colors similar to the CSS refraction
            vec3 color1 = vec3(1.0, 0.4, 0.6); // Pink
            vec3 color2 = vec3(0.4, 1.0, 0.6); // Green  
            vec3 color3 = vec3(0.4, 0.6, 1.0); // Blue
            
            // Use view angle for iridescence
            vec3 viewDir = normalize(-vViewPosition);
            float fresnel = dot(viewDir, vNormal);
            
            // Mix colors based on UV and view angle
            vec3 iridescent = mix(color1, color2, sin(vUv.x * 10.0 + time));
            iridescent = mix(iridescent, color3, cos(vUv.y * 10.0 - time));
            
            // Add texture pattern overlay
            float pattern = sin(vUv.x * 50.0) * sin(vUv.y * 50.0);
            
            // Blend iridescent effect with original texture luminance
            float luminance = dot(textureColor.rgb, vec3(0.299, 0.587, 0.114));
            vec3 finalColor = iridescent + pattern * 0.1;
            
            // Mix iridescent color with texture brightness
            finalColor = mix(finalColor * 0.5, finalColor, luminance);
            
            // Use the original texture's alpha channel
            gl_FragColor = vec4(finalColor, textureColor.a);
          }
        `,
        uniforms: {
          time: { value: 0 },
          mouse: { value: new THREE.Vector2(0, 0) },
          map: { value: originalTexture },
          hasTexture: { value: originalTexture !== null }
        },
        transparent: true,
        side: THREE.DoubleSide,
        alphaTest: 0.01
      });
    };
    
    // Store the shader material in a ref for animation
    if (!window.iridiscentMaterials) {
      window.iridiscentMaterials = [];
    }
    
    // Clear wheel sections array
    wheelSectionsRef.current = [];
    originalMaterialsRef.current.clear();
    
    // Store reference to arrow object if found
    let arrowObject = null;
    
    // Hide or show candles based on prop AND apply iridescent shader to number_fields objects
    clonedScene.traverse((child) => {
      // Check for arrow object and store it
      if (child.name && child.name.toLowerCase() === 'arrow') {
        console.log('Found arrow object:', child.name);
        arrowObject = child;
        return; // Skip further processing for arrow in this traversal
      }
      if (child.name && child.name.toUpperCase().includes('VCANDLE')) {
        child.visible = !hideCandles;
      }
      
      // Check for wheel sections and store them
      if (child instanceof THREE.Mesh && child.name && child.name.toLowerCase().includes('wheel_section')) {
        console.log('Found wheel section:', child.name);
        
        // Store original material
        if (child.material) {
          originalMaterialsRef.current.set(child.name, child.material.clone());
        }
        
        // Add to wheel sections array
        wheelSectionsRef.current.push(child);
        
        // Make the object interactive
        child.userData.isWheel = true;
        child.userData.wheelName = child.name;
        child.userData.wheelColor = wheelColorMap[child.name];
      }
      
      // Apply iridescent shader to objects starting with 'number_fields' or just 'number'
      if (child instanceof THREE.Mesh) {
        // Log all object names to help debug
        if (child.name) {
          console.log('Object name in model:', child.name);
        }
        
        // Apply iridescent material to objects with 'symbol' in their name (case-insensitive)
        if (child.name && child.name.toLowerCase().includes('symbol')) {
          console.log('Applying iridescent shader to:', child.name);
          
          // Get the original texture from the material if it exists
          let originalTexture = null;
          if (child.material) {
            if (child.material.map) {
              originalTexture = child.material.map;
            } else if (child.material.emissiveMap) {
              originalTexture = child.material.emissiveMap;
            }
          }
          
          const iridescentMaterial = createIridescentMaterial(originalTexture);
          child.material = iridescentMaterial;
          window.iridiscentMaterials.push(iridescentMaterial);
          
          // Make symbol objects clickable and link to corresponding wheel sections
          child.userData.isSymbol = true;
          child.userData.symbolName = child.name;
          
          // Map symbol names to their corresponding wheel sections
          let correspondingWheelSection = '';
          if (child.name === 'symbol') {
            correspondingWheelSection = 'wheel_section';
          } else if (child.name.startsWith('symbol') && child.name.length > 6) {
            // Extract number from symbol001, symbol002, symbol010, etc.
            const symbolNumber = child.name.substring(6); // Remove 'symbol' prefix
            if (symbolNumber) {
              correspondingWheelSection = `wheel_section${symbolNumber}`;
            }
          }
          
          child.userData.correspondingWheelSection = correspondingWheelSection;
          console.log(`Symbol ${child.name} linked to ${correspondingWheelSection}`);
        }
        
        child.castShadow = false;
        child.receiveShadow = false;
        // Don't zero out material properties - let them use their defaults
        if (child.material) {
          child.material.needsUpdate = true;
        }
      }
    });
    
    // Handle arrow object separately if found
    if (arrowObject) {
      // Store the arrow's original position relative to the cloned scene
      const originalPosition = arrowObject.position.clone();
      const originalRotation = arrowObject.rotation.clone();
      const originalScale = arrowObject.scale.clone();
      
      // Remove arrow from its current parent (cloned scene)
      if (arrowObject.parent) {
        arrowObject.parent.remove(arrowObject);
      }
      
      // Add arrow to outer group (non-rotating) 
      arrowRef.current = arrowObject;
      outerGroupRef.current.add(arrowObject);
      
      // Restore the arrow's original transform but account for the model centering
      // The cloned scene is centered, so we need to apply the same centering offset
      arrowObject.position.copy(originalPosition);
      arrowObject.position.add(new THREE.Vector3(-center.x, -center.y, -center.z));
      arrowObject.rotation.copy(originalRotation);
      arrowObject.scale.copy(originalScale);
    }
    
    rotationGroupRef.current.add(clonedScene);
    
    // Call onLoad only once when first loaded
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
      if (onLoad) {
        // Small delay to ensure the model is fully rendered
        setTimeout(() => {
          onLoad();
        }, 100);
      }
    }
  }, [scene, modelRef, hideCandles, onLoad]);
  
  // Simple rotation animation and update shader uniforms
  useFrame((state, delta) => {
    if (rotationGroupRef.current) {
      rotationGroupRef.current.rotation.y += delta * 0.1;
    }
    
    // Update time uniform for all iridescent materials
    if (window.iridiscentMaterials) {
      window.iridiscentMaterials.forEach(material => {
        if (material.uniforms && material.uniforms.time) {
          material.uniforms.time.value = state.clock.elapsedTime;
        }
      });
    }
  });
  
  // Outer group positions the model, inner group rotates
  return (
    <group 
      ref={outerGroupRef} 
      position={[0, -2, 0]} 
      scale={[10, 10, 10]}
      onClick={handleWheelClick}
    >
      <group ref={rotationGroupRef} />
    </group>
  );
});

AlligatorModel.displayName = 'AlligatorModel';

// Preload the model
useGLTF.preload('/models/alligatorStroll6.glb');

// Shadow configuration component for desktop
function ShadowConfig({ isMobileView }) {
  const { gl } = useThree();
  
  useEffect(() => {
    if (!isMobileView && gl.shadowMap) {
      gl.shadowMap.enabled = true;
      gl.shadowMap.type = THREE.PCFSoftShadowMap;
      // Set higher resolution for desktop
      gl.shadowMap.needsUpdate = true;
    }
  }, [isMobileView, gl]);
  
  return null;
}


  





// Main scene component`
function SimpleScene({ isMobileView, is80sMode, enableCandles = false, enableStatue = false, onPaginationChange, candleData = [], sortBy, onCandleClick, showFloatingViewer, onAssetsLoaded, onEffectChange, choirWheel, coinTrigger, onWheelClick }) {
  const modelRef = useRef();
  const [statueLoaded, setStatueLoaded] = useState(!enableStatue); // Consider loaded if not enabled
  const [modelLoaded, setModelLoaded] = useState(false);

  useEffect(() => { 
    if (choirWheel && choirWheel.bindClicks) {
      choirWheel.bindClicks(); 
    }
  }, [choirWheel]);

  // Track when all assets are loaded
  useEffect(() => {
    if (statueLoaded && modelLoaded) {
      console.log('Gallery3Scene: All assets loaded');
      if (onAssetsLoaded) {
        onAssetsLoaded();
      }
    }
  }, [statueLoaded, modelLoaded, onAssetsLoaded]);
  
  // Handle statue load
  const handleStatueLoad = useCallback(() => {
    console.log('Gallery3Scene: HolographicStatue3 loaded');
    setStatueLoaded(true);
  }, []);
  
  // Handle model load (called from AlligatorModel)
  const handleModelLoad = useCallback(() => {
    console.log('Gallery3Scene: AlligatorModel loaded');
    setModelLoaded(true);
  }, []);
  
  
  return (
    <>
      {/* Shadow configuration for desktop */}
      <ShadowConfig isMobileView={isMobileView} />
      
      {/* StarField - Background stars */}
      <Suspense fallback={null}>
        <StarField is80sMode={is80sMode} />
      </Suspense>
      
      {/* Lighting - Enhanced for better visibility */}
      <ambientLight intensity={1.5} />
      
      {/* Hemisphere light for better ambient lighting */}
      <hemisphereLight
        skyColor={is80sMode ? "#ff00ff" : "#7300ff"}
        groundColor={is80sMode ? "#00ffff" : "#ff0000"}
        intensity={1.5}
      />
      
      {/* Add some directional light for better visibility */}
      <directionalLight 
        position={[10, 10, 5]} 
        intensity={1.5}
        castShadow={!isMobileView}
        shadow-mapSize={!isMobileView ? [4096, 4096] : [1024, 1024]}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      
      {/* Point light for additional illumination */}
      <pointLight 
        position={[0, 10, 0]} 
        intensity={1.3}
        distance={50}
        decay={2}
      />
      
      {/* Wireframe Grid */}
      {/* <WireframeGrid /> */}
      
      {/* Jumping Arrow */}
      {/* <Suspense fallback={null}>
        <JumpingArrow />
      </Suspense> */}
      
      {/* Model */}
      <Suspense fallback={null}>
        <AlligatorModel 
          isMobileView={isMobileView} 
          modelRef={modelRef}
          hideCandles={enableCandles}
          onLoad={handleModelLoad}
          choirWheel={choirWheel}
          onWheelClick={onWheelClick}
        />
      </Suspense>
      
      {/* Holographic Statue - positioned like original */}
      {enableStatue && (
        <Suspense fallback={null}>
          <HolographicStatue3 onLoad={handleStatueLoad} />
        </Suspense>
      )}
      
      {/* Mobile Candle Orbital - needs modelRef to extract candles */}
      {enableCandles && modelRef.current && (
        <Suspense fallback={null}>
          <MobileCandleOrbital 
            modelRef={modelRef}
            candleData={candleData}
            onCandleClick={onCandleClick}
            onPaginationChange={onPaginationChange}
            sortBy={sortBy}
            isViewerOpen={showFloatingViewer}
          />
        </Suspense>
      )}
            {/* <NeuralNetworkR3F 
              theme={2}
              formation={0}
              density={300}
              position={[0, 3, 0]}
              scale={0.05}
              enableInteraction={true}
            /> */}
      {/* Pyramid Effects - positioned at model center */}
      {/* <PyramidEffects 
        position={[0, 0, 0]} 
        scale={5}  // Increase this value to make effects larger (try 2, 3, 4, or 5)
        onEffectTrigger={(theme) => onEffectChange && onEffectChange(theme.name)}
      /> */}
      
      {/* Controls */}
      <OrbitControls
        // enableZoom={!isMobileView}
        enableZoom={true}
        zoomToCursor
        enableDamping
        dampingFactor={0.1}
        // minDistance={isMobileView ? 10 : 30}
        minDistance={1}
        maxDistance={20}
        enablePan={false}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 2}
        autoRotate={false}
      />
    </>
  );
}

// Main component following Simple3DScene pattern
export default function Gallery3Scene({ enabled = false, isMobileView = true, is80sMode = false, onSceneReady, enableCandles = false, enableStatue = false, onPaginationChange, candleData = [], sortBy, onCoinsWon, puzzleSequence }) {
  console.log('Gallery3Scene render, puzzleSequence:', puzzleSequence);
  const [mounted, setMounted] = useState(false);
  const [showFloatingViewer, setShowFloatingViewer] = useState(false);
  const [selectedCandleData, setSelectedCandleData] = useState(null);
  const [assetsLoaded, setAssetsLoaded] = useState(false);
  const [showEffectButton, setShowEffectButton] = useState(true);
  const [effectInfo, setEffectInfo] = useState('Click to trigger effect');
  const [triggerLightning, setTriggerLightning] = useState(0);
  
  // Click sequence tracking for coin stream trigger
  const [clickSequence, setClickSequence] = useState([]);
  const [coinTrigger, setCoinTrigger] = useState(0);
  
  // Debug effect to track puzzleSequence changes
  useEffect(() => {
    console.log('puzzleSequence prop updated in useEffect:', puzzleSequence);
  }, [puzzleSequence]);
  
  // Use a ref to always have the current puzzleSequence value
  const puzzleSequenceRef = useRef(puzzleSequence);
  useEffect(() => {
    puzzleSequenceRef.current = puzzleSequence;
  }, [puzzleSequence]);
  
  const [currentCoinReward, setCurrentCoinReward] = useState(0);
  
  // Define multiple sequences with different rewards
  const puzzleSequences = [
    { sequence: ['wheel_section008', 'wheel_section012', 'wheel_section013'], reward: 500, name: 'Trinity' },
    { sequence: ['wheel_section001', 'wheel_section007', 'wheel_section013'], reward: 1000, name: 'Lucky Seven' },
    { sequence: ['wheel_section003', 'wheel_section006', 'wheel_section009', 'wheel_section012'], reward: 10000, name: 'Divine Quarters' },
    { sequence: ['wheel_section013', 'wheel_section013', 'wheel_section013'], reward: 777, name: 'Triple Blessing' }
  ];
  
  // Initialize choir wheel hook at the top level
  const choirWheel = useChoirWheel({
    bpm: 100,
    beatsPerBar: 4,
  });
  // Handle candle click
  const handleCandleClick = useCallback((candleData) => {
    console.log('Candle clicked:', candleData);
    setSelectedCandleData(candleData);
    setShowFloatingViewer(true);
  }, []);
  
  // Close floating viewer
  const closeFloatingViewer = useCallback(() => {
    setShowFloatingViewer(false);
    setSelectedCandleData(null);
  }, []);
  
  // Handle when all assets are loaded
  const handleAssetsLoaded = useCallback(() => {
    console.log('Gallery3Scene: All scene assets loaded');
    setAssetsLoaded(true);
    
    // Notify parent that scene is ready
    if (onSceneReady) {
      // Small delay to ensure everything is rendered
      setTimeout(() => {
        onSceneReady(true);
      }, 300);
    }
  }, [onSceneReady]);
  
  // Handle wheel clicks for sequence tracking
  const handleWheelClick = useCallback(async (wheelSectionName) => {
    console.log('=== WHEEL CLICK DEBUG ===');
    console.log('Wheel section clicked:', wheelSectionName);
    
    // Log which symbol this section represents
    const symbolMap = {
      'wheel_section': '🌹 Rose',
      'wheel_section001': '🔒 Lock', 
      'wheel_section002': '⏳ Hourglass',
      'wheel_section003': '🦉 Owl',
      'wheel_section004': '❤️‍🔥 Burning Heart',
      'wheel_section005': '♾️ Infinity',
      'wheel_section006': '👁️ Illuminati Eye',
      'wheel_section007': '🔺 Sacred Geometry',
      'wheel_section008': '🐱 Lucky Cat',
      'wheel_section009': '♍ Virgo',
      'wheel_section010': '🎱 8-Ball',
      'wheel_section011': '📿 Rosary Beads',
      'wheel_section012': '🚀 Rocket',
      'wheel_section013': '🕸️ Spiderweb',
      'wheel_section014': '🐂 Bull',
      'wheel_section015': '🕯️ Candle'
    };
    console.log('You clicked:', symbolMap[wheelSectionName] || wheelSectionName);
    console.log('Expected puzzle sequence (from ref):', puzzleSequenceRef.current);
    
    // Check if there's a puzzle sequence to validate - use ref for current value
    const currentPuzzleSequence = puzzleSequenceRef.current;
    if (currentPuzzleSequence && currentPuzzleSequence.length > 0) {
      
      setClickSequence(prevSequence => {
        const newSequence = [...prevSequence, wheelSectionName];
        console.log('Full click history:', newSequence);
        
        // Check if the sequence matches the puzzle sequence
        const requiredLength = currentPuzzleSequence.length;
        let checkSequence = newSequence.slice(-requiredLength);
        console.log('Last', requiredLength, 'clicks:', checkSequence);
        console.log('Expected sequence:', currentPuzzleSequence);
        console.log('Match check:', checkSequence.map((click, idx) => ({
          clicked: click,
          expected: currentPuzzleSequence[idx],
          matches: click === currentPuzzleSequence[idx]
        })));
        
        if (checkSequence.length === requiredLength &&
            checkSequence.every((click, index) => click === currentPuzzleSequence[index])) {
          
          console.log(`✨ Puzzle sequence MATCHED! Validating with server...`);
          
          // Validate with the server to prevent cheating
          fetch('/api/validate-puzzle', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ sequence: checkSequence }),
          })
          .then(res => res.json())
          .then(data => {
            if (data.valid) {
              console.log('✅ Server validation successful! Awarding', data.reward, 'coins!');
              
              // Set the reward amount from server
              setCurrentCoinReward(data.reward || 5000);
              
              // Trigger the coin streams
              setCoinTrigger(prev => prev + 1);
            } else {
              console.log('❌ Server validation failed:', data.message);
              // Could show an error message to the user
            }
          })
          .catch(err => {
            console.error('Error validating puzzle:', err);
            // Fallback to client-side validation if server fails
            setCurrentCoinReward(5000);
            setCoinTrigger(prev => prev + 1);
          });
          
          // Reset sequence after triggering
          return [];
        }
        
        // Limit sequence length
        if (newSequence.length > requiredLength) {
          return newSequence.slice(-requiredLength);
        }
        
        return newSequence;
      });
    } else {
      // Original logic for predefined sequences when no puzzle is active
      setClickSequence(prevSequence => {
        const newSequence = [...prevSequence, wheelSectionName];
        
        // Check all possible sequences
        for (const puzzle of puzzleSequences) {
          const requiredLength = puzzle.sequence.length;
          
          // Keep only the last N clicks where N is the sequence length
          let checkSequence = newSequence.slice(-requiredLength);
          
          // Check if this matches any puzzle sequence
          if (checkSequence.length === requiredLength &&
              checkSequence.every((click, index) => click === puzzle.sequence[index])) {
            
            console.log(`✨ ${puzzle.name} sequence detected! Awarding ${puzzle.reward} coins!`);
            
            // Set the reward amount for the CoinStream components
            setCurrentCoinReward(puzzle.reward);
            
            // Trigger the coin streams
            setCoinTrigger(prev => prev + 1);
            
            // Reset sequence after triggering
            return [];
          }
        }
        
        // Limit sequence length to the longest puzzle sequence
        const maxLength = Math.max(...puzzleSequences.map(p => p.sequence.length));
        if (newSequence.length > maxLength) {
          return newSequence.slice(-maxLength);
        }
        
        return newSequence;
      });
    }
  }, [puzzleSequences]);
  
  useEffect(() => {
    // Delay mounting to avoid conflicts (from Simple3DScene)
    const timer = setTimeout(() => {
      setMounted(true);
      
      // Log memory
      // if (performance.memory) {
      //   console.log('Gallery3Scene mounted - Memory:', {
      //     used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) + 'MB',
      //     total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024) + 'MB'
      //   });
      // }
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  if (!enabled || !mounted) {
    return null; // Return nothing - InfinityLoader is already shown by the parent
  }
  
  return (
    <>
    {/* Add wheel-active CSS styles */}
    <style jsx global>{`
      .wheel-active {
        filter: drop-shadow(0 0 10px currentColor) brightness(1.35);
        transition: filter .12s ease;
      }
    `}</style>
    
  
    
    <CleanCanvas
      camera={{ 
        position: isMobileView ? [0, 0, 20] : [0, 0, 80], // Match original gallery
        fov: isMobileView ? 60 : 35, // Match original gallery
        near: 0.1, 
        far: 1000 // Match original gallery
      }}
      gl={{
        antialias: !isMobileView, // Enable antialiasing on desktop
        alpha: false,
        powerPreference: 'high-performance',
        preserveDrawingBuffer: true, // Enable for screenshot capability
        failIfMajorPerformanceCaveat: false,
        stencil: false, // Disable stencil buffer if not needed
        depth: true, // Ensure depth buffer is enabled
      }}
      shadows={!isMobileView}
      dpr={isMobileView ? [1, 1.5] : [1.5, 2]} // Higher DPR for desktop
    >
      <color attach="background" args={['#000000']} />
      <Suspense fallback={null}>
            <ConstellationModel 
              groupScale={[30, 30, 30]} // Original scale for 3DVotiveStand
              groupPosition={[0, 0, -200]} // Original position for 3DVotiveStand
            />
          </Suspense>
      <Suspense fallback={null}>
        <SimpleScene 
          isMobileView={isMobileView} 
          is80sMode={is80sMode}
          enableCandles={enableCandles}
          enableStatue={enableStatue}
          onPaginationChange={onPaginationChange}
          candleData={candleData}
          sortBy={sortBy}
          onCandleClick={handleCandleClick}
          showFloatingViewer={showFloatingViewer}
          onAssetsLoaded={handleAssetsLoaded}
          onEffectChange={(name) => setEffectInfo(name)}
          choirWheel={choirWheel}
          coinTrigger={coinTrigger}
          onWheelClick={handleWheelClick}
        />
      </Suspense>
      <Suspense fallback={null}>
          <PostProcessingEffects is80sMode={is80sMode} sunRef={null} />
        </Suspense>
        <LightningEffect 
  trigger={triggerLightning} 
  position={[0, 0, -2]}  // Moved forward toward camera
  duration={1.0}
  scale={4.0}  // Even bigger
/>
         /* Right Hand */
      <CoinStream 
        startPosition={[-4, 2.5, 2.5]}  // Left hand position (adjusted for model scale/position)
        endPosition={[1, -20, 1]}
        coinCount={20}
        coinSize={1}
        streamWidth={1.5}
        speed={0.8}
        gravity={-9}
        initialVelocity={[-2, 1, 6]}
        trigger={coinTrigger}
        coinValue={currentCoinReward / 2}  // Split reward between two hands
        onCoinsDispensed={onCoinsWon}
        // coinMesh={coinTemplate}
      />
       /* Left Hand */
      <CoinStream 
        startPosition={[3, 2.5, 2.5]}   // Right hand position (adjusted for model scale/position)
        endPosition={[0, -20, 1]}
        coinCount={20}
        coinSize={1}
        streamWidth={1.5}
        speed={0.8}
        gravity={-9}
        initialVelocity={[2, 2, 6]}
        trigger={coinTrigger}
        coinValue={currentCoinReward / 2}  // Split reward between two hands
        onCoinsDispensed={onCoinsWon}
        // coinMesh={coinTemplate}
      />
    </CleanCanvas>
    {/* {showEffectButton && (
      <div style={{
        position: 'fixed',
        bottom: '30px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10,
        textAlign: 'center'
      }}>
        <button
           onClick={() => setTriggerLightning(prev => prev + 1)}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            fontWeight: '600',
            color: '#fff',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '12px',
            cursor: 'pointer',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            transition: 'background 0.3s, transform 0.2s'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.2)';
            e.target.style.borderColor = 'rgba(255, 255, 255, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.1)';
            e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
          }}
          onMouseDown={(e) => {
            e.target.style.transform = 'scale(0.95)';
          }}
          onMouseUp={(e) => {
            e.target.style.transform = 'scale(1)';
          }}
        >
          Trigger Effect
        </button>
        <div style={{
          marginTop: '10px',
          color: 'rgba(255, 255, 255, 0.8)',
          fontSize: '14px'
        }}>
          {effectInfo}
        </div>
      </div>
    )} */}
    {/* FloatingCandleViewer - Outside Canvas */}
    {showFloatingViewer && selectedCandleData && (
      <FloatingCandleViewer
        key={`candle-viewer-${selectedCandleData.candleId}-${selectedCandleData.candleTimestamp}`}
        isVisible={showFloatingViewer}
        userData={selectedCandleData}
        onClose={closeFloatingViewer}
      />
    )}
    </>
  );
}