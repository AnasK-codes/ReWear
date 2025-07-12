import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  points: {
    type: Number,
    default: 50 // Starting points for new users
  },
  profile: {
    bio: String,
    location: String,
    preferences: [String]
  },
  stats: {
    itemsListed: { type: Number, default: 0 },
    swapsCompleted: { type: Number, default: 0 },
    pointsEarned: { type: Number, default: 0 },
    pointsSpent: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Update user stats
userSchema.methods.updateStats = function(field, increment = 1) {
  this.stats[field] = (this.stats[field] || 0) + increment;
  return this.save();
};

// Add points
userSchema.methods.addPoints = function(amount) {
  this.points += amount;
  this.stats.pointsEarned += amount;
  return this.save();
};

// Deduct points
userSchema.methods.deductPoints = function(amount) {
  if (this.points < amount) {
    throw new Error('Insufficient points');
  }
  this.points -= amount;
  this.stats.pointsSpent += amount;
  return this.save();
};

export default mongoose.model('User', userSchema);