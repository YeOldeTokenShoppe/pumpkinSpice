'use client'

import NeuralNetwork from '@/components/NeuralNetwork'
import styles from './page.module.css'

export default function NeuralDemo() {
  return (
    <div className={styles.container}>
      {/* Full screen example with all controls */}
      <section className={styles.fullSection}>
        <h1 className={styles.title}>Neural Network Visualization</h1>
        <div className={styles.fullContainer}>
          <NeuralNetwork 
            showControls={true}
            showStarfield={true}
            initialTheme={0}
            initialFormation={0}
            initialDensity={100}
            autoRotate={true}
            enableInteraction={true}
          />
        </div>
      </section>

      {/* Example with custom styling and transparent background */}
      <section className={styles.transparentSection}>
        <h2 className={styles.sectionTitle}>Transparent Background Example</h2>
        <p className={styles.description}>
          This neural network component has a transparent background and can be placed over any content.
        </p>
        <div className={styles.transparentContainer}>
          <NeuralNetwork 
            showControls={false}
            showStarfield={false}
            initialTheme={1}
            initialFormation={1}
            initialDensity={70}
            autoRotate={true}
            enableInteraction={true}
            containerStyle={{ 
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none'
            }}
          />
          <div className={styles.content}>
            <h3>Content Behind Network</h3>
            <p>The neural network visualization is rendered on top of this content with a transparent background.</p>
          </div>
        </div>
      </section>

      {/* Minimal example */}
      <section className={styles.minimalSection}>
        <h2 className={styles.sectionTitle}>Minimal Configuration</h2>
        <div className={styles.minimalContainer}>
          <NeuralNetwork 
            showControls={false}
            showStarfield={false}
            initialTheme={2}
            initialFormation={2}
            initialDensity={50}
            autoRotate={true}
            enableInteraction={false}
          />
        </div>
      </section>
    </div>
  )
}