# 🤖 AI Trading Agents - Development Guide

## 💰 Cost-Saving Development Setup

This guide helps you develop and test your 4-agent AI trading system while minimizing API costs.

## Quick Start (Zero Cost Testing)

```javascript
// In your temple page or main component:
import DevModePanel from '@/components/DevModePanel';
import { getAgentCollaboration } from '@/trading/collaboration/AgentCollaboration';

// Add dev panel to your UI (only shows in development)
<DevModePanel show={true} />

// Start agents with mock responses (no API calls)
const collaboration = getAgentCollaboration();
collaboration.start();
```

## 🎮 Development Modes

### 1. **Mock Mode** (FREE - Recommended for UI Development)
- No API calls made
- Realistic mock responses for all agents
- Perfect for testing UI, chat flow, and learning system

```env
# .env.development
NEXT_PUBLIC_USE_MOCK_AGENTS=true
```

### 2. **Single Agent Mode** (Low Cost - $0.01-0.02 per test)
- Enable only one agent at a time
- Test specific agent behaviors
- Debug individual API integrations

```env
# Test only Market Analyst (OpenAI)
NEXT_PUBLIC_ENABLE_SENTIMENT=false
NEXT_PUBLIC_ENABLE_MARKET=true      # Only this one active
NEXT_PUBLIC_ENABLE_MACRO=false
NEXT_PUBLIC_USE_MOCK_AGENTS=false   # Real API calls
```

### 3. **RL80-Only Mode** (FREE - Test decision logic)
- Only run the RL80 trader (no API costs)
- Test decision synthesis and risk management

```env
NEXT_PUBLIC_ENABLE_SENTIMENT=false
NEXT_PUBLIC_ENABLE_MARKET=false
NEXT_PUBLIC_ENABLE_MACRO=false
# RL80 always runs (it's free)
```

### 4. **Scheduled Mode** (Controlled Costs)
- Agents run on timer (30-60 min intervals in dev)
- Realistic testing with minimal API usage
- ~$0.50-1.00 per day with all agents

## 📈 API Cost Breakdown

| Agent | Provider | Cost/Call | Calls/Hour (Dev) | Daily Cost (Dev) |
|-------|----------|-----------|------------------|------------------|
| Sentiment Oracle | Grok (X.AI) | ~$0.02 | 2 (30min interval) | $0.96 |
| Market Analyst | OpenAI GPT-4 | ~$0.01 | 2 | $0.48 |
| Macro Specialist | Anthropic Claude | ~$0.015 | 2 | $0.72 |
| RL80 Trader | Pure Logic | $0.00 | Unlimited | $0.00 |
| **TOTAL** | | | | **~$2.16/day** |

*Note: Production (5min intervals) would be ~$13/day*

## 🎯 Testing Progression

### Phase 1: UI Development (Week 1)
```javascript
// Use full mock mode
process.env.NEXT_PUBLIC_USE_MOCK_AGENTS = 'true'

// Test features:
- Chat UI rendering
- Message flow
- Knowledge base storage
- Learning cycles
- Performance tracking
```

### Phase 2: Individual Agent Testing (Week 2)
```javascript
// Test one agent at a time with real APIs
// Day 1-2: RL80 (free)
// Day 3-4: Market Analyst ($0.50/day)
// Day 5-6: Macro Specialist ($0.75/day)  
// Day 7: Sentiment Oracle ($1.00/day)
```

### Phase 3: Integration Testing (Week 3)
```javascript
// Enable 2-3 agents, longer intervals
process.env.NEXT_PUBLIC_DEV_MODE = 'true' // 30min intervals
process.env.NEXT_PUBLIC_ENABLE_MARKET = 'true'
process.env.NEXT_PUBLIC_ENABLE_MACRO = 'true'
// ~$1.20/day
```

### Phase 4: Pre-Production (Week 4)
```javascript
// All agents, 15min intervals
// ~$4-5/day for final testing
```

## 🛠️ DevModePanel Features

The development panel (bottom-left corner) provides:

- **Agent Toggles**: Enable/disable individual agents
- **Mock Mode Switch**: Toggle between real/mock responses
- **API Call Counter**: Track usage per agent
- **Cost Calculator**: Real-time cost estimation
- **Test Buttons**: 
  - Test full discussion
  - Test individual agents
  - Reset counters

## 💡 Cost-Saving Tips

1. **Always start with mocks** - Develop features without API costs
2. **Use rate limiting** - Sentiment Oracle has 1-hour cooldown built-in
3. **Test during development** - 30-60 min intervals vs 5 min production
4. **Monitor the counter** - DevModePanel shows real-time costs
5. **Batch your testing** - Test multiple scenarios in one session
6. **Use RL80 for logic** - It's free and tests decision-making
7. **Save real API tests** - Only when testing integration

## 🚀 Deployment Checklist

Before going to production:

- [ ] Test all agents individually with real APIs
- [ ] Run full integration test (all agents, 1 hour)
- [ ] Verify knowledge base is recording patterns
- [ ] Check performance metrics calculation
- [ ] Test WebSocket reconnection to Lighter
- [ ] Verify Firebase Functions (if using)
- [ ] Set production intervals (5-15 minutes)
- [ ] Configure production API keys
- [ ] Set up cost alerts in provider dashboards
- [ ] Enable production monitoring

## 📊 Monitoring Costs in Production

### Set up alerts:
- **OpenAI**: Dashboard > Usage > Set limit
- **Anthropic**: Console > Settings > Spending limits  
- **X.AI (Grok)**: Settings > API > Usage alerts

### Expected Production Costs:
- **Testnet Phase**: $5-15/day (learning mode)
- **Optimized**: $3-8/day (with caching & smart triggers)
- **Scaled Down**: $1-3/day (longer intervals, fewer agents)

## 🤔 Troubleshooting

### High Costs?
1. Check if mock mode is off accidentally
2. Verify interval settings (should be 30+ min in dev)
3. Look for infinite loops in agent calls
4. Check rate limiting is working

### Agents Not Responding?
1. Verify API keys in `.env.local`
2. Check individual agent enabled status
3. Look at browser console for errors
4. Verify Firebase is connected

### Mock Responses Not Working?
1. Ensure `NEXT_PUBLIC_USE_MOCK_AGENTS=true`
2. Restart Next.js dev server
3. Clear browser cache

## 📄 Environment Variables Reference

```env
# .env.development (Cost Control)
NEXT_PUBLIC_DEV_MODE=true              # Longer intervals
NEXT_PUBLIC_USE_MOCK_AGENTS=true       # Mock all agents
NEXT_PUBLIC_ENABLE_SENTIMENT=false     # Disable expensive Grok
NEXT_PUBLIC_ENABLE_MARKET=true         # Enable OpenAI
NEXT_PUBLIC_ENABLE_MACRO=true          # Enable Anthropic

# Individual Mock Controls
NEXT_PUBLIC_MOCK_SENTIMENT=true        # Mock only this agent
NEXT_PUBLIC_MOCK_MARKET=false          # Use real API
NEXT_PUBLIC_MOCK_MACRO=false           # Use real API

# API Keys (in .env.local - not committed)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GROK_API_KEY=xai-...
```

---

🎉 **Remember**: Start with $0 cost (mocks) and gradually increase as needed!