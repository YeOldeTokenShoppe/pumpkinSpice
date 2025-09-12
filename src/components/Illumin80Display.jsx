'use client';
import { useUser, UserButton, SignInButton } from '@clerk/nextjs';
import { useState, useEffect } from 'react';
import { checkUserIllumin80Status } from '@/utils/firestore-illumin80';

// 1. Profile Card Enhancement - adds glow to user avatar
export function Illumin80AvatarGlow({ children }) {
  const { user } = useUser();
  const [isIllumin80, setIsIllumin80] = useState(false);
  
  useEffect(() => {
    if (user?.id) {
      checkUserIllumin80Status(user.id).then(status => {
        setIsIllumin80(status.isIllumin80);
      });
    }
  }, [user]);
  
  return (
    <div style={{
      position: 'relative',
      display: 'inline-block'
    }}>
      {children}
      {isIllumin80 && (
        <>
          <div style={{
            position: 'absolute',
            top: '-5px',
            right: '-5px',
            width: '30px',
            height: '30px',
            backgroundColor: '#FFD700',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
            boxShadow: '0 0 15px rgba(255, 215, 0, 0.8)',
            animation: 'pulse 2s infinite',
            zIndex: 10
          }}>
            ⚜️
          </div>
          <div style={{
            position: 'absolute',
            inset: '-4px',
            borderRadius: '50%',
            border: '3px solid #FFD700',
            boxShadow: '0 0 20px rgba(255, 215, 0, 0.6), inset 0 0 10px rgba(255, 215, 0, 0.3)',
            animation: 'rotate 10s linear infinite',
            pointerEvents: 'none'
          }} />
        </>
      )}
      
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.9; }
        }
        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// 2. Mini Banner - can be placed anywhere
export function Illumin80Banner() {
  const { user } = useUser();
  const [status, setStatus] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  
  useEffect(() => {
    async function checkStatus() {
      if (user) {
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
        
        console.log('Checking Illumin80 for:', identifiers);
        
        for (const identifier of identifiers) {
          const result = await checkUserIllumin80Status(identifier);
          if (result.isIllumin80) {
            setStatus(result);
            break;
          }
        }
      }
    }
    checkStatus();
  }, [user]);
  
  if (!status?.isIllumin80) return null;
  
  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(0, 255, 255, 0.1))',
      border: '1px solid #FFD700',
      borderRadius: collapsed ? '20px' : '8px',
      padding: collapsed ? '8px 12px' : '15px 20px',
      margin: '10px 0',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      boxShadow: '0 4px 15px rgba(255, 215, 0, 0.3)'
    }}
    onClick={() => setCollapsed(!collapsed)}
    >
      {collapsed ? (
        <span style={{ fontSize: '20px' }}>⚜️</span>
      ) : (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span style={{ fontSize: '28px' }}>⚜️</span>
            <div>
              <h3 style={{ 
                color: '#FFD700', 
                margin: 0,
                fontFamily: 'UnifrakturCook, serif',
                fontSize: '18px'
              }}>
                Member of the Illumin80
              </h3>
              <p style={{ 
                color: '#00FFFF', 
                margin: '5px 0 0 0',
                fontSize: '14px',
                fontStyle: 'italic'
              }}>
                {status.title} • Rank #{status.rank}
              </p>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: '#FFD700', fontSize: '20px', fontWeight: 'bold' }}>
              🔥 {status.burnedAmount?.toLocaleString()}
            </div>
            <div style={{ color: '#888', fontSize: '12px' }}>tokens burned</div>
          </div>
        </div>
      )}
    </div>
  );
}

