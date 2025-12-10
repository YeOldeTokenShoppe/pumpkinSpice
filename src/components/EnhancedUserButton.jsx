'use client';
import { UserButton, useUser, useClerk } from '@clerk/nextjs';
import { useState, useEffect } from 'react';
import { checkUserIllumin80Status } from '@/utils/firestore-illumin80';
import { UserModal } from './UserModal';

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}

export function EnhancedUserButton({ 
  appearance,
  illumin80Status: providedStatus = null
}) {
  const { user, isSignedIn, isLoaded } = useUser();
  const { openSignIn } = useClerk();
  const isMobile = useIsMobile();
  const buttonSize = isMobile ? '2.5rem' : '3.75rem';
  const [illumin80Status, setIllumin80Status] = useState(providedStatus);
  const [streak, setStreak] = useState(0);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // If status is provided as prop, use it
    if (providedStatus) {
      setIllumin80Status(providedStatus);
      return;
    }

    // Otherwise fetch it
    async function checkStatus() {
      if (user) {
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
    }
    checkStatus();
  }, [user, providedStatus]);

  useEffect(() => {
    // Check and update streak
    async function checkStreak() {
      if (user?.id) {
        try {
          const response = await fetch('/api/check-streak', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id })
          });
          if (response.ok) {
            const data = await response.json();
            setStreak(data.currentStreak || 0);
          }
        } catch (error) {
          console.error('Error checking streak:', error);
        }
      }
    }
    checkStreak();
  }, [user]);

  // If Clerk isn't loaded yet, show nothing or a placeholder
  if (!isLoaded) {
    return (
      <div style={{
        width: buttonSize,
        height: buttonSize,
        borderRadius: '12px',
        background: 'rgba(255, 255, 255, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div className="animate-pulse w-10 h-10 bg-white/20 rounded-lg" />
      </div>
    );
  }

  // Merge provided appearance with enhancements
  const enhancedAppearance = {
    ...appearance,
    elements: {
      ...appearance?.elements,
      avatarBox: {
        ...appearance?.elements?.avatarBox,
        border: illumin80Status?.isIllumin80 
          ? "2px solid #FFD700" 
          : (appearance?.elements?.avatarBox?.border || "2px solid rgba(255, 255, 255, 0.2)"),
        boxShadow: illumin80Status?.isIllumin80 
          ? "0 0 15px rgba(255, 215, 0, 0.4)" 
          : (appearance?.elements?.avatarBox?.boxShadow || "0 2px 8px rgba(0, 0, 0, 0.3)")
      },
      userButtonPopoverCard: {
        background: 'rgba(26, 26, 46, 0.95)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        ...appearance?.elements?.userButtonPopoverCard
      }
    }
  };

  // If not signed in, show a custom sign-in button
  if (!isSignedIn) {
    return (
      <button
        onClick={() => openSignIn()}
        style={{
          width: buttonSize,
          height: buttonSize,
          borderRadius: '12px',
          overflow: 'hidden',
          padding: 0,
          border: '2px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
          background: 'rgba(0, 0, 0, 0.5)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        aria-label="Sign in"
      >
        <svg 
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          style={{ color: 'white' }}
        >
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </button>
    );
  }

  // If signed in but no user data yet, show loading state
  if (!user) {
    return (
      <div style={{
        width: buttonSize,
        height: buttonSize,
        borderRadius: '12px',
        background: 'rgba(255, 255, 255, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div className="animate-pulse w-10 h-10 bg-white/20 rounded-lg" />
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="relative transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500"
        style={{
          width: buttonSize,
          height: buttonSize,
          borderRadius: '12px',
          overflow: 'hidden',
          padding: 0,
          border: illumin80Status?.isIllumin80 
            ? "2px solid #FFD700" 
            : "2px solid rgba(255, 255, 255, 0.2)",
          boxShadow: illumin80Status?.isIllumin80 
            ? "0 0 15px rgba(255, 215, 0, 0.4)" 
            : "0 2px 8px rgba(0, 0, 0, 0.3)",
          background: 'rgba(0, 0, 0, 0.5)',
          cursor: 'pointer'
        }}
        aria-label="Open user menu"
      >
        <img
          src={user?.imageUrl || '/default-avatar.png'}
          alt={user?.fullName || 'User'}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
          onError={(e) => {
            e.target.src = '/default-avatar.png';
          }}
        />
      </button>
      
      {showModal && (
        <UserModal 
          isOpen={showModal} 
          onClose={() => setShowModal(false)}
          illumin80Status={illumin80Status}
        />
      )}
      
      {/* Keep the original UserButton hidden but functional for auth */}
      <div style={{ display: 'none' }}>
        <UserButton 
          appearance={enhancedAppearance}
          userProfileMode="modal"
          userProfileProps={{
            additionalOAuthScopes: {},
            appearance: enhancedAppearance
          }}
        >
          <UserButton.UserProfilePage 
            label="Achievements"
            labelIcon={<span>🏆</span>}
            url="achievements"
          >
            <AchievementsPage user={user} illumin80Status={illumin80Status} streak={streak} />
          </UserButton.UserProfilePage>
        </UserButton>
      </div>
      
      {/* Inject custom content into the Clerk dropdown */}
      <style jsx global>{`
        /* Move Illumin80 badge below username */
        ${illumin80Status?.isIllumin80 ? `
          /* Ensure proper layout for the user preview section */
          .cl-userButtonPopoverCard .cl-userPreview {
            flex-direction: column !important;
            align-items: flex-start !important;
          }
          
          /* Style the secondary identifier as our Illumin80 badge */
          .cl-userButtonPopoverCard .cl-userPreviewSecondaryIdentifier {
            display: block !important;
            background: linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(0, 255, 255, 0.1));
            border: 1px solid #FFD700;
            border-radius: 8px;
            padding: 6px 10px;
            margin-top: 8px;
            font-size: 12px;
            color: #FFD700 !important;
            text-align: center;
            width: fit-content;
          }
          
          .cl-userButtonPopoverCard .cl-userPreviewSecondaryIdentifier:before {
            content: "⚜️ Illumin80 • Rank #${illumin80Status.rank} • Top ${illumin80Status.percentile}%";
            color: #FFD700;
          }
          
          /* Hide the actual email text */
          .cl-userButtonPopoverCard .cl-userPreviewSecondaryIdentifier span {
            display: none;
          }
        ` : ''}
        
        /* Style the Manage account button to look like achievements */
        .cl-userButtonPopoverActionButton__manageAccount {
          background: linear-gradient(135deg, rgba(138, 43, 226, 0.1), rgba(30, 144, 255, 0.1)) !important;
          border: 1px solid rgba(138, 43, 226, 0.3) !important;
          margin: 8px 0 !important;
          transition: all 0.2s ease !important;
        }
        
        .cl-userButtonPopoverActionButton__manageAccount:hover {
          background: linear-gradient(135deg, rgba(138, 43, 226, 0.2), rgba(30, 144, 255, 0.2)) !important;
        }
        
        .cl-userButtonPopoverActionButton__manageAccount .cl-userButtonPopoverActionButtonText {
          display: none;
        }
        
        .cl-userButtonPopoverActionButton__manageAccount:before {
          content: "🏆 View Achievements & Stats";
          color: #fff;
          font-size: 14px;
          font-weight: 500;
        }
        
        .cl-userButtonPopoverActionButton__manageAccount:hover:before {
          color: #00FFFF;
        }
      `}</style>
    </>
  );
}

// Achievements Page Component - with better dark theme colors and streak
function AchievementsPage({ user, illumin80Status, streak = 0 }) {
  const [stats, setStats] = useState({
    totalBurned: illumin80Status?.burnedAmount || 0,
    totalStaked: 0,
    joinDate: null,
    achievements: [],
    streak: streak,
    bestStreak: 0,
    lastCheckIn: null
  });

  useEffect(() => {
    async function loadStats() {
      try {
        const response = await fetch(`/api/user-stats/${user.id}`);
        if (response.ok) {
          const data = await response.json();
          setStats(prev => ({ ...prev, ...data }));
        }
      } catch (error) {
        console.error('Error loading user stats:', error);
      }
    }
    
    if (user?.id) {
      loadStats();
    }
  }, [user]);

  const achievements = [
    {
      id: 'illumin80',
      name: 'Illumin80 Member',
      description: illumin80Status?.isIllumin80 
        ? `${illumin80Status.title} • Top ${illumin80Status.percentile}%`
        : 'Burn tokens to join the elite',
      icon: '⚜️',
      earned: illumin80Status?.isIllumin80,
      special: true
    },
    {
      id: 'streak_7',
      name: 'Week Warrior',
      description: '7 day check-in streak',
      icon: '🔥',
      earned: stats.streak >= 7,
      special: false
    },
    {
      id: 'streak_30',
      name: 'Dedicated',
      description: '30 day check-in streak',
      icon: '💫',
      earned: stats.streak >= 30,
      special: true
    },
    {
      id: 'early_adopter',
      name: 'Early Adopter',
      description: 'Joined in the first month',
      icon: '🌅',
      earned: stats.joinDate && new Date(stats.joinDate) < new Date('2024-02-01')
    },
    {
      id: 'whale',
      name: 'Whale',
      description: 'Burned over 1,000,000 tokens',
      icon: '🐋',
      earned: stats.totalBurned >= 1000000
    },
    {
      id: 'diamond_hands',
      name: 'Diamond Hands',
      description: 'Staked tokens for 30+ days',
      icon: '💎',
      earned: stats.totalStaked > 0
    },
    {
      id: 'fire_starter',
      name: 'Fire Starter',
      description: 'First token burn',
      icon: '🔥',
      earned: stats.totalBurned > 0
    }
  ];

  const getStreakColor = (streakCount) => {
    if (streakCount >= 30) return '#FFD700'; // Gold
    if (streakCount >= 7) return '#FF6B35';  // Orange
    if (streakCount >= 3) return '#00FFFF';  // Cyan
    return '#999';                            // Gray
  };

  const getStreakEmoji = (streakCount) => {
    if (streakCount >= 30) return '💫';
    if (streakCount >= 7) return '🔥';
    if (streakCount >= 3) return '✨';
    return '📅';
  };

  return (
    <div style={{ 
      padding: '20px',
      background: '#1a1a2e',
      minHeight: '100%'
    }}>
      <h2 style={{ 
        fontSize: '24px', 
        fontWeight: 'bold',
        marginBottom: '20px',
        color: '#fff'
      }}>
        Your Achievements
      </h2>

      {/* Streak Section */}
      <div style={{
        background: stats.streak > 0 
          ? `linear-gradient(135deg, rgba(255, 107, 53, 0.2), rgba(255, 215, 0, 0.1))`
          : 'rgba(255, 255, 255, 0.05)',
        border: stats.streak > 0 
          ? `1px solid ${getStreakColor(stats.streak)}`
          : '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '20px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '32px', marginBottom: '8px' }}>
          {getStreakEmoji(stats.streak)}
        </div>
        <h3 style={{ 
          color: getStreakColor(stats.streak), 
          margin: 0,
          fontSize: '20px',
          fontWeight: 'bold'
        }}>
          {stats.streak > 0 ? `${stats.streak} Day Streak!` : 'Start Your Streak'}
        </h3>
        <p style={{ 
          color: '#999', 
          margin: '8px 0 0 0',
          fontSize: '13px'
        }}>
          {stats.streak > 0 
            ? `Keep checking in daily to maintain your streak`
            : `Check in daily to build your streak and earn rewards`}
        </p>
        {stats.bestStreak > 0 && (
          <div style={{ 
            marginTop: '12px',
            paddingTop: '12px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <span style={{ color: '#666', fontSize: '12px' }}>
              Best Streak: {stats.bestStreak} days
            </span>
          </div>
        )}
      </div>
      
      {/* Illumin80 Status */}
      {illumin80Status?.isIllumin80 ? (
        <div style={{
          background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(0, 255, 255, 0.1))',
          border: '2px solid #FFD700',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '20px',
          boxShadow: '0 4px 15px rgba(255, 215, 0, 0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '32px' }}>⚜️</span>
            <div style={{ flex: 1 }}>
              <h3 style={{ 
                color: '#FFD700', 
                margin: 0,
                fontSize: '18px',
                fontWeight: 'bold'
              }}>
                {illumin80Status.title}
              </h3>
              <p style={{ 
                color: '#00FFFF', 
                margin: '4px 0 0 0',
                fontSize: '14px'
              }}>
                Rank #{illumin80Status.rank} of {illumin80Status.totalQualifying} • Top {illumin80Status.percentile}% of all users
              </p>
            </div>
          </div>
          <div style={{ 
            marginTop: '12px', 
            paddingTop: '12px', 
            borderTop: '1px solid rgba(255, 215, 0, 0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#999', fontSize: '13px' }}>Tokens Burned</span>
              <span style={{ color: '#FFD700', fontSize: '14px', fontWeight: 'bold' }}>
                🔥 {illumin80Status.burnedAmount?.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '24px' }}>🔥</span>
            <div style={{ flex: 1 }}>
              <h3 style={{ 
                color: '#fff', 
                margin: 0,
                fontSize: '16px',
                fontWeight: 'bold'
              }}>
                Join the Illumin80
              </h3>
              <p style={{ 
                color: '#999', 
                margin: '4px 0 0 0',
                fontSize: '14px'
              }}>
                Burn more tokens to join the elite members
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Achievements Grid */}
      <div style={{ marginTop: '20px' }}>
        <h3 style={{ 
          fontSize: '16px', 
          color: '#999',
          marginBottom: '12px'
        }}>
          All Achievements ({achievements.filter(a => a.earned).length}/{achievements.length})
        </h3>
        
        <div style={{ display: 'grid', gap: '12px' }}>
          {achievements.map((achievement) => (
            <div
              key={achievement.id}
              style={{
                background: achievement.earned 
                  ? achievement.special 
                    ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(0, 255, 255, 0.05))'
                    : 'rgba(255, 255, 255, 0.08)'
                  : 'rgba(255, 255, 255, 0.02)',
                border: achievement.earned 
                  ? achievement.special 
                    ? '1px solid #FFD700'
                    : '1px solid rgba(255, 255, 255, 0.2)'
                  : '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: '8px',
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                opacity: achievement.earned ? 1 : 0.5,
                transition: 'all 0.3s ease'
              }}
            >
              <span style={{ 
                fontSize: '24px',
                filter: achievement.earned ? 'none' : 'grayscale(100%)'
              }}>
                {achievement.icon}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ 
                  fontSize: '14px', 
                  fontWeight: '600',
                  color: achievement.earned ? '#fff' : '#666'
                }}>
                  {achievement.name}
                </div>
                <div style={{ 
                  fontSize: '12px', 
                  color: achievement.earned ? '#999' : '#555',
                  marginTop: '2px'
                }}>
                  {achievement.description}
                </div>
              </div>
              {achievement.earned && (
                <span style={{ color: '#4CAF50', fontSize: '16px' }}>✓</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Stats Section */}
      <div style={{ 
        marginTop: '24px',
        paddingTop: '20px',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <h3 style={{ 
          fontSize: '16px', 
          color: '#999',
          marginBottom: '12px'
        }}>
          Your Stats
        </h3>
        <div style={{ display: 'grid', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#999', fontSize: '14px' }}>Current Streak</span>
            <span style={{ color: getStreakColor(stats.streak), fontSize: '14px', fontWeight: 'bold' }}>
              {stats.streak} days
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#999', fontSize: '14px' }}>Total Burned</span>
            <span style={{ color: '#fff', fontSize: '14px' }}>
              {stats.totalBurned?.toLocaleString() || '0'} tokens
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#999', fontSize: '14px' }}>Total Staked</span>
            <span style={{ color: '#fff', fontSize: '14px' }}>
              {stats.totalStaked?.toLocaleString() || '0'} tokens
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#999', fontSize: '14px' }}>Member Since</span>
            <span style={{ color: '#fff', fontSize: '14px' }}>
              {stats.joinDate ? new Date(stats.joinDate).toLocaleDateString() : 'N/A'}
            </span>
          </div>
          {stats.lastCheckIn && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#999', fontSize: '14px' }}>Last Check-in</span>
              <span style={{ color: '#fff', fontSize: '14px' }}>
                {new Date(stats.lastCheckIn).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}