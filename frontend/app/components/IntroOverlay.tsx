'use client';
import Agonus3DIntro from './ui/Agonus3D';
import FloatingIcons from './ui/FloatingIcons';

// It’s the cool splash animation that plays
// first — full-screen, animated background, 3D logo, floating icons.

export default function IntroOverlay() {
  return (
    // Full-screen blue gradient background, centered glowing 3D logo,
    // with floating motion effects.
    <div
      className="
        fixed inset-0 z-50
        flex items-center justify-center
        bg-[var(--hero-navy)]
        [animation:introOut_2s_6s_forwards]
        bg-[radial-gradient(ellipse_at_center,var(--hero-navy-2),var(--hero-navy))]
        overflow-hidden
      "
      aria-hidden="true"
    >
      {/* === Animated Floating Crypto Icons === */}
      <FloatingIcons />

      {/* === Center AGONUS intro === */}
      <div className="relative flex items-center justify-center w-full h-full select-none">
        <div
          className="
            pointer-events-none absolute inset-0 blur-3xl opacity-30
            bg-[radial-gradient(ellipse_at_center,rgba(0,210,255,0.25),transparent_60%)]
          "
        />
        <Agonus3DIntro />
      </div>
    </div>
  );
}

