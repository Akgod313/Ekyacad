import React, { useState } from 'react';
import { Workspace2D } from './components/Workspace2D';
import { SimulationHUD } from './components/SimulationHUD';
import { PropertiesPanel } from './components/PropertiesPanel';
import { COMPONENT_LIBRARY } from './library/components';
import { useCircuitStore } from './store/useCircuitStore';
import { CursorGlow } from './components/CursorGlow';

import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';

import { SignedIn, SignedOut, useUser, UserButton } from '@clerk/clerk-react';

const Editor = () => {
  const toggleSimulation = useCircuitStore((state) => state.toggleSimulation);
  const isSimulating = useCircuitStore((state) => state.isSimulating);
  const isDarkMode = useCircuitStore((state) => state.isDarkMode);
  const toggleDarkMode = useCircuitStore((state) => state.toggleDarkMode);
  const activeCircuitName = useCircuitStore((state) => state.activeCircuitName);
  const exitToDashboard = useCircuitStore((state) => state.exitToDashboard);
  const saveActiveCircuit = useCircuitStore((state) => state.saveActiveCircuit);
  const isSaving = useCircuitStore((state) => state.isSaving);
  const [searchTerm, setSearchTerm] = useState('');
  
  const { user } = useUser();

  const handleDragStart = (e: React.DragEvent, type: string) => {
    e.dataTransfer.setData('application/reactflow', type);
    e.dataTransfer.effectAllowed = 'move';
  };

  const filteredComponents = Object.values(COMPONENT_LIBRARY).filter(comp => 
    comp.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Updated vibrant dark-glass theme palette
  const theme = {
    bg: isDarkMode ? '#0a0a0a' : '#f8fafc',
    panelBg: isDarkMode ? 'rgba(15, 15, 15, 0.8)' : 'rgba(255, 255, 255, 0.8)',
    sidebarBg: isDarkMode ? 'rgba(20, 20, 20, 0.5)' : 'rgba(250, 250, 250, 0.5)',
    border: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
    text: isDarkMode ? '#fafafa' : '#0f172a',
    textMuted: isDarkMode ? '#a1a1aa' : '#64748b',
    cardBg: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
    cardBorder: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
    inputBg: isDarkMode ? 'rgba(0,0,0,0.5)' : '#ffffff',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: theme.bg, color: theme.text, fontFamily: '"Inter", sans-serif', position: 'relative', overflow: 'hidden' }}>
      
      {/* Background ambient cursor glow */}
      <CursorGlow />

      {/* GLASS HEADER */}
      <header style={{ height: '64px', borderBottom: `1px solid ${theme.border}`, backgroundColor: theme.panelBg, backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', zIndex: 10 }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button 
            onClick={() => user && exitToDashboard(user.id)} 
            style={{ background: 'transparent', color: theme.textMuted, border: 'none', cursor: 'pointer', fontSize: '14px', padding: '8px 0', fontWeight: '500', transition: 'color 0.2s ease' }}
            onMouseOver={(e) => e.currentTarget.style.color = theme.text}
            onMouseOut={(e) => e.currentTarget.style.color = theme.textMuted}
          >
            ← Back to Dashboard
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderLeft: `1px solid ${theme.border}`, paddingLeft: '15px' }}>
            <span style={{ fontSize: '16px', fontWeight: '700', letterSpacing: '-0.5px' }}>{activeCircuitName}</span>
            {isSaving ? (
              <span style={{ fontSize: '12px', color: '#a1a1aa', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#3b82f6', animation: 'pulse 1s infinite' }} />
                Saving...
              </span>
            ) : (
              <span style={{ fontSize: '12px', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '4px' }}>
                ✓ Saved to cloud
              </span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button 
            onClick={toggleDarkMode} 
            style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.05)', color: theme.text, border: `1px solid ${theme.border}`, borderRadius: '6px', cursor: 'pointer', fontSize: '13px', backdropFilter: 'blur(10px)' }}
          >
            {isDarkMode ? '☀️ Light' : '🌙 Dark'}
          </button>
          
          <button 
            onClick={() => user && saveActiveCircuit(user.id)} 
            style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.05)', color: theme.text, border: `1px solid ${theme.border}`, borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', backdropFilter: 'blur(10px)' }}
          >
            Save
          </button>

          <button 
            onClick={toggleSimulation} 
            style={{ padding: '8px 20px', background: isSimulating ? 'rgba(220, 38, 38, 0.1)' : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', color: isSimulating ? '#ef4444' : '#fff', border: isSimulating ? '1px solid rgba(220, 38, 38, 0.3)' : '1px solid #3b82f6', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', boxShadow: isSimulating ? 'none' : '0 0 15px rgba(37, 99, 235, 0.3)' }}
          >
            {isSimulating ? '■ Stop Simulation' : '▶ Start Simulation'}
          </button>
          <div style={{ marginLeft: '8px' }}>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', zIndex: 5 }}>
        
        <main style={{ flex: 1, position: 'relative' }}>
          <Workspace2D />
          <SimulationHUD />
          <PropertiesPanel />
        </main>

        {/* GLASS SIDEBAR */}
        <aside style={{ width: '320px', backgroundColor: theme.sidebarBg, backdropFilter: 'blur(12px)', borderLeft: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '20px', borderBottom: `1px solid ${theme.border}` }}>
            <input 
              type="text" 
              placeholder="Search components..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: `1px solid ${theme.border}`, backgroundColor: theme.inputBg, color: theme.text, boxSizing: 'border-box', outline: 'none', transition: 'border-color 0.2s ease', fontSize: '13px' }}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = theme.border}
            />
          </div>

          <div style={{ padding: '20px', overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
            {filteredComponents.map((compDef) => (
              <div 
                key={compDef.type} 
                draggable 
                onDragStart={(e) => handleDragStart(e, compDef.type)} 
                style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, borderRadius: '10px', padding: '16px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'grab', transition: 'all 0.2s ease' }}
                onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = theme.cardBg; e.currentTarget.style.borderColor = theme.cardBorder; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <div style={{ height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                  <img src={compDef.svgPath} alt={compDef.label} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                </div>
                <span style={{ fontSize: '12px', textAlign: 'center', color: theme.textMuted, fontWeight: '500' }}>{compDef.label}</span>
              </div>
            ))}
            
            {filteredComponents.length === 0 && (
              <div style={{ gridColumn: 'span 2', textAlign: 'center', color: theme.textMuted, padding: '20px', fontSize: '13px' }}>
                No components found.
              </div>
            )}
          </div>
        </aside>

      </div>
    </div>
  );
};

export default function App() {
  const currentView = useCircuitStore(state => state.currentView);

  if (currentView === 'editor') {
    return <Editor />;
  }

  return (
    <>
      <SignedIn>
        <DashboardPage />
      </SignedIn>
      
      <SignedOut>
        {currentView === 'auth' ? <AuthPage /> : <LandingPage />}
      </SignedOut>
    </>
  );
}