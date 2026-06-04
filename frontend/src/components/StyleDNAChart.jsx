import { useRef, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { Float, Line, Sphere, Text } from '@react-three/drei';
import * as THREE from 'three';

const DATA = [
  { artist: 'The Weeknd', value: 0.8 },
  { artist: 'Daft Punk', value: 0.6 },
  { artist: 'Travis Scott', value: 0.7 },
  { artist: 'Kanye West', value: 0.5 },
  { artist: 'Drake', value: 0.4 },
];

function Radar3D({ data }) {
    const group = useRef();
    const count = data.length;
    const radius = 4;

    const points = useMemo(() => {
        return data.map((d, i) => {
            const angle = (i / count) * Math.PI * 2;
            const r = d.value * radius;
            return new THREE.Vector3(Math.cos(angle) * r, Math.sin(angle) * r, 0);
        });
    }, [data, count, radius]);

    // Close the loop
    const closedPoints = [...points, points[0]];

    return (
        <group ref={group}>
            {/* Background Grid */}
            {[0.25, 0.5, 0.75, 1].map((r, i) => (
                <Line
                    key={i}
                    points={Array.from({ length: 33 }).map((_, j) => {
                        const angle = (j / 32) * Math.PI * 2;
                        return [Math.cos(angle) * r * radius, Math.sin(angle) * r * radius, 0];
                    })}
                    color="rgba(255,255,255,0.05)"
                    lineWidth={0.5}
                />
            ))}

            {/* Axis Lines */}
            {data.map((_, i) => {
                const angle = (i / count) * Math.PI * 2;
                return (
                    <Line
                        key={i}
                        points={[[0, 0, 0], [Math.cos(angle) * radius, Math.sin(angle) * radius, 0]]}
                        color="rgba(255,255,255,0.1)"
                        lineWidth={0.5}
                    />
                );
            })}

            {/* Radar Shape */}
            <Line
                points={closedPoints}
                color="var(--color-primary)"
                lineWidth={2}
            />
            
            {/* Glowing Nodes */}
            {points.map((p, i) => (
                <Float key={i} speed={2} rotationIntensity={0} floatIntensity={0.5}>
                    <Sphere position={p} args={[0.15, 16, 16]}>
                        <meshStandardMaterial color="var(--color-primary)" emissive="var(--color-primary)" emissiveIntensity={0.5} />
                    </Sphere>
                    <Text
                        position={[p.x * 1.3, p.y * 1.3, 0]}
                        fontSize={0.25}
                        color="white"
                        font="/fonts/SpaceGrotesk-Bold.ttf"
                    >
                        {data[i].artist}
                    </Text>
                </Float>
            ))}

            {/* Connect nodes with glowing lines to center */}
            {points.map((p, i) => (
                <Line
                    key={`l-${i}`}
                    points={[[0, 0, 0], p]}
                    color="var(--color-primary)"
                    lineWidth={1}
                    transparent
                    opacity={0.2}
                />
            ))}
        </group>
    );
}

export default function StyleDNAChart() {
  return (
    <section className="glass-panel rounded-xl border border-glass-border p-6 h-[400px] flex flex-col relative overflow-hidden">
      <div className="flex justify-between items-center mb-6 relative z-10">
        <h3 className="font-headline font-bold text-xs text-primary uppercase tracking-widest">Style DNA Matrix</h3>
        <span className="font-mono text-[8px] text-white/30 uppercase tracking-[0.2em]">3D Projection</span>
      </div>
      
      <div className="flex-1 w-full relative z-0">
          <Canvas camera={{ position: [0, 0, 10], fov: 45 }}>
              <ambientLight intensity={0.5} />
              <pointLight position={[10, 10, 10]} />
              <Radar3D data={DATA} />
          </Canvas>
      </div>

      <div className="pt-4 border-t border-white/5 relative z-10">
          <p className="font-mono text-[9px] text-white/30 uppercase leading-relaxed">
              Resonance overlap identified in 5 distinct stylistic vectors.
          </p>
      </div>
    </section>
  );
}
