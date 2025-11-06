import { useRef, useEffect } from 'react';

export const useTouchControls = () => {
  const touchState = useRef({
    movement: { x: 0, z: 0 },
    jump: false,
    light: false,
    sprint: false,
    zoom: false
  });

  // Create a virtual keyboard controls getter that includes touch input
  const getTouchControls = () => {
    return {
      forward: touchState.current.movement.z > 0.3,
      backward: touchState.current.movement.z < -0.3,
      left: touchState.current.movement.x > 0.3,
      right: touchState.current.movement.x < -0.3,
      jump: touchState.current.jump,
      light: touchState.current.light,
      run: touchState.current.sprint,
      zoom: touchState.current.zoom
    };
  };

  // Handle touch actions
  const handleTouchAction = (action, value) => {
    switch (action) {
      case 'movement':
        touchState.current.movement = value;
        break;
      case 'jump':
        touchState.current.jump = value;
        break;
      case 'light':
        touchState.current.light = value;
        break;
      case 'lightJump':
        // Combo action - light candles while jumping
        touchState.current.jump = true;
        touchState.current.light = true;
        
        // Auto-release after a short duration
        setTimeout(() => {
          touchState.current.jump = false;
          touchState.current.light = false;
        }, 100);
        break;
      case 'sprint':
        touchState.current.sprint = value;
        break;
      case 'zoom':
        touchState.current.zoom = value;
        break;
    }
  };

  // Get movement values for analog control (for mouse dragging)
  const getMovementVector = () => {
    return touchState.current.movement;
  };

  return {
    getTouchControls,
    handleTouchAction,
    getMovementVector,
    touchState: touchState.current
  };
};