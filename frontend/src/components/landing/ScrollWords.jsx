import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { cn } from '../../lib/utils';

/**
 * A statement that lights up one word at a time as it scrolls through the
 * viewport. Wrap a word in asterisks (*tempo*) to set it in the brand colour.
 */
function Word({ progress, range, accent, children }) {
  const opacity = useTransform(progress, range, [0.14, 1]);
  const y = useTransform(progress, range, [8, 0]);
  return (
    <span className="mr-[0.28em] inline-block">
      <motion.span style={{ opacity, y }} className={cn('inline-block', accent && 'text-brand')}>
        {children}
      </motion.span>
    </span>
  );
}

export default function ScrollWords({ text, className }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.9', 'end 0.45'] });
  const words = text.split(' ');
  return (
    <p ref={ref} className={cn('flex flex-wrap', className)}>
      {words.map((raw, i) => {
        const accent = raw.startsWith('*') && raw.replace(/[.,]/g, '').endsWith('*');
        const word = accent ? raw.replace(/\*/g, '') : raw;
        const start = i / words.length;
        const end = start + 1 / words.length;
        return (
          <Word key={i} progress={scrollYProgress} range={[start, end]} accent={accent}>
            {word}
          </Word>
        );
      })}
    </p>
  );
}
