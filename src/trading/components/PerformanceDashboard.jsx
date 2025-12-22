import { useEffect, useState } from 'react';
import { db, collection, onSnapshot, query, orderBy, limit, where } from '@/utilities/firebaseClient';

const PerformanceDashboard = ({ show = true }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [metrics, setMetrics] = useState({
    totalPnL: 0,
    winRate: 0,
    totalTrades: 0,
    wins: 0,
    losses: 0,
    avgWin: 0,
    avgLoss: 0,
    profitFactor: 0,
    sharpeRatio: 0,
    maxDrawdown: 0,
    currentStreak: 0,
    bestTrade: null,
    worstTrade: null,
    recentTrades: [],
    agentScores: {
      emo: { accuracy: 0, contribution: 0 },
      tekno: { accuracy: 0, contribution: 0 },
      macro: { accuracy: 0, contribution: 0 },
      rl80: { accuracy: 0, decisiveness: 0 }
    }
  });

  const [timeFrame, setTimeFrame] = useState('24h'); // 24h, 7d, 30d, all
  const [isLoading, setIsLoading] = useState(true);

  // Check for mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch and calculate metrics from Firestore
  useEffect(() => {
    if (!db || !show) return;

    const fetchMetrics = async () => {
      try {
        // Get time boundary based on selected timeframe
        const now = Date.now();
        const timeAgo = {
          '24h': now - 24 * 60 * 60 * 1000,
          '7d': now - 7 * 24 * 60 * 60 * 1000,
          '30d': now - 30 * 24 * 60 * 60 * 1000,
          'all': 0
        }[timeFrame];

        // Query trades collection
        const tradesQuery = query(
          collection(db, 'trades'),
          orderBy('timestamp', 'desc'),
          limit(100)
        );

        const unsubscribe = onSnapshot(tradesQuery, (snapshot) => {
          const trades = [];
          let wins = 0;
          let losses = 0;
          let totalPnL = 0;
          let winSum = 0;
          let lossSum = 0;
          let bestTrade = null;
          let worstTrade = null;
          let currentStreak = 0;
          let streakType = null;

          snapshot.forEach(doc => {
            const trade = { id: doc.id, ...doc.data() };
            
            // Filter by timeframe
            if (trade.timestamp && trade.timestamp >= timeAgo) {
              trades.push(trade);
              
              // Calculate metrics if trade has a result
              if (trade.result) {
                const pnl = trade.result.pnl || 0;
                totalPnL += pnl;
                
                if (trade.result.success) {
                  wins++;
                  winSum += pnl;
                  if (streakType === 'win' || streakType === null) {
                    currentStreak = streakType === 'win' ? currentStreak + 1 : 1;
                    streakType = 'win';
                  } else {
                    streakType = 'win';
                    currentStreak = 1;
                  }
                } else {
                  losses++;
                  lossSum += Math.abs(pnl);
                  if (streakType === 'loss' || streakType === null) {
                    currentStreak = streakType === 'loss' ? currentStreak - 1 : -1;
                    streakType = 'loss';
                  } else {
                    streakType = 'loss';
                    currentStreak = -1;
                  }
                }
                
                // Track best and worst trades
                if (!bestTrade || pnl > bestTrade.pnl) {
                  bestTrade = { ...trade, pnl };
                }
                if (!worstTrade || pnl < worstTrade.pnl) {
                  worstTrade = { ...trade, pnl };
                }
              }
            }
          });

          // Calculate derived metrics
          const totalTrades = wins + losses;
          const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
          const avgWin = wins > 0 ? winSum / wins : 0;
          const avgLoss = losses > 0 ? lossSum / losses : 0;
          const profitFactor = lossSum > 0 ? winSum / lossSum : winSum > 0 ? 999 : 0;

          // Calculate agent performance scores
          const agentScores = calculateAgentScores(trades);

          setMetrics({
            totalPnL: totalPnL,
            winRate: winRate,
            totalTrades: totalTrades,
            wins: wins,
            losses: losses,
            avgWin: avgWin,
            avgLoss: avgLoss,
            profitFactor: profitFactor,
            sharpeRatio: calculateSharpe(trades),
            maxDrawdown: calculateMaxDrawdown(trades),
            currentStreak: currentStreak,
            bestTrade: bestTrade,
            worstTrade: worstTrade,
            recentTrades: trades.slice(0, 5),
            agentScores: agentScores
          });
          
          setIsLoading(false);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('Error fetching metrics:', error);
        setIsLoading(false);
      }
    };

    fetchMetrics();
  }, [show, timeFrame]);

  // Helper functions
  const calculateSharpe = (trades) => {
    if (trades.length < 2) return 0;
    const returns = trades
      .filter(t => t.result && t.result.pnl)
      .map(t => t.result.pnl);
    if (returns.length < 2) return 0;
    
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);
    
    return stdDev > 0 ? (mean / stdDev) * Math.sqrt(252) : 0; // Annualized
  };

  const calculateMaxDrawdown = (trades) => {
    let peak = 0;
    let maxDD = 0;
    let cumPnL = 0;
    
    trades.forEach(trade => {
      if (trade.result && trade.result.pnl) {
        cumPnL += trade.result.pnl;
        if (cumPnL > peak) peak = cumPnL;
        const drawdown = peak > 0 ? ((peak - cumPnL) / peak) * 100 : 0;
        if (drawdown > maxDD) maxDD = drawdown;
      }
    });
    
    return maxDD;
  };

  const calculateAgentScores = (trades) => {
    const scores = {
      emo: { correct: 0, total: 0 },
      tekno: { correct: 0, total: 0 },
      macro: { correct: 0, total: 0 },
      rl80: { correct: 0, total: 0 }
    };
    
    trades.forEach(trade => {
      if (trade.preAnalysis && trade.result) {
        const success = trade.result.success;
        
        // Check EMO sentiment
        if (trade.preAnalysis.emoScore !== undefined) {
          scores.emo.total++;
          if ((trade.preAnalysis.emoScore > 60 && success) || 
              (trade.preAnalysis.emoScore < 40 && !success)) {
            scores.emo.correct++;
          }
        }
        
        // Check TEKNO technical
        if (trade.preAnalysis.teknoScore !== undefined) {
          scores.tekno.total++;
          if ((trade.preAnalysis.teknoScore > 60 && success) || 
              (trade.preAnalysis.teknoScore < 40 && !success)) {
            scores.tekno.correct++;
          }
        }
        
        // Check MACRO
        if (trade.preAnalysis.macroScore !== undefined) {
          scores.macro.total++;
          if ((trade.preAnalysis.macroScore > 60 && success) || 
              (trade.preAnalysis.macroScore < 40 && !success)) {
            scores.macro.correct++;
          }
        }
        
        // RL80 decision accuracy
        if (trade.preAnalysis.rl80Decision) {
          scores.rl80.total++;
          const wasBullish = trade.preAnalysis.rl80Decision.includes('BUY');
          if ((wasBullish && success) || (!wasBullish && !success)) {
            scores.rl80.correct++;
          }
        }
      }
    });
    
    return {
      emo: { 
        accuracy: scores.emo.total > 0 ? (scores.emo.correct / scores.emo.total) * 100 : 0,
        contribution: scores.emo.correct 
      },
      tekno: { 
        accuracy: scores.tekno.total > 0 ? (scores.tekno.correct / scores.tekno.total) * 100 : 0,
        contribution: scores.tekno.correct 
      },
      macro: { 
        accuracy: scores.macro.total > 0 ? (scores.macro.correct / scores.macro.total) * 100 : 0,
        contribution: scores.macro.correct 
      },
      rl80: { 
        accuracy: scores.rl80.total > 0 ? (scores.rl80.correct / scores.rl80.total) * 100 : 0,
        decisiveness: scores.rl80.total 
      }
    };
  };

  if (!show) return null;

  return (
    <div style={{
      maxWidth: isMobile ? '100%' : '1200px',
      margin: '0 auto',
      padding: isMobile ? '10px' : '15px',
      background: 'linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%)',
      borderRadius: isMobile ? '0' : '10px',
      border: '1px solid rgba(255, 215, 0, 0.2)',
      color: '#fff',
      fontFamily: 'monospace'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between',
        alignItems: isMobile ? 'stretch' : 'center',
        marginBottom: isMobile ? '10px' : '15px',
        paddingBottom: isMobile ? '8px' : '10px',
        borderBottom: '1px solid rgba(255, 215, 0, 0.3)',
        gap: isMobile ? '10px' : '0'
      }}>
        <div>
          <h2 style={{ 
            color: '#FFD700', 
            margin: 0, 
            fontSize: isMobile ? '16px' : '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            ⚡ {isMobile ? 'RL80 Dashboard' : 'RL80 Performance Dashboard'}
          </h2>
          {!isMobile && (
            <div style={{ color: '#888', fontSize: '11px', marginTop: '2px' }}>
              Multi-Agent Trading System Analytics
            </div>
          )}
        </div>
        
        {/* Timeframe Selector */}
        <div style={{ display: 'flex', gap: isMobile ? '4px' : '8px', justifyContent: isMobile ? 'space-between' : 'flex-end' }}>
          {['24h', '7d', '30d', 'all'].map(tf => (
            <button
              key={tf}
              onClick={() => setTimeFrame(tf)}
              style={{
                padding: isMobile ? '5px 10px' : '6px 12px',
                background: timeFrame === tf ? '#FFD700' : 'rgba(255, 215, 0, 0.1)',
                color: timeFrame === tf ? '#000' : '#FFD700',
                border: `1px solid #FFD700`,
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: isMobile ? '11px' : '12px',
                fontWeight: 'bold',
                transition: 'all 0.2s',
                flex: isMobile ? '1' : 'none'
              }}
            >
              {tf.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#888' }}>
          <div style={{ fontSize: '24px', marginBottom: '10px' }}>⚙️</div>
          Loading performance data...
        </div>
      ) : (
        <div>
          {/* Main P&L Card - Full Width */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.15) 0%, rgba(255, 215, 0, 0.05) 100%)',
            padding: isMobile ? '12px' : '15px',
            borderRadius: '8px',
            border: '1px solid rgba(255, 215, 0, 0.4)',
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr',
            gap: isMobile ? '12px' : '15px'
          }}>
            {/* Total P&L */}
            <div>
              <div style={{ color: '#888', fontSize: isMobile ? '9px' : '10px', marginBottom: '6px', textTransform: 'uppercase' }}>
                Total P&L
              </div>
              <div style={{
                fontSize: isMobile ? '24px' : '28px',
                fontWeight: 'bold',
                color: metrics.totalPnL >= 0 ? '#00ff00' : '#ff3333',
                marginBottom: '4px'
              }}>
                {metrics.totalPnL >= 0 ? '+' : ''}{metrics.totalPnL.toFixed(2)}%
              </div>
              <div style={{ 
                display: 'flex', 
                gap: '8px', 
                color: '#666', 
                fontSize: '10px',
                alignItems: 'center'
              }}>
                <span>{metrics.totalTrades} trades</span>
                <span>•</span>
                <span>{timeFrame.toUpperCase()}</span>
              </div>
            </div>

            {/* Win Rate with Visual Bar */}
            <div>
              <div style={{ color: '#888', fontSize: isMobile ? '9px' : '10px', marginBottom: '6px', textTransform: 'uppercase' }}>
                Win Rate
              </div>
              <div style={{ fontSize: isMobile ? '24px' : '28px', fontWeight: 'bold', color: '#fff', marginBottom: '6px' }}>
                {metrics.winRate.toFixed(0)}%
              </div>
              {/* Win/Loss Bar */}
              <div style={{ 
                display: 'flex', 
                height: '6px', 
                borderRadius: '3px',
                overflow: 'hidden',
                background: 'rgba(255, 51, 51, 0.3)'
              }}>
                <div style={{
                  width: `${metrics.winRate}%`,
                  background: '#00ff00',
                  transition: 'width 0.5s ease'
                }} />
              </div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                marginTop: '5px',
                fontSize: '10px',
                color: '#666'
              }}>
                <span>{metrics.wins}W</span>
                <span>{metrics.losses}L</span>
              </div>
            </div>

            {/* Current Streak */}
            <div style={{
              background: metrics.currentStreak > 0 ? 'rgba(0, 255, 0, 0.1)' : 'rgba(255, 0, 0, 0.1)',
              padding: isMobile ? '10px' : '12px',
              borderRadius: '6px',
              border: `1px solid ${metrics.currentStreak > 0 ? 'rgba(0, 255, 0, 0.3)' : 'rgba(255, 0, 0, 0.3)'}`
            }}>
              <div style={{ color: '#888', fontSize: isMobile ? '9px' : '10px', marginBottom: '6px', textTransform: 'uppercase' }}>
                Current Streak
              </div>
              <div style={{
                fontSize: isMobile ? '24px' : '28px',
                fontWeight: 'bold',
                color: metrics.currentStreak > 0 ? '#00ff00' : '#ff3333',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                {Math.abs(metrics.currentStreak)}
                <span style={{ fontSize: isMobile ? '16px' : '18px' }}>
                  {metrics.currentStreak > 0 ? '🔥' : '❄️'}
                </span>
              </div>
              <div style={{ color: '#666', fontSize: '9px', marginTop: '3px' }}>
                {metrics.currentStreak > 0 ? 'Consecutive Wins' : 
                 metrics.currentStreak < 0 ? 'Consecutive Losses' : 'No Streak'}
              </div>
            </div>
          </div>

          {/* 2x2 Grid Section - Stacks on mobile */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
            gap: isMobile ? '12px' : '15px',
            marginTop: isMobile ? '12px' : '15px'
          }}>
            {/* Council Performance */}
            <div style={{
            background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.1) 0%, rgba(147, 51, 234, 0.02) 100%)',
            padding: isMobile ? '12px' : '15px',
            borderRadius: '10px',
            border: '1px solid rgba(147, 51, 234, 0.3)'
          }}>
            <div style={{ 
              color: '#9333ea', 
              fontSize: isMobile ? '12px' : '13px', 
              marginBottom: isMobile ? '10px' : '12px', 
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span>🤝</span> COUNCIL PERFORMANCE
            </div>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(2, 1fr)', 
              gap: '12px' 
            }}>
              {/* EMO */}
              <div style={{
                background: 'rgba(147, 51, 234, 0.1)',
                padding: '10px',
                borderRadius: '8px',
                textAlign: 'center',
                border: '1px solid rgba(147, 51, 234, 0.2)'
              }}>
                <div style={{ color: '#9333ea', fontSize: '10px', marginBottom: '6px' }}>
                  EMO
                </div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#fff', marginBottom: '4px' }}>
                  {metrics.agentScores.emo.accuracy.toFixed(0)}%
                </div>
                {/* Accuracy Bar */}
                <div style={{ 
                  height: '3px', 
                  background: 'rgba(147, 51, 234, 0.2)',
                  borderRadius: '2px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${metrics.agentScores.emo.accuracy}%`,
                    height: '100%',
                    background: '#9333ea',
                    transition: 'width 0.5s ease'
                  }} />
                </div>
                <div style={{ color: '#666', fontSize: '8px', marginTop: '4px' }}>
                  Sentiment Analysis
                </div>
              </div>

              {/* TEKNO */}
              <div style={{
                background: 'rgba(0, 255, 255, 0.1)',
                padding: '10px',
                borderRadius: '8px',
                textAlign: 'center',
                border: '1px solid rgba(0, 255, 255, 0.2)'
              }}>
                <div style={{ color: '#00ffff', fontSize: '10px', marginBottom: '6px' }}>
                  TEKNO
                </div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#fff', marginBottom: '4px' }}>
                  {metrics.agentScores.tekno.accuracy.toFixed(0)}%
                </div>
                <div style={{ 
                  height: '4px', 
                  background: 'rgba(0, 255, 255, 0.2)',
                  borderRadius: '2px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${metrics.agentScores.tekno.accuracy}%`,
                    height: '100%',
                    background: '#00ffff',
                    transition: 'width 0.5s ease'
                  }} />
                </div>
                <div style={{ color: '#666', fontSize: '8px', marginTop: '4px' }}>
                  Technical Analysis
                </div>
              </div>

              {/* MACRO */}
              <div style={{
                background: 'rgba(0, 255, 0, 0.1)',
                padding: '10px',
                borderRadius: '8px',
                textAlign: 'center',
                border: '1px solid rgba(0, 255, 0, 0.2)'
              }}>
                <div style={{ color: '#00ff00', fontSize: '10px', marginBottom: '6px' }}>
                  MACRO
                </div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#fff', marginBottom: '4px' }}>
                  {metrics.agentScores.macro.accuracy.toFixed(0)}%
                </div>
                <div style={{ 
                  height: '4px', 
                  background: 'rgba(0, 255, 0, 0.2)',
                  borderRadius: '2px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${metrics.agentScores.macro.accuracy}%`,
                    height: '100%',
                    background: '#00ff00',
                    transition: 'width 0.5s ease'
                  }} />
                </div>
                <div style={{ color: '#666', fontSize: '8px', marginTop: '4px' }}>
                  Economic Analysis
                </div>
              </div>

              {/* RL80 */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.2) 0%, rgba(255, 215, 0, 0.1) 100%)',
                padding: '10px',
                borderRadius: '8px',
                textAlign: 'center',
                border: '1px solid rgba(255, 215, 0, 0.3)'
              }}>
                <div style={{ color: '#FFD700', fontSize: '10px', marginBottom: '6px' }}>
                  RL80 ⚡
                </div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#fff', marginBottom: '4px' }}>
                  {metrics.agentScores.rl80.accuracy.toFixed(0)}%
                </div>
                <div style={{ 
                  height: '4px', 
                  background: 'rgba(255, 215, 0, 0.2)',
                  borderRadius: '2px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${metrics.agentScores.rl80.accuracy}%`,
                    height: '100%',
                    background: '#FFD700',
                    transition: 'width 0.5s ease'
                  }} />
                </div>
                <div style={{ color: '#666', fontSize: '8px', marginTop: '4px' }}>
                  Master Coordinator
                </div>
              </div>
            </div>
          </div>

            {/* Risk Metrics Card */}
            <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            padding: isMobile ? '15px' : '20px',
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{ 
              color: '#888', 
              fontSize: '12px', 
              marginBottom: '15px', 
              fontWeight: 'bold',
              textTransform: 'uppercase'
            }}>
              📊 Risk Metrics
            </div>
            
            {/* Profit Factor */}
            <div style={{ marginBottom: '15px' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                marginBottom: '5px'
              }}>
                <span style={{ color: '#666', fontSize: '11px' }}>Profit Factor</span>
                <span style={{ color: '#0096ff', fontSize: '14px', fontWeight: 'bold' }}>
                  {metrics.profitFactor > 100 ? '∞' : metrics.profitFactor.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Sharpe Ratio */}
            <div style={{ marginBottom: '15px' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                marginBottom: '5px'
              }}>
                <span style={{ color: '#666', fontSize: '11px' }}>Sharpe Ratio</span>
                <span style={{ color: '#FFD700', fontSize: '14px', fontWeight: 'bold' }}>
                  {metrics.sharpeRatio.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Max Drawdown */}
            <div style={{ marginBottom: '15px' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                marginBottom: '5px'
              }}>
                <span style={{ color: '#666', fontSize: '11px' }}>Max Drawdown</span>
                <span style={{ color: '#ff3333', fontSize: '14px', fontWeight: 'bold' }}>
                  -{metrics.maxDrawdown.toFixed(1)}%
                </span>
              </div>
              {/* Drawdown visualization */}
              <div style={{ 
                height: '4px', 
                background: 'rgba(255, 51, 51, 0.2)',
                borderRadius: '2px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${Math.min(metrics.maxDrawdown, 100)}%`,
                  height: '100%',
                  background: '#ff3333'
                }} />
              </div>
            </div>

            {/* Win/Loss Ratio */}
            <div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                marginBottom: '5px'
              }}>
                <span style={{ color: '#666', fontSize: '11px' }}>Avg Win/Loss</span>
                <span style={{ color: '#00ff00', fontSize: '14px', fontWeight: 'bold' }}>
                  {metrics.avgLoss > 0 ? (metrics.avgWin / metrics.avgLoss).toFixed(2) : '∞'}
                </span>
              </div>
            </div>
          </div>

            {/* Recent Trades Card */}
            <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            padding: isMobile ? '15px' : '20px',
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            maxHeight: isMobile ? '250px' : '300px',
            overflowY: 'auto'
          }}>
            <div style={{ 
              color: '#888', 
              fontSize: '12px', 
              marginBottom: '15px', 
              fontWeight: 'bold',
              textTransform: 'uppercase',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>📈 Recent Trades</span>
              <span style={{ color: '#666', fontSize: '10px', fontWeight: 'normal' }}>
                Last 5
              </span>
            </div>
            
            {metrics.recentTrades.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {metrics.recentTrades.map((trade, i) => (
                  <div key={trade.id || i} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: '6px',
                    borderLeft: `3px solid ${trade.result?.success ? '#00ff00' : '#ff3333'}`,
                    transition: 'all 0.2s',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'}
                  >
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <div style={{ 
                        color: trade.result?.success ? '#00ff00' : '#ff3333',
                        fontSize: '16px'
                      }}>
                        {trade.result?.success ? '✓' : '✗'}
                      </div>
                      <div>
                        <div style={{ color: '#ddd', fontSize: '12px', marginBottom: '2px' }}>
                          {trade.plannedTrade?.asset || 'BTC'} {trade.plannedTrade?.direction || 'N/A'}
                        </div>
                        <div style={{ color: '#666', fontSize: '10px' }}>
                          {new Date(trade.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                    <div style={{
                      color: trade.result?.pnl >= 0 ? '#00ff00' : '#ff3333',
                      fontWeight: 'bold',
                      fontSize: '13px'
                    }}>
                      {trade.result?.pnl >= 0 ? '+' : ''}{trade.result?.pnl?.toFixed(2) || '0.00'}%
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ 
                color: '#666', 
                textAlign: 'center', 
                padding: '40px 20px',
                fontSize: '12px'
              }}>
                No trades in selected timeframe
              </div>
            )}
          </div>

          {/* Best/Worst Trades Card */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            padding: isMobile ? '15px' : '20px',
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{ 
              color: '#888', 
              fontSize: '12px', 
              marginBottom: '15px', 
              fontWeight: 'bold',
              textTransform: 'uppercase'
            }}>
              🎯 Best & Worst Trades
            </div>
            
            {/* Best Trade */}
            {metrics.bestTrade && (
              <div style={{
                marginBottom: '20px',
                padding: '12px',
                background: 'rgba(0, 255, 0, 0.05)',
                borderRadius: '8px',
                borderLeft: '3px solid #00ff00'
              }}>
                <div style={{ color: '#00ff00', fontSize: '10px', marginBottom: '6px', textTransform: 'uppercase' }}>
                  Best Performance
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ color: '#fff', fontSize: '13px', marginBottom: '2px' }}>
                      {metrics.bestTrade.plannedTrade?.asset || 'BTC'} {metrics.bestTrade.plannedTrade?.direction || 'LONG'}
                    </div>
                    <div style={{ color: '#666', fontSize: '10px' }}>
                      {new Date(metrics.bestTrade.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{
                    fontSize: isMobile ? '18px' : '20px',
                    fontWeight: 'bold',
                    color: '#00ff00'
                  }}>
                    +{metrics.bestTrade.pnl?.toFixed(2)}%
                  </div>
                </div>
              </div>
            )}
            
            {/* Worst Trade */}
            {metrics.worstTrade && (
              <div style={{
                padding: '12px',
                background: 'rgba(255, 0, 0, 0.05)',
                borderRadius: '8px',
                borderLeft: '3px solid #ff3333'
              }}>
                <div style={{ color: '#ff3333', fontSize: '10px', marginBottom: '6px', textTransform: 'uppercase' }}>
                  Worst Performance
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ color: '#fff', fontSize: '13px', marginBottom: '2px' }}>
                      {metrics.worstTrade.plannedTrade?.asset || 'BTC'} {metrics.worstTrade.plannedTrade?.direction || 'SHORT'}
                    </div>
                    <div style={{ color: '#666', fontSize: '10px' }}>
                      {new Date(metrics.worstTrade.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{
                    fontSize: isMobile ? '18px' : '20px',
                    fontWeight: 'bold',
                    color: '#ff3333'
                  }}>
                    {metrics.worstTrade.pnl?.toFixed(2)}%
                  </div>
                </div>
              </div>
            )}
            
            {!metrics.bestTrade && !metrics.worstTrade && (
              <div style={{ 
                color: '#666', 
                textAlign: 'center', 
                padding: '40px 20px',
                fontSize: '12px'
              }}>
                No trades to display
              </div>
            )}
          </div>
        </div>
      </div>
      )}
    </div>
  );
};

export default PerformanceDashboard;