// 3. Animated Title - replaces username in certain places
export function Illumin80Title({ username, showOriginal = false }) {
  const { user } = useUser();
  const [status, setStatus] = useState(null);
  
  useEffect(() => {
    async function checkStatus() {
      if (user) {
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
        
        console.log('Checking Illumin80 for:', identifiers);
        
        for (const identifier of identifiers) {
          const result = await checkUserIllumin80Status(identifier);
          if (result.isIllumin80) {
            setStatus(result);
            break;
          }
        }
      }
    }
    checkStatus();
  }, [user]);
  
  if (!status?.isIllumin80) {
    return <span>{username}</span>;
  }
  
  return (
    <span style={{
      background: 'linear-gradient(90deg, #FFD700, #FFA500, #FFD700)',
      backgroundSize: '200% 100%',
      backgroundClip: 'text',
      WebkitBackgroundClip: 'text',
      color: 'transparent',
      fontWeight: 'bold',
      fontFamily: 'UnifrakturCook, serif',
      animation: 'shimmer 3s linear infinite',
      textShadow: '0 0 20px rgba(255, 215, 0, 0.5)'
    }}>
      {showOriginal && username}
      {showOriginal && ' • '}
      {status.title}
      
      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
      `}</style>
    </span>
  );
}

// 4. Access Gate - blocks content for non-Illumin80
export function Illumin80Gate({ children, fallback }) {
  const { user } = useUser();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (user?.id) {
      checkUserIllumin80Status(user.id).then(status => {
        setStatus(status);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [user]);
  
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{ fontSize: '24px', animation: 'spin 2s linear infinite' }}>⚜️</div>
        <p style={{ color: '#FFD700' }}>Verifying Sacred Order membership...</p>
      </div>
    );
  }
  
  if (!status?.isIllumin80) {
    return fallback || (
      <div style={{
        backgroundColor: 'rgba(26, 26, 46, 0.8)',
        border: '2px solid #FFD700',
        borderRadius: '12px',
        padding: '40px',
        textAlign: 'center',
        margin: '20px 0'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>🔒</div>
        <h3 style={{ color: '#FFD700', fontFamily: 'UnifrakturCook, serif' }}>
          Illumin80 Members Only
        </h3>
        <p style={{ color: '#00FFFF', marginTop: '10px' }}>
          This sacred content is reserved for the top 80 token burners.
        </p>
        <p style={{ color: '#888', fontSize: '14px', marginTop: '20px' }}>
          Burn more tokens to join the Order and unlock this content.
        </p>
      </div>
    );
  }
  
  return children;
}

// 5. Clerk Button with Laurel Wreath - wraps UserButton with elegant laurel for Illumin80 members
export function Illumin80ClerkButton({ afterSignOutUrl = "/" }) {
  const { user, isSignedIn } = useUser();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function checkStatus() {
      if (user) {
        setLoading(true);
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
        
        for (const identifier of identifiers) {
          try {
            const result = await checkUserIllumin80Status(identifier);
            if (result.isIllumin80) {
              setStatus(result);
              setLoading(false);
              return;
            }
          } catch (error) {
            console.error(`Error checking ${identifier}:`, error);
          }
        }
        setLoading(false);
      } else {
        setLoading(false);
      }
    }
    checkStatus();
  }, [user]);
  
  const isIllumin80 = status?.isIllumin80;
  
  if (!isSignedIn) {
    return (
      <SignInButton mode="modal">
        <button
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "8px",
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            border: "2px solid rgba(255, 255, 255, 0.2)",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            backdropFilter: "blur(10px)",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)"
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
          </svg>
        </button>
      </SignInButton>
    );
  }
  
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {/* Laurel Wreath for Illumin80 members */}
      {isIllumin80 && (
        <>
          {/* Left laurel branch */}
          <div style={{
            position: 'absolute',
            left: '-8px',
            top: '50%',
            transform: 'translateY(-50%) rotate(-15deg)',
            fontSize: '24px',
            color: '#FFD700',
            filter: 'drop-shadow(0 0 4px rgba(255, 215, 0, 0.6))',
            pointerEvents: 'none',
            zIndex: 1
          }}>
            🌿
          </div>
          
          {/* Right laurel branch */}
          <div style={{
            position: 'absolute',
            right: '-8px',
            top: '50%',
            transform: 'translateY(-50%) rotate(15deg) scaleX(-1)',
            fontSize: '24px',
            color: '#FFD700',
            filter: 'drop-shadow(0 0 4px rgba(255, 215, 0, 0.6))',
            pointerEvents: 'none',
            zIndex: 1
          }}>
            🌿
          </div>
          
          {/* Top fleur-de-lis */}
          <div style={{
            position: 'absolute',
            top: '-12px',
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '16px',
            color: '#FFD700',
            filter: 'drop-shadow(0 0 6px rgba(255, 215, 0, 0.8))',
            pointerEvents: 'none',
            zIndex: 2,
            animation: 'subtleGlow 3s ease-in-out infinite'
          }}>
            ⚜️
          </div>
          
          {/* Subtle golden ring */}
          <div style={{
            position: 'absolute',
            inset: '-3px',
            borderRadius: '10px',
            border: '1px solid rgba(255, 215, 0, 0.3)',
            boxShadow: '0 0 8px rgba(255, 215, 0, 0.2)',
            pointerEvents: 'none',
            animation: 'subtlePulse 4s ease-in-out infinite'
          }} />
        </>
      )}
      
      {/* The actual Clerk UserButton */}
      <UserButton 
        afterSignOutUrl={afterSignOutUrl}
        appearance={{
          elements: {
            avatarBox: {
              width: "40px",
              height: "40px",
              borderRadius: "8px",
              border: isIllumin80 ? "2px solid #FFD700" : "2px solid rgba(255, 255, 255, 0.2)",
              backgroundColor: "rgba(0, 0, 0, 0.7)",
              backdropFilter: "blur(10px)",
              boxShadow: isIllumin80 
                ? "0 2px 12px rgba(255, 215, 0, 0.4)" 
                : "0 2px 8px rgba(0, 0, 0, 0.3)"
            }
          }
        }}
      />
      
      {/* Hover tooltip */}
      {isIllumin80 && (
        <div style={{
          position: 'absolute',
          bottom: '-30px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'rgba(26, 26, 46, 0.95)',
          color: '#FFD700',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '11px',
          fontFamily: 'UnifrakturCook, serif',
          whiteSpace: 'nowrap',
          opacity: 0,
          pointerEvents: 'none',
          transition: 'opacity 0.3s ease',
          border: '1px solid #FFD700',
          zIndex: 1000
        }}
        className="illumin80-tooltip"
        >
          Illumin80 #{status?.rank}
        </div>
      )}
      
      <style jsx>{`
        @keyframes subtleGlow {
          0%, 100% { 
            filter: drop-shadow(0 0 6px rgba(255, 215, 0, 0.8)); 
            transform: translateX(-50%) scale(1);
          }
          50% { 
            filter: drop-shadow(0 0 10px rgba(255, 215, 0, 1)); 
            transform: translateX(-50%) scale(1.1);
          }
        }
        
        @keyframes subtlePulse {
          0%, 100% { 
            opacity: 0.3;
            box-shadow: 0 0 8px rgba(255, 215, 0, 0.2);
          }
          50% { 
            opacity: 0.5;
            box-shadow: 0 0 12px rgba(255, 215, 0, 0.3);
          }
        }
        
        div:hover .illumin80-tooltip {
          opacity: 1 !important;
        }
      `}</style>
    </div>
  );
}