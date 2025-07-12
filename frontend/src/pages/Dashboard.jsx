import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import ItemCard from '../components/ItemCard.jsx';
import { User, Package, Star, Clock, Plus, Settings } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const [userItems, setUserItems] = useState([]);
  const [swaps, setSwaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('items');

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch user's items
      const itemsResponse = await fetch('http://localhost:5000/api/users/items', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (itemsResponse.ok) {
        const itemsData = await itemsResponse.json();
        setUserItems(itemsData);
      }

      // Fetch user's swaps
      const swapsResponse = await fetch('http://localhost:5000/api/users/swaps', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (swapsResponse.ok) {
        const swapsData = await swapsResponse.json();
        setSwaps(swapsData);
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSwapStatus = (swap) => {
    if (swap.status === 'pending') return 'Pending';
    if (swap.status === 'accepted') return 'Accepted';
    if (swap.status === 'completed') return 'Completed';
    if (swap.status === 'rejected') return 'Rejected';
    return swap.status;
  };

  const getSwapStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-warning';
      case 'accepted': return 'text-success';
      case 'completed': return 'text-success';
      case 'rejected': return 'text-error';
      default: return 'text-secondary';
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="container">
        {/* Profile Header */}
        <div className="profile-header card">
          <div className="profile-info">
            <div className="profile-avatar">
              <User size={48} />
            </div>
            <div className="profile-details">
              <h1>Welcome back, {user?.name}!</h1>
              <p className="profile-email">{user?.email}</p>
              <div className="profile-stats">
                <div className="stat">
                  <Package size={20} />
                  <span>{userItems.length} Items Listed</span>
                </div>
                <div className="stat">
                  <Star size={20} />
                  <span>{user?.points || 0} Points</span>
                </div>
                <div className="stat">
                  <Clock size={20} />
                  <span>{swaps.length} Total Swaps</span>
                </div>
              </div>
            </div>
          </div>
          <div className="profile-actions">
            <Link to="/add-item" className="btn btn-primary">
              <Plus size={18} />
              Add New Item
            </Link>
            <button className="btn btn-outline">
              <Settings size={18} />
              Settings
            </button>
          </div>
        </div>

        {/* Dashboard Tabs */}
        <div className="dashboard-tabs">
          <button 
            className={`tab-btn ${activeTab === 'items' ? 'active' : ''}`}
            onClick={() => setActiveTab('items')}
          >
            My Items ({userItems.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'swaps' ? 'active' : ''}`}
            onClick={() => setActiveTab('swaps')}
          >
            My Swaps ({swaps.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'items' && (
            <div className="items-tab">
              {userItems.length > 0 ? (
                <div className="grid grid-3">
                  {userItems.map(item => (
                    <ItemCard key={item._id} item={item} />
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <Package size={64} />
                  <h3>No Items Listed Yet</h3>
                  <p>Start by adding your first item to the community exchange!</p>
                  <Link to="/add-item" className="btn btn-primary">
                    Add Your First Item
                  </Link>
                </div>
              )}
            </div>
          )}

          {activeTab === 'swaps' && (
            <div className="swaps-tab">
              {swaps.length > 0 ? (
                <div className="swaps-list">
                  {swaps.map(swap => (
                    <div key={swap._id} className="swap-card card">
                      <div className="swap-info">
                        <div className="swap-items">
                          <div className="swap-item">
                            <img 
                              src={swap.itemRequested?.images?.[0] || '/api/placeholder/100/100'} 
                              alt={swap.itemRequested?.title}
                              className="swap-item-image"
                            />
                            <div>
                              <h4>{swap.itemRequested?.title}</h4>
                              <p className="text-secondary">Requested item</p>
                            </div>
                          </div>
                          
                          {swap.itemOffered && (
                            <>
                              <div className="swap-arrow">⇄</div>
                              <div className="swap-item">
                                <img 
                                  src={swap.itemOffered?.images?.[0] || '/api/placeholder/100/100'} 
                                  alt={swap.itemOffered?.title}
                                  className="swap-item-image"
                                />
                                <div>
                                  <h4>{swap.itemOffered?.title}</h4>
                                  <p className="text-secondary">Offered item</p>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                        
                        <div className="swap-details">
                          <span className={`swap-status ${getSwapStatusColor(swap.status)}`}>
                            {getSwapStatus(swap)}
                          </span>
                          <span className="swap-date">
                            {new Date(swap.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <Clock size={64} />
                  <h3>No Swaps Yet</h3>
                  <p>Browse items and start your first swap!</p>
                  <Link to="/" className="btn btn-primary">
                    Browse Items
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .dashboard {
          padding: 2rem 0;
          min-height: calc(100vh - 80px);
        }

        .profile-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          padding: 2rem;
        }

        .profile-info {
          display: flex;
          align-items: center;
          gap: 2rem;
        }

        .profile-avatar {
          width: 80px;
          height: 80px;
          background-color: var(--primary-color);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .profile-details h1 {
          margin-bottom: 0.5rem;
          color: var(--text-primary);
        }

        .profile-email {
          color: var(--text-secondary);
          margin-bottom: 1rem;
        }

        .profile-stats {
          display: flex;
          gap: 2rem;
        }

        .stat {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--text-secondary);
          font-size: 0.9rem;
        }

        .profile-actions {
          display: flex;
          gap: 1rem;
        }

        .dashboard-tabs {
          display: flex;
          gap: 0;
          margin-bottom: 2rem;
          border-bottom: 2px solid var(--border);
        }

        .tab-btn {
          padding: 1rem 2rem;
          background: none;
          border: none;
          border-bottom: 3px solid transparent;
          color: var(--text-secondary);
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .tab-btn:hover {
          color: var(--text-primary);
        }

        .tab-btn.active {
          color: var(--primary-color);
          border-bottom-color: var(--primary-color);
        }

        .tab-content {
          margin-top: 2rem;
        }

        .empty-state {
          text-align: center;
          padding: 4rem 2rem;
          color: var(--text-secondary);
        }

        .empty-state svg {
          color: var(--text-light);
          margin-bottom: 1rem;
        }

        .empty-state h3 {
          margin-bottom: 0.5rem;
          color: var(--text-primary);
        }

        .empty-state p {
          margin-bottom: 2rem;
        }

        .swaps-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .swap-card {
          padding: 1.5rem;
        }

        .swap-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .swap-items {
          display: flex;
          align-items: center;
          gap: 2rem;
        }

        .swap-item {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .swap-item-image {
          width: 60px;
          height: 60px;
          object-fit: cover;
          border-radius: 8px;
        }

        .swap-item h4 {
          margin-bottom: 0.25rem;
          font-size: 1rem;
        }

        .swap-arrow {
          font-size: 1.5rem;
          color: var(--text-light);
        }

        .swap-details {
          display: flex;
          flex-direction: column;
          align-items: end;
          gap: 0.5rem;
        }

        .swap-status {
          font-weight: 600;
          text-transform: capitalize;
        }

        .swap-date {
          font-size: 0.875rem;
          color: var(--text-light);
        }

        @media (max-width: 768px) {
          .profile-header {
            flex-direction: column;
            gap: 2rem;
            text-align: center;
          }

          .profile-info {
            flex-direction: column;
            text-align: center;
          }

          .profile-stats {
            justify-content: center;
            flex-wrap: wrap;
          }

          .profile-actions {
            width: 100%;
            justify-content: center;
          }

          .dashboard-tabs {
            overflow-x: auto;
          }

          .tab-btn {
            white-space: nowrap;
          }

          .swap-info {
            flex-direction: column;
            gap: 1rem;
            align-items: stretch;
          }

          .swap-items {
            flex-direction: column;
            align-items: stretch;
          }

          .swap-arrow {
            transform: rotate(90deg);
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;