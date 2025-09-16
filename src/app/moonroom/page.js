'use client';

import { useAuth, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { checkUserIllumin80Status } from '@/utils/firestore-illumin80';

export default function MoonRoomPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const [hasAccess, setHasAccess] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showModal, setShowModal] = useState(true);

  useEffect(() => {
    async function checkAccess() {
      if (!isLoaded || !user) return;
      
      // If not signed in, redirect to home
      if (!isSignedIn) {
        router.push('/');
        return;
      }

      // Check if user is Illumin80 member
      setCheckingAccess(true);
      
      // Try multiple identifiers
      const identifiers = [
        user.username,
        user.firstName,
        user.lastName,
        user.fullName,
        user.primaryEmailAddress?.emailAddress,
        user.emailAddresses?.[0]?.emailAddress,
        user.id
      ].filter(Boolean);
      
      let isIllumin80 = false;
      for (const identifier of identifiers) {
        try {
          const result = await checkUserIllumin80Status(identifier);
          if (result.isIllumin80) {
            isIllumin80 = true;
            break;
          }
        } catch (error) {
          console.error(`Error checking ${identifier}:`, error);
        }
      }
      
      setHasAccess(isIllumin80);
      setCheckingAccess(false);
    }
    
    checkAccess();
  }, [isLoaded, isSignedIn, user, router]);

  if (!isLoaded || checkingAccess) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#0a0020',
        color: '#FF0040',
        fontSize: '24px',
        fontFamily: 'UnifrakturCook, serif'
      }}>
        <div style={{ fontSize: '48px', animation: 'spin 2s linear infinite' }}>⚜️</div>
        <div style={{ marginTop: '20px' }}>Verifying Illumin80 credentials...</div>
        <style jsx>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
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
        backgroundColor: '#001030',
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
        backgroundColor: '#001030',
        color: 'white',
        fontSize: '24px',
        gap: '20px'
      }}>
        <div>Access Denied</div>
        <div style={{ fontSize: '16px' }}>You must be an Illumin80 member to access the Moon Room</div>
        <button
          onClick={() => router.push('/')}
          style={{
            padding: '10px 20px',
            backgroundColor: '#FF0040',
            color: '#0a0020',
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
    <div style={{ 
      position: 'relative', 
      width: '100vw', 
      height: '100vh', 
      backgroundColor: '#0a0020',
      overflow: 'hidden'
    }}>
      {/* Modal Overlay */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 40, 0.85)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 2000,
            backdropFilter: 'blur(5px)'
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              backgroundColor: '#0a0020',
              border: '3px solid #FF0040',
              borderRadius: '12px',
              padding: '2rem',
              maxWidth: '600px',
              width: '90%',
              boxShadow: '0 0 40px rgba(255, 0, 64, 0.4), 0 0 80px rgba(0, 100, 255, 0.2)',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{
              color: '#FF0040',
              textAlign: 'center',
              fontSize: '2rem',
              fontFamily: "'UnifrakturCook', cursive",
              marginBottom: '1.5rem',
              textShadow: '0 0 20px rgba(255, 0, 64, 0.6), 0 0 40px rgba(0, 100, 255, 0.3)'
            }}>
              ⚜️ Welcome to the Moon Room ⚜️
            </h2>
            
            <div style={{
              backgroundColor: 'rgba(0, 100, 255, 0.08)',
              border: '1px solid rgba(0, 100, 255, 0.4)',
              borderRadius: '8px',
              padding: '1.5rem',
              marginBottom: '1.5rem'
            }}>
              <h3 style={{ color: '#0064FF', marginBottom: '1rem', fontSize: '1.2rem' }}>Instructions:</h3>
              <ul style={{ color: '#0064FF', fontSize: '1rem', lineHeight: '1.8' }}>
                <li><span style={{ color: '#FF0040' }}>🎯</span> Click to shoot projectiles</li>
                <li><span style={{ color: '#FF0040' }}>🔄</span> Hold mouse down to rotate the room</li>
                <li><span style={{ color: '#FF0040' }}>🌙</span> Hold Shift + mouse to grab and move moons</li>
                <li><span style={{ color: '#FF0040' }}>💬</span> Chat with fellow Illumin80 members in real-time</li>
                <li><span style={{ color: '#FF0040' }}>🎮</span> Press F for fullscreen mode</li>
              </ul>
            </div>
            
            <div style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'center'
            }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  padding: '0.75rem 2rem',
                  background: 'linear-gradient(135deg, #FF0040, #FF4080)',
                  color: '#0a0020',
                  border: '2px solid #FF0040',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '1.1rem',
                  fontFamily: "'UnifrakturCook', cursive",
                  boxShadow: '0 4px 15px rgba(255, 0, 64, 0.5), 0 4px 30px rgba(0, 100, 255, 0.2)',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 20px rgba(255, 0, 64, 0.7), 0 6px 40px rgba(0, 100, 255, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 15px rgba(255, 0, 64, 0.5), 0 4px 30px rgba(0, 100, 255, 0.2)';
                }}
              >
                Enter Moon Room
              </button>
              
              <button
                onClick={() => router.push('/home')}
                style={{
                  padding: '0.75rem 2rem',
                  background: 'transparent',
                  color: '#FF0040',
                  border: '2px solid #0064FF',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '1.1rem',
                  fontFamily: "'UnifrakturCook', cursive",
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = 'rgba(0, 100, 255, 0.15)';
                  e.target.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                Return to Sanctuary
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Floating Control Bar */}
      <div
        style={{
          position: 'absolute',
          top: isFullScreen ? '-100px' : '1rem',
          right: '1rem',
          padding: '0.75rem',
          background: 'linear-gradient(135deg, rgba(10, 0, 32, 0.95), rgba(0, 16, 48, 0.95))',
          border: '2px solid #FF0040',
          borderRadius: '8px',
          boxShadow: '0 4px 20px rgba(255, 0, 64, 0.4), 0 4px 40px rgba(0, 100, 255, 0.2)',
          zIndex: 1000,
          display: 'flex',
          gap: '0.75rem',
          transition: 'top 0.3s ease'
        }}
        onMouseEnter={(e) => {
          if (isFullScreen) {
            e.currentTarget.style.top = '1rem';
          }
        }}
        onMouseLeave={(e) => {
          if (isFullScreen) {
            e.currentTarget.style.top = '-100px';
          }
        }}
      >
        <button
          onClick={() => setShowModal(true)}
          style={{
            padding: '0.5rem 1rem',
            background: 'transparent',
            color: '#0064FF',
            border: '1px solid #0064FF',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.9rem',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = 'rgba(255, 0, 64, 0.1)';
            e.target.style.borderColor = '#FF0040';
            e.target.style.color = '#FF0040';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'transparent';
            e.target.style.borderColor = '#0064FF';
            e.target.style.color = '#0064FF';
          }}
        >
          📖 Instructions
        </button>
        
        <button
          onClick={() => {
            setIsFullScreen(!isFullScreen);
            if (!isFullScreen) {
              document.documentElement.requestFullscreen();
            } else {
              document.exitFullscreen();
            }
          }}
          style={{
            padding: '0.5rem 1rem',
            background: 'transparent',
            color: '#0064FF',
            border: '1px solid #0064FF',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.9rem',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = 'rgba(255, 0, 64, 0.1)';
            e.target.style.borderColor = '#FF0040';
            e.target.style.color = '#FF0040';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'transparent';
            e.target.style.borderColor = '#0064FF';
            e.target.style.color = '#0064FF';
          }}
        >
          {isFullScreen ? '🗗 Exit Fullscreen' : '⛶ Fullscreen'}
        </button>
        
        <button
          onClick={() => router.push('/home')}
          style={{
            padding: '0.5rem 1rem',
            background: 'linear-gradient(135deg, #FF0040, #FF4080)',
            color: '#0a0020',
            border: '2px solid #FF0040',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '0.9rem',
            boxShadow: '0 2px 10px rgba(255, 0, 64, 0.4), 0 2px 20px rgba(0, 100, 255, 0.2)',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 4px 15px rgba(255, 0, 64, 0.6), 0 4px 30px rgba(0, 100, 255, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 2px 10px rgba(255, 0, 64, 0.4), 0 2px 20px rgba(0, 100, 255, 0.2)';
          }}
        >
          🏛️ Exit
        </button>
      </div>
      
      {/* Moon Room iframe - loads from protected API route */}
      <iframe
        src="/api/moonroom"
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