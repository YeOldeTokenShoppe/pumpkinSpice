'use client'
import { useRef, useState, useEffect, Suspense, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, useGLTF, Box, useCursor } from '@react-three/drei'

// Preload the model immediately when module loads
useGLTF.preload('/models/hands2.glb')
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'
import { db } from '@/utilities/firebaseClient'
import { collection, query, getDocs, limit, orderBy, onSnapshot } from 'firebase/firestore'
import { m } from 'framer-motion'


function HandsModel({ mousePosition, scrollY, onLoad, hasReachedSection }) {
  const gltf = useGLTF('/models/hands2.glb')
  const hasReportedLoad = useRef(false)
  const rightHandRef = useRef()
  const leftHandRef = useRef()
  const emoji1Ref = useRef()
  const emoji2Ref = useRef()
  const emoji3Ref = useRef()
  const emoji4Ref = useRef()
  const emoji5Ref = useRef()
  const iconLikeRef = useRef()
  const iconLoveRef = useRef()
  const iconText1Ref = useRef()
  const iconText2Ref = useRef()
  const iconPlayRef = useRef()
  const iconStarRef = useRef()
  const candleLabel2Ref = useRef()
  const [randomUserImages, setRandomUserImages] = useState([])
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [rotationProgress, setRotationProgress] = useState(0)
  const [hovered, setHovered] = useState(false)
  const [clickFeedback, setClickFeedback] = useState(false)
  const [imageTransition, setImageTransition] = useState(false)
  const animationStartTime = useRef(null)
  const lastMousePosition = useRef({ x: 0, y: 0 })
  const mouseVelocity = useRef({ x: 0, y: 0 })
  const randomUserImagesRef = useRef([])
  const currentImageIndexRef = useRef(0)
  const texturePoolRef = useRef([]) // Pool of textures to reuse
  const canvasPoolRef = useRef([]) // Pool of canvas elements to reuse
  const materialPoolRef = useRef([]) // Pool of materials to reuse
  const { camera } = useThree()

  // COMMENTED OUT: Image advance functionality for memory testing
  // const handleImageAdvance = useCallback(() => {
  //   try {
  //     console.log('handleImageAdvance called. Images available:', randomUserImagesRef.current.length)
      
  //     // Add safety checks
  //     if (!randomUserImagesRef.current || randomUserImagesRef.current.length === 0) {
  //       console.warn('No images available for advancing')
  //       return
  //     }
      
  //     if (randomUserImagesRef.current.length > 1 && !imageTransition) {
  //       // console.log('Current image index before:', currentImageIndexRef.current)
        
  //       // Trigger visual feedback
  //       setClickFeedback(true)
  //       setImageTransition(true)
        
  //       // Advance image with bounds checking
  //       setCurrentImageIndex((prevIndex) => {
  //         const newIndex = (prevIndex + 1) % randomUserImagesRef.current.length
  //         // console.log('Advancing from index', prevIndex, 'to', newIndex)
  //         currentImageIndexRef.current = newIndex
  //         return newIndex
  //       })
        
  //       // Reset feedback after animation (cleanup optimization)
  //       setTimeout(() => {
  //         setClickFeedback(false)
  //         setImageTransition(false)
  //       }, 600)
  //     }
  //   } catch (error) {
  //     console.error('Error in handleImageAdvance:', error)
  //   }
  // }, [imageTransition])
  


  
  // MINIMAL: Fetch one image only
  useEffect(() => {
    fetchImagesFallback()
  }, [])

  // COMMENTED OUT: Real-time Firestore listener for memory testing
  // useEffect(() => {
  //   let unsubscribe = null
  //   
  //   try {
  //     const q = query(
  //       collection(db, 'results'), 
  //       orderBy('createdAt', 'desc'),
  //       limit(1)
  //     )
  //     
  //     unsubscribe = onSnapshot(q, (snapshot) => {
  //       const images = []
  //       snapshot.forEach((doc) => {
  //         const data = doc.data()
  //         if (!data) {
  //           console.warn('Document has null data:', doc.id)
  //           return
  //         }
  //         if (data.image && data.image !== '/defaultAvatar.png' && data.image !== '') {
  //           images.push({
  //             id: doc.id,
  //             image: data.image,
  //             username: data.username || 'Anonymous',
  //             message: data.message || '',
  //             createdAt: data.createdAt
  //           })
  //         }
  //       })
  //       
  //       if (images.length > 0) {
  //         setRandomUserImages(images)
  //         randomUserImagesRef.current = images
  //         setCurrentImageIndex(0)
  //         currentImageIndexRef.current = 0
  //       } else {
  //         console.log('No valid images found in Firestore')
  //       }
  //     }, (error) => {
  //       console.error('Error fetching user images:', error)
  //       fetchImagesFallback()
  //     })
  //     
  //   } catch (error) {
  //     console.error('Error setting up real-time listener:', error)
  //     fetchImagesFallback()
  //   }
  //   
  //   return () => {
  //     if (unsubscribe) {
  //       unsubscribe()
  //     }
  //   }
  // }, [])

  // Fallback function for one-time fetch
  const fetchImagesFallback = async () => {
    try {
      const q = query(
        collection(db, 'results'), 
        orderBy('createdAt', 'desc'),
        limit(1) // Fallback also uses only 1 result
      )
      const snapshot = await getDocs(q)
      
      const images = []
      snapshot.forEach((doc) => {
        const data = doc.data()
        // Add null check for data in fallback too
        if (!data) {
          console.warn('Fallback: Document has null data:', doc.id)
          return
        }
        if (data.image && data.image !== '/defaultAvatar.png' && data.image !== '') {
          images.push({
            id: doc.id,
            image: data.image,
            username: data.username || 'Anonymous',
            message: data.message || '',
            createdAt: data.createdAt
          })
        }
      })
      
      if (images.length > 0) {
        setRandomUserImages(images)
        randomUserImagesRef.current = images
        setCurrentImageIndex(0) // Start with newest
        currentImageIndexRef.current = 0
      }
    } catch (error) {
      console.error('Error in fallback fetch:', error)
    }
  }
  
  // Remove automatic image rotation - only advance on candle clicks

  // Log what we loaded and report when loaded
  useEffect(() => {
    // console.log('GLTF loaded:', gltf)
    if (gltf.scene && !hasReportedLoad.current && onLoad) {
      hasReportedLoad.current = true;
      // console.log('[HandsModel] Model loaded, reporting to parent');
      onLoad();
    }
    
    if (gltf.scene) {
      // console.log('Scene found:', gltf.scene)
      
      
      // Traverse the scene to find specific objects
      gltf.scene.traverse((child) => {
        // console.log('Found object:', child.name, 'Type:', child.type)
        
        // Look for VCANDLE001 and its Label2 child
        if (child.name === 'VCANDLE001' || child.name === 'VCandle001' || child.name === 'vcandle001') {
          // console.log('Found VCANDLE001 candle object!')
          
          // COMMENTED OUT: Click handlers for memory testing
          // child.userData.onClick = handleImageAdvance
          // child.userData.clickable = true
          
          child.traverse((subChild) => {
            if (subChild.name === 'Label2' || subChild.name === 'label2') {
              // console.log('Found Label2 under VCANDLE001!')
              candleLabel2Ref.current = subChild
              
              // COMMENTED OUT: Click handler for memory testing
              // subChild.userData.onClick = handleImageAdvance
              // subChild.userData.clickable = true
            }
          })
        }
        
        // Also check if Label2 is directly in the scene
        if ((child.name === 'Label2' || child.name === 'label2') && child.isMesh) {
          // console.log('Found Label2 mesh directly!')
          if (!candleLabel2Ref.current) {
            candleLabel2Ref.current = child
            
            // COMMENTED OUT: Click handler for memory testing
            // child.userData.onClick = handleImageAdvance
            // child.userData.clickable = true
          }
        }
        
        // Log all objects that contain 'emoji' or 'icon' in the name (case insensitive)
        if (child.name.toLowerCase().includes('emoji')) {
          // console.log('🟡 EMOJI FOUND:', child.name, 'Type:', child.type, 'Position:', child.position)
        }
        if (child.name.toLowerCase().includes('icon')) {
          // console.log('🔵 ICON FOUND:', child.name, 'Type:', child.type, 'Position:', child.position)
        }
        if (child.name === 'hand-r' || child.name === 'hand_r' || child.name === 'Hand-R' || 
            child.name.toLowerCase().includes('hand') && child.name.toLowerCase().includes('r')) {
          rightHandRef.current = child
          // console.log('Found right hand:', child.name, 'Position:', child.position)
          // console.log('Right hand type:', child.type)
          // console.log('Right hand children:', child.children.length)
          // console.log('Right hand world position:', child.getWorldPosition(new THREE.Vector3()))
          
          // if (child.type === 'Object3D' && child.children.length > 0) {
          //   console.log('Right hand is a group, children:', child.children.map(c => ({name: c.name, type: c.type})))
          //   // Store reference to the group itself - we'll move the whole group
          //   console.log('Moving entire hand group for better control')
          // }
        }
        // if (child.name === 'hand-l' || child.name === 'hand_l' || child.name === 'Hand-L') {
        //   leftHandRef.current = child
        //   console.log('Found left hand:', child.name)
        // }
        
        // Find emoji objects with flexible matching
        if (child.name === 'Emoji-1' || child.name === 'emoji-1' || child.name === 'Emoji1') {
          emoji1Ref.current = child
          // console.log('✅ Found Emoji-1:', child.name, 'Position:', child.position)
        }
        if (child.name === 'Emoji-2' || child.name === 'emoji-2' || child.name === 'Emoji2') {
          emoji2Ref.current = child
          // console.log('✅ Found Emoji-2:', child.name, 'Position:', child.position)
        }
        if (child.name === 'Emoji-3' || child.name === 'emoji-3' || child.name === 'Emoji3') {
          emoji3Ref.current = child
          // console.log('✅ Found Emoji-3:', child.name, 'Position:', child.position)
        }
        if (child.name === 'Emoji-4' || child.name === 'emoji-4' || child.name === 'Emoji4') {
          emoji4Ref.current = child
          // console.log('✅ Found Emoji-4:', child.name, 'Position:', child.position)
        }
         if (child.name === 'Emoji-5' || child.name === 'emoji-5' || child.name === 'Emoji5') {
          emoji5Ref.current = child
          // console.log('✅ Found Emoji-5:', child.name, 'Position:', child.position)
        }
        
        // Find icon objects
        if (child.name === 'Icon-text3' || child.name === 'icon-like' || child.name === 'IconLike') {
          iconLikeRef.current = child
          // console.log('✅ Found Icon-like:', child.name, 'Position:', child.position)
        }
        if (child.name === 'Icon-love' || child.name === 'icon-love' || child.name === 'IconLove') {
          iconLoveRef.current = child
          // console.log('✅ Found Icon-love:', child.name, 'Position:', child.position)
        }
        if (child.name === 'Icon-text-1' || child.name === 'icon-text-1' || child.name === 'IconText1') {
          iconText1Ref.current = child
          // console.log('✅ Found Icon-text-1:', child.name, 'Position:', child.position)
        }
        if (child.name === 'Icon-text-2' || child.name === 'icon-text-2' || child.name === 'IconText2') {
          iconText2Ref.current = child
          // console.log('✅ Found Icon-text-2:', child.name, 'Position:', child.position)
        }
        if (child.name === 'Icon-play' || child.name === 'icon-play' || child.name === 'IconPlay') {
          iconPlayRef.current = child
          // console.log('✅ Found Icon-play:', child.name, 'Position:', child.position)
        }
        if (child.name === 'Icon-star' || child.name === 'icon-star' || child.name === 'IconStar') {
          iconStarRef.current = child
          // console.log('✅ Found Icon-star:', child.name, 'Position:', child.position)
        }
        
        // Fix Backdrop transparency issue with bloom
        if (child.name === 'Backdrop' || child.name === 'backdrop' || child.name.toLowerCase().includes('backdrop')) {
          if (child.isMesh && child.material) {
            // console.log('Found Backdrop mesh, fixing transparency for bloom')
            // Set the material to not be affected by post-processing
            child.material.toneMapped = false
            // Ensure proper transparency handling
            child.material.transparent = true
            child.material.alphaTest = 0.9 // Discard pixels below 50% opacity
            child.material.depthWrite = false // Prevent depth writing issues
            // Remove any emissive properties that might interact with bloom
            child.material.emissive = new THREE.Color(0x000000)
            child.material.emissiveIntensity = 0
            child.material.needsUpdate = true
          }
        }
      })
      

    }
  }, [gltf])

  
  // Safe texture management utility
  const disposeTexture = useCallback((texture) => {
    if (texture && texture.dispose && !texture.disposed) {
      try {
        texture.dispose()
        // Don't set properties to null on disposed textures
      } catch (error) {
        console.warn('Error disposing texture:', error)
      }
    }
  }, [])

  const disposeMaterial = useCallback((material) => {
    if (material) {
      if (material.map) disposeTexture(material.map)
      if (material.emissiveMap) disposeTexture(material.emissiveMap)
      if (material.normalMap) disposeTexture(material.normalMap)
      if (material.roughnessMap) disposeTexture(material.roughnessMap)
      material.dispose()
    }
  }, [disposeTexture])

  // SIMPLIFIED: Basic texture application (no complex disposal)
  useEffect(() => {
    if (!candleLabel2Ref.current || randomUserImages.length === 0) {
      return
    }
    
    const imageData = randomUserImages[0] // Only use first image
    if (!imageData?.image) return
    
    // Simple texture loading without complex memory management
    const canvas = document.createElement('canvas')
    canvas.width = 128
    canvas.height = 128
    const ctx = canvas.getContext('2d')
    
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      // Draw image rotated to fix orientation
      ctx.save()
      ctx.translate(64, 64) // Move to center
  
      ctx.drawImage(img, -64, -64, 128, 128) // Draw centered and rotated
      ctx.restore()
      
      // Add username overlay AFTER image rotation (so text stays normal)
      if (imageData.username) {
        // Add semi-transparent background for text at bottom
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
        ctx.fillRect(0, 128 - 25, 128, 25)
        
        // Draw username normally (not rotated)
        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 12px Arial'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        
        // Add text shadow for better readability
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)'
        ctx.shadowBlur = 2
        ctx.shadowOffsetX = 1
        ctx.shadowOffsetY = 1
        
        ctx.fillText(imageData.username, 64, 128 - 12)
      }
      
      const texture = new THREE.CanvasTexture(canvas)
      texture.needsUpdate = true
      texture.generateMipmaps = false
      texture.flipY = false // No additional flipping needed
      texture.wrapS = THREE.ClampToEdgeWrapping
      texture.wrapT = THREE.ClampToEdgeWrapping
      
      const material = new THREE.MeshBasicMaterial({
        map: texture,
        side: THREE.DoubleSide
      })
      
      candleLabel2Ref.current.material = material
    }
    img.src = imageData.image
  }, [randomUserImages])

  // COMMENTED OUT: Complex texture management
  /*
    const imageData = randomUserImages[currentImageIndex]
    
    // Add comprehensive null checking
    if (!imageData) {
      console.error('Image data is null at index:', currentImageIndex)
      return
    }
    
    if (!imageData.image) {
      console.error('Image data has no image property:', imageData)
      return
    }
    
    // console.log('Applying image to candle Label2:', imageData)
    
    // Store reference to previous material (don't dispose immediately)
    const previousMaterial = candleLabel2Ref.current.material
    
    // AGGRESSIVE: Clear pools if too large
    if (texturePoolRef.current.length > 5) {
      texturePoolRef.current.forEach(disposeTexture)
      texturePoolRef.current = []
    }
    if (canvasPoolRef.current.length > 3) {
      canvasPoolRef.current.forEach(canvas => {
        canvas.width = 1
        canvas.height = 1
      })
      canvasPoolRef.current = []
    }
    if (materialPoolRef.current.length > 3) {
      materialPoolRef.current.forEach(disposeMaterial)
      materialPoolRef.current = []
    }
    
    // Use even smaller canvas to reduce memory usage
    const canvas = document.createElement('canvas')
    canvas.width = 128 // Further reduced
    canvas.height = 128 // Further reduced
    const ctx = canvas.getContext('2d')
    
    if (imageData && imageData.image) {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      
      img.onload = () => {
        // Draw image normally (no rotation/flip)
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        
        // Add username overlay if available
        if (imageData.username) {
          // Add semi-transparent background for text at bottom
          ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
          ctx.fillRect(0, canvas.height - 25, canvas.width, 25)
          
          // Draw username with smaller font for 128px canvas
          ctx.fillStyle = '#ffffff'
          ctx.font = 'bold 12px Arial' // Much smaller for 128px canvas
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          
          // Add text shadow for better readability
          ctx.shadowColor = 'rgba(0, 0, 0, 0.8)'
          ctx.shadowBlur = 2
          ctx.shadowOffsetX = 1
          ctx.shadowOffsetY = 1
          
          ctx.fillText(imageData.username, canvas.width / 2, canvas.height - 12)
        }
        
        // AGGRESSIVE: Create minimal texture
        const texture = new THREE.CanvasTexture(canvas)
        texture.needsUpdate = true
        texture.generateMipmaps = false
        texture.minFilter = THREE.NearestFilter // Even less memory
        texture.magFilter = THREE.NearestFilter
        texture.wrapS = THREE.ClampToEdgeWrapping
        texture.wrapT = THREE.ClampToEdgeWrapping
        texture.flipY = false // Reduce processing
        
        // Add to texture pool for tracking
        texturePoolRef.current.push(texture)
        
        // AGGRESSIVE: Use basic material to reduce memory
        const newMaterial = new THREE.MeshBasicMaterial({
          map: texture,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: imageTransition ? 0.8 : 1.0
        })
        
        candleLabel2Ref.current.material = newMaterial
        candleLabel2Ref.current.material.needsUpdate = true
        
        // SAFER: Queue disposal instead of immediate disposal
        if (previousMaterial && previousMaterial !== newMaterial) {
          // Add to disposal queue with longer delay
          setTimeout(() => {
            try {
              if (previousMaterial && previousMaterial !== candleLabel2Ref.current?.material) {
                disposeMaterial(previousMaterial)
              }
            } catch (error) {
              console.warn('Error in delayed disposal:', error)
            }
          }, 1000) // Longer delay to ensure rendering is complete
        }
        
        // FORCE WebGL cleanup
        setTimeout(() => {
          canvas.width = 1
          canvas.height = 1
          ctx.clearRect(0, 0, 1, 1)
        }, 100)
        
        // console.log('Texture applied to candle Label2')
      }
      
      img.onerror = () => {
        console.error('Failed to load image for Label2:', imageData.image)
        // Clean up canvas even on error
        canvas.width = 1
        canvas.height = 1
        ctx.clearRect(0, 0, 1, 1)
      }
      
      img.src = imageData.image
    }
    
    // Aggressive cleanup function
    return () => {
      if (canvas) {
        canvas.width = 1
        canvas.height = 1
        ctx.clearRect(0, 0, 1, 1)
      }
      // Force garbage collection hint
      if (window.gc) window.gc()
    }
  */
  // }, [currentImageIndex, randomUserImages, imageTransition]) - DISABLED

  // Trigger rotation animation when component comes into view
  useEffect(() => {
    if (hasReachedSection && !animationStartTime.current) {
      console.log('🔄 Starting rotation animation now!')
      // Start animation after 2 second delay
      setTimeout(() => {
        animationStartTime.current = Date.now()
      }, 3500)
    }
  }, [hasReachedSection])

  // Memoized rotation calculation
  const calculateRotation = useMemo(() => {
    const initialRotation = -Math.PI * 0.8
    
    // If animation hasn't started yet, keep initial rotation
    if (!animationStartTime.current) {
      return initialRotation
    }
    
    // Interpolate from initial rotation to 0 based on animation progress
    const rotation = initialRotation * (1 - rotationProgress)
    
    return rotation
  }, [rotationProgress])

