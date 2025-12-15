// Test endpoint to check what Grok returns for Polymarket data
export default async function handler(req, res) {
  const grokApiKey = process.env.GROK_API_KEY;
  
  if (!grokApiKey) {
    return res.status(500).json({ error: 'Grok API key not configured' });
  }

  try {
    console.log('[Test Polymarket] Making request to Grok...');
    
    const grokResponse = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${grokApiKey}`
      },
      body: JSON.stringify({
        model: 'grok-3',
        messages: [
          {
            role: 'system',
            content: 'Today is December 15, 2024. You have access to current Polymarket data through your integration with X/Twitter. Provide real, current Polymarket crypto bets that are actually active right now.'
          },
          {
            role: 'user',
            content: 'What are the top crypto bets on Polymarket today (December 15, 2024)? Focus on bets that resolve in January 2025 or later. Give me real titles and odds.'
          }
        ],
        temperature: 0.3,  // Lower temperature for more factual responses
        max_tokens: 200
      })
    });

    const responseText = await grokResponse.text();
    console.log('[Test Polymarket] Raw response:', responseText);

    if (!grokResponse.ok) {
      return res.status(500).json({ 
        error: 'Grok API error',
        response: responseText
      });
    }

    let grokData;
    try {
      grokData = JSON.parse(responseText);
    } catch (e) {
      return res.status(500).json({ 
        error: 'Failed to parse response',
        response: responseText
      });
    }

    const content = grokData.choices?.[0]?.message?.content || '';
    
    return res.status(200).json({
      success: true,
      content,
      model: grokData.model,
      usage: grokData.usage
    });

  } catch (error) {
    console.error('[Test Polymarket] Error:', error);
    return res.status(500).json({ 
      error: error.message
    });
  }
}