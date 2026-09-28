import { motion, AnimatePresence } from 'framer-motion';
import { EASE } from './data';
import { cn } from '../../lib/utils';

/** Text that slides out and in whenever `id` changes. */
export default function Swap({ id, children, className }) {
  return (
    <span className={cn('relative inline-block', className)}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={id}
          className="inline-block"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.35, ease: EASE }}
        >
          {children}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
