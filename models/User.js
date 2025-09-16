const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  stripeCustomerId: {
    type: String
  },
  subscriptionStatus: {
    type: String,
    enum: ['active', 'inactive', 'canceled'],
    default: 'inactive'
  },
  preferredLanguage: {
    type: String,
    enum: ['en', 'ja'],
    default: 'en'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

UserSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

UserSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.passwordHash);
};

module.exports = mongoose.model('User', UserSchema);