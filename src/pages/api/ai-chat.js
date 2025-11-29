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
        response = await callOpenAI(context, openaiKey, 'market');
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
async function callOpenAI(context, apiKey, role) {
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
BTC: $${context.marketData?.btcPrice || 'loading'}
ETH: $${context.marketData?.ethPrice || 'loading'}
Fear & Greed: ${context.marketData?.fearGreed || 'N/A'}
VIX: ${context.marketData?.vix || 'N/A'}
DXY: ${context.marketData?.dxy || 'N/A'}
Open Interest: ${context.marketData?.openInterest || 'N/A'}
Funding Rate: ${context.marketData?.fundingRate || 'N/A'}%

Recent team chat:
${context.lastMessages?.map(m => `${m.agent}: ${m.message}`).join('\n') || 'No recent messages'}

What's your technical take on this setup? Be specific and reference actual levels.` }
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
BTC: $${context.marketData?.btcPrice || 'loading'}
Fear & Greed: ${context.marketData?.fearGreed || 'N/A'} ${context.marketData?.fearGreed < 30 ? '(Extreme Fear!)' : context.marketData?.fearGreed > 70 ? '(Extreme Greed!)' : ''}
Funding: ${context.marketData?.fundingRate || 'N/A'}%
Open Interest: ${context.marketData?.openInterest || 'N/A'}

Recent team chat:
${context.lastMessages?.map(m => `${m.agent}: ${m.message}`).join('\n') || 'Starting fresh'}

What's the crowd feeling? Give us the real sentiment read.`
        }
      ],
      model: 'grok-beta',
      temperature: 0.7,
      max_tokens: 100
    })
  });

  const data = await response.json();
  if (!response.ok || !data.choices?.[0]?.message?.content) {
    console.error('Grok API error:', data);
    throw new Error(data.error?.message || 'Invalid Grok response');
  }
  return data.choices[0].message.content;
}

// Anthropic API call for Macro Specialist
async function callAnthropic(context, apiKey) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-sonnet-20240229',
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
DXY: ${context.marketData?.dxy || 'N/A'}
VIX: ${context.marketData?.vix || 'N/A'}
BTC: $${context.marketData?.btcPrice || 'loading'}
Fear & Greed: ${context.marketData?.fearGreed || 'N/A'}

Recent team discussion:
${context.lastMessages?.map(m => `${m.agent}: ${m.message}`).join('\n') || 'Just starting'}

How's the macro backdrop affecting crypto? Give us the global view.`
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

// Generate RL80's response based on team input
function generateRL80Response(context, teamMessages) {
  // RL80 responds based on team consensus and market conditions
  const lastMessages = teamMessages || [];
  const fearGreed = context.marketData?.fearGreed || 50;
  const btcPrice = context.marketData?.btcPrice || 0;
  
  // Check if team has conflicting views
  const hasConflict = lastMessages.some(m => m.message?.toLowerCase().includes('disagree') || 
                                              m.message?.toLowerCase().includes('but') ||
                                              m.message?.toLowerCase().includes('however'));
  
  // Dynamic responses based on market conditions and team input
  if (hasConflict) {
    const conflictResponses = [
      "Mixed signals from the team. Let's wait for clearer consensus.",
      "Interesting debate team. I'm leaning towards the technical view here.",
      "Good points all around. Let me synthesize this into a balanced approach.",
      "Divergent views noted. Playing this one cautiously."
    ];
    return conflictResponses[Math.floor(Math.random() * conflictResponses.length)];
  }
  
  if (fearGreed < 25) {
    const fearResponses = [
      "Extreme fear in the market. This could be our opportunity.",
      "Blood in the streets. Time to be greedy when others are fearful.",
      "Fear index screaming buy. Let's scale in carefully."
    ];
    return fearResponses[Math.floor(Math.random() * fearResponses.length)];
  }
  
  if (fearGreed > 75) {
    const greedResponses = [
      "Euphoria detected. Time to take some chips off the table.",
      "Greed levels concerning. Tightening stops here.",
      "Market's getting frothy. Let's book some profits."
    ];
    return greedResponses[Math.floor(Math.random() * greedResponses.length)];
  }
  
  if (btcPrice > 90000) {
    const bullResponses = [
      "BTC pushing new highs. Momentum is our friend here.",
      "Strong price action. Adding to winners with proper risk management.",
      "Bulls in control. Riding this wave with trailing stops."
    ];
    return bullResponses[Math.floor(Math.random() * bullResponses.length)];
  }
  
  // Default neutral responses
  const neutralResponses = [
    "Solid analysis team. Executing with discipline.",
    "Good insights everyone. Adjusting position sizes accordingly.",
    "Team sync achieved. Let's monitor closely.",
    "Appreciate the perspectives. Staying nimble here."
  ];
  
  return neutralResponses[Math.floor(Math.random() * neutralResponses.length)];
}

// REMOVED - No more fallback responses
// Agents will stay quiet if APIs fail
/*
function generateFallbackResponse(agent, context) {
  const fallbacks = {
    market: [
      "RSI showing oversold conditions at 28. Potential bounce incoming.",
      "Volume declining on this pump. Be cautious above resistance.",
      "MACD crossing bullish. Momentum building nicely.",
      "Support at 0.618 fib holding strong. Good entry zone.",
      "Bollinger bands tightening. Big move imminent.",
      "Volume profile suggests accumulation at these levels.",
      "Order flow turning bullish. Buyers stepping in here.",
      "Delta divergence spotted. Watch for reversal signals."
    ],
    sentiment: [
      "Twitter buzz exploding for SOL! FOMO kicking in hard.",
      "Whale wallets accumulating quietly. Smart money is bullish.",
      "Fear index spiking. Perfect contrarian setup brewing.",
      "Social sentiment turning bearish. Crowd might be wrong here.",
      "Funding rates heating up. Euphoria phase incoming.",
      "Retail interest surging. Time to be cautious.",
      "Options flow extremely bullish. Big moves expected.",
      "Social metrics diverging from price. Interesting setup."
    ],
    macro: [
      "DXY weakness continuing. Risk-on environment for crypto.",
      "Fed pivot narrative strengthening. Liquidity returning to markets.",
      "VIX below 15 signals complacency. Stay alert for volatility.",
      "Global liquidity expanding. Macro tailwinds for digital assets.",
      "Treasury yields falling. Capital rotating to risk assets.",
      "Dollar breaking down. Perfect storm for crypto rally.",
      "Central banks easing globally. Bullish macro backdrop.",
      "Inflation expectations rising. Hard assets outperforming."
    ],
    rl80: [
      "Analyzing all inputs. Strategy adjustment in progress.",
      "Team insights noted. Optimizing position sizing now.",
      "Interesting perspectives team. Let me run the numbers.",
      "Risk parameters updated. Executing with precision.",
      "Consensus building. Preparing entry orders now.",
      "Good catch on those signals. Adjusting accordingly.",
      "Good discussion team. Implementing consensus view.",
      "Risk/reward looks favorable. Proceeding with the plan."
    ]
  };
  
  const agentResponses = fallbacks[agent] || fallbacks.rl80;
  return agentResponses[Math.floor(Math.random() * agentResponses.length)];
}
*/