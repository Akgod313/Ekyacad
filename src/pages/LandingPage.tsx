import React from 'react';
import { useCircuitStore } from '../store/useCircuitStore';
import { useAuth } from '@clerk/clerk-react';
import { CursorGlow } from '../components/CursorGlow';

export const LandingPage = () => {
  const setView = useCircuitStore(state => state.setView);
  const { isSignedIn } = useAuth();
  const theme = { bg: '#0a0a0a', text: '#fafafa', panelBg: 'rgba(15, 15, 15, 0.8)', primary: '#2563eb' };

  const handleCTA = () => {
    setView(isSignedIn ? 'dashboard' : 'auth');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: theme.bg, color: theme.text, position: 'relative', overflow: 'hidden' }}>
      <CursorGlow />
      
      <header style={{ padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: theme.panelBg, backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.05)', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
            <div style={{ width: '12px', height: '12px', background: '#e11d48', borderRadius: '2px' }} />
            <div style={{ width: '12px', height: '12px', background: '#2563eb', borderRadius: '2px' }} />
            <div style={{ width: '12px', height: '12px', background: '#16a34a', borderRadius: '2px' }} />
            <div style={{ width: '12px', height: '12px', background: '#ca8a04', borderRadius: '2px' }} />
          </div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '800', letterSpacing: '-0.5px' }}>Ekyacad</h1>
        </div>
        <button 
          onClick={handleCTA} 
          style={{ padding: '10px 24px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', transition: 'all 0.2s ease', backdropFilter: 'blur(10px)' }}
          onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
        >
          {isSignedIn ? 'Dashboard' : 'Login / Sign Up'}
        </button>
      </header>
      
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 20px', zIndex: 10 }}>
        <div style={{ display: 'inline-block', padding: '6px 16px', background: 'rgba(37, 99, 235, 0.1)', border: '1px solid rgba(37, 99, 235, 0.2)', borderRadius: '20px', color: '#60a5fa', fontSize: '14px', fontWeight: '600', marginBottom: '24px' }}>
          v1.0 is now live
        </div>
        
        <h2 style={{ fontSize: '64px', fontWeight: '800', marginBottom: '24px', letterSpacing: '-2px', lineHeight: '1.1', maxWidth: '800px', background: 'linear-gradient(135deg, #ffffff 0%, #a1a1aa 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Simulate Circuits in Your Browser.
        </h2>
        
        <p style={{ fontSize: '20px', color: '#a1a1aa', maxWidth: '600px', marginBottom: '48px', lineHeight: '1.6' }}>
          Build, test, and analyze electronic circuits instantly. Drag and drop components, wire them up, and watch the physics engine run in real-time.
        </p>
        
        <button 
          onClick={handleCTA} 
          style={{ padding: '18px 40px', fontSize: '18px', background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', color: 'white', border: '1px solid #3b82f6', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', boxShadow: '0 0 20px rgba(37, 99, 235, 0.4)', transition: 'transform 0.2s ease, box-shadow 0.2s ease' }}
          onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 0 30px rgba(37, 99, 235, 0.6)'; }}
          onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 0 20px rgba(37, 99, 235, 0.4)'; }}
        >
          {isSignedIn ? 'Go to Dashboard' : 'Start Building for Free'}
        </button>
      </main>
    </div>
  );
};