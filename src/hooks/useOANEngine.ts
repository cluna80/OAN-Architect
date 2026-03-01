import { useEffect, useCallback } from 'react';
import { useGraphStore } from '../stores/useGraphStore';
import { oanApi } from '../services/oanApi';
import type { EntityBrainData } from '../types/oan';

export function useOANEngine() {
  const { nodes, updateNodeData } = useGraphStore();

  // Connect to WebSocket for real-time updates
  useEffect(() => {
    const handleEntityUpdate = (nodeId: string, data: EntityBrainData) => {
      updateNodeData(nodeId, {
        reputation: Math.round(data.confidence * 100),
        energy: Math.round(data.win_rate * 100),
        wins: data.wins,
        losses: data.losses,
        experience: data.experience,
        oan_entity_id: data.entity_id,
        summary: data.summary,
      });
    };

    oanApi.connectWebSocket(handleEntityUpdate);

    return () => {
      oanApi.disconnect();
    };
  }, [updateNodeData]);

  // Create entity in OAN
  const createOANEntity = useCallback(async (nodeId: string, name: string) => {
    try {
      const data = await oanApi.createEntity(nodeId, name, 'fighter');
      
      updateNodeData(nodeId, {
        reputation: Math.round(data.confidence * 100),
        energy: Math.round(data.win_rate * 100),
        wins: data.wins || 0,
        losses: data.losses || 0,
        experience: data.experience || 0,
        oan_entity_id: data.entity_id,
        summary: data.summary,
      });

      return data;
    } catch (error) {
      console.error('Failed to create OAN entity:', error);
      return null;
    }
  }, [updateNodeData]);

  // Train entity skill - NOW WITH REFRESH
  const trainEntity = useCallback(async (nodeId: string, skill: string, intensity: number = 10) => {
    try {
      const result = await oanApi.trainSkill(nodeId, skill, intensity);
      
      // Manually refresh entity data after training
      if (result.success) {
        const freshData = await oanApi.getEntity(nodeId);
        updateNodeData(nodeId, {
          reputation: Math.round(freshData.confidence * 100),
          energy: Math.round(freshData.win_rate * 100),
          wins: freshData.wins || 0,
          losses: freshData.losses || 0,
          experience: freshData.experience || 0,
        });
      }
      
      return result;
    } catch (error) {
      console.error('Failed to train entity:', error);
      return null;
    }
  }, [updateNodeData]);

  // Simulate match between two entities
  const simulateMatch = useCallback(async (entityAId: string, entityBId: string) => {
    try {
      const result = await oanApi.simulateMatch(entityAId, entityBId);
      return result;
    } catch (error) {
      console.error('Failed to simulate match:', error);
      return null;
    }
  }, []);

  // Get relationship between entities
  const getRelationship = useCallback(async (nodeId: string, otherNodeId: string) => {
    try {
      const relationship = await oanApi.getRelationship(nodeId, otherNodeId);
      return relationship;
    } catch (error) {
      console.error('Failed to get relationship:', error);
      return null;
    }
  }, []);

  return {
    createOANEntity,
    trainEntity,
    simulateMatch,
    getRelationship,
  };
}
