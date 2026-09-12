import React, { useEffect, useState, useCallback } from 'react';
import ReactFlow, { Background, Controls, addEdge, useNodesState, useEdgesState, ConnectionMode } from 'reactflow';
import 'reactflow/dist/style.css';
import { useCircuitStore } from '../store/useCircuitStore';
import { COMPONENT_LIBRARY } from '../library/components';
import { AutoFritzingNode } from './nodes/AutoFritzingNode'; // Adjust this path if your node is stored elsewhere

const nodeTypes = {
  autoFritzing: AutoFritzingNode,
};

export const Workspace2D = () => {
  const components = useCircuitStore((state) => state.components);
  const globalEdges = useCircuitStore((state) => state.edges);
  const setGlobalEdges = useCircuitStore((state) => state.setEdges);
  const setSelectedComponent = useCircuitStore((state) => state.setSelectedComponent);
  const setSelectedEdge = useCircuitStore((state) => state.setSelectedEdge);
  const addComponent = useCircuitStore((state) => state.addComponent);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null)

  // 1. Sync React Flow nodes with Zustand components using the Dictionary
  useEffect(() => {
    const mappedNodes = components.map((comp) => {
      // Look up the component properties dynamically
      const def = COMPONENT_LIBRARY[comp.type];
      
      return {
        id: comp.id,
        type: 'autoFritzing',
        position: { x: comp.x, y: comp.y },
        data: { 
          svgPath: def?.svgPath || '', 
          width: def?.width || '100px'
        }
      };
    });
    setNodes(mappedNodes);
  }, [components, setNodes]);

  // 2. Sync global edges down to React Flow's local memory automatically
  useEffect(() => {
    setEdges(globalEdges);
  }, [globalEdges, setEdges]);

  // 3. Handle new wire connections
  const onConnect = (params: any) => {
    const newEdges = addEdge(params, edges);
    setEdges(newEdges);
    setGlobalEdges(newEdges); // Push the new connection to global memory so the SPICE engine sees it
  };

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      if (!type || !reactFlowInstance) return;

      // Convert standard screen pixels into React Flow's zoomable grid coordinates
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      // Inject it into your global memory
      addComponent(type as any, position.x, position.y);
    },
    [reactFlowInstance, addComponent]
  );

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        defaultEdgeOptions={{ 
          type: 'straight', // <-- Forces straight angular wires
          style: { strokeWidth: 1.5, stroke: '#b1b1b7' } 
        }}
        onNodeClick={(_, node) => setSelectedComponent(node.id)}
        onEdgeClick={(_, edge) => setSelectedEdge(edge.id)}
        onPaneClick={() => {
          setSelectedComponent(null);
          setSelectedEdge(null);
        }}
        onInit={setReactFlowInstance} 
        onDrop={onDrop}               
        onDragOver={onDragOver}       
        fitView
      >
        <Background gap={20} color="#333" />
        <Controls />
      </ReactFlow>
    </div>
  );
};