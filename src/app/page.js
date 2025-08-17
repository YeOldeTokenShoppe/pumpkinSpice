"use client";

import React, { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import SimpleLoader from '@/components/SimpleLoader';
import PalmTreeDrive from '@/components/PalmTreeDrive';


export default function Home() {
  
  const [isSceneLoading, setIsSceneLoading] = useState(true);
  const [isMobileView, setIsMobileView] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [is80sMode, setIs80sMode] = useState(false);

    // Detect if device is actually a phone (not tablet or desktop)
    const detectMobileDevice = useCallback(() => {
        // Get all the info for debugging
        const userAgent = navigator.userAgent;
        const lowerUA = userAgent.toLowerCase();
        
        // More comprehensive mobile detection
        const isIPhone = /iphone/i.test(lowerUA);
        const isIPad = /ipad/i.test(lowerUA);
        const isAndroid = /android/i.test(lowerUA);
        const hasMobileKeyword = /mobile/i.test(lowerUA);
        
        // Check screen properties
        const screenWidth = window.screen.width;
        const screenHeight = window.screen.height;
        const innerWidth = window.innerWidth;
        const innerHeight = window.innerHeight;
        const pixelRatio = window.devicePixelRatio || 1;
        
        // Physical screen size (accounting for pixel ratio)
        const physicalWidth = screenWidth / pixelRatio;
        const physicalHeight = screenHeight / pixelRatio;
        
        // Touch capability
        const hasTouch = 'ontouchstart' in window || 
                        navigator.maxTouchPoints > 0 || 
                        navigator.maxTouchPoints > 0;
        
        // Simple phone detection: iPhone or (Android + Mobile keyword)
        const isPhoneUA = isIPhone || (isAndroid && hasMobileKeyword);
        
        // Size check: viewport OR physical size small enough
        const hasPhoneSize = Math.min(innerWidth, innerHeight) < 600 || 
                            Math.min(physicalWidth, physicalHeight) < 400;
        
        // Final decision
        const isMobile = isPhoneUA && hasTouch && hasPhoneSize;
        
        
        return isMobile;
      }, []);

  // Track initial load - set to false after first scene load completes
  useEffect(() => {
    if (!isSceneLoading && isInitialLoad) {
      setIsInitialLoad(false);
    }
  }, [isSceneLoading, isInitialLoad]);

  return (
    <div style={{ width: '100vw', minHeight: '100vh', zIndex: '10000' }}>
      <style jsx global>{`
        @font-face {
          font-family: 'UnifrakturMaguntia';
          src: url('/fonts/UnifrakturMaguntia-Regular.ttf') format('truetype');
          font-weight: normal;
          font-style: normal;

        }
      `}</style>
         <div style={{
          position: "fixed",
          top: "20px", 
          left: "20px",
          zIndex: 10000, // Increased to ensure it stays on top
          borderRadius: "8px",
          padding: "10px",
          pointerEvents: "auto",
          opacity: isSceneLoading ? 0 : 1,
          transition: "opacity 0.5s ease-in-out"
        }}>
          <div 
            id="text"
            style={{
              position: "relative",
              fontFamily: "'UnifrakturMaguntia', serif",
              fontSize: isMobileView ? "3rem" : "4rem",
              color: "#ffffff",
              cursor: "pointer",
              zIndex: 10000,
            }}
          >
            <Link href="/gallery" style={{ textDecoration: 'none', color: 'inherit', display: 'inline-block' }}>
              RL80
            </Link>
            {Array.from({length: 100}).map((_, i) => {
              const index = i + 1;
              return (
                <div
                  key={index}
                  className="text__copy"
                  style={{
                    position: "absolute",
                    pointerEvents: "none",
                    zIndex: -1,
                    top: 0,
                    left: 0,
                    color: is80sMode 
                      ? `rgba(${201 - index * 2}, ${55 - index * 3}, ${256 - index * 2})` 
                      : `rgba(${255 - index * 2}, ${255 - index * 3}, ${255 - index * 2})`,

                    filter: "blur(0.1rem)",
                    transform: `translate(
                      ${index * 0.1}rem, 
                      ${index * 0.1}rem
                    ) scale(${1 + index * 0.01})`,
                    opacity: (1 / index) * 1.5,
                  }}
                >
                  RL80
                </div>
              );
            })}
          </div>
        </div>
        

      
      {/* Show AppLoader when scene is loading */}
      {isSceneLoading && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#000',
          zIndex: 9999
        }}>
          <SimpleLoader />

        </div>
      )}
      
      <PalmTreeDrive 
        onLoadingChange={setIsSceneLoading}
      />
    
    </div>
  );
}
