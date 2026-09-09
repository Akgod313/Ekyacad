import React from 'react';
import { SimulationHUD } from './components/SimulationHUD';
import { useCircuitStore } from './store/useCircuitStore';
import { Workspace2D } from './components/Workspace2D';

function App() {
  const addComponent = useCircuitStore((state) => state.addComponent);
  const isTopView = useCircuitStore((state) => state.isTopView);
  const toggleTopView = useCircuitStore((state) => state.toggleTopView);

  // 1. Configure the HTML drag start from the sidebar
  const handleDragStart = (e: React.DragEvent, type: string) => {
    e.dataTransfer.setData('componentType', type);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const isSimulating = useCircuitStore((state) => state.isSimulating);
  const toggleSimulation = useCircuitStore((state) => state.toggleSimulation);

  // 2. Handle dropping the component onto the Canvas area
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('componentType') as 'Battery' | 'Resistor' | 'Arduino';
    if (!type) return;

    // Simply pass the Type and the Mouse Coordinates to Zustand!
    addComponent(type, e.clientX, e.clientY);
  };

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh' }}>
      
      {/* Sidebar: Component Library */}
      <div style={{ 
        width: '280px', 
        backgroundColor: '#1e1e1e', 
        borderRight: '1px solid #333',
        padding: '20px',
        display: 'flex', 
        flexDirection: 'column', 
        gap: '15px',
        color: '#eee',
        zIndex: 20 // Keeps sidebar above the canvas
      }}>
        <h2>Ekyacad</h2>
        <hr style={{ borderColor: '#333', width: '100%' }} />
        
        <button 
          onClick={toggleTopView}
          style={{ padding: '10px', cursor: 'pointer', backgroundColor: isTopView ? '#4CAF50' : '#333', color: 'white', border: 'none', borderRadius: '4px' }}
        >
          {isTopView ? 'Unlock 3D View' : 'Lock to Top View'}
        </button>

        <button 
          onClick={toggleSimulation}
          style={{ 
            padding: '12px', cursor: 'pointer', fontWeight: 'bold', border: 'none', borderRadius: '4px',
            backgroundColor: isSimulating ? '#f44336' : '#2196F3', // Red if running, Blue if stopped
            color: 'white',
          }}
        >
          {isSimulating ? '⏹ Stop Simulation' : '▶ Run Simulation'}
        </button>
        {/* ------------------------------- */}

        <h3>Components</h3>
        <p style={{ fontSize: '12px', color: '#aaa', marginTop: '-10px' }}>(Drag onto grid)</p>
        
        {/* Draggable DOM elements */}
        <div 
          draggable 
          onDragStart={(e) => handleDragStart(e, 'Resistor')}
          style={{ padding: '10px', backgroundColor: '#333', cursor: 'grab', borderRadius: '4px' }}
        >
          Resistor (1kΩ)
        </div>
        
        <div 
          draggable 
          onDragStart={(e) => handleDragStart(e, 'Battery')}
          style={{ padding: '10px', backgroundColor: '#333', cursor: 'grab', borderRadius: '4px' }}
        >
          Battery (9V)
        </div>
        <div 
          draggable 
          onDragStart={(e) => handleDragStart(e, 'Arduino')}
          style={{ padding: '10px', backgroundColor: '#333', cursor: 'grab', borderRadius: '4px' }}
        >
          Arduino
        </div>
      </div>

      {/* Main Viewport: Canvas & HUD Drop Zone */}
      <div 
        style={{ flex: 1, position: 'relative' }}
        onDragOver={(e) => e.preventDefault()} // Required to allow the drop event
        onDrop={handleDrop}
      >
        <Workspace2D />
        <SimulationHUD />
      </div>
      
    </div>
  );
}

export default App;