import axios from 'axios';
import { logger } from '../utils/logger.js';

export class MacroAnalyzer {
  constructor() {
    this.fredApiKey = process.env.FRED_API_KEY;
    this.fredBaseUrl = 'https://api.stlouisfed.org/fred/series/observations';
    this.alternativeUrl = process.env.ALTERNATIVE_ME_API || 'https://api.alternative.me/fng/';
    this.cache = new Map();
    this.cacheTimeout = 300000; // 5 minutes
  }
  
  async analyze() {
    try {
      const [traditional, crypto] = await Promise.all([
        this.getTraditionalMacro(),
        this.getCryptoMacro()
      ]);
      
      const marketRegime = this.determineMarketRegime(traditional, crypto);
      const riskScore = this.calculateRiskScore(traditional, crypto);
      
      return {
        marketRegime,
        riskScore,
        ...traditional,
        ...crypto,
        signals: this.generateSignals(traditional, crypto),
        riskMultiplier: this.calculateRiskMultiplier(marketRegime, riskScore),
        timestamp: Date.now()
      };
    } catch (error) {
      logger.error('Macro analysis error:', error);
      return this.getDefaultMacro();
    }
  }
  
  async getTraditionalMacro() {
    try {
      // Try to fetch from our market-data API first
      const response = await axios.get('http://localhost:3000/api/market-data?format=object');
      
      if (response.data?.success && response.data?.data) {
        const data = response.data.data;
        
        // Use API data if available, otherwise try FRED
        const fedRate = data.fedRate || await this.getFredData('DFF', 1);
        const dxy = data.dxy?.value || await this.getFredData('DEXUSEU', 1);
        const vix = data.vix?.value || await this.getFredData('VIXCLS', 1);
        const cpi = await this.getFredData('CPIAUCSL', 2); // Need 2 values for comparison
        const treasury10Y = data.treasury10Y?.value || await this.getFredData('DGS10', 1);
        
        return {
          fedRate: data.fedRate || parseFloat(fedRate[0]?.value) || 0,
          fedRateChange: data.fedRateChange || this.calculateChange(fedRate),
          nextFOMC: data.nextFOMC || this.getNextFOMCDate(),
          rateCutProb: data.rateCutProb || this.estimateRateCutProbability(fedRate),
          
          dxy: data.dxy?.value || parseFloat(dxy[0]?.value) || 0,
          dxyChange: data.dxy?.changePercent || this.calculateChange(dxy),
          
          vix: data.vix?.value || parseFloat(vix[0]?.value) || 0,
          vixChange: data.vix?.changePercent || this.calculateChange(vix),
          
          cpi: parseFloat(cpi[0]?.value) || 0,
          cpiPrev: parseFloat(cpi[1]?.value) || 0,
          
          treasury10Y: data.treasury10Y?.value || parseFloat(treasury10Y[0]?.value) || 0
        };
      }
    } catch (error) {
      logger.error('Traditional macro fetch error:', error);
    }
    
    // Return zeros instead of hardcoded values
    return {
      fedRate: 0,
      fedRateChange: 0,
      nextFOMC: 'Unknown',
      rateCutProb: 0,
      dxy: 0,
      dxyChange: 0,
      vix: 0,
      vixChange: 0,
      cpi: 0,
      cpiPrev: 0,
      treasury10Y: 0
    };
  }
  
