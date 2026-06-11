import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { Coffee } from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 2500); // Splash screen duration

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-teal-600 flex flex-col items-center justify-center z-50 overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img 
          src="/back.jpg" 
          alt="Background" 
          className="w-full h-full object-cover opacity-30 mix-blend-overlay"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-teal-600/80 to-teal-900/90" />
      </div>

      {/* Background animated circles */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 1.5, 2], opacity: [0, 0.2, 0] }}
        transition={{ duration: 2, ease: "easeOut", repeat: Infinity, repeatDelay: 0.5 }}
        className="absolute w-96 h-96 bg-white rounded-full"
      />
      
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 1.2, 1.8], opacity: [0, 0.15, 0] }}
        transition={{ duration: 2, ease: "easeOut", delay: 0.5, repeat: Infinity, repeatDelay: 0.5 }}
        className="absolute w-96 h-96 bg-white rounded-full"
      />

      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, type: "spring", bounce: 0.5 }}
        className="relative z-10 flex flex-col items-center"
      >
        <motion.div
          animate={{ 
            scale: [1, 1.1, 1],
            y: [0, -10, 0]
          }}
          transition={{ 
            duration: 2, 
            ease: "easeInOut",
            repeat: Infinity,
          }}
          className="bg-white p-8 rounded-[2.5rem] shadow-2xl mb-8 border-4 border-teal-400/20"
        >
          <img src="/Logo.png" alt="WEDRINK Logo" className="w-32 h-32 object-contain" />
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="text-5xl font-extrabold text-white tracking-tight flex items-center gap-4"
        >
          WEDRINK
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="text-teal-100 mt-3 text-lg font-medium tracking-wide"
        >
          Franchise Management System
        </motion.p>
        
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ delay: 1, duration: 1.2, ease: "easeInOut" }}
          className="h-1 bg-white/30 rounded-full mt-8 w-48 overflow-hidden"
        >
          <motion.div 
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="h-full w-1/2 bg-white rounded-full"
          />
        </motion.div>
      </motion.div>
    </div>
  );
}
