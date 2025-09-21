const EbayAccount = require('../models/EbayAccount');
const ebayService = require('../services/ebayService');
const User = require('../models/User');
const crypto = require('crypto-js');

exports.generateAuthURL = async (req, res) => {
  try {
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

    // Exchange code for token
    const tokenResponse = await ebayService.exchangeCodeForToken(code);
    
    // Get user info
    const userInfo = await ebayService.getUserInfo(tokenResponse.access_token);
    
    // Save eBay account info to database
    const ebayAccount = new EbayAccount({
      userId: req.user._id,
      ebayAccountId: userInfo.userId,
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token,
      tokenExpiry: new Date(Date.now() + (tokenResponse.expires_in * 1000)),
      appId: process.env.EBAY_APP_ID,
      certId: process.env.EBAY_CERT_ID,
      devId: process.env.EBAY_DEV_ID
    });

    await ebayAccount.save();
    
    res.json({
      message: 'Successfully connected eBay account',
      ebayAccountId: ebayAccount._id
    });
  } catch (error) {
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
    
    const account = await EbayAccount.findById(accountId);
    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }
    
    // Refresh the token
    const tokenResponse = await ebayService.refreshToken(account.refreshToken);
    
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
    
    const account = await EbayAccount.findById(accountId);
    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }
    
    // Get inventory items
    const inventory = await ebayService.getInventoryItems(account.accessToken);
    
    res.json({
      message: 'Inventory synced successfully',
      items: inventory.inventoryItems || []
    });
  } catch (error) {
    res.status(500).json({ message: 'Error syncing inventory', error: error.message });
  }
};