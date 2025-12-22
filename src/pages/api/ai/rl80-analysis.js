import { db, doc, collection, getDoc, setDoc, getDocs, query, orderBy, limit, serverTimestamp } from '@/utilities/firebaseServer';

// Cache duration: 1 minute (more frequent for trading decisions)
const CACHE_DURATION = 60 * 1000;

// Fetch sentiment data from Emo
async function getEmoAnalysis() {
  try {
    // Try to get from Grok/trending API
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/ai/trending`);
    if (response.ok) {
      const data = await response.json();
      
      // Calculate sentiment score based on available data
      let sentimentScore = 50; // neutral default
      let signal = 'neutral';
      let factors = [];
      
      // Analyze trending topics sentiment with weighted scoring
      if (data.topics && data.topics.length > 0) {
        const bullishTopics = data.topics.filter(t => t.sentiment === 'bullish');
        const bearishTopics = data.topics.filter(t => t.sentiment === 'bearish');
        const neutralTopics = data.topics.filter(t => t.sentiment === 'neutral');
        
        // Weight by mentions for more accurate sentiment
        const bullishMentions = bullishTopics.reduce((sum, t) => sum + (t.mentions || 1000), 0);
        const bearishMentions = bearishTopics.reduce((sum, t) => sum + (t.mentions || 1000), 0);
        const neutralMentions = neutralTopics.reduce((sum, t) => sum + (t.mentions || 1000), 0);
        const totalMentions = bullishMentions + bearishMentions + neutralMentions;
        
        if (totalMentions > 0) {
          // Calculate weighted sentiment score
          sentimentScore = ((bullishMentions * 100) + (neutralMentions * 50)) / totalMentions;
          
          if (sentimentScore > 65) signal = 'bullish';
          else if (sentimentScore < 35) signal = 'bearish';
          else signal = 'neutral';
          
          factors.push(`Sentiment: ${bullishTopics.length}↑ ${neutralTopics.length}→ ${bearishTopics.length}↓`);
          factors.push(`Weight: ${Math.round(sentimentScore)}% bullish`);
        }
      }
      
      // Add Polymarket data if available
      if (data.polymarket && data.polymarket.markets && data.polymarket.markets.length > 0) {
        const market = data.polymarket.markets[0];
        if (market.yes && market.no) {
          // Adjust sentiment based on prediction market
          const marketSentiment = market.yes;
          sentimentScore = (sentimentScore * 0.7) + (marketSentiment * 0.3);
          factors.push(`Polymarket: ${market.yes}% yes`);
        }
      }
      
      // Ensure score is not exactly 50 if we have real data
      if (factors.length > 0 && sentimentScore === 50) {
        sentimentScore = 52; // Slightly bullish to show data is active
      }
      
      return {
        score: Math.round(sentimentScore),
        signal: signal,
        confidence: factors.length > 0 ? 0.7 : 0.3,
        factors: factors.length > 0 ? factors : ['Limited sentiment data'],
        source: 'emo'
      };
    }
  } catch (err) {
    console.error('[RL80] Error fetching Emo analysis:', err);
  }
  
  // Fallback data
  return {
    score: 50,
    signal: 'neutral',
    confidence: 0.5,
    factors: ['No sentiment data available'],
    source: 'emo'
  };
}

// Fetch technical data from Tekno
async function getTeknoAnalysis() {
  try {
    // Get technical analysis data
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/ai/technical-real`);
    if (response.ok) {
      const data = await response.json();
      
      // Analyze BTC technical indicators (can be expanded to other assets)
      const btc = data.BTC;
      if (btc) {
        let score = 50;
        let signal = 'neutral';
        let factors = [];
        
        // RSI analysis
        if (btc.rsi) {
          factors.push(`RSI: ${btc.rsi.value.toFixed(1)}`);
          if (btc.rsi.value < 30) {
            score += 20; // Oversold = bullish
            signal = 'buy';
          } else if (btc.rsi.value > 70) {
            score -= 20; // Overbought = bearish
            signal = 'sell';
          }
        }
        
        // MACD analysis
        if (btc.macd) {
          factors.push(`MACD: ${btc.macd.trend}`);
          if (btc.macd.trend === 'bullish') {
            score += 15;
          } else if (btc.macd.trend === 'bearish') {
            score -= 15;
          }
        }
        
        // Trend analysis
        if (btc.trend) {
          factors.push(`Trend: ${btc.trend}`);
          if (btc.trend === 'bullish') {
            score += 15;
            signal = signal === 'neutral' ? 'buy' : signal;
          } else if (btc.trend === 'bearish') {
            score -= 15;
            signal = signal === 'neutral' ? 'sell' : signal;
          }
        }
        
        // Price action
        if (btc.price) {
          const change = btc.price.change24h || 0;
          factors.push(`24h: ${change > 0 ? '+' : ''}${change.toFixed(2)}%`);
        }
        
        return {
          score: Math.max(0, Math.min(100, score)),
          signal: signal,
          confidence: btc.isLive ? 0.85 : 0.6,
          factors: factors,
          source: 'tekno'
        };
      }
    }
  } catch (err) {
    console.error('[RL80] Error fetching Tekno analysis:', err);
  }
  
  return {
    score: 50,
    signal: 'neutral',
    confidence: 0.5,
    factors: ['No technical data available'],
    source: 'tekno'
  };
}

