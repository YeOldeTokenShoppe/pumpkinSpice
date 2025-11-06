import { useRef, useCallback } from 'react';

export const useAudio = () => {
  const audioRefs = useRef({});

  const loadSound = useCallback((name, src, loop = false) => {
    if (!audioRefs.current[name]) {
      audioRefs.current[name] = new Audio(src);
      audioRefs.current[name].preload = 'auto';
      audioRefs.current[name].loop = loop;
    }
    return audioRefs.current[name];
  }, []);

  const playSound = useCallback((name, volume = 1) => {
    if (audioRefs.current[name]) {
      audioRefs.current[name].volume = volume;
      audioRefs.current[name].currentTime = 0;
      audioRefs.current[name].play().catch(console.error);
    }
  }, []);

  const stopSound = useCallback((name) => {
    if (audioRefs.current[name]) {
      audioRefs.current[name].pause();
      audioRefs.current[name].currentTime = 0;
    }
  }, []);

  return { loadSound, playSound, stopSound };
};