"use client";

import React, { useEffect, useState, useRef, Suspense, useCallback } from 'react';
import dynamic from 'next/dynamic';
import SlantedCarousel from '@/components/SlantedCarousel';
import { useMusic } from '@/components/MusicContext';
import { useUser, SignInButton } from "@clerk/nextjs";
import { Illumin80ClerkButton } from "@/components/Illumin80Display";
import CyberNav from '@/components/CyberNav';
import Link from 'next/link';
import Coin from '@/components/Coin';
import RotatingText from '@/components/RotatingText';
import '@/components/RotatingText.css';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';
import { db } from '@/utilities/firebaseClient';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import TextMarquee from '@/components/TextMarquee';
import { gsap } from 'gsap';
import { TextPlugin } from 'gsap/TextPlugin';
import '@/components/ArrowButton.css';
import InfinityLoader from '@/components/InfinityLoader';
import Illumin80Bouncer from '@/components/Illumin80Bouncer';
import CompactCandleModal from '@/components/CompactCandleModal';
import SocialBar from '@/components/SocialBar';
import BreathSmoke from '@/components/BreathSmoke';



// Register GSAP TextPlugin
if (typeof window !== 'undefined') {
  gsap.registerPlugin(TextPlugin);
}

// Custom useDisclosure hook
const useDisclosure = () => {
  const [isOpen, setIsOpen] = useState(false);
  const onOpen = () => setIsOpen(true);
  const onClose = () => setIsOpen(false);
  const onToggle = () => setIsOpen(prev => !prev);
  return { isOpen, onOpen, onClose, onToggle };
};

// Dynamically import 3D carousel to avoid SSR issues
const Simple3DCarousel = dynamic(() => import('@/components/Simple3DCarousel'), {
  ssr: false,
  loading: () => <div style={{ height: '50vh', background: 'linear-gradient(135deg, #1a1a2e 0%, #0f0f1e 100%)', borderRadius: '12px' }} />
});

