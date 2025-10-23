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
      const [fedRate, dxy, vix, cpi, treasury10Y] = await Promise.all([
        this.getFredData('DFF', 1), // Federal Funds Rate
        this.getFredData('DEXUSEU', 1), // USD/EUR (proxy for DXY)
        this.getFredData('VIXCLS', 1), // VIX
        this.getFredData('CPIAUCSL', 1), // CPI
        this.getFredData('DGS10', 1) // 10-Year Treasury
      ]);
      
      return {
        fedRate: parseFloat(fedRate[0]?.value || 5.5),
        fedRateChange: this.calculateChange(fedRate),
        nextFOMC: this.getNextFOMCDate(),
        rateCutProb: this.estimateRateCutProbability(fedRate),
        
        dxy: parseFloat(dxy[0]?.value || 103),
        dxyChange: this.calculateChange(dxy),
        
        vix: parseFloat(vix[0]?.value || 15),
        vixChange: this.calculateChange(vix),
        
        cpi: parseFloat(cpi[0]?.value || 3.0),
        cpiPrev: parseFloat(cpi[1]?.value || 3.2),
        
        treasury10Y: parseFloat(treasury10Y[0]?.value || 4.25)
      };
    } catch (error) {
      logger.error('Traditional macro fetch error:', error);
      return this.getDefaultTraditionalMacro();
    }
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
      return { value: 50, text: 'Neutral' };
    }
  }
  
  async getCryptoMarketData() {
    // This would integrate with CoinGecko, DeFiLlama, etc.
    // For now, returning mock data
    return {
      btcDominance: 52.3,
      btcDomChange: 1.2,
      stableMcap: 140.2,
      stableFlow: 2.8,
      stableFlowDirection: 'IN',
      totalMcap: 2.68,
      defiTVL: 68.5,
      avgFunding: 0.012,
      totalOI: 18.7,
      exchangeReserves: -2.3
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
    const currentRate = parseFloat(fedRateData[0]?.value || 5.5);
    
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
      fedRate: 5.5,
      fedRateChange: 0,
      nextFOMC: 'Mar 20',
      rateCutProb: 50,
      dxy: 103,
      dxyChange: 0,
      vix: 15,
      vixChange: 0,
      cpi: 3.0,
      cpiPrev: 3.2,
      treasury10Y: 4.25
    };
  }
  
  getDefaultCryptoMacro() {
    return {
      fearGreed: 50,
      fearGreedText: 'Neutral',
      btcDominance: 52,
      btcDomChange: 0,
      stableMcap: 140,
      stableFlow: 0,
      stableFlowDirection: 'NEUTRAL',
      totalCryptoMcap: 2.5,
      defiTVL: 65,
      fundingRate: 0.01,
      openInterest: 18,
      exchangeReserves: 0
    };
  }
}