"use client";

import React, { useState, useEffect } from 'react';

const PuzzleModal = ({ puzzle, onComplete, onClose, is80sMode }) => {
  const [isCompleting, setIsCompleting] = useState(false);
  
  // Placeholder puzzle types - you can replace with actual puzzle implementations
  const puzzleTypes = [
    {
      type: 'riddle',
      title: 'Ancient Riddle',
      description: 'Answer the sacred question',
      content: 'I am the beginning of eternity, the end of time and space. What am I?',
      solution: 'e'
    },
    {
      type: 'pattern',
      title: 'Divine Pattern',
      description: 'Complete the mystical sequence',
      content: '2, 4, 8, 16, ?',
      solution: '32'
    },
    {
      type: 'cipher',
      title: 'Celestial Cipher',
      description: 'Decode the heavenly message',
      content: 'ROT13: VYYHZVAN80',
      solution: 'ILLUMIN80'
    }
  ];
  
  const [currentPuzzle] = useState(puzzleTypes[puzzle.id - 1]);
  const [answer, setAnswer] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [attempts, setAttempts] = useState(0);
  
  const handleSubmit = () => {
    if (answer.toLowerCase() === currentPuzzle.solution.toLowerCase()) {
      setIsCompleting(true);
      setTimeout(() => {
        onComplete();
      }, 1000);
    } else {
      setAttempts(prev => prev + 1);
      setAnswer('');
      if (attempts >= 2) {
        setShowHint(true);
      }
    }
  };
  
  const handleSkip = () => {
    // Auto-complete puzzle for testing
    setIsCompleting(true);
    setTimeout(() => {
      onComplete();
    }, 500);
  };
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      backdropFilter: 'blur(20px)'
    }}>
      <div style={{
        width: '90%',
        maxWidth: '500px',
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        border: `3px solid ${is80sMode ? '#D946EF' : '#8e662b'}`,
        borderRadius: '20px',
        padding: '30px',
        boxShadow: is80sMode 
          ? '0 0 40px rgba(217, 70, 239, 0.5)' 
          : '0 0 40px rgba(141, 102, 43, 0.5)',
        position: 'relative',
        transform: isCompleting ? 'scale(1.05)' : 'scale(1)',
        transition: 'transform 0.3s ease'
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '15px',
            right: '15px',
            width: '30px',
            height: '30px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '18px'
          }}
        >
          ×
        </button>
        
        {/* Puzzle Header */}
        <div style={{ textAlign: 'center', marginBottom: '25px' }}>
          <h2 style={{
            color: is80sMode ? '#67e8f9' : '#ffffff',
            marginTop: 0,
            marginBottom: '10px',
            fontSize: '1.8rem',
            textShadow: is80sMode 
              ? '0 0 20px #67e8f9' 
              : '0 0 20px rgba(255, 255, 255, 0.5)'
          }}>
            {currentPuzzle.title}
          </h2>
          <p style={{
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '1rem',
            margin: 0
          }}>
            {currentPuzzle.description}
          </p>
        </div>
        
        {/* Puzzle Content */}
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '10px',
          padding: '20px',
          marginBottom: '20px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <p style={{
            color: '#ffffff',
            fontSize: '1.2rem',
            textAlign: 'center',
            margin: 0,
            fontFamily: currentPuzzle.type === 'cipher' ? 'monospace' : 'inherit'
          }}>
            {currentPuzzle.content}
          </p>
        </div>
        
        {/* Hint Section */}
        {showHint && (
          <div style={{
            backgroundColor: 'rgba(255, 215, 0, 0.1)',
            borderRadius: '8px',
            padding: '10px',
            marginBottom: '15px',
            border: '1px solid rgba(255, 215, 0, 0.3)'
          }}>
            <p style={{
              color: 'rgba(255, 215, 0, 0.9)',
              fontSize: '0.9rem',
              margin: 0
            }}>
              💡 Hint: The answer starts with "{currentPuzzle.solution[0]}"
            </p>
          </div>
        )}
        
        {/* Answer Input */}
        <div style={{ marginBottom: '20px' }}>
          <input
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="Enter your answer..."
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '1rem',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              border: '2px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              color: '#ffffff',
              outline: 'none'
            }}
            autoFocus
          />
        </div>
        
        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '10px',
          justifyContent: 'center'
        }}>
          <button
            onClick={handleSubmit}
            disabled={!answer || isCompleting}
            style={{
              padding: '12px 30px',
              fontSize: '1rem',
              backgroundColor: is80sMode 
                ? 'rgba(217, 70, 239, 0.3)' 
                : 'rgba(141, 102, 43, 0.3)',
              border: `2px solid ${is80sMode ? '#D946EF' : '#8e662b'}`,
              borderRadius: '8px',
              color: '#ffffff',
              cursor: answer && !isCompleting ? 'pointer' : 'not-allowed',
              opacity: answer && !isCompleting ? 1 : 0.5,
              transition: 'all 0.3s ease'
            }}
          >
            {isCompleting ? '✓ Correct!' : 'Submit'}
          </button>
          
          {/* Skip button for testing */}
          <button
            onClick={handleSkip}
            style={{
              padding: '12px 20px',
              fontSize: '0.9rem',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              color: 'rgba(255, 255, 255, 0.5)',
              cursor: 'pointer'
            }}
          >
            Skip (Dev)
          </button>
        </div>
        
        {/* Attempts Counter */}
        {attempts > 0 && (
          <p style={{
            textAlign: 'center',
            marginTop: '15px',
            marginBottom: 0,
            color: 'rgba(255, 255, 255, 0.5)',
            fontSize: '0.9rem'
          }}>
            Attempts: {attempts}
          </p>
        )}
      </div>
    </div>
  );
};

export default PuzzleModal;