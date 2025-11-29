// API endpoint for Team Chat cleanup - removes old messages
import { 
  db, 
  collection, 
  getDocs, 
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  limit
} from '../../utilities/firebaseServer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check if Firestore is available
  if (!db) {
    return res.status(200).json({
      success: false,
      error: 'Firestore not initialized'
    });
  }

  try {
    const { 
      maxAge = 30, // Days to keep messages (default 30)
      maxMessages = 1000 // Maximum messages to keep (default 1000)
    } = req.body;

    // Calculate cutoff date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - maxAge);

    // Query for old messages
    const chatRef = collection(db, 'team-chat');
    const oldMessagesQuery = query(
      chatRef,
      where('createdAt', '<', cutoffDate)
    );

    const oldMessagesSnapshot = await getDocs(oldMessagesQuery);
    const deletedCount = oldMessagesSnapshot.size;

    // Delete old messages
    const deletePromises = [];
    oldMessagesSnapshot.forEach((document) => {
      deletePromises.push(deleteDoc(doc(db, 'team-chat', document.id)));
    });
    await Promise.all(deletePromises);

    // Also check if we have too many messages total
    const allMessagesQuery = query(
      chatRef,
      orderBy('createdAt', 'desc')
    );
    
    const allMessagesSnapshot = await getDocs(allMessagesQuery);
    
    if (allMessagesSnapshot.size > maxMessages) {
      // Delete oldest messages beyond the limit
      const messagesToDelete = allMessagesSnapshot.size - maxMessages;
      const docs = allMessagesSnapshot.docs;
      const deleteExtraPromises = [];
      
      // Start from the end (oldest messages)
      for (let i = maxMessages; i < docs.length; i++) {
        deleteExtraPromises.push(deleteDoc(doc(db, 'team-chat', docs[i].id)));
      }
      
      await Promise.all(deleteExtraPromises);
      
      console.log(`Deleted ${messagesToDelete} excess messages beyond ${maxMessages} limit`);
    }

    console.log(`Cleanup completed: ${deletedCount} old messages deleted`);

    return res.status(200).json({
      success: true,
      deletedCount,
      cutoffDate: cutoffDate.toISOString(),
      message: `Deleted ${deletedCount} messages older than ${maxAge} days`
    });

  } catch (error) {
    console.error('Team chat cleanup error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to cleanup chat history'
    });
  }
}

// This could be called periodically via a cron job or Firebase scheduled function
// For now, it can be triggered manually or via the UI