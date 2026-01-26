"use client";

import { usePathname } from "next/navigation";
import LandingNavbar from "./nav/LandingNavbar";
import DashboardNavbar from "./nav/DashboardNavbar";
import Footer from "./Footer";

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Check if we're on an admin route
  const isAdminRoute = pathname?.startsWith("/admin");

  // Check if we're on the dashboard/home route
  const isDashboardRoute = pathname === "/home";

  if (isAdminRoute) {
    // Admin routes: no navbar/footer (admin has its own sidebar)
    return <>{children}</>;
  }

  if (isDashboardRoute) {
    // Dashboard route: use DashboardNavbar with section scroll
    return (
      <>
        <DashboardNavbar />
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
