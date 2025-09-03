import React, { useState, Suspense, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, useTexture } from '@react-three/drei';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/utilities/firebaseClient';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrambleTextPlugin } from 'gsap/dist/ScrambleTextPlugin';
import { encryptMessage, generateScrambledDisplay } from '@/utilities/encryption';
import './CompactCandleModal.css';

// Register GSAP plugin
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrambleTextPlugin);
}

// Pre-made prayers
const PRAYERS = [
  {
    id: 'scalper',
    title: "Scalper's Prayer",
    text: "Oh Lady of Perpetual Profit, bless my lightning fingers and low-latency reflexes. Protect me from fat-fingered orders and grant me the stamina to chase micro-movements without losing my soul. May every scalp be green, and every exit perfectly timed. Amen."
  },
  {
    id: 'leverage',
    title: "Leverage Prayer",
    text: "Oh Blessed Virgin of Margin, shield me from the wicked lure of 100x leverage. Guard my trades from sudden liquidation, and deliver me from the temptation of adding 'just a little more.' Grant me the humility to close in profit, and the grace to walk away before the exchange claims my soul. Amen."
  },
  {
    id: 'swing',
    title: "Swing Trader's Prayer",
    text: "Oh Lady of Perpetual Profit, grant me patience to ride the waves of volatility, and the wisdom to know when to take profit and when to let it run. Bless my charts, my Fibonacci retracements, and my RSI settings, that I may always enter at the bottom and exit at the top. Amen."
  },
  {
    id: 'hodler',
    title: "Hodler's Prayer",
    text: "Oh Glorious Mother of Diamond Hands, let me never succumb to weak paper hands. Guard my seed phrase, strengthen my resolve, and remind me that one day the line shall go up forever. May my wallet survive bear markets, hacks, and exchange collapses, until the moon and beyond. Amen."
  },
  {
    id: 'chart',
    title: "Chart Mystic's Prayer",
    text: "Oh Oracle of Eternal Candles, Our Lady of Perpetual Profit, guide my eyes as I read the sacred indicators. Grant me the gift of vision to see wedges before they break, triangles before they tighten, and golden crosses before they shine. Deliver me from false signals, and sanctify my trading view with holy confluence. Amen."
  }
];

