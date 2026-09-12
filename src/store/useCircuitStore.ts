import { create } from 'zustand';
import { translateFlowToNetlist } from '../engine/netlistTranslator';
import { COMPONENT_LIBRARY } from '../library/components';

export interface CircuitComponent {
  id: string;
  type: string; // Updated to string so it scales with the dictionary
  x: number;
  y: number;
  params?: Record<string, number>;
}

interface CircuitState {
  components: CircuitComponent[];
  edges: any[];
  netlist: any[];
  nodeVoltages: Record<string, number>; // Stores the normalized math for the HUD
  
  isTopView: boolean;
  isSimulating: boolean;
  selectedComponentId: string | null;
  selectedEdgeId: string | null;
  isDarkMode: boolean;
  
  addComponent: (type: string, x: number, y: number) => void;
  setEdges: (edges: any[]) => void;
  runSimulation: (nodes: any[]) => void;
  toggleTopView: () => void;
  toggleSimulation: () => void;
  setSelectedComponent: (id: string | null) => void;
  setSelectedEdge: (id: string | null) => void;
  updateComponentValue: (id: string, key: string, value: number) => void;
  updateEdgeColor: (id: string, color: string) => void;
  toggleDarkMode: () => void;
  setNodeVoltages: (rawVoltages: Record<string, number>) => void;
}

export const useCircuitStore = create<CircuitState>((set, get) => ({
  components: [],
  edges: [],
  netlist: [],
  nodeVoltages: {},
  
  isTopView: true,
  isSimulating: false,
  selectedComponentId: null,
  selectedEdgeId: null,
  isDarkMode: true,
  
  // Dynamically pull default values from the Component Library when adding
  addComponent: (type, x, y) => {
    const componentDef = COMPONENT_LIBRARY[type];
    const defaultParams = componentDef ? { ...componentDef.defaultParams } : {};

    const newComp: CircuitComponent = {
      id: `${type}${Math.floor(Math.random() * 1000)}`,
      type,
      x,
      y,
      params: defaultParams
    };
    set((state) => ({ components: [...state.components, newComp] }));
  },

  setEdges: (edges) => {
    set({ edges });
    const state = get();
    // Rebuild netlist mapping with dynamic SVGs
    const mockNodes = state.components.map(c => {
      const def = COMPONENT_LIBRARY[c.type];
      return {
        id: c.id,
        type: c.type,
        data: { svgPath: def?.svgPath || '' }
      };
    });
    const netlist = translateFlowToNetlist(mockNodes, edges);
    set({ netlist });
  },

  runSimulation: (nodes) => {
    const state = get();
    const netlist = translateFlowToNetlist(nodes, state.edges);
    set({ netlist });
  },

  toggleTopView: () => set((state) => ({ isTopView: !state.isTopView })),
  toggleSimulation: () => set((state) => ({ isSimulating: !state.isSimulating })),
  
  // Clicking one deselects the other
  setSelectedComponent: (id) => set({ selectedComponentId: id, selectedEdgeId: null }),
  setSelectedEdge: (id) => set({ selectedEdgeId: id, selectedComponentId: null }),
  
  // Thinner strokeWidth applied here
  updateEdgeColor: (id, color) => set((state) => ({
    edges: state.edges.map(edge => 
      edge.id === id 
        ? { ...edge, style: { ...edge.style, stroke: color, strokeWidth: 1.5 } }
        : edge
    )
  })),

  updateComponentValue: (id, key, value) => {
    // 1. Update the value
    set((state) => ({
      components: state.components.map(comp => 
        comp.id === id 
          ? { ...comp, params: { ...comp.params, [key]: value } }
          : comp
      )
    }));

    // 2. Rebuild the netlist instantly to update physics
    const state = get();
    const mockNodes = state.components.map(c => {
      const def = COMPONENT_LIBRARY[c.type];
      return {
        id: c.id,
        type: c.type,
        data: { svgPath: def?.svgPath || '' }
      };
    });
    
    const netlist = translateFlowToNetlist(mockNodes, state.edges);
    set({ netlist });
  },
  
  toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),

  // Auto-normalizer for the SPICE engine outputs
  setNodeVoltages: (rawVoltages) => {
    const voltageValues = Object.values(rawVoltages);
    if (voltageValues.length === 0) {
      set({ nodeVoltages: {} });
      return;
    }

    // Find the lowest floating voltage and shift it to exactly 0.00V
    const minVoltage = Math.min(...voltageValues);
    const normalizedVoltages: Record<string, number> = {};
    
    for (const [node, voltage] of Object.entries(rawVoltages)) {
      normalizedVoltages[node] = voltage - minVoltage;
    }
    
    set({ nodeVoltages: normalizedVoltages });
  }
}));