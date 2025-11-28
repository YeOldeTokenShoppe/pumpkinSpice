import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

// Scene content that loads the candle model directly
function CandleScene({ firestoreData }) {
  const { scene, animations } = useGLTF("/models/singleCandleAnimatedFlame.glb");
  const candleRef = useRef();
  const mixerRef = useRef(null);
  
  // Setup animations if available
  useEffect(() => {
    if (animations && animations.length > 0 && scene) {
      mixerRef.current = new THREE.AnimationMixer(scene);
      animations.forEach(clip => {
        mixerRef.current.clipAction(clip).play();
      });
    }
    
    return () => {
      if (mixerRef.current) {
        mixerRef.current.stopAllAction();
      }
    };
  }, [animations, scene]);
  
  // Clone and setup the candle
  useEffect(() => {
    if (scene && candleRef.current) {
      const clonedCandle = scene.clone();
      
      // Scale up for better visibility
      clonedCandle.scale.set(1.5, 1.5, 1.5);
      clonedCandle.position.set(0, -1.5, 0);
      
      // Apply any Firestore data if provided
      if (firestoreData) {
        clonedCandle.userData = {
          ...clonedCandle.userData,
          ...firestoreData
        };
        
        // Apply user data to candle labels (matching MobileCandleOrbital)
        const username = firestoreData.username || firestoreData.userName || firestoreData.name || 'Anonymous Trader';
        const message = firestoreData.message || firestoreData.prayer || 'May the gains be with you 🚀';
        const imageUrl = firestoreData.image || firestoreData.profileImage || '/defaultAvatar.png';
        const performance = firestoreData.performance || firestoreData.burnedAmount || 0;
        
        // Create texture for Label1 (prayer/message)
        const createLabel1Texture = () => {
          const canvas = document.createElement('canvas');
          canvas.width = 1024;
          canvas.height = 1024;
          const ctx = canvas.getContext('2d');
          
          // Fill with parchment background
          ctx.fillStyle = '#F4E8D0';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // Add border
          ctx.strokeStyle = '#e0e0e0';
          ctx.lineWidth = 2;
          ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
          
          // Add heading
          ctx.fillStyle = "#000000";
          ctx.font = 'bold 42px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial';
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText('Prayer to Our Lady', canvas.width / 2, 80);
          ctx.fillText('of Perpetual Profit', canvas.width / 2, 130);
          
          // Add divider
          ctx.strokeStyle = '#333333';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(100, 165);
          ctx.lineTo(canvas.width - 100, 165);
          ctx.stroke();
          
          // Draw message
          ctx.fillStyle = "#000000";
          ctx.font = 'bold 48px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial';
          ctx.textAlign = "center";
          
          // Word wrap for message
          const words = message.split(' ');
          const maxWidth = 600;
          const lineHeight = 70;
          let lines = [];
          let currentLine = '';
          
          words.forEach((word) => {
            const testLine = currentLine + word + ' ';
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && currentLine) {
              lines.push(currentLine);
              currentLine = word + ' ';
            } else {
              currentLine = testLine;
            }
          });
          lines.push(currentLine);
          
          const startY = 200 + ((canvas.height - 200) - lines.length * lineHeight) / 2;
          lines.forEach((line, index) => {
            ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
            ctx.shadowBlur = 4;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
            ctx.fillText(line, canvas.width / 2, startY + index * lineHeight);
          });
          
          const texture = new THREE.CanvasTexture(canvas);
          texture.wrapS = THREE.ClampToEdgeWrapping;
          texture.wrapT = THREE.ClampToEdgeWrapping;
          // texture.repeat.set(1, 1);  // Try without flipping first
          // texture.offset.set(1, 1);
          texture.needsUpdate = true;
          
          return texture;
        };
        
        // Create texture for Label2 (user image + username)
        const createLabel2Texture = (img) => {
          const canvas = document.createElement('canvas');
          canvas.width = 512;
          canvas.height = 512;
          const ctx = canvas.getContext('2d');
          
          // Fill background
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // Draw image (leave space for username)
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
            
            // Draw username
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 36px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
            ctx.shadowBlur = 4;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
            
            const textY = imageHeight + (canvas.height - imageHeight) / 2;
            ctx.fillText(username, canvas.width / 2, textY);
          }
          
          const texture = new THREE.CanvasTexture(canvas);
          texture.wrapS = THREE.RepeatWrapping;
          texture.wrapT = THREE.RepeatWrapping;
          texture.repeat.set(1, -1);  // Flip both horizontally and vertically
          texture.offset.set(1, 1);
          texture.needsUpdate = true;
          
          return texture;
        };
        
        // Apply Label1 texture (prayer/message)
        const label1Texture = createLabel1Texture();
        
        // Load user image and apply to Label2
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = () => {
          const label2Texture = createLabel2Texture(img);
          
          // Apply textures to specific labels
          clonedCandle.traverse((child) => {
            // Apply prayer texture to Label1 (flipped)
            if (child.name?.includes('Label1')) {
              if (child.material) {
                child.material = child.material.clone();
                child.material.map = label1Texture;
                child.material.needsUpdate = true;
                
                // Add emissive glow
                child.material.emissive = new THREE.Color(0xffffff);
                child.material.emissiveMap = label1Texture;
                child.material.emissiveIntensity = 0.1;
              }
            }
            // Apply user image texture to Label2 (normal orientation)
            else if (child.name?.includes('Label2')) {
              if (child.material) {
                child.material = child.material.clone();
                child.material.map = label2Texture;
                child.material.needsUpdate = true;
                
                // Add subtle emissive glow
                child.material.emissive = new THREE.Color(0xffffff);
                child.material.emissiveMap = label2Texture;
                child.material.emissiveIntensity = 0.2;
              }
            }
          });
        };
        
        img.onerror = () => {
          // If image fails, use default avatar
          const defaultImg = new Image();
          defaultImg.onload = () => {
            const label2Texture = createLabel2Texture(defaultImg);
            
            // Apply textures
            clonedCandle.traverse((child) => {
              if (child.name?.includes('Label1')) {
                if (child.material) {
                  child.material = child.material.clone();
                  child.material.map = label1Texture;
                  child.material.needsUpdate = true;
                  child.material.emissive = new THREE.Color(0xffffff);
                  child.material.emissiveMap = label1Texture;
                  child.material.emissiveIntensity = 0.1;
                }
              } else if (child.name?.includes('Label2')) {
                if (child.material) {
                  child.material = child.material.clone();
                  child.material.map = label2Texture;
                  child.material.needsUpdate = true;
                  child.material.emissive = new THREE.Color(0xffffff);
                  child.material.emissiveMap = label2Texture;
                  child.material.emissiveIntensity = 0.2;
                }
              }
            });
          };
          defaultImg.src = '/defaultAvatar.png';
        };
        
        img.src = imageUrl;
        
        // Change candle glow based on performance
        if (performance !== undefined) {
          clonedCandle.traverse((child) => {
            if (child.isMesh && child.material && !child.name?.toLowerCase().includes('label')) {
              // Adjust material based on performance
              const hue = performance > 0 ? 0.3 : 0; // Green for profit, red for loss
              child.material.emissive = new THREE.Color().setHSL(hue, 1, 0.3);
              child.material.emissiveIntensity = 0.15;
            }
          });
        }
      }
      
      // Clear previous children and add new candle
      while (candleRef.current.children.length > 0) {
        candleRef.current.remove(candleRef.current.children[0]);
      }
      candleRef.current.add(clonedCandle);
    }
  }, [scene, firestoreData]);
  
  // Animation loop
  useFrame((state, delta) => {
    if (mixerRef.current) {
      mixerRef.current.update(delta);
    }
    
    if (candleRef.current) {
      // Gentle rotation
      candleRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.3;
    }
  });
  
  return (
    <>
      {/* Lighting setup similar to CandleInteraction */}
      <ambientLight intensity={0.15} />
      <directionalLight 
        position={[5, 8, 3]} 
        intensity={0.6} 
        castShadow 
        shadow-mapSize={[2048, 2048]}
      />
      
      {/* Spotlight on candle */}
      <spotLight
        position={[0, 5, 2]}
        intensity={0.8}
        angle={0.4}
        penumbra={0.6}
        color="#ffffff"
        castShadow
      />
      
      {/* Flame point light */}
      <pointLight 
        position={[0, 2, 0]}
        intensity={0.5}
        color="#ffaa44"
        distance={10}
        decay={2}
      />
      
      {/* Green accent light for trading theme */}
      <pointLight 
        position={[-3, 1, 3]}
        intensity={0.3}
        color="#00ff00"
        distance={8}
      />
      
      {/* The candle model */}
      <group ref={candleRef} />
      
      {/* Camera controls - with zoom and manual rotation enabled */}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        minDistance={2}
        maxDistance={10}
        autoRotate
        autoRotateSpeed={1}
      />
    </>
  );
}

// Main component for single candle display
export default function SingleCandleDisplay({ firestoreData }) {
  return (
    <Canvas
      camera={{ position: [0, 2, 5], fov: 35 }}
      style={{ width: '100%', height: '100%' }}
      gl={{ 
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: true
      }}
    >
      <CandleScene firestoreData={firestoreData} />
      <Environment preset="city" />
    </Canvas>
  );
}

// Preload the model
useGLTF.preload("/models/singleCandleAnimatedFlame.glb");