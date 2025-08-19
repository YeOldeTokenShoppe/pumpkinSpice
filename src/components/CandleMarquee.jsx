import React, { useRef, useEffect, useState, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useFirestoreResults } from '@/utilities/useFirestoreResults';

// Individual candle component with smooth animation
function MarqueeCandle({ basePosition, scrollRef, spacing, totalCount, candleObject, userData, index, onClick, direction, isSelected = false, isPaused = false }) {
  const groupRef = useRef();
  const candleRef = useRef();
  const [textureLoaded, setTextureLoaded] = useState(false);
  const [hovered, setHovered] = useState(false);
  
  // Update position, rotation, and opacity smoothly
  useFrame((state) => {
    if (groupRef.current) {
      // Position update
      if (direction === 'vertical') {
        let yPos = basePosition + (index * spacing) - scrollRef.current;
        const totalHeight = totalCount * spacing; // No division needed with single set
        
        // Smooth wrapping
        while (yPos < -totalHeight/2) yPos += totalHeight;
        while (yPos > totalHeight/2) yPos -= totalHeight;
        
        groupRef.current.position.set(0, yPos, 0);
      } else {
        let xPos = basePosition + (index * spacing) - scrollRef.current;
        const totalWidth = totalCount * spacing; // No division needed with single set
        
        // Smooth wrapping
        while (xPos < -totalWidth/2) xPos += totalWidth;
        while (xPos > totalWidth/2) xPos -= totalWidth;
        
        groupRef.current.position.set(xPos, 0, 3);
      }
      
      // Rotate each candle with individual offset and speed based on index
      // Use different multipliers to create variety in rotation positions
      const rotationOffset = index * 2.3; // Irregular offset for more randomness
      const rotationSpeed = 0.3 + (index % 3) * 0.1; // Vary speed slightly per candle
      groupRef.current.rotation.y = state.clock.elapsedTime * rotationSpeed + rotationOffset;
      
      // Scale animation for hovered only (not selected)
      const targetScale = hovered ? 1.1 : 1.0;
      const currentScale = groupRef.current.scale.x;
      const newScale = currentScale + (targetScale - currentScale) * 0.1;
      groupRef.current.scale.set(newScale, newScale, newScale);
    }
  });
  
  // Setup candle on mount
  useEffect(() => {
    if (!candleObject || !groupRef.current) return;
    
    // Scale the candle appropriately (same as FloatingCandleViewer)
    candleObject.scale.set(1.5, 1.5, 1.5);
    
    // Apply user data
    if (userData) {
      candleObject.userData = {
        ...candleObject.userData,
        ...userData,
        hasUser: true
      };
    }
    
    candleRef.current = candleObject;
    groupRef.current.add(candleObject);
    
    // Texture is now applied during cloning in duplicatedData
    // so we don't need to apply it here anymore
    setTextureLoaded(true);
    
    return () => {
      if (candleRef.current && groupRef.current) {
        groupRef.current.remove(candleRef.current);
      }
    };
  }, [candleObject, userData]);
  
  
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
    <group 
      ref={groupRef} 
      onClick={handleClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* Candle object is added in useEffect, position updated in useFrame */}
    </group>
  );
}

