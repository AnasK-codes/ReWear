import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Star, Clock } from 'lucide-react';

const ItemCard = ({ item }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return 'status-available';
      case 'pending': return 'status-pending';
      case 'swapped': return 'status-swapped';
      default: return '';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="card item-card">
      <div className="item-image-container">
        <img 
          src={item.images?.[0] || '/api/placeholder/300/200'} 
          alt={item.title}
          className="item-image"
        />
        <div className={`item-status ${getStatusColor(item.status)}`}>
          {item.status}
        </div>
      </div>
      
      <div className="card-body">
        <h3 className="item-title">{item.title}</h3>
        <p className="item-description">{item.description}</p>
        
        <div className="item-details">
          <div className="item-meta">
            <span className="item-category">{item.category}</span>
            <span className="item-size">Size: {item.size}</span>
          </div>
          
          <div className="item-info">
            <div className="item-condition">
              <Star size={16} />
              <span>{item.condition}</span>
            </div>
            <div className="item-date">
              <Clock size={16} />
              <span>{formatDate(item.createdAt)}</span>
            </div>
          </div>
        </div>

        <div className="item-points">
          <span className="points-value">{item.pointValue} points</span>
        </div>

        <Link to={`/item/${item._id}`} className="btn btn-primary">
          View Details
        </Link>
      </div>

      <style jsx>{`
        .item-card {
          transition: all 0.3s ease;
        }

        .item-image-container {
          position: relative;
          overflow: hidden;
        }

        .item-image {
          width: 100%;
          height: 200px;
          object-fit: cover;
          transition: transform 0.3s ease;
        }

        .item-card:hover .item-image {
          transform: scale(1.05);
        }

        .item-status {
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
          padding: 4px 8px;
          background-color: white;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 500;
          text-transform: capitalize;
        }

        .item-title {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: var(--text-primary);
        }

        .item-description {
          color: var(--text-secondary);
          font-size: 0.9rem;
          margin-bottom: 1rem;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .item-details {
          margin-bottom: 1rem;
        }

        .item-meta {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.5rem;
        }

        .item-category {
          background-color: var(--secondary-color);
          color: white;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .item-size {
          color: var(--text-secondary);
          font-size: 0.875rem;
        }

        .item-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: var(--text-light);
          font-size: 0.875rem;
        }

        .item-condition, .item-date {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .item-points {
          text-align: center;
          margin-bottom: 1rem;
        }

        .points-value {
          background-color: var(--accent-color);
          color: white;
          padding: 6px 12px;
          border-radius: 6px;
          font-weight: 600;
          font-size: 0.9rem;
        }
      `}</style>
    </div>
  );
};

export default ItemCard;