import { useState, useEffect } from 'react';
import { db } from '@/utilities/firebaseClient';
import { 
  doc, 
  getDoc, 
  setDoc, 
  onSnapshot,
  collection,
  updateDoc 
} from 'firebase/firestore';
import { MOCK_TOKEN_DATA, getCurrentMilestoneStatus, getCurrentTaxRate } from '@/config/tokenomics';

// Collection and document references
const TOKEN_DATA_COLLECTION = 'tokenData';
const TOKEN_INFO_DOC = 'pumpkinSpiceToken';
const MILESTONE_OVERRIDES_DOC = 'milestoneOverrides';

class TokenDataService {
  constructor() {
    this.listeners = [];
    this.tokenData = MOCK_TOKEN_DATA; // Start with mock data
    this.overrides = null;
  }

  // Initialize token data in Firebase if it doesn't exist
  async initializeTokenData() {
    try {
      const docRef = doc(db, TOKEN_DATA_COLLECTION, TOKEN_INFO_DOC);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        // Initialize with mock data if no data exists
        await setDoc(docRef, {
          ...MOCK_TOKEN_DATA,
          lastUpdated: new Date().toISOString(),
          initialized: true,
        });
        console.log('Token data initialized in Firebase');
      }
    } catch (error) {
      console.error('Error initializing token data:', error);
    }
  }

  // Subscribe to real-time token data updates
  subscribeToTokenData(callback) {
    const docRef = doc(db, TOKEN_DATA_COLLECTION, TOKEN_INFO_DOC);
    
    const unsubscribe = onSnapshot(docRef, (doc) => {
      if (doc.exists()) {
        this.tokenData = doc.data();
        callback(this.tokenData);
      } else {
        // Fallback to mock data if document doesn't exist
        callback(MOCK_TOKEN_DATA);
      }
    }, (error) => {
      console.error('Error subscribing to token data:', error);
      // Fallback to mock data on error
      callback(MOCK_TOKEN_DATA);
    });

    this.listeners.push(unsubscribe);
    return unsubscribe;
  }

  // Subscribe to milestone overrides (for admin control)
  subscribeToMilestoneOverrides(callback) {
    const docRef = doc(db, TOKEN_DATA_COLLECTION, MILESTONE_OVERRIDES_DOC);
    
    const unsubscribe = onSnapshot(docRef, (doc) => {
      if (doc.exists()) {
        this.overrides = doc.data();
        callback(this.overrides);
      }
    }, (error) => {
      console.error('Error subscribing to milestone overrides:', error);
    });

    this.listeners.push(unsubscribe);
    return unsubscribe;
  }

  // Get current token data (one-time fetch)
  async getTokenData() {
    try {
      const docRef = doc(db, TOKEN_DATA_COLLECTION, TOKEN_INFO_DOC);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return docSnap.data();
      }
      
      // Return mock data if no Firebase data exists
      return MOCK_TOKEN_DATA;
    } catch (error) {
      console.error('Error fetching token data:', error);
      return MOCK_TOKEN_DATA;
    }
  }

  // Update specific token data fields (for admin use)
  async updateTokenData(updates) {
    try {
      const docRef = doc(db, TOKEN_DATA_COLLECTION, TOKEN_INFO_DOC);
      await updateDoc(docRef, {
        ...updates,
        lastUpdated: new Date().toISOString(),
      });
      return true;
    } catch (error) {
      console.error('Error updating token data:', error);
      return false;
    }
  }

  // Simulate buy count increase (for testing)
  async simulateBuy() {
    const currentData = await this.getTokenData();
    const newBuyCount = (currentData.currentBuyCount || 0) + 1;
    
    // Calculate new tax rate based on buy count
    const newTaxRate = getCurrentTaxRate(newBuyCount, currentData.cexListed);
    
    await this.updateTokenData({
      currentBuyCount: newBuyCount,
      currentTaxRate: newTaxRate,
    });
    
    return newBuyCount;
  }

  // Toggle CEX listing status (for admin)
  async toggleCexListing(isListed) {
    await this.updateTokenData({
      cexListed: isListed,
      currentTaxRate: isListed ? 0 : this.tokenData.currentTaxRate,
    });
  }

  // Get milestone status with current data
  getMilestoneStatus() {
    const data = this.tokenData || MOCK_TOKEN_DATA;
    return getCurrentMilestoneStatus(
      data.currentBuyCount, 
      data.cexListed
    );
  }

  // Cleanup listeners
  cleanup() {
    this.listeners.forEach(unsubscribe => unsubscribe());
    this.listeners = [];
  }
}

// Export singleton instance
const tokenDataService = new TokenDataService();
export default tokenDataService;

// Export hook for React components
export function useTokenData() {
  const [tokenData, setTokenData] = useState(MOCK_TOKEN_DATA);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize and subscribe to updates
    const init = async () => {
      await tokenDataService.initializeTokenData();
      setLoading(false);
    };

    init();

    // Subscribe to real-time updates
    const unsubscribe = tokenDataService.subscribeToTokenData((data) => {
      setTokenData(data);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return { tokenData, loading };
}

// Export hook for milestone status
export function useMilestoneStatus() {
  const { tokenData } = useTokenData();
  return getCurrentMilestoneStatus(
    tokenData.currentBuyCount,
    tokenData.cexListed
  );
}