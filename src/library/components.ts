export interface ComponentDefinition {
  type: string;
  label: string;
  svgPath: string;
  width: string;
  defaultParams: Record<string, number>;
  engineType: string;
  pins: Record<string, string>; // UI pin name to Engine pin name
}

// The Single Source of Truth for the entire application
export const COMPONENT_LIBRARY: Record<string, ComponentDefinition> = {
  'Resistor': {
    type: 'Resistor',
    label: 'Resistor (1kΩ)',
    svgPath: '/icons/breadboard/resistor_220.svg', // Replace with your exact resistor SVG name if different
    width: '150px',
    defaultParams: { resistance: 1000 },
    engineType: 'resistor',
    pins: { 'p1': '1', 'p2': '2', '1': '1', '2': '2' }
  },
  'Battery': {
    type: 'Battery',
    label: 'Battery (9V)',
    svgPath: '/icons/breadboard/Battery_block_9V85_leg.svg', // Replace with your exact battery SVG name
    width: '150px',
    defaultParams: { voltage: 9 },
    engineType: 'battery',
    pins: { 'pos': '+', 'neg': '-', '+': '+', '-': '-' }
  },
  'Arduino': {
    type: 'Arduino',
    label: 'Arduino Uno',
    svgPath: '/icons/breadboard/arduino_Uno_Rev3_breadboard.svg',
    width: '300px',
    defaultParams: { voltage: 5 },
    engineType: 'battery', // Tricking the engine into seeing a power supply
    pins: { '5V': '+', 'GND': '-', 'D13': 'D13' }
  },
  'LED': {
    type: 'LED',
    label: 'LED (Red)',
    svgPath: '/icons/breadboard/LED-3mm-red-leg.svg', // Replace with your exact LED SVG name
    width: '40px',
    defaultParams: { resistance: 10 },
    engineType: 'resistor',
    pins: { 'anode': '1', 'cathode': '2', '1': '1', '2': '2' }
  }
};