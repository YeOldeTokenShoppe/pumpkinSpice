// API route for fetching trending crypto topics from Firestore (cached data)
import { db } from '@/utilities/firebaseServer';
import { doc, getDoc } from 'firebase/firestore';

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('[Trending API] Fetching from Firestore...');
    
    // Check if Firestore is initialized
    if (!db) {
      console.error('[Trending API] Firestore not initialized');
      return res.status(200).json({
        topics: generateFallbackTopics(),
        polymarket: generateFallbackPolymarket(),
        source: 'fallback',
        message: 'Firestore not initialized',
        timestamp: new Date().toISOString()
      });
    }
    
    // Read from Firestore
    const trendingDoc = await getDoc(doc(db, 'market-data', 'trending'));
    
    if (trendingDoc.exists()) {
      const data = trendingDoc.data();
      console.log('[Trending API] Found Firestore data:', data);
      
      // Check if data is stale (older than 24 hours)
      const isStale = data.updatedAtMs && (Date.now() - data.updatedAtMs > 24 * 60 * 60 * 1000);
      
      if (isStale) {
        console.log('[Trending API] Data is stale, returning with warning');
      }
      
      return res.status(200).json({
        topics: data.topics || generateFallbackTopics(),
        polymarket: data.polymarket || null,
        source: data.source || 'firestore',
        updatedAt: data.updatedAtMs,
        isStale,
        timestamp: new Date().toISOString()
      });
    } else {
      console.log('[Trending API] No data in Firestore, returning fallback');
      return res.status(200).json({
        topics: generateFallbackTopics(),
        polymarket: generateFallbackPolymarket(),
        source: 'fallback',
        message: 'No data in Firestore yet',
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('[Trending API] Error fetching trending topics:', error);
    return res.status(200).json({ 
      topics: generateFallbackTopics(),
      polymarket: generateFallbackPolymarket(),
      source: 'fallback',
      error: error.message
    });
  }
}

function generateFallbackTopics() {
  return [];  // Return empty array instead of fake data
}

function generateFallbackPolymarket() {
  return null;  // Return null instead of fake data
}