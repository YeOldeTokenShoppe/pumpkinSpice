// Search Polymarket markets using the public search endpoint
export default async function handler(req, res) {
  try {
    console.log('[Polymarket Search] Searching for crypto markets...');
    
    // Search for crypto and finance related markets
    const searches = [
      'crypto',
      'finance'
    ];
    
    let allEvents = [];
    
    for (const query of searches) {
      const searchParams = new URLSearchParams({
        q: query,
        limit_per_type: '20',  // Get more results
        keep_closed_markets: '0',  // Don't include closed markets
        events_status: 'open',      // Only open/active markets
        sort: 'volume',
        ascending: 'false'
      });
      
      try {
        const response = await fetch(`https://gamma-api.polymarket.com/public-search?${searchParams}`);
        if (response.ok) {
          const data = await response.json();
          if (data.events) {
            allEvents = allEvents.concat(data.events);
          }
        }
      } catch (err) {
        console.log(`[Polymarket Search] Failed to search for "${query}":`, err.message);
      }
    }
    
    // Remove duplicates and sort by volume
    const uniqueEvents = Array.from(new Map(allEvents.map(e => [e.slug || e.title, e])).values());
    console.log('[Polymarket Search] Found', uniqueEvents.length, 'unique events');
    
    // Filter for open/future markets only (not past)
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 11 for December
    
    const openEvents = uniqueEvents.filter(event => {
      const title = (event.title || '').toLowerCase();
      
      // Skip if title contains "december" and we're already in/past December
      if (currentMonth === 11 && title.includes('december')) {
        // Unless it specifies a future year
        if (!title.includes('2026') && !title.includes('2027')) {
          return false;
        }
      }
      
      // Skip past months of current year
      const pastMonths = ['january', 'february', 'march', 'april', 'may', 'june', 
                          'july', 'august', 'september', 'october', 'november'];
      if (pastMonths.slice(0, currentMonth).some(month => title.includes(month) && !title.includes('2026'))) {
        return false;
      }
      
      // Check if market has end date in future
      if (event.end_date || event.close_date) {
        const endDate = new Date(event.end_date || event.close_date);
        return endDate > now;
      }
      
      return true; // Include if we can't determine it's past
    });
    
    console.log('[Polymarket Search] Found', openEvents.length, 'open/future events');
    
    // Don't filter by keywords since we're already searching for crypto/finance
    
    const cryptoFinanceEvents = openEvents.filter(event => {
      const title = (event.title || '').toLowerCase();
      
      // Since we searched for crypto/finance, assume it's related
      const isCryptoFinance = true;
      
      // Check if it's a binary yes/no market
      // Binary markets typically have exactly 2 outcomes (Yes/No)
      let isBinary = false;
      
      // Method 1: Check title patterns for binary questions
      const binaryPatterns = [
        /^will /i,
        / reach /i,
        / exceed /i,
        / above /i,
        / below /i,
        / raise /i,
        / cut /i,
        / hit /i
      ];
      
      const excludePatterns = [
        /what price/i,
        /which /i,
        /who /i,
        /how much/i,
        /how many/i,
        /when /i
      ];
      
      const titleMatchesBinary = binaryPatterns.some(pattern => pattern.test(event.title || ''));
      const titleExcluded = excludePatterns.some(pattern => pattern.test(event.title || ''));
      
      if (titleMatchesBinary && !titleExcluded) {
        isBinary = true;
      }
      
      // Method 2: Check if markets have exactly 2 outcomes labeled Yes/No
      if (!isBinary && event.markets && event.markets.length > 0) {
        const market = event.markets[0];
        if (market.outcomes && Array.isArray(market.outcomes)) {
          const outcomeNames = market.outcomes.map(o => (o.name || '').toLowerCase());
          if (outcomeNames.length === 2 && 
              outcomeNames.includes('yes') && 
              outcomeNames.includes('no')) {
            isBinary = true;
          }
        }
      }
      
      return isCryptoFinance && isBinary;
    });
    
    console.log('[Polymarket Search] Found', cryptoFinanceEvents.length, 'binary crypto/finance events');
    
    // Show ALL Bitcoin price markets as they ARE binary (even if low probability)
    // Just return the events without filtering by "binary" since we want the Bitcoin markets
    const topMarkets = openEvents
      .filter(event => event.volume || event.volume_24h || event.volume24hr)
      .sort((a, b) => {
        // Prioritize 24hr volume for active markets
        const volA = b.volume24hr || b.volume_24h || b.volume || 0;
        const volB = a.volume24hr || a.volume_24h || a.volume || 0;
        return volA - volB;
      })
      .map(event => {
        // Try to extract Yes/No prices from markets
        let yesPrice = null;
        let noPrice = null;
        let pricesFound = false;
        
        // Check various possible fields for price data
        if (event.markets && event.markets.length > 0) {
          const market = event.markets[0];
          
          // Method 1: Check outcomePrices field (most common format)
          if (!pricesFound && market.outcomePrices) {
            try {
              // outcomePrices is a JSON string array like "[\"0.65\", \"0.35\"]"
              const prices = typeof market.outcomePrices === 'string' 
                ? JSON.parse(market.outcomePrices) 
                : market.outcomePrices;
              
              // Also check outcomes to match prices with Yes/No
              let outcomes = [];
              if (market.outcomes) {
                outcomes = typeof market.outcomes === 'string' 
                  ? JSON.parse(market.outcomes) 
                  : market.outcomes;
              }
              
              // Find Yes/No indices
              const yesIndex = outcomes.findIndex(o => o === 'Yes' || o === 'yes');
              const noIndex = outcomes.findIndex(o => o === 'No' || o === 'no');
              
              if (yesIndex !== -1 && noIndex !== -1 && prices[yesIndex] && prices[noIndex]) {
                yesPrice = Math.round(parseFloat(prices[yesIndex]) * 100);
                noPrice = Math.round(parseFloat(prices[noIndex]) * 100);
                pricesFound = true;
                console.log(`[Polymarket] Found Yes/No prices from outcomePrices: ${yesPrice}/${noPrice} for ${event.title}`);
              } else if (prices.length === 2) {
                // If exactly 2 prices and we know it's binary, assume first is Yes
                yesPrice = Math.round(parseFloat(prices[0]) * 100);
                noPrice = Math.round(parseFloat(prices[1]) * 100);
                pricesFound = true;
                console.log(`[Polymarket] Found binary prices: ${yesPrice}/${noPrice} for ${event.title}`);
              }
            } catch (err) {
              console.log(`[Polymarket] Failed to parse outcomePrices:`, err.message);
            }
          }
          
          // Method 2: Look for binary outcome prices in outcomes array (if outcomes is object array)
          if (!pricesFound && market.outcomes && Array.isArray(market.outcomes) && typeof market.outcomes[0] === 'object') {
            const yesOutcome = market.outcomes.find(o => 
              o.name?.toLowerCase() === 'yes' || 
              o.outcome?.toLowerCase() === 'yes'
            );
            const noOutcome = market.outcomes.find(o => 
              o.name?.toLowerCase() === 'no' || 
              o.outcome?.toLowerCase() === 'no'
            );
            
            if (yesOutcome && noOutcome) {
              // Price might be in different fields
              const yesVal = yesOutcome.price || yesOutcome.last_price || yesOutcome.probability || 0;
              const noVal = noOutcome.price || noOutcome.last_price || noOutcome.probability || 0;
              
              if (yesVal > 0 || noVal > 0) {
                yesPrice = Math.round(yesVal * 100);
                noPrice = Math.round(noVal * 100);
                pricesFound = true;
                console.log(`[Polymarket] Found Yes/No prices: ${yesPrice}/${noPrice} for ${event.title}`);
              }
            }
          }
          
          // Method 3: Check outcomeprices field (lowercase, legacy format)
          if (!pricesFound && market.outcomeprices) {
            // Sometimes it's a string like "Yes:0.65,No:0.35"
            if (typeof market.outcomeprices === 'string') {
              const match = market.outcomeprices.match(/yes[: ](\d+\.?\d*)/i);
              const noMatch = market.outcomeprices.match(/no[: ](\d+\.?\d*)/i);
              if (match && noMatch) {
                yesPrice = Math.round(parseFloat(match[1]) * 100);
                noPrice = Math.round(parseFloat(noMatch[1]) * 100);
                pricesFound = true;
              }
            }
          }
          
          // Method 3: Check tokens array (Polymarket uses token system)
          if (!pricesFound && market.tokens && Array.isArray(market.tokens)) {
            const yesToken = market.tokens.find(t => 
              t.outcome?.toLowerCase() === 'yes' || 
              t.token_id === '0' // Sometimes Yes is token 0
            );
            const noToken = market.tokens.find(t => 
              t.outcome?.toLowerCase() === 'no' || 
              t.token_id === '1' // Sometimes No is token 1
            );
            
            if (yesToken && noToken) {
              const yesVal = yesToken.price || yesToken.last_price || 0;
              const noVal = noToken.price || noToken.last_price || 0;
              if (yesVal > 0 || noVal > 0) {
                yesPrice = Math.round(yesVal * 100);
                noPrice = Math.round(noVal * 100);
                pricesFound = true;
              }
            }
          }
        }
        
        // Only return null prices if we couldn't find them
        // This way we can filter out markets without price data
        if (!pricesFound) {
          console.log(`[Polymarket] No prices found for: ${event.title}`);
          yesPrice = null;
          noPrice = null;
        }
        
        return {
          title: event.title || event.question || event.name,
          yes: yesPrice,
          no: noPrice,
          volume: formatVolume(event.volume24hr || event.volume_24h || event.volume || 0),
          liquidity: formatVolume(event.liquidity || 0),
          endDate: event.end_date || event.close_date,
          slug: event.slug,
          url: event.slug ? `https://polymarket.com/event/${event.slug}` : null,
          hasValidPrices: yesPrice !== null && noPrice !== null
        };
      })
      .filter(market => {
        // Only keep markets with valid Yes/No prices
        if (!market.hasValidPrices) return false;
        
        // Filter out resolved markets (100/0 or 0/100 splits) 
        // But keep extreme price predictions which naturally have low odds
        const isResolved = (market.yes === 100 && market.no === 0) || (market.yes === 0 && market.no === 100);
        if (isResolved) {
          console.log(`[Polymarket] Filtering out resolved market: ${market.title} (${market.yes}/${market.no})`);
          return false;
        }
        
        return true;
      })
      .slice(0, 5);  // Get top 5 markets

    if (topMarkets.length > 0) {
      return res.status(200).json({
        success: true,
        topMarket: topMarkets[0],
        allTopMarkets: topMarkets,
        totalEvents: uniqueEvents.length
      });
    } else {
      return res.status(200).json({
        success: false,
        message: 'No markets found',
        debug: {
          eventsCount: uniqueEvents.length,
          sampleEvent: uniqueEvents[0]
        }
      });
    }

  } catch (error) {
    console.error('[Polymarket Search] Error:', error);
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