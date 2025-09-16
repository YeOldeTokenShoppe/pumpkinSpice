import { useEffect, useState } from 'react';

export const useFontLoader = () => {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    // Check if fonts are already loaded
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        setFontsLoaded(true);
        document.body.classList.add('fonts-loaded');
      });
    } else {
      // Fallback for browsers that don't support Font Loading API
      // Wait a short time then assume fonts are loaded
      setTimeout(() => {
        setFontsLoaded(true);
        document.body.classList.add('fonts-loaded');
      }, 100);
    }

    // Also check for specific font
    if ('FontFaceSet' in window) {
      document.fonts.load('900 4rem UnifrakturMaguntia').then(() => {
        setFontsLoaded(true);
        document.body.classList.add('fonts-loaded');
      }).catch(() => {
        // Font failed to load, show content anyway after delay
        setTimeout(() => {
          setFontsLoaded(true);
          document.body.classList.add('fonts-loaded');
        }, 500);
      });
    }
  }, []);

  return fontsLoaded;
};