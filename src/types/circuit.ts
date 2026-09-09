// src/types/circuit.ts

export type ComponentType = 'Resistor' | 'LED' | 'Battery' | 'ArduinoUno';

// A pin represents a physical connection point on a component.
// The 'netId' tracks which electrical node this pin belongs to for SPICE calculation.
export interface Pin {
  id: string;          // e.g., 'anode', 'cathode', 'pin-1'
  netId: string | null; // Null if unconnected
}

// The foundational schema every Ekyacad component must follow
export interface BaseComponent {
  id: string;          // Unique UUID for the instance
  type: ComponentType;
  name: string;        // e.g., "R1", "BAT1"
  pins: Pin[];
  
  // Unified spatial data for both 2D (ignoring z) and 3D views
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
}

// --- Specific Component Schemas ---

export interface Resistor extends BaseComponent {
  type: 'Resistor';
  resistance: number; // Ohms
  tolerance: number;  // Percentage (e.g., 5 for 5%)
}

export interface Battery extends BaseComponent {
  type: 'Battery';
  voltage: number;    // Volts
  capacity?: number;  // mAh (optional for advanced simulation later)
}

export interface LED extends BaseComponent {
  type: 'LED';
  color: string;      // Hex or standard color string
  forwardVoltage: number; // Volts (typically 1.8V - 3.3V)
  forwardCurrent: number; // Amps (typically 0.02A)
}

// Union type for the state array
export type CircuitComponent = Resistor | Battery | LED;