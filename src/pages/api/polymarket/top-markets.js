// Fetch top 3 markets by 24hr volume from Polymarket
export default async function handler(req, res) {
  try {
    console.log('[Polymarket] Fetching top markets by volume...');
    
    // Try the strapi API which the Polymarket website uses
    const response = await fetch('https://strapi-matic.poly.market/markets?active=true&_limit=50&_sort=volume24hr:desc', {
      headers: {
        'Accept': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json();
    
    // Sort by 24hr volume and get top 3
    const markets = (data || [])
      .filter(m => m.volume24hr > 0) // Only markets with volume
      .sort((a, b) => (b.volume24hr || 0) - (a.volume24hr || 0))
      .slice(0, 3)
      .map(market => ({
        title: market.question || market.title,
        volume: formatVolume(market.volume24hr),
        yes: Math.round((market.outcomePrices?.[0] || 0.5) * 100),
        no: Math.round((market.outcomePrices?.[1] || 0.5) * 100),
      }));

    // If we got markets, return the top one as primary
    if (markets.length > 0) {
      return res.status(200).json({
        success: true,
        topMarket: markets[0],
        allTopMarkets: markets
      });
    } else {
      // No markets found
      return res.status(200).json({
        success: false,
        topMarket: null,
        allTopMarkets: [],
        message: 'No active markets found'
      });
    }

  } catch (error) {
    console.error('[Polymarket] Error:', error);
    return res.status(200).json({ 
      success: false,
      topMarket: null,
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