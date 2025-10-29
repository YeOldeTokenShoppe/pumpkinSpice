import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const CyberHorizontalNav = ({ is80sMode = false }) => {
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

  const sectionStyle = {
    width: '100%',
    padding: '60px 20px',
    background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.4), rgba(0, 20, 40, 0.3))',
    borderTop: `1px solid ${is80sMode ? 'rgba(217, 70, 239, 0.3)' : 'rgba(255, 255, 255, 0.2)'}`,
    borderBottom: `1px solid ${is80sMode ? 'rgba(217, 70, 239, 0.3)' : 'rgba(255, 255, 255, 0.2)'}`,
    display: 'flex',
    justifyContent: 'center',
    position: 'relative'
  };

  const containerStyle = {
    display: 'flex',
    gap: '12px',
    backdropFilter: 'blur(20px)',
    borderRadius: '15px',
    padding: '15px',
    background: 'rgba(0, 0, 0, 0.2)',
    overflowX: 'auto',
    maxWidth: '100%',
    scrollbarWidth: 'thin'
  };

  return (
    <section style={sectionStyle}>
      <div 
        style={containerStyle}
        className="cyber-nav-container"
      >
        <style jsx>{`
          .cyber-nav-container::-webkit-scrollbar {
            height: 6px;
          }
          .cyber-nav-container::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 3px;
          }
          .cyber-nav-container::-webkit-scrollbar-thumb {
            background: ${is80sMode ? '#D946EF' : '#f6f841'};
            border-radius: 3px;
          }
          .cyber-nav-container::-webkit-scrollbar-thumb:hover {
            background: ${is80sMode ? '#B91FD1' : '#f4f420'};
          }
        `}</style>

        {navItems.map((item) => {
          const isActive = pathname === item.path;
          const isHovered = hoveredTab === item.id;

          const itemStyle = {
            position: 'relative',
            width: '280px',
            height: '70px',
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            overflow: 'hidden',
            borderBottom: '1px solid',
            borderColor: isHovered || isActive ? (is80sMode ? '#D946EF' : '#000000') : (is80sMode ? 'rgba(217, 70, 239, 0.25)' : 'rgba(255, 255, 255, 0.25)'),
            background: isHovered || isActive ? (is80sMode ? '#D946EF' : '#f6f841') : 'rgba(0,0,0,0)',
            clipPath: 'polygon(95% 0%, 100% 20%, 100% 100%, 0 100%, 0 0)',
            transition: 'all 0.3s ease',
            flexShrink: '0',
            textDecoration: 'none'
          };

          const textContainerStyle = {
            position: 'absolute',
            left: '85px',
            padding: '10px 0',
            width: 'calc(100% - 85px)',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          };

          const dateStyle = {
            display: 'block',
            textAlign: 'left',
            color: isHovered || isActive ? '#000000' : (is80sMode ? '#67e8f9' : '#ffffff'),
            fontWeight: '700',
            fontSize: '20px',
            marginBottom: '0px',
            fontFamily: "'Rajdhani', sans-serif",
            transition: 'color 0.3s ease',
            margin: '0'
          };

          const titleStyle = {
            display: 'block',
            textAlign: 'left',
            color: isHovered || isActive ? '#000000' : (is80sMode ? '#67e8f9' : '#ffffff'),
            fontSize: '16px',
            fontWeight: '400',
            textTransform: 'none',
            lineHeight: '20px',
            fontFamily: "'Rajdhani', sans-serif",
            transition: 'color 0.3s ease',
            margin: '0'
          };

          const imageContainerStyle = {
            position: 'absolute',
            left: '0',
            width: '70px',
            height: '70px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            borderRight: '1px solid',
            borderColor: isHovered || isActive ? (is80sMode ? '#D946EF' : '#000000') : (is80sMode ? 'rgba(217, 70, 239, 0.25)' : 'rgba(255, 255, 255, 0.25)'),
            transition: 'all 0.3s ease'
          };

          const imageStyle = {
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: isHovered || isActive ? 1 : 0.7,
            filter: is80sMode && !isHovered && !isActive ? 'hue-rotate(270deg) saturate(1.5)' : 'none',
            transition: 'all 0.3s ease'
          };

          return (
            <Link key={item.id} href={item.path} style={{ textDecoration: 'none' }}>
              <div
                style={itemStyle}
                onMouseEnter={() => setHoveredTab(item.id)}
                onMouseLeave={() => setHoveredTab(null)}
              >
                <div style={textContainerStyle}>
                  <div style={dateStyle}>
                    {item.date}
                  </div>
                  <div style={titleStyle}>
                    {item.title}
                  </div>
                </div>
                <div style={imageContainerStyle}>
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    style={imageStyle}
                  />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
};

export default CyberHorizontalNav;