  async getFredData(series, limit = 10) {
    const cacheKey = `fred_${series}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;
    
    try {
      if (!this.fredApiKey) {
        logger.warn('FRED API key not configured, using default values');
        return [];
      }
      
      const response = await axios.get(this.fredBaseUrl, {
        params: {
          series_id: series,
          api_key: this.fredApiKey,
          file_type: 'json',
          sort_order: 'desc',
          limit
        }
      });
      
      const data = response.data.observations || [];
      this.setCache(cacheKey, data);
      return data;
    } catch (error) {
      logger.error(`FRED API error for ${series}:`, error.message);
      return [];
    }
  }
  
  async getCryptoMacro() {
    try {
      const [fearGreed, marketData] = await Promise.all([
        this.getFearGreedIndex(),
        this.getCryptoMarketData()
      ]);
      
      return {
        fearGreed: fearGreed.value,
        fearGreedText: fearGreed.text,
        
        btcDominance: marketData.btcDominance,
        btcDomChange: marketData.btcDomChange,
        
        stableMcap: marketData.stableMcap,
        stableFlow: marketData.stableFlow,
        stableFlowDirection: marketData.stableFlowDirection,
        
        totalCryptoMcap: marketData.totalMcap,
        defiTVL: marketData.defiTVL,
        
        fundingRate: marketData.avgFunding,
        openInterest: marketData.totalOI,
        exchangeReserves: marketData.exchangeReserves
      };
    } catch (error) {
      logger.error('Crypto macro fetch error:', error);
      return this.getDefaultCryptoMacro();
    }
  }
  
  async getFearGreedIndex() {
    const cacheKey = 'fear_greed';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;
    
    try {
      // First try our own endpoint
      const ourResponse = await axios.get('http://localhost:3000/api/fear-greed');
      if (ourResponse.data?.success && ourResponse.data?.data) {
        const result = {
          value: ourResponse.data.data.value,
          text: ourResponse.data.data.classification,
          timestamp: ourResponse.data.data.timestamp
        };
        this.setCache(cacheKey, result);
        return result;
      }
    } catch (err) {
      // If our endpoint fails, try alternative.me
      try {
        const response = await axios.get(this.alternativeUrl);
        const data = response.data.data[0];
        
        const result = {
          value: parseInt(data.value),
          text: data.value_classification,
          timestamp: data.timestamp
        };
        
        this.setCache(cacheKey, result);
        return result;
      } catch (error) {
        logger.error('Fear & Greed API error:', error.message);
      }
    }
    
    return { value: 0, text: 'Unknown' };
  }
  
  async getCryptoMarketData() {
    try {
      // Fetch from our market-data API endpoint
      const response = await axios.get('http://localhost:3000/api/market-data?format=object');
      
      if (response.data?.success && response.data?.data) {
        const data = response.data.data;
        return {
          btcDominance: data.btcDominance?.value || 0,
          btcDomChange: data.btcDominance?.change || 0,
          stableMcap: data.totalCryptoMcap || 0,
          stableFlow: 0, // Would need stablecoin-flows endpoint
          stableFlowDirection: 'NEUTRAL',
          totalMcap: data.totalCryptoMcap || 0,
          defiTVL: 0, // Would need DeFiLlama integration
          avgFunding: data.fundingRate?.value || 0,
          totalOI: data.openInterest?.value || 0,
          exchangeReserves: 0
        };
      }
    } catch (error) {
      logger.error('Failed to fetch crypto market data:', error.message);
    }
    
    // Return zeros instead of hardcoded values
    return {
      btcDominance: 0,
      btcDomChange: 0,
      stableMcap: 0,
      stableFlow: 0,
      stableFlowDirection: 'NEUTRAL',
      totalMcap: 0,
      defiTVL: 0,
      avgFunding: 0,
      totalOI: 0,
      exchangeReserves: 0
    };
  }
  
  determineMarketRegime(traditional, crypto) {
    const bullishFactors = [];
    const bearishFactors = [];
    
    // Traditional factors
    if (traditional.fedRateChange < 0) bullishFactors.push('Fed dovish');
    if (traditional.dxyChange < 0) bullishFactors.push('Dollar weakening');
    if (traditional.vix < 20) bullishFactors.push('Low volatility');
    if (traditional.cpi < traditional.cpiPrev) bullishFactors.push('Inflation cooling');
    
    if (traditional.fedRateChange > 0) bearishFactors.push('Fed hawkish');
    if (traditional.dxyChange > 0) bearishFactors.push('Dollar strengthening');
    if (traditional.vix > 30) bearishFactors.push('High volatility');
    if (traditional.treasury10Y > 5) bearishFactors.push('High yields');
    
    // Crypto factors
    if (crypto.fearGreed > 70) bullishFactors.push('Greed sentiment');
    if (crypto.stableFlowDirection === 'IN') bullishFactors.push('Stablecoin inflows');
    if (crypto.fundingRate < 0.01) bullishFactors.push('Neutral funding');
    
    if (crypto.fearGreed < 30) bearishFactors.push('Fear sentiment');
    if (crypto.stableFlowDirection === 'OUT') bearishFactors.push('Stablecoin outflows');
    if (crypto.fundingRate > 0.03) bearishFactors.push('Overheated funding');
    
    if (bullishFactors.length > bearishFactors.length + 2) {
      return 'RISK_ON';
    } else if (bearishFactors.length > bullishFactors.length + 2) {
      return 'RISK_OFF';
    } else {
      return 'NEUTRAL';
    }
  }
  
  calculateRiskScore(traditional, crypto) {
    let score = 50; // Start neutral
    
    // Traditional impacts
    score += traditional.vix < 15 ? 10 : traditional.vix > 25 ? -15 : 0;
    score += traditional.dxyChange < 0 ? 5 : -5;
    score += traditional.fedRateChange < 0 ? 10 : -10;
    
    // Crypto impacts
    score += crypto.fearGreed > 50 ? (crypto.fearGreed - 50) / 2 : (crypto.fearGreed - 50) / 2;
    score += crypto.stableFlowDirection === 'IN' ? 10 : -10;
    score += Math.abs(crypto.fundingRate) < 0.01 ? 5 : -5;
    
    return Math.max(0, Math.min(100, score));
  }
  
  calculateRiskMultiplier(regime, riskScore) {
    if (regime === 'RISK_OFF') {
      return 0.5; // Half position sizes
    } else if (regime === 'RISK_ON' && riskScore > 70) {
      return 1.5; // Increase position sizes
    } else {
      return 1.0; // Normal position sizes
    }
  }
  
  generateSignals(traditional, crypto) {
    const signals = [];
    
    if (traditional.fedRateChange < 0) signals.push('Fed Dovish');
    if (traditional.dxyChange < -1) signals.push('DXY Weak');
    if (crypto.stableFlow > 1) signals.push('Stables Flowing In');
    if (crypto.fearGreed > 75) signals.push('Extreme Greed');
    if (crypto.fearGreed < 25) signals.push('Extreme Fear');
    if (traditional.vix < 12) signals.push('Low Volatility');
    if (traditional.vix > 30) signals.push('High Volatility');
    
    return signals.slice(0, 4); // Return top 4 signals
  }
  
  calculateChange(dataArray) {
    if (!dataArray || dataArray.length < 2) return 0;
    const current = parseFloat(dataArray[0]?.value || 0);
    const previous = parseFloat(dataArray[1]?.value || 0);
    return previous !== 0 ? ((current - previous) / previous) * 100 : 0;
  }
  
  getNextFOMCDate() {
    // FOMC meeting schedule (would be fetched from API in production)
    const fomcDates = [
      '2024-03-20',
      '2024-05-01',
      '2024-06-12',
      '2024-07-31',
      '2024-09-18',
      '2024-11-07',
      '2024-12-18'
    ];
    
    const now = new Date();
    const nextMeeting = fomcDates.find(date => new Date(date) > now);
    
    if (nextMeeting) {
      const date = new Date(nextMeeting);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    
    return 'TBD';
  }
  
  estimateRateCutProbability(fedRateData) {
    // Simple estimation based on current rate
    const currentRate = parseFloat(fedRateData[0]?.value || 0);
    
    if (currentRate > 5) return 85;
    if (currentRate > 4) return 60;
    if (currentRate > 3) return 30;
    return 15;
  }
  
  getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }
  
  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
  
  async updateData() {
    // Force refresh all data
    this.cache.clear();
    return await this.analyze();
  }
  
  getDefaultMacro() {
    return {
      marketRegime: 'NEUTRAL',
      riskScore: 50,
      ...this.getDefaultTraditionalMacro(),
      ...this.getDefaultCryptoMacro(),
      signals: ['Data Limited'],
      riskMultiplier: 1.0,
      timestamp: Date.now()
    };
  }
  
  getDefaultTraditionalMacro() {
    return {
      fedRate: 0,
      fedRateChange: 0,
      nextFOMC: 'Unknown',
      rateCutProb: 0,
      dxy: 0,
      dxyChange: 0,
      vix: 0,
      vixChange: 0,
      cpi: 0,
      cpiPrev: 0,
      treasury10Y: 0
    };
  }
  
  getDefaultCryptoMacro() {
    return {
      fearGreed: 0,
      fearGreedText: 'Unknown',
      btcDominance: 0,
      btcDomChange: 0,
      stableMcap: 0,
      stableFlow: 0,
      stableFlowDirection: 'NEUTRAL',
      totalCryptoMcap: 0,
      defiTVL: 0,
      fundingRate: 0,
      openInterest: 0,
      exchangeReserves: 0
    };
  }
}