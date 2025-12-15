// Fetch binary markets from Polymarket
export default async function handler(req, res) {
  try {
    console.log('[Polymarket Binary] Fetching binary markets...');
    
    // Fetch markets sorted by volume
    const response = await fetch('https://gamma-api.polymarket.com/markets?active=true&order=volume24hr&ascending=false&limit=50');
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const markets = await response.json();
    console.log('[Polymarket Binary] Got', markets.length, 'markets');
    
    // Filter for binary markets with good trading activity
    const binaryMarkets = markets
      .filter(market => {
        // Check if it's a binary market (has exactly 2 outcomes)
        if (!market.outcomes || market.outcomes !== 2) {
          return false;
        }
        
        // Must have volume
        if (!market.volume24hr && !market.volume) {
          return false;
        }
        
        // Must not be resolved (check outcome prices)
        if (market.outcomePrices) {
          try {
            const prices = JSON.parse(market.outcomePrices);
            if (prices.length === 2) {
              const p1 = parseFloat(prices[0]);
              const p2 = parseFloat(prices[1]);
              // Skip if one side is > 99%
              if (p1 > 0.99 || p2 > 0.99) {
                return false;
              }
            }
          } catch (e) {
            // Couldn't parse prices
          }
        }
        
        return true;
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
            console.log('[Polymarket Binary] Failed to parse prices:', e);
          }
        }
        
        return {
          title: market.question || market.title,
          yes: yesPrice,
          no: noPrice,
          volume: formatVolume(market.volume24hr || market.volume),
          slug: market.slug,
          url: market.slug ? `https://polymarket.com/event/${market.slug}` : null
        };
      })
      .filter(m => m.yes !== null && m.no !== null);

    if (binaryMarkets.length > 0) {
      return res.status(200).json({
        success: true,
        markets: binaryMarkets
      });
    } else {
      // Try a different endpoint - the events endpoint
      console.log('[Polymarket Binary] Trying events endpoint...');
      
      const eventsRes = await fetch('https://gamma-api.polymarket.com/events?active=true&order=volume&ascending=false&limit=20');
      
      if (eventsRes.ok) {
        const events = await eventsRes.json();
        
        const topBinaryEvents = events
          .filter(event => event.markets && event.markets.length > 0)
          .map(event => {
            const market = event.markets[0];
            
            let yesPrice = null;
            let noPrice = null;
            
            // Check if it has binary outcomes
            if (market.outcomes) {
              const outcomes = typeof market.outcomes === 'string' 
                ? JSON.parse(market.outcomes) 
                : market.outcomes;
              
              if (outcomes.length === 2 && outcomes.includes('Yes') && outcomes.includes('No')) {
                // It's binary, get prices
                if (market.outcomePrices) {
                  try {
                    const prices = typeof market.outcomePrices === 'string' 
                      ? JSON.parse(market.outcomePrices) 
                      : market.outcomePrices;
                    
                    const yesIndex = outcomes.indexOf('Yes');
                    const noIndex = outcomes.indexOf('No');
                    
                    if (prices[yesIndex] && prices[noIndex]) {
                      yesPrice = Math.round(parseFloat(prices[yesIndex]) * 100);
                      noPrice = Math.round(parseFloat(prices[noIndex]) * 100);
                      
                      // Skip resolved markets
                      if (yesPrice >= 99 || noPrice >= 99) {
                        return null;
                      }
                    }
                  } catch (e) {
                    console.log('[Polymarket Binary] Failed to parse event prices:', e);
                  }
                }
              }
            }
            
            if (yesPrice === null || noPrice === null) {
              return null;
            }
            
            return {
              title: market.question || event.title,
              yes: yesPrice,
              no: noPrice,
              volume: formatVolume(event.volume24hr || market.volume24hr || event.volume || market.volume),
              slug: event.slug,
              url: event.slug ? `https://polymarket.com/event/${event.slug}` : null
            };
          })
          .filter(m => m !== null)
          .slice(0, 3);
        
        if (topBinaryEvents.length > 0) {
          return res.status(200).json({
            success: true,
            markets: topBinaryEvents
          });
        }
      }
      
      return res.status(200).json({
        success: false,
        message: 'No binary markets found'
      });
    }

  } catch (error) {
    console.error('[Polymarket Binary] Error:', error);
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