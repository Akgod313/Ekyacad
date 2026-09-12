import React, { useState, useEffect } from 'react';
import { useCircuitStore } from '../store/useCircuitStore';
import { CursorGlow } from '../components/CursorGlow';
import { useUser } from '@clerk/clerk-react'; // <-- Import useUser

export const DashboardPage = () => {
  const { user } = useUser();
  const savedCircuits = useCircuitStore(state => state.savedCircuits);
  const fetchCircuits = useCircuitStore(state => state.fetchCircuits);
  const loadCircuit = useCircuitStore(state => state.loadCircuit);
  const createNewCircuit = useCircuitStore(state => state.createNewCircuit);
  
  const [showModal, setShowModal] = useState(false);
  const [newCircuitName, setNewCircuitName] = useState('');

  // Fetch circuits when the dashboard mounts
  useEffect(() => {
    if (user) fetchCircuits(user.id);
  }, [user, fetchCircuits]);

  const handleCreate = () => {
    if (newCircuitName.trim() && user) {
      createNewCircuit(newCircuitName, user.id);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', color: '#fafafa', position: 'relative' }}>
      <CursorGlow />
      
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '60px 40px', position: 'relative', zIndex: 10 }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '48px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '24px' }}>
          <div>
            <h1 style={{ margin: '0 0 8px 0', fontSize: '32px', fontWeight: '800', letterSpacing: '-1px' }}>My Circuits</h1>
            <p style={{ margin: 0, color: '#a1a1aa' }}>Manage and edit your saved workspaces.</p>
          </div>
          <button 
            onClick={() => setShowModal(true)} 
            style={{ padding: '12px 24px', background: '#fafafa', color: '#0a0a0a', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '700', transition: 'transform 0.2s ease', display: 'flex', alignItems: 'center', gap: '8px' }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            + New Circuit
          </button>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
          {savedCircuits.map(circuit => (
            <div 
              key={circuit.id} 
              onClick={() => loadCircuit(circuit.id)} 
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '24px', cursor: 'pointer', transition: 'all 0.2s ease', backdropFilter: 'blur(10px)' }}
              onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
              onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(37, 99, 235, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <div style={{ width: '20px', height: '2px', background: '#3b82f6', borderRadius: '2px', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: '-4px', left: '-2px', width: '6px', height: '10px', background: '#60a5fa', borderRadius: '1px' }} />
                  <div style={{ position: 'absolute', top: '-4px', right: '-2px', width: '6px', height: '10px', background: '#60a5fa', borderRadius: '1px' }} />
                </div>
              </div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600' }}>{circuit.name}</h3>
              <p style={{ margin: 0, color: '#71717a', fontSize: '13px' }}>Last edited: {circuit.lastEdited}</p>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#121212', padding: '32px', borderRadius: '16px', width: '340px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
            <h3 style={{ margin: '0 0 24px 0', fontSize: '20px' }}>Name your circuit</h3>
            <input 
              autoFocus
              type="text" 
              placeholder="e.g. 555 Timer Project"
              value={newCircuitName}
              onChange={(e) => setNewCircuitName(e.target.value)}
              style={{ width: '100%', padding: '12px 16px', marginBottom: '24px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.5)', color: 'white', boxSizing: 'border-box', outline: 'none', transition: 'border-color 0.2s ease' }}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button onClick={() => setShowModal(false)} style={{ padding: '10px 16px', background: 'transparent', color: '#a1a1aa', border: 'none', cursor: 'pointer', fontWeight: '600' }}>Cancel</button>
              <button onClick={handleCreate} style={{ padding: '10px 20px', background: '#fafafa', color: '#0a0a0a', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '700' }}>Create Workspace</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};