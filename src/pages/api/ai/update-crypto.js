// API route to update crypto prices in Firestore (called periodically)
import { db } from '@/utilities/firebaseServer';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export default async function handler(req, res) {
  console.log('[Update Crypto] Starting update process...');
  
  if (!db) {
    console.error('[Update Crypto] Firestore not initialized');
    return res.status(500).json({ error: 'Firestore not initialized' });
  }

  try {
    // Fetch current prices
    console.log('[Update Crypto] Fetching current prices...');
    const cryptoRes = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true'
    );
    
    let cryptoData = {
      bitcoin: { usd: 95000, usd_24h_change: 2.5 },
      ethereum: { usd: 3200, usd_24h_change: 3.2 }
    };
    
    if (cryptoRes.ok) {
      cryptoData = await cryptoRes.json();
      console.log('[Update Crypto] Current prices fetched:', cryptoData);
    } else {
      console.warn('[Update Crypto] Failed to fetch current prices, using fallback');
    }

    // Fetch global market data
    console.log('[Update Crypto] Fetching global market data...');
    const globalRes = await fetch('https://api.coingecko.com/api/v3/global');
    
    let globalData = {
      data: {
        market_cap_percentage: { btc: 52.3, eth: 16.8 },
        total_market_cap: { usd: 3400000000000 },
        total_volume: { usd: 145000000000 }
      }
    };
    
    if (globalRes.ok) {
      globalData = await globalRes.json();
      console.log('[Update Crypto] Global data fetched');
    } else {
      console.warn('[Update Crypto] Failed to fetch global data, using fallback');
    }

    // Fetch 24-hour historical data for sparklines
    console.log('[Update Crypto] Fetching historical data...');
    let btcHistory = [];
    let ethHistory = [];
    
    try {
      const [btcHistoryRes, ethHistoryRes] = await Promise.all([
        fetch('https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=1'),
        fetch('https://api.coingecko.com/api/v3/coins/ethereum/market_chart?vs_currency=usd&days=1')
      ]);
      
      if (btcHistoryRes.ok) {
        const btcHistoryData = await btcHistoryRes.json();
        btcHistory = btcHistoryData.prices?.slice(-24).map(p => p[1]) || [];
      }
      
      if (ethHistoryRes.ok) {
        const ethHistoryData = await ethHistoryRes.json();
        ethHistory = ethHistoryData.prices?.slice(-24).map(p => p[1]) || [];
      }
    } catch (err) {
      console.warn('[Update Crypto] Historical data fetch failed:', err.message);
    }

    // Save to Firestore
    const cryptoDoc = {
      btc: {
        price: cryptoData.bitcoin?.usd || 95000,
        change: cryptoData.bitcoin?.usd_24h_change || 2.5,
        history: btcHistory
      },
      eth: {
        price: cryptoData.ethereum?.usd || 3200,
        change: cryptoData.ethereum?.usd_24h_change || 3.2,
        history: ethHistory
      },
      dominance: {
        btc: globalData.data?.market_cap_percentage?.btc?.toFixed(1) || "52.3",
        eth: globalData.data?.market_cap_percentage?.eth?.toFixed(1) || "16.8"
      },
      totalMarketCap: globalData.data?.total_market_cap?.usd || 3400000000000,
      volume24h: globalData.data?.total_volume?.usd || 145000000000,
      updatedAt: serverTimestamp(),
      updatedAtMs: Date.now()
    };

    await setDoc(doc(db, 'market-data', 'crypto-prices'), cryptoDoc);
    console.log('[Update Crypto] Successfully saved to Firestore');

    return res.status(200).json({ 
      success: true,
      data: cryptoDoc,
      message: 'Crypto prices updated successfully'
    });

  } catch (error) {
    console.error('[Update Crypto] Error:', error);
    return res.status(500).json({ error: error.message });
  }
}