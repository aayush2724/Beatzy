import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Torus, MeshDistortMaterial } from '@react-three/drei';
import { useReducedMotion } from '../../hooks/useReducedMotion';

function VinylOrb() {
  const mesh = useRef();
  useFrame((state) => {
    if (!mesh.current) return;
    const t = state.clock.getElapsedTime();
    mesh.current.rotation.x = t * 0.15;
    mesh.current.rotation.y = t * 0.35;
  });

  return (
    <Float speed={1.2} rotationIntensity={0.4} floatIntensity={0.6}>
      <Torus ref={mesh} args={[1.2, 0.35, 32, 64]}>
        <MeshDistortMaterial
          color="#ffffff"
          emissive="#888888"
          emissiveIntensity={0.15}
          metalness={0.9}
          roughness={0.25}
          distort={0.25}
          speed={1.5}
        />
      </Torus>
    </Float>
  );
}

export default function HeroScene() {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) return null;

  return (
    <div className="absolute inset-0 z-[1] pointer-events-none opacity-30 mix-blend-screen">
      <Canvas camera={{ position: [0, 0, 4.5], fov: 45 }} dpr={[1, 1.5]} gl={{ antialias: true, alpha: true }}>
        <ambientLight intensity={0.4} />
        <pointLight position={[4, 4, 4]} intensity={1.2} color="#ffffff" />
        <pointLight position={[-4, -2, 2]} intensity={0.4} color="#9ca3af" />
        <VinylOrb />
      </Canvas>
    </div>
  );
}
