"use client";

import dynamic from 'next/dynamic';
import { useState } from 'react';

const SimpleModelViewer = dynamic(() => import('@/components/SimpleModelViewer'), {
  ssr: false,
  loading: () => <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1a1a1a', color: 'white' }}>Loading 3D Model...</div>
});

export default function ModelViewerPage() {
  const [selectedModel, setSelectedModel] = useState('/models/angel_devil.glb');
  
  const availableModels = [
    '/models/angel_devil.glb',

  ];

  return (
    <div style={{ position: 'relative' }}>
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        zIndex: 100,
        background: 'rgba(0,0,0,0.8)',
        padding: '15px',
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        <label style={{ color: 'white', marginBottom: '5px' }}>Select Model:</label>
        <select 
          value={selectedModel} 
          onChange={(e) => setSelectedModel(e.target.value)}
          style={{
            padding: '8px',
            borderRadius: '4px',
            background: '#333',
            color: 'white',
            border: '1px solid #555',
            cursor: 'pointer'
          }}
        >
          {availableModels.map(model => (
            <option key={model} value={model}>
              {model.split('/').pop().replace('.glb', '')}
            </option>
          ))}
        </select>
      </div>
      
      <SimpleModelViewer modelPath={selectedModel} />
    </div>
  );
}