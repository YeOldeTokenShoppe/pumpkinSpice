// import { useEffect, useState } from 'react';
// import { GameState } from '../../src/lib/GameState';
// import { useSnapshot } from 'valtio';

// export const RespawnOverlay = () => {
//   const [showOverlay, setShowOverlay] = useState(false);
//   const [showButtons, setShowButtons] = useState(false);
//   const gameState = useSnapshot(GameState);
  
//   useEffect(() => {
//     if (gameState.triggerRespawn) {
//       // Start fade in
//       setShowOverlay(true);
      
//       // Show buttons after fade in completes
//       const buttonTimer = setTimeout(() => {
//         setShowButtons(true);
//       }, 400);
      
//       return () => clearTimeout(buttonTimer);
//     }
//   }, [gameState.triggerRespawn]);
  
//   const handlePlayAgain = () => {
//     // Do a full page reload to reset all game state
//     window.location.reload();
//   };
  
//   const handleExit = () => {
//     // Use replace to prevent back button issues
//     window.location.href = '/';
//   };
  
//   return (
//     <>
//       <div 
//         style={{
//           position: 'fixed',
//           top: 0,
//           left: 0,
//           width: '100vw',
//           height: '100vh',
//           backgroundColor: 'black',
//           opacity: showOverlay ? 1 : 0,
//           transition: 'opacity 0.4s ease-in-out',
//           pointerEvents: showOverlay ? 'all' : 'none',
//           zIndex: 1000,
//           display: 'flex',
//           flexDirection: 'column',
//           alignItems: 'center',
//           justifyContent: 'center',
//         }}
//       >
//         {showButtons && (
//           <div style={{
//             display: 'flex',
//             flexDirection: 'column',
//             gap: '20px',
//             opacity: showButtons ? 1 : 0,
//             transition: 'opacity 0.3s ease-in',
//           }}>
//             <button
//               onClick={handlePlayAgain}
//               style={{
//                 padding: '15px 40px',
//                 fontSize: '18px',
//                 fontFamily: 'Orbitron, monospace',
//                 fontWeight: 'bold',
//                 backgroundColor: '#00ff41',
//                 color: '#000',
//                 border: 'none',
//                 borderRadius: '8px',
//                 cursor: 'pointer',
//                 textTransform: 'uppercase',
//                 letterSpacing: '2px',
//                 boxShadow: '0 0 20px rgba(0, 255, 65, 0.5)',
//                 transition: 'all 0.3s ease',
//               }}
//               onMouseEnter={(e) => {
//                 e.target.style.backgroundColor = '#00ff88';
//                 e.target.style.transform = 'scale(1.05)';
//               }}
//               onMouseLeave={(e) => {
//                 e.target.style.backgroundColor = '#00ff41';
//                 e.target.style.transform = 'scale(1)';
//               }}
//             >
//               Play Again
//             </button>
            
//             <button
//               onClick={handleExit}
//               style={{
//                 padding: '15px 40px',
//                 fontSize: '18px',
//                 fontFamily: 'Orbitron, monospace',
//                 fontWeight: 'bold',
//                 backgroundColor: 'transparent',
//                 color: '#ff4444',
//                 border: '2px solid #ff4444',
//                 borderRadius: '8px',
//                 cursor: 'pointer',
//                 textTransform: 'uppercase',
//                 letterSpacing: '2px',
//                 boxShadow: '0 0 20px rgba(255, 68, 68, 0.3)',
//                 transition: 'all 0.3s ease',
//               }}
//               onMouseEnter={(e) => {
//                 e.target.style.backgroundColor = '#ff4444';
//                 e.target.style.color = '#000';
//                 e.target.style.transform = 'scale(1.05)';
//               }}
//               onMouseLeave={(e) => {
//                 e.target.style.backgroundColor = 'transparent';
//                 e.target.style.color = '#ff4444';
//                 e.target.style.transform = 'scale(1)';
//               }}
//             >
//               Exit
//             </button>
//           </div>
//         )}
//       </div>
      
//       <style jsx>{`
//         @media (max-width: 768px) {
//           button {
//             padding: 12px 30px !important;
//             fontSize: 16px !important;
//           }
//         }
//       `}</style>
//     </>
//   );
// };