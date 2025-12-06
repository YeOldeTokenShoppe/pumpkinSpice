import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';

function VideoScreens() {
  const { scene } = useThree();
  const video1Ref = useRef();
  const video2Ref = useRef();
  const video3Ref = useRef();
  const video4Ref = useRef();
  const video5Ref = useRef();
  const texture1Ref = useRef();
  const texture2Ref = useRef();
  const texture3Ref = useRef();
  const texture4Ref = useRef();
  const texture5Ref = useRef();

  useEffect(() => {
    // Create video elements
    const video1 = document.createElement('video');
    video1.src = '/videos/23.mp4';
    video1.loop = true;
    video1.muted = true; // Required for autoplay
    video1.playsInline = true;
    video1.crossOrigin = 'anonymous';
    video1Ref.current = video1;

    const video2 = document.createElement('video');
    video2.src = '/videos/23.mp4';
    video2.loop = true;
    video2.muted = true; // Required for autoplay
    video2.playsInline = true;
    video2.crossOrigin = 'anonymous';
    video2Ref.current = video2;

    const video3 = document.createElement('video');
    video3.src = '/videos/23.mp4';
    video3.loop = true;
    video3.muted = true;
    video3.playsInline = true;
    video3.crossOrigin = 'anonymous';
    video3Ref.current = video3;

    const video4 = document.createElement('video');
    video4.src = '/videos/23.mp4';
    video4.loop = true;
    video4.muted = true;
    video4.playsInline = true;
    video4.crossOrigin = 'anonymous';
    video4Ref.current = video4;

    const video5 = document.createElement('video');
    video5.src = '/videos/23.mp4';
    video5.loop = true;
    video5.muted = true;
    video5.playsInline = true;
    video5.crossOrigin = 'anonymous';
    video5Ref.current = video5;

    // Create video textures
    const texture1 = new THREE.VideoTexture(video1);
    texture1.minFilter = THREE.LinearFilter;
    texture1.magFilter = THREE.LinearFilter;
    texture1.format = THREE.RGBFormat;
    texture1Ref.current = texture1;

    const texture2 = new THREE.VideoTexture(video2);
    texture2.minFilter = THREE.LinearFilter;
    texture2.magFilter = THREE.LinearFilter;
    texture2.format = THREE.RGBFormat;
    texture2Ref.current = texture2;

    const texture3 = new THREE.VideoTexture(video3);
    texture3.minFilter = THREE.LinearFilter;
    texture3.magFilter = THREE.LinearFilter;
    texture3.format = THREE.RGBFormat;
    texture3Ref.current = texture3;

    const texture4 = new THREE.VideoTexture(video4);
    texture4.minFilter = THREE.LinearFilter;
    texture4.magFilter = THREE.LinearFilter;
    texture4.format = THREE.RGBFormat;
    texture4Ref.current = texture4;

    const texture5 = new THREE.VideoTexture(video5);
    texture5.minFilter = THREE.LinearFilter;
    texture5.magFilter = THREE.LinearFilter;
    texture5.format = THREE.RGBFormat;
    texture5Ref.current = texture5;

    // Find screens and apply textures
    const findAndSetupScreens = () => {
      let screen1Found = false;
      let screen2Found = false;
      let screen3Found = false;
      let screen4Found = false;
      let screen5Found = false;

      scene.traverse((child) => {
        // Option 1: Target by object name (existing approach)
        if (child.isMesh && child.name === 'Screen1' && !screen1Found) {
          // console.log('[VideoScreens] Found Screen1:', child);
          
          // Create material with video texture
          const material = new THREE.MeshBasicMaterial({
            map: texture1,
            side: THREE.FrontSide,
            toneMapped: false,
          });
          
          // Replace the material
          child.material = material;
          screen1Found = true;
          
          // Start video playback
          video1.play().catch(e => {
            // console.log('[VideoScreens] Video 1 autoplay failed, waiting for user interaction');
          });
        }
        
        if (child.isMesh && child.name === 'Screen2' && !screen2Found) {
          // console.log('[VideoScreens] Found Screen2:', child);
          
          // Create material with video texture
          const material = new THREE.MeshBasicMaterial({
            map: texture2,
            side: THREE.FrontSide,
            toneMapped: false,
          });
          
          // Replace the material
          child.material = material;
          screen2Found = true;
          
          // Start video playback
          video2.play().catch(e => {
            // console.log('[VideoScreens] Video 2 autoplay failed, waiting for user interaction');
          });
        }
        
        if (child.isMesh && child.name === 'Screen3' && !screen3Found) {
          const material = new THREE.MeshBasicMaterial({
            map: texture3,
            side: THREE.FrontSide,
            toneMapped: false,
          });
          child.material = material;
          screen3Found = true;
          video3.play().catch(e => {});
        }
        
        if (child.isMesh && child.name === 'Screen4' && !screen4Found) {
          const material = new THREE.MeshBasicMaterial({
            map: texture4,
            side: THREE.FrontSide,
            toneMapped: false,
          });
          child.material = material;
          screen4Found = true;
          video4.play().catch(e => {});
        }
        
        if (child.isMesh && child.name === 'Screen5' && !screen5Found) {
          const material = new THREE.MeshBasicMaterial({
            map: texture5,
            side: THREE.FrontSide,
            toneMapped: false,
          });
          child.material = material;
          screen5Found = true;
          video5.play().catch(e => {});
        }
        
        // Option 2: Target by material name (Material.001)
        if (child.isMesh && child.material) {
          // Handle both single material and array of materials
          const materials = Array.isArray(child.material) ? child.material : [child.material];
          
          materials.forEach((mat, index) => {
            // Apply video to material named 'Material.001'
            if (mat.name === 'Material.001' && !screen1Found) {
              const newMaterial = new THREE.MeshBasicMaterial({
                map: texture1,
                side: THREE.FrontSide,
                toneMapped: false,
              });
              
              if (Array.isArray(child.material)) {
                child.material[index] = newMaterial;
              } else {
                child.material = newMaterial;
              }
              screen1Found = true;
              video1.play().catch(() => {});
            }
          });
        }
      });

      const allScreensFound = screen1Found || screen2Found || screen3Found || screen4Found || screen5Found;
      
      if (!allScreensFound) {
        // Keep retrying if no screens found at all
        setTimeout(findAndSetupScreens, 500);
      } else {
        // At least some screens were found, setup interaction handler
        const handleInteraction = () => {
          video1.play().catch(() => {});
          video2.play().catch(() => {});
          video3.play().catch(() => {});
          video4.play().catch(() => {});
          video5.play().catch(() => {});
          document.removeEventListener('click', handleInteraction);
          document.removeEventListener('touchstart', handleInteraction);
        };
        
        document.addEventListener('click', handleInteraction);
        document.addEventListener('touchstart', handleInteraction);
      }
    };

    findAndSetupScreens();

    // Cleanup
    return () => {
      if (video1Ref.current) {
        video1Ref.current.pause();
        video1Ref.current.src = '';
      }
      if (video2Ref.current) {
        video2Ref.current.pause();
        video2Ref.current.src = '';
      }
      if (video3Ref.current) {
        video3Ref.current.pause();
        video3Ref.current.src = '';
      }
      if (video4Ref.current) {
        video4Ref.current.pause();
        video4Ref.current.src = '';
      }
      if (video5Ref.current) {
        video5Ref.current.pause();
        video5Ref.current.src = '';
      }
      if (texture1Ref.current) texture1Ref.current.dispose();
      if (texture2Ref.current) texture2Ref.current.dispose();
      if (texture3Ref.current) texture3Ref.current.dispose();
      if (texture4Ref.current) texture4Ref.current.dispose();
      if (texture5Ref.current) texture5Ref.current.dispose();
    };
  }, [scene]);

  return null;
}

export default VideoScreens;