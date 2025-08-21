import React, { useState, useEffect } from 'react';

const MemoryMonitor = ({ show = false }) => {
  const [memoryInfo, setMemoryInfo] = useState(null);
  
  useEffect(() => {
    if (!show) return;
    
    const updateMemory = () => {
      if (performance.memory) {
        const used = (performance.memory.usedJSHeapSize / 1048576).toFixed(1);
        const total = (performance.memory.totalJSHeapSize / 1048576).toFixed(1);
        const limit = (performance.memory.jsHeapSizeLimit / 1048576).toFixed(1);
        const percentage = ((performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100).toFixed(1);
        
        setMemoryInfo({
          used,
          total,
          limit,
          percentage
        });
      }
    };
    
    updateMemory();
    const interval = setInterval(updateMemory, 2000); // Update every 2 seconds
    
    return () => clearInterval(interval);
  }, [show]);
  
  if (!show || !memoryInfo) return null;
  
  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'rgba(0, 0, 0, 0.8)',
      color: '#00ff00',
      padding: '10px',
      borderRadius: '5px',
      fontFamily: 'monospace',
      fontSize: '12px',
      zIndex: 10000,
      minWidth: '200px'
    }}>
      <div>Memory Monitor</div>
      <div style={{ marginTop: '5px', borderTop: '1px solid #00ff00', paddingTop: '5px' }}>
        <div>Used: {memoryInfo.used} MB</div>
        <div>Total: {memoryInfo.total} MB</div>
        <div>Limit: {memoryInfo.limit} MB</div>
        <div style={{ 
          color: memoryInfo.percentage > 80 ? '#ff0000' : 
                 memoryInfo.percentage > 60 ? '#ffff00' : 
                 '#00ff00' 
        }}>
          Usage: {memoryInfo.percentage}%
        </div>
      </div>
      <div style={{ 
        marginTop: '5px',
        height: '4px',
        background: 'rgba(255, 255, 255, 0.2)',
        borderRadius: '2px',
        overflow: 'hidden'
      }}>
        <div style={{
          width: `${memoryInfo.percentage}%`,
          height: '100%',
          background: memoryInfo.percentage > 80 ? '#ff0000' : 
                      memoryInfo.percentage > 60 ? '#ffff00' : 
                      '#00ff00',
          transition: 'width 0.3s ease'
        }} />
      </div>
    </div>
  );
};

export default MemoryMonitor;