// Mobile Tab Switcher for Dev Tools
// Allows switching between Dev Panel and Agent Chat on mobile

import React, { useState } from 'react';

const MobileDevTabs = ({ activeTab = 'chat', onTabChange }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  
  const tabs = [
    { id: 'chat', label: 'Chat', emoji: '💬' },
    { id: 'dev', label: 'Dev', emoji: '🛠️' },
    { id: 'hide', label: 'Hide', emoji: '👁️' }
  ];
  
  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        style={{
          position: 'fixed',
          bottom: '10px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          border: '1px solid #333',
          borderRadius: '20px',
          padding: '6px 12px',
          color: '#10b981',
          fontSize: '12px',
          zIndex: 10001,
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}
      >
        <span>⬆</span> Show Tools
      </button>
    );
  }
  
  return (
    <div
      style={{
        position: 'fixed',
        bottom: '0',
        left: '0',
        right: '0',
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        borderTop: '1px solid #333',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        padding: '8px 0',
        zIndex: 10001,
        backdropFilter: 'blur(10px)'
      }}
    >
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => {
            if (tab.id === 'hide') {
              setIsExpanded(false);
              onTabChange('none');
            } else {
              onTabChange(tab.id);
            }
          }}
          style={{
            flex: 1,
            background: 'none',
            border: 'none',
            color: activeTab === tab.id ? '#10b981' : '#6b7280',
            padding: '4px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px',
            fontSize: '11px',
            cursor: 'pointer',
            transition: 'color 0.2s'
          }}
        >
          <span style={{ fontSize: '18px' }}>{tab.emoji}</span>
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  );
};

export default MobileDevTabs;