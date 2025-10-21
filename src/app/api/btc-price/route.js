import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiKey = process.env.NEXT_PUBLIC_COINMARKETCAP;
    
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    // CoinMarketCap Bitcoin and Ethereum price endpoint
    const response = await fetch('https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=BTC,ETH', {
      method: 'GET',
      headers: {
        'X-CMC_PRO_API_KEY': apiKey,
        'Accept': 'application/json',
      }
    });

    if (!response.ok) {
      console.error('CMC API error:', response.status, response.statusText);
      return NextResponse.json({ error: 'Failed to fetch from CoinMarketCap' }, { status: response.status });
    }

    const data = await response.json();
    
    // Extract BTC and ETH prices
    const btcData = data.data.BTC;
    const ethData = data.data.ETH;
    
    const btcPrice = btcData.quote.USD.price;
    const ethPrice = ethData.quote.USD.price;
    
    const formattedBtcPrice = `$${Math.round(btcPrice).toLocaleString()}`;
    const formattedEthPrice = `$${Math.round(ethPrice).toLocaleString()}`;
    
    return NextResponse.json({ 
      btc: formattedBtcPrice,
      eth: formattedEthPrice
    });
  } catch (error) {
    console.error('Error fetching BTC price:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}