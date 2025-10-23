import { EventEmitter } from 'events';
import { MacroAnalyzer } from '../analyzers/MacroAnalyzer.js';
import { TechnicalAnalyzer } from '../analyzers/TechnicalAnalyzer.js';
import { SentimentAnalyzer } from '../analyzers/SentimentAnalyzer.js';
import { AICouncil } from '../ai/AICouncil.js';
import { HyperliquidClient } from '../exchanges/HyperliquidClient.js';
import { PositionManager } from './PositionManager.js';
import { RiskManager } from './RiskManager.js';
import { DataAggregator } from '../data/DataAggregator.js';
import { logger } from '../utils/logger.js';
import cron from 'node-cron';

export class TradingBot extends EventEmitter {
  constructor(config) {
    super();
    this.config = config;
    this.isRunning = false;
    this.positions = new Map();
    this.performance = {
      totalTrades: 0,
      winRate: 0,
      pnl: 0,
      streak: 0
    };
    
    // Initialize components
    this.exchange = new HyperliquidClient();
    this.dataAggregator = new DataAggregator();
    this.macroAnalyzer = new MacroAnalyzer();
    this.technicalAnalyzer = new TechnicalAnalyzer();
    this.sentimentAnalyzer = new SentimentAnalyzer();
    this.aiCouncil = new AICouncil();
    this.positionManager = new PositionManager(this.exchange);
    this.riskManager = new RiskManager();
  }
  
  async initialize() {
    logger.info('Initializing trading bot components...');
    
    // Connect to exchange
    await this.exchange.connect();
    
    // Initialize data feeds
    await this.dataAggregator.initialize();
    
    // Load existing positions
    await this.loadPositions();
    
    // Set up scheduled tasks
    this.setupScheduledTasks();
    
    logger.info('Trading bot initialized successfully');
  }
  
  async start() {
    if (this.isRunning) {
      logger.warn('Trading bot is already running');
      return;
    }
    
    this.isRunning = true;
    logger.info('Starting trading bot main loop...');
    
    // Main trading loop
    this.tradingInterval = setInterval(async () => {
      await this.executeTradingCycle();
    }, process.env.UPDATE_INTERVAL || 15000);
    
    // Macro update loop
    this.macroInterval = setInterval(async () => {
      await this.updateMacroData();
    }, process.env.MACRO_UPDATE_INTERVAL || 300000);
    
    // Initial updates
    await this.updateMacroData();
    await this.executeTradingCycle();
  }
  
  async executeTradingCycle() {
    try {
      logger.debug('Executing trading cycle...');
      
      // 1. Gather all data
      const marketData = await this.gatherMarketData();
      
      // 2. Analyze current conditions
      const analysis = await this.analyzeMarket(marketData);
      
      // 3. Get AI recommendations
      const signals = await this.getAISignals(analysis);
      
      // 4. Apply risk management
      const validatedSignals = this.riskManager.validateSignals(
        signals,
        this.positions,
        analysis.macro.riskMultiplier
      );
      
      // 5. Execute trades if enabled
      if (this.config.tradingEnabled && validatedSignals.length > 0) {
        await this.executeTrades(validatedSignals);
      }
      
      // 6. Update positions
      await this.updatePositions();
      
      // 7. Emit update event
      this.emit('update', {
        analysis,
        signals: validatedSignals,
        positions: Array.from(this.positions.values()),
        performance: this.performance
      });
      
    } catch (error) {
      logger.error('Trading cycle error:', error);
      this.emit('error', error);
    }
  }
  
  async gatherMarketData() {
    const [prices, orderbook, funding] = await Promise.all([
      this.dataAggregator.getPrices(),
      this.dataAggregator.getOrderbook(),
      this.dataAggregator.getFundingRates()
    ]);
    
    return {
      prices,
      orderbook,
      funding,
      timestamp: Date.now()
    };
  }
  
  async analyzeMarket(marketData) {
    const [macro, technical, sentiment] = await Promise.all([
      this.macroAnalyzer.analyze(),
      this.technicalAnalyzer.analyze(marketData),
      this.sentimentAnalyzer.analyze()
    ]);
    
    return {
      macro,
      technical,
      sentiment,
      marketData
    };
  }
  
  async getAISignals(analysis) {
    // AI Council makes decisions based on all analysis
    const decisions = await this.aiCouncil.deliberate({
      macro: analysis.macro,
      technical: analysis.technical,
      sentiment: analysis.sentiment,
      currentPositions: Array.from(this.positions.values()),
      performance: this.performance
    });
    
    return decisions.signals;
  }
  
  async executeTrades(signals) {
    logger.info(`Executing ${signals.length} trade signals...`);
    
    for (const signal of signals) {
      try {
        if (signal.action === 'OPEN_LONG' || signal.action === 'OPEN_SHORT') {
          await this.openPosition(signal);
        } else if (signal.action === 'CLOSE') {
          await this.closePosition(signal.symbol);
        } else if (signal.action === 'ADJUST') {
          await this.adjustPosition(signal);
        }
      } catch (error) {
        logger.error(`Failed to execute trade for ${signal.symbol}:`, error);
      }
    }
  }
  
  async openPosition(signal) {
    const position = await this.positionManager.openPosition({
      symbol: signal.symbol,
      side: signal.action === 'OPEN_LONG' ? 'LONG' : 'SHORT',
      size: signal.size,
      leverage: signal.leverage || process.env.DEFAULT_LEVERAGE || 2,
      stopLoss: signal.stopLoss,
      takeProfit: signal.takeProfit
    });
    
    this.positions.set(signal.symbol, position);
    logger.info(`Opened ${position.side} position for ${position.symbol}`);
    
    this.emit('trade', {
      type: 'OPEN',
      position
    });
  }
  
  async closePosition(symbol) {
    const position = this.positions.get(symbol);
    if (!position) {
      logger.warn(`No position found for ${symbol}`);
      return;
    }
    
    const result = await this.positionManager.closePosition(position);
    this.positions.delete(symbol);
    
    // Update performance
    this.updatePerformance(result);
    
    logger.info(`Closed position for ${symbol}, PnL: ${result.pnl}`);
    
    this.emit('trade', {
      type: 'CLOSE',
      result
    });
  }
  
  async adjustPosition(signal) {
    const position = this.positions.get(signal.symbol);
    if (!position) {
      logger.warn(`No position found for ${signal.symbol}`);
      return;
    }
    
    await this.positionManager.adjustPosition(position, {
      stopLoss: signal.stopLoss,
      takeProfit: signal.takeProfit,
      size: signal.size
    });
    
    logger.info(`Adjusted position for ${signal.symbol}`);
  }
  
  async updatePositions() {
    // Update current positions with latest prices
    for (const [symbol, position] of this.positions) {
      const currentPrice = await this.dataAggregator.getPrice(symbol);
      position.currentPrice = currentPrice;
      position.pnl = this.calculatePnL(position);
      position.pnlPercent = (position.pnl / position.size) * 100;
    }
  }
  
  calculatePnL(position) {
    const priceChange = position.currentPrice - position.entry;
    const direction = position.side === 'LONG' ? 1 : -1;
    return priceChange * direction * position.size;
  }
  
  updatePerformance(tradeResult) {
    this.performance.totalTrades++;
    this.performance.pnl += tradeResult.pnl;
    
    if (tradeResult.pnl > 0) {
      this.performance.streak++;
    } else {
      this.performance.streak = 0;
    }
    
    // Calculate win rate
    const wins = this.performance.totalTrades * (this.performance.winRate / 100);
    const newWins = tradeResult.pnl > 0 ? wins + 1 : wins;
    this.performance.winRate = (newWins / this.performance.totalTrades) * 100;
  }
  
  async updateMacroData() {
    logger.info('Updating macro economic data...');
    await this.macroAnalyzer.updateData();
    this.emit('macroUpdate', await this.macroAnalyzer.analyze());
  }
  
  setupScheduledTasks() {
    // Daily performance report at midnight
    cron.schedule('0 0 * * *', async () => {
      await this.generateDailyReport();
    });
    
    // Check for stop losses every minute
    cron.schedule('* * * * *', async () => {
      await this.checkStopLosses();
    });
  }
  
  async checkStopLosses() {
    for (const [symbol, position] of this.positions) {
      if (position.pnlPercent <= -5) { // 5% stop loss
        logger.warn(`Stop loss triggered for ${symbol}`);
        await this.closePosition(symbol);
      }
    }
  }
  
  async generateDailyReport() {
    const report = {
      date: new Date().toISOString(),
      performance: this.performance,
      positions: Array.from(this.positions.values()),
      macro: await this.macroAnalyzer.analyze()
    };
    
    logger.info('Daily Report:', report);
    this.emit('dailyReport', report);
  }
  
  async loadPositions() {
    // Load existing positions from database or exchange
    const positions = await this.positionManager.getOpenPositions();
    for (const pos of positions) {
      this.positions.set(pos.symbol, pos);
    }
    logger.info(`Loaded ${positions.length} existing positions`);
  }
  
  async stop() {
    this.isRunning = false;
    
    if (this.tradingInterval) {
      clearInterval(this.tradingInterval);
    }
    
    if (this.macroInterval) {
      clearInterval(this.macroInterval);
    }
    
    await this.exchange.disconnect();
    logger.info('Trading bot stopped');
  }
  
  getStatus() {
    return {
      isRunning: this.isRunning,
      positions: Array.from(this.positions.values()),
      performance: this.performance,
      config: this.config
    };
  }
}