import React, { Suspense, useState } from 'react';
import { motion } from 'framer-motion';
import SkewedHeading from './SkewedHeading';
import dynamic from 'next/dynamic';
import HandsGLTFScene from "@/components/HandsGLTFScene";
import { useFirestoreResults } from '../utilities/useFirestoreResults';
import CyberButton from '@/components/CyberButton';
import { useUser, SignInButton } from "@clerk/nextjs";
import Numerology1 from './Numerology1';
import { Canvas } from '@react-three/fiber';
import Link from 'next/link';
import { useGLTF, OrbitControls, Environment } from '@react-three/drei';
import VideoScreens from "@/components/VideoScreens";



// Dynamically import the 3D scene to avoid SSR issues
const Illumin80Scene = dynamic(() => import('./Illumin80Scene'), {
  ssr: false,
  loading: () => (
    <div style={{
      width: '100%',
      height: '400px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#00ff9d',
    }}>
      Loading 3D Scene...
    </div>
  ),
});





    const handleOpenModal = () => {
    if (!isSignedIn) {
      const btn = document.getElementById('hidden-sign-in-home3');
      btn?.click();
    } else {
      setIsModalOpen(true);
    }
  }


export const WatchlistSlide = () => {
    const [isMobile, setIsMobile] = useState(false);
      const topBurners = useFirestoreResults("burnedAmount");
  return (
       <div style={{
      width: "100%",
      minHeight: "600px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "3rem 2rem",
      background: "linear-gradient(135deg, rgba(147, 51, 234, 0.1) 0%, rgba(79, 70, 229, 0.05) 100%)",
      position: "relative",
    }}>
               
               {/* Grid pattern overlay */}
               <div style={{
                 position: 'absolute',
                 top: 0,
                 left: 0,
                 right: 0,
                 bottom: 0,
                 backgroundImage: `
                   repeating-linear-gradient(
                     0deg,
                     transparent,
                     transparent 2px,
                     rgba(0, 255, 0, 0.02) 2px,
                     rgba(0, 255, 0, 0.02) 4px
                   ),
                   repeating-linear-gradient(
                     90deg,
                     transparent,
                     transparent 2px,
                     rgba(0, 255, 0, 0.02) 2px,
                     rgba(0, 255, 0, 0.02) 4px
                   )
                 `,
                 pointerEvents: 'none',
               }} />
   
               {/* Glow effect */}
               <div style={{
                 content: '',
                 position: 'absolute',
                 top: '-50%',
                 left: '-50%',
                 width: '200%',
                 height: '200%',
                 background: 'radial-gradient(circle, rgba(0, 255, 0, 0.05) 0%, transparent 70%)',
                 animation: 'handsRotate 30s linear infinite',
                 zIndex: 0
               }} />
   
               <div style={{
                 position: "relative",
                 display: "grid",
                 gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1.55fr) minmax(0, 1.45fr)",
                 gap: isMobile ? "2rem" : "3rem",
                 alignItems: "center",
                 color: '#ffffff',
                 zIndex: 1
               }}>
                                  
                                 <div style={{
                             height: isMobile ? '50vh' : '70vh',
                             minHeight: '400px',
                           }}>
                             <HandsGLTFScene />
                           </div>
                                  {/* Right Column - Text Content */}
                      <div style={{
                 padding: isMobile ? '0 0.5rem' : '0 1rem',
                 color: '#ffffff',
                 minHeight: isMobile ? '300px' : '500px', // Match the candle container height
                 display: 'flex',
                 flexDirection: 'column',
                 justifyContent: 'center',
                 alignItems: 'center', // Center all children horizontally
                 width: '100%', // Ensure full width of grid column
                 boxSizing: 'border-box', // Include padding in width calculation
                 overflow: 'hidden', // Prevent content overflow
                 position: 'relative',
                 marginTop: isMobile ? '0' : '0'
               }}>
                
        
                 <br/>
        
                 {/* <h1 style={{fontFamily: 'UnifrakturCook, serif', fontSize: isMobile ? '2.5rem' : '3.5rem', marginTop: '2rem', marginBottom: '1.5rem', textAlign: 'center', lineHeight: '0.8',color: '#d4af37'}}>Get On Her Watchlist</h1> */}
                     {/* <h1 style={{
                 fontSize: '3rem',
                 marginBottom: '1rem',
                 lineHeight: '2.5rem',
                 color: '#d4af37',
                 fontFamily: 'UnifrakturCook, serif',
                 // textShadow: '0 0 15px rgba(212, 175, 55, 0.5)',
   textShadow: '-1px -1px 0 #000000, 1px -1px 0 #000000, -1px 1px 0 #000000, 1px 1px 0 #000000',
     textAlign: 'center',
               }}>Get On Her Watchlist</h1> */}
                 <SkewedHeading 
       lines={["GET ON HER", "WATCHLIST"]}
   fontSize="4rem"
          color="#00ff9d"
          skewAngle={-2}
          shadowColor="#000"
          style={{ marginBottom: "2rem" }}
     />
                 <div style={{
                   lineHeight: 1.5,
                   opacity: 0.9,
                   fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                   fontWeight: 400,
                   letterSpacing: '0.02em',
                   fontSize: isMobile ? '1.2rem' : '1.4rem',
                   textAlign: 'center',
                   width: '100%',
                   // maxWidth: '600px',
                 }}>
                 {/* <span style={{ fontSize: isMobile ? '1.3rem' : '1.8rem', fontWeight: '600', display: 'block', marginBottom: '1.5rem', lineHeight: '1.3' }}>
                   Add a Green Candle to Her Timeline
                 </span> */}
                 {/* <p style={{ 
                   marginBottom: '2rem',
                   fontFamily: "'Pirata One', cursive",
                   fontSize: isMobile ? '1.5rem' : '1.8rem',
                   fontWeight: '400',
                   textAlign: 'center',
                   color: '#ffffff',
                   textShadow: '2px 2px 4px rgba(0, 0, 0, 0.7)'
                 }}>
                   Join The Leaderboard of Luminaries
                 </p> */}
                      {/* <img src="/timeline2.png" alt="Candle Icon" style={{ width: isMobile ? '50%' : '50%', height: 'auto', marginBottom: '-1rem', marginTop: '-2rem' }} /> */}
                       <span style={{               fontFamily: "'Fjalla One', sans-serif",
   fontSize: isMobile ? '1.3rem' : '1.8rem', fontWeight: '600', display: 'block', marginBottom: '0.5rem', lineHeight: '1.3' }}>
                   Light a Green Candle for Luck
                 </span>         
                 <p style={{ marginBottom: '1rem', opacity: 0.8, fontSize: isMobile ? '1rem' : '1.1rem' }}>
   Burn or stake RL80 to add a green candle to her timeline and watch miracles happen.  
                 </p>
   
                 {/* Top Burners Leaderboard */}
                 <div style={{
                   margin: '2rem 0',
                   padding: '1.5rem',
                   background: 'rgba(0, 0, 0, 0.4)',
                   backdropFilter: 'blur(20px)',
                   border: '1px solid rgba(212, 175, 55, 0.3)',
                   borderRadius: '15px',
                   color: '#ffffff',
                   fontFamily: "'Inter', sans-serif",
                   boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)',
                 }}>
                   <h3 style={{
                     fontSize: isMobile ? '1.2rem' : '1.4rem',
                     color: '#d4af37',
                     textAlign: 'center',
                     marginBottom: '1rem',
                     fontFamily: "'Fjalla One', sans-serif",
                     textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)',
                   }}>
                     🔥 Top Burners
                   </h3>
                   <div 
                     className="leaderboard-scroll"
                     style={{
                       maxHeight: '220px',
                       overflowY: 'auto',
                       scrollbarWidth: 'thin',
                       scrollbarColor: 'rgba(212, 175, 55, 0.5) transparent',
                       paddingRight: '5px',
                     }}
                   >
                     {topBurners.slice(0, 10).map((burner, index) => (
                       <div 
                         key={burner.id || index} 
                         style={{
                           display: 'flex',
                           justifyContent: 'space-between',
                           alignItems: 'center',
                           padding: '0.5rem 0.5rem',
                           borderBottom: index < 9 ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
                           borderRadius: '8px',
                           transition: 'background 0.2s ease',
                           position: 'relative',
                         }}
                         onMouseEnter={(e) => {
                           e.currentTarget.style.background = 'rgba(212, 175, 55, 0.08)';
                         }}
                         onMouseLeave={(e) => {
                           e.currentTarget.style.background = 'transparent';
                         }}
                       >
                         <div style={{
                           display: 'flex',
                           alignItems: 'center',
                           gap: '0.5rem',
                         }}>
                           <span style={{
                             fontSize: isMobile ? '0.9rem' : '1rem',
                             fontWeight: 'bold',
                             color: index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : '#d4af37',
                             minWidth: '2rem',
                             display: 'flex',
                             alignItems: 'center',
                             gap: '0.25rem',
                           }}>
                             {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                           </span>
                           {burner.image && (
                             <div style={{
                               width: '24px',
                               height: '24px',
                               borderRadius: '50%',
                               overflow: 'hidden',
                               border: '1px solid rgba(212, 175, 55, 0.5)',
                               flexShrink: 0,
                             }}>
                               <img 
                                 src={burner.image} 
                                 alt={burner.userName || 'User'} 
                                 style={{
                                   width: '100%',
                                   height: '100%',
                                   objectFit: 'cover',
                                 }}
                                 onError={(e) => {
                                   e.target.style.display = 'none';
                                 }}
                               />
                             </div>
                           )}
                           <span style={{
                             fontSize: isMobile ? '0.9rem' : '1rem',
                             color: '#ffffff',
                           }}>
                             {burner.userName || 'Anonymous'}
                           </span>
                         </div>
                         <span style={{
                           fontSize: isMobile ? '0.8rem' : '0.9rem',
                           color: '#ffd700',
                           fontWeight: 'bold',
                           textShadow: '0 0 5px rgba(255, 215, 0, 0.3)',
                         }}>
                           {(burner.burnedAmount || 0).toLocaleString()} RL80
                         </span>
                       </div>
                     ))}
                     {topBurners.length === 0 && (
                       <div style={{
                         textAlign: 'center',
                         padding: '1rem',
                         color: 'rgba(255, 255, 255, 0.7)',
                         fontStyle: 'italic',
                       }}>
                         Loading top burners...
                       </div>
                     )}
                   </div>
                 </div>
   
             </div>
          <CyberButton
                           onClick={handleOpenModal}
                           size={isMobile ? 'medium' : 'large'}
                           variant="primary"
                           style={{
                             marginTop: '1rem',
                             zIndex: 102,
                           }}
                         >
                           Get Lit
                         </CyberButton>
                  
              
                       </div>
               </div>
             </div>
  );
};

