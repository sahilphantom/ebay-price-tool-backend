const mongoose = require('mongoose');

const PricingRuleSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ebayAccountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EbayAccount'
  },
  itemId: {
    type: String
  },
  ruleType: {
    type: String,
    enum: ['global', 'item-specific'],
    default: 'global'
  },
  priceAction: {
    type: String,
    enum: ['increase', 'decrease', 'match'],
    default: 'match'
  },
  priceAdjustment: {
    type: Number,
    default: 0
  },
  minPrice: {
    type: Number,
    default: 0
  },
  maxPrice: {
    type: Number
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

PricingRuleSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('PricingRule', PricingRuleSchema);