import OpenAI from 'openai';
import { logger } from '../utils/logger.js';

export class AICouncil {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    // Define AI agent roles
    this.agents = {
      technicalAnalyst: {
        role: 'Technical Analysis Expert',
        model: 'gpt-4-turbo-preview',
        temperature: 0.3,
        focus: 'chart patterns, indicators, support/resistance'
      },
      riskManager: {
        role: 'Risk Management Specialist',
        model: 'gpt-4-turbo-preview',
        temperature: 0.2,
        focus: 'position sizing, stop losses, portfolio risk'
      },
      sentimentAnalyst: {
        role: 'Market Sentiment Analyst',
        model: 'gpt-4-turbo-preview', 
        temperature: 0.5,
        focus: 'social sentiment, news impact, market psychology'
      }
    };
  }
  
  async deliberate(context) {
    logger.info('AI Council beginning deliberation...');
    
    // Get recommendations from each AI agent
    const recommendations = await Promise.all([
      this.getTechnicalRecommendation(context),
      this.getRiskRecommendation(context),
      this.getSentimentRecommendation(context)
    ]);
    
    // Synthesize recommendations into trading signals
    const signals = await this.synthesizeSignals(recommendations, context);
    
    return {
      signals,
      reasoning: this.generateReasoning(recommendations),
      confidence: this.calculateConfidence(recommendations)
    };
  }
  
  async getTechnicalRecommendation(context) {
    const prompt = `
    You are a technical analysis expert for crypto trading. Analyze the following market data and provide trading recommendations.
    
    Current Technical Indicators:
    ${JSON.stringify(context.technical, null, 2)}
    
    Current Positions:
    ${JSON.stringify(context.currentPositions, null, 2)}
    
    Provide specific trading signals in JSON format:
    {
      "signals": [
        {
          "symbol": "ETH/USDT",
          "action": "OPEN_LONG|OPEN_SHORT|CLOSE|HOLD",
          "confidence": 0-100,
          "reasoning": "brief explanation",
          "entry": price,
          "stopLoss": price,
          "takeProfit": price
        }
      ],
      "marketOutlook": "bullish|bearish|neutral"
    }
    `;
    
    try {
      const response = await this.openai.chat.completions.create({
        model: this.agents.technicalAnalyst.model,
        messages: [
          {
            role: 'system',
            content: `You are ${this.agents.technicalAnalyst.role}. Focus on ${this.agents.technicalAnalyst.focus}.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: this.agents.technicalAnalyst.temperature,
        response_format: { type: "json_object" }
      });
      
      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      logger.error('Technical analyst error:', error);
      return { signals: [], marketOutlook: 'neutral' };
    }
  }
  
  async getRiskRecommendation(context) {
    const prompt = `
    You are a risk management specialist. Evaluate the risk profile of potential trades.
    
    Macro Conditions:
    ${JSON.stringify(context.macro, null, 2)}
    
    Current Performance:
    ${JSON.stringify(context.performance, null, 2)}
    
    Current Positions:
    ${JSON.stringify(context.currentPositions, null, 2)}
    
    Provide risk-adjusted recommendations in JSON format:
    {
      "maxPositionSize": amount in USD,
      "riskLevel": "low|medium|high",
      "positionSizing": {
        "BTC/USDT": size,
        "ETH/USDT": size
      },
      "warnings": ["array of risk warnings"],
      "adjustments": ["recommended position adjustments"]
    }
    `;
    
    try {
      const response = await this.openai.chat.completions.create({
        model: this.agents.riskManager.model,
        messages: [
          {
            role: 'system',
            content: `You are ${this.agents.riskManager.role}. Focus on ${this.agents.riskManager.focus}.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: this.agents.riskManager.temperature,
        response_format: { type: "json_object" }
      });
      
      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      logger.error('Risk manager error:', error);
      return { 
        maxPositionSize: 100, 
        riskLevel: 'low',
        positionSizing: {},
        warnings: [],
        adjustments: []
      };
    }
  }
  
  async getSentimentRecommendation(context) {
    const prompt = `
    You are a market sentiment analyst. Analyze market psychology and social signals.
    
    Sentiment Data:
    ${JSON.stringify(context.sentiment, null, 2)}
    
    Macro Market Regime:
    ${context.macro.marketRegime}
    
    Fear & Greed Index:
    ${context.macro.fearGreed}
    
    Provide sentiment-based trading insights in JSON format:
    {
      "overallSentiment": "bullish|bearish|neutral",
      "confidenceScore": 0-100,
      "hotCoins": ["symbols with positive sentiment"],
      "avoidCoins": ["symbols with negative sentiment"],
      "trendingNarratives": ["current market narratives"],
      "contrarian": boolean (should we trade against sentiment?)
    }
    `;
    
    try {
      const response = await this.openai.chat.completions.create({
        model: this.agents.sentimentAnalyst.model,
        messages: [
          {
            role: 'system',
            content: `You are ${this.agents.sentimentAnalyst.role}. Focus on ${this.agents.sentimentAnalyst.focus}.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: this.agents.sentimentAnalyst.temperature,
        response_format: { type: "json_object" }
      });
      
      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      logger.error('Sentiment analyst error:', error);
      return {
        overallSentiment: 'neutral',
        confidenceScore: 50,
        hotCoins: [],
        avoidCoins: [],
        trendingNarratives: [],
        contrarian: false
      };
    }
  }
  
  async synthesizeSignals(recommendations, context) {
    const [technical, risk, sentiment] = recommendations;
    const signals = [];
    
    // Process technical signals with risk and sentiment filters
    for (const techSignal of technical.signals || []) {
      // Check if symbol is in avoid list
      if (sentiment.avoidCoins?.includes(techSignal.symbol)) {
        logger.info(`Skipping ${techSignal.symbol} due to negative sentiment`);
        continue;
      }
      
      // Apply position sizing from risk manager
      const size = risk.positionSizing?.[techSignal.symbol] || 
                  Math.min(risk.maxPositionSize || 1000, 
                          parseFloat(process.env.MAX_POSITION_SIZE || 1000));
      
      // Adjust confidence based on all three analysts
      const combinedConfidence = this.combineConfidence(
        techSignal.confidence || 50,
        sentiment.confidenceScore || 50,
        risk.riskLevel
      );
      
      // Only trade if confidence is high enough
      if (combinedConfidence >= 60) {
        signals.push({
          symbol: techSignal.symbol,
          action: techSignal.action,
          size,
          leverage: risk.riskLevel === 'low' ? 1 : risk.riskLevel === 'medium' ? 2 : 3,
          stopLoss: techSignal.stopLoss,
          takeProfit: techSignal.takeProfit,
          confidence: combinedConfidence,
          reasoning: {
            technical: techSignal.reasoning,
            risk: risk.warnings,
            sentiment: sentiment.trendingNarratives
          }
        });
      }
    }
    
    // Add hot coins from sentiment if technical agrees
    for (const hotCoin of sentiment.hotCoins || []) {
      if (!signals.find(s => s.symbol === hotCoin)) {
        // Could add logic to open positions on trending coins
        logger.info(`${hotCoin} is trending but no technical signal`);
      }
    }
    
    return signals;
  }
  
  combineConfidence(technical, sentiment, riskLevel) {
    const riskMultiplier = riskLevel === 'low' ? 1.2 : 
                           riskLevel === 'medium' ? 1.0 : 0.8;
    
    // Weighted average with risk adjustment
    const baseConfidence = (technical * 0.5 + sentiment * 0.3) * riskMultiplier;
    
    // Add bonus for agreement
    const agreementBonus = Math.abs(technical - sentiment) < 20 ? 10 : 0;
    
    return Math.min(100, Math.max(0, baseConfidence + agreementBonus));
  }
  
  generateReasoning(recommendations) {
    const [technical, risk, sentiment] = recommendations;
    
    return {
      technical: technical.marketOutlook || 'neutral',
      risk: risk.warnings || [],
      sentiment: sentiment.overallSentiment || 'neutral',
      narratives: sentiment.trendingNarratives || [],
      summary: this.generateSummary(recommendations)
    };
  }
  
  generateSummary(recommendations) {
    const [technical, risk, sentiment] = recommendations;
    
    const outlooks = [
      technical.marketOutlook,
      sentiment.overallSentiment,
      risk.riskLevel === 'high' ? 'bearish' : risk.riskLevel === 'low' ? 'bullish' : 'neutral'
    ];
    
    const bullishCount = outlooks.filter(o => o === 'bullish').length;
    const bearishCount = outlooks.filter(o => o === 'bearish').length;
    
    if (bullishCount > bearishCount) {
      return 'AI Council leans bullish - favorable conditions for long positions';
    } else if (bearishCount > bullishCount) {
      return 'AI Council leans bearish - consider short positions or staying flat';
    } else {
      return 'AI Council is neutral - wait for clearer signals';
    }
  }
  
  calculateConfidence(recommendations) {
    const confidences = recommendations
      .map(r => r.confidenceScore || r.signals?.[0]?.confidence || 50)
      .filter(c => c !== undefined);
    
    return confidences.length > 0 
      ? confidences.reduce((a, b) => a + b, 0) / confidences.length
      : 50;
  }
}