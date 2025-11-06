import { useRef, useCallback } from 'react';

export const useAudio = () => {
  const audioRefs = useRef({});

  const loadSound = useCallback((soundId, soundPath) => {
    try {
      if (!audioRefs.current[soundId]) {
        audioRefs.current[soundId] = new Audio(soundPath);
        audioRefs.current[soundId].preload = 'auto';
      }
    } catch (error) {
      console.warn('Audio load error:', error);
    }
  }, []);

  const playSound = useCallback((soundIdOrPath, options = {}) => {
    try {
      let audio;
      
      // If it's a sound ID that was preloaded
      if (audioRefs.current[soundIdOrPath]) {
        audio = audioRefs.current[soundIdOrPath];
      } else {
        // Otherwise create a new audio instance
        audio = new Audio(soundIdOrPath);
        audioRefs.current[soundIdOrPath] = audio;
      }
      
      audio.volume = options.volume || 0.5;
      audio.currentTime = 0;
      
      if (options.loop) {
        audio.loop = true;
      }
      
      audio.play().catch(e => {
        console.warn('Audio play failed:', e);
      });
    } catch (error) {
      console.warn('Audio error:', error);
    }
  }, []);

  const stopSound = useCallback((soundIdOrPath) => {
    try {
      let audio;
      
      if (audioRefs.current[soundIdOrPath]) {
        audio = audioRefs.current[soundIdOrPath];
      } else {
        audio = audioRefs.current[soundIdOrPath];
      }
      
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    } catch (error) {
      console.warn('Audio stop error:', error);
    }
  }, []);

  return { loadSound, playSound, stopSound };
};