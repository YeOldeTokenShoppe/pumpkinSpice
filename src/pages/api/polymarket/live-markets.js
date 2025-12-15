// Fetch top markets from Polymarket's data API
export default async function handler(req, res) {
  try {
    console.log('[Polymarket] Trying data-api endpoint...');
    
    // Try the data API endpoint
    const response = await fetch('https://data-api.polymarket.com/markets', {
      headers: {
        'Accept': 'application/json',
      }
    });

    console.log('[Polymarket] Response status:', response.status);
    
    if (!response.ok) {
      // If that doesn't work, try without /markets
      const response2 = await fetch('https://data-api.polymarket.com/', {
        headers: {
          'Accept': 'application/json',
        }
      });
      
      if (!response2.ok) {
        throw new Error(`API returned ${response2.status}`);
      }
      
      const text = await response2.text();
      return res.status(200).json({
        success: false,
        message: 'Got response but unclear structure',
        preview: text.substring(0, 500)
      });
    }

    const data = await response.json();
    console.log('[Polymarket] Data type:', typeof data, 'Keys:', Object.keys(data).slice(0, 10));
    
    // Try to extract markets from the response
    const markets = Array.isArray(data) ? data : (data.data || data.markets || []);
    
    // Sort by volume and get top 3
    const topMarkets = markets
      .filter(m => m.volume || m.volume24hr || m.volume_24h)
      .sort((a, b) => {
        const volA = b.volume || b.volume24hr || b.volume_24h || 0;
        const volB = a.volume || a.volume24hr || a.volume_24h || 0;
        return volA - volB;
      })
      .slice(0, 3)
      .map(market => ({
        title: market.question || market.title || market.market_title,
        volume: formatVolume(market.volume || market.volume24hr || market.volume_24h),
        yes: Math.round((market.yes_price || market.outcomePrices?.[0] || 0.5) * 100),
        no: Math.round((market.no_price || market.outcomePrices?.[1] || 0.5) * 100),
      }));

    if (topMarkets.length > 0) {
      return res.status(200).json({
        success: true,
        topMarket: topMarkets[0],
        allTopMarkets: topMarkets
      });
    } else {
      return res.status(200).json({
        success: false,
        message: 'No markets with volume found',
        sampleData: markets.slice(0, 2)
      });
    }

  } catch (error) {
    console.error('[Polymarket] Error:', error);
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