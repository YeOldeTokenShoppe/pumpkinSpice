// API route for AI analysis - handles Grok and Anthropic calls
import { getTradingViewAnalyst } from '@/lib/lighter/tradingview-analyst';
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt, consultant, marketData } = req.body;

  try {
    let analysis = '';
    
    if (consultant === 'technical') {
      // Technical Analysis Assistant
      const analyst = getTechnicalAnalyst();
      
      // Run technical analysis on market data
      const technicalAnalysis = analyst.analyze(marketData.fullMarketData || {
        'BTC-USD': { ticker: { lastPrice: marketData.btcPrice } },
        'ETH-USD': { ticker: { lastPrice: marketData.ethPrice } }
      });
      
      // Format technical insights
      const technicalSummary = analyst.formatForAI(technicalAnalysis);
      
      // Have Claude interpret the technical analysis
      if (process.env.ANTHROPIC_API_KEY) {
        const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-3-haiku-20240307',
            max_tokens: 150,
            system: "You are a technical analysis expert. Interpret indicators and chart patterns to provide actionable trading guidance. Be specific about entry/exit levels.",
            messages: [{ 
              role: 'user', 
              content: `Technical indicators: ${technicalSummary}. What's the technical setup telling us?`
            }]
          })
        });
        
        if (anthropicResponse.ok) {
          const data = await anthropicResponse.json();
          analysis = data.content?.[0]?.text || technicalSummary;
        } else {
          analysis = technicalSummary; // Use raw technical data as fallback
        }
      } else {
        // Intelligent fallback for technical analysis
        const btcAnalysis = technicalAnalysis['BTC-USD'];
        if (btcAnalysis) {
          const { trend, rsi, signal } = btcAnalysis;
          analysis = `Technical: ${trend} trend, RSI ${rsi}. ${signal.action} signal with ${signal.confidence}% confidence. ${signal.reasons}`;
        } else {
          analysis = technicalSummary || 'Technical indicators calculating...';
        }
      }
      
    } else if (consultant === 'sentiment') {
      // Use Grok for sentiment analysis
      const grokResponse = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.GROK_API_KEY}`
        },
        body: JSON.stringify({
          messages: [
            { 
              role: 'system', 
              content: "You are a crypto sentiment analyst. Provide brief, sharp insights about market psychology and social sentiment. Be specific and actionable." 
            },
            { 
              role: 'user', 
              content: prompt 
            }
          ],
          model: 'grok-beta',
          stream: false,
          temperature: 0.7,
          max_tokens: 150
        })
      });

      if (grokResponse.ok) {
        const data = await grokResponse.json();
        analysis = data.choices?.[0]?.message?.content || 'Sentiment analysis processing...';
      } else {
        console.error('Grok API error:', grokResponse.status);
        analysis = 'Social sentiment mixed. Monitoring for clearer signals.';
      }
      
    } else if (consultant === 'macro') {
      // Use Anthropic for macro analysis (or fallback for now)
      if (process.env.ANTHROPIC_API_KEY) {
        const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-3-haiku-20240307',
            max_tokens: 150,
            system: "You are a macro economic specialist for crypto trading. Analyze how traditional markets and economic indicators affect crypto. Be concise and specific.",
            messages: [{ role: 'user', content: prompt }]
          })
        });
        
        if (anthropicResponse.ok) {
          const data = await anthropicResponse.json();
          analysis = data.content?.[0]?.text || 'Macro conditions being evaluated...';
        }
      } else {
        // Intelligent fallback for macro
        analysis = generateMacroFallback(marketData);
      }
      
    } else {
      // Main trading analysis - use Anthropic or intelligent fallback
      if (process.env.ANTHROPIC_API_KEY) {
        const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-3-haiku-20240307',
            max_tokens: 150,
            system: "You are RL80, a legendary crypto trading AI. Analyze markets with confidence and provide sharp, actionable insights. Focus on entry/exit opportunities and risk management.",
            messages: [{ role: 'user', content: prompt }]
          })
        });
        
        if (anthropicResponse.ok) {
          const data = await anthropicResponse.json();
          analysis = data.content?.[0]?.text || 'Analyzing market structure...';
        }
      } else {
        // Intelligent fallback for trading
        analysis = generateTradingFallback(marketData);
      }
    }

    return res.status(200).json({ 
      success: true, 
      analysis,
      consultant,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('AI analysis error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Analysis failed',
      analysis: 'Market analysis temporarily unavailable. Monitoring continues.' 
    });
  }
}

// Intelligent fallback for macro analysis
function generateMacroFallback(marketData) {
  const vix = marketData?.vix || 15;
  const dxy = marketData?.dxy || 103;
  const regime = marketData?.marketRegime || 'RISK_ON';
  
  if (vix < 15 && dxy < 104) {
    return `Low volatility (VIX: ${vix}) with weakening dollar (DXY: ${dxy}). Favorable for risk assets. Consider increasing crypto exposure.`;
  } else if (vix > 20) {
    return `Elevated volatility (VIX: ${vix}) suggests caution. Reduce position sizes and tighten stops.`;
  } else if (regime === 'RISK_ON') {
    return `Risk-on environment confirmed. Dollar weakness supporting crypto. Momentum strategies favored.`;
  }
  return `Macro conditions neutral. Watching for directional catalysts from Fed policy and DXY movements.`;
}

// Intelligent fallback for trading analysis
function generateTradingFallback(marketData) {
  const btcChange = marketData?.btcChange || 0;
  const positions = marketData?.positionCount || 0;
  const pnl = marketData?.totalPnL || 0;
  
  if (positions > 0) {
    if (pnl > 0) {
      return `${positions} positions showing profit (+$${pnl.toFixed(2)}). Consider trailing stops to protect gains.`;
    } else {
      return `${positions} positions down $${Math.abs(pnl).toFixed(2)}. Reviewing stop losses and position sizing.`;
    }
  } else if (Math.abs(btcChange) > 3) {
    return `BTC ${btcChange > 0 ? 'up' : 'down'} ${Math.abs(btcChange).toFixed(1)}%. ${btcChange > 0 ? 'Wait for pullback to enter' : 'Watching for bounce levels'}.`;
  }
  return `No active positions. Scanning for high-probability setups with favorable risk/reward.`;
}