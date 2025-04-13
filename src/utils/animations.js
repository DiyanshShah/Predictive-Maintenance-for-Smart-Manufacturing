// Animation variants for Framer Motion

export const fadeIn = {
  hidden: { opacity: 1 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.6 }
  }
};

export const slideUp = {
  hidden: { y: 50, opacity: 1 },
  visible: { 
    y: 0, 
    opacity: 1,
    transition: { 
      type: "spring", 
      stiffness: 400, 
      damping: 30,
      duration: 0.5 
    }
  }
};

export const slideDown = {
  hidden: { y: -50, opacity: 1 },
  visible: { 
    y: 0, 
    opacity: 1,
    transition: { 
      type: "spring", 
      stiffness: 400, 
      damping: 30,
      duration: 0.5 
    }
  }
};

export const slideLeft = {
  hidden: { x: 50, opacity: 1 },
  visible: { 
    x: 0, 
    opacity: 1,
    transition: { 
      type: "spring", 
      stiffness: 400, 
      damping: 30,
      duration: 0.5 
    }
  }
};

export const slideRight = {
  hidden: { x: -50, opacity: 1 },
  visible: { 
    x: 0, 
    opacity: 1,
    transition: { 
      type: "spring", 
      stiffness: 400, 
      damping: 30,
      duration: 0.5 
    }
  }
};

export const staggerContainer = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

export const popUp = {
  hidden: { scale: 0.8, opacity: 1 },
  visible: { 
    scale: 1, 
    opacity: 1,
    transition: { 
      type: "spring", 
      stiffness: 400, 
      damping: 30,
      duration: 0.5 
    }
  }
};

export const fadeInUp = {
  hidden: { y: 20, opacity: 1 },
  visible: { 
    y: 0, 
    opacity: 1,
    transition: { duration: 0.5 }
  }
};

// Scroll reveal animations
export const scrollReveal = {
  hidden: { opacity: 1, y: 75 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    }
  }
}; 