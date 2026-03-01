import type { EntityBrainData, MatchResult, Relationship } from '../types/oan';

const API_BASE = 'http://localhost:8000';

class OANApi {
  private ws: WebSocket | null = null;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  async createEntity(nodeId: string, name: string, type: string = 'fighter'): Promise<EntityBrainData> {
    const response = await fetch(`${API_BASE}/entities/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ node_id: nodeId, name, entity_type: type })
    });
    return response.json();
  }

  async getEntity(nodeId: string): Promise<EntityBrainData> {
    const response = await fetch(`${API_BASE}/entities/${nodeId}`);
    return response.json();
  }

  async trainSkill(nodeId: string, skill: string, intensity: number) {
    const response = await fetch(`${API_BASE}/entities/${nodeId}/train`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entity_id: nodeId, skill, intensity })
    });
    return response.json();
  }

  async simulateMatch(entityAId: string, entityBId: string): Promise<{
    result: MatchResult;
    entity_a: EntityBrainData;
    entity_b: EntityBrainData;
    relationship: Relationship;
  }> {
    const response = await fetch(`${API_BASE}/match`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entity_a_id: entityAId, entity_b_id: entityBId })
    });
    return response.json();
  }

  async getRelationship(nodeId: string, otherNodeId: string): Promise<Relationship> {
    const response = await fetch(`${API_BASE}/entities/${nodeId}/relationship/${otherNodeId}`);
    return response.json();
  }

  connectWebSocket(onUpdate: (nodeId: string, data: EntityBrainData) => void) {
    this.ws = new WebSocket('ws://localhost:8000/ws');
    
    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'entity_update') {
        onUpdate(message.node_id, message.data);
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    this.ws.onclose = () => {
      console.log('WebSocket closed, reconnecting...');
      setTimeout(() => this.connectWebSocket(onUpdate), 3000);
    };
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const oanApi = new OANApi();
