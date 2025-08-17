import React, { useEffect, useState } from 'react';
import { useGLTF } from '@react-three/drei';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';

// Configure DRACO loader once globally
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('/draco/');
GLTFLoader.prototype.setDRACOLoader(dracoLoader);

/**
 * Enhanced GLB model loader with robust error handling and retry logic
 * 
 * @param {string} url - Path to the GLB model
 * @param {Object} options - Loading options
 * @param {number} options.maxRetries - Maximum number of retry attempts (default: 3)
 * @param {number} options.retryDelay - Delay between retries in ms (default: 1000)
 * @param {Function} options.onProgress - Progress callback
 * @param {Function} options.onError - Error callback
 * @param {Function} options.onLoaded - Success callback
 * @param {boolean} options.preload - Whether to preload the model (default: true)
 */
export function useRobustGLTF(url, options = {}) {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    onProgress,
    onError,
    onLoaded,
    preload = true
  } = options;

  const [gltf, setGltf] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [progress, setProgress] = useState(0);

  // Preload the model if requested
  useEffect(() => {
    if (preload && url) {
      useGLTF.preload(url);
    }
  }, [url, preload]);

  // Main loading logic with retry mechanism
  useEffect(() => {
    if (!url) return;

    let mounted = true;
    let timeoutId;

    const loadModel = async () => {
      try {
        setLoading(true);
        setError(null);

        // Create a new loader instance for this attempt
        const loader = new GLTFLoader();
        loader.setDRACOLoader(dracoLoader);

        // Load with progress tracking
        const loadedGltf = await new Promise((resolve, reject) => {
          const timeoutDuration = 30000; // 30 second timeout
          
          // Set a timeout for the loading
          const loadTimeout = setTimeout(() => {
            reject(new Error(`Loading timeout for ${url}`));
          }, timeoutDuration);

          loader.load(
            url,
            (gltf) => {
              clearTimeout(loadTimeout);
              if (mounted) {
                resolve(gltf);
              }
            },
            (progressEvent) => {
              if (progressEvent.lengthComputable) {
                const percentComplete = (progressEvent.loaded / progressEvent.total) * 100;
                if (mounted) {
                  setProgress(percentComplete);
                  onProgress?.(percentComplete);
                }
              }
            },
            (error) => {
              clearTimeout(loadTimeout);
              reject(error);
            }
          );
        });

        if (mounted) {
          setGltf(loadedGltf);
          setLoading(false);
          setRetryCount(0);
          onLoaded?.(loadedGltf);
        }
      } catch (err) {
        console.error(`Failed to load model ${url}:`, err);
        
        if (mounted) {
          if (retryCount < maxRetries) {
            console.log(`Retrying load of ${url} (attempt ${retryCount + 1}/${maxRetries})`);
            setRetryCount(prev => prev + 1);
            
            // Exponential backoff for retries
            const delay = retryDelay * Math.pow(2, retryCount);
            timeoutId = setTimeout(() => {
              if (mounted) {
                loadModel();
              }
            }, delay);
          } else {
            // Max retries reached
            setError(err);
            setLoading(false);
            onError?.(err);
          }
        }
      }
    };

    loadModel();

    return () => {
      mounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [url, retryCount, maxRetries, retryDelay, onProgress, onError, onLoaded]);

  // Fallback to useGLTF if our custom loader fails
  let fallbackGltf = null;
  try {
    if (error && url) {
      fallbackGltf = useGLTF(url, true);
    }
  } catch (fallbackError) {
    console.error('Fallback loading also failed:', fallbackError);
  }

  return {
    scene: gltf?.scene || fallbackGltf?.scene,
    animations: gltf?.animations || fallbackGltf?.animations,
    materials: gltf?.materials || fallbackGltf?.materials,
    nodes: gltf?.nodes || fallbackGltf?.nodes,
    loading,
    error,
    progress,
    retryCount,
    retry: () => setRetryCount(0) // Manual retry trigger
  };
}

/**
 * Model loading component with error boundary
 */
export function SafeModelLoader({ url, children, fallback, ...props }) {
  const { scene, loading, error, progress, retry } = useRobustGLTF(url, props);

  if (loading) {
    return fallback || (
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color="gray" opacity={0.5} transparent />
      </mesh>
    );
  }

  if (error) {
    console.error('Model loading error:', error);
    return (
      <group>
        <mesh onClick={retry}>
          <boxGeometry args={[2, 2, 2]} />
          <meshBasicMaterial color="red" opacity={0.5} transparent />
        </mesh>
      </group>
    );
  }

  if (!scene) {
    return null;
  }

  return children({ scene, progress });
}

/**
 * Preload multiple models in parallel with error handling
 */
export async function preloadModels(urls, onProgress) {
  const total = urls.length;
  let loaded = 0;
  
  const results = await Promise.allSettled(
    urls.map(async (url) => {
      try {
        await useGLTF.preload(url);
        loaded++;
        onProgress?.((loaded / total) * 100);
        return { url, status: 'success' };
      } catch (error) {
        console.error(`Failed to preload ${url}:`, error);
        return { url, status: 'error', error };
      }
    })
  );

  const failed = results.filter(r => r.value?.status === 'error');
  if (failed.length > 0) {
    console.warn(`Failed to preload ${failed.length} models:`, failed);
  }

  return results;
}

/**
 * Hook to monitor model loading performance
 */
export function useModelLoadingMetrics() {
  const [metrics, setMetrics] = useState({
    totalLoaded: 0,
    totalFailed: 0,
    averageLoadTime: 0,
    loadTimes: []
  });

  const recordLoad = (url, duration, success = true) => {
    setMetrics(prev => ({
      totalLoaded: success ? prev.totalLoaded + 1 : prev.totalLoaded,
      totalFailed: success ? prev.totalFailed : prev.totalFailed + 1,
      loadTimes: [...prev.loadTimes, { url, duration, success }],
      averageLoadTime: prev.loadTimes.length > 0 
        ? (prev.loadTimes.reduce((acc, t) => acc + t.duration, 0) + duration) / (prev.loadTimes.length + 1)
        : duration
    }));
  };

  return { metrics, recordLoad };
}