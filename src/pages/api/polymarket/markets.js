// Fetch top crypto/finance markets from Polymarket API
export default async function handler(req, res) {
  try {
    console.log('[Polymarket API] Fetching markets...');
    
    // Polymarket's public API endpoint for fetching markets
    // Using the gamma markets API from the docs
    const baseUrl = 'https://gamma-api.polymarket.com';
    
    // Fetch markets - gamma API has different parameters
    const marketsRes = await fetch(`${baseUrl}/markets`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    });

    if (!marketsRes.ok) {
      console.error('[Polymarket API] Failed to fetch markets:', marketsRes.status);
      return res.status(500).json({ error: 'Failed to fetch Polymarket data' });
    }

    const response = await marketsRes.json();
    
    // The response has a 'data' field containing the markets array
    const marketsArray = response.data || [];
    
    console.log('[Polymarket API] Fetched', marketsArray.length, 'markets');
    
    // Log first market structure to understand the data
    if (marketsArray.length > 0) {
      console.log('[Polymarket API] Sample market:', JSON.stringify(marketsArray[0], null, 2).substring(0, 1000));
    }

    // Filter for crypto/finance related markets (exclude sports)
    const cryptoKeywords = ['bitcoin', 'btc', 'ethereum', 'eth', 'crypto', 'defi', 'nft', 'solana', 'sol', 
                           'binance', 'coinbase', 'usdc', 'usdt', 'stablecoin', 'dao', 'web3', 
                           'blockchain', 'token', 'price', 'market cap', 'interest rate', 
                           'inflation', 'fed', 'economy', 'recession', 'stock', 'nasdaq', 's&p', 
                           'treasury', 'gdp', 'unemployment', 'commodity', 'oil', 'gold'];
    
    const sportsKeywords = ['nba', 'nfl', 'mlb', 'nhl', 'ncaa', 'game', 'match', 'vs.', 'win', 
                           'league', 'team', 'player', 'score', 'championship', 'tournament'];
    
    const filteredMarkets = marketsArray.filter(market => {
      if (!market.question) return false;
      
      const title = market.question.toLowerCase();
      const description = (market.description || '').toLowerCase();
      
      // Check if it's sports
      const isSports = sportsKeywords.some(keyword => title.includes(keyword));
      if (isSports) return false;
      
      // Check if it's crypto/finance related
      const isCrypto = cryptoKeywords.some(keyword => 
        title.includes(keyword) || description.includes(keyword)
      );
      
      return isCrypto && market.active && !market.closed;
    });

    console.log('[Polymarket API] Found', filteredMarkets.length, 'crypto/finance markets');

    // Get the top market by volume
    const topMarket = filteredMarkets[0];
    
    if (topMarket) {
      // Format the response
      // Markets have a tokens array with outcome and price
      let yesPrice = 50;
      let noPrice = 50;
      
      if (topMarket.tokens && Array.isArray(topMarket.tokens)) {
        // Find Yes/No tokens
        const yesToken = topMarket.tokens.find(t => 
          t.outcome && (t.outcome.toLowerCase() === 'yes' || t.outcome.toLowerCase().includes('yes'))
        );
        const noToken = topMarket.tokens.find(t => 
          t.outcome && (t.outcome.toLowerCase() === 'no' || t.outcome.toLowerCase().includes('no'))
        );
        
        if (yesToken && noToken) {
          yesPrice = Math.round((yesToken.price || 0.5) * 100);
          noPrice = Math.round((noToken.price || 0.5) * 100);
        } else if (topMarket.tokens.length >= 2) {
          // If not Yes/No, use first two outcomes
          yesPrice = Math.round((topMarket.tokens[0].price || 0.5) * 100);
          noPrice = Math.round((topMarket.tokens[1].price || 0.5) * 100);
        }
      }
      
      const formattedMarket = {
        title: topMarket.question,
        yes: yesPrice,
        no: noPrice,
        volume: formatVolume(topMarket.volume || topMarket.volume_24hr || 0),
        endDate: topMarket.end_date_iso || topMarket.game_start_time,
        liquidity: formatVolume(topMarket.liquidity || 0),
        markets: filteredMarkets.slice(0, 5).map(m => ({
          title: m.question || m.title,
          volume: formatVolume(m.volume24hr || m.volume || 0)
        }))
      };

      return res.status(200).json({
        success: true,
        market: formattedMarket,
        totalMarkets: filteredMarkets.length
      });
    } else {
      // Fallback if no crypto markets found
      return res.status(200).json({
        success: false,
        market: null,
        message: 'No crypto/finance markets found'
      });
    }

  } catch (error) {
    console.error('[Polymarket API] Error:', error);
    return res.status(500).json({ 
      error: error.message,
      details: 'Failed to fetch Polymarket data'
    });
  }
}

function formatVolume(volume) {
  if (!volume) return '$0';
  if (volume >= 1000000) {
    return `$${(volume / 1000000).toFixed(1)}M`;
  } else if (volume >= 1000) {
    return `$${Math.round(volume / 1000)}k`;
  }
  return `$${Math.round(volume)}`;
}