// SingleCandleModel component for the two-column section
function SingleCandleModel({ candleData = null }) {
  const { scene, animations } = useGLTF('/models/singleCandleAnimatedFlame.glb');
  const { actions } = useAnimations(animations, scene);
  const modelRef = useRef();
  const label2MeshRef = useRef();
  const [label2Mesh, setLabel2Mesh] = useState(null);
  const targetRotationRef = useRef(0);
  const currentRotationRef = useRef(0);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [randomUserImages, setRandomUserImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  

  // Add this component for magical floating particles
const FloatingParticles = () => {
  return (
    <div style={{
      position: 'absolute',
      width: '100%',
      height: '100%',
      overflow: 'hidden',
      pointerEvents: 'none',
      top: 0,
      left: 0
    }}>
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            width: '4px',
            height: '4px',
            background: '#d4af37',
            borderRadius: '50%',
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animation: `float ${10 + Math.random() * 20}s infinite ease-in-out`,
            animationDelay: `${Math.random() * 5}s`,
            opacity: Math.random() * 0.5 + 0.3,
            boxShadow: '0 0 10px #d4af37'
          }}
        />
      ))}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); }
          25% { transform: translateY(-30px) translateX(10px); }
          50% { transform: translateY(15px) translateX(-10px); }
          75% { transform: translateY(-15px) translateX(15px); }
        }
      `}</style>
    </div>
  );
};

// Replace your bullet points with this component
const CandleBullet = ({ children }) => {
  return (
    <li style={{ 
      marginBottom: '0.5rem',
      display: 'flex',
      alignItems: 'flex-start',
      listStyle: 'none'
    }}>
      <span style={{
        marginRight: '0.5rem',
        fontSize: '1.2rem',
        animation: 'flicker 2s infinite',
        display: 'inline-block'
      }}>
        🕯️
      </span>
      <span>{children}</span>
      <style>{`
        @keyframes flicker {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(0.95); }
        }
      `}</style>
    </li>
  );
};

const GlowingHeader = ({ children, size = '1.5rem' }) => {
  return (
    <h3 style={{
      fontSize: size,
      marginBottom: '0.4rem',
      color: '#d4af37',
      fontFamily: 'UnifrakturCook, serif',
      textShadow: '0 0 20px rgba(212, 175, 55, 0.8)',
      animation: 'pulse 3s infinite ease-in-out'
    }}>
      {children}
      <style>{`
        @keyframes pulse {
          0%, 100% { textShadow: 0 0 20px rgba(212, 175, 55, 0.8); }
          50% { textShadow: 0 0 30px rgba(212, 175, 55, 1), 0 0 40px rgba(212, 175, 55, 0.6); }
        }
      `}</style>
    </h3>
  );
};
const CollapsibleSection = ({ title, children, icon = "📜" }) => {
  const [isOpen, setIsOpen] = useState(true);
  
  return (
    <div style={{
      marginBottom: '1.5rem',
      background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.05) 0%, rgba(212, 175, 55, 0.02) 100%)',
      border: '1px solid rgba(212, 175, 55, 0.3)',
      borderRadius: '8px',
      // padding: '1rem',
      transition: 'all 0.3s ease',
      boxShadow: isOpen ? '0 4px 20px rgba(212, 175, 55, 0.2)' : 'none'
    }}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: isOpen ? '1rem' : '0'
        }}
      >
        <h3 style={{
          fontSize: '1.5rem',
          color: '#d4af37',
          fontFamily: 'UnifrakturCook, serif',
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <span>{icon}</span>
          {title}
        </h3>
        <span style={{
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0)',
          transition: 'transform 0.3s ease',
          fontSize: '1.5rem'
        }}>⌄</span>
      </div>
      <div style={{
        maxHeight: isOpen ? '500px' : '0',
        overflow: 'hidden',
        transition: 'max-height 0.3s ease',
        opacity: isOpen ? 1 : 0
      }}>
        {children}
      </div>
    </div>
  );
};
const TaxProgressBar = ({ currentBuys = 150 }) => {
  const stages = [
    { buys: 0, tax: 5, label: "Start" },
    { buys: 250, tax: 3, label: "250 buys" },
    { buys: 500, tax: 1, label: "500 buys" },
    { buys: 1000, tax: 0, label: "CEX" }
  ];
  
  const progress = Math.min((currentBuys / 1000) * 100, 100);
  
  return (
    <div style={{ marginBottom: '2rem' }}>
      <div style={{
        // background: 'rgba(0, 0, 0, 0.5)',
        borderRadius: '10px',
        height: '40px',
        position: 'relative',
        // border: '1px solid rgba(212, 175, 55, 0.3)',
        overflow: 'hidden'
      }}>
        <div style={{
          // background: 'linear-gradient(90deg, #d4af37 0%, #f4e4bc 100%)',
          height: '100%',
          width: `${progress}%`,
          transition: 'width 1s ease',
          boxShadow: '0 0 20px rgba(212, 175, 55, 0.6)',
          position: 'relative'
        }}>
          <div style={{
            position: 'absolute',
            right: '0',
            top: '0',
            height: '100%',
            width: '10px',
            background: 'white',
            opacity: '0.8',
            animation: 'shimmer 2s infinite'
          }}/>
        </div>
        
        {stages.map((stage, i) => (
          <div key={i} style={{
            position: 'absolute',
            left: `${(stage.buys / 1000) * 100}%`,
            top: '-25px',
            transform: 'translateX(-50%)',
            textAlign: 'center',
            fontSize: '0.8rem',
            color: currentBuys >= stage.buys ? '#d4af37' : '#666'
          }}>
            <div>{stage.label}</div>
            <div style={{ fontWeight: 'bold' }}>{stage.tax}%</div>
            <div style={{
              width: '2px',
              height: '65px',
              background: currentBuys >= stage.buys ? '#d4af37' : '#444',
              margin: '0 auto'
            }}/>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100px); }
          100% { transform: translateX(100px); }
        }
      `}</style>
    </div>
  );
};

  // Fetch random user images from Firestore
  useEffect(() => {
    const fetchRandomUserImages = async () => {
      try {
        // Get all candles with images (limited for performance)
        const q = query(collection(db, 'results'), limit(50));
        const snapshot = await getDocs(q);
        
        const images = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          // Only include candles with valid images
          if (data.image && data.image !== '/defaultAvatar.png' && data.image !== '') {
            images.push({
              id: doc.id,
              image: data.image,
              username: data.username || 'Anonymous',
              message: data.message || ''
            });
          }
        });
        
        console.log('Fetched user images from Firestore:', images.length);
        if (images.length > 0) {
          setRandomUserImages(images);
          // Select a random image to start
          setCurrentImageIndex(Math.floor(Math.random() * images.length));
        }
      } catch (error) {
        console.error('Error fetching user images:', error);
      }
    };
    
    fetchRandomUserImages();
  }, []);
  
  // Rotate through images periodically
  useEffect(() => {
    if (randomUserImages.length > 1) {
      const interval = setInterval(() => {
        setCurrentImageIndex((prevIndex) => 
          (prevIndex + 1) % randomUserImages.length
        );
      }, 5000); // Change image every 5 seconds
      
      return () => clearInterval(interval);
    }
  }, [randomUserImages]);

  // Clone the scene to avoid conflicts with other instances
  const clonedScene = React.useMemo(() => {
    if (!scene) {
      console.log('Scene not loaded yet');
      return null;
    }
    
    const cloned = scene.clone();
    console.log('Cloning scene, checking for VCANDLE001 and Label2...');
    
    // Traverse the cloned scene to find and update specific meshes
    cloned.traverse((child) => {
      // Log all objects to see structure
      if (child.name) {
        console.log('Object in scene:', child.name, 'Type:', child.type, 'Parent:', child.parent?.name);
      }
      
      if (child.isMesh) {
        console.log('Found mesh:', child.name);
        
        // Store Label1 reference for message display
        if (child.name === 'Label1') {
          console.log('Found Label1 for message display');
          // Store the mesh reference on the cloned scene
          cloned.userData.label1Mesh = child;
        }
        
        // Setup Label2 for text - also check if it's part of VCANDLE001
        if (child.name === 'Label2' || 
            (child.parent && child.parent.name === 'VCANDLE001' && child.name === 'Label2')) {
          console.log('Found Label2!');
          // Store the mesh reference on the cloned scene itself
          cloned.userData.label2Mesh = child;
          
          // Create initial test texture
          const canvas = document.createElement('canvas');
          canvas.width = 256;
          canvas.height = 256;
          const ctx = canvas.getContext('2d');
          
          // Bright test pattern
          ctx.fillStyle = '#00ff00'; // Green
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = '#000000';
          ctx.font = 'bold 30px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('READY', canvas.width / 2, canvas.height / 2);
          
          const testTexture = new THREE.CanvasTexture(canvas);
          
          child.material = new THREE.MeshStandardMaterial({
            map: testTexture,
            side: THREE.DoubleSide,
            metalness: 0.1,
            roughness: 0.9
          });
        }
        
        // Make sure wax doesn't get any texture
        if (child.name === 'wax') {
          // Keep wax material as is or reset it if needed
          child.material = child.material.clone();
        }
      }
      
      // Also check for VCANDLE001 parent object
      if (child.name === 'VCANDLE001' || child.name === 'VCandle001' || child.name === 'vcandle001') {
        console.log('Found VCANDLE001, checking for Label2 child...');
        child.traverse((subChild) => {
          if (subChild.isMesh && (subChild.name === 'Label2' || subChild.name === 'label2')) {
            console.log('Found Label2 under VCANDLE001!');
            cloned.userData.label2Mesh = subChild;
            
            // Apply initial texture
            const canvas = document.createElement('canvas');
            canvas.width = 256;
            canvas.height = 256;
            const ctx = canvas.getContext('2d');
            
            ctx.fillStyle = '#1a1a1a';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#d4af37';
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('LOADING...', canvas.width / 2, canvas.height / 2);
            
            const testTexture = new THREE.CanvasTexture(canvas);
            
            subChild.material = new THREE.MeshStandardMaterial({
              map: testTexture,
              side: THREE.DoubleSide,
              metalness: 0.1,
              roughness: 0.9
            });
          }
        });
      }
    });
    
    return cloned;
  }, [scene]);
  
  // Update Label2 with random user image or candle data
  useEffect(() => {
    // Get the label2 mesh from the cloned scene
    const label2 = clonedScene?.userData?.label2Mesh;
    
    // Use random user image if available, otherwise use candle data
    const imageData = randomUserImages.length > 0 
      ? randomUserImages[currentImageIndex]
      : candleData;
    
    console.log('Updating Label2 with image data:', imageData);
    
    if (!label2) return;
    
    // Create a canvas to draw image or username
    const canvas = document.createElement('canvas');
    canvas.width = 512; // Higher resolution
    canvas.height = 512;
    const context = canvas.getContext('2d');
    
    // Flip vertically to fix upside-down
    context.save();
    context.translate(0, canvas.height);
    context.scale(1, -1); // Flip on Y-axis
    
    if (imageData && imageData.image) {
      // Load and display the user's image
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        // Draw image to fill the canvas
        context.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Add username overlay if available
        if (imageData.username) {
          // Add semi-transparent background for text
          context.fillStyle = 'rgba(0, 0, 0, 0.7)';
          context.fillRect(0, canvas.height - 80, canvas.width, 80);
          
          // Draw username (matching CandleInteraction.jsx font)
          context.fillStyle = '#ffffff';
          context.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
          context.textAlign = 'center';
          context.textBaseline = 'middle';
          
          const textY = canvas.height - 40;
          
          // Add text shadow for better readability (matching CandleInteraction.jsx)
          context.shadowColor = 'rgba(0, 0, 0, 0.8)';
          context.shadowBlur = 4;
          context.shadowOffsetX = 2;
          context.shadowOffsetY = 2;
          
          context.fillText(imageData.username, canvas.width / 2, textY);
          
          // Reset shadow
          context.shadowColor = 'transparent';
        }
        
        // Create texture and apply to mesh
        const texture = new THREE.CanvasTexture(canvas);
        texture.flipY = false;
        
        label2.material = new THREE.MeshStandardMaterial({
          map: texture,
          side: THREE.DoubleSide,
          emissive: new THREE.Color(0xffffff),
          emissiveIntensity: 0.1,
          emissiveMap: texture,
          metalness: 0.2,
          roughness: 0.8
        });
        label2.material.needsUpdate = true;
      };
      
      img.onerror = () => {
        console.error('Failed to load image:', imageData.image);
        // Fallback to text display
        displayDefaultLabel();
      };
      
      img.src = imageData.image;
      
    } else {
      // No candle data, show default
      displayDefaultLabel();
    }
    
    function displayDefaultLabel() {
      // Dark background with gold border
      context.fillStyle = '#1a1a1a';
      context.fillRect(0, 0, canvas.width, canvas.height);
      
      // Add gold border with more margin
      context.strokeStyle = '#d4af37';
      context.lineWidth = 4;
      context.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);
      
      // Set text styling (matching CandleInteraction.jsx style)
      context.fillStyle = '#d4af37';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.font = 'bold 50px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
      
      // Add text shadow for better readability
      context.shadowColor = 'rgba(0, 0, 0, 0.8)';
      context.shadowBlur = 4;
      context.shadowOffsetX = 2;
      context.shadowOffsetY = 2;
      
      context.fillText(imageData?.username || 'Featured', canvas.width / 2, canvas.height / 2 - 30);
      context.fillText('Candle', canvas.width / 2, canvas.height / 2 + 30);
      
      // Reset shadow
      context.shadowColor = 'transparent';
      
      // Create texture and apply to mesh
      const texture = new THREE.CanvasTexture(canvas);
      texture.flipY = false;
      
      label2.material = new THREE.MeshStandardMaterial({
        map: texture,
        side: THREE.DoubleSide,
        metalness: 0.1,
        roughness: 0.9
      });
      label2.material.needsUpdate = true;
    }
    
    // Restore context
    context.restore();
    
    // Create and apply texture
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.needsUpdate = true;
    
    // Apply texture to existing material
    if (!label2.material) {
      label2.material = new THREE.MeshStandardMaterial({
        side: THREE.DoubleSide
      });
    }
    
    label2.material.map = texture;
    label2.material.side = THREE.DoubleSide; // Show on both sides
    label2.material.needsUpdate = true;
    label2.material.color = new THREE.Color(0xffffff);
    label2.material.emissive = new THREE.Color(0x000000);
    label2.material.metalness = 0.1;
    label2.material.roughness = 0.9;
    
    console.log('Texture applied to Label2:', texture, label2);
  }, [candleData, clonedScene, randomUserImages, currentImageIndex]);
  
  // Update Label1 with message
  useEffect(() => {
    // Get the label1 mesh from the cloned scene
    const label1 = clonedScene?.userData?.label1Mesh;
    
    console.log('Updating Label1 with candle message:', candleData);
    
    if (!label1) return;
    
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const context = canvas.getContext('2d');
    
    // White background
    context.fillStyle = '#FFFFFF';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add border
    context.strokeStyle = '#e0e0e0';
    context.lineWidth = 2;
    context.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
    
    // Add heading
    context.fillStyle = '#000000';
    context.font = 'bold 42px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText('Prayer to Our Lady', canvas.width / 2, 80);
    context.fillText('of Perpetual Profit', canvas.width / 2, 130);
    
    // Add divider
    context.strokeStyle = '#333333';
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(100, 165);
    context.lineTo(canvas.width - 100, 165);
    context.stroke();
    
    // Display message - check if candleData exists
    const message = candleData?.message || 'May your gains be eternal and your losses forgotten.';
    
    // Determine font size based on message length (matching CandleInteraction.jsx)
    const fontSize = message.length > 200 ? 40 : message.length > 100 ? 48 : 56;
    context.font = `bold ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif`;
    context.fillStyle = '#000000';
    
    // Word wrap with reduced maxWidth for better readability (matching CandleInteraction.jsx)
    const words = message.split(' ');
    let line = '';
    const maxWidth = 600; // Reduced from canvas.width - 200 to match CandleInteraction.jsx
    const lineHeight = 70; // Increased from 50 to match CandleInteraction.jsx
    let lines = [];
    
    // Build lines array first (matching CandleInteraction.jsx approach)
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = context.measureText(testLine);
      
      if (metrics.width > maxWidth && n > 0) {
        lines.push(line);
        line = words[n] + ' ';
      } else {
        line = testLine;
      }
    }
    if (line) {
      lines.push(line);
    }
    
    // Draw text with shadow for better visibility (matching CandleInteraction.jsx)
    const startY = 200 + ((canvas.height - 200) - lines.length * lineHeight) / 2;
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
    
    // Create and apply texture
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.repeat.set(-1, -1);  // Flip both X and Y for Label1
    texture.offset.set(1, 1);  // Adjust offset after flipping
    texture.flipY = false;
    
    // Apply directly to label1
    label1.material = new THREE.MeshStandardMaterial({
      map: texture,
      side: THREE.DoubleSide,
      emissive: new THREE.Color(0xffffff),
      emissiveIntensity: 0.05,
      emissiveMap: texture,
      metalness: 0,
      roughness: 0.9
    });
    label1.material.needsUpdate = true;
  }, [candleData, clonedScene]);
  
  // Play animations if they exist
  useEffect(() => {
    if (actions && Object.keys(actions).length > 0) {
      const firstAction = Object.values(actions)[0];
      firstAction?.play();
    }
  }, [actions]);
  
  
  // Simple auto-rotation to show all sides of the candle
  useFrame((state, delta) => {
    if (!modelRef.current) return;
    
    // Continuous slow rotation
    modelRef.current.rotation.y += delta * 0.3;
  });
  
  // Don't render if scene isn't loaded yet
  if (!clonedScene) {
    return null;
  }
  
  return (
    <primitive 
      ref={modelRef}
      object={clonedScene} 
      scale={[2.3, 2.3, 2.3]}  // Slightly smaller scale
      position={[0, -2, 0]}     // Lower position to center in view
    />
  );
}

