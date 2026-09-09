import React, { useEffect, useState } from 'react';
import { useCircuitStore } from '../store/useCircuitStore';
import { circuitEngine } from '../engine/EngineAdapter';

export const SimulationHUD = () => {
  const components = useCircuitStore((state) => state.components);
  const isSimulating = useCircuitStore((state) => state.isSimulating);
  const [voltages, setVoltages] = useState<Record<string, number>>({});

  useEffect(() => {
    let animationFrameId: number;

    const updateHUD = () => {
      // If we clicked stop, completely freeze the update loop
      if (!isSimulating) return;

      const newVoltages: Record<string, number> = {};

      components.forEach((comp) => {
        const uiPins = comp.type === 'Battery' ? ['+', '-'] : 
                       comp.type === 'Resistor' ? ['p1', 'p2'] : 
                       ['5V', 'GND', 'D13'];

        uiPins.forEach((pinId) => {
          const key = `${comp.id}:${pinId}`;
          newVoltages[key] = circuitEngine.getVoltage(comp.type, comp.id, pinId);
        });
      });

      setVoltages(newVoltages);
      animationFrameId = requestAnimationFrame(updateHUD);
    };

    // The Master Control Logic
    if (isSimulating) {
      circuitEngine.start(); // Boot up the SPICE engine
      animationFrameId = requestAnimationFrame(updateHUD); // Start polling voltages
    } else {
      circuitEngine.stop(); // Kill the SPICE engine
      setVoltages({}); // Clear the live readouts visually to show it's off
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
      circuitEngine.stop();
    };
  }, [components, isSimulating]);

  return (
    <div style={{
      position: 'absolute', top: 20, right: 20,
      background: 'rgba(0, 0, 0, 0.85)', color: 'white',
      padding: '15px', borderRadius: '8px',
      border: '1px solid #444', zIndex: 100, minWidth: '200px'
    }}>
      <h3 style={{ margin: '0 0 10px 0', borderBottom: '1px solid #555', paddingBottom: '5px' }}>
        Live Voltages {isSimulating ? '🟢' : '🔴'}
      </h3>
      
      {components.length === 0 ? (
        <div style={{ color: '#aaa', fontStyle: 'italic' }}>No components placed.</div>
      ) : !isSimulating ? (
        <div style={{ color: '#aaa', fontStyle: 'italic' }}>Simulation Paused</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          {Object.entries(voltages).map(([key, volt]) => (
            <div key={key} style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{key}</span>
              <span style={{ color: 'lime', fontFamily: 'monospace' }}>
                {volt.toFixed(2)}V
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};