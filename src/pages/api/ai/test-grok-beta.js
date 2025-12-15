// Test with alternative Grok API endpoint
export default async function handler(req, res) {
  const grokApiKey = process.env.GROK_API_KEY;
  
  console.log('[Test Grok Beta] API Key exists:', !!grokApiKey);
  
  if (!grokApiKey) {
    return res.status(500).json({ error: 'Grok API key not configured' });
  }

  // Try different possible endpoints
  const endpoints = [
    'https://api.x.ai/v1/chat/completions',
    'https://api.grok.x.ai/v1/chat/completions', 
    'https://api.x.com/v1/chat/completions'
  ];

  const results = [];

  for (const endpoint of endpoints) {
    try {
      console.log(`[Test Grok Beta] Trying endpoint: ${endpoint}`);
      
      const grokResponse = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${grokApiKey}`,
          'X-API-Key': grokApiKey // Try both auth methods
        },
        body: JSON.stringify({
          model: 'grok-beta', // Try simpler model name
          messages: [
            {
              role: 'user',
              content: 'Say hello'
            }
          ],
          max_tokens: 50
        })
      });

      const responseText = await grokResponse.text();
      
      results.push({
        endpoint,
        status: grokResponse.status,
        statusText: grokResponse.statusText,
        headers: Object.fromEntries(grokResponse.headers.entries()),
        body: responseText.substring(0, 500) // First 500 chars
      });
      
      console.log(`[Test Grok Beta] ${endpoint} - Status: ${grokResponse.status}`);
      
    } catch (error) {
      results.push({
        endpoint,
        error: error.message
      });
      console.error(`[Test Grok Beta] ${endpoint} - Error:`, error.message);
    }
  }

  return res.status(200).json({ 
    tested: endpoints,
    results,
    apiKeyPreview: grokApiKey.substring(0, 10) + '...'
  });
}