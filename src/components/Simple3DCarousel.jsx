import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { TextureLoader } from 'three';
import * as THREE from 'three';

function CarouselImage({ texture, index, total, radius, groupRotation }) {
  const meshRef = useRef();
  const angle = (index * Math.PI * 2) / total;
  const x = Math.sin(angle) * radius;
  const z = Math.cos(angle) * radius;
  
  // Calculate dimensions based on texture aspect ratio
  const baseHeight = 3.5; // Fixed height
  let width = baseHeight; // Default to square if no texture info
  
  if (texture && texture.image) {
    const aspectRatio = texture.image.width / texture.image.height;
    width = baseHeight * aspectRatio;
    // Limit max width to prevent extremely wide images
    width = Math.min(width, 5);
  }

  useFrame(() => {
    if (meshRef.current) {
      // Make image face the camera
      meshRef.current.lookAt(0, 0, 0);
      
      // Calculate opacity based on position
      // The image at z = radius (front) should be fully opaque
      const currentAngle = angle + groupRotation;
      const normalizedAngle = ((currentAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      
      // Distance from front (0 or 2π position)
      let distanceFromFront = Math.min(
        Math.abs(normalizedAngle),
        Math.abs(normalizedAngle - Math.PI * 2)
      );
      
      // Convert to number of positions away
      const anglePerImage = (Math.PI * 2) / total;
      const positionsAway = Math.round(distanceFromFront / anglePerImage);
      
      // Set opacity based on distance
      let opacity = 1.0;
      if (positionsAway === 0) {
        opacity = 1.0; // Front image
      } else if (positionsAway === 1) {
        opacity = 0.6; // Adjacent images
      } else {
        opacity = 0.4; // Far images
      }
      
      meshRef.current.material.opacity = opacity;
    }
  });

  return (
    <mesh ref={meshRef} position={[x, 0, z]} scale={[-1, 1, 1]}>
      <planeGeometry args={[width, baseHeight]} />
      <meshBasicMaterial map={texture} transparent side={THREE.DoubleSide} />
    </mesh>
  );
}

function Carousel({ images, radius = 5, onIndexChange, autoRotateInterval = 4000 }) {
  const groupRef = useRef();
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [rotation, setRotation] = useState(0);
  const velocityRef = useRef(0);
  const [loadedTextures, setLoadedTextures] = useState([]);
  const lastIndexRef = useRef(0);
  const lastInteractionRef = useRef(Date.now());
  const targetRotationRef = useRef(0);
  const isAutoRotatingRef = useRef(false);
  
  // Use provided images or create colored placeholders
  const defaultImages = images.length > 0 ? images : [];
  
  useEffect(() => {
    // Create placeholder textures if no images provided
    if (defaultImages.length === 0) {
      const colors = ['#8e662b', '#d4af37', '#764ba2', '#667eea', '#f093fb'];
      const placeholderTextures = colors.map(color => {
        const canvas = document.createElement('canvas');
        canvas.width = 500;
        canvas.height = 500;
        const ctx = canvas.getContext('2d');
        
        // Create gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, 500);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, '#1a1a2e');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 500, 500);
        
        // Add text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`Slide ${colors.indexOf(color) + 1}`, 200, 300);
        
        return new THREE.CanvasTexture(canvas);
      });
      setLoadedTextures(placeholderTextures);
    } else {
      // Try to load provided images with fallback
      const loader = new THREE.TextureLoader();
      const texturePromises = defaultImages.map((url, index) => {
        return new Promise((resolve) => {
          loader.load(
            url,
            (texture) => resolve(texture),
            undefined,
            () => {
              // On error, create a placeholder
              const canvas = document.createElement('canvas');
              canvas.width = 400;
              canvas.height = 600;
              const ctx = canvas.getContext('2d');
              const color = ['#8e662b', '#d4af37', '#764ba2', '#667eea', '#f093fb'][index % 5];
              
              const gradient = ctx.createLinearGradient(0, 0, 0, 600);
              gradient.addColorStop(0, color);
              gradient.addColorStop(1, '#1a1a2e');
              ctx.fillStyle = gradient;
              ctx.fillRect(0, 0, 400, 600);
              
              ctx.fillStyle = '#ffffff';
              ctx.font = 'bold 48px Arial';
              ctx.textAlign = 'center';
              ctx.fillText(`Image ${index + 1}`, 200, 300);
              
              resolve(new THREE.CanvasTexture(canvas));
            }
          );
        });
      });
      
      Promise.all(texturePromises).then(setLoadedTextures);
    }
  }, []);

  // Handle mouse/touch drag
  const handlePointerDown = (e) => {
    setIsDragging(true);
    setStartX(e.clientX || e.touches?.[0]?.clientX || 0);
    lastInteractionRef.current = Date.now();
    isAutoRotatingRef.current = false;
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    const currentX = e.clientX || e.touches?.[0]?.clientX || 0;
    const diff = (currentX - startX) * 0.02; // Increased sensitivity
    velocityRef.current = diff;
    setStartX(currentX);
    lastInteractionRef.current = Date.now();
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    lastInteractionRef.current = Date.now();
  };

  useEffect(() => {
    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
    window.addEventListener('touchmove', handlePointerMove);
    window.addEventListener('touchend', handlePointerUp);
    
    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
    };
  }, [isDragging, startX]);

  useFrame(() => {
    if (groupRef.current) {
      const imagesCount = loadedTextures.length || 5;
      const anglePerImage = (Math.PI * 2) / imagesCount;
      const currentAngle = groupRef.current.rotation.y;
      
      // Check if we should auto-rotate
      const timeSinceInteraction = Date.now() - lastInteractionRef.current;
      const shouldAutoRotate = timeSinceInteraction > autoRotateInterval && 
                               !isDragging && 
                               Math.abs(velocityRef.current) < 0.001;
      
      if (shouldAutoRotate && !isAutoRotatingRef.current) {
        // Start auto-rotation to next image
        isAutoRotatingRef.current = true;
        const currentSnapIndex = Math.round(currentAngle / anglePerImage);
        targetRotationRef.current = (currentSnapIndex - 1) * anglePerImage; // Negative for next image
        lastInteractionRef.current = Date.now(); // Reset timer
      }
      
      // Handle auto-rotation animation
      if (isAutoRotatingRef.current) {
        const diff = targetRotationRef.current - currentAngle;
        if (Math.abs(diff) > 0.01) {
          groupRef.current.rotation.y += diff * 0.08; // Smooth auto-rotation
        } else {
          groupRef.current.rotation.y = targetRotationRef.current;
          isAutoRotatingRef.current = false;
        }
      } else {
        // Normal manual control
        groupRef.current.rotation.y += velocityRef.current;
        
        // Apply friction
        velocityRef.current *= 0.92;
        
        // Snap to nearest image when velocity is low
        if (!isDragging && Math.abs(velocityRef.current) < 0.005) {
          // Find nearest snap point
          const nearestSnapIndex = Math.round(currentAngle / anglePerImage);
          const targetAngle = nearestSnapIndex * anglePerImage;
          
          // Smoothly snap to target
          const diff = targetAngle - currentAngle;
          if (Math.abs(diff) > 0.001) {
            groupRef.current.rotation.y += diff * 0.1; // Smooth snapping
            velocityRef.current = 0; // Stop velocity during snap
          }
        }
      }
      
      // Calculate current index and notify if changed
      // Calculate which image is front-facing (normalize negative rotation)
      let currentIndex = Math.round(-currentAngle / anglePerImage) % imagesCount;
      if (currentIndex < 0) currentIndex += imagesCount;
      
      if (currentIndex !== lastIndexRef.current && onIndexChange) {
        lastIndexRef.current = currentIndex;
        onIndexChange(currentIndex);
      }
    }
  });

  // Don't render until textures are loaded
  if (loadedTextures.length === 0) {
    return null;
  }

  return (
    <group 
      ref={groupRef}
      onPointerDown={handlePointerDown}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      {loadedTextures.map((texture, index) => (
        <CarouselImage
          key={index}
          texture={texture}
          index={index}
          total={loadedTextures.length}
          radius={radius}
          groupRotation={groupRef.current?.rotation.y || 0}
        />
      ))}
    </group>
  );
}

export default function Simple3DCarousel({ images = [], captions = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  return (
    <div style={{ width: '100%', position: 'relative' }}>
      <div style={{ width: '100%', height: '50vh', position: 'relative', borderRadius: '12px', overflow: 'hidden' }}>
        <Canvas camera={{ position: [0, 0, 10], fov: 50 }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />
          <Carousel images={images} onIndexChange={setCurrentIndex} />
        </Canvas>
      </div>
      
      {/* Caption below image container */}
      {captions[currentIndex] && (
        <div style={{
          marginTop: '-40px',
          marginBottom: '2rem',
          textAlign: 'center',
          width: '100%'
        }}>
          <h3 style={{
            color: '#d4af37',
            margin: '0 0 4px 0',
            fontSize: '1.2rem',
            fontWeight: 'bold',
            textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
            letterSpacing: '0.5px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
          }}>
            {captions[currentIndex].title}
          </h3>
          <p style={{
            color: 'rgba(255, 255, 255, 0.9)',
            marginTop: '0',
            marginBottom: '1rem',
            fontSize: '0.85rem',
            lineHeight: 1.2,
            textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)'
          }}>
            {captions[currentIndex].description}
          </p>
        </div>
      )}
    </div>
  );
}