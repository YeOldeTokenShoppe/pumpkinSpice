// Utility to check if user qualifies for Illumin80
// This would connect to your token burning tracking system

export async function checkIllumin80Status(userId, walletAddress) {
  try {
    // TODO: Replace with actual token burn checking logic
    // This would query your blockchain/database for burn amounts
    
    // Example implementation:
    // const burnData = await fetch(`/api/token-burns/${walletAddress}`);
    // const { totalBurned, rank } = await burnData.json();
    
    // For now, mock data:
    const mockTop80Burners = [
      // Add wallet addresses or user IDs of top 80 burners
    ];
    
    // Check if user is in top 80
    const isInTop80 = false; // Replace with actual check
    
    // Update user's Clerk metadata
    if (isInTop80) {
      await fetch('/api/update-user-badge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          isIllumin80: true
        })
      });
    }
    
    return isInTop80;
  } catch (error) {
    console.error('Error checking Illumin80 status:', error);
    return false;
  }
}

// Medieval titles for different tiers within Illumin80
export const ILLUMIN80_TITLES = {
  1: "Grand Master of the Eternal Flame",      // #1 burner
  2: "Keeper of the Sacred Pyre",              // #2-5
  3: "Knight of the Golden Ember",             // #6-10
  4: "Guardian of the Inner Circle",           // #11-20
  5: "Torch Bearer of the Order",              // #21-40
  6: "Initiate of the Illumin80"               // #41-80
};

export function getIllumin80Title(rank) {
  if (rank === 1) return ILLUMIN80_TITLES[1];
  if (rank <= 5) return ILLUMIN80_TITLES[2];
  if (rank <= 10) return ILLUMIN80_TITLES[3];
  if (rank <= 20) return ILLUMIN80_TITLES[4];
  if (rank <= 40) return ILLUMIN80_TITLES[5];
  if (rank <= 80) return ILLUMIN80_TITLES[6];
  return null;
}