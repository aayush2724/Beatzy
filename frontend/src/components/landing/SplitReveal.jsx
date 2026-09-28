import { motion } from 'framer-motion';
import { EASE } from './data';

/**
 * A heading whose words rise into place one after another, clearing from a
 * blur as they land. Runs once, when it scrolls into view.
 */
const word = {
  hidden: { opacity: 0, y: 28, filter: 'blur(8px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.7, ease: EASE } },
};

export default function SplitReveal({ text, as: Tag = 'h2', className, delay = 0, once = true }) {
  const words = text.split(' ');
  return (
    <Tag className={className}>
      <motion.span
        className="inline"
        initial="hidden"
        whileInView="show"
        viewport={{ once, amount: 0.6 }}
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07, delayChildren: delay } } }}
      >
        {words.map((w, i) => (
          <motion.span key={i} variants={word} className="inline-block">
            {w}
            {i < words.length - 1 ? ' ' : ''}
          </motion.span>
        ))}
      </motion.span>
    </Tag>
  );
}
