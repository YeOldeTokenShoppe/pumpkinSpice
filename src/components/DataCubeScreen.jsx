import { useEffect, useRef } from 'react';

const DataCubeScreen = () => {
  const animationFrameRef = useRef();
  const nodesRef = useRef([]);
  const connectionsRef = useRef([]);
  const pulseRef = useRef(0);

  // Initialize neural network nodes
  useEffect(() => {
    const nodes = [];
    const connections = [];
    
    // Create layers of nodes - smaller and more centered
    const layers = [3, 4, 3, 2]; // Input, hidden1, hidden2, output
    const layerSpacing = 120; // Reduced from 180
    const nodeSpacing = 35; // Reduced from 60
    
    layers.forEach((count, layerIndex) => {
      const x = 20 + layerIndex * layerSpacing / (layers.length - 1); // Shifted left from 60 to 40
      const layerHeight = count * nodeSpacing;
      const startY = 100 + (80 - layerHeight / 2); // Moved up from 180 to 140
      
      for (let i = 0; i < count; i++) {
        const y = startY + i * nodeSpacing;
        nodes.push({
          x,
          y,
          layer: layerIndex,
          index: i,
          activation: Math.random(),
          pulsePhase: Math.random() * Math.PI * 2
        });
      }
    });
    
    // Create connections between layers
    let nodeIndex = 0;
    for (let layer = 0; layer < layers.length - 1; layer++) {
      const currentLayerSize = layers[layer];
      const nextLayerSize = layers[layer + 1];
      const currentLayerStart = nodeIndex;
      const nextLayerStart = currentLayerStart + currentLayerSize;
      
      for (let i = 0; i < currentLayerSize; i++) {
        for (let j = 0; j < nextLayerSize; j++) {
          connections.push({
            from: currentLayerStart + i,
            to: nextLayerStart + j,
            weight: Math.random() * 2 - 1, // -1 to 1
            flow: Math.random()
          });
        }
      }
      nodeIndex += currentLayerSize;
    }
    
    nodesRef.current = nodes;
    connectionsRef.current = connections;
  }, []);

  // Drawing loop
  useEffect(() => {
    const draw = () => {
      // @ts-ignore
      const canvas = window['__screen1RCanvas'];
      // @ts-ignore
      const texture = window['__screen1RTexture'];

      if (!canvas || !texture) {
        animationFrameRef.current = requestAnimationFrame(draw);
        return;
      }

      const ctx = canvas.getContext('2d');
      const t = performance.now() / 1000;

      // Clear canvas
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, 256, 512);

      // Update pulse
      pulseRef.current = t;

      // Header - smaller and more padding
      ctx.fillStyle = '#00ffff';
      ctx.font = 'bold 10px monospace';
      ctx.fillText('◇ NEURAL NET ◇', 20, 30); // More padding, moved down

      // Draw divider
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(20, 40);
      ctx.lineTo(236, 40);
      ctx.stroke();

      // Update node activations
      nodesRef.current.forEach(node => {
        node.activation = (Math.sin(t * 2 + node.pulsePhase) + 1) / 2;
      });

      // Update connection flows
      connectionsRef.current.forEach(conn => {
        conn.flow = (Math.sin(t * 3 + conn.from + conn.to) + 1) / 2;
      });

      // Draw connections with flowing data
      connectionsRef.current.forEach(conn => {
        const fromNode = nodesRef.current[conn.from];
        const toNode = nodesRef.current[conn.to];
        
        // Connection strength based on weight and flow
        const alpha = Math.abs(conn.weight) * 0.3 + conn.flow * 0.2;
        const color = conn.weight > 0 ? 
          `rgba(0, 255, 255, ${alpha})` : 
          `rgba(255, 0, 255, ${alpha})`;
        
        ctx.strokeStyle = color;
        ctx.lineWidth = Math.abs(conn.weight) * 2 + 0.5;
        
        ctx.beginPath();
        ctx.moveTo(fromNode.x, fromNode.y);
        ctx.lineTo(toNode.x, toNode.y);
        ctx.stroke();
        
        // Draw flowing particles along connections
        if (conn.flow > 0.7) {
          const particleX = fromNode.x + (toNode.x - fromNode.x) * ((t * 2) % 1);
          const particleY = fromNode.y + (toNode.y - fromNode.y) * ((t * 2) % 1);
          
          ctx.fillStyle = '#ffffff';
          ctx.globalAlpha = conn.flow;
          ctx.beginPath();
          ctx.arc(particleX, particleY, 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      });

      // Draw nodes - smaller size
      nodesRef.current.forEach((node, index) => {
        const radius = 5 + node.activation * 2; // Reduced from 8 + activation * 4
        
        // Node glow effect
        const gradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, radius * 2);
        gradient.addColorStop(0, `rgba(0, 255, 255, ${node.activation})`);
        gradient.addColorStop(0.5, `rgba(0, 255, 255, ${node.activation * 0.5})`);
        gradient.addColorStop(1, 'rgba(0, 255, 255, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius * 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Node core
        const coreColor = node.layer === 0 ? '#00ff00' : // Input layer
                         node.layer === 3 ? '#ff00ff' : // Output layer
                         '#00ffff'; // Hidden layers
        
        ctx.fillStyle = coreColor;
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Inner bright core
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = node.activation;
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius * 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      // Layer labels - adjusted for new positions
      ctx.fillStyle = '#00ff00';
      ctx.font = '8px monospace';
      ctx.fillText('INPUT', 25, 290);
      ctx.fillStyle = '#00ffff';
      ctx.fillText('HID1', 75, 290);
      ctx.fillText('HID2', 115, 290);
      ctx.fillStyle = '#ff00ff';
      ctx.fillText('OUT', 160, 290);

      // Neural network metrics - more padding and smaller
      ctx.font = '9px monospace';
      const avgActivation = nodesRef.current.reduce((sum, node) => sum + node.activation, 0) / nodesRef.current.length;
      const avgFlow = connectionsRef.current.reduce((sum, conn) => sum + conn.flow, 0) / connectionsRef.current.length;
      
      const metrics = [
        { label: 'ACTIVE', value: avgActivation * 100, unit: '%', color: '#00ffff' },
        { label: 'SIGNAL', value: avgFlow * 100, unit: '%', color: '#00ff00' },
        { label: 'CONF', value: Math.sin(t * 0.5) * 50 + 50, unit: '%', color: '#ff00ff' }
      ];

      metrics.forEach((metric, i) => {
        const y = 320 + i * 20; // Moved up from 370 to 320
        ctx.fillStyle = metric.color;
        ctx.fillText(metric.label, 20, y); // More padding from edge
        
        // Value
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`${metric.value.toFixed(1)}${metric.unit}`, 75, y);
        
        // Progress bar - smaller and adjusted position
        ctx.fillStyle = metric.color;
        ctx.globalAlpha = 0.3;
        ctx.fillRect(130, y - 6, metric.value * 0.6, 4); // Smaller bars
        ctx.globalAlpha = 0.8;
        ctx.fillRect(130, y - 6, metric.value * 0.6 * (metric.value / 100), 4);
        ctx.globalAlpha = 1;
      });

      // Training status - adjusted position with more padding
      ctx.fillStyle = '#666666';
      ctx.font = '8px monospace';
      ctx.fillText('Epoch: ' + Math.floor(t / 10), 20, 410);
      ctx.fillText('Loss: ' + (0.1 + Math.sin(t * 0.2) * 0.05).toFixed(3), 100, 410);

      // Footer status with pulse - more padding
      const pulseAlpha = (Math.sin(t * 4) + 1) / 2;
      ctx.fillStyle = `rgba(0, 255, 255, ${pulseAlpha})`;
      ctx.font = 'bold 9px monospace';
      ctx.fillText('◆ LEARNING', 20, 435);
      
      // Activity indicator dots
      for (let i = 0; i < 3; i++) {
        const dotAlpha = (Math.sin(t * 3 - i * 0.5) + 1) / 2;
        ctx.fillStyle = `rgba(255, 255, 255, ${dotAlpha})`;
        ctx.beginPath();
        ctx.arc(100 + i * 6, 433, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Update texture
      texture.needsUpdate = true;

      animationFrameRef.current = requestAnimationFrame(draw);
    };

    animationFrameRef.current = requestAnimationFrame(draw);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return null;
};

export default DataCubeScreen;