import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useItems } from '../contexts/ItemContext.jsx';
import { ArrowLeft, Star, MapPin, Clock, User, MessageSquare, Coins } from 'lucide-react';

const ItemDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { fetchItemById, requestSwap, redeemWithPoints } = useItems();
  
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [swapMessage, setSwapMessage] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadItem();
  }, [id]);

  const loadItem = async () => {
    const itemData = await fetchItemById(id);
    if (itemData) {
      setItem(itemData);
    } else {
      navigate('/');
    }
    setLoading(false);
  };

  const handleSwapRequest = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setSubmitting(true);
    const result = await requestSwap(item._id, swapMessage);
    
    if (result.success) {
      alert('Swap request sent successfully!');
      setShowSwapModal(false);
      setSwapMessage('');
    } else {
      alert(result.error || 'Failed to send swap request');
    }
    setSubmitting(false);
  };

  const handleRedeem = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (user.points < item.pointValue) {
      alert('You don\'t have enough points to redeem this item');
      return;
    }

    setSubmitting(true);
    const result = await redeemWithPoints(item._id);
    
    if (result.success) {
      alert('Item redeemed successfully!');
      navigate('/dashboard');
    } else {
      alert(result.error || 'Failed to redeem item');
    }
    setSubmitting(false);
  };

  const canInteract = () => {
    return isAuthenticated && item && user._id !== item.uploadedBy._id && item.status === 'available';
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="container">
        <div className="error-message">
          Item not found
        </div>
      </div>
    );
  }

  return (
    <div className="item-detail">
      <div className="container">
        <button onClick={() => navigate(-1)} className="back-btn">
          <ArrowLeft size={20} />
          Back
        </button>

        <div className="item-content">
          <div className="item-gallery">
            <div className="main-image">
              <img 
                src={item.images?.[currentImageIndex] || '/api/placeholder/600/400'} 
                alt={item.title}
                className="gallery-image"
              />
            </div>
            {item.images && item.images.length > 1 && (
              <div className="thumbnail-gallery">
                {item.images.map((image, index) => (
                  <button
                    key={index}
                    className={`thumbnail ${index === currentImageIndex ? 'active' : ''}`}
                    onClick={() => setCurrentImageIndex(index)}
                  >
                    <img src={image} alt={`${item.title} ${index + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="item-info">
            <div className="item-header">
              <h1 className="item-title">{item.title}</h1>
              <div className={`item-status ${item.status}`}>
                {item.status}
              </div>
            </div>

            <div className="item-meta">
              <div className="meta-item">
                <span className="meta-label">Category:</span>
                <span className="badge">{item.category}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Type:</span>
                <span>{item.type}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Size:</span>
                <span>{item.size}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Condition:</span>
                <div className="condition">
                  <Star size={16} />
                  <span>{item.condition}</span>
                </div>
              </div>
            </div>

            <div className="item-description">
              <h3>Description</h3>
              <p>{item.description}</p>
            </div>

            {item.tags && item.tags.length > 0 && (
              <div className="item-tags">
                <h4>Tags</h4>
                <div className="tags-list">
                  {item.tags.map((tag, index) => (
                    <span key={index} className="tag">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="uploader-info card">
              <div className="uploader-details">
                <div className="uploader-avatar">
                  <User size={24} />
                </div>
                <div>
                  <h4>Listed by</h4>
                  <p>{item.uploadedBy?.name}</p>
                </div>
              </div>
              <div className="upload-date">
                <Clock size={16} />
                <span>Listed {new Date(item.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="point-value">
              <Coins size={24} />
              <span className="points">{item.pointValue} points</span>
            </div>

            {canInteract() && (
              <div className="action-buttons">
                <button 
                  className="btn btn-primary"
                  onClick={() => setShowSwapModal(true)}
                  disabled={submitting}
                >
                  <MessageSquare size={18} />
                  Request Swap
                </button>
                <button 
                  className="btn btn-accent"
                  onClick={handleRedeem}
                  disabled={submitting || (user.points < item.pointValue)}
                >
                  <Coins size={18} />
                  Redeem with Points
                </button>
              </div>
            )}

            {!isAuthenticated && (
              <div className="auth-prompt card">
                <p>Please log in to request swaps or redeem items</p>
                <button 
                  className="btn btn-primary"
                  onClick={() => navigate('/login')}
                >
                  Log In
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Swap Request Modal */}
      {showSwapModal && (
        <div className="modal-overlay" onClick={() => setShowSwapModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Request Swap</h3>
              <button 
                className="modal-close"
                onClick={() => setShowSwapModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>Send a message to {item.uploadedBy?.name} about this swap:</p>
              <textarea
                value={swapMessage}
                onChange={(e) => setSwapMessage(e.target.value)}
                placeholder="Hi! I'm interested in swapping for this item..."
                className="form-textarea"
                rows="4"
              />
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-outline"
                onClick={() => setShowSwapModal(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleSwapRequest}
                disabled={submitting || !swapMessage.trim()}
              >
                {submitting ? 'Sending...' : 'Send Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .item-detail {
          padding: 2rem 0;
          min-height: calc(100vh - 80px);
        }

        .back-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: none;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          margin-bottom: 2rem;
          padding: 0.5rem;
          border-radius: 4px;
          transition: all 0.3s ease;
        }

        .back-btn:hover {
          background-color: var(--border);
          color: var(--text-primary);
        }

        .item-content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 3rem;
          align-items: start;
        }

        .item-gallery {
          position: sticky;
          top: 100px;
        }

        .main-image {
          margin-bottom: 1rem;
        }

        .gallery-image {
          width: 100%;
          height: 400px;
          object-fit: cover;
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        }

        .thumbnail-gallery {
          display: flex;
          gap: 0.5rem;
          overflow-x: auto;
          padding: 0.5rem 0;
        }

        .thumbnail {
          flex-shrink: 0;
          width: 80px;
          height: 80px;
          border: 2px solid transparent;
          border-radius: 8px;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.3s ease;
          background: none;
          padding: 0;
        }

        .thumbnail:hover,
        .thumbnail.active {
          border-color: var(--primary-color);
        }

        .thumbnail img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .item-header {
          display: flex;
          justify-content: space-between;
          align-items: start;
          margin-bottom: 2rem;
        }

        .item-title {
          font-size: 2rem;
          color: var(--text-primary);
          margin: 0;
        }

        .item-status {
          padding: 6px 12px;
          border-radius: 6px;
          font-weight: 500;
          text-transform: capitalize;
        }

        .item-status.available {
          background-color: #e8f5e9;
          color: var(--success-color);
        }

        .item-status.pending {
          background-color: #fff3e0;
          color: var(--warning-color);
        }

        .item-status.swapped {
          background-color: #f5f5f5;
          color: var(--text-light);
        }

        .item-meta {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 2rem;
          padding: 1.5rem;
          background-color: #f8f9fa;
          border-radius: 12px;
        }

        .meta-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .meta-label {
          font-weight: 500;
          color: var(--text-secondary);
        }

        .condition {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          color: var(--warning-color);
        }

        .item-description {
          margin-bottom: 2rem;
        }

        .item-description h3 {
          margin-bottom: 1rem;
          color: var(--text-primary);
        }

        .item-description p {
          line-height: 1.6;
          color: var(--text-secondary);
        }

        .item-tags {
          margin-bottom: 2rem;
        }

        .item-tags h4 {
          margin-bottom: 1rem;
          color: var(--text-primary);
        }

        .tags-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .tag {
          background-color: var(--secondary-color);
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.875rem;
        }

        .uploader-info {
          padding: 1.5rem;
          margin-bottom: 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .uploader-details {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .uploader-avatar {
          width: 48px;
          height: 48px;
          background-color: var(--primary-color);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .uploader-details h4 {
          margin: 0;
          color: var(--text-secondary);
          font-size: 0.875rem;
        }

        .uploader-details p {
          margin: 0;
          font-weight: 500;
          color: var(--text-primary);
        }

        .upload-date {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--text-light);
          font-size: 0.875rem;
        }

        .point-value {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 1rem;
          background-color: var(--accent-color);
          color: white;
          border-radius: 12px;
          margin-bottom: 2rem;
        }

        .points {
          font-size: 1.25rem;
          font-weight: 600;
        }

        .action-buttons {
          display: flex;
          gap: 1rem;
        }

        .action-buttons .btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .auth-prompt {
          text-align: center;
          padding: 2rem;
        }

        .auth-prompt p {
          margin-bottom: 1rem;
          color: var(--text-secondary);
        }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal {
          background-color: white;
          border-radius: 12px;
          max-width: 500px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 1px solid var(--border);
        }

        .modal-header h3 {
          margin: 0;
          color: var(--text-primary);
        }

        .modal-close {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: var(--text-secondary);
          padding: 0.25rem;
        }

        .modal-close:hover {
          color: var(--text-primary);
        }

        .modal-body {
          padding: 1.5rem;
        }

        .modal-body p {
          margin-bottom: 1rem;
          color: var(--text-secondary);
        }

        .modal-footer {
          display: flex;
          gap: 1rem;
          padding: 1.5rem;
          border-top: 1px solid var(--border);
        }

        .modal-footer .btn {
          flex: 1;
        }

        @media (max-width: 768px) {
          .item-content {
            grid-template-columns: 1fr;
            gap: 2rem;
          }

          .item-gallery {
            position: static;
          }

          .gallery-image {
            height: 300px;
          }

          .item-meta {
            grid-template-columns: 1fr;
          }

          .action-buttons {
            flex-direction: column;
          }

          .modal {
            width: 95%;
            margin: 1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default ItemDetail;