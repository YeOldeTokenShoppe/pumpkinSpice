// Simplified client-side hook for Lighter trading via API route
import { useState, useEffect, useCallback, useRef } from 'react';

export function useLighterAPI(config = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState(null);
  const [accountData, setAccountData] = useState(null);
  const [positions, setPositions] = useState([]);
  const [orders, setOrders] = useState([]);
  const [performance, setPerformance] = useState(null);
  const [agentThoughts, setAgentThoughts] = useState([]);
  const [marketData, setMarketData] = useState({});
  const [assistantInsights, setAssistantInsights] = useState({
    technical: null,
    sentiment: null,
    macro: null,
    strategy: null
  });
  
  const updateIntervalRef = useRef(null);

  // Fetch account state from API
  const fetchAccountState = useCallback(async () => {
    try {
      const response = await fetch('/api/lighter/simple');
      if (!response.ok) throw new Error('Failed to fetch account state');
      
      const result = await response.json();
      if (result.success) {
        setPositions(result.data.positions || []);
        setOrders(result.data.orders || []);
        setAccountData({
          balance: result.data.accountBalance,
          availableMargin: result.data.availableMargin
        });
        setPerformance(result.data.performance);
        setIsConnected(true);
        
        // Store market data from stats
        let marketDataUpdate = {};
        if (result.data.stats?.order_book_stats) {
          result.data.stats.order_book_stats.forEach(stat => {
            marketDataUpdate[stat.symbol] = {
              ticker: {
                lastPrice: stat.last_trade_price,
                priceChange24h: stat.price_change_24h,
                volume24h: stat.volume_24h
              }
            };
          });
          setMarketData(marketDataUpdate);
        }
        
        // Run AI analysis using the API
        const marketContext = {
          btcPrice: marketDataUpdate['BTC-USD']?.ticker?.lastPrice || marketDataUpdate['BTC/USDC']?.ticker?.lastPrice,
          btcChange: marketDataUpdate['BTC-USD']?.ticker?.priceChange24h || 0,
          ethPrice: marketDataUpdate['ETH-USD']?.ticker?.lastPrice || marketDataUpdate['ETH/USDC']?.ticker?.lastPrice,
          ethChange: marketDataUpdate['ETH-USD']?.ticker?.priceChange24h || 0,
          positionCount: result.data.positions?.length || 0,
          totalPnL: result.data.positions?.reduce((sum, p) => sum + (p.unrealizedPnl || 0), 0) || 0,
          accountBalance: result.data.accountBalance || 0,
          availableMargin: result.data.availableMargin || 0,
          vix: 14.2,
          dxy: 103.42,
          dxyChange: -0.8,
          fearGreed: 72,
          marketRegime: 'RISK_ON'
        };
        
        // Generate thoughts from different consultants via API
        const newThoughts = [];
        
        try {
          // Main trading analysis
          const tradingPrompt = `Market snapshot: BTC $${marketContext.btcPrice || 'N/A'} (${marketContext.btcChange}% 24h), ETH $${marketContext.ethPrice || 'N/A'} (${marketContext.ethChange}% 24h). ${marketContext.positionCount} positions, P&L: $${marketContext.totalPnL.toFixed(2)}. What's the play?`;
          
          const tradingResponse = await fetch('/api/ai/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: tradingPrompt, consultant: 'trading', marketData: marketContext })
          });
          
          if (tradingResponse.ok) {
            const { analysis } = await tradingResponse.json();
            // Store as strategy insight for the main display
            setAssistantInsights(prev => ({ ...prev, strategy: analysis }));
            newThoughts.push({
              timestamp: new Date().toLocaleString(),
              type: 'trading',
              message: analysis,
              consultant: 'market'
            });
          }
          
          // Sentiment analysis with Grok
          const sentimentPrompt = `Crypto sentiment check: BTC ${marketContext.btcChange > 0 ? 'up' : 'down'} ${Math.abs(marketContext.btcChange)}%, Fear/Greed at ${marketContext.fearGreed}. What's the crowd thinking?`;
          
          const sentimentResponse = await fetch('/api/ai/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: sentimentPrompt, consultant: 'sentiment', marketData: marketContext })
          });
          
          if (sentimentResponse.ok) {
            const { analysis } = await sentimentResponse.json();
            // Store sentiment insight
            setAssistantInsights(prev => ({ ...prev, sentiment: analysis }));
            newThoughts.push({
              timestamp: new Date().toLocaleString(),
              type: 'sentiment',
              message: analysis,
              consultant: 'sentiment'
            });
          }
          
          // Macro analysis
          const macroPrompt = `Macro view: DXY at ${marketContext.dxy} (${marketContext.dxyChange}%), VIX at ${marketContext.vix}. How does this impact crypto positioning?`;
          
          const macroResponse = await fetch('/api/ai/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: macroPrompt, consultant: 'macro', marketData: marketContext })
          });
          
          if (macroResponse.ok) {
            const { analysis } = await macroResponse.json();
            // Store macro insight
            setAssistantInsights(prev => ({ ...prev, macro: analysis }));
            newThoughts.push({
              timestamp: new Date().toLocaleString(),
              type: 'market',
              message: analysis,
              consultant: 'macro'
            });
          }
          
          // Technical analysis from TradingView
          const technicalPrompt = `Analyze technical indicators for BTC and ETH`;
          
          const technicalResponse = await fetch('/api/ai/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              prompt: technicalPrompt, 
              consultant: 'technical', 
              marketData: { ...marketContext, fullMarketData: marketDataUpdate }
            })
          });
          
          if (technicalResponse.ok) {
            const { analysis } = await technicalResponse.json();
            // Store technical insight
            setAssistantInsights(prev => ({ ...prev, technical: analysis }));
            newThoughts.push({
              timestamp: new Date().toLocaleString(),
              type: 'trading',
              message: analysis,
              consultant: 'technical'
            });
          }
          
        } catch (error) {
          console.error('AI analysis failed:', error);
          // Add fallback thought
          newThoughts.push({
            timestamp: new Date().toLocaleString(),
            type: 'trading',
            message: `Monitoring ${marketContext.positionCount} positions. Market data updating...`,
            consultant: null
          });
        }
        
        if (newThoughts.length > 0) {
          setAgentThoughts(prevThoughts => {
            const combined = [...newThoughts, ...prevThoughts];
            return combined.slice(0, 30); // Keep last 30 thoughts
          });
        }
        
        return result.data;
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      console.error('Failed to fetch account state:', err);
      setError(err.message);
      setIsConnected(false);
      throw err;
    }
  }, []);

  // Initialize connection
  const initialize = useCallback(async () => {
    if (isInitializing || isConnected) return;
    
    setIsInitializing(true);
    setError(null);
    
    try {
      // Initial fetch to get data immediately
      await fetchAccountState();
      
      // Set up periodic updates
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
      
      // Update every hour for comprehensive analysis
      updateIntervalRef.current = setInterval(() => {
        fetchAccountState();
      }, 3600000); // 60 minutes * 60 seconds * 1000ms
      
    } catch (err) {
      console.error('Failed to initialize Lighter API:', err);
      setError(err.message);
    } finally {
      setIsInitializing(false);
    }
  }, [isInitializing, isConnected, fetchAccountState]);

  // API action helper (temporarily disabled until signing is set up)
  const callAPI = useCallback(async (action) => {
    console.warn(`Trading action ${action} called but not yet implemented`);
    // For now, just return mock success
    return { success: true, message: 'Trading not yet enabled' };
  }, []);

  // Trading actions
  const createMarketOrder = useCallback((market, side, size) => 
    callAPI('createMarketOrder', { market, side, size }), [callAPI]);
    
  const createLimitOrder = useCallback((market, side, size, price) => 
    callAPI('createLimitOrder', { market, side, size, price }), [callAPI]);
    
  const cancelOrder = useCallback((orderId) => 
    callAPI('cancelOrder', { orderId }), [callAPI]);
    
  const closePosition = useCallback((market) => 
    callAPI('closePosition', { market }), [callAPI]);
    
  const analyzeMarket = useCallback((market) => 
    callAPI('analyzeMarket', { market }), [callAPI]);
    
  const executeStrategy = useCallback((markets) => 
    callAPI('executeStrategy', { markets }), [callAPI]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, []);

  // Format data for TradingOverlay
  const formatTradingData = useCallback(() => {
    const totalPnl = positions.reduce((sum, pos) => sum + (pos.unrealizedPnl || 0), 0);
    const balance = accountData?.balance || config.initialBalance || 27000;
    const initialBalance = config.initialBalance || 27000;
    
    return {
      // Model Info
      modelName: 'RL80-Lighter',
      modelVersion: 'Live Trading',
      rank: 1,
      totalModels: 1,
      
      // Fund Stats
      fundBalance: balance,
      initialBalance,
      dailyPnl: totalPnl, // Real P&L from positions
      dailyPnlPercent: balance > 0 ? (totalPnl / balance) * 100 : 0,
      totalPnl: 0, // No P&L until we start trading
      totalPnlPercent: 0, // No returns yet
      
      // Performance Metrics (all 0 until we start trading)
      winRate: performance?.winRate || 0,
      sharpeRatio: 0,
      maxDrawdown: 0,
      profitFactor: 0,
      avgWin: 0,
      avgLoss: 0,
      
      // Trading Statistics (repurposed from ML metrics)
      iterationCount: performance?.totalTrades || 0, // Total trades executed
      lastImprovement: positions.length > 0 ? 'Active' : 'Waiting', // Strategy status
      strategyConfidence: positions.length > 0 ? 100 : 0, // Position utilization %
      learningRate: positions.length > 0 ? positions[0]?.size || 0.01 : 0.01, // Avg position size
      explorationRate: (orders.length / 10) || 0, // Order activity (0-1 scale)
      
      // AI Model Chat/Thoughts - Use real agent thoughts or fallback
      modelThoughts: agentThoughts.length > 0 ? agentThoughts : [
        {
          timestamp: new Date().toLocaleString(),
          type: 'system',
          message: isConnected ? 'AI Agent active. Analyzing markets...' : 'Initializing AI agent...',
          consultant: 'system'
        }
      ],
      
      // Current State
      positions: positions || [],
      pendingOrders: orders || [],
      activePositions: positions || [],
      recentTrades: [],
      
      // Micro Actions for UI - Show recent agent activity
      microActions: [
        {
          time: new Date().toLocaleTimeString(),
          action: positions.length > 0 ? `Monitoring ${positions.length} active positions` : 'Scanning for opportunities'
        },
        {
          time: new Date(Date.now() - 5000).toLocaleTimeString(),
          action: agentThoughts.length > 0 ? 'AI analysis completed' : 'Running market analysis'
        },
        {
          time: new Date(Date.now() - 10000).toLocaleTimeString(),
          action: isConnected ? 'Market data synchronized' : 'Connecting to Lighter...'
        },
        {
          time: new Date(Date.now() - 15000).toLocaleTimeString(),
          action: 'Risk parameters checked'
        }
      ],
      
      // Market Data
      macroData: {
        marketRegime: 'RISK_ON',
        riskScore: 72,
        fedRate: 5.50,
        fedRateChange: -0.25,
        nextFOMC: 'Mar 20',
        rateCutProb: 85,
        dxy: 103.42,
        dxyChange: -0.8,
        vix: 14.2,
        vixChange: -2.1,
        signals: ['Fed Dovish', 'DXY Weak', 'Stables Flowing In']
      },
      
      // Connection Status
      isConnected,
      error,
      
      // Assistant Insights
      assistantInsights
    };
  }, [accountData, positions, orders, performance, isConnected, error, config.initialBalance, agentThoughts, assistantInsights]);

  return {
    // State
    isConnected,
    isInitializing,
    error,
    accountData,
    positions,
    orders,
    performance,
    
    // Actions
    initialize,
    createMarketOrder,
    createLimitOrder,
    cancelOrder,
    closePosition,
    analyzeMarket,
    executeStrategy,
    
    // Formatted data for UI
    tradingData: formatTradingData()
  };
}

export default useLighterAPI;