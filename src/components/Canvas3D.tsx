import React, { Suspense, useRef, useState, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Grid, useGLTF, QuadraticBezierLine } from '@react-three/drei';
import * as THREE from 'three';
import { useCircuitStore } from '../store/useCircuitStore';

// --- Configuration Maps ---

// Adjust these values based on the rotation, scale, and origin of your specific GLTF models
const getPinOffset = (type: string, pinId: string): [number, number, number] => {
  if (type === 'Battery') {
    if (pinId === 'pos' || pinId === '+') return [0, 1, -1.02]; 
    if (pinId === 'neg' || pinId === '-') return [0, 1.0, 1.02];
  }
  
  if (type === 'Resistor') {
    if (pinId === 'p1' || pinId === '1') return [-0.32, -0.2, -0.25];
    if (pinId === 'p2'|| pinId === '2') return [0.32, -0.2, -0.25];
  }
  
  if (type === 'Arduino') {
    if (pinId === '5V') return [0.3, 1.05, 1.25];
    if (pinId === 'GND') return [0.61, 1.05, 1.25];
    if (pinId === 'D13') return [-1.0, 0.5, -2.0]; 
  }

  console.warn(`Unmapped pin! Type: ${type}, Pin: ${pinId}`);
  return [0, 0, 0];
};

// A flat mathematical plane at Y=0 to catch mouse rays for 3D dragging
const dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);


// --- Sub-Components ---

const CameraController = () => {
  const isTopView = useCircuitStore((state) => state.isTopView);
  const activeDragId = useCircuitStore((state) => state.activeDragId);
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);

  useEffect(() => {
    if (!controlsRef.current) return;

    if (isTopView) {
      camera.position.set(0, 15, 0.001); // 0.001 prevents Gimbal lock
    } else {
      camera.position.set(0, 5, 10);
    }
    
    // Force OrbitControls to recalculate
    controlsRef.current.target.set(0, 0, 0);
    controlsRef.current.update();
  }, [isTopView, camera]);

  return (
    <OrbitControls 
      ref={controlsRef}
      makeDefault 
      minPolarAngle={isTopView ? 0 : 0}
      maxPolarAngle={isTopView ? 0 : Math.PI / 2}
      enableRotate={!isTopView} 
      enabled={!activeDragId} // Disable camera rotation while dragging an item
    />
  );
};

const ModelRenderer = ({ type }: { type: string }) => {
  const fileMap: Record<string, string> = {
    'Arduino': 'arduino_uno',
    'Battery': 'battery',
    'Resistor': 'resistor'
  };
  
  const fileName = fileMap[type] || type.toLowerCase();
  const { scene } = useGLTF(`/models/${fileName}.glb`);
  
  const scaleMap: Record<string, number> = {
    'Battery': 0.05, 
    'Resistor': 0.25,
    'Arduino': 3.8 
  };
  const scale = scaleMap[type] || 1;
  
  // 1. Add this rotation map to fix models that import standing up
  const rotationMap: Record<string, [number, number, number]> = {
    // -Math.PI / 2 pitches it forward 90 degrees. 
    // (If it rolls sideways instead, move this math to the 3rd number, the Z-axis!)
    'Arduino': [-Math.PI / 2, 0, 0] 
  };
  const modelRotation = rotationMap[type] || [0, 0, 0];
  
  // 2. Apply the rotation to the primitive object
  return (
    <primitive 
      object={scene.clone()} 
      scale={[scale, scale, scale]} 
      rotation={modelRotation} 
    />
  );
};

const PinMesh = ({ pinId, position }: { pinId: string, position: [number, number, number] }) => {
  const activeWiringPin = useCircuitStore((state) => state.activeWiringPin);
  const startWiring = useCircuitStore((state) => state.startWiring);
  const finishWiring = useCircuitStore((state) => state.finishWiring);
  
  const [hovered, setHovered] = useState(false);
  const isWiring = activeWiringPin !== null;
  const isActive = activeWiringPin === pinId;

  return (
    <mesh 
      position={position} 
      onClick={(e) => {
        e.stopPropagation(); 
        if (isWiring) {
          finishWiring(pinId);
        } else {
          startWiring(pinId);
        }
      }}
      onPointerOver={(e) => { 
        e.stopPropagation(); 
        setHovered(true);
        document.body.style.cursor = 'crosshair'; 
      }}
      onPointerOut={() => { 
        setHovered(false);
        document.body.style.cursor = 'default'; 
      }}
    >
      <boxGeometry args={[0.1, 0.1, 0.1]} />
      <meshBasicMaterial 
        color="lime"
        depthWrite={false} 
        opacity={isActive || hovered ? 0.6 : 0}
        transparent={false}
      />
    </mesh>
  );
};