// Inner marquee component that needs to be inside Canvas
function CandleMarqueeInner({ 
  candleData = [], 
  onCandleClick,
  currentPage = 0,
  itemsPerPage = 10,
  scrollSpeed = 0.1,
  direction = 'horizontal',
  isPausedExternal = false,
  useFirestore = true
}) {
  const groupRef = useRef();
  const [vcandleObjects, setVcandleObjects] = useState([]);
  const scrollPositionRef = useRef(0);
  const [selectedCandleIndex, setSelectedCandleIndex] = useState(null);
  
  // Fetch results from Firestore if useFirestore is true
  const firestoreResults = useFirestoreResults();
  const results = useFirestore && firestoreResults.length > 0 ? firestoreResults : candleData;
  
  // Load the candle model
  const { scene: candleModel } = useGLTF('/models/singleCandleAnimatedFlame.glb');
  
  // Extract candle object from loaded model
  useEffect(() => {
    if (!candleModel) return;
    
    // Create multiple clones of the candle for the marquee
    const extractedCandles = [];
    const numCandles = Math.max(itemsPerPage * 2, 20); // Double for seamless scrolling
    
    for (let i = 0; i < numCandles; i++) {
      const clonedCandle = candleModel.clone(true);
      clonedCandle.userData = { ...candleModel.userData };
      clonedCandle.visible = true;
      clonedCandle.traverse((descendant) => {
        descendant.visible = true;
        // Don't clone materials here - we'll do it when creating duplicatedData
      });
      
      extractedCandles.push({
        object: clonedCandle,
        name: `CANDLE_${i}`,
        userData: candleModel.userData
      });
    }
    
    setVcandleObjects(extractedCandles);
  }, [candleModel, itemsPerPage]);
  
  // Get current page data
  const currentPageData = useMemo(() => {
    const startIdx = currentPage * itemsPerPage;
    const endIdx = startIdx + itemsPerPage;
    
    if (results.length > 0) {
      // Loop through results if we have fewer than needed
      const dataToUse = [];
      for (let i = startIdx; i < endIdx; i++) {
        dataToUse.push(results[i % results.length]);
      }
      return dataToUse;
    }
    
    // Mock data for testing if no results
    return Array(itemsPerPage).fill(null).map((_, i) => ({
      id: `mock-${startIdx + i}`,
      userName: `Player${startIdx + i + 1}`,
      burnedAmount: Math.floor(Math.random() * 1000),
      image: i % 2 === 0 ? '/vvv.jpg' : '/vsClown.jpg',
      message: `Test message ${i + 1}`
    }));
  }, [results, currentPage, itemsPerPage]);
  
  // Helper function to apply texture directly to cloned candle
  const applyTextureToClone = (candleObject, imageUrl) => {
    if (!imageUrl) return;
    
    let labelMesh = null;
    candleObject.traverse((child) => {
      if (child.name?.includes('Label2')) {
        labelMesh = child;
      }
    });
    
    if (!labelMesh) return;
    
    // Create texture synchronously from image URL
    const textureLoader = new THREE.TextureLoader();
    textureLoader.crossOrigin = "anonymous";
    
    // Use simpler direct texture loading for initial setup
    const texture = textureLoader.load(imageUrl);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.flipY = false;
    texture.needsUpdate = true;
    
    // Apply material directly
    labelMesh.material = new THREE.MeshStandardMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide,
      emissive: new THREE.Color(0xffffff),
      emissiveIntensity: 0.5,
      emissiveMap: texture,
      metalness: 0.3,
      roughness: 0.2,
    });
    labelMesh.material.needsUpdate = true;
  };

  // Helper function to apply text to Label1
  const applyTextToLabel1 = (candleObject, userData) => {
    if (!candleObject || !userData) return;
    
    let label1Mesh = null;
    candleObject.traverse((child) => {
      if (child.name?.includes('Label1')) {
        label1Mesh = child;
      }
    });
    
    if (!label1Mesh) return;
    
    // Create canvas for text
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 1024;
    const context = canvas.getContext("2d");
    
    // Clear canvas and set background
    context.fillStyle = "#F5F5DC"; // Parchment color
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // Save the context state
    context.save();
    
    // Rotate the text 180 degrees to make it readable on the candle
    context.translate(canvas.width / 2, canvas.height / 2);
    context.rotate(Math.PI);
    context.translate(-canvas.width / 2, -canvas.height / 2);
    
    // Set text properties
    context.fillStyle = "#000000";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.font = "bold 48px serif";
    
    // Create the message text
    const userName = userData.userName || userData.username || "Friend";
    const message = userData.message || "may the light of Our Lady of Perpetual Profit illuminate the path to prosperity.";
    const fullText = `On behalf of ${userName},\n\n${message}`;
    
    // Word wrapping
    const maxWidth = 600;
    const lineHeight = 70;
    const words = fullText.split(" ");
    let lines = [];
    let currentLine = "";
    
    words.forEach((word) => {
      const testLine = currentLine + word + " ";
      const metrics = context.measureText(testLine);
      
      if (metrics.width > maxWidth) {
        lines.push(currentLine);
        currentLine = word + " ";
      } else {
        currentLine = testLine;
      }
    });
    lines.push(currentLine);
    
    // Draw text with shadow for better visibility
    const startY = (canvas.height - lines.length * lineHeight) / 2;
    lines.forEach((line, index) => {
      // Add shadow
      context.shadowColor = "rgba(0, 0, 0, 0.5)";
      context.shadowBlur = 4;
      context.shadowOffsetX = 2;
      context.shadowOffsetY = 2;
      
      // Draw text
      context.fillText(line, canvas.width / 2, startY + index * lineHeight);
      
      // Reset shadow
      context.shadowColor = "transparent";
    });
    
    // Restore the context state
    context.restore();
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    
    // Apply material to Label1
    label1Mesh.material = new THREE.MeshStandardMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide,
      emissive: new THREE.Color(0xffffff),
      emissiveIntensity: 0.5,
      emissiveMap: texture,
      metalness: 0.2,
      roughness: 0.8,
    });
    label1Mesh.material.needsUpdate = true;
  };

  // Create duplicated data for seamless scrolling
  const duplicatedData = useMemo(() => {
    if (vcandleObjects.length === 0) return [];
    
    // Use only one set of data - no duplication
    const dataToUse = [...currentPageData];
    
    return dataToUse.map((userData, index) => {
      const vcandleIndex = index % vcandleObjects.length;
      const clonedCandle = vcandleObjects[vcandleIndex].object.clone(true);
      
      // Clone all materials to ensure each candle has independent materials
      clonedCandle.traverse((child) => {
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material = child.material.map(mat => mat.clone());
          } else {
            child.material = child.material.clone();
          }
        }
      });
      
      // Center the candle BEFORE applying texture
      const box = new THREE.Box3().setFromObject(clonedCandle);
      const center = box.getCenter(new THREE.Vector3());
      clonedCandle.position.sub(center);
      clonedCandle.position.y = 0;
      
      // Apply texture AFTER centering
      if (userData?.image || userData?.profileImage) {
        applyTextureToClone(clonedCandle, userData.image || userData.profileImage);
      }
      
      // Apply text message to Label1
      applyTextToLabel1(clonedCandle, userData);
      
      return {
        userData: {
          ...userData,
          userName: userData.userName || userData.username || `Player ${index + 1}`,
          image: userData.image || userData.profileImage || null,
          burnedAmount: userData.burnedAmount || 0,
        },
        candleObject: clonedCandle,
        originalName: `${vcandleObjects[vcandleIndex].name}-marquee-${index}`,
        key: `candle-${index}-${userData.userName || index}` // Stable key
      };
    });
  }, [currentPageData, vcandleObjects]);
  
  // Reset scroll position when page changes
  useEffect(() => {
    scrollPositionRef.current = 0;
  }, [currentPage]);
  
  // Calculate positions directly in render - no state updates
  const spacing = direction === 'vertical' ? 5 : 20; // Space between candles
  const setSize = currentPageData.length * spacing; // Size of one complete set
  
  // Animate the marquee (vertical or horizontal)
  useFrame((state, delta) => {
    if (duplicatedData.length > 0 && !isPausedExternal) {
      // Smooth continuous scrolling only when not paused
      // Negative value to scroll from bottom to top (or right to left)
      scrollPositionRef.current -= scrollSpeed * delta * 10;
      
      // Reset scroll to prevent overflow
      if (scrollPositionRef.current > setSize) {
        scrollPositionRef.current = scrollPositionRef.current % setSize;
      }
    }
  });
  
  // Handle candle click
  const handleCandleClick = (index, userData) => {
    setSelectedCandleIndex(index);
    if (onCandleClick) {
      onCandleClick(userData);
    }
  };
  
  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {duplicatedData.map((item, index) => (
        <MarqueeCandle
          key={item.key}
          basePosition={0}
          scrollRef={scrollPositionRef}
          spacing={spacing}
          totalCount={duplicatedData.length}
          candleObject={item.candleObject}
          userData={item.userData}
          index={index}
          onClick={() => handleCandleClick(index, item.userData)}
          direction={direction}
          isSelected={selectedCandleIndex === index}
          isPaused={isPausedExternal}
        />
      ))}
    </group>
  );
}

