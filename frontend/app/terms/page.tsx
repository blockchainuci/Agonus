'use client';

import { motion } from 'framer-motion';

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

const sections = [
  {
    title: "1. Eligibility",
    text: "You must be of legal age and permitted to use blockchain services in your jurisdiction. By using Agonus, you confirm compliance with local regulations."
  },
  {
    title: "2. Nature of the Platform",
    text: "Agonus is an educational and entertainment platform, not a financial service. Nothing provided constitutes investment or trading advice."
  },
  {
    title: "3. Wallet Responsibility",
    text: "You are responsible for securing your own wallet and private keys. Agonus cannot undo blockchain transactions."
  },
  {
    title: "4. Risks",
    text: "Cryptocurrency volatility, smart contract issues, and network congestion are inherent risks. You use the platform at your own risk."
  },
  {
    title: "5. User Conduct",
    text: "You agree not to exploit, hack, or manipulate tournaments or smart contracts, and to comply with all applicable laws."
  },
  {
    title: "6. Limitation of Liability",
    text: "Agonus is provided 'as is.' We are not liable for damages, losses, or errors resulting from use of the platform or blockchain interactions."
  },
  {
    title: "7. Updates to Terms",
    text: "Agonus may update these Terms as needed. Continued use implies acceptance of updated policies."
  },
];

export default function TermsPage() {
  return (
    <div className="w-full flex flex-col items-center py-20 px-6 md:px-16 lg:px-32 gap-12">

      <motion.h1
        className="text-4xl md:text-6xl font-bold text-[#FFC300] text-center"
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.6 }}
      >
        Terms of Service
      </motion.h1>

      <section className="w-full max-w-4xl flex flex-col gap-8">
        {sections.map((item, idx) => (
          <motion.div
            key={idx}
            className="p-6 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm cursor-pointer leading-relaxed"
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, delay: idx * 0.08 }}
            whileHover={{
              y: -6,
              boxShadow: "0 0 25px rgba(255, 195, 0, 0.25)"
            }}
          >
            <h2 className="text-xl md:text-2xl font-semibold text-white mb-2">
              {item.title}
            </h2>
            <p className="text-gray-300">{item.text}</p>
          </motion.div>
        ))}
      </section>
    </div>
  );
}
