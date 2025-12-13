// Agent Chat Display Component
// Shows real-time agent discussions

import React, { useState, useEffect, useRef } from 'react';

const AgentChatDisplay = ({ show = true }) => {
  const [messages, setMessages] = useState([]);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const chatEndRef = useRef(null);
  
  // Agent colors and emojis
  const agentStyles = {
    sentiment: { color: '#f59e0b', emoji: '😎', name: 'Sentiment Oracle' },
    market: { color: '#3b82f6', emoji: '📊', name: 'Market Analyst' },
    macro: { color: '#8b5cf6', emoji: '🌍', name: 'Macro Specialist' },
    rl80: { color: '#10b981', emoji: '🤖', name: 'RL80 Trader' },
    system: { color: '#6b7280', emoji: '⚙️', name: 'System' }
  };
  
  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  useEffect(() => {
    // Listen for agent messages
    const handleAgentMessage = (event) => {
      const message = event.detail;
      setMessages(prev => [...prev.slice(-50), message]); // Keep last 50 messages
    };
    
    window.addEventListener('agentMessage', handleAgentMessage);
    
    // Also listen for system messages
    const handleSystemMessage = (event) => {
      const message = {
        id: `sys_${Date.now()}`,
        timestamp: Date.now(),
        agent: 'system',
        message: event.detail.message || event.detail,
        topic: 'system'
      };
      setMessages(prev => [...prev.slice(-50), message]);
    };
    
    window.addEventListener('systemMessage', handleSystemMessage);
    
    return () => {
      window.removeEventListener('agentMessage', handleAgentMessage);
      window.removeEventListener('systemMessage', handleSystemMessage);
    };
  }, []);
  
  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const clearMessages = () => {
    setMessages([]);
  };
  
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };
  
  if (!show || process.env.NODE_ENV === 'production') {
    return null;
  }
  
  return (
    <div
      style={{
        position: 'fixed',
        bottom: isMobile ? '0' : '20px',
        right: isMobile ? '0' : '20px',
        left: isMobile ? '0' : 'auto',
        width: isMobile ? '100%' : (isMinimized ? '300px' : '400px'),
        maxHeight: isMobile ? 
          (isMinimized ? '60px' : '50vh') : 
          (isMinimized ? '48px' : '500px'),
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        border: isMobile ? 'none' : '1px solid #333',
        borderTop: isMobile ? '1px solid #333' : undefined,
        borderRadius: isMobile ? '12px 12px 0 0' : '12px',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 9999,
        fontFamily: 'monospace',
        fontSize: isMobile ? '11px' : '12px',
        transition: 'all 0.3s ease',
        backdropFilter: 'blur(10px)'
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px',
          borderBottom: isMinimized ? 'none' : '1px solid #333',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          backgroundColor: 'rgba(16, 185, 129, 0.1)'
        }}
        onClick={() => setIsMinimized(!isMinimized)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '16px' }}>💬</span>
          <span style={{ color: '#10b981', fontWeight: 'bold' }}>Agent Chat</span>
          {messages.length > 0 && (
            <span style={{ 
              backgroundColor: '#10b981', 
              color: '#000', 
              padding: '2px 6px', 
              borderRadius: '10px',
              fontSize: '10px',
              fontWeight: 'bold'
            }}>
              {messages.length}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {!isMinimized && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                clearMessages();
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#ef4444',
                cursor: 'pointer',
                padding: '4px'
              }}
              title="Clear messages"
            >
              🗑️
            </button>
          )}
          <span style={{ color: '#6b7280' }}>
            {isMinimized ? '▲' : '▼'}
          </span>
        </div>
      </div>
      
      {/* Messages */}
      {!isMinimized && (
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
        >
          {messages.length === 0 ? (
            <div style={{ 
              color: '#6b7280', 
              textAlign: 'center', 
              padding: '20px',
              fontStyle: 'italic' 
            }}>
              No agent messages yet...<br/>
              Click "Test Full Discussion" in Dev Panel
            </div>
          ) : (
            messages.map(msg => {
              const style = agentStyles[msg.agent] || agentStyles.system;
              const isMock = msg.message?.includes('[MOCK]');
              
              return (
                <div
                  key={msg.id}
                  style={{
                    padding: '8px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '6px',
                    borderLeft: `3px solid ${style.color}`,
                    position: 'relative'
                  }}
                >
                  {/* Header */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    marginBottom: '4px',
                    alignItems: 'center'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>{style.emoji}</span>
                      <span style={{ color: style.color, fontWeight: 'bold' }}>
                        {style.name}
                      </span>
                      {isMock && (
                        <span style={{
                          backgroundColor: '#fbbf24',
                          color: '#000',
                          padding: '1px 4px',
                          borderRadius: '4px',
                          fontSize: '9px',
                          fontWeight: 'bold'
                        }}>
                          MOCK
                        </span>
                      )}
                    </div>
                    <span style={{ color: '#4b5563', fontSize: '10px' }}>
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                  
                  {/* Topic */}
                  {msg.topic && msg.topic !== 'system' && (
                    <div style={{ 
                      color: '#9ca3af', 
                      fontSize: '10px',
                      marginBottom: '4px',
                      fontStyle: 'italic'
                    }}>
                      Topic: {msg.topic.replace(/_/g, ' ')}
                    </div>
                  )}
                  
                  {/* Message */}
                  <div style={{ color: '#e5e7eb', lineHeight: '1.4' }}>
                    {msg.message?.replace('[MOCK] ', '')}
                  </div>
                  
                  {/* Confidence */}
                  {msg.confidence && (
                    <div style={{
                      marginTop: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <span style={{ color: '#6b7280', fontSize: '10px' }}>Confidence:</span>
                      <div style={{
                        width: '60px',
                        height: '4px',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '2px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${msg.confidence * 100}%`,
                          height: '100%',
                          backgroundColor: msg.confidence > 0.7 ? '#10b981' : 
                                         msg.confidence > 0.4 ? '#fbbf24' : '#ef4444',
                          transition: 'width 0.3s ease'
                        }} />
                      </div>
                      <span style={{ 
                        color: '#9ca3af', 
                        fontSize: '10px' 
                      }}>
                        {(msg.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  )}
                </div>
              );
            })
          )}
          <div ref={chatEndRef} />
        </div>
      )}
      
      {/* Status Bar */}
      {!isMinimized && messages.length > 0 && (
        <div
          style={{
            padding: '8px 12px',
            borderTop: '1px solid #333',
            color: '#6b7280',
            fontSize: '10px',
            display: 'flex',
            justifyContent: 'space-between'
          }}
        >
          <span>Last update: {messages[messages.length - 1] && formatTime(messages[messages.length - 1].timestamp)}</span>
          <span>{messages.filter(m => m.message?.includes('[MOCK]')).length} mock msgs</span>
        </div>
      )}
    </div>
  );
};

export default AgentChatDisplay;