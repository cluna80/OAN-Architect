export const communicationDemoTemplate = {
  name: "Entity Communication Demo",
  description: "Watch entities talk to each other using Ollama AI",
  nodes: [
    {
      id: 'entity-comm-1',
      type: 'entity',
      data: {
        label: 'Warrior',
        reputation: 70,
        energy: 0,
        wins: 5,
        losses: 2,
        experience: 350
      },
      position: { x: 200, y: 250 }
    },
    {
      id: 'entity-comm-2',
      type: 'entity',
      data: {
        label: 'Mage',
        reputation: 60,
        energy: 0,
        wins: 3,
        losses: 4,
        experience: 280
      },
      position: { x: 500, y: 250 }
    },
    {
      id: 'entity-comm-3',
      type: 'entity',
      data: {
        label: 'Rogue',
        reputation: 50,
        energy: 0,
        wins: 4,
        losses: 3,
        experience: 300
      },
      position: { x: 800, y: 250 }
    },
    {
      id: 'relationship-1',
      type: 'relationship',
      data: {
        label: 'Rivals',
        trust: 0.3
      },
      position: { x: 350, y: 150 }
    },
    {
      id: 'relationship-2',
      type: 'relationship',
      data: {
        label: 'Allies',
        trust: 0.8
      },
      position: { x: 650, y: 150 }
    }
  ],
  edges: [
    {
      id: 'e-warrior-rival',
      source: 'entity-comm-1',
      target: 'relationship-1',
      animated: true,
      style: { stroke: '#f472b6' }
    },
    {
      id: 'e-rival-mage',
      source: 'relationship-1',
      target: 'entity-comm-2',
      animated: true,
      style: { stroke: '#f472b6' }
    },
    {
      id: 'e-mage-ally',
      source: 'entity-comm-2',
      target: 'relationship-2',
      animated: true,
      style: { stroke: '#10b981' }
    },
    {
      id: 'e-ally-rogue',
      source: 'relationship-2',
      target: 'entity-comm-3',
      animated: true,
      style: { stroke: '#10b981' }
    }
  ]
};