// AngelEmoji Model component
function AngelEmojiModel() {
  const { scene, animations } = useGLTF('/models/angelEmoji.glb');
  const { actions } = useAnimations(animations, scene);
  const modelRef = useRef();

  useEffect(() => {
    // Log all available animations
    console.log('Angel Emoji Animations:', animations);
    if (animations && animations.length > 0) {
      console.log('Available animation names:');
      animations.forEach((clip, index) => {
        console.log(`Animation ${index}: "${clip.name}"`);
      });
      
      // Try to play the first animation if it exists
      const firstAnimationName = animations[0]?.name;
      if (firstAnimationName && actions[firstAnimationName]) {
        console.log(`Playing animation: "${firstAnimationName}"`);
        actions[firstAnimationName].play();
      }
    } else {
      console.log('No animations found in angelEmoji.glb');
    }
  }, [animations, actions]);

  // Auto-rotation
  useFrame((state, delta) => {
    if (!modelRef.current) return;
    modelRef.current.rotation.y += delta * 0.3;
  });

  return (
    <primitive 
      ref={modelRef}
      object={scene} 
      scale={[1, 1, 1]}
      position={[3, 0, 0]}  // Position to the right of the candle
    />
  );
}

// Preload the models
useGLTF.preload('/models/singleCandleAnimatedFlame.glb');
useGLTF.preload('/models/angelEmoji.glb');

