import { motion } from 'framer-motion';

const pageVariants = {
  initial: { opacity: 0, y: 15, filter: 'blur(4px)' },
  in: { opacity: 1, y: 0, filter: 'blur(0px)' },
  out: { opacity: 0, y: -15, filter: 'blur(4px)' }
};

export default function PageWrapper({ children, className = "" }) {
  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={`w-full h-full ${className}`}
    >
      {children}
    </motion.div>
  );
}
