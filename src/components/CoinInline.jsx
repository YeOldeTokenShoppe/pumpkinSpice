import React from "react";

const CoinInline = ({ onClick }) => {
  return (
    <>
      <style jsx>{`
        .coin-purse {
          height: 9rem;
          width: 9rem;
          position: relative;
          perspective: 1000px;
          filter: saturate(1.45) hue-rotate(2deg);
        }
        
        .coin-3d {
          height: 9rem;
          width: 9rem;
          position: relative;
          transform-style: preserve-3d;
          transform-origin: 50%;
          animation: coin-spin 4s infinite linear;
        }
        
        .coin-3d .coin-front,
        .coin-3d .coin-back {
          position: absolute;
          height: 9rem;
          width: 9rem;
          border-radius: 50%;
          background-size: cover;
          background-position: center;
        }
        
        .coin-3d .coin-front {
          transform: translateZ(0.35rem);
          background-image: url("/coinFront.png");
          background-color: #d4af37;
        }
        
        .coin-3d .coin-back {
          transform: translateZ(-0.35rem) rotateY(180deg);
          background-image: url("/coinBack1.png");
          background-color: #b8941f;
        }
        
        .coin-3d .coin-side {
          position: absolute;
          top: 0;
          left: 0;
          transform: translateX(4.05rem);
          transform-style: preserve-3d;
          backface-visibility: hidden;
        }
        
        .coin-3d .coin-side .coin-spoke {
          height: 9rem;
          width: 0.7rem;
          position: absolute;
          transform-style: preserve-3d;
          backface-visibility: hidden;
        }
        
        .coin-3d .coin-side .coin-spoke::before,
        .coin-3d .coin-side .coin-spoke::after {
          content: "";
          display: block;
          height: 0.882rem;
          width: 0.7rem;
          position: absolute;
          background: hsl(42, 52%, 68%);
          background: linear-gradient(
            to bottom,
            hsl(42, 60%, 75%) 0%,
            hsl(42, 60%, 75%) 74%,
            hsl(42, 40%, 60%) 75%,
            hsl(42, 40%, 60%) 100%
          );
          transform: rotateX(84.375deg);
        }
        
        .coin-3d .coin-side .coin-spoke::before {
          transform-origin: top center;
        }
        
        .coin-3d .coin-side .coin-spoke::after {
          bottom: 0;
          transform-origin: center bottom;
        }
        
        /* Position the spokes */
        .coin-3d .coin-side .coin-spoke:nth-child(1) { transform: rotateY(90deg) rotateX(0deg); }
        .coin-3d .coin-side .coin-spoke:nth-child(2) { transform: rotateY(90deg) rotateX(22.5deg); }
        .coin-3d .coin-side .coin-spoke:nth-child(3) { transform: rotateY(90deg) rotateX(45deg); }
        .coin-3d .coin-side .coin-spoke:nth-child(4) { transform: rotateY(90deg) rotateX(67.5deg); }
        .coin-3d .coin-side .coin-spoke:nth-child(5) { transform: rotateY(90deg) rotateX(90deg); }
        .coin-3d .coin-side .coin-spoke:nth-child(6) { transform: rotateY(90deg) rotateX(112.5deg); }
        .coin-3d .coin-side .coin-spoke:nth-child(7) { transform: rotateY(90deg) rotateX(135deg); }
        .coin-3d .coin-side .coin-spoke:nth-child(8) { transform: rotateY(90deg) rotateX(157.5deg); }
        .coin-3d .coin-side .coin-spoke:nth-child(9) { transform: rotateY(90deg) rotateX(180deg); }
        .coin-3d .coin-side .coin-spoke:nth-child(10) { transform: rotateY(90deg) rotateX(202.5deg); }
        .coin-3d .coin-side .coin-spoke:nth-child(11) { transform: rotateY(90deg) rotateX(225deg); }
        .coin-3d .coin-side .coin-spoke:nth-child(12) { transform: rotateY(90deg) rotateX(247.5deg); }
        .coin-3d .coin-side .coin-spoke:nth-child(13) { transform: rotateY(90deg) rotateX(270deg); }
        .coin-3d .coin-side .coin-spoke:nth-child(14) { transform: rotateY(90deg) rotateX(292.5deg); }
        .coin-3d .coin-side .coin-spoke:nth-child(15) { transform: rotateY(90deg) rotateX(315deg); }
        .coin-3d .coin-side .coin-spoke:nth-child(16) { transform: rotateY(90deg) rotateX(337.5deg); }
        
        @keyframes coin-spin {
          from { transform: rotateY(0deg); }
          to { transform: rotateY(360deg); }
        }
      `}</style>
      
      <div className="coin-purse" onClick={onClick}>
        <div className="coin-3d">
          <div className="coin-front"></div>
          <div className="coin-back"></div>
          <div className="coin-side">
            {[...Array(16)].map((_, index) => (
              <div key={index} className="coin-spoke"></div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default CoinInline;