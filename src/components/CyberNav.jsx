import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const CyberNav = ({ is80sMode = false }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hoveredId, setHoveredId] = useState(null);
  const pathname = usePathname();
  
  // Reset hoveredId when menu closes
  React.useEffect(() => {
    if (!isMenuOpen) {
      setHoveredId(null);
    }
  }, [isMenuOpen]);

  const navItems = [
    // { id: '01', date: '01', title: 'HOME', path: '/home', thumbnail: '/rl80logo.png' },
    { id: '01', date: 'THE ILLUMIN80', title: 'Get Lit With RL80', path: '/gallery', thumbnail: '/sacred.png' },
    { id: '02', date: 'CLOUD 80', title: 'Defy GRAV80 with RL80', path: '/clouds', thumbnail: '/cloud.png' },
    { id: '03', date: 'INFIN80 FOUNTAIN', title: 'Get CLAR80 or Give CHAR80', path: '/fountain', thumbnail: '/fountain.png' },
    { id: '04', date: 'PROSPER80 GOSPEL', title: 'The Illumin8ed Charts of St. GR80', path: '/model-viewer', thumbnail: '/vvv.jpg' },
  ];

  // Always use mobile-style menu
  return (
      <>
        <button
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            zIndex: "10000",
            color: is80sMode ? "#D946EF" : "#ffff00",
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            backdropFilter: "blur(10px)",
            border: "2px solid rgba(255, 255, 255, 0.2)",
            borderRadius: "8px",
            padding: "8px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "40px",
            height: "40px",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)"
          }}
          aria-label="Menu"
          onClick={() => {
            setIsMenuOpen(!isMenuOpen);
            setHoveredId(null);
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = "rgba(0, 0, 0, 0.8)"}
          onMouseLeave={(e) => e.target.style.backgroundColor = "rgba(0, 0, 0, 0.7)"}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {isMenuOpen ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </>
            ) : (
              <>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </>
            )}
          </svg>
        </button>
        
        {isMenuOpen && (
          <div
            style={{
              position: "fixed",
              top: "0",
              left: "0",
              right: "0",
              bottom: "0",
              backgroundColor: "rgba(0, 0, 0, 0.95)",
              backdropFilter: "blur(20px)",
              zIndex: "9999",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              gap: "20px",
              padding: "20px"
            }}
            onMouseLeave={() => setHoveredId(null)}
          >
            {navItems.map((item, index) => {
              const isActive = pathname === item.path;
              
              return (
                <Link key={item.id} href={item.path} passHref style={{ textDecoration: 'none' }}>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center",
                      gap: "15px",
                      cursor: "pointer",
                      padding: "20px",
                      borderRadius: "10px",
                      backgroundColor: isActive 
                        ? (is80sMode ? "#67e8f9" : "#c896ff")
                        : "transparent",
                      transition: "background-color 0.3s ease"
                    }}
                    onClick={() => {
                      setIsMenuOpen(false);
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = "rgb(200, 150, 255)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }
                    }}
                  >
                    <div style={{ width: "50px", height: "50px", overflow: "hidden", borderRadius: "5px", flexShrink: "0" }}>
                      <img
                        src={item.thumbnail}
                        alt={item.title}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          opacity: isActive ? 1 : 0.8,
                          filter: is80sMode && !isActive ? 'hue-rotate(270deg) saturate(1.5)' : 'none'
                        }}
                      />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span
                        style={{
                          color: isActive ? '#000000' : (is80sMode ? "#D946EF" : '#ffff00'),
                          fontWeight: "700",
                          fontSize: "14px",
                          fontFamily: "'Rajdhani', sans-serif",
                          textAlign: "left"
                        }}
                      >
                        {item.date}
                      </span>
                      <span
                        style={{
                          color: isActive ? '#000000' : (is80sMode ? "#D946EF" : '#ffff00'),
                          fontSize: "24px",
                          fontWeight: "700",
                          fontFamily: "'Rajdhani', sans-serif"
                        }}
                      >
                        {item.title}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </>
    );
};

export default CyberNav;