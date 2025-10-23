import React, { useState, useEffect } from 'react';

const TradingOverlay = ({ show = false }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState('stats'); // for mobile view
  const [tradingData, setTradingData] = useState({
    fundBalance: 142857.33,
    dailyPnl: 3847.21,
    dailyPnlPercent: 2.77,
    totalPnl: 42857.33,
    totalPnlPercent: 42.86,
    stakersCount: 1337,
    tvl: 888888.88,
    apy: 69.42,
    performanceScore: 7,
    activePositions: [
      { symbol: 'ETH/USDT', side: 'LONG', size: 2.5, entry: 3450.00, current: 3512.50, pnl: 156.25, pnlPercent: 1.81 },
      { symbol: 'SOL/USDT', side: 'SHORT', size: 100, entry: 142.80, current: 141.20, pnl: 160.00, pnlPercent: 1.12 },
      { symbol: 'BTC/USDT', side: 'LONG', size: 0.15, entry: 65800, current: 67200, pnl: 210.00, pnlPercent: 2.13 },
    ],
    recentTrades: [
      { time: '17:42', symbol: 'DOGE', side: 'BUY', amount: '10K', price: 0.385, pnl: '+$142', status: 'exceptional' },
      { time: '16:21', symbol: 'AVAX', side: 'SELL', amount: '50', price: 42.10, pnl: '+$89', status: 'profit' },
      { time: '14:55', symbol: 'LINK', side: 'BUY', amount: '200', price: 18.95, pnl: '-$23', status: 'loss' },
      { time: '13:12', symbol: 'ARB', side: 'BUY', amount: '1.5K', price: 1.82, pnl: '+$217', status: 'exceptional' },
    ],
    nextAnalysis: '00:42:17',
    winStreak: 13,
    profitMultiplier: 1.77,
    // Macro Economic Data
    macroData: {
      marketRegime: 'RISK_ON', // RISK_ON, RISK_OFF, NEUTRAL
      riskScore: 72, // 0-100 scale
      
      // Traditional Macro
      fedRate: 5.50,
      fedRateChange: -0.25,
      nextFOMC: 'Mar 20',
      rateCutProb: 85,
      
      dxy: 103.42, // Dollar Index
      dxyChange: -0.8,
      vix: 14.2, // Volatility Index
      vixChange: -2.1,
      
      cpi: 3.1,
      cpiPrev: 3.4,
      treasury10Y: 4.25,
      
      // Crypto Macro
      btcDominance: 52.3,
      btcDomChange: 1.2,
      fearGreed: 72, // 0-100, current: Greed
      fearGreedText: 'Greed',
      
      stableMcap: 140.2, // Billions
      stableFlow: 2.8, // Billions 24h
      stableFlowDirection: 'IN',
      
      totalCryptoMcap: 2.68, // Trillions
      defiTVL: 68.5, // Billions
      
      // Exchange Metrics
      fundingRate: 0.012, // Perpetual funding
      openInterest: 18.7, // Billions
      exchangeReserves: -2.3, // % change (negative = outflows)
      
      // Risk Indicators
      riskMultiplier: 1.2, // Position sizing multiplier
      signals: ['Fed Dovish', 'DXY Weak', 'Stables Flowing In']
    }
  });

  // Check for mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!show) return;
    
    const updateData = () => {
      setTradingData(prev => ({
        ...prev,
        fundBalance: prev.fundBalance + (Math.random() - 0.3) * 100,
        dailyPnl: prev.dailyPnl + (Math.random() - 0.5) * 50,
        activePositions: prev.activePositions.map(pos => ({
          ...pos,
          current: pos.current * (1 + (Math.random() - 0.5) * 0.002),
          pnl: pos.pnl + (Math.random() - 0.5) * 10
        }))
      }));
    };
    
    const interval = setInterval(updateData, 3000);
    return () => clearInterval(interval);
  }, [show]);

  if (!show) return null;

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num/1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num/1000).toFixed(1)}K`;
    return num.toFixed(2);
  };

  // Mobile view - tabbed interface
  if (isMobile && show) {
    return (
      <>
        {/* Mobile Tab Navigation */}
        <div style={{
          position: 'fixed',
          top: '80px',
          left: '10px',
          right: '10px',
          display: 'flex',
          gap: '5px',
          zIndex: 10000,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: '5px',
          borderRadius: '8px',
          border: '1px solid rgba(0, 255, 0, 0.3)'
        }}>
          {['stats', 'macro', 'positions', 'trades'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1,
                padding: '8px',
                background: activeTab === tab ? 'rgba(0, 255, 0, 0.2)' : 'transparent',
                border: activeTab === tab ? '1px solid #00ff00' : '1px solid rgba(0, 255, 0, 0.2)',
                color: activeTab === tab ? '#00ff00' : '#888',
                borderRadius: '4px',
                fontFamily: 'monospace',
                fontSize: '11px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              {tab.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Mobile Content Panel */}
        <div style={{
          position: 'fixed',
          top: '130px',
          left: '10px',
          right: '10px',
          maxHeight: '60vh',
          overflowY: 'auto',
          background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(0, 20, 0, 0.9) 100%)',
          border: '1px solid #00ff00',
          borderRadius: '8px',
          padding: '12px',
          fontFamily: 'monospace',
          fontSize: '11px',
          zIndex: 9999,
          boxShadow: '0 0 20px rgba(0, 255, 0, 0.3)',
          backdropFilter: 'blur(10px)'
        }}>
          {/* Stats Tab */}
          {activeTab === 'stats' && (
            <>
              {/* Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '12px',
                paddingBottom: '8px',
                borderBottom: '1px solid rgba(0, 255, 0, 0.3)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '6px',
                    height: '6px',
                    background: '#00ff00',
                    borderRadius: '50%',
                    animation: 'pulse 2s infinite',
                    boxShadow: '0 0 10px #00ff00'
                  }} />
                  <div style={{ color: '#00ff00', fontWeight: 'bold', fontSize: '12px' }}>
                    ⚡ CYBORG TRADING FUND
                  </div>
                </div>
                <div style={{ color: '#00ff00', fontSize: '10px', opacity: 0.8 }}>
                  LIVE
                </div>
              </div>

              {/* Fund Balance */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ color: '#00ff00', fontSize: '10px', opacity: 0.7, marginBottom: '3px' }}>
                  FUND BALANCE
                </div>
                <div style={{ 
                  fontSize: '20px', 
                  fontWeight: 'bold',
                  color: '#00ff00',
                  textShadow: '0 0 10px rgba(0, 255, 0, 0.5)',
                  marginBottom: '5px'
                }}>
                  ${formatNumber(tradingData.fundBalance)}
                </div>
                <div>
                  <span style={{ color: '#888', fontSize: '10px' }}>24H: </span>
                  <span style={{ 
                    color: tradingData.dailyPnl > 0 ? '#00ff00' : '#ff3333',
                    fontSize: '11px'
                  }}>
                    {tradingData.dailyPnl > 0 ? '+' : ''}${formatNumber(Math.abs(tradingData.dailyPnl))} 
                    ({tradingData.dailyPnlPercent > 0 ? '+' : ''}{tradingData.dailyPnlPercent}%)
                  </span>
                </div>
              </div>

              {/* Metrics Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                marginBottom: '12px'
              }}>
                <div style={{ padding: '8px', background: 'rgba(0, 255, 0, 0.05)', borderRadius: '4px' }}>
                  <div style={{ color: '#888', fontSize: '9px' }}>STAKERS</div>
                  <div style={{ color: '#00ff00', fontSize: '13px', fontWeight: 'bold' }}>
                    {tradingData.stakersCount}
                  </div>
                </div>
                <div style={{ padding: '8px', background: 'rgba(0, 255, 0, 0.05)', borderRadius: '4px' }}>
                  <div style={{ color: '#888', fontSize: '9px' }}>TVL</div>
                  <div style={{ color: '#00ff00', fontSize: '13px', fontWeight: 'bold' }}>
                    ${formatNumber(tradingData.tvl)}
                  </div>
                </div>
                <div style={{ padding: '8px', background: 'rgba(0, 255, 0, 0.05)', borderRadius: '4px' }}>
                  <div style={{ color: '#888', fontSize: '9px' }}>APY</div>
                  <div style={{ color: '#00ff00', fontSize: '13px', fontWeight: 'bold' }}>
                    {tradingData.apy}%
                  </div>
                </div>
                <div style={{ padding: '8px', background: 'rgba(0, 255, 0, 0.05)', borderRadius: '4px' }}>
                  <div style={{ color: '#888', fontSize: '9px' }}>PERF. SCORE</div>
                  <div style={{ color: '#00ff00', fontSize: '13px', fontWeight: 'bold' }}>
                    {tradingData.performanceScore}/10
                  </div>
                </div>
              </div>

              {/* Performance */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '8px',
                background: 'rgba(0, 255, 0, 0.1)',
                borderRadius: '5px',
                marginBottom: '10px'
              }}>
                <div>
                  <div style={{ color: '#888', fontSize: '9px' }}>WIN STREAK</div>
                  <div style={{ color: '#ffdd00', fontSize: '14px', fontWeight: 'bold' }}>
                    {tradingData.winStreak}🔥
                  </div>
                </div>
                <div>
                  <div style={{ color: '#888', fontSize: '9px' }}>PROFIT MULT.</div>
                  <div style={{ color: '#00ff00', fontSize: '14px', fontWeight: 'bold' }}>
                    {tradingData.profitMultiplier}x
                  </div>
                </div>
              </div>

              {/* Next Analysis */}
              <div style={{
                textAlign: 'center',
                padding: '6px',
                background: 'rgba(0, 255, 0, 0.1)',
                borderRadius: '5px',
                border: '1px solid rgba(0, 255, 0, 0.3)'
              }}>
                <div style={{ color: '#888', fontSize: '9px', marginBottom: '2px' }}>
                  NEXT ANALYSIS
                </div>
                <div style={{ color: '#00ff00', fontSize: '14px', fontWeight: 'bold', fontFamily: 'monospace' }}>
                  {tradingData.nextAnalysis}
                </div>
              </div>
            </>
          )}

          {/* Macro Tab */}
          {activeTab === 'macro' && (
            <>
              <div style={{
                marginBottom: '10px',
                paddingBottom: '6px',
                borderBottom: '1px solid rgba(0, 255, 0, 0.3)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ color: '#00ff00', fontWeight: 'bold', fontSize: '12px' }}>
                  🌍 MACRO ANALYSIS
                </div>
                <div style={{
                  padding: '3px 8px',
                  background: tradingData.macroData.marketRegime === 'RISK_ON' ? 'rgba(0, 255, 0, 0.2)' :
                            tradingData.macroData.marketRegime === 'RISK_OFF' ? 'rgba(255, 0, 0, 0.2)' :
                            'rgba(255, 255, 0, 0.2)',
                  color: tradingData.macroData.marketRegime === 'RISK_ON' ? '#00ff00' :
                        tradingData.macroData.marketRegime === 'RISK_OFF' ? '#ff3333' :
                        '#ffdd00',
                  borderRadius: '3px',
                  fontSize: '10px',
                  fontWeight: 'bold'
                }}>
                  {tradingData.macroData.marketRegime}
                </div>
              </div>

              {/* Risk Score */}
              <div style={{
                marginBottom: '12px',
                padding: '8px',
                background: 'rgba(0, 255, 0, 0.05)',
                borderRadius: '5px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span style={{ color: '#888', fontSize: '10px' }}>MARKET RISK SCORE</span>
                  <span style={{ 
                    color: tradingData.macroData.riskScore > 70 ? '#00ff00' :
                          tradingData.macroData.riskScore > 30 ? '#ffdd00' : '#ff3333',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    {tradingData.macroData.riskScore}/100
                  </span>
                </div>
                <div style={{
                  height: '6px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '3px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${tradingData.macroData.riskScore}%`,
                    height: '100%',
                    background: `linear-gradient(90deg, #ff3333 0%, #ffdd00 50%, #00ff00 100%)`,
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>

              {/* Traditional Macro Grid */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ color: '#888', fontSize: '10px', marginBottom: '6px' }}>TRADITIONAL MACRO</div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '6px'
                }}>
                  <div style={{ padding: '6px', background: 'rgba(0, 255, 0, 0.05)', borderRadius: '3px' }}>
                    <div style={{ color: '#888', fontSize: '9px' }}>FED RATE</div>
                    <div style={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}>
                      {tradingData.macroData.fedRate}%
                      <span style={{
                        color: tradingData.macroData.fedRateChange < 0 ? '#00ff00' : '#ff3333',
                        fontSize: '10px',
                        marginLeft: '4px'
                      }}>
                        {tradingData.macroData.fedRateChange > 0 ? '+' : ''}{tradingData.macroData.fedRateChange}
                      </span>
                    </div>
                  </div>
                  <div style={{ padding: '6px', background: 'rgba(0, 255, 0, 0.05)', borderRadius: '3px' }}>
                    <div style={{ color: '#888', fontSize: '9px' }}>DXY</div>
                    <div style={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}>
                      {tradingData.macroData.dxy}
                      <span style={{
                        color: tradingData.macroData.dxyChange < 0 ? '#00ff00' : '#ff3333',
                        fontSize: '10px',
                        marginLeft: '4px'
                      }}>
                        {tradingData.macroData.dxyChange > 0 ? '+' : ''}{tradingData.macroData.dxyChange}%
                      </span>
                    </div>
                  </div>
                  <div style={{ padding: '6px', background: 'rgba(0, 255, 0, 0.05)', borderRadius: '3px' }}>
                    <div style={{ color: '#888', fontSize: '9px' }}>VIX</div>
                    <div style={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}>
                      {tradingData.macroData.vix}
                      <span style={{
                        color: tradingData.macroData.vixChange < 0 ? '#00ff00' : '#ff3333',
                        fontSize: '10px',
                        marginLeft: '4px'
                      }}>
                        {tradingData.macroData.vixChange > 0 ? '+' : ''}{tradingData.macroData.vixChange}
                      </span>
                    </div>
                  </div>
                  <div style={{ padding: '6px', background: 'rgba(0, 255, 0, 0.05)', borderRadius: '3px' }}>
                    <div style={{ color: '#888', fontSize: '9px' }}>CPI</div>
                    <div style={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}>
                      {tradingData.macroData.cpi}%
                      <span style={{
                        color: tradingData.macroData.cpi < tradingData.macroData.cpiPrev ? '#00ff00' : '#ff3333',
                        fontSize: '10px',
                        marginLeft: '4px'
                      }}>
                        ↓
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Crypto Macro */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ color: '#888', fontSize: '10px', marginBottom: '6px' }}>CRYPTO METRICS</div>
                <div style={{
                  padding: '8px',
                  background: 'rgba(0, 255, 0, 0.05)',
                  borderRadius: '5px'
                }}>
                  {/* Fear & Greed */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ color: '#888', fontSize: '10px' }}>Fear & Greed</span>
                    <span style={{
                      color: tradingData.macroData.fearGreed > 70 ? '#00ff00' :
                            tradingData.macroData.fearGreed > 30 ? '#ffdd00' : '#ff3333',
                      fontWeight: 'bold',
                      fontSize: '11px'
                    }}>
                      {tradingData.macroData.fearGreed} - {tradingData.macroData.fearGreedText}
                    </span>
                  </div>
                  
                  {/* BTC Dominance */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ color: '#888', fontSize: '10px' }}>BTC Dominance</span>
                    <span style={{ color: '#fff', fontSize: '11px' }}>
                      {tradingData.macroData.btcDominance}%
                      <span style={{
                        color: tradingData.macroData.btcDomChange > 0 ? '#ffdd00' : '#00ff00',
                        fontSize: '10px',
                        marginLeft: '4px'
                      }}>
                        {tradingData.macroData.btcDomChange > 0 ? '+' : ''}{tradingData.macroData.btcDomChange}%
                      </span>
                    </span>
                  </div>

                  {/* Stablecoin Flows */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ color: '#888', fontSize: '10px' }}>Stable Flows 24h</span>
                    <span style={{
                      color: tradingData.macroData.stableFlowDirection === 'IN' ? '#00ff00' : '#ff3333',
                      fontSize: '11px',
                      fontWeight: 'bold'
                    }}>
                      {tradingData.macroData.stableFlowDirection === 'IN' ? '+' : '-'}${tradingData.macroData.stableFlow}B
                    </span>
                  </div>

                  {/* Funding Rate */}
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#888', fontSize: '10px' }}>Funding Rate</span>
                    <span style={{
                      color: Math.abs(tradingData.macroData.fundingRate) > 0.01 ? '#ffdd00' : '#00ff00',
                      fontSize: '11px'
                    }}>
                      {(tradingData.macroData.fundingRate * 100).toFixed(3)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* AI Signals */}
              <div style={{
                padding: '8px',
                background: 'linear-gradient(90deg, rgba(0, 255, 0, 0.1) 0%, transparent 100%)',
                borderRadius: '5px'
              }}>
                <div style={{ color: '#888', fontSize: '10px', marginBottom: '6px' }}>AI SIGNALS</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {tradingData.macroData.signals.map((signal, idx) => (
                    <span key={idx} style={{
                      padding: '3px 6px',
                      background: 'rgba(0, 255, 0, 0.2)',
                      border: '1px solid rgba(0, 255, 0, 0.4)',
                      borderRadius: '3px',
                      color: '#00ff00',
                      fontSize: '9px'
                    }}>
                      {signal}
                    </span>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Positions Tab */}
          {activeTab === 'positions' && (
            <>
              <div style={{
                marginBottom: '10px',
                paddingBottom: '6px',
                borderBottom: '1px solid rgba(0, 255, 0, 0.3)',
                color: '#00ff00',
                fontWeight: 'bold',
                fontSize: '12px'
              }}>
                ⚡ ACTIVE POSITIONS ({tradingData.activePositions.length})
              </div>
              
              {tradingData.activePositions.map((pos, idx) => (
                <div key={idx} style={{
                  padding: '8px',
                  marginBottom: '8px',
                  background: pos.pnl > 0 ? 'rgba(0, 255, 0, 0.05)' : 'rgba(255, 0, 0, 0.05)',
                  border: `1px solid ${pos.pnl > 0 ? 'rgba(0, 255, 0, 0.3)' : 'rgba(255, 0, 0, 0.3)'}`,
                  borderRadius: '5px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <div style={{ color: '#00ff00', fontWeight: 'bold', fontSize: '11px' }}>
                      {pos.symbol}
                    </div>
                    <div style={{
                      padding: '2px 5px',
                      background: pos.side === 'LONG' ? 'rgba(0, 255, 0, 0.2)' : 'rgba(255, 0, 0, 0.2)',
                      color: pos.side === 'LONG' ? '#00ff00' : '#ff3333',
                      borderRadius: '3px',
                      fontSize: '9px',
                      fontWeight: 'bold'
                    }}>
                      {pos.side}
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '10px' }}>
                    <div>
                      <span style={{ color: '#888' }}>Entry: </span>
                      <span style={{ color: '#fff' }}>${pos.entry.toFixed(2)}</span>
                    </div>
                    <div>
                      <span style={{ color: '#888' }}>Current: </span>
                      <span style={{ color: '#fff' }}>${pos.current.toFixed(2)}</span>
                    </div>
                    <div>
                      <span style={{ color: '#888' }}>Size: </span>
                      <span style={{ color: '#fff' }}>{pos.size}</span>
                    </div>
                    <div>
                      <span style={{ color: '#888' }}>P&L: </span>
                      <span style={{ 
                        color: pos.pnl > 0 ? '#00ff00' : '#ff3333',
                        fontWeight: 'bold'
                      }}>
                        {pos.pnl > 0 ? '+' : ''}${pos.pnl.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}

          {/* Trades Tab */}
          {activeTab === 'trades' && (
            <>
              <div style={{
                marginBottom: '10px',
                paddingBottom: '6px',
                borderBottom: '1px solid rgba(0, 255, 0, 0.3)',
                color: '#00ff00',
                fontWeight: 'bold',
                fontSize: '12px'
              }}>
                📜 COMPLETED TRADES
              </div>
              
              {tradingData.recentTrades.map((trade, idx) => (
                <div key={idx} style={{
                  padding: '6px',
                  marginBottom: '6px',
                  background: trade.status === 'exceptional' ? 'rgba(255, 215, 0, 0.05)' : 
                            trade.status === 'profit' ? 'rgba(0, 255, 0, 0.05)' : 'rgba(255, 0, 0, 0.05)',
                  borderLeft: `3px solid ${
                    trade.status === 'exceptional' ? '#ffd700' : 
                    trade.status === 'profit' ? '#00ff00' : '#ff3333'
                  }`,
                  borderRadius: '3px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <span style={{ color: '#888', fontSize: '9px' }}>{trade.time}</span>
                      <span style={{ color: '#00ff00', fontWeight: 'bold', fontSize: '10px' }}>{trade.symbol}</span>
                      <span style={{
                        color: trade.side === 'BUY' ? '#00ff00' : '#ff3333',
                        fontSize: '9px',
                        fontWeight: 'bold'
                      }}>
                        {trade.side}
                      </span>
                    </div>
                    <span style={{ 
                      color: trade.status === 'exceptional' ? '#ffd700' : 
                            trade.status === 'profit' ? '#00ff00' : '#ff3333',
                      fontWeight: 'bold',
                      fontSize: '10px'
                    }}>
                      {trade.pnl} {trade.status === 'exceptional' ? '✨' : ''}
                    </span>
                  </div>
                  <div style={{ fontSize: '9px', color: '#888' }}>
                    {trade.amount} @ ${trade.price}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </>
    );
  }

  // Desktop view - original layout
  return (
    <>
      {/* Main Trading Stats Panel - Left Side */}
      <div style={{
        position: 'fixed',
        top: '120px',
        left: '20px',
        background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(0, 20, 0, 0.9) 100%)',
        border: '1px solid #00ff00',
        borderRadius: '8px',
        padding: '15px',
        fontFamily: 'monospace',
        fontSize: '13px',
        zIndex: 9999,
        minWidth: '280px',
        boxShadow: '0 0 20px rgba(0, 255, 0, 0.3), inset 0 0 20px rgba(0, 255, 0, 0.05)',
        backdropFilter: 'blur(10px)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '15px',
          paddingBottom: '10px',
          borderBottom: '1px solid rgba(0, 255, 0, 0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '8px',
              height: '8px',
              background: '#00ff00',
              borderRadius: '50%',
              animation: 'pulse 2s infinite',
              boxShadow: '0 0 10px #00ff00'
            }} />
            <div style={{ color: '#00ff00', fontWeight: 'bold', fontSize: '14px' }}>
              ⚡ CYBORG TRADING FUND ⚡
            </div>
          </div>
          <div style={{ color: '#00ff00', fontSize: '11px', opacity: 0.8 }}>
            LIVE
          </div>
        </div>

        {/* Fund Stats */}
        <div style={{ marginBottom: '15px' }}>
          <div style={{ color: '#00ff00', fontSize: '11px', opacity: 0.7, marginBottom: '5px' }}>
            FUND BALANCE
          </div>
          <div style={{ 
            fontSize: '24px', 
            fontWeight: 'bold',
            color: '#00ff00',
            textShadow: '0 0 10px rgba(0, 255, 0, 0.5)',
            marginBottom: '5px'
          }}>
            ${formatNumber(tradingData.fundBalance)}
          </div>
          <div style={{ display: 'flex', gap: '15px' }}>
            <div>
              <span style={{ color: '#888', fontSize: '10px' }}>24H: </span>
              <span style={{ 
                color: tradingData.dailyPnl > 0 ? '#00ff00' : '#ff3333',
                fontSize: '12px'
              }}>
                {tradingData.dailyPnl > 0 ? '+' : ''}${formatNumber(Math.abs(tradingData.dailyPnl))} 
                ({tradingData.dailyPnlPercent > 0 ? '+' : ''}{tradingData.dailyPnlPercent}%)
              </span>
            </div>
          </div>
        </div>

        {/* Staking Info */}
        <div style={{
          background: 'rgba(0, 255, 0, 0.05)',
          padding: '10px',
          borderRadius: '5px',
          marginBottom: '15px',
          border: '1px solid rgba(0, 255, 0, 0.2)'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <div style={{ color: '#888', fontSize: '10px' }}>STAKERS</div>
              <div style={{ color: '#00ff00', fontSize: '14px', fontWeight: 'bold' }}>
                {tradingData.stakersCount}
              </div>
            </div>
            <div>
              <div style={{ color: '#888', fontSize: '10px' }}>TVL</div>
              <div style={{ color: '#00ff00', fontSize: '14px', fontWeight: 'bold' }}>
                ${formatNumber(tradingData.tvl)}
              </div>
            </div>
            <div>
              <div style={{ color: '#888', fontSize: '10px' }}>APY</div>
              <div style={{ color: '#00ff00', fontSize: '14px', fontWeight: 'bold' }}>
                {tradingData.apy}%
              </div>
            </div>
            <div>
              <div style={{ color: '#888', fontSize: '10px' }}>PERF. SCORE</div>
              <div style={{ color: '#00ff00', fontSize: '14px', fontWeight: 'bold' }}>
                {tradingData.performanceScore}/10
              </div>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: '10px',
          background: 'linear-gradient(90deg, rgba(0, 255, 0, 0.1) 0%, transparent 100%)',
          borderRadius: '5px',
          marginBottom: '10px'
        }}>
          <div>
            <div style={{ color: '#888', fontSize: '10px' }}>WIN STREAK</div>
            <div style={{ color: '#ffdd00', fontSize: '16px', fontWeight: 'bold' }}>
              {tradingData.winStreak}🔥
            </div>
          </div>
          <div>
            <div style={{ color: '#888', fontSize: '10px' }}>PROFIT MULT.</div>
            <div style={{ color: '#00ff00', fontSize: '16px', fontWeight: 'bold' }}>
              {tradingData.profitMultiplier}x
            </div>
          </div>
        </div>

        {/* Next Analysis Timer */}
        <div style={{
          textAlign: 'center',
          padding: '8px',
          background: 'rgba(0, 255, 0, 0.1)',
          borderRadius: '5px',
          border: '1px solid rgba(0, 255, 0, 0.3)'
        }}>
          <div style={{ color: '#888', fontSize: '10px', marginBottom: '3px' }}>
            NEXT ANALYSIS
          </div>
          <div style={{ color: '#00ff00', fontSize: '16px', fontWeight: 'bold', fontFamily: 'monospace' }}>
            {tradingData.nextAnalysis}
          </div>
        </div>
      </div>

      {/* Active Positions Panel - Bottom Left */}
      <div style={{
        position: 'fixed',
        bottom: '20px',
        left: '20px',
        background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(0, 20, 0, 0.9) 100%)',
        border: '1px solid #00ff00',
        borderRadius: '8px',
        padding: '15px',
        fontFamily: 'monospace',
        fontSize: '12px',
        zIndex: 9999,
        minWidth: '320px',
        maxHeight: '250px',
        boxShadow: '0 0 20px rgba(0, 255, 0, 0.3)',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{
          marginBottom: '10px',
          paddingBottom: '8px',
          borderBottom: '1px solid rgba(0, 255, 0, 0.3)',
          color: '#00ff00',
          fontWeight: 'bold',
          fontSize: '13px'
        }}>
          ⚡ ACTIVE POSITIONS ({tradingData.activePositions.length})
        </div>
        
        <div style={{ overflowY: 'auto', maxHeight: '180px' }}>
          {tradingData.activePositions.map((pos, idx) => (
            <div key={idx} style={{
              padding: '8px',
              marginBottom: '8px',
              background: pos.pnl > 0 ? 'rgba(0, 255, 0, 0.05)' : 'rgba(255, 0, 0, 0.05)',
              border: `1px solid ${pos.pnl > 0 ? 'rgba(0, 255, 0, 0.3)' : 'rgba(255, 0, 0, 0.3)'}`,
              borderRadius: '5px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <div style={{ color: '#00ff00', fontWeight: 'bold' }}>
                  {pos.symbol}
                </div>
                <div style={{
                  padding: '2px 6px',
                  background: pos.side === 'LONG' ? 'rgba(0, 255, 0, 0.2)' : 'rgba(255, 0, 0, 0.2)',
                  color: pos.side === 'LONG' ? '#00ff00' : '#ff3333',
                  borderRadius: '3px',
                  fontSize: '10px',
                  fontWeight: 'bold'
                }}>
                  {pos.side}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '11px' }}>
                <div>
                  <span style={{ color: '#888' }}>Entry: </span>
                  <span style={{ color: '#fff' }}>${pos.entry.toFixed(2)}</span>
                </div>
                <div>
                  <span style={{ color: '#888' }}>Current: </span>
                  <span style={{ color: '#fff' }}>${pos.current.toFixed(2)}</span>
                </div>
                <div>
                  <span style={{ color: '#888' }}>Size: </span>
                  <span style={{ color: '#fff' }}>{pos.size}</span>
                </div>
                <div>
                  <span style={{ color: '#888' }}>P&L: </span>
                  <span style={{ 
                    color: pos.pnl > 0 ? '#00ff00' : '#ff3333',
                    fontWeight: 'bold'
                  }}>
                    {pos.pnl > 0 ? '+' : ''}${pos.pnl.toFixed(2)} ({pos.pnlPercent}%)
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Trades Panel - Bottom Right */}
      <div style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(0, 20, 0, 0.9) 100%)',
        border: '1px solid #00ff00',
        borderRadius: '8px',
        padding: '15px',
        fontFamily: 'monospace',
        fontSize: '12px',
        zIndex: 9999,
        minWidth: '280px',
        maxHeight: '250px',
        boxShadow: '0 0 20px rgba(0, 255, 0, 0.3)',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{
          marginBottom: '10px',
          paddingBottom: '8px',
          borderBottom: '1px solid rgba(0, 255, 0, 0.3)',
          color: '#00ff00',
          fontWeight: 'bold',
          fontSize: '13px'
        }}>
          📜 COMPLETED TRADES
        </div>
        
        <div style={{ overflowY: 'auto', maxHeight: '180px' }}>
          {tradingData.recentTrades.map((trade, idx) => (
            <div key={idx} style={{
              padding: '6px',
              marginBottom: '6px',
              background: trade.status === 'exceptional' ? 'rgba(255, 215, 0, 0.05)' : 
                        trade.status === 'profit' ? 'rgba(0, 255, 0, 0.05)' : 'rgba(255, 0, 0, 0.05)',
              borderLeft: `3px solid ${
                trade.status === 'exceptional' ? '#ffd700' : 
                trade.status === 'profit' ? '#00ff00' : '#ff3333'
              }`,
              borderRadius: '3px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{ color: '#888', fontSize: '10px' }}>{trade.time}</span>
                  <span style={{ color: '#00ff00', fontWeight: 'bold' }}>{trade.symbol}</span>
                  <span style={{
                    color: trade.side === 'BUY' ? '#00ff00' : '#ff3333',
                    fontSize: '10px',
                    fontWeight: 'bold'
                  }}>
                    {trade.side}
                  </span>
                </div>
                <span style={{ 
                  color: trade.status === 'exceptional' ? '#ffd700' : 
                        trade.status === 'profit' ? '#00ff00' : '#ff3333',
                  fontWeight: 'bold'
                }}>
                  {trade.pnl} {trade.status === 'exceptional' ? '✨' : ''}
                </span>
              </div>
              <div style={{ fontSize: '10px', color: '#888' }}>
                {trade.amount} @ ${trade.price}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Macro Analysis Panel - Top Right */}
      <div style={{
        position: 'fixed',
        top: '120px',
        right: '20px',
        background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(0, 20, 0, 0.9) 100%)',
        border: '1px solid #00ff00',
        borderRadius: '8px',
        padding: '15px',
        fontFamily: 'monospace',
        fontSize: '12px',
        zIndex: 9999,
        minWidth: '320px',
        maxWidth: '320px',
        boxShadow: '0 0 20px rgba(0, 255, 0, 0.3)',
        backdropFilter: 'blur(10px)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
          paddingBottom: '8px',
          borderBottom: '1px solid rgba(0, 255, 0, 0.3)'
        }}>
          <div style={{ color: '#00ff00', fontWeight: 'bold', fontSize: '13px' }}>
            🌍 MACRO ANALYSIS
          </div>
          <div style={{
            padding: '4px 10px',
            background: tradingData.macroData.marketRegime === 'RISK_ON' ? 'rgba(0, 255, 0, 0.2)' :
                      tradingData.macroData.marketRegime === 'RISK_OFF' ? 'rgba(255, 0, 0, 0.2)' :
                      'rgba(255, 255, 0, 0.2)',
            color: tradingData.macroData.marketRegime === 'RISK_ON' ? '#00ff00' :
                  tradingData.macroData.marketRegime === 'RISK_OFF' ? '#ff3333' :
                  '#ffdd00',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: 'bold'
          }}>
            {tradingData.macroData.marketRegime}
          </div>
        </div>

        {/* Risk Score Bar */}
        <div style={{ marginBottom: '15px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
            <span style={{ color: '#888', fontSize: '11px' }}>MARKET RISK APPETITE</span>
            <span style={{ 
              color: tradingData.macroData.riskScore > 70 ? '#00ff00' :
                    tradingData.macroData.riskScore > 30 ? '#ffdd00' : '#ff3333',
              fontSize: '12px',
              fontWeight: 'bold'
            }}>
              {tradingData.macroData.riskScore}/100
            </span>
          </div>
          <div style={{
            height: '8px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${tradingData.macroData.riskScore}%`,
              height: '100%',
              background: `linear-gradient(90deg, #ff3333 0%, #ffdd00 50%, #00ff00 100%)`,
              transition: 'width 0.5s ease'
            }} />
          </div>
        </div>

        {/* Two Column Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
          {/* Fed & Traditional */}
          <div style={{ padding: '8px', background: 'rgba(0, 255, 0, 0.05)', borderRadius: '5px' }}>
            <div style={{ color: '#00ff00', fontSize: '10px', marginBottom: '6px', fontWeight: 'bold' }}>
              TRADITIONAL
            </div>
            <div style={{ fontSize: '11px' }}>
              <div style={{ marginBottom: '4px' }}>
                <span style={{ color: '#888' }}>FED: </span>
                <span style={{ color: '#fff' }}>{tradingData.macroData.fedRate}%</span>
                <span style={{
                  color: tradingData.macroData.fedRateChange < 0 ? '#00ff00' : '#ff3333',
                  marginLeft: '4px'
                }}>
                  ({tradingData.macroData.fedRateChange > 0 ? '+' : ''}{tradingData.macroData.fedRateChange})
                </span>
              </div>
              <div style={{ marginBottom: '4px' }}>
                <span style={{ color: '#888' }}>DXY: </span>
                <span style={{ color: '#fff' }}>{tradingData.macroData.dxy}</span>
                <span style={{
                  color: tradingData.macroData.dxyChange < 0 ? '#00ff00' : '#ff3333',
                  marginLeft: '4px',
                  fontSize: '10px'
                }}>
                  {tradingData.macroData.dxyChange > 0 ? '↑' : '↓'}
                </span>
              </div>
              <div>
                <span style={{ color: '#888' }}>VIX: </span>
                <span style={{ 
                  color: tradingData.macroData.vix < 20 ? '#00ff00' : 
                        tradingData.macroData.vix < 30 ? '#ffdd00' : '#ff3333'
                }}>
                  {tradingData.macroData.vix}
                </span>
              </div>
            </div>
          </div>

          {/* Crypto Metrics */}
          <div style={{ padding: '8px', background: 'rgba(0, 255, 0, 0.05)', borderRadius: '5px' }}>
            <div style={{ color: '#00ff00', fontSize: '10px', marginBottom: '6px', fontWeight: 'bold' }}>
              CRYPTO
            </div>
            <div style={{ fontSize: '11px' }}>
              <div style={{ marginBottom: '4px' }}>
                <span style={{ color: '#888' }}>F&G: </span>
                <span style={{
                  color: tradingData.macroData.fearGreed > 70 ? '#00ff00' :
                        tradingData.macroData.fearGreed > 30 ? '#ffdd00' : '#ff3333'
                }}>
                  {tradingData.macroData.fearGreed} {tradingData.macroData.fearGreedText}
                </span>
              </div>
              <div style={{ marginBottom: '4px' }}>
                <span style={{ color: '#888' }}>BTC.D: </span>
                <span style={{ color: '#fff' }}>{tradingData.macroData.btcDominance}%</span>
              </div>
              <div>
                <span style={{ color: '#888' }}>Funding: </span>
                <span style={{
                  color: Math.abs(tradingData.macroData.fundingRate) > 0.01 ? '#ffdd00' : '#00ff00'
                }}>
                  {(tradingData.macroData.fundingRate * 100).toFixed(3)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stablecoin Flows */}
        <div style={{
          padding: '8px',
          background: tradingData.macroData.stableFlowDirection === 'IN' ? 
                     'rgba(0, 255, 0, 0.05)' : 'rgba(255, 0, 0, 0.05)',
          borderRadius: '5px',
          marginBottom: '12px',
          border: `1px solid ${tradingData.macroData.stableFlowDirection === 'IN' ? 
                              'rgba(0, 255, 0, 0.3)' : 'rgba(255, 0, 0, 0.3)'}`
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ color: '#888', fontSize: '10px' }}>STABLECOIN FLOWS (24H)</div>
              <div style={{
                color: tradingData.macroData.stableFlowDirection === 'IN' ? '#00ff00' : '#ff3333',
                fontSize: '16px',
                fontWeight: 'bold'
              }}>
                {tradingData.macroData.stableFlowDirection === 'IN' ? '+' : '-'}${tradingData.macroData.stableFlow}B
              </div>
            </div>
            <div style={{
              fontSize: '24px',
              color: tradingData.macroData.stableFlowDirection === 'IN' ? '#00ff00' : '#ff3333'
            }}>
              {tradingData.macroData.stableFlowDirection === 'IN' ? '↗' : '↘'}
            </div>
          </div>
        </div>

        {/* AI Signals */}
        <div style={{
          padding: '10px',
          background: 'linear-gradient(135deg, rgba(0, 255, 0, 0.1) 0%, transparent 100%)',
          borderRadius: '5px',
          border: '1px solid rgba(0, 255, 0, 0.2)'
        }}>
          <div style={{ color: '#00ff00', fontSize: '11px', marginBottom: '8px', fontWeight: 'bold' }}>
            🤖 AI MARKET SIGNALS
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
            {tradingData.macroData.signals.map((signal, idx) => (
              <span key={idx} style={{
                padding: '4px 8px',
                background: 'rgba(0, 255, 0, 0.2)',
                border: '1px solid rgba(0, 255, 0, 0.4)',
                borderRadius: '4px',
                color: '#00ff00',
                fontSize: '10px',
                display: 'inline-flex',
                alignItems: 'center'
              }}>
                <span style={{ marginRight: '4px' }}>•</span>
                {signal}
              </span>
            ))}
          </div>
          <div style={{
            marginTop: '8px',
            padding: '6px',
            background: 'rgba(0, 0, 0, 0.5)',
            borderRadius: '3px',
            fontSize: '10px',
            color: '#888',
            textAlign: 'center'
          }}>
            Risk Multiplier: <span style={{ color: '#00ff00', fontWeight: 'bold' }}>
              {tradingData.macroData.riskMultiplier}x
            </span>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </>
  );
};

export default TradingOverlay;