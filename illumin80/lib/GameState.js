import { proxy } from 'valtio';
import { Vector3 } from 'three';

export const GameState = proxy({
  map: "underworld3Japanese",
  characterPosition: new Vector3(0, 0, 0),
  characterY: 0, // Reactive Y position for UI
  characterZ: 0, // Reactive Z position for UI
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
  doorTogglePressed: false, // Door toggle key state
});