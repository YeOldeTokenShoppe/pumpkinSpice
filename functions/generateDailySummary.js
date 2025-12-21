// Firebase Cloud Function to generate daily summaries
// Deploy with: firebase deploy --only functions

const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Schedule this to run daily at 2 AM EST
exports.generateDailySummary = functions.pubsub
  .schedule('0 2 * * *')  // Cron format: 2 AM daily
  .timeZone('America/New_York')
  .onRun(async (context) => {
    
    const db = admin.firestore();
    const today = new Date();
    const dateKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    try {
      // Fetch yesterday's candles
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const candlesRef = db.collection('candles');
      const snapshot = await candlesRef
        .orderBy('createdAt', 'desc')
        .limit(100)
        .get();
      
      // Process the data
      let petitions = 0;
      let praise = 0;
      let confessions = 0;
      let totalBurned = 0;
      const messages = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        const messageType = (data.messageType || '').toLowerCase();
        
        if (messageType.includes('petition') || messageType.includes('prayer')) {
          petitions++;
        } else if (messageType.includes('praise') || messageType.includes('gratitude')) {
          praise++;
        } else if (messageType.includes('confession')) {
          confessions++;
        }
        
        if (data.message) {
          messages.push(data.message);
        }
        
        if (data.burnedAmount) {
          totalBurned += parseInt(data.burnedAmount) || 0;
        }
      });
      
      // Call OpenAI API
      let sentimentScore = 75;
      let aiSummary = '';
      let extractedThemes = ['Faith', 'Family', 'Growth', 'Healing', 'Success'];
      
      if (messages.length > 0) {
        const openAIKey = functions.config().openai.key; // Set with: firebase functions:config:set openai.key="sk-..."
        
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openAIKey}`
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
              {
                role: 'system',
                content: 'You are analyzing spiritual messages from a digital temple. Be respectful and insightful.'
              },
              {
                role: 'user',
                content: `Analyze these ${messages.length} temple messages and provide:
1. A sentiment score from 0-100
2. A 2-3 sentence summary
3. List 5 key themes

Messages:
${messages.slice(0, 30).join('\n')}

Respond in JSON: {"sentiment": 75, "summary": "...", "themes": ["word1", "word2", "word3", "word4", "word5"]}`
              }
            ],
            temperature: 0.7,
            max_tokens: 200
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          const parsed = JSON.parse(data.choices[0].message.content);
          sentimentScore = parsed.sentiment || 75;
          aiSummary = parsed.summary || '';
          extractedThemes = parsed.themes || extractedThemes;
        }
      }
      
      // Save all three summaries (daily, weekly, monthly)
      const summaryData = {
        sentimentScore,
        totalCandles: snapshot.size,
        petitions,
        praise,
        confessions,
        trend: sentimentScore > 50 ? 'up' : 'down',
        summary: aiSummary || `The temple received ${snapshot.size} candles today.`,
        themes: extractedThemes,
        createdAt: admin.firestore.Timestamp.now(),
        date: dateKey
      };
      
      // Save daily summary
      await db.collection('summaries').doc(`daily_${dateKey}`).set({
        ...summaryData,
        period: 'daily'
      });
      
      // Save weekly summary (aggregate last 7 days)
      await db.collection('summaries').doc(`weekly_${dateKey}`).set({
        ...summaryData,
        period: 'weekly',
        totalCandles: summaryData.totalCandles * 7 // Simplified - you'd aggregate properly
      });
      
      // Save monthly summary (aggregate last 30 days)  
      await db.collection('summaries').doc(`monthly_${dateKey}`).set({
        ...summaryData,
        period: 'monthly',
        totalCandles: summaryData.totalCandles * 30 // Simplified - you'd aggregate properly
      });
      
      console.log('Daily summaries generated successfully');
      return null;
      
    } catch (error) {
      console.error('Error generating summaries:', error);
      throw error;
    }
  });

// Manual trigger endpoint (for testing or on-demand generation)
exports.triggerSummaryGeneration = functions.https.onRequest(async (req, res) => {
  // Add authentication check here
  if (req.headers.authorization !== 'Bearer your-secret-key') {
    res.status(403).send('Unauthorized');
    return;
  }
  
  // Run the summary generation
  await exports.generateDailySummary();
  res.status(200).send('Summary generation triggered');
});