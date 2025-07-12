import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please provide a description'],
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  category: {
    type: String,
    required: [true, 'Please select a category'],
    enum: ['Tops', 'Bottoms', 'Dresses', 'Outerwear', 'Shoes', 'Accessories', 'Activewear', 'Formal', 'Casual']
  },
  type: {
    type: String,
    required: [true, 'Please specify the type']
  },
  size: {
    type: String,
    required: [true, 'Please specify the size'],
    enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '6', '8', '10', '12', '14', '16']
  },
  condition: {
    type: String,
    required: [true, 'Please specify the condition'],
    enum: ['Like New', 'Excellent', 'Good', 'Fair']
  },
  images: [{
    type: String,
    required: true
  }],
  tags: [String],
  pointValue: {
    type: Number,
    required: [true, 'Please specify point value'],
    min: [1, 'Point value must be at least 1'],
    max: [100, 'Point value cannot be more than 100']
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'available', 'swapped', 'rejected'],
    default: 'pending'
  },
  swapRequests: [{
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    message: String,
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  views: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for search functionality
itemSchema.index({ title: 'text', description: 'text', tags: 'text' });
itemSchema.index({ category: 1, status: 1 });
itemSchema.index({ uploadedBy: 1 });
itemSchema.index({ createdAt: -1 });

// Virtual for swap request count
itemSchema.virtual('swapRequestCount').get(function() {
  return this.swapRequests.filter(req => req.status === 'pending').length;
});

// Method to add swap request
itemSchema.methods.addSwapRequest = function(requesterId, message) {
  const existingRequest = this.swapRequests.find(
    req => req.requester.toString() === requesterId.toString() && req.status === 'pending'
  );
  
  if (existingRequest) {
    throw new Error('You already have a pending swap request for this item');
  }
  
  this.swapRequests.push({
    requester: requesterId,
    message: message || '',
    status: 'pending'
  });
  
  return this.save();
};

// Method to update swap request status
itemSchema.methods.updateSwapRequest = function(requestId, status) {
  const request = this.swapRequests.id(requestId);
  if (!request) {
    throw new Error('Swap request not found');
  }
  
  request.status = status;
  return this.save();
};

// Method to increment views
itemSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

export default mongoose.model('Item', itemSchema);