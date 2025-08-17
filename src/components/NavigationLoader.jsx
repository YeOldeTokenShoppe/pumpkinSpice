"use client";

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import SimpleLoader from './SimpleLoader';

export default function NavigationLoader() {
  const [isNavigating, setIsNavigating] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    console.log('NavigationLoader: Navigation detected to', pathname);
    // Show loader when navigation starts
    setIsNavigating(true);
    
    // Hide loader after a short delay to ensure smooth transition
    const timer = setTimeout(() => {
      console.log('NavigationLoader: Hiding loader');
      setIsNavigating(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  if (!isNavigating) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      zIndex: 99999,
      backgroundColor: '#000',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <SimpleLoader />
    </div>
  );
}