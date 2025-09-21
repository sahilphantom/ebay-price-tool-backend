const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { 
  generateAuthURL, 
  handleCallback, 
  getAccounts, 
  disconnectAccount, 
  refreshToken, 
  syncInventory 
} = require('../controllers/ebayController');

// Public routes
router.get('/auth-url', generateAuthURL);

// Authenticated routes
router.get('/callback', auth, handleCallback);
router.get('/accounts', auth, getAccounts);
router.delete('/accounts/:accountId', auth, disconnectAccount);
router.put('/accounts/:accountId/refresh', auth, refreshToken);
router.get('/accounts/:accountId/sync', auth, syncInventory);

module.exports = router;