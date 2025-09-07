import React, { useState, useEffect } from "react";

const MoonRoomModal = ({ isOpen, onClose }) => {
  const [isFullScreen, setIsFullScreen] = useState(false);

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1000,
        }}
      />
      
      {/* Modal Content */}
      <div
        style={{
          position: 'fixed',
          top: isFullScreen ? 0 : '50%',
          left: isFullScreen ? 0 : '50%',
          transform: isFullScreen ? 'none' : 'translate(-50%, -50%)',
          width: isFullScreen ? '100%' : '90%',
          maxWidth: isFullScreen ? '100%' : '1200px',
          height: isFullScreen ? '100vh' : '80vh',
          backgroundColor: 'white',
          borderRadius: isFullScreen ? 0 : '8px',
          zIndex: 1001,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderBottom: '1px solid #e2e8f0',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
            }}
          >
            <h2 style={{ color: 'black', margin: 0, fontSize: '1.5rem' }}>Moon Room</h2>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={toggleFullScreen}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#3182ce',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                {isFullScreen ? "Exit Full Screen" : "Full Screen"}
              </button>
              <button
                onClick={onClose}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#e53e3e',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
          <p style={{ fontSize: '0.875rem', color: '#718096', marginTop: '0.5rem' }}>
            Click to shoot. Hold mouse down to move room around. Hold down shift
            key + mouse down to handle moon.
          </p>
        </div>
        
        {/* Body */}
        <div style={{ flex: 1, padding: '1rem', overflow: 'hidden' }}>
          <iframe
            src="/MoonRoom.html"
            title="Moon Room"
            scrolling="no"
            style={{
              width: "100%",
              height: "100%",
              border: "none",
            }}
          />
        </div>
      </div>
    </>
  );
};

export default MoonRoomModal;
