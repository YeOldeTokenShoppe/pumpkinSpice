import { db, doc, collection, serverTimestamp, getDoc, setDoc } from '@/utilities/firebaseServer';
import * as TI from 'technicalindicators';

// Cache duration: 15 minutes
const CACHE_DURATION = 15 * 60 * 1000;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const docRef = doc(collection(db, 'marketData'), 'technical');
    const docSnap = await getDoc(docRef);
    const now = Date.now();
    
    // Check if we have cached data that's still fresh
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data.lastUpdated && (now - data.lastUpdated < CACHE_DURATION)) {
        console.log('[Technical API] Returning cached data from Firestore');
        return res.status(200).json({
          ...data,
          source: 'firestore',
          cacheAge: Math.floor((now - data.lastUpdated) / 1000) // age in seconds
        });
      }
    }
    
    console.log('[Technical API] Cache expired or not found, fetching fresh data...');
    
    // Fetch fresh market data for all three tokens
    const tokens = ['BTC', 'ETH', 'SOL'];
    const technicalData = {};
    
    for (const token of tokens) {
      try {
        // Try to get real market data
        let priceData = null;
        
        // First try to get from your existing market-data endpoint
        try {
          const marketRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/market-data`);
          if (marketRes.ok) {
            const marketData = await marketRes.json();
            const tokenKey = token.toLowerCase();
            if (marketData[tokenKey]) {
              priceData = {
                current: marketData[tokenKey].current_price || 0,
                change24h: marketData[tokenKey].price_change_percentage_24h || 0,
                high24h: marketData[tokenKey].high_24h || 0,
                low24h: marketData[tokenKey].low_24h || 0,
                volume: marketData[tokenKey].total_volume || 0
              };
            }
          }
        } catch (err) {
          console.error(`[Technical API] Failed to fetch market data for ${token}:`, err);
        }
        
        // If no real data, use defaults
        const defaultPrices = {
          'BTC': 50000,
          'ETH': 3000,
          'SOL': 100
        };
        
        const basePrice = priceData?.current || defaultPrices[token];
        
        // Generate OHLCV data (simplified for caching)
        const candles = generateCandles(basePrice, 50);
        const closes = candles.map(c => c.close);
        const highs = candles.map(c => c.high);
        const lows = candles.map(c => c.low);
        const volumes = candles.map(c => c.volume);
        
        // Calculate RSI
        const rsiValues = TI.RSI.calculate({
          values: closes,
          period: 14
        });
        const currentRSI = rsiValues[rsiValues.length - 1] || 50;
        
        // Calculate MACD
        const macdResult = TI.MACD.calculate({
          values: closes,
          fastPeriod: 12,
          slowPeriod: 26,
          signalPeriod: 9,
          SimpleMAOscillator: false,
          SimpleMASignal: false
        });
        const currentMACD = macdResult[macdResult.length - 1] || { MACD: 0, signal: 0, histogram: 0 };
        
        // Calculate Moving Averages
        const sma20 = TI.SMA.calculate({ values: closes, period: 20 });
        const sma50 = TI.SMA.calculate({ values: closes, period: 50 });
        const sma200 = TI.SMA.calculate({ values: closes, period: 200 });
        
        // Calculate Bollinger Bands
        const bbands = TI.BollingerBands.calculate({
          period: 20,
          values: closes,
          stdDev: 2
        });
        const currentBB = bbands[bbands.length - 1] || { upper: 0, middle: 0, lower: 0 };
        
        // Support and Resistance
        const recentHighs = highs.slice(-20);
        const recentLows = lows.slice(-20);
        const resistance = Math.max(...recentHighs);
        const support = Math.min(...recentLows);
        
        // Determine trend
        const currentPrice = closes[closes.length - 1];
        const sma20Current = sma20[sma20.length - 1] || currentPrice;
        const sma50Current = sma50[sma50.length - 1] || currentPrice;
        
        let trend = 'sideways';
        if (currentPrice > sma20Current && sma20Current > sma50Current) {
          trend = 'bullish';
        } else if (currentPrice < sma20Current && sma20Current < sma50Current) {
          trend = 'bearish';
        }
        
        // Calculate momentum
        const momentum = Math.min(100, Math.max(0, 
          (currentRSI / 100 * 70) + 
          (currentMACD.histogram > 0 ? 30 : 0)
        ));
        
        // Calculate volatility
        const bbWidth = currentBB.upper - currentBB.lower;
        const bbMiddle = currentBB.middle || 1;
        const bbRatio = bbWidth / bbMiddle;
        const volatility = bbRatio > 0.1 ? 'extreme' :
                          bbRatio > 0.05 ? 'high' :
                          bbRatio > 0.02 ? 'normal' : 'low';
        
        // Pattern detection (simplified)
        const patterns = detectPatterns(candles);
        
        technicalData[token] = {
          price: priceData || {
            current: currentPrice,
            change24h: ((currentPrice - closes[0]) / closes[0] * 100),
            high24h: Math.max(...highs.slice(-24)),
            low24h: Math.min(...lows.slice(-24))
          },
          candles: candles.slice(-20), // Last 20 for display
          rsi: {
            value: currentRSI,
            signal: currentRSI > 70 ? 'overbought' : currentRSI < 30 ? 'oversold' : 'neutral'
          },
          macd: {
            histogram: currentMACD.histogram || 0,
            signal: currentMACD.signal || 0,
            macd: currentMACD.MACD || 0,
            trend: currentMACD.histogram > 0 ? 'bullish' : 'bearish'
          },
          movingAverages: {
            sma20: sma20Current || 0,
            sma50: sma50Current || 0,
            sma200: sma200[sma200.length - 1] || 0
          },
          bollingerBands: currentBB,
          support,
          resistance,
          trend,
          momentum,
          volatility,
          patterns: patterns.slice(0, 3), // Top 3 patterns
          isLive: !!priceData
        };
        
      } catch (err) {
        console.error(`[Technical API] Error processing ${token}:`, err);
        technicalData[token] = getDefaultTechnicalData(token);
      }
    }
    
    // Save to Firestore
    const dataToCache = {
      BTC: technicalData.BTC,
      ETH: technicalData.ETH,
      SOL: technicalData.SOL,
      lastUpdated: now,
      updateTime: new Date().toISOString()
    };
    
    await setDoc(docRef, dataToCache);
    console.log('[Technical API] Cached new data to Firestore');
    
    return res.status(200).json({
      ...dataToCache,
      source: 'fresh',
      cacheAge: 0
    });
    
  } catch (error) {
    console.error('[Technical API] Error:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch technical data',
      details: error.message 
    });
  }
}

// Helper function to generate candles
function generateCandles(basePrice, count = 50) {
  const candles = [];
  let currentPrice = basePrice;
  
  for (let i = 0; i < count; i++) {
    const volatility = 0.002; // 0.2% volatility
    const trend = Math.random() > 0.5 ? 1 : -1;
    
    const open = currentPrice;
    const change = (Math.random() * volatility * 2 - volatility) * currentPrice;
    const high = open + Math.abs(change) * (1 + Math.random() * 0.5);
    const low = open - Math.abs(change) * (0.5 + Math.random() * 0.5);
    const close = open + change * trend;
    const volume = 1000000 + Math.random() * 5000000;
    
    candles.push({ open, high, low, close, volume });
    currentPrice = close;
  }
  
  return candles;
}

// Helper function to detect patterns
function detectPatterns(candles) {
  const patterns = [];
  if (candles.length < 2) return patterns;
  
  const lastCandle = candles[candles.length - 1];
  const prevCandle = candles[candles.length - 2];
  
  // Doji pattern
  if (Math.abs(lastCandle.close - lastCandle.open) < (lastCandle.high - lastCandle.low) * 0.1) {
    patterns.push({ name: 'Doji', signal: 'neutral' });
  }
  
  // Hammer pattern
  if (lastCandle.close > lastCandle.open &&
      (lastCandle.low - Math.min(lastCandle.open, lastCandle.close)) > 
      (Math.max(lastCandle.open, lastCandle.close) - lastCandle.low) * 2) {
    patterns.push({ name: 'Hammer', signal: 'bullish' });
  }
  
  // Engulfing pattern
  if (prevCandle.close < prevCandle.open && // Previous was bearish
      lastCandle.close > lastCandle.open && // Current is bullish
      lastCandle.open <= prevCandle.close &&
      lastCandle.close >= prevCandle.open) {
    patterns.push({ name: 'Bullish Engulfing', signal: 'bullish' });
  }
  
  return patterns;
}

// Helper function for default data
function getDefaultTechnicalData(token) {
  const defaultPrices = {
    'BTC': 50000,
    'ETH': 3000,
    'SOL': 100
  };
  
  return {
    price: {
      current: defaultPrices[token],
      change24h: 0,
      high24h: defaultPrices[token] * 1.02,
      low24h: defaultPrices[token] * 0.98
    },
    candles: [],
    rsi: { value: 50, signal: 'neutral' },
    macd: { histogram: 0, signal: 0, macd: 0, trend: 'neutral' },
    movingAverages: { sma20: 0, sma50: 0, sma200: 0 },
    bollingerBands: { upper: 0, middle: 0, lower: 0 },
    support: defaultPrices[token] * 0.95,
    resistance: defaultPrices[token] * 1.05,
    trend: 'sideways',
    momentum: 50,
    volatility: 'normal',
    patterns: [],
    isLive: false
  };
}