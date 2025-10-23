import { ethers } from 'ethers';
import axios from 'axios';
import WebSocket from 'ws';
import { logger } from '../utils/logger.js';

export class HyperliquidClient {
  constructor() {
    this.baseUrl = process.env.HYPERLIQUID_API_URL || 'https://api.hyperliquid.xyz';
    this.testnet = process.env.HYPERLIQUID_TESTNET === 'true';
    this.privateKey = process.env.HYPERLIQUID_PRIVATE_KEY;
    this.wallet = null;
    this.ws = null;
    this.subscriptions = new Map();
  }
  
  async connect() {
    try {
      // Initialize wallet
      if (this.privateKey) {
        this.wallet = new ethers.Wallet(this.privateKey);
        logger.info(`Connected to Hyperliquid as ${this.wallet.address}`);
      } else {
        logger.warn('No private key provided, running in read-only mode');
      }
      
      // Connect WebSocket for real-time data
      await this.connectWebSocket();
      
      // Test connection
      await this.getExchangeInfo();
      
      logger.info('Hyperliquid client connected successfully');
    } catch (error) {
      logger.error('Failed to connect to Hyperliquid:', error);
      throw error;
    }
  }
  
  async connectWebSocket() {
    const wsUrl = this.baseUrl.replace('https', 'wss') + '/ws';
    
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(wsUrl);
      
      this.ws.on('open', () => {
        logger.info('WebSocket connected to Hyperliquid');
        resolve();
      });
      
      this.ws.on('message', (data) => {
        this.handleWebSocketMessage(data);
      });
      
      this.ws.on('error', (error) => {
        logger.error('WebSocket error:', error);
        reject(error);
      });
      
      this.ws.on('close', () => {
        logger.warn('WebSocket connection closed, reconnecting...');
        setTimeout(() => this.connectWebSocket(), 5000);
      });
    });
  }
  
  handleWebSocketMessage(data) {
    try {
      const message = JSON.parse(data);
      
      // Route message to appropriate handler
      if (message.channel === 'trades') {
        this.handleTradeUpdate(message.data);
      } else if (message.channel === 'orderbook') {
        this.handleOrderbookUpdate(message.data);
      } else if (message.channel === 'positions') {
        this.handlePositionUpdate(message.data);
      }
      
      // Emit to subscribers
      const subscribers = this.subscriptions.get(message.channel);
      if (subscribers) {
        subscribers.forEach(callback => callback(message.data));
      }
    } catch (error) {
      logger.error('Error handling WebSocket message:', error);
    }
  }
  
  subscribe(channel, callback) {
    if (!this.subscriptions.has(channel)) {
      this.subscriptions.set(channel, []);
      
      // Send subscription message
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({
          type: 'subscribe',
          channel
        }));
      }
    }
    
    this.subscriptions.get(channel).push(callback);
  }
  
  async getExchangeInfo() {
    const response = await axios.get(`${this.baseUrl}/info`);
    return response.data;
  }
  
  async getMarkets() {
    const response = await axios.get(`${this.baseUrl}/markets`);
    return response.data;
  }
  
  async getTicker(symbol) {
    const response = await axios.get(`${this.baseUrl}/ticker`, {
      params: { symbol }
    });
    return response.data;
  }
  
  async getOrderbook(symbol, depth = 20) {
    const response = await axios.get(`${this.baseUrl}/orderbook`, {
      params: { symbol, depth }
    });
    return response.data;
  }
  
  async getCandles(symbol, interval = '15m', limit = 100) {
    const response = await axios.get(`${this.baseUrl}/candles`, {
      params: { symbol, interval, limit }
    });
    return response.data;
  }
  
  async getFundingRate(symbol) {
    const response = await axios.get(`${this.baseUrl}/funding`, {
      params: { symbol }
    });
    return response.data;
  }
  
  async getOpenInterest(symbol) {
    const response = await axios.get(`${this.baseUrl}/open_interest`, {
      params: { symbol }
    });
    return response.data;
  }
  
  // Trading Methods
  
  async placeOrder(params) {
    if (!this.wallet) {
      throw new Error('Wallet not initialized - cannot place orders');
    }
    
    const order = {
      symbol: params.symbol,
      side: params.side, // 'buy' or 'sell'
      type: params.type || 'limit',
      size: params.size,
      price: params.price,
      leverage: params.leverage || 1,
      reduceOnly: params.reduceOnly || false,
      postOnly: params.postOnly || false,
      timeInForce: params.timeInForce || 'GTC',
      clientOrderId: params.clientOrderId || this.generateOrderId()
    };
    
    // Sign order
    const signedOrder = await this.signOrder(order);
    
    // Submit order
    const response = await axios.post(`${this.baseUrl}/order`, signedOrder);
    
    logger.info(`Order placed: ${JSON.stringify(response.data)}`);
    return response.data;
  }
  
  async signOrder(order) {
    // Hyperliquid order signing logic
    const timestamp = Date.now();
    const message = JSON.stringify({
      ...order,
      timestamp,
      nonce: Math.random().toString(36).substring(7)
    });
    
    const signature = await this.wallet.signMessage(message);
    
    return {
      ...order,
      timestamp,
      signature,
      address: this.wallet.address
    };
  }
  
  async cancelOrder(orderId, symbol) {
    if (!this.wallet) {
      throw new Error('Wallet not initialized - cannot cancel orders');
    }
    
    const params = {
      orderId,
      symbol,
      timestamp: Date.now()
    };
    
    const signature = await this.wallet.signMessage(JSON.stringify(params));
    
    const response = await axios.delete(`${this.baseUrl}/order`, {
      data: {
        ...params,
        signature,
        address: this.wallet.address
      }
    });
    
    logger.info(`Order cancelled: ${orderId}`);
    return response.data;
  }
  
  async getOpenOrders(symbol = null) {
    if (!this.wallet) {
      return [];
    }
    
    const params = {
      address: this.wallet.address,
      symbol
    };
    
    const response = await axios.get(`${this.baseUrl}/orders`, { params });
    return response.data;
  }
  
  async getPositions() {
    if (!this.wallet) {
      return [];
    }
    
    const response = await axios.get(`${this.baseUrl}/positions`, {
      params: { address: this.wallet.address }
    });
    
    return response.data;
  }
  
  async getPosition(symbol) {
    const positions = await this.getPositions();
    return positions.find(p => p.symbol === symbol);
  }
  
  async closePosition(symbol) {
    const position = await this.getPosition(symbol);
    
    if (!position) {
      throw new Error(`No position found for ${symbol}`);
    }
    
    // Place market order to close position
    return await this.placeOrder({
      symbol,
      side: position.side === 'long' ? 'sell' : 'buy',
      type: 'market',
      size: Math.abs(position.size),
      reduceOnly: true
    });
  }
  
  async setLeverage(symbol, leverage) {
    if (!this.wallet) {
      throw new Error('Wallet not initialized');
    }
    
    const params = {
      symbol,
      leverage,
      timestamp: Date.now()
    };
    
    const signature = await this.wallet.signMessage(JSON.stringify(params));
    
    const response = await axios.post(`${this.baseUrl}/leverage`, {
      ...params,
      signature,
      address: this.wallet.address
    });
    
    logger.info(`Leverage set to ${leverage}x for ${symbol}`);
    return response.data;
  }
  
  async getBalance() {
    if (!this.wallet) {
      return { balance: 0, available: 0 };
    }
    
    const response = await axios.get(`${this.baseUrl}/balance`, {
      params: { address: this.wallet.address }
    });
    
    return response.data;
  }
  
  async getTradeHistory(symbol = null, limit = 100) {
    if (!this.wallet) {
      return [];
    }
    
    const response = await axios.get(`${this.baseUrl}/trades`, {
      params: {
        address: this.wallet.address,
        symbol,
        limit
      }
    });
    
    return response.data;
  }
  
  generateOrderId() {
    return `RL80_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }
  
  handleTradeUpdate(data) {
    logger.debug('Trade update:', data);
  }
  
  handleOrderbookUpdate(data) {
    logger.debug('Orderbook update:', data);
  }
  
  handlePositionUpdate(data) {
    logger.info('Position update:', data);
  }
  
  async disconnect() {
    if (this.ws) {
      this.ws.close();
    }
    logger.info('Hyperliquid client disconnected');
  }
}