const axios = require('axios');

class EbayService {
  constructor() {
    this.baseURL = 'https://api.ebay.com';
    this.sandboxURL = 'https://api.sandbox.ebay.com';
    this.isSandbox = process.env.EBAY_SANDBOX === 'true';
  }

  getBaseURL() {
    return this.isSandbox ? this.sandboxURL : this.baseURL;
  }

  // Generate OAuth URL for eBay with custom credentials
  generateAuthURL(clientId = process.env.EBAY_APP_ID) {
    const redirectUri = process.env.EBAY_REDIRECT_URI || 'http://localhost:3000/api/ebay/callback';
    
    const authURL = `https://signin.ebay.com/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=https://api.ebay.com/oauth/api_scope`;
    
    return authURL;
  }

  // Exchange authorization code for access token using specific credentials
  async exchangeCodeForToken(code, clientId, clientSecret, devId) {
    const redirectUri = process.env.EBAY_REDIRECT_URI || 'http://localhost:3000/api/ebay/callback';

    try {
      const response = await axios.post(
        `${this.getBaseURL()}/identity/v1/oauth2/token`,
        new URLSearchParams({
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: redirectUri
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
          }
        }
      );

      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(`eBay API Error: ${error.response.status} - ${error.response.data.error_description || error.response.statusText}`);
      }
      throw new Error('Failed to exchange code for token: ' + error.message);
    }
  }

  // Refresh access token
  async refreshToken(refreshToken, clientId, clientSecret) {
    try {
      const response = await axios.post(
        `${this.getBaseURL()}/identity/v1/oauth2/token`,
        new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
          }
        }
      );

      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(`eBay API Error: ${error.response.status} - ${error.response.data.error_description || error.response.statusText}`);
      }
      throw new Error('Failed to refresh token: ' + error.message);
    }
  }

  // Get user's eBay account info
  async getUserInfo(accessToken) {
    try {
      const response = await axios.get(
        `${this.getBaseURL()}/sell/account/v1/user`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(`eBay API Error: ${error.response.status} - ${error.response.data.error_description || error.response.statusText}`);
      }
      throw new Error('Failed to get user info: ' + error.message);
    }
  }

  // Get inventory items using Sell Inventory API
  async getInventoryItems(accessToken, limit = 100) {
    try {
      const response = await axios.get(
        `${this.getBaseURL()}/sell/inventory/v1/inventory_item?limit=${limit}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(`eBay API Error: ${error.response.status} - ${error.response.data.error_description || error.response.statusText}`);
      }
      throw new Error('Failed to fetch inventory items: ' + error.message);
    }
  }

  // Update item prices using bulk operations
  async updatePrices(accessToken, items) {
    try {
      const payload = {
        requests: items.map(item => ({
          itemId: item.itemId,
          price: {
            currency: item.currency || 'USD',
            value: item.newPrice
          }
        }))
      };

      const response = await axios.post(
        `${this.getBaseURL()}/sell/inventory/v1/bulk_update_price_quantity`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(`eBay API Error: ${error.response.status} - ${error.response.data.error_description || error.response.statusText}`);
      }
      throw new Error('Failed to update prices: ' + error.message);
    }
  }
}

module.exports = new EbayService();