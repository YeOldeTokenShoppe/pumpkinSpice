import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/utilities/firebaseClient';
import './CreateCandleModal.css';

export default function CreateCandleModal({ isOpen, onClose, onCandleCreated }) {
  const [formData, setFormData] = useState({
    username: '',
    message: '',
    burnedAmount: 1,
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image must be less than 5MB');
        return;
      }

      setImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      setError('');
    }
  };

  const uploadImage = async () => {
    if (!imageFile) return null;

    const timestamp = Date.now();
    const fileName = `candles/${timestamp}_${imageFile.name}`;
    const storageRef = ref(storage, fileName);
    
    const snapshot = await uploadBytes(storageRef, imageFile);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.username.trim()) {
      setError('Please enter your name');
      return;
    }

    if (!formData.message.trim()) {
      setError('Please enter a message');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Upload image if provided
      let imageUrl = null;
      if (imageFile) {
        imageUrl = await uploadImage();
      }

      // Save to Firestore
      const docData = {
        username: formData.username,
        message: formData.message,
        burnedAmount: parseInt(formData.burnedAmount) || 1,
        image: imageUrl,
        staked: false,
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'results'), docData);
      console.log('Candle created with ID:', docRef.id);

      // Notify parent component
      if (onCandleCreated) {
        onCandleCreated({
          ...docData,
          id: docRef.id,
          createdAt: new Date()
        });
      }

      // Reset form
      setFormData({
        username: '',
        message: '',
        burnedAmount: 1,
      });
      setImageFile(null);
      setImagePreview(null);
      
      // Close modal
      onClose();
    } catch (err) {
      console.error('Error creating candle:', err);
      setError('Failed to create candle. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        
        <h2>Light Your Candle</h2>
        <p className="modal-subtitle">Create a virtual candle to join the temple</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Your Name</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              placeholder="Enter your name"
              maxLength={50}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="message">Your Message</label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              placeholder="Share your thoughts, wishes, or prayers..."
              rows={4}
              maxLength={500}
              required
            />
            <span className="char-count">{formData.message.length}/500</span>
          </div>

          <div className="form-group">
            <label htmlFor="burnedAmount">Candle Size</label>
            <select
              id="burnedAmount"
              name="burnedAmount"
              value={formData.burnedAmount}
              onChange={handleInputChange}
            >
              <option value="1">Small Candle (1 unit)</option>
              <option value="5">Medium Candle (5 units)</option>
              <option value="10">Large Candle (10 units)</option>
              <option value="25">Grand Candle (25 units)</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="image">Add an Image (Optional)</label>
            <input
              type="file"
              id="image"
              accept="image/*"
              onChange={handleImageChange}
              className="file-input"
            />
            {imagePreview && (
              <div className="image-preview">
                <img src={imagePreview} alt="Preview" />
                <button 
                  type="button" 
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview(null);
                  }}
                  className="remove-image"
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="form-actions">
            <button 
              type="button" 
              onClick={onClose} 
              className="btn-cancel"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner"></span>
                  Creating Candle...
                </>
              ) : (
                <>
                  🕯️ Light Candle & Send via Drone
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}