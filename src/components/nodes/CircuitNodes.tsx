import React from 'react';
import { Handle, Position } from 'reactflow';

// Standard styling for our 2D components
const nodeStyle = {
  padding: '10px 20px',
  borderRadius: '8px',
  background: '#222',
  color: 'white',
  border: '2px solid #555',
  textAlign: 'center' as const,
  minWidth: '100px',
};

export const BatteryNode = ({ data }: any) => (
  <div style={nodeStyle}>
    {/* Positive Pin (Right) */}
    <Handle type="source" position={Position.Right} id="pos" style={{ background: 'red' }} />
    
    <div>9V Battery</div>
    <div style={{ fontSize: '10px', color: '#aaa' }}>{data.label}</div>
    
    {/* Negative Pin (Left) */}
    <Handle type="target" position={Position.Left} id="neg" style={{ background: 'black' }} />
  </div>
);

export const ResistorNode = ({ data }: any) => (
  <div style={nodeStyle}>
    {/* Pin 1 (Left) */}
    <Handle type="target" position={Position.Left} id="p1" style={{ background: 'gray' }} />
    
    <div>Resistor 1kΩ</div>
    <div style={{ fontSize: '10px', color: '#aaa' }}>{data.label}</div>
    
    {/* Pin 2 (Right) */}
    <Handle type="source" position={Position.Right} id="p2" style={{ background: 'gray' }} />
  </div>
);