import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

// Preload the candle model
useGLTF.preload('/models/singleCandleAnimatedFlame.glb');

// Marquee candle component that receives a cloned candle model
function MarqueeCandle({ candleObject, userData, index, onClick, isLeader, xPosition, scrollOffsetRef, totalCandles, candleSpacing }) {
  const groupRef = useRef();
  const candleRef = useRef();
  const createdTexturesRef = useRef([]);
  
  // Setup candle on mount
  useEffect(() => {
    if (!candleObject || !groupRef.current) return;
    
    // Scale the candle appropriately for marquee display
    candleObject.scale.set(3, 3, 3); // Adjust scale for marquee
    
    
    // Ensure the candle is centered in its group
    const box = new THREE.Box3().setFromObject(candleObject);
    const center = box.getCenter(new THREE.Vector3());
    candleObject.position.sub(center);
    candleObject.position.y = 0; // Reset Y to baseline
    
    // Initially hide Label1 for all candles (memory optimization)
    candleObject.traverse((child) => {
      if (child.name?.includes('Label1')) {
        child.visible = false;
      }
    });
    
    // Handle candles without user data - make Label2 subtle
    if (!userData || (!userData.image && !userData.username && !userData.userName)) {
      candleObject.traverse((child) => {
        if (child.name?.includes('Label2') && child.material) {
          // Make Label2 less visible when no user data
          child.material = child.material.clone();
          child.material.opacity = 0.3;
          child.material.transparent = true;
        }
      });
    }
    
    // Apply user data to the cloned candle
    if (userData) {
      // Update userData on the candle object
      candleObject.userData = {
        ...candleObject.userData,
        ...userData,
        hasUser: true
      };
      
      // Apply user image with username to labels if available
      if ((userData.image || userData.username || userData.userName)) {
        // Create canvas for combined image and username
        // Use smaller texture to save memory
        const canvas = document.createElement('canvas');
        canvas.width = 256;  // Further reduced for memory
        canvas.height = 256;  // Further reduced for memory
        const ctx = canvas.getContext('2d');
        
        // Fill background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Get username (check multiple possible fields)
        const username = userData.username || userData.userName || userData.name || '';
        
        // Function to create texture with image and name
        const createCombinedTexture = (img) => {
          // Clear canvas
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // Draw the image (leave space at bottom for name if username exists)
          const imageHeight = username ? canvas.height * 0.9 : canvas.height;
          ctx.drawImage(img, 0, 0, canvas.width, imageHeight);
          
          // Draw username if provided
          if (username && username.trim()) {
            // Create gradient background for text
            const gradient = ctx.createLinearGradient(0, imageHeight, 0, canvas.height);
            gradient.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0.9)');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, imageHeight, canvas.width, canvas.height - imageHeight);
            
            // Draw the username
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            const textY = imageHeight + (canvas.height - imageHeight) / 2;
            
            // Add text shadow for better readability
            ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
            ctx.shadowBlur = 4;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
            
            ctx.fillText(username, canvas.width / 2, textY);
          }
          
          // Create texture from canvas
          const texture = new THREE.CanvasTexture(canvas);
          texture.wrapS = THREE.ClampToEdgeWrapping;
          texture.wrapT = THREE.ClampToEdgeWrapping;
          texture.minFilter = THREE.LinearMipMapLinearFilter;
          texture.magFilter = THREE.LinearFilter;
          texture.anisotropy = 16;
          texture.generateMipmaps = true;
          texture.needsUpdate = true;
          createdTexturesRef.current.push(texture); // Track for disposal
          
          // Apply texture only to Label2, hide Label1
          candleObject.traverse((child) => {
            if (child.name?.includes('Label1')) {
              // Hide Label1 completely to save rendering
              child.visible = false;
            } else if (child.name?.includes('Label2')) {
              // Apply texture only to Label2
              if (child.material && !child.userData.textureApplied) {
                child.material = child.material.clone();
                
                // Clone and flip texture for Label2 (like MobileCandleOrbital does)
                const flippedTexture = texture.clone();
                flippedTexture.center.set(0.5, 0.5);
                flippedTexture.repeat.set(1, -1); // Flip vertically
                flippedTexture.needsUpdate = true;
                createdTexturesRef.current.push(flippedTexture); // Track for disposal
                
                child.material.map = flippedTexture;
                child.material.emissive = new THREE.Color(0xffffff);
                child.material.emissiveMap = flippedTexture;
                child.material.emissiveIntensity = 0.2; // Subtle glow
                child.material.needsUpdate = true;
                child.userData.textureApplied = true; // Mark this specific child as having texture applied
              }
            }
          });
        };
        
        // Load and apply the image
        if (userData.image) {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => createCombinedTexture(img);
          img.onerror = () => {
            // If image fails to load, create texture with just the name
            const defaultImg = new Image();
            defaultImg.onload = () => createCombinedTexture(defaultImg);
            defaultImg.src = '/defaultAvatar.png';
          };
          img.src = userData.image;
        } else {
          // No image provided, use default
          const defaultImg = new Image();
          defaultImg.onload = () => createCombinedTexture(defaultImg);
          defaultImg.src = '/defaultAvatar.png';
        }
      }
    }
    
    // Enhance flame effects for the leader
    if (isLeader) {
      candleObject.traverse((child) => {
        if (child.name?.toLowerCase().includes('flame')) {
          if (child.material) {
            child.material = child.material.clone();
            child.material.emissiveIntensity = 1.5; // Brighter for leader
          }
        }
      });
    }
    
    // Add candle to group
    candleRef.current = candleObject;
    groupRef.current.add(candleObject);
    
    // Cleanup on unmount
    return () => {
      // Dispose of created textures
      createdTexturesRef.current.forEach(texture => {
        texture.dispose();
      });
      
      // Clean up materials
      if (candleRef.current) {
        candleRef.current.traverse((child) => {
          if (child.material) {
            if (child.material.map) child.material.map.dispose();
            child.material.dispose();
          }
          if (child.geometry) {
            child.geometry.dispose();
          }
        });
      }
      
      if (candleRef.current && groupRef.current) {
        groupRef.current.remove(candleRef.current);
      }
    };
  }, [candleObject, userData, isLeader]);
  
  // Pre-calculate constants for performance
  const indexOffset = index * 0.5;
  const indexPhase = index * Math.PI;
  const totalWidth = candleSpacing * totalCandles;
  const halfWidth = totalWidth / 2;
  
  useFrame((state) => {
    if (groupRef.current && scrollOffsetRef) {
      const time = state.clock.elapsedTime;
      
      // Calculate base position with scroll offset
      let baseX = xPosition + scrollOffsetRef.current;
      
      // Wrap around for seamless looping - fixed to handle both directions
      while (baseX > halfWidth) {
        baseX -= totalWidth;
      }
      while (baseX < -halfWidth) {
        baseX += totalWidth;
      }
      
      // Combined motion calculations (reduced trig calls)
      const time15 = time * 1.5;
      const time2 = time * 2;
      
      // Set position with motion effects
      groupRef.current.position.set(
        baseX + Math.sin(time15 + indexOffset) * 0.3,
        Math.sin(time2 + index) * 0.2,
        Math.sin(time * 1.8 + index * 0.7) * 0.5
      );
      
      // Rotation for the candle - minimal rotation to keep labels stable
      if (candleRef.current) {
        // Very slow Y rotation or static with just a phase offset per candle
        const yRotation = indexOffset * 0.5; // Static offset based on index, no time-based rotation
        
        // Very subtle X and Z wobbles for slight movement
        const xWobble = Math.sin(time * 1.2 + index) * 0.02; // Very subtle
        const zWobble = Math.cos(time15 + index * 0.8) * 0.02; // Very subtle
        
        candleRef.current.rotation.set(
          xWobble,
          yRotation,
          zWobble
        );
      }
      
      // Scale pulsing - use different frequency to avoid synchronized pulsing
      const scalePulse = 1 + Math.sin(time * 0.8 + indexPhase) * 0.05;
      groupRef.current.scale.setScalar(scalePulse);
    }
  });
  
  const handleClick = (e) => {
    e.stopPropagation();
    onClick({
      ...userData,
      candleId: `mobile-candle-${index}`,
      candleTimestamp: Date.now(),
    });
  };
  
  return (
    <group ref={groupRef} onClick={handleClick}>
      {/* No badges or text - just the pure candle objects */}
    </group>
  );
}

