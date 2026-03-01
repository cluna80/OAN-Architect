export const behaviorDemoTemplate = {
  name: "Behavior Rules Demo",
  description: "Test IF/THEN behavior rules with visual feedback",
  nodes: [
    {
      id: 'entity-behavior-1',
      type: 'entity',
      data: {
        label: 'Test Subject',
        reputation: 30,  // Low confidence
        energy: 0,
        wins: 0,
        losses: 0,
        experience: 0
      },
      position: { x: 300, y: 200 }
    },
    {
      id: 'entity-behavior-2',
      type: 'entity',
      data: {
        label: 'Control Subject',
        reputation: 80,  // High confidence
        energy: 0,
        wins: 0,
        losses: 0,
        experience: 0
      },
      position: { x: 600, y: 200 }
    },
    {
      id: 'config-behavior',
      type: 'simConfig',
      data: {
        label: 'Behavior Config',
        cyclesPerSec: 30,
        matchSim: true
      },
      position: { x: 450, y: 50 }
    }
  ],
  edges: [
    {
      id: 'e-config-1',
      source: 'config-behavior',
      target: 'entity-behavior-1',
      animated: true,
      style: { stroke: '#22d3ee' }
    },
    {
      id: 'e-config-2',
      source: 'config-behavior',
      target: 'entity-behavior-2',
      animated: true,
      style: { stroke: '#22d3ee' }
    }
  ]
};
