import React from 'react';
import styled, { keyframes, createGlobalStyle } from 'styled-components';

// CSS custom property for animation
const GlobalStyle = createGlobalStyle`
  @property --off { 
    syntax: '<number>'; 
    initial-value: 0; 
    inherits: false;
  }
`;

// Generate gradient list
const generateGradientList = (start = 0, range = 180, steps = 8) => {
  const unit = range / steps;
  let gradientList = [];
  
  for (let i = 0; i <= steps; i++) {
    gradientList.push(`HSL(calc(${start} + var(--off)), 85%, 57%)`);
    start += unit;
  }
  
  return gradientList.join(', ');
};

// Animations
const flowAnimation = keyframes`
  to { --off: 360 }
`;

const rotateAnimation = keyframes`
  from { transform: rotateZ(0deg); }
  to { transform: rotateZ(90deg); }
`;

// Styled components
const LoaderContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000;
  filter: drop-shadow(0.25em 0.25em 0.25em #000) 
          drop-shadow(0.25em 0.25em 0.5em #000);
  z-index: 9999;
`;

const InfinityShape = styled.div`
  --do: 12.5em;
  --ro: calc(0.5 * var(--do));
  --ri: calc(0.5 * var(--ro));
  
  display: flex;
  transform-style: preserve-3d;
  animation: ${rotateAnimation} 3s ease-in-out infinite alternate;
  
  &:before, &:after {
    margin: 0 calc(0.5 * (var(--ri) - var(--ro)));
    width: var(--do);
    height: var(--do);
    border-radius: 50%;
    transform: rotatex(1deg) rotate(90deg);
    box-shadow: inset 0 -0.375em rgba(255, 255, 255, 0.25);
    background: 
      radial-gradient(circle at 47% 43%, 
        transparent calc(var(--ro) + -1px), rgba(255, 255, 255, 0.32) var(--ro)), 
      radial-gradient(circle at 53% 43%, 
        transparent calc(var(--ro) + -1px), rgba(255, 255, 255, 0.32) var(--ro)), 
      radial-gradient(circle at calc(50% + 2px) 50%, 
        rgba(255, 255, 255, 0.83) calc(var(--ri) + -1px), 
        transparent calc(var(--ri) + 1px)), 
      conic-gradient(${generateGradientList(180, -180)});
    mask: radial-gradient(transparent calc(var(--ri) - 1px), #000 var(--ri));
    animation: ${flowAnimation} 2s linear infinite;
    content: '';
  }
  
  &:after {
    transform: rotatex(-1deg) rotate(-90deg);
    box-shadow: inset -0.375em 0 rgba(255, 255, 255, 0.25);
    background: 
      radial-gradient(circle at 100% calc(-1 * var(--ri)), 
        rgba(0, 0, 0, 0.75) var(--ro), transparent calc(2 * var(--ro))) 0 0 / 50% 100% no-repeat, 
      radial-gradient(circle at 50% calc(50% + 2px), 
        rgba(255, 255, 255, 0.43) calc(var(--ri) - 1px), 
        transparent calc(var(--ri) + 1px)), 
      conic-gradient(${generateGradientList(180, 180)});
  }
`;

const InfinityLoader = ({ loading = true }) => {
  if (!loading) return null;
  
  return (
    <>
      <GlobalStyle />
      <LoaderContainer>
        <InfinityShape />
      </LoaderContainer>
    </>
  );
};

export default InfinityLoader;