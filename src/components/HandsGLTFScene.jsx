'use client'
import { useRef, useState, useEffect, Suspense } from 'react'
import { createPortal } from 'react-dom'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, useGLTF, Box } from '@react-three/drei'
import * as THREE from 'three'
import { db } from '@/utilities/firebaseClient'
import { collection, query, getDocs, limit } from 'firebase/firestore'
import { m } from 'framer-motion'


function HandsModel({ mousePosition }) {
  const gltf = useGLTF('/models/hands.glb')
  const rightHandRef = useRef()
  const leftHandRef = useRef()
  const emoji1Ref = useRef()
  const emoji2Ref = useRef()
  const emoji3Ref = useRef()
  const emoji4Ref = useRef()
  const iconLikeRef = useRef()
  const iconLoveRef = useRef()
  const iconText1Ref = useRef()
  const iconText2Ref = useRef()
  const iconPlayRef = useRef()
  const iconStarRef = useRef()
  const candleLabel2Ref = useRef()
  const [randomUserImages, setRandomUserImages] = useState([])
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const { camera } = useThree()
  


  
  // Fetch random user images from Firestore
  useEffect(() => {
    const fetchRandomUserImages = async () => {
      try {
        const q = query(collection(db, 'results'), limit(50))
        const snapshot = await getDocs(q)
        
        const images = []
        snapshot.forEach((doc) => {
          const data = doc.data()
          if (data.image && data.image !== '/defaultAvatar.png' && data.image !== '') {
            images.push({
              id: doc.id,
              image: data.image,
              username: data.username || 'Anonymous',
              message: data.message || ''
            })
          }
        })
        
        console.log('Fetched user images for candle Label2:', images.length)
        if (images.length > 0) {
          setRandomUserImages(images)
          setCurrentImageIndex(Math.floor(Math.random() * images.length))
        }
      } catch (error) {
        console.error('Error fetching user images:', error)
      }
    }
    
    fetchRandomUserImages()
  }, [])
  
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
          child.traverse((subChild) => {
            if (subChild.name === 'Label2' || subChild.name === 'label2') {
              console.log('Found Label2 under VCANDLE001!')
              candleLabel2Ref.current = subChild
            }
          })
        }
        
        // Also check if Label2 is directly in the scene
        if ((child.name === 'Label2' || child.name === 'label2') && child.isMesh) {
          console.log('Found Label2 mesh directly!')
          if (!candleLabel2Ref.current) {
            candleLabel2Ref.current = child
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
        
        // Find icon objects
        if (child.name === 'Icon-like' || child.name === 'icon-like' || child.name === 'IconLike') {
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
      })
      

    }
  }, [gltf])

  
  // Apply random user image to candle Label2
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
        
        // Create or update material
        candleLabel2Ref.current.material = new THREE.MeshStandardMaterial({
          map: texture,
          side: THREE.DoubleSide,
          emissive: new THREE.Color(0xffffff),
          emissiveIntensity: 0.05,
          emissiveMap: texture,
          metalness: 0.1,
          roughness: 0.7
        })
        candleLabel2Ref.current.material.needsUpdate = true
        
        console.log('Texture applied to candle Label2')
      }
      
      img.onerror = () => {
        console.error('Failed to load image for Label2:', imageData.image)
      }
      
      img.src = imageData.image
    }
  }, [currentImageIndex, randomUserImages])

   // Update the useFrame in HandsModel to properly handle updates
useFrame((state) => {
  
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
  
  // Handle mouse movement for both hands
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
    
    // MUCH larger movement range - the hand will move across the entire viewport
    // mousePosition.x and .y range from -1 to 1, so multiply by larger values
const distanceFromCamera = camera.position.z - rightHandRef.current.position.z
const movementScale = distanceFromCamera * 0.5 // Scale based on distance

const targetX = original.x + (mousePosition.x * movementScale * 50)
const targetY = original.y + (mousePosition.y * movementScale * 80)

    
    // Optional: add some Z movement for depth effect
    const targetZ = original.z + (Math.abs(mousePosition.x) * 15)
    
    
    // Direct position update for immediate response
    rightHandRef.current.position.set(targetX, targetY, targetZ)
    
    // Optional: Reduce or remove rotation if you want pure translation
    // Comment these out if you want NO rotation
    rightHandRef.current.rotation.z = -mousePosition.x * 0.3  // Reduced rotation
    rightHandRef.current.rotation.x = mousePosition.y * 0.2   // Reduced rotation
    rightHandRef.current.rotation.y = mousePosition.x * 0.1   // Reduced rotation
  }
  
})


// Replace this part in your return statement
return (
  <>
    <primitive object={gltf.scene} scale={[0.5, 0.5, 0.5]}/>
  </>
)
}

function MouseTracker({ setMousePosition }) {
  const { pointer } = useThree() // Use pointer instead of deprecated mouse
  
  useFrame(() => {
    setMousePosition({
      x: pointer.x,
      y: pointer.y
    })
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
          <HandsModel mousePosition={mousePosition} />
        </Suspense>
        
        <MouseTracker setMousePosition={setMousePosition} />
        
        <OrbitControls 
          enableZoom={false}
          enablePan={false}
          maxPolarAngle={0}
          minPolarAngle={Math.PI / 2}
        />
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
    </div>
  )
}