// API endpoint for Team Chat history persistence in Firestore
import { 
  db, 
  collection, 
  addDoc, 
  getDocs, 
  serverTimestamp,
  orderBy,
  query,
  limit,
  where
} from '../../utilities/firebaseServer';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Check if Firestore is available
  if (!db) {
    console.warn('Firestore not initialized, chat history disabled');
    return res.status(200).json({
      success: false,
      error: 'Chat history service unavailable',
      messages: []
    });
  }

  try {
    if (req.method === 'POST') {
      // Save a new message to Firestore
      const { agent, message, context, timestamp } = req.body;
      
      if (!agent || !message) {
        return res.status(400).json({
          success: false,
          error: 'Agent and message are required'
        });
      }

      // Save to Firestore
      const chatRef = collection(db, 'team-chat');
      const docRef = await addDoc(chatRef, {
        agent,
        message,
        context: context || {},
        timestamp: timestamp || serverTimestamp(),
        createdAt: serverTimestamp(),
        sessionId: req.headers['x-session-id'] || 'global' // Optional session tracking
      });

      console.log(`Chat message saved: ${agent} - ${docRef.id}`);

      return res.status(200).json({
        success: true,
        id: docRef.id,
        message: 'Chat message saved'
      });

    } else if (req.method === 'GET') {
      // Retrieve chat history from Firestore
      const { 
        limit: queryLimit = 50, 
        sessionId,
        agent: filterAgent,
        startTime,
        action 
      } = req.query;
      
      // Special handling for 'recent' action to get last N messages
      if (action === 'recent') {
        const recentLimit = parseInt(queryLimit) || 10;
        const chatRef = collection(db, 'team-chat');
        const q = query(
          chatRef,
          orderBy('createdAt', 'desc'),
          limit(recentLimit)
        );
        
        const querySnapshot = await getDocs(q);
        const messages = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          messages.push({
            id: doc.id,
            ...data,
            timestamp: data.timestamp?.toDate?.()?.toLocaleString() || data.timestamp,
            createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt
          });
        });
        
        // Reverse to get chronological order (oldest first)
        messages.reverse();
        
        return res.status(200).json({
          success: true,
          messages,
          count: messages.length
        });
      }

      const chatRef = collection(db, 'team-chat');
      let q = query(
        chatRef,
        orderBy('createdAt', 'desc'),
        limit(parseInt(queryLimit))
      );

      // Add filters if provided
      if (sessionId) {
        q = query(q, where('sessionId', '==', sessionId));
      }
      if (filterAgent) {
        q = query(q, where('agent', '==', filterAgent));
      }
      if (startTime) {
        const startDate = new Date(startTime);
        q = query(q, where('createdAt', '>=', startDate));
      }

      const querySnapshot = await getDocs(q);
      const messages = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        messages.push({
          id: doc.id,
          ...data,
          // Convert Firestore timestamp to string
          timestamp: data.timestamp?.toDate?.()?.toLocaleString() || data.timestamp,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt
        });
      });

      // Reverse to get chronological order (oldest first)
      messages.reverse();

      return res.status(200).json({
        success: true,
        messages,
        count: messages.length
      });
    }

    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });

  } catch (error) {
    console.error('Team chat history error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to process chat history request'
    });
  }
}