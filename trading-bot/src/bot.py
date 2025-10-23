"""
Main Trading Bot Class
Orchestrates all trading operations
"""

import asyncio
import os
from typing import Dict, List, Optional
from datetime import datetime, timedelta
from loguru import logger

from .exchanges.hyperliquid_client import HyperliquidClient
from .analyzers.macro_analyzer import MacroAnalyzer
from .analyzers.technical_analyzer import TechnicalAnalyzer
from .ai.ai_council import AICouncil
from .risk.risk_manager import RiskManager


class TradingBot:
    def __init__(self, trading_enabled: bool = False, paper_trading: bool = True):
        self.trading_enabled = trading_enabled
        self.paper_trading = paper_trading
        self.is_running = False
        
        # Components
        self.exchange = HyperliquidClient()
        self.macro_analyzer = MacroAnalyzer()
        self.technical_analyzer = TechnicalAnalyzer()
        self.ai_council = AICouncil()
        self.risk_manager = RiskManager()
        
        # State
        self.positions: Dict = {}
        self.performance = {
            'total_trades': 0,
            'win_rate': 0,
            'pnl': 0,
            'streak': 0,
            'daily_pnl': 0
        }
        self.last_update = None
        self.subscribers = []
        
    async def initialize(self):
        """Initialize all bot components"""
        logger.info("Initializing trading bot components...")
        
        try:
            # Connect to exchange
            await self.exchange.connect()
            
            # Load existing positions
            await self.load_positions()
            
            # Initialize analyzers
            await self.macro_analyzer.initialize()
            
            logger.info("Trading bot initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize bot: {e}")
            raise
            
    async def start(self):
        """Start the main trading loop"""
        if self.is_running:
            logger.warning("Bot is already running")
            return
            
        self.is_running = True
        logger.info("Starting trading bot main loop...")
        
        # Create async tasks for different update intervals
        asyncio.create_task(self.trading_loop())
        asyncio.create_task(self.macro_update_loop())
        asyncio.create_task(self.position_monitor_loop())
        
    async def trading_loop(self):
        """Main trading loop - runs every 15 seconds"""
        update_interval = int(os.getenv('UPDATE_INTERVAL', 15))
        
        while self.is_running:
            try:
                await self.execute_trading_cycle()
                await asyncio.sleep(update_interval)
                
            except Exception as e:
                logger.error(f"Trading cycle error: {e}")
                await asyncio.sleep(update_interval)
                
    async def macro_update_loop(self):
        """Update macro data every 5 minutes"""
        update_interval = int(os.getenv('MACRO_UPDATE_INTERVAL', 300))
        
        while self.is_running:
            try:
                macro_data = await self.macro_analyzer.update()
                await self.notify_subscribers('macro_update', macro_data)
                await asyncio.sleep(update_interval)
                
            except Exception as e:
                logger.error(f"Macro update error: {e}")
                await asyncio.sleep(update_interval)
                
    async def position_monitor_loop(self):
        """Monitor positions for stop losses - runs every minute"""
        while self.is_running:
            try:
                await self.check_stop_losses()
                await asyncio.sleep(60)
                
            except Exception as e:
                logger.error(f"Position monitor error: {e}")
                await asyncio.sleep(60)
                
    async def execute_trading_cycle(self):
        """Execute one trading cycle"""
        logger.debug("Executing trading cycle...")
        
        try:
            # 1. Gather market data
            market_data = await self.gather_market_data()
            
            # 2. Analyze conditions
            analysis = await self.analyze_market(market_data)
            
            # 3. Get AI trading signals
            signals = await self.get_ai_signals(analysis)
            
            # 4. Apply risk management
            validated_signals = self.risk_manager.validate_signals(
                signals,
                self.positions,
                analysis['macro']['risk_multiplier']
            )
            
            # 5. Execute trades if enabled
            if self.trading_enabled and validated_signals:
                await self.execute_trades(validated_signals)
                
            # 6. Update positions
            await self.update_positions()
            
            # 7. Calculate performance
            self.update_performance()
            
            # 8. Notify subscribers
            await self.notify_subscribers('update', {
                'analysis': analysis,
                'signals': validated_signals,
                'positions': self.positions,
                'performance': self.performance,
                'timestamp': datetime.now().isoformat()
            })
            
            self.last_update = datetime.now()
            
        except Exception as e:
            logger.error(f"Trading cycle failed: {e}")
            
    async def gather_market_data(self):
        """Gather all necessary market data"""
        symbols = ['BTC', 'ETH', 'SOL']  # Main trading pairs
        
        market_data = {}
        for symbol in symbols:
            data = await self.exchange.get_market_data(symbol)
            market_data[symbol] = data
            
        return market_data
        
    async def analyze_market(self, market_data):
        """Run all analyzers on market data"""
        # Get macro analysis
        macro = await self.macro_analyzer.analyze()
        
        # Get technical analysis
        technical = await self.technical_analyzer.analyze(market_data)
        
        return {
            'macro': macro,
            'technical': technical,
            'market_data': market_data
        }
        
    async def get_ai_signals(self, analysis):
        """Get trading signals from AI council"""
        signals = await self.ai_council.deliberate(
            analysis=analysis,
            positions=self.positions,
            performance=self.performance
        )
        
        return signals
        
    async def execute_trades(self, signals):
        """Execute validated trading signals"""
        for signal in signals:
            try:
                if signal['action'] in ['OPEN_LONG', 'OPEN_SHORT']:
                    await self.open_position(signal)
                elif signal['action'] == 'CLOSE':
                    await self.close_position(signal['symbol'])
                elif signal['action'] == 'ADJUST':
                    await self.adjust_position(signal)
                    
            except Exception as e:
                logger.error(f"Failed to execute trade for {signal['symbol']}: {e}")
                
    async def open_position(self, signal):
        """Open a new position"""
        try:
            # Execute on exchange
            order = await self.exchange.place_order(
                symbol=signal['symbol'],
                side='buy' if signal['action'] == 'OPEN_LONG' else 'sell',
                size=signal['size'],
                leverage=signal.get('leverage', 2)
            )
            
            # Track position
            self.positions[signal['symbol']] = {
                'symbol': signal['symbol'],
                'side': 'LONG' if signal['action'] == 'OPEN_LONG' else 'SHORT',
                'size': signal['size'],
                'entry': order['price'],
                'current': order['price'],
                'stop_loss': signal.get('stop_loss'),
                'take_profit': signal.get('take_profit'),
                'pnl': 0,
                'pnl_percent': 0,
                'opened_at': datetime.now().isoformat()
            }
            
            logger.info(f"Opened {signal['action']} position for {signal['symbol']}")
            
            # Notify
            await self.notify_subscribers('trade', {
                'type': 'OPEN',
                'position': self.positions[signal['symbol']]
            })
            
        except Exception as e:
            logger.error(f"Failed to open position: {e}")
            
    async def close_position(self, symbol):
        """Close an existing position"""
        if symbol not in self.positions:
            logger.warning(f"No position found for {symbol}")
            return
            
        try:
            position = self.positions[symbol]
            
            # Execute close on exchange
            await self.exchange.close_position(symbol)
            
            # Update performance
            self.performance['total_trades'] += 1
            if position['pnl'] > 0:
                self.performance['streak'] += 1
            else:
                self.performance['streak'] = 0
                
            self.performance['pnl'] += position['pnl']
            self.performance['daily_pnl'] += position['pnl']
            
            # Remove position
            del self.positions[symbol]
            
            logger.info(f"Closed position for {symbol}, PnL: ${position['pnl']:.2f}")
            
            # Notify
            await self.notify_subscribers('trade', {
                'type': 'CLOSE',
                'symbol': symbol,
                'pnl': position['pnl']
            })
            
        except Exception as e:
            logger.error(f"Failed to close position: {e}")
            
    async def adjust_position(self, signal):
        """Adjust stop loss or take profit"""
        if signal['symbol'] not in self.positions:
            return
            
        position = self.positions[signal['symbol']]
        
        if 'stop_loss' in signal:
            position['stop_loss'] = signal['stop_loss']
        if 'take_profit' in signal:
            position['take_profit'] = signal['take_profit']
            
        logger.info(f"Adjusted position for {signal['symbol']}")
        
    async def update_positions(self):
        """Update current prices and PnL for all positions"""
        for symbol, position in self.positions.items():
            try:
                # Get current price
                current_price = await self.exchange.get_price(symbol)
                position['current'] = current_price
                
                # Calculate PnL
                price_diff = current_price - position['entry']
                direction = 1 if position['side'] == 'LONG' else -1
                position['pnl'] = price_diff * direction * position['size']
                position['pnl_percent'] = (price_diff / position['entry']) * direction * 100
                
            except Exception as e:
                logger.error(f"Failed to update position for {symbol}: {e}")
                
    async def check_stop_losses(self):
        """Check and trigger stop losses"""
        for symbol, position in list(self.positions.items()):
            # Check stop loss
            if position['stop_loss'] and position['current'] <= position['stop_loss']:
                logger.warning(f"Stop loss triggered for {symbol}")
                await self.close_position(symbol)
                
            # Check take profit
            elif position['take_profit'] and position['current'] >= position['take_profit']:
                logger.info(f"Take profit triggered for {symbol}")
                await self.close_position(symbol)
                
            # Check max loss percent
            elif position['pnl_percent'] <= -float(os.getenv('STOP_LOSS_PERCENT', 5)):
                logger.warning(f"Max loss triggered for {symbol}")
                await self.close_position(symbol)
                
    async def load_positions(self):
        """Load existing positions from exchange"""
        try:
            positions = await self.exchange.get_positions()
            for pos in positions:
                self.positions[pos['symbol']] = pos
            logger.info(f"Loaded {len(positions)} existing positions")
        except Exception as e:
            logger.error(f"Failed to load positions: {e}")
            
    def update_performance(self):
        """Calculate performance metrics"""
        if self.performance['total_trades'] > 0:
            wins = sum(1 for p in self.positions.values() if p.get('pnl', 0) > 0)
            self.performance['win_rate'] = (wins / self.performance['total_trades']) * 100
            
    def subscribe(self, callback):
        """Subscribe to bot updates"""
        self.subscribers.append(callback)
        
    async def notify_subscribers(self, event_type, data):
        """Notify all subscribers of an event"""
        for callback in self.subscribers:
            try:
                await callback(event_type, data)
            except Exception as e:
                logger.error(f"Subscriber notification error: {e}")
                
    async def stop(self):
        """Stop the trading bot"""
        logger.info("Stopping trading bot...")
        self.is_running = False
        await self.exchange.disconnect()
        logger.info("Trading bot stopped")
        
    def get_status(self):
        """Get current bot status"""
        return {
            'is_running': self.is_running,
            'trading_enabled': self.trading_enabled,
            'paper_trading': self.paper_trading,
            'positions': self.positions,
            'performance': self.performance,
            'last_update': self.last_update.isoformat() if self.last_update else None
        }