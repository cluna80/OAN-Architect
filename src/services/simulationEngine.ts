/**
 * Simulation Engine for OAN Architect Platform
 * Executes demo scenarios and shows live updates
 */

import { useGraphStore } from '../stores/useGraphStore';

export interface SimulationConfig {
  speed: number; // ms between updates
  autoTrain: boolean;
  autoMatch: boolean;
  maxCycles: number;
}

export class SimulationEngine {
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;
  private cycleCount = 0;
  
  constructor(private config: SimulationConfig) {}

  async start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.cycleCount = 0;
    
    console.log('[SIM] Starting simulation...');
    
    this.intervalId = setInterval(() => {
      this.runCycle();
    }, this.config.speed);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('[SIM] Stopped after', this.cycleCount, 'cycles');
  }

  private async runCycle() {
    this.cycleCount++;
    
    const { nodes, updateNodeData } = useGraphStore.getState();
    
    // Find all entities with OAN brains
    const oanEntities = nodes.filter(n => 
      n.type === 'entity' && n.data.oan_entity_id
    );

    if (oanEntities.length === 0) {
      console.log('[SIM] No OAN entities found');
      this.stop();
      return;
    }

    console.log(`[SIM] Cycle ${this.cycleCount}: Processing ${oanEntities.length} entities`);

    // Auto-train entities
    if (this.config.autoTrain) {
      for (const entity of oanEntities) {
        await this.trainEntity(entity.id);
      }
    }

    // Auto-match entities
    if (this.config.autoMatch && oanEntities.length >= 2) {
      const e1 = oanEntities[Math.floor(Math.random() * oanEntities.length)];
      const e2 = oanEntities[Math.floor(Math.random() * oanEntities.length)];
      
      if (e1.id !== e2.id) {
        await this.simulateMatch(e1.id, e2.id);
      }
    }

    // Stop after max cycles
    if (this.cycleCount >= this.config.maxCycles) {
      this.stop();
      console.log('[SIM] Reached max cycles');
    }
  }

  private async trainEntity(nodeId: string) {
    const skills = ['strength', 'agility', 'stamina', 'skill'];
    const randomSkill = skills[Math.floor(Math.random() * skills.length)];
    
    try {
      const response = await fetch(`http://localhost:8000/entities/${nodeId}/train`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entity_id: nodeId,
          skill: randomSkill,
          intensity: 5
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        const { updateNodeData } = useGraphStore.getState();
        updateNodeData(nodeId, {
          reputation: result.entity.confidence * 100,
          wins: result.entity.wins,
          losses: result.entity.losses,
          experience: result.entity.experience
        });
        
        console.log(`[SIM] Trained ${nodeId} (${randomSkill})`);
      }
    } catch (error) {
      console.error('[SIM] Training error:', error);
    }
  }

  private async simulateMatch(nodeId1: string, nodeId2: string) {
    try {
      const response = await fetch('http://localhost:8000/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entity_a_id: nodeId1,
          entity_b_id: nodeId2
        })
      });
      
      const result = await response.json();
      
      if (result.entity_a && result.entity_b) {
        const { updateNodeData } = useGraphStore.getState();
        
        // Update both entities
        updateNodeData(nodeId1, {
          reputation: result.entity_a.confidence * 100,
          wins: result.entity_a.wins,
          losses: result.entity_a.losses,
          experience: result.entity_a.experience
        });
        
        updateNodeData(nodeId2, {
          reputation: result.entity_b.confidence * 100,
          wins: result.entity_b.wins,
          losses: result.entity_b.losses,
          experience: result.entity_b.experience
        });
        
        console.log(`[SIM] Match: ${nodeId1} vs ${nodeId2} - Winner: ${result.result.winner === 1 ? nodeId1 : nodeId2}`);
      }
    } catch (error) {
      console.error('[SIM] Match error:', error);
    }
  }

  isActive() {
    return this.isRunning;
  }

  getCycleCount() {
    return this.cycleCount;
  }
}

// Singleton instance
let simulationInstance: SimulationEngine | null = null;

export const startSimulation = (config?: Partial<SimulationConfig>) => {
  const defaultConfig: SimulationConfig = {
    speed: 2000, // 2 seconds between cycles
    autoTrain: true,
    autoMatch: true,
    maxCycles: 50
  };

  const finalConfig = { ...defaultConfig, ...config };
  
  if (simulationInstance?.isActive()) {
    console.log('[SIM] Already running');
    return simulationInstance;
  }

  simulationInstance = new SimulationEngine(finalConfig);
  simulationInstance.start();
  return simulationInstance;
};

export const stopSimulation = () => {
  if (simulationInstance) {
    simulationInstance.stop();
    simulationInstance = null;
  }
};

export const getSimulation = () => simulationInstance;
