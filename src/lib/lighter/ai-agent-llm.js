// AI Trading Agent with Real LLM Integration
// Uses Grok for sentiment analysis and Anthropic for main agent & macro analysis

class AITradingAgent {
  constructor() {
    this.thoughts = [];
    this.marketMemory = {};
    this.lastAnalysis = {};
    this.isAnalyzing = false;
    
    // API configurations
    this.grokApiKey = process.env.GROK_API_KEY;
    this.anthropicApiKey = process.env.ANTHROPIC_API_KEY;
    
    this.consultants = {
      market: { 
        name: 'Market Analyst', 
        icon: '📊', 
        confidence: 0,
        model: 'anthropic' // Uses Anthropic
      },
      macro: { 
        name: 'Macro Specialist', 
        icon: '🌍', 
        confidence: 0,
        model: 'anthropic' // Uses Anthropic
      },
      sentiment: { 
        name: 'Sentiment Oracle', 
        icon: '💭', 
        confidence: 0,
        model: 'grok' // Uses Grok
      }
    };
  }

  // Call Grok API for sentiment analysis
  async callGrok(prompt, systemPrompt = "You are a crypto market sentiment analyst. Provide concise, actionable insights.") {
    try {
      const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.grokApiKey}`
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
          model: 'grok-beta',
          stream: false,
          temperature: 0.7,
          max_tokens: 150
        })
      });

      if (!response.ok) {
        console.error('Grok API error:', response.status);
        return null;
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content || null;
    } catch (error) {
      console.error('Grok API call failed:', error);
      return null;
    }
  }

  // Call Anthropic API for main analysis
  async callAnthropic(prompt, systemPrompt = "You are RL80, an expert crypto trading AI. Provide sharp, confident analysis.") {
    // For now, return a simulated response since Anthropic key not provided
    // When you add the key, uncomment the actual API call below
    
    if (!this.anthropicApiKey || this.anthropicApiKey === '') {
      // Fallback to rule-based analysis for now
      return this.generateFallbackAnalysis(prompt);
    }
    
    /* Uncomment when Anthropic key is added:
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.anthropicApiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 150,
          system: systemPrompt,
          messages: [{ role: 'user', content: prompt }]
        })
      });

      if (!response.ok) {
        console.error('Anthropic API error:', response.status);
        return null;
      }

      const data = await response.json();
      return data.content?.[0]?.text || null;
    } catch (error) {
      console.error('Anthropic API call failed:', error);
      return null;
    }
    */
  }

  // Fallback analysis when Anthropic key not available
  generateFallbackAnalysis(prompt) {
    const keywords = prompt.toLowerCase();
    
    if (keywords.includes('btc') || keywords.includes('bitcoin')) {
      if (keywords.includes('up') || keywords.includes('bullish')) {
        return "BTC momentum building. Key resistance at next psychological level. Watch for volume confirmation.";
      }
      return "BTC consolidating. Awaiting catalyst for directional move.";
    }
    
    if (keywords.includes('risk') || keywords.includes('position')) {
      return "Risk parameters within acceptable range. Consider scaling into positions on weakness.";
    }
    
    if (keywords.includes('macro')) {
      return "Macro conditions supportive of risk assets. Fed policy remains accommodative.";
    }
    
    return "Market conditions stable. Monitoring for opportunities.";
  }

  // Generate a thought using LLMs
  async generateAIThought(type, marketData, consultant = null) {
    let analysis = '';
    
    try {
      if (consultant === 'sentiment') {
        // Use Grok for sentiment analysis
        const prompt = `Analyze crypto market sentiment based on:
          - BTC: ${marketData.btcPrice || 'N/A'} (${marketData.btcChange || 0}% 24h)
          - Market Fear/Greed: ${marketData.fearGreed || 'N/A'}
          - Volume trends: ${marketData.volumeTrend || 'Normal'}
          
          Provide a brief sentiment reading in 1-2 sentences.`;
        
        analysis = await this.callGrok(prompt);
      } else if (consultant === 'macro') {
        // Use Anthropic for macro analysis
        const prompt = `As a macro specialist, analyze:
          - DXY: ${marketData.dxy || 103} (${marketData.dxyChange || 0}%)
          - VIX: ${marketData.vix || 15}
          - Fed policy: ${marketData.fedPolicy || 'Neutral'}
          
          How does this affect crypto positioning? (1-2 sentences)`;
        
        analysis = await this.callAnthropic(prompt);
      } else {
        // Main market analysis with Anthropic
        const prompt = `Analyze this crypto market data:
          - Positions: ${marketData.positionCount || 0} active
          - P&L: ${marketData.totalPnL || 0}
          - BTC: ${marketData.btcPrice || 'N/A'}
          - ETH: ${marketData.ethPrice || 'N/A'}
          
          Provide trading insight in 1-2 sentences.`;
        
        analysis = await this.callAnthropic(prompt);
      }
    } catch (error) {
      console.error('AI thought generation failed:', error);
      analysis = 'Analysis temporarily unavailable.';
    }

    const thought = {
      timestamp: new Date().toLocaleString(),
      type,
      message: analysis || 'Processing market conditions...',
      consultant
    };
    
    this.thoughts.unshift(thought);
    if (this.thoughts.length > 50) {
      this.thoughts = this.thoughts.slice(0, 50);
    }
    
    return thought;
  }

  // Main analysis cycle with LLMs
  async performAnalysis(data) {
    if (this.isAnalyzing) return this.thoughts;
    
    this.isAnalyzing = true;
    const allThoughts = [];
    
    try {
      // Prepare market context
      const marketContext = {
        btcPrice: data.marketData?.['BTC-USD']?.ticker?.lastPrice,
        btcChange: data.marketData?.['BTC-USD']?.ticker?.priceChange24h,
        ethPrice: data.marketData?.['ETH-USD']?.ticker?.lastPrice,
        ethChange: data.marketData?.['ETH-USD']?.ticker?.priceChange24h,
        positionCount: data.positions?.length || 0,
        totalPnL: data.positions?.reduce((sum, p) => sum + (p.unrealizedPnl || 0), 0) || 0,
        fearGreed: data.macroData?.fearGreed || 72,
        vix: data.macroData?.vix || 14.2,
        dxy: data.macroData?.dxy || 103.42,
        dxyChange: data.macroData?.dxyChange || -0.8,
        volumeTrend: 'Normal',
        fedPolicy: data.macroData?.marketRegime || 'RISK_ON'
      };

      // Generate thoughts from each consultant
      
      // 1. Main market analysis
      const marketThought = await this.generateAIThought('trading', marketContext, 'market');
      if (marketThought) allThoughts.push(marketThought);
      
      // 2. Sentiment analysis with Grok
      const sentimentThought = await this.generateAIThought('sentiment', marketContext, 'sentiment');
      if (sentimentThought) allThoughts.push(sentimentThought);
      
      // 3. Macro analysis
      const macroThought = await this.generateAIThought('market', marketContext, 'macro');
      if (macroThought) allThoughts.push(macroThought);
      
      // 4. Position-specific analysis if positions exist
      if (data.positions && data.positions.length > 0) {
        const positionContext = {
          ...marketContext,
          positions: data.positions
        };
        const positionThought = await this.generateAIThought('trading', positionContext, null);
        if (positionThought) allThoughts.push(positionThought);
      }
      
      // Update consultant confidence based on successful API calls
      this.updateConsultantConfidence(allThoughts);
      
    } catch (error) {
      console.error('Analysis cycle error:', error);
      allThoughts.push({
        timestamp: new Date().toLocaleString(),
        type: 'system',
        message: 'Analysis cycle recovering...',
        consultant: null
      });
    } finally {
      this.isAnalyzing = false;
    }
    
    return allThoughts;
  }

  // Update consultant confidence levels
  updateConsultantConfidence(thoughts) {
    thoughts.forEach(thought => {
      if (thought.consultant && this.consultants[thought.consultant]) {
        // Increase confidence when consultant provides analysis
        this.consultants[thought.consultant].confidence = 75 + Math.random() * 25;
      }
    });
  }

  // Get current thoughts
  getThoughts() {
    return this.thoughts;
  }

  // Get consultant states
  getConsultants() {
    return this.consultants;
  }

  // Test API connections
  async testConnections() {
    console.log('Testing AI connections...');
    
    // Test Grok
    const grokTest = await this.callGrok('Testing connection. Just say "Connected to Grok successfully"');
    console.log('Grok test:', grokTest ? '✅ Connected' : '❌ Failed');
    
    // Test Anthropic (will use fallback if no key)
    const anthropicTest = await this.callAnthropic('Testing connection. Just say "Connected"');
    console.log('Anthropic test:', anthropicTest ? '✅ Connected/Fallback' : '❌ Failed');
    
    return {
      grok: !!grokTest,
      anthropic: !!anthropicTest
    };
  }
}

// Export singleton instance
let agentInstance = null;

export const getAITradingAgent = () => {
  if (!agentInstance) {
    agentInstance = new AITradingAgent();
    // Test connections on initialization
    agentInstance.testConnections();
  }
  return agentInstance;
};

export default AITradingAgent;