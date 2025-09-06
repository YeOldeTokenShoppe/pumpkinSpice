"use client";

import React, { useEffect, useRef } from 'react';

const SynthwaveText = ({ 
  text = "SYNTHWAVE",
  fontSize = 300,
  scale = 1,
  spacingX = 4,
  outsideColor = "rgba(0, 255, 255, 0.0)",
  insideColor = "rgba(255, 0, 255, 1)",
  backgroundColor = "rgba(0, 100, 255, 0.3)",
  className = ""
}) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const fontFamily = "Arial Black, Arial, system-ui, sans-serif";
    const margin = Math.floor(fontSize * 0.5);

    const setupCanvas = async () => {
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }

      ctx.font = `bold ${fontSize}px ${fontFamily}`;
      const m = ctx.measureText(text);
      const textW = Math.ceil(m.width);
      const textH = Math.ceil(
        (m.actualBoundingBoxAscent || fontSize * 0.8) +
        (m.actualBoundingBoxDescent || fontSize * 0.2)
      );

      canvas.width = textW + margin * 2;
      canvas.height = textH + margin * 2;
      const w = canvas.width;
      const h = canvas.height;

      const maskCanvas = document.createElement("canvas");
      maskCanvas.width = w;
      maskCanvas.height = h;
      const maskCtx = maskCanvas.getContext("2d");
      maskCtx.fillStyle = "#fff";
      maskCtx.font = `bold ${fontSize}px ${fontFamily}`;
      maskCtx.textAlign = "center";
      maskCtx.textBaseline = "middle";
      maskCtx.fillText(text, w / 2, h / 2);
      const maskData = maskCtx.getImageData(0, 0, w, h).data;

      function wave(x, y, t) {
        const centerX = w / 2;
        const centerY = h / 2;
        const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
        const maxDistance = Math.sqrt(centerX ** 2 + centerY ** 2);

        const waveSpeed = 0.003;
        const waveDelay = distance * 0.002;
        const wavePhase = (t - waveDelay) * waveSpeed;

        const amplitude = 30 * (1 - distance / maxDistance) * (y / h);
        const frequency = 0.03;

        return Math.sin(wavePhase + distance * frequency) * amplitude;
      }

      function draw(t) {
        ctx.clearRect(0, 0, w, h);

        // First, draw the filled text background
        ctx.fillStyle = backgroundColor;
        ctx.font = `bold ${fontSize}px ${fontFamily}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(text, w / 2, h / 2);

        for (let x = 0; x < w; x += spacingX) {
          // Draw continuous vertical line across entire canvas
          ctx.beginPath();
          ctx.strokeStyle = outsideColor;
          ctx.lineWidth = 1.5;
          
          for (let y = 0; y < h; y++) {
            const i = ((y * w) + x) * 4;
            const inside = maskData[i + 3] > 128;
            const offset = inside ? wave(x, y, t) : 0;
            
            if (y === 0) {
              ctx.moveTo(x + offset, y);
            } else {
              ctx.lineTo(x + offset, y);
            }
          }
          ctx.stroke();
          
          // Now overlay the text portions with thicker, brighter lines
          ctx.beginPath();
          let inText = false;
          
          for (let y = 0; y < h; y++) {
            const i = ((y * w) + x) * 4;
            const inside = maskData[i + 3] > 128;
            const offset = inside ? wave(x, y, t) : 0;
            
            if (inside && !inText) {
              ctx.moveTo(x + offset, y);
              inText = true;
            } else if (inside) {
              ctx.lineTo(x + offset, y);
            } else if (!inside && inText) {
              ctx.strokeStyle = insideColor;
              ctx.lineWidth = 3;
              ctx.stroke();
              ctx.beginPath();
              inText = false;
            }
          }
          
          if (inText) {
            ctx.strokeStyle = insideColor;
            ctx.lineWidth = 3;
            ctx.stroke();
          }
        }

        animationRef.current = requestAnimationFrame(draw);
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    setupCanvas();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [text, fontSize, spacingX, outsideColor, insideColor, backgroundColor]);

  return (
    <div className={`relative ${className}`} lang="en">
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          width: '100%',
          height: 'auto',
          maxWidth: '100%',
          transform: `scale(${scale})`,
          transformOrigin: 'center'
        }}
        aria-label={text}
        role="img"
      />
      {/* Hidden text element for translation services */}
      <span 
        className="sr-only"
        translate="yes"
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: 0,
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0,0,0,0)',
          whiteSpace: 'nowrap',
          border: 0
        }}
      >
        {text}
      </span>
    </div>
  );
};

export default SynthwaveText;