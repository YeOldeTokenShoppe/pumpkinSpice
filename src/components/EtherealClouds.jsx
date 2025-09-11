import React from 'react';
import { useGLTF, CameraShake } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import DarkClouds from '@/components/Clouds';
import PostProcessingEffects from '@/components/PostProcessingEffects';
import EnhancedVolumetricLight from '@/components/EnhancedVolumetricLight';
import SkySphere from '@/components/SkySphere';
import SpiralDollarBills from '@/components/SpiralDollarBills';
import BurningDollarBills from '@/components/BurningDollarBills';
import CoinStream from '@/components/CoinStream';
import FallingDiamonds from '@/components/FallingDiamonds';
import MarketEmojis from '@/components/MarketEmojis';
import TestDevil from '@/components/TestDevil';
// import CoinSparkles from './CoinSparkles';
import BreathSmoke from '@/components/BreathSmoke';

// Madonna Model Component
const MadonnaModel = ({ position = [0, -6, 0], scale = 1, goldCoinRef, coinsRef, onModelCentered, is80sMode = false }) => {
  const { scene } = useGLTF('/models/ourlady_rider.glb');
  const modelRef = React.useRef();
  
  React.useEffect(() => {
    if (!modelRef.current) return;
    
    // Calculate the actual bounding box of the entire model
    const modelBounds = new THREE.Box3().setFromObject(modelRef.current);
    const modelCenter = new THREE.Vector3();
    modelBounds.getCenter(modelCenter);
    
    // Adjust the model's position to center it
    modelRef.current.position.sub(modelCenter);
    
    // Now the model is centered at origin, so we just use the position prop for OrbitControls
    console.log('=== MODEL CENTER COORDINATES ===');
    console.log('Model local center (before centering):', modelCenter);
    console.log('Model has been centered at origin');
    console.log('Use position prop for OrbitControls target:', position);
    
    // Notify parent component about the center
    if (onModelCentered) {
      onModelCentered(position);
    }
    
    // Log all meshes to identify the duplicate feet
    console.log('=== All meshes in scene ===');
    const meshList = [];
    scene.traverse((child) => {
      if (child.isMesh) {
        const bounds = new THREE.Box3().setFromObject(child);
        const size = new THREE.Vector3();
        bounds.getSize(size);
        
        meshList.push({
          name: child.name,
          parent: child.parent?.name,
          position: child.position,
          worldPosition: child.getWorldPosition(new THREE.Vector3()),
          size: size,
          visible: child.visible
        });
        
        // console.log(`Mesh: ${child.name}`, {
        //   parent: child.parent?.name,
        //   position: `(${child.position.x.toFixed(2)}, ${child.position.y.toFixed(2)}, ${child.position.z.toFixed(2)})`,
        //   size: `(${size.x.toFixed(2)}, ${size.y.toFixed(2)}, ${size.z.toFixed(2)})`,
        // });
      }
    });
    
    // Look for meshes that might be feet based on position or name
    const possibleFeet = meshList.filter(mesh => {
      // Check if mesh is low (feet would be at negative Y)
      // or if name contains foot-related terms
      return mesh.worldPosition.y < -10 || 
             mesh.name.toLowerCase().includes('foot') ||
             mesh.name.toLowerCase().includes('feet') ||
             mesh.name.toLowerCase().includes('shoe') ||
             mesh.name.toLowerCase().includes('leg');
    });
    
    console.log('=== Possible feet meshes ===', possibleFeet);
    
    // Standard visibility setup
    scene.traverse((child) => {
      if (child.isMesh) {
        // Hide collision mesh
        if (child.name === 'collision') {
          child.visible = false;
          return;
        }
        
        // Hide the T-pose version
        if (child.parent?.name === 'lady' && child.parent?.parent?.name === 'lady') {
          child.visible = false;
          console.log('Hiding T-pose mesh:', child.name);
          return;
        }
        
        // Handle glasses visibility based on 80s mode
        if (child.name === 'Object_1' || child.parent?.name === 'Glasses') {
          child.visible = is80sMode;
          console.log(`Glasses (${child.name}) visibility set to:`, is80sMode);
          return;
        }
        
        // Show everything else
        child.visible = true;
      }
    });
    
    // Find all coin objects - they are Groups in the model
    const coinNames = ['Object_5', 'Object_5001', 'Object_5002', 'Object_5003', 'Object_5004', 'Object_5005'];
    const foundCoins = [];
    
    // First try to find objects by exact name
    coinNames.forEach((coinName) => {
      const coin = scene.getObjectByName(coinName);
      if (coin) {
        foundCoins.push(coin);
        console.log(`Found coin: ${coinName}`, coin);
      }
    });
    
    // If we didn't find all coins, search more broadly
    if (foundCoins.length < 6) {
      scene.traverse((child) => {
        if (coinNames.includes(child.name) && !foundCoins.includes(child)) {
          foundCoins.push(child);
          console.log(`Found coin via traverse: ${child.name}`, child);
        }
        // Also check if the coin names might be in the mesh children
        if (child.isMesh && child.parent && coinNames.includes(child.parent.name) && !foundCoins.find(c => c === child.parent)) {
          foundCoins.push(child.parent);
          console.log(`Found coin parent: ${child.parent.name}`, child.parent);
        }
      });
    }
    
    if (coinsRef) {
      coinsRef.current = foundCoins;
      console.log(`Found ${foundCoins.length} coins for rotation`, foundCoins);
      
      // Log the structure of found coins
      foundCoins.forEach((coin, index) => {
        console.log(`Coin ${index}: ${coin.name}, type: ${coin.type}, isMesh: ${coin.isMesh}, children: ${coin.children?.length || 0}`);
      });
    }
    
    // Also keep the original GoldCoin logic
    let goldCoinMesh = scene.getObjectByName('GoldCoinBlank_GoldCoinBlank_0');
    if (!goldCoinMesh) {
      const goldCoinContainer = scene.getObjectByName('GoldCoin');
      if (goldCoinContainer) {
        goldCoinContainer.traverse((child) => {
          if (child.isMesh && !goldCoinMesh) {
            goldCoinMesh = child;
          }
        });
      }
    }
    
    if (goldCoinMesh && goldCoinRef) {
      goldCoinRef.current = goldCoinMesh;
      console.log('Found GoldCoin mesh for rotation');
    }
    
    // Configure materials only for visible meshes
    scene.traverse((child) => {
      if (child.isMesh && child.visible) {
        // Enable skinning if needed
        if (child.isSkinnedMesh) {
          child.frustumCulled = false;
        }
        
        // Handle materials
        if (child.material) {
          const materials = Array.isArray(child.material) ? child.material : [child.material];
          materials.forEach(mat => {
            mat.transparent = false;
            mat.opacity = 1;
            mat.side = THREE.DoubleSide;
            if (mat.metalness !== undefined) mat.metalness = 0.1;
            if (mat.roughness !== undefined) mat.roughness = 0.8;
          });
        }
      }
    });
    
    // Log scene structure for debugging
    // console.log('Scene structure:');
    // scene.traverse((obj) => {
    //   if (obj.name) {
    //     console.log(`${obj.type}: ${obj.name}`);
    //   }
    // });
    
  }, [scene, goldCoinRef, coinsRef, position, scale, onModelCentered, is80sMode]);
  
  return (
    <primitive 
      ref={modelRef}
      object={scene} 
      position={[0, -6, 0]} 
      scale={scale}
      // rotation={[0, -Math.PI / 12, 0]}
      rotation={[0, Math.PI / 12, 0]}
    />
  );
};

