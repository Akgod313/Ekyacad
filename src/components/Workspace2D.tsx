import React, { useCallback, useEffect } from 'react';
import ReactFlow, { Background, Controls, addEdge, useNodesState, useEdgesState } from 'reactflow';
import 'reactflow/dist/style.css';
import { AutoFritzingNode } from './nodes/AutoFritzingNode';
import { useCircuitStore } from '../store/useCircuitStore';

const nodeTypes = {
  FritzingPart: AutoFritzingNode,
};

export const Workspace2D = () => {
  const components = useCircuitStore((state) => state.components);
  const setStoreEdges = useCircuitStore((state) => state.setEdges);
  const runSimulation = useCircuitStore((state) => state.runSimulation);
  
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    const flowNodes = components.map((comp, index) => {
      let svgPath = '';
      let width = '150px';

      if (comp.type === 'Battery') {
        svgPath = '/icons/breadboard/Battery_block_9V85_leg.svg';
        width = '100px';
      } else if (comp.type === 'Resistor') {
        svgPath = '/icons/breadboard/resistor_220.svg';
        width = '150px';
      } else if (comp.type === 'Arduino') {
        svgPath = '/icons/breadboard/arduino.svg';
        width = '300px';
      }

      return {
        id: comp.id,
        type: 'FritzingPart',
        position: { x: 100 + (index * 150), y: 100 + (index * 100) },
        data: { svgPath, width }
      };
    });

    setNodes(flowNodes);
  }, [components, setNodes]);

  const onConnect = useCallback((params: any) => {
    setEdges((eds) => {
      const updatedEdges = addEdge({ ...params, type: 'straight' }, eds);
      setStoreEdges(updatedEdges); 
      runSimulation(nodes);       
      return updatedEdges;
    });
  }, [setEdges, setStoreEdges, runSimulation, nodes]);

  return (
    <div style={{ width: '100%', height: '100vh', background: '#111' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background color="#333" gap={16} />
        <Controls />
      </ReactFlow>
    </div>
  );
};