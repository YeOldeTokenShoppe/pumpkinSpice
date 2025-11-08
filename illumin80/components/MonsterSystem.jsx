import { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../../src/lib/gameStore';
import { Vector3 } from 'three';
import { Monster } from './Monster';

const SPAWN_DISTANCE = 4; // Spawn when player within 4 meters
const DESPAWN_DISTANCE = 6; // Despawn when player beyond 6 meters

// Monster spawn configuration - positions are along your 10m platform
const MONSTER_DATA = [
  { id: 'monster_1', position: [2, 0.5, 0], type: 'goblin', health: 50, scale: 0.3 },
  { id: 'monster_2', position: [4.5, 0.5, 0], type: 'skeleton', health: 75, scale: 0.35 },
  { id: 'monster_3', position: [7, 0.5, 0], type: 'ghost', health: 30, scale: 0.28 },
  // Add more monsters as needed along the platform
];

export const MonsterSystem = () => {
  const [activeMonsters, setActiveMonsters] = useState(new Map());
  const monsterRefs = useRef(new Map());
  const { characterPosition, defeatedMonsters, defeatMonster } = useGameStore();
  const playerPos = useRef(new Vector3());
  const monsterPos = useRef(new Vector3());

  useFrame(() => {
    if (!characterPosition) return;
    
    // Convert character position to Vector3
    playerPos.current.set(
      characterPosition.x,
      characterPosition.y,
      characterPosition.z
    );

    // Check each potential monster spawn
    MONSTER_DATA.forEach(monsterConfig => {
      // Skip if already defeated
      if (defeatedMonsters?.has(monsterConfig.id)) return;

      // Calculate distance to player
      monsterPos.current.set(...monsterConfig.position);
      const distance = playerPos.current.distanceTo(monsterPos.current);

      const isActive = activeMonsters.has(monsterConfig.id);

      // Spawn logic
      if (!isActive && distance < SPAWN_DISTANCE) {
        console.log(`Spawning ${monsterConfig.type} at distance ${distance.toFixed(2)}m`);
        setActiveMonsters(prev => new Map(prev).set(monsterConfig.id, monsterConfig));
      }
      // Despawn logic
      else if (isActive && distance > DESPAWN_DISTANCE) {
        console.log(`Despawning ${monsterConfig.type} - too far away`);
        handleDespawn(monsterConfig.id);
      }
    });
  });

  const handleDespawn = (monsterId) => {
    // Clean up refs
    if (monsterRefs.current.has(monsterId)) {
      const monsterRef = monsterRefs.current.get(monsterId);
      // Dispose of resources if needed
      if (monsterRef?.dispose) {
        monsterRef.dispose();
      }
      monsterRefs.current.delete(monsterId);
    }
    
    // Remove from active monsters
    setActiveMonsters(prev => {
      const newMap = new Map(prev);
      newMap.delete(monsterId);
      return newMap;
    });
  };

  const handleMonsterDefeat = (monsterId) => {
    console.log(`Monster ${monsterId} defeated!`);
    
    // Update game store
    defeatMonster(monsterId);
    
    // Remove from scene
    handleDespawn(monsterId);
    
    // Could add score, effects, drops here
    const monster = activeMonsters.get(monsterId);
    if (monster) {
      // Add score based on monster type
      const scoreMap = { goblin: 10, skeleton: 20, ghost: 15 };
      useGameStore.getState().addScore(scoreMap[monster.type] || 10);
    }
  };

  return (
    <>
      {Array.from(activeMonsters.values()).map(monster => (
        <Monster
          key={monster.id}
          ref={ref => {
            if (ref) monsterRefs.current.set(monster.id, ref);
          }}
          {...monster}
          onDefeat={() => handleMonsterDefeat(monster.id)}
        />
      ))}
    </>
  );
};