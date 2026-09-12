import React, { useEffect, useRef, useState } from 'react';
import { Handle, Position } from 'reactflow';

export const AutoFritzingNode = ({ data, id }: any) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pins, setPins] = useState<{ id: string; x: number; y: number }[]>([]);

  useEffect(() => {
    fetch(data.svgPath)
      .then((res) => res.text())
      .then((svgText) => {
        if (!containerRef.current) return;
        
        containerRef.current.innerHTML = svgText;
        const svgElement = containerRef.current.querySelector('svg');
        
        if (svgElement) {
          svgElement.style.width = '100%';
          svgElement.style.height = 'auto';

          const pinElements = svgElement.querySelectorAll('[id*="connector"], [id*="pin"]');
          const foundPins: { id: string; x: number; y: number }[] = [];
          
          // NEW: Keep track of pins we have already drawn to prevent duplicates
          const seenConnectors = new Set<string>();

          pinElements.forEach((el) => {
            // Extract the base name (e.g., grab "connector1" from "connector1terminal")
            const match = el.id.match(/(connector\d+)/i);
            const baseId = match ? match[1] : el.id;

            // If we haven't seen this connector yet, add it
            if (!seenConnectors.has(baseId)) {
              seenConnectors.add(baseId);

              const rect = el.getBoundingClientRect();
              const containerRect = containerRef.current!.getBoundingClientRect();
              
              if (containerRect.width > 0) {
                foundPins.push({
                  id: baseId,
                  x: ((rect.left - containerRect.left + rect.width / 2) / containerRect.width) * 100,
                  y: ((rect.top - containerRect.top + rect.height / 2) / containerRect.height) * 100,
                });
              }
            }
          });

          setPins(foundPins);
        }
      });
  }, [data.svgPath]);

  return (
    <div style={{ 
      position: 'relative', 
      width: data.width || '150px',
      minHeight: '40px',
      padding: '5px',
    }}>
      <div ref={containerRef} style={{ pointerEvents: 'none', display: 'flex', justifyContent: 'center' }} />
      
      {/* Render detected Fritzing pins - JUST ONE HANDLE PER PIN NOW */}
      {pins.map((pin, index) => {
        const handleStyle = {
          position: 'absolute' as const,
          left: `${pin.x}%`,
          top: `${pin.y}%`,
          transform: 'translate(-50%, -50%)',
          background: 'lime',
          border: '2px solid black',
          width: '10px',
          height: '10px',
          zIndex: 10,
        };

        return (
          <Handle 
            key={`${pin.id}-${index}`} 
            type="source" 
            position={Position.Left} 
            id={pin.id} 
            style={handleStyle} 
          />
        );
      })}

      {/* FALLBACK: Cleaned up to single handles as well */}
      {pins.length === 0 && (
        <>
          <Handle type="source" position={Position.Left} id="fallback-left" style={{ left: 0, top: '50%', background: 'lime', width: '10px', height: '10px', border: '2px solid black' }} />
          <Handle type="source" position={Position.Right} id="fallback-right" style={{ right: 0, top: '50%', background: 'lime', width: '10px', height: '10px', border: '2px solid black' }} />
        </>
      )}
    </div>
  );
};