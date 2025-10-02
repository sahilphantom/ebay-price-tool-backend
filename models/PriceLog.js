const mongoose = require('mongoose');

const PriceLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ebayAccountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EbayAccount',
    required: true
  },
  itemId: {
    type: String,
    required: true
  },
  oldPrice: {
    type: Number,
    required: true
  },
  newPrice: {
    type: Number,
    required: true
  },
  updateDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['success', 'failed', 'skipped'],
    default: 'success'
  },
  reason: {
    type: String
  },
  competitorPrice: {
    type: Number
  }
});

module.exports = mongoose.model('PriceLog', PriceLogSchema);