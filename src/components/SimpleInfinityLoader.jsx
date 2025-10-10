'use client';

export default function SimpleInfinityLoader({ loading = true }) {
  if (!loading) return null;

  return (
    <div className="simple-infinity-container">
      <div className="infinity"></div>
      <style jsx>{`
        .simple-infinity-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100vh;
          background: #270245;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
        }

        .infinity {
          position: relative;
          width: 65px;
          height: 29px;
          animation: 2s spin infinite cubic-bezier(0.86, 0, 0.07, 1);
        }

        .infinity:before,
        .infinity:after {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          width: 19px;
          height: 19px;
          border: 5px solid #FFD700;
          border-radius: 50% 50% 0 50%;
          transform: rotate(-45deg);
          animation-fill-mode: forwards;
        }

        .infinity:before {
          animation: left 1s infinite alternate cubic-bezier(0.86, 0, 0.07, 1), 
                     morph 1s infinite alternate cubic-bezier(0.86, 0, 0.07, 1),
                     colorMorph 1s infinite alternate cubic-bezier(0.86, 0, 0.07, 1);
        }

        .infinity:after {
          left: auto;
          right: 0;
          border-radius: 50% 50% 50% 0;
          transform: rotate(45deg);
          animation: right 1s infinite alternate cubic-bezier(0.86, 0, 0.07, 1), 
                     morph 1s infinite alternate cubic-bezier(0.86, 0, 0.07, 1),
                     colorMorph 1s infinite alternate cubic-bezier(0.86, 0, 0.07, 1);
        }

        @keyframes morph {
          from {
            border-radius: 50%;
          }
        }
        
        @keyframes colorMorph {
          from {
            border-color: #FFD700; /* Gold when circle */
          }
          to {
            border-color: #00FF00; /* Green when morphed */
          }
        }

        @keyframes left {
          from {
            left: 18px;
          }
        }

        @keyframes right {
          from {
            right: 18px;
          }
        }

        @keyframes spin {
          from {
            transform: rotate(540deg);
          }
        }
      `}</style>
    </div>
  );
}