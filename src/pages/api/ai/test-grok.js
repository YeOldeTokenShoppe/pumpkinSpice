// Simple test endpoint for Grok API
export default async function handler(req, res) {
  const grokApiKey = process.env.GROK_API_KEY;
  
  console.log('[Test Grok] API Key exists:', !!grokApiKey);
  console.log('[Test Grok] API Key preview:', grokApiKey ? grokApiKey.substring(0, 10) + '...' : 'none');
  
  if (!grokApiKey) {
    return res.status(500).json({ error: 'Grok API key not configured' });
  }

  try {
    console.log('[Test Grok] Making API call to Grok...');
    console.log('[Test Grok] Using endpoint: https://api.x.ai/v1/chat/completions');
    console.log('[Test Grok] Using model: grok-2-1212');
    
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
            content: 'You are a crypto market analyst. Provide the top 4 trending crypto topics right now with sentiment analysis. Return as JSON array with format: [{"topic": "topic name", "sentiment": "bullish/bearish/neutral", "mentions": number}]. Keep topics short (3-5 words). Be specific about current market events.'
          },
          {
            role: 'user',
            content: 'What are the top 4 trending crypto topics right now with their sentiment?'
          }
        ],
        temperature: 0.7,
        max_tokens: 200
      })
    });

    console.log('[Test Grok] Response status:', grokResponse.status);
    console.log('[Test Grok] Response headers:', Object.fromEntries(grokResponse.headers.entries()));
    
    const responseText = await grokResponse.text();
    console.log('[Test Grok] Response text:', responseText);

    if (!grokResponse.ok) {
      return res.status(grokResponse.status).json({ 
        error: 'Grok API error',
        status: grokResponse.status,
        response: responseText
      });
    }

    // Try to parse as JSON
    try {
      const grokData = JSON.parse(responseText);
      
      // Extract topics from the response
      let topics = [];
      const content = grokData.choices?.[0]?.message?.content || '';
      console.log('[Test Grok] Content from Grok:', content);
      
      // Try to extract JSON from the content
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        topics = JSON.parse(jsonMatch[0]);
        console.log('[Test Grok] Parsed topics:', topics);
      }
      
      return res.status(200).json({
        success: true,
        topics,
        rawResponse: grokData
      });
      
    } catch (parseError) {
      console.error('[Test Grok] Parse error:', parseError);
      return res.status(200).json({
        success: false,
        parseError: parseError.message,
        rawResponse: responseText
      });
    }

  } catch (error) {
    console.error('[Test Grok] Error:', error);
    return res.status(500).json({ 
      error: error.message,
      stack: error.stack
    });
  }
}