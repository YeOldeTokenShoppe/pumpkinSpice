"use client";

import React, { useEffect, useState, useRef, Suspense } from 'react';
import dynamic from 'next/dynamic';
import SlantedCarousel from '@/components/SlantedCarousel';
import { useMusic } from '@/components/MusicContext';
import { useUser, UserButton, SignInButton } from "@clerk/nextjs";
import CyberNav from '@/components/CyberNav';
import Link from 'next/link';
import Coin from '@/components/Coin';
import RotatingText from '@/components/RotatingText';
import '@/components/RotatingText.css';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';
import { encryptMessage, decryptMessage, generateScrambledDisplay } from '@/utilities/encryption';
import TextMarquee from '@/components/TextMarquee';
import { gsap } from 'gsap';
import { TextPlugin } from 'gsap/TextPlugin';
import '@/components/ArrowButton.css';

// Register GSAP TextPlugin
if (typeof window !== 'undefined') {
  gsap.registerPlugin(TextPlugin);
}

// Dynamically import 3D carousel to avoid SSR issues
const Simple3DCarousel = dynamic(() => import('@/components/Simple3DCarousel'), {
  ssr: false,
  loading: () => <div style={{ height: '50vh', background: 'linear-gradient(135deg, #1a1a2e 0%, #0f0f1e 100%)', borderRadius: '12px' }} />
});