export const Illumin80Slide = () => {
  const [showEye, setShowEye] = useState(false);

  return (
 <div style={{
      width: "100%",
      minHeight: "600px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "3rem 2rem",
      // background: "linear-gradient(135deg, rgba(147, 51, 234, 0.1) 0%, rgba(79, 70, 229, 0.05) 100%)",
      position: "relative",
    }}>
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "2rem",
        maxWidth: "1300px",
        width: "100%",
        alignItems: "center",
        position: "relative",
        zIndex: 2,
      }}>
        {/* Left side - Content */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          justifyContent: "center",
          height: "100%",
        }}>
          <SkewedHeading
            lines={["THE ILLUMIN80"]}
            fontSize="3.5rem"
            color="#00ff9d"
            skewAngle={-2}
            shadowColor="#000"
            style={{ marginBottom: "2rem" }}
          />
          
          <p style={{
            fontSize: "1.1rem",
            color: "rgba(255, 255, 255, 0.9)",
            marginBottom: "3rem",
            lineHeight: 1.8,
            background: "rgba(0, 0, 0, 0.5)",
            padding: "1rem",
            borderRadius: "8px",
            backdropFilter: "blur(5px)",
          }}>
            Part mystery cult, part secret trading guild. The Illumin80 represent the true believers 
            among token holders by amount staked or burned — a level that unlocks even more glorious 
            gains. Powerful but not evil.
          </p>
        
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1.5rem",
          maxWidth: "600px",
          margin: "0 auto 3rem",
        }}>
          <div style={{
            background: "rgba(0, 0, 0, 0.4)",
            backdropFilter: "blur(10px)",
            padding: "1.5rem",
            borderRadius: "12px",
            border: "1px solid rgba(0, 255, 157, 0.2)",
          }}>
            <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🔺</div>
            <div style={{ color: "#00ff9d", fontWeight: "bold", marginBottom: "0.25rem" }}>Secret Access</div>
            <div style={{ fontSize: "0.8rem", color: "rgba(255, 255, 255, 0.6)" }}>Hidden features unlock</div>
          </div>
          <div style={{
            background: "rgba(0, 0, 0, 0.4)",
            backdropFilter: "blur(10px)",
            padding: "1.5rem",
            borderRadius: "12px",
            border: "1px solid rgba(0, 255, 157, 0.2)",
          }}>
            <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>👁️</div>
            <div style={{ color: "#00ff9d", fontWeight: "bold", marginBottom: "0.25rem" }}>All-Seeing</div>
            <div style={{ fontSize: "0.8rem", color: "rgba(255, 255, 255, 0.6)" }}>Market insights first</div>
          </div>
        </div>

        {/* Toggle 3D Scene Button */}
        {/* <button
          onClick={() => setShowEye(!showEye)}
          style={{
            background: "rgba(0, 255, 157, 0.1)",
            border: "1px solid rgba(0, 255, 157, 0.3)",
            color: "#00ff9d",
            padding: "8px 16px",
            borderRadius: "6px",
            cursor: "pointer",
            marginBottom: "1rem",
            fontSize: "0.8rem",
            transition: "all 0.3s ease",
          }}
          onMouseEnter={(e) => {
            e.target.style.background = "rgba(0, 255, 157, 0.2)";
            e.target.style.borderColor = "rgba(0, 255, 157, 0.5)";
          }}
          onMouseLeave={(e) => {
            e.target.style.background = "rgba(0, 255, 157, 0.1)";
            e.target.style.borderColor = "rgba(0, 255, 157, 0.3)";
          }}
        >
          {showEye ? "👁️ View Pyramid" : "▲ View All-Seeing Eye"}
        </button>
         */}
          <div style={{ 
            display: "flex", 
            gap: "1rem",
            justifyContent: "center",
            marginTop: "auto",
            paddingTop: "2rem"
          }}>
            <button style={{
              background: "linear-gradient(135deg, #ef4444 0%, #f97316 100%)",
              color: "#fff",
              border: "none",
              padding: "12px 32px",
              fontSize: "1rem",
              fontWeight: "bold",
              borderRadius: "8px",
              cursor: "pointer",
              transition: "transform 0.2s ease",
            }}
            onMouseEnter={(e) => e.target.style.transform = "scale(1.05)"}
            onMouseLeave={(e) => e.target.style.transform = "scale(1)"}
            >
              BUY NOW
            </button>
            <button style={{
              background: "linear-gradient(135deg, #00ff9d 0%, #00cc7d 100%)",
              color: "#000",
              border: "none",
              padding: "12px 32px",
              fontSize: "1rem",
              fontWeight: "bold",
              borderRadius: "8px",
              cursor: "pointer",
              transition: "transform 0.2s ease",
            }}
            onMouseEnter={(e) => e.target.style.transform = "scale(1.05)"}
            onMouseLeave={(e) => e.target.style.transform = "scale(1)"}
            >
              STAKE
            </button>
          </div>
        </div>

        {/* Right side - 3D Canvas */}
        <div style={{
          height: "100%",
          minHeight: "500px",
          position: "relative",
          marginRight: "-4rem",
          marginLeft: "-2rem",
        }}>
          <Numerology1/>
        </div>
      </div>
    </div>
  );
};

