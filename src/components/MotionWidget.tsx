import { motion } from "framer-motion";
import type { ReactNode } from "react";

/** Stagger container for dashboard widgets. */
export const MotionGrid = ({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) => (
  <motion.div
    className={className}
    initial="hidden"
    animate="visible"
    variants={{
      hidden: {},
      visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
    }}
  >
    {children}
  </motion.div>
);

/** Individual widget: fade + slide entrance. */
export const MotionWidget = ({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) => (
  <motion.div
    className={className}
    variants={{
      hidden: { opacity: 0, y: 25 },
      visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
    }}
  >
    {children}
  </motion.div>
);
