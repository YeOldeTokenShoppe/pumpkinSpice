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
const LOCAL_OFFSET_X = 0;
const LOCAL_OFFSET_Y = 0;
const LOCAL_OFFSET_Z = 0.05;  // Slightly in front of screen surface
const BORDER_RADIUS = 20;

export default function DroneScreenCSS3D() {
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
      
      console.log('=== CSS3D as Child of Screen1 ===');
      
      // === ANALYZE SCREEN1 GEOMETRY ===
      screenMesh.geometry.computeBoundingBox();
      const box = screenMesh.geometry.boundingBox;
      const size = new THREE.Vector3();
      const center = new THREE.Vector3();
      box.getSize(size);
      box.getCenter(center);
      
      console.log('Screen1 size:', size.x.toFixed(2), 'x', size.y.toFixed(2), 'x', size.z.toFixed(2));
      console.log('Screen1 center:', center.x.toFixed(2), center.y.toFixed(2), center.z.toFixed(2));

      // Find the two largest dimensions (screen width/height)
      const dims = [
        { axis: 'x', size: size.x },
        { axis: 'y', size: size.y },
        { axis: 'z', size: size.z }
      ].sort((a, b) => b.size - a.size);
      
      const screenWidth = dims[0].size;
      const screenHeight = dims[1].size;
      const thinAxis = dims[2].axis;
      
      console.log('Screen dimensions:', screenWidth.toFixed(2), 'x', screenHeight.toFixed(2));
      console.log('Thin axis:', thinAxis);

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
      console.log('✅ CSS3D Renderer created');

      // === 2. CREATE IFRAME ===
      const aspect = screenWidth / screenHeight;
      const iframeHeight = 768;
      const iframeWidth = Math.round(iframeHeight * aspect);
      
      const iframe = document.createElement('iframe');
      iframe.src = '/test-screen';
      iframe.style.width = `${iframeWidth}px`;
      iframe.style.height = `${iframeHeight}px`;
      iframe.style.border = 'none';
      iframe.style.background = '#000';
      iframe.style.borderRadius = `${BORDER_RADIUS}px`;
      iframe.style.overflow = 'hidden';
      iframe.style.pointerEvents = 'auto';
      iframeRef.current = iframe;
      
      iframe.onload = () => console.log('✅ Iframe loaded');

      // === 3. CREATE CSS3D OBJECT ===
      const css3DObject = new CSS3DObject(iframe);
      css3DObjectRef.current = css3DObject;

      // === 4. CALCULATE SCALE ===
      // Scale so iframe pixels match Screen1's local units
      const scale = screenWidth / iframeWidth;
      css3DObject.scale.setScalar(scale);
      console.log('CSS3D scale:', scale.toFixed(6));

      // === 5. POSITION IN SCREEN1'S LOCAL SPACE ===
      // Position at geometry center + offset
      css3DObject.position.set(
        center.x + LOCAL_OFFSET_X,
        center.y + LOCAL_OFFSET_Y,
        center.z + LOCAL_OFFSET_Z
      );

      // === 6. ROTATE TO FACE CORRECT DIRECTION ===
      // Determine rotation based on which axis is thin
      if (thinAxis === 'z') {
        // Screen faces Z - rotate 180° to face camera
        css3DObject.rotation.y = Math.PI;
      } else if (thinAxis === 'x') {
        // Screen faces X
        css3DObject.rotation.y = Math.PI / 2;
      } else if (thinAxis === 'y') {
        // Screen faces Y (unusual but handle it)
        css3DObject.rotation.x = -Math.PI / 2;
      }

      // === 7. ADD AS CHILD OF SCREEN1 ===
      // This is the key! CSS3DObject inherits Screen1's world transform
      screenMesh.add(css3DObject);
      console.log('✅ CSS3DObject added as CHILD of Screen1');
      console.log('   Screen1 children:', screenMesh.children.length);

      // === 8. SETUP CUTOUT MATERIAL ===
      screenMesh.userData.originalMaterial = screenMesh.material;
      screenMesh.material = new THREE.MeshBasicMaterial({
        colorWrite: false,
        depthWrite: true,
        side: THREE.DoubleSide,
      });
      screenMesh.renderOrder = -1;
      console.log('✅ Cutout material applied');

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
  }, [gl, scene]);

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