export default function HomePage() {
  const [fontLoaded, setFontLoaded] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(
    typeof window !== 'undefined' ? window.innerWidth <= 768 : false
  );
    // const [isMobileView, setIsMobileView] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    // const [isMobileDevice, setIsMobileDevice] = useState(typeof window !== 'undefined' ? window.innerWidth <= 768 : false);
  
  const [isClient, setIsClient] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [pageLoading, setPageLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [fontsReady, setFontsReady] = useState(false);
  const coinRef = useRef(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [iframeLoaded, setIframeLoaded] = useState(false);
  
  // State for featured candle
  const [featuredCandle, setFeaturedCandle] = useState(null);
  const [isLoadingCandle, setIsLoadingCandle] = useState(false);
  const [emoji, setEmoji] = useState("😇");
  const [showRotateTooltip, setShowRotateTooltip] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [isSceneLoading, setIsSceneLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
  
  
  // Hide tooltip on first canvas interaction
  const handleCanvasInteraction = useCallback(() => {
    if (showRotateTooltip) {
      setShowRotateTooltip(false);
    }
  }, [showRotateTooltip]);
  
  // Helper function to truncate long usernames
  const truncateUsername = (username, maxLength = 20) => {
    if (!username) return '';
    if (username.length <= maxLength) return username;
    return username.substring(0, maxLength) + '...';
  };
  
  // Function to fetch a random candle from Firestore
  const fetchRandomCandle = async () => {
    setIsLoadingCandle(true);
    try {
      // Get all candles (limited to 100 for performance)
      const q = query(collection(db, 'results'), limit(100));
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const candles = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          // Only include candles with images
          if (data.image) {
            candles.push({ id: doc.id, ...data });
          }
        });
        
        if (candles.length > 0) {
          // Select a random candle
          const randomIndex = Math.floor(Math.random() * candles.length);
          setFeaturedCandle(candles[randomIndex]);
        }
      }
    } catch (error) {
      console.error('Error fetching random candle:', error);
    } finally {
      setIsLoadingCandle(false);
    }
  };
    useEffect(() => {
      if (!mounted) return;
      
      const { ourLadyModel, angelModel, devilModel, handsModel } = assetsLoaded;
      const allModelsLoaded = ourLadyModel && angelModel && devilModel && handsModel;
      
      console.log('Asset loading status:', { ourLadyModel, angelModel, devilModel, handsModel, mounted, allModelsLoaded });
      
      if (allModelsLoaded) {
        console.log('All assets loaded, hiding loader NOW');
        setIsSceneLoading(false);
      }
    }, [ mounted]);
  
  // Fetch initial random candle on mount
  useEffect(() => {
    fetchRandomCandle();
  }, []);
  
  // Alternate emoji for sign-in button
  useEffect(() => {
    const emojiInterval = setInterval(() => {
      setEmoji((prevEmoji) => (prevEmoji === "😇" ? "😈" : "😇"));
    }, 3000);

    return () => clearInterval(emojiInterval);
  }, []);

  // GSAP Title Animation
  useEffect(() => {
    if (isClient && !isMobileView) {
      // Wait for DOM to be ready
      setTimeout(() => {
        const titleEl = document.getElementById('main-title');
        if (titleEl) {
          const lines = titleEl.querySelectorAll('.title-line');
          
          // Set initial state
          gsap.set(lines, {
            opacity: 0,
            y: 50,
            scale: 0.8,
          });
          
          // Create timeline for entrance animation
          const tl = gsap.timeline();
          
          // Animate each line in
          tl.to(lines, {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 1.2,
            stagger: 0.2,
            ease: "power3.out",
          })
          .to(lines, {
            textShadow: "3px 3px 5px #000, -1px -1px 5px pink, 0 0 40px rgba(212, 175, 55, 0.6)",
            duration: 0.8,
            ease: "power2.inOut"
          }, "-=0.5");
          
          // Add continuous glow animation
          gsap.to(lines, {
            textShadow: "3px 3px 5px #000, -1px -1px 5px pink, 0 0 20px rgba(212, 175, 55, 0.3)",
            duration: 2,
            ease: "power2.inOut",
            repeat: -1,
            yoyo: true,
            delay: 2
          });
          
          // Add hover effect
          titleEl.addEventListener('mouseenter', () => {
            gsap.to(lines, {
              scale: 1.05,
              duration: 0.3,
              ease: "power2.out",
              stagger: 0.05
            });
          });
          
          titleEl.addEventListener('mouseleave', () => {
            gsap.to(lines, {
              scale: 1,
              duration: 0.3,
              ease: "power2.out",
              stagger: 0.05
            });
          });
        }
      }, 100);
    }
  }, [isClient, isMobileView]);
  
  // Get user from Clerk
  const { user, isSignedIn } = useUser();
  
  // Get music context functions
  const { 
    play, 
    pause, 
    isPlaying: contextIsPlaying, 
    nextTrack, 
    currentTrack, 
    is80sMode 
  } = useMusic();
  
  // Show music controls if music is already playing
  const [showMusicControls, setShowMusicControls] = useState(contextIsPlaying);
  
  // Sync showMusicControls with playing state when it changes
  useEffect(() => {
    if (contextIsPlaying && !showMusicControls) {
      setShowMusicControls(true);
    }
  }, [contextIsPlaying]);

  // GSAP text scrambling effect for both action and message words
  useEffect(() => {
    if (!isClient) return;

    let messageTimer;
    let actionTimer;

    // Small delay to ensure DOM elements are rendered
    const timeoutId = setTimeout(() => {
      // Get both desktop and mobile elements
      const scrambleElements = document.querySelectorAll('.scramble-text, .scramble-text-mobile');
      const actionElements = document.querySelectorAll('.action-text, .action-text-mobile');
      
      if (scrambleElements.length === 0 || actionElements.length === 0) {
        return;
      }

      // Use the first element's data attributes (they all have the same words)
      const messageWords = JSON.parse(scrambleElements[0].getAttribute('data-words'));
      const actionWords = JSON.parse(actionElements[0].getAttribute('data-words'));
      let messageIndex = 0;
      let actionIndex = 0;

      // Function to scramble text with optional color
      const scrambleText = (element, targetWord, isGold = false) => {
        const chars = "!@#$%^&*()_+{}[]|:;<>?/~";
        let iterations = 0;
        const maxIterations = 20;
        
        const interval = setInterval(() => {
          element.textContent = targetWord
            .split("")
            .map((letter, index) => {
              if (index < iterations / 2) {
                return targetWord[index];
              }
              return chars[Math.floor(Math.random() * chars.length)];
            })
            .join("");
          
          iterations++;
          
          if (iterations >= maxIterations) {
            clearInterval(interval);
            element.textContent = targetWord;
            
            // Apply color based on word for action elements
            if (element.classList.contains('action-text') || element.classList.contains('action-text-mobile')) {
              if (targetWord === "Declare" || targetWord === "Offer") {
                element.style.color = '#d4af37';
                element.style.fontFamily = '"UnifrakturCook", serif';
                element.style.textShadow = '0 0 10px #d4af37, 0 0 20px #d4af37';
              } else {
                element.style.color = '#00ff00';
                element.style.textShadow = '0 0 10px #00ff00, 0 0 20px #00ff00';
                element.style.fontFamily = 'Cyber, sans-serif';
              }
            }
          }
        }, 30);
      };

      // Function to scramble message words for all elements
      const scrambleMessage = () => {
        messageIndex = (messageIndex + 1) % messageWords.length;
        scrambleElements.forEach(element => {
          scrambleText(element, messageWords[messageIndex]);
        });
      };

      // Function to scramble action words for all elements
      const scrambleAction = () => {
        actionIndex = (actionIndex + 1) % actionWords.length;
        actionElements.forEach(element => {
          scrambleText(element, actionWords[actionIndex]);
        });
      };

      // Initial animation on first render
      scrambleElements.forEach(element => {
        scrambleText(element, messageWords[0]);
      });
      actionElements.forEach(element => {
        scrambleText(element, actionWords[0]);
      });

      // Start the animation cycles
      messageTimer = setInterval(scrambleMessage, 3000);
      actionTimer = setInterval(scrambleAction, 4000); // Different interval for variety
    }, 500); // 500ms delay to ensure DOM is ready for desktop

    return () => {
      clearTimeout(timeoutId);
      if (messageTimer) clearInterval(messageTimer);
      if (actionTimer) clearInterval(actionTimer);
    };
  }, [isClient, isMobileView, pageLoading]);
  
  // Comprehensive page loading effect
  useEffect(() => {
    const loadResources = async () => {
      try {
        setLoadingProgress(10);
        
        // Preload critical fonts
        const fontPromises = [
          document.fonts.load('bold 7rem "UnifrakturCook"'),
          document.fonts.load('bold 7rem "UnifrakturMaguntia"'),
          document.fonts.load('bold 2rem "Bowlby One SC"'),
          document.fonts.load('bold 2rem "Cyber"')
        ];
        
        setLoadingProgress(30);
        
        // Wait for fonts with timeout
        await Promise.race([
          Promise.all(fontPromises),
          new Promise(resolve => setTimeout(resolve, 3000)) // 3 second timeout
        ]);
        
        setFontLoaded(true);
        setFontsReady(true); // Fonts are loaded at this point
        document.documentElement.classList.add('fonts-loaded'); // Add class to html element
        setLoadingProgress(60);
        
        // Check if client-side and set viewport
        if (typeof window !== 'undefined') {
          setIsClient(true);
          
          const width = window.innerWidth;
          const height = window.innerHeight;
          setIsMobileView(width <= 768);
          setIsMobileDevice(width <= 768);
          setIsLandscape(width > height);
          setViewportHeight(height);
        }
        
        setLoadingProgress(80);
        
        // Small delay to ensure smooth transition
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setLoadingProgress(100);
        
        // Hide loader after progress reaches 100%
        setTimeout(() => {
          setPageLoading(false);
        }, 300);
        
      } catch (error) {
        console.log('Resource loading error:', error);
        // Even on error, eventually show the page
        setFontLoaded(true);
        setFontsReady(true); // Show text even if fonts fail to load
        document.documentElement.classList.add('fonts-loaded'); // Ensure text shows even on error
        setIsClient(true);
        setTimeout(() => {
          setPageLoading(false);
        }, 1000);
      }
    };
    
    loadResources();
  }, []);
  
  // Handle viewport changes after initial load
  useEffect(() => {
    if (!isClient) return;
    
    const checkViewport = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      setIsMobileView(width <= 768);
      setIsMobileDevice(width <= 768);
      setIsLandscape(width > height);
      setViewportHeight(height);
    };
    
    window.addEventListener('resize', checkViewport);
    window.addEventListener('orientationchange', checkViewport);
    return () => {
      window.removeEventListener('resize', checkViewport);
      window.removeEventListener('orientationchange', checkViewport);
    };
  }, [isClient]);

  // Sparkle effect for coin
  // useEffect(() => {
  //   // Wait for client and page to be ready
  //   if (!isClient || pageLoading || !coinRef.current) {
  //     return;
  //   }

  //   const sparkle = coinRef.current;

  //   const MAX_STARS = 60;
  //   const STAR_INTERVAL = 16;

  //   const MAX_STAR_LIFE = 3;
  //   const MIN_STAR_LIFE = 1;

  //   const MAX_STAR_SIZE = 40;
  //   const MIN_STAR_SIZE = 20;

  //   const MIN_STAR_TRAVEL_X = 100;
  //   const MIN_STAR_TRAVEL_Y = 100;

  //   const randomLimitedColor = () => {
  //     const randomHue = (() => {
  //       const ranges = [
  //         { min: 120, max: 150 }, // Blues
  //         { min: 270, max: 290 }, // Violets/Purples
  //         { min: 45, max: 60 }, // Yellows and Golds
  //       ];
  //       const range = ranges[Math.floor(Math.random() * ranges.length)];
  //       return (
  //         Math.floor(Math.random() * (range.max - range.min + 1)) + range.min
  //       );
  //     })();

  //     return `hsla(${randomHue}, 100%, 50%, 1)`;
  //   };

  //   const Star = class {
  //     constructor() {
  //       this.size = this.random(MAX_STAR_SIZE, MIN_STAR_SIZE);

  //       this.x = this.random(
  //         sparkle.offsetWidth * 0.75,
  //         sparkle.offsetWidth * 0.25
  //       );
  //       this.y = sparkle.offsetHeight / 2 - this.size / 2;

  //       this.x_dir = this.randomMinus();
  //       this.y_dir = this.randomMinus();

  //       this.x_max_travel =
  //         this.x_dir === -1 ? this.x : sparkle.offsetWidth - this.x - this.size;
  //       this.y_max_travel = sparkle.offsetHeight / 2 - this.size;

  //       this.x_travel_dist = this.random(this.x_max_travel, MIN_STAR_TRAVEL_X);
  //       this.y_travel_dist = this.random(this.y_max_travel, MIN_STAR_TRAVEL_Y);

  //       this.x_end = this.x + this.x_travel_dist * this.x_dir;
  //       this.y_end = this.y + this.y_travel_dist * this.y_dir;

  //       this.life = this.random(MAX_STAR_LIFE, MIN_STAR_LIFE);

  //       this.star = document.createElement("div");
  //       this.star.classList.add("star");

  //       this.star.style.setProperty("--start-left", this.x + "px");
  //       this.star.style.setProperty("--start-top", this.y + "px");

  //       this.star.style.setProperty("--end-left", this.x_end + "px");
  //       this.star.style.setProperty("--end-top", this.y_end + "px");

  //       this.star.style.setProperty("--star-life", this.life + "s");
  //       this.star.style.setProperty("--star-life-num", this.life);

  //       this.star.style.setProperty("--star-size", this.size + "px");
  //       this.star.style.setProperty("--star-color", randomLimitedColor());
  //     }

  //     draw() {
  //       sparkle.appendChild(this.star);
  //     }

  //     pop() {
  //       sparkle.removeChild(this.star);
  //     }

  //     random(max, min) {
  //       return Math.floor(Math.random() * (max - min + 1)) + min;
  //     }

  //     randomMinus() {
  //       return Math.random() > 0.5 ? 1 : -1;
  //     }
  //   };

  //   let current_star_count = 0;
  //   const intervalId = setInterval(() => {
  //     if (current_star_count >= MAX_STARS) {
  //       return;
  //     }

  //     current_star_count++;

  //     const newStar = new Star();
  //     newStar.draw();

  //     setTimeout(() => {
  //       current_star_count--;
  //       newStar.pop();
  //     }, newStar.life * 1000);
  //   }, STAR_INTERVAL);

  //   return () => {
  //     clearInterval(intervalId);
  //   };
  // }, [isClient, isMobileView, pageLoading]);

  const carouselSlides = [
    {
      id: 4,
      backgroundImage: '/images/bullrider.jpg',
      image: '/images/bullrider.jpg',
      number: '04',
      title: 'UP AND TO THE RIGHT!',
      // description: 'She will guide you up and to the right.'
    },
    {
      id: 2,
      backgroundImage: '/images/deejay.jpg',
      image: '/images/deejay.jpg',
      number: '02',
      title: 'DEFI BEATS',
      // description: 'Curated playlists for algorithmic transcendence.'
    },
    {
      id: 3,
      backgroundImage: '/images/rl80vsMonster.png',
      image: '/images/rl80vsMonster.png',
      number: '03',
      title: 'WARD OFF EVIL',
      // description: 'Avoid scams, fiends, and insider schemes.'
    },
    {
      id: 1,
      backgroundImage: '/images/face.png',
      image: '/images/face.png',
      number: '01',
      title: 'AVOID FALSE PROFITS',
      // description: 'A mother usually knows best.'
    },
   
    {
      id: 5,
      backgroundImage: '/images/lowrider.jpg',
      image: '/images/lowrider.jpg',
      number: '05',
      title: 'GUARDIAN OF GOOD TIMES',
      // description: 'She offers you her protection with very smart contracts.'
    },
    {
      id: 0,
      backgroundImage: '/images/mosaic.jpg',
      image: '/images/mosaic.jpg',
      number: '05',
      title: 'PATRON OF THE ARTS',
      description: '#RL80'
    },
    
    {
      id: 7,
      backgroundImage: '/images/teknoir.jpg',
      image: '/images/teknoir.jpg',
      number: '05',
      title: 'F8TH IN THE FUTURE',
      // description: 'Even cyborgs need something to believe in.'
    },
    // {
    //   id: 8,
    //   backgroundImage: '/images/toast.jpg',
    //   image: '/images/toast.jpg',
    //   number: '05',
    //   title: 'PATTERN RECOGNITION',
    //   description: 'Separate signal from noise in market analysis.'
    // }
  ];

  // Show loader while page is loading
  if (pageLoading) {
    return <InfinityLoader progress={loadingProgress} />;
  }

  return (
    <div style={{ 
      position: 'relative', 
      width: '100%', 
      minHeight: '100vh',
      overflow: 'hidden'
    }}>
      <link rel="stylesheet" href="/coin.css" />
      <style jsx global>{`
        @font-face {
          font-family: 'UnifrakturCook';
          src: url('/fonts/UnifrakturCook-Bold.ttf') format('truetype');
          font-weight: bold;
          font-style: normal;
          font-display: swap;
        }
        
        @font-face {
          font-family: 'UnifrakturMaguntia';
          src: url('/fonts/UnifrakturMaguntia-Regular.ttf') format('truetype');
          font-weight: normal;
          font-style: normal;
          font-display: swap;
        }
        
        @font-face {
          font-family: 'Bowlby One SC';
          src: url('/fonts/BowlbyOneSC-Regular.ttf') format('truetype');
          font-weight: normal;
          font-style: normal;
          font-display: swap;
        }
        
        @font-face {
          font-family: Cyber;
          src: url("https://assets.codepen.io/605876/Blender-Pro-Bold.otf");
          font-weight: bold;
          font-style: normal;
          font-display: swap;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes pulse {
          0% {
            transform: translateX(-50%) scale(1);
            box-shadow: 0 0 20px rgba(212, 175, 55, 0.6);
          }
          50% {
            transform: translateX(-50%) scale(1.05);
            box-shadow: 0 0 30px rgba(212, 175, 55, 0.8);
          }
          100% {
            transform: translateX(-50%) scale(1);
            box-shadow: 0 0 20px rgba(212, 175, 55, 0.6);
          }
        }
        
        .featured-banner {
          position: absolute;
          left: 50%;
          display: block;
          margin: 0 -110px;
          width: 220px;
          height: 40px;
          border: 1px solid #8a6701;
          font: bold 18px/40px 'Cyber', monospace;
          text-align: center;
          color: #2a1f0a;
          background: linear-gradient(135deg, #c48901 0%, #d4af37 100%);
          border-radius: 4px;
          box-shadow: 0 0 30px rgba(0, 0, 0, 0.15) inset,
                      0 6px 10px rgba(0, 0, 0, 0.3);
          text-shadow: 1px 1px 2px rgba(255, 255, 255, 0.3);
          letter-spacing: 0.1em;
        }

        .featured-banner::before,
        .featured-banner::after {
          content: '';
          position: absolute;
          z-index: -1;
          left: -40px;
          top: 16px;
          display: block;
          width: 24px;
          height: 0px;
          border: 20px solid #c48901;
          border-right: 12px solid #a57201;
          border-bottom-color: #b57f01;
          border-left-color: transparent;
          transform: rotate(-5deg);
        }

        .featured-banner::after {
          left: auto;
          right: -40px;
          border-left: 12px solid #a57201;
          border-right: 20px solid transparent;
          transform: rotate(5deg);
        }
        
        .spinning-record {
          animation: spin 3s linear infinite;
        }
        
        /* Fallback coin styles if CSS file doesn't load */
        .coin .front {
          background-color: #d4af37 !important;
        }
        .coin .back {
          background-color: #b8941f !important;
        }
        
        /* Desktop rotating text - larger size */
        .desktop-rotating-text .rotating-text-body {
          font-size: 4rem !important;
        }
        
        .desktop-rotating-text .t3xts {
          height: 70px !important;
        }
        
        /* Override purse centering */
        .purse {
          position: relative !important;
          top: auto !important;
          left: auto !important;
          margin: 0 auto !important;
          margin-top: 0 !important;
          margin-left: 0 !important;
        }
        
        /* Sparkle styles */
        .star {
          position: absolute;
          width: var(--star-size);
          height: var(--star-size);
          background: var(--star-color);
          clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
          animation: starAnimation var(--star-life) ease-out forwards;
          pointer-events: none;
          z-index: 1;
        }
        
        @keyframes starAnimation {
          from {
            left: var(--start-left);
            top: var(--start-top);
            opacity: 1;
            transform: scale(0) rotate(0deg);
          }
          50% {
            opacity: 1;
            transform: scale(1) rotate(180deg);
          }
          to {
            left: var(--end-left);
            top: var(--end-top);
            opacity: 0;
            transform: scale(0) rotate(360deg);
          }
        }
        
        /* Tooltip animations */
        .rotate-tooltip {
          animation: tooltipFadeIn 4s ease-in-out infinite;
        }
        
        @keyframes tooltipFadeIn {
          0%, 100% {
            opacity: 0.9;
          }
          50% {
            opacity: 1;
          }
        }
        
        .rotate-hand {
          animation: rotateHand 2s ease-in-out infinite;
        }
        
        @keyframes rotateHand {
          0%, 100% {
            transform: rotate(0deg) translateX(0px);
          }
          25% {
            transform: rotate(-15deg) translateX(-10px);
          }
          75% {
            transform: rotate(15deg) translateX(10px);
          }
        }
      `}</style>
      <div className="home-page" style={{
        marginLeft: isClient && isMobileView ? '2rem' : '2rem', 
        marginRight: isClient && isMobileView ? '1rem' : 'auto', 
        marginTop: isClient && isMobileView ? '8rem' : '6rem',
        position: 'relative',
        maxWidth: isClient && !isMobileView ? '1400px' : '100%',
        paddingLeft: isClient && !isMobileView ? '3rem' : '1rem',
        paddingRight: isClient && !isMobileView ? '3rem' : '1rem'
      }}>
      {!isClient ? (
        // Server-side and initial client render placeholder
        <div style={{ 
          height: '50vh', 
          background: 'linear-gradient(135deg, #1a1a2e 0%, #0f0f1e 100%)', 
          borderRadius: '12px' 
        }} />
      ) : isMobileView ? (
        <Simple3DCarousel 
          images={carouselSlides.map(slide => slide.image)}
          captions={carouselSlides.map(slide => ({
            title: slide.title,
            description: slide.description
          }))}
        />
      ) : (
        <SlantedCarousel 
          slides={carouselSlides}
          autoPlay={true}
          autoPlayInterval={5000}
          showNavigation={true}
          showArrows={true}
          showProgressBar={true}
          customCursor={false}
        />
      )}
      
      {/* Mobile Text Box - only shown on mobile */}
   

    

      
      
      {/* Mobile Text Marquee - shown after candle section */}
      {isClient && isMobileView && (
        <TextMarquee />
      )}
      

      
      {/* Mobile Coin Component - repositioned to flow after candle */}
      {isClient && isMobileView && (
        <div style={{
          marginTop: "2rem",
          marginBottom: "2rem",
          padding: '1.5rem',
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(10px)',
          borderRadius: '12px',
          border: '1px solid rgba(212, 175, 55, 0.2)'
        }}>
          <div style={{ 
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <div
              ref={isMobileView ? coinRef : null}
              style={{ 
                position: "relative", 
                width: "100%",
                maxWidth: "25rem", 
                height: "25rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "visible"
              }}
            >
              <Link href="#" className="coin-link" style={{ 
                position: "relative", 
                zIndex: 10,
                display: "block",
                width: "9rem",
                height: "9rem"
              }}>
                <Coin />
              </Link>
            </div>
            
            {/* Click to Buy Button - Directly under coin */}
            {/* <button
              style={{
                backgroundColor: '#d4af37',
                color: '#000',
                position: 'absolute',
                left: 'auto',
      
                bottom: '1rem',
                padding: '0.6rem 0.5rem',
                borderRadius: '25px',
                fontSize: '1rem',
                fontWeight: 'bold',
                fontFamily: 'Cyber, monospace',
                boxShadow: '0 0 20px rgba(212, 175, 55, 0.6)',
                border: 'none',
                cursor: 'pointer',
                animation: 'pulse 2s infinite',
                marginTop: '-3rem',
                zIndex: 15,
                display: 'block',
                marginLeft: 'auto',
                marginRight: 'auto'
              }}
              onClick={() => window.open('', '_blank')}
            >
              ↑ Click to Buy! ↑
            </button> */}
          </div>
          
          {/* Caption and explanatory text for Coin */}
          <div style={{
            marginTop: '1.5rem',
            textAlign: 'center',
            color: '#ffffff'
          }}>
       <h3 style={{
              color: '#d4af37',
              fontSize: '1.8rem',
              marginBottom: '0.5rem',
              fontFamily: 'UnifrakturCook, serif',
              textShadow: '0 0 10px rgba(212, 175, 55, 0.5)'
            }}>
              Sacred Token of Prosper80
            </h3>
            {/* <p style={{
              fontSize: '1rem',
              lineHeight: 1.6,
              marginBottom: '0.5rem',
              opacity: 0.9,
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
              fontWeight: 400,
              letterSpacing: '0.02em',
              padding: '0 1rem'
            }}>
              The golden coin of infinite abundance spins eternally, channeling cosmic 
              energy and divine fortune to all who witness its radiant glow.
            </p> */}
          </div>
        </div>
      )}
      
      {/* Desktop Layout Container */}
      {isClient && !isMobileView && (
        <div style={{
          position: "relative",
          marginTop: "28vh",
          width: "100%",
          minHeight: "60vh"
        }}>
          {/* Header and Coin Row */}
          <div style={{
            position: "relative",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            width: "100%",
            marginTop: "-15rem",
            // marginBottom: "4rem"
          }}>
            {/* Animated Title */}
            <h1 
              id="main-title"
              style={{ 
              position: "relative",
              left: "10%",
              color: "#8e662b",
              fontFamily: 'UnifrakturCook, UnifrakturMaguntia, serif',
              textShadow: "3px 3px 5px #000, -1px -1px 5px pink",
              fontSize: "7rem",
              fontWeight: 900,
              lineHeight: 0.8,
              transform: "rotate(-8deg) skew(-15deg)",
              zIndex: 1000,
              marginTop: '-3rem',
              whiteSpace: 'nowrap',
              cursor: 'pointer',
            }}>
              <span className="title-line" style={{ display: 'block', position: 'relative' }}>Our Lady</span>
              <span className="title-line" style={{ display: 'block', position: 'relative' }}>
                <span style={{ fontSize: "3rem" }}>of </span>
                Perpetual
              </span>
              <span className="title-line" style={{ display: 'block', marginLeft: "6rem", position: 'relative' }}>Profit</span>
            </h1>
            
            {/* Coin */}
            <div style={{ 
              position: "relative",
              right: "15%",
              marginTop: "2rem"
            }}>
              <div
                ref={!isMobileView ? coinRef : null}
                style={{ 
                  position: "relative", 
                  width: "25rem", 
                  height: "25rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "visible"
                }}
              >
                <Link href="#" className="coin-link" style={{ 
                  position: "relative", 
                  zIndex: 10,
                  display: "block",
                  width: "9rem",
                  height: "9rem"
                }}>
                  <Coin />
                </Link>
                
              </div>
            </div>
          </div>
          
          {/* Text Box */}
          <div style={{
            position: "relative",
            margin: "0 auto 4rem auto",
   
            maxWidth: "1400px",
            // padding: '3rem 2rem',
            // background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.05) 0%, rgba(0, 0, 0, 0.8) 50%, rgba(212, 175, 55, 0.05) 100%)',
            backdropFilter: 'blur(12px)',
            // borderRadius: '20px',
            // border: '2px solid rgba(212, 175, 55, 0.4)',                                                                                                    ``````````````````````````
            color: '#ffffff',
            fontSize: isLandscape && viewportHeight < 800 ? '1.2rem' : '2rem',
            lineHeight: 1.2,
            textAlign: 'center'
          }}>
            <div style={{
          marginTop: '1rem',
          marginLeft: '0',
          marginRight: '0',
          // padding: '1.5rem',
          background: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(10px)',
          // borderRadius: '12px',
          // border: '1px solid rgba(212, 175, 55, 0.3)',
          // color: '#ffffff',
          // fontSize: '1rem',
          
          lineHeight: 1.6,
          textAlign: 'center'
        }}>
          {/* <h2 style={{
            color: '#d4af37',
            // marginBottom: '1rem',
            fontSize: '3.5rem',
            fontFamily: 'UnifrakturMaguntia, serif'
          }}>Welcome to Our Sacred Digital Temple</h2>
          <p style={{ 
            marginBottom: '1rem',  
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            fontWeight: 400,
            letterSpacing: '0.02em',
            marginBottom: '1rem',
          }}>
    Experience the convergence of ancient wisdom and cyberpunk sensibility into the maternal market-oriented icon, 
  <span style={{
                fontFamily: 'UnifrakturCook, UnifrakturMaguntia, serif',
                fontWeight: 'bold',
                fontSize: '1.1em',
                color: '#d4af37',
                textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)'
              }}> Our Lady of Perpetual Profit</span>. Hold RL80 tokens in your wallet as a good luck talisman and to ward off scams and evil-doers, or pay homage to the Patron Saint of Day Traders with a green candle. 


          </p> */}
        </div>

            {/* <TokenInfoGrid /> */}
            
           
          </div>
          {/* Two Column Section with Scroll */}

            {/* Decorative corner elements */}
          
            
            {/* Full-width heading */}
            {/* <h2 style={{
              fontSize: '3rem',
              marginBottom: '2.5rem',
              color: '#d4af37',
              fontFamily: 'UnifrakturMaguntia, serif',
              textAlign: 'center',
              textShadow: '0 0 20px rgba(212, 175, 55, 0.6), 0 0 40px rgba(212, 175, 55, 0.3)',
              letterSpacing: '2px',
              position: 'relative'
            }}>
              <span style={{ 
                display: 'inline-block',
                // animation: 'glow 3s ease-in-out infinite'
              }}>RL80 Token Summary</span>
            </h2> */}
            
            {/* Two column grid */}
           
 
          
          {/* Text Marquee Component */}
          <div style={{
            margin: '0 auto 4rem auto',
            maxWidth: '1400px',
            overflow: 'hidden'
          }}>
            <TextMarquee />
          </div>
          
          {/* Flipbook Section - CSS-only interactive book */}
 
         
          {/* MoonRoom Section */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              alignItems: "center",
              gap: "3rem",
              padding: '3rem 2rem',
              maxWidth: '1400px',
              margin: '0 auto 4rem auto',
              background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.05) 0%, rgba(0, 0, 0, 0.8) 50%, rgba(212, 175, 55, 0.05) 100%)',
              backdropFilter: 'blur(12px)',
              borderRadius: '20px',
              border: '2px solid rgba(212, 175, 55, 0.4)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), inset 0 0 40px rgba(212, 175, 55, 0.1)',
            }}
          >
            {/* Left Column - Bouncer */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative"
              }}
            >
              <Illumin80Bouncer />
            </div>
            
            {/* Right Column - Illumin80 Perks */}
            <div style={{
              padding: '0 1rem',
              color: '#ffffff',
              textAlign: 'center'
            }}>
              <h2 style={{
                fontSize: '2.5rem',
                marginBottom: '0rem',
                color: 'rgb(142, 102, 43)',
                fontFamily: 'UnifrakturCook, serif',
                textShadow: '0 0 15px rgba(212, 175, 55, 0.5)',
                alignContent: 'center',
          
              }}>Join the Illumin80</h2>
              
              <p style={{
                fontSize: '1.5rem',
                marginBottom: '1.5rem',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',

                lineHeight: 1.6,
                color: '#ffffff',
                opacity: 0.9
              }}>
                Devote a green candle to  <span style={{
         fontFamily: 'UnifrakturCook, serif',
         fontWeight: 'bold',
         fontSize: '1.1em',
         color: '#d4af37',
         textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)'
                }}>Our Lady of Perpetual Profit</span>    by burning <span style={{
                  fontFamily: 'UnifrakturCook, serif',
                  fontWeight: 'bold',
                  fontSize: '1.1em',
                  color: '#d4af37',
                  textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)'
                }}>RL80</span> tokens. The top 80 burners are automatically inducted as <span style={{
                  fontFamily: 'UnifrakturCook, serif',
                  fontWeight: 'bold',
                  fontSize: '1.1em',
                  color: '#d4af37',
                  textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)'
                }}>Illumin80</span> and unlock exclusive benefits:
              </p>
              
              <ul style={{
                fontSize: '1.1rem',
                lineHeight: 1.8,
                color: '#ffffff',
                listStyle: 'none',
                paddingLeft: '0',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',

              }}>
                     {/* <li style={{ marginBottom: '0.35rem' }}>
                  <span style={{ color: '#d4af37', marginRight: '0.5rem' }}>🔥</span>
                  Members split burn 
                </li> */}
                <li style={{ marginBottom: '0.35rem' }}>
                  <span style={{ color: '#d4af37', marginRight: '0.5rem' }}>✨</span>
                  Access to the sacred Moon Room member's club
                </li>
            
                {/* <li style={{ marginBottom: '0.35rem' }}>
                  <span style={{ color: '#d4af37', marginRight: '0.5rem' }}>📊</span>
                  Exclusive alpha
                </li> */}
                <li style={{ marginBottom: '0.35rem' }}>
                  <span style={{ color: '#d4af37', marginRight: '0.5rem' }}>🎯</span>
                  Early access to new features
                </li>
                <li style={{ marginBottom: '0.35rem' }}>
                  <span style={{ color: '#d4af37', marginRight: '0.5rem' }}>💎</span>
                  Special airdrops
                </li>
           
              </ul>
              
              {/* <p style={{
                marginTop: '1.5rem',
                fontSize: '1rem',
                fontStyle: 'italic',
                color: '#d4af37',
                opacity: 0.9
              }}>
                Devote a candle and burn RL80 tokens to ascend to this most elite level of devotion.
              </p> */}
            </div>
          </div>
          {/* Rotating Text Component */}
          <div style={{
            position: "relative",
            maxWidth: "1400px",
            margin: "0 auto 4rem auto",
            padding: '3rem 2rem'
          }}
          className="desktop-rotating-text">
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundImage: "url(/sacred.png)",
                backgroundPosition: "90% 20%",
                backgroundRepeat: "no-repeat",
                backgroundSize: "100%",
                opacity: 0.3,
                zIndex: 1,
              }}
            />
            <div style={{ position: "relative", zIndex: 2 }}>
              <RotatingText isDesktop={true} />
            </div>
          </div>
        </div>
      )}
      
      {/* Mobile Illumin80 Section */}
      {isClient && isMobileView && (
        <div style={{
          padding: '2rem 1rem',
          margin: '2rem auto',
          maxWidth: '100%',
          background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.05) 0%, rgba(0, 0, 0, 0.8) 50%, rgba(212, 175, 55, 0.05) 100%)',
          backdropFilter: 'blur(12px)',
          borderRadius: '20px',
          border: '2px solid rgba(212, 175, 55, 0.4)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), inset 0 0 40px rgba(212, 175, 55, 0.1)',
        }}>
          {/* Bouncer Component */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: '2rem',
            marginTop: '5rem'
          }}>
            <Illumin80Bouncer />
          </div>
          
          {/* Illumin80 Content */}
          <div style={{
            color: '#ffffff',
            textAlign: 'center'
          }}>
            <h2 style={{
              fontSize: '2rem',
              marginBottom: '1rem',
              color: '#d4af37',
              fontFamily: 'UnifrakturCook, serif',
              textShadow: '0 0 15px rgba(212, 175, 55, 0.5)',
            }}>Join the Illumin80 Soci80</h2>
            
            <p style={{
              fontSize: '1rem',
              marginBottom: '1.5rem',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
              lineHeight: 1.6,
              color: '#ffffff',
              opacity: 0.9,
              padding: '0 1rem'
            }}>
              Devote a green candle to <span style={{
                fontFamily: 'UnifrakturCook, serif',
                fontWeight: 'bold',
                fontSize: '1.1em',
                color: '#d4af37',
                textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)'
              }}>Our Lady of Perpetual Profit</span> by burning some RL80 tokens. The top 80 burners qualify for <span style={{
                fontFamily: 'UnifrakturCook, serif',
                fontWeight: 'bold',
                fontSize: '1.1em',
                color: '#d4af37',
                textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)'
              }}>Illumin80</span> status and unlock exclusive benefits:
            </p>
            
            <ul style={{
              fontSize: '0.95rem',
              lineHeight: 1.8,
              color: '#ffffff',
              listStyle: 'none',
              paddingLeft: '0',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
              textAlign: 'left',
              maxWidth: '300px',
              margin: '0 auto'
            }}>
              <li style={{ marginBottom: '0.75rem' }}>
                <span style={{ color: '#d4af37', marginRight: '0.5rem' }}>🔥</span>
                Members split 0.8% of RL80 transaction taxes
              </li>
              <li style={{ marginBottom: '0.75rem' }}>
                <span style={{ color: '#d4af37', marginRight: '0.5rem' }}>✨</span>
                Access to the sacred Moon Room member's club
              </li>
              <li style={{ marginBottom: '0.75rem' }}>
                <span style={{ color: '#d4af37', marginRight: '0.5rem' }}>📊</span>
                Exclusive alpha
              </li>
              <li style={{ marginBottom: '0.75rem' }}>
                <span style={{ color: '#d4af37', marginRight: '0.5rem' }}>🎯</span>
                Early access to new features
              </li>
              <li style={{ marginBottom: '0.75rem' }}>
                <span style={{ color: '#d4af37', marginRight: '0.5rem' }}>💎</span>
                Special airdrops
              </li>
            </ul>
          </div>
        </div>
      )}

      
      {/* Rotating Text Component - only shown on mobile below the coin */}
      {isClient && isMobileView && (
        <div style={{ 
          position: "relative",
          marginTop: "1rem",
          width: "100%"
        }}>
          <div
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: "100%",
              height: "100%",
              backgroundImage: "url(/sacred.png)",
              backgroundPosition: "90% 20%",
              backgroundRepeat: "no-repeat",
              backgroundSize: "100%",
              transform: "scaleX(-1)",
              opacity: 0.3,
              zIndex: 1,
            }}
          />
          <div style={{ marginBottom: "2.25rem", marginTop: "2rem" }}>
            <div style={{ display: "flex", justifyContent: "center", width: "100%" }}>
              <div
                style={{
                  position: "relative",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  marginTop: "1.3rem",
                  marginBottom: "3rem",
                  width: "80vw",
                  maxWidth: "400px",
                  zIndex: 2,
                  overflow: "hidden"
                }}
              >
                <RotatingText />
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Mobile Title */}
      {isClient && isMobileView && (
        <h1 style={{ 
          position: "absolute",
          top: "-7rem",
          left: "1rem",
          color: "#8e662b",
          fontFamily: 'UnifrakturCook, UnifrakturMaguntia, serif',
          textShadow: "3px 3px 5px #000, -1px -1px 5px pink",
          fontSize: "3.5rem",
          fontWeight: 900,
          lineHeight: 0.8,
          transform: "rotate(-8deg) skew(-15deg)",
          zIndex: 1000,
          display: "block",
          visibility: "visible"
        }}>
          Our Lady <br />
          <span style={{ fontSize: "1.5rem" }}>of </span>
          Perpetual
          <br />
          <span style={{ marginLeft: "3rem" }}>Profit </span>
        </h1>
      )}
      
      {/* Footer */}
      <footer style={{
        marginTop: '4rem',
        padding: '3rem 2rem 2rem',
        background: 'linear-gradient(to bottom, rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.8))',
        borderTop: '1px solid rgba(212, 175, 55, 0.3)',
        color: '#ffffff',
        textAlign: 'center'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          {/* Footer Title */}
          <h3 style={{
            fontFamily: 'UnifrakturCook, serif',
            fontSize: '2.5rem',
            color: 'rgb(142, 102, 43)',
            marginBottom: '1rem',
            textShadow: '2px 2px 4px rgba(0, 0, 0, 0.7)'
          }}>
            Our Lady of Perpetual Profit
          </h3>
          
          {/* Divider */}
          <div style={{
            width: '100px',
            height: '2px',
            background: 'linear-gradient(90deg, transparent, #d4af37, transparent)',
            margin: '1.5rem auto'
          }} />
          
          {/* Contact Link */}
          <div style={{
            marginBottom: '2rem'
          }}>
            <Link href="/contact" style={{
              color: '#d4af37',
              textDecoration: 'none',
              fontSize: '1.2rem',
              fontFamily: 'Cyber, monospace',
              transition: 'all 0.3s ease',
              textShadow: '0 0 5px rgba(212, 175, 55, 0.3)',
              display: 'inline-block',
              padding: '0.5rem 1.5rem',
              border: '1px solid rgba(212, 175, 55, 0.5)',
              borderRadius: '20px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(212, 175, 55, 0.1)';
              e.currentTarget.style.textShadow = '0 0 10px rgba(212, 175, 55, 0.7)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.textShadow = '0 0 5px rgba(212, 175, 55, 0.3)';
            }}>
              Contact
            </Link>
          </div>
          
          {/* Blessing Text */}
          <p style={{
            fontSize: '1rem',
            fontStyle: 'italic',
            opacity: 0.8,
            marginBottom: '1.5rem',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
          }}>
            "May your gains be eternal and your losses forgotten"
          </p>
          
          {/* Copyright */}
          <p style={{
            fontSize: '0.9rem',
            opacity: 0.6,
            fontFamily: 'Cyber, monospace'
          }}>
            © 2024 Church of Perpetual Profit | Blessed by the Blockchain
          </p>
          
          {/* Decorative Elements */}
          <div style={{
            marginTop: '1.5rem',
            fontSize: '1.5rem',
            color: '#d4af37',
            opacity: 0.7
          }}>
            ✦ ✦ ✦
          </div>
        </div>
      </footer>
      </div>
      
   {mounted && !isSceneLoading && (
      <div
        style={{
          position: "fixed",
          top: "20px",
          right: "20px",
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          gap: isMobile ? "10px" : "15px",
          alignItems: isMobile ? "flex-end" : "center",
          zIndex: 9999,
          opacity: isSceneLoading ? 0 : 1,
          transition: "opacity 0.5s ease-in-out"
        }}
      >
        {/* Music Controls - First on desktop, Third on mobile */}
        <div style={{ order: isMobileDevice ? 2 : 0 }}>
          {!showMusicControls ? (
            <button
              onClick={() => {
                setShowMusicControls(true);
                if (!contextIsPlaying) {
                  play();
                }
              }}
              style={{
                width: isMobile ? "2.5rem" : "3.75rem",
                height: isMobile ? "2.5rem" : "3.75rem",
                borderRadius: "0.5rem",
                backgroundColor: "rgba(0, 0, 0, 0.7)",
                border: "2px solid rgba(255, 255, 255, 0.2)",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.3s ease",
                backdropFilter: "blur(10px)",
                boxShadow: "0 0.125rem 0.5rem rgba(0, 0, 0, 0.3)",
              }}
              title="Toggle Music"
            >
              <svg
                width={isMobile ? "20" : "30"}
                height={isMobile ? "20" : "30"}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 18V5l12-2v13" />
                <circle cx="6" cy="18" r="3" />
                <circle cx="18" cy="16" r="3" />
              </svg>
            </button>
          ) : (
            // Compact Music Player Controls
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              {/* Spinning Album Art */}
              <div
                className={contextIsPlaying ? "spinning-record" : ""}
                style={{
                  width: isMobile ? "2.5rem" : "3.75rem",
                  height: isMobile ? "2.5rem" : "3.75rem",
                  borderRadius: "50%",
                  backgroundImage: "url('/virginRecords.jpg')",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />
              
              {/* Skip Button */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (nextTrack) {
                    nextTrack();
                  }
                }}
                style={{
                  width: isMobile ? "2rem" : "3rem",
                  height: isMobile ? "2rem" : "3rem",
                  borderRadius: "0.375rem",
                  backgroundColor: "rgba(0, 0, 0, 0.7)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  backdropFilter: "blur(10px)",
                  boxShadow: "0 0.125rem 0.375rem rgba(0, 0, 0, 0.3)",
                }}
                title="Next Track"
              >
                <svg width={isMobile ? "16" : "24"} height={isMobile ? "16" : "24"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="5 4 15 12 5 20 5 4"/>
                  <line x1="19" y1="5" x2="19" y2="19"/>
                </svg>
              </button>
              
              {/* Close Button */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowMusicControls(false);
                  if (pause) {
                    pause();
                  }
                }}
                style={{
                  width: isMobile ? "1.75rem" : "2.625rem",
                  height: isMobile ? "1.75rem" : "2.625rem",
                  borderRadius: "0.375rem",
                  backgroundColor: "rgba(0, 0, 0, 0.7)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  backdropFilter: "blur(10px)",
                  boxShadow: "0 0.125rem 0.375rem rgba(0, 0, 0, 0.3)",
                }}
                title="Close Music"
              >
                <svg width={isMobile ? "14" : "21"} height={isMobile ? "14" : "21"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          )}
        </div>
        
        {/* User Account - Second on desktop, Second on mobile */}
        <div style={{ order: isMobileDevice ? 1 : 1 }}>
          {isSignedIn ? (
            <Illumin80ClerkButton afterSignOutUrl="/" isMobileDevice={isMobileDevice} />
          ) : (
            <SignInButton mode="modal" forceRedirectUrl="/home3">
              <button
                style={{
                  width: isMobileDevice ? "2.5rem" : "3.75rem",
                  height: isMobileDevice ? "2.5rem" : "3.75rem",
                  borderRadius: "0.5rem",
                  backgroundColor: "rgba(0, 0, 0, 0.7)",
                  border: "2px solid rgba(255, 255, 255, 0.2)",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  backdropFilter: "blur(10px)",
                  boxShadow: "0 0.125rem 0.5rem rgba(0, 0, 0, 0.3)",
                }}
                title="Sign In"
              >
                <span style={{ fontSize: "2.2rem" }}>{emoji}</span>
              </button>
            </SignInButton>
          )}
        </div>
        
        {/* CyberNav Menu - Last on desktop, First on mobile */}
        <div style={{ order: isMobileDevice ? 0 : 2 }}>
          <CyberNav is80sMode={is80sMode} position="relative" />
        </div>
        
        {/* Social Bar - Last position */}
        <div style={{ order: isMobileDevice ? 4 : 3 }}>
          <SocialBar is80sMode={is80sMode} />
        </div>
      </div>
      )
    }
      
      {/* Hidden sign in button */}
      {!isSignedIn && (
        <SignInButton mode="modal" forceRedirectUrl="/home3">
          <button id="hidden-sign-in-home3" style={{ display: 'none' }}>Sign In</button>
        </SignInButton>
      )}
      
      {/* Candle Modal */}
      <CompactCandleModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCandleCreated={() => {
          console.log('Candle created successfully');
        }}
      />
    </div>
  
  );
}