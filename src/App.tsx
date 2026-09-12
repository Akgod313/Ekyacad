import React, { useState } from 'react';
import { Workspace2D } from './components/Workspace2D';
import { SimulationHUD } from './components/SimulationHUD';
import { PropertiesPanel } from './components/PropertiesPanel';
import { COMPONENT_LIBRARY } from './library/components';
import { useCircuitStore } from './store/useCircuitStore';

export default function App() {
  const toggleSimulation = useCircuitStore((state) => state.toggleSimulation);
  const isSimulating = useCircuitStore((state) => state.isSimulating);
  const isDarkMode = useCircuitStore((state) => state.isDarkMode);
  const toggleDarkMode = useCircuitStore((state) => state.toggleDarkMode);
  const [searchTerm, setSearchTerm] = useState('');

  const handleDragStart = (e: React.DragEvent, type: string) => {
    e.dataTransfer.setData('application/reactflow', type);
    e.dataTransfer.effectAllowed = 'move';
  };

  const filteredComponents = Object.values(COMPONENT_LIBRARY).filter(comp => 
    comp.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Dynamic color palette based on the current theme
  const theme = {
    bg: isDarkMode ? '#1e1e1e' : '#f8fafc',
    panelBg: isDarkMode ? '#252526' : '#ffffff',
    border: isDarkMode ? '#333' : '#e2e8f0',
    text: isDarkMode ? '#eee' : '#0f172a',
    textMuted: isDarkMode ? '#aaa' : '#64748b',
    cardBg: isDarkMode ? '#333' : '#f1f5f9',
    cardBorder: isDarkMode ? '#444' : '#cbd5e1',
    inputBg: isDarkMode ? '#1e1e1e' : '#ffffff',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: theme.bg, color: theme.text, fontFamily: '"Inter", sans-serif' }}>
      {/* TOP NAVBAR */}
      <header style={{ 
        height: '60px', 
        borderBottom: `1px solid ${theme.border}`, 
        backgroundColor: theme.panelBg,
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        padding: '0 20px' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ display: 'flex', gap: '4px' }}>
            <div style={{ width: '15px', height: '15px', background: '#e11d48', borderRadius: '2px' }} />
            <div style={{ width: '15px', height: '15px', background: '#2563eb', borderRadius: '2px' }} />
            <div style={{ width: '15px', height: '15px', background: '#16a34a', borderRadius: '2px' }} />
            <div style={{ width: '15px', height: '15px', background: '#ca8a04', borderRadius: '2px' }} />
          </div>
          <span style={{ fontSize: '18px', fontWeight: 'bold' }}>My Awesome Circuit</span>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button 
            onClick={toggleDarkMode}
            style={{ padding: '8px 12px', background: 'transparent', color: theme.text, border: `1px solid ${theme.border}`, borderRadius: '4px', cursor: 'pointer' }}
          >
            {isDarkMode ? '☀️ Light' : '🌙 Dark'}
          </button>
          <button style={{ padding: '8px 16px', background: theme.cardBg, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: '4px', cursor: 'pointer' }}>
            {'</> Code'}
          </button>
          <button
            onClick={toggleSimulation}
            style={{ 
              padding: '8px 16px', 
              background: isSimulating ? '#16a34a' : '#2563eb', 
              color: '#fff', 
              border: 'none', 
              borderRadius: '4px', 
              fontWeight: 'bold', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {isSimulating ? '■ Stop Simulation' : '▶ Start Simulation'}
          </button>
        </div>
      </header>

      {/* MAIN LAYOUT */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <main style={{ flex: 1, position: 'relative' }}>
          <Workspace2D />
          <SimulationHUD />
          <PropertiesPanel />
        </main>

        {/* SIDEBAR */}
        <aside style={{ 
          width: '320px', 
          backgroundColor: theme.panelBg, 
          borderLeft: `1px solid ${theme.border}`, 
          display: 'flex', 
          flexDirection: 'column' 
        }}>
          <div style={{ padding: '15px', borderBottom: `1px solid ${theme.border}` }}>
            <input
              type="text"
              placeholder="Search components..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '10px', 
                borderRadius: '4px', 
                border: `1px solid ${theme.border}`, 
                backgroundColor: theme.inputBg, 
                color: theme.text, 
                boxSizing: 'border-box' 
              }}
            />
          </div>

          <div style={{ 
            padding: '15px', 
            overflowY: 'auto', 
            display: 'grid', 
            gridTemplateColumns: 'repeat(2, 1fr)', 
            gap: '12px' 
          }}>
            {filteredComponents.map((compDef) => (
              <div
                key={compDef.type}
                draggable
                onDragStart={(e) => handleDragStart(e, compDef.type)}
                style={{ 
                  background: theme.cardBg, 
                  border: `1px solid ${theme.cardBorder}`, 
                  borderRadius: '6px', 
                  padding: '15px 10px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  cursor: 'grab'
                }}
              >
                <div style={{ height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
                  <img 
                    src={compDef.svgPath} 
                    alt={compDef.label} 
                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} 
                  />
                </div>
                <span style={{ fontSize: '12px', textAlign: 'center', color: theme.textMuted }}>
                  {compDef.label}
                </span>
              </div>
            ))}
            
            {filteredComponents.length === 0 && (
              <div style={{ gridColumn: 'span 2', textAlign: 'center', color: theme.textMuted, padding: '20px' }}>
                No components found.
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}