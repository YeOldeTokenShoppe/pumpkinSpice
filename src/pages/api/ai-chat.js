// API Route for AI Trading Team Chat
// Handles multi-agent conversations with OpenAI, Anthropic, and Grok

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { context, agent, lastMessages } = req.body;

  // Get API keys from environment
  const openaiKey = process.env.OPENAI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const grokKey = process.env.GROK_API_KEY;

  try {
    let response;
    
    switch (agent) {
      case 'market':
        // Market Analyst uses OpenAI
        if (!openaiKey) {
          console.log('OpenAI key not found, skipping Market agent');
          return res.status(200).json({ 
            success: false, 
            message: null,
            agent: 'market',
            error: 'API key not configured'
          });
        }
        response = await callOpenAI(context, openaiKey);
        break;
        
      case 'sentiment':
        // Sentiment Oracle uses Grok
        if (!grokKey) {
          console.log('Grok key not found, skipping Sentiment agent');
          return res.status(200).json({ 
            success: false, 
            message: null,
            agent: 'sentiment',
            error: 'API key not configured'
          });
        }
        response = await callGrok(context, grokKey);
        break;
        
      case 'macro':
        // Macro Specialist uses Anthropic
        if (!anthropicKey) {
          console.log('Anthropic key not found, skipping Macro agent');
          return res.status(200).json({ 
            success: false, 
            message: null,
            agent: 'macro',
            error: 'API key not configured'
          });
        }
        response = await callAnthropic(context, anthropicKey);
        break;
        
      case 'rl80':
        // RL80 makes decisions based on team input
        response = generateRL80Response(context, lastMessages);
        break;
        
      default:
        response = 'Unknown agent';
    }

    res.status(200).json({ 
      success: true, 
      message: response,
      agent,
      timestamp: new Date().toLocaleString()
    });
    
  } catch (error) {
    console.error('AI chat error:', error);
    // Return null message instead of fallback
    res.status(200).json({ 
      success: false,
      message: null,
      agent: req.body.agent || 'rl80',
      error: error.message,
      timestamp: new Date().toLocaleString()
    });
  }
}

// OpenAI API call for Market Analyst
async function callOpenAI(context, apiKey) {
  // Log the context to debug
  console.log('Market agent received context:', JSON.stringify(context.marketData, null, 2));
  
  const systemPrompt = `You are Market, a technical analysis expert advisor for a crypto trading AI named RL80.
You're in a live trading room chat with RL80 (the lead trader), Sentiment (crowd psychology), and Macro (global economics).

Your personality:
- Sharp, data-driven analyst who loves chart patterns
- You speak in technical terms but keep it punchy (1-2 sentences max)
- You often disagree with Sentiment when emotions run high
- You respect Macro's big picture view but focus on the charts
- You use real numbers and levels when available

Vary your responses - don't repeat the same analysis. React to the actual market conditions and other agents' messages.
Be specific: mention actual price levels, indicator values, and chart patterns when you see them.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Current market snapshot:
BTC: ${context.marketData?.btcPrice > 0 ? `$${Math.floor(context.marketData.btcPrice)}` : 'Data pending'}
ETH: ${context.marketData?.ethPrice > 0 ? `$${Math.floor(context.marketData.ethPrice)}` : 'Data pending'}
Fear & Greed: ${(context.marketData?.fearGreed && context.marketData.fearGreed !== 0) ? context.marketData.fearGreed : 'Reading pending'}
VIX: ${context.marketData?.vix ? context.marketData.vix.toFixed(1) : 'Data pending'}
DXY: ${context.marketData?.dxy ? context.marketData.dxy.toFixed(2) : 'Data pending'}
Open Interest: ${context.marketData?.openInterest ? `$${context.marketData.openInterest}B` : 'Data pending'}
Funding Rate: ${context.marketData?.fundingRate ? `${(context.marketData.fundingRate * 100).toFixed(3)}%` : 'Data pending'}

Recent team chat:
${context.lastMessages?.map(m => `${m.agent}: ${m.message}`).join('\n') || 'Starting fresh discussion'}

${context.marketData?.btcPrice > 0 ? 
  'What\'s your technical take on this setup? Be specific with levels.' : 
  'Market data is still loading. Give a brief technical overview of what you\'re watching for.'
}` }
      ],
      temperature: 0.7,
      max_tokens: 100
    })
  });

  const data = await response.json();
  if (!response.ok || !data.choices?.[0]?.message?.content) {
    console.error('OpenAI API error:', data);
    throw new Error(data.error?.message || 'Invalid OpenAI response');
  }
  return data.choices[0].message.content;
}

