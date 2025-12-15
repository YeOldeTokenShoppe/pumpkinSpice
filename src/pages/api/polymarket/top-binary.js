// Fetch top binary markets from Polymarket sorted by 24hr volume
export default async function handler(req, res) {
  try {
    console.log('[Polymarket Top Binary] Fetching top binary markets...');
    
    // Query for binary markets, not closed
    const response = await fetch('https://gamma-api.polymarket.com/markets?market_type=binary&closed=false');
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const markets = await response.json();
    console.log('[Polymarket Top Binary] Got', markets.length, 'markets');
    
    // Focus on actionable trading markets - price movements, crypto events
    const cryptoFinanceKeywords = ['bitcoin', 'btc', 'ethereum', 'eth', 'crypto', 
                                   'solana', 'sol', 'bnb', 'xrp', 'ada', 'doge', 'avax',
                                   'reach', 'hit', 'above', 'below', 'price', 'ath',
                                   'microstrategy', 'mstr', 'coinbase', 'coin', 'binance',
                                   'tesla', 'tsla', 'nvidia', 'nvda', 'apple', 'aapl',
                                   'earnings', 'fomc', 'cpi', 'pce', 'jobs',
                                   'spot etf', 'sec', 'approve', 'launch'];
    
    const topMarkets = markets
      .filter(market => {
        // Skip if closed
        if (market.closed === true) {
          console.log(`[Polymarket] Skipping closed market: ${market.question || market.title}`);
          return false;
        }
        
        // Check if title contains crypto/finance keywords
        const title = (market.question || market.title || '').toLowerCase();
        const isCryptoFinance = cryptoFinanceKeywords.some(keyword => title.includes(keyword));
        
        // Must have volume
        const hasVolume = market.volume24hr > 0 || market.volume > 0;
        
        // Check if not resolved and has actionable odds
        let isActionable = false;
        if (market.outcomePrices) {
          try {
            const prices = JSON.parse(market.outcomePrices);
            if (prices.length === 2) {
              const p1 = parseFloat(prices[0]);
              const p2 = parseFloat(prices[1]);
              // Skip if completely resolved (100%)
              if (p1 === 1.0 || p2 === 1.0) {
                console.log(`[Polymarket] Skipping resolved market: ${market.question || market.title} (${Math.round(p1*100)}/${Math.round(p2*100)})`);
                isActionable = false;
              } else {
                // Consider actionable if at least one side is between 5% and 95%
                const minProb = Math.min(p1, p2);
                isActionable = minProb >= 0.05; // At least 5% on the low side
              }
            }
          } catch (e) {
            // Couldn't parse prices, include it
            isActionable = true;
          }
        } else {
          isActionable = true;
        }
        
        return isCryptoFinance && hasVolume && isActionable;
      })
      .sort((a, b) => {
        // Calculate actionability score based on volume and probability balance
        const calculateScore = (market) => {
          const vol = market.volume24hr || market.volume || 0;
          
          // Parse probabilities to calculate balance
          let probabilityBalance = 0;
          if (market.outcomePrices) {
            try {
              const prices = JSON.parse(market.outcomePrices);
              if (prices.length === 2) {
                const p1 = parseFloat(prices[0]);
                const p2 = parseFloat(prices[1]);
                // Score is higher when probabilities are more balanced (closer to 50/50)
                // Max score of 1 at 50/50, min score near 0 at 99/1
                const minProb = Math.min(p1, p2);
                probabilityBalance = minProb * 2; // Scale 0-0.5 to 0-1
              }
            } catch (e) {}
          }
          
          // Combine volume and balance (weight volume more heavily for trading relevance)
          // Add bonus for very high volume markets
          const volumeScore = vol > 100000 ? vol * 2 : vol;
          return volumeScore * (0.5 + probabilityBalance);
        };
        
        return calculateScore(b) - calculateScore(a);
      })
      .slice(0, 5)
      .map(market => {
        let yesPrice = null;
        let noPrice = null;
        
        // Extract prices
        if (market.outcomePrices) {
          try {
            const prices = JSON.parse(market.outcomePrices);
            if (prices.length === 2) {
              yesPrice = Math.round(parseFloat(prices[0]) * 100);
              noPrice = Math.round(parseFloat(prices[1]) * 100);
            }
          } catch (e) {
            console.log('[Polymarket Top Binary] Failed to parse prices:', e);
          }
        }
        
        return {
          title: market.question || market.title,
          yes: yesPrice,
          no: noPrice,
          volume: formatVolume(market.volume24hr || market.volume),
          volume24hr: market.volume24hr || 0,
          slug: market.slug,
          url: market.slug ? `https://polymarket.com/event/${market.slug}` : null
        };
      });

    if (topMarkets.length > 0) {
      return res.status(200).json({
        success: true,
        markets: topMarkets,
        topMarket: topMarkets[0]
      });
    } else {
      return res.status(200).json({
        success: false,
        message: 'No crypto/finance binary markets found'
      });
    }

  } catch (error) {
    console.error('[Polymarket Top Binary] Error:', error);
    return res.status(200).json({ 
      success: false,
      error: error.message
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