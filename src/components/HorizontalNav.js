'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const HorizontalNav = ({ is80sMode = false }) => {
  const [hoveredTab, setHoveredTab] = useState(null);
  const pathname = usePathname();

  const navItems = [
    { id: '00', date: 'ICON ON I-80', title: "ROADMAP", path: '/', thumbnail: '/I80.png' },
    { id: '01', date: 'DEFI GRAV80', title: 'SOMETHING ABOUT RL80', path: '/home3', thumbnail: '/darkSky.png' },
    { id: '02', date: 'LIGHT UTIL80', title: 'THE ILLUMIN80', path: '/gallery3', thumbnail: '/heart.png' },
    { id: '03', date: 'PRAYER & PROBABIL80', title: 'TRADING DESK', path: '/temple', thumbnail: '/lightning.png' },
    { id: '04', date: 'ETHICS & MORAL80', title: 'SCROLLS OF ST. GR80', path: '/model-viewer', thumbnail: '/stgr81.png' },
    { id: '05', date: 'CHAR80 & LIQUID80', title: 'COIN FOUNTAIN', path: '/fountain', thumbnail: '/fountain2.png' },
  ];

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        padding: '20px',
        pointerEvents: 'none'
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: '10px',
          backdropFilter: 'blur(20px)',
          borderRadius: '10px',
          padding: '10px',
          pointerEvents: 'auto'
        }}
      >
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          const isHovered = hoveredTab === item.id;

          return (
            <Link key={item.id} href={item.path}>
              <div
                style={{
                  position: 'relative',
                  width: '300px',
                  height: '70px',
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  overflow: 'hidden',
                  borderBottom: `1px solid ${isHovered || isActive ? (is80sMode ? '#D946EF' : '#000000') : (is80sMode ? 'rgba(217, 70, 239, 0.25)' : 'rgba(255, 255, 255, 0.25)')}`,
                  background: isHovered || isActive ? (is80sMode ? '#D946EF' : '#f6f841') : 'rgba(0,0,0,0)',
                  clipPath: 'polygon(95% 0%, 100% 20%, 100% 100%, 0 100%, 0 0)',
                  transition: 'all 0.3s ease',
                  textDecoration: 'none'
                }}
                onMouseEnter={() => setHoveredTab(item.id)}
                onMouseLeave={() => setHoveredTab(null)}
              >
                <div
                  style={{
                    position: 'absolute',
                    left: '85px',
                    padding: '10px 0',
                    width: 'calc(100% - 85px)',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                  }}
                >
                  <span
                    style={{
                      display: 'block',
                      textAlign: 'left',
                      color: isHovered || isActive ? '#000000' : (is80sMode ? '#67e8f9' : '#ffffff'),
                      fontWeight: '700',
                      fontSize: '20px',
                      marginBottom: '0px',
                      fontFamily: "'Rajdhani', sans-serif",
                      transition: 'color 0.3s ease'
                    }}
                  >
                    {item.date}
                  </span>
                  <span
                    style={{
                      display: 'block',
                      textAlign: 'left',
                      color: isHovered || isActive ? '#000000' : (is80sMode ? '#67e8f9' : '#ffffff'),
                      fontSize: '16px',
                      fontWeight: '400',
                      textTransform: 'none',
                      lineHeight: '20px',
                      fontFamily: "'Rajdhani', sans-serif",
                      transition: 'color 0.3s ease'
                    }}
                  >
                    {item.title}
                  </span>
                </div>
                <div
                  style={{
                    position: 'absolute',
                    left: '0',
                    width: '70px',
                    height: '70px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    borderRight: `1px solid ${isHovered || isActive ? (is80sMode ? '#D946EF' : '#000000') : (is80sMode ? 'rgba(217, 70, 239, 0.25)' : 'rgba(255, 255, 255, 0.25)')}`,
                    transition: 'all 0.3s ease'
                  }}
                >
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      opacity: isHovered || isActive ? 1 : 0.7,
                      filter: is80sMode && !isHovered && !isActive ? 'hue-rotate(270deg) saturate(1.5)' : 'none',
                      transition: 'all 0.3s ease'
                    }}
                  />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default HorizontalNav;