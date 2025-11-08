import { proxy } from 'valtio';
import { Vector3 } from 'three';

export const GameState = proxy({
  map: "underworld3",
  characterPosition: new Vector3(0, 0, 0),
  containerRotation: 0,
  score: 0,
  collectedItems: new Set(),
  characterRigidBody: null,
  litCandles: new Set(),
  litCandleCount: 0, // Add a reactive number counter
  nearbyCandles: [],
  coinCount: 0, // Track collected coins separately
  lives: 3,
  level: 1,
  gameStarted: false,
  gameOver: false,
  paused: false,
  characterHealth: 100,
  candles: 0,
  keys: 0,
  lightNearestCandle: null, // Function to light nearest candle
});