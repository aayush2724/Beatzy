import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Sphere, MeshDistortMaterial } from '@react-three/drei';

function PulsingOrb({ bpm = 120, position, color }) {
  const mesh = useRef();
  const speed = (bpm / 60) * 0.5;
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const scale = 1 + Math.sin(t * speed * Math.PI * 2) * 0.1;
    mesh.current.scale.set(scale, scale, scale);
  });
  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={1}>
      <Sphere ref={mesh} position={position} args={[1, 32, 32]}>
        <MeshDistortMaterial color={color} speed={2} distort={0.3} emissive={color} emissiveIntensity={0.2} />
      </Sphere>
    </Float>
  );
}

export default function ResultsAtmosphereScene({ bpm }) {
  return (
    <Canvas>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <PulsingOrb bpm={bpm} position={[-5, 2, -5]} color="#C41E3A" />
      <PulsingOrb bpm={bpm} position={[5, -2, -8]} color="#A64D3D" />
    </Canvas>
  );
}
