/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap, 
  Panel,
  BackgroundVariant
} from 'reactflow';
import 'reactflow/dist/style.css';

import { useGraphStore } from './stores/useGraphStore';
import { EntityNode } from './components/nodes/EntityNode';
import { PromptNode } from './components/nodes/PromptNode';
import { RelationshipNode } from './components/nodes/RelationshipNode';
import { SimConfigNode } from './components/nodes/SimConfigNode';
import { WalletNode } from './components/nodes/WalletNode';
import { MarketDataNode } from './components/nodes/MarketDataNode';
import { TradingAgentNode } from './components/nodes/TradingAgentNode';
import { CognitiveAgentNode } from './components/nodes/CognitiveAgentNode';
import { Sidebar } from './components/Sidebar';
import { Toolbar } from './components/Toolbar';
import { ChatPanel } from './components/ChatPanel';

const nodeTypes = {
  entity: EntityNode,
  prompt: PromptNode,
  relationship: RelationshipNode,
  simConfig: SimConfigNode,
  wallet: WalletNode,
  marketData: MarketDataNode,
  tradingAgent: TradingAgentNode,
  cognitiveAgent: CognitiveAgentNode,
};

export default function App() {
  const { 
    nodes, 
    edges, 
    onNodesChange, 
    onEdgesChange, 
    onConnect,
    setSelectedNode 
  } = useGraphStore();

  const onNodeClick = (_: React.MouseEvent, node: any) => {
    setSelectedNode(node);
  };

  const onPaneClick = () => {
    setSelectedNode(null);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0a0a1f] text-white overflow-hidden font-sans">
      <Toolbar />
      
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Chat Panel */}
        <ChatPanel />

        {/* Main Canvas */}
        <div className="flex-1 h-full relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            fitView
            className="bg-[#0a0a1f]"
            snapToGrid
            snapGrid={[15, 15]}
            defaultEdgeOptions={{
              style: { stroke: '#c084fc', strokeWidth: 2 },
              animated: true,
            }}
          >
            <Background 
              variant={BackgroundVariant.Lines} 
              color="rgba(192, 132, 252, 0.05)" 
              gap={30} 
            />
            <Controls className="bg-[#0a0a1f] border border-white/10 fill-white" />
            <MiniMap 
              style={{ backgroundColor: '#0a0a1f' }}
              nodeColor={(n) => {
                if (n.type === 'entity') return '#22d3ee';
                if (n.type === 'prompt') return '#c084fc';
                if (n.type === 'relationship') return '#f472b6';
                if (n.type === 'wallet') return '#10b981';
                if (n.type === 'marketData') return '#f59e0b';
                if (n.type === 'tradingAgent') return '#8b5cf6';
                return '#fff';
              }}
              maskColor="rgba(0, 0, 0, 0.5)"
            />
            
            <Panel position="bottom-left" className="bg-[#0a0a1f]/60 backdrop-blur-md p-2 rounded border border-white/10 text-[10px] font-mono text-white/40 uppercase tracking-widest ml-96">
              OAN Visual Architect v1.0.5-beta • Trading Demo Ready
            </Panel>
          </ReactFlow>

          <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />
        </div>

        {/* Right Sidebar */}
        <Sidebar />
      </div>
    </div>
  );
}
