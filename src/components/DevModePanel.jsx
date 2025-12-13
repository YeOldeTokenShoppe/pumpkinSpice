// Development Mode Control Panel
// Allows easy toggling of agent settings during development

import React, { useState, useEffect } from 'react';
import { getAgentCollaboration } from '@/trading/collaboration/AgentCollaboration';

const DevModePanel = ({ show = true }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true); // Master visibility toggle
  const [isMobile, setIsMobile] = useState(false);
  const [settings, setSettings] = useState({
    devMode: process.env.NEXT_PUBLIC_DEV_MODE === 'true',
    useMock: process.env.NEXT_PUBLIC_USE_MOCK_AGENTS === 'true',
    agents: {
      sentiment: process.env.NEXT_PUBLIC_ENABLE_SENTIMENT !== 'false',
      market: process.env.NEXT_PUBLIC_ENABLE_MARKET !== 'false',
      macro: process.env.NEXT_PUBLIC_ENABLE_MACRO !== 'false',
      rl80: true
    },
    testMode: 'mock' // 'mock', 'single', 'all'
  });
  
  const [apiCallCount, setApiCallCount] = useState({
    sentiment: 0,
    market: 0,
    macro: 0,
    total: 0
  });
  
  const [estimatedCost, setEstimatedCost] = useState(0);
  
  // API costs per call (rough estimates)
  const API_COSTS = {
    sentiment: 0.02,  // Grok
    market: 0.01,     // OpenAI GPT-4
    macro: 0.015      // Anthropic Claude
  };
  
  useEffect(() => {
    // Calculate estimated cost
    const cost = 
      apiCallCount.sentiment * API_COSTS.sentiment +
      apiCallCount.market * API_COSTS.market +
      apiCallCount.macro * API_COSTS.macro;
    setEstimatedCost(cost);
  }, [apiCallCount]);
  
  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Keyboard shortcut to toggle visibility (Ctrl/Cmd + D)
  useEffect(() => {
    const handleKeyPress = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        setIsVisible(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);
  
  const handleTestDiscussion = async () => {
    // Set environment variable for mock mode
    if (settings.useMock) {
      // Store original value
      const originalMockSetting = process.env.NEXT_PUBLIC_USE_MOCK_AGENTS;
      // Force mock mode
      process.env.NEXT_PUBLIC_USE_MOCK_AGENTS = 'true';
    }
    
    const collaboration = getAgentCollaboration();
    
    // Update collaboration settings based on UI
    collaboration.useMockResponses = settings.useMock;
    collaboration.enabledAgents = settings.useMock ? {
      sentiment: true,
      market: true,
      macro: true,
      rl80: true
    } : settings.agents;
    
    // Start if not running
    if (!collaboration.isRunning) {
      await collaboration.start();
    }
    
    // Trigger a test discussion
    console.log('🤖 Starting test discussion with settings:', {
      mock: settings.useMock,
      agents: collaboration.enabledAgents
    });
    
    await collaboration.initiateDiscussion('market_analysis');
    
    // Update call counts if not using mocks
    if (!settings.useMock) {
      setApiCallCount(prev => ({
        sentiment: settings.agents.sentiment ? prev.sentiment + 1 : prev.sentiment,
        market: settings.agents.market ? prev.market + 1 : prev.market,
        macro: settings.agents.macro ? prev.macro + 1 : prev.macro,
        total: prev.total + 1
      }));
    }
  };
  
  const handleTestSingleAgent = async (agentName) => {
    console.log(`Testing ${agentName} agent...`);
    
    // This would call the specific agent
    // For now, just increment counter
    if (!settings.useMock && settings.agents[agentName]) {
      setApiCallCount(prev => ({
        ...prev,
        [agentName]: prev[agentName] + 1,
        total: prev.total + 1
      }));
    }
  };
  
  const toggleAgent = (agentName) => {
    setSettings(prev => ({
      ...prev,
      agents: {
        ...prev.agents,
        [agentName]: !prev.agents[agentName]
      }
    }));
  };
  
  const resetCounters = () => {
    setApiCallCount({
      sentiment: 0,
      market: 0,
      macro: 0,
      total: 0
    });
  };
  
  if (!show || process.env.NODE_ENV === 'production') {
    return null;
  }
  
  return (
    <>
      {/* Floating Toggle Button - Always Visible */}
      {!isVisible && (
        <button
          onClick={() => setIsVisible(true)}
          style={{
            position: 'fixed',
            bottom: isMobile ? '80px' : '20px',  // Higher on mobile to avoid interfering with tabs
            left: isMobile ? '50%' : '20px',
            transform: isMobile ? 'translateX(-50%)' : 'none',
            width: isMobile ? '36px' : '40px',
            height: isMobile ? '36px' : '40px',
            borderRadius: '50%',
            backgroundColor: '#22c55e',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: isMobile ? '16px' : '18px',
            transition: 'transform 0.2s'
          }}
          onMouseEnter={(e) => !isMobile && (e.target.style.transform = 'scale(1.1)')}
          onMouseLeave={(e) => !isMobile && (e.target.style.transform = 'scale(1)')}
          title="Show Dev Panel (Ctrl+D)"
        >
          🛠️
        </button>
      )}
      
      {/* Mobile: Compact button when closed */}
      {isVisible && !isOpen && isMobile && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed',
            bottom: '80px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: 'rgba(34, 197, 94, 0.9)',
            color: '#fff',
            border: '2px solid rgba(255, 255, 255, 0.2)',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            zIndex: 10000,
            backdropFilter: 'blur(10px)'
          }}
          title="Open Dev Controls"
        >
          🛠️
        </button>
      )}
      
      {/* Main Panel (Desktop always, Mobile only when open) */}
      {isVisible && (!isMobile || isOpen) && (
        <div
          style={{
            position: 'fixed',
            bottom: isMobile ? 'auto' : '20px',
            top: isMobile ? '60px' : 'auto',  // Below header on mobile
            left: isMobile ? '10px' : '20px',
            right: isMobile ? '10px' : 'auto',
            zIndex: 10000,
            fontFamily: 'monospace',
            fontSize: isMobile ? '11px' : '12px'
          }}
        >
          <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
              <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                  flex: 1,
                  padding: isMobile ? '6px 10px' : '8px 12px',
                  backgroundColor: settings.devMode ? '#22c55e' : '#ef4444',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  fontSize: isMobile ? '12px' : '14px'
                }}
              >
                🛠️ {!isMobile && 'Dev Mode'} {isOpen ? '▼' : '▶'}
              </button>
              <button
                onClick={() => setIsVisible(false)}
                style={{
                  width: isMobile ? '28px' : '32px',
                  height: isMobile ? '28px' : '32px',
                  backgroundColor: '#6b7280',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: isMobile ? '16px' : '18px'
                }}
                title="Hide Panel (Ctrl+D)"
              >
                ×
              </button>
            </div>
      
      {/* Panel */}
      {isOpen && (
        <div
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            border: '1px solid #333',
            borderRadius: '8px',
            padding: isMobile ? '12px' : '16px',
            width: isMobile ? '100%' : '320px',
            maxWidth: isMobile ? '100%' : '320px',
            color: '#fff',
            backdropFilter: 'blur(10px)',
            maxHeight: isMobile ? '70vh' : 'auto',
            overflowY: isMobile ? 'auto' : 'visible'
          }}
        >
          <h3 style={{ margin: '0 0 12px 0', color: '#22c55e' }}>
            🤖 AI Agent Dev Controls
          </h3>
          
          {/* Mode Selection */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <input
                type="checkbox"
                checked={settings.useMock}
                onChange={(e) => setSettings(prev => ({ ...prev, useMock: e.target.checked }))}
              />
              <span>Use Mock Responses (No API Cost)</span>
            </label>
          </div>
          
          {/* Agent Toggles */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ marginBottom: '8px', fontWeight: 'bold', color: '#60a5fa' }}>
              Active Agents:
            </div>
            {Object.entries(settings.agents).map(([agent, enabled]) => (
              <label
                key={agent}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '4px',
                  opacity: agent === 'rl80' ? 0.7 : 1
                }}
              >
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={() => toggleAgent(agent)}
                  disabled={agent === 'rl80'}
                />
                <span>
                  {agent.toUpperCase()}
                  {agent !== 'rl80' && !settings.useMock && ` ($${API_COSTS[agent]}/call)`}
                  {agent === 'rl80' && ' (Free)'}
                </span>
              </label>
            ))}
          </div>
          
          {/* API Call Counter */}
          <div
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '4px',
              padding: '8px',
              marginBottom: '12px'
            }}
          >
            <div style={{ fontWeight: 'bold', marginBottom: '4px', color: '#fbbf24' }}>
              📊 API Usage:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
              <span>Sentiment:</span><span>{apiCallCount.sentiment} calls</span>
              <span>Market:</span><span>{apiCallCount.market} calls</span>
              <span>Macro:</span><span>{apiCallCount.macro} calls</span>
              <span style={{ fontWeight: 'bold' }}>Total:</span>
              <span style={{ fontWeight: 'bold' }}>{apiCallCount.total} calls</span>
            </div>
            <div style={{ marginTop: '8px', fontSize: '14px', color: '#10b981' }}>
              💰 Est. Cost: ${estimatedCost.toFixed(3)}
            </div>
          </div>
          
          {/* Test Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              onClick={handleTestDiscussion}
              style={{
                padding: '8px',
                backgroundColor: '#3b82f6',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              🗣️ Test Full Discussion
              {settings.useMock && ' (Mock)'}
            </button>
            
            {/* Individual Agent Tests */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', 
              gap: '4px' 
            }}>
              {Object.keys(settings.agents).filter(a => a !== 'rl80').map(agent => (
                <button
                  key={agent}
                  onClick={() => handleTestSingleAgent(agent)}
                  disabled={!settings.agents[agent]}
                  style={{
                    padding: '4px',
                    backgroundColor: settings.agents[agent] ? '#10b981' : '#6b7280',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: settings.agents[agent] ? 'pointer' : 'not-allowed',
                    fontSize: '11px',
                    opacity: settings.agents[agent] ? 1 : 0.5
                  }}
                >
                  Test {agent}
                </button>
              ))}
            </div>
            
            <button
              onClick={resetCounters}
              style={{
                padding: '6px',
                backgroundColor: '#dc2626',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '11px'
              }}
            >
              🔄 Reset Counters
            </button>
          </div>
          
          {/* Tips */}
          <div
            style={{
              marginTop: '12px',
              padding: '8px',
              backgroundColor: 'rgba(34, 197, 94, 0.1)',
              borderRadius: '4px',
              fontSize: '10px',
              color: '#86efac'
            }}
          >
            💡 <strong>Dev Tips:</strong>
            <ul style={{ margin: '4px 0 0 0', paddingLeft: '16px' }}>
              <li>Use mocks for UI development</li>
              <li>Test one agent at a time to debug</li>
              <li>Monitor costs with real API calls</li>
              <li>Check .env.development for settings</li>
            </ul>
          </div>
        </div>
      )}
        </div>
      )}
    </>
  );
};

export default DevModePanel;