// Trading Desk 3D Model Component
function TradingDeskModel() {
  const { scene } = useGLTF('/models/tradingDesk.glb');
  
  return (
    <primitive 
      object={scene} 
      scale={[1.5, 1.5, 1.5]}
      position={[0, -3.5, 0]}
      rotation={[0, 0, 0]}
    />
  );
}

export const TradingDeskSlide = () => {
  return (
    <div style={{
      width: "100%",
      minHeight: "600px",
      height: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "2rem",
      background: `radial-gradient(circle at 20% 35%, rgba(5, 217, 232, 0.15) 0%, transparent 35%),
                   radial-gradient(circle at 75% 65%, rgba(167, 66, 255, 0.15) 0%, transparent 35%)`,
      position: "relative",
      overflow: "hidden",
    }}>
      {/* 3D Canvas Background */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 0,
      }}>
        <Canvas
          camera={{ position: [0, 2, 5], fov: 45 }}
          style={{ width: "100%", height: "100%" }}
        >
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <pointLight position={[-10, -10, -5]} intensity={0.5} color="#05d9e8" />
          <pointLight position={[10, -10, 5]} intensity={0.5} color="#ff2a6d" />
          <Suspense fallback={null}>
            <TradingDeskModel />
            <VideoScreens />
            <Environment preset="city" />
          </Suspense>
          <OrbitControls 
            enableZoom={false}
            enablePan={false}
            // autoRotate
            // autoRotateSpeed={0.5}
            maxPolarAngle={Math.PI / 2.5}
            minPolarAngle={Math.PI / 3}
          />
        </Canvas>
      </div>

      {/* Scanlines effect overlay */}
      <div style={{
        position: "absolute",
        top: "-50%",
        left: "-50%",
        width: "200%",
        height: "200%",
        background: `repeating-linear-gradient(
          60deg,
          transparent,
          transparent 20px,
          rgba(255, 42, 109, 0.05) 20px,
          rgba(255, 42, 109, 0.05) 40px
        )`,
        animation: "scanlines 4s linear infinite",
        pointerEvents: "none",
        zIndex: 1,
      }} />

      <div style={{
        maxWidth: "1200px",
        width: "90%",
        position: "relative",
        zIndex: 2,
      }}>
        <SkewedHeading
          lines={["PROFESSIONAL", "TRADING DESK"]}
          fontSize="3rem"
          color="#ff2a6d"
          skewAngle={-2}
          shadowColor="#000"
          style={{ 
            marginBottom: "2rem", 
            textAlign: "center",
            filter: "drop-shadow(0 0 10px rgba(255, 42, 109, 0.5))"
          }}
        />
        
        <div style={{
          background: "rgba(255, 255, 255, 0.1)",
          backdropFilter: "blur(20px)",
          borderRadius: "12px",
          padding: "2rem",
          border: "2px solid transparent",
          borderImage: "linear-gradient(45deg, #ff2a6d, #05d9e8) 1",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1), 0 0 20px rgba(5, 217, 232, 0.3), 0 0 40px rgba(255, 42, 109, 0.2)",
          position: "relative",
          overflow: "hidden",
          maxWidth: "1200px",
          margin: "0 auto",
        }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "3rem",
            marginBottom: "2rem",
            maxWidth: "800px",
            margin: "0 auto 2rem",
          }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ 
                fontSize: "2.5rem", 
                marginBottom: "0.5rem",
                color: "#05d9e8",
                textShadow: "0 0 10px rgba(5, 217, 232, 0.7)",
              }}>📊</div>
              <div style={{ 
                color: "#05d9e8",
                fontSize: "0.9rem",
                fontFamily: "'Orbitron', sans-serif",
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}>Real-time Charts</div>
              <div style={{ 
                color: "#ffe600",
                fontSize: "0.75rem",
                fontFamily: "'Share Tech Mono', monospace",
              }}>Live market data</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ 
                fontSize: "2.5rem", 
                marginBottom: "0.5rem",
                color: "#a742ff",
                textShadow: "0 0 10px rgba(167, 66, 255, 0.7)",
              }}>🤖</div>
              <div style={{ 
                color: "#a742ff",
                fontSize: "0.9rem",
                fontFamily: "'Orbitron', sans-serif",
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}>AI Analysis</div>
              <div style={{ 
                color: "#ffe600",
                fontSize: "0.75rem",
                fontFamily: "'Share Tech Mono', monospace",
              }}>Smart predictions</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ 
                fontSize: "2.5rem", 
                marginBottom: "0.5rem",
                color: "#ff2a6d",
                textShadow: "0 0 10px rgba(255, 42, 109, 0.7)",
              }}>💎</div>
              <div style={{ 
                color: "#ff2a6d",
                fontSize: "0.9rem",
                fontFamily: "'Orbitron', sans-serif",
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}>Elite Tools</div>
              <div style={{ 
                color: "#ffe600",
                fontSize: "0.75rem",
                fontFamily: "'Share Tech Mono', monospace",
              }}>Pro features</div>
            </div>
          </div>
          
          <div style={{
            background: "radial-gradient(rgba(5, 217, 232, 0.1) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
            backgroundColor: "rgba(0, 0, 0, 0.2)",
            backdropFilter: "blur(10px)",
            borderRadius: "8px",
            padding: "1.5rem",
            border: "1px solid #05d9e8",
            boxShadow: "inset 0 0 10px rgba(5, 217, 232, 0.2), 0 4px 15px rgba(0, 0, 0, 0.1)",
            maxWidth: "600px",
            margin: "0 auto",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
              <span style={{ 
                color: "#a742ff",
                fontFamily: "'Share Tech Mono', monospace",
                textTransform: "uppercase",
              }}>Current Price:</span>
              <span style={{ 
                color: "#05d9e8",
                fontFamily: "'Share Tech Mono', monospace",
                fontWeight: "bold",
                textShadow: "0 0 5px rgba(5, 217, 232, 0.5)",
              }}>$0.0008</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
              <span style={{ 
                color: "#a742ff",
                fontFamily: "'Share Tech Mono', monospace",
                textTransform: "uppercase",
              }}>24h Volume:</span>
              <span style={{ 
                color: "#ffe600",
                fontFamily: "'Share Tech Mono', monospace",
                fontWeight: "bold",
                textShadow: "0 0 5px rgba(255, 230, 0, 0.5)",
              }}>$1.2M</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ 
                color: "#a742ff",
                fontFamily: "'Share Tech Mono', monospace",
                textTransform: "uppercase",
              }}>Market Cap:</span>
              <span style={{ 
                color: "#ff2a6d",
                fontFamily: "'Share Tech Mono', monospace",
                fontWeight: "bold",
                textShadow: "0 0 5px rgba(255, 42, 109, 0.5)",
              }}>$80M</span>
            </div>
          </div>
        </div>
        
        <div style={{ textAlign: "center", marginTop: "2rem" }}>
          <button style={{
            background: "transparent",
            color: "#05d9e8",
            border: "1px solid #05d9e8",
            padding: "12px 32px",
            fontSize: "0.9rem",
            fontFamily: "'Orbitron', sans-serif",
            fontWeight: "bold",
            textTransform: "uppercase",
            letterSpacing: "2px",
            borderRadius: "0",
            cursor: "pointer",
            position: "relative",
            overflow: "hidden",
            transition: "all 0.3s ease",
            boxShadow: "0 0 10px rgba(5, 217, 232, 0.3)",
          }}
          onMouseEnter={(e) => {
            e.target.style.background = "rgba(5, 217, 232, 0.2)";
            e.target.style.boxShadow = "0 0 20px rgba(5, 217, 232, 0.6), inset 0 0 10px rgba(5, 217, 232, 0.2)";
            e.target.style.color = "#fff";
            e.target.style.transform = "translateY(-2px)";
          }}
          onMouseLeave={(e) => {
            e.target.style.background = "transparent";
            e.target.style.boxShadow = "0 0 10px rgba(5, 217, 232, 0.3)";
            e.target.style.color = "#05d9e8";
            e.target.style.transform = "translateY(0)";
          }}
          >
            ENTER TRADING DESK
          </button>
        </div>
      </div>
    </div>
  );
};

