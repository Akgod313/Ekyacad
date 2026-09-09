import { create } from 'zustand';
import { translateFlowToNetlist } from '../engine/netlistTranslator';

export interface CircuitComponent {
  id: string;
  type: 'Battery' | 'Resistor' | 'Arduino';
  x: number;
  y: number;
}

interface CircuitState {
  components: CircuitComponent[];
  edges: any[];
  netlist: any[];
  isTopView: boolean;
  isSimulating: boolean; // <--- NEW
  addComponent: (type: 'Battery' | 'Resistor' | 'Arduino', x: number, y: number) => void;
  setEdges: (edges: any[]) => void;
  runSimulation: (nodes: any[]) => void;
  toggleTopView: () => void;
  toggleSimulation: () => void; // <--- NEW
}

export const useCircuitStore = create<CircuitState>((set, get) => ({
  components: [],
  edges: [],
  netlist: [],
  isTopView: true,
  isSimulating: false, // Starts turned off
  
  addComponent: (type, x, y) => {
    const newComp: CircuitComponent = {
      id: `${type}${Math.floor(Math.random() * 1000)}`,
      type,
      x,
      y,
    };
    set((state) => ({ components: [...state.components, newComp] }));
  },

  setEdges: (edges) => {
    set({ edges });
    const state = get();
    const mockNodes = state.components.map(c => ({
      id: c.id,
      data: { svgPath: c.type === 'Resistor' ? 'resistor' : 'Battery' }
    }));
    const netlist = translateFlowToNetlist(mockNodes, edges);
    set({ netlist });
  },

  runSimulation: (nodes) => {
    const state = get();
    const netlist = translateFlowToNetlist(nodes, state.edges);
    set({ netlist });
  },

  toggleTopView: () => set((state) => ({ isTopView: !state.isTopView })),
  
  // Flips the simulation on or off
  toggleSimulation: () => set((state) => ({ isSimulating: !state.isSimulating })),
}));