"use client";

import { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CSS3DRenderer, CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer';

/**
 * CSS3D as CHILD of Screen1
 * 
 * By adding CSS3DObject as a child of Screen1, it automatically
 * inherits all transforms - no manual position syncing needed!
 */

// Fine-tune these if needed:
// Position offsets (in Screen1's local space)
const LOCAL_OFFSET_X = 0;      // Left(-) / Right(+)
const LOCAL_OFFSET_Y = 0;      // Down(-) / Up(+)  
const LOCAL_OFFSET_Z = -0.01;   // Behind(-) / In front(+) of screen surface

// Rotation adjustments (in radians)
const ROTATION_X = -0.03;          // Pitch: tilt forward(-) / backward(+)
const ROTATION_Y = 0          // Yaw: turn left(-) / right(+)
const ROTATION_Z = 0.02;          // Roll: tilt left(-) / right(+)

// Scale adjustment
const SCALE_FACTOR = 1.2;      // Make content smaller(<1) / larger(>1)

// Content size adjustment (independent of world scale)
const CONTENT_WIDTH_SCALE = 1;   // Make wider (>1) to cover corners
const CONTENT_HEIGHT_SCALE = 1.2;  // Make taller (>1) to cover corners

const BORDER_RADIUS = 15;

export default function DroneScreenCSS3D({ isMobile = false }) {
  const { gl, scene, camera } = useThree();
  const css3DRendererRef = useRef(null);
  const css3DObjectRef = useRef(null);
  const iframeRef = useRef(null);
  const initializedRef = useRef(false);
  const screenMeshRef = useRef(null);

  useEffect(() => {
    if (initializedRef.current) return;
    
    let checkInterval = setInterval(() => {
      if (window.globalScreenMesh && window.globalDroneGroup) {
        clearInterval(checkInterval);
        initializedRef.current = true;
        setup();
      }
    }, 100);

    function setup() {
      const screenMesh = window.globalScreenMesh;
      screenMeshRef.current = screenMesh;
      
      // console.log('=== CSS3D as Child of Screen1 ===');
      
      // === ANALYZE SCREEN1 GEOMETRY ===
      screenMesh.geometry.computeBoundingBox();
      const box = screenMesh.geometry.boundingBox;
      const size = new THREE.Vector3();
      const center = new THREE.Vector3();
      box.getSize(size);
      box.getCenter(center);
      
      // console.log('Screen1 size:', size.x.toFixed(2), 'x', size.y.toFixed(2), 'x', size.z.toFixed(2));
      // console.log('Screen1 center:', center.x.toFixed(2), center.y.toFixed(2), center.z.toFixed(2));

      // Find the two largest dimensions (screen width/height)
      const dims = [
        { axis: 'x', size: size.x },
        { axis: 'y', size: size.y },
        { axis: 'z', size: size.z }
      ].sort((a, b) => b.size - a.size);
      
      const screenWidth = dims[0].size;
      const screenHeight = dims[1].size;
      const thinAxis = dims[2].axis;
      
      // console.log('Screen dimensions:', screenWidth.toFixed(2), 'x', screenHeight.toFixed(2));
      // console.log('Thin axis:', thinAxis);

      // === 1. CREATE CSS3D RENDERER ===
      const css3DRenderer = new CSS3DRenderer();
      css3DRenderer.setSize(window.innerWidth, window.innerHeight);
      css3DRenderer.domElement.style.position = 'fixed';
      css3DRenderer.domElement.style.top = '0';
      css3DRenderer.domElement.style.left = '0';
      css3DRenderer.domElement.style.pointerEvents = 'none';
      
      // Insert BEFORE WebGL canvas
      gl.domElement.parentNode.insertBefore(css3DRenderer.domElement, gl.domElement);
      css3DRendererRef.current = css3DRenderer;
      // console.log('✅ CSS3D Renderer created');

      // === 2. CREATE IFRAME WITH CONTAINER FOR MASKING ===
      const aspect = screenWidth / screenHeight;
      const iframeHeight = 768 * CONTENT_HEIGHT_SCALE;
      const iframeWidth = Math.round(iframeHeight * aspect * CONTENT_WIDTH_SCALE);
      
      // Create a container div for masking
      const container = document.createElement('div');
      container.style.width = `${iframeWidth}px`;
      container.style.height = `${iframeHeight}px`;
      container.style.overflow = 'hidden';
      container.style.borderRadius = `${BORDER_RADIUS}px`;
      container.style.background = '#000';
      container.style.position = 'relative'; // For absolute positioning of rotated iframe
      
      // Option 1: Simple rounded rectangle clip-path
      container.style.clipPath = `inset(0 round ${BORDER_RADIUS}px)`;
      
      // Option 2: Elliptical clip for different corner shapes
      // container.style.clipPath = `inset(0 round ${BORDER_RADIUS}px ${BORDER_RADIUS * 0.8}px)`;
      
      // Option 3: Complex polygon shape (original)
      /*
      container.style.clipPath = `
        polygon(
          ${BORDER_RADIUS}px 0%,
          calc(100% - ${BORDER_RADIUS}px) 0%,
          100% ${BORDER_RADIUS}px,
          100% calc(100% - ${BORDER_RADIUS}px),
          calc(100% - ${BORDER_RADIUS}px) 100%,
          ${BORDER_RADIUS}px 100%,
          0% calc(100% - ${BORDER_RADIUS}px),
          0% ${BORDER_RADIUS}px
        )
      `.replace(/\s+/g, ' ').trim();
      */
      
      // Option 2: Use a mask with rounded rectangle (smoother corners)
      // Uncomment to use this instead of clip-path
      /*
      container.style.webkitMaskImage = `radial-gradient(circle at ${BORDER_RADIUS}px ${BORDER_RADIUS}px, black ${BORDER_RADIUS}px, transparent ${BORDER_RADIUS}px),
                                         radial-gradient(circle at calc(100% - ${BORDER_RADIUS}px) ${BORDER_RADIUS}px, black ${BORDER_RADIUS}px, transparent ${BORDER_RADIUS}px),
                                         radial-gradient(circle at ${BORDER_RADIUS}px calc(100% - ${BORDER_RADIUS}px), black ${BORDER_RADIUS}px, transparent ${BORDER_RADIUS}px),
                                         radial-gradient(circle at calc(100% - ${BORDER_RADIUS}px) calc(100% - ${BORDER_RADIUS}px), black ${BORDER_RADIUS}px, transparent ${BORDER_RADIUS}px),
                                         linear-gradient(black, black)`;
      container.style.webkitMaskSize = `${BORDER_RADIUS * 2}px ${BORDER_RADIUS * 2}px, 
                                        ${BORDER_RADIUS * 2}px ${BORDER_RADIUS * 2}px,
                                        ${BORDER_RADIUS * 2}px ${BORDER_RADIUS * 2}px,
                                        ${BORDER_RADIUS * 2}px ${BORDER_RADIUS * 2}px,
                                        calc(100% - ${BORDER_RADIUS * 2}px) 100%,
                                        100% calc(100% - ${BORDER_RADIUS * 2}px)`;
      container.style.webkitMaskPosition = `0 0, 100% 0, 0 100%, 100% 100%, ${BORDER_RADIUS}px 0, 0 ${BORDER_RADIUS}px`;
      container.style.webkitMaskRepeat = 'no-repeat';
      container.style.maskComposite = 'exclude';
      container.style.webkitMaskComposite = 'source-in';
      */
      
      // Create iframe
      const iframe = document.createElement('iframe');
      iframe.src = isMobile ? '/test-screen?mobile=true' : '/test-screen';
      iframe.style.border = 'none';
      iframe.style.display = 'block';
      iframe.style.pointerEvents = 'auto';
      
      if (isMobile) {
        // For mobile: rotate the iframe content 90 degrees clockwise
        // Size iframe as landscape, then rotate to fit portrait container
        iframe.style.width = `${iframeHeight}px`;
        iframe.style.height = `${iframeWidth}px`;
        iframe.style.position = 'absolute';
        iframe.style.left = '50%';
        iframe.style.top = '50%';
        iframe.style.transform = 'translate(-50%, -50%) rotate(90deg)';
        iframe.style.transformOrigin = 'center center';
      } else {
        iframe.style.width = '100%';
        iframe.style.height = '100%';
      }
      
      container.appendChild(iframe);
      iframeRef.current = iframe;
      
      // iframe.onload = () => console.log('✅ Iframe loaded');

      // === 3. CREATE CSS3D OBJECT ===
      const css3DObject = new CSS3DObject(container); // Use container instead of iframe
      css3DObjectRef.current = css3DObject;

      // === 4. CALCULATE SCALE ===
      // Scale so iframe pixels match Screen1's local units
      // Adjust for content scaling - if content is scaled up, we need to scale down proportionally
      const baseScale = screenWidth / (iframeWidth / CONTENT_WIDTH_SCALE);
      const scale = baseScale * SCALE_FACTOR;
      css3DObject.scale.setScalar(scale);
      // console.log('CSS3D scale:', scale.toFixed(6));
      // console.log('Content size:', iframeWidth, 'x', iframeHeight, 'px');

      // === 5. POSITION IN SCREEN1'S LOCAL SPACE ===
      // Position at geometry center + offset
      css3DObject.position.set(
        center.x + LOCAL_OFFSET_X,
        center.y + LOCAL_OFFSET_Y,
        center.z + LOCAL_OFFSET_Z
      );

      // === 6. ROTATE TO FACE CORRECT DIRECTION ===
      // Determine base rotation based on which axis is thin
      let baseRotationX = 0;
      let baseRotationY = 0;
      let baseRotationZ = 0;
      
      if (thinAxis === 'z') {
        // Screen faces Z - rotate 180° to face camera
        baseRotationY = Math.PI;
      } else if (thinAxis === 'x') {
        // Screen faces X
        baseRotationY = Math.PI / 2;
      } else if (thinAxis === 'y') {
        // Screen faces Y (unusual but handle it)
        baseRotationX = -Math.PI / 2;
      }
      
      // Apply base rotation plus manual adjustments
      css3DObject.rotation.x = baseRotationX + ROTATION_X;
      css3DObject.rotation.y = baseRotationY + ROTATION_Y;
      css3DObject.rotation.z = baseRotationZ + ROTATION_Z;
      
      // console.log('CSS3D rotation (deg):', {
      //   x: (css3DObject.rotation.x * 180 / Math.PI).toFixed(1),
      //   y: (css3DObject.rotation.y * 180 / Math.PI).toFixed(1),
      //   z: (css3DObject.rotation.z * 180 / Math.PI).toFixed(1)
      // });

      // === 7. ADD AS CHILD OF SCREEN1 ===
      // This is the key! CSS3DObject inherits Screen1's world transform
      screenMesh.add(css3DObject);
      // console.log('✅ CSS3DObject added as CHILD of Screen1');
      // console.log('   Screen1 children:', screenMesh.children.length);

      // === 8. SETUP CUTOUT MATERIAL ===
      screenMesh.userData.originalMaterial = screenMesh.material;
      screenMesh.material = new THREE.MeshBasicMaterial({
        colorWrite: false,    // Don't render color (invisible)
        depthWrite: true,     // Write to depth buffer (creates cutout)
        side: THREE.FrontSide, // Only front side creates the cutout
      });
      screenMesh.renderOrder = -1; // Render before other objects
      // console.log('✅ Cutout material applied');

      // === 9. RESIZE HANDLER ===
      function onResize() {
        css3DRenderer.setSize(window.innerWidth, window.innerHeight);
      }
      window.addEventListener('resize', onResize);

      // Cleanup
      css3DObject.userData.cleanup = () => {
        window.removeEventListener('resize', onResize);
        screenMesh.remove(css3DObject);
        if (css3DRenderer.domElement.parentNode) {
          css3DRenderer.domElement.parentNode.removeChild(css3DRenderer.domElement);
        }
        if (screenMesh.userData.originalMaterial) {
          screenMesh.material = screenMesh.userData.originalMaterial;
        }
      };
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval);
      if (css3DObjectRef.current?.userData?.cleanup) {
        css3DObjectRef.current.userData.cleanup();
      }
      initializedRef.current = false;
    };
  }, [gl, scene, isMobile]);

  // === RENDER LOOP ===
  useFrame(() => {
    const css3DRenderer = css3DRendererRef.current;
    const css3DObject = css3DObjectRef.current;
    const iframe = iframeRef.current;
    const screenMesh = screenMeshRef.current;
    
    if (!css3DRenderer || !css3DObject || !screenMesh) return;

    // Check visibility
    const droneVisible = window.globalDroneGroup?.visible ?? true;
    const screenVisible = screenMesh?.visible ?? true;
    const shouldShow = droneVisible && screenVisible;

    css3DObject.visible = shouldShow;
    css3DRenderer.domElement.style.display = shouldShow ? 'block' : 'none';
    if (iframe) iframe.style.pointerEvents = shouldShow ? 'auto' : 'none';

    if (!shouldShow) return;

    // No manual position sync needed!
    // CSS3DObject inherits transforms from Screen1 automatically.
    
    // Just render with the same scene and camera
    css3DRenderer.render(scene, camera);
  });

  return null;
}