'use client'

import { useState } from 'react'

export default function AdminDashboard() {
  const [loadingStates, setLoadingStates] = useState({
    trending: false,
    crypto: false
  })
  const [results, setResults] = useState({
    trending: null,
    crypto: null
  })
  const [errors, setErrors] = useState({
    trending: null,
    crypto: null
  })

  const updateData = async (type) => {
    setLoadingStates(prev => ({ ...prev, [type]: true }))
    setErrors(prev => ({ ...prev, [type]: null }))
    setResults(prev => ({ ...prev, [type]: null }))

    try {
      const endpoint = type === 'trending' ? '/api/ai/update-trending' : '/api/ai/update-crypto'
      const response = await fetch(endpoint, { method: 'POST' })
      const data = await response.json()
      
      if (response.ok) {
        setResults(prev => ({ ...prev, [type]: data }))
      } else {
        setErrors(prev => ({ ...prev, [type]: data.error || `Failed to update ${type}` }))
      }
    } catch (err) {
      setErrors(prev => ({ ...prev, [type]: err.message }))
    } finally {
      setLoadingStates(prev => ({ ...prev, [type]: false }))
    }
  }

  const updateAll = async () => {
    await Promise.all([
      updateData('trending'),
      updateData('crypto')
    ])
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem', color: '#00ff66' }}>
        Admin Dashboard - API Data Updates
      </h1>

      <div style={{ marginBottom: '2rem' }}>
        <button
          onClick={updateAll}
          disabled={loadingStates.trending || loadingStates.crypto}
          style={{
            padding: '1rem 2.5rem',
            fontSize: '1.1rem',
            backgroundColor: '#00ff66',
            color: '#000',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold',
            marginRight: '1rem',
            opacity: (loadingStates.trending || loadingStates.crypto) ? 0.6 : 1
          }}
        >
          Update All Data
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* Trending Topics Section */}
        <div style={{ 
          backgroundColor: '#1a1a1a', 
          padding: '1.5rem', 
          borderRadius: '8px',
          border: '1px solid #333'
        }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#00ff66' }}>
            Trending Topics (Grok AI)
          </h2>
          
          <p style={{ color: '#999', marginBottom: '1rem', fontSize: '0.9rem' }}>
            Updates sentiment screen trending topics. Refreshes every 8 hours.
          </p>

          <button
            onClick={() => updateData('trending')}
            disabled={loadingStates.trending}
            style={{
              padding: '0.75rem 1.5rem',
              fontSize: '1rem',
              backgroundColor: loadingStates.trending ? '#666' : '#00ff66',
              color: '#000',
              border: 'none',
              borderRadius: '4px',
              cursor: loadingStates.trending ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
              marginBottom: '1rem'
            }}
          >
            {loadingStates.trending ? 'Updating...' : 'Update Trending'}
          </button>

          {errors.trending && (
            <div style={{ 
              padding: '1rem', 
              backgroundColor: 'rgba(255, 68, 68, 0.1)', 
              border: '1px solid #ff4444',
              borderRadius: '4px',
              marginBottom: '1rem',
              color: '#ff4444'
            }}>
              <strong>Error:</strong> {errors.trending}
            </div>
          )}

          {results.trending && (
            <div style={{ 
              padding: '1rem', 
              backgroundColor: 'rgba(0, 255, 102, 0.1)', 
              border: '1px solid #00ff66',
              borderRadius: '4px'
            }}>
              <h3 style={{ marginBottom: '0.75rem', color: '#00ff66' }}>
                ✓ Updated Successfully
              </h3>
              {results.trending.topics?.map((topic, i) => (
                <div key={i} style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                  <strong>{topic.topic}</strong>
                  <span style={{ 
                    marginLeft: '0.5rem',
                    color: topic.sentiment === 'bullish' ? '#00ff66' : 
                           topic.sentiment === 'bearish' ? '#ff4444' : '#999'
                  }}>
                    ({topic.sentiment}) - {topic.mentions} mentions
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Crypto Prices Section */}
        <div style={{ 
          backgroundColor: '#1a1a1a', 
          padding: '1.5rem', 
          borderRadius: '8px',
          border: '1px solid #333'
        }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#00ff66' }}>
            Crypto Prices (CoinGecko)
          </h2>
          
          <p style={{ color: '#999', marginBottom: '1rem', fontSize: '0.9rem' }}>
            Updates macro screen BTC/ETH prices. Refreshes every 15 minutes.
          </p>

          <button
            onClick={() => updateData('crypto')}
            disabled={loadingStates.crypto}
            style={{
              padding: '0.75rem 1.5rem',
              fontSize: '1rem',
              backgroundColor: loadingStates.crypto ? '#666' : '#00ff66',
              color: '#000',
              border: 'none',
              borderRadius: '4px',
              cursor: loadingStates.crypto ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
              marginBottom: '1rem'
            }}
          >
            {loadingStates.crypto ? 'Updating...' : 'Update Crypto'}
          </button>

          {errors.crypto && (
            <div style={{ 
              padding: '1rem', 
              backgroundColor: 'rgba(255, 68, 68, 0.1)', 
              border: '1px solid #ff4444',
              borderRadius: '4px',
              marginBottom: '1rem',
              color: '#ff4444'
            }}>
              <strong>Error:</strong> {errors.crypto}
            </div>
          )}

          {results.crypto && (
            <div style={{ 
              padding: '1rem', 
              backgroundColor: 'rgba(0, 255, 102, 0.1)', 
              border: '1px solid #00ff66',
              borderRadius: '4px'
            }}>
              <h3 style={{ marginBottom: '0.75rem', color: '#00ff66' }}>
                ✓ Updated Successfully
              </h3>
              
              <div style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                <strong>BTC:</strong> ${results.crypto.data?.btc?.price?.toLocaleString()} 
                <span style={{ 
                  marginLeft: '0.5rem',
                  color: results.crypto.data?.btc?.change >= 0 ? '#00ff66' : '#ff4444' 
                }}>
                  ({results.crypto.data?.btc?.change > 0 ? '+' : ''}{results.crypto.data?.btc?.change}%)
                </span>
              </div>
              
              <div style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                <strong>ETH:</strong> ${results.crypto.data?.eth?.price?.toLocaleString()}
                <span style={{ 
                  marginLeft: '0.5rem',
                  color: results.crypto.data?.eth?.change >= 0 ? '#00ff66' : '#ff4444' 
                }}>
                  ({results.crypto.data?.eth?.change > 0 ? '+' : ''}{results.crypto.data?.eth?.change}%)
                </span>
              </div>
              
              <div style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                <strong>Market Cap:</strong> ${(results.crypto.data?.totalMarketCap / 1e12)?.toFixed(2)}T
              </div>
              
              <div style={{ fontSize: '0.9rem' }}>
                <strong>BTC Dom:</strong> {results.crypto.data?.dominance?.btc}% | 
                <strong> ETH Dom:</strong> {results.crypto.data?.dominance?.eth}%
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ 
        marginTop: '2rem', 
        padding: '1rem', 
        backgroundColor: '#1a1a1a', 
        borderRadius: '8px',
        border: '1px solid #333'
      }}>
        <h3 style={{ color: '#00ff66', marginBottom: '0.5rem' }}>Update Schedule</h3>
        <ul style={{ color: '#999', fontSize: '0.9rem' }}>
          <li>Trending Topics: Every 8 hours (reduces Grok API usage)</li>
          <li>Crypto Prices: Every 15 minutes (CoinGecko rate limits)</li>
          <li>Both APIs cache data in Firestore to prevent client-side rate limiting</li>
        </ul>
      </div>
    </div>
  )
}