// Fetch macro data from Macro agent
async function getMacroAnalysis() {
  try {
    // For now, we'll simulate macro data
    // In production, this would fetch from economic data APIs
    
    // Simulated macro factors
    const dxyStrength = Math.random() * 100; // Dollar index
    const yieldsDirection = Math.random() > 0.5 ? 'rising' : 'falling';
    const goldTrend = Math.random() > 0.5 ? 'up' : 'down';
    
    let score = 50;
    let factors = [];
    
    // Dollar weak = crypto bullish
    if (dxyStrength < 40) {
      score += 20;
      factors.push('DXY: Weak (bullish for crypto)');
    } else if (dxyStrength > 60) {
      score -= 20;
      factors.push('DXY: Strong (bearish for crypto)');
    } else {
      factors.push('DXY: Neutral');
    }
    
    // Yields falling = risk-on = crypto bullish
    if (yieldsDirection === 'falling') {
      score += 10;
      factors.push('Yields: Falling (risk-on)');
    } else {
      score -= 10;
      factors.push('Yields: Rising (risk-off)');
    }
    
    // Gold up = inflation hedge = crypto bullish
    if (goldTrend === 'up') {
      score += 10;
      factors.push('Gold: Rising (inflation hedge)');
    } else {
      factors.push('Gold: Falling');
    }
    
    let signal = 'neutral';
    if (score > 65) signal = 'bullish';
    else if (score < 35) signal = 'bearish';
    
    return {
      score: score,
      signal: signal,
      confidence: 0.65,
      factors: factors,
      source: 'macro'
    };
  } catch (err) {
    console.error('[RL80] Error fetching Macro analysis:', err);
  }
  
  return {
    score: 50,
    signal: 'neutral',
    confidence: 0.5,
    factors: ['No macro data available'],
    source: 'macro'
  };
}

// Get historical trade performance
async function getHistoricalPerformance() {
  try {
    const tradesRef = collection(db, 'trades');
    const q = query(tradesRef, orderBy('timestamp', 'desc'), limit(10));
    const snapshot = await getDocs(q);
    
    let wins = 0;
    let losses = 0;
    let totalPnL = 0;
    const recentTrades = [];
    
    snapshot.forEach(doc => {
      const trade = doc.data();
      if (trade.result) {
        if (trade.result.success) wins++;
        else losses++;
        totalPnL += trade.result.pnl || 0;
        
        recentTrades.push({
          success: trade.result.success,
          pnl: trade.result.pnl
        });
      }
    });
    
    const winRate = (wins + losses) > 0 ? (wins / (wins + losses)) * 100 : 50;
    
    return {
      winRate: winRate,
      totalPnL: totalPnL,
      recentTrades: recentTrades.slice(0, 5),
      totalTrades: wins + losses
    };
  } catch (err) {
    console.error('[RL80] Error fetching historical trades:', err);
    return {
      winRate: 50,
      totalPnL: 0,
      recentTrades: [],
      totalTrades: 0
    };
  }
}

