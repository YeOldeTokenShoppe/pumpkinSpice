'use client';

import { useState } from 'react';

export default function UpdateTrendingPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const updateTrending = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const response = await fetch('/api/ai/update-trending', {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || 'Failed to update');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#000',
      color: '#fff',
      padding: '2rem',
      fontFamily: 'monospace'
    }}>
      <h1 style={{ color: '#00ff66', marginBottom: '2rem' }}>Admin - Update Trending Topics</h1>
      
      <div style={{
        border: '1px solid #00ff66',
        padding: '2rem',
        borderRadius: '8px',
        maxWidth: '600px'
      }}>
        <p style={{ marginBottom: '1rem' }}>
          This will fetch trending topics from Grok API and save to Firestore.
        </p>
        <p style={{ marginBottom: '2rem', color: '#888' }}>
          All clients will use the cached data instead of making individual API calls.
        </p>
        
        <button
          onClick={updateTrending}
          disabled={loading}
          style={{
            background: loading ? '#333' : '#00ff66',
            color: '#000',
            border: 'none',
            padding: '1rem 2rem',
            borderRadius: '4px',
            fontSize: '1rem',
            fontWeight: 'bold',
            cursor: loading ? 'not-allowed' : 'pointer',
            marginBottom: '2rem'
          }}
        >
          {loading ? 'Updating...' : 'Update Trending Topics'}
        </button>
        
        {error && (
          <div style={{
            background: 'rgba(255, 0, 0, 0.1)',
            border: '1px solid #ff4444',
            padding: '1rem',
            borderRadius: '4px',
            marginTop: '1rem'
          }}>
            <strong>Error:</strong> {error}
          </div>
        )}
        
        {result && (
          <div style={{
            background: 'rgba(0, 255, 100, 0.1)',
            border: '1px solid #00ff66',
            padding: '1rem',
            borderRadius: '4px',
            marginTop: '1rem'
          }}>
            <strong>Success!</strong>
            <pre style={{
              marginTop: '1rem',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}>
              {JSON.stringify(result.topics, null, 2)}
            </pre>
          </div>
        )}
      </div>
      
      <div style={{
        marginTop: '3rem',
        padding: '1rem',
        border: '1px solid #333',
        borderRadius: '4px',
        maxWidth: '600px'
      }}>
        <h3 style={{ color: '#00ff66', marginBottom: '1rem' }}>How it works:</h3>
        <ol style={{ lineHeight: '1.6' }}>
          <li>Click button above to fetch from Grok API</li>
          <li>Data is saved to Firestore</li>
          <li>All temple screens read from Firestore (no API calls)</li>
          <li>Update every 8-24 hours as needed</li>
        </ol>
        <p style={{ marginTop: '1rem', color: '#888' }}>
          Later, you can set up a cron job to call /api/ai/update-trending automatically.
        </p>
      </div>
    </div>
  );
}