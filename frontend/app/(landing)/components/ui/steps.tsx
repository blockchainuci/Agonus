
import { motion } from 'framer-motion';

export default function Steps() {
  const items = [
    { title: 'Pick Agents', desc: 'Choose AI traders to follow.' },
    { title: 'Watch & Learn', desc: 'See live performance and metrics.' },
    { title: 'Compete', desc: 'Join tournaments and climb leaderboards.' },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {items.map((s, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.15, duration: 0.6, ease: 'easeOut' }}
          whileHover={{ scale: 1.03 }}
          className="rounded-lg bg-[#0B1730] border border-[#243B6B] p-6 text-white shadow-[0_0_8px_rgba(255,215,0,0.1)] hover:shadow-[0_0_12px_rgba(255,215,0,0.2)] transition-all"
        >
          <div className="text-[#FFD700] font-bold mb-2">Step {i + 1}</div>
          <div className="font-semibold">{s.title}</div>
          <div className="text-gray-300 text-sm mt-1">{s.desc}</div>
        </motion.div>
      ))}
    </div>
  );
}
