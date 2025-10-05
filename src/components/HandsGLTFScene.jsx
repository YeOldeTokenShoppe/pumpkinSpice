'use client'
import { useRef, useState, useEffect, Suspense } from 'react'
import { createPortal } from 'react-dom'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, useGLTF, Box } from '@react-three/drei'
import * as THREE from 'three'
import Script from 'next/script'

// Load Twitter widgets script
if (typeof window !== 'undefined' && !window.twttr) {
  const script = document.createElement('script')
  script.async = true
  script.src = 'https://platform.twitter.com/widgets.js'
  document.head.appendChild(script)
}

function HandsModel({ mousePosition, canvasRef, onTweetClick }) {
  const gltf = useGLTF('/models/hands.glb')
  const rightHandRef = useRef()
  const phoneRef = useRef()
  const leftHandRef = useRef()
  const screenRef = useRef()
  const textureRef = useRef()
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
  const [screenData, setScreenData] = useState({ 
    position: [-0.3, -0.7, -0.3], 
    size: { width: 80, height: 120 } 
  })
  const [twitterLoaded, setTwitterLoaded] = useState(false)
  const [latestTweetData, setLatestTweetData] = useState(null)
  const [showTweetModal, setShowTweetModal] = useState(false)
  const { camera } = useThree()
  

  // Helper function for relative time
  function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000)
    
    let interval = seconds / 31536000
    if (interval > 1) return Math.floor(interval) + " years ago"
    
    interval = seconds / 2592000
    if (interval > 1) return Math.floor(interval) + " months ago"
    
    interval = seconds / 86400
    if (interval > 1) return Math.floor(interval) + " days ago"
    
    interval = seconds / 3600
    if (interval > 1) return Math.floor(interval) + " hours ago"
    
    interval = seconds / 60
    if (interval > 1) return Math.floor(interval) + " minutes ago"
    
    return Math.floor(seconds) + " seconds ago"
  }

  // Updated canvas rendering function with Twitter-like layout
  const updateCanvasTexture = () => {
    if (!canvasRef.current) return
    
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    
    // More phone-like proportions (Twitter mobile dimensions)
    canvas.width = 400
    canvas.height = 250
    
    // Twitter dark theme background
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    // Subtle border
    ctx.strokeStyle = '#333639'
    ctx.lineWidth = 1
    ctx.strokeRect(0, 0, canvas.width, canvas.height)
    
    if (latestTweetData && latestTweetData.latestTweet && !latestTweetData.error) {
      // Avatar circle placeholder
      ctx.fillStyle = '#1DA1F2'
      ctx.beginPath()
      ctx.arc(30, 35, 20, 0, 2 * Math.PI)
      ctx.fill()
      
      // User initial in avatar
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial'
      ctx.textAlign = 'center'
      const initial = (latestTweetData.name || latestTweetData.username || 'T')[0].toUpperCase()
      ctx.fillText(initial, 30, 42)
      ctx.textAlign = 'left'
      
      // Name and username on same line (more compact)
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial'
      const nameText = latestTweetData.name || 'Twitter User'
      ctx.fillText(nameText, 60, 30)
      
      // Username and timestamp on same line
      ctx.fillStyle = '#71767b'
      ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial'
      const usernameText = `@${latestTweetData.username}`
      ctx.fillText(usernameText, 60, 45)
      
      // Add timestamp next to username
      if (latestTweetData.createdAt) {
        const date = new Date(latestTweetData.createdAt)
        const timeAgo = getTimeAgo(date)
        const usernameWidth = ctx.measureText(usernameText).width
        ctx.fillText(` · ${timeAgo}`, 60 + usernameWidth, 45)
      }
      
      // Tweet text with proper spacing and line height
      ctx.fillStyle = '#ffffff'
      ctx.font = '15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial'
      
      const words = latestTweetData.latestTweet.split(' ')
      let line = ''
      let y = 75
      const maxWidth = canvas.width - 70 // Account for left margin
      const lineHeight = 20
      
      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' '
        const metrics = ctx.measureText(testLine)
        if (metrics.width > maxWidth && n > 0) {
          ctx.fillText(line, 60, y)
          line = words[n] + ' '
          y += lineHeight
        } else {
          line = testLine
        }
      }
      ctx.fillText(line, 60, y)
      
      // Tweet action icons (like, retweet, etc.) - simple dots
      const iconY = y + 30
      ctx.fillStyle = '#71767b'
      ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial'
      
      // Reply icon (placeholder)
      ctx.fillText('💬', 60, iconY)
      // Retweet icon
      ctx.fillText('🔄', 110, iconY)
      // Like icon  
      ctx.fillText('❤️', 160, iconY)
      // Share icon
      ctx.fillText('📤', 210, iconY)
    } else if (!twitterLoaded) {
      // Loading state
      ctx.fillStyle = '#1DA1F2'
      ctx.font = 'bold 24px Arial'
      ctx.textAlign = 'center'
      ctx.fillText('Loading Latest Tweet...', canvas.width / 2, canvas.height / 2)
      ctx.textAlign = 'left'
    } else {
      // Error state or no data - show clean blank phone screen
      // Just show the dark background with border, no text or content
      ctx.fillStyle = '#15202B'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }
    
    if (!textureRef.current) {
      textureRef.current = new THREE.CanvasTexture(canvas)
    } else {
      textureRef.current.needsUpdate = true
    }
  }
  
  // Log what we loaded
  useEffect(() => {
    // console.log('GLTF loaded:', gltf)
    if (gltf.scene) {
      // console.log('Scene found:', gltf.scene)
      
      // Calculate bounding box to see the size
      const box = new THREE.Box3().setFromObject(gltf.scene)
      const size = box.getSize(new THREE.Vector3())
      const center = box.getCenter(new THREE.Vector3())
      // console.log('Scene bounds:', { size, center })
      
      // Traverse the scene to find specific objects
      gltf.scene.traverse((child) => {
        // console.log('Found object:', child.name, 'Type:', child.type)
        
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
       // In the useEffect where you traverse the scene
if (child.name === 'phone' || child.name === 'Phone') {
  phoneRef.current = child
  console.log('Found phone:', child.name, 'Position:', child.position)
  
  // Find the screen mesh directly on the phone
  child.traverse((subChild) => {
    if (subChild.isMesh && (subChild.name.toLowerCase().includes('screen') || 
        subChild.name.toLowerCase().includes('display'))) {
      screenRef.current = subChild
      
      // Get the bounding box in world space
      const box = new THREE.Box3().setFromObject(subChild)
      const center = new THREE.Vector3()
      const size = new THREE.Vector3()
      box.getCenter(center)
      box.getSize(size)
      
      // Apply the scale from the primitive
      center.multiplyScalar(0.5)
      size.multiplyScalar(0.5)
      
      // console.log('Screen center:', center)
      // console.log('Screen size:', size)
      
      // Convert to screen units for HTML
      // Adjust these values based on testing
      setScreenData({
        position: [center.x, center.y, center.z - 0.1], // Slightly forward
        size: { 
          width: size.x * 150,  // Adjust multiplier as needed
          height: size.y * 150  // Adjust multiplier as needed
        }
      })
    }
  })
}
      })
      

    }
  }, [gltf])

  // Fetch latest tweet on mount
  useEffect(() => {
    console.log('Attempting to fetch latest tweet...')
    fetch('/api/latest-tweet')
      .then(res => {
        console.log('Response status:', res.status)
        if (!res.ok) {
          // For specific error handling based on status code
          if (res.status === 500) {
            console.warn('Twitter API temporarily unavailable (500 error)')
            return res.json().catch(() => ({ error: 'API temporarily unavailable' }))
          } else if (res.status === 503) {
            console.warn('Tweet data not available yet (503 error)')
            return res.json().catch(() => ({ error: 'Tweet data not available yet' }))
          } else if (res.status === 404) {
            console.warn('No tweet data found yet (404 error)')
            return { error: 'No tweet data available yet' }
          } else if (res.status === 429) {
            console.warn('Rate limit exceeded, will retry later')
            return { error: 'Rate limit exceeded' }
          }
          throw new Error(`HTTP error! status: ${res.status}`)
        }
        return res.json()
      })
      .then(data => {
        console.log('Tweet data received:', data)
        if (data && data.error) {
          console.warn('API returned error:', data.error)
          // Still mark as loaded, but show fallback content
          setLatestTweetData({ error: data.error })
        } else {
          setLatestTweetData(data)
        }
        setTwitterLoaded(true)
      })
      .catch(err => {
        console.error('Error fetching tweet:', err)
        // Set fallback data so the component shows something meaningful
        setLatestTweetData({ 
          error: 'Unable to load latest tweet',
          fallback: true 
        })
        setTwitterLoaded(true)
      })
  }, [])

  // Update texture when tweet data changes
  useEffect(() => {
    if (latestTweetData && canvasRef.current) {
      updateCanvasTexture()
    }
  }, [latestTweetData])

   // Update the useFrame in HandsModel to properly handle updates
