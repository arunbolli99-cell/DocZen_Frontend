import { motion } from "framer-motion";

const PageTransition = ({ children }) => {
  const variants = {
    initial: { 
      opacity: 0, 
      filter: "blur(3px)"
    },
    animate: { 
      opacity: 1, 
      filter: "blur(0px)",
      transition: {
        duration: 0.25,
        ease: [0.25, 0.1, 0.25, 1],
      }
    },
    exit: { 
      opacity: 0, 
      filter: "blur(2px)",
      transition: {
        duration: 0.15
      }
    }
  };

  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="w-full h-full"
      style={{ overflowX: "hidden" }}
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;