const BasicComponentMesh = ({ component }: { component: any }) => {
  const activeDragId = useCircuitStore((state) => state.activeDragId);
  const setDragId = useCircuitStore((state) => state.setDragId);
  const updateComponentPosition = useCircuitStore((state) => state.updateComponentPosition);
  
  const groupRef = useRef<THREE.Group>(null);

  return (
    <group 
      ref={groupRef}
      position={[component.position.x, component.position.y, component.position.z]}
      onPointerDown={(e) => { 
        e.stopPropagation(); 
        (e.target as any).setPointerCapture(e.pointerId);
        setDragId(component.id); 
        document.body.style.cursor = 'grabbing'; 
      }}
      onPointerMove={(e) => {
        if (activeDragId === component.id && e.ray) {
          e.stopPropagation();
          const intersect = new THREE.Vector3();
          e.ray.intersectPlane(dragPlane, intersect);
          
          if (intersect && groupRef.current) {
            groupRef.current.position.set(intersect.x, component.position.y, intersect.z);
          }
        }
      }}
      onPointerUp={(e) => { 
        e.stopPropagation();
        (e.target as any).releasePointerCapture(e.pointerId);
        setDragId(null); 
        document.body.style.cursor = 'grab'; 
        
        if (groupRef.current) {
          updateComponentPosition(component.id, { 
            x: groupRef.current.position.x, 
            y: component.position.y, 
            z: groupRef.current.position.z 
          });
        }
      }}
      onPointerOver={(e) => { if (!activeDragId) { e.stopPropagation(); document.body.style.cursor = 'grab'; } }}
      onPointerOut={() => { if (!activeDragId) document.body.style.cursor = 'default'; }}
    >
      <Suspense fallback={
        <mesh>
          <boxGeometry args={[1, 0.5, 0.5]} />
          <meshStandardMaterial color="gray" wireframe />
        </mesh>
      }>
        <ModelRenderer type={component.type} />
      </Suspense>
      
      {component.pins.map((pin: any) => (
        <PinMesh 
          key={pin.id} 
          pinId={pin.id} 
          position={getPinOffset(component.type, pin.id)} 
        />
      ))}
    </group>
  );
};

const PhysicalWires = () => {
  const wires = useCircuitStore((state) => state.wires);
  const components = useCircuitStore((state) => state.components);

  const getPinWorldPosition = (pinId: string) => {
    for (const comp of components) {
      const pinIndex = comp.pins.findIndex(p => p.id === pinId);
      if (pinIndex !== -1) {
        const [offsetX, offsetY, offsetZ] = getPinOffset(comp.type, pinId);
        return new THREE.Vector3(
          comp.position.x + offsetX, 
          comp.position.y + offsetY, 
          comp.position.z + offsetZ
        );
      }
    }
    return new THREE.Vector3(0, 0, 0);
  };

  return (
    <>
      {wires.map((wire) => {
        const startPos = getPinWorldPosition(wire.startPinId);
        const endPos = getPinWorldPosition(wire.endPinId);
        
        const midPoint = new THREE.Vector3(
          (startPos.x + endPos.x) / 2,
          Math.max(startPos.y, endPos.y) + 1.5,
          (startPos.z + endPos.z) / 2
        );

        return (
          <QuadraticBezierLine
            key={wire.id}
            start={startPos}
            end={endPos}
            mid={midPoint}
            color="green"
            lineWidth={3} 
            dashed={false}
          />
        );
      })}
    </>
  );
};

// --- Main Canvas Export ---

export const Canvas3D = () => {
  const components = useCircuitStore((state) => state.components);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Canvas>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        
        <Grid infiniteGrid fadeDistance={50} sectionColor="gray" cellColor="lightgray" />
        <CameraController />
        <PhysicalWires />

        {components.map((comp) => (
          <BasicComponentMesh key={comp.id} component={comp} />
        ))}
      </Canvas>
    </div>
  );
};