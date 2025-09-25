import { useEffect } from 'react';

export default function PerformanceMonitor({ name }) {
  useEffect(() => {
    const startTime = performance.now();
    console.log(`[PERF] ${name} - Component mounting...`);
    
    // Log when component is ready
    const timer = setTimeout(() => {
      const elapsed = performance.now() - startTime;
      console.log(`[PERF] ${name} - Ready after ${elapsed.toFixed(0)}ms`);
    }, 0);
    
    return () => {
      clearTimeout(timer);
      const elapsed = performance.now() - startTime;
      console.log(`[PERF] ${name} - Unmounting after ${elapsed.toFixed(0)}ms`);
    };
  }, [name]);
  
  return null;
}