// SingleCandleModel component for the two-column section
function SingleCandleModel({ prayerText = '', encryptedText = '', isTyping = false, isEncrypting = false }) {
  const { scene, animations } = useGLTF('/models/singleCandleAnimatedFlame.glb');
  const { actions } = useAnimations(animations, scene);
  const modelRef = useRef();
  const label2MeshRef = useRef();
  const [label2Mesh, setLabel2Mesh] = useState(null);
  const targetRotationRef = useRef(0);
  const currentRotationRef = useRef(0);
  const [delayRotation, setDelayRotation] = useState(false);
  const delayTimerRef = useRef(null);
  
  // Clone the scene to avoid conflicts with other instances
  const clonedScene = React.useMemo(() => {
    const cloned = scene.clone();
    
    // Load and apply texture to labels
    const textureLoader = new THREE.TextureLoader();
    const vvvTexture = textureLoader.load('/vvv.jpg');
    // Remove deprecated sRGBEncoding - Three.js now uses colorSpace
    if (vvvTexture.colorSpace !== undefined) {
      vvvTexture.colorSpace = THREE.SRGBColorSpace;
    }
    
    // Traverse the cloned scene to find and update specific meshes
    cloned.traverse((child) => {
      if (child.isMesh) {
        console.log('Found mesh:', child.name);
        
        // Apply texture to Label1
        if (child.name === 'Label1') {
          console.log('Applying vvv.jpg to Label1');
          
          // Keep normal orientation for image
          vvvTexture.wrapS = THREE.RepeatWrapping;
          vvvTexture.wrapT = THREE.RepeatWrapping;
          vvvTexture.repeat.set(1, 1); // Normal orientation
          vvvTexture.offset.set(0, 0);
          
          child.material = new THREE.MeshStandardMaterial({
            map: vvvTexture,
            side: THREE.DoubleSide,
            metalness: 0.2,
            roughness: 0.8
          });
        }
        
        // Setup Label2 for text
        if (child.name === 'Label2') {
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
    });
    
    return cloned;
  }, [scene]);
  
  // Update Label2 with prayer text
  useEffect(() => {
    // Get the label2 mesh from the cloned scene
    const label2 = clonedScene?.userData?.label2Mesh;
    
    console.log('Updating Label2:', { 
      prayerText, 
      encryptedText, 
      hasLabel2: !!label2,
      prayerLength: prayerText?.length,
      encryptedLength: encryptedText?.length 
    });
    
    if (!label2) return;
    
    // Create a canvas to draw text
    const canvas = document.createElement('canvas');
    canvas.width = 512; // Higher resolution
    canvas.height = 512;
    const context = canvas.getContext('2d');
    
    // Flip vertically to fix upside-down
    context.save();
    context.translate(0, canvas.height);
    context.scale(1, -1); // Flip on Y-axis
    
    // Dark background with gold border
    context.fillStyle = '#1a1a1a';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add gold border with more margin
    context.strokeStyle = '#d4af37';
    context.lineWidth = 4;
    context.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);
    
    // Set text styling
    context.fillStyle = '#d4af37';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    
    if (encryptedText) {
      // Check if this is an error message
      if (encryptedText.startsWith('Error:')) {
        // Show error message
        context.font = 'bold 30px monospace';
        context.fillStyle = '#ff4444';
        context.fillText('⚠️ ERROR ⚠️', canvas.width / 2, 100);
        
        context.font = '20px monospace';
        context.fillStyle = '#ffffff';
        
        // Word wrap the error message
        const words = encryptedText.split(' ');
        let line = '';
        let y = 180;
        const maxWidth = canvas.width - 80;
        
        for (let n = 0; n < words.length; n++) {
          const testLine = line + words[n] + ' ';
          const metrics = context.measureText(testLine);
          
          if (metrics.width > maxWidth && n > 0) {
            context.fillText(line, canvas.width / 2, y);
            line = words[n] + ' ';
            y += 35;
          } else {
            line = testLine;
          }
        }
        if (line) {
          context.fillText(line, canvas.width / 2, y);
        }
      } else {
        // Show encrypted text
        context.font = 'bold 40px monospace';
        context.fillText('ENCRYPTED:', canvas.width / 2, 80);
        
        // Show the actual encrypted text
        context.font = '24px monospace';
        context.fillStyle = '#ffffff';
        
        // Break encrypted text into lines
        const charsPerLine = 20;
        const lines = [];
        for (let i = 0; i < encryptedText.length; i += charsPerLine) {
          lines.push(encryptedText.substring(i, i + charsPerLine));
        }
        
        // Display up to 8 lines
        lines.slice(0, 8).forEach((line, index) => {
          context.fillText(line, canvas.width / 2, 150 + (index * 35));
        });
      }
      
    } else if (prayerText) {
      // Show original prayer
      context.font = 'bold 32px serif';
      context.fillText('A PRAYER', canvas.width / 2, 100);
      
      // Word wrap the prayer text with smaller font and more margin
      context.font = '20px serif';
      context.fillStyle = '#ffffff';
      
      const words = prayerText.split(' ');
      let line = '';
      let y = 180;
      let lineCount = 0;
      const maxWidth = canvas.width - 220; // Even more margin for better spacing
      
      for (let n = 0; n < words.length && lineCount < 7; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = context.measureText(testLine);
        
        if (metrics.width > maxWidth && n > 0) {
          context.fillText(line, canvas.width / 2, y);
          line = words[n] + ' ';
          y += 40; // More line spacing
          lineCount++;
        } else {
          line = testLine;
        }
      }
      if (lineCount < 7 && line) {
        context.fillText(line, canvas.width / 2, y);
      }
      
    } else {
      // Default state
      context.font = 'bold 50px serif';
      context.fillText('Your', canvas.width / 2, canvas.height / 2 - 30);
      context.fillText('Message', canvas.width / 2, canvas.height / 2 + 30);
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
  }, [prayerText, encryptedText, clonedScene]);
  
  // Play animations if they exist
  useEffect(() => {
    if (actions && Object.keys(actions).length > 0) {
      const firstAction = Object.values(actions)[0];
      firstAction?.play();
    }
  }, [actions]);
  
  // Handle delay after encryption completes
  useEffect(() => {
    if (!isEncrypting && delayRotation) {
      // Encryption just finished, keep rotation paused
      // This state is already set, no action needed
    } else if (isEncrypting && !delayRotation) {
      // Encryption started, set delay flag
      setDelayRotation(true);
      
      // Clear any existing timer
      if (delayTimerRef.current) {
        clearTimeout(delayTimerRef.current);
      }
    } else if (!isEncrypting && !isTyping && delayRotation) {
      // Encryption finished and not typing, start delay timer
      if (delayTimerRef.current) {
        clearTimeout(delayTimerRef.current);
      }
      
      delayTimerRef.current = setTimeout(() => {
        setDelayRotation(false);
      }, 5000); // 5 second delay
    }
    
    // Cleanup on unmount
    return () => {
      if (delayTimerRef.current) {
        clearTimeout(delayTimerRef.current);
      }
    };
  }, [isEncrypting, isTyping, delayRotation]);
  
  // Handle rotation based on typing, encrypting, and delay state
  useFrame((state, delta) => {
    if (!modelRef.current) return;
    
    if (isTyping || isEncrypting || delayRotation) {
      // When typing, encrypting, or in delay period, rotate to show Label2 (text label)
      // Label2 is typically on the back, so rotate to Math.PI (180 degrees)
      // You can adjust this value through trial and error
      targetRotationRef.current = 0; // Start with 180 degrees, adjust as needed
      
      // Smooth transition to target rotation
      const rotationDiff = targetRotationRef.current - currentRotationRef.current;
      currentRotationRef.current += rotationDiff * delta * 3; // Smooth lerp
      modelRef.current.rotation.y = currentRotationRef.current;
    } else {
      // When not typing, encrypting, or in delay, continue auto-rotation from current position
      currentRotationRef.current += delta * 0.5;
      modelRef.current.rotation.y = currentRotationRef.current;
      // Update target to match current for smooth transition back
      targetRotationRef.current = currentRotationRef.current;
    }
  });
  
  return (
    <primitive 
      ref={modelRef}
      object={clonedScene} 
      scale={[2.3, 2.3, 2.3]}  // Slightly smaller scale
      position={[0, -2, 0]}     // Lower position to center in view
    />
  );
}

// Preload the candle model
useGLTF.preload('/models/singleCandleAnimatedFlame.glb');

// EncryptionDemo component for the prayer encryption feature
function EncryptionDemo({ onPrayerChange, onEncryptedChange, onTypingChange, onEncryptingChange, isMobile = false }) {
  // Predefined sample prayer for demo
  const samplePrayer = "Oh Lady of Limit Orders, forgive me for buying the top again. Grant me the humility to average down, and the courage to tell no one.";
  
  const [displayText, setDisplayText] = useState(samplePrayer);
  const [isEncrypted, setIsEncrypted] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [encryptionKey, setEncryptionKey] = useState("pineapple");
  const [usedKey, setUsedKey] = useState("");
  const [showKeyInput, setShowKeyInput] = useState(true);
  
  // Update parent component based on state
  useEffect(() => {
    if (!isEncrypted && !isAnimating) {
      // Show original prayer
      if (onPrayerChange) onPrayerChange(samplePrayer);
      if (onEncryptedChange) onEncryptedChange('');
    } else if (isEncrypted && !isAnimating) {
      // Show encrypted text or error message
      if (onPrayerChange) onPrayerChange('');
      if (onEncryptedChange) onEncryptedChange(displayText);
    } else if (isEncrypted && isAnimating && displayText.includes("Error:")) {
      // Show error message during animation
      if (onPrayerChange) onPrayerChange('');
      if (onEncryptedChange) onEncryptedChange(displayText);
    }
  }, [isEncrypted, isAnimating, displayText, samplePrayer, onPrayerChange, onEncryptedChange]);
  
  // Update parent component when animating
  useEffect(() => {
    if (onEncryptingChange) {
      onEncryptingChange(isAnimating);
    }
  }, [isAnimating, onEncryptingChange]);
  
  const handleToggle = async () => {
    // Check if key is present
    if (!encryptionKey) {
      // Show error briefly if no key
      setDisplayText("⚠️ KEY REQUIRED ⚠️");
      setTimeout(() => {
        setDisplayText(isEncrypted ? displayText : samplePrayer);
      }, 1500);
      return;
    }
    
    setIsAnimating(true);
    
    // Show scrambling animation
    let scrambleInterval;
    let iterations = 0;
    const maxIterations = 20;
    
    scrambleInterval = setInterval(async () => {
      setDisplayText(generateScrambledDisplay(samplePrayer.length));
      iterations++;
      
      if (iterations >= maxIterations) {
        clearInterval(scrambleInterval);
        
        if (!isEncrypted) {
          // Encrypt with real encryption
          try {
            // Require a key for encryption
            if (!encryptionKey) {
              setDisplayText("⚠️ KEY REQUIRED ⚠️");
              setTimeout(() => {
                setDisplayText(samplePrayer);
                setIsAnimating(false);
              }, 1500);
              return;
            }
            
            const keyToUse = encryptionKey;
            const encrypted = await encryptMessage(samplePrayer, keyToUse);
            
            // Store the encrypted data but show a visual representation
            const visualEncrypted = generateScrambledDisplay(Math.min(samplePrayer.length * 1.5, 120), 
              keyToUse.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0));
            
            setDisplayText(visualEncrypted);
            setIsEncrypted(true);
            setUsedKey(keyToUse);
            setShowKeyInput(true);  // Keep key input visible
            
            // Store actual encrypted data for real decryption
            window.encryptedData = encrypted;
            setIsAnimating(false);
          } catch (error) {
            console.error('Encryption failed:', error);
            setDisplayText("⚠️ ENCRYPTION FAILED ⚠️");
            setIsAnimating(false);
            setTimeout(() => {
              setDisplayText(samplePrayer);
            }, 1500);
            return;
          }
        } else {
          // Decrypt with real decryption
          const keyToUse = encryptionKey || "default-key-2024";
          
          if (window.encryptedData) {
            const result = await decryptMessage(
              window.encryptedData.encrypted,
              window.encryptedData.salt,
              window.encryptedData.iv,
              keyToUse
            );
            
            if (result.success) {
              setDisplayText(result.message);
              setIsEncrypted(false);
              setUsedKey("");
              // Keep the encryption key so user can re-encrypt with same key
              setShowKeyInput(true);
              window.encryptedData = null;
              setIsAnimating(false);
            } else {
              // Wrong key or corrupted data - show user-friendly error
              // Store the encrypted visual for restoration
              const encryptedVisual = displayText;
              
              // Show user-friendly error message
              const errorMsg = "Error: Invalid encrypted text or wrong key";
              setDisplayText(errorMsg);
              
              // Force immediate update to parent
              if (onEncryptedChange) onEncryptedChange(errorMsg);
              
              // Keep encrypted state but stop animation
              setIsAnimating(false);
              
              setTimeout(() => {
                // Restore the encrypted visual
                setDisplayText(encryptedVisual);
                if (onEncryptedChange) onEncryptedChange(encryptedVisual);
                setShowKeyInput(true);
              }, 2500);
              return;
            }
          } else {
            // No encrypted data stored
            setDisplayText("No encrypted data!");
            setIsAnimating(false);
            return;
          }
        }
      }
    }, 50);
  };
  
  return (
    <div style={{ 
      position: 'relative',
      width: '100%' // Ensure full width
    }}>
      {/* Toggle Button */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '1rem',
          alignItems: 'center'
        }}>
          <button
            onClick={handleToggle}
            disabled={isAnimating}
            className={`arrow-button ${isAnimating ? 'processing' : ''} ${isEncrypted && !isAnimating ? 'encrypted' : ''}`}
            style={isMobile ? {
              marginTop: '-30rem'
            } : {}}
          >
            {isAnimating ? 'Processing...' : 
             isEncrypted ? 'Decrypt' : 'Encrypt it!'}
            {!isMobile && <span className="arrow"></span>}
          </button>
        </div>
    </div>
  );
}

