'use client';

import { useRef, useEffect } from 'react';
import { motion, useScroll, useTransform, useSpring, useMotionValue } from 'framer-motion';

export default function GenieReveal({ children }: { children: React.ReactNode }) {
  // Plain wrapper — no transforms, so useScroll tracks true layout position
  const ref = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'start 0.25'],
  });

  // Scroll-linked targets
  const yTarget      = useTransform(scrollYProgress, [0, 1], [64,   0]);
  const scaleXTarget = useTransform(scrollYProgress, [0, 1], [0.91, 1]);
  const scaleYTarget = useTransform(scrollYProgress, [0, 1], [0.86, 1]);

  // Springs add drag — they chase the scroll value, fully reversible.
  // All overdamped (ζ > 1): no bounce, just controlled deceleration.
  const ySpring      = useSpring(yTarget,      { stiffness: 140, damping: 30 });
  const scaleXSpring = useSpring(scaleXTarget, { stiffness: 110, damping: 27 });
  const scaleYSpring = useSpring(scaleYTarget, { stiffness:  80, damping: 24 });

  // Stable MotionValues — desktop: track the spring; mobile: locked at resting state
  const y      = useMotionValue(0);
  const scaleX = useMotionValue(1);
  const scaleY = useMotionValue(1);

  useEffect(() => {
    if (window.matchMedia('(min-width: 768px)').matches) {
      y.set(ySpring.get());
      scaleX.set(scaleXSpring.get());
      scaleY.set(scaleYSpring.get());
      const unsubs = [
        ySpring.on('change',      v => y.set(v)),
        scaleXSpring.on('change', v => scaleX.set(v)),
        scaleYSpring.on('change', v => scaleY.set(v)),
      ];
      return () => unsubs.forEach(u => u());
    }
  }, [ySpring, scaleXSpring, scaleYSpring, y, scaleX, scaleY]);

  return (
    <div ref={ref}>
      <motion.div style={{ transformOrigin: 'bottom center', y, scaleX, scaleY }}>
        {children}
      </motion.div>
    </div>
  );
}
