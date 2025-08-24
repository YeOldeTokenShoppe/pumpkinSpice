import React, { useEffect, useRef, useState } from 'react';

export default function FountainFrame({ is80sMode = false }) {
  const iframeRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Send 80s mode state to iframe when it changes
    if (iframeRef.current && isLoaded) {
      try {
        iframeRef.current.contentWindow.postMessage(
          { type: '80sMode', value: is80sMode },
          '*'
        );
      } catch (e) {
        console.log('Could not send message to iframe:', e);
      }
    }
  }, [is80sMode, isLoaded]);

  const handleIframeLoad = () => {
    setIsLoaded(true);
    console.log('Fountain iframe loaded');
  };

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      overflow: 'hidden',
      zIndex: 1
    }}>
      <iframe
        ref={iframeRef}
        src="/fountain.html"
        onLoad={handleIframeLoad}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          border: 'none',
          overflow: 'hidden'
        }}
        title="Interactive Fountain"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
      />
    </div>
  );
}