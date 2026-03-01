export const spawningDemoTemplate = {
  name: "Mass Spawning Demo",
  description: "Spawn multiple entities and watch them interact",
  nodes: [
    {
      id: 'spawner',
      type: 'simConfig',
      data: {
        label: 'Entity Spawner',
        cyclesPerSec: 60,
        matchSim: true
      },
      position: { x: 400, y: 100 }
    },
    // Grid of entities
    ...Array.from({ length: 9 }, (_, i) => ({
      id: `entity-spawn-${i}`,
      type: 'entity',
      data: {
        label: `Entity ${i + 1}`,
        reputation: 50,
        energy: 0,
        wins: 0,
        losses: 0,
        experience: 0
      },
      position: { 
        x: 200 + (i % 3) * 250, 
        y: 250 + Math.floor(i / 3) * 150 
      }
    }))
  ],
  edges: [
    // Connect spawner to all entities
    ...Array.from({ length: 9 }, (_, i) => ({
      id: `e-spawn-${i}`,
      source: 'spawner',
      target: `entity-spawn-${i}`,
      animated: true,
      style: { stroke: '#c084fc' }
    }))
  ]
};
