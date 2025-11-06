import { create } from 'zustand';
  import { Vector3 } from 'three';

  export const useGameStore = create((set, get) => ({
    // State
    map: "underworld2",
    characterPosition: new Vector3(0, 0, 0),
    containerRotation: 0,
    score: 0,
    collectedItems: new Set(),
    characterRigidBody: null,
    litCandles: new Set(),
    litCandleCount: 0,
    nearbyCandles: [],
    coinCount: 0,
    lightNearestCandle: null, // Function to light nearest candle

    // Actions
    setMap: (map) => set({ map }),
    setCharacterPosition: (position) => set({ characterPosition:
  position }),
    setContainerRotation: (rotation) => set({ containerRotation:
  rotation }),
    setScore: (score) => set({ score }),
    addCollectedItem: (item) => set((state) => ({
      collectedItems: new Set([...state.collectedItems, item])
    })),
    setCharacterRigidBody: (rigidBody) => set({ characterRigidBody:
  rigidBody }),
    addLitCandle: (candle) => set((state) => {
      const newLitCandles = new Set([...state.litCandles, candle]);
      return {
        litCandles: newLitCandles,
        litCandleCount: newLitCandles.size
      };
    }),
    setNearbyCandles: (candles) => set({ nearbyCandles: candles }),
    incrementCoinCount: () => set((state) => ({ coinCount:
  state.coinCount + 1 })),
    setCoinCount: (count) => set({ coinCount: count }),
    setLightNearestCandle: (fn) => set({ lightNearestCandle: fn }),
  }));