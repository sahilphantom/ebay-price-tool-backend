const mongoose = require('mongoose');
const crypto = require('crypto-js');

const EbayAccountSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ebayAccountId: {
    type: String,
    required: true
  },
  accessToken: {
    type: String,
    required: true
  },
  refreshToken: {
    type: String,
    required: true
  },
  tokenExpiry: {
    type: Date,
    required: true
  },
  appId: {
    type: String,
    required: true
  },
  certId: {
    type: String,
    required: true
  },
  devId: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
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

EbayAccountSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Method to encrypt sensitive data (if needed)
EbayAccountSchema.methods.encryptData = function(data) {
  if (!process.env.ENCRYPTION_KEY) {
    throw new Error('ENCRYPTION_KEY not set in environment variables');
  }
  return crypto.AES.encrypt(data, process.env.ENCRYPTION_KEY).toString();
};

// Method to decrypt sensitive data (if needed)
EbayAccountSchema.methods.decryptData = function(encryptedData) {
  if (!process.env.ENCRYPTION_KEY) {
    throw new Error('ENCRYPTION_KEY not set in environment variables');
  }
  const bytes = crypto.AES.decrypt(encryptedData, process.env.ENCRYPTION_KEY);
  return bytes.toString(crypto.enc.Utf8);
};

module.exports = mongoose.model('EbayAccount', EbayAccountSchema);