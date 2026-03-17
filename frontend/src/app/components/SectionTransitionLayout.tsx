import { Outlet, useLocation } from 'react-router';
import { motion } from 'motion/react';

export function SectionTransitionLayout() {
  const location = useLocation();

  return (
    <motion.div
      key={location.pathname}
      initial={{ opacity: 0, x: 32 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.52, ease: [0.22, 1, 0.36, 1] }}
    >
      <Outlet />
    </motion.div>
  );
}
