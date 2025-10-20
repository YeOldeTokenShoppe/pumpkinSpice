import { useEffect, useRef, useState } from 'react';

const TubesCursor = ({ 
  colors = ["#f967fb", "#53bc28", "#6958d5"],
  lightColors = ["#83f36e", "#fe8a2e", "#ff008a", "#60aed5"],
  lightIntensity = 200,
  onClickRandomize = true
}) => {
  const canvasRef = useRef(null);
  const appRef = useRef(null);
  const cleanupRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadScript = () => {
      return new Promise((resolve, reject) => {
        if (window.TubesCursor) {
          resolve();
          return;
        }

        const script = document.createElement('script');
        script.type = 'module';
        script.textContent = `
          import TubesCursor from "https://cdn.jsdelivr.net/npm/threejs-components@0.0.19/build/cursors/tubes1.min.js";
          window.TubesCursor = TubesCursor;
          window.dispatchEvent(new Event('tubesCursorLoaded'));
        `;
        
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    };

    const initializeCursor = async () => {
      try {
        await loadScript();
        
        if (!isMounted || !canvasRef.current) return;

        // Wait for the library to be available
        if (!window.TubesCursor) {
          await new Promise((resolve) => {
            window.addEventListener('tubesCursorLoaded', resolve, { once: true });
          });
        }

        if (!isMounted || !canvasRef.current) return;

        // Force WebGL instead of WebGPU to avoid conflicts
        const app = window.TubesCursor(canvasRef.current, {
          tubes: {
            colors: colors,
            lights: {
              intensity: lightIntensity,
              colors: lightColors
            }
          },
          renderer: {
            forceWebGL: true,
            powerPreference: "low-power",
            antialias: false
          }
        });

        appRef.current = app;
        setIsLoaded(true);

        // Add click handler for random colors if enabled
        if (onClickRandomize) {
          const handleClick = () => {
            const randomColors = (count) => {
              return new Array(count)
                .fill(0)
                .map(() => "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'));
            };

            const newColors = randomColors(3);
            const newLightColors = randomColors(4);
            
            if (appRef.current && appRef.current.tubes) {
              appRef.current.tubes.setColors(newColors);
              appRef.current.tubes.setLightsColors(newLightColors);
            }
          };

          document.body.addEventListener('click', handleClick);
          cleanupRef.current = () => {
            document.body.removeEventListener('click', handleClick);
          };
        }
      } catch (error) {
        console.error('Failed to load TubesCursor:', error);
        setHasError(true);
      }
    };

    initializeCursor();

    return () => {
      isMounted = false;
      
      // Clean up event listeners
      if (cleanupRef.current) {
        cleanupRef.current();
      }
      
      // Clean up Three.js app
      if (appRef.current) {
        try {
          if (appRef.current.destroy) {
            appRef.current.destroy();
          } else if (appRef.current.renderer) {
            appRef.current.renderer.dispose();
          }
        } catch (e) {
          console.warn('Error during TubesCursor cleanup:', e);
        }
      }
    };
  }, [colors, lightColors, lightIntensity, onClickRandomize]);

  // Don't render if there's an error
  if (hasError) {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: -1
      }}
    />
  );
};

export default TubesCursor;