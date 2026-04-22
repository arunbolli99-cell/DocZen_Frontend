import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";

const LoadingScreen = () => {
  const [status, setStatus] = useState("Initializing Experience");

  useEffect(() => {
    // Stage 1: Initial message (done by default)
    
    // Stage 2: After 3 seconds, set the specific message requested by the user
    const timer1 = setTimeout(() => {
      setStatus("It takes a few seconds to load. Please wait...");
    }, 3000);

    // Stage 3: After 10 seconds, explain the cold start (Render specific)
    const timer2 = setTimeout(() => {
      setStatus("Waking up the server... Almost there!");
    }, 10000);

    // Stage 4: After 20 seconds, give more reassurance
    const timer3 = setTimeout(() => {
        setStatus("Still working... Thank you for your patience.");
    }, 20000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      className="loading-screen"
    >
      {/* Background Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-purple-600/20 rounded-full blur-[120px]" />
      <div className="absolute top-1/3 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] bg-blue-600/10 rounded-full blur-[100px]" />

      <div className="relative flex flex-col items-center gap-6">
        {/* Animated Logo / Icon */}
        <div className="loader-container">
          <div className="loader-circle" />
          <div className="loader-circle-inner" />
          <ShieldCheck className="loader-logo" />
        </div>

        {/* Text Animation */}
        <div className="flex flex-col items-center max-w-[280px]">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-2xl font-bold bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent"
          >
            DocZen
          </motion.h1>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent mt-2"
          />
        </div>

        {/* Status Text */}
        <motion.p
          key={status}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-white/60 text-sm font-medium tracking-wide text-center px-4"
        >
          {status}
        </motion.p>
      </div>
    </motion.div>
  );
};

export default LoadingScreen;
