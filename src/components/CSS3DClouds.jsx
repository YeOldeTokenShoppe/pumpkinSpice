import React, { useEffect, useRef, memo, useMemo } from 'react';

const CSS3DClouds = memo(({ 
  cloudCount = 5, 
  particlesPerCloud = 10,
  position = { x: 0, y: 0, z: 0 },
  scrollY = 0,
  autoRotate = true,
  color = 'rgba(255, 192, 203, 0.8)' // Pink clouds
}) => {
  const worldRef = useRef(null);
  const layersRef = useRef([]);
  const frameRef = useRef(null);

  useEffect(() => {
    if (!worldRef.current) return;

    const world = worldRef.current;
    const layers = [];

    // Create clouds
    for (let i = 0; i < cloudCount; i++) {
      const cloudBase = document.createElement('div');
      cloudBase.className = 'css-cloud-base';
      
      const x = 512 - (Math.random() * 1024);
      const y = 512 - (Math.random() * 1024);
      const z = 512 - (Math.random() * 1024);
      
      cloudBase.style.transform = `translateX(${x}px) translateY(${y}px) translateZ(${z}px)`;
      
      // Create cloud particles
      for (let j = 0; j < particlesPerCloud; j++) {
        const particle = document.createElement('div');
        particle.className = 'css-cloud-particle';
        
        const px = 400 - (Math.random() * 800);
        const py = 400 - (Math.random() * 800);
        const pz = 200 - (Math.random() * 400);
        const angle = Math.random() * 360;
        const scale = 0.5 + Math.random() * 1.5;
        
        particle.dataset.x = px * 0.2;
        particle.dataset.y = py * 0.2;
        particle.dataset.z = pz;
        particle.dataset.angle = angle;
        particle.dataset.scale = scale;
        particle.dataset.speed = 0.1 * Math.random();
        
        particle.style.transform = `translateX(${px * 0.2}px) translateY(${py * 0.2}px) translateZ(${pz}px) rotateZ(${angle}deg) scale(${scale})`;
        
        cloudBase.appendChild(particle);
        layers.push(particle);
      }
      
      world.appendChild(cloudBase);
    }

    layersRef.current = layers;

    // Animate clouds if autoRotate is enabled
    if (autoRotate) {
      const animate = () => {
        layers.forEach(layer => {
          const currentAngle = parseFloat(layer.dataset.angle);
          const speed = parseFloat(layer.dataset.speed);
          const newAngle = currentAngle + speed;
          layer.dataset.angle = newAngle;
          
          const x = parseFloat(layer.dataset.x);
          const y = parseFloat(layer.dataset.y);
          const z = parseFloat(layer.dataset.z);
          const scale = parseFloat(layer.dataset.scale);
          
          layer.style.transform = `translateX(${x}px) translateY(${y}px) translateZ(${z}px) rotateZ(${newAngle}deg) scale(${scale})`;
        });
        
        frameRef.current = requestAnimationFrame(animate);
      };
      
      frameRef.current = requestAnimationFrame(animate);
    }

    // Cleanup
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
      while (world.firstChild) {
        world.removeChild(world.firstChild);
      }
    };
  }, [cloudCount, particlesPerCloud, autoRotate]); // Removed position and scrollY to prevent recreation

  // Memoize static styles to prevent recreation
  const baseStyles = useMemo(() => `
    .css-clouds-container {
      position: absolute;
      width: 100%;
      height: 100%;
      perspective: 1000px;
      pointer-events: none;
      overflow: visible;
    }
    
    .css-clouds-world {
      position: absolute;
      left: 50%;
      top: 50%;
      transform-style: preserve-3d;
      width: 1024px;
      height: 1024px;
    }
    
    .css-cloud-base {
      position: absolute;
      transform-style: preserve-3d;
      width: 100%;
      height: 100%;
    }
    
    .css-cloud-particle {
      position: absolute;
      width: 600px;
      height: 600px;
      background: radial-gradient(ellipse at center, 
        rgba(255, 192, 203, 0.7) 0%, 
        rgba(255, 192, 203, 0.3) 40%, 
        transparent 70%);
      border-radius: 50%;
      opacity: 0.9;
      filter: blur(8px);
      mix-blend-mode: screen;
      pointer-events: none;
    }
    
    @media (max-width: 768px) {
      .css-cloud-particle {
        width: 400px;
        height: 400px;
        filter: blur(6px);
      }
    }
  `, []); // Empty dependency array since styles never change

  // Dynamic transform for scroll
  const worldTransform = `translate(-50%, -50%) translateX(${position.x}px) translateY(${position.y + scrollY * 0.5}px) translateZ(${position.z}px) scale(2)`;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: baseStyles }} />
      <div className="css-clouds-container">
        <div 
          className="css-clouds-world" 
          ref={worldRef}
          style={{ transform: worldTransform }}
        />
      </div>
    </>
  );
});

CSS3DClouds.displayName = 'CSS3DClouds';

export default CSS3DClouds;