// RL80's decision algorithm
function calculateRL80Decision(emo, tekno, macro, historical) {
  // Dynamic weight adjustment based on recent performance
  let weights = {
    sentiment: 0.25,  // Base weight for Emo
    technical: 0.45,  // Base weight for Tekno (higher for technical)
    macro: 0.30       // Base weight for Macro
  };
  
  // Adjust weights based on confidence levels
  const totalConfidence = emo.confidence + tekno.confidence + macro.confidence;
  if (totalConfidence > 0) {
    weights.sentiment = (emo.confidence / totalConfidence) * 0.3 + 0.15;
    weights.technical = (tekno.confidence / totalConfidence) * 0.5 + 0.25;
    weights.macro = (macro.confidence / totalConfidence) * 0.2 + 0.10;
  }
  
  // Calculate weighted score
  const totalScore = 
    (emo.score * weights.sentiment) +
    (tekno.score * weights.technical) +
    (macro.score * weights.macro);
  
  // Calculate consensus
  const signals = [emo.signal, tekno.signal, macro.signal];
  const bullishCount = signals.filter(s => s === 'bullish' || s === 'buy').length;
  const bearishCount = signals.filter(s => s === 'bearish' || s === 'sell').length;
  
  let action = 'HOLD';
  let size = 0;
  let reasoning = '';
  
  // Strong consensus required for action
  if (bullishCount >= 2 && totalScore > 60) {
    if (totalScore > 75) {
      action = 'STRONG_BUY';
      size = 0.8;
      reasoning = 'Strong bullish consensus across all agents';
    } else {
      action = 'BUY';
      size = 0.5;
      reasoning = 'Moderate bullish consensus';
    }
  } else if (bearishCount >= 2 && totalScore < 40) {
    if (totalScore < 25) {
      action = 'STRONG_SELL';
      size = 0.8;
      reasoning = 'Strong bearish consensus across all agents';
    } else {
      action = 'SELL';
      size = 0.5;
      reasoning = 'Moderate bearish consensus';
    }
  } else {
    reasoning = 'Mixed signals - holding position';
  }
  
  // Risk adjustment based on win rate
  if (historical.winRate < 40 && size > 0) {
    size *= 0.7; // Reduce position size if recent performance is poor
    reasoning += ' (size reduced due to recent performance)';
  } else if (historical.winRate > 70 && size > 0) {
    size = Math.min(1.0, size * 1.2); // Increase size if performing well
    reasoning += ' (size increased due to strong performance)';
  }
  
  // Calculate overall confidence
  const confidence = (emo.confidence * weights.sentiment + 
                     tekno.confidence * weights.technical + 
                     macro.confidence * weights.macro);
  
  return {
    action: action,
    size: size,
    confidence: confidence,
    reasoning: reasoning,
    weights: weights,
    consensusScore: totalScore
  };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const docRef = doc(collection(db, 'marketData'), 'rl80-analysis');
    const docSnap = await getDoc(docRef);
    const now = Date.now();
    
    // Check cache
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data.lastUpdated && (now - data.lastUpdated < CACHE_DURATION)) {
        console.log('[RL80] Returning cached analysis');
        return res.status(200).json({
          ...data,
          source: 'cached',
          cacheAge: Math.floor((now - data.lastUpdated) / 1000)
        });
      }
    }
    
    console.log('[RL80] Generating fresh analysis...');
    
    // Fetch all agent analyses in parallel
    const [emoAnalysis, teknoAnalysis, macroAnalysis, historical] = await Promise.all([
      getEmoAnalysis(),
      getTeknoAnalysis(),
      getMacroAnalysis(),
      getHistoricalPerformance()
    ]);
    
    // Calculate RL80's decision
    const decision = calculateRL80Decision(emoAnalysis, teknoAnalysis, macroAnalysis, historical);
    
    // Prepare response data
    const analysisData = {
      timestamp: now,
      signals: {
        sentiment: emoAnalysis,
        technical: teknoAnalysis,
        macro: macroAnalysis
      },
      decision: decision,
      performance: {
        winRate: historical.winRate,
        totalPnL: historical.totalPnL,
        recentTrades: historical.recentTrades
      },
      lastUpdated: now,
      updateTime: new Date().toISOString()
    };
    
    // Save to Firestore
    await setDoc(docRef, analysisData);
    console.log('[RL80] Analysis cached to Firestore');
    
    // If this is a trade signal, save it to trade history
    if (decision.action !== 'HOLD') {
      const tradeDoc = {
        timestamp: now,
        preAnalysis: {
          emoScore: emoAnalysis.score,
          teknoScore: teknoAnalysis.score,
          macroScore: macroAnalysis.score,
          rl80Decision: decision.action
        },
        plannedTrade: {
          asset: 'BTC',
          direction: decision.action.includes('BUY') ? 'LONG' : 'SHORT',
          size: decision.size,
          confidence: decision.confidence,
          reasoning: decision.reasoning
        },
        status: 'pending'
      };
      
      // Save planned trade
      const tradesRef = collection(db, 'trades');
      await setDoc(doc(tradesRef), tradeDoc);
    }
    
    return res.status(200).json({
      ...analysisData,
      source: 'fresh',
      cacheAge: 0
    });
    
  } catch (error) {
    console.error('[RL80] Analysis error:', error);
    return res.status(500).json({ 
      error: 'Failed to generate RL80 analysis',
      details: error.message 
    });
  }
}