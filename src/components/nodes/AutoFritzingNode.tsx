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

          // Look for any element with 'connector' or 'pin' in its ID
          const pinElements = svgElement.querySelectorAll('[id*="connector"], [id*="pin"]');
          const foundPins: { id: string; x: number; y: number }[] = [];

          pinElements.forEach((el) => {
            const rect = el.getBoundingClientRect();
            const containerRect = containerRef.current!.getBoundingClientRect();
            
            if (containerRect.width > 0) {
              foundPins.push({
                id: el.id || `pin_${Math.random()}`,
                x: ((rect.left - containerRect.left + rect.width / 2) / containerRect.width) * 100,
                y: ((rect.top - containerRect.top + rect.height / 2) / containerRect.height) * 100,
              });
            }
          });

          console.log(`Found ${foundPins.length} pins for ${data.svgPath}`, foundPins);
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
      
      {/* Render detected Fritzing pins */}
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
          <React.Fragment key={`${pin.id}-${index}`}>
            <Handle type="target" position={Position.Left} id={`${pin.id}-t`} style={handleStyle} />
            <Handle type="source" position={Position.Left} id={`${pin.id}-s`} style={handleStyle} />
          </React.Fragment>
        );
      })}

      {/* FALLBACK: If the SVG has no readable IDs, put handles on the left and right edges so you can still wire it */}
      {pins.length === 0 && (
        <>
          <Handle type="target" position={Position.Left} id="fallback-left-t" style={{ left: 0, top: '50%', background: 'lime', width: '10px', height: '10px' }} />
          <Handle type="source" position={Position.Left} id="fallback-left-s" style={{ left: 0, top: '50%', background: 'lime', width: '10px', height: '10px' }} />
          <Handle type="target" position={Position.Right} id="fallback-right-t" style={{ right: 0, top: '50%', background: 'lime', width: '10px', height: '10px' }} />
          <Handle type="source" position={Position.Right} id="fallback-right-s" style={{ right: 0, top: '50%', background: 'lime', width: '10px', height: '10px' }} />
        </>
      )}
    </div>
  );
};