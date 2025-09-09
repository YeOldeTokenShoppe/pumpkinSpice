'use client';

import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function MoonRoomPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;
    
    // If not signed in, redirect to home
    if (!isSignedIn) {
      router.push('/');
      return;
    }

    // TODO: Add token check logic here
    // For now, we'll assume signed-in users have access
    // You can add your token verification logic here
    setHasAccess(true);
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#000033',
        color: 'white',
        fontSize: '24px'
      }}>
        Loading...
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#000033',
        color: 'white',
        fontSize: '24px',
        gap: '20px'
      }}>
        <div>Access Denied</div>
        <div style={{ fontSize: '16px' }}>Please sign in to access the Moon Room</div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#000033',
        color: 'white',
        fontSize: '24px',
        gap: '20px'
      }}>
        <div>Access Denied</div>
        <div style={{ fontSize: '16px' }}>You need a LUNAR token to access the Moon Room</div>
        <button
          onClick={() => router.push('/')}
          style={{
            padding: '10px 20px',
            backgroundColor: '#F5AE4E',
            color: '#1D2528',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      {/* Header Bar */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          padding: '1rem 2rem',
          backgroundColor: 'rgba(0, 0, 51, 0.9)',
          borderBottom: '1px solid rgba(245, 174, 78, 0.3)',
          zIndex: 1000,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h1 style={{ 
          color: '#F5AE4E', 
          margin: 0, 
          fontSize: '1.5rem',
          fontFamily: "'UnifrakturCook', cursive"
        }}>
          The Illumin80 Moon Room
        </h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <p style={{ 
            fontSize: '0.875rem', 
            color: '#F5AE4E', 
            margin: 0 
          }}>
            Click to shoot • Hold mouse to rotate • Shift+click to grab moons
          </p>
          <button
            onClick={() => router.push('/home')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#F5AE4E',
              color: '#1D2528',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            Exit Room
          </button>
        </div>
      </div>
      
      {/* Moon Room iframe */}
      <iframe
        src="/MoonRoom.html"
        title="Moon Room"
        scrolling="no"
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
        }}
      />
    </div>
  );
}