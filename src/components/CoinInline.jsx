import React from "react";

const CoinInline = ({ onClick }) => {
  return (
    <div className="coin-inline-container">
      <style jsx global>{`
        .coin-inline-container {
          --coin-diam: 6.75rem;
          --coin-depth: calc(var(--coin-diam) * 0.1);
          --spin-speed: 4s;
          --facets: 32;
          --spokes: calc(var(--facets) / 2);
          --facet-length: calc(var(--coin-diam) * sin(calc(3.14159 / var(--facets))));
          --facet-angle: calc((180deg - (360deg / var(--facets))) / 2);
        }

        .coin-inline-container .purse {
          height: var(--coin-diam);
          width: var(--coin-diam);
          position: relative;
          perspective: 1000px;
          filter: saturate(1.45) hue-rotate(2deg);
        }

        .coin-inline-container .coin {
          height: var(--coin-diam);
          width: var(--coin-diam);
          position: absolute;
          transform-style: preserve-3d;
          transform-origin: 50%;
          animation: spinCoin var(--spin-speed) infinite linear;
        }

        .coin-inline-container .coin .front,
        .coin-inline-container .coin .back {
          position: absolute;
          height: var(--coin-diam);
          width: var(--coin-diam);
          border-radius: 50%;
          background-size: cover;
        }

        .coin-inline-container .coin .front {
          transform: translateZ(calc(var(--coin-depth) / 2));
          background-image: url("/coinFront.png");
        }

        .coin-inline-container .coin .back {
          transform: translateZ(calc(var(--coin-depth) / -2)) rotateY(180deg);
          background-image: url("/coinBack1.png");
        }

        .coin-inline-container .coin .side {
          transform: translateX(calc(var(--coin-diam) * 0.45));
          transform-style: preserve-3d;
          backface-visibility: hidden;
        }

        .coin-inline-container .coin .side .spoke {
          height: var(--coin-diam);
          width: var(--coin-depth);
          position: absolute;
          transform-style: preserve-3d;
          backface-visibility: hidden;
        }

        .coin-inline-container .coin .side .spoke::before,
        .coin-inline-container .coin .side .spoke::after {
          content: "";
          display: block;
          height: var(--facet-length);
          width: var(--coin-depth);
          position: absolute;
          background: hsl(42, 52%, 68%);
          background: linear-gradient(
            to bottom,
            hsl(42, 60%, 75%) 0%,
            hsl(42, 60%, 75%) 74%,
            hsl(42, 40%, 60%) 75%,
            hsl(42, 40%, 60%) 100%
          );
          background-size: 100% calc((var(--facets) * var(--facet-length)) / 144);
          transform: rotateX(var(--facet-angle));
        }

        .coin-inline-container .coin .side .spoke::before {
          transform-origin: top center;
        }

        .coin-inline-container .coin .side .spoke::after {
          bottom: 0;
          transform-origin: center bottom;
        }

        .coin-inline-container .coin .side .spoke:nth-child(1) { transform: rotateY(90deg) rotateX(calc(180deg / var(--spokes) * 0)); }
        .coin-inline-container .coin .side .spoke:nth-child(2) { transform: rotateY(90deg) rotateX(calc(180deg / var(--spokes) * 1)); }
        .coin-inline-container .coin .side .spoke:nth-child(3) { transform: rotateY(90deg) rotateX(calc(180deg / var(--spokes) * 2)); }
        .coin-inline-container .coin .side .spoke:nth-child(4) { transform: rotateY(90deg) rotateX(calc(180deg / var(--spokes) * 3)); }
        .coin-inline-container .coin .side .spoke:nth-child(5) { transform: rotateY(90deg) rotateX(calc(180deg / var(--spokes) * 4)); }
        .coin-inline-container .coin .side .spoke:nth-child(6) { transform: rotateY(90deg) rotateX(calc(180deg / var(--spokes) * 5)); }
        .coin-inline-container .coin .side .spoke:nth-child(7) { transform: rotateY(90deg) rotateX(calc(180deg / var(--spokes) * 6)); }
        .coin-inline-container .coin .side .spoke:nth-child(8) { transform: rotateY(90deg) rotateX(calc(180deg / var(--spokes) * 7)); }
        .coin-inline-container .coin .side .spoke:nth-child(9) { transform: rotateY(90deg) rotateX(calc(180deg / var(--spokes) * 8)); }
        .coin-inline-container .coin .side .spoke:nth-child(10) { transform: rotateY(90deg) rotateX(calc(180deg / var(--spokes) * 9)); }
        .coin-inline-container .coin .side .spoke:nth-child(11) { transform: rotateY(90deg) rotateX(calc(180deg / var(--spokes) * 10)); }
        .coin-inline-container .coin .side .spoke:nth-child(12) { transform: rotateY(90deg) rotateX(calc(180deg / var(--spokes) * 11)); }
        .coin-inline-container .coin .side .spoke:nth-child(13) { transform: rotateY(90deg) rotateX(calc(180deg / var(--spokes) * 12)); }
        .coin-inline-container .coin .side .spoke:nth-child(14) { transform: rotateY(90deg) rotateX(calc(180deg / var(--spokes) * 13)); }
        .coin-inline-container .coin .side .spoke:nth-child(15) { transform: rotateY(90deg) rotateX(calc(180deg / var(--spokes) * 14)); }
        .coin-inline-container .coin .side .spoke:nth-child(16) { transform: rotateY(90deg) rotateX(calc(180deg / var(--spokes) * 15)); }

        @keyframes spinCoin {
          from { transform: rotateY(0deg); }
          to { transform: rotateY(360deg); }
        }
      `}</style>
      
      <div className="purse" onClick={onClick}>
        <div className="coin">
          <div className="front"></div>
          <div className="back"></div>
          <div className="side">
            {[...Array(16)].map((_, index) => (
              <div key={index} className="spoke"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoinInline;