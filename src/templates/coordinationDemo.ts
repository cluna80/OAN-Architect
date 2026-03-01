export const coordinationDemoTemplate = {
  name: "Team Coordination Demo",
  description: "Two teams competing with formation strategies",
  nodes: [
    // Team A (Left side)
    ...Array.from({ length: 3 }, (_, i) => ({
      id: `team-a-${i}`,
      type: 'entity',
      data: {
        label: `Warrior ${i + 1}`,
        reputation: 60,
        energy: 0,
        wins: 0,
        losses: 0,
        experience: 0
      },
      position: { x: 150, y: 150 + i * 150 }
    })),
    
    // Team B (Right side)
    ...Array.from({ length: 3 }, (_, i) => ({
      id: `team-b-${i}`,
      type: 'entity',
      data: {
        label: `Rogue ${i + 1}`,
        reputation: 60,
        energy: 0,
        wins: 0,
        losses: 0,
        experience: 0
      },
      position: { x: 750, y: 150 + i * 150 }
    })),
    
    // Coordinators
    {
      id: 'team-a-leader',
      type: 'entity',
      data: {
        label: 'Team A Leader',
        reputation: 80,
        energy: 0,
        wins: 0,
        losses: 0,
        experience: 500
      },
      position: { x: 150, y: 50 }
    },
    {
      id: 'team-b-leader',
      type: 'entity',
      data: {
        label: 'Team B Leader',
        reputation: 80,
        energy: 0,
        wins: 0,
        losses: 0,
        experience: 500
      },
      position: { x: 750, y: 50 }
    }
  ],
  edges: [
    // Team A connections
    ...Array.from({ length: 3 }, (_, i) => ({
      id: `e-leader-a-${i}`,
      source: 'team-a-leader',
      target: `team-a-${i}`,
      animated: true,
      style: { stroke: '#22d3ee' }
    })),
    
    // Team B connections
    ...Array.from({ length: 3 }, (_, i) => ({
      id: `e-leader-b-${i}`,
      source: 'team-b-leader',
      target: `team-b-${i}`,
      animated: true,
      style: { stroke: '#8b5cf6' }
    })),
    
    // Cross-team battles
    {
      id: 'e-battle-1',
      source: 'team-a-0',
      target: 'team-b-0',
      animated: true,
      style: { stroke: '#f472b6', strokeDasharray: '5,5' }
    },
    {
      id: 'e-battle-2',
      source: 'team-a-1',
      target: 'team-b-1',
      animated: true,
      style: { stroke: '#f472b6', strokeDasharray: '5,5' }
    }
  ]
};
