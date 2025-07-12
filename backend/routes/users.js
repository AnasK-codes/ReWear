import express from 'express';
import Item from '../models/Item.js';
import Swap from '../models/Swap.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @desc    Get user's items
// @route   GET /api/users/items
// @access  Private
router.get('/items', protect, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const query = { uploadedBy: req.user._id };
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const items = await Item.find(query)
      .sort({ createdAt: -1 })
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
    console.error('Get user items error:', error);
    res.status(500).json({ message: 'Server error while fetching user items' });
  }
});

// @desc    Get user's swaps
// @route   GET /api/users/swaps
// @access  Private
router.get('/swaps', protect, async (req, res) => {
  try {
    const { status, type, page = 1, limit = 20 } = req.query;

    const query = {
      $or: [
        { requester: req.user._id },
        { owner: req.user._id }
      ]
    };

    if (status) query.status = status;
    if (type) query.type = type;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const swaps = await Swap.find(query)
      .populate('itemRequested', 'title images pointValue')
      .populate('itemOffered', 'title images pointValue')
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
    console.error('Get user swaps error:', error);
    res.status(500).json({ message: 'Server error while fetching user swaps' });
  }
});

// @desc    Get user's swap requests (received)
// @route   GET /api/users/swap-requests
// @access  Private
router.get('/swap-requests', protect, async (req, res) => {
  try {
    const { status = 'pending', page = 1, limit = 20 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const swaps = await Swap.find({
      owner: req.user._id,
      status: status
    })
      .populate('itemRequested', 'title images pointValue')
      .populate('itemOffered', 'title images pointValue')
      .populate('requester', 'name email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .lean();

    const total = await Swap.countDocuments({
      owner: req.user._id,
      status: status
    });

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
    console.error('Get swap requests error:', error);
    res.status(500).json({ message: 'Server error while fetching swap requests' });
  }
});

// @desc    Respond to swap request
// @route   PUT /api/users/swap-requests/:id
// @access  Private
router.put('/swap-requests/:id', protect, async (req, res) => {
  try {
    const { action } = req.body; // 'accept' or 'reject'

    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action. Use accept or reject' });
    }

    const swap = await Swap.findById(req.params.id)
      .populate('itemRequested')
      .populate('itemOffered')
      .populate('requester')
      .populate('owner');

    if (!swap) {
      return res.status(404).json({ message: 'Swap request not found' });
    }

    // Check ownership
    if (swap.owner._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to respond to this swap request' });
    }

    if (swap.status !== 'pending') {
      return res.status(400).json({ message: 'Swap request is no longer pending' });
    }

    if (action === 'accept') {
      // Update swap status
      await swap.updateStatus('accepted');

      // If it's a direct swap, mark both items as swapped
      if (swap.type === 'direct_swap' && swap.itemOffered) {
        swap.itemRequested.status = 'swapped';
        swap.itemOffered.status = 'swapped';
        await swap.itemRequested.save();
        await swap.itemOffered.save();
      } else {
        // Point redemption or single item swap
        swap.itemRequested.status = 'swapped';
        await swap.itemRequested.save();
      }

      // Update user stats
      await swap.requester.updateStats('swapsCompleted');
      await swap.owner.updateStats('swapsCompleted');

      // Award points for successful swap
      if (swap.type === 'direct_swap') {
        await swap.requester.addPoints(5); // Bonus points for successful swap
        await swap.owner.addPoints(5);
      }

      res.status(200).json({
        message: 'Swap request accepted successfully',
        swap
      });
    } else {
      // Reject the swap
      await swap.updateStatus('rejected');

      res.status(200).json({
        message: 'Swap request rejected',
        swap
      });
    }
  } catch (error) {
    console.error('Respond to swap request error:', error);
    
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'Swap request not found' });
    }
    
    res.status(500).json({ message: 'Server error while responding to swap request' });
  }
});

// @desc    Get user statistics
// @route   GET /api/users/stats
// @access  Private
router.get('/stats', protect, async (req, res) => {
  try {
    // Get user's item counts by status
    const itemStats = await Item.aggregate([
      { $match: { uploadedBy: req.user._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Get user's swap counts by status
    const swapStats = await Swap.aggregate([
      { 
        $match: { 
          $or: [
            { requester: req.user._id },
            { owner: req.user._id }
          ]
        }
      },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Get total views on user's items
    const viewStats = await Item.aggregate([
      { $match: { uploadedBy: req.user._id } },
      { $group: { _id: null, totalViews: { $sum: '$views' } } }
    ]);

    const stats = {
      user: req.user.stats,
      items: itemStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {}),
      swaps: swapStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {}),
      totalViews: viewStats[0]?.totalViews || 0,
      points: {
        current: req.user.points,
        earned: req.user.stats.pointsEarned,
        spent: req.user.stats.pointsSpent
      }
    };

    res.status(200).json(stats);
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ message: 'Server error while fetching user statistics' });
  }
});

// @desc    Get user profile (public)
// @route   GET /api/users/:id/profile
// @access  Public
router.get('/:id/profile', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('name profile stats createdAt')
      .lean();

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user's available items
    const items = await Item.find({
      uploadedBy: req.params.id,
      status: 'available'
    })
      .select('title images category pointValue createdAt')
      .sort({ createdAt: -1 })
      .limit(12)
      .lean();

    res.status(200).json({
      user,
      items,
      itemCount: items.length
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(500).json({ message: 'Server error while fetching user profile' });
  }
});

export default router;