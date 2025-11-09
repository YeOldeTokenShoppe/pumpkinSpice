import { Vector3 } from "three";
import { proxy, useSnapshot } from "valtio";

export const spells = [
  {
    name: "fire",
    emoji: "🔥",
    duration: 500,
    colors: ["orange", "red"],
    damage: 30,
    cooldown: 1000,
  },
  {
    name: "ice",
    emoji: "❄️",
    duration: 500,
    colors: ["skyblue", "white"],
    damage: 25,
    cooldown: 800,
  },
];

// Create Valtio proxy state
export const magicState = proxy({
  isCasting: false,
  currentSpell: spells[0],
  spellIndex: 0,
  spells: [],
  lastCastTime: {},
});

// Magic actions
export const magicActions = {
  // Switch to next spell
  nextSpell: () => {
    const nextIndex = (magicState.spellIndex + 1) % spells.length;
    magicState.spellIndex = nextIndex;
    magicState.currentSpell = spells[nextIndex];
  },
  
  // Switch to previous spell
  prevSpell: () => {
    const prevIndex = (magicState.spellIndex - 1 + spells.length) % spells.length;
    magicState.spellIndex = prevIndex;
    magicState.currentSpell = spells[prevIndex];
  },
  
  // Set specific spell by index
  setSpell: (index) => {
    if (index >= 0 && index < spells.length) {
      magicState.spellIndex = index;
      magicState.currentSpell = spells[index];
    }
  },
  
  // Cast current spell at target position
  castSpell: (targetPosition, casterPosition) => {
    const spell = magicState.currentSpell;
    const now = Date.now();
    
    console.log("castSpell called with:", { spell, targetPosition, casterPosition });
    
    // Check cooldown
    const lastCast = magicState.lastCastTime[spell.name] || 0;
    if (now - lastCast < spell.cooldown) {
      console.log(`${spell.name} spell is on cooldown`);
      return false;
    }
    
    // Check if already casting
    if (magicState.isCasting) {
      console.log("Already casting a spell");
      return false;
    }
    
    // Calculate direction from caster to target
    const direction = new Vector3()
      .subVectors(targetPosition, casterPosition)
      .normalize();
    
    // Create spell instance
    const newSpell = {
      id: `${Date.now()}-${Math.random()}`,
      name: spell.name,
      position: casterPosition.clone(),
      targetPosition: targetPosition.clone(),
      direction: direction,
      colors: spell.colors,
      damage: spell.damage,
      duration: spell.duration,
      time: now,
    };
    
    console.log("Creating new spell:", newSpell);
    
    magicState.isCasting = true;
    magicState.spells.push(newSpell);
    magicState.lastCastTime[spell.name] = now;
    
    console.log("Current spells in state:", magicState.spells);
    
    // Stop casting after duration
    setTimeout(() => {
      magicState.isCasting = false;
    }, spell.duration);
    
    // Clean up old spells
    setTimeout(() => {
      magicState.spells = magicState.spells.filter(
        (s) => Date.now() - s.time < 4000
      );
    }, 4000);
    
    return true;
  },
  
  // Get cooldown progress for current spell (0-1)
  getCooldownProgress: () => {
    const spell = magicState.currentSpell;
    const now = Date.now();
    const lastCast = magicState.lastCastTime[spell.name] || 0;
    const timeSinceLastCast = now - lastCast;
    
    if (timeSinceLastCast >= spell.cooldown) {
      return 1; // Ready to cast
    }
    
    return timeSinceLastCast / spell.cooldown;
  },
  
  // Clear all spells
  clearSpells: () => {
    magicState.spells = [];
  },
};

// Hook to use magic state in components
export const useMagic = () => {
  return useSnapshot(magicState);
};