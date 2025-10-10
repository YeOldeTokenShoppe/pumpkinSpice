'use client'
import { useRef, useState, useEffect, Suspense, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, useGLTF, Box, useCursor } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'
import { db } from '@/utilities/firebaseClient'
import { collection, query, getDocs, limit, orderBy, onSnapshot } from 'firebase/firestore'
import { m } from 'framer-motion'


function HandsModel({ mousePosition, scrollY }) {
  const gltf = useGLTF('/models/hands2.glb')
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
  const [hasReachedSection, setHasReachedSection] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [clickFeedback, setClickFeedback] = useState(false)
  const [imageTransition, setImageTransition] = useState(false)
  const animationStartTime = useRef(null)
  const lastMousePosition = useRef({ x: 0, y: 0 })
  const mouseVelocity = useRef({ x: 0, y: 0 })
  const { camera } = useThree()

  // Function to advance to next image when clicking candle or label
  const handleImageAdvance = useCallback(() => {
    if (randomUserImages.length > 1) {
      // Trigger visual feedback
      setClickFeedback(true)
      setImageTransition(true)
      
      // Advance image
      setCurrentImageIndex((prevIndex) => 
        (prevIndex + 1) % randomUserImages.length
      )
      console.log('Image advanced by click interaction')
      
      // Reset feedback after animation
      setTimeout(() => setClickFeedback(false), 300)
      setTimeout(() => setImageTransition(false), 600)
    }
  }, [randomUserImages.length])
  


  
  // Fetch user images from Firestore with real-time updates
  useEffect(() => {
    try {
      // Query with createdAt ordering (newest first) and limit
      const q = query(
        collection(db, 'results'), 
        orderBy('createdAt', 'desc'),
        limit(50)
      )
      
      // Set up real-time listener
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const images = []
        snapshot.forEach((doc) => {
          const data = doc.data()
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
        
        console.log('Images updated from Firestore:', images.length, 'total images')
        if (images.length > 0) {
          setRandomUserImages(images)
          // Start with the newest image (index 0) when data updates
          setCurrentImageIndex(0)
        }
      }, (error) => {
        console.error('Error fetching user images:', error)
        // Fallback to one-time fetch if real-time fails
        fetchImagesFallback()
      })
      
      // Cleanup listener on unmount
      return () => unsubscribe()
    } catch (error) {
      console.error('Error setting up real-time listener:', error)
      // Fallback to one-time fetch
      fetchImagesFallback()
    }
  }, [])

  // Fallback function for one-time fetch
  const fetchImagesFallback = async () => {
    try {
      const q = query(
        collection(db, 'results'), 
        orderBy('createdAt', 'desc'),
        limit(50)
      )
      const snapshot = await getDocs(q)
      
      const images = []
      snapshot.forEach((doc) => {
        const data = doc.data()
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
        setCurrentImageIndex(0) // Start with newest
      }
    } catch (error) {
      console.error('Error in fallback fetch:', error)
    }
  }
  
  // Rotate through images periodically
  useEffect(() => {
    if (randomUserImages.length > 1) {
      const interval = setInterval(() => {
        setCurrentImageIndex((prevIndex) => 
          (prevIndex + 1) % randomUserImages.length
        )
      }, 5000) // Change image every 5 seconds
      
      return () => clearInterval(interval)
    }
  }, [randomUserImages])

  // Log what we loaded
  useEffect(() => {
    // console.log('GLTF loaded:', gltf)
    if (gltf.scene) {
      // console.log('Scene found:', gltf.scene)
      
      
      // Traverse the scene to find specific objects
      gltf.scene.traverse((child) => {
        // console.log('Found object:', child.name, 'Type:', child.type)
        
        // Look for VCANDLE001 and its Label2 child
        if (child.name === 'VCANDLE001' || child.name === 'VCandle001' || child.name === 'vcandle001') {
          console.log('Found VCANDLE001 candle object!')
          
          // Add click handler to the candle object
          child.userData.onClick = handleImageAdvance
          child.cursor = 'pointer'
          
          child.traverse((subChild) => {
            if (subChild.name === 'Label2' || subChild.name === 'label2') {
              console.log('Found Label2 under VCANDLE001!')
              candleLabel2Ref.current = subChild
              
              // Add click handler to Label2 as well
              subChild.userData.onClick = handleImageAdvance
              subChild.cursor = 'pointer'
            }
          })
        }
        
        // Also check if Label2 is directly in the scene
        if ((child.name === 'Label2' || child.name === 'label2') && child.isMesh) {
          console.log('Found Label2 mesh directly!')
          if (!candleLabel2Ref.current) {
            candleLabel2Ref.current = child
            
            // Add click handler to directly found Label2
            child.userData.onClick = handleImageAdvance
            child.cursor = 'pointer'
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
            console.log('Found Backdrop mesh, fixing transparency for bloom')
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

  
  // Apply random user image to candle Label2 with transition effect
  useEffect(() => {
    if (!candleLabel2Ref.current || randomUserImages.length === 0) return
    
    const imageData = randomUserImages[currentImageIndex]
    console.log('Applying image to candle Label2:', imageData)
    
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 512
    const ctx = canvas.getContext('2d')
    
    if (imageData && imageData.image) {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      
      img.onload = () => {
        // Draw image with 180 degree rotation and horizontal flip
        ctx.save()
        ctx.translate(canvas.width / 2, canvas.height / 2)
        ctx.rotate(Math.PI) // Rotate 180 degrees
        ctx.scale(-1, 1) // Flip horizontally (mirror on Y-axis)
        ctx.drawImage(img, -canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height)
        ctx.restore()
        
        // Add username overlay if available (rotated and flipped)
        if (imageData.username) {
          ctx.save()
          ctx.translate(canvas.width / 2, canvas.height / 2)
          ctx.rotate(Math.PI) // Rotate 180 degrees
          ctx.scale(-1, 1) // Flip horizontally to mirror the text
          
          // Add semi-transparent background for text at bottom (which is now top due to rotation)
          ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
          ctx.fillRect(-canvas.width / 2, canvas.height / 2 - 80, canvas.width, 80)
          
          // Draw username
          ctx.fillStyle = '#ffffff'
          ctx.font = 'bold 36px Arial'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          
          // Add text shadow for better readability
          ctx.shadowColor = 'rgba(0, 0, 0, 0.8)'
          ctx.shadowBlur = 4
          ctx.shadowOffsetX = 2
          ctx.shadowOffsetY = 2
          
          ctx.fillText(imageData.username, 0, canvas.height / 2 - 40)
          ctx.restore()
        }
        
        // Create texture and apply to mesh
        const texture = new THREE.CanvasTexture(canvas)
        texture.needsUpdate = true
        
        // Create or update material with transition effect
        const newMaterial = new THREE.MeshStandardMaterial({
          map: texture,
          side: THREE.DoubleSide,
          emissive: new THREE.Color(0xffffff),
          emissiveIntensity: imageTransition ? 0.2 : 0.05, // Brighten during transition
          emissiveMap: texture,
          metalness: 0.1,
          roughness: 0.7,
          transparent: true,
          opacity: imageTransition ? 0.8 : 1.0 // Slight fade during transition
        })
        
        candleLabel2Ref.current.material = newMaterial
        candleLabel2Ref.current.material.needsUpdate = true
        
        console.log('Texture applied to candle Label2')
      }
      
      img.onerror = () => {
        console.error('Failed to load image for Label2:', imageData.image)
      }
      
      img.src = imageData.image
    }
  }, [currentImageIndex, randomUserImages, imageTransition])

  // Track when user reaches the target scroll position
  useEffect(() => {
    const targetScroll = 4700 // Trigger slightly before 4950 to account for viewport
    
    if (scrollY >= targetScroll && !hasReachedSection) {
      setHasReachedSection(true)
      // Start animation after 2 second delay
      setTimeout(() => {
        animationStartTime.current = Date.now()
      }, 2000)
    }
  }, [scrollY, hasReachedSection])

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

   // Update the useFrame in HandsModel to properly handle updates
useFrame((state) => {
  // Animate rotation progress
  if (animationStartTime.current) {
    const elapsed = Date.now() - animationStartTime.current
    const duration = 2000 // 2 seconds for rotation animation
    const progress = Math.min(elapsed / duration, 1)
    
    // Use easing function for smooth animation
    const easedProgress = 1 - Math.pow(1 - progress, 3) // Cubic ease-out
    setRotationProgress(easedProgress)
  }
  
  // Add floating animation to emojis
  const time = state.clock.getElapsedTime()
  
  // Store initial positions for emojis
  if (emoji1Ref.current && !emoji1Ref.current.userData.initialY) {
    emoji1Ref.current.userData.initialY = emoji1Ref.current.position.y
  }
  if (emoji2Ref.current && !emoji2Ref.current.userData.initialY) {
    emoji2Ref.current.userData.initialY = emoji2Ref.current.position.y
  }
  if (emoji3Ref.current && !emoji3Ref.current.userData.initialY) {
    emoji3Ref.current.userData.initialY = emoji3Ref.current.position.y
  }
  if (emoji4Ref.current && !emoji4Ref.current.userData.initialY) {
    emoji4Ref.current.userData.initialY = emoji4Ref.current.position.y
  }
    if (emoji5Ref.current && !emoji5Ref.current.userData.initialY) {
    emoji5Ref.current.userData.initialY = emoji5Ref.current.position.y
  }
  
  // Store initial positions for icons
  if (iconLikeRef.current && !iconLikeRef.current.userData.initialY) {
    iconLikeRef.current.userData.initialY = iconLikeRef.current.position.y
  }
  if (iconLoveRef.current && !iconLoveRef.current.userData.initialY) {
    iconLoveRef.current.userData.initialY = iconLoveRef.current.position.y
  }
  if (iconText1Ref.current && !iconText1Ref.current.userData.initialY) {
    iconText1Ref.current.userData.initialY = iconText1Ref.current.position.y
  }
  if (iconText2Ref.current && !iconText2Ref.current.userData.initialY) {
    iconText2Ref.current.userData.initialY = iconText2Ref.current.position.y
  }
  if (iconPlayRef.current && !iconPlayRef.current.userData.initialY) {
    iconPlayRef.current.userData.initialY = iconPlayRef.current.position.y
  }
  if (iconStarRef.current && !iconStarRef.current.userData.initialY) {
    iconStarRef.current.userData.initialY = iconStarRef.current.position.y
  }
  
  // Apply floating animation with much more dramatic movement
  if (emoji1Ref.current) {
    // Store initial positions for all axes
    if (!emoji1Ref.current.userData.initialX) {
      emoji1Ref.current.userData.initialX = emoji1Ref.current.position.x
      emoji1Ref.current.userData.initialZ = emoji1Ref.current.position.z
    }
    
    // Much larger amplitude and multiple axes movement
    emoji1Ref.current.position.y = emoji1Ref.current.userData.initialY + Math.sin(time * 2) * 2.0
    emoji1Ref.current.position.x = emoji1Ref.current.userData.initialX + Math.cos(time * 1.5) * 1.0
    emoji1Ref.current.position.z = emoji1Ref.current.userData.initialZ + Math.sin(time * 1.2) * 0.8
    emoji1Ref.current.rotation.z = Math.sin(time * 1.5) * 0.3
    emoji1Ref.current.rotation.y = Math.cos(time * 1.8) * 0.2
  }
  
  if (emoji2Ref.current) {
    if (!emoji2Ref.current.userData.initialX) {
      emoji2Ref.current.userData.initialX = emoji2Ref.current.position.x
      emoji2Ref.current.userData.initialZ = emoji2Ref.current.position.z
    }
    
    emoji2Ref.current.position.y = emoji2Ref.current.userData.initialY + Math.sin(time * 2.5 + 1) * 1.8
    emoji2Ref.current.position.x = emoji2Ref.current.userData.initialX + Math.cos(time * 1.8 + 1) * 0.8
    emoji2Ref.current.position.z = emoji2Ref.current.userData.initialZ + Math.sin(time * 1.4 + 1) * 1.2
    emoji2Ref.current.rotation.z = Math.sin(time * 1.8 + 1) * 0.25
    emoji2Ref.current.rotation.x = Math.cos(time * 2.1 + 1) * 0.15
  }
  
  if (emoji3Ref.current) {
    if (!emoji3Ref.current.userData.initialX) {
      emoji3Ref.current.userData.initialX = emoji3Ref.current.position.x
      emoji3Ref.current.userData.initialZ = emoji3Ref.current.position.z
    }
    
    emoji3Ref.current.position.y = emoji3Ref.current.userData.initialY + Math.sin(time * 1.8 + 2) * 2.2
    emoji3Ref.current.position.x = emoji3Ref.current.userData.initialX + Math.cos(time * 1.6 + 2) * 1.2
    emoji3Ref.current.position.z = emoji3Ref.current.userData.initialZ + Math.sin(time * 1.1 + 2) * 0.9
    emoji3Ref.current.rotation.z = Math.sin(time * 2.2 + 2) * 0.4
    emoji3Ref.current.rotation.y = Math.cos(time * 1.7 + 2) * 0.25
  }
  
  if (emoji4Ref.current) {
    if (!emoji4Ref.current.userData.initialX) {
      emoji4Ref.current.userData.initialX = emoji4Ref.current.position.x
      emoji4Ref.current.userData.initialZ = emoji4Ref.current.position.z
    }
    
    emoji4Ref.current.position.y = emoji4Ref.current.userData.initialY + Math.sin(time * 2.3 + 3) * 1.9
    emoji4Ref.current.position.x = emoji4Ref.current.userData.initialX + Math.cos(time * 1.7 + 3) * 0.9
    emoji4Ref.current.position.z = emoji4Ref.current.userData.initialZ + Math.sin(time * 1.3 + 3) * 1.1
    emoji4Ref.current.rotation.z = Math.sin(time * 2.0 + 3) * 0.35
    emoji4Ref.current.rotation.x = Math.cos(time * 1.9 + 3) * 0.18
  }

  if (emoji5Ref.current) {
    if (!emoji5Ref.current.userData.initialX) {
      emoji5Ref.current.userData.initialX = emoji5Ref.current.position.x
      emoji5Ref.current.userData.initialZ = emoji5Ref.current.position.z
    }
    
    emoji5Ref.current.position.y = emoji5Ref.current.userData.initialY + Math.sin(time * 2.3 + 3) * 1.9
    emoji5Ref.current.position.x = emoji5Ref.current.userData.initialX + Math.cos(time * 1.7 + 3) * 0.9
    emoji5Ref.current.position.z = emoji5Ref.current.userData.initialZ + Math.sin(time * 1.3 + 3) * 1.1
    emoji5Ref.current.rotation.z = Math.sin(time * 2.0 + 3) * 0.35
    emoji5Ref.current.rotation.x = Math.cos(time * 1.9 + 3) * 0.18
  }
  
  // Icon animations with unique patterns
  if (iconLikeRef.current) {
    if (!iconLikeRef.current.userData.initialX) {
      iconLikeRef.current.userData.initialX = iconLikeRef.current.position.x
      iconLikeRef.current.userData.initialZ = iconLikeRef.current.position.z
    }
    
    iconLikeRef.current.position.y = iconLikeRef.current.userData.initialY + Math.sin(time * 3.0 + 4) * 1.5
    iconLikeRef.current.position.x = iconLikeRef.current.userData.initialX + Math.cos(time * 2.2 + 4) * 0.7
    iconLikeRef.current.position.z = iconLikeRef.current.userData.initialZ + Math.sin(time * 2.8 + 4) * 1.0
    iconLikeRef.current.rotation.z = Math.sin(time * 2.5 + 4) * 0.3
    iconLikeRef.current.rotation.y = Math.cos(time * 2.0 + 4) * 0.2
  }
  
  if (iconLoveRef.current) {
    if (!iconLoveRef.current.userData.initialX) {
      iconLoveRef.current.userData.initialX = iconLoveRef.current.position.x
      iconLoveRef.current.userData.initialZ = iconLoveRef.current.position.z
    }
    
    iconLoveRef.current.position.y = iconLoveRef.current.userData.initialY + Math.sin(time * 2.7 + 5) * 1.6
    iconLoveRef.current.position.x = iconLoveRef.current.userData.initialX + Math.cos(time * 1.9 + 5) * 0.8
    iconLoveRef.current.position.z = iconLoveRef.current.userData.initialZ + Math.sin(time * 2.4 + 5) * 0.9
    iconLoveRef.current.rotation.z = Math.sin(time * 2.1 + 5) * 0.25
    iconLoveRef.current.rotation.x = Math.cos(time * 2.6 + 5) * 0.15
  }
  
  if (iconText1Ref.current) {
    if (!iconText1Ref.current.userData.initialX) {
      iconText1Ref.current.userData.initialX = iconText1Ref.current.position.x
      iconText1Ref.current.userData.initialZ = iconText1Ref.current.position.z
    }
    
    iconText1Ref.current.position.y = iconText1Ref.current.userData.initialY + Math.sin(time * 2.4 + 6) * 1.7
    iconText1Ref.current.position.x = iconText1Ref.current.userData.initialX + Math.cos(time * 2.1 + 6) * 1.1
    iconText1Ref.current.position.z = iconText1Ref.current.userData.initialZ + Math.sin(time * 1.8 + 6) * 0.8
    iconText1Ref.current.rotation.z = Math.sin(time * 1.9 + 6) * 0.4
    iconText1Ref.current.rotation.y = Math.cos(time * 2.3 + 6) * 0.3
  }
  
  if (iconText2Ref.current) {
    if (!iconText2Ref.current.userData.initialX) {
      iconText2Ref.current.userData.initialX = iconText2Ref.current.position.x
      iconText2Ref.current.userData.initialZ = iconText2Ref.current.position.z
    }
    
    iconText2Ref.current.position.y = iconText2Ref.current.userData.initialY + Math.sin(time * 2.9 + 7) * 1.4
    iconText2Ref.current.position.x = iconText2Ref.current.userData.initialX + Math.cos(time * 2.5 + 7) * 0.9
    iconText2Ref.current.position.z = iconText2Ref.current.userData.initialZ + Math.sin(time * 2.0 + 7) * 1.2
    iconText2Ref.current.rotation.z = Math.sin(time * 2.8 + 7) * 0.35
    iconText2Ref.current.rotation.x = Math.cos(time * 1.8 + 7) * 0.2
  }
  
  if (iconPlayRef.current) {
    if (!iconPlayRef.current.userData.initialX) {
      iconPlayRef.current.userData.initialX = iconPlayRef.current.position.x
      iconPlayRef.current.userData.initialZ = iconPlayRef.current.position.z
    }
    
    iconPlayRef.current.position.y = iconPlayRef.current.userData.initialY + Math.sin(time * 3.2 + 8) * 1.3
    iconPlayRef.current.position.x = iconPlayRef.current.userData.initialX + Math.cos(time * 2.6 + 8) * 1.0
    iconPlayRef.current.position.z = iconPlayRef.current.userData.initialZ + Math.sin(time * 2.1 + 8) * 0.7
    iconPlayRef.current.rotation.z = Math.sin(time * 2.4 + 8) * 0.28
    iconPlayRef.current.rotation.y = Math.cos(time * 2.7 + 8) * 0.22
  }
  
  if (iconStarRef.current) {
    if (!iconStarRef.current.userData.initialX) {
      iconStarRef.current.userData.initialX = iconStarRef.current.position.x
      iconStarRef.current.userData.initialZ = iconStarRef.current.position.z
    }
    
    iconStarRef.current.position.y = iconStarRef.current.userData.initialY + Math.sin(time * 2.6 + 9) * 1.8
    iconStarRef.current.position.x = iconStarRef.current.userData.initialX + Math.cos(time * 2.3 + 9) * 0.8
    iconStarRef.current.position.z = iconStarRef.current.userData.initialZ + Math.sin(time * 1.9 + 9) * 1.3
    iconStarRef.current.rotation.z = Math.sin(time * 3.1 + 9) * 0.45
    iconStarRef.current.rotation.x = Math.cos(time * 2.2 + 9) * 0.25
  }
  
  // Add pulse effect to candle when clicked
  if (candleLabel2Ref.current && clickFeedback) {
    const pulseScale = 1.0 + Math.sin(time * 20) * 0.1
    candleLabel2Ref.current.scale.setScalar(pulseScale)
  } else if (candleLabel2Ref.current) {
    candleLabel2Ref.current.scale.setScalar(1.0)
  }
  
  // Optimized mouse movement with smoothing and velocity
  if (rightHandRef.current && mousePosition) {
    // Store the original center position only once
    if (!rightHandRef.current.userData.originalPosition) {
      rightHandRef.current.userData.originalPosition = {
        x: rightHandRef.current.position.x,
        y: rightHandRef.current.position.y,
        z: rightHandRef.current.position.z
      }
    }
    
    const original = rightHandRef.current.userData.originalPosition
    
    // Calculate velocity for smoother movement
    mouseVelocity.current.x = mousePosition.x - lastMousePosition.current.x
    mouseVelocity.current.y = mousePosition.y - lastMousePosition.current.y
    lastMousePosition.current = { ...mousePosition }
    
    // Optimized movement calculation
    const distanceFromCamera = camera.position.z - rightHandRef.current.position.z
    const movementScale = distanceFromCamera * 0.5
    
    // Use lerp for smoother movement
    const lerpFactor = 0.15 // Adjust for responsiveness vs smoothness
    const targetX = original.x + (mousePosition.x * movementScale * 50)
    const targetY = original.y + (mousePosition.y * movementScale * 80)
    const targetZ = original.z + (Math.abs(mousePosition.x) * 15)
    
    // Smooth interpolation
    rightHandRef.current.position.x += (targetX - rightHandRef.current.position.x) * lerpFactor
    rightHandRef.current.position.y += (targetY - rightHandRef.current.position.y) * lerpFactor
    rightHandRef.current.position.z += (targetZ - rightHandRef.current.position.z) * lerpFactor
    
    // Smoother rotation
    rightHandRef.current.rotation.z += (-mousePosition.x * 0.3 - rightHandRef.current.rotation.z) * lerpFactor
    rightHandRef.current.rotation.x += (mousePosition.y * 0.2 - rightHandRef.current.rotation.x) * lerpFactor
    rightHandRef.current.rotation.y += (mousePosition.x * 0.1 - rightHandRef.current.rotation.y) * lerpFactor
  }
  
})


// Track when user reaches the target scroll position
useEffect(() => {
  const targetScroll = 4700 // Trigger slightly before 4950 to account for viewport
  
  if (scrollY >= targetScroll && !hasReachedSection) {
    setHasReachedSection(true)
    // Start animation after 2 second delay
    setTimeout(() => {
      animationStartTime.current = Date.now()
    }, 2000)
  }
}, [scrollY, hasReachedSection])

// Animate rotation progress
useFrame(() => {
  if (animationStartTime.current) {
    const elapsed = Date.now() - animationStartTime.current
    const duration = 2000 // 2 seconds for rotation animation
    const progress = Math.min(elapsed / duration, 1)
    
    // Use easing function for smooth animation
    const easedProgress = 1 - Math.pow(1 - progress, 3) // Cubic ease-out
    setRotationProgress(easedProgress)
  }
})

// Memoized click handler to reduce re-renders
const handleClick = useCallback((event) => {
  // Stop propagation to prevent multiple handlers
  event.stopPropagation()
  
  // Get the clicked object
  const clickedObject = event.object
  
  // Check if the clicked object or any of its parents has a click handler
  let current = clickedObject
  while (current) {
    if (current.userData.onClick) {
      console.log('Clicked on:', current.name, 'triggering image advance')
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
    if (current.userData.onClick) {
      setHovered(true)
      break
    }
    current = current.parent
  }
}, [])

const handlePointerOut = useCallback(() => {
  setHovered(false)
}, [])

// Use cursor hook for pointer changes
useCursor(hovered)

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

function LoadingBox() {
  return (
    <Box args={[1, 1, 1]}>
      <meshStandardMaterial color="orange" />
    </Box>
  )
}

export default function HandsGLTFScene() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [scrollY, setScrollY] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const [showClickIndicator, setShowClickIndicator] = useState(false)
  
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
    <div style={{ 
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
        gl={{ alpha: true, antialias: true }}
      >
        <ambientLight intensity={1} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={1} />
        
        <Suspense fallback={<LoadingBox />}>
          <HandsModel mousePosition={mousePosition} scrollY={scrollY} />
        </Suspense>
        
        <MouseTracker setMousePosition={setMousePosition} />
        
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