// Preload the trading desk model
useGLTF.preload('/models/tradingDesk.glb');

export const TokenomicsSlide = () => {
  return (
    <div style={{
      width: "100%",
      minHeight: "600px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "3rem 2rem",
      background: "linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%)",
      position: "relative",
    }}>
      <div style={{
        maxWidth: "1000px",
        width: "100%",
      }}>
        <SkewedHeading
          lines={["TOKENOMICS"]}
          fontSize="3.5rem"
          color="#00ff9d"
          skewAngle={-2}
          shadowColor="#000"
          style={{ marginBottom: "2rem", textAlign: "center" }}
        />
        
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "1.5rem",
          marginBottom: "2rem",
        }}>
          <div style={{
            background: "rgba(0, 0, 0, 0.4)",
            backdropFilter: "blur(10px)",
            borderRadius: "12px",
            padding: "1.5rem",
            border: "1px solid rgba(0, 255, 157, 0.2)",
          }}>
            <h3 style={{ color: "#fff", marginBottom: "1rem", fontSize: "1.2rem" }}>Supply Distribution</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "rgba(255, 255, 255, 0.7)" }}>Total Supply:</span>
                <span style={{ color: "#00ff9d", fontFamily: "monospace" }}>1,000,000,000</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "rgba(255, 255, 255, 0.7)" }}>Circulating:</span>
                <span style={{ color: "#fbbf24", fontFamily: "monospace" }}>800,000,000</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "rgba(255, 255, 255, 0.7)" }}>Burned:</span>
                <span style={{ color: "#ef4444", fontFamily: "monospace" }}>50,000,000</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "rgba(255, 255, 255, 0.7)" }}>Staked:</span>
                <span style={{ color: "#3b82f6", fontFamily: "monospace" }}>150,000,000</span>
              </div>
            </div>
          </div>
          
          <div style={{
            background: "rgba(0, 0, 0, 0.4)",
            backdropFilter: "blur(10px)",
            borderRadius: "12px",
            padding: "1.5rem",
            border: "1px solid rgba(0, 255, 157, 0.2)",
          }}>
            <h3 style={{ color: "#fff", marginBottom: "1rem", fontSize: "1.2rem" }}>Rewards System</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span style={{ fontSize: "1.5rem" }}>🔥</span>
                <div>
                  <div style={{ color: "rgba(255, 255, 255, 0.9)", fontSize: "0.9rem" }}>Burn Rewards</div>
                  <div style={{ color: "#00ff9d", fontSize: "0.75rem" }}>2x multiplier on luck</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span style={{ fontSize: "1.5rem" }}>💎</span>
                <div>
                  <div style={{ color: "rgba(255, 255, 255, 0.9)", fontSize: "0.9rem" }}>Stake Rewards</div>
                  <div style={{ color: "#00ff9d", fontSize: "0.75rem" }}>5% APY + bonuses</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span style={{ fontSize: "1.5rem" }}>🎁</span>
                <div>
                  <div style={{ color: "rgba(255, 255, 255, 0.9)", fontSize: "0.9rem" }}>Holder Benefits</div>
                  <div style={{ color: "#00ff9d", fontSize: "0.75rem" }}>Airdrops & access</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div style={{ textAlign: "center" }}>
          <p style={{ color: "rgba(255, 255, 255, 0.6)", marginBottom: "1.5rem" }}>
            Join the RL80 revolution and secure your position
          </p>
          <Link href="/tokenomics" style={{ textDecoration: 'none' }}>
            <button style={{
              background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
              color: "#000",
              border: "none",
              padding: "12px 32px",
              fontSize: "1rem",
              fontWeight: "bold",
              borderRadius: "8px",
              cursor: "pointer",
              transition: "transform 0.2s ease",
            }}
            onMouseEnter={(e) => e.target.style.transform = "scale(1.05)"}
            onMouseLeave={(e) => e.target.style.transform = "scale(1)"}
            >
              VIEW FULL TOKENOMICS
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};