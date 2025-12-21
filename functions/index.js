/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {setGlobalOptions} = require("firebase-functions");
const {onRequest} = require("firebase-functions/v2/https");
const {onSchedule} = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");
const fetch = require("node-fetch");

// For a once-daily summary function, we only need 1 instance
setGlobalOptions({ maxInstances: 1 });

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// Manual trigger for testing the summary generation
exports.generateSummaryManual = onRequest(async (request, response) => {
  const db = admin.firestore();
  const today = new Date();
  const dateKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  
  try {
    // Fetch recent candles
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
      } else if (messageType.includes('praise') || messageType.includes('gratitude') || messageType.includes('thanks')) {
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
    
    // Try multiple ways to get the API key
    const openAIKey = process.env.OPENAI_API_KEY || 
                      process.env.openai_key || 
                      (require("firebase-functions").config().openai && require("firebase-functions").config().openai.key);
    
    if (messages.length > 0 && openAIKey) {
      console.log('Using OpenAI to analyze messages...');
      
      const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
1. A sentiment score from 0-100 using this criteria:
   - 90-100: Overwhelming gratitude, joy, celebration, answered prayers
   - 70-89: Mostly positive, hopeful, thankful, optimistic
   - 50-69: Mixed emotions, seeking guidance, neutral tone
   - 30-49: Struggling, worried, seeking help, challenges mentioned
   - 0-29: Despair, crisis, urgent pleas, deep suffering
   
2. A 2-3 sentence summary capturing the overall spiritual mood and key concerns

3. List 5 key themes (single words like: Gratitude, Health, Family, Finance, Love, Faith, Success, Healing, Protection, Guidance)

Messages:
${messages.slice(0, 30).join('\n')}

Respond in JSON: {"sentiment": 75, "summary": "...", "themes": ["word1", "word2", "word3", "word4", "word5"]}`
            }
          ],
          temperature: 0.7,
          max_tokens: 200
        })
      });
      
      if (aiResponse.ok) {
        const data = await aiResponse.json();
        try {
          const parsed = JSON.parse(data.choices[0].message.content);
          sentimentScore = parsed.sentiment || 75;
          aiSummary = parsed.summary || '';
          extractedThemes = parsed.themes || extractedThemes;
        } catch (e) {
          console.log('Could not parse AI response');
        }
      } else {
        console.log('OpenAI response not OK:', aiResponse.status);
      }
    } else {
      console.log('Skipping OpenAI:', {
        hasMessages: messages.length > 0,
        hasKey: !!openAIKey
      });
    }
    
    // Prepare summary data
    const summaryData = {
      sentimentScore,
      totalCandles: snapshot.size,
      petitions,
      praise,
      confessions,
      trend: sentimentScore > 50 ? 'up' : 'down',
      summary: aiSummary || `The temple received ${snapshot.size} candles today. ${praise > petitions ? 'Gratitude dominates.' : 'Many seek guidance.'}`,
      themes: extractedThemes,
      createdAt: admin.firestore.Timestamp.now(),
      date: dateKey,
      period: 'daily'
    };
    
    // Save to Firestore
    await db.collection('summaries').doc(`daily_${dateKey}`).set(summaryData);
    
    // Return the summary data
    response.status(200).json({
      message: 'Summary generated successfully',
      data: summaryData
    });
    
  } catch (error) {
    console.error('Error generating summary:', error);
    response.status(500).json({
      error: 'Failed to generate summary',
      details: error.message
    });
  }
});

// Scheduled function - runs daily at 2 AM EST
exports.generateDailySummary = onSchedule({
  schedule: 'every day 02:00',
  timeZone: 'America/New_York',
}, async (event) => {
  // Same logic as manual trigger
  console.log('Running scheduled daily summary generation');
  // Add the same summary generation code here
});

