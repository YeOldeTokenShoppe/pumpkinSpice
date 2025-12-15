'use client';

import { useState } from 'react';

export default function TestGrokPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const testGrok = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const response = await fetch('/api/ai/test-grok', {
        method: 'GET',
      });
      
      const data = await response.json();
      console.log('Test Grok Response:', data);
      
      if (response.ok) {
        setResult(data);
      } else {
        setError(data);
      }
    } catch (err) {
      console.error('Test Grok Error:', err);
      setError({ error: err.message });
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
      <h1 style={{ color: '#00ff66', marginBottom: '2rem' }}>Test Grok API Direct Connection</h1>
      
      <div style={{
        border: '1px solid #00ff66',
        padding: '2rem',
        borderRadius: '8px',
        maxWidth: '800px'
      }}>
        <p style={{ marginBottom: '2rem' }}>
          This will test the Grok API directly without Firestore.
        </p>
        
        <button
          onClick={testGrok}
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
          {loading ? 'Testing...' : 'Test Grok API'}
        </button>
        
        {error && (
          <div style={{
            background: 'rgba(255, 0, 0, 0.1)',
            border: '1px solid #ff4444',
            padding: '1rem',
            borderRadius: '4px',
            marginTop: '1rem'
          }}>
            <strong>Error:</strong>
            <pre style={{
              marginTop: '1rem',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              fontSize: '0.9rem'
            }}>
              {JSON.stringify(error, null, 2)}
            </pre>
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
            
            {result.topics && result.topics.length > 0 && (
              <>
                <h3 style={{ marginTop: '1rem', color: '#00ff66' }}>Parsed Topics:</h3>
                <pre style={{
                  marginTop: '0.5rem',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}>
                  {JSON.stringify(result.topics, null, 2)}
                </pre>
              </>
            )}
            
            <h3 style={{ marginTop: '1rem', color: '#00ff66' }}>Raw Response:</h3>
            <pre style={{
              marginTop: '0.5rem',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              fontSize: '0.8rem',
              maxHeight: '400px',
              overflow: 'auto'
            }}>
              {JSON.stringify(result.rawResponse, null, 2)}
            </pre>
          </div>
        )}
      </div>
      
      <div style={{
        marginTop: '2rem',
        padding: '1rem',
        border: '1px solid #333',
        borderRadius: '4px',
        maxWidth: '800px'
      }}>
        <p style={{ color: '#888' }}>
          Check both browser console and server console for detailed logs.
        </p>
      </div>
    </div>
  );
}