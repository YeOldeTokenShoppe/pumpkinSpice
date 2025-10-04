'use client'
import { useState } from 'react'

export default function AdminPage() {
  const [embedHtml, setEmbedHtml] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const updateTweet = async () => {
    if (!embedHtml.trim()) {
      setResult({ error: 'Please paste embed HTML' })
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/embed-tweet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embedHtml })
      })
      
      const data = await response.json()
      setResult(data)
      
      if (data.success) {
        setEmbedHtml('')
      }
    } catch (error) {
      setResult({ error: 'Failed to update tweet' })
    }
    setLoading(false)
  }

  return (
    <div style={{ 
      padding: '20px', 
      maxWidth: '800px', 
      margin: '0 auto',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <h1>🐦 Tweet Embed Updater</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Instructions:</h3>
        <ol>
          <li>Go to any tweet on Twitter/X</li>
          <li>Click the "..." menu → "Embed Tweet"</li>
          <li>Copy the entire embed code</li>
          <li>Paste it in the box below and click Update</li>
        </ol>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
          Twitter Embed Code:
        </label>
        <textarea
          value={embedHtml}
          onChange={(e) => setEmbedHtml(e.target.value)}
          placeholder='Paste your Twitter embed code here...'
          style={{
            width: '100%',
            height: '200px',
            padding: '10px',
            border: '1px solid #ccc',
            borderRadius: '8px',
            fontSize: '14px',
            fontFamily: 'monospace'
          }}
        />
      </div>

      <button
        onClick={updateTweet}
        disabled={loading || !embedHtml.trim()}
        style={{
          backgroundColor: '#1DA1F2',
          color: 'white',
          border: 'none',
          padding: '12px 24px',
          borderRadius: '8px',
          fontSize: '16px',
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading || !embedHtml.trim() ? 0.6 : 1
        }}
      >
        {loading ? 'Updating...' : 'Update Tweet'}
      </button>

      {result && (
        <div style={{ 
          marginTop: '20px',
          padding: '15px',
          borderRadius: '8px',
          backgroundColor: result.success ? '#d4edda' : '#f8d7da',
          border: `1px solid ${result.success ? '#c3e6cb' : '#f5c6cb'}`,
          color: result.success ? '#155724' : '#721c24'
        }}>
          {result.success ? (
            <div>
              <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                ✅ Tweet updated successfully!
              </div>
              <div>👤 User: @{result.data.username}</div>
              <div>📝 Tweet: {result.data.tweetText}</div>
              <div style={{ marginTop: '10px', fontSize: '14px' }}>
                🎯 Go to <a href="/home3" style={{ color: '#0066cc' }}>/home3</a> and click the phone screen to see the new tweet!
              </div>
            </div>
          ) : (
            <div>
              <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                ❌ Error updating tweet
              </div>
              <div>{result.error}</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}