// src/engine/SpiceEngine.ts
import { create, all } from 'mathjs';
import { type CircuitComponent, type Resistor, type Battery } from '../types/circuit';

// Initialize a local mathjs instance for performance
const math = create(all);

export interface SpiceNode {
  id: string; // The netId connecting multiple pins
  index: number; // The matrix row/column index
  voltage: number;
}

export class SpiceEngine {
  private components: CircuitComponent[] = [];
  private nodes: Map<string, SpiceNode> = new Map();
  private groundId: string = 'GND';

  public loadCircuit(components: CircuitComponent[], wires: { netId: string }[]) {
    this.components = components;
    this.nodes.clear();
    
    // Node 0 is strictly Ground in SPICE MNA
    this.nodes.set(this.groundId, { id: this.groundId, index: 0, voltage: 0 });

    let currentIndex = 1;
    wires.forEach(wire => {
      if (!this.nodes.has(wire.netId)) {
        this.nodes.set(wire.netId, { id: wire.netId, index: currentIndex++, voltage: 0 });
      }
    });
  }

  public stepSimulation() {
    const nodeCount = this.nodes.size;
    if (nodeCount <= 1) return; // Only GND exists, nothing to solve

    // G-Matrix: Conductance (N x N)
    // I-Matrix: Current sources (N x 1)
    let G = math.zeros(nodeCount, nodeCount) as math.Matrix;
    let I = math.zeros(nodeCount, 1) as math.Matrix;

    // Track independent voltage sources (Batteries) for the extended MNA matrix
    let voltageSources: Battery[] = [];

    this.components.forEach(comp => {
      if (comp.type === 'Resistor') {
        this.applyResistor(comp as Resistor, G);
      } else if (comp.type === 'Battery') {
        voltageSources.push(comp as Battery);
      }
    });

    // Expand matrices for Voltage Sources (B, C, D matrices in standard MNA)
    const mnaSize = nodeCount + voltageSources.length;
    let MNA = math.zeros(mnaSize, mnaSize) as math.Matrix;
    let RHS = math.zeros(mnaSize, 1) as math.Matrix;

    // Copy G and I into the expanded MNA and RHS matrices
    MNA.subset(math.index(math.range(0, nodeCount), math.range(0, nodeCount)), G);
    RHS.subset(math.index(math.range(0, nodeCount), 0), I);

    // Apply Voltage Sources
    voltageSources.forEach((battery, index) => {
      this.applyVoltageSource(battery, MNA, RHS, nodeCount, index);
    });

    try {
      // math.lusolve is significantly faster and more stable than naive inversion
      const voltages = math.lusolve(MNA, RHS) as math.Matrix;
      
      // Map solved voltages back to our nodes
      this.nodes.forEach(node => {
        if (node.index > 0) {
          node.voltage = voltages.get([node.index, 0]);
        }
      });
    } catch (error) {
      console.warn("Singular matrix: Circuit is likely open or shorted.", error);
    }
  }

  private applyResistor(resistor: Resistor, G: math.Matrix) {
    const g = 1 / resistor.resistance;
    const pin1Net = resistor.pins[0].netId;
    const pin2Net = resistor.pins[1].netId;

    const n1 = pin1Net ? this.nodes.get(pin1Net)?.index : -1;
    const n2 = pin2Net ? this.nodes.get(pin2Net)?.index : -1;

    // Add conductance to the matrix nodes
    if (n1 && n1 > 0) G.set([n1, n1], G.get([n1, n1]) + g);
    if (n2 && n2 > 0) G.set([n2, n2], G.get([n2, n2]) + g);
    if (n1 && n1 > 0 && n2 && n2 > 0) {
      G.set([n1, n2], G.get([n1, n2]) - g);
      G.set([n2, n1], G.get([n2, n1]) - g);
    }
  }

  private applyVoltageSource(battery: Battery, MNA: math.Matrix, RHS: math.Matrix, nodeCount: number, vIndex: number) {
    const matrixRow = nodeCount + vIndex;
    const posNet = battery.pins[0].netId; 
    const negNet = battery.pins[1].netId; 

    const nPos = posNet ? this.nodes.get(posNet)?.index : -1;
    const nNeg = negNet ? this.nodes.get(negNet)?.index : -1;

    // Set B and C matrix components (connecting voltage source to nodes)
    if (nPos && nPos > 0) {
      MNA.set([nPos, matrixRow], 1);
      MNA.set([matrixRow, nPos], 1);
    }
    if (nNeg && nNeg > 0) {
      MNA.set([nNeg, matrixRow], -1);
      MNA.set([matrixRow, nNeg], -1);
    }

    // Set the known voltage on the Right Hand Side (RHS) matrix
    RHS.set([matrixRow, 0], battery.voltage);
  }
}