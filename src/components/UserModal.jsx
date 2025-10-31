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
          0%, 100% {
            opacity: 1;
            box-shadow: 0 0 10px currentColor;
          }
          50% {
            opacity: 0.5;
            box-shadow: 0 0 20px currentColor;
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
        width: '95%',
        maxWidth: '900px',
        height: '90vh',
        maxHeight: '700px',
        background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.5), rgba(0, 20, 0, 0.4))',
        border: '2px solid #00ff00',
        borderRadius: '0',
        boxShadow: '0 0 40px rgba(0, 255, 0, 0.3), inset 0 0 40px rgba(0, 255, 0, 0.05)',
        backdropFilter: 'blur(10px)',
        overflow: 'hidden'
      }}>
        {/* Grid pattern overlay */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              rgba(0, 255, 0, 0.02) 2px,
              rgba(0, 255, 0, 0.02) 4px
            ),
            repeating-linear-gradient(
              90deg,
              transparent,
              transparent 2px,
              rgba(0, 255, 0, 0.02) 2px,
              rgba(0, 255, 0, 0.02) 4px
            )
          `,
          pointerEvents: 'none',
        }} />
        
        {/* Header */}
        <div style={{
          position: 'relative',
          padding: '16px 24px 24px 24px',
          borderBottom: '1px solid rgba(0, 255, 0, 0.3)',
          zIndex: 1
        }}>
          {/* Top bar with terminal status and buttons */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            minHeight: '32px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flex: 1
            }}>
              <div style={{
                fontSize: '10px',
                color: '#00ff00',
                fontFamily: 'monospace',
                opacity: 0.7,
                letterSpacing: '1px'
              }}>
                [USER.TERMINAL.v3.0]
              </div>
              <div style={{
                display: 'flex',
                gap: '6px',
                alignItems: 'center'
              }}>
                <span style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#00ff00',
                  boxShadow: '0 0 8px #00ff00',
                  animation: 'pulse 2s infinite'
                }} />
                <span style={{
                  fontSize: '9px',
                  color: '#00ff00',
                  fontFamily: 'monospace',
                  opacity: 0.7
                }}>
                  CONN
                </span>
              </div>
            </div>
            
            {/* Button group */}
            <div style={{
              display: 'flex',
              gap: '8px',
              alignItems: 'center'
            }}>
              <button
                onClick={() => signOut()}
                style={{
                  padding: '4px 8px',
                  borderRadius: '0',
                  backgroundColor: 'rgba(255, 0, 0, 0.1)',
                  border: '1px solid #ff0000',
                  color: '#ff0000',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '9px',
                  fontWeight: '500',
                  fontFamily: 'monospace',
                  letterSpacing: '1px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 0, 0, 0.2)';
                  e.currentTarget.style.boxShadow = '0 0 8px rgba(255, 0, 0, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 0, 0, 0.1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <LogOut style={{ width: '12px', height: '12px' }} />
                OUT
              </button>
              
              <button
                onClick={onClose}
                style={{
                  padding: '6px',
                  borderRadius: '0',
                  backgroundColor: 'rgba(0, 0, 0, 0.6)',
                  border: '1px solid #00ff00',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = 'rgba(0, 255, 0, 0.1)';
                  e.target.style.boxShadow = '0 0 8px rgba(0, 255, 0, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                <X style={{ width: '16px', height: '16px', color: '#00ff00' }} />
              </button>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <img
                src={user?.imageUrl}
                alt={user?.fullName || 'User'}
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '0',
                  border: '2px solid #00ff00',
                  filter: 'brightness(1.1) contrast(1.2)',
                  boxShadow: '0 0 20px rgba(0, 255, 0, 0.3)'
                }}
              />
              {/* Corner brackets */}
              <div style={{
                position: 'absolute',
                top: '-2px',
                left: '-2px',
                width: '15px',
                height: '15px',
                borderTop: '2px solid #ffd700',
                borderLeft: '2px solid #ffd700',
              }} />
              <div style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                width: '15px',
                height: '15px',
                borderTop: '2px solid #ffd700',
                borderRight: '2px solid #ffd700',
              }} />
              <div style={{
                position: 'absolute',
                bottom: '-2px',
                left: '-2px',
                width: '15px',
                height: '15px',
                borderBottom: '2px solid #ffd700',
                borderLeft: '2px solid #ffd700',
              }} />
              <div style={{
                position: 'absolute',
                bottom: '-2px',
                right: '-2px',
                width: '15px',
                height: '15px',
                borderBottom: '2px solid #ffd700',
                borderRight: '2px solid #ffd700',
              }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{
                fontSize: '18px',
                fontWeight: 'bold',
                color: '#00ff00',
                margin: 0,
                fontFamily: 'monospace',
                letterSpacing: '1px',
                textShadow: '0 0 10px rgba(0, 255, 0, 0.5)',
                wordBreak: 'break-word',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                &gt; {user?.fullName || user?.username || 'User'}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                {illumin80Status?.isIllumin80 && (
                  <span style={{
                    fontSize: '10px',
                    padding: '3px 6px',
                    background: 'rgba(255, 215, 0, 0.2)',
                    border: '1px solid #ffd700',
                    borderRadius: '0',
                    color: '#ffd700',
                    fontWeight: '600',
                    fontFamily: 'monospace',
                    letterSpacing: '0.5px',
                    boxShadow: '0 0 8px rgba(255, 215, 0, 0.3)',
                    whiteSpace: 'nowrap'
                  }}>
                    [ILLUMIN80]
                  </span>
                )}
                {streak > 0 && (
                  <span style={{
                    fontSize: '10px',
                    padding: '3px 6px',
                    background: 'rgba(0, 255, 0, 0.2)',
                    border: '1px solid #00ff00',
                    borderRadius: '0',
                    color: '#00ff00',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px',
                    fontFamily: 'monospace',
                    letterSpacing: '0.5px',
                    boxShadow: '0 0 8px rgba(0, 255, 0, 0.3)',
                    whiteSpace: 'nowrap'
                  }}>
                    <Zap style={{ width: '10px', height: '10px' }} />
                    [{streak}D]
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid rgba(0, 255, 0, 0.3)',
          background: 'rgba(0, 0, 0, 0.4)',
          position: 'relative',
          zIndex: 1
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
                  backgroundColor: activeTab === tab.id ? 'rgba(0, 255, 0, 0.1)' : 'transparent',
                  borderTop: 'none',
                  borderLeft: 'none',
                  borderRight: 'none',
                  borderBottom: activeTab === tab.id ? '2px solid #00ff00' : 'none',
                  color: activeTab === tab.id ? '#00ff00' : 'rgba(0, 255, 0, 0.6)',
                  transition: 'all 0.2s',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '500',
                  fontFamily: 'monospace',
                  letterSpacing: '1px',
                  textTransform: 'uppercase'
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== tab.id) {
                    e.target.style.color = '#00ff00';
                    e.target.style.backgroundColor = 'rgba(0, 255, 0, 0.05)';
                    e.target.style.boxShadow = '0 0 10px rgba(0, 255, 0, 0.2)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== tab.id) {
                    e.target.style.color = 'rgba(0, 255, 0, 0.6)';
                    e.target.style.backgroundColor = 'transparent';
                    e.target.style.boxShadow = 'none';
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
          height: 'calc(100% - 200px)',
          overflowY: 'auto',
          padding: '16px 24px',
          position: 'relative',
          zIndex: 1
        }}>
          {activeTab === 'profile' && <ProfileSection />}
          {activeTab === 'wallet' && <WalletSection balances={walletBalances} loading={loading} />}
          {activeTab === 'achievements' && <AchievementsSection achievements={achievements} loading={loading} illumin80Status={illumin80Status} />}
          {activeTab === 'settings' && <SettingsSection />}
        </div>
        
        {/* Terminal footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid rgba(0, 255, 0, 0.3)',
          background: 'rgba(0, 0, 0, 0.4)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'relative',
          zIndex: 1
        }}>
          <div style={{
            fontSize: '10px',
            color: '#00ff00',
            fontFamily: 'monospace',
            opacity: 0.5
          }}>
            TERMINAL.SESSION.ID: {Math.random().toString(36).substring(2, 8).toUpperCase()}
          </div>
          <div style={{
            fontSize: '10px',
            color: '#ffd700',
            fontFamily: 'monospace',
            opacity: 0.5
          }}>
            AUTHENTICATED.USER.SESSION
          </div>
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
        background: 'rgba(0, 0, 0, 0.6)',
        border: '2px solid #00ff00',
        borderRadius: '0',
        padding: '24px',
        boxShadow: '0 0 20px rgba(0, 255, 0, 0.2)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Terminal header */}
        <div style={{
          fontSize: '12px',
          color: '#00ff00',
          fontFamily: 'monospace',
          marginBottom: '20px',
          opacity: 0.7,
          letterSpacing: '2px'
        }}>
          [PROFILE.DATA.ACCESS]
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '32px' }}>
          <div style={{ position: 'relative' }}>
            <img
              src={user?.imageUrl}
              alt="Profile"
              style={{
                width: '100px',
                height: '100px',
                borderRadius: '0',
                border: '3px solid #00ff00',
                cursor: 'pointer',
                filter: 'brightness(1.1) contrast(1.2)',
                boxShadow: '0 0 30px rgba(0, 255, 0, 0.3)'
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
                borderRadius: '0',
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                border: '2px solid #00ff00',
                color: '#00ff00',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '16px',
                boxShadow: '0 0 10px rgba(0, 255, 0, 0.5)'
              }}
            >
              ✏️
            </button>
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ 
              color: '#00ff00', 
              fontSize: '24px', 
              marginBottom: '8px',
              fontFamily: 'monospace',
              letterSpacing: '1px'
            }}>
              &gt; {user?.fullName || user?.username || 'User'}
            </h3>
            <p style={{ 
              color: 'rgba(0, 255, 0, 0.7)', 
              marginBottom: '8px',
              fontFamily: 'monospace',
              fontSize: '14px'
            }}>
              @{user?.username || 'username'}
            </p>
            <p style={{ 
              color: 'rgba(0, 255, 0, 0.7)',
              fontFamily: 'monospace',
              fontSize: '14px'
            }}>
              {user?.primaryEmailAddress?.emailAddress}
            </p>
          </div>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ 
              color: '#00ff00', 
              fontSize: '12px',
              fontFamily: 'monospace',
              letterSpacing: '1px',
              textTransform: 'uppercase'
            }}>
              [USERNAME]
            </label>
            <div style={{
              marginTop: '4px',
              padding: '12px',
              background: 'rgba(0, 0, 0, 0.4)',
              borderRadius: '0',
              color: '#00ff00',
              border: '1px solid rgba(0, 255, 0, 0.3)',
              fontFamily: 'monospace',
              letterSpacing: '1px'
            }}>
              &gt; {user?.username || 'Not set'}
            </div>
          </div>
          
          <div>
            <label style={{ 
              color: '#00ff00', 
              fontSize: '12px',
              fontFamily: 'monospace',
              letterSpacing: '1px',
              textTransform: 'uppercase'
            }}>
              [FULL.NAME]
            </label>
            <div style={{
              marginTop: '4px',
              padding: '12px',
              background: 'rgba(0, 0, 0, 0.4)',
              borderRadius: '0',
              color: '#00ff00',
              border: '1px solid rgba(0, 255, 0, 0.3)',
              fontFamily: 'monospace',
              letterSpacing: '1px'
            }}>
              &gt; {user?.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Not set'}
            </div>
          </div>
          
          <div>
            <label style={{ 
              color: '#00ff00', 
              fontSize: '12px',
              fontFamily: 'monospace',
              letterSpacing: '1px',
              textTransform: 'uppercase'
            }}>
              [MEMBER.SINCE]
            </label>
            <div style={{
              marginTop: '4px',
              padding: '12px',
              background: 'rgba(0, 0, 0, 0.4)',
              borderRadius: '0',
              color: '#00ff00',
              border: '1px solid rgba(0, 255, 0, 0.3)',
              fontFamily: 'monospace',
              letterSpacing: '1px'
            }}>
              &gt; {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
            </div>
          </div>
        </div>
        
        <button
          onClick={() => openUserProfile()}
          style={{
            marginTop: '24px',
            width: '100%',
            padding: '12px',
            background: 'rgba(0, 0, 0, 0.6)',
            color: '#00ff00',
            borderRadius: '0',
            border: '2px solid #00ff00',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '14px',
            fontFamily: 'monospace',
            letterSpacing: '1px',
            textTransform: 'uppercase',
            transition: 'all 0.2s',
            boxShadow: '0 0 10px rgba(0, 255, 0, 0.3)'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(0, 255, 0, 0.1)';
            e.target.style.boxShadow = '0 0 20px rgba(0, 255, 0, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(0, 0, 0, 0.6)';
            e.target.style.boxShadow = '0 0 10px rgba(0, 255, 0, 0.3)';
          }}
        >
          [EDIT.PROFILE.DETAILS]
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
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Account Settings */}
      <div style={{
        background: 'rgba(0, 0, 0, 0.6)',
        border: '2px solid #00ff00',
        borderRadius: '0',
        padding: '24px',
        boxShadow: '0 0 20px rgba(0, 255, 0, 0.2)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Terminal header */}
        <div style={{
          fontSize: '12px',
          color: '#00ff00',
          fontFamily: 'monospace',
          marginBottom: '20px',
          opacity: 0.7,
          letterSpacing: '2px'
        }}>
          [ACCOUNT.SETTINGS.ACCESS]
        </div>
        <h3 style={{ 
          color: '#00ff00', 
          fontSize: '18px', 
          marginBottom: '20px',
          fontFamily: 'monospace',
          letterSpacing: '1px'
        }}>
          &gt; Account Management
        </h3>
        
        {/* Account Information Display */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
          <div style={{
            padding: '16px',
            background: 'rgba(0, 0, 0, 0.4)',
            borderRadius: '0',
            border: '1px solid rgba(0, 255, 0, 0.3)'
          }}>
            <p style={{ 
              color: '#00ff00', 
              fontWeight: '500',
              fontFamily: 'monospace',
              fontSize: '14px',
              letterSpacing: '1px',
              marginBottom: '8px'
            }}>
              &gt; Email Address
            </p>
            <p style={{ 
              color: 'rgba(0, 255, 0, 0.7)', 
              fontSize: '12px',
              fontFamily: 'monospace',
              margin: 0
            }}>
              {user?.primaryEmailAddress?.emailAddress}
            </p>
          </div>
          
          <div style={{
            padding: '16px',
            background: 'rgba(0, 0, 0, 0.4)',
            borderRadius: '0',
            border: '1px solid rgba(0, 255, 0, 0.3)'
          }}>
            <p style={{ 
              color: '#00ff00', 
              fontWeight: '500',
              fontFamily: 'monospace',
              fontSize: '14px',
              letterSpacing: '1px',
              marginBottom: '8px'
            }}>
              &gt; Security Status
            </p>
            <p style={{ 
              color: 'rgba(0, 255, 0, 0.7)', 
              fontSize: '12px',
              fontFamily: 'monospace',
              margin: 0
            }}>
              Password: {user?.passwordEnabled ? 'CONFIGURED' : 'NOT SET'} | 2FA: {user?.twoFactorEnabled ? 'ENABLED' : 'DISABLED'}
            </p>
          </div>
        </div>
        
        {/* Single Action Button */}
        <button
          onClick={() => openUserProfile()}
          style={{
            width: '100%',
            padding: '12px',
            background: 'rgba(0, 0, 0, 0.6)',
            color: '#00ff00',
            borderRadius: '0',
            border: '2px solid #00ff00',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '14px',
            fontFamily: 'monospace',
            letterSpacing: '1px',
            textTransform: 'uppercase',
            transition: 'all 0.2s',
            boxShadow: '0 0 10px rgba(0, 255, 0, 0.3)'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(0, 255, 0, 0.1)';
            e.target.style.boxShadow = '0 0 20px rgba(0, 255, 0, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(0, 0, 0, 0.6)';
            e.target.style.boxShadow = '0 0 10px rgba(0, 255, 0, 0.3)';
          }}
        >
          [MANAGE.ACCOUNT.SETTINGS]
        </button>
      </div>
    </div>
  );
}