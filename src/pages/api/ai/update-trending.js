// API route to update trending topics in Firestore (called by cron or manually)
// This should be called periodically (e.g., every 8 hours) to update the data
import { db } from '@/utilities/firebaseServer';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export default async function handler(req, res) {
  // Optional: Add authentication to prevent unauthorized updates
  // For now, you can call this manually or set up a cron job
  
  const grokApiKey = process.env.GROK_API_KEY;
  
  console.log('[Update Trending] Starting update process...');
  
  if (!grokApiKey) {
    console.error('[Update Trending] Grok API key not configured');
    return res.status(500).json({ error: 'Grok API key not configured' });
  }
  
  if (!db) {
    console.error('[Update Trending] Firestore not initialized');
    return res.status(500).json({ error: 'Firestore not initialized' });
  }

  try {
    console.log('[Update Trending] Calling Grok API...');
    
    // Call Grok API
    const grokResponse = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${grokApiKey}`
      },
      body: JSON.stringify({
        model: 'grok-3',
        messages: [
          {
            role: 'system',
            content: 'You are integrated with Polymarket data through the X platform. Access the live Polymarket markets and provide: 1) Top 4 trending crypto topics from X/Twitter with real engagement metrics. 2) The actual highest-volume crypto/finance market currently active on Polymarket (exclude sports and politics). Return as JSON: {"topics": [{"topic": "topic name", "sentiment": "bullish/bearish/neutral", "mentions": number}], "polymarket": {"title": "exact market title from Polymarket", "yes": current_yes_percentage, "no": current_no_percentage, "volume": "24hr_volume"}}.'
          },
          {
            role: 'user',
            content: 'Using your Polymarket integration, what is the current highest volume crypto or finance market on Polymarket right now? Also include current trending crypto topics from X.'
          }
        ],
        temperature: 0.2,  // Low temperature for factual data retrieval
        max_tokens: 300
      })
    });

    if (!grokResponse.ok) {
      const errorText = await grokResponse.text();
      console.error('[Update Trending] Grok API error:', grokResponse.status, errorText);
      return res.status(500).json({ error: 'Grok API error' });
    }

    const grokData = await grokResponse.json();
    console.log('[Update Trending] Grok response:', grokData);

    // Parse the response
    let topics = [];
    let polymarket = null;
    try {
      const content = grokData.choices?.[0]?.message?.content || '';
      // Try to find JSON object
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        topics = parsed.topics || [];
        polymarket = parsed.polymarket || null;
      } else {
        // Fallback: try to find array for topics
        const arrayMatch = content.match(/\[[\s\S]*\]/);
        if (arrayMatch) {
          topics = JSON.parse(arrayMatch[0]);
        }
      }
    } catch (parseError) {
      console.error('[Update Trending] Failed to parse Grok response:', parseError);
      // Return error instead of using fallback data
      return res.status(500).json({ 
        error: 'Failed to parse Grok response',
        details: parseError.message 
      });
    }

    // Ensure topics have the right format (but don't add fake mentions)
    topics = topics.map(topic => ({
      topic: topic.topic || 'Unknown',
      sentiment: topic.sentiment || 'neutral',
      mentions: topic.mentions || 0
    }));

    // Try to get real Polymarket data from top-binary endpoint
    try {
      const searchRes = await fetch('http://localhost:3000/api/polymarket/top-binary');
      if (searchRes.ok) {
        const searchData = await searchRes.json();
        if (searchData.success && searchData.markets && searchData.markets.length > 0) {
          // Use top 2 markets
          polymarket = {
            markets: searchData.markets.slice(0, 2),
            source: 'polymarket_real'
          };
          console.log('[Update Trending] Using top 2 Polymarket markets');
        }
      }
    } catch (err) {
      console.log('[Update Trending] Could not fetch Polymarket data:', err);
    }
    
    // If still no polymarket data, try AI prediction based on live price
    if (!polymarket) {
      try {
        const liveRes = await fetch('http://localhost:3000/api/polymarket/live-data');
        if (liveRes.ok) {
          const liveData = await liveRes.json();
          if (liveData.polymarket) {
            polymarket = liveData.polymarket;
            console.log('[Update Trending] Using AI prediction based on current BTC price');
          }
        }
      } catch (err) {
        console.log('[Update Trending] Could not fetch live data:', err);
      }
    }

    // Save to Firestore
    const trendingDoc = {
      topics,
      polymarket,
      source: 'grok',
      updatedAt: serverTimestamp(),
      updatedAtMs: Date.now() // For easier client-side calculations
    };

    await setDoc(doc(db, 'market-data', 'trending'), trendingDoc);
    console.log('[Update Trending] Successfully saved to Firestore');

    return res.status(200).json({ 
      success: true,
      topics,
      polymarket,
      message: 'Trending topics and Polymarket data updated successfully'
    });

  } catch (error) {
    console.error('[Update Trending] Error:', error);
    return res.status(500).json({ error: error.message });
  }
}