"use client";

import React, { useEffect, useState } from "react";
import styled, { keyframes, createGlobalStyle } from "styled-components";

// Global styles for CSS custom properties
const GlobalStyles = createGlobalStyle`
  @property --r {
    syntax: "<percentage>";
    initial-value: 0%;
    inherits: false;
  }
  @property --g {
    syntax: "<percentage>";
    initial-value: 0%;
    inherits: false;
  }
`;

// Define the keyframes animations for r and g
const rAnimation = keyframes`
  to { --r: 100% }
`;

const gAnimation = keyframes`
  to { --g: 100% }
`;

// Levitation animation for the magic 8-ball - using CSS instead of styled-components
const levitateStyle = `
  @keyframes levitate {
    0%, 100% {
      transform: translateY(0) rotateZ(0deg);
    }
    25% {
      transform: translateY(-15px) rotateZ(1deg);
    }
    75% {
      transform: translateY(5px) rotateZ(-1deg);
    }
  }
`;

const FluidBackground = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #000; /* Add black background as fallback */
  border-radius: 0.5em; /* Match the parent border radius minus border width */
  
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: #000;
    z-index: 0;
  }

  &::after {
    --l: rgb(var(--r) var(--g) 0%),
      rgb(calc(100% - var(--r)) calc(100% - var(--g)) 0%);
    content: "";
    position: absolute;
    top: 50%;
    left: 50%;
    width: 200%;
    height: 200%;
    transform: translate(-50%, -50%);
    background: radial-gradient(var(--l)), linear-gradient(var(--l)),
      conic-gradient(at 0 100%, var(--l) 25%);
    background-blend-mode: difference;
    animation: ${rAnimation} 4.7s ease-in-out -1.93s infinite alternate,
      ${gAnimation} 4.3s ease-in-out -2.37s infinite alternate;
    filter: url(#smoke) invert(1) saturate(2);
    z-index: 1;
    transform-origin: center center;
    will-change: background; /* Only animate the background colors, not position */
  }
`;



const Numerology1 = ({ isMobile = false }) => {
  const [clientSideReady, setClientSideReady] = useState(false);
  const [internalIsMobile, setInternalIsMobile] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const isBrowser = typeof window !== "undefined";
  
  // Use prop if provided, otherwise detect internally
  const effectiveIsMobile = isMobile || internalIsMobile;




  // Set client-side ready flag and detect mobile when component mounts
  useEffect(() => {
    setClientSideReady(true);
    
    const checkMobile = () => {
      if (typeof window !== "undefined") {
        setInternalIsMobile(window.innerWidth <= 768);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  return (
    <>
      <GlobalStyles />
      <style>{levitateStyle}</style>
      {/* The fluid background and magic 80 ball combination */}
      <svg width="0" height="0" aria-hidden="true" style={{ position: 'fixed' }}>
                      <filter id="smoke" colorInterpolationFilters="sRGB">
                        <feTurbulence baseFrequency="0.00713" result="t" />
                        <feComponentTransfer>
                          <feFuncA type="discrete" tableValues="1" />
                        </feComponentTransfer>
                        <feGaussianBlur stdDeviation="5" result="i" />
                        <feBlend in="SourceGraphic" in2="t" mode="exclusion" />
                        <feDisplacementMap
                          in="i"
                          scale="180"
                          xChannelSelector="R"
                          yChannelSelector="G"
                        />
                      </filter>
      </svg>
      <div
                      style={{
                        position: "relative",
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        margin: '0 auto',
                        // border: 'solid 0.5em #c48901',
                        width: '100%',
                        // maxWidth: effectiveIsMobile ? '350px' : '450px',
                        aspectRatio: '1',
                        borderRadius: '1em',
                        transform: effectiveIsMobile ? 'scale(1.1)' : 'scale(1.3)',
                        transformOrigin: 'center center',
                      }}
                    >
                      
                      {/* Fluid background as the base layer */}
                      {/* <FluidBackground /> */}

                      {/* Magic 8 ball as an iframe */}
                      <div
                        style={{
                          position: "relative",
                          width: "100%",
                          height: "100%",
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          zIndex: "2",
                          background: "transparent",
                          borderRadius: "50%",
                          filter: "drop-shadow(0 0 20px rgba(138, 43, 226, 1)) drop-shadow(0 0 40px rgba(75, 0, 130, 0.8)) drop-shadow(0 0 60px rgba(138, 43, 226, 0.6))",
                          animation: "levitate 4s ease-in-out infinite",
                          transition: "transform 0.3s ease",
                          transform: isHovering ? "scale(1.05)" : "scale(1)",
                          cursor: "pointer",
                        }}
                        onMouseEnter={() => setIsHovering(true)}
                        onMouseLeave={() => setIsHovering(false)}
                      >
                        {clientSideReady && (
                          <iframe
                            src="/magic1.html"
                            style={{
                              width: "90%",
                              height: "90%",
                              border: "none",
                              background: "transparent",
                              borderRadius: "50%",
                     
                            }}
                            title="Magic 80 Ball"
                            frameBorder="0"
                            scrolling="no"
                            allowtransparency="true"
                          />
                        )}
                      </div>
                    </div>
                    </>
  ); 
                          }
export default Numerology1;