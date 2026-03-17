import { Outlet, useLocation } from 'react-router';
import { motion } from 'motion/react';

export function SectionTransitionLayout() {
  const location = useLocation();

  return (
    <motion.div
      key={location.pathname}
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
    >
      <Outlet />
    </motion.div>
  );
}
