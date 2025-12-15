// Test connection to Polymarket Real-Time Data Socket
import WebSocket from 'ws';

// Store WebSocket connection
let ws = null;
let lastData = null;
let connectionStatus = 'disconnected';

// Initialize WebSocket connection
function connectWebSocket() {
  if (ws && ws.readyState === WebSocket.OPEN) {
    return; // Already connected
  }

  try {
    ws = new WebSocket('wss://ws-live-data.polymarket.com');
    
    ws.on('open', () => {
      console.log('[RTDS] WebSocket connected');
      connectionStatus = 'connected';
      
      // Subscribe to crypto prices
      const subscribeMessage = {
        action: 'subscribe',
        subscriptions: [
          {
            topic: 'crypto_prices',
            type: 'update'
          }
        ]
      };
      
      ws.send(JSON.stringify(subscribeMessage));
      console.log('[RTDS] Subscribed to crypto_prices');
      
      // Set up ping interval to keep connection alive
      const pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.ping();
        } else {
          clearInterval(pingInterval);
        }
      }, 5000);
    });
    
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        console.log('[RTDS] Received:', message.topic, message.type);
        
        if (message.topic === 'crypto_prices') {
          lastData = {
            ...message,
            receivedAt: new Date().toISOString()
          };
        }
      } catch (error) {
        console.error('[RTDS] Failed to parse message:', error);
      }
    });
    
    ws.on('error', (error) => {
      console.error('[RTDS] WebSocket error:', error);
      connectionStatus = 'error';
    });
    
    ws.on('close', () => {
      console.log('[RTDS] WebSocket disconnected');
      connectionStatus = 'disconnected';
      ws = null;
      
      // Reconnect after 5 seconds
      setTimeout(connectWebSocket, 5000);
    });
    
  } catch (error) {
    console.error('[RTDS] Failed to connect:', error);
    connectionStatus = 'error';
  }
}

// Connect on first import
connectWebSocket();

export default async function handler(req, res) {
  // Ensure WebSocket is connected
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    connectWebSocket();
  }
  
  return res.status(200).json({
    success: true,
    connectionStatus,
    connected: ws && ws.readyState === WebSocket.OPEN,
    lastData,
    message: lastData ? 'Receiving real-time crypto prices' : 'Waiting for data...'
  });
}