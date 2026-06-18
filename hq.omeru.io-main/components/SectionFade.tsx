'use client';

import { useRef, useEffect } from 'react';
import { motion, useScroll, useTransform, useMotionValue } from 'framer-motion';

export default function SectionFade({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  });
  const scrollOpacity = useTransform(scrollYProgress, [0, 0.4, 1], [1, 1, 0]);

  // Always a MotionValue so framer-motion never has to swap between a value and a number
  const opacity = useMotionValue(1);

  useEffect(() => {
    // Fade only on desktop — mobile scroll + opacity causes jank and layout issues
    if (window.matchMedia('(min-width: 768px)').matches) {
      opacity.set(scrollOpacity.get());
      return scrollOpacity.on('change', v => opacity.set(v));
    }
  }, [scrollOpacity, opacity]);

  return (
    <motion.div ref={ref} style={{ opacity }}>
      {children}
    </motion.div>
  );
}
