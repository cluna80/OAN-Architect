import { create } from 'zustand';
import {
  Connection,
  Edge,
  EdgeChange,
  Node,
  NodeChange,
  addEdge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  applyNodeChanges,
  applyEdgeChanges,
} from 'reactflow';

export type NodeType = 'entity' | 'prompt' | 'relationship' | 'simConfig' | 'wallet' | 'marketData' | 'tradingAgent';

export interface NodeData {
  label: string;
  id?: string;
  // Entity specific
  reputation?: number;
  energy?: number;
  emotion?: string;
  wins?: number;
  losses?: number;
  experience?: number;
  oan_entity_id?: string;
  summary?: string;
  stats?: any;
  // Wallet specific
  balance?: number;
  profit?: number;
  trades?: number;
  // Market Data specific
  price?: number;
  change?: number;
  volume?: number;
  // Trading Agent specific
  isActive?: boolean;
  strategy?: string;
  winRate?: number;
  totalTrades?: number;
  // Prompt specific
  prompt?: string;
  // Relationship specific
  trust?: number;
  // SimConfig specific
  cyclesPerSec?: number;
  matchSim?: boolean;
  [key: string]: any;
}

interface GraphState {
  nodes: Node<NodeData>[];
  edges: Edge[];
  selectedNode: Node<NodeData> | null;
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  setNodes: (nodes: Node<NodeData>[]) => void;
  setEdges: (edges: Edge[]) => void;
  updateNodeData: (nodeId: string, data: Partial<NodeData>) => void;
  setSelectedNode: (node: Node<NodeData> | null) => void;
  addNode: (type: NodeType) => void;
}

export const useGraphStore = create<GraphState>((set, get) => ({
  nodes: [
    {
      id: '1',
      type: 'entity',
      data: { 
        label: 'Agent Alpha', 
        reputation: 50,
        energy: 0,
        emotion: 'neutral',
        wins: 0,
        losses: 0,
        experience: 0
      },
      position: { x: 250, y: 50 },
    },
    {
      id: '2',
      type: 'simConfig',
      data: { label: 'Global Config', cyclesPerSec: 60, matchSim: true },
      position: { x: 50, y: 50 },
    },
  ],
  edges: [],
  selectedNode: null,

  onNodesChange: (changes: NodeChange[]) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
  },

  onEdgesChange: (changes: EdgeChange[]) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },

  onConnect: (connection: Connection) => {
    set({
      edges: addEdge(connection, get().edges),
    });
  },

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),

  updateNodeData: (nodeId, data) => {
    set({
      nodes: get().nodes.map((node) => {
        if (node.id === nodeId) {
          return { ...node, data: { ...node.data, ...data } };
        }
        return node;
      }),
    });
    const selected = get().selectedNode;
    if (selected && selected.id === nodeId) {
      set({ selectedNode: { ...selected, data: { ...selected.data, ...data } } });
    }
  },

  setSelectedNode: (node) => set({ selectedNode: node }),

  addNode: (type) => {
    const id = `${type}-${Date.now()}`;
    const newNode: Node<NodeData> = {
      id,
      type,
      data: { 
        label: `New ${type}`,
        ...(type === 'entity' ? { 
          reputation: 50, 
          energy: 0, 
          emotion: 'neutral',
          wins: 0,
          losses: 0,
          experience: 0
        } : {}),
        ...(type === 'wallet' ? { 
          balance: 10000, 
          profit: 0, 
          trades: 0 
        } : {}),
        ...(type === 'marketData' ? { 
          price: 50000, 
          change: 0, 
          volume: 1000000 
        } : {}),
        ...(type === 'tradingAgent' ? { 
          isActive: false, 
          strategy: 'Market Making', 
          winRate: 0, 
          totalTrades: 0 
        } : {}),
        ...(type === 'prompt' ? { prompt: '' } : {}),
        ...(type === 'relationship' ? { trust: 0.5 } : {}),
        ...(type === 'simConfig' ? { cyclesPerSec: 30, matchSim: false } : {}),
      },
      position: { x: Math.random() * 400 + 100, y: Math.random() * 400 + 100 },
    };
    set({ nodes: [...get().nodes, newNode] });
  },
}));