// MINIMAL: Only rotation animation useFrame
useFrame(() => {
  // Only animate rotation progress when triggered
  if (animationStartTime.current) {
    const elapsed = Date.now() - animationStartTime.current
    const duration = 2000
    const progress = Math.min(elapsed / duration, 1)
    const easedProgress = 1 - Math.pow(1 - progress, 3)
    setRotationProgress(easedProgress)
  }
})


// Removed duplicate useFrame and useEffect - functionality merged into main useFrame above

// Memoized click handler to reduce re-renders
const handleClick = useCallback((event) => {
  // Stop propagation to prevent multiple handlers
  event.stopPropagation()
  
  // Get the clicked object
  const clickedObject = event.object
  // console.log('Click detected on object:', clickedObject.name, 'Type:', clickedObject.type)
  
  // Check if the clicked object or any of its parents has a click handler
  let current = clickedObject
  while (current) {
    if (current.userData.onClick) {
      // console.log('Clicked on:', current.name, 'triggering image advance')
      current.userData.onClick()
      break
    }
    current = current.parent
  }
}, [])

// Memoized hover handlers
const handlePointerOver = useCallback((event) => {
  const hoveredObject = event.object
  let current = hoveredObject
  while (current) {
    if (current.userData.onClick || current.userData.clickable) {
      setHovered(true)
      document.body.style.cursor = 'pointer'
      break
    }
    current = current.parent
  }
}, [])

