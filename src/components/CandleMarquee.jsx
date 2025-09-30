import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

// Global cache to prevent duplicate candle extraction across remounts
const globalCandleCache = {
  candles: null,
  modelId: null
};

// Create a simple candle mesh
function createCandleMesh() {
  const group = new THREE.Group();
  
  // Candle body (cylinder)
  const candleGeometry = new THREE.CylinderGeometry(0.3, 0.35, 2, 8);
  const candleMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xFFF8DC,
    emissive: 0x442211,
    emissiveIntensity: 0.2
  });
  const candleMesh = new THREE.Mesh(candleGeometry, candleMaterial);
  candleMesh.position.y = 0;
  group.add(candleMesh);
  
  // Wick
  const wickGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.3, 4);
  const wickMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
  const wickMesh = new THREE.Mesh(wickGeometry, wickMaterial);
  wickMesh.position.y = 1.15;
  group.add(wickMesh);
  
  // Flame
  const flameGeometry = new THREE.SphereGeometry(0.15, 6, 6);
  const flameMaterial = new THREE.MeshBasicMaterial({ 
    color: 0xffaa00,
    emissive: 0xffaa00,
    emissiveIntensity: 2,
    transparent: true,
    opacity: 0.9
  });
  const flameMesh = new THREE.Mesh(flameGeometry, flameMaterial);
  flameMesh.position.y = 1.4;
  flameMesh.scale.y = 1.5;
  flameMesh.name = 'flame';
  group.add(flameMesh);
  
  // Add a label plane for user image
  const labelGeometry = new THREE.PlaneGeometry(0.6, 0.6);
  const labelMaterial = new THREE.MeshBasicMaterial({ 
    color: 0xffffff,
    side: THREE.DoubleSide
  });
  const labelMesh = new THREE.Mesh(labelGeometry, labelMaterial);
  labelMesh.position.y = 0;
  labelMesh.position.z = 0.36;
  labelMesh.name = 'Label1';
  group.add(labelMesh);
  
  return group;
}

// Individual candle component for marquee
function MarqueeCandle({ position, candleObject, userData, index, onClick, scrollSpeed }) {
  const groupRef = useRef();
  const candleRef = useRef();
  const createdTexturesRef = useRef([]);
  const createdMaterialsRef = useRef([]);
  
  // Setup candle on mount
  useEffect(() => {
    if (!groupRef.current) return;
    
    console.log(`[MarqueeCandle ${index}] Setting up candle at position:`, position);
    
    // If no candleObject provided, create a simple one
    let candle = candleObject;
    if (!candle) {
      console.log(`[MarqueeCandle ${index}] No candle object provided, creating mesh`);
      candle = createCandleMesh();
    }
    
    // Scale the candle appropriately
    candle.scale.set(3, 3, 3);
    
    // Make sure the candle is visible
    candle.visible = true;
    candle.traverse((child) => {
      child.visible = true;
      if (child.isMesh) {
        console.log(`[MarqueeCandle ${index}] Mesh found:`, child.name, 'Material:', child.material);
      }
    });
    
    // Center the candle in its group
    const box = new THREE.Box3().setFromObject(candle);
    const center = box.getCenter(new THREE.Vector3());
    candle.position.sub(center);
    candle.position.y = 0;
    
    // Apply user data to the cloned candle
    if (userData) {
      candle.userData = {
        ...candle.userData,
        ...userData,
        hasUser: true
      };
      
      // Apply user image with username to labels if available
      if (userData.image || userData.username || userData.userName) {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        const username = userData.username || userData.userName || userData.name || '';
        
        const createCombinedTexture = (img) => {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          const imageHeight = username ? canvas.height * 0.9 : canvas.height;
          ctx.drawImage(img, 0, 0, canvas.width, imageHeight);
          
          if (username && username.trim()) {
            const gradient = ctx.createLinearGradient(0, imageHeight, 0, canvas.height);
            gradient.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0.9)');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, imageHeight, canvas.width, canvas.height - imageHeight);
            
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            const textY = imageHeight + (canvas.height - imageHeight) / 2;
            
            ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
            ctx.shadowBlur = 4;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
            
            ctx.fillText(username, canvas.width / 2, textY);
          }
          
          const texture = new THREE.CanvasTexture(canvas);
          texture.wrapS = THREE.ClampToEdgeWrapping;
          texture.wrapT = THREE.ClampToEdgeWrapping;
          texture.minFilter = THREE.LinearMipMapLinearFilter;
          texture.magFilter = THREE.LinearFilter;
          texture.anisotropy = 16;
          texture.generateMipmaps = true;
          texture.needsUpdate = true;
          createdTexturesRef.current.push(texture);
          
          candle.traverse((child) => {
            if (child.name?.includes('Label1')) {
              if (child.material) {
                child.material = child.material.clone();
                
                const flippedTexture = texture.clone();
                flippedTexture.center.set(0.5, 0.5);
                flippedTexture.repeat.set(1, -1);
                flippedTexture.needsUpdate = true;
                
                child.material.map = flippedTexture;
                child.material.needsUpdate = true;
              }
            }
            else if (child.name?.includes('Label2')) {
              if (child.material) {
                child.material = child.material.clone();
                child.material.map = texture.clone();
                child.material.needsUpdate = true;
                
                child.material.emissive = new THREE.Color(0xffffff);
                child.material.emissiveMap = child.material.map;
                child.material.emissiveIntensity = 0.2;
              }
            }
          });
        };
        
        if (userData.image) {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => createCombinedTexture(img);
          img.onerror = () => {
            const defaultImg = new Image();
            defaultImg.onload = () => createCombinedTexture(defaultImg);
            defaultImg.src = '/defaultAvatar.png';
          };
          img.src = userData.image;
        } else {
          const defaultImg = new Image();
          defaultImg.onload = () => createCombinedTexture(defaultImg);
          defaultImg.src = '/defaultAvatar.png';
        }
      }
    }
    
    candleRef.current = candle;
    groupRef.current.add(candle);
    
    return () => {
      if (candleRef.current && groupRef.current) {
        groupRef.current.remove(candleRef.current);
      }
    };
  }, [candleObject, userData]);
  
  useFrame((state) => {
    if (groupRef.current && candleRef.current) {
      // Gentle rotation
      candleRef.current.rotation.y = state.clock.elapsedTime * 0.3;
      
      // Keep Y position fixed for straight horizontal line
      groupRef.current.position.y = position[1];
    }
  });
  
  const handleClick = (e) => {
    e.stopPropagation();
    if (onClick) {
      onClick({
        ...userData,
        candleId: `marquee-candle-${index}`,
        candleTimestamp: Date.now(),
      });
    }
  };
  
  return (
    <group ref={groupRef} position={position} onClick={handleClick}>
      {/* Candle object is added dynamically in useEffect */}
    </group>
  );
}

