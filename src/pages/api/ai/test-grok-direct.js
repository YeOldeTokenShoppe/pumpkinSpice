// Direct test of Grok API with full response details
export default async function handler(req, res) {
  const grokApiKey = process.env.GROK_API_KEY;
  
  if (!grokApiKey) {
    return res.status(500).json({ error: 'Grok API key not configured' });
  }

  const logs = [];
  
  try {
    logs.push(`Starting Grok API test at ${new Date().toISOString()}`);
    logs.push(`API Key exists: ${!!grokApiKey}`);
    logs.push(`API Key preview: ${grokApiKey.substring(0, 15)}...`);
    
    const requestBody = {
      model: 'grok-3',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant. Please respond with a simple JSON array of 3 crypto topics.'
        },
        {
          role: 'user',
          content: 'Give me 3 trending crypto topics as a JSON array like: ["topic1", "topic2", "topic3"]'
        }
      ],
      temperature: 0.7,
      max_tokens: 100
    };
    
    logs.push('Request body prepared');
    logs.push(`Calling: https://api.x.ai/v1/chat/completions`);
    
    const startTime = Date.now();
    
    const grokResponse = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${grokApiKey}`
      },
      body: JSON.stringify(requestBody)
    });
    
    const duration = Date.now() - startTime;
    logs.push(`Response received in ${duration}ms`);
    logs.push(`Status: ${grokResponse.status} ${grokResponse.statusText}`);
    
    // Get response as text first
    const responseText = await grokResponse.text();
    logs.push(`Response length: ${responseText.length} characters`);
    
    // Try to parse as JSON
    let parsedResponse = null;
    let parseError = null;
    
    try {
      parsedResponse = JSON.parse(responseText);
      logs.push('Successfully parsed response as JSON');
    } catch (e) {
      parseError = e.message;
      logs.push(`Failed to parse as JSON: ${e.message}`);
    }
    
    return res.status(200).json({
      success: grokResponse.ok,
      status: grokResponse.status,
      statusText: grokResponse.statusText,
      duration: `${duration}ms`,
      headers: Object.fromEntries(grokResponse.headers.entries()),
      responseText: responseText.substring(0, 1000), // First 1000 chars
      parsedResponse,
      parseError,
      logs,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logs.push(`Error occurred: ${error.message}`);
    
    return res.status(200).json({
      success: false,
      error: error.message,
      stack: error.stack,
      logs,
      timestamp: new Date().toISOString()
    });
  }
}