import dotenv from 'dotenv';
import { TradingBot } from './core/TradingBot.js';
import { WebSocketServer } from './server/websocket.js';
import { logger } from './utils/logger.js';

dotenv.config();

async function main() {
  try {
    logger.info('🚀 Starting Cyborg Trading Bot...');
    
    // Initialize the trading bot
    const bot = new TradingBot({
      tradingEnabled: process.env.TRADING_ENABLED === 'true',
      paperTrading: process.env.PAPER_TRADING === 'true'
    });
    
    // Initialize WebSocket server for real-time updates
    const wsServer = new WebSocketServer(bot);
    
    // Start the bot
    await bot.initialize();
    await bot.start();
    
    // Start WebSocket server
    wsServer.start(process.env.WEBSOCKET_PORT || 3002);
    
    logger.info('✅ Trading bot is running');
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
      logger.info('Shutting down gracefully...');
      await bot.stop();
      process.exit(0);
    });
    
  } catch (error) {
    logger.error('Failed to start trading bot:', error);
    process.exit(1);
  }
}

main();