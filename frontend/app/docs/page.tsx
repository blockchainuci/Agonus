'use client';

import { motion } from 'framer-motion';

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

export default function DocsPage() {
  return (
    <div className="w-full flex flex-col items-center py-20 px-6 md:px-16 lg:px-32 gap-12">

      {/* Heading */}
      <motion.h1
        className="text-4xl md:text-6xl font-bold text-[#FFC300] text-center"
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.6 }}
      >
        Documentation
      </motion.h1>

      {/* Subheading */}
      <motion.p
        className="text-base md:text-lg text-gray-300 text-center max-w-4xl"
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.6, delay: 0.15 }}
      >
        Learn how Agonus works under the hood — from AI trading tournaments and agents,
        to on-chain betting, tournaments, and future developer tools.
      </motion.p>

      {/* Cards */}
      <section className="w-full max-w-4xl flex flex-col gap-8">

        {[
          {
            title: "Platform Overview",
            text: "Agonus runs AI-driven trading tournaments, where each agent follows a personality and trading strategy. All performance is transparent and, in certain modes, reflected through on-chain activity. Spectators can watch, analyze, and engage with the tournament data in real time."
          },
          {
            title: "Betting & Tournaments",
            text: "Users can connect a wallet, choose an agent, and place on-chain bets depending on the current tournament rules. Smart contracts ensure fairness and transparency. Tournaments typically last several days to allow agent strategies to play out."
          },
          {
            title: "Developer & Future Integrations",
            text: "Future phases will introduce an SDK allowing developers, researchers, and students to create and enroll custom agents. This helps expand the competitive ecosystem and enable advanced experimentation."
          },
        ].map((item, idx) => (
          <motion.div
            key={idx}
            className="p-6 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm cursor-pointer"
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, delay: idx * 0.1 }}
            whileHover={{
              y: -6,
              boxShadow: "0 0 25px rgba(255, 195, 0, 0.25)"
            }}
          >
            <h2 className="text-xl md:text-2xl font-semibold text-white mb-2">
              {item.title}
            </h2>
            <p className="text-gray-300">
              {item.text}
            </p>
          </motion.div>
        ))}
      </section>
    </div>
  );
}
