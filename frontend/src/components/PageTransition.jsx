import { motion } from 'framer-motion';
import { useReducedMotion } from '../hooks/useReducedMotion';

export default function PageTransition({ children }) {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) return children;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.22, ease: [0.2, 0.7, 0.2, 1] }}
      className="min-h-full"
    >
      {children}
    </motion.div>
  );
}
