import { 
  db, 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp,
  runTransaction 
} from './firebaseClient';

// Symbol pool with wheel section mappings
const SYMBOL_POOL = [
  { symbol: '☥', section: 'wheel_section001', name: 'Ankh', id: 0 },
  { symbol: '⚛', section: 'wheel_section003', name: 'Atom', id: 1 },
  { symbol: '🔮', section: 'wheel_section007', name: 'Crystal Ball', id: 2 },
  { symbol: '🌙', section: 'wheel_section008', name: 'Moon', id: 3 },
  { symbol: '⭐', section: 'wheel_section009', name: 'Star', id: 4 },
  { symbol: '🌞', section: 'wheel_section012', name: 'Sun', id: 5 },
  { symbol: '💎', section: 'wheel_section013', name: 'Diamond', id: 6 },
  { symbol: '🔥', section: 'wheel_section015', name: 'Fire', id: 7 },
  { symbol: '🌟', section: 'wheel_section002', name: 'Sparkles', id: 8 },
  { symbol: '⚡', section: 'wheel_section004', name: 'Lightning', id: 9 },
  { symbol: '💫', section: 'wheel_section005', name: 'Dizzy', id: 10 },
  { symbol: '🌀', section: 'wheel_section006', name: 'Cyclone', id: 11 },
  { symbol: '✨', section: 'wheel_section010', name: 'Sparkle', id: 12 },
  { symbol: '🔯', section: 'wheel_section011', name: 'Six Pointed Star', id: 13 },
  { symbol: '☯', section: 'wheel_section014', name: 'Yin Yang', id: 14 },
  { symbol: '♾', section: 'wheel_section', name: 'Infinity', id: 15 }
];

// Get date string in UTC for consistency
const getDateString = () => {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Simple hash function for browser compatibility
const simpleHash = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
};

// Generate a deterministic but unpredictable sequence for a user on a given day
const generateUserSequence = (userId, dateString) => {
  // Create a unique seed from userId and date
  const seed = `${userId}-${dateString}-RL80-SECRET-SALT-2024`;
  
  // Use simple hash for browser compatibility
  const hashValue = simpleHash(seed);
  
  // Use the hash to select 3 unique symbols
  const selectedSymbols = [];
  const availableIndices = [...Array(SYMBOL_POOL.length).keys()];
  
  // Create pseudo-random sequence based on hash
  let currentHash = hashValue;
  for (let i = 0; i < 3; i++) {
    // Generate next pseudo-random number
    currentHash = (currentHash * 1103515245 + 12345) & 0x7fffffff;
    
    const index = currentHash % availableIndices.length;
    const symbolIndex = availableIndices[index];
    
    selectedSymbols.push(SYMBOL_POOL[symbolIndex]);
    availableIndices.splice(index, 1); // Remove to ensure uniqueness
  }
  
  return selectedSymbols;
};

// Get or create daily puzzle sequence for a user
export const getUserDailySequence = async (userId) => {
  if (!userId || !db) {
    console.warn('getUserDailySequence: Missing userId or database connection');
    return null;
  }
  
  const dateString = getDateString();
  
  try {
    // Use a transaction to ensure atomicity
    const sequence = await runTransaction(db, async (transaction) => {
      const userPuzzleRef = doc(db, 'userPuzzles', userId);
      const userPuzzleDoc = await transaction.get(userPuzzleRef);
      
      const puzzleData = userPuzzleDoc.exists() ? userPuzzleDoc.data() : null;
      const currentDate = getDateString();
      
      // Check if we have a valid sequence for today
      if (puzzleData && puzzleData.date === currentDate && puzzleData.sequence) {
        return {
          sequence: puzzleData.sequence,
          completedToday: puzzleData.completedToday || false,
          attempts: puzzleData.attempts || 0,
          lastAttempt: puzzleData.lastAttempt
        };
      }
      
      // Generate new sequence for today
      const newSequence = generateUserSequence(userId, currentDate);
      
      // Save the new sequence
      const newPuzzleData = {
        userId,
        date: currentDate,
        sequence: newSequence,
        completedToday: false,
        attempts: 0,
        createdAt: serverTimestamp(),
        lastAttempt: null
      };
      
      transaction.set(userPuzzleRef, newPuzzleData, { merge: true });
      
      return {
        sequence: newSequence,
        completedToday: false,
        attempts: 0,
        lastAttempt: null
      };
    });
    
    return sequence;
  } catch (error) {
    console.error('Error getting user daily sequence:', error);
    
    // Fallback: generate sequence client-side without saving
    const fallbackSequence = generateUserSequence(userId, dateString);
    return {
      sequence: fallbackSequence,
      completedToday: false,
      attempts: 0,
      lastAttempt: null,
      isOffline: true // Flag to indicate this is a local-only sequence
    };
  }
};

// Record a puzzle attempt
export const recordPuzzleAttempt = async (userId, success = false) => {
  if (!userId || !db) {
    console.warn('recordPuzzleAttempt: Missing userId or database connection');
    return false;
  }
  
  try {
    const userPuzzleRef = doc(db, 'userPuzzles', userId);
    const dateString = getDateString();
    
    await runTransaction(db, async (transaction) => {
      const puzzleDoc = await transaction.get(userPuzzleRef);
      const currentData = puzzleDoc.exists() ? puzzleDoc.data() : {};
      
      // Only update if it's the same day
      if (currentData.date !== dateString) {
        console.warn('Attempt to update puzzle from different day');
        return;
      }
      
      const updates = {
        attempts: (currentData.attempts || 0) + 1,
        lastAttempt: serverTimestamp(),
        ...(success && { 
          completedToday: true,
          completedAt: serverTimestamp()
        })
      };
      
      transaction.update(userPuzzleRef, updates);
    });
    
    return true;
  } catch (error) {
    console.error('Error recording puzzle attempt:', error);
    return false;
  }
};

// Validate if a sequence matches the user's daily sequence
export const validateUserSequence = async (userId, attemptedSequence) => {
  if (!userId || !attemptedSequence || attemptedSequence.length !== 3) {
    return false;
  }
  
  const dailyData = await getUserDailySequence(userId);
  if (!dailyData || !dailyData.sequence) {
    return false;
  }
  
  // Check if already completed today
  if (dailyData.completedToday) {
    console.log('Puzzle already completed today');
    return {
      valid: false,
      reason: 'already_completed',
      message: 'You have already completed today\'s puzzle!'
    };
  }
  
  // Compare the sequences
  const isValid = attemptedSequence.every((section, index) => 
    section === dailyData.sequence[index].section
  );
  
  // Record the attempt
  await recordPuzzleAttempt(userId, isValid);
  
  return {
    valid: isValid,
    attempts: dailyData.attempts + 1,
    reason: isValid ? 'success' : 'incorrect_sequence'
  };
};

// Get puzzle statistics for a user
export const getUserPuzzleStats = async (userId) => {
  if (!userId || !db) {
    return null;
  }
  
  try {
    // Get current puzzle
    const currentPuzzle = await getUserDailySequence(userId);
    
    // You could also query historical data here if needed
    // const historyQuery = query(
    //   collection(db, 'userPuzzleHistory'),
    //   where('userId', '==', userId),
    //   orderBy('completedAt', 'desc'),
    //   limit(30)
    // );
    
    return {
      todayCompleted: currentPuzzle?.completedToday || false,
      todayAttempts: currentPuzzle?.attempts || 0,
      currentStreak: 0, // Implement streak tracking if needed
      totalCompleted: 0 // Implement total tracking if needed
    };
  } catch (error) {
    console.error('Error getting puzzle stats:', error);
    return null;
  }
};