useFrame((state) => {
  // Only update loading animation if NOT loaded
  if (!twitterLoaded && canvasRef.current && textureRef.current) {
    updateCanvasTexture()
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
    const targetZ = original.z + (Math.abs(mousePosition.x) * 5)
    
    
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
    
    {/* Screen mesh with canvas texture - Twitter-like proportions */}
    {textureRef.current && (
      <mesh 
        position={screenData.position}
        onClick={(e) => {
          e.stopPropagation()
          if (latestTweetData && latestTweetData.latestTweet && onTweetClick) {
            onTweetClick(latestTweetData)
          }
        }}
        onPointerOver={(e) => {
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={(e) => {
          document.body.style.cursor = 'auto'
        }}
      >
        <planeGeometry args={[1.2, 0.75]} />
        <meshBasicMaterial 
          map={textureRef.current}
          transparent={true}
          opacity={1}
          side={THREE.DoubleSide}
          depthWrite={true}
          depthTest={true}
        />
      </mesh>
    )}
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
  const [showTweetModal, setShowTweetModal] = useState(false)
  const [modalTweetData, setModalTweetData] = useState(null)
  const canvasRef = useRef()
  
  const handleTweetClick = (tweetData) => {
    console.log('Tweet clicked, showing modal with data:', tweetData)
    setModalTweetData(tweetData)
    setShowTweetModal(true)
  }
  
  const closeModal = () => {
    console.log('Closing modal...')
    setShowTweetModal(false)
    setModalTweetData(null)
  }
  
  return (
    <div style={{ 
      width: '100%', 
      height: '100%', 
      position: 'relative',
      overflow: 'hidden',
      pointerEvents: 'auto',
      isolation: 'isolate'
    }}>
      <Script 
        src="https://platform.twitter.com/widgets.js" 
        strategy="afterInteractive"
        onLoad={() => {
          // console.log('Twitter script loaded successfully')
        }}
        onError={() => {
          console.error('Failed to load Twitter script')
        }}
      />
      
      {/* Hidden canvas for rendering texture */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      
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
          <HandsModel 
            mousePosition={mousePosition} 
            canvasRef={canvasRef}
            onTweetClick={handleTweetClick}
          />
        </Suspense>
        
        <MouseTracker setMousePosition={setMousePosition} />
        
        <OrbitControls 
          enableZoom={false}
          enablePan={false}
          maxPolarAngle={Math.PI / 2}
          minPolarAngle={Math.PI / 3}
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
      
      {/* Tweet Modal - Rendered via Portal */}
      {showTweetModal && modalTweetData && typeof document !== 'undefined' && createPortal(
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999999,
            backdropFilter: 'blur(5px)',
            pointerEvents: 'auto'
          }}
          onClick={closeModal}
        >
          <div 
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e1e8ed',
              borderRadius: '16px',
              padding: '16px',
              maxWidth: '550px',
              width: 'fit-content',
              minWidth: '400px',
              maxHeight: '90vh',
              overflow: 'hidden',
              position: 'relative',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
              zIndex: 1000000,
              pointerEvents: 'auto',
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                // console.log('Close button clicked!')
                closeModal()
              }}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: '#f7f9fa',
                border: '1px solid #cfd9de',
                color: '#536471',
                fontSize: '20px',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
                zIndex: 10001,
                pointerEvents: 'auto'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#e1e8ed'
                e.target.style.transform = 'scale(1.1)'
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#f7f9fa'
                e.target.style.transform = 'scale(1)'
              }}
            >
              ×
            </button>
            
            {/* Real Twitter Embed using iframe */}
            {(() => {
              // Extract tweet ID from embed HTML
              let tweetId = null
              if (modalTweetData.embedHtml) {
                const tweetMatch = modalTweetData.embedHtml.match(/status\/(\d+)/)
                tweetId = tweetMatch ? tweetMatch[1] : null
              }
              
              return tweetId ? (
                <div style={{ 
                  width: '100%', 
                  display: 'flex', 
                  justifyContent: 'center',
                  alignItems: 'flex-start'
                }}>
                  <iframe
                    src={`https://platform.twitter.com/embed/Tweet.html?id=${tweetId}&theme=light&width=500&hide_thread=true`}
                    width="500"
                    height="320"
                    style={{
                      border: 'none',
                      borderRadius: '12px',
                      maxWidth: '100%',
                      overflow: 'hidden',
                      minHeight: '280px'
                    }}
                    allow="autoplay; camera; microphone; encrypted-media; geolocation;"
                    title="Twitter Tweet"
                  />
                </div>
              ) : modalTweetData.embedHtml ? (
                <div 
                  style={{ 
                    width: '100%',
                    maxHeight: '60vh',
                    overflow: 'auto',
                    border: '1px solid #e1e8ed',
                    borderRadius: '8px',
                    padding: '16px',
                    backgroundColor: '#ffffff'
                  }}
                  dangerouslySetInnerHTML={{ __html: modalTweetData.embedHtml }}
                />
              ) : (
                <div>
                {/* Fallback to custom styled version if no embed HTML */}
                <div style={{ display: 'flex', marginBottom: '12px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    backgroundColor: '#1DA1F2',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '12px'
                  }}>
                    <span style={{
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '20px'
                    }}>
                      {(modalTweetData.name || modalTweetData.username || 'T')[0].toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div style={{
                      color: '#ffffff',
                      fontWeight: 'bold',
                      fontSize: '16px',
                      marginBottom: '2px'
                    }}>
                      {modalTweetData.name || 'Twitter User'}
                    </div>
                    <div style={{
                      color: '#71767b',
                      fontSize: '14px'
                    }}>
                      @{modalTweetData.username}
                    </div>
                  </div>
                </div>
                
                <div style={{
                  color: '#ffffff',
                  fontSize: '20px',
                  lineHeight: '1.5',
                  marginBottom: '16px',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial'
                }}>
                  {modalTweetData.latestTweet}
                </div>
                
                <div style={{
                  color: '#71767b',
                  fontSize: '14px',
                  marginBottom: '16px'
                }}>
                  {new Date(modalTweetData.createdAt).toLocaleString()}
                </div>
              </div>
            )
            })()}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}