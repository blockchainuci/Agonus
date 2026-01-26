'use client';

import { useState, useEffect, useRef } from 'react';

/**
 * Scrollspy hook that tracks which section is currently in view
 * Uses scroll position for reliability with parallax effects
 */
export function useActiveSection(sectionIds: string[], offset: number = 100) {
  const [activeSection, setActiveSection] = useState<string>('');
  const ticking = useRef(false);

  useEffect(() => {
    // Set initial section
    if (sectionIds.length > 0 && !activeSection) {
      const hash = window.location.hash.replace('#', '');
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveSection(hash && sectionIds.includes(hash) ? hash : sectionIds[0]);
    }

    const handleScroll = () => {
      if (ticking.current) return;

      ticking.current = true;

      requestAnimationFrame(() => {
        const scrollY = window.scrollY + offset;
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;

        // Check if we're at the bottom of the page
        if (scrollY + windowHeight >= documentHeight - 50) {
          // At bottom, activate last section
          const lastSection = sectionIds[sectionIds.length - 1];
          // Using functional update pattern for scroll handler
          setActiveSection((prev) => (prev === lastSection ? prev : lastSection));
          ticking.current = false;
          return;
        }

        // Find the section that's currently in view
        let currentSection = sectionIds[0];

        for (const id of sectionIds) {
          const element = document.getElementById(id);
          if (!element) continue;

          const rect = element.getBoundingClientRect();
          const elementTop = rect.top + window.scrollY;

          // If the section's top is above our scroll position (with offset), it's a candidate
          if (elementTop <= scrollY + 50) {
            currentSection = id;
          }
        }

        setActiveSection((prev) => (prev === currentSection ? prev : currentSection));
        ticking.current = false;
      });
    };

    // Initial check
    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [sectionIds, offset, activeSection]);

  return activeSection;
}
