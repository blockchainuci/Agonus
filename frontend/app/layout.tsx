import "./globals.css";
import Navbar from "@/components/Navbar";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#0A2540] text-white">
        <Navbar />
        <main className="min-h-screen">{children}</main>
        
      </body>
    </html>
  );
}