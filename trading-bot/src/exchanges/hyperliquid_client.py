"""
Hyperliquid Exchange Client
Uses the official hyperliquid-python-sdk
"""

import os
import json
from typing import Dict, List, Optional
from decimal import Decimal
from loguru import logger
from eth_account import Account
from hyperliquid.info import Info
from hyperliquid.exchange import Exchange
from hyperliquid.utils import constants


class HyperliquidClient:
    def __init__(self):
        self.private_key = os.getenv('HYPERLIQUID_PRIVATE_KEY')
        self.testnet = os.getenv('HYPERLIQUID_TESTNET', 'false').lower() == 'true'
        
        self.account = None
        self.address = None
        self.info = None
        self.exchange = None
        
    async def connect(self):
        """Initialize connection to Hyperliquid"""
        try:
            if not self.private_key:
                logger.warning("No private key provided - running in read-only mode")
                # Initialize info-only client for market data
                self.info = Info(testnet=self.testnet)
            else:
                # Initialize account from private key
                self.account = Account.from_key(self.private_key)
                self.address = self.account.address
                
                # Initialize both info and exchange clients
                self.info = Info(testnet=self.testnet)
                self.exchange = Exchange(
                    account=self.account,
                    testnet=self.testnet
                )
                
                logger.info(f"Connected to Hyperliquid {'testnet' if self.testnet else 'mainnet'}")
                logger.info(f"Trading account: {self.address}")
                
                # Test connection by getting account info
                account_info = self.info.user_state(self.address)
                if account_info:
                    logger.info(f"Account balance: ${account_info.get('marginSummary', {}).get('accountValue', 0)}")
                
        except Exception as e:
            logger.error(f"Failed to connect to Hyperliquid: {e}")
            raise
            
    async def get_market_data(self, symbol: str) -> Dict:
        """Get comprehensive market data for a symbol"""
        try:
            # Convert symbol format (BTC -> BTC-USD)
            hl_symbol = f"{symbol}-USD"
            
            # Get multiple data points
            meta = self.info.meta()
            ticker = next((t for t in meta['universe'] if t['name'] == hl_symbol), None)
            
            if not ticker:
                logger.warning(f"Symbol {hl_symbol} not found")
                return {}
                
            # Get order book
            orderbook = self.info.l2_snapshot(hl_symbol)
            
            # Get recent trades
            trades = self.info.trades(hl_symbol, limit=100)
            
            # Get funding rate
            funding = self.info.funding_rate(hl_symbol)
            
            # Get open interest
            oi = self.info.open_interest(hl_symbol)
            
            return {
                'symbol': symbol,
                'price': float(ticker.get('markPx', 0)),
                'bid': float(orderbook['levels'][0][0]['px']) if orderbook['levels'][0] else 0,
                'ask': float(orderbook['levels'][1][0]['px']) if orderbook['levels'][1] else 0,
                'volume_24h': float(ticker.get('dayNtlVlm', 0)),
                'funding_rate': float(funding) if funding else 0,
                'open_interest': float(oi) if oi else 0,
                'trades': trades[:10] if trades else []
            }
            
        except Exception as e:
            logger.error(f"Failed to get market data for {symbol}: {e}")
            return {}
            
    async def get_price(self, symbol: str) -> float:
        """Get current price for a symbol"""
        try:
            hl_symbol = f"{symbol}-USD"
            meta = self.info.meta()
            ticker = next((t for t in meta['universe'] if t['name'] == hl_symbol), None)
            
            if ticker:
                return float(ticker.get('markPx', 0))
            return 0
            
        except Exception as e:
            logger.error(f"Failed to get price for {symbol}: {e}")
            return 0
            
    async def place_order(self, symbol: str, side: str, size: float, 
                         leverage: int = 1, order_type: str = 'market') -> Dict:
        """Place an order on Hyperliquid"""
        if not self.exchange:
            raise Exception("Exchange not initialized - cannot place orders")
            
        try:
            hl_symbol = f"{symbol}-USD"
            
            # Set leverage first
            if leverage != 1:
                self.exchange.update_leverage(leverage, hl_symbol)
                
            # Prepare order based on type
            if order_type == 'market':
                # Market order
                result = self.exchange.market_order(
                    coin=hl_symbol,
                    is_buy=(side == 'buy'),
                    sz=size,
                    reduce_only=False
                )
            else:
                # Limit order (would need price parameter)
                current_price = await self.get_price(symbol)
                limit_price = current_price * (0.999 if side == 'buy' else 1.001)
                
                result = self.exchange.limit_order(
                    coin=hl_symbol,
                    is_buy=(side == 'buy'),
                    sz=size,
                    limit_px=limit_price,
                    reduce_only=False
                )
                
            logger.info(f"Order placed: {result}")
            
            return {
                'order_id': result.get('response', {}).get('data', {}).get('statuses', [{}])[0].get('resting', {}).get('oid'),
                'symbol': symbol,
                'side': side,
                'size': size,
                'price': await self.get_price(symbol),
                'status': 'submitted'
            }
            
        except Exception as e:
            logger.error(f"Failed to place order: {e}")
            raise
            
    async def close_position(self, symbol: str):
        """Close a position"""
        if not self.exchange:
            raise Exception("Exchange not initialized")
            
        try:
            hl_symbol = f"{symbol}-USD"
            
            # Get current position
            positions = self.info.user_state(self.address)
            position = next((p for p in positions.get('assetPositions', []) 
                           if p.get('position', {}).get('coin') == hl_symbol), None)
            
            if not position:
                logger.warning(f"No position found for {symbol}")
                return
                
            pos_data = position['position']
            size = abs(float(pos_data['szi']))
            is_long = float(pos_data['szi']) > 0
            
            # Place market order to close
            result = self.exchange.market_order(
                coin=hl_symbol,
                is_buy=(not is_long),  # Opposite side to close
                sz=size,
                reduce_only=True
            )
            
            logger.info(f"Position closed: {result}")
            
        except Exception as e:
            logger.error(f"Failed to close position: {e}")
            raise
            
    async def get_positions(self) -> List[Dict]:
        """Get all open positions"""
        if not self.address:
            return []
            
        try:
            user_state = self.info.user_state(self.address)
            positions = []
            
            for asset in user_state.get('assetPositions', []):
                pos = asset.get('position', {})
                if float(pos.get('szi', 0)) != 0:
                    symbol = pos['coin'].replace('-USD', '')
                    size = float(pos['szi'])
                    
                    positions.append({
                        'symbol': symbol,
                        'side': 'LONG' if size > 0 else 'SHORT',
                        'size': abs(size),
                        'entry': float(pos.get('entryPx', 0)),
                        'current': float(pos.get('markPx', 0)),
                        'unrealized_pnl': float(pos.get('unrealizedPnl', 0)),
                        'margin_used': float(pos.get('marginUsed', 0))
                    })
                    
            return positions
            
        except Exception as e:
            logger.error(f"Failed to get positions: {e}")
            return []
            
    async def get_balance(self) -> Dict:
        """Get account balance"""
        if not self.address:
            return {'balance': 0, 'available': 0}
            
        try:
            user_state = self.info.user_state(self.address)
            margin = user_state.get('marginSummary', {})
            
            return {
                'balance': float(margin.get('accountValue', 0)),
                'available': float(margin.get('availableMargin', 0)),
                'margin_used': float(margin.get('marginUsed', 0)),
                'unrealized_pnl': float(margin.get('unrealizedPnl', 0))
            }
            
        except Exception as e:
            logger.error(f"Failed to get balance: {e}")
            return {'balance': 0, 'available': 0}
            
    async def get_funding_history(self, symbol: str = None) -> List[Dict]:
        """Get funding payment history"""
        if not self.address:
            return []
            
        try:
            # Get funding history from user state
            funding_history = self.info.user_funding_history(self.address)
            
            if symbol:
                hl_symbol = f"{symbol}-USD"
                return [f for f in funding_history if f.get('coin') == hl_symbol]
                
            return funding_history
            
        except Exception as e:
            logger.error(f"Failed to get funding history: {e}")
            return []
            
    async def set_leverage(self, symbol: str, leverage: int):
        """Set leverage for a symbol"""
        if not self.exchange:
            raise Exception("Exchange not initialized")
            
        try:
            hl_symbol = f"{symbol}-USD"
            result = self.exchange.update_leverage(leverage, hl_symbol)
            logger.info(f"Leverage set to {leverage}x for {symbol}")
            return result
            
        except Exception as e:
            logger.error(f"Failed to set leverage: {e}")
            raise
            
    async def cancel_order(self, order_id: str, symbol: str = None):
        """Cancel an order"""
        if not self.exchange:
            raise Exception("Exchange not initialized")
            
        try:
            if symbol:
                hl_symbol = f"{symbol}-USD"
                result = self.exchange.cancel(hl_symbol, order_id)
            else:
                # Cancel by order ID only
                result = self.exchange.cancel_by_oid(order_id)
                
            logger.info(f"Order cancelled: {order_id}")
            return result
            
        except Exception as e:
            logger.error(f"Failed to cancel order: {e}")
            raise
            
    async def get_open_orders(self) -> List[Dict]:
        """Get all open orders"""
        if not self.address:
            return []
            
        try:
            user_state = self.info.user_state(self.address)
            open_orders = []
            
            for asset in user_state.get('assetPositions', []):
                for order in asset.get('orders', []):
                    open_orders.append({
                        'order_id': order['oid'],
                        'symbol': order['coin'].replace('-USD', ''),
                        'side': 'buy' if order['side'] == 'B' else 'sell',
                        'size': float(order['sz']),
                        'price': float(order['limitPx']),
                        'filled': float(order.get('filled', 0)),
                        'timestamp': order['timestamp']
                    })
                    
            return open_orders
            
        except Exception as e:
            logger.error(f"Failed to get open orders: {e}")
            return []
            
    async def get_trade_history(self, symbol: str = None, limit: int = 100) -> List[Dict]:
        """Get trade history"""
        if not self.address:
            return []
            
        try:
            # Get user fills
            fills = self.info.user_fills(self.address)
            
            if symbol:
                hl_symbol = f"{symbol}-USD"
                fills = [f for f in fills if f.get('coin') == hl_symbol]
                
            # Format and limit
            trades = []
            for fill in fills[:limit]:
                trades.append({
                    'symbol': fill['coin'].replace('-USD', ''),
                    'side': fill['side'],
                    'size': float(fill['sz']),
                    'price': float(fill['px']),
                    'fee': float(fill.get('fee', 0)),
                    'timestamp': fill['time']
                })
                
            return trades
            
        except Exception as e:
            logger.error(f"Failed to get trade history: {e}")
            return []
            
    async def disconnect(self):
        """Disconnect from exchange"""
        logger.info("Disconnected from Hyperliquid")
        
    def get_symbols(self) -> List[str]:
        """Get available trading symbols"""
        try:
            meta = self.info.meta()
            symbols = []
            
            for ticker in meta.get('universe', []):
                # Extract base symbol (remove -USD)
                symbol = ticker['name'].replace('-USD', '')
                symbols.append(symbol)
                
            return symbols
            
        except Exception as e:
            logger.error(f"Failed to get symbols: {e}")
            return ['BTC', 'ETH', 'SOL']  # Default symbols