import { Canvas } from '@react-three/fiber';
import { Float, Environment, PresentationControls, ContactShadows } from '@react-three/drei';
import { Suspense } from 'react';

// A simple procedural 3D Vinyl Record
function Vinyl(props) {
  return (
    <Float speed={2} rotationIntensity={1.5} floatIntensity={2} {...props}>
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[2, 2, 0.05, 64]} />
        <meshStandardMaterial color="#0a0a0a" roughness={0.4} metalness={0.8} />
      </mesh>
      {/* Center Label */}
      <mesh position={[0, 0.03, 0]}>
        <cylinderGeometry args={[0.6, 0.6, 0.06, 32]} />
        <meshStandardMaterial color="#ffffff" roughness={0.9} />
      </mesh>
    </Float>
  );
}

// A sleek 3D Audio Wave/EQ bar
function EqBar({ position, height, speed, color }) {
  return (
    <Float speed={speed} rotationIntensity={0.5} floatIntensity={1} position={position}>
      <mesh castShadow>
        <boxGeometry args={[0.3, height, 0.3]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.2} roughness={0.1} metalness={0.8} />
      </mesh>
    </Float>
  );
}

export default function ThreeDStudio() {
  return (
    <div className="fixed inset-0 z-[-1] pointer-events-none bg-[#050505]">
      {/* Soft Vignette Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_#050505_80%)] z-10" />
      
      <Canvas camera={{ position: [0, 0, 10], fov: 45 }}>
        <Suspense fallback={null}>
          <Environment preset="city" />
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          
          <PresentationControls
            global
            config={{ mass: 2, tension: 500 }}
            snap={{ mass: 4, tension: 1500 }}
            rotation={[0, 0, 0]}
            polar={[-Math.PI / 4, Math.PI / 4]}
            azimuth={[-Math.PI / 4, Math.PI / 4]}
          >
            {/* Float 3D Objects in the background */}
            <Vinyl position={[-5, 2, -5]} rotation={[1, 0.5, 0]} />
            <Vinyl position={[6, -3, -8]} rotation={[0.5, -0.5, 0]} scale={1.5} />
            
            <EqBar position={[4, 2, -4]} height={2} speed={3} color="#ffffff" />
            <EqBar position={[4.5, 3, -4]} height={4} speed={4} color="#a0a0a0" />
            <EqBar position={[5, 1.5, -4]} height={1.5} speed={2} color="#ffffff" />
          </PresentationControls>

          <ContactShadows position={[0, -4, 0]} opacity={0.4} scale={20} blur={2} far={4} />
        </Suspense>
      </Canvas>
    </div>
  );
}
