'use client'

import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import { OrbitControls } from '@react-three/drei'
import NeuralNetworkR3F from '@/components/NeuralNetworkR3F'
import styles from './page.module.css'

export default function NeuralPage() {
  return (
    <div className={styles.container}>
      <div className={styles.canvasWrapper}>
        <Canvas
          camera={{ position: [0, 0, 50], fov: 60 }}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance'
          }}
        >
          <Suspense fallback={null}>
            {/* Ambient light for general illumination */}
            <ambientLight intensity={0.5} />
            
            {/* Neural Network */}
            <NeuralNetworkR3F 
              theme={0}
              formation={0}
              density={80}
              position={[0, 0, 0]}
              scale={1}
              enableInteraction={true}
            />
            
            {/* Orbit controls for camera movement */}
            <OrbitControls 
              enableDamping
              dampingFactor={0.05}
              rotateSpeed={0.5}
              enablePan={false}
              minDistance={20}
              maxDistance={100}
            />
          </Suspense>
        </Canvas>
      </div>
      
      <div className={styles.content}>
        <h1 className={styles.title}>Neural Network Visualization</h1>
        <p className={styles.description}>
          Interactive 3D neural network with energy pulse effects
        </p>
        
        <div className={styles.controls}>
          <div className={styles.controlGroup}>
            <h3>Interaction</h3>
            <p>Click anywhere to send energy pulses through the network</p>
          </div>
          <div className={styles.controlGroup}>
            <h3>Navigation</h3>
            <p>Drag to rotate • Scroll to zoom</p>
          </div>
        </div>
      </div>
    </div>
  )
}