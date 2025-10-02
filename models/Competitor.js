const mongoose = require('mongoose');

const CompetitorSchema = new mongoose.Schema({
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
  competitorItemId: {
    type: String,
    required: true
  },
  competitorTitle: {
    type: String,
    required: true
  },
  competitorPrice: {
    type: Number,
    required: true
  },
  competitorSeller: {
    type: String,
    required: true
  },
  priceRange: {
    type: Number,
    default: 5.00
  },
  lastChecked: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Competitor', CompetitorSchema);