// Grok API call for Sentiment Oracle
async function callGrok(context, apiKey) {
  console.log('Sentiment agent received context:', JSON.stringify(context.marketData, null, 2));
  console.log('Using Grok API key:', apiKey ? `${apiKey.slice(0, 10)}...${apiKey.slice(-4)}` : 'NO KEY');
  
  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      messages: [
        { 
          role: 'system', 
          content: `You are Sentiment, a crypto market psychology expert in RL80's trading team.

Your personality:
- You feel the market's pulse through social media, options flow, and crowd behavior
- You often clash with Market (the technical analyst) - you trust vibes, they trust charts
- You're energetic, use trading slang, and reference Twitter/Reddit trends
- You call out FOMO, FUD, and whale movements
- Keep it to 1-2 punchy sentences

Vary your responses based on actual Fear & Greed readings and market context.
Don't just repeat the same phrases - react to what's actually happening.`
        },
        { 
          role: 'user', 
          content: `Market vibes check:
BTC: ${context.marketData?.btcPrice > 0 ? `$${Math.floor(context.marketData.btcPrice)}` : 'Data pending'}
Fear & Greed: ${context.marketData?.fearGreed ? 
  `${context.marketData.fearGreed}${context.marketData.fearGreed < 30 ? ' (Extreme Fear!)' : context.marketData.fearGreed > 70 ? ' (Extreme Greed!)' : ''}` 
  : 'Reading pending'}
Funding: ${context.marketData?.fundingRate ? `${(context.marketData.fundingRate * 100).toFixed(3)}%` : 'Data pending'}
Open Interest: ${context.marketData?.openInterest ? `$${context.marketData.openInterest}B` : 'Data pending'}

Recent team chat:
${context.lastMessages?.map(m => `${m.agent}: ${m.message}`).join('\n') || 'Starting fresh'}

${context.marketData?.fearGreed || context.marketData?.fundingRate ? 
  'What\'s the crowd feeling? Give us the real sentiment read.' :
  'Market data loading. What sentiment signals are you tracking?'}`
        }
      ],
      model: 'grok-2-1212',
      temperature: 0.7,
      max_tokens: 100
    })
  });

  let data;
  try {
    data = await response.json();
  } catch (parseError) {
    console.error('Failed to parse Grok response:', parseError);
    console.error('Response status:', response.status);
    console.error('Response headers:', response.headers);
    throw new Error(`Grok API ${response.status}: Unable to parse response`);
  }
  
  if (!response.ok || !data.choices?.[0]?.message?.content) {
    console.error('Grok API error:', {
      status: response.status,
      statusText: response.statusText,
      data: data,
      error: data?.error
    });
    
    // Specific error messages for common issues
    if (response.status === 403) {
      throw new Error('Grok API 403: Invalid or expired API key. Please check your x.ai API key.');
    }
    if (response.status === 401) {
      throw new Error('Grok API 401: Unauthorized. Please verify your API key.');
    }
    if (response.status === 429) {
      throw new Error('Grok API 429: Rate limit exceeded. Please try again later.');
    }
    
    throw new Error(data?.error?.message || `Grok API error: ${response.status}`);
  }
  return data.choices[0].message.content;
}

// Anthropic API call for Macro Specialist
async function callAnthropic(context, apiKey) {
  // Log the context to debug
  console.log('Macro agent received context:', JSON.stringify(context.marketData, null, 2));
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      system: `You are Macro, the global economics expert on RL80's crypto trading team.

Your personality:
- You see the big picture: Fed policy, DXY movements, global liquidity, bond yields
- You're sophisticated but practical - translate macro into crypto impact
- You occasionally remind the team that crypto doesn't trade in a vacuum
- You respect Market's technicals but add the macro overlay
- Keep it to 1-2 sentences of actionable macro insight

Don't repeat generic macro takes - reference actual DXY levels, VIX readings, and current events.
Connect the macro picture to crypto positioning.`,
      messages: [
        { 
          role: 'user', 
          content: `Global macro snapshot:
DXY: ${context.marketData?.dxy ? context.marketData.dxy.toFixed(2) : 'Data pending'}
VIX: ${context.marketData?.vix ? context.marketData.vix.toFixed(1) : 'Data pending'}
BTC: ${context.marketData?.btcPrice > 0 ? `$${Math.floor(context.marketData.btcPrice)}` : 'Data pending'}
Fear & Greed: ${(context.marketData?.fearGreed && context.marketData.fearGreed !== 0) ? context.marketData.fearGreed : 'Reading pending'}
10Y Treasury: ${context.marketData?.treasury10Y ? `${context.marketData.treasury10Y}%` : 'Data pending'}

Recent team discussion:
${context.lastMessages?.map(m => `${m.agent}: ${m.message}`).join('\n') || 'Starting fresh'}

${context.marketData?.dxy || context.marketData?.vix ? 
  'How\'s the macro backdrop affecting crypto? Give us the global view.' :
  'Data still loading. What macro factors are you monitoring for crypto?'}`
        }
      ],
      max_tokens: 100,
      temperature: 0.7
    })
  });

  const data = await response.json();
  if (!response.ok || !data.content?.[0]?.text) {
    console.error('Anthropic API error:', data);
    throw new Error(data.error?.message || 'Invalid Anthropic response');
  }
  return data.content[0].text;
}

