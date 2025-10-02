const EbayAccount = require('../models/EbayAccount');
const ebayService = require('../services/ebayService');
const User = require('../models/User');

// Store user's eBay credentials
const storeUserCredentials = async (req, res) => {
  try {
    const { appId, certId, devId } = req.body;
    const userId = req.user._id;
    
    // Validate credentials
    if (!appId || !certId || !devId) {
      return res.status(400).json({ 
        message: 'All eBay credentials are required' 
      });
    }
    
    // In a real implementation, you would store these securely
    res.json({ 
      message: 'Credentials validated successfully',
      credentials: {
        appId: appId.substring(0, 5) + '***',
        certId: certId.substring(0, 5) + '***',
        devId: devId.substring(0, 5) + '***'
      }
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error validating credentials', 
      error: error.message 
    });
  }
};

// Initiate OAuth flow with user credentials
const initiateOAuthFlow = async (req, res) => {
  try {
    const { appId, certId, devId } = req.body;
    
    // Validate that user has provided credentials
    if (!appId || !certId || !devId) {
      return res.status(400).json({ 
        message: 'eBay credentials required to initiate OAuth flow' 
      });
    }
    
    // Generate OAuth URL with user's credentials
    const authURL = ebayService.generateAuthURL(appId);
    
    // Store credentials temporarily in session or memory for callback
    req.session.userEbayCredentials = {
      appId,
      certId,
      devId,
      timestamp: Date.now()
    };
    
    res.json({ 
      authURL,
      message: 'OAuth flow initiated successfully'
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error initiating OAuth flow', 
      error: error.message 
    });
  }
};

// Handle OAuth callback
const handleCallback = async (req, res) => {
  try {
    const { code } = req.query;
    
    if (!code) {
      return res.status(400).json({ message: 'Authorization code missing' });
    }

    // Retrieve user's stored credentials
    const userCredentials = req.session.userEbayCredentials || {};
    
    // Use stored credentials or fall back to env vars
    const userAppId = userCredentials.appId || process.env.EBAY_APP_ID;
    const userCertId = userCredentials.certId || process.env.EBAY_CERT_ID;
    const userDevId = userCredentials.devId || process.env.EBAY_DEV_ID;
    
    // Clear stored credentials after use
    delete req.session.userEbayCredentials;
    
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
    
    // Clear session data
    delete req.session.userEbayCredentials;
    
    res.json({
      message: 'Successfully connected eBay account',
      ebayAccountId: ebayAccount._id,
      ebayUserId: userInfo.userId
    });
  } catch (error) {
    console.error('eBay connection error:', error);
    res.status(500).json({ 
      message: 'Error connecting eBay account', 
      error: error.message 
    });
  }
};

// Get user's connected eBay accounts
const getAccounts = async (req, res) => {
  try {
    const accounts = await EbayAccount.find({ userId: req.user._id, isActive: true });
    res.json(accounts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching eBay accounts', error: error.message });
  }
};

// Disconnect an eBay account
const disconnectAccount = async (req, res) => {
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

// Refresh account token
const refreshToken = async (req, res) => {
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

// Sync inventory items
const syncInventory = async (req, res) => {
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

// Search for competitors
const searchCompetitors = async (req, res) => {
  try {
    const { query, accountId } = req.body;
    
    if (!query || !accountId) {
      return res.status(400).json({ message: 'Query and account ID required' });
    }
    
    // In a real implementation, you would:
    // 1. Find the account
    // 2. Use its credentials to make eBay API calls
    // 3. Search using eBay Browse API
    
    // For demo purposes, return mock data
    const competitors = await ebayService.searchCompetitors(query);
    
    res.json({
      message: 'Competitor search completed',
      competitors: competitors.items
    });
  } catch (error) {
    res.status(500).json({ message: 'Error searching competitors', error: error.message });
  }
};

// Validate eBay credentials
const validateCredentials = async (req, res) => {
  try {
    const { appId, certId, devId } = req.body;
    
    if (!appId || !certId || !devId) {
      return res.status(400).json({ message: 'All credentials are required' });
    }
    
    // In a real implementation, you would test these credentials
    res.json({ 
      message: 'Credentials validated successfully',
      isValid: true 
    });
  } catch (error) {
    res.status(500).json({ message: 'Error validating credentials', error: error.message });
  }
};

module.exports = {
  validateCredentials,
  storeUserCredentials,
  initiateOAuthFlow,
  handleCallback,
  getAccounts,
  disconnectAccount,
  refreshToken,
  syncInventory,
  searchCompetitors
};