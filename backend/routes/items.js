import express from 'express';
import Item from '../models/Item.js';
import User from '../models/User.js';
import Swap from '../models/Swap.js';
import { protect, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// @desc    Get all items (with filters and search)
// @route   GET /api/items
// @access  Public
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      search,
      category,
      size,
      condition,
      minPoints,
      maxPoints,
      sort = '-createdAt',
      page = 1,
      limit = 20
    } = req.query;

    // Build query
    const query = { status: 'available' };

    // Search functionality
    if (search) {
      query.$text = { $search: search };
    }

    // Filters
    if (category) query.category = category;
    if (size) query.size = size;
    if (condition) query.condition = condition;
    if (minPoints || maxPoints) {
      query.pointValue = {};
      if (minPoints) query.pointValue.$gte = parseInt(minPoints);
      if (maxPoints) query.pointValue.$lte = parseInt(maxPoints);
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const items = await Item.find(query)
      .populate('uploadedBy', 'name')
      .sort(sort)
      .limit(parseInt(limit))
      .skip(skip)
      .lean();

    // Get total count for pagination
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

// @desc    Get single item
// @route   GET /api/items/:id
// @access  Public
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id)
      .populate('uploadedBy', 'name email')
      .populate('swapRequests.requester', 'name');

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Increment views (but not for the owner)
    if (!req.user || req.user._id.toString() !== item.uploadedBy._id.toString()) {
      await item.incrementViews();
    }

    res.status(200).json(item);
  } catch (error) {
    console.error('Get item error:', error);
    
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'Item not found' });
    }
    
    res.status(500).json({ message: 'Server error while fetching item' });
  }
});

// @desc    Create new item
// @route   POST /api/items
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      type,
      size,
      condition,
      images,
      tags,
      pointValue
    } = req.body;

    // Validation
    if (!title || !description || !category || !type || !size || !condition || !images || !pointValue) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    if (!Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ message: 'Please provide at least one image' });
    }

    if (images.length > 5) {
      return res.status(400).json({ message: 'Maximum 5 images allowed' });
    }

    // Create item
    const item = await Item.create({
      title: title.trim(),
      description: description.trim(),
      category,
      type,
      size,
      condition,
      images,
      tags: tags || [],
      pointValue: parseInt(pointValue),
      uploadedBy: req.user._id
    });

    // Update user stats
    await req.user.updateStats('itemsListed');

    // Populate uploader info
    const populatedItem = await Item.findById(item._id)
      .populate('uploadedBy', 'name email');

    res.status(201).json({
      message: 'Item created successfully',
      item: populatedItem
    });
  } catch (error) {
    console.error('Create item error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    
    res.status(500).json({ message: 'Server error while creating item' });
  }
});

// @desc    Update item
// @route   PUT /api/items/:id
// @access  Private (Owner only)
router.put('/:id', protect, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Check ownership
    if (item.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this item' });
    }

    // Can't update if item is not pending or available
    if (!['pending', 'available'].includes(item.status)) {
      return res.status(400).json({ message: 'Cannot update item with current status' });
    }

    // Update fields
    const updateFields = [
      'title', 'description', 'category', 'type', 'size', 
      'condition', 'images', 'tags', 'pointValue'
    ];

    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'title' || field === 'description') {
          item[field] = req.body[field].trim();
        } else if (field === 'pointValue') {
          item[field] = parseInt(req.body[field]);
        } else {
          item[field] = req.body[field];
        }
      }
    });

    await item.save();

    const updatedItem = await Item.findById(item._id)
      .populate('uploadedBy', 'name email');

    res.status(200).json({
      message: 'Item updated successfully',
      item: updatedItem
    });
  } catch (error) {
    console.error('Update item error:', error);
    
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'Item not found' });
    }
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    
    res.status(500).json({ message: 'Server error while updating item' });
  }
});