// Main component with its own Canvas
export default function CandleMarquee({ 
  candleData = [], 
  onCandleClick,
  currentPage = 0,
  itemsPerPage = 10,
  scrollSpeed = 0.5,
  direction = 'vertical',
  style = {},
  canvasStyle = {},
  useFirestore = true
}) {
  const [isPaused, setIsPaused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  // Create the gradient mask based on direction
  const maskImage = direction === 'vertical' 
    ? 'linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)'
    : 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)';
  
  return (
    <div 
      style={{
        position: 'absolute',
        width: direction === 'vertical' ? '200px' : '100%',
        height: direction === 'vertical' ? '100%' : '200px',
        maskImage: maskImage,
        WebkitMaskImage: maskImage, // For Safari support
        ...style
      }}
      onMouseEnter={() => {
        setIsHovered(true);
        setIsPaused(true);
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsPaused(false);
      }}
    >
      <Canvas
        camera={{ 
          position: direction === 'vertical' ? [8, 0, 5] : [0, 5, 10], 
          fov: 50 
        }}
        style={{
          width: '100%',
          height: '100%',
          cursor: 'pointer',
          ...canvasStyle
        }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <Suspense fallback={null}>
          <CandleMarqueeInner
            candleData={candleData}
            onCandleClick={(userData) => {
              if (onCandleClick) onCandleClick(userData);
            }}
            currentPage={currentPage}
            itemsPerPage={itemsPerPage}
            scrollSpeed={scrollSpeed}
            direction={direction}
            isPausedExternal={isPaused}
            useFirestore={useFirestore}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}

// Preload the candle model
useGLTF.preload('/models/singleCandleAnimatedFlame.glb');