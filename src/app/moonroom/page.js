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
        background: 'radial-gradient(ellipse at center, #1a0033 0%, #000011 50%, #000000 100%)',
        fontSize: '24px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Animated background effects */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: `
            radial-gradient(circle at 20% 80%, rgba(255, 0, 128, 0.2) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(0, 255, 255, 0.2) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(139, 0, 255, 0.15) 0%, transparent 50%)
          `,
          animation: 'pulse 8s ease-in-out infinite',
          pointerEvents: 'none'
        }} />
        
        <div style={{ 
          fontSize: '80px', 
          animation: 'spin 3s linear infinite',
          filter: 'drop-shadow(0 0 25px #8B00FF) drop-shadow(0 0 40px #00FFFF)',
          zIndex: 1
        }}>
          🌙
        </div>
        
        <div style={{ 
          marginTop: '30px',
          background: 'linear-gradient(135deg, #FF0080, #8B00FF)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontSize: '36px',
          fontWeight: '900',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          textTransform: 'uppercase',
          letterSpacing: '4px',
          animation: 'glow 2s ease-in-out infinite alternate',
          zIndex: 1
        }}>
          Verifying Illumin80
        </div>
        
        <div style={{
          marginTop: '15px',
          color: '#00FFFF',
          fontSize: '18px',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          fontWeight: '500',
          textShadow: '0 0 20px rgba(0, 255, 255, 0.8)',
          letterSpacing: '2px',
          zIndex: 1
        }}>
          Accessing the Moon Room...
        </div>
        
        {/* Loading dots animation */}
        <div style={{
          marginTop: '30px',
          display: 'flex',
          gap: '15px',
          zIndex: 1
        }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: '15px',
                height: '15px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #8B00FF, #00FFFF)',
                boxShadow: '0 0 20px rgba(139, 0, 255, 0.5)',
                animation: `bounce 1.4s ease-in-out ${i * 0.2}s infinite`
              }}
            />
          ))}
        </div>
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
      background: 'radial-gradient(ellipse at center, #1a0033 0%, #000011 50%, #000000 100%)',
      overflow: 'hidden'
    }}>
      {/* Animated background effects */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: `
          radial-gradient(circle at 20% 80%, rgba(255, 0, 128, 0.15) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(0, 255, 255, 0.15) 0%, transparent 50%),
          radial-gradient(circle at 40% 40%, rgba(255, 255, 0, 0.1) 0%, transparent 50%)
        `,
        animation: 'pulse 15s ease-in-out infinite',
        pointerEvents: 'none',
        zIndex: 1
      }} />
      
      {/* Floating orbs */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '15%',
        width: '100px',
        height: '100px',
        background: 'radial-gradient(circle, rgba(255, 0, 255, 0.4), transparent)',
        borderRadius: '50%',
        filter: 'blur(40px)',
        animation: 'float 20s ease-in-out infinite',
        pointerEvents: 'none',
        zIndex: 1
      }} />
      
      <div style={{
        position: 'absolute',
        bottom: '20%',
        right: '10%',
        width: '150px',
        height: '150px',
        background: 'radial-gradient(circle, rgba(0, 255, 255, 0.3), transparent)',
        borderRadius: '50%',
        filter: 'blur(60px)',
        animation: 'float 25s ease-in-out infinite reverse',
        pointerEvents: 'none',
        zIndex: 1
      }} />
      
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
              background: `linear-gradient(135deg, 
                rgba(26, 0, 51, 0.98) 0%, 
                rgba(10, 0, 32, 0.98) 50%, 
                rgba(0, 17, 51, 0.98) 100%)`,
              border: '2px solid transparent',
              backgroundClip: 'padding-box',
              borderRadius: '20px',
              padding: '2.5rem',
              maxWidth: '700px',
              width: '90%',
              boxShadow: `
                0 0 60px rgba(255, 0, 128, 0.5),
                0 0 100px rgba(0, 255, 255, 0.3),
                inset 0 0 60px rgba(255, 255, 0, 0.05),
                0 10px 40px rgba(0, 0, 0, 0.8)
              `,
              position: 'relative',
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal gradient border effect */}
            <div style={{
              position: 'absolute',
              top: '-2px',
              left: '-2px',
              right: '-2px',
              bottom: '-2px',
              background: 'linear-gradient(45deg, #FF0080, #8B00FF, #00FFFF, #FF0080)',
              backgroundSize: '400% 400%',
              animation: 'gradient 10s ease infinite',
              borderRadius: '20px',
              zIndex: -1
            }} />
            
            <h2 style={{
              background: 'linear-gradient(90deg, #FF0080, #00FFFF)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textAlign: 'center',
              fontSize: '2.5rem',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
              marginBottom: '1.5rem',
              textShadow: '0 0 30px rgba(255, 0, 128, 0.8), 0 0 60px rgba(0, 255, 255, 0.5)',
              fontWeight: 'bold',
              letterSpacing: '2px',
              animation: 'glow 2s ease-in-out infinite alternate'
            }}>
              Welcome to the Moon Room
            </h2>
            
            <div style={{
              background: 'linear-gradient(135deg, rgba(255, 0, 128, 0.1), rgba(0, 255, 255, 0.1))',
              border: '1px solid rgba(139, 0, 255, 0.3)',
              borderRadius: '15px',
              padding: '1.5rem',
              marginBottom: '1.5rem',
              backdropFilter: 'blur(10px)',
              boxShadow: 'inset 0 0 30px rgba(255, 0, 255, 0.1)'
            }}>
              <h3 style={{ 
                background: 'linear-gradient(90deg, #00FFFF, #8B00FF)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginBottom: '1rem', 
                fontSize: '1.3rem',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>Instructions:</h3>
              <ul style={{ color: '#00FFFF', fontSize: '1rem', lineHeight: '2', textShadow: '0 0 10px rgba(0, 255, 255, 0.5)' }}>
                <li><span style={{ color: '#FF0080', filter: 'drop-shadow(0 0 10px #FF0080)' }}>🎯</span> Click to shoot projectiles</li>
                <li><span style={{ color: '#FF00FF', filter: 'drop-shadow(0 0 10px #FF00FF)' }}>🔄</span> Hold mouse down to rotate the room</li>
                <li><span style={{ color: '#00FFFF', filter: 'drop-shadow(0 0 10px #00FFFF)' }}>🌙</span> Hold Shift + mouse to grab and move moons</li>
                <li><span style={{ color: '#FF0080', filter: 'drop-shadow(0 0 10px #FF0080)' }}>💬</span> Chat with fellow Illumin80 members in real-time</li>
                <li><span style={{ color: '#8B00FF', filter: 'drop-shadow(0 0 10px #8B00FF)' }}>🎮</span> Press F for fullscreen mode</li>
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
                  padding: '1rem 2.5rem',
                  background: 'linear-gradient(135deg, #FF0080, #00FFFF)',
                  color: '#000000',
                  border: 'none',
                  borderRadius: '50px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '1.2rem',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                  boxShadow: `
                    0 0 30px rgba(255, 0, 128, 0.6),
                    0 0 50px rgba(255, 255, 0, 0.4),
                    0 10px 20px rgba(0, 0, 0, 0.3)
                  `,
                  transition: 'all 0.3s ease',
                  textTransform: 'uppercase',
                  letterSpacing: '2px'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-3px) scale(1.05)';
                  e.target.style.boxShadow = `
                    0 0 40px rgba(255, 0, 128, 0.8),
                    0 0 60px rgba(255, 255, 0, 0.6),
                    0 15px 30px rgba(0, 0, 0, 0.4)
                  `;
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0) scale(1)';
                  e.target.style.boxShadow = `
                    0 0 30px rgba(255, 0, 128, 0.6),
                    0 0 50px rgba(255, 255, 0, 0.4),
                    0 10px 20px rgba(0, 0, 0, 0.3)
                  `;
                }}
              >
                Enter Moon Room
              </button>
              
              <button
                onClick={() => router.push('/home3')}
                style={{
                  padding: '1rem 2.5rem',
                  background: 'rgba(0, 255, 255, 0.1)',
                  color: '#00FFFF',
                  border: '2px solid #00FFFF',
                  borderRadius: '50px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '1.2rem',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                  boxShadow: '0 0 20px rgba(0, 255, 255, 0.4)',
                  transition: 'all 0.3s ease',
                  textTransform: 'uppercase',
                  letterSpacing: '2px'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = 'rgba(0, 255, 255, 0.3)';
                  e.target.style.transform = 'translateY(-3px) scale(1.05)';
                  e.target.style.boxShadow = '0 0 30px rgba(0, 255, 255, 0.6), 0 10px 20px rgba(0, 0, 0, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'rgba(0, 255, 255, 0.1)';
                  e.target.style.transform = 'translateY(0) scale(1)';
                  e.target.style.boxShadow = '0 0 20px rgba(0, 255, 255, 0.4)';
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
          padding: '1rem',
          background: 'linear-gradient(135deg, rgba(26, 0, 51, 0.95), rgba(0, 0, 0, 0.95))',
          border: '2px solid transparent',
          backgroundClip: 'padding-box',
          borderRadius: '20px',
          boxShadow: `
            0 0 40px rgba(255, 0, 128, 0.5),
            0 0 60px rgba(0, 255, 255, 0.3),
            0 10px 30px rgba(0, 0, 0, 0.5)
          `,
          backdropFilter: 'blur(20px) saturate(180%)',
          zIndex: 1000,
          display: 'flex',
          gap: '0.75rem',
          transition: 'top 0.3s ease',
          overflow: 'hidden'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = `
            0 0 50px rgba(255, 0, 128, 0.7),
            0 0 80px rgba(0, 255, 255, 0.5),
            0 15px 40px rgba(0, 0, 0, 0.6)
          `;
          if (isFullScreen) {
            e.currentTarget.style.top = '1rem';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = `
            0 0 40px rgba(255, 0, 128, 0.5),
            0 0 60px rgba(0, 255, 255, 0.3),
            0 10px 30px rgba(0, 0, 0, 0.5)
          `;
          if (isFullScreen) {
            e.currentTarget.style.top = '-100px';
          }
        }}
      >
        <button
          onClick={() => setShowModal(true)}
          style={{
            padding: '0.75rem 1.25rem',
            background: 'rgba(139, 0, 255, 0.05)',
            color: '#8B00FF',
            border: '1px solid rgba(139, 0, 255, 0.4)',
            borderRadius: '30px',
            cursor: 'pointer',
            fontSize: '0.95rem',
            transition: 'all 0.3s ease',
            textShadow: '0 0 10px rgba(139, 0, 255, 0.5)',
            boxShadow: 'inset 0 0 20px rgba(139, 0, 255, 0.1)'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = 'rgba(139, 0, 255, 0.2)';
            e.target.style.borderColor = '#8B00FF';
            e.target.style.boxShadow = '0 0 25px rgba(139, 0, 255, 0.6), inset 0 0 20px rgba(139, 0, 255, 0.2)';
            e.target.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'rgba(139, 0, 255, 0.05)';
            e.target.style.borderColor = 'rgba(139, 0, 255, 0.4)';
            e.target.style.boxShadow = 'inset 0 0 20px rgba(139, 0, 255, 0.1)';
            e.target.style.transform = 'scale(1)';
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
            padding: '0.75rem 1.25rem',
            background: 'rgba(0, 255, 255, 0.05)',
            color: '#00FFFF',
            border: '1px solid rgba(0, 255, 255, 0.5)',
            borderRadius: '30px',
            cursor: 'pointer',
            fontSize: '0.95rem',
            transition: 'all 0.3s ease',
            textShadow: '0 0 10px rgba(0, 255, 255, 0.5)',
            boxShadow: 'inset 0 0 20px rgba(0, 255, 255, 0.1)'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = 'rgba(0, 255, 255, 0.2)';
            e.target.style.borderColor = '#00FFFF';
            e.target.style.boxShadow = '0 0 25px rgba(0, 255, 255, 0.6), inset 0 0 20px rgba(0, 255, 255, 0.2)';
            e.target.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'rgba(0, 255, 255, 0.05)';
            e.target.style.borderColor = 'rgba(0, 255, 255, 0.5)';
            e.target.style.boxShadow = 'inset 0 0 20px rgba(0, 255, 255, 0.1)';
            e.target.style.transform = 'scale(1)';
          }}
        >
          {isFullScreen ? '🗗 Exit Fullscreen' : '⛶ Fullscreen'}
        </button>
        
        <button
          onClick={() => router.push('/home3')}
          style={{
            padding: '0.75rem 1.25rem',
            background: 'linear-gradient(135deg, #FF0080, #FF00FF)',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '30px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '0.95rem',
            boxShadow: `
              0 0 25px rgba(255, 0, 128, 0.6),
              0 0 40px rgba(255, 0, 255, 0.4),
              0 5px 15px rgba(0, 0, 0, 0.3)
            `,
            transition: 'all 0.3s ease',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-3px) scale(1.05)';
            e.target.style.boxShadow = `
              0 0 35px rgba(255, 0, 128, 0.8),
              0 0 50px rgba(255, 0, 255, 0.6),
              0 8px 20px rgba(0, 0, 0, 0.4)
            `;
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0) scale(1)';
            e.target.style.boxShadow = `
              0 0 25px rgba(255, 0, 128, 0.6),
              0 0 40px rgba(255, 0, 255, 0.4),
              0 5px 15px rgba(0, 0, 0, 0.3)
            `;
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
      
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }
        @keyframes float {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(30px, -30px) rotate(120deg); }
          66% { transform: translate(-20px, 20px) rotate(240deg); }
        }
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes glow {
          from { filter: brightness(1) drop-shadow(0 0 20px rgba(255, 0, 128, 0.5)); }
          to { filter: brightness(1.2) drop-shadow(0 0 40px rgba(255, 0, 128, 0.8)); }
        }
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0) translateY(0); }
          40% { transform: scale(1) translateY(-20px); }
        }
      `}</style>
    </div>
  );
}