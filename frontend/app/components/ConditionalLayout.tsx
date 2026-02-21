"use client";

import { usePathname } from "next/navigation";
import LandingNavbar from "./nav/LandingNavbar";
import DashboardNavbar from "./nav/DashboardNavbar";
import InfoNavbar from "./nav/InfoNavbar";
import Footer from "./Footer";

const INFO_PAGES: Record<string, string> = {
  "/about": "About",
  "/docs": "Documentation",
  "/faq": "FAQ",
  "/terms": "Terms of Service",
};

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Check if we're on an admin route
  const isAdminRoute = pathname?.startsWith("/admin");

  // Check if we're on the dashboard/home route
  const isDashboardRoute = pathname === "/home";

  // Check if we're on an informational page
  const infoTitle = pathname ? INFO_PAGES[pathname] : undefined;

  if (isAdminRoute) {
    // Admin routes: no navbar/footer (admin has its own sidebar)
    return <>{children}</>;
  }

  if (isDashboardRoute) {
    // Dashboard route: fixed-height viewport — no page scroll
    return (
      <>
        <DashboardNavbar />
        <main className="h-screen overflow-hidden pt-16">{children}</main>
      </>
    );
  }

  if (infoTitle) {
    // Informational pages: simple navbar with page title + wallet connect
    return (
      <>
        <InfoNavbar title={infoTitle} />
        <main className="min-h-screen pt-16">{children}</main>
        <Footer />
      </>
    );
  }

  // Landing page and other routes: use LandingNavbar
  return (
    <>
      <LandingNavbar />
      <main className="min-h-screen">{children}</main>
      <Footer />
    </>
  );
}
