const API_BASE = 'http://localhost:8000';

export interface MarketData {
  price: number;
  volume: number;
  change_24h: number;
  trend: 'UP' | 'DOWN' | 'SIDEWAYS';
}

export interface TradingStats {
  balance: number;
  total_profit: number;
  total_trades: number;
  wins: number;
  losses: number;
  win_rate: number;
  has_position: boolean;
  recent_trades: Array<{
    id: string;
    action: string;
    price: number;
    amount: number;
    profit_loss: number;
    timestamp: string;
  }>;
}

export interface TradingDecision {
  market: {
    price: number;
    trend: string;
    change: number;
  };
  decision: {
    action: 'BUY' | 'SELL' | 'HOLD';
    reason: string;
    amount: number;
    explanation?: string;
  };
}

class TradingApi {
  async getMarketData(): Promise<MarketData> {
    const response = await fetch(`${API_BASE}/trading/market`);
    return response.json();
  }

  async startTrading(agentId: string, walletBalance: number = 10000) {
    const response = await fetch(`${API_BASE}/trading/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agent_id: agentId, wallet_balance: walletBalance })
    });
    return response.json();
  }

  async stopTrading(agentId: string) {
    const response = await fetch(`${API_BASE}/trading/stop/${agentId}`, {
      method: 'POST'
    });
    return response.json();
  }

  async executeTrade(agentId: string, action: string, amount: number, price: number, confidence: number) {
    const response = await fetch(`${API_BASE}/trading/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        agent_id: agentId, 
        action, 
        amount, 
        price, 
        confidence 
      })
    });
    return response.json();
  }

  async getTradingStats(agentId: string): Promise<TradingStats> {
    const response = await fetch(`${API_BASE}/trading/stats/${agentId}`);
    return response.json();
  }

  async getTradingDecision(agentId: string): Promise<TradingDecision> {
    const response = await fetch(`${API_BASE}/trading/decision/${agentId}`, {
      method: 'POST'
    });
    return response.json();
  }
}

export const tradingApi = new TradingApi();
