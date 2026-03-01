const BASE_URL = 'http://localhost:8000';

interface CognitiveDecision {
  action: string;
  amount?: number;
  reasoning: string;
  emotion: string;
  energy: {
    current: number;
    max: number;
    percentage: number;
    status: string;
    can_act: boolean;
  };
  confidence?: number;
}

interface EmotionUpdate {
  emotion: string;
  intensity: number;
  modifiers: {
    trade_size: number;
    risk_tolerance: number;
    patience: number;
  };
}

interface EnergyStatus {
  current: number;
  max: number;
  percentage: number;
  status: string;
  can_act: boolean;
}

export const cognitiveApi = {
  baseUrl: BASE_URL,

  async getDecision(
    entityId: string,
    marketState?: any,
    useLLM: boolean = true
  ): Promise<CognitiveDecision> {
    const response = await fetch(`${BASE_URL}/cognitive/decision`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        entity_id: entityId,
        market_state: marketState,
        use_llm: useLLM,
      }),
    });

    if (!response.ok) {
      throw new Error(`Cognitive decision failed: ${response.statusText}`);
    }

    return response.json();
  },

  async updateEmotion(
    entityId: string,
    profit: number,
    winRate: number,
    volatility: number = 0.02
  ): Promise<EmotionUpdate> {
    const response = await fetch(`${BASE_URL}/cognitive/emotion/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        entity_id: entityId,
        profit,
        win_rate: winRate,
        volatility,
      }),
    });

    if (!response.ok) {
      throw new Error(`Emotion update failed: ${response.statusText}`);
    }

    return response.json();
  },

  async getEnergy(entityId: string): Promise<EnergyStatus> {
    const response = await fetch(`${BASE_URL}/cognitive/energy/${entityId}`);

    if (!response.ok) {
      throw new Error(`Get energy failed: ${response.statusText}`);
    }

    return response.json();
  },

  async rest(entityId: string): Promise<{ success: boolean; energy: EnergyStatus }> {
    const response = await fetch(`${BASE_URL}/cognitive/energy/${entityId}/rest`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error(`Rest failed: ${response.statusText}`);
    }

    return response.json();
  },

  async getMarketState(): Promise<any> {
    const response = await fetch(`${BASE_URL}/cognitive/market`);

    if (!response.ok) {
      throw new Error(`Get market state failed: ${response.statusText}`);
    }

    return response.json();
  },

  async clearMemory(entityId: string): Promise<void> {
    await fetch(`${BASE_URL}/cognitive/memory/${entityId}`, {
      method: 'DELETE'
    });
  },

  async clearAllMemory(): Promise<void> {
    await fetch(`${BASE_URL}/cognitive/memory/all`, {
      method: 'DELETE'
    });
  }
};
