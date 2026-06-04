import { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, PerspectiveCamera } from '@react-three/drei';
import { getHistory, deleteJob } from '../api/audio';
import GlassRecordSleeve from '../components/GlassRecordSleeve';
import PageWrapper from '../components/PageWrapper';
import toast from 'react-hot-toast';

const SG = { fontFamily: "'Space Grotesk', 'Hanken Grotesk', sans-serif" };

function CassetteTape() {
  const mesh = useRef();
  useFrame((state) => {
    mesh.current.rotation.y += 0.005;
    mesh.current.rotation.z = Math.sin(state.clock.getElapsedTime() * 0.5) * 0.1;
  });
  return (
    <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
      <group ref={mesh}>
        {/* Main Body */}
        <mesh>
            <boxGeometry args={[4, 2.5, 0.4]} />
            <meshStandardMaterial color="#1a1a1a" metalness={0.8} roughness={0.3} />
        </mesh>
        {/* Center label */}
        <mesh position={[0, 0, 0.21]}>
            <planeGeometry args={[3.2, 1.8]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.1} />
        </mesh>
        {/* Window */}
        <mesh position={[0, -0.4, 0.22]}>
            <planeGeometry args={[2, 0.6]} />
            <meshStandardMaterial color="#000000" transparent opacity={0.6} />
        </mesh>
      </group>
    </Float>
  );
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

export default function History() {
  const [jobs, setJobs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const fetchHistory = useCallback(() => {
    setLoading(true);
    getHistory(page, 12)
      .then(({ data }) => {
        setJobs(data.data.jobs);
        setPagination(data.data.pagination);
      })
      .catch(() => toast.error('Failed to load telemetry archives'))
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return (
    <PageWrapper className="space-y-12 pb-20 relative">
        {/* Cinematic Header */}
        <header className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-white/5 pb-8 relative">
            {/* Corner 3D Element */}
            <div className="absolute -top-20 -right-20 w-64 h-64 opacity-20 pointer-events-none">
                <Canvas>
                    <PerspectiveCamera makeDefault position={[0, 0, 8]} />
                    <ambientLight intensity={0.5} />
                    <pointLight position={[10, 10, 10]} />
                    <CassetteTape />
                </Canvas>
            </div>

            <div>
                <h1 className="text-5xl font-headline font-extrabold text-white tracking-tighter mb-2" style={SG}>Signal Archives</h1>
                <p className="font-mono text-xs text-white/30 uppercase tracking-[0.2em]">{pagination.total} Waveforms registered in database</p>
            </div>
            <Link to="/upload" className="btn-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">add</span> New Extraction
            </Link>
        </header>

        {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="h-64 rounded-xl bg-white/[0.02] border border-white/5 animate-pulse" />
                ))}
            </div>
        ) : (
            <>
                <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12"
                >
                    {jobs.map(job => (
                        <GlassRecordSleeve key={job.id} job={job} />
                    ))}
                </motion.div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                    <div className="flex justify-center items-center gap-6 pt-12 border-t border-white/5">
                        <button 
                            disabled={page === 1}
                            onClick={() => setPage(p => p - 1)}
                            className="px-6 py-2 rounded-lg border border-white/10 text-white/40 hover:text-white hover:border-white/30 transition-all disabled:opacity-20"
                        >
                            Previous
                        </button>
                        <span className="font-mono text-xs text-white/20 uppercase tracking-widest">Archive Sector {page} of {pagination.pages}</span>
                        <button 
                            disabled={page === pagination.pages}
                            onClick={() => setPage(p => p + 1)}
                            className="px-6 py-2 rounded-lg border border-white/10 text-white/40 hover:text-white hover:border-white/30 transition-all disabled:opacity-20"
                        >
                            Next
                        </button>
                    </div>
                )}
            </>
        )}
    </PageWrapper>
  );
}
