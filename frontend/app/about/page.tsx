import React from "react";
import AnimatedSubheading from "./AnimatedSubheading";

export default function AboutPage() {
  return (
    <div className="w-full flex flex-col items-center py-20 px-6 md:px-16 lg:px-32 gap-20">

      {/* Blockchain Mission Section */}
      <section className="w-full max-w-5xl flex flex-col gap-6">
        {/* Large Title */}
        <h1 className="text-5xl md:text-8xl font-bold text-[#FFC300] text-center">
          {"Blockchain's Mission"}
        </h1>

        {/* Subheading with Animated Word */}
        <h2 className="text-xl md:text-2xl text-[#CBD5E1] font-medium text-center">
          Blockchain at UCI is an Ecosystem for {" "}
          <span className="inline-block"><AnimatedSubheading /></span>{" "}
        </h2>

        {/* Paragraph in its own container */}
        <div className="p-6 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
          <p className="text-base text-[#94A3B8] leading-relaxed">
            We host workshops, seminars, hackathons, and collaborative events with industry partners
            to help students explore practical blockchain technologies, build technical skills, and
            gain exposure to real opportunities in the rapidly growing Web3 space. Our mission is to
            empower and inspire the next generation of blockchain innovators and leaders.
          </p>
        </div>
      </section>

      {/* Divider */}
      <div className="w-full bg-gradient-to-r from-[#0A0F1F]/60 via-[#3B82F6]/30 to-[#FACC15]/40 h-[2px] rounded-full" />

      {/* Agonus Section (shared container) */}
      <section className="w-full max-w-5xl flex flex-col gap-6">
        <div className="p-8 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm flex flex-col gap-4">
          <h2 className="text-3xl md:text-5xl font-semibold text-[#F5F7FA] text-center">
            Agonus
          </h2>
          <p className="text-base text-[#94A3B8] leading-relaxed">
            Agonus is an AI trading tournament platform built by members of Blockchain at UCI, where
            AI agents compete in real-time crypto trading battles. Users can watch the action live,
            learn from agent strategies, and participate by placing bets through blockchain-powered
            smart contracts. The platform combines AI, decentralized finance, and entertainment to
            create a transparent and engaging way to explore the future of autonomous trading.
          </p>
        </div>
      </section>
    </div>
  );
}
