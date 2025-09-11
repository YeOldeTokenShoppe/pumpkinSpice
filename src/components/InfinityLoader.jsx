'use client';

import { useEffect, useRef } from 'react';
import './InfinityLoader.css';

export default function InfinityLoader({ loading = true }) {
  const symbolRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!loading) return;

    let travelingRight = true;
    let travelingDown = true;
    const cssVars = document.documentElement.style;
    cssVars.setProperty('--translateX', '0px');
    cssVars.setProperty('--translateY', '0px');

    const getRootX = () => parseFloat(cssVars.getPropertyValue('--translateX'));
    const getRootY = () => parseFloat(cssVars.getPropertyValue('--translateY'));

    intervalRef.current = setInterval(() => {
      if (window.innerWidth >= 1920 && symbolRef.current) {
        const symbolCoords = symbolRef.current.getBoundingClientRect();

        const isAtTop = symbolCoords.top <= 1;
        const isAtRight = symbolCoords.right >= window.innerWidth - 1;
        const isAtBottom = symbolCoords.bottom >= window.innerHeight - 1;
        const isAtLeft = symbolCoords.left <= 1;

        if (isAtTop) {
          travelingDown = true;
        } else if (isAtBottom) {
          travelingDown = false;
        }

        if (isAtRight) {
          travelingRight = false;
        } else if (isAtLeft) {
          travelingRight = true;
        }

        const newX = travelingRight ? getRootX() + 5 : getRootX() - 5;
        const newY = travelingDown ? getRootY() + 5 : getRootY() - 5;

        cssVars.setProperty('--translateX', newX + 'px');
        cssVars.setProperty('--translateY', newY + 'px');
      }
    }, 40);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [loading]);

  if (!loading) return null;

  return (
    <div className="infinity-loader-container">
      <svg
        ref={symbolRef}
        className="infinity-symbol"
        width="100%"
        height="100%"
        viewBox="0 0 1114 498"
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          fillRule: 'evenodd',
          clipRule: 'evenodd',
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          strokeMiterlimit: 1.5,
        }}
      >
        <path
          d="M556.639,248.609c53.406,53.406 101.683,111.534 164.527,155.683c32.351,22.727 69.175,43.083 109.585,49.008c28.958,4.245 59.488,0.613 87.317,-7.576c26.905,-7.918 52.087,-20.892 73.811,-37.871c21.56,-16.851 39.677,-37.626 53.018,-60.895c10.19,-17.771 17.616,-36.957 21.888,-56.774c4.437,-20.585 5.532,-41.765 3.304,-62.666c-8.654,-81.211 -69.752,-151.815 -152.021,-176.024c-21.015,-6.185 -42.784,-9.169 -64.773,-9.286c-20.432,-0.109 -41.041,2.144 -60.735,7.389c-60.474,16.105 -104.752,61.37 -145.625,103.912c-25.822,26.876 -51.28,54.064 -76.924,81.093c-50.066,52.771 -98.707,107.45 -153.977,155.565c-26.704,23.247 -58.379,43.63 -92.848,54.868c-68.352,22.285 -146.537,6.002 -201.788,-37.182c-21.56,-16.851 -39.676,-37.626 -53.018,-60.895c-10.19,-17.771 -17.616,-36.957 -21.887,-56.774c-20.542,-95.293 34.073,-193.859 128.699,-231.746c26.53,-10.622 55.918,-16.645 84.79,-16.23c66.027,0.948 126.189,41.423 172.681,82.451c12.721,11.225 25.299,22.604 37.509,34.327c11.528,11.07 22.61,22.551 33.684,34.029c17.75,18.398 34.689,37.5 52.783,55.594Z"
          style={{ fill: 'none', strokeWidth: '84.38px' }}
        />
      </svg>
      <div className="infinity-crt"></div>
    </div>
  );
}