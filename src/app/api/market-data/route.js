import { NextResponse } from 'next/server';

// Cache data in memory with timestamp
let cachedData = null;
let cacheTime = null;
const CACHE_DURATION = 60000; // 1 minute cache

export async function GET() {
  try {
    // Return cached data if it's still fresh
    if (cachedData && cacheTime && (Date.now() - cacheTime < CACHE_DURATION)) {
      return NextResponse.json(cachedData);
    }
    const symbols = [
      { ticker: '^GSPC', name: 'S&P 500' },
      { ticker: '^IXIC', name: 'Nasdaq' },
      { ticker: '^DJI', name: 'Dow Jones' },
      { ticker: '^VIX', name: 'VIX' },
      { ticker: '^TNX', name: '10Y Treasury' },
      { ticker: 'DX-Y.NYB', name: 'DXY' },
      { ticker: 'GC=F', name: 'Gold' },
      { ticker: 'SI=F', name: 'Silver' },
      { ticker: 'CL=F', name: 'Oil' },
      { ticker: 'NG=F', name: 'Natural Gas' },
      { ticker: 'EURUSD=X', name: 'EUR/USD' }
    ];
    
    const promises = symbols.map(async ({ ticker, name }) => {
      try {
        const response = await fetch(
          `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}`,
          { 
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          }
        );
        const data = await response.json();
        
        if (data.chart && data.chart.result && data.chart.result[0]) {
          const quote = data.chart.result[0].meta;
          const regularMarketPrice = quote.regularMarketPrice;
          const previousClose = quote.previousClose || quote.chartPreviousClose;
          const changePercent = previousClose ? 
            ((regularMarketPrice - previousClose) / previousClose * 100) : 0;
          
          return {
            name,
            symbol: ticker,
            price: regularMarketPrice,
            changePercent: changePercent
          };
        }
        return null;
      } catch (error) {
        console.error(`Error fetching ${ticker}:`, error);
        return null;
      }
    });
    
    const results = await Promise.all(promises);
    const marketData = results.filter(item => item !== null);
    
    // Try to fetch Fear & Greed Index from alternative source
    try {
      const fgResponse = await fetch('https://api.alternative.me/fng/');
      const fgData = await fgResponse.json();
      
      if (fgData && fgData.data && fgData.data[0]) {
        const fearGreedValue = parseInt(fgData.data[0].value);
        let classification = '';
        
        if (fearGreedValue <= 25) classification = 'Extreme Fear';
        else if (fearGreedValue <= 45) classification = 'Fear';
        else if (fearGreedValue <= 55) classification = 'Neutral';
        else if (fearGreedValue <= 75) classification = 'Greed';
        else classification = 'Extreme Greed';
        
        marketData.push({
          name: 'Fear & Greed',
          symbol: 'F&G',
          price: fearGreedValue,
          changePercent: 0, // F&G doesn't have a change percent
          isSentiment: true,
          classification: classification
        });
      }
    } catch (error) {
      console.error('Error fetching Fear & Greed:', error);
    }
    
    // Cache the fresh data
    cachedData = marketData;
    cacheTime = Date.now();
    
    return NextResponse.json(marketData);
  } catch (error) {
    console.error('Error in market-data API:', error);
    return NextResponse.json({ error: 'Failed to fetch market data' }, { status: 500 });
  }
}