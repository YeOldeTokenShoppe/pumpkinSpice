import { useEffect } from 'react';

const SimpleCursor = () => {
  useEffect(() => {
    // Create CSS for custom cursor
    const style = document.createElement('style');
    style.textContent = `
      * {
        cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><circle cx="16" cy="16" r="8" fill="none" stroke="%23c48901" stroke-width="2" opacity="0.8"/><circle cx="16" cy="16" r="2" fill="%23c48901"/><circle cx="16" cy="16" r="12" fill="none" stroke="%23c48901" stroke-width="1" opacity="0.3"/></svg>') 16 16, auto !important;
      }
      
      a, button, [role="button"], .clickable {
        cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><circle cx="16" cy="16" r="10" fill="none" stroke="%23c48901" stroke-width="3" opacity="0.9"/><circle cx="16" cy="16" r="3" fill="%23c48901"/><circle cx="16" cy="16" r="15" fill="none" stroke="%2353bc28" stroke-width="1" opacity="0.4"/></svg>') 16 16, pointer !important;
      }
      
      canvas {
        cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><circle cx="16" cy="16" r="6" fill="none" stroke="%236958d5" stroke-width="2" opacity="0.7"/><circle cx="16" cy="16" r="1" fill="%236958d5"/></svg>') 16 16, auto !important;
      }
    `;
    
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return null;
};

export default SimpleCursor;