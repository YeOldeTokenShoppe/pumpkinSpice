import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import html2canvas from 'html2canvas';

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.);
  }
`;

const fragmentShader = `
  varying vec2 vUv;
  uniform float u_size;
  uniform float u_ratio;
  uniform float u_time;
  uniform sampler2D u_texture;

  float random (in vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233)))*43758.5453123);
  }
  
  float noise (in vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }
  
  float fbm (in vec2 st) {
    float value = 0.0;
    float amplitude = .5;
    float frequency = 0.;
    for (int i = 0; i < 4; i++) {
      value += amplitude * noise(st);
      st *= 2.;
      amplitude *= .5;
    }
    return value;
  }

  void main() {
    vec2 uv = vUv;
    uv.y /= u_ratio;

    vec4 base = texture2D(u_texture, vUv);
    float t = pow(3. * u_time, .9);

    float edges_mask = max(.4, pow(length(vUv - vec2(.5)), .5));
    float noise_mask = fbm(vec2(.01 * u_size * uv)) / edges_mask;
    noise_mask -= .06 * length(base.rgb);

    vec3 color = mix(base.rgb, vec3(0.), smoothstep(noise_mask - .15, noise_mask - .1, t));
    vec3 fire_color = fbm(6. * vUv + .1 * t) * vec3(6., 1.4, .0);
    color = mix(color, fire_color, smoothstep(noise_mask - .1, noise_mask - .05, t));
    color -= .3 * fbm(3. * vUv) * pow(t, 4.);

    float opacity = 1. - smoothstep(noise_mask - .01, noise_mask, t);

    gl_FragColor = vec4(color, opacity);
  }
`;

export default function BurningEffect({ elementRef, onComplete, isActive }) {
  const canvasRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const materialRef = useRef(null);
  const animationIdRef = useRef(null);
  const clockRef = useRef(null);

  useEffect(() => {
    if (!isActive || !elementRef?.current) return;

    const element = elementRef.current;
    
    // Use html2canvas as it handles complex elements better
    html2canvas(element, {
      allowTaint: true,
      useCORS: true,
      scale: 1,
      logging: false,
      backgroundColor: null,
      removeContainer: false
    }).then(canvas => {
      // Convert canvas to texture
      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;
      
      // Initialize burning effect with the texture
      initBurningEffect(texture, element);
    }).catch(error => {
      console.error('Failed to capture element:', error);
      // Fallback to CSS effect if capture fails
      handleCSSFallback(element);
    });

    return () => {
      // Cleanup
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
        rendererRef.current = null;
      }
      if (materialRef.current) {
        materialRef.current.dispose();
        materialRef.current = null;
      }
      // Remove canvas from DOM
      if (canvasRef.current && canvasRef.current.parentNode) {
        canvasRef.current.parentNode.removeChild(canvasRef.current);
      }
    };
  }, [isActive, elementRef]);

  const initBurningEffect = (texture, element) => {
    // Get element dimensions and position
    const rect = element.getBoundingClientRect();
    
    // Create canvas for WebGL
    const canvas = document.createElement('canvas');
    canvas.style.position = 'fixed';
    canvas.style.top = rect.top + 'px';
    canvas.style.left = rect.left + 'px';
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '99999';
    canvasRef.current = canvas;
    document.body.appendChild(canvas);

    // Initialize Three.js
    const renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      alpha: true,
      antialias: true
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(rect.width, rect.height);
    rendererRef.current = renderer;

    // Create scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Create orthographic camera
    const camera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0.1, 10);
    camera.position.z = 1;
    cameraRef.current = camera;

    // Initialize clock for animation timing
    clockRef.current = new THREE.Clock();

    // Create shader material with the burning effect
    const material = new THREE.ShaderMaterial({
      uniforms: {
        u_time: { value: 0 },
        u_ratio: { value: rect.width / rect.height },
        u_size: { value: Math.max(rect.width, rect.height) },
        u_texture: { value: texture }
      },
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      transparent: true,
      side: THREE.DoubleSide
    });
    materialRef.current = material;

    // Create plane geometry
    const geometry = new THREE.PlaneGeometry(1, 1);
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // Hide original element
    element.style.visibility = 'hidden';

    // Start animation
    animate();
  };

  const animate = () => {
    if (!materialRef.current || !rendererRef.current) return;

    // Update time uniform
    const deltaTime = clockRef.current.getDelta();
    materialRef.current.uniforms.u_time.value += deltaTime;

    // Render the scene
    rendererRef.current.render(sceneRef.current, cameraRef.current);

    // Check if animation is complete (after 2 seconds)
    if (materialRef.current.uniforms.u_time.value > 2.0) {
      // Don't show element again - let the modal close handler deal with visibility
      
      // Clean up canvas
      if (canvasRef.current && canvasRef.current.parentNode) {
        canvasRef.current.parentNode.removeChild(canvasRef.current);
      }
      
      // Call completion callback
      if (onComplete) {
        onComplete();
      }
      return;
    }

    // Continue animation
    animationIdRef.current = requestAnimationFrame(animate);
  };

  const handleCSSFallback = (element) => {
    // Simple CSS-based burning effect as fallback
    console.log('Using CSS fallback for burning effect');
    
    const clone = element.cloneNode(true);
    clone.style.position = 'fixed';
    const rect = element.getBoundingClientRect();
    clone.style.top = rect.top + 'px';
    clone.style.left = rect.left + 'px';
    clone.style.width = rect.width + 'px';
    clone.style.height = rect.height + 'px';
    clone.style.zIndex = '99999';
    clone.style.pointerEvents = 'none';
    clone.style.transformOrigin = 'center bottom';
    
    // Add burning animation
    clone.style.animation = `burnAway 2s ease-out forwards`;
    
    // Add keyframes if not already present
    if (!document.getElementById('burn-keyframes')) {
      const style = document.createElement('style');
      style.id = 'burn-keyframes';
      style.textContent = `
        @keyframes burnAway {
          0% {
            filter: brightness(1) contrast(1);
            transform: scale(1);
            opacity: 1;
          }
          25% {
            filter: brightness(1.5) contrast(1.2) hue-rotate(-20deg) saturate(2);
            transform: scale(1.02);
          }
          50% {
            filter: brightness(2) contrast(1.5) hue-rotate(-40deg) saturate(3) blur(1px);
            transform: scale(1.05) translateY(-5px);
          }
          75% {
            filter: brightness(0.8) contrast(2) hue-rotate(-60deg) saturate(4) blur(3px);
            transform: scale(0.98) translateY(10px);
            opacity: 0.5;
          }
          100% {
            filter: brightness(0) contrast(3) hue-rotate(-90deg) blur(10px);
            transform: scale(0.9) translateY(30px);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }
    
    document.body.appendChild(clone);
    element.style.visibility = 'hidden';
    
    // Clean up after animation
    setTimeout(() => {
      if (clone.parentNode) {
        clone.parentNode.removeChild(clone);
      }
      // Don't restore visibility - let the modal close handler deal with it
      if (onComplete) {
        onComplete();
      }
    }, 2000);
  };

  return null; // This component doesn't render anything itself
}