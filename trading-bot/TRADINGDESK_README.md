# Cyborg Trading Bot - Our Lady of Perpetual Profit

An AI-powered cryptocurrency trading bot that combines macro economic analysis, technical indicators, and sentiment analysis to execute trades on Hyperliquid.

## Features

- **Modular AI Agents**: Four specialized AI agents with unique personalities and expertise:
  - **Sentiment Oracle** (Grok): Crowd psychology and social sentiment analysis
  - **Market Analyst** (OpenAI): Technical analysis and chart patterns
  - **Macro Specialist** (Anthropic): Global economics and central bank policies
  - **RL80 Trader**: Lead trader synthesizing team insights for execution
- **Agent Control System**: Turn agents on/off, use mock mode, control API costs
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
- `OPENAI_API_KEY`: For Market Analyst agent
- `ANTHROPIC_API_KEY`: For Macro Specialist agent
- `GROK_API_KEY`: For Sentiment Oracle agent (x.ai)
- `FRED_API_KEY`: Free at https://fred.stlouisfed.org/docs/api/

Agent Control Settings:
```bash
# Master switch - disable all agents
NEXT_PUBLIC_AGENTS_ENABLED=true

# Individual agent controls
NEXT_PUBLIC_AGENT_SENTIMENT=true
NEXT_PUBLIC_AGENT_MARKET=true
NEXT_PUBLIC_AGENT_MACRO=true
NEXT_PUBLIC_AGENT_RL80=true

# Mock mode - use mock responses instead of API calls
NEXT_PUBLIC_MOCK_SENTIMENT=false
NEXT_PUBLIC_MOCK_MARKET=false
NEXT_PUBLIC_MOCK_MACRO=false
NEXT_PUBLIC_MOCK_RL80=false
```

### 3. Start the Bot

**Note:** The trading-bot is currently in development. Some components are not yet fully implemented.

**Paper Trading Mode (Recommended for testing):**
```bash
npm run dev  # Will need implementation of missing components
```

**Live Trading (Use with caution):**
```bash
# Set TRADING_ENABLED=true and PAPER_TRADING=false in .env
npm start  # Requires completion of missing modules
```

## Architecture

```
pumpkinspice/
├── src/
│   ├── lib/
│   │   └── agents/                    # Modular AI Agent System
│   │       ├── agent-config.js        # Agent control & configuration
│   │       ├── sentiment-oracle.js    # Sentiment Oracle (Grok/x.ai)
│   │       ├── market-analyst.js      # Market Analyst (OpenAI GPT-4)
│   │       ├── macro-specialist.js    # Macro Specialist (Anthropic Claude)
│   │       ├── rl80-trader.js         # RL80 Lead Trader (Logic-based)
│   │       └── knowledge/
│   │           └── trading-knowledge.json # Shared knowledge base
│   ├── pages/
│   │   └── api/
│   │       ├── ai-chat.js            # Main AI chat router
│   │       ├── agent-status.js       # Check agent status endpoint
│   │       └── team-chat-history.js  # Firestore chat history
│   └── hooks/
│       └── useLighterAPI.js          # React hook for AI agents
│
trading-bot/
├── src/
│   ├── core/
│   │   └── TradingBot.js       # Main bot orchestrator
│   ├── ai/
│   │   └── AICouncil.js        # Multi-AI decision making
│   ├── analyzers/
│   │   └── MacroAnalyzer.js    # Economic data analysis
│   ├── exchanges/
│   │   ├── HyperliquidClient.js # Exchange integration (JS)
│   │   └── hyperliquid_client.py # Exchange integration (Python)
│   ├── bot.py                  # Python trading bot
│   └── index.js                # JS entry point
```

Note: Some files referenced in trading-bot (PositionManager.js, RiskManager.js, TechnicalAnalyzer.js, SentimentAnalyzer.js, server/websocket.js) are not yet implemented.

## Trading Strategy

The bot uses a multi-layered approach:

1. **Macro Layer**: Determines overall market regime (RISK_ON/RISK_OFF)
2. **Technical Layer**: Identifies entry/exit points using indicators
3. **Sentiment Layer**: Gauges market psychology and social trends
4. **Risk Layer**: Sizes positions based on portfolio risk

### AI Agent Team Structure

```javascript
Sentiment Oracle (Grok) → Crowd psychology, social sentiment, Twitter analysis
Market Analyst (OpenAI) → Chart patterns, technical indicators, support/resistance
Macro Specialist (Anthropic) → Global economics, central banks, DXY/VIX analysis
     ↓
RL80 Trader (Lead) → Synthesizes all inputs, makes final trading decision
     ↓
Trade Signal → Execute based on consensus and risk parameters
```

### Agent Personalities & Expertise

**Sentiment Oracle**
- Personality: Street-smart trader who reads crowd psychology
- Expertise: Fear & Greed Index, social sentiment, market emotions
- API: Grok (x.ai) - Rate limited to 1 call/hour to save costs

**Market Analyst**
- Personality: Technical analysis expert, data-driven
- Expertise: Chart patterns, RSI, MACD, support/resistance levels
- API: OpenAI GPT-4 Turbo

