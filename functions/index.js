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
const {defineSecret} = require("firebase-functions/params");
const admin = require("firebase-admin");
const fetch = require("node-fetch");

// Define the secret for OpenAI API key
const openaiSecret = defineSecret("OPENAI_SECRET_KEY");

// For a once-daily summary function, we only need 1 instance
setGlobalOptions({ maxInstances: 1 });

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// Manual trigger for testing the summary generation
exports.generateSummaryManual = onRequest({
  secrets: ["OPENAI_SECRET_KEY"]
}, async (request, response) => {
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
    let extractedThemes = ['Success', 'Growth', 'Community', 'Prosperity', 'Wellness'];
    
    // Get the API key from environment variables (for v2 functions)
    const openAIKey = (process.env.OPENAI_SECRET_KEY || 
                      process.env.OPENAI_API_KEY || '').trim();
    
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
              content: 'You are analyzing messages from users expressing hopes and aspirations. Be respectful and insightful.'
            },
            {
              role: 'user',
              content: `Analyze these ${messages.length} user messages and provide:
1. A sentiment score from 0-100 using this criteria:
   - 90-100: Overwhelming gratitude, joy, celebration, success stories
   - 70-89: Mostly positive, hopeful, thankful, optimistic
   - 50-69: Mixed emotions, seeking guidance, neutral tone
   - 30-49: Struggling, worried, seeking help, challenges mentioned
   - 0-29: Despair, crisis, urgent pleas, deep suffering
   
2. A 2-3 sentence summary capturing the overall spiritual mood and key concerns

3. List 5 key themes (single words like: Gratitude, Health, Wealth, Finance, Love, Success, Wellness, Growth, Career, Community)

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
      summary: aiSummary || `The platform received ${snapshot.size} candles today. ${praise > petitions ? 'Gratitude and celebration dominate.' : 'Many are seeking support and guidance.'}`,
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
  secrets: ["OPENAI_SECRET_KEY"]
}, async (event) => {
  console.log('Running scheduled daily summary generation');
  
  const db = admin.firestore();
  const today = new Date();
  const dateKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  
  try {
    // Fetch recent candles (last 24 hours for daily)
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
    let extractedThemes = ['Success', 'Growth', 'Community', 'Prosperity', 'Wellness'];
    
    const openAIKey = (process.env.OPENAI_SECRET_KEY || 
                      process.env.OPENAI_API_KEY || '').trim();
    
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
              content: 'You are analyzing messages from users expressing hopes and aspirations. Be respectful and insightful.'
            },
            {
              role: 'user',
              content: `Analyze these ${messages.length} user messages and provide:
1. A sentiment score from 0-100 using this criteria:
   - 90-100: Overwhelming gratitude, joy, celebration, success stories
   - 70-89: Mostly positive, hopeful, thankful, optimistic
   - 50-69: Mixed emotions, seeking guidance, neutral tone
   - 30-49: Struggling, worried, seeking help, challenges mentioned
   - 0-29: Despair, crisis, urgent pleas, deep suffering
   
2. A 2-3 sentence summary capturing the overall mood and key concerns

3. List 5 key themes (single words like: Gratitude, Health, Wealth, Finance, Love, Success, Wellness, Growth, Career, Community)

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
      }
    }
    
    // Prepare summary data
    const summaryData = {
      sentimentScore,
      totalCandles: snapshot.size,
      petitions,
      praise,
      confessions,
      trend: sentimentScore > 50 ? 'up' : 'down',
      summary: aiSummary || `The platform received ${snapshot.size} candles today. ${praise > petitions ? 'Gratitude and celebration dominate.' : 'Many are seeking support and guidance.'}`,
      themes: extractedThemes,
      createdAt: admin.firestore.Timestamp.now(),
      date: dateKey,
      period: 'daily'
    };
    
    // Save to Firestore
    await db.collection('summaries').doc(`daily_${dateKey}`).set(summaryData);
    console.log('Daily summary generated successfully');
    
  } catch (error) {
    console.error('Error generating daily summary:', error);
  }
});

