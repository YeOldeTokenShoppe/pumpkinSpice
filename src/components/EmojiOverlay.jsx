"use client";

import { Canvas } from '@react-three/fiber';
import { Suspense, useEffect, useState } from 'react';
import { useDetectGPU } from '@react-three/drei';
import { SwoopingAngelEmojiSimple, SwoopingDevilEmojiSimple } from '@/components/SwoopingEmojiSimple';

export default function EmojiOverlay({ scrollY }) {
  const [showChasingAngel, setShowChasingAngel] = useState(false);
  const [triggerDevilExit, setTriggerDevilExit] = useState(false);
  const [sequenceComplete, setSequenceComplete] = useState(false);
  
  // Better mobile detection - separate phones from tablets
  const [isMobilePhone, setIsMobilePhone] = useState(false);
  
  useEffect(() => {
    // console.log('[EmojiOverlay] Component mounted');
    // Check if it's a mobile phone (not tablet)
    const checkMobile = () => {
      const width = window.innerWidth;
      const isPhone = width < 768; // Phones typically < 768px, tablets >= 768px
      setIsMobilePhone(isPhone);
      // console.log('[EmojiOverlay] Device check - width:', width, 'isPhone:', isPhone);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  useEffect(() => {
    // console.log('[EmojiOverlay] showChasingAngel changed to:', showChasingAngel);
  }, [showChasingAngel]);
  
  // Reset chase scene when scrolling back up (only after sequence completes)
  useEffect(() => {
    // Reset only if scrolling far up AND sequence has completed
    if (scrollY < 5000 && sequenceComplete) {
      // console.log('[EmojiOverlay] Scrolled far back up after sequence complete, resetting');
      setShowChasingAngel(false);
      setTriggerDevilExit(false);
      setSequenceComplete(false);
    }
    // Don't reset if the chase sequence is in progress - let it complete
  }, [scrollY, sequenceComplete]);
  
  // Trigger devil exit after angel has been chasing for 2 seconds
  useEffect(() => {
    if (showChasingAngel) {
      // console.log('[EmojiOverlay] Angel should now be visible, starting timer for devil exit');
      const timer = setTimeout(() => {
        // console.log('[EmojiOverlay] Triggering devil exit after angel chase delay');
        setTriggerDevilExit(true);
        // Mark sequence as complete after a bit more time (for exit animations)
        setTimeout(() => {
          setSequenceComplete(true);
          // console.log('[EmojiOverlay] Chase sequence complete');
        }, 3000); // Give time for exit animations
      }, 2000); // Match the angel's chaseDelay
      return () => clearTimeout(timer);
    }
  }, [showChasingAngel]);
  // Detect GPU capabilities - this hook can be used directly
  const GPUTier = useDetectGPU();
  
  // Determine if we should use reduced quality based on GPU tier
  // Tier 0 = Low, 1 = Medium, 2 = High, 3 = Ultra
  const isLowEndDevice = GPUTier.tier < 2 || GPUTier.isMobile;
  // console.log('[EmojiOverlay] Rendering - GPU Tier:', GPUTier.tier, 'Mobile:', GPUTier.isMobile, 'isLowEndDevice:', isLowEndDevice);
  
  // Skip rendering on very low-end devices
  if (GPUTier.tier === 0) {
    // console.log('[EmojiOverlay] Skipping render due to low GPU tier');
    return null;
  }
  
  return (
    <div 
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none', // Click through to HTML below
        zIndex: 9999, // Above everything
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 20], fov: 75, near: 0.1, far: 100 }}
        gl={{
          alpha: true, // Transparent background
          antialias: !isLowEndDevice, // Disable antialiasing on low-end devices
          powerPreference: isLowEndDevice ? 'low-power' : 'high-performance',
          pixelRatio: isLowEndDevice ? 1 : window.devicePixelRatio,
        }}
        style={{ 
          background: 'transparent',
          pointerEvents: 'none' // Ensure canvas doesn't block clicks
        }}
        eventSource={null} // Disable Three.js event system
        eventPrefix="client"
        // onCreated={() => console.log('[EmojiOverlay] Canvas created')}
      >
        <ambientLight intensity={3} />
        <directionalLight position={[10, 10, 5]} intensity={2} />
        
        {/* Overlay angel emoji */}
        <SwoopingAngelEmojiSimple 
          id="overlay-angel-weave"
          scrollThreshold={4200} // After behind angel exits at 900px
          exitThreshold={800}  // Exit if scrolling back up
          forwardExitThreshold={4500}  // Exit forward at 2500px
          swoopFrom="right"
          finalPosition={isMobilePhone ? [3, 0, 5] : [7, 0, 5]} // Phone: closer to center | Desktop/Tablet: right side
          isMobile={isLowEndDevice}
          modelPath="/models/angelEmojiOverlay.glb"
        />
        
        <Suspense fallback={<group />}>
          {/* Devil that pops up from bottom near end of page */}
          <SwoopingDevilEmojiSimple 
            id="overlay-devil-end"
            scrollThreshold={6100}  // Near end of page
            exitThreshold={-100}  // Don't exit on scroll back - let sequence complete
            forwardExitThreshold={null}  // Will be chased away by angel
            chaseExitThreshold={null}  // Don't use scroll-based chase, use timer instead
            swoopFrom="bottom"
            finalPosition={isMobilePhone ? [4, -1, 1] : [10, -2, 1]} // Phone: more centered | Desktop/Tablet: right side
            isMobile={isLowEndDevice}
            modelPath="/models/devilEmojiOverlay.glb"
            hoverDuration={2}  // Hover for 2 seconds
            onHoverComplete={() => {
              // console.log('[EmojiOverlay] Devil hover complete, triggering angel - showChasingAngel will be true');
              setShowChasingAngel(true);
              // Force a re-render check
              setTimeout(() => {
                // console.log('[EmojiOverlay] showChasingAngel is now:', showChasingAngel);
              }, 100);
            }}
            triggerExit={triggerDevilExit}  // External trigger for chase exit
          />
          
          {/* Final angel that chases the devil - always rendered but controlled by appearImmediately */}
          <SwoopingAngelEmojiSimple 
            id="overlay-angel-chase"
            appearImmediately={showChasingAngel}  // Controls when it appears
            scrollThreshold={9999}  // High value so scroll won't trigger
            exitThreshold={-100}  // Won't exit on scroll back
            forwardExitThreshold={null}  // No forward exit
            swoopFrom="right"  // Enters from right
            finalPosition={isMobilePhone ? [-2, -1, 5] : [-8, -2, 5]} // Phone: closer to center | Desktop/Tablet: left side for chase
            isMobile={isLowEndDevice}
            modelPath="/models/angelEmojiChase.glb"  // New unique model for chasing
            chaseDelay={0.9}  // Wait 0.9 seconds in floating phase before starting chase
          />
        </Suspense>
      </Canvas>
    </div>
  );
}