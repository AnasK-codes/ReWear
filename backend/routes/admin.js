import express from 'express';
import Item from '../models/Item.js';
import User from '../models/User.js';
import Swap from '../models/Swap.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication and admin check to all routes
router.use(protect);
router.use(adminOnly);

// @desc    Get admin dashboard stats
// @route   GET /api/admin/stats
// @access  Private/Admin
router.get('/stats', async (req, res) => {
  try {
    // Get counts
    const totalUsers = await User.countDocuments();
    const totalItems = await Item.countDocuments();
    const pendingItems = await Item.countDocuments({ status: 'pending' });
    const totalSwaps = await Swap.countDocuments();
    const activeSwaps = await Swap.countDocuments({ status: 'pending' });

    // Get recent activity
    const recentUsers = await User.find()
      .select('name email createdAt')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    const recentItems = await Item.find()
      .populate('uploadedBy', 'name')
      .select('title status createdAt uploadedBy')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // Get item stats by category
    const categoryStats = await Item.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get status distribution
    const statusStats = await Item.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    res.status(200).json({
      counts: {
        totalUsers,
        totalItems,
        pendingItems,
        totalSwaps,
        activeSwaps
      },
      recent: {
        users: recentUsers,
        items: recentItems
      },
      analytics: {
        categories: categoryStats,
        statuses: statusStats
      }
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({ message: 'Server error while fetching admin statistics' });
  }
});

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
router.get('/users', async (req, res) => {
  try {
    const { search, role, sort = '-createdAt', page = 1, limit = 50 } = req.query;

    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (role) query.role = role;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const users = await User.find(query)
      .select('-password')
      .sort(sort)
      .limit(parseInt(limit))
      .skip(skip)
      .lean();

    // Add item count for each user
    for (let user of users) {
      user.itemCount = await Item.countDocuments({ uploadedBy: user._id });
    }

    const total = await User.countDocuments(query);

    res.status(200).json({
      users,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        hasNext: skip + users.length < total,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error while fetching users' });
  }
});

// @desc    Get pending items for moderation
// @route   GET /api/admin/items/pending
// @access  Private/Admin
router.get('/items/pending', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const items = await Item.find({ status: 'pending' })
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .lean();

    const total = await Item.countDocuments({ status: 'pending' });

    res.status(200).json({
      items,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        hasNext: skip + items.length < total,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Get pending items error:', error);
    res.status(500).json({ message: 'Server error while fetching pending items' });
  }
});

// @desc    Get all items
// @route   GET /api/admin/items
// @access  Private/Admin
router.get('/items', async (req, res) => {
  try {
    const { 
      search, 
      category, 
      status, 
      sort = '-createdAt', 
      page = 1, 
      limit = 50 
    } = req.query;

    const query = {};
    
    if (search) {
      query.$text = { $search: search };
    }
    if (category) query.category = category;
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const items = await Item.find(query)
      .populate('uploadedBy', 'name email')
      .sort(sort)
      .limit(parseInt(limit))
      .skip(skip)
      .lean();

    const total = await Item.countDocuments(query);

    res.status(200).json({
      items,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        hasNext: skip + items.length < total,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Get items error:', error);
    res.status(500).json({ message: 'Server error while fetching items' });
  }
});

// @desc    Approve item
// @route   POST /api/admin/items/:id/approve
// @access  Private/Admin
router.post('/items/:id/approve', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    if (item.status !== 'pending') {
      return res.status(400).json({ message: 'Item is not pending approval' });
    }

    item.status = 'available';
    await item.save();

    // Award points to user for approved item
    const user = await User.findById(item.uploadedBy);
    if (user) {
      await user.addPoints(10); // Bonus points for approved item
    }

    res.status(200).json({
      message: 'Item approved successfully',
      item
    });
  } catch (error) {
    console.error('Approve item error:', error);
    
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'Item not found' });
    }
    
    res.status(500).json({ message: 'Server error while approving item' });
  }
});

// @desc    Reject item
// @route   POST /api/admin/items/:id/reject
// @access  Private/Admin
router.post('/items/:id/reject', async (req, res) => {
  try {
    const { reason } = req.body;
    
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    if (item.status !== 'pending') {
      return res.status(400).json({ message: 'Item is not pending approval' });
    }

    item.status = 'rejected';
    if (reason) {
      item.rejectionReason = reason;
    }
    await item.save();

    res.status(200).json({
      message: 'Item rejected',
      item
    });
  } catch (error) {
    console.error('Reject item error:', error);
    
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'Item not found' });
    }
    
    res.status(500).json({ message: 'Server error while rejecting item' });
  }
});

// @desc    Delete item
// @route   DELETE /api/admin/items/:id
// @access  Private/Admin
router.delete('/items/:id', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Check for active swaps
    const activeSwaps = await Swap.countDocuments({
      $or: [
        { itemRequested: item._id },
        { itemOffered: item._id }
      ],
      status: { $in: ['pending', 'accepted'] }
    });

    if (activeSwaps > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete item with active swap requests' 
      });
    }

    await Item.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Delete item error:', error);
    
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'Item not found' });
    }
    
    res.status(500).json({ message: 'Server error while deleting item' });
  }
});

// @desc    Update user role
// @route   PUT /api/admin/users/:id/role
// @access  Private/Admin
router.put('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent removing the last admin
    if (user.role === 'admin' && role === 'user') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return res.status(400).json({ 
          message: 'Cannot remove the last admin user' 
        });
      }
    }

    user.role = role;
    await user.save();

    res.status(200).json({
      message: `User role updated to ${role}`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Update user role error:', error);
    
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(500).json({ message: 'Server error while updating user role' });
  }
});

// @desc    Get all swaps
// @route   GET /api/admin/swaps
// @access  Private/Admin
router.get('/swaps', async (req, res) => {
  try {
    const { status, type, page = 1, limit = 50 } = req.query;

    const query = {};
    if (status) query.status = status;
    if (type) query.type = type;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const swaps = await Swap.find(query)
      .populate('itemRequested', 'title images')
      .populate('itemOffered', 'title images')
      .populate('requester', 'name email')
      .populate('owner', 'name email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .lean();

    const total = await Swap.countDocuments(query);

    res.status(200).json({
      swaps,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        hasNext: skip + swaps.length < total,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Get swaps error:', error);
    res.status(500).json({ message: 'Server error while fetching swaps' });
  }
});

export default router;