// Preload the model
useGLTF.preload('/models/ourlady_rider.glb');

const EtherealClouds = ({ onDataUpdate, manualFearGreedData, manualVolumeData, is80sMode = false }) => {
  const goldCoinRef = React.useRef();
  const coinsRef = React.useRef([]);
  const [coinPositions, setCoinPositions] = React.useState([]);
  const [coinTemplate, setCoinTemplate] = React.useState(null);
  const [currentFearGreedValue, setCurrentFearGreedValue] = React.useState(50);
  const [marketVolume, setMarketVolume] = React.useState(null);
  const shakeRef = React.useRef();
  
  // Rotate all coins in place in different directions
  useFrame((state, delta) => {
    if (goldCoinRef.current) {
      goldCoinRef.current.rotateZ(0.01);
    }
    
    // Rotate each coin with different speeds and axes
    if (coinsRef.current && coinsRef.current.length > 0) {
      const newPositions = [];
      
      coinsRef.current.forEach((coin) => {
        if (coin) {
          // Each coin gets unique rotation speeds
          const speed = 0.004;
          
          // Try both direct rotation and using rotateX/Y/Z methods
          if (coin.rotation) {
            coin.rotation.x += speed;
            coin.rotation.y += speed;
            coin.rotation.z += speed;
          } else if (coin.rotateX) {
            coin.rotateX(speed);
            coin.rotateY(speed);
            coin.rotateZ(speed);
          }
          
          // Also try to rotate children if the coin is a container
          if (coin.children && coin.children.length > 0) {
            coin.children.forEach(child => {
              if (child.isMesh && child.rotation) {
                child.rotation.x += speed;
                child.rotation.y += speed;
                child.rotation.z += speed;
              }
            });
          }
          
          // Get world position for sparkles
          const worldPos = new THREE.Vector3();
          coin.getWorldPosition(worldPos);
          newPositions.push([worldPos.x, worldPos.y, worldPos.z]);
        }
      });
      
      // Update coin positions for sparkles
      if (newPositions.length > 0 && newPositions.length !== coinPositions.length) {
        setCoinPositions(newPositions);
      }
      
      // Set coin template from first found coin
      if (coinsRef.current.length > 0 && !coinTemplate) {
        const firstCoin = coinsRef.current[0];
        if (firstCoin && firstCoin.children && firstCoin.children[0]) {
          setCoinTemplate(firstCoin.children[0]);
        }
      }
    }
  });
  
  return (
    <>
      {/* Camera shake for lightning effects */}
      <CameraShake 
        ref={shakeRef} 
        decay 
        decayRate={0.95} 
        maxYaw={0.05} 
        maxPitch={0.01} 
        yawFrequency={4} 
        pitchFrequency={2} 
        rollFrequency={2} 
        intensity={0} 
      />
      
      {/*  sphere background */}
      {/* <SkySphere type="cubemap" /> */}
      <SkySphere type="color" fearGreedValue={manualFearGreedData?.value ?? currentFearGreedValue} />
      
      {/* Additional lights for better model visibility */}
      <directionalLight 
        position={[5, 10, 5]} 
        intensity={1.2} 
        castShadow
      />
      <directionalLight 
        position={[-5, 5, 5]} 
        intensity={0.8} 
        color="#ffffff"
      />
      
      {/* Front light to ensure clothing details are visible */}
      <directionalLight 
        position={[0, 5, 10]} 
        intensity={1.0} 
        color="#ffffff"
      />
      
      {/* Dark clouds for atmosphere with shake ref */}
      <DarkClouds 
        fearGreedValue={manualFearGreedData?.value ?? currentFearGreedValue} 
        shakeRef={shakeRef}
      />
      
      {/* Post-processing effects with 80s mode support */}
      <PostProcessingEffects is80sMode={is80sMode} />
      
      {/* Enhanced volumetric light rays */}
      <EnhancedVolumetricLight 
        position={[0, 120, 10]} 
        target={[3, -30, 0]}
        color="#ffffee"
        intensity={2.0}
      />
      
      {/* Madonna Model in center */}
      <MadonnaModel position={[0, -6, 0]} scale={10} goldCoinRef={goldCoinRef} coinsRef={coinsRef} is80sMode={is80sMode} />
      {/* Multiple debug positions to find the bull */}
      {/* <BreathSmoke
        position={[0, 0, 0]} // Center of scene
        direction={[0, 0.2, 1]}
        breathRate={2}
        color="#f0f0f0"
        debug={true}
      /> */}
      {/* <BreathSmoke
        position={[7, 4, 30]} // Left nostril
        direction={[0.3, -0.1, -1]} // Forward and slightly down
        rotation={[0, -0.2, 0]} // Rotate slightly left (negative Y rotation)
        breathRate={5}
        color="#f0f0f0"
        debug={false}
      /> */}
    {/* <BreathSmoke
        position={[8.5, 4, 30]} // Right nostril
        direction={[0.3, -0.1, 1]} // Forward and slightly down
        breathRate={5}
        color="#f0f0f0"
        debug={false}
      /> */}
      {/* Market-driven emoji display based on Fear & Greed Index */}
      <MarketEmojis 
        centerPosition={[0, 0, 0]} 
        onDataUpdate={(data) => {
          setCurrentFearGreedValue(data?.value || 50);
          setMarketVolume(data?.marketVolume || null);
          if (onDataUpdate) onDataUpdate(data);
        }}
        manualFearGreedData={manualFearGreedData}
      />
      
      {/* Coin streams from both hands */}
      /* Right Hand */
      {/* <CoinStream 
        startPosition={[-12.8, 12, 2]}  // Left hand position (adjusted for model scale/position)
        endPosition={[0, -20, 0]}
        coinCount={20}
        coinSize={1}
        streamWidth={2.5}
        speed={0.8}
        gravity={-8}
        initialVelocity={[-4, 2, 7]}
        coinMesh={coinTemplate}
      /> */}
       /* Left Hand */
      {/* <CoinStream 
        startPosition={[11, 12, 6]}   // Right hand position (adjusted for model scale/position)
        endPosition={[0, -20, 0]}
        coinCount={20}
        coinSize={1}
        streamWidth={2.5}
        speed={0.8}
        gravity={-8}
        initialVelocity={[2, 3, 2]}
        coinMesh={coinTemplate}
      /> */}
      {/* <FallingDiamonds 
        count={90}
        fallSpeed={0.8}
        spread={1.2}
        heightRange={50}
        startY={45}
        scale={0.3}  // Scale diamonds to 30% of original size
        useCubeCamera={true}  // Set to true for refractive effect (more GPU intensive)
      /> */}
      {/* Coin sparkle effects */}
      {/* {coinPositions.map((pos, index) => (
        <CoinSparkles 
          key={index}
          coinPosition={pos}
          particleCount={10 + index * .01}
        />
      ))}
       */}
      {/* Dollar Bills - switch between normal and burning based on fear */}
      {(() => {
        const fearGreedValue = manualFearGreedData?.value ?? currentFearGreedValue;
        
        // Use manual volume if provided, otherwise use live volume
        const volumeData = manualVolumeData || marketVolume;
        
        // Calculate volume multiplier (0.2 to 4.0 for more dramatic effect)
        let volumeMultiplier = 1.0;
        if (volumeData?.billions) {
          // Much more dramatic range for visual impact
          // <20B = 0.2x multiplier, 40B = 1x, 60B = 1.8x, 100B = 3x, >150B = 4x multiplier
          if (volumeData.billions < 20) {
            volumeMultiplier = 0.2 + (volumeData.billions / 20) * 0.3; // 0.2 to 0.5 for 0-20B
          } else if (volumeData.billions < 40) {
            volumeMultiplier = 0.5 + (volumeData.billions - 20) / 20 * 0.5; // 0.5 to 1.0 for 20-40B
          } else if (volumeData.billions < 60) {
            volumeMultiplier = 1.0 + (volumeData.billions - 40) / 20 * 0.8; // 1.0 to 1.8 for 40-60B
          } else if (volumeData.billions < 100) {
            volumeMultiplier = 1.8 + (volumeData.billions - 60) / 40 * 1.2; // 1.8 to 3.0 for 60-100B
          } else {
            volumeMultiplier = 3.0 + Math.min(1.0, (volumeData.billions - 100) / 50); // 3.0 to 4.0 for 100B+
          }
          console.log('Volume multiplier:', volumeMultiplier.toFixed(2), 'for volume:', volumeData.formatted, 'Manual:', volumeData.manual || false);
        }
        
        if (fearGreedValue < 25) {
          // Extreme fear - use burning bills with volume-adjusted count
          const baseCount = 40 - Math.floor((25 - fearGreedValue) * 1.2);
          const adjustedCount = Math.max(10, Math.floor(baseCount * volumeMultiplier));
          
          return (
            <BurningDollarBills 
              key="burning-bills"
              count={adjustedCount} 
              radius={50} 
              height={170} 
              speed={3}
              startY={120}
              endY={-50}
            />
          );
        } else {
          // Normal to greed - use regular spiral bills with volume-adjusted count
          const baseCount = 30 + Math.floor(fearGreedValue * 0.5); // Increased base count
          const adjustedCount = Math.min(100, Math.floor(baseCount * volumeMultiplier));
          
          return (
            <React.Fragment key="spiral-bills">
              <SpiralDollarBills 
                count={adjustedCount} 
                radius={40} 
                height={150} 
                speed={-2}
                startY={130}
                endY={-50}
              />
              <SpiralDollarBills 
                count={Math.floor(adjustedCount * 0.8)} 
                radius={30} 
                height={170} 
                speed={2}
                startY={120}
                endY={-50}
              />
            </React.Fragment>
          );
        }
      })()}
    </>
  );
};

export default EtherealClouds;