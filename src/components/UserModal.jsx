'use client';
import { useState, useEffect } from 'react';
import { useUser, UserProfile, useClerk } from '@clerk/nextjs';
import { X, User, Wallet, Trophy, Settings, Coins, Star, Shield, Target, Zap, Award, LogOut } from 'lucide-react';
import { checkUserIllumin80Status } from '@/utils/firestore-illumin80';

export function UserModal({ isOpen, onClose, illumin80Status: providedStatus = null }) {
  const { user, isLoaded: userLoaded } = useUser();
  const { signOut } = useClerk();
  const [activeTab, setActiveTab] = useState('profile');
  const [illumin80Status, setIllumin80Status] = useState(providedStatus);
  const [streak, setStreak] = useState(0);
  const [walletBalances, setWalletBalances] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Add spinner and pulse animations
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const style = document.createElement('style');
      style.textContent = `
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0% {
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
          }
          50% {
            box-shadow: 0 4px 20px rgba(102, 126, 234, 0.6), 0 0 30px rgba(102, 126, 234, 0.3);
          }
          100% {
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
          }
        }
      `;
      document.head.appendChild(style);
      return () => document.head.removeChild(style);
    }
  }, []);

  useEffect(() => {
    if (providedStatus) {
      setIllumin80Status(providedStatus);
    } else if (user) {
      checkStatus();
    }
  }, [user, providedStatus]);

  useEffect(() => {
    if (user?.id) {
      fetchUserData();
    }
  }, [user]);

  async function checkStatus() {
    const identifiers = [
      user.username,
      user.firstName,
      user.lastName,
      user.fullName,
      user.primaryEmailAddress?.emailAddress,
      user.emailAddresses?.[0]?.emailAddress,
      user.id
    ].filter(Boolean);
    
    for (const identifier of identifiers) {
      try {
        const result = await checkUserIllumin80Status(identifier);
        if (result.isIllumin80) {
          setIllumin80Status(result);
          return;
        }
      } catch (error) {
        console.error(`Error checking ${identifier}:`, error);
      }
    }
  }

  async function fetchUserData() {
    if (!userLoaded || !user) return;
    
    setLoading(true);
    setError(null);
    try {
      const [streakRes, walletRes, achievementsRes] = await Promise.all([
        fetch('/api/check-streak', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id })
        }),
        fetch('/api/wallet-balance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id })
        }),
        fetch('/api/user-achievements', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id })
        })
      ].filter(Boolean));

      if (streakRes?.ok) {
        const streakData = await streakRes.json();
        setStreak(streakData.currentStreak || 0);
      }

      if (walletRes?.ok) {
        const walletData = await walletRes.json();
        setWalletBalances(walletData);
      }

      if (achievementsRes?.ok) {
        const achievementsData = await achievementsRes.json();
        setAchievements(achievementsData.achievements || []);
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError('Failed to load some data. Please refresh.');
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen || !userLoaded) return null;
  
  if (!user) {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div 
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(8px)'
          }}
          onClick={onClose}
        />
        <div style={{
          position: 'relative',
          backgroundColor: '#111827',
          borderRadius: '12px',
          padding: '32px',
          color: 'white'
        }}>
          <p>Please sign in to view your profile</p>
          <button 
            onClick={onClose}
            style={{
              marginTop: '16px',
              padding: '8px 16px',
              backgroundColor: '#9333ea',
              borderRadius: '8px',
              color: 'white',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'wallet', label: 'Wallet', icon: Wallet },
    { id: 'achievements', label: 'Achievements', icon: Trophy },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div 
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(8px)'
        }}
        onClick={onClose}
      />
      
      <div style={{
        position: 'relative',
        width: '90%',
        maxWidth: '1024px',
        height: '85vh',
        background: 'linear-gradient(to bottom, #111827, #000000)',
        borderRadius: '16px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75)',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to bottom right, rgba(147, 51, 234, 0.1), rgba(59, 130, 246, 0.1))',
          pointerEvents: 'none'
        }} />
        
        {/* Header */}
        <div style={{
          position: 'relative',
          padding: '24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              padding: '8px',
              borderRadius: '50%',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            <X style={{ width: '20px', height: '20px', color: 'rgba(255, 255, 255, 0.7)' }} />
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <img
              src={user?.imageUrl}
              alt={user?.fullName || 'User'}
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                border: '2px solid rgba(147, 51, 234, 0.5)'
              }}
            />
            <div>
              <h2 style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: 'white',
                margin: 0
              }}>
                {user?.fullName || user?.username || 'User'}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
                {illumin80Status?.isIllumin80 && (
                  <span style={{
                    fontSize: '12px',
                    padding: '4px 8px',
                    background: 'linear-gradient(to right, #f59e0b, #ea580c)',
                    borderRadius: '9999px',
                    color: 'white',
                    fontWeight: '600'
                  }}>
                    Illumin80 Member
                  </span>
                )}
                {streak > 0 && (
                  <span style={{
                    fontSize: '12px',
                    padding: '4px 8px',
                    background: 'linear-gradient(to right, #3b82f6, #9333ea)',
                    borderRadius: '9999px',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <Zap style={{ width: '12px', height: '12px' }} />
                    {streak} Day Streak
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {/* Sign Out Button */}
          <button
            onClick={() => signOut()}
            style={{
              position: 'absolute',
              top: '16px',
              right: '60px',
              padding: '8px 16px',
              borderRadius: '8px',
              backgroundColor: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid rgba(239, 68, 68, 0.5)',
              color: '#ef4444',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.3)';
              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.7)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)';
            }}
          >
            <LogOut style={{ width: '16px', height: '16px' }} />
            Sign Out
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  backgroundColor: activeTab === tab.id ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                  borderTop: 'none',
                  borderLeft: 'none',
                  borderRight: 'none',
                  borderBottom: activeTab === tab.id ? '2px solid #9333ea' : 'none',
                  color: activeTab === tab.id ? 'white' : 'rgba(255, 255, 255, 0.6)',
                  transition: 'all 0.2s',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== tab.id) {
                    e.target.style.color = 'white';
                    e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== tab.id) {
                    e.target.style.color = 'rgba(255, 255, 255, 0.6)';
                    e.target.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <Icon style={{ width: '16px', height: '16px' }} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div style={{
          height: 'calc(100% - 160px)',
          overflowY: 'auto',
          padding: '24px'
        }}>
          {activeTab === 'profile' && <ProfileSection />}
          {activeTab === 'wallet' && <WalletSection balances={walletBalances} loading={loading} />}
          {activeTab === 'achievements' && <AchievementsSection achievements={achievements} loading={loading} illumin80Status={illumin80Status} />}
          {activeTab === 'settings' && <SettingsSection />}
        </div>
      </div>
    </div>
  );
}