// @desc    Delete item
// @route   DELETE /api/items/:id
// @access  Private (Owner only)
router.delete('/:id', protect, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Check ownership
    if (item.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this item' });
    }

    // Can't delete if there are pending swaps
    if (item.swapRequests.some(req => req.status === 'pending')) {
      return res.status(400).json({ message: 'Cannot delete item with pending swap requests' });
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

// @desc    Request swap for item
// @route   POST /api/items/:id/swap
// @access  Private
router.post('/:id/swap', protect, async (req, res) => {
  try {
    const { message, offeredItemId } = req.body;
    
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    if (item.status !== 'available') {
      return res.status(400).json({ message: 'Item is not available for swap' });
    }

    // Can't swap own item
    if (item.uploadedBy.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot swap your own item' });
    }

    let offeredItem = null;
    if (offeredItemId) {
      offeredItem = await Item.findById(offeredItemId);
      if (!offeredItem || offeredItem.uploadedBy.toString() !== req.user._id.toString()) {
        return res.status(400).json({ message: 'Invalid offered item' });
      }
    }

    // Create swap request
    const swap = await Swap.create({
      itemRequested: item._id,
      itemOffered: offeredItemId || null,
      requester: req.user._id,
      owner: item.uploadedBy,
      type: offeredItemId ? 'direct_swap' : 'direct_swap',
      message: message || ''
    });

    // Add to item's swap requests
    await item.addSwapRequest(req.user._id, message);

    res.status(201).json({
      message: 'Swap request sent successfully',
      swap
    });
  } catch (error) {
    console.error('Swap request error:', error);
    
    if (error.message.includes('already have a pending')) {
      return res.status(400).json({ message: error.message });
    }
    
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'Item not found' });
    }
    
    res.status(500).json({ message: 'Server error while creating swap request' });
  }
});

// @desc    Redeem item with points
// @route   POST /api/items/:id/redeem
// @access  Private
router.post('/:id/redeem', protect, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    if (item.status !== 'available') {
      return res.status(400).json({ message: 'Item is not available for redemption' });
    }

    // Can't redeem own item
    if (item.uploadedBy.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot redeem your own item' });
    }

    // Check if user has enough points
    if (req.user.points < item.pointValue) {
      return res.status(400).json({ 
        message: 'Insufficient points',
        required: item.pointValue,
        available: req.user.points
      });
    }

    // Deduct points from user
    await req.user.deductPoints(item.pointValue);

    // Add points to item owner
    const itemOwner = await User.findById(item.uploadedBy);
    await itemOwner.addPoints(item.pointValue);

    // Create swap record
    const swap = await Swap.create({
      itemRequested: item._id,
      requester: req.user._id,
      owner: item.uploadedBy,
      type: 'point_redemption',
      pointsUsed: item.pointValue,
      status: 'completed'
    });

    // Update item status
    item.status = 'swapped';
    await item.save();

    // Update user stats
    await req.user.updateStats('swapsCompleted');
    await itemOwner.updateStats('swapsCompleted');

    res.status(200).json({
      message: 'Item redeemed successfully',
      swap,
      pointsRemaining: req.user.points - item.pointValue
    });
  } catch (error) {
    console.error('Point redemption error:', error);
    
    if (error.message === 'Insufficient points') {
      return res.status(400).json({ message: error.message });
    }
    
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'Item not found' });
    }
    
    res.status(500).json({ message: 'Server error while redeeming item' });
  }
});

// @desc    Get categories and types
// @route   GET /api/items/meta/categories
// @access  Public
router.get('/meta/categories', (req, res) => {
  const categories = {
    'Tops': ['T-shirt', 'Blouse', 'Sweater', 'Tank Top', 'Hoodie', 'Cardigan'],
    'Bottoms': ['Jeans', 'Trousers', 'Shorts', 'Skirt', 'Leggings'],
    'Dresses': ['Casual Dress', 'Formal Dress', 'Summer Dress', 'Maxi Dress'],
    'Outerwear': ['Jacket', 'Coat', 'Blazer', 'Vest'],
    'Shoes': ['Sneakers', 'Boots', 'Sandals', 'Heels', 'Flats'],
    'Accessories': ['Bag', 'Hat', 'Scarf', 'Belt', 'Jewelry'],
    'Activewear': ['Sports Bra', 'Workout Pants', 'Athletic Shorts'],
    'Formal': ['Suit', 'Evening Dress', 'Formal Shirt'],
    'Casual': ['Casual Shirt', 'Casual Pants', 'Casual Dress']
  };

  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '6', '8', '10', '12', '14', '16'];
  const conditions = ['Like New', 'Excellent', 'Good', 'Fair'];

  res.status(200).json({
    categories,
    sizes,
    conditions
  });
});

export default router;