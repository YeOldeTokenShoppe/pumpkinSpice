'use client';
import { useUser } from '@clerk/nextjs';

export function Illumin80Badge() {
  const { user } = useUser();
  
  const isIllumin80 = user?.publicMetadata?.isIllumin80;
  
  if (!isIllumin80) return null;
  
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '4px 12px',
      backgroundColor: '#FFD700',
      color: '#1a1a2e',
      borderRadius: '4px',
      fontSize: '12px',
      fontWeight: 'bold',
      fontFamily: 'UnifrakturCook, serif',
      boxShadow: '0 0 20px rgba(255, 215, 0, 0.6), inset 0 0 10px rgba(255, 255, 255, 0.3)',
      border: '1px solid #FFA500',
      background: 'linear-gradient(135deg, #FFD700, #FFA500)',
      textShadow: '0 0 3px rgba(0, 0, 0, 0.3)',
      animation: 'illumin80Glow 2s ease-in-out infinite alternate'
    }}>
      <span style={{ marginRight: '6px', fontSize: '14px' }}>⚜️</span>
      ILLUMIN80
      <span style={{ marginLeft: '6px', fontSize: '14px' }}>⚜️</span>
      
      <style jsx>{`
        @keyframes illumin80Glow {
          from { box-shadow: 0 0 20px rgba(255, 215, 0, 0.6), inset 0 0 10px rgba(255, 255, 255, 0.3); }
          to { box-shadow: 0 0 30px rgba(255, 215, 0, 0.9), inset 0 0 15px rgba(255, 255, 255, 0.5); }
        }
      `}</style>
    </div>
  );
}

// Hook to check Illumin80 status
export function useIllumin80() {
  const { user } = useUser();
  return {
    isIllumin80: user?.publicMetadata?.isIllumin80 || false,
    userId: user?.id
  };
}