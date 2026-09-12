import React from 'react';
import { useCircuitStore } from '../store/useCircuitStore';
import { useEffect } from 'react'; // Add useEffect

export const PropertiesPanel = () => {
  const components = useCircuitStore((state) => state.components);
  const edges = useCircuitStore((state) => state.edges);
  const selectedComponentId = useCircuitStore((state) => state.selectedComponentId);
  const selectedEdgeId = useCircuitStore((state) => state.selectedEdgeId);
  const updateComponentValue = useCircuitStore((state) => state.updateComponentValue);
  const updateEdgeColor = useCircuitStore((state) => state.updateEdgeColor);

  const selectedComp = components.find(c => c.id === selectedComponentId);
  const selectedEdge = edges.find(e => e.id === selectedEdgeId);

  // If a wire is selected, show the color picker
  if (selectedEdge) {
    const presetColors = ['#ff4444', '#4444ff', '#44ff44', '#ffff44', '#ffffff', '#222222'];
    
    return (
      <div style={{
        position: 'absolute', top: 120, right: 20,
        background: 'rgba(30, 30, 30, 0.95)', color: 'white',
        padding: '15px', borderRadius: '8px',
        border: '1px solid #555', zIndex: 100, minWidth: '200px'
      }}>
        <h3 style={{ margin: '0 0 15px 0', borderBottom: '1px solid #555', paddingBottom: '5px' }}>
          Edit Wire
        </h3>
        
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
          {presetColors.map(color => (
            <div 
              key={color}
              onClick={() => updateEdgeColor(selectedEdge.id, color)}
              style={{ width: '25px', height: '25px', backgroundColor: color, borderRadius: '50%', cursor: 'pointer', border: '1px solid #777' }}
            />
          ))}
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label style={{ fontSize: '12px', color: '#aaa' }}>Custom Color</label>
          <input 
            type="color" 
            value={selectedEdge.style?.stroke || '#b1b1b7'}
            onChange={(e) => updateEdgeColor(selectedEdge.id, e.target.value)}
            style={{ width: '100%', height: '30px', cursor: 'pointer', background: 'none', border: 'none' }}
          />
        </div>
      </div>
    );
  }

  // Otherwise, handle component properties just like before
  if (!selectedComp || selectedComp.type === 'Arduino') return null;

  const handleChange = (key: string, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) updateComponentValue(selectedComp.id, key, numValue);
  };

  return (
    <div style={{
      position: 'absolute', top: 120, right: 20,
      background: 'rgba(30, 30, 30, 0.95)', color: 'white',
      padding: '15px', borderRadius: '8px',
      border: '1px solid #555', zIndex: 100, minWidth: '200px'
    }}>
      <h3 style={{ margin: '0 0 15px 0', borderBottom: '1px solid #555', paddingBottom: '5px' }}>
        Edit {selectedComp.type}
      </h3>
      {selectedComp.type === 'Resistor' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label style={{ fontSize: '12px', color: '#aaa' }}>Resistance (Ω)</label>
          <input 
            type="number" 
            value={selectedComp.params?.resistance || 1000}
            onChange={(e) => handleChange('resistance', e.target.value)}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #444', background: '#111', color: '#fff' }}
          />
        </div>
      )}
      {selectedComp.type === 'Battery' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label style={{ fontSize: '12px', color: '#aaa' }}>Voltage (V)</label>
          <input 
            type="number" 
            value={selectedComp.params?.voltage || 9}
            onChange={(e) => handleChange('voltage', e.target.value)}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #444', background: '#111', color: '#fff' }}
          />
        </div>
      )}
    </div>
  );
};