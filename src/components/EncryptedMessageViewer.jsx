import React, { useState, useRef, useEffect } from 'react';
import { decryptMessage, isMessageEncrypted } from '@/utilities/encryption';
import { gsap } from 'gsap';
import { ScrambleTextPlugin } from 'gsap/dist/ScrambleTextPlugin';
import './EncryptedMessageViewer.css';

// Register GSAP plugin
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrambleTextPlugin);
}

export default function EncryptedMessageViewer({ messageData, displayMode = 'label' }) {
  const [password, setPassword] = useState('');
  const [decryptedMessage, setDecryptedMessage] = useState('');
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [error, setError] = useState('');
  const [isDecrypting, setIsDecrypting] = useState(false);
  const messageRef = useRef(null);
  
  // Check if message is encrypted
  const encrypted = isMessageEncrypted(messageData);
  
  // For unencrypted messages, just display them
  if (!encrypted) {
    return (
      <div className={`message-viewer ${displayMode}`}>
        {messageData.message}
      </div>
    );
  }
  
  const handleDecrypt = async () => {
    if (!password) {
      setError('Please enter a password');
      return;
    }
    
    setIsDecrypting(true);
    setError('');
    
    try {
      const decrypted = await decryptMessage(
        messageData.encrypted,
        messageData.salt,
        messageData.iv,
        password
      );
      
      // Animate the decryption
      if (messageRef.current) {
        gsap.to(messageRef.current, {
          duration: 2,
          scrambleText: {
            text: decrypted,
            chars: 'upperAndLowerCase',
            revealDelay: 0.5,
            speed: 1,
          },
          onComplete: function() {
            setDecryptedMessage(decrypted);
            setShowPasswordInput(false);
          }
        });
      } else {
        setDecryptedMessage(decrypted);
        setShowPasswordInput(false);
      }
    } catch (err) {
      setError('Incorrect password');
      setIsDecrypting(false);
    }
  };
  
  const handleReEncrypt = () => {
    // Animate back to encrypted state
    if (messageRef.current) {
      const scrambled = '@#$%&*!?^~'.repeat(Math.ceil(decryptedMessage.length / 10))
        .substring(0, decryptedMessage.length);
      
      gsap.to(messageRef.current, {
        duration: 1,
        scrambleText: {
          text: scrambled,
          chars: '@#$%&*!?^~',
          speed: 0.3,
        },
        onComplete: function() {
          setDecryptedMessage('');
          setPassword('');
        }
      });
    } else {
      setDecryptedMessage('');
      setPassword('');
    }
  };
  
  // Generate scrambled display
  const scrambledDisplay = '@#$%&*!?^~◊†‡§¶∞≈Ω∆∑π'
    .repeat(Math.ceil(30 / 20))
    .substring(0, 30) + '...';
  
  if (displayMode === 'label') {
    // Compact display for candle labels
    return (
      <div className="encrypted-label-viewer">
        {decryptedMessage ? (
          <>
            <div ref={messageRef} className="decrypted-message">
              {decryptedMessage}
            </div>
            <button 
              className="lock-button"
              onClick={handleReEncrypt}
              title="Lock message"
            >
              🔓
            </button>
          </>
        ) : (
          <>
            <div className="encrypted-indicator">
              <span className="scrambled-text">{scrambledDisplay}</span>
              <button 
                className="unlock-button"
                onClick={() => setShowPasswordInput(true)}
                title="Unlock with password"
              >
                🔒
              </button>
            </div>
            
            {showPasswordInput && (
              <div className="password-popup">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleDecrypt()}
                  placeholder="Enter password"
                  autoFocus
                />
                <button onClick={handleDecrypt} disabled={isDecrypting}>
                  {isDecrypting ? '...' : '→'}
                </button>
                <button onClick={() => {
                  setShowPasswordInput(false);
                  setPassword('');
                  setError('');
                }}>
                  ×
                </button>
                {error && <div className="decrypt-error">{error}</div>}
              </div>
            )}
          </>
        )}
      </div>
    );
  }
  
  // Full display mode for detailed view
  return (
    <div className="encrypted-message-viewer">
      {decryptedMessage ? (
        <div className="decrypted-content">
          <div className="decrypt-header">
            <span className="decrypt-status">🔓 Decrypted Message</span>
            <button onClick={handleReEncrypt} className="re-encrypt-btn">
              Lock Again
            </button>
          </div>
          <div ref={messageRef} className="decrypted-text">
            {decryptedMessage}
          </div>
        </div>
      ) : (
        <div className="encrypted-content">
          <div className="encrypt-header">
            <span className="encrypt-status">🔒 Encrypted Message</span>
          </div>
          <div className="scrambled-preview">{scrambledDisplay}</div>
          
          {!showPasswordInput ? (
            <button 
              onClick={() => setShowPasswordInput(true)}
              className="decrypt-btn"
            >
              Enter Password to Decrypt
            </button>
          ) : (
            <div className="decrypt-form">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleDecrypt()}
                placeholder="Enter decryption password"
                className="password-input"
                autoFocus
              />
              <div className="decrypt-actions">
                <button 
                  onClick={handleDecrypt}
                  disabled={isDecrypting || !password}
                  className="confirm-decrypt"
                >
                  {isDecrypting ? 'Decrypting...' : 'Decrypt'}
                </button>
                <button 
                  onClick={() => {
                    setShowPasswordInput(false);
                    setPassword('');
                    setError('');
                  }}
                  className="cancel-decrypt"
                >
                  Cancel
                </button>
              </div>
              {error && <div className="decrypt-error">{error}</div>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}