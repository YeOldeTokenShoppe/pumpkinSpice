// Tokenomics configuration
export const TAX_MILESTONES = [
  {
    id: 'launch',
    label: 'Launch',
    buyThreshold: 0,
    taxRate: 5,
    description: 'Initial Buy/Sell Tax',
    icon: '🚀',
  },
  {
    id: 'tier1', 
    label: '250 Buys',
    buyThreshold: 250,
    taxRate: 3,
    description: 'Reduced Tax',
    icon: '📈',
  },
  {
    id: 'tier2',
    label: '500 Buys', 
    buyThreshold: 500,
    taxRate: 1,
    description: 'Minimal Tax',
    icon: '⚡',
  },
  {
    id: 'cex',
    label: 'CEX Listing',
    buyThreshold: null, // Event-based, not threshold-based
    taxRate: 0,
    description: 'Zero Tax',
    icon: '🎯',
  },
];

// Mock data for development - replace with real contract data
export const MOCK_TOKEN_DATA = {
  contractAddress: '0x0000000000000000000000000000000000000000',
  currentBuyCount: 175, // Simulating we're between launch and 250 buys
  currentTaxRate: 5,
  cexListed: false,
  
  // Price and market data
  price: 0.00420,
  priceChange24h: 12.5,
  marketCap: 4200000,
  marketCapChange: 8.3,
  fdv: 4200000, // Fully diluted value (same as market cap if all tokens are circulating)
  holders: 1337,
  holdersChange24h: 5.8, // Percentage change in holder count
  volume24h: 69420,
  volumeChange24h: -3.2,
  totalSupply: 1000000000,
  liquidityLocked: true,
  liquidityLockDuration: '1 Year',
  liquidityAmount: 125000, // USD value in liquidity pool
  liquidityChange24h: 15.2, // Percentage change in liquidity
  
  // Burn data
  tokensBurned: 50000000, // 50M tokens burned
  burnPercentage: 5, // 5% of total supply
  burnHistory: generateMockBurnHistory(), // Historical burn events
  
  // Historical data for charts (last 24 hours)
  priceHistory: generateMockPriceHistory(),
};

// Helper function to generate mock price history
function generateMockPriceHistory() {
  const points = [];
  const now = Date.now();
  const basePrice = 0.00420;
  
  for (let i = 24; i >= 0; i--) {
    const timestamp = now - (i * 60 * 60 * 1000); // Hourly data
    const variation = (Math.random() - 0.5) * 0.001; // Random variation
    const trend = (24 - i) * 0.00001; // Slight upward trend
    
    points.push({
      timestamp,
      price: basePrice + variation + trend,
      volume: Math.floor(Math.random() * 10000) + 1000,
    });
  }
  
  return points;
}

// Helper function to generate mock burn history
function generateMockBurnHistory() {
  const events = [];
  const now = Date.now();
  let totalBurned = 0;
  
  // Generate 10 burn events over the past 30 days
  for (let i = 9; i >= 0; i--) {
    const daysAgo = i * 3;
    const timestamp = now - (daysAgo * 24 * 60 * 60 * 1000);
    const amount = Math.floor(Math.random() * 10000000) + 1000000; // 1M to 11M tokens
    totalBurned += amount;
    
    events.push({
      timestamp,
      amount,
      totalBurned,
      txHash: '0x' + Math.random().toString(16).substr(2, 64),
    });
  }
  
  return events;
}

// Function to calculate current milestone status
export function getCurrentMilestoneStatus(buyCount, cexListed) {
  return TAX_MILESTONES.map(milestone => {
    if (milestone.id === 'launch') {
      return { ...milestone, status: 'completed' };
    }
    
    if (milestone.id === 'cex') {
      return { 
        ...milestone, 
        status: cexListed ? 'completed' : 'pending' 
      };
    }
    
    // For buy-threshold based milestones
    if (milestone.buyThreshold !== null) {
      if (buyCount >= milestone.buyThreshold) {
        return { ...milestone, status: 'completed' };
      } else if (
        milestone.buyThreshold === 250 && 
        buyCount >= 0 && 
        buyCount < 250
      ) {
        // Currently working towards 250 buys
        return { ...milestone, status: 'active' };
      } else if (
        milestone.buyThreshold === 500 && 
        buyCount >= 250 && 
        buyCount < 500
      ) {
        // Currently working towards 500 buys
        return { ...milestone, status: 'active' };
      }
    }
    
    return { ...milestone, status: 'pending' };
  });
}

// Function to get current active tax rate
export function getCurrentTaxRate(buyCount, cexListed) {
  if (cexListed) return 0;
  
  if (buyCount >= 500) return 1;
  if (buyCount >= 250) return 3;
  
  return 5;
}