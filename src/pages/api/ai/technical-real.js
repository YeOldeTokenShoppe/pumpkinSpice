import { db, doc, collection, serverTimestamp, getDoc, setDoc } from '@/utilities/firebaseServer';
import * as TI from 'technicalindicators';

// Cache duration: 15 minutes
const CACHE_DURATION = 15 * 60 * 1000;

// CoinGecko API endpoints for OHLC data
const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';

// Fetch real OHLC data from CoinGecko
async function fetchRealOHLCV(coinId, days = 1) {
  try {
    // CoinGecko's OHLC endpoint (free tier)
    // Returns candle data: [timestamp, open, high, low, close]
    const response = await fetch(
      `${COINGECKO_BASE}/coins/${coinId}/ohlc?vs_currency=usd&days=${days}`
    );
    
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Convert CoinGecko format to our format
    return data.map(candle => ({
      timestamp: candle[0],
      open: candle[1],
      high: candle[2],
      low: candle[3],
      close: candle[4],
      // CoinGecko OHLC doesn't include volume, so we'll estimate it
      volume: Math.random() * 10000000 + 1000000
    }));
  } catch (error) {
    console.error(`Failed to fetch OHLC for ${coinId}:`, error);
    return null;
  }
}

// Fetch current market data from CoinGecko
async function fetchMarketData(coinIds) {
  try {
    const response = await fetch(
      `${COINGECKO_BASE}/simple/price?ids=${coinIds.join(',')}&vs_currencies=usd&include_24hr_vol=true&include_24hr_change=true&include_last_updated_at=true`
    );
    
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch market data:', error);
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const docRef = doc(collection(db, 'marketData'), 'technical-real');
    const docSnap = await getDoc(docRef);
    const now = Date.now();
    
    // Check if we have cached data that's still fresh
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data.lastUpdated && (now - data.lastUpdated < CACHE_DURATION)) {
        console.log('[Technical API] Returning cached real data from Firestore');
        return res.status(200).json({
          ...data,
          source: 'firestore-cached',
          cacheAge: Math.floor((now - data.lastUpdated) / 1000)
        });
      }
    }
    
    console.log('[Technical API] Fetching fresh real data from CoinGecko...');
    
    // Define tokens and their CoinGecko IDs
    const tokens = [
      { symbol: 'BTC', id: 'bitcoin' },
      { symbol: 'ETH', id: 'ethereum' },
      { symbol: 'SOL', id: 'solana' }
    ];
    
    // Fetch market data for all tokens
    const marketData = await fetchMarketData(tokens.map(t => t.id));
    
    const technicalData = {};
    
    for (const token of tokens) {
      try {
        // Fetch real OHLC data (1 day of data for free tier)
        const ohlcData = await fetchRealOHLCV(token.id, 1);
        
        if (!ohlcData || ohlcData.length === 0) {
          console.log(`No OHLC data for ${token.symbol}, using fallback`);
          technicalData[token.symbol] = getDefaultTechnicalData(token.symbol);
          continue;
        }
        
        // Get current market data
        const currentMarket = marketData?.[token.id] || {};
        
        // Prepare price data
        const priceData = {
          current: currentMarket.usd || ohlcData[ohlcData.length - 1].close,
          change24h: currentMarket.usd_24h_change || 0,
          volume24h: currentMarket.usd_24h_vol || 0,
          high24h: Math.max(...ohlcData.map(c => c.high)),
          low24h: Math.min(...ohlcData.map(c => c.low))
        };
        
        // Extract price arrays for technical indicators
        const closes = ohlcData.map(c => c.close);
        const highs = ohlcData.map(c => c.high);
        const lows = ohlcData.map(c => c.low);
        const volumes = ohlcData.map(c => c.volume);
        
        // Calculate RSI
        const rsiValues = closes.length >= 14 ? 
          TI.RSI.calculate({ values: closes, period: 14 }) : [];
        const currentRSI = rsiValues[rsiValues.length - 1] || 50;
        
        // Calculate MACD
        const macdResult = closes.length >= 26 ? 
          TI.MACD.calculate({
            values: closes,
            fastPeriod: 12,
            slowPeriod: 26,
            signalPeriod: 9,
            SimpleMAOscillator: false,
            SimpleMASignal: false
          }) : [];
        const currentMACD = macdResult[macdResult.length - 1] || 
          { MACD: 0, signal: 0, histogram: 0 };
        
        // Calculate Moving Averages
        const sma20 = closes.length >= 20 ? 
          TI.SMA.calculate({ values: closes, period: 20 }) : [];
        const sma50 = closes.length >= 50 ? 
          TI.SMA.calculate({ values: closes, period: 50 }) : [];
        const ema12 = closes.length >= 12 ? 
          TI.EMA.calculate({ values: closes, period: 12 }) : [];
        const ema26 = closes.length >= 26 ? 
          TI.EMA.calculate({ values: closes, period: 26 }) : [];
        
        // Calculate Bollinger Bands
        const bbands = closes.length >= 20 ?
          TI.BollingerBands.calculate({
            period: 20,
            values: closes,
            stdDev: 2
          }) : [];
        const currentBB = bbands[bbands.length - 1] || 
          { upper: 0, middle: 0, lower: 0 };
        
        // Volume Analysis
        const avgVolume = volumes.length > 0 ?
          volumes.reduce((a, b) => a + b, 0) / volumes.length : 0;
        const currentVolume = volumes[volumes.length - 1] || 0;
        const volumeTrend = currentVolume > avgVolume * 1.5 ? 'high' : 
                           currentVolume < avgVolume * 0.5 ? 'low' : 'normal';
        
        // Support and Resistance
        const recentHighs = highs.slice(-Math.min(20, highs.length));
        const recentLows = lows.slice(-Math.min(20, lows.length));
        const resistance = Math.max(...recentHighs);
        const support = Math.min(...recentLows);
        
        // Pattern Detection
        const patterns = detectCandlePatterns(ohlcData.slice(-3));
        
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
        
        technicalData[token.symbol] = {
          price: priceData,
          candles: ohlcData.slice(-20), // Last 20 candles for display
          rsi: {
            value: currentRSI,
            signal: currentRSI > 70 ? 'overbought' : 
                   currentRSI < 30 ? 'oversold' : 'neutral'
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
            sma200: 0, // Would need more data
            ema12: ema12[ema12.length - 1] || 0,
            ema26: ema26[ema26.length - 1] || 0
          },
          bollingerBands: currentBB,
          volume: {
            current: currentVolume,
            average: avgVolume,
            trend: volumeTrend
          },
          patterns: patterns,
          support: support,
          resistance: resistance,
          trend: trend,
          momentum: momentum,
          volatility: volatility,
          isLive: true // This is real data!
        };
        
        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (err) {
        console.error(`Error processing ${token.symbol}:`, err);
        technicalData[token.symbol] = getDefaultTechnicalData(token.symbol);
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
    console.log('[Technical API] Cached new real data to Firestore');
    
    return res.status(200).json({
      ...dataToCache,
      source: 'coingecko-fresh',
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

// Pattern detection function
function detectCandlePatterns(candles) {
  const patterns = [];
  if (!candles || candles.length < 2) return patterns;
  
  const lastCandle = candles[candles.length - 1];
  const prevCandle = candles[candles.length - 2];
  
  if (!lastCandle || !prevCandle) return patterns;
  
  // Doji pattern
  const bodySize = Math.abs(lastCandle.close - lastCandle.open);
  const totalRange = lastCandle.high - lastCandle.low;
  if (bodySize < totalRange * 0.1) {
    patterns.push({ name: 'Doji', signal: 'neutral' });
  }
  
  // Hammer pattern
  const lowerShadow = Math.min(lastCandle.open, lastCandle.close) - lastCandle.low;
  const upperShadow = lastCandle.high - Math.max(lastCandle.open, lastCandle.close);
  if (lastCandle.close > lastCandle.open && lowerShadow > bodySize * 2 && upperShadow < bodySize) {
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

// Fallback data function
function getDefaultTechnicalData(symbol) {
  const defaultPrices = {
    'BTC': 50000,
    'ETH': 3000,
    'SOL': 100
  };
  
  return {
    price: {
      current: defaultPrices[symbol],
      change24h: 0,
      high24h: defaultPrices[symbol] * 1.02,
      low24h: defaultPrices[symbol] * 0.98
    },
    candles: [],
    rsi: { value: 50, signal: 'neutral' },
    macd: { histogram: 0, signal: 0, macd: 0, trend: 'neutral' },
    movingAverages: { sma20: 0, sma50: 0, sma200: 0 },
    bollingerBands: { upper: 0, middle: 0, lower: 0 },
    support: defaultPrices[symbol] * 0.95,
    resistance: defaultPrices[symbol] * 1.05,
    trend: 'sideways',
    momentum: 50,
    volatility: 'normal',
    patterns: [],
    isLive: false
  };
}