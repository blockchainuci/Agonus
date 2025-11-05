'use client';

import { motion } from 'framer-motion';

export default function ButtonStyle() {
  return (
    <div className="space-x-4">
      <motion.button
        type="button"
        className="inline-flex items-center gap-x-1.5 rounded-md bg-gradient-to-r from-[#1E3A8A] to-[#0A2540] px-2.5 py-1.5 text-sm font-semibold text-white hover:from-[#2563eb] hover:to-[#1E3A8A] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1E3A8A]"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        Watch Tournament
      </motion.button>
      <motion.button
        type="button"
        className="inline-flex items-center gap-x-1.5 rounded-md bg-gradient-to-r from-[#0A2540] to-[#415a77] px-2.5 py-1.5 text-sm font-semibold text-white hover:from-[#1E3A8A] hover:to-[#0A2540] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A2540]"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        Connect Wallet
      </motion.button>
    </div>
  );
}
