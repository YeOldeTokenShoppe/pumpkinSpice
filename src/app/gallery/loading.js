"use client";

import SimpleLoader from '@/components/SimpleLoader';
import { useEffect } from 'react';

export default function Loading() {
  useEffect(() => {
    console.log('Gallery loading.js is rendering');
  }, []);
  
  return (
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
  );
}