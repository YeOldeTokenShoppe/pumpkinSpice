import React, { useEffect, useRef, useMemo } from "react";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";

function HolographicStatue4({ 
  onLoad, 
  position = [0, -0.8, -0],  // Default position if not provided
  rotation = [0, Math.PI / 180, 0],  // Default rotation if not provided
  scale = [1.7, 1.7, 1.7],  // Default scale if not provided
  hover = false,  // Disable hover animation by default
  rotate = true  // Disable rotation animation by default
}) {
  // Detect if we're on a mobile/tablet device
  const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isTablet = /iPad|Android(?!.*Mobile)|Tablet/i.test(navigator.userAgent);
  const statueRef = useRef();
  const groupRef = useRef();
  const { scene } = useThree();
  const initialY = useRef(position[1]); // Use provided Y position as initial Y
  const mixerRef = useRef();
  const hasLoadedRef = useRef(false);
  const animatedMaterialsRef = useRef([]); // Cache materials that need animation

  // Use useMemo to prevent recreating the loader on every render
  const loader = useMemo(() => {
    const gltfLoader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath("/draco/");
    gltfLoader.setDRACOLoader(dracoLoader);
    return gltfLoader;
  }, []);

  // Use useMemo to prevent recreating the shader material on every render
  const holographicMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        precision: "lowp",
        uniforms: {
          uTime: { value: 0.0 },
          uColor: { value: new THREE.Color(0x00ffff) },
        },
        vertexShader: `
      uniform float uTime;
      varying vec3 vPosition;
      varying vec3 vNormal;
  
      vec2 random2D(vec2 st) {
        st = vec2(dot(st, vec2(127.1, 311.7)),
                 dot(st, vec2(269.5, 183.3)));
        return -1.0 + 2.0 * fract(sin(st) * 43758.5453123);
      }

      void main() {
        vec4 modelPosition = modelMatrix * vec4(position, 1.0);

        float glitchTime = uTime - modelPosition.y;
        float glitchStrength = sin(glitchTime) + sin(glitchTime * 3.45) + sin(glitchTime * 8.76) * 1.1;
        glitchStrength /= 5.0;
        glitchStrength = smoothstep(0.3, 1.0, glitchStrength);
        glitchStrength *= 0.025; //adjust this for the vertical movement
        modelPosition.x += (random2D(modelPosition.xz + uTime).x - 0.5) * glitchStrength;
        modelPosition.z += (random2D(modelPosition.zx + uTime).x - 0.5) * glitchStrength;

        gl_Position = projectionMatrix * viewMatrix * modelPosition;

        vec4 modelNormal = modelMatrix * vec4(normal, 0.0);
        vPosition = modelPosition.xyz;
        vNormal = modelNormal.xyz;
      }
    `,
        fragmentShader: `
      uniform vec3 uColor;
      uniform float uTime;
      varying vec3 vPosition;
      varying vec3 vNormal;

      void main() {
        vec3 normal = normalize(vNormal);
        if(!gl_FrontFacing)
            normal *= -1.0;

        float stripes = mod((vPosition.y - uTime * 0.02) * 14.0, 1.0);
        stripes = pow(stripes, 3.0);

        vec3 viewDirection = normalize(vPosition - cameraPosition);
        float fresnel = dot(viewDirection, normal) + 1.0;
        fresnel = pow(fresnel, 1.2);

        float falloff = smoothstep(0.8, 0.2, fresnel);

        float holographic = stripes * fresnel;
        holographic += fresnel * 2.25;
        holographic *= falloff;

        gl_FragColor = vec4(uColor, holographic);
      }
    `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: true,
        depthTest: true, 
        side: THREE.FrontSide,
      }),
    []
  );

  // Create a special shader for heart objects with enhanced glow
  const heartHolographicMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        precision: "lowp",
        uniforms: {
          uTime: { value: 0.0 },
          uColor: { value: new THREE.Color(0xff69b4) }, // Hot pink color for hearts
          uGlowIntensity: { value: 2.5 },
        },
        vertexShader: `
      uniform float uTime;
      varying vec3 vPosition;
      varying vec3 vNormal;
  
      vec2 random2D(vec2 st) {
        st = vec2(dot(st, vec2(127.1, 311.7)),
                 dot(st, vec2(269.5, 183.3)));
        return -1.0 + 2.0 * fract(sin(st) * 43758.5453123);
      }

      void main() {
        vec4 modelPosition = modelMatrix * vec4(position, 1.0);

        // Match the same glitch pattern as main holographic material
        float glitchTime = uTime - modelPosition.y;
        float glitchStrength = sin(glitchTime) + sin(glitchTime * 3.45) + sin(glitchTime * 8.76) * 1.1;
        glitchStrength /= 3.0;
        glitchStrength = smoothstep(0.9, 1.0, glitchStrength);
        glitchStrength *= 0.1; // Same as main material
        modelPosition.x += (random2D(modelPosition.xz + uTime).x - 0.5) * glitchStrength;
        modelPosition.z += (random2D(modelPosition.zx + uTime).x - 0.5) * glitchStrength;

        gl_Position = projectionMatrix * viewMatrix * modelPosition;

        vec4 modelNormal = modelMatrix * vec4(normal, 0.0);
        vPosition = modelPosition.xyz;
        vNormal = modelNormal.xyz;
      }
    `,
        fragmentShader: `
      uniform vec3 uColor;
      uniform float uTime;
      uniform float uGlowIntensity;
      varying vec3 vPosition;
      varying vec3 vNormal;

      void main() {
        vec3 normal = normalize(vNormal);
        if(!gl_FrontFacing)
            normal *= -1.0;

        // Similar stripes to main material but slightly different speed
        float stripes = mod((vPosition.y - uTime * 0.02) * 10.0, 1.0);
        stripes = pow(stripes, 2.5);

        vec3 viewDirection = normalize(vPosition - cameraPosition);
        float fresnel = dot(viewDirection, normal) + 1.0;
        fresnel = pow(fresnel, 1.5);

        // Base glow
        float baseGlow = 0.4; // Minimum visibility

        float falloff = smoothstep(0.8, 0.0, fresnel);

        // Pulsing glow effect
        float pulse = sin(uTime * 3.0) * 0.2 + 0.8;

        float holographic = stripes * fresnel;
        holographic += fresnel * uGlowIntensity * pulse;
        holographic *= falloff;
        holographic = max(holographic, baseGlow); // Ensure minimum visibility

        // Subtle color variation
        vec3 finalColor = uColor;
        finalColor.r += sin(vPosition.y * 3.0 + uTime * 0.5) * 0.1;
        finalColor.b += cos(vPosition.x * 3.0 - uTime * 0.3) * 0.1;

        gl_FragColor = vec4(finalColor, holographic);
      }
    `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: true, // Allow transparency layering
        depthTest: false,
        side: THREE.DoubleSide,
      }),
    []
  );

  // Create a flame-colored shader for heart1 objects
  // const flameHolographicMaterial = useMemo(
  //   () =>
  //     new THREE.ShaderMaterial({
  //       precision: "lowp",
  //       uniforms: {
  //         uTime: { value: 0.0 },
  //         uColor1: { value: new THREE.Color(0xff4500) }, // Orange-red
  //         uColor2: { value: new THREE.Color(0xffd700) }, // Gold
  //         uGlowIntensity: { value: 3.0 },
  //       },
  //       vertexShader: `
  //     uniform float uTime;
  //     varying vec3 vPosition;
  //     varying vec3 vNormal;
  
  //     vec2 random2D(vec2 st) {
  //       st = vec2(dot(st, vec2(127.1, 311.7)),
  //                dot(st, vec2(269.5, 183.3)));
  //       return -1.0 + 2.0 * fract(sin(st) * 43758.5453123);
  //     }

  //     void main() {
  //       vec4 modelPosition = modelMatrix * vec4(position, 1.0);

  //       // Match the same glitch pattern as main holographic material
  //       float glitchTime = uTime - modelPosition.y;
  //       float glitchStrength = sin(glitchTime) + sin(glitchTime * 3.45) + sin(glitchTime * 8.76) * 1.1;
  //       glitchStrength /= 3.0;
  //       glitchStrength = smoothstep(0.8, 1.0, glitchStrength);
  //       glitchStrength *= 0.02; // Same as main material
  //       modelPosition.x += (random2D(modelPosition.xz + uTime).x - 0.5) * glitchStrength;
  //       modelPosition.z += (random2D(modelPosition.zx + uTime).x - 0.5) * glitchStrength;

  //       gl_Position = projectionMatrix * viewMatrix * modelPosition;

  //       vec4 modelNormal = modelMatrix * vec4(normal, 0.0);
  //       vPosition = modelPosition.xyz;
  //       vNormal = modelNormal.xyz;
  //     }
  //   `,
  //       fragmentShader: `
  //     uniform vec3 uColor1;
  //     uniform vec3 uColor2;
  //     uniform float uTime;
  //     uniform float uGlowIntensity;
  //     varying vec3 vPosition;
  //     varying vec3 vNormal;

  //     void main() {
  //       vec3 normal = normalize(vNormal);
  //       if(!gl_FrontFacing)
  //           normal *= -1.0;

  //       // Flame-like movement in stripes
  //       float flamePattern = sin(vPosition.y * 8.0 - uTime * 4.0) * 0.5 + 0.5;
  //       float stripes = mod((vPosition.y - uTime * 0.03) * 12.0 + flamePattern * 2.0, 1.0);
  //       stripes = pow(stripes, 2.0);

  //       vec3 viewDirection = normalize(vPosition - cameraPosition);
  //       float fresnel = dot(viewDirection, normal) + 1.0;
  //       fresnel = pow(fresnel, 1.5);

  //       // Base glow
  //       float baseGlow = 0.5; // Higher base for flame visibility

  //       float falloff = smoothstep(0.8, 0.2, fresnel);

  //       // Flickering flame effect
  //       float flicker = sin(uTime * 10.0) * 0.1 + sin(uTime * 23.0) * 0.05 + 0.85;

  //       float holographic = stripes * fresnel;
  //       holographic += fresnel * uGlowIntensity * flicker;
  //       holographic *= falloff;
  //       holographic = max(holographic, baseGlow);

  //       // Blend between orange-red and gold based on position and time
  //       float colorMix = sin(vPosition.y * 4.0 + uTime * 2.0) * 0.5 + 0.5;
  //       vec3 finalColor = mix(uColor1, uColor2, colorMix);
        
  //       // Add white hot core
  //       finalColor = mix(finalColor, vec3(1.0, 0.95, 0.8), fresnel * 0.3);

  //       gl_FragColor = vec4(finalColor, holographic);
  //     }
  //   `,
  //       transparent: true,
  //       blending: THREE.AdditiveBlending,
  //       depthWrite: true,
  //       depthTest: false,
  //       side: THREE.DoubleSide,
  //     }),
  //   []
  // );

  const applyHolographicEffect = (model) => {
    model.traverse((child) => {
      if (child.isMesh) {
        child.material = holographicMaterial;
      }
    });
  };

  // const object3 = scene.getObjectByName("Object_3");

  // if (object3) {
  //   const worldPosition = new THREE.Vector3();
  //   object3.getWorldPosition(worldPosition);
  //   // console.log("World Position:", worldPosition);
  // }

  useEffect(() => {
    // Only load if we haven't already
    if (hasLoadedRef.current) return;

    let isCurrentInstance = true; // Flag to track if this effect instance is current

    loader.load("/models/CyberpunkMaryHeartRed.glb", (gltf) => {
      if (!isCurrentInstance) return; // Don't proceed if this effect is stale

      const statue = gltf.scene;

      // Create and store the animation mixer
      const mixer = new THREE.AnimationMixer(statue);
      mixerRef.current = mixer;

      // Find and play the HaloRotation animation
      const haloAnimation = gltf.animations.find(
        (anim) => anim.name === "HaloRotation"
      );
      if (haloAnimation) {
        const action = mixer.clipAction(haloAnimation);
        action.play();
      } else {
        console.warn("HaloRotation animation not found in the model");
      }

      // Create an anchor group with initial position
      const anchorGroup = new THREE.Group();
      // Use position from props instead of hardcoded position
      anchorGroup.position.set(position[0], position[1], position[2]);
      initialY.current = position[1];

      // Create a rotation group
      const rotationGroup = new THREE.Group();

      // Set up the hierarchy
      anchorGroup.add(rotationGroup);
      rotationGroup.add(statue);

      // Store refs
      statueRef.current = statue;
      groupRef.current = { anchor: anchorGroup, rotation: rotationGroup };

      // Apply scale and rotation from props
      statue.scale.set(scale[0], scale[1], scale[2]);
      statue.rotation.set(rotation[0], rotation[1], rotation[2]);

      // Center the statue in the rotation group
      const box = new THREE.Box3().setFromObject(statue);
      const center = box.getCenter(new THREE.Vector3());
      statue.position.sub(center);

      // Apply materials
      const goldHolographicMaterial = new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uColor: { value: new THREE.Color(0xffd700) },
        },
        vertexShader: holographicMaterial.vertexShader,
        fragmentShader: holographicMaterial.fragmentShader,
        transparent: true,
        blending: THREE.NormalBlending,
        depthWrite: true,
        depthTest: true,
        side: THREE.DoubleSide,
      });

      // Clear previous animated materials
      animatedMaterialsRef.current = [];
      
      statue.traverse((child) => {
        if (child.isMesh) {
          // console.log("Mesh name:", child.name); // Keep this for now
          const meshName = child.name.toLowerCase();
      
          if (
            meshName.includes("halotext1") ||
            meshName.includes("halotext2")
          ) {
            child.material = new THREE.MeshStandardMaterial({
              color: child.material.color,
              emissive: child.material.color,
              emissiveIntensity: 1.0,
              metalness: 0.8,
              roughness: 0.2,
              side: THREE.DoubleSide,
              transparent: true,
              depthWrite: true,
              depthTest: true,
              blending: THREE.AdditiveBlending,
              // needsUpdate: true, // Remove this line - it's causing the warning
            });
            child.renderOrder = 2;
          } else if (meshName === "heart1" || meshName === "heart3" || meshName === "heart") {
            // Be more specific with the heart names
            // console.log("Found heart object:", child.name); // Debug log
            const clonedMaterial = holographicMaterial.clone();
            clonedMaterial.uniforms = {
              uTime: { value: 0 },
              uColor: { value: new THREE.Color(0xff0000) } // Make it bright red so we can see it
            };
            child.material = clonedMaterial;
            // child.renderOrder = 0; // Between statue (1) and halo (2)
            animatedMaterialsRef.current.push(clonedMaterial);
          } else {
            // Main statue parts
            const clonedMaterial = holographicMaterial.clone();
            clonedMaterial.uniforms = {
              uTime: { value: 0 },
              uColor: { value: new THREE.Color(0x00ffff) }
            };
            child.material = clonedMaterial;
            child.renderOrder = 1;
            animatedMaterialsRef.current.push(clonedMaterial);
          }
        }
      });

      // Add the anchor group to the scene
      scene.add(anchorGroup);
      hasLoadedRef.current = true;

      // Notify parent that statue is loaded and ready
      if (onLoad) {
        onLoad();
      }
    });

    // Cleanup function
    return () => {
      isCurrentInstance = false; // Mark this effect instance as stale

      // Stop all animations
      if (mixerRef.current) {
        mixerRef.current.stopAllAction();
        mixerRef.current = null;
      }

      // Remove the statue from scene and dispose of resources
      if (groupRef.current?.anchor) {
        // Traverse and dispose of all materials and geometries
        groupRef.current.anchor.traverse((child) => {
          if (child.isMesh) {
            if (child.geometry) {
              child.geometry.dispose();
            }
            if (child.material) {
              if (Array.isArray(child.material)) {
                child.material.forEach((material) => material.dispose());
              } else {
                child.material.dispose();
              }
            }
          }
        });

        // Remove from scene
        scene.remove(groupRef.current.anchor);
        groupRef.current = null;
      }

      // Clear statue reference
      if (statueRef.current) {
        statueRef.current = null;
      }

      // Reset loaded flag
      hasLoadedRef.current = false;
      
      // Clear animated materials cache
      animatedMaterialsRef.current = [];
    };
  // }, [scene, holographicMaterial, heartHolographicMaterial, flameHolographicMaterial, loader, onLoad, position, rotation, scale, hover, rotate]);
}, [scene, holographicMaterial, loader]); // Only re-load if scene or core materials change


  useFrame((state, delta) => {
    // Update the animation mixer
    if (mixerRef.current) {
      mixerRef.current.update(delta);
    }

    if (statueRef.current && groupRef.current) {
      // Apply hover animation to the anchor group only if hover is enabled
      if (hover) {
        groupRef.current.anchor.position.y =
          initialY.current + Math.sin(state.clock.elapsedTime * 0.5) * 0.01;
      }

      // Apply rotation to the rotation group only if rotate is enabled
      if (rotate) {
        groupRef.current.rotation.rotation.y += delta * 0.1;
      }

      // Update shader uniforms using cached materials (more efficient)
      for (const material of animatedMaterialsRef.current) {
        if (material.uniforms?.uTime) {
          material.uniforms.uTime.value -= delta;
        }
      }
    }
  });

  return null;
}

export default HolographicStatue4;