export default function HomePage() {
  const [fontLoaded, setFontLoaded] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(0);
  const coinRef = useRef(null);
  
  // Shared state for prayer encryption demo
  const [currentPrayer, setCurrentPrayer] = useState('');
  const [currentEncrypted, setCurrentEncrypted] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isEncrypting, setIsEncrypting] = useState(false);
  
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

    // Get both desktop and mobile elements
    const scrambleElements = document.querySelectorAll('.scramble-text, .scramble-text-mobile');
    const actionElements = document.querySelectorAll('.action-text, .action-text-mobile');
    
    if (scrambleElements.length === 0 || actionElements.length === 0) return;

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
            if (targetWord === "Declare") {
              element.style.color = '#d4af37';
              element.style.textShadow = '0 0 10px #d4af37, 0 0 20px #d4af37';
            } else {
              element.style.color = '#00ff00';
              element.style.textShadow = '0 0 10px #00ff00, 0 0 20px #00ff00';
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

    // Start the animation cycles
    const messageTimer = setInterval(scrambleMessage, 3000);
    const actionTimer = setInterval(scrambleAction, 4000); // Different interval for variety

    return () => {
      clearInterval(messageTimer);
      clearInterval(actionTimer);
    };
  }, [isClient]);
  
  useEffect(() => {
    // Ensure UnifrakturCook font is loaded
    const loadFont = async () => {
      try {
        await document.fonts.load('bold 7rem "UnifrakturCook"');
        setFontLoaded(true);
      } catch (e) {
        console.log('Font loading:', e);
        setFontLoaded(true);
      }
    };
    loadFont();
  }, []);
  
  // Check if mobile view and device - only run on client
  useEffect(() => {
    setIsClient(true);
    const checkViewport = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      setIsMobileView(width <= 768);
      setIsMobileDevice(width <= 768);
      setIsLandscape(width > height);
      setViewportHeight(height);
    };
    checkViewport();
    window.addEventListener('resize', checkViewport);
    window.addEventListener('orientationchange', checkViewport);
    return () => {
      window.removeEventListener('resize', checkViewport);
      window.removeEventListener('orientationchange', checkViewport);
    };
  }, []);

  // Sparkle effect for coin
  useEffect(() => {
    if (typeof window === "undefined" || !coinRef.current) {
      return;
    }

    const sparkle = coinRef.current;

    const MAX_STARS = 60;
    const STAR_INTERVAL = 16;

    const MAX_STAR_LIFE = 3;
    const MIN_STAR_LIFE = 1;

    const MAX_STAR_SIZE = 40;
    const MIN_STAR_SIZE = 20;

    const MIN_STAR_TRAVEL_X = 100;
    const MIN_STAR_TRAVEL_Y = 100;

    const randomLimitedColor = () => {
      const randomHue = (() => {
        const ranges = [
          { min: 120, max: 150 }, // Blues
          { min: 270, max: 290 }, // Violets/Purples
          { min: 45, max: 60 }, // Yellows and Golds
        ];
        const range = ranges[Math.floor(Math.random() * ranges.length)];
        return (
          Math.floor(Math.random() * (range.max - range.min + 1)) + range.min
        );
      })();

      return `hsla(${randomHue}, 100%, 50%, 1)`;
    };

    const Star = class {
      constructor() {
        this.size = this.random(MAX_STAR_SIZE, MIN_STAR_SIZE);

        this.x = this.random(
          sparkle.offsetWidth * 0.75,
          sparkle.offsetWidth * 0.25
        );
        this.y = sparkle.offsetHeight / 2 - this.size / 2;

        this.x_dir = this.randomMinus();
        this.y_dir = this.randomMinus();

        this.x_max_travel =
          this.x_dir === -1 ? this.x : sparkle.offsetWidth - this.x - this.size;
        this.y_max_travel = sparkle.offsetHeight / 2 - this.size;

        this.x_travel_dist = this.random(this.x_max_travel, MIN_STAR_TRAVEL_X);
        this.y_travel_dist = this.random(this.y_max_travel, MIN_STAR_TRAVEL_Y);

        this.x_end = this.x + this.x_travel_dist * this.x_dir;
        this.y_end = this.y + this.y_travel_dist * this.y_dir;

        this.life = this.random(MAX_STAR_LIFE, MIN_STAR_LIFE);

        this.star = document.createElement("div");
        this.star.classList.add("star");

        this.star.style.setProperty("--start-left", this.x + "px");
        this.star.style.setProperty("--start-top", this.y + "px");

        this.star.style.setProperty("--end-left", this.x_end + "px");
        this.star.style.setProperty("--end-top", this.y_end + "px");

        this.star.style.setProperty("--star-life", this.life + "s");
        this.star.style.setProperty("--star-life-num", this.life);

        this.star.style.setProperty("--star-size", this.size + "px");
        this.star.style.setProperty("--star-color", randomLimitedColor());
      }

      draw() {
        sparkle.appendChild(this.star);
      }

      pop() {
        sparkle.removeChild(this.star);
      }

      random(max, min) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
      }

      randomMinus() {
        return Math.random() > 0.5 ? 1 : -1;
      }
    };

    let current_star_count = 0;
    const intervalId = setInterval(() => {
      if (current_star_count >= MAX_STARS) {
        return;
      }

      current_star_count++;

      const newStar = new Star();
      newStar.draw();

      setTimeout(() => {
        current_star_count--;
        newStar.pop();
      }, newStar.life * 1000);
    }, STAR_INTERVAL);

    return () => {
      clearInterval(intervalId);
    };
  }, [isClient, isMobileView]);

  const carouselSlides = [
    {
      id: 1,
      backgroundImage: '/sacred.png',
      image: '/sacred.png',
      number: '01',
      title: 'Sacred Spaces',
      description: 'Enter the divine realm of perpetual profit.'
    },
    {
      id: 2,
      backgroundImage: '/vvv.jpg',
      image: '/vvv.jpg',
      number: '02',
      title: 'Digital Visions',
      description: 'Where technology meets spiritual transcendence.'
    },
    {
      id: 3,
      backgroundImage: '/nosferatu.png',
      image: '/nosferatu.png',
      number: '03',
      title: 'Gothic Dreams',
      description: 'Ancient mysteries in modern manifestation.'
    },
    {
      id: 4,
      backgroundImage: '/fountain.png',
      image: '/fountain.png',
      number: '04',
      title: 'Eternal Flow',
      description: 'The fountain of perpetual abundance.'
    },
    {
      id: 5,
      backgroundImage: '/vsClown.jpg',
      image: '/vsClown.jpg',
      number: '05',
      title: 'Cosmic Jest',
      description: 'Where humor meets the divine comedy.'
    }
  ];

  return (
    <>
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
      {isClient && isMobileView && (
        <div style={{
          marginTop: '1rem',
          marginLeft: '0',
          marginRight: '0',
          padding: '1.5rem',
          background: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(10px)',
          borderRadius: '12px',
          border: '1px solid rgba(212, 175, 55, 0.3)',
          color: '#ffffff',
          fontSize: '1rem',
          
          lineHeight: 1.6,
          textAlign: 'left'
        }}>
          {/* <h2 style={{
            color: '#d4af37',
            marginBottom: '1rem',
            fontSize: '1.8rem'
          }}>Welcome to Our Sacred Digital Temple</h2> */}
          <p style={{ 
            marginBottom: '1rem',  
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            fontWeight: 400,
            letterSpacing: '0.02em'
          }}>
            Experience the convergence of ancient wisdom and modern technology. 
            <span style={{
              fontFamily: 'UnifrakturCook, serif',
              fontWeight: 'bold',
              fontSize: '1.1em',
              color: '#d4af37',
              textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)'
            }}> Our Lady of Perpetual Profit</span> guides seekers through the digital realm, 
            offering enlightenment through carefully curated experiences.
          </p>
          <p style={{
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            fontWeight: 400,
            letterSpacing: '0.02em'
          }}>
            Navigate through our sacred scrolls, witness divine visions, and discover 
            the eternal flow of creative abundance that awaits those who dare to explore.
          </p>
        </div>
      )}
      
      {/* Mobile Candle Section with Encryption - only shown on mobile */}
      {isClient && isMobileView && (
        <div style={{
          marginTop: '2rem',
          marginBottom: '2rem',
          padding: '1.5rem',
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(10px)',
          borderRadius: '12px',
          border: '1px solid rgba(212, 175, 55, 0.2)'
        }}>
          {/* Candle Model Container */}
          <div style={{
            position: "relative",
            height: "300px",
            overflow: "visible",
            marginBottom: '0.5rem'
          }}>
            <Canvas
              camera={{ position: [0, 2, 8], fov: 45 }}
              style={{ width: '100%', height: '100%' }}
              gl={{ alpha: true, antialias: true }}
            >
              <ambientLight intensity={1.5} />
              <OrbitControls 
                target={[0, 0, 0]}
                enablePan={false}
                enableZoom={true}
                maxDistance={8}
                minDistance={2}
                enableDamping={true}
                dampingFactor={0.05}
                maxPolarAngle={Math.PI * 0.65}
                minPolarAngle={Math.PI * 0.35}
                autoRotate={false}
                rotateSpeed={0.5}
              />
              <Suspense fallback={null}>
                <SingleCandleModel 
                  prayerText={currentPrayer} 
                  encryptedText={currentEncrypted} 
                  isTyping={isTyping} 
                  isEncrypting={isEncrypting} 
                />
              </Suspense>
            </Canvas>
            {/* Shadow effect underneath the candle */}
            <div style={{
              position: 'absolute',
              bottom: '15%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '60%',
              height: '20px',
              background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.4) 0%, transparent 70%)',
              filter: 'blur(8px)',
              zIndex: -1
            }} />
          </div>
          
          {/* Encryption Section */}
          <div style={{
            textAlign: 'center',
            padding: '0 0.5rem'
          }}>
            <h5 style={{
              fontSize: '2rem',
              marginBottom: '0.5rem',
              fontFamily: 'Cyber, monospace',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '0.3rem'
            }}>
              <span style={{ 
                minWidth: 'fit-content',
                display: 'flex',
                gap: '0.3rem',
                alignItems: 'baseline'
              }}>
                <span className="action-text-mobile" style={{ 
                  color: '#00ff00',
                  textShadow: '0 0 10px #00ff00, 0 0 20px #00ff00',
                  minWidth: '120px',
                  textAlign: 'right'
                }} data-words='["Encrypt", "Declare"]'>Encrypt</span>
                <span style={{ 
                  color: '#00ff00',
                  textShadow: '0 0 10px #00ff00, 0 0 20px #00ff00'
                }}>Your:</span>
              </span>
              <span className="scramble-text-mobile" style={{ 
                minWidth: '250px', 
                textAlign: 'center',
                color: '#00ff00',
                textShadow: '0 0 10px #00ff00, 0 0 20px #00ff00'
              }} data-words='["Prayer", "Wish", "Dedication", "Confession", "Gratitude"]'>Message</span>
            </h5>
            
            <p style={{
              fontSize: '0.95rem',
              lineHeight: 1.5,
              marginBottom: '1rem',
              marginTop: '0.5rem',
              color: '#ffffff',
              opacity: 0.9,
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
              fontWeight: 400,
              letterSpacing: '0.02em',
              padding: '0 1rem',
              display: 'block',
              width: '100%',
              whiteSpace: 'normal',
              wordWrap: 'break-word'
            }}>
              Send a message to{' '}
              <span style={{
                fontFamily: 'UnifrakturCook, serif',
                fontWeight: 'bold',
                fontSize: '1.1em',
                color: '#d4af37',
                textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)',
                display: 'inline'
              }}>Our Lady of Perpetual Profit</span>
              {' '}through the blockchain! Top token burners are inducted into <span style={{
                fontFamily: 'UnifrakturCook, serif',
                fontWeight: 'bold',
                fontSize: '1.1em',
                color: '#d4af37',
                textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)',
                display: 'inline'
              }}>The Illumin80 Soci80</span>.
            </p>
            
            {/* Mobile Encryption Demo */}
            <EncryptionDemo 
              onPrayerChange={setCurrentPrayer}
              onEncryptedChange={setCurrentEncrypted}
              onTypingChange={setIsTyping}
              onEncryptingChange={setIsEncrypting}
              isMobile={true}
            />
            
            {/* Call to Action - Mobile */}
            <div style={{
              marginTop: '-1rem',
              paddingTop: '1.5rem',
              borderTop: '1px solid rgba(212, 175, 55, 0.2)'
            }}>
              {/* <p style={{
                fontSize: '1rem',
                marginBottom: '1rem',
                color: '#d4af37',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                letterSpacing: '0.02em'
              }}>
                Ready to light your own green candle?
              </p> */}
              <Link
                href="/gallery"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.8rem 2rem',
                  backgroundColor: 'rgba(212, 175, 55, 0.1)',
                  border: '2px solid #d4af37',
                  borderRadius: '25px',
                  color: '#d4af37',
                  fontSize: '1.1rem',
                  fontFamily: 'Cyber, monospace',
                  fontWeight: 'bold',
                  textDecoration: 'none',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 0 15px rgba(212, 175, 55, 0.3)',
                  textShadow: '0 0 5px rgba(212, 175, 55, 0.5)'
                }}
              >
                <span style={{
                  display: 'inline-block',
                  position: 'relative',
                  width: '15px',
                  height: '30px',
                  verticalAlign: 'middle'
                }}>
                  <span style={{
                    position: 'absolute',
                    left: '50%',
                    top: '0',
                    width: '2px',
                    height: '8px',
                    backgroundColor: '#00ff00',
                    transform: 'translateX(-50%)'
                  }}></span>
                  <span style={{
                    position: 'absolute',
                    left: '50%',
                    top: '8px',
                    width: '10px',
                    height: '15px',
                    backgroundColor: '#00ff00',
                    transform: 'translateX(-50%)'
                  }}></span>
                  <span style={{
                    position: 'absolute',
                    left: '50%',
                    bottom: '0',
                    width: '2px',
                    height: '7px',
                    backgroundColor: '#00ff00',
                    transform: 'translateX(-50%)'
                  }}></span>
                </span>
                <span>Devote A Candle</span>
              </Link>
            </div>
          </div>
        </div>
      )}
      
      {/* Mobile Text Marquee - shown after candle section */}
      {isClient && isMobileView && (
        <TextMarquee />
      )}
      
      {/* Mobile Coin Component - repositioned to flow after candle */}
      {isClient && isMobileView && (
        <div style={{ 
          position: "relative",
          marginTop: "2rem",
          marginBottom: "2rem",
          display: "flex",
          justifyContent: "center"
        }}>
          <div
            ref={isMobileView ? coinRef : null}
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
            {/* Title */}
            <h1 style={{ 
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
              whiteSpace: 'nowrap'
            }}>
              <span style={{ display: 'block' }}>Our Lady</span>
              <span style={{ display: 'block' }}>
                <span style={{ fontSize: "3rem" }}>of </span>
                Perpetual
              </span>
              <span style={{ display: 'block', marginLeft: "6rem" }}>Profit</span>
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
            margin: "0 auto",
            width: "80%",
            maxWidth: "80vw",
            padding: '1.8rem',
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(10px)',
            borderRadius: '12px',
            border: '1px solid rgba(212, 175, 55, 0.3)',
            color: '#ffffff',
            fontSize: isLandscape && viewportHeight < 800 ? '1.2rem' : '2rem',
            lineHeight: 1.2,
            textAlign: 'center',
            marginBottom: "3rem"
          }}>
            <p style={{ 
              marginBottom: '1rem',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
              fontWeight: 400,
              letterSpacing: '0.02em'
            }}>
              Experience the convergence of ancient wisdom and modern technology. 
              <span style={{
                fontFamily: 'UnifrakturCook, serif',
                fontWeight: 'bold',
                fontSize: '1.1em',
                color: '#d4af37',
                textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)'
              }}>Our Lady of Perpetual Profit</span> guides seekers through the digital realm, 
              offering enlightenment through carefully curated experiences.
            </p>
          </div>
          
          {/* Two Column Section with Candle and Text */}
          <div style={{
            position: "relative",
            margin: "0 auto",
            width: "80%",
            maxWidth: "80vw",
            display: "grid",
            gridTemplateColumns: "minmax(0, 0.4fr) minmax(0, 0.6fr)", // 40% candle, 60% text
            gap: "0rem",
            alignItems: "center",
            marginBottom: "3rem",
            padding: '2rem',
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(10px)',
            borderRadius: '12px',
            border: '1px solid rgba(212, 175, 55, 0.2)'
          }}>
            {/* Left Column - Candle Model */}
            <div style={{
              position: "relative",
              height: "35rem",
              overflow: "visible"
            }}>
              <Canvas
                camera={{ position: [0, 2, 8], fov: 45 }}  // Raised camera Y position and increased FOV
                style={{ width: '100%', height: '100%' }}
                gl={{ alpha: true, antialias: true }}
              >
                <ambientLight intensity={1.5} />
                {/* <pointLight position={[10, 10, 10]} intensity={1} />
                <pointLight position={[0, -1, 0]} intensity={1.5} color="#ff6b00" /> */}
                <OrbitControls 
                  target={[0, 0, 0]}      // Focus on the center of the scene
                  enablePan={false}      // No panning
                  enableZoom={true}     // No zooming
                  maxDistance={8}    // Limit zoom out
                  minDistance={2}
                  enableDamping={true}   // Smooth rotation
                  dampingFactor={0.05}   // Smoothness factor
                  maxPolarAngle={Math.PI * 0.65}  // Limit looking down
                  minPolarAngle={Math.PI * 0.35}  // Limit looking up
                  autoRotate={false}     // We handle rotation manually
                  rotateSpeed={0.5}      // Slower rotation for better control
                />
                <Suspense fallback={null}>
                  <SingleCandleModel prayerText={currentPrayer} encryptedText={currentEncrypted} isTyping={isTyping} isEncrypting={isEncrypting} />
                </Suspense>
              </Canvas>
              {/* Shadow effect underneath the candle */}
              <div style={{
                position: 'absolute',
                bottom: '15%',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '60%',
                height: '20px',
                background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.4) 0%, transparent 70%)',
                filter: 'blur(8px)',
                zIndex: -1
              }} />
            </div>
            
            {/* Right Column - Encryption Demo */}
            <div style={{
              padding: '0 1rem',
              color: '#ffffff',
              minHeight: '500px', // Match the candle container height
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              width: '100%', // Ensure full width of grid column
              boxSizing: 'border-box', // Include padding in width calculation
              overflow: 'hidden', // Prevent content overflow
              position: 'relative'
            }}>
              {/* <h4 style={{
                color: '#d4af37',
                fontSize: '2rem',
                marginBottom: '0.5rem',
                marginTop: '-2rem',
                fontFamily: 'UnifrakturCook, serif',
                textShadow: '2px 2px 4px rgba(0, 0, 0, 0.7)',
                textAlign: 'center'
              }}>
                Devote a Green Candle
              </h4>
              <p style={{
                fontSize: '1.2rem',
                lineHeight: 1.5,
                marginBottom: '1.5rem',
                opacity: 0.9
              }}>
                Send a prayer, wish, dedication, or confession to Our Lady of Perpetual Profit through the blockchain!
              </p> */}
              <br/>
              <h5 style={{
                fontSize: '3.5rem',
                marginBottom: '0.5rem',
                marginTop: '-2rem',
                fontFamily: 'Cyber, monospace',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <span style={{ 
                  minWidth: 'fit-content',
                  display: 'flex',
                  gap: '0.5rem',
                  alignItems: 'baseline'
                }}>
                  <span className="action-text" style={{ 
                    color: '#00ff00',
                    textShadow: '0 0 10px #00ff00, 0 0 20px #00ff00',
                    minWidth: '200px',
                    textAlign: 'right'
                  }} data-words='["Encrypt", "Declare"]'>Encrypt</span>
                  <span style={{ 
                    color: '#00ff00',
                    textShadow: '0 0 10px #00ff00, 0 0 20px #00ff00'
                  }}>Your:</span>
                </span>
                <span className="scramble-text" style={{ 
                  minWidth: '350px', 
                  textAlign: 'center',
                  color: '#00ff00',
                  textShadow: '0 0 10px #00ff00, 0 0 20px #00ff00'
                }} data-words='["Prayer", "Wish", "Dedication", "Confession", "Intentions"]'>Message</span>
              </h5>
              <p style={{
                lineHeight: 1.5,
                marginBottom: '1.5rem',
                opacity: 0.9,
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                fontWeight: 400,
                letterSpacing: '0.02em',
                fontSize: isLandscape && viewportHeight < 800 ? '1.2rem' : '2rem',
                textAlign: 'center'
              }}>
                Invite good fortune and devote a green candle to <span style={{
                  fontFamily: 'UnifrakturCook, serif',
                  fontWeight: 'bold',
                  fontSize: '1.1em',
                  color: '#d4af37',
                  textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)'
                }}>Our Lady of Perpetual Profit</span> through the blockchain! Top burners are inducted into  <span style={{
                  fontFamily: 'UnifrakturCook, serif',
                  fontWeight: 'bold',
                  fontSize: '1.1em',
                  color: '#d4af37',
                  textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)',
                  display: 'inline'
                }}>The Illumin80 Soci80</span>.
              </p>
              
              <EncryptionDemo 
                onPrayerChange={setCurrentPrayer}
                onEncryptedChange={setCurrentEncrypted}
                onTypingChange={setIsTyping}
                onEncryptingChange={setIsEncrypting}
              />
              
              {/* Call to Action - Create Candle */}
              <div style={{
                marginTop: '3rem',
                paddingTop: '2rem',
                borderTop: '1px solid rgba(212, 175, 55, 0.2)',
                textAlign: 'center'
              }}>
                {/* <p style={{
                  fontSize: '1.1rem',
                  marginBottom: '1.5rem',
                  color: '#d4af37',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                  letterSpacing: '0.02em'
                }}>
                  Ready to light your own green candle?
                </p> */}
                <Link
                  href="/gallery"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.8rem',
                    padding: '1rem 2.5rem',
                    backgroundColor: 'rgba(212, 175, 55, 0.1)',
                    border: '2px solid #d4af37',
                    borderRadius: '30px',
                    color: '#d4af37',
                    fontSize: '1.3rem',
                    fontFamily: 'Cyber, monospace',
                    fontWeight: 'bold',
                    textDecoration: 'none',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 0 15px rgba(212, 175, 55, 0.3)',
                    textShadow: '0 0 5px rgba(212, 175, 55, 0.5)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(212, 175, 55, 0.2)';
                    e.currentTarget.style.boxShadow = '0 0 25px rgba(212, 175, 55, 0.5), 0 0 40px rgba(212, 175, 55, 0.3)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(212, 175, 55, 0.1)';
                    e.currentTarget.style.boxShadow = '0 0 15px rgba(212, 175, 55, 0.3)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                 <span style={{
          display: 'inline-block',
          position: 'relative',
          width: '20px',
          height: '40px',
          marginLeft: '15px',
          marginRight: '15px',
          verticalAlign: 'middle'
        }}>
          {/* Top wick */}
          <span style={{
            position: 'absolute',
            left: '50%',
            top: '0',
            width: '2px',
            height: '10px',
            backgroundColor: '#00ff00',
            transform: 'translateX(-50%)'
          }}></span>
          {/* Candle body */}
          <span style={{
            position: 'absolute',
            left: '50%',
            top: '10px',
            width: '12px',
            height: '20px',
            backgroundColor: '#00ff00',
            transform: 'translateX(-50%)'
          }}></span>
          {/* Bottom wick */}
          <span style={{
            position: 'absolute',
            left: '50%',
            bottom: '0',
            width: '2px',
            height: '10px',
            backgroundColor: '#00ff00',
            transform: 'translateX(-50%)'
          }}></span>
        </span>
                  <span>Create Your Candle</span>
                </Link>
              </div>
            </div>
          </div>
          
          {/* Text Marquee Component */}
          <TextMarquee />
          
          {/* Rotating Text Component */}
          <div style={{
            position: "relative",
            width: "90%",
            maxWidth: "1200px",
            margin: "0 auto"
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
          <div style={{ marginBottom: "2.25rem", marginTop: "19rem" }}>
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
          visibility: "visible",
          opacity: 1,
          transition: "opacity 0.3s ease"
        }}>
          Our Lady <br />
          <span style={{ fontSize: "1.5rem" }}>of </span>
          Perpetual
          <br />
          <span style={{ marginLeft: "3rem" }}>Profit </span>
        </h1>
      )}
      
      {/* CyberNav Menu */}
      <CyberNav is80sMode={is80sMode} />
      
      {/* Music and User Controls Container */}
      <div style={{
        position: "fixed",
        top: isClient && isMobileDevice ? "70px" : "20px",
        right: isClient && isMobileDevice ? "20px" : "72px",
        display: "flex",
        flexDirection: isClient && isMobileDevice ? "column" : "row",
        gap: "10px",
        alignItems: isClient && isMobileDevice ? "flex-end" : "center",
        zIndex: 9999,
        opacity: isClient ? 1 : 0,
        transition: "opacity 0.3s ease"
      }}>
        {/* User Account Icon */}
        <div style={{ order: isClient && isMobileDevice ? 2 : 0 }}>
          {isSignedIn ? (
            <UserButton 
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: {
                    width: "40px",
                    height: "40px",
                    borderRadius: "8px",
                    border: "2px solid rgba(255, 255, 255, 0.2)",
                    backgroundColor: "rgba(0, 0, 0, 0.7)",
                    backdropFilter: "blur(10px)",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)"
                  }
                }
              }}
            />
          ) : (
            <SignInButton mode="modal">
              <button
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "8px",
                  backgroundColor: "rgba(0, 0, 0, 0.7)",
                  border: "2px solid rgba(255, 255, 255, 0.2)",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  backdropFilter: "blur(10px)",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
                }}
                title="Sign In"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </button>
            </SignInButton>
          )}
        </div>
        
        {/* Music Controls */}
        <div style={{ order: isClient && isMobileDevice ? 1 : 1 }}>
          {!showMusicControls ? (
            <button
              onClick={() => {
                setShowMusicControls(true);
                if (!contextIsPlaying) {
                  play();
                }
              }}
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "8px",
                backgroundColor: "rgba(0, 0, 0, 0.7)",
                border: "2px solid rgba(255, 255, 255, 0.2)",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.3s ease",
                backdropFilter: "blur(10px)",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
              }}
              title="Toggle Music"
            >
              <svg
                width="20"
                height="20"
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
                gap: "8px",
              }}
            >
              {/* Spinning Album Art */}
              <div
                className={contextIsPlaying ? "spinning-record" : ""}
                style={{
                  width: "40px",
                  height: "40px",
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
                  width: "32px",
                  height: "32px",
                  borderRadius: "4px",
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  border: "none",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
                title="Next Track"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                  width: "28px",
                  height: "28px",
                  borderRadius: "4px",
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  border: "1px solid rgba(255, 255, 255, 0.3)",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
                title="Close Music"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
      
      </div>
    </>
  );
}