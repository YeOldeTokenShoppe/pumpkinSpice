"use client";

import React, { useState, useEffect, useCallback } from 'react';
import PuzzleModal from './PuzzleModal';
import SymbolReveal from './SymbolReveal';
import { useDailyPuzzleSequence } from '@/hooks/useDailyPuzzleSequence';
import { useUser } from '@clerk/nextjs';

const PuzzleSystem = ({ is80sMode, onSequenceComplete, isVisible = true }) => {
  const { isSignedIn } = useUser();
  const { 
    sequence: dailySequence, 
    isCompletedToday, 
    attempts,
    loading: sequenceLoading,
    validateSequence,
    recordPuzzleComplete
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
  const [showInstructions, setShowInstructions] = useState(true);
  const [showCompletionMessage, setShowCompletionMessage] = useState(true);
  
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
  
  // Check if all puzzles are complete
  useEffect(() => {
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
  }, [puzzles, onSequenceComplete]);
  
  // Show already completed message if puzzle was completed today
  useEffect(() => {
    if (isCompletedToday && !sequenceLoading) {
      // Reset the UI if already completed
      setShowSequence(false);
      setPuzzles([
        { id: 1, completed: true, symbol: dailySequence?.[0], unlocked: true },
        { id: 2, completed: true, symbol: dailySequence?.[1], unlocked: true },
        { id: 3, completed: true, symbol: dailySequence?.[2], unlocked: true }
      ]);
    }
  }, [isCompletedToday, dailySequence, sequenceLoading]);
  
  if (!isVisible || sequenceLoading) return null;
  
  // Show sign-in prompt if not signed in
  if (!isSignedIn) {
    return (
      <>
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
  
  // Show completion message if already done today
  if (isCompletedToday) {
    return (
      <>
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
          </div>
        )}
      </>
    );
  }
  
  return (
    <>
      {/* Help Toggle Button - shows when instructions are hidden */}
      {!showInstructions && !showSequence && (
        <button
          onClick={() => setShowInstructions(true)}
          style={{
            position: 'fixed',
            top: '20px',
            left: '20px',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            border: `2px solid ${is80sMode ? 'rgba(217, 70, 239, 0.3)' : 'rgba(142, 102, 43, 0.3)'}`,
            color: is80sMode ? '#67e8f9' : '#8e662b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '18px',
            fontWeight: 'bold',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.3s ease',
            zIndex: 999
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
          title="Show Instructions"
        >
          ?
        </button>
      )}
      
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
      
      {/* Symbol Reveal */}
      {showSequence && (
        <SymbolReveal
          symbols={revealedSequence}
          is80sMode={is80sMode}
          onDismiss={() => setShowSequence(false)}
        />
      )}
    </>
  );
};

export default PuzzleSystem;