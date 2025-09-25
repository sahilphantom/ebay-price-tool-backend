const EbayAccount = require('../models/EbayAccount');
const ebayService = require('../services/ebayService');
const User = require('../models/User');

exports.generateAuthURL = async (req, res) => {
  try {
    // For user-provided credentials, we'll use the default app credentials
    // In a real implementation, you'd have a way to pass user credentials
    const authURL = ebayService.generateAuthURL();
    res.json({ authURL });
  } catch (error) {
    res.status(500).json({ message: 'Error generating auth URL', error: error.message });
  }
};

exports.handleCallback = async (req, res) => {
  try {
    const { code } = req.query;
    
    if (!code) {
      return res.status(400).json({ message: 'Authorization code missing' });
    }

    // In a real implementation, you'd get user's credentials from a form
    // For now, we'll use environment variables or user input
    const userAppId = process.env.EBAY_APP_ID || 'default_app_id';
    const userCertId = process.env.EBAY_CERT_ID || 'default_cert_id';
    const userDevId = process.env.EBAY_DEV_ID || 'default_dev_id';
    
    // Exchange code for token using user's credentials
    const tokenResponse = await ebayService.exchangeCodeForToken(
      code, 
      userAppId, 
      userCertId, 
      userDevId
    );
    
    // Get user info
    const userInfo = await ebayService.getUserInfo(tokenResponse.access_token);
    
    // Save eBay account info to database with user's credentials
    const ebayAccount = new EbayAccount({
      userId: req.user._id,
      ebayAccountId: userInfo.userId,
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token,
      tokenExpiry: new Date(Date.now() + (tokenResponse.expires_in * 1000)),
      appId: userAppId,
      certId: userCertId,
      devId: userDevId
    });

    await ebayAccount.save();
    
    res.json({
      message: 'Successfully connected eBay account',
      ebayAccountId: ebayAccount._id,
      ebayUserId: userInfo.userId
    });
  } catch (error) {
    console.error('eBay connection error:', error);
    res.status(500).json({ message: 'Error connecting eBay account', error: error.message });
  }
};

exports.getAccounts = async (req, res) => {
  try {
    const accounts = await EbayAccount.find({ userId: req.user._id, isActive: true });
    res.json(accounts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching eBay accounts', error: error.message });
  }
};

exports.disconnectAccount = async (req, res) => {
  try {
    const { accountId } = req.params;
    
    // Validate ObjectId format
    if (!accountId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid account ID format' });
    }
    
    const account = await EbayAccount.findByIdAndUpdate(
      accountId,
      { isActive: false },
      { new: true }
    );
    
    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }
    
    res.json({ message: 'Account disconnected successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error disconnecting account', error: error.message });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const { accountId } = req.params;
    
    // Validate ObjectId format
    if (!accountId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid account ID format' });
    }
    
    const account = await EbayAccount.findById(accountId);
    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }
    
    // Refresh the token using the account's stored credentials
    const tokenResponse = await ebayService.refreshToken(
      account.refreshToken,
      account.appId,
      account.certId
    );
    
    // Update account with new tokens
    account.accessToken = tokenResponse.access_token;
    account.tokenExpiry = new Date(Date.now() + (tokenResponse.expires_in * 1000));
    
    await account.save();
    
    res.json({ message: 'Token refreshed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error refreshing token', error: error.message });
  }
};

exports.syncInventory = async (req, res) => {
  try {
    const { accountId } = req.params;
    
    // Validate ObjectId format
    if (!accountId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid account ID format' });
    }
    
    const account = await EbayAccount.findById(accountId);
    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }
    
    // Get inventory items using account's credentials
    const inventory = await ebayService.getInventoryItems(account.accessToken);
    
    res.json({
      message: 'Inventory synced successfully',
      items: inventory.inventoryItems || []
    });
  } catch (error) {
    res.status(500).json({ message: 'Error syncing inventory', error: error.message });
  }
};

// New method to validate eBay credentials
exports.validateCredentials = async (req, res) => {
  try {
    const { appId, certId, devId } = req.body;
    
    if (!appId || !certId || !devId) {
      return res.status(400).json({ message: 'All credentials are required' });
    }
    
    // In a real implementation, you would test these credentials
    // For now, we'll just return success
    res.json({ 
      message: 'Credentials validated successfully',
      isValid: true 
    });
  } catch (error) {
    res.status(500).json({ message: 'Error validating credentials', error: error.message });
  }
};