**Macro Specialist**
- Personality: Global economics expert, policy analyst
- Expertise: Central bank policies, DXY, treasury yields, inflation
- API: Anthropic Claude 3.5 Sonnet

**RL80 Trader**
- Personality: Disciplined lead trader, risk manager
- Expertise: Position sizing, risk/reward, team consensus analysis
- API: None (pure logic-based)

## API Integrations

### Free Data Sources
- **FRED**: Federal Reserve economic data (integration in MacroAnalyzer.js)
- **Alternative.me**: Fear & Greed Index (used in main app via /api/fear-greed)
- **CoinGecko**: Crypto market data (optional)
- **Hyperliquid**: Real-time market data

### Required APIs
- **OpenAI**: GPT-4 for Market Analyst ($)
- **Anthropic**: Claude for Macro Specialist ($)
- **Grok/x.ai**: For Sentiment Oracle ($25 credits minimum)

### Rate Limiting
- Sentiment Oracle (Grok): Limited to once per hour
- Other agents: No default rate limits
- Configure in `agent-config.js`

## Risk Management

Default safety features:
- Maximum position size: $1000
- Risk per trade: 2%
- Stop loss: 5%
- Maximum open positions: 5
- Default leverage: 2x

Adjust in `.env` file to match your risk tolerance.

## Monitoring

### Agent Status
Check current agent configuration:
```bash
curl http://localhost:3000/api/agent-status
```

### Real-time Dashboard
**Note:** WebSocket server implementation (server/websocket.js) is pending.

The frontend components are ready in:
- `src/components/TradingOverlay.jsx` - Trading UI overlay
- `src/hooks/useLighterTrading.js` - Trading hooks
- `src/services/tradingBotService.js` - Bot service integration

Once WebSocket server is implemented:
```javascript
const ws = new WebSocket('ws://localhost:3002');

ws.on('message', (data) => {
  const update = JSON.parse(data);
  // Update TradingOverlay component
});
```

### Chat History
The system automatically loads the last 5-10 messages from Firestore on page load via the `/api/team-chat-history` endpoint in the main application.

### Logs
Monitor bot activity:
```bash
tail -f logs/trading.log
```

### Alerts (Optional)
Configure Discord or Telegram webhooks in `.env` for trade notifications.

## Current Implementation Status

### ✅ Completed
- Modular AI Agent System (in main app)
- Agent control configuration
- Hyperliquid client connections
- MacroAnalyzer.js
- AICouncil.js framework
- Main app UI components

### ⚠️ Pending Implementation
- PositionManager.js
- RiskManager.js  
- TechnicalAnalyzer.js
- SentimentAnalyzer.js
- server/websocket.js
- Backtest functionality

## Deployment

### Local Development
```bash
npm run dev  # After completing missing modules
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

**Note:** Backtest functionality is not yet implemented.
```bash
npm run backtest  # Pending implementation
```

## Agent Development & Customization

### Adding Knowledge to Agents
Edit the knowledge base:
```javascript
// src/lib/agents/knowledge/trading-knowledge.json
{
  "indicators": {
    "rsi": {
      "description": "Relative Strength Index",
      "oversold": 30,
      "overbought": 70
    }
  },
  "patterns": {
    "head_and_shoulders": {
      "type": "reversal",
      "reliability": "high"
    }
  }
}
```

### Customizing Agent Personalities
Edit individual agent files:
```javascript
// src/lib/agents/sentiment-oracle.js
export const SENTIMENT_ORACLE_CONFIG = {
  personality: {
    traits: [
      'Street-smart trader',
      'Reads crowd psychology',
      // Add your custom traits
    ],
    slangDictionary: {
      bullish: ['moon time', 'sending it', 'up only'],
      bearish: ['rekt incoming', 'blood in the streets']
    }
  }
}
```

## Troubleshooting

### Common Issues

1. **"Agent disabled" errors**
   - Check `NEXT_PUBLIC_AGENTS_ENABLED=true` in .env
   - Verify individual agent settings
   - Use mock mode for testing: `NEXT_PUBLIC_MOCK_[AGENT]=true`

2. **"Cannot connect to Hyperliquid"**
   - Check your API URL and network connection
   - Verify your private key is correct

3. **"OpenAI/Anthropic/Grok rate limit"**
   - Enable rate limiting in agent-config.js
   - Use mock mode during development
   - Reduce UPDATE_INTERVAL in .env

4. **"Insufficient balance" (Grok/x.ai)**
   - Add credits at x.ai ($25 minimum)
   - Check balance at https://console.x.ai

5. **"Model not found" (Anthropic)**
   - Update to latest model: `claude-3-5-sonnet-20241022`

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

## Recent Updates

### v2.0 - Modular Agent Architecture
- Completely refactored from 336-line monolithic file to modular architecture
- Four separate agent modules with unique personalities and expertise
- Central agent control system for development
- Knowledge management system for continuous improvement
- Rate limiting for API cost control
- Mock mode for testing without API calls
- Firestore chat history integration
- Fixed all default value issues (no more hardcoded Fear & Greed of 50)

Remember: Past performance does not guarantee future results. Trade responsibly! 🚀