const handlePointerOut = useCallback(() => {
  setHovered(false)
  document.body.style.cursor = 'default'
}, [])

// Use cursor hook for pointer changes
useCursor(hovered)

// AGGRESSIVE cleanup on component unmount
useEffect(() => {
  return () => {
    // console.log('HandsGLTFScene unmounting - aggressive cleanup starting')
    
    // Dispose all textures in pool
    texturePoolRef.current.forEach(disposeTexture)
    texturePoolRef.current = []
    
    // Dispose candle material
    if (candleLabel2Ref.current && candleLabel2Ref.current.material) {
      disposeMaterial(candleLabel2Ref.current.material)
    }
    
    // Force browser garbage collection if available
    if (window.gc) {
      window.gc()
      // console.log('Forced garbage collection')
    }
    
    // Clear all object refs
    if (rightHandRef.current) rightHandRef.current = null
    if (leftHandRef.current) leftHandRef.current = null
    if (candleLabel2Ref.current) candleLabel2Ref.current = null
    randomUserImagesRef.current = []
    texturePoolRef.current = []
    
    // console.log('HandsGLTFScene cleanup complete')
  }
}, [disposeTexture, disposeMaterial])

// Replace this part in your return statement
return (
  <>
    <primitive 
      object={gltf.scene} 
      scale={[0.5, 0.5, 0.5]} 
      rotation={[0, calculateRotation, 0]}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    />
  </>
)
}

