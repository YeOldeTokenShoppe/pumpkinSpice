const functions = require('firebase-functions/v2');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const admin = require('firebase-admin');
const fetch = require('node-fetch');

// This function runs every 15 minutes to update technical data
exports.updateTechnicalData = onSchedule({
  schedule: 'every 15 minutes',
  timeZone: 'America/Los_Angeles',
  retryCount: 3,
}, async (context) => {
  console.log('[Scheduled] Starting technical data update...');
  
  const db = admin.firestore();
  const now = Date.now();
  
  try {
    // Fetch the technical data using your API logic
    // You can either duplicate the logic here or call your API endpoint
    const baseUrl = process.env.FUNCTION_URL || 'https://your-project.web.app';
    
    // For simplicity, we'll call the API endpoint
    const response = await fetch(`${baseUrl}/api/ai/technical?forceRefresh=true`);
    
    if (response.ok) {
      console.log('[Scheduled] Successfully updated technical data via API');
    } else {
      console.error('[Scheduled] Failed to update via API, updating directly...');
      
      // Fallback: Update directly in the function
      const technicalData = await generateTechnicalData();
      
      await db.collection('marketData').doc('technical').set({
        ...technicalData,
        lastUpdated: now,
        updateTime: new Date().toISOString(),
        source: 'scheduled_function'
      });
      
      console.log('[Scheduled] Technical data updated directly in Firestore');
    }
    
    return null;
  } catch (error) {
    console.error('[Scheduled] Error updating technical data:', error);
    throw error;
  }
});

// Helper function to generate technical data
async function generateTechnicalData() {
  // This is a simplified version - in production, you'd fetch real data
  const tokens = ['BTC', 'ETH', 'SOL'];
  const technicalData = {};
  
  const defaultPrices = {
    'BTC': 50000,
    'ETH': 3000,
    'SOL': 100
  };
  
  for (const token of tokens) {
    const basePrice = defaultPrices[token];
    
    // Generate some mock technical data
    technicalData[token] = {
      price: {
        current: basePrice * (0.95 + Math.random() * 0.1),
        change24h: (Math.random() * 10 - 5),
        high24h: basePrice * 1.05,
        low24h: basePrice * 0.95
      },
      rsi: {
        value: 30 + Math.random() * 40,
        signal: 'neutral'
      },
      macd: {
        histogram: Math.random() * 0.02 - 0.01,
        signal: 0,
        macd: 0,
        trend: Math.random() > 0.5 ? 'bullish' : 'bearish'
      },
      trend: Math.random() > 0.5 ? 'bullish' : Math.random() > 0.5 ? 'bearish' : 'sideways',
      momentum: Math.random() * 100,
      volatility: 'normal',
      support: basePrice * 0.95,
      resistance: basePrice * 1.05,
      patterns: [],
      isLive: false
    };
  }
  
  return technicalData;
}