"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import TubesCursor from '@/components/TubesCursor';

export default function CursorPage() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Add some delay to ensure smooth loading
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={{
      backgroundColor: "#000000",
      height: "100vh",
      width: "100vw",
      position: "fixed",
      left: 0,
      top: 0,
      overflow: "hidden",
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      {/* Tubes Cursor Effect */}
      {isLoaded && (
        <TubesCursor 
          colors={["#c48901", "#53bc28", "#6958d5"]}
          lightColors={["#c48901", "#fe8a2e", "#ff008a", "#60aed5"]}
          lightIntensity={200}
          onClickRandomize={true}
        />
      )}
      
      {/* Navigation */}
      <div style={{
        position: 'fixed',
        top: '20px',
        left: '20px',
        zIndex: 1000
      }}>
        <Link 
          href="/home3" 
          style={{
            color: '#c48901',
            textDecoration: 'none',
            fontSize: '1.2rem',
            fontWeight: 'bold',
            padding: '10px 20px',
            border: '2px solid #c48901',
            borderRadius: '8px',
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(196, 137, 1, 0.2)';
            e.target.style.color = '#ffffff';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(0, 0, 0, 0.7)';
            e.target.style.color = '#c48901';
          }}
        >
          ← Back to Home
        </Link>
      </div>

      {/* Center Content */}
      <div style={{
        textAlign: 'center',
        color: '#ffffff',
        zIndex: 100,
        maxWidth: '600px',
        padding: '20px'
      }}>
        <h1 style={{
          fontSize: '3rem',
          marginBottom: '20px',
          background: 'linear-gradient(45deg, #c48901, #53bc28, #6958d5)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textShadow: '0 0 30px rgba(196, 137, 1, 0.5)'
        }}>
          Tubes Cursor
        </h1>
        
        <p style={{
          fontSize: '1.2rem',
          marginBottom: '30px',
          color: 'rgba(255, 255, 255, 0.8)',
          lineHeight: '1.6'
        }}>
          Move your mouse around to see the interactive tubes effect. Click anywhere to randomize the colors!
        </p>
        
        <div style={{
          display: 'flex',
          gap: '20px',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <Link 
            href="/gallery3"
            style={{
              color: '#53bc28',
              textDecoration: 'none',
              fontSize: '1rem',
              padding: '12px 24px',
              border: '2px solid #53bc28',
              borderRadius: '8px',
              background: 'rgba(0, 0, 0, 0.7)',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(83, 188, 40, 0.2)';
              e.target.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(0, 0, 0, 0.7)';
              e.target.style.color = '#53bc28';
            }}
          >
            Gallery
          </Link>
          
          <Link 
            href="/home"
            style={{
              color: '#6958d5',
              textDecoration: 'none',
              fontSize: '1rem',
              padding: '12px 24px',
              border: '2px solid #6958d5',
              borderRadius: '8px',
              background: 'rgba(0, 0, 0, 0.7)',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(105, 88, 213, 0.2)';
              e.target.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(0, 0, 0, 0.7)';
              e.target.style.color = '#6958d5';
            }}
          >
            Original Home
          </Link>
        </div>
      </div>

      {/* Instructions */}
      <div style={{
        position: 'fixed',
        bottom: '30px',
        left: '50%',
        transform: 'translateX(-50%)',
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: '0.9rem',
        textAlign: 'center'
      }}>
        🖱️ Move mouse to control • 🖱️ Click to randomize colors
      </div>
    </div>
  );
}