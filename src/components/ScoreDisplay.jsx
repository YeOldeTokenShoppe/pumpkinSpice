import { useSnapshot } from "valtio";
import { GameState } from "../lib/GameState";

export const ScoreDisplay = () => {
  const { score, candles, keys, litCandles } = useSnapshot(GameState);

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
        Keys: {keys}
      </div>
      <div style={{ fontSize: "14px", opacity: 0.8, color: "#FFD700" }}>
        🪙 Candles: {candles}
      </div>
      <div style={{ fontSize: "14px", opacity: 0.8, color: "#FFD700" }}>
        🕯️ Lit Candles: {litCandles?.length || 0}
      </div>
    </div>
  );
};