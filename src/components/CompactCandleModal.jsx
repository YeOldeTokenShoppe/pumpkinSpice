import React, { useState, Suspense, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, useTexture } from '@react-three/drei';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/utilities/firebaseClient';
import * as THREE from 'three';
import './CompactCandleModal.css';

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
function CandlePreview({ imageUrl, message }) {
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
  }, [scene]);
  
  // Create text texture for Label1
  useEffect(() => {
    if (message && label1MeshRef.current) {
      // Create canvas for text
      const canvas = document.createElement('canvas');
      canvas.width = 1024;  // Higher resolution for smoother text
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
      
      // Configure text - black color with better rendering
      ctx.fillStyle = '#000000';
      // Adjust font size based on message length (scaled for higher res)
      const fontSize = message.length > 200 ? 40 : message.length > 100 ? 48 : 56;
      ctx.font = `bold ${fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Word wrap function
      const wrapText = (text, maxWidth) => {
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
      const lines = wrapText(message, canvas.width - 120);  // Adjusted for higher res
      const lineHeight = message.length > 200 ? 60 : 80;  // Scaled for higher res
      const startY = canvas.height / 2 - (lines.length - 1) * lineHeight / 2;
      
      // Add subtle shadow for better text quality
      ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
      ctx.shadowBlur = 2;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
      
      lines.forEach((line, index) => {
        ctx.fillText(line, canvas.width / 2, startY + index * lineHeight);
      });
      
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
    }
  }, [message]);
  
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
  
  // Apply texture to Label2 when texture changes
  useEffect(() => {
    if (label2MeshRef.current) {
      const textureToUse = userTexture || defaultTexture;
      console.log('Updating Label2 texture, using:', userTexture ? 'user texture' : 'default texture');
      
      // Dispose of old texture from material if switching textures
      if (label2MeshRef.current.material && label2MeshRef.current.material.map && 
          label2MeshRef.current.material.map !== textureToUse) {
        // Don't dispose default texture as it's shared
        if (label2MeshRef.current.material.map !== defaultTexture) {
          label2MeshRef.current.material.map.dispose();
        }
      }
      
      // Update existing material's map instead of creating new material
      if (label2MeshRef.current.material) {
        label2MeshRef.current.material.map = textureToUse;
        label2MeshRef.current.material.needsUpdate = true;
      } else {
        // Create high quality material if it doesn't exist
        label2MeshRef.current.material = new THREE.MeshStandardMaterial({
          map: textureToUse,
          emissive: new THREE.Color(0xff6600),
          emissiveIntensity: 0.15,
          roughness: 0.7,
          metalness: 0.2,
          envMapIntensity: 0.5,
          side: THREE.FrontSide,
        });
      }
      
      // Ensure the geometry uses proper UV mapping
      if (label2MeshRef.current.geometry) {
        label2MeshRef.current.geometry.computeBoundingBox();
        label2MeshRef.current.geometry.computeBoundingSphere();
      }
    }
  }, [userTexture, defaultTexture]);
  
  // Gentle rotation animation
  useFrame((state, delta) => {
    if (candleRef.current) {
      candleRef.current.rotation.y += delta * 0.3;
    }
  });
  
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
    burnedAmount: 1,
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  
  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        username: '',
        message: '',
        burnedAmount: 1,
      });
      setSelectedPrayer(null);
      setImageFile(null);
      setImagePreview(null);
      setError('');
      setIsSubmitting(false);
      
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.username.trim()) {
      setError('Please enter your name');
      return;
    }

    if (!formData.message.trim()) {
      setError('Please enter a message');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      let imageUrl = null;
      if (imageFile) {
        imageUrl = await uploadImage();
      }

      const docData = {
        username: formData.username,
        message: formData.message,
        burnedAmount: parseInt(formData.burnedAmount) || 1,
        image: imageUrl,
        staked: false,
        createdAt: serverTimestamp()
      };

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
        burnedAmount: 1,
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
    <div className="compact-modal-overlay" onClick={onClose}>
      <div className="compact-modal-content" onClick={e => e.stopPropagation()}>
        <button className="compact-modal-close" onClick={onClose}>×</button>
        
        <div className="compact-modal-layout">
          {/* Left side - 3D Preview */}
          <div className="compact-candle-preview">
            <div className="preview-label">Your Candle Preview</div>
            <div className="canvas-container">
              <Canvas
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
                    message={formData.message}
                  />
                </Suspense>
                <OrbitControls
                  enablePan={false}
                  enableZoom={true}
                  minPolarAngle={Math.PI / 3}
                  maxPolarAngle={Math.PI / 2}
                  autoRotate={false}
                />
              </Canvas>
            </div>
          </div>

          {/* Right side - Form */}
          <div className="compact-form-section">
            <h2>Light Your Candle</h2>
            
            <form onSubmit={handleSubmit}>
              <div className="compact-form-group">
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="Your name"
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

              <div className="compact-form-group">
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={(e) => {
                    handleInputChange(e);
                    // If user edits a pre-made prayer, mark as custom
                    if (selectedPrayer && PRAYERS.find(p => p.id === selectedPrayer)?.text !== e.target.value) {
                      setSelectedPrayer(null);
                    }
                  }}
                  placeholder={selectedPrayer ? "Edit the prayer or write your own..." : "Write your prayer or message..."}
                  rows={3}
                  maxLength={400}
                  required
                />
                <span className="compact-char-count">{formData.message.length}/400</span>
              </div>

              <div className="compact-form-row">
                <div className="compact-form-group half">
                  <select
                    name="burnedAmount"
                    value={formData.burnedAmount}
                    onChange={handleInputChange}
                  >
                    <option value="1">Small (1)</option>
                    <option value="5">Medium (5)</option>
                    <option value="10">Large (10)</option>
                    <option value="25">Grand (25)</option>
                  </select>
                </div>

                <div className="compact-form-group half">
                  <label className="compact-file-label">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="compact-file-input"
                    />
                    <span>{imageFile ? '✓ Image' : '+ Image'}</span>
                  </label>
                </div>
              </div>

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
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span>Creating...</span>
                  ) : (
                    <span>🕯️ Light Candle</span>
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