function MouseTracker({ setMousePosition }) {
  const { pointer } = useThree()
  const frameCount = useRef(0)
  
  useFrame(() => {
    // Throttle updates to every 2nd frame for better performance
    frameCount.current++
    if (frameCount.current % 2 === 0) {
      setMousePosition({
        x: pointer.x,
        y: pointer.y
      })
    }
  })
  
  return null
}

// Removed LoadingBox - no fallback cube needed

export default function HandsGLTFScene({ onLoadComplete }) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [scrollY, setScrollY] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const [showClickIndicator, setShowClickIndicator] = useState(false)
  const [modelLoaded, setModelLoaded] = useState(false)
  const containerRef = useRef(null)
  const [hasReachedSection, setHasReachedSection] = useState(false)
  
  // Track when component comes into view using Intersection Observer
  useEffect(() => {
    if (!containerRef.current) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        console.log('Intersection Observer triggered:', {
          isIntersecting: entry.isIntersecting,
          intersectionRatio: entry.intersectionRatio,
          hasReachedSection
        })
        
        if (entry.isIntersecting && !hasReachedSection) {
          console.log('🎯 HandsGLTFScene entered viewport! Starting 2-second delay...')
          setHasReachedSection(true)
        }
      },
      {
        threshold: 0.1, // Trigger when 10% of component is visible
        rootMargin: '0px 0px 0px 0px'
      }
    )

    observer.observe(containerRef.current)
    console.log('Intersection Observer set up for container')

    return () => {
      observer.disconnect()
    }
  }, [hasReachedSection])
  
  // COMMENTED OUT: Memory monitoring to reduce overhead
  // useEffect(() => {
  //   const logMemory = () => {
  //     if (performance.memory) {
  //       console.log('JS Memory:', Math.round(performance.memory.usedJSHeapSize / 1048576) + 'MB')
  //     }
  //   }
  //   const interval = setInterval(logMemory, 5000)
  //   return () => clearInterval(interval)
  // }, [])
  
  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Add scroll listener
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)
    }
    
    window.addEventListener('scroll', handleScroll)
    handleScroll() // Set initial scroll position
    
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])
  
  return (
    <div 
      ref={containerRef}
      style={{ 
        width: '100%', 
        height: '100%', 
        position: 'relative',
        overflow: 'hidden',
        pointerEvents: 'auto',
        isolation: 'isolate'
      }}>
      
      
      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        style={{ 
          width: '100%', 
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
          pointerEvents: 'auto'
        }}
        gl={{ 
          alpha: true, 
          antialias: false, // Reduced for memory optimization
          powerPreference: "high-performance",
          stencil: false,
          depth: true
        }}
        // dpr={Math.min(window.devicePixelRatio, 2)} // Limit DPR for memory
      >
        <ambientLight intensity={1} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={1} />
        
        <Suspense fallback={null}>
          <HandsModel 
            mousePosition={mousePosition} 
            scrollY={scrollY}
            hasReachedSection={hasReachedSection}
            onLoad={() => {
              setModelLoaded(true);
              if (onLoadComplete) onLoadComplete();
            }}
          />
        </Suspense>
        
        {/* DISABLED: MouseTracker for memory leak testing */}
        {/* <MouseTracker setMousePosition={setMousePosition} /> */}
        
        <OrbitControls 
          enableZoom={false}
          enablePan={false}
          maxPolarAngle={0}
          minPolarAngle={Math.PI / 2}
        />
        
        {/* Post-processing effects - disabled on mobile for performance */}
        {!isMobile && (
          <EffectComposer>
            <Bloom 
              intensity={0.2}
              luminanceThreshold={0.3}
              luminanceSmoothing={0.9}
              mipmapBlur
              radius={0.7}
            />
          </EffectComposer>
        )}
      </Canvas>
      
      {/* Frame Overlay */}
      {/* <img 
        src="/frame3.png" 
        alt="Decorative frame"
        style={{
          position: 'absolute',
          top: '-9%',
          left: '-5%',
          width: '115%',
          height: '122%',
          objectFit: 'contain',
          pointerEvents: 'none',
          zIndex: 10,
        }}
      /> */}
      
      {/* CSS for animations */}
      <style jsx>{`
        @keyframes pulse {
          0% {
            transform: scale(0.5);
            opacity: 1;
          }
          100% {
            transform: scale(2);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}