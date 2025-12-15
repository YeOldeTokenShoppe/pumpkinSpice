// Client API endpoint to fetch cached crypto data from Firestore
import { db } from '@/utilities/firebaseServer';
import { doc, getDoc } from 'firebase/firestore';

export default async function handler(req, res) {
  try {
    console.log('[Crypto API] Fetching cached data from Firestore...');
    
    if (!db) {
      console.error('[Crypto API] Firestore not initialized');
      // Return fallback data
      return res.status(200).json({
        source: 'fallback',
        btc: { price: 95000, change: 2.5, history: [] },
        eth: { price: 3200, change: 3.2, history: [] },
        dominance: { btc: "52.3", eth: "16.8" },
        totalMarketCap: 3400000000000,
        volume24h: 145000000000,
        error: 'Database not initialized'
      });
    }

    const docRef = doc(db, 'market-data', 'crypto-prices');
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      console.log('[Crypto API] Found cached data');
      
      // Check if data is stale (older than 15 minutes)
      const isStale = data.updatedAtMs && (Date.now() - data.updatedAtMs > 900000);
      
      return res.status(200).json({
        ...data,
        source: 'firestore',
        isStale
      });
    } else {
      console.log('[Crypto API] No cached data found, returning fallback');
      
      // Return fallback data
      return res.status(200).json({
        source: 'fallback',
        btc: { price: 95000, change: 2.5, history: [] },
        eth: { price: 3200, change: 3.2, history: [] },
        dominance: { btc: "52.3", eth: "16.8" },
        totalMarketCap: 3400000000000,
        volume24h: 145000000000,
        error: 'No cached data available'
      });
    }
  } catch (error) {
    console.error('[Crypto API] Error fetching data:', error);
    
    // Return fallback data on error
    return res.status(200).json({
      source: 'fallback',
      btc: { price: 95000, change: 2.5, history: [] },
      eth: { price: 3200, change: 3.2, history: [] },
      dominance: { btc: "52.3", eth: "16.8" },
      totalMarketCap: 3400000000000,
      volume24h: 145000000000,
      error: error.message
    });
  }
}