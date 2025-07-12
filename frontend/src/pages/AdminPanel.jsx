import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { Shield, Check, X, Eye, Trash2, Users, Package, AlertTriangle } from 'lucide-react';

const AdminPanel = () => {
  const { user } = useAuth();
  const [pendingItems, setPendingItems] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch pending items
      const pendingResponse = await fetch('http://localhost:5000/api/admin/items/pending', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (pendingResponse.ok) {
        const pendingData = await pendingResponse.json();
        setPendingItems(pendingData);
      }

      // Fetch all items
      const itemsResponse = await fetch('http://localhost:5000/api/admin/items', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (itemsResponse.ok) {
        const itemsData = await itemsResponse.json();
        setAllItems(itemsData);
      }

      // Fetch users
      const usersResponse = await fetch('http://localhost:5000/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(usersData);
      }
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleItemAction = async (itemId, action) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/items/${itemId}/${action}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        fetchAdminData(); // Refresh data
        setSelectedItem(null);
      } else {
        alert('Failed to perform action');
      }
    } catch (error) {
      console.error('Admin action failed:', error);
      alert('Failed to perform action');
    }
  };

  const deleteItem = async (itemId) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/items/${itemId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        fetchAdminData(); // Refresh data
        setSelectedItem(null);
      } else {
        alert('Failed to delete item');
      }
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Failed to delete item');
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
    <div className="admin-panel">
      <div className="container">
        <div className="admin-header">
          <div className="header-content">
            <Shield size={32} />
            <div>
              <h1>Admin Panel</h1>
              <p>Manage items and users</p>
            </div>
          </div>
          <div className="admin-stats">
            <div className="stat-card">
              <AlertTriangle size={24} />
              <div>
                <span className="stat-number">{pendingItems.length}</span>
                <span className="stat-label">Pending Items</span>
              </div>
            </div>
            <div className="stat-card">
              <Package size={24} />
              <div>
                <span className="stat-number">{allItems.length}</span>
                <span className="stat-label">Total Items</span>
              </div>
            </div>
            <div className="stat-card">
              <Users size={24} />
              <div>
                <span className="stat-number">{users.length}</span>
                <span className="stat-label">Users</span>
              </div>
            </div>
          </div>
        </div>

        <div className="admin-tabs">
          <button 
            className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            Pending Items ({pendingItems.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'items' ? 'active' : ''}`}
            onClick={() => setActiveTab('items')}
          >
            All Items ({allItems.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            Users ({users.length})
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'pending' && (
            <div className="pending-items">
              {pendingItems.length > 0 ? (
                <div className="items-grid">
                  {pendingItems.map(item => (
                    <div key={item._id} className="item-card card">
                      <div className="item-image">
                        <img 
                          src={item.images?.[0] || '/api/placeholder/200/150'} 
                          alt={item.title}
                        />
                      </div>
                      <div className="card-body">
                        <h4>{item.title}</h4>
                        <p className="item-description">{item.description}</p>
                        <div className="item-meta">
                          <span>By: {item.uploadedBy?.name}</span>
                          <span>{item.category} - {item.size}</span>
                        </div>
                        <div className="item-actions">
                          <button 
                            className="btn btn-small btn-outline"
                            onClick={() => setSelectedItem(item)}
                          >
                            <Eye size={16} />
                            View
                          </button>
                          <button 
                            className="btn btn-small btn-success"
                            onClick={() => handleItemAction(item._id, 'approve')}
                          >
                            <Check size={16} />
                            Approve
                          </button>
                          <button 
                            className="btn btn-small btn-error"
                            onClick={() => handleItemAction(item._id, 'reject')}
                          >
                            <X size={16} />
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <Check size={64} />
                  <h3>No Pending Items</h3>
                  <p>All items have been reviewed!</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'items' && (
            <div className="all-items">
              <div className="items-grid">
                {allItems.map(item => (
                  <div key={item._id} className="item-card card">
                    <div className="item-image">
                      <img 
                        src={item.images?.[0] || '/api/placeholder/200/150'} 
                        alt={item.title}
                      />
                      <span className={`status-badge ${item.status}`}>
                        {item.status}
                      </span>
                    </div>
                    <div className="card-body">
                      <h4>{item.title}</h4>
                      <div className="item-meta">
                        <span>By: {item.uploadedBy?.name}</span>
                        <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="item-actions">
                        <button 
                          className="btn btn-small btn-outline"
                          onClick={() => setSelectedItem(item)}
                        >
                          <Eye size={16} />
                          View
                        </button>
                        <button 
                          className="btn btn-small btn-error"
                          onClick={() => deleteItem(item._id)}
                        >
                          <Trash2 size={16} />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="users-list">
              <div className="users-table">
                <div className="table-header">
                  <span>User</span>
                  <span>Email</span>
                  <span>Items</span>
                  <span>Points</span>
                  <span>Joined</span>
                  <span>Role</span>
                </div>
                {users.map(user => (
                  <div key={user._id} className="table-row">
                    <span className="user-name">{user.name}</span>
                    <span>{user.email}</span>
                    <span>{user.itemCount || 0}</span>
                    <span>{user.points || 0}</span>
                    <span>{new Date(user.createdAt).toLocaleDateString()}</span>
                    <span className={`role-badge ${user.role}`}>{user.role}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Item Detail Modal */}
      {selectedItem && (
        <div className="modal-overlay" onClick={() => setSelectedItem(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedItem.title}</h3>
              <button 
                className="modal-close"
                onClick={() => setSelectedItem(null)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="item-images">
                {selectedItem.images?.map((image, index) => (
                  <img key={index} src={image} alt={`${selectedItem.title} ${index + 1}`} />
                ))}
              </div>
              <div className="item-details">
                <p><strong>Description:</strong> {selectedItem.description}</p>
                <p><strong>Category:</strong> {selectedItem.category}</p>
                <p><strong>Type:</strong> {selectedItem.type}</p>
                <p><strong>Size:</strong> {selectedItem.size}</p>
                <p><strong>Condition:</strong> {selectedItem.condition}</p>
                <p><strong>Point Value:</strong> {selectedItem.pointValue}</p>
                <p><strong>Listed by:</strong> {selectedItem.uploadedBy?.name}</p>
                <p><strong>Status:</strong> {selectedItem.status}</p>
              </div>
            </div>
            {selectedItem.status === 'pending' && (
              <div className="modal-footer">
                <button 
                  className="btn btn-success"
                  onClick={() => handleItemAction(selectedItem._id, 'approve')}
                >
                  Approve Item
                </button>
                <button 
                  className="btn btn-error"
                  onClick={() => handleItemAction(selectedItem._id, 'reject')}
                >
                  Reject Item
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .admin-panel {
          padding: 2rem 0;
          min-height: calc(100vh - 80px);
        }

        .admin-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          padding: 2rem;
          background-color: var(--surface);
          border-radius: 12px;
          box-shadow: 0 4px 6px var(--shadow);
        }

        .header-content {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .header-content svg {
          color: var(--primary-color);
        }

        .header-content h1 {
          margin: 0;
          color: var(--text-primary);
        }

        .header-content p {
          margin: 0;
          color: var(--text-secondary);
        }

        .admin-stats {
          display: flex;
          gap: 2rem;
        }

        .stat-card {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background-color: #f8f9fa;
          border-radius: 8px;
        }

        .stat-card svg {
          color: var(--primary-color);
        }

        .stat-number {
          display: block;
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .stat-label {
          display: block;
          font-size: 0.875rem;
          color: var(--text-secondary);
        }

        .admin-tabs {
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

        .items-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
        }

        .item-card {
          overflow: hidden;
        }

        .item-image {
          position: relative;
          height: 200px;
          overflow: hidden;
        }

        .item-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .status-badge {
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 500;
          text-transform: capitalize;
        }

        .status-badge.available {
          background-color: var(--success-color);
          color: white;
        }

        .status-badge.pending {
          background-color: var(--warning-color);
          color: white;
        }

        .status-badge.rejected {
          background-color: var(--error-color);
          color: white;
        }

        .item-description {
          color: var(--text-secondary);
          font-size: 0.9rem;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .item-meta {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          margin: 1rem 0;
          font-size: 0.875rem;
          color: var(--text-secondary);
        }

        .item-actions {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .btn-success {
          background-color: var(--success-color);
          color: white;
        }

        .btn-error {
          background-color: var(--error-color);
          color: white;
        }

        .empty-state {
          text-align: center;
          padding: 4rem 2rem;
          color: var(--text-secondary);
        }

        .empty-state svg {
          color: var(--success-color);
          margin-bottom: 1rem;
        }

        .users-table {
          background-color: var(--surface);
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px var(--shadow);
        }

        .table-header {
          display: grid;
          grid-template-columns: 2fr 2fr 1fr 1fr 1.5fr 1fr;
          gap: 1rem;
          padding: 1rem 1.5rem;
          background-color: #f8f9fa;
          font-weight: 600;
          color: var(--text-primary);
          border-bottom: 1px solid var(--border);
        }

        .table-row {
          display: grid;
          grid-template-columns: 2fr 2fr 1fr 1fr 1.5fr 1fr;
          gap: 1rem;
          padding: 1rem 1.5rem;
          border-bottom: 1px solid var(--border);
          align-items: center;
        }

        .table-row:last-child {
          border-bottom: none;
        }

        .table-row:hover {
          background-color: #f8f9fa;
        }

        .user-name {
          font-weight: 500;
          color: var(--text-primary);
        }

        .role-badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 500;
          text-transform: capitalize;
          text-align: center;
        }

        .role-badge.admin {
          background-color: var(--primary-color);
          color: white;
        }

        .role-badge.user {
          background-color: var(--secondary-color);
          color: white;
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
          max-width: 800px;
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

        .modal-close {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: var(--text-secondary);
        }

        .modal-body {
          padding: 1.5rem;
        }

        .item-images {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .item-images img {
          width: 100%;
          height: 200px;
          object-fit: cover;
          border-radius: 8px;
        }

        .item-details p {
          margin-bottom: 0.5rem;
          color: var(--text-secondary);
        }

        .item-details strong {
          color: var(--text-primary);
        }

        .modal-footer {
          display: flex;
          gap: 1rem;
          padding: 1.5rem;
          border-top: 1px solid var(--border);
        }

        @media (max-width: 768px) {
          .admin-header {
            flex-direction: column;
            gap: 2rem;
            text-align: center;
          }

          .admin-stats {
            flex-direction: column;
            width: 100%;
          }

          .items-grid {
            grid-template-columns: 1fr;
          }

          .table-header,
          .table-row {
            grid-template-columns: 1fr;
            gap: 0.5rem;
          }

          .table-header {
            display: none;
          }

          .table-row {
            display: flex;
            flex-direction: column;
            align-items: stretch;
            padding: 1rem;
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

export default AdminPanel;