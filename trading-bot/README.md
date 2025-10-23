# Cyborg Trading Bot - Our Lady of Perpetual Profit

An AI-powered cryptocurrency trading bot that combines macro economic analysis, technical indicators, and sentiment analysis to execute trades on Hyperliquid.

## Features

- **AI Council**: Multiple AI agents (Technical, Risk, Sentiment) collaborate on trading decisions
- **Macro Analysis**: Tracks Fed rates, DXY, VIX, CPI, Fear & Greed index
- **Real-time Trading**: Executes trades on Hyperliquid perpetual markets
- **Risk Management**: Dynamic position sizing based on market conditions
- **WebSocket Updates**: Real-time data streaming to your UI
- **Paper Trading**: Test strategies without real funds

## Quick Start

### 1. Install Dependencies

```bash
cd trading-bot
npm install
```

### 2. Configure Environment

Copy `.env.template` to `.env` and fill in your credentials:

```bash
cp .env.template .env
```

Required credentials:
- `HYPERLIQUID_PRIVATE_KEY`: Your wallet private key for Hyperliquid
- `OPENAI_API_KEY`: For AI trading decisions
- `FRED_API_KEY`: Free at https://fred.stlouisfed.org/docs/api/

### 3. Start the Bot

**Paper Trading Mode (Recommended for testing):**
```bash
npm run dev
```

**Live Trading (Use with caution):**
```bash
# Set TRADING_ENABLED=true and PAPER_TRADING=false in .env
npm start
```

## Architecture

```
trading-bot/
├── src/
│   ├── core/
│   │   ├── TradingBot.js       # Main bot orchestrator
│   │   ├── PositionManager.js  # Position management
│   │   └── RiskManager.js      # Risk controls
│   ├── ai/
│   │   └── AICouncil.js        # Multi-AI decision making
│   ├── analyzers/
│   │   ├── MacroAnalyzer.js    # Economic data analysis
│   │   ├── TechnicalAnalyzer.js # Technical indicators
│   │   └── SentimentAnalyzer.js # Social sentiment
│   ├── exchanges/
│   │   └── HyperliquidClient.js # Exchange integration
│   └── server/
│       └── websocket.js        # Real-time UI updates
```

## Trading Strategy

The bot uses a multi-layered approach:

1. **Macro Layer**: Determines overall market regime (RISK_ON/RISK_OFF)
2. **Technical Layer**: Identifies entry/exit points using indicators
3. **Sentiment Layer**: Gauges market psychology and social trends
4. **Risk Layer**: Sizes positions based on portfolio risk

### AI Council Decision Process

```javascript
Technical Analyst → Chart patterns, support/resistance
Risk Manager → Position sizing, stop losses
Sentiment Analyst → Social signals, market psychology
     ↓
Consensus Engine → Weighted voting system
     ↓
Trade Signal → Execute if confidence > 60%
```

## API Integrations

### Free Data Sources
- **FRED**: Federal Reserve economic data
- **Alternative.me**: Fear & Greed Index
- **CoinGecko**: Crypto market data (optional)
- **Hyperliquid**: Real-time market data

### Required APIs
- **OpenAI**: GPT-4 for AI trading decisions ($)
- **Grok** (Optional): Twitter sentiment analysis ($16/mo)

## Risk Management

Default safety features:
- Maximum position size: $1000
- Risk per trade: 2%
- Stop loss: 5%
- Maximum open positions: 5
- Default leverage: 2x

Adjust in `.env` file to match your risk tolerance.

## Monitoring

### Real-time Dashboard
Connect your React frontend to the WebSocket server:

```javascript
const ws = new WebSocket('ws://localhost:3002');

ws.on('message', (data) => {
  const update = JSON.parse(data);
  // Update TradingOverlay component
});
```

### Logs
Monitor bot activity:
```bash
tail -f logs/trading.log
```

### Alerts (Optional)
Configure Discord or Telegram webhooks in `.env` for trade notifications.

## Deployment

### Local Development
```bash
npm run dev
```

### Production (VPS/Cloud)

1. **Using PM2:**
```bash
npm install -g pm2
pm2 start src/index.js --name "trading-bot"
pm2 save
pm2 startup
```

2. **Using Docker:**
```bash
docker build -t cyborg-trading-bot .
docker run -d --env-file .env cyborg-trading-bot
```

3. **Systemd Service:**
Create `/etc/systemd/system/trading-bot.service`:
```ini
[Unit]
Description=Cyborg Trading Bot
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/trading-bot
ExecStart=/usr/bin/node src/index.js
Restart=on-failure
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

## Safety Guidelines

⚠️ **IMPORTANT**: 
- Start with paper trading
- Test thoroughly before using real funds
- Never invest more than you can afford to lose
- Monitor the bot regularly
- Set conservative risk parameters initially

## Connecting to Your UI

Update your React app to receive real-time updates:

```javascript
// In your temple page or a context provider
useEffect(() => {
  const ws = new WebSocket('ws://your-server:3002');
  
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    
    if (data.type === 'update') {
      setTradingData({
        fundBalance: data.performance.balance,
        positions: data.positions,
        macroData: data.analysis.macro,
        // ... map other fields
      });
    }
  };
  
  return () => ws.close();
}, []);
```

## Testing

Run backtests with historical data:
```bash
npm run backtest
```

## Troubleshooting

### Common Issues

1. **"Cannot connect to Hyperliquid"**
   - Check your API URL and network connection
   - Verify your private key is correct

2. **"OpenAI rate limit"**
   - Reduce UPDATE_INTERVAL in .env
   - Upgrade your OpenAI plan

3. **"Insufficient balance"**
   - Check your Hyperliquid account balance
   - Reduce MAX_POSITION_SIZE

### Debug Mode
Enable verbose logging:
```bash
DEBUG=* npm run dev
```

## License

MIT - Use at your own risk. This is experimental software.

## Support

For issues or questions, check the logs first:
```bash
cat logs/trading.log | grep ERROR
```

Remember: Past performance does not guarantee future results. Trade responsibly! 🚀