// Weekly summary - runs every Monday at 3 AM EST
exports.generateWeeklySummary = onSchedule({
  schedule: 'every monday 03:00',
  timeZone: 'America/New_York',
  secrets: ["OPENAI_SECRET_KEY"]
}, async (event) => {
  console.log('Running weekly summary generation');
  
  const db = admin.firestore();
  const today = new Date();
  const dateKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  
  try {
    // Fetch candles from last 7 days
    const candlesRef = db.collection('candles');
    const snapshot = await candlesRef
      .orderBy('createdAt', 'desc')
      .limit(500)  // More candles for weekly
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
    
    // Call OpenAI API for weekly analysis
    let sentimentScore = 75;
    let aiSummary = '';
    let extractedThemes = ['Success', 'Growth', 'Community', 'Prosperity', 'Wellness'];
    
    const openAIKey = (process.env.OPENAI_SECRET_KEY || '').trim();
    
    if (messages.length > 0 && openAIKey) {
      console.log('Using OpenAI for weekly analysis...');
      
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
              content: 'You are analyzing a week worth of messages from users. Identify weekly trends and patterns.'
            },
            {
              role: 'user',
              content: `Analyze these ${messages.length} messages from the past week and provide:
1. A sentiment score from 0-100
2. A 2-3 sentence summary of the weekly trends and patterns
3. List 5 key themes for the week

Sample messages (first 50):
${messages.slice(0, 50).join('\n')}

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
      }
    }
    
    // Prepare weekly summary data
    const summaryData = {
      sentimentScore,
      totalCandles: snapshot.size,
      petitions,
      praise,
      confessions,
      trend: sentimentScore > 50 ? 'up' : 'down',
      summary: aiSummary || `This week saw ${snapshot.size} candles lit. ${praise > petitions ? 'Gratitude and celebration were the dominant themes.' : 'The community sought guidance and support throughout the week.'}`,
      themes: extractedThemes,
      createdAt: admin.firestore.Timestamp.now(),
      date: dateKey,
      period: 'weekly'
    };
    
    // Save to Firestore
    await db.collection('summaries').doc(`weekly_${dateKey}`).set(summaryData);
    console.log('Weekly summary generated successfully');
    
  } catch (error) {
    console.error('Error generating weekly summary:', error);
  }
});

// Monthly summary - runs on the 1st of each month at 4 AM EST
exports.generateMonthlySummary = onSchedule({
  schedule: '0 4 1 * *',  // Cron format: 4 AM on 1st day of month
  timeZone: 'America/New_York',
  secrets: ["OPENAI_SECRET_KEY"]
}, async (event) => {
  console.log('Running monthly summary generation');
  
  const db = admin.firestore();
  const today = new Date();
  const dateKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  
  try {
    // Fetch candles from last 30 days
    const candlesRef = db.collection('candles');
    const snapshot = await candlesRef
      .orderBy('createdAt', 'desc')
      .limit(2000)  // More candles for monthly
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
    
    // Call OpenAI API for monthly analysis
    let sentimentScore = 75;
    let aiSummary = '';
    let extractedThemes = ['Success', 'Growth', 'Community', 'Prosperity', 'Wellness'];
    
    const openAIKey = (process.env.OPENAI_SECRET_KEY || '').trim();
    
    if (messages.length > 0 && openAIKey) {
      console.log('Using OpenAI for monthly analysis...');
      
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
              content: 'You are analyzing a full month of user messages. Identify major monthly themes and overall sentiment trajectory.'
            },
            {
              role: 'user',
              content: `Analyze these ${messages.length} messages from the past month and provide:
1. A sentiment score from 0-100
2. A 3-4 sentence summary of the monthly trends, major events, and community mood evolution
3. List 5 dominant themes for the month

Sample messages (first 75):
${messages.slice(0, 75).join('\n')}

Respond in JSON: {"sentiment": 75, "summary": "...", "themes": ["word1", "word2", "word3", "word4", "word5"]}`
            }
          ],
          temperature: 0.7,
          max_tokens: 250
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
      }
    }
    
    // Prepare monthly summary data
    const summaryData = {
      sentimentScore,
      totalCandles: snapshot.size,
      petitions,
      praise,
      confessions,
      trend: sentimentScore > 50 ? 'up' : 'down',
      summary: aiSummary || `This month witnessed ${snapshot.size} candles lit. ${praise > petitions ? 'Overall, the month was marked by gratitude and celebration.' : 'Throughout the month, the community actively sought guidance and support.'}`,
      themes: extractedThemes,
      createdAt: admin.firestore.Timestamp.now(),
      date: dateKey,
      period: 'monthly'
    };
    
    // Save to Firestore
    await db.collection('summaries').doc(`monthly_${dateKey}`).set(summaryData);
    console.log('Monthly summary generated successfully');
    
  } catch (error) {
    console.error('Error generating monthly summary:', error);
  }
});

// Import and export the scheduled technical data updater
const { updateTechnicalData } = require('./scheduledTechnical');
exports.updateTechnicalData = updateTechnicalData;
