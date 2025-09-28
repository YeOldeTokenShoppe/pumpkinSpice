'use client';

import { useEffect, useRef } from 'react';
import './InfinityLoader_optimized.css';

export default function InfinityLoader({ loading = true }) {
  const sRef = useRef(null);
  const rAF = useRef(null);
  const st = useRef({
    x: 0,
    y: 0,
    d: 'h',
    rX: 1,
    rY: 1,
    t: 0
  });

  useEffect(() => {
    if (!loading) return;

    const s = st.current;
    const root = document.documentElement.style;
    root.setProperty('--tX', '0');
    root.setProperty('--tY', '0');
    
    const animate = (n) => {
      if (!sRef.current || innerWidth < 1920) {
        rAF.current = requestAnimationFrame(animate);
        return;
      }

      if (n - s.t < 16) {
        rAF.current = requestAnimationFrame(animate);
        return;
      }

      const sp = 5;
      const w = innerWidth;
      const h = innerHeight;
      const sW = 292;
      const sH = 176;
      const mX = (w - sW) / 2;
      const mY = (h - sH) / 2;
      
      const cX = w / 2 + s.x;
      const cY = h / 2 + s.y;
      
      const edge = {
        t: cY - sH / 2 <= 2,
        r: cX + sW / 2 >= w - 2,
        b: cY + sH / 2 >= h - 2,
        l: cX - sW / 2 <= 2
      };

      let flip = false;
      
      if (s.d === 'h') {
        s.x += sp * s.rX;
        if ((s.rX > 0 && edge.r) || (s.rX < 0 && edge.l)) {
          s.rX *= -1;
          flip = true;
        }
      } else {
        s.y += sp * s.rY;
        if ((s.rY > 0 && edge.b) || (s.rY < 0 && edge.t)) {
          s.rY *= -1;
          flip = true;
        }
      }

      if (flip) s.d = s.d === 'h' ? 'v' : 'h';

      s.x = Math.max(-mX, Math.min(mX, s.x));
      s.y = Math.max(-mY, Math.min(mY, s.y));

      root.setProperty('--tX', s.x + 'px');
      root.setProperty('--tY', s.y + 'px');

      s.t = n;
      rAF.current = requestAnimationFrame(animate);
    };

    rAF.current = requestAnimationFrame(animate);

    return () => {
      if (rAF.current) cancelAnimationFrame(rAF.current);
      root.setProperty('--tX', '0');
      root.setProperty('--tY', '0');
    };
  }, [loading]);

  if (!loading) return null;

  return (
    <div className="infinity-loader-container">
      <svg
        ref={sRef}
        className="infinity-symbol"
        viewBox="0 0 1114 498"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M557,249c53,53,102,112,165,156,32,23,69,43,110,49,29,4,59,1,87-8,27-8,52-21,74-38,22-17,40-38,53-61,10-18,18-37,22-57,4-21,6-42,3-63-9-81-70-152-152-176-21-6-43-9-65-9-20,0-41,2-61,7-60,16-105,61-146,104-26,27-51,54-77,81-50,53-99,107-154,156-27,23-58,44-93,55-68,22-147,6-202-37-22-17-40-38-53-61-10-18-18-37-22-57-21-95,34-194,129-232,27-11,56-17,85-16,66,1,126,41,173,82,13,11,25,23,38,34,12,11,23,23,34,34,18,18,35,38,53,56Z"
          style={{ fill: 'none', strokeWidth: '84px' }}
        />
      </svg>
      <div className="infinity-crt"></div>
    </div>
  );
}