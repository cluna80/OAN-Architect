export const cognitiveDemoTemplate = {
  name: "Cognitive AI Trading Demo",
  description: "LangGraph-powered autonomous agents with emotions and energy",
  nodes: [
    {
      id: 'cognitive-agent-1',
      type: 'cognitiveAgent',  // IMPORTANT: Must match nodeTypes key
      data: {
        label: 'Alpha Thinker',
        emotion: 'calm',
        energy: 100
      },
      position: { x: 200, y: 350 }
    },
    {
      id: 'cognitive-agent-2',
      type: 'cognitiveAgent',  // IMPORTANT: Must match nodeTypes key
      data: {
        label: 'Beta Analyzer',
        emotion: 'calm',
        energy: 100
      },
      position: { x: 550, y: 350 }
    },
    {
      id: 'cognitive-agent-3',
      type: 'cognitiveAgent',  // IMPORTANT: Must match nodeTypes key
      data: {
        label: 'Gamma Strategist',
        emotion: 'calm',
        energy: 100
      },
      position: { x: 900, y: 350 }
    },
    {
      id: 'market-cognitive',
      type: 'marketData',
      data: {
        label: 'Cognitive Market',
        price: 52000,
        change: 0,
        volume: 1000000
      },
      position: { x: 550, y: 100 }
    }
  ],
  edges: [
    {
      id: 'e-market-1',
      source: 'market-cognitive',
      target: 'cognitive-agent-1',
      animated: true,
      style: { stroke: '#a855f7' }
    },
    {
      id: 'e-market-2',
      source: 'market-cognitive',
      target: 'cognitive-agent-2',
      animated: true,
      style: { stroke: '#a855f7' }
    },
    {
      id: 'e-market-3',
      source: 'market-cognitive',
      target: 'cognitive-agent-3',
      animated: true,
      style: { stroke: '#a855f7' }
    }
  ]
};
