"use client";

import React, { useState, useEffect, useCallback } from 'react';
import PuzzleModal from './PuzzleModal';
import SymbolReveal from './SymbolReveal';
import { useDailyPuzzleSequence } from '@/hooks/useDailyPuzzleSequence';
import { useUser } from '@clerk/nextjs';
import { DEV_MODE, resetPuzzleForDev } from '@/utilities/dailyPuzzleSequence';

const PuzzleSystem = ({ is80sMode, onSequenceComplete, isVisible = true }) => {
  const { isSignedIn, user } = useUser();
  const { 
    sequence: dailySequence, 
    isCompletedToday, 
    attempts,
    loading: sequenceLoading,
    validateSequence,
    recordPuzzleComplete,
    refreshSequence
  } = useDailyPuzzleSequence();
  
  const [puzzles, setPuzzles] = useState([
    { id: 1, completed: false, symbol: null, unlocked: true },
    { id: 2, completed: false, symbol: null, unlocked: false },
    { id: 3, completed: false, symbol: null, unlocked: false }
  ]);
  
  const [activePuzzle, setActivePuzzle] = useState(null);
  const [revealedSequence, setRevealedSequence] = useState([]);
  const [showSequence, setShowSequence] = useState(false);
  const [localPuzzlesSolved, setLocalPuzzlesSolved] = useState(0);
  const [showInstructions, setShowInstructions] = useState(false); // Start hidden
  const [showCompletionMessage, setShowCompletionMessage] = useState(false); // Start hidden
  const [isExpanded, setIsExpanded] = useState(false); // Start collapsed
  
  const handlePuzzleClick = (puzzle) => {
    if (puzzle.unlocked && !puzzle.completed) {
      setActivePuzzle(puzzle);
    }
  };
  
  const handlePuzzleComplete = useCallback((puzzleId) => {
    const puzzleIndex = puzzleId - 1;
    
    // Get the symbol from the daily sequence
    const assignedSymbol = dailySequence && dailySequence[puzzleIndex] 
      ? dailySequence[puzzleIndex]
      : null;
    
    if (!assignedSymbol) {
      console.warn('No daily sequence available for puzzle', puzzleId);
      return;
    }
    
    setPuzzles(prev => prev.map((p, index) => {
      if (p.id === puzzleId) {
        return { ...p, completed: true, symbol: assignedSymbol };
      } else if (index === puzzles.findIndex(pz => pz.id === puzzleId) + 1) {
        // Unlock next puzzle
        return { ...p, unlocked: true };
      }
      return p;
    }));
    
    // Track individual puzzle completion
    setLocalPuzzlesSolved(prev => prev + 1);
    if (recordPuzzleComplete) {
      recordPuzzleComplete(puzzleIndex);
    }
    
    setActivePuzzle(null);
  }, [dailySequence, puzzles, recordPuzzleComplete]);
  
  const handlePuzzleClose = () => {
    setActivePuzzle(null);
  };
  
  // Check if all puzzles are complete (but only for new completions, not reloads)
  useEffect(() => {
    // Don't show sequence if already completed today (prevents showing on page reload)
    if (isCompletedToday) {
      return;
    }
    
    const allComplete = puzzles.every(p => p.completed);
    if (allComplete && puzzles[0].symbol) {
      const sequence = puzzles.map(p => p.symbol.section);
      setRevealedSequence(puzzles.map(p => p.symbol));
      setShowSequence(true);
      
      // Notify parent component with the user-specific sequence
      if (onSequenceComplete) {
        onSequenceComplete(sequence);
      }
    }
  }, [puzzles, onSequenceComplete, isCompletedToday]);
  
  // Show already completed message if puzzle was completed today
  useEffect(() => {
    console.log('PuzzleSystem state:', {
      isCompletedToday,
      sequenceLoading,
      hasDailySequence: !!dailySequence,
      dailySequence
    });
    
    if (isCompletedToday && !sequenceLoading && dailySequence) {
      // Set puzzles to completed state but DON'T show sequence
      setPuzzles([
        { id: 1, completed: true, symbol: dailySequence[0], unlocked: true },
        { id: 2, completed: true, symbol: dailySequence[1], unlocked: true },
        { id: 3, completed: true, symbol: dailySequence[2], unlocked: true }
      ]);
      // Make sure sequence is not shown when already completed
      setShowSequence(false);
      setIsExpanded(false);
      setShowInstructions(false);
      setShowCompletionMessage(false);
    } else if (!isCompletedToday && !sequenceLoading) {
      // Reset puzzles to initial state when not completed
      console.log('Resetting puzzles to initial state');
      setPuzzles([
        { id: 1, completed: false, symbol: null, unlocked: true },
        { id: 2, completed: false, symbol: null, unlocked: false },
        { id: 3, completed: false, symbol: null, unlocked: false }
      ]);
      setShowSequence(false);
      setIsExpanded(false);
      setRevealedSequence([]);
    }
  }, [isCompletedToday, dailySequence, sequenceLoading]);
  
  if (!isVisible || sequenceLoading) return null;
  
  // Dev Mode Indicator - shows at top of screen when active
  const devModeIndicator = DEV_MODE && (
    <div style={{
      position: 'fixed',
      top: '5px',
      left: '50%',
      transform: 'translateX(-50%)',
      padding: '4px 12px',
      backgroundColor: 'rgba(255, 0, 0, 0.2)',
      border: '1px solid rgba(255, 0, 0, 0.5)',
      borderRadius: '4px',
      color: '#ff6b6b',
      fontSize: '0.7rem',
      fontFamily: 'monospace',
      zIndex: 10001,
      pointerEvents: 'none'
    }}>
      🛠️ DEV MODE
    </div>
  );
  
  // Handle symbol reveal separately - it's a full-screen modal
  if (showSequence) {
    return (
      <>
        {devModeIndicator}
        <SymbolReveal
          symbols={revealedSequence}
          is80sMode={is80sMode}
          onDismiss={() => {
            setShowSequence(false);
            setIsExpanded(false);
          }}
        />
      </>
    );
  }
  
  // Show just the icon when collapsed
  if (!isExpanded) {
    return (
      <>
        {devModeIndicator}
        <button
        onClick={() => {
          setIsExpanded(true);
          // Show appropriate messages when expanding
          if (isCompletedToday) {
            setShowCompletionMessage(true);
          } else {
            setShowInstructions(true);
          }
        }}
        style={{
          position: 'fixed',
          top: '50%',
          left: '20px',
          transform: 'translateY(-50%)',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          border: `2px solid ${is80sMode ? '#D946EF' : '#8e662b'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          backdropFilter: 'blur(10px)',
          transition: 'all 0.3s ease',
          boxShadow: is80sMode 
            ? '0 0 20px rgba(217, 70, 239, 0.3)' 
            : '0 0 20px rgba(141, 102, 43, 0.3)',
          zIndex: 1000
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
          e.currentTarget.style.boxShadow = is80sMode 
            ? '0 0 30px rgba(217, 70, 239, 0.5)' 
            : '0 0 30px rgba(141, 102, 43, 0.5)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
          e.currentTarget.style.boxShadow = is80sMode 
            ? '0 0 20px rgba(217, 70, 239, 0.3)' 
            : '0 0 20px rgba(141, 102, 43, 0.3)';
        }}
        title="Daily Puzzle Challenge"
      >
        <span style={{
          fontSize: '28px',
          color: is80sMode ? '#67e8f9' : '#FFD700',
          textShadow: is80sMode 
            ? '0 0 10px #67e8f9' 
            : '0 0 10px #FFD700',
          animation: 'pulse 2s ease-in-out infinite'
        }}>
          {isSignedIn ? '🎮' : '🔒'}
        </span>
        {/* New puzzle indicator */}
        {isSignedIn && !isCompletedToday && (
          <div style={{
            position: 'absolute',
            top: '-5px',
            right: '-5px',
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            backgroundColor: '#FF0000',
            border: '2px solid #000',
            animation: 'pulse 1.5s ease-in-out infinite'
          }} />
        )}
        </button>
        
        {/* Dev Reset Button (visible in collapsed state) */}
        {DEV_MODE && isSignedIn && (
          <button
            onClick={async () => {
              if (!user?.id) {
                alert('No user ID available');
                return;
              }
              
              if (!confirm('Reset puzzle for development testing?')) {
                return;
              }
              
              try {
                console.log('Attempting to reset puzzle for user:', user.id);
                const result = await resetPuzzleForDev(user.id);
                
                if (result) {
                  console.log('Puzzle reset successfully!');
                  
                  // Clear local storage
                  localStorage.removeItem(`puzzle_${user.id}`);
                  sessionStorage.clear();
                  
                  // Immediately refresh the sequence
                  if (refreshSequence) {
                    console.log('Refreshing sequence...');
                    await refreshSequence();
                  }
                  
                  alert('Puzzle reset! The page will refresh in 1 second.');
                  
                  // Shorter delay since we're refreshing the data first
                  setTimeout(() => {
                    // Force hard reload to bypass cache
                    window.location.href = window.location.href + '?t=' + Date.now();
                  }, 1000);
                } else {
                  alert('Failed to reset puzzle. Check console for details.');
                }
              } catch (error) {
                console.error('Error resetting puzzle:', error);
                alert('Error resetting puzzle: ' + error.message);
              }
            }}
            style={{
              position: 'fixed',
              top: 'calc(50% + 40px)',
              left: '20px',
              transform: 'translateY(-50%)',
              padding: '8px 12px',
              backgroundColor: 'rgba(255, 0, 0, 0.2)',
              border: '1px solid rgba(255, 0, 0, 0.5)',
              borderRadius: '6px',
              color: '#ff6b6b',
              fontSize: '0.75rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              zIndex: 1000
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 0, 0, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 0, 0, 0.2)';
            }}
            title="Reset puzzle for development"
          >
            🔧 Reset
          </button>
        )}
      </>
    );
  }
  
  // Show sign-in prompt if not signed in (but only when expanded)
  if (!isSignedIn && isExpanded) {
    return (
      <>
        {/* Collapse button */}
        <button
          onClick={() => {
            setIsExpanded(false);
            setShowInstructions(false);
            setShowSequence(false);
          }}
          style={{
            position: 'fixed',
            top: '20px',
            left: '20px',
            width: '30px',
            height: '30px',
            borderRadius: '50%',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '16px',
            zIndex: 1001
          }}
          title="Minimize"
        >
          ←
        </button>
        
        {showInstructions && (
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '20px',
            transform: 'translateY(-50%)',
            padding: '20px',
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            border: `2px solid ${is80sMode ? '#D946EF' : '#8e662b'}`,
            borderRadius: '15px',
            backdropFilter: 'blur(10px)',
            maxWidth: '250px',
            zIndex: 1000
          }}>
            {/* Close button */}
            <button
              onClick={() => setShowInstructions(false)}
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '14px',
                padding: 0,
                lineHeight: '1'
              }}
            >
              ×
            </button>
            <h3 style={{
              color: is80sMode ? '#D946EF' : '#8e662b',
              marginTop: 0,
              marginBottom: '15px'
            }}>
              Daily Puzzle Locked
            </h3>
            <p style={{
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '0.9rem',
              lineHeight: '1.4',
              margin: 0
            }}>
              Sign in to play today's unique puzzle and compete for rewards!
            </p>
          </div>
        )}
      </>
    );
  }
  
  // Show completion message if already done today (but only when expanded)
  if (isCompletedToday && isExpanded) {
    return (
      <>
        {/* Collapse button */}
        <button
          onClick={() => {
            setIsExpanded(false);
            setShowCompletionMessage(false);
            setShowSequence(false);
          }}
          style={{
            position: 'fixed',
            top: '20px',
            left: '20px',
            width: '30px',
            height: '30px',
            borderRadius: '50%',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '16px',
            zIndex: 1001
          }}
          title="Minimize"
        >
          ←
        </button>
        
        {showCompletionMessage && (
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '20px',
            transform: 'translateY(-50%)',
            padding: '20px',
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            border: '2px solid rgba(255, 215, 0, 0.5)',
            borderRadius: '15px',
            backdropFilter: 'blur(10px)',
            maxWidth: '250px',
            zIndex: 1000
          }}>
            {/* Close button */}
            <button
              onClick={() => setShowCompletionMessage(false)}
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '14px',
                padding: 0,
                lineHeight: '1'
              }}
            >
              ×
            </button>
            <h3 style={{
              color: '#FFD700',
              marginTop: 0,
              marginBottom: '15px'
            }}>
              ✨ Daily Complete!
            </h3>
            <p style={{
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '0.9rem',
              lineHeight: '1.4',
              marginBottom: '10px'
            }}>
              You've completed today's puzzle!
              Come back tomorrow for a new challenge.
            </p>
            <p style={{
              color: 'rgba(255, 255, 255, 0.5)',
              fontSize: '0.8rem',
              margin: 0
            }}>
              Attempts today: {attempts}
            </p>
            
            {/* Dev Reset Button */}
            {DEV_MODE && (
              <button
                onClick={async () => {
                  if (!user?.id) {
                    alert('No user ID available');
                    return;
                  }
                  
                  try {
                    console.log('=== PUZZLE RESET START ===');
                    console.log('User ID:', user.id);
                    console.log('Current isCompletedToday:', isCompletedToday);
                    console.log('Current attempts:', attempts);
                    
                    const success = await resetPuzzleForDev(user.id);
                    console.log('Reset result:', success);
                    
                    if (success) {
                      // Clear local storage in case there's caching
                      localStorage.removeItem('puzzleState');
                      sessionStorage.clear();
                      
                      // Immediately refresh the sequence
                      if (refreshSequence) {
                        console.log('Refreshing sequence...');
                        await refreshSequence();
                      }
                      
                      alert('Puzzle reset! The page will refresh in 1 second.');
                      
                      // Shorter delay since we're refreshing the data first
                      setTimeout(() => {
                        // Force hard reload to bypass cache
                        window.location.href = window.location.href + '?t=' + Date.now();
                      }, 1000);
                    } else {
                      alert('Failed to reset puzzle. Check console for details.');
                    }
                  } catch (error) {
                    console.error('Error resetting puzzle:', error);
                    alert('Error resetting puzzle: ' + error.message);
                  }
                }}
                style={{
                  marginTop: '15px',
                  padding: '8px 16px',
                  backgroundColor: 'rgba(255, 0, 0, 0.2)',
                  border: '1px solid rgba(255, 0, 0, 0.5)',
                  borderRadius: '6px',
                  color: '#ff6b6b',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 0, 0, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 0, 0, 0.2)';
                }}
              >
                🔧 Reset Puzzle (Dev)
              </button>
            )}
          </div>
        )}
      </>
    );
  }
  
  // Main puzzle UI - only show when expanded
  return (
    <>
      {/* Collapse/Help Toggle Button */}
      <button
        onClick={() => {
          if (showInstructions) {
            setIsExpanded(false);
            setShowInstructions(false);
            setShowCompletionMessage(false);
            setShowSequence(false);
          } else {
            setShowInstructions(true);
          }
        }}
        style={{
          position: 'fixed',
          top: '20px',
          left: '20px',
          width: '30px',
          height: '30px',
          borderRadius: '50%',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          border: `1px solid ${is80sMode ? 'rgba(217, 70, 239, 0.3)' : 'rgba(142, 102, 43, 0.3)'}`,
          color: is80sMode ? '#67e8f9' : '#8e662b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          fontSize: '16px',
          fontWeight: 'bold',
          backdropFilter: 'blur(10px)',
          transition: 'all 0.3s ease',
          zIndex: 1001
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
          e.currentTarget.style.transform = 'scale(1.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
          e.currentTarget.style.transform = 'scale(1)';
        }}
        title={showInstructions ? 'Minimize' : 'Show Instructions'}
      >
        {showInstructions ? '←' : '?'}
      </button>
      
      {/* Puzzle Slots Container */}
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '20px',
        transform: 'translateY(-50%)',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        zIndex: 1000
      }}>
        {puzzles.map((puzzle, index) => (
          <div
            key={puzzle.id}
            onClick={() => handlePuzzleClick(puzzle)}
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '12px',
              backgroundColor: puzzle.completed 
                ? is80sMode ? 'rgba(217, 70, 239, 0.3)' : 'rgba(141, 102, 43, 0.3)'
                : puzzle.unlocked 
                  ? 'rgba(255, 255, 255, 0.1)' 
                  : 'rgba(0, 0, 0, 0.5)',
              border: `2px solid ${
                puzzle.completed 
                  ? is80sMode ? '#D946EF' : '#8e662b'
                  : puzzle.unlocked 
                    ? 'rgba(255, 255, 255, 0.3)' 
                    : 'rgba(255, 255, 255, 0.1)'
              }`,
              cursor: puzzle.unlocked && !puzzle.completed ? 'pointer' : 'default',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.3s ease',
              opacity: puzzle.unlocked ? 1 : 0.5,
              boxShadow: puzzle.completed 
                ? is80sMode 
                  ? '0 0 20px rgba(217, 70, 239, 0.5)' 
                  : '0 0 20px rgba(141, 102, 43, 0.5)'
                : '0 4px 12px rgba(0, 0, 0, 0.3)'
            }}
            onMouseEnter={(e) => {
              if (puzzle.unlocked && !puzzle.completed) {
                e.currentTarget.style.transform = 'scale(1.1)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 255, 255, 0.2)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = puzzle.completed 
                ? is80sMode 
                  ? '0 0 20px rgba(217, 70, 239, 0.5)' 
                  : '0 0 20px rgba(141, 102, 43, 0.5)'
                : '0 4px 12px rgba(0, 0, 0, 0.3)';
            }}
          >
            {puzzle.completed ? (
              <span style={{ fontSize: '2.5rem' }}>{puzzle.symbol.symbol}</span>
            ) : puzzle.unlocked ? (
              <>
                <span style={{ 
                  fontSize: '1.5rem', 
                  color: 'rgba(255, 255, 255, 0.8)',
                  marginBottom: '4px'
                }}>?</span>
                <span style={{ 
                  fontSize: '0.7rem', 
                  color: 'rgba(255, 255, 255, 0.6)',
                  textAlign: 'center'
                }}>Puzzle {index + 1}</span>
              </>
            ) : (
              <span style={{ fontSize: '1.5rem', color: 'rgba(255, 255, 255, 0.3)' }}>🔒</span>
            )}
          </div>
        ))}
      </div>
      
      {/* Instructions Panel */}
      {!showSequence && showInstructions && (
        <div style={{
          position: 'fixed',
          top: '100px',
          left: '20px',
          padding: '15px 20px',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          border: '2px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '10px',
          backdropFilter: 'blur(10px)',
          maxWidth: '250px',
          zIndex: 999
        }}>
          {/* Close button */}
          <button
            onClick={() => setShowInstructions(false)}
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: 'rgba(255, 255, 255, 0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '12px',
              padding: 0,
              lineHeight: '1',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.9)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)';
            }}
          >
            ×
          </button>
          <h3 style={{
            color: is80sMode ? '#D946EF' : '#8e662b',
            marginTop: 0,
            marginBottom: '10px',
            fontSize: '1.2rem',
            paddingRight: '20px' // Make room for close button
          }}>
            The Path to Illumination
          </h3>
          <p style={{
            color: 'rgba(255, 255, 255, 0.8)',
            fontSize: '0.9rem',
            lineHeight: '1.4',
            margin: 0
          }}>
            Complete three sacred puzzles to reveal the divine sequence. 
            Click the symbols on the wheel in order to unlock your reward.
          </p>
        </div>
      )}
      
      {/* Active Puzzle Modal */}
      {activePuzzle && (
        <PuzzleModal
          puzzle={activePuzzle}
          onComplete={() => handlePuzzleComplete(activePuzzle.id)}
          onClose={handlePuzzleClose}
          is80sMode={is80sMode}
        />
      )}
      
      {/* CSS Animation for pulse effect */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(0.95);
          }
        }
      `}</style>
    </>
  );
};

export default PuzzleSystem;