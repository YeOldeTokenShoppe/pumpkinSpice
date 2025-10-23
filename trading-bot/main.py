#!/usr/bin/env python3
"""
Cyborg Trading Bot - Our Lady of Perpetual Profit
Main entry point for the trading bot
"""

import asyncio
import os
import sys
from dotenv import load_dotenv
from loguru import logger
from datetime import datetime

# Load environment variables
load_dotenv()

# Configure logging
logger.remove()
logger.add(sys.stderr, level="INFO")
logger.add("logs/trading_{time}.log", rotation="1 day", retention="30 days", level="DEBUG")

from src.bot import TradingBot
from src.server import WebSocketServer

async def main():
    """Main entry point for the trading bot"""
    
    logger.info("🚀 Starting Cyborg Trading Bot...")
    logger.info(f"Trading Mode: {'LIVE' if os.getenv('TRADING_ENABLED') == 'true' else 'PAPER'}")
    
    try:
        # Initialize the trading bot
        bot = TradingBot(
            trading_enabled=os.getenv('TRADING_ENABLED', 'false').lower() == 'true',
            paper_trading=os.getenv('PAPER_TRADING', 'true').lower() == 'true'
        )
        
        # Initialize WebSocket server for UI updates
        ws_server = WebSocketServer(bot)
        
        # Start WebSocket server in background
        ws_port = int(os.getenv('WEBSOCKET_PORT', 3002))
        asyncio.create_task(ws_server.start(ws_port))
        logger.info(f"WebSocket server started on port {ws_port}")
        
        # Initialize and start the bot
        await bot.initialize()
        await bot.start()
        
        logger.info("✅ Trading bot is running")
        
        # Keep the bot running
        try:
            while True:
                await asyncio.sleep(60)
                # Log heartbeat every minute
                logger.debug(f"Bot heartbeat - Positions: {len(bot.positions)}")
        except KeyboardInterrupt:
            logger.info("Shutting down gracefully...")
            await bot.stop()
            
    except Exception as e:
        logger.error(f"Fatal error: {e}", exc_info=True)
        sys.exit(1)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Bot terminated by user")
    except Exception as e:
        logger.error(f"Unexpected error: {e}", exc_info=True)
        sys.exit(1)