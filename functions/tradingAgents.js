// Firebase Cloud Functions for Trading Agents
// Runs in production to maintain persistent connections and learning

const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const rtdb = admin.database();

// Scheduled function to maintain Lighter testnet connection
exports.maintainLighterConnection = functions.pubsub
  .schedule('every 5 minutes')
  .onRun(async (context) => {
    console.log('Checking Lighter testnet connection...');
    
    try {
      // Check connection status
      const connectionRef = rtdb.ref('lighter/connection');
      const snapshot = await connectionRef.once('value');
      const connection = snapshot.val();
      
      if (!connection || connection.status !== 'connected' || 
          Date.now() - connection.timestamp > 5 * 60 * 1000) {
        
        // Connection is stale or disconnected
        console.log('Connection stale, triggering reconnect...');
        
        // Trigger reconnection via callable function
        await reconnectToLighter();
      }
      
      // Update heartbeat
      await connectionRef.update({
        heartbeat: Date.now()
      });
      
    } catch (error) {
      console.error('Error maintaining connection:', error);
    }
    
    return null;
  });

// Scheduled function for agent collaboration
exports.agentCollaborationCycle = functions.pubsub
  .schedule('every 10 minutes')
  .timeZone('America/New_York')
  .onRun(async (context) => {
    console.log('Running agent collaboration cycle...');
    
    try {
      // Get current market data from RTDB
      const marketDataRef = rtdb.ref('lighter/marketData');
      const marketSnapshot = await marketDataRef.once('value');
      const marketData = marketSnapshot.val();
      
      if (!marketData) {
        console.log('No market data available, skipping cycle');
        return null;
      }
      
      // Determine discussion topic based on market conditions
      const topic = selectDiscussionTopic(marketData);
      
      // Run agent discussion
      const discussion = await runAgentDiscussion(topic, marketData);
      
      // Save discussion to Firestore
      if (discussion && discussion.messages.length > 0) {
        const batch = db.batch();
        
        discussion.messages.forEach(msg => {
          const docRef = db.collection('collaboration/chat/messages').doc(msg.id);
          batch.set(docRef, msg);
        });
        
        await batch.commit();
        console.log(`Saved ${discussion.messages.length} messages`);
      }
      
      // Process any trading decisions
      if (discussion.tradingDecision) {
        await processTradingDecision(discussion.tradingDecision);
      }
      
    } catch (error) {
      console.error('Error in collaboration cycle:', error);
    }
    
    return null;
  });

// Scheduled function for learning cycle
exports.agentLearningCycle = functions.pubsub
  .schedule('every 30 minutes')
  .onRun(async (context) => {
    console.log('Running agent learning cycle...');
    
    try {
      // Get recent trades
      const tradesSnapshot = await db.collection('trades')
        .where('timestamp', '>', Date.now() - 24 * 60 * 60 * 1000)
        .orderBy('timestamp', 'desc')
        .limit(50)
        .get();
      
      const trades = [];
      tradesSnapshot.forEach(doc => trades.push(doc.data()));
      
      if (trades.length === 0) {
        console.log('No recent trades to learn from');
        return null;
      }
      
      // Calculate performance metrics
      const performance = calculatePerformance(trades);
      
      // Record performance in knowledge base
      await db.collection('knowledge/performance/metrics').add({
        id: `metric_${Date.now()}`,
        timestamp: Date.now(),
        period: 'daily',
        trades: trades.length,
        winRate: performance.winRate,
        pnl: performance.totalPnl,
        sharpeRatio: performance.sharpeRatio,
        maxDrawdown: performance.maxDrawdown,
        insights: performance.insights
      });
      
      // Extract and record patterns from successful trades
      const successfulTrades = trades.filter(t => t.pnl > 0);
      
      for (const trade of successfulTrades) {
        const pattern = extractPattern(trade);
        if (pattern) {
          await db.collection('knowledge/trading/patterns').add(pattern);
        }
      }
      
      // Extract lessons from failures
      const failedTrades = trades.filter(t => t.pnl < 0);
      
      for (const trade of failedTrades) {
        const lesson = extractLesson(trade);
        if (lesson) {
          await db.collection('knowledge/trading/lessons').add(lesson);
        }
      }
      
      console.log(`Learning cycle complete: ${successfulTrades.length} successes, ${failedTrades.length} failures analyzed`);
      
    } catch (error) {
      console.error('Error in learning cycle:', error);
    }
    
    return null;
  });

// HTTP callable function for manual agent trigger
exports.triggerAgentDiscussion = functions.https.onCall(async (data, context) => {
  // Check authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }
  
  const { topic, urgent } = data;
  
  try {
    // Get current market data
    const marketDataRef = rtdb.ref('lighter/marketData');
    const marketSnapshot = await marketDataRef.once('value');
    const marketData = marketSnapshot.val();
    
    // Run discussion
    const discussion = await runAgentDiscussion(topic || 'market_analysis', marketData);
    
    // Save to Firestore
    if (discussion && discussion.messages.length > 0) {
      const batch = db.batch();
      
      discussion.messages.forEach(msg => {
        const docRef = db.collection('collaboration/chat/messages').doc(msg.id);
        batch.set(docRef, { ...msg, manual: true, triggeredBy: context.auth.uid });
      });
      
      await batch.commit();
    }
    
    return {
      success: true,
      messageCount: discussion.messages.length,
      decision: discussion.tradingDecision
    };
    
  } catch (error) {
    console.error('Error triggering discussion:', error);
    throw new functions.https.HttpsError('internal', 'Failed to trigger discussion');
  }
});

