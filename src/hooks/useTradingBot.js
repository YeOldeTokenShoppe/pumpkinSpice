// React Hook for Trading Bot Connection
import { useState, useEffect, useCallback } from 'react';
import tradingBotService from '@/services/tradingBotService';

export function useTradingBot() {
  const [isConnected, setIsConnected] = useState(false);
  const [tradingMode, setTradingMode] = useState('DEMO'); // 'DEMO', 'PAPER', 'LIVE'
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
    activePositions: [],
    recentTrades: [],
    nextAnalysis: '00:42:17',
    winStreak: 13,
    profitMultiplier: 1.77,
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
      cpi: 3.1,
      cpiPrev: 3.4,
      treasury10Y: 4.25,
      btcDominance: 52.3,
      btcDomChange: 1.2,
      fearGreed: 72,
      fearGreedText: 'Greed',
      stableMcap: 140.2,
      stableFlow: 2.8,
      stableFlowDirection: 'IN',
      totalCryptoMcap: 2.68,
      defiTVL: 68.5,
      fundingRate: 0.012,
      openInterest: 18.7,
      exchangeReserves: -2.3,
      riskMultiplier: 1.2,
      signals: ['Fed Dovish', 'DXY Weak', 'Stables Flowing In']
    }
  });

  // Handle bot updates
  const handleBotUpdate = useCallback((type, data) => {
    switch (type) {
      case 'connected':
        setIsConnected(true);
        console.log('Trading bot connected');
        // Determine trading mode from bot status
        if (data.status) {
          if (!data.status.trading_enabled) {
            setTradingMode('DEMO');
          } else if (data.status.paper_trading) {
            setTradingMode('PAPER');
          } else {
            setTradingMode('LIVE');
          }
        }
        break;
        
      case 'disconnected':
        setIsConnected(false);
        setTradingMode('DEMO');
        console.log('Trading bot disconnected');
        break;
        
      case 'update':
        // Merge new data with existing data
        setTradingData(prevData => ({
          ...prevData,
          ...data,
          macroData: {
            ...prevData.macroData,
            ...data.macroData
          }
        }));
        break;
        
      case 'macro_update':
        // Update just macro data
        setTradingData(prevData => ({
          ...prevData,
          macroData: {
            ...prevData.macroData,
            ...data
          }
        }));
        break;
        
      case 'trade':
        // Handle trade notifications
        console.log('Trade executed:', data);
        break;
        
      case 'error':
        console.error('Trading bot error:', data.error);
        break;
        
      default:
        console.log('Unknown bot event:', type, data);
    }
  }, []);

  // Connect to bot on mount
  useEffect(() => {
    // Subscribe to bot updates
    const unsubscribe = tradingBotService.subscribe(handleBotUpdate);
    
    // Connect to bot
    tradingBotService.connect();
    
    // Cleanup on unmount
    return () => {
      unsubscribe();
      // Don't disconnect here - let service manage connection
    };
  }, [handleBotUpdate]);

  // Expose control functions
  const startTrading = useCallback(() => {
    tradingBotService.startTrading();
  }, []);

  const stopTrading = useCallback(() => {
    tradingBotService.stopTrading();
  }, []);

  const closePosition = useCallback((symbol) => {
    tradingBotService.closePosition(symbol);
  }, []);

  const updateSettings = useCallback((settings) => {
    tradingBotService.updateSettings(settings);
  }, []);

  const changeTradingMode = useCallback((newMode) => {
    console.log('UI Mode changed to:', newMode);
    
    // Always update UI state - this is just for display
    setTradingMode(newMode);
    
    // Note: This is just UI state!
    // Actual trading mode is controlled by the Python bot's .env settings
    // TRADING_ENABLED and PAPER_TRADING in the bot determine real behavior
    
    if (!isConnected && newMode !== 'DEMO') {
      console.info(`Bot not connected. When you start the bot, configure it for ${newMode} mode in .env`);
    }
  }, [isConnected]);

  return {
    isConnected,
    tradingMode,
    tradingData,
    startTrading,
    stopTrading,
    closePosition,
    updateSettings,
    changeTradingMode
  };
}