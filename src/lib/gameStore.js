import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export const useGameStore = create(
  subscribeWithSelector((set, get) => ({
    // Game state
    score: 0,
    lives: 3,
    level: 1,
    gameStarted: false,
    gameOver: false,
    paused: false,
    
    // Character state
    characterPosition: { x: 0, y: 0, z: 0 },
    characterHealth: 100,
    characterRigidBody: null,
    containerRotation: 0,
    lightNearestCandle: null,
    
    // Inventory
    candles: 0,
    keys: 0,
    
    // Game actions
    addScore: (points) => set((state) => ({ score: state.score + points })),
    removeLife: () => set((state) => ({ lives: state.lives - 1 })),
    addCandle: () => set((state) => ({ candles: state.candles + 1 })),
    addKey: () => set((state) => ({ keys: state.keys + 1 })),
    
    setCharacterPosition: (position) => set({ characterPosition: position }),
    setCharacterHealth: (health) => set({ characterHealth: health }),
    setCharacterRigidBody: (rigidBody) => set({ characterRigidBody: rigidBody }),
    setContainerRotation: (rotation) => set({ containerRotation: rotation }),
    setLightNearestCandle: (fn) => set({ lightNearestCandle: fn }),
    
    startGame: () => set({ gameStarted: true, gameOver: false }),
    endGame: () => set({ gameOver: true }),
    pauseGame: () => set((state) => ({ paused: !state.paused })),
    
    resetGame: () => set({
      score: 0,
      lives: 3,
      level: 1,
      gameStarted: false,
      gameOver: false,
      paused: false,
      characterPosition: { x: 0, y: 0, z: 0 },
      characterHealth: 100,
      characterRigidBody: null,
      containerRotation: 0,
      lightNearestCandle: null,
      candles: 0,
      keys: 0,
    }),
  }))
);