// Direct test of Grok's Polymarket integration
export default async function handler(req, res) {
  const grokApiKey = process.env.GROK_API_KEY;
  
  if (!grokApiKey) {
    return res.status(500).json({ error: 'Grok API key not configured' });
  }

  try {
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
            role: 'user',
            content: '@polymarket show me the top crypto markets by 24 hour volume'
          }
        ],
        temperature: 0.1,
        max_tokens: 500
      })
    });

    const responseText = await grokResponse.text();
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
      raw: grokData
    });

  } catch (error) {
    return res.status(500).json({ 
      error: error.message
    });
  }
}