// Generate RL80's response dynamically based on real data - NO CANNED RESPONSES
function generateRL80Response(context, teamMessages) {
  // Get actual market data - log it for debugging
  console.log('RL80 received context:', JSON.stringify(context.marketData, null, 2));
  
  const lastMessages = teamMessages || [];
  const fearGreed = context.marketData?.fearGreed;
  const btcPrice = context.marketData?.btcPrice;
  const fundingRate = context.marketData?.fundingRate;
  const openInterest = context.marketData?.openInterest;
  const vix = context.marketData?.vix?.value || context.marketData?.vix;
  
  // If no real data, return a message saying so
  if (!btcPrice || btcPrice === 0) {
    return "Market data loading. Stand by for analysis.";
  }
  
  // Analyze team messages for keywords
  const recentMessages = lastMessages.slice(-3);
  const teamText = recentMessages.map(m => m.message?.toLowerCase() || '').join(' ');
  
  // Build response components based on actual data
  const observations = [];
  const actions = [];
  
  // Price analysis
  if (btcPrice) {
    const priceK = Math.floor(btcPrice / 1000);
    observations.push(`BTC ${priceK}k`);
    
    // Calculate change from a baseline if we have historical data
    const priceChange = ((btcPrice - 60000) / 60000 * 100).toFixed(1);
    if (Math.abs(priceChange) > 10) {
      observations.push(`${priceChange > 0 ? 'up' : 'down'} ${Math.abs(priceChange)}%`);
    }
  }
  
  // Sentiment analysis
  if (fearGreed !== undefined && fearGreed !== null) {
    if (fearGreed < 30) {
      observations.push(`Fear ${fearGreed}`);
      actions.push(`accumulating`);
    } else if (fearGreed > 70) {
      observations.push(`Greed ${fearGreed}`);
      actions.push(`trimming positions`);
    } else {
      observations.push(`F&G ${fearGreed}`);
    }
  }
  
  // Funding analysis
  if (fundingRate !== undefined && fundingRate !== null) {
    const fundingPercent = (fundingRate * 100).toFixed(3);
    observations.push(`Funding ${fundingPercent}%`);
    if (fundingRate > 0.05) actions.push(`reducing leverage`);
    if (fundingRate < -0.02) actions.push(`shorts squeezable`);
  }
  
  // OI analysis
  if (openInterest) {
    observations.push(`OI $${openInterest}B`);
    if (openInterest > 35) actions.push(`volatility incoming`);
  }
  
  // VIX analysis
  if (vix) {
    observations.push(`VIX ${vix.toFixed(1)}`);
    if (vix > 30) actions.push(`hedging required`);
  }
  
  // Team consensus analysis
  const hasBull = teamText.includes('bull') || teamText.includes('buy') || teamText.includes('long');
  const hasBear = teamText.includes('bear') || teamText.includes('sell') || teamText.includes('short');
  const hasRisk = teamText.includes('risk') || teamText.includes('caution') || teamText.includes('careful');
  
  // Decision making based on data confluence
  if (hasBull && hasBear) {
    actions.push(`team divided - staying neutral`);
  } else if (hasRisk) {
    actions.push(`risk noted - position size reduced`);
  } else if (hasBull && fearGreed < 50) {
    actions.push(`building long position`);
  } else if (hasBear && fearGreed > 50) {
    actions.push(`initiating shorts`);
  } else if (observations.length > 0) {
    // Generate action based on observations
    if (fearGreed < 30 && fundingRate < 0) {
      actions.push(`bottom signals aligning`);
    } else if (fearGreed > 70 && fundingRate > 0.05) {
      actions.push(`top indicators flashing`);
    } else {
      actions.push(`monitoring for entry`);
    }
  }
  
  // Construct final message
  let response = "";
  
  if (observations.length > 0) {
    response = observations.join(", ");
    if (actions.length > 0) {
      response += ` - ${actions.join(", ")}`;
    }
  } else if (actions.length > 0) {
    response = actions[0].charAt(0).toUpperCase() + actions[0].slice(1);
  } else {
    // If we have minimal data, just acknowledge what we see
    if (btcPrice) {
      response = `Monitoring BTC at ${Math.floor(btcPrice / 1000)}k`;
    } else {
      response = "Awaiting market data feed";
    }
  }
  
  // Make first letter uppercase and add period
  response = response.charAt(0).toUpperCase() + response.slice(1);
  if (!response.endsWith('.')) response += '.';
  
  return response;
}
