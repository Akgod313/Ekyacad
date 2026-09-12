import { create } from 'zustand';
import { translateFlowToNetlist } from '../engine/netlistTranslator';
import { COMPONENT_LIBRARY } from '../library/components';
import { supabase } from '../lib/supabase';

export interface CircuitComponent {
  id: string;
  type: string;
  x: number;
  y: number;
  params?: Record<string, number>;
}

export interface SavedCircuit {
  id: string;
  name: string;
  lastEdited: string;
  components: CircuitComponent[];
  edges: any[];
}

interface CircuitState {
  // Canvas & Physics State
  components: CircuitComponent[];
  edges: any[];
  netlist: any[];
  nodeVoltages: Record<string, number>;
  
  isTopView: boolean;
  isSimulating: boolean;
  selectedComponentId: string | null;
  selectedEdgeId: string | null;
  isDarkMode: boolean;

  

  // App Routing & Dashboard State
  currentView: 'landing' | 'auth' | 'dashboard' | 'editor';
  savedCircuits: SavedCircuit[];
  activeCircuitId: string | null;
  activeCircuitName: string;
  isLoading: boolean;
  isSaving: boolean; 
  
  // Canvas Actions
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

  // DB & Routing Actions
  setView: (view: 'landing' | 'auth' | 'dashboard' | 'editor') => void;
  fetchCircuits: (userId: string) => Promise<void>;
  createNewCircuit: (name: string, userId: string) => Promise<void>;
  loadCircuit: (id: string) => void;
  saveActiveCircuit: (userId: string) => Promise<void>;
  exitToDashboard: (userId: string) => Promise<void>;
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

  currentView: 'landing',
  savedCircuits: [],
  activeCircuitId: null,
  activeCircuitName: 'Untitled Circuit',
  isLoading: false,
  isSaving: false,

  setView: (view) => set({ currentView: view }),

  fetchCircuits: async (userId) => {
    set({ isLoading: true });
    const { data, error } = await supabase
      .from('circuits')
      .select('*')
      .eq('user_id', userId)
      .order('last_edited', { ascending: false });

    if (!error && data) {
      const formattedCircuits = data.map(c => ({
        id: c.id,
        name: c.name,
        components: c.components || [],
        edges: c.edges || [],
        lastEdited: new Date(c.last_edited).toLocaleDateString()
      }));
      set({ savedCircuits: formattedCircuits });
    }
    set({ isLoading: false });
  },

  createNewCircuit: async (name, userId) => {
    const { data, error } = await supabase
      .from('circuits')
      .insert([{ user_id: userId, name: name, components: [], edges: [] }])
      .select()
      .single();

    if (error) {
      console.error("Supabase Error Creating Circuit:", error.message);
      return; // Stop execution if there is an error
    }

    if (data) {
      set({
        currentView: 'editor',
        activeCircuitId: data.id,
        activeCircuitName: data.name,
        components: [], 
        edges: [],
        nodeVoltages: {},
        netlist: []
      });
    }
  },

  loadCircuit: (id) => {
    const state = get();
    const circuit = state.savedCircuits.find(c => c.id === id);
    if (circuit) {
      set({
        currentView: 'editor',
        activeCircuitId: circuit.id,
        activeCircuitName: circuit.name,
        components: circuit.components,
        edges: circuit.edges,
        nodeVoltages: {},
        netlist: [] 
      });
    }
  },

  saveActiveCircuit: async (userId) => {
    const state = get();
    if (!state.activeCircuitId) return;

    set({ isSaving: true }); // Start saving

    await supabase
      .from('circuits')
      .update({
        components: state.components,
        edges: state.edges,
        last_edited: new Date().toISOString()
      })
      .eq('id', state.activeCircuitId)
      .eq('user_id', userId);

    // Add a tiny artificial delay so the user can actually see the "Saving..." text 
    // blink before it disappears, which provides better UX confirmation.
    setTimeout(() => set({ isSaving: false }), 600);
  },

  exitToDashboard: async (userId) => {
    const state = get();
    if (state.activeCircuitId) {
      await state.saveActiveCircuit(userId);
    }
    set({ currentView: 'dashboard', activeCircuitId: null, components: [], edges: [] });
    await state.fetchCircuits(userId);
  },

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
    const mockNodes = state.components.map(c => {
      const def = COMPONENT_LIBRARY[c.type];
      return { id: c.id, type: c.type, data: { svgPath: def?.svgPath || '' } };
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
  setSelectedComponent: (id) => set({ selectedComponentId: id, selectedEdgeId: null }),
  setSelectedEdge: (id) => set({ selectedEdgeId: id, selectedComponentId: null }),
  
  updateEdgeColor: (id, color) => set((state) => ({
    edges: state.edges.map(edge => 
      edge.id === id ? { ...edge, style: { ...edge.style, stroke: color, strokeWidth: 1.5 } } : edge
    )
  })),

  updateComponentValue: (id, key, value) => {
    set((state) => ({
      components: state.components.map(comp => 
        comp.id === id ? { ...comp, params: { ...comp.params, [key]: value } } : comp
      )
    }));
    const state = get();
    const mockNodes = state.components.map(c => {
      const def = COMPONENT_LIBRARY[c.type];
      return { id: c.id, type: c.type, data: { svgPath: def?.svgPath || '' } };
    });
    const netlist = translateFlowToNetlist(mockNodes, state.edges);
    set({ netlist });
  },
  
  toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),

  setNodeVoltages: (rawVoltages) => {
    const voltageValues = Object.values(rawVoltages);
    if (voltageValues.length === 0) {
      set({ nodeVoltages: {} });
      return;
    }
    const minVoltage = Math.min(...voltageValues);
    const normalizedVoltages: Record<string, number> = {};
    for (const [node, voltage] of Object.entries(rawVoltages)) {
      normalizedVoltages[node] = voltage - minVoltage;
    }
    set({ nodeVoltages: normalizedVoltages });
  }
}));