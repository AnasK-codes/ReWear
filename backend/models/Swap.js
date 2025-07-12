import mongoose from 'mongoose';

const swapSchema = new mongoose.Schema({
  itemRequested: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: true
  },
  itemOffered: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item'
  },
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['direct_swap', 'point_redemption'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'completed', 'cancelled'],
    default: 'pending'
  },
  message: {
    type: String,
    maxlength: [500, 'Message cannot be more than 500 characters']
  },
  pointsUsed: {
    type: Number,
    default: 0
  },
  conversation: [{
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    message: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  completedAt: Date,
  cancelledAt: Date,
  rejectedAt: Date
}, {
  timestamps: true
});

// Index for queries
swapSchema.index({ requester: 1, status: 1 });
swapSchema.index({ owner: 1, status: 1 });
swapSchema.index({ itemRequested: 1 });
swapSchema.index({ status: 1, createdAt: -1 });

// Method to add message to conversation
swapSchema.methods.addMessage = function(senderId, message) {
  this.conversation.push({
    sender: senderId,
    message: message
  });
  return this.save();
};

// Method to update status
swapSchema.methods.updateStatus = function(newStatus) {
  this.status = newStatus;
  
  switch (newStatus) {
    case 'completed':
      this.completedAt = new Date();
      break;
    case 'cancelled':
      this.cancelledAt = new Date();
      break;
    case 'rejected':
      this.rejectedAt = new Date();
      break;
  }
  
  return this.save();
};

// Static method to create point redemption
swapSchema.statics.createPointRedemption = function(itemId, requesterId, points) {
  return this.create({
    itemRequested: itemId,
    requester: requesterId,
    owner: null, // Will be set from item owner
    type: 'point_redemption',
    pointsUsed: points,
    status: 'pending'
  });
};

// Static method to create direct swap
swapSchema.statics.createDirectSwap = function(requestedItemId, offeredItemId, requesterId, ownerId, message) {
  return this.create({
    itemRequested: requestedItemId,
    itemOffered: offeredItemId,
    requester: requesterId,
    owner: ownerId,
    type: 'direct_swap',
    message: message
  });
};

export default mongoose.model('Swap', swapSchema);