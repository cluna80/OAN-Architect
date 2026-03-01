export const tradingDemoTemplate = {
  name: "Autonomous Trading Agent Demo",
  description: "AI-powered market maker with OAN brain intelligence",
  nodes: [
    {
      id: 'wallet-1',
      type: 'wallet',
      data: {
        label: 'Trading Wallet',
        balance: 10000,
        profit: 0,
        trades: 0
      },
      position: { x: 100, y: 100 }
    },
    {
      id: 'market-1',
      type: 'marketData',
      data: {
        label: 'BTC/USD Market',
        price: 52000,
        change: 0,
        volume: 5000000
      },
      position: { x: 400, y: 100 }
    },
    {
      id: 'agent-1',
      type: 'tradingAgent',
      data: {
        label: 'Alpha Trader',
        isActive: false,
        strategy: 'Market Making',
        winRate: 0,
        totalTrades: 0
      },
      position: { x: 700, y: 100 }
    },
    {
      id: 'entity-1',
      type: 'entity',
      data: {
        label: 'Market Analyzer',
        reputation: 50,
        energy: 0,
        wins: 0,
        losses: 0,
        experience: 0
      },
      position: { x: 400, y: 300 }
    }
  ],
  edges: [
    {
      id: 'e-market-agent',
      source: 'market-1',
      target: 'agent-1',
      animated: true,
      style: { stroke: '#8b5cf6' }
    },
    {
      id: 'e-agent-wallet',
      source: 'agent-1',
      target: 'wallet-1',
      animated: true,
      style: { stroke: '#10b981' }
    },
    {
      id: 'e-market-entity',
      source: 'market-1',
      target: 'entity-1',
      animated: true,
      style: { stroke: '#22d3ee' }
    }
  ]
};