function ProfileSection() {
  const { user } = useUser();
  const { openUserProfile } = useClerk();
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Custom Profile Editor */}
      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '12px',
        padding: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '32px' }}>
          <div style={{ position: 'relative' }}>
            <img
              src={user?.imageUrl}
              alt="Profile"
              style={{
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                border: '3px solid rgba(147, 51, 234, 0.5)',
                cursor: 'pointer'
              }}
              onClick={() => openUserProfile()}
              title="Click to update profile image"
            />
            <button
              onClick={() => openUserProfile()}
              style={{
                position: 'absolute',
                bottom: '0',
                right: '0',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: '#9333ea',
                border: '2px solid #000',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              ✏️
            </button>
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ color: 'white', fontSize: '24px', marginBottom: '8px' }}>
              {user?.fullName || user?.username || 'User'}
            </h3>
            <p style={{ color: 'rgba(255, 255, 255, 0.6)', marginBottom: '8px' }}>
              @{user?.username || 'username'}
            </p>
            <p style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
              {user?.primaryEmailAddress?.emailAddress}
            </p>
          </div>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px' }}>Username</label>
            <div style={{
              marginTop: '4px',
              padding: '12px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '8px',
              color: 'white',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              {user?.username || 'Not set'}
            </div>
          </div>
          
          <div>
            <label style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px' }}>Full Name</label>
            <div style={{
              marginTop: '4px',
              padding: '12px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '8px',
              color: 'white',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              {user?.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Not set'}
            </div>
          </div>
          
          <div>
            <label style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px' }}>Member Since</label>
            <div style={{
              marginTop: '4px',
              padding: '12px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '8px',
              color: 'white',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
            </div>
          </div>
        </div>
        
        <button
          onClick={() => openUserProfile()}
          style={{
            marginTop: '24px',
            width: '100%',
            padding: '12px',
            backgroundColor: '#9333ea',
            color: 'white',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '16px'
          }}
        >
          Edit Profile Details
        </button>
      </div>
    </div>
  );
}

function WalletSection({ balances, loading }) {
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '256px'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          border: '2px solid transparent',
          borderTopColor: '#9333ea',
          animation: 'spin 1s linear infinite'
        }} />
      </div>
    );
  }

  const tokens = balances?.tokens || [
    { symbol: 'PMPKN', balance: '158,200', value: '$237.30', change: '+11.76%', icon: '🎃' },
    { symbol: 'ETH', balance: '2.3', value: '$6,900.00', change: '+2.1%', icon: '💎' },
    { symbol: 'USDC', balance: '1,000', value: '$1,000.00', change: '0.0%', icon: '💵' }
  ];

  const totalValue = balances?.totalValue || '$8,137.30';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{
        background: 'linear-gradient(to right, rgba(147, 51, 234, 0.2), rgba(59, 130, 246, 0.2))',
        borderRadius: '12px',
        padding: '24px',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '8px'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: 'rgba(255, 255, 255, 0.7)'
          }}>Total Balance</h3>
          <Wallet style={{ width: '20px', height: '20px', color: '#a855f7' }} />
        </div>
        <p style={{
          fontSize: '30px',
          fontWeight: 'bold',
          color: 'white',
          margin: '0'
        }}>{totalValue}</p>
        <p style={{
          fontSize: '14px',
          color: '#4ade80',
          marginTop: '4px'
        }}>+13.42% this week</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: '600',
          color: 'white',
          marginBottom: '16px'
        }}>Your Tokens</h3>
        {tokens.map((token, index) => (
          <div 
            key={index} 
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'background-color 0.2s',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px'
              }}>
                {token.icon}
              </div>
              <div>
                <p style={{
                  color: 'white',
                  fontWeight: '600',
                  margin: '0'
                }}>{token.symbol}</p>
                <p style={{
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontSize: '14px',
                  margin: '0'
                }}>{token.balance}</p>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{
                color: 'white',
                fontWeight: '500',
                margin: '0'
              }}>{token.value}</p>
              <p style={{
                fontSize: '14px',
                color: token.change.startsWith('+') ? '#4ade80' : token.change.startsWith('-') ? '#ef4444' : 'rgba(255, 255, 255, 0.6)',
                margin: '0'
              }}>
                {token.change}
              </p>
            </div>
          </div>
        ))}
      </div>

      <button 
        style={{
          width: '100%',
          padding: '12px',
          background: 'linear-gradient(to right, #9333ea, #3b82f6)',
          borderRadius: '12px',
          color: 'white',
          fontWeight: '600',
          border: 'none',
          cursor: 'pointer',
          transition: 'opacity 0.2s'
        }}
        onMouseEnter={(e) => e.target.style.opacity = '0.9'}
        onMouseLeave={(e) => e.target.style.opacity = '1'}
      >
        Connect Another Wallet
      </button>
    </div>
  );
}

