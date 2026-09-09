export interface NetlistComponent {
  id: string;
  type: string;
  pins: { [pinName: string]: string }; // Maps pin ID to net name
}

export const translateFlowToNetlist = (nodes: any[], edges: any[]) => {
  // 1. Create a union-find or mapping structure to group connected pins into "nets"
  const pinToNet: { [key: string]: string } = {};
  let netCounter = 1;

  // Helper to get or create a net for a specific handle
  const getNetForPin = (nodeId: string, handleId: string) => {
    const key = `${nodeId}:${handleId}`;
    if (!pinToNet[key]) {
      // Look for an existing connected net via edges
      const connectedEdge = edges.find(
        (e) =>
          (e.source === nodeId && e.sourceHandle === handleId) ||
          (e.target === nodeId && e.targetHandle === handleId)
      );

      if (connectedEdge) {
        const otherNode = connectedEdge.source === nodeId ? connectedEdge.target : connectedEdge.source;
        const otherHandle = connectedEdge.source === nodeId ? connectedEdge.sourceHandle : connectedEdge.targetHandle;
        const otherKey = `${otherNode}:${otherHandle}`;

        if (pinToNet[otherKey]) {
          pinToNet[key] = pinToNet[otherKey];
        } else {
          const newNet = `net_${netCounter++}`;
          pinToNet[key] = newNet;
          pinToNet[otherKey] = newNet;
        }
      } else {
        pinToNet[key] = `net_${netCounter++}`;
      }
    }
    return pinToNet[key];
  };

  // 2. Build component netlist definitions from React Flow nodes
  const netlistComponents: NetlistComponent[] = nodes.map((node) => {
    const pinMappings: { [key: string]: string } = {};

    // Standard pins based on component type
    if (node.data.svgPath?.includes('resistor')) {
      pinMappings['p1'] = getNetForPin(node.id, 'p1');
      pinMappings['p2'] = getNetForPin(node.id, 'p2');
    } else if (node.data.svgPath?.includes('Battery')) {
      pinMappings['+'] = getNetForPin(node.id, '+');
      pinMappings['-'] = getNetForPin(node.id, '-');
    }

    return {
      id: node.id,
      type: node.data.svgPath?.includes('resistor') ? 'Resistor' : 'Battery',
      pins: pinMappings,
    };
  });

  return netlistComponents;
};