// 3D Candle Component
function CandlePreview({ imageUrl, message, isEncrypted, username }) {
  const { scene } = useGLTF('/models/singleCandleAnimatedFlame.glb');
  const candleRef = useRef();
  const defaultTexture = useTexture('/defaultAvatar.png');
  const [userTexture, setUserTexture] = useState(null);
  const [textTexture, setTextTexture] = useState(null);
  
  // Flip and enhance default texture
  useEffect(() => {
    if (defaultTexture) {
      defaultTexture.wrapS = THREE.ClampToEdgeWrapping;
      defaultTexture.wrapT = THREE.ClampToEdgeWrapping;
      defaultTexture.repeat.set(1, -1);
      defaultTexture.offset.set(0, 1);
      defaultTexture.minFilter = THREE.LinearMipMapLinearFilter;
      defaultTexture.magFilter = THREE.LinearFilter;
      defaultTexture.anisotropy = 16;
      defaultTexture.generateMipmaps = true;
      defaultTexture.needsUpdate = true;
    }
  }, [defaultTexture]);
  
  // Load user image as texture if provided
  useEffect(() => {
    // Clean up previous texture
    if (userTexture) {
      userTexture.dispose();
      setUserTexture(null);
    }
    
    if (imageUrl && imageUrl !== '/defaultAvatar.png') {
      console.log('Loading user texture from:', imageUrl.substring(0, 50) + '...');
      const loader = new THREE.TextureLoader();
      
      // Don't add timestamp to data URLs (base64 images)
      const finalUrl = imageUrl.startsWith('data:') 
        ? imageUrl 
        : `${imageUrl}${imageUrl.includes('?') ? '&' : '?'}t=${Date.now()}`;
      
      loader.load(
        finalUrl,
        (texture) => {
          // High quality texture settings
          texture.wrapS = THREE.ClampToEdgeWrapping;
          texture.wrapT = THREE.ClampToEdgeWrapping;
          texture.repeat.set(1, -1); // Flip vertically
          texture.offset.set(0, 1); // Adjust offset after flipping
          
          // Improve texture quality
          texture.minFilter = THREE.LinearMipMapLinearFilter;
          texture.magFilter = THREE.LinearFilter;
          texture.anisotropy = 16; // Maximum anisotropic filtering
          texture.generateMipmaps = true;
          texture.needsUpdate = true;
          
          setUserTexture(texture);
          console.log('User texture loaded successfully with high quality settings');
        },
        undefined,
        (error) => {
          console.error('Error loading texture:', error);
          setUserTexture(null);
        }
      );
    } else {
      setUserTexture(null);
    }
    
    // Cleanup function
    return () => {
      if (userTexture) {
        userTexture.dispose();
      }
    };
  }, [imageUrl]);
  
  // Store references to Label meshes
  const label1MeshRef = useRef(null);
  const label2MeshRef = useRef(null);
  
  // Find Label meshes once when scene loads
  useEffect(() => {
    if (scene) {
      // Reset refs first
      label1MeshRef.current = null;
      label2MeshRef.current = null;
      
      scene.traverse((child) => {
        if (child.isMesh) {
          if (child.name === 'Label1' || child.name.includes('Label1')) {
            label1MeshRef.current = child;
            console.log('Found Label1 mesh:', child.name);
          }
          if (child.name === 'Label2' || child.name.includes('Label2')) {
            label2MeshRef.current = child;
            console.log('Found Label2 mesh:', child.name);
          }
        }
      });
    }
  }, [scene]); // Re-find labels when scene changes
  
  // Create text texture for Label1
  useEffect(() => {
    if (!label1MeshRef.current) return;
    
    // Create canvas for text
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    
    // Enable better text rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // Fill white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add subtle border
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
    
    // Check if we have a message to display
    if (!message || !message.trim()) {
      // Show placeholder text when empty
      ctx.fillStyle = '#cccccc';
      ctx.font = 'italic 48px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Your message here', canvas.width / 2, canvas.height / 2);
    } else {
      // Add encryption header if encrypted
      let displayMessage = message;
      let headerHeight = 0;
      
      if (isEncrypted) {
        // Draw encryption header
        ctx.fillStyle = '#ff6600';
        ctx.font = 'bold 36px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('This prayer has been encrypted:', canvas.width / 2, 120);
        headerHeight = 160; // Space after header
      }
      
      // Configure text - black color with better rendering
      ctx.fillStyle = '#000000';
      // Adjust font size based on message length (scaled for higher res)
      const fontSize = displayMessage.length > 200 ? 40 : displayMessage.length > 100 ? 48 : 56;
      ctx.font = `bold ${fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Word wrap function
      const wrapText = (text, maxWidth) => {
        // For encrypted text (no spaces), break by character limit
        if (isEncrypted && !text.includes(' ')) {
          const lines = [];
          const charsPerLine = Math.floor(maxWidth / (fontSize * 0.6)); // Approximate char width
          
          for (let i = 0; i < text.length; i += charsPerLine) {
            lines.push(text.substring(i, i + charsPerLine));
          }
          
          return lines;
        }
        
        // Normal word wrapping for regular text
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';
        
        words.forEach(word => {
          const testLine = currentLine + (currentLine ? ' ' : '') + word;
          const metrics = ctx.measureText(testLine);
          
          if (metrics.width > maxWidth && currentLine) {
            lines.push(currentLine);
            currentLine = word;
          } else {
            currentLine = testLine;
          }
        });
        
        if (currentLine) {
          lines.push(currentLine);
        }
        
        return lines;
      };
      
      // Draw wrapped text with better quality
      const lines = wrapText(displayMessage, canvas.width - 120);  // Adjusted for higher res
      const lineHeight = displayMessage.length > 200 ? 60 : 80;  // Scaled for higher res
      const startY = headerHeight > 0 ? headerHeight + 60 : canvas.height / 2 - (lines.length - 1) * lineHeight / 2;
      
      // Add subtle shadow for better text quality
      ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
      ctx.shadowBlur = 2;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
      
      lines.forEach((line, index) => {
        ctx.fillText(line, canvas.width / 2, startY + index * lineHeight);
      });
    }
    
    // Create high-quality texture from canvas
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.repeat.set(-1, -1);  // Flip both X and Y for Label1
    texture.offset.set(1, 1);  // Adjust offset after flipping both axes
    texture.flipY = false;  // Ensure texture is not flipped vertically
    
    // Improve texture quality settings
    texture.minFilter = THREE.LinearMipMapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.anisotropy = 16;  // Maximum anisotropic filtering
    texture.generateMipmaps = true;
    texture.needsUpdate = true;
    
    setTextTexture(texture);
  }, [message, isEncrypted]); // Recreate texture when message or encryption changes
  
  // Apply text texture to Label1
  useEffect(() => {
    if (label1MeshRef.current && textTexture) {
      console.log('Applying text to Label1');
      
      if (label1MeshRef.current.material) {
        label1MeshRef.current.material.map = textTexture;
        label1MeshRef.current.material.needsUpdate = true;
      } else {
        label1MeshRef.current.material = new THREE.MeshStandardMaterial({
          map: textTexture,
          emissive: new THREE.Color(0xffffff),
          emissiveIntensity: 0.05,
          roughness: 0.9,
          metalness: 0,
        });
      }
    }
  }, [textTexture]);
  
  // Create combined texture with image and username for Label2
  useEffect(() => {
    if (label2MeshRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 1024;
      const ctx = canvas.getContext('2d');
      
      // Fill background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Function to draw image and username
      const drawImageWithName = (img) => {
        // Draw the image (leave space at bottom for name)
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
          ctx.font = 'bold 42px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          // Just the name, no prefix
          const nameText = username;
          const textY = imageHeight + (canvas.height - imageHeight) / 2;
          
          // Add text shadow for better readability
          ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
          ctx.shadowBlur = 4;
          ctx.shadowOffsetX = 2;
          ctx.shadowOffsetY = 2;
          
          ctx.fillText(nameText, canvas.width / 2, textY);
        }
        
        // Create texture from canvas
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.repeat.set(1, -1);
        texture.offset.set(0, 1);
        texture.minFilter = THREE.LinearMipMapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.anisotropy = 16;
        texture.generateMipmaps = true;
        texture.needsUpdate = true;
        
        // Apply texture to Label2
        if (label2MeshRef.current.material) {
          label2MeshRef.current.material.map = texture;
          label2MeshRef.current.material.needsUpdate = true;
        } else {
          label2MeshRef.current.material = new THREE.MeshStandardMaterial({
            map: texture,
            emissive: new THREE.Color(0xff6600),
            emissiveIntensity: 0.15,
            roughness: 0.7,
            metalness: 0.2,
            envMapIntensity: 0.5,
            side: THREE.FrontSide,
          });
        }
      };
      
      // Load and draw the appropriate image
      const img = new Image();
      img.onload = () => drawImageWithName(img);
      
      if (userTexture) {
        // Use user texture's image source
        img.src = userTexture.image.src;
      } else if (defaultTexture) {
        // Use default texture's image source
        img.src = defaultTexture.image.src;
      }
    }
  }, [userTexture, defaultTexture, username]);
  
  // Removed auto-rotation - user can control with OrbitControls
  
  return (
    <primitive 
      ref={candleRef}
      object={scene.clone()} 
      scale={[2, 2, 2]}
      position={[0, -2, 0]}
    />
  );
}

export default function CompactCandleModal({ isOpen, onClose, onCandleCreated }) {
  const [selectedPrayer, setSelectedPrayer] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    message: '',
    burnedAmount: 1000,
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isEncrypted, setIsEncrypted] = useState(false);
  const [encryptionPassword, setEncryptionPassword] = useState('');
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [scrambledDisplay, setScrambledDisplay] = useState('');
  const [canvasKey, setCanvasKey] = useState(0);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  
  // Helper function to format numbers with commas
  const formatNumberWithCommas = (num) => {
    if (!num && num !== 0) return '';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };
  
  // Helper function to parse formatted numbers
  const parseFormattedNumber = (str) => {
    if (!str) return 0;
    const cleaned = str.replace(/[^0-9]/g, '');
    return parseInt(cleaned) || 0;
  };
  
  // Handle amount input changes
  const handleAmountChange = (e) => {
    const rawValue = e.target.value;
    const numericValue = parseFormattedNumber(rawValue);
    
    // Limit to reasonable maximum (e.g., 999 trillion)
    if (numericValue <= 999999999999999) {
      setFormData(prev => ({
        ...prev,
        burnedAmount: numericValue || 1000
      }));
    }
  };
  
  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        username: '',
        message: '',
        burnedAmount: 1000,
      });
      setSelectedPrayer(null);
      setImageFile(null);
      setImagePreview(null);
      setError('');
      setIsSubmitting(false);
      setIsEncrypted(false);
      setEncryptionPassword('');
      setShowPasswordDialog(false);
      setScrambledDisplay('');
      // Force Canvas to recreate by changing key
      setCanvasKey(prev => prev + 1);
      
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Reset encryption state when message is manually changed
    if (name === 'message' && isEncrypted) {
      setIsEncrypted(false);
      setEncryptionPassword('');
      setScrambledDisplay('');
    }
  };

  const toggleEncryption = () => {
    if (!textareaRef.current) return;
    
    if (isEncrypted) {
      // Remove encryption
      gsap.to(textareaRef.current, {
        duration: 1.5,
        scrambleText: {
          text: formData.message,
          chars: 'upperAndLowerCase',
          revealDelay: 0.5,
          speed: 1,
        },
        onUpdate: function() {
          setScrambledDisplay(textareaRef.current.value);
        },
        onComplete: function() {
          setIsEncrypted(false);
          setEncryptionPassword('');
          setScrambledDisplay('');
        }
      });
    } else {
      // Show password dialog for encryption
      const currentMessage = formData.message;
      if (!currentMessage.trim()) return;
      
      setShowPasswordDialog(true);
    }
  };

  const handleEncryptWithPassword = () => {
    if (!encryptionPassword || encryptionPassword.length < 4) {
      setError('Password must be at least 4 characters');
      return;
    }
    
    const currentMessage = formData.message;
    const scrambled = generateScrambledDisplay(currentMessage.length);
    
    // Animate to scrambled text
    gsap.to(textareaRef.current, {
      duration: 1,
      scrambleText: {
        text: scrambled,
        chars: '@#$%&*!?^~◊†‡§¶∞≈Ω∆∑π',
        speed: 0.3,
      },
      onUpdate: function() {
        setScrambledDisplay(textareaRef.current.value);
      },
      onComplete: function() {
        setScrambledDisplay(scrambled);
        setIsEncrypted(true);
        setShowPasswordDialog(false);
      }
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image must be less than 5MB');
        return;
      }

      setImageFile(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      setError('');
    }
  };

  const uploadImage = async () => {
    if (!imageFile) return null;

    const timestamp = Date.now();
    const fileName = `candles/${timestamp}_${imageFile.name}`;
    const storageRef = ref(storage, fileName);
    
    const snapshot = await uploadBytes(storageRef, imageFile);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Don't submit if we're showing other dialogs
    if (showPasswordDialog) {
      return;
    }
    
    // Validate fields
    if (!formData.username.trim()) {
      setError('Please enter a dedication name');
      return;
    }

    if (!formData.message.trim()) {
      setError('Please enter a message or select a prayer');
      return;
    }
    
    // Show confirmation dialog instead of immediately saving
    setShowConfirmDialog(true);
  };
  
  const handleConfirmedSave = async () => {
    setShowConfirmDialog(false);

    setIsSubmitting(true);
    setError('');

    try {
      let imageUrl = null;
      if (imageFile) {
        imageUrl = await uploadImage();
      }

      let docData;
      
      if (isEncrypted && encryptionPassword) {
        // Encrypt the message before saving
        const encryptedData = await encryptMessage(formData.message, encryptionPassword);
        docData = {
          username: formData.username,
          encrypted: encryptedData.encrypted,
          salt: encryptedData.salt,
          iv: encryptedData.iv,
          isEncrypted: true,
          burnedAmount: parseInt(formData.burnedAmount) || 1,
          image: imageUrl,
          staked: false,
          createdAt: serverTimestamp()
        };
      } else {
        // Save unencrypted message
        docData = {
          username: formData.username,
          message: formData.message,
          burnedAmount: parseInt(formData.burnedAmount) || 1,
          image: imageUrl,
          staked: false,
          createdAt: serverTimestamp()
        };
      }

      const docRef = await addDoc(collection(db, 'results'), docData);

      if (onCandleCreated) {
        onCandleCreated({
          ...docData,
          id: docRef.id,
          createdAt: new Date()
        });
      }

      // Reset form
      setFormData({
        username: '',
        message: '',
        burnedAmount: 1000,
      });
      setImageFile(null);
      setImagePreview(null);
      
      onClose();
    } catch (err) {
      console.error('Error creating candle:', err);
      setError('Failed to create candle. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="compact-modal-overlay" onClick={(e) => {
      // Only close if clicking directly on overlay, not when dialogs are open
      if (showPasswordDialog || showConfirmDialog) {
        return; // Don't close if any dialog is open
      }
      // Optional: Ask for confirmation before closing if there's unsaved data
      if (formData.username.trim() || formData.message.trim() || imageFile) {
        if (window.confirm('Are you sure you want to close? Your candle data will be lost.')) {
          onClose();
        }
      } else {
        onClose();
      }
    }}>
      <div className="compact-modal-content" onClick={e => e.stopPropagation()}>
        <button className="compact-modal-close" onClick={onClose}>×</button>
        
        <div className="compact-modal-layout">
          {/* Left side - 3D Preview */}
          <div className="compact-candle-preview">
            <div className="preview-label">Your Candle Preview</div>
            <div className="canvas-container">
              <Canvas
                key={canvasKey}
                camera={{ position: [0, 2, 5], fov: 45 }}
                style={{ background: 'transparent' }}
                dpr={[1, 2]} // Higher pixel ratio for better quality
                gl={{
                  antialias: true,
                  alpha: true,
                  powerPreference: "high-performance",
                  preserveDrawingBuffer: true,
                }}
              >
                <ambientLight intensity={0.6} />
                <directionalLight 
                  position={[5, 5, 5]} 
                  intensity={0.8} 
                  castShadow 
                />
                <pointLight position={[0, 3, 2]} intensity={0.5} color="#ffaa00" />
                <spotLight
                  position={[-5, 10, 5]}
                  angle={0.3}
                  penumbra={1}
                  intensity={0.5}
                  castShadow
                />
                <Suspense fallback={null}>
                  <CandlePreview 
                    imageUrl={imagePreview || '/defaultAvatar.png'} 
                    message={isEncrypted ? scrambledDisplay : formData.message}
                    isEncrypted={isEncrypted}
                    username={formData.username}
                  />
                </Suspense>
                <OrbitControls
                  enablePan={true}
                  enableZoom={true}
                  minPolarAngle={Math.PI / 3}
                  maxPolarAngle={Math.PI / 2}
                  autoRotate={false}
                  zoomToCursor={true}
                />
              </Canvas>
            </div>
          </div>

          {/* Right side - Form */}
          <div className="compact-form-section">
            <h2>Get Lit with RL80</h2>
            
            <form onSubmit={handleSubmit}>
              <div className="compact-form-group">
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  onKeyDown={(e) => {
                    // Prevent Enter key from submitting form
                    if (e.key === 'Enter') {
                      e.preventDefault();
                    }
                  }}
                  placeholder="Name (on behalf of)"
                  maxLength={50}
                  required
                />
              </div>

              {/* Prayer Selector */}
              <div className="compact-prayer-selector">
                <label>Choose a prayer or write your own:</label>
                <div className="prayer-buttons">
                  {PRAYERS.map((prayer) => (
                    <button
                      key={prayer.id}
                      type="button"
                      className={`prayer-btn ${selectedPrayer === prayer.id ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedPrayer(prayer.id);
                        setFormData(prev => ({ ...prev, message: prayer.text }));
                      }}
                      title={prayer.text}
                    >
                      {prayer.title.split(' ')[0].replace("'s", '')}
                    </button>
                  ))}
                  <button
                    type="button"
                    className={`prayer-btn ${selectedPrayer === null ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedPrayer(null);
                      setFormData(prev => ({ ...prev, message: '' }));
                    }}
                  >
                    Custom
                  </button>
                </div>
              </div>

              <div className="compact-form-group message-group">
                <div className="message-input-wrapper">
                  <textarea
                    ref={textareaRef}
                    name="message"
                    value={formData.message}
                    onChange={(e) => {
                      handleInputChange(e);
                      // If user edits a pre-made prayer, mark as custom
                      if (selectedPrayer && PRAYERS.find(p => p.id === selectedPrayer)?.text !== e.target.value) {
                        setSelectedPrayer(null);
                      }
                    }}
                    placeholder={selectedPrayer ? "Edit the prayer or write your own..." : "Write a prayer, wish, dedication, or confession"}
                    rows={3}
                    maxLength={400}
                    required
                    disabled={isEncrypted}
                    onKeyDown={(e) => {
                      // Prevent Enter key from submitting form in textarea
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        // Allow Shift+Enter for new lines
                        if (e.shiftKey) {
                          return;
                        }
                      }
                    }}
                  />
                  <span className="compact-char-count">{formData.message.length}/400</span>
                </div>
                <div className="message-controls">
                  <div style={{ display: 'flex', flexDirection: 'column', marginRight: '10px' }}>
                    <label style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '4px' }}>
                      RL80 tokens to burn
                    </label>
                    <input
                      type="text"
                      name="burnedAmount"
                      value={formatNumberWithCommas(formData.burnedAmount)}
                      onChange={handleAmountChange}
                      onKeyDown={(e) => {
                        // Prevent Enter key from submitting form
                        if (e.key === 'Enter') {
                          e.preventDefault();
                        }
                      }}
                      placeholder="1,000"
                      className="amount-input"
                      style={{
                        padding: '8px 12px',
                        borderRadius: '4px',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        backgroundColor: 'rgba(0, 0, 0, 0.3)',
                        color: '#fff',
                        fontSize: '14px',
                        width: '140px'
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    className={`encrypt-button ${isEncrypted ? 'is-encrypted' : ''}`}
                    onClick={toggleEncryption}
                    disabled={!formData.message.trim()}
                    style={{ alignSelf: 'flex-end' }}
                  >
                    <span className="encrypt-text">{isEncrypted ? 'DECRYPT' : 'ENCRYPT?'}</span>
                  </button>
                  {isEncrypted && (
                    <div className="message-status" style={{ alignSelf: 'flex-end' }}>
                      <span className="encrypted-badge">ENCRYPTED</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="compact-form-group">
                <label className="compact-file-label" style={{
                  backgroundColor: imageFile ? 'rgba(0, 255, 0, 0.1)' : 'rgba(255, 102, 0, 0.1)',
                  border: imageFile ? '1px solid rgba(0, 255, 0, 0.3)' : '1px solid rgba(255, 102, 0, 0.3)',
                  cursor: 'pointer'
                }}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="compact-file-input"
                  />
                  <span style={{ 
                    color: imageFile ? '#00ff00' : '#ff6600',
                    fontWeight: imageFile ? 'normal' : 'bold'
                  }}>
                    {imageFile ? '✓ Image Added' : '📷 Add Image (Recommended)'}
                  </span>
                </label>
              </div>

              {/* Password Dialog for Encryption - moved outside confirmation dialog */}
              {showPasswordDialog && (
                <div className="encryption-password-dialog" onClick={(e) => e.stopPropagation()}>
                  <div className="password-dialog-content">
                    <h3>Set Encryption Password</h3>
                    <p>Others will need this password to read your message</p>
                    <input
                      type="password"
                      value={encryptionPassword}
                      onChange={(e) => setEncryptionPassword(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          e.stopPropagation();
                          if (encryptionPassword && encryptionPassword.length >= 4) {
                            handleEncryptWithPassword();
                          }
                        }
                      }}
                      placeholder="Enter password (min 4 characters)"
                      minLength={4}
                      autoFocus
                    />
                    <div className="password-dialog-actions">
                      <button
                        type="button"
                        onClick={() => {
                          setShowPasswordDialog(false);
                          setEncryptionPassword('');
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleEncryptWithPassword}
                        disabled={!encryptionPassword || encryptionPassword.length < 4}
                      >
                        Encrypt Message
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Confirmation Dialog - shown only when user clicks submit */}
              {showConfirmDialog && (
                <div className="confirmation-dialog-overlay" onClick={(e) => e.stopPropagation()}>
                  <div className="confirmation-dialog">
                    <h3> <span style={{
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
        </span> Ready to Light Your Candle?</h3>
                    <div className="confirmation-details">
                      <p><strong>Name:</strong> {formData.username}</p>
                      <p><strong>Amount:</strong> {formatNumberWithCommas(formData.burnedAmount)}</p>
                      <p><strong>Message:</strong> {formData.message.substring(0, 50)}{formData.message.length > 50 ? '...' : ''}</p>
                      {isEncrypted && <p className="encryption-notice">🔒 This message will be encrypted</p>}
                      <p style={{ 
                        color: imageFile ? 'inherit' : '#ff6600',
                        fontWeight: imageFile ? 'normal' : 'bold'
                      }}>
                        <strong>Image:</strong> {imageFile ? '✓ Attached' : '⚠️ No image attached (using default)'}
                      </p>
                    </div>
                    <p className="confirmation-warning">Once lit, your candle cannot be changed or removed.</p>
                    <div className="confirmation-actions">
                      <button
                        type="button"
                        onClick={() => setShowConfirmDialog(false)}
                        className="confirm-cancel"
                      >
                        Review More
                      </button>
                      <button
                        type="button"
                        onClick={handleConfirmedSave}
                        className="confirm-save"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? 'Lighting...' : 'Light Candle 🔥'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {error && <div className="compact-error">{error}</div>}

              <div className="compact-form-actions">
                <button 
                  type="button" 
                  onClick={onClose} 
                  className="compact-btn-cancel"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="compact-btn-submit"
                  disabled={isSubmitting || !formData.username.trim() || !formData.message.trim()}
                  title={!formData.username.trim() || !formData.message.trim() ? 'Please fill in all required fields' : 'Review and light your candle'}
                >
                  {isSubmitting ? (
                    <span>Creating...</span>
                  ) : (
                    <span>🕯️ Review & Light</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}