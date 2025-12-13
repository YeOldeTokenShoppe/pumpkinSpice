// Lighter WebSocket Manager for Persistent Testnet Connection
// Manages reconnection, heartbeat, and state synchronization

import { getDatabase, ref, set, onDisconnect } from 'firebase/database';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db as firestore, realtimeDb } from '@/utilities/firebaseClient';

class LighterWebSocketManager {
  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 5000; // Start with 5 seconds
    this.heartbeatInterval = null;
    this.isConnected = false;
    this.subscribers = new Set();
    this.marketData = {};
    this.lastUpdate = null;
    
    // Firebase connection for state persistence - use existing initialized instance
    this.db = realtimeDb || getDatabase();
    this.connectionRef = ref(this.db, 'lighter/connection');
    this.marketDataRef = ref(this.db, 'lighter/marketData');
    
    // Set up disconnect handler
    onDisconnect(this.connectionRef).set({
      status: 'disconnected',
      timestamp: Date.now()
    });
  }

  async connect() {
    try {
      // Use testnet endpoint
      const wsUrl = process.env.NEXT_PUBLIC_LIGHTER_WS_URL || 'wss://api.testnet.lighter.xyz/ws';
      
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        console.log('[LighterWS] Connected to testnet');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.reconnectDelay = 5000;
        
        // Update Firebase connection status
        set(this.connectionRef, {
          status: 'connected',
          timestamp: Date.now(),
          endpoint: 'testnet'
        });
        
        // Subscribe to market data
        this.subscribeToMarkets();
        
        // Start heartbeat
        this.startHeartbeat();
        
        // Notify subscribers
        this.notifySubscribers('connected');
      };
      
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('[LighterWS] Message parse error:', error);
        }
      };
      
      this.ws.onerror = (error) => {
        console.error('[LighterWS] WebSocket error:', error);
        this.notifySubscribers('error', error);
      };
      
      this.ws.onclose = () => {
        console.log('[LighterWS] Connection closed');
        this.isConnected = false;
        this.stopHeartbeat();
        
        // Update Firebase
        set(this.connectionRef, {
          status: 'disconnected',
          timestamp: Date.now()
        });
        
        // Attempt reconnection with exponential backoff
        this.reconnect();
      };
      
    } catch (error) {
      console.error('[LighterWS] Connection error:', error);
      this.reconnect();
    }
  }

  reconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[LighterWS] Max reconnection attempts reached');
      this.notifySubscribers('max_reconnect_failed');
      return;
    }
    
    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1), 60000);
    
    console.log(`[LighterWS] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      this.connect();
    }, delay);
  }

  subscribeToMarkets() {
    // Subscribe to BTC and ETH perps on testnet
    const subscribeMsg = {
      type: 'subscribe',
      channel: 'orderbook',
      markets: ['BTC-PERP', 'ETH-PERP']
    };
    
    this.send(subscribeMsg);
    
    // Also subscribe to trades
    this.send({
      type: 'subscribe',
      channel: 'trades',
      markets: ['BTC-PERP', 'ETH-PERP']
    });
  }

  handleMessage(data) {
    // Update local cache
    if (data.type === 'orderbook' || data.type === 'trade') {
      this.marketData[data.market] = {
        ...this.marketData[data.market],
        ...data,
        timestamp: Date.now()
      };
      
      // Persist to Firebase for agent access
      set(ref(this.db, `lighter/marketData/${data.market}`), this.marketData[data.market]);
      
      // Notify subscribers
      this.notifySubscribers('market_update', data);
    }
    
    // Handle pong for heartbeat
    if (data.type === 'pong') {
      this.lastPong = Date.now();
    }
  }

  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected) {
        this.send({ type: 'ping' });
        
        // Check for stale connection
        if (this.lastPong && Date.now() - this.lastPong > 30000) {
          console.warn('[LighterWS] Connection stale, reconnecting...');
          this.ws.close();
        }
      }
    }, 15000); // Ping every 15 seconds
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  send(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('[LighterWS] Cannot send, not connected');
    }
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  notifySubscribers(event, data) {
    this.subscribers.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('[LighterWS] Subscriber error:', error);
      }
    });
  }

  disconnect() {
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  getMarketData(market) {
    return this.marketData[market] || null;
  }
}

// Singleton instance
let instance = null;

export const getLighterWebSocketManager = () => {
  if (!instance) {
    instance = new LighterWebSocketManager();
  }
  return instance;
};

export default LighterWebSocketManager;