function AchievementsSection({ achievements, loading, illumin80Status }) {
  const { user } = useUser();
  
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '256px'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          border: '2px solid transparent',
          borderTopColor: '#9333ea',
          animation: 'spin 1s linear infinite'
        }} />
      </div>
    );
  }

  const badges = [
    { id: 1, name: 'Early Adopter', description: 'Joined in the first month', icon: Star, gradient: 'linear-gradient(to bottom right, #facc15, #fb923c)', earned: true },
    { id: 2, name: 'Diamond Hands', description: 'Held for 30+ days', icon: Shield, gradient: 'linear-gradient(to bottom right, #60a5fa, #a855f7)', earned: true },
    { id: 3, name: 'Whale Watcher', description: 'Portfolio over $10,000', icon: Target, gradient: 'linear-gradient(to bottom right, #4ade80, #14b8a6)', earned: false },
    { id: 4, name: 'Speed Demon', description: 'Made 100+ trades', icon: Zap, gradient: 'linear-gradient(to bottom right, #c084fc, #ec4899)', earned: true },
    { id: 5, name: 'Champion', description: 'Top 10 trader of the month', icon: Award, gradient: 'linear-gradient(to bottom right, #f87171, #fb923c)', earned: false },
    { id: 6, name: 'Lucky Pumpkin', description: 'Halloween 2024 Special', icon: Coins, gradient: 'linear-gradient(to bottom right, #fb923c, #facc15)', earned: true }
  ];

  const trophies = achievements?.trophies || [
    { name: 'October Champion', date: '2024-10-15', rank: '#2' },
    { name: 'Best Trade', date: '2024-10-10', profit: '+450%' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Elite Perks Section - Only for Illumin80 Members */}
      {illumin80Status?.isIllumin80 && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1))',
          borderRadius: '16px',
          padding: '24px',
          border: '2px solid rgba(102, 126, 234, 0.3)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: '-50%',
            right: '-50%',
            width: '200%',
            height: '200%',
            background: 'radial-gradient(circle, rgba(102, 126, 234, 0.1) 0%, transparent 70%)',
            animation: 'pulse 4s ease-in-out infinite'
          }} />
          
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '20px'
            }}>
              <span style={{ fontSize: '24px' }}>👑</span>
              <h3 style={{
                fontSize: '20px',
                fontWeight: '700',
                color: 'white',
                margin: 0,
                background: 'linear-gradient(to right, #667eea, #764ba2)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                Elite Member Perks
              </h3>
            </div>
            
            <p style={{
              color: 'rgba(255, 255, 255, 0.7)',
              marginBottom: '24px',
              fontSize: '14px'
            }}>
              Exclusive benefits for Illumin80 members
            </p>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px'
            }}>
              <button
                onClick={() => window.location.href = '/moonroom'}
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '12px',
                  padding: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  color: 'white'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(102, 126, 234, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <span style={{ fontSize: '32px' }}>🌙</span>
                <span style={{ fontWeight: '600', fontSize: '16px' }}>Moonroom Access</span>
                <span style={{ fontSize: '12px', opacity: 0.9 }}>Exclusive chat & content</span>
              </button>
              
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                position: 'relative'
              }}>
                <span style={{ fontSize: '32px' }}>🎯</span>
                <span style={{ fontWeight: '600', fontSize: '16px', color: 'white' }}>Priority Support</span>
                <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)' }}>Direct access to team</span>
                <span style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  fontSize: '10px',
                  padding: '2px 6px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '4px',
                  color: 'rgba(255, 255, 255, 0.5)'
                }}>Active</span>
              </div>
              
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                position: 'relative'
              }}>
                <span style={{ fontSize: '32px' }}>💎</span>
                <span style={{ fontWeight: '600', fontSize: '16px', color: 'white' }}>Early Access</span>
                <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)' }}>New features first</span>
                <span style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  fontSize: '10px',
                  padding: '2px 6px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '4px',
                  color: 'rgba(255, 255, 255, 0.5)'
                }}>Active</span>
              </div>
              
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px dashed rgba(255, 255, 255, 0.2)',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                opacity: 0.6
              }}>
                <span style={{ fontSize: '32px' }}>🚀</span>
                <span style={{ fontWeight: '600', fontSize: '16px', color: 'rgba(255, 255, 255, 0.6)' }}>More Coming</span>
                <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.4)' }}>Stay tuned...</span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div>
        <h3 style={{
          fontSize: '18px',
          fontWeight: '600',
          color: 'white',
          marginBottom: '16px'
        }}>Badges</h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '16px'
        }}>
          {badges.map(badge => {
            const Icon = badge.icon;
            return (
              <div
                key={badge.id}
                style={{
                  position: 'relative',
                  borderRadius: '12px',
                  padding: '16px',
                  border: badge.earned ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(255, 255, 255, 0.1)',
                  background: badge.earned ? badge.gradient : 'rgba(255, 255, 255, 0.05)',
                  opacity: badge.earned ? 1 : 0.5
                }}
              >
                {!badge.earned && (
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.4)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <span style={{
                      color: 'rgba(255, 255, 255, 0.6)',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}>Locked</span>
                  </div>
                )}
                <Icon style={{ width: '32px', height: '32px', color: 'white', marginBottom: '8px' }} />
                <p style={{
                  color: 'white',
                  fontWeight: '600',
                  fontSize: '14px',
                  margin: '0'
                }}>{badge.name}</p>
                <p style={{
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontSize: '12px',
                  marginTop: '4px'
                }}>{badge.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <h3 style={{
          fontSize: '18px',
          fontWeight: '600',
          color: 'white',
          marginBottom: '16px'
        }}>Trophies</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {trophies.map((trophy, index) => (
            <div key={index} style={{
              background: 'linear-gradient(to right, rgba(245, 158, 11, 0.2), rgba(234, 88, 12, 0.2))',
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              border: '1px solid rgba(245, 158, 11, 0.3)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Trophy style={{ width: '24px', height: '24px', color: '#facc15' }} />
                <div>
                  <p style={{
                    color: 'white',
                    fontWeight: '600',
                    margin: '0'
                  }}>{trophy.name}</p>
                  <p style={{
                    color: 'rgba(255, 255, 255, 0.6)',
                    fontSize: '14px',
                    margin: '0'
                  }}>{trophy.date}</p>
                </div>
              </div>
              <span style={{
                color: '#facc15',
                fontWeight: 'bold'
              }}>
                {trophy.rank || trophy.profit}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '12px',
        padding: '24px',
        textAlign: 'center'
      }}>
        <h4 style={{
          color: 'white',
          fontWeight: '600',
          marginBottom: '8px'
        }}>Achievement Points</h4>
        <p style={{
          fontSize: '36px',
          fontWeight: 'bold',
          background: 'linear-gradient(to right, #a855f7, #3b82f6)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          margin: '8px 0'
        }}>
          10,420
        </p>
        <p style={{
          color: 'rgba(255, 255, 255, 0.6)',
          fontSize: '14px',
          marginTop: '8px'
        }}>Rank #42 globally</p>
      </div>
    </div>
  );
}

function SettingsSection() {
  const { user } = useUser();
  const { openUserProfile } = useClerk();
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Account Settings */}
      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '12px',
        padding: '24px'
      }}>
        <h3 style={{ color: 'white', fontSize: '18px', marginBottom: '20px' }}>
          Account Settings
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{
            padding: '16px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '8px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <p style={{ color: 'white', fontWeight: '500' }}>Email Address</p>
              <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '14px' }}>
                {user?.primaryEmailAddress?.emailAddress}
              </p>
            </div>
            <button
              onClick={() => openUserProfile()}
              style={{
                padding: '8px 16px',
                backgroundColor: 'transparent',
                color: '#9333ea',
                border: '1px solid #9333ea',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Change
            </button>
          </div>
          
          <div style={{
            padding: '16px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '8px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <p style={{ color: 'white', fontWeight: '500' }}>Password</p>
              <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '14px' }}>
                Last changed {user?.passwordEnabled ? '30 days ago' : 'Never'}
              </p>
            </div>
            <button
              onClick={() => openUserProfile()}
              style={{
                padding: '8px 16px',
                backgroundColor: 'transparent',
                color: '#9333ea',
                border: '1px solid #9333ea',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Update
            </button>
          </div>
          
          <div style={{
            padding: '16px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '8px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <p style={{ color: 'white', fontWeight: '500' }}>Two-Factor Authentication</p>
              <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '14px' }}>
                {user?.twoFactorEnabled ? 'Enabled' : 'Add an extra layer of security'}
              </p>
            </div>
            <button
              onClick={() => openUserProfile()}
              style={{
                padding: '8px 16px',
                backgroundColor: user?.twoFactorEnabled ? 'transparent' : '#9333ea',
                color: user?.twoFactorEnabled ? '#4ade80' : 'white',
                border: user?.twoFactorEnabled ? '1px solid #4ade80' : 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              {user?.twoFactorEnabled ? 'Enabled ✓' : 'Enable'}
            </button>
          </div>
        </div>
      </div>
      
      {/* Preferences */}
      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '12px',
        padding: '24px'
      }}>
        <h3 style={{ color: 'white', fontSize: '18px', marginBottom: '20px' }}>
          Preferences
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 0'
          }}>
            <div>
              <p style={{ color: 'white', fontWeight: '500' }}>Email Notifications</p>
              <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '14px' }}>
                Receive updates about your account
              </p>
            </div>
            <button
              onClick={() => setNotifications(!notifications)}
              style={{
                width: '48px',
                height: '24px',
                borderRadius: '12px',
                backgroundColor: notifications ? '#9333ea' : 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                cursor: 'pointer',
                position: 'relative',
                transition: 'background-color 0.2s'
              }}
            >
              <div style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                backgroundColor: 'white',
                position: 'absolute',
                top: '2px',
                left: notifications ? '26px' : '2px',
                transition: 'left 0.2s'
              }} />
            </button>
          </div>
          
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 0'
          }}>
            <div>
              <p style={{ color: 'white', fontWeight: '500' }}>Dark Mode</p>
              <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '14px' }}>
                Use dark theme across the app
              </p>
            </div>
            <button
              onClick={() => setDarkMode(!darkMode)}
              style={{
                width: '48px',
                height: '24px',
                borderRadius: '12px',
                backgroundColor: darkMode ? '#9333ea' : 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                cursor: 'pointer',
                position: 'relative',
                transition: 'background-color 0.2s'
              }}
            >
              <div style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                backgroundColor: 'white',
                position: 'absolute',
                top: '2px',
                left: darkMode ? '26px' : '2px',
                transition: 'left 0.2s'
              }} />
            </button>
          </div>
        </div>
      </div>
      
      {/* Danger Zone */}
      <div style={{
        backgroundColor: 'rgba(239, 68, 68, 0.05)',
        borderRadius: '12px',
        padding: '24px',
        border: '1px solid rgba(239, 68, 68, 0.2)'
      }}>
        <h3 style={{ color: '#ef4444', fontSize: '18px', marginBottom: '12px' }}>
          Danger Zone
        </h3>
        <p style={{ color: 'rgba(255, 255, 255, 0.6)', marginBottom: '16px', fontSize: '14px' }}>
          Deleting your account is permanent and cannot be undone.
        </p>
        <button
          style={{
            padding: '8px 16px',
            backgroundColor: 'transparent',
            color: '#ef4444',
            border: '1px solid #ef4444',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Delete Account
        </button>
      </div>
    </div>
  );
}