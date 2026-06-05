import { useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Sphere, Stars } from '@react-three/drei';

function FloatingObject({ position, color, speed = 1, size = 1, distort = 0.4 }) {
  const mesh = useRef();
  
  useFrame((state) => {
    const t = state.clock.getElapsedTime() * speed;
    mesh.current.position.y += Math.sin(t) * 0.002;
    mesh.current.rotation.x = Math.cos(t / 2) / 4;
    mesh.current.rotation.y = Math.sin(t / 2) / 4;
  });

  return (
    <Float speed={2 * speed} rotationIntensity={1} floatIntensity={2}>
      <Sphere ref={mesh} position={position} args={[size, 32, 32]}>
        <MeshDistortMaterial
          color={color}
          speed={speed}
          distort={distort}
          radius={size}
          emissive={color}
          emissiveIntensity={0.2}
          roughness={0.2}
          metalness={0.8}
        />
      </Sphere>
    </Float>
  );
}

function Scene() {
  const { viewport } = useThree();
  
  return (
    <>
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      
      {/* Cinematic Ambient Lights */}
      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#ffffff" />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#4361ee" />
      
      {/* Floating Abstract "Instruments" / Orbs */}
      <FloatingObject position={[-viewport.width / 3, viewport.height / 4, -2]} color="#ffffff" size={1.2} speed={0.5} distort={0.3} />
      <FloatingObject position={[viewport.width / 4, -viewport.height / 3, -3]} color="#d1d5db" size={2} speed={0.3} distort={0.5} />
      <FloatingObject position={[viewport.width / 2.5, viewport.height / 3, -5]} color="#9ca3af" size={1.5} speed={0.7} distort={0.2} />
      
      {/* Add interactive Parallax linked to mouse */}
      <ParallaxLayer />
    </>
  );
}

function ParallaxLayer() {
    const { camera, mouse } = useThree();
    useFrame(() => {
        camera.position.x += (mouse.x * 2 - camera.position.x) * 0.05;
        camera.position.y += (mouse.y * 2 - camera.position.y) * 0.05;
        camera.lookAt(0, 0, 0);
    });
    return null;
}

export default function Ambient3D() {
  return (
    <div className="fixed inset-0 z-[-1] pointer-events-none bg-[#1A1410]" aria-hidden="true">
      <Canvas camera={{ position: [0, 0, 10], fov: 50 }}>
        <Scene />
      </Canvas>
      
      {/* Overlay Scanline from Phase 1 for extra texture */}
      <div className="absolute inset-0 scanline opacity-5" />
    </div>
  );
}
