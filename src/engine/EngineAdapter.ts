import { CircuitEngine } from './core/sim.js';
import { useCircuitStore } from '../store/useCircuitStore';

// Translation dictionaries to bridge your UI names with the strict SPICE engine names
const uiToEnginePin: Record<string, Record<string, string>> = {
  'Battery': { 'pos': '+', 'neg': '-', '+': '+', '-': '-' },
  'Resistor': { 'p1': '1', 'p2': '2', '1': '1', '2': '2' },
  'Arduino': { '5V': '+', 'GND': '-', 'D13': 'D13' },
  'LED': { 'anode': '1', 'cathode': '2', '1': '1', '2': '2', 'pin1': '1', 'pin2': '2' } // Catch-all for LED pins
};

export class EngineAdapter {
  private engine: any;
  private virtualScene = { parts: new Map(), wires: [] as any[] };
  private animationFrameId: number | null = null;

  constructor() {
    this.engine = new CircuitEngine(this.virtualScene);
  }

  public syncStateAndStep() {
    const { components, edges } = useCircuitStore.getState();

    this.virtualScene.parts.clear();
    this.virtualScene.wires = [];

    // Map Zustand components into the SPICE engine
    components.forEach(comp => {
      const terminals: any = {};
      
      const uiPins = comp.type === 'Battery' ? ['+', '-'] : 
                     comp.type === 'Resistor' ? ['p1', 'p2'] : 
                     ['5V', 'GND', 'D13'];
      
      uiPins.forEach(pinId => {
        const enginePinId = uiToEnginePin[comp.type]?.[pinId] || pinId;
        terminals[enginePinId] = { userData: {} };
      });

      const params: any = {};
      let engineType = String(comp.type || 'unknown').toLowerCase();

      if (comp.type === 'Resistor') {
        params.resistance = comp.params?.resistance || 1000;
      }
      if (comp.type === 'Battery') {
        params.voltage = comp.params?.voltage || 9;
      }
      if (comp.type === 'Arduino') {
        engineType = 'battery'; 
        params.voltage = 5;     
      }
      if (comp.type === 'LED') {
        engineType = 'resistor'; // Trick SPICE so current flows through it
        params.resistance = 10;  // Tiny resistance so it doesn't block power
      }

      this.virtualScene.parts.set(comp.id, {
        userData: {
          id: comp.id,
          type: engineType, 
          params,
          terminals,
          visual: {} 
        }
      });
    });

    // Map React Flow edges into SPICE wires
    edges.forEach(edge => {
      const fromComp = components.find(c => c.id === edge.source);
      const toComp = components.find(c => c.id === edge.target);

      if (fromComp && toComp && edge.sourceHandle && edge.targetHandle) {
        const rawStartPin = edge.sourceHandle.replace(/-[st]$/, '');
        const rawEndPin = edge.targetHandle.replace(/-[st]$/, '');

        const engineStartPin = uiToEnginePin[fromComp.type]?.[rawStartPin] || rawStartPin;
        const engineEndPin = uiToEnginePin[toComp.type]?.[rawEndPin] || rawEndPin;

        this.virtualScene.wires.push({
          from: { partId: fromComp.id, terminal: engineStartPin },
          to: { partId: toComp.id, terminal: engineEndPin }
        });
      }
    });

    // Run the SPICE math step
    try {
      this.engine.step(1 / 60);
    } catch (error) {
      console.error("SPICE Engine Error:", error);
    }
  }

  public getVoltage(compType: string, partId: string, uiPinId: string): number {
    const enginePinId = uiToEnginePin[compType]?.[uiPinId] || uiPinId;
    return this.engine.getPinVoltage(partId, enginePinId) || 0;
  }

  public start() {
    if (this.animationFrameId) return;
    
    const loop = () => {
      this.syncStateAndStep();
      this.animationFrameId = requestAnimationFrame(loop);
    };
    loop();
  }

  public stop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
}

export const circuitEngine = new EngineAdapter();