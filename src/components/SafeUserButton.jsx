'use client';
import { useState, useEffect } from 'react';
import { useUser, useClerk, SignInButton } from '@clerk/nextjs';
import { UserModal } from './UserModal';
import { checkUserIllumin80Status } from '@/utils/firestore-illumin80';

export function SafeUserButton({ 
  appearance,
  illumin80Status: providedStatus = null
}) {
  const [clerkReady, setClerkReady] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [illumin80Status, setIllumin80Status] = useState(providedStatus);
  const [streak, setStreak] = useState(0);
  
  // Try to use Clerk hooks safely
  let user = null;
  let isSignedIn = false;
  let isLoaded = false;
  
  try {
    const clerkUser = useUser();
    user = clerkUser.user;
    isSignedIn = clerkUser.isSignedIn;
    isLoaded = clerkUser.isLoaded;
    
    // If we get here, Clerk is working
    useEffect(() => {
      if (isLoaded && !clerkReady) {
        setClerkReady(true);
      }
    }, [isLoaded]);
  } catch (error) {
    console.warn('Clerk not available:', error);
  }

  useEffect(() => {
    if (providedStatus) {
      setIllumin80Status(providedStatus);
      return;
    }

    async function checkStatus() {
      if (user) {
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
              setIllumin80Status(result);
              return;
            }
          } catch (error) {
            console.error(`Error checking ${identifier}:`, error);
          }
        }
      }
    }
    
    if (user) {
      checkStatus();
    }
  }, [user, providedStatus]);

  useEffect(() => {
    async function checkStreak() {
      if (user?.id) {
        try {
          const response = await fetch('/api/check-streak', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id })
          });
          if (response.ok) {
            const data = await response.json();
            setStreak(data.currentStreak || 0);
          }
        } catch (error) {
          console.error('Error checking streak:', error);
        }
      }
    }
    
    if (user) {
      checkStreak();
    }
  }, [user]);

  // Loading state
  if (!clerkReady && !isLoaded) {
    return (
      <div style={{
        width: '48px',
        height: '48px',
        borderRadius: '12px',
        background: 'rgba(255, 255, 255, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          background: 'rgba(255, 255, 255, 0.2)',
          animation: 'pulse 2s infinite'
        }} />
      </div>
    );
  }

  // Not signed in - use SignInButton which is more reliable
  if (!isSignedIn) {
    return (
      <SignInButton mode="modal">
        <button
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            overflow: 'hidden',
            padding: 0,
            border: '2px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
            background: 'rgba(0, 0, 0, 0.5)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.borderColor = 'rgba(147, 51, 234, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
          }}
          aria-label="Sign in"
        >
          <svg 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            style={{ color: 'white' }}
          >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </button>
      </SignInButton>
    );
  }

  // Signed in - show custom button with user avatar
  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="relative transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500"
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '12px',
          overflow: 'hidden',
          padding: 0,
          border: illumin80Status?.isIllumin80 
            ? "2px solid #FFD700" 
            : "2px solid rgba(255, 255, 255, 0.2)",
          boxShadow: illumin80Status?.isIllumin80 
            ? "0 0 15px rgba(255, 215, 0, 0.4)" 
            : "0 2px 8px rgba(0, 0, 0, 0.3)",
          background: 'rgba(0, 0, 0, 0.5)',
          cursor: 'pointer'
        }}
        aria-label="Open user menu"
      >
        {user?.imageUrl ? (
          <img
            src={user.imageUrl}
            alt={user.fullName || 'User'}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <div
          style={{
            width: '100%',
            height: '100%',
            display: user?.imageUrl ? 'none' : 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            fontSize: '20px',
            fontWeight: 'bold'
          }}
        >
          {user?.firstName?.[0] || user?.username?.[0] || '?'}
        </div>
      </button>
      
      {showModal && (
        <UserModal 
          isOpen={showModal} 
          onClose={() => setShowModal(false)}
          illumin80Status={illumin80Status}
        />
      )}
    </>
  );
}