// Main marquee system to be added to existing scene
function CandleMarquee({ candleData = [], onCandleClick }) {
  const groupRef = useRef();
  const { scene: candleModel } = useGLTF('/models/singleCandleAnimatedFlame.glb');
  const scrollOffsetRef = useRef(0);
  
  // Configuration for the marquee
  const VISIBLE_CANDLES = 6; // Number of candles visible in viewport
  const CANDLE_SPACING = 7; // Space between candles
  const SCROLL_SPEED = 1; // Speed of marquee movement
  
  
  // Get all sorted user data for marquee
  const allSortedData = React.useMemo(() => {
    if (candleData.length > 0) {
      const realData = [...candleData];
      
      // For testing: Add minimal mock data
      const mockData = Array(3).fill(null).map((_, i) => ({
        id: `mock-${i}`,
        userName: `TestUser${i + 1}`,
        username: `TestUser${i + 1}`,
        burnedAmount: Math.floor(Math.random() * 100),
        image: i % 2 === 0 ? '/vvv.jpg' : '/vsClown.jpg'
      }));
      
      return [...realData, ...mockData].slice(0, 8); // Fewer candles for memory
    }
    // Fallback mock data
    return Array(6).fill(null).map((_, i) => ({
      id: `mock-${i}`,
      userName: `Player${i + 1}`,
      username: `Player${i + 1}`,
      burnedAmount: Math.floor(Math.random() * 1000),
      image: i % 2 === 0 ? '/vvv.jpg' : '/vsClown.jpg'
    }));
  }, [candleData]);

  // Combine all data with cloned candle models for continuous marquee
  const combinedData = React.useMemo(() => {
    if (!candleModel) return [];
    
    // Use single data set (no doubling needed with new wrapping logic)
    return allSortedData.map((userData, index) => {
      // Clone the candle model for each instance
      const clonedCandle = candleModel.clone(true);
      
      // Only clone materials if we're going to modify them (for labels with userData)
      // This saves significant memory by reusing materials when possible
      if (userData && (userData.image || userData.username || userData.userName)) {
        clonedCandle.traverse((child) => {
          if (child.material && child.name && child.name.toLowerCase().includes('label')) {
            // Only clone materials for label meshes that will be modified
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
          // Ensure we have all the expected fields
          userName: userData.userName || userData.username || `Player ${index + 1}`,
          image: userData.image || userData.profileImage || null,
          burnedAmount: userData.burnedAmount || 0,
          message: userData.message || '',
          createdAt: userData.createdAt || new Date()
        },
        candleObject: clonedCandle,
        originalName: `candle-${index}`,
        globalIndex: index
      };
    });
  }, [allSortedData, candleModel]);
  
  
  // Marquee animation
  useFrame((_, delta) => {
    // Update scroll offset using ref (avoids re-renders)
    scrollOffsetRef.current += SCROLL_SPEED * delta;
    
    // Wrap smoothly when reaching the end
    const totalWidth = allSortedData.length * CANDLE_SPACING;
    if (scrollOffsetRef.current > totalWidth) {
      scrollOffsetRef.current -= totalWidth;
    }
  });

  return (
    <group ref={groupRef} position={[0, -3, 0]}>
      {/* Transparent container for the marquee */}
      {combinedData.map((item, index) => {
        // Calculate x position with offset for scrolling
        const baseX = index * CANDLE_SPACING - (VISIBLE_CANDLES * CANDLE_SPACING / 2);
        
        return (
          <MarqueeCandle 
            key={item.originalName || index}
            candleObject={item.candleObject}
            userData={item.userData}
            index={index}
            onClick={onCandleClick}
            isLeader={index === 0}
            xPosition={baseX}
            scrollOffsetRef={scrollOffsetRef}
            totalCandles={combinedData.length}
            candleSpacing={CANDLE_SPACING}
          />
        );
      })}
      
      {/* Ambient lighting for the marquee */}
      <ambientLight intensity={0.3} />
      <directionalLight
        position={[5, 5, 5]}
        intensity={0.5}
        castShadow
      />
    </group>
  );
}

// Wrap with React.memo to prevent unnecessary re-renders
export default React.memo(CandleMarquee, (prevProps, nextProps) => {
  // Only re-render if these critical props change
  return (
    prevProps.candleData === nextProps.candleData &&
    prevProps.onCandleClick === nextProps.onCandleClick
  );
});
