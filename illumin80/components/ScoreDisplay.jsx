import { useGameStore } from "../lib/gameStore";

  export const ScoreDisplay = () => {
    const score = useGameStore((state) => state.score);
    const collectedItems = useGameStore((state) =>
  state.collectedItems);
    const litCandleCount = useGameStore((state) =>
  state.litCandleCount);
    const coinCount = useGameStore((state) => state.coinCount);

    return (
      <div
        style={{
          position: "fixed",
          top: "16px",
          right: "16px",
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          color: "white",
          padding: "12px 16px",
          borderRadius: "8px",
          fontFamily: "Arial, sans-serif",
          fontSize: "18px",
          fontWeight: "bold",
          zIndex: 1000,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: "4px",
        }}
      >
        <div>Score: {score}</div>
        <div style={{ fontSize: "14px", opacity: 0.8 }}>
          Items: {collectedItems.size}
        </div>
        <div style={{ fontSize: "14px", opacity: 0.8, color: 
  "#FFD700" }}>
          🪙 Coins: {coinCount || 0}
        </div>
        <div style={{ fontSize: "14px", opacity: 0.8, color: 
  "#FFD700" }}>
          🕯️ Candles: {litCandleCount}
        </div>
      </div>
    );
  };