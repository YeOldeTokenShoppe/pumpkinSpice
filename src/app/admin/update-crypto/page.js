'use client'

import { useState } from 'react'

export default function UpdateCryptoPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const updateCrypto = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/ai/update-crypto')
      const data = await response.json()
      
      if (response.ok) {
        setResult(data)
      } else {
        setError(data.error || 'Failed to update crypto prices')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Update Crypto Prices</h1>
      
      <p style={{ marginBottom: '2rem', color: '#666' }}>
        This will fetch the latest crypto prices from CoinGecko and cache them in Firestore.
        The data will be used by the MacroAgentScreen component.
      </p>

      <button 
        onClick={updateCrypto}
        disabled={loading}
        style={{
          padding: '0.75rem 2rem',
          fontSize: '1rem',
          backgroundColor: loading ? '#666' : '#00ff66',
          color: '#000',
          border: 'none',
          borderRadius: '4px',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontWeight: 'bold',
          marginBottom: '2rem'
        }}
      >
        {loading ? 'Updating...' : 'Update Crypto Prices'}
      </button>

      {error && (
        <div style={{ 
          padding: '1rem', 
          backgroundColor: '#ffebee', 
          border: '1px solid #ffcdd2',
          borderRadius: '4px',
          marginBottom: '1rem',
          color: '#d32f2f'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {result && (
        <div style={{ 
          padding: '1rem', 
          backgroundColor: '#e8f5e9', 
          border: '1px solid #a5d6a7',
          borderRadius: '4px'
        }}>
          <h3 style={{ marginBottom: '1rem', color: '#2e7d32' }}>
            ✓ Crypto prices updated successfully!
          </h3>
          
          <div style={{ marginBottom: '1rem' }}>
            <h4>Bitcoin:</h4>
            <ul>
              <li>Price: ${result.data?.btc?.price?.toLocaleString()}</li>
              <li>24h Change: {result.data?.btc?.change}%</li>
              <li>History Points: {result.data?.btc?.history?.length || 0}</li>
            </ul>
          </div>
          
          <div style={{ marginBottom: '1rem' }}>
            <h4>Ethereum:</h4>
            <ul>
              <li>Price: ${result.data?.eth?.price?.toLocaleString()}</li>
              <li>24h Change: {result.data?.eth?.change}%</li>
              <li>History Points: {result.data?.eth?.history?.length || 0}</li>
            </ul>
          </div>
          
          <div style={{ marginBottom: '1rem' }}>
            <h4>Market Overview:</h4>
            <ul>
              <li>BTC Dominance: {result.data?.dominance?.btc}%</li>
              <li>ETH Dominance: {result.data?.dominance?.eth}%</li>
              <li>Total Market Cap: ${(result.data?.totalMarketCap / 1e12)?.toFixed(2)}T</li>
              <li>24h Volume: ${(result.data?.volume24h / 1e9)?.toFixed(1)}B</li>
            </ul>
          </div>
          
          <p style={{ fontSize: '0.875rem', color: '#666', marginTop: '1rem' }}>
            Updated at: {new Date().toLocaleString()}
          </p>
        </div>
      )}
    </div>
  )
}