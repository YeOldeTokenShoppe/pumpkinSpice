# Lighter.xyz Trading API Setup Guide

## Overview
The Lighter.xyz perp trading testnet integration has been set up for your AI trading agent on the `/temple` page. This guide will help you configure and start using the API.

## Setup Steps

### 1. Prerequisites
- Testnet wallet with funds on the Lighter testnet
- Your Ethereum private key for the testnet wallet

### 2. Generate API Keys

#### Option A: Use the Setup Page (Recommended)
1. Navigate to http://localhost:3000/lighter-setup
2. Enter your testnet ETH private key
3. Optionally provide a seed phrase for deterministic key generation
4. Click "Setup API Key"
5. Copy the generated configuration to your `.env.local` file

#### Option B: Manual Setup
1. Copy `.env.local.example` to `.env.local`
2. Fill in your credentials:
```bash
NEXT_PUBLIC_LIGHTER_BASE_URL=https://testnet.zklighter.elliot.ai
LIGHTER_API_KEY_PRIVATE_KEY=<generated_api_key_private_key>
LIGHTER_ETH_PRIVATE_KEY=<your_eth_private_key>
LIGHTER_ACCOUNT_INDEX=0
LIGHTER_API_KEY_INDEX=3
```

### 3. Integration with Temple Page

The trading bot is integrated with your TradingOverlay component. To use it:

```javascript
// In your temple page or component
import { useLighterTrading } from '@/hooks/useLighterTrading';

// Inside your component
const { 
  isConnected, 
  tradingData, 
  initialize,
  createMarketOrder,
  createLimitOrder,
  executeStrategy 
} = useLighterTrading();

// Initialize on mount
useEffect(() => {
  initialize();
}, []);
```

## Available Features

### Trading Functions
- **Market Orders**: `createMarketOrder(market, side, size)`
- **Limit Orders**: `createLimitOrder(market, side, size, price)`
- **Stop Loss**: `createStopLoss(market, side, size, triggerPrice, limitPrice)`
- **Cancel Orders**: `cancelOrder(orderId)` or `cancelAllOrders()`
- **Close Positions**: `closePosition(market)`

### Market Analysis
- **Analyze Market**: `analyzeMarket(market)` - Returns orderbook analysis and trading signals
- **Execute Strategy**: `executeStrategy(markets)` - Runs automated trading strategy

### Real-time Data
- WebSocket connection for live orderbook updates
- Position and order tracking
- Account balance monitoring

## File Structure

```
src/
├── lib/lighter/
│   ├── client.js           # Core API client
│   ├── setup-api-key.js    # API key generation utilities
│   ├── trading.js          # Trading bot logic
│   └── websocket.js        # WebSocket client for real-time data
├── hooks/
│   └── useLighterTrading.js # React hook for trading integration
├── pages/api/lighter/
│   └── setup-key.js        # API route for key setup
└── app/
    └── lighter-setup/
        └── page.js         # Setup UI page
```

## Testing the Integration

1. Start your development server:
```bash
npm run dev
```

2. Navigate to the temple page: http://localhost:3000/temple

3. The TradingOverlay should connect to Lighter automatically if configured

4. Monitor the console for connection status and any errors

## Supported Markets (Testnet)
- BTC-USD
- ETH-USD
- SOL-USD
- BNB-USD
- And more available on the testnet

## Important Notes

1. **Security**: Never commit your `.env.local` file or share your private keys
2. **Testnet**: This is configured for testnet. For mainnet, change the BASE_URL to `https://mainnet.zklighter.elliot.ai`
3. **Rate Limits**: Be aware of API rate limits when making requests
4. **Risk Management**: The bot includes basic risk management (2% risk per trade default)

## Troubleshooting

### Connection Issues
- Verify your API keys are correctly set in `.env.local`
- Check that your testnet wallet has been registered on Lighter
- Ensure you have testnet funds

### Trading Errors
- Check account balance and available margin
- Verify market symbols are correct
- Review order parameters (size, price)

### WebSocket Disconnections
- The client will automatically attempt to reconnect
- Check network connectivity
- Review console logs for specific error messages

## Next Steps

1. Configure your API keys
2. Test with small trades on testnet
3. Customize the trading strategy in `src/lib/lighter/trading.js`
4. Monitor performance through the TradingOverlay UI

## Support

For Lighter API documentation: https://docs.lighter.xyz
For issues with this integration: Check the console logs and error messages