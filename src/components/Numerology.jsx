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

const FluidBackground = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;

  &::after {
    --l: rgb(var(--r) var(--g) 0%),
      rgb(calc(100% - var(--r)) calc(100% - var(--g)) 0%);
    content: "";
    position: absolute;
    margin: -2em;
    inset: 0;
    background: radial-gradient(var(--l)), linear-gradient(var(--l)),
      conic-gradient(at 0 100%, var(--l) 25%);
    background-blend-mode: difference;
    clip-path: inset(3em round 1em);
    animation: ${rAnimation} 4.7s ease-in-out -1.93s infinite alternate,
      ${gAnimation} 4.3s ease-in-out -2.37s infinite alternate;
    filter: url(#smoke) invert(1) saturate(2);
    z-index: 0;
  }
`;



const Numerology = () => {
  const [clientSideReady, setClientSideReady] = useState(false);
  const isBrowser = typeof window !== "undefined";




  // Set client-side ready flag when component mounts

  useEffect(() => {
    setClientSideReady(true);
  }, []);

  return (
    <>
      <GlobalStyles />
      {/* The fluid background and magic 8 ball combination */}
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
                        width: "100%",
                        height: "100%",
                        placeself: 'center',
                        border: 'solid 1em #c48901',
                        width: '25em',
                        aspectratio: '1',
                        borderRadius: '3em',
                      }}
                    >
                      
                      {/* Fluid background as the base layer */}
                      <FluidBackground
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                        }}
                      />

                      {/* Magic 8 ball as an iframe */}
                      <div
                        style={{
                          position: "relative",
                          width: "100%",
                          height: "100%",
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          zIndex: "0",
                          background: "transparent",
                          borderRadius: "50%",

                        }}
                      >
                        {clientSideReady && (
                          <iframe
                            src="/magic.html"
                            style={{
                              width: "300px",
                              height: "300px",
                              border: "none",
                              background: "transparent",
                              borderRadius: "50%",
                            }}
                            title="Magic 8 Ball"
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
export default Numerology;