// Main marquee component
function CandleMarquee({ 
  candleData = [], 
  onCandleClick, 
  modelRef,
  scrollSpeed = 0.5,
  spacing = 4 
}) {
  const groupRef = useRef();
  const [vcandleObjects, setVcandleObjects] = useState([]);
  const scrollOffsetRef = useRef(0);
  
  // Extract and clone VCANDLE objects from the main model OR create new ones
  useEffect(() => {
    // If we already have candles, don't recreate
    if (vcandleObjects.length > 0) return;
    
    // Try to extract from model first
    if (modelRef?.current) {
      const modelId = modelRef.current.uuid;
      if (globalCandleCache.modelId === modelId && globalCandleCache.candles && globalCandleCache.candles.length > 0) {
        console.log('[CandleMarquee] Using cached candles from global cache');
        setVcandleObjects(globalCandleCache.candles);
        return;
      }
      
      console.log('[CandleMarquee] Extracting candles from model...');
      const extractedCandles = [];
      
      modelRef.current.traverse((child) => {
        if (child.name && child.name.startsWith('VCANDLE')) {
          const clonedCandle = child.clone(true);
          clonedCandle.userData = { ...child.userData };
          clonedCandle.visible = true;
          clonedCandle.traverse((descendant) => {
            descendant.visible = true;
          });
          
          extractedCandles.push({
            object: clonedCandle,
            name: child.name,
            userData: child.userData
          });
        }
      });
      
      if (extractedCandles.length > 0) {
        extractedCandles.sort((a, b) => {
          const numA = parseInt(a.name.replace('VCANDLE', ''));
          const numB = parseInt(b.name.replace('VCANDLE', ''));
          return numA - numB;
        });
        
        console.log(`[CandleMarquee] Extracted ${extractedCandles.length} candles from model`);
        globalCandleCache.modelId = modelId;
        globalCandleCache.candles = extractedCandles;
        setVcandleObjects(extractedCandles);
        return;
      }
    }
    
    // If no candles found in model, create our own
    console.log('[CandleMarquee] No VCANDLE objects found, creating candles programmatically...');
    const createdCandles = [];
    for (let i = 0; i < 12; i++) {
      createdCandles.push({
        object: null, // Will be created by MarqueeCandle component
        name: `CANDLE${i}`,
        userData: {}
      });
    }
    setVcandleObjects(createdCandles);
  }, [modelRef, vcandleObjects.length]);
  
  // Prepare candle data with user information
  const allCandleData = React.useMemo(() => {
    if (candleData.length > 0) {
      return candleData;
    }
    // Fallback mock data
    return Array(12).fill(null).map((_, i) => ({
      id: `mock-${i}`,
      userName: `Player${i + 1}`,
      username: `Player${i + 1}`,
      burnedAmount: Math.floor(Math.random() * 1000),
      image: i % 2 === 0 ? '/vvv.jpg' : '/vsClown.jpg'
    }));
  }, [candleData]);
  
  // Create combined data with doubled candles for seamless loop
  const combinedData = React.useMemo(() => {
    if (vcandleObjects.length === 0) return [];
    
    // Create two sets of candles for seamless scrolling
    const singleSet = allCandleData.map((userData, index) => {
      const vcandleIndex = index < vcandleObjects.length ? index : index % vcandleObjects.length;
      const clonedCandle = vcandleObjects[vcandleIndex].object ? vcandleObjects[vcandleIndex].object.clone(true) : null;
      
      if (clonedCandle && userData && (userData.image || userData.username || userData.userName)) {
        clonedCandle.traverse((child) => {
          if (child.material && child.name && child.name.toLowerCase().includes('label')) {
            if (Array.isArray(child.material)) {
              child.material = child.material.map(mat => mat.clone());
            } else {
              child.material = child.material.clone();
            }
          }
        });
      }
      
      return {
        userData: {
          ...userData,
          userName: userData.userName || userData.username || `Player ${index + 1}`,
          image: userData.image || userData.profileImage || null,
          burnedAmount: userData.burnedAmount || 0,
          message: userData.message || '',
          createdAt: userData.createdAt || new Date()
        },
        candleObject: clonedCandle,
        originalName: `${vcandleObjects[vcandleIndex].name}-${index}`
      };
    });
    
    // Duplicate the set for seamless looping
    return [...singleSet, ...singleSet];
  }, [allCandleData, vcandleObjects]);
  
  // Calculate total width for one set of candles (half of combined since we doubled)
  const singleSetLength = Math.ceil(combinedData.length / 2);
  const totalWidth = singleSetLength * spacing;
  
  useFrame((state, delta) => {
    if (groupRef.current && combinedData.length > 0) {
      // Update scroll position (move left continuously)
      scrollOffsetRef.current += scrollSpeed * delta;
      
      // Reset position seamlessly when we've scrolled through one complete set
      // The candles start at -15 and we need to scroll the full width
      if (scrollOffsetRef.current >= totalWidth) {
        scrollOffsetRef.current = 0;
      }
      
      // Move the entire group left to create scrolling effect
      groupRef.current.position.x = -scrollOffsetRef.current;
    }
  });
  
  // Debug logging
  useEffect(() => {
    console.log('[CandleMarquee] Combined data length:', combinedData.length);
    console.log('[CandleMarquee] Total width:', totalWidth);
  }, [combinedData.length, totalWidth]);
  
  return (
    <group ref={groupRef} position={[40, 0, 0]}>
      {combinedData.map((item, index) => {
        const xPosition = index * spacing; // Start from 0, group starts at 40
        return (
          <MarqueeCandle
            key={`${item.originalName}-${index}`}
            position={[xPosition, 0, 0]}  // All at same Y and Z position for horizontal line
            candleObject={item.candleObject}
            userData={item.userData}
            index={index}
            onClick={onCandleClick}
            scrollSpeed={scrollSpeed}
          />
        );
      })}
      
      {/* Ambient lighting for the marquee */}
      <ambientLight intensity={0.3} />
      <pointLight
        position={[0, 2, 2]}
        color="#ffa500"
        intensity={0.5}
        distance={20}
        decay={2}
      />
    </group>
  );
}

export default React.memo(CandleMarquee, (prevProps, nextProps) => {
  return (
    prevProps.candleData === nextProps.candleData &&
    prevProps.modelRef === nextProps.modelRef &&
    prevProps.onCandleClick === nextProps.onCandleClick &&
    prevProps.scrollSpeed === nextProps.scrollSpeed &&
    prevProps.spacing === nextProps.spacing
  );
});