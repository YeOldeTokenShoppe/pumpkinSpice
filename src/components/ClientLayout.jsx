"use client";

import { Suspense, useState, useEffect } from "react";
import SimpleLoader from "@/components/SimpleLoader";
import NavigationLoader from "@/components/NavigationLoader";
import { MusicProvider } from "@/components/MusicContext";

export default function ClientLayout({ children }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Show loader for initial mount
    console.log('ClientLayout mounted');
    const timer = setTimeout(() => {
      setMounted(true);
    }, 1000); // Show loader for at least 1 second on initial load
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <MusicProvider>
      <Suspense fallback={<SimpleLoader />}>
        <NavigationLoader />
      </Suspense>
      
      {/* Show loader until mounted */}
      {!mounted ? (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: '#000',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <SimpleLoader />
        </div>
      ) : (
        <Suspense fallback={<SimpleLoader />}>
          {children}
        </Suspense>
      )}
    </MusicProvider>
  );
}