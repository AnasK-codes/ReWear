import React, { createContext, useContext, useState, useEffect } from 'react';

const ItemContext = createContext();

export const useItems = () => {
  const context = useContext(ItemContext);
  if (!context) {
    throw new Error('useItems must be used within an ItemProvider');
  }
  return context;
};

export const ItemProvider = ({ children }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/items');
      if (response.ok) {
        const data = await response.json();
        setItems(data.items || []);
      }
    } catch (error) {
      console.error('Failed to fetch items:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchItemById = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/api/items/${id}`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Failed to fetch item:', error);
    }
    return null;
  };

  const addItem = async (itemData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/items', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(itemData)
      });

      if (response.ok) {
        const newItem = await response.json();
        setItems(prev => [newItem.item, ...prev]);
        return { success: true, item: newItem };
      } else {
        const error = await response.json();
        return { success: false, error: error.message };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  };

  const requestSwap = async (itemId, message) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/items/${itemId}/swap`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message })
      });

      if (response.ok) {
        return { success: true };
      } else {
        const error = await response.json();
        return { success: false, error: error.message };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  };

  const redeemWithPoints = async (itemId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/items/${itemId}/redeem`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        return { success: true };
      } else {
        const error = await response.json();
        return { success: false, error: error.message };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const value = {
    items,
    loading,
    fetchItems,
    fetchItemById,
    addItem,
    requestSwap,
    redeemWithPoints
  };

  return (
    <ItemContext.Provider value={value}>
      {children}
    </ItemContext.Provider>
  );
};