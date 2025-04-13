import React, { useEffect } from 'react';
import { motion, useAnimation, useInView } from 'framer-motion';

const ScrollAnimationWrapper = ({ 
  children, 
  variants, 
  className = "", 
  viewportAmount = 0.2, 
  delay = 0,
  once = true,
  ...props 
}) => {
  const controls = useAnimation();
  const ref = React.useRef(null);
  const isInView = useInView(ref, { 
    amount: viewportAmount,
    once: once
  });

  useEffect(() => {
    if (isInView) {
      controls.start("visible");
    } else if (!once) {
      controls.start("hidden");
    }
  }, [isInView, controls, once]);

  return (
    <motion.div
      ref={ref}
      animate={controls}
      initial="hidden"
      variants={variants}
      className={className}
      transition={{ delay: delay }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default ScrollAnimationWrapper; 