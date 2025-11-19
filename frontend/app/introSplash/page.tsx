"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import IntroOverlay from "../components/IntroOverlay";

export default function IntroPage() {
  const router = useRouter();
  const [fadeOut, setFadeOut] = useState(false);
  const finishedRef = useRef(false);

  const finish = useCallback((delay = 600) => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    try {
      document.cookie =
        "intro_seen=1; path=/; max-age=31536000; samesite=lax";
    } catch {}
    setFadeOut(true);
    setTimeout(() => router.push("/"), delay);
  }, [router]);

  // Auto-finish after the animation duration
  useEffect(() => {
    const t = setTimeout(() => finish(600), 6000);
    return () => clearTimeout(t);
  }, [finish]);

  return (
    <AnimatePresence>
      <motion.div
        key="intro"
        initial={{ opacity: 1 }}
        animate={{ opacity: fadeOut ? 0 : 1 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
        className="relative flex flex-col items-center justify-center min-h-screen bg-[#0A2540] text-white"
        onWheel={() => finish(200)}
        onTouchMove={() => finish(200)}
        onKeyDown={(e) => {
          if ([" ", "ArrowDown", "PageDown"].includes(e.key)) finish(200);
        }}
        tabIndex={0}
      >
        <IntroOverlay />
      </motion.div>
    </AnimatePresence>
  );
}