// Helper functions

function selectDiscussionTopic(marketData) {
  const btc = marketData['BTC-PERP'];
  
  if (!btc) return 'market_analysis';
  
  // Topic selection based on market conditions
  if (btc.rsi && btc.rsi > 70) return 'exit_strategies';
  if (btc.rsi && btc.rsi < 30) return 'entry_opportunities';
  if (btc.volatility > 40) return 'risk_assessment';
  
  // Random topic selection with weights
  const topics = [
    { name: 'market_analysis', weight: 3 },
    { name: 'macro_outlook', weight: 2 },
    { name: 'sentiment_check', weight: 2 },
    { name: 'performance_review', weight: 1 }
  ];
  
  const totalWeight = topics.reduce((sum, t) => sum + t.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const topic of topics) {
    random -= topic.weight;
    if (random <= 0) return topic.name;
  }
  
  return 'market_analysis';
}

async function runAgentDiscussion(topic, marketData) {
  // This would call your agent APIs
  // Simplified version for demonstration
  
  const messages = [];
  const timestamp = Date.now();
  
  // Mock agent responses - replace with actual API calls
  messages.push({
    id: `msg_${timestamp}_sentiment`,
    timestamp,
    agent: 'sentiment',
    topic,
    message: 'Crowd sentiment is neutral with slight bullish bias.',
    confidence: 0.6
  });
  
  messages.push({
    id: `msg_${timestamp + 1}_market`,
    timestamp: timestamp + 1,
    agent: 'market',
    topic,
    message: 'Technical indicators showing consolidation pattern.',
    confidence: 0.7
  });
  
  messages.push({
    id: `msg_${timestamp + 2}_macro`,
    timestamp: timestamp + 2,
    agent: 'macro',
    topic,
    message: 'Macro environment supportive with stable DXY.',
    confidence: 0.65
  });
  
  messages.push({
    id: `msg_${timestamp + 3}_rl80`,
    timestamp: timestamp + 3,
    agent: 'rl80',
    topic,
    message: 'Maintaining neutral stance, waiting for clearer signals.',
    confidence: 0.7,
    decision: { action: 'hold', reason: 'mixed_signals' }
  });
  
  return {
    messages,
    tradingDecision: messages[3].decision
  };
}

function calculatePerformance(trades) {
  const wins = trades.filter(t => t.pnl > 0).length;
  const losses = trades.filter(t => t.pnl < 0).length;
  const totalPnl = trades.reduce((sum, t) => sum + (t.pnl || 0), 0);
  
  // Calculate drawdown
  let peak = 0;
  let maxDrawdown = 0;
  let cumPnl = 0;
  
  trades.forEach(trade => {
    cumPnl += trade.pnl || 0;
    if (cumPnl > peak) peak = cumPnl;
    const drawdown = (peak - cumPnl) / Math.max(peak, 1);
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
  });
  
  // Simple Sharpe calculation
  const returns = trades.map(t => t.pnl || 0);
  const avgReturn = totalPnl / trades.length;
  const stdDev = Math.sqrt(
    returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / trades.length
  );
  const sharpeRatio = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0;
  
  return {
    winRate: trades.length > 0 ? wins / trades.length : 0,
    totalPnl,
    maxDrawdown,
    sharpeRatio,
    insights: {
      wins,
      losses,
      avgWin: wins > 0 ? trades.filter(t => t.pnl > 0).reduce((sum, t) => sum + t.pnl, 0) / wins : 0,
      avgLoss: losses > 0 ? trades.filter(t => t.pnl < 0).reduce((sum, t) => sum + t.pnl, 0) / losses : 0
    }
  };
}

function extractPattern(trade) {
  // Extract pattern from successful trade
  return {
    id: `pattern_${Date.now()}_${trade.id}`,
    timestamp: Date.now(),
    market: trade.market,
    type: trade.type || 'unknown',
    setup: trade.setup || 'standard',
    indicators: trade.indicators || {},
    outcome: 'success',
    pnl: trade.pnl,
    confidence: 0.6
  };
}

function extractLesson(trade) {
  // Extract lesson from failed trade
  return {
    id: `lesson_${Date.now()}_${trade.id}`,
    timestamp: Date.now(),
    title: `Loss on ${trade.market}`,
    description: `Trade resulted in ${trade.pnl} loss`,
    category: 'trade_failure',
    impact: 'negative',
    severity: Math.abs(trade.pnl) > 100 ? 8 : 5,
    actionableInsight: 'Review entry criteria and risk management'
  };
}

async function reconnectToLighter() {
  // Trigger reconnection logic
  // This would typically call your WebSocket manager
  console.log('Reconnecting to Lighter testnet...');
  
  await rtdb.ref('lighter/connection').set({
    status: 'reconnecting',
    timestamp: Date.now()
  });
}

async function processTradingDecision(decision) {
  if (!decision || decision.action === 'hold') {
    console.log('No action required');
    return;
  }
  
  // Process buy/sell decisions
  console.log(`Processing trading decision: ${decision.action}`);
  
  // This would integrate with your Lighter trading API
  // For now, just log the decision
  await db.collection('trading_decisions').add({
    timestamp: Date.now(),
    action: decision.action,
    reason: decision.reason,
    executed: false // Would be set to true after execution
  });
}

module.exports = {
  maintainLighterConnection,
  agentCollaborationCycle,
  agentLearningCycle,
  triggerAgentDiscussion
};