"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import Footer from "./Footer";

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Check if we're on an admin route
  const isAdminRoute = pathname?.startsWith("/admin");

  if (isAdminRoute) {
    // Admin routes: no navbar/footer
    return <>{children}</>;
  }

  // Regular routes: show navbar + footer
  return (
    <>
      <Navbar />
      <main className="min-h-screen">{children}</main>
      <Footer />
    </>
  );
}
