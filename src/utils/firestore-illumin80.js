import { db } from '@/utilities/firebaseServer';
import { collection, query, orderBy, limit, getDocs, doc, updateDoc } from 'firebase/firestore';

// Get the top 80 token burners from Firestore
export async function getIllumin80Members() {
  try {
    // Query the results collection, ordered by burnedAmount descending
    // For testing with few entries, we'll take all and then limit
    const resultsRef = collection(db, 'results');
    const q = query(
      resultsRef, 
      orderBy('burnedAmount', 'desc')
      // Remove limit for testing - we'll take top entries up to 80
    );
    
    const querySnapshot = await getDocs(q);
    const illumin80Members = [];
    
    // Process members directly from Firestore order (already sorted by burnedAmount desc)
    querySnapshot.forEach((doc, index) => {
      const data = doc.data();
      const rank = index + 1;
      const member = {
        id: doc.id,
        clerkUserId: data.clerkUserId,  // Secure Clerk user ID (if linked)
        userId: data.userId,           // Legacy field
        walletAddress: data.walletAddress,
        burnedAmount: data.burnedAmount,  // Keep as-is from Firestore
        username: data.username || data.userName,  // Check both username and userName
        email: data.email || data.clerkEmail,  // Email if stored
        rank: rank,
        title: getIllumin80Title(rank)
      };
      
      // Log each member with their rank
      console.log(`Rank #${member.rank}: ${member.username} - ${member.burnedAmount} burned (type: ${typeof data.burnedAmount})`);
      
      illumin80Members.push(member);
    });
    
    return illumin80Members;
  } catch (error) {
    console.error('Error fetching Illumin80 members:', error);
    return [];
  }
}

// Check if a specific user is in the Illumin80
export async function checkUserIllumin80Status(userIdentifier, isClerkUserId = false) {
  try {
    const illumin80 = await getIllumin80Members();
    
    // If this is a Clerk userId, ONLY check the clerkUserId field for security
    if (isClerkUserId) {
      const member = illumin80.find(m => m.clerkUserId === userIdentifier);
      
      if (member) {
        console.log('✅ Found Illumin80 member by secure Clerk ID:', member);
      }
      
      return {
        isIllumin80: !!member,
        rank: member?.rank || null,
        title: member?.title || null,
        burnedAmount: member?.burnedAmount || 0
      };
    }
    
    // For non-Clerk IDs (used in frontend only), do broader matching
    // This should only be used for display purposes, NOT for access control
    const normalizedId = userIdentifier?.toLowerCase?.()?.trim() || userIdentifier;
    
    const member = illumin80.find(m => {
      return (
        m.userId === userIdentifier ||
        m.walletAddress === userIdentifier ||
        m.username?.toLowerCase() === normalizedId ||
        m.email?.toLowerCase() === normalizedId ||
        (m.email && normalizedId && normalizedId.includes('@') && m.email.toLowerCase() === normalizedId) ||
        (m.username && userIdentifier && typeof userIdentifier === 'string' && userIdentifier.includes('@') && 
         m.username.toLowerCase() === userIdentifier.split('@')[0].toLowerCase())
      );
    });
    
    if (member) {
      console.log('✅ Found Illumin80 member:', {
        username: member.username,
        rank: member.rank,
        burnedAmount: member.burnedAmount,
        title: member.title
      });
    } else {
      console.log('❌ No match found for identifier:', userIdentifier);
    }
    
    return {
      isIllumin80: !!member,
      rank: member?.rank || null,
      title: member?.title || null,
      burnedAmount: member?.burnedAmount || 0
    };
  } catch (error) {
    console.error('Error checking Illumin80 status:', error);
    return { isIllumin80: false, rank: null, title: null, burnedAmount: 0 };
  }
}

// Update Firestore document with Illumin80 status
export async function updateIllumin80StatusInFirestore(docId, isIllumin80, rank) {
  try {
    const docRef = doc(db, 'results', docId);
    await updateDoc(docRef, {
      isIllumin80,
      illumin80Rank: rank,
      illumin80Title: rank ? getIllumin80Title(rank) : null,
      illumin80UpdatedAt: new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.error('Error updating Illumin80 status in Firestore:', error);
    return false;
  }
}

// Sync Illumin80 status between Firestore and Clerk
export async function syncIllumin80WithClerk() {
  try {
    const illumin80Members = await getIllumin80Members();
    
    for (const member of illumin80Members) {
      if (member.userId) {
        // Update Clerk metadata for each Illumin80 member
        await fetch('/api/update-user-badge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: member.userId,
            isIllumin80: true,
            rank: member.rank,
            title: member.title,
            burnedAmount: member.burnedAmount
          })
        });
        
        // Also update Firestore with Illumin80 status
        await updateIllumin80StatusInFirestore(member.id, true, member.rank);
      }
    }
    
    console.log(`✨ Synced ${illumin80Members.length} Illumin80 members`);
    return illumin80Members;
  } catch (error) {
    console.error('Error syncing Illumin80 with Clerk:', error);
    return [];
  }
}

// Medieval titles based on rank
function getIllumin80Title(rank) {
  if (rank === 1) return "Grand Master of the Eternal Flame";
  if (rank <= 5) return "Keeper of the Sacred Pyre";
  if (rank <= 10) return "Knight of the Golden Ember";
  if (rank <= 20) return "Guardian of the Inner Circle";
  if (rank <= 40) return "Torch Bearer of the Order";
  if (rank <= 80) return "Initiate of the Illumin80";
  return null;
}