'use client';
import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import Bouncer from './Bouncer';
import { checkUserIllumin80Status } from '@/utils/firestore-illumin80';

const Illumin80Bouncer = ({ 
  doorLink = "/moonroom",  // Link to the Moon Room page
  disableBlockingBehavior = false,
  onDoorClick 
}) => {
  const { user, isLoaded } = useUser();
  const [isIllumin80, setIsIllumin80] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  useEffect(() => {
    async function checkStatus() {
      if (!isLoaded) return;
      
      if (user) {
        setCheckingStatus(true);
        
        // Try multiple identifiers to match with Firestore
        const identifiers = [
          user.username,
          user.firstName,
          user.lastName,
          user.fullName,
          user.primaryEmailAddress?.emailAddress,
          user.emailAddresses?.[0]?.emailAddress,
          user.id
        ].filter(Boolean);
        
        console.log('🔍 Checking Illumin80 access for:', identifiers);
        
        for (const identifier of identifiers) {
          try {
            const result = await checkUserIllumin80Status(identifier);
            if (result.isIllumin80) {
              console.log('✅ Illumin80 member verified! Access granted to Moon Room');
              setIsIllumin80(true);
              setCheckingStatus(false);
              return;
            }
          } catch (error) {
            console.error(`Error checking ${identifier}:`, error);
          }
        }
        
        console.log('❌ Not an Illumin80 member - access denied');
        setIsIllumin80(false);
        setCheckingStatus(false);
      } else {
        // No user logged in
        setIsIllumin80(false);
        setCheckingStatus(false);
      }
    }
    
    checkStatus();
  }, [user, isLoaded]);

  // Show loading state while checking
  if (checkingStatus) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '40px',
        color: '#FFD700',
        fontFamily: 'UnifrakturCook, serif'
      }}>
        <div style={{ 
          fontSize: '48px', 
          animation: 'spin 2s linear infinite',
          display: 'inline-block'
        }}>
          ⚜️
        </div>
        <p>Verifying Illumin80 credentials...</p>
        <style jsx>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <Bouncer
      hasToken={isIllumin80}
      doorLink={doorLink}
      disableBlockingBehavior={disableBlockingBehavior}
      onDoorClick={onDoorClick}
